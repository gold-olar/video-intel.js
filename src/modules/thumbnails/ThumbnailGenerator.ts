/**
 * ThumbnailGenerator - Smart video thumbnail generation
 * 
 * This class orchestrates the process of selecting the best frames from a video
 * to use as thumbnails. It combines frame extraction, quality scoring, and
 * intelligent selection algorithms to automatically choose visually appealing frames.
 * 
 * Key Features:
 * - Automatic extraction of candidate frames from video
 * - Quality scoring using sharpness, brightness, and color variance
 * - Intelligent frame selection with temporal diversity
 * - Automatic filtering of unusable frames (black, white, blurry)
 * - Configurable output format, quality, and dimensions
 * 
 * Process Flow:
 * 1. Validate video and options
 * 2. Calculate sampling strategy (which frames to extract)
 * 3. Extract candidate frames from video
 * 4. Score all frames for quality
 * 5. Filter out unusable frames
 * 6. Select best frames with diversity filter
 * 7. Convert to final thumbnail format (resize, convert to blob)
 * 
 * Usage Example:
 * ```typescript
 * const generator = new ThumbnailGenerator();
 * const video = await videoLoader.load(videoFile);
 * 
 * const thumbnails = await generator.generate(video, {
 *   count: 5,
 *   quality: 0.8,
 *   format: 'jpeg',
 *   size: { width: 640 }
 * });
 * 
 * thumbnails.forEach(thumb => {
 *   console.log(`Thumbnail at ${thumb.timestamp}s with score ${thumb.score}`);
 * });
 * ```
 * 
 * Future Improvements:
 * - TODO: Add face detection integration (boost scores for frames with faces)
 * - TODO: Implement scene-aware selection (one thumbnail per scene)
 * - TODO: Add composition analysis (rule of thirds, subject positioning)
 * - TODO: Support caching of scored frames for repeated generation
 * - TODO: Add motion detection to avoid motion blur
 * - TODO: Implement adaptive strategy based on video type/content
 * 
 * @module modules/thumbnails/ThumbnailGenerator
 */

import { FrameExtractor } from '../../core/FrameExtractor';
import { FrameScorer } from './FrameScorer';
import { MemoryManager } from '../../utils/MemoryManager';
import { VideoIntelError, ErrorCode } from '../../types';
import type { ThumbnailOptions, Thumbnail, ProgressCallback } from '../../types';
import type { FrameScore } from './types';

// ============================================================================
// CONFIGURATION CONSTANTS
// ============================================================================

/**
 * Multiplier for candidate extraction.
 * We extract this many more candidates than requested to ensure good selection.
 * 
 * Example: If user requests 5 thumbnails, we extract 15 candidates (5 × 3)
 * and then select the best 5 from those 15.
 * 
 * IMPROVEMENT: Could make this adaptive based on video length and quality.
 * Shorter videos might need lower multiplier, longer videos could use higher.
 */
const CANDIDATE_MULTIPLIER = 3;

/**
 * Skip this percentage of video at start and end.
 * Avoids fade-in/fade-out transitions and titles/credits.
 * 
 * Value: 0.05 = 5% at start and 5% at end
 * Example: For 100s video, skip first 5s and last 5s
 * 
 * IMPROVEMENT: Could detect fades automatically instead of using fixed margin.
 */
const VIDEO_MARGIN_PERCENT = 0.05;

/**
 * Minimum time between candidate frames (seconds).
 * Prevents extracting very similar adjacent frames.
 * 
 * IMPROVEMENT: Could be adaptive based on scene change detection.
 */
const MIN_CANDIDATE_SPACING = 2.0;

/**
 * Minimum time between selected thumbnails (seconds).
 * Ensures thumbnails are spread across the video.
 * 
 * This is used by the diversity filter to avoid clustering.
 * 
 * IMPROVEMENT: Could scale with video duration (5% of duration).
 */
const MIN_THUMBNAIL_SPACING = 5.0;

/**
 * Minimum number of usable frames required.
 * If we find fewer than this, we throw an error.
 * 
 * Set to 1 so we always return at least one thumbnail if possible.
 */
const MIN_USABLE_FRAMES = 1;

/**
 * Maximum duration for using high-density sampling (seconds).
 * Videos shorter than this get more aggressive candidate extraction.
 */
const SHORT_VIDEO_THRESHOLD = 30;

/**
 * Maximum duration for normal processing (seconds).
 * Videos longer than this might need batched processing or lower sampling.
 * 
 * IMPROVEMENT: Implement batched processing for very long videos (>30 min).
 */
const LONG_VIDEO_THRESHOLD = 1800; // 30 minutes

// ============================================================================
// MAIN CLASS
// ============================================================================

/**
 * ThumbnailGenerator class
 * 
 * Coordinates frame extraction, scoring, and selection to generate
 * high-quality thumbnails from videos.
 */
export class ThumbnailGenerator {
  /** Frame extractor instance for getting frames from video */
  private frameExtractor: FrameExtractor;

  /** Frame scorer instance for evaluating frame quality */
  private frameScorer: FrameScorer;

  /** Memory manager for cleanup */
  private memoryManager: MemoryManager;

  /**
   * Create a new ThumbnailGenerator instance.
   * 
   * All dependencies can be injected for testing or customization.
   * If not provided, default instances will be created.
   * 
   * @param frameExtractor - Optional custom FrameExtractor
   * @param frameScorer - Optional custom FrameScorer
   * @param memoryManager - Optional custom MemoryManager
   * 
   * @example
   * ```typescript
   * // Using defaults
   * const generator = new ThumbnailGenerator();
   * 
   * // With custom scorer (stricter quality)
   * const strictScorer = new FrameScorer({ strictMode: true });
   * const generator = new ThumbnailGenerator(undefined, strictScorer);
   * ```
   */
  constructor(
    frameExtractor?: FrameExtractor,
    frameScorer?: FrameScorer,
    memoryManager?: MemoryManager
  ) {
    // Use provided instances or create new defaults
    this.frameExtractor = frameExtractor ?? new FrameExtractor();
    this.frameScorer = frameScorer ?? new FrameScorer();
    this.memoryManager = memoryManager ?? MemoryManager.getInstance();
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Generate thumbnails from a video.
   * 
   * This is the main entry point for thumbnail generation. It orchestrates
   * the entire process from frame extraction to final thumbnail creation.
   * 
   * Process:
   * 1. Validate video and options
   * 2. Calculate extraction strategy
   * 3. Extract candidate frames
   * 4. Score and filter frames
   * 5. Apply diversity filter
   * 6. Generate final thumbnails
   * 7. Clean up temporary resources
   * 
   * @param video - Loaded HTMLVideoElement to generate thumbnails from
   * @param options - Optional configuration for thumbnail generation
   * @returns Promise resolving to array of Thumbnail objects
   * @throws VideoIntelError if generation fails
   * 
   * @example
   * ```typescript
   * const generator = new ThumbnailGenerator();
   * const thumbnails = await generator.generate(video, {
   *   count: 5,
   *   quality: 0.9,
   *   format: 'jpeg',
   *   size: { width: 1280 },
   *   onProgress: (p) => console.log(`${p}% complete`)
   * });
   * ```
   */
  async generate(
    video: HTMLVideoElement,
    options?: ThumbnailOptions & { onProgress?: ProgressCallback }
  ): Promise<Thumbnail[]> {
    // Step 1: Validate video is ready for processing
    this.validateVideo(video);

    // Step 2: Normalize options with defaults and validate
    const normalizedOptions = this.validateAndNormalizeOptions(options);

    // Step 3: Calculate extraction strategy
    // Determines which timestamps to sample from the video
    const { timestamps } = this.calculateExtractionStrategy(
      video.duration,
      normalizedOptions.count
    );

    // Report initial progress
    if (options?.onProgress) {
      options.onProgress(0);
    }

    // Step 4: Extract candidate frames
    // This gets canvases at calculated timestamps
    const candidateFrames = await this.extractCandidateFrames(
      video,
      timestamps,
      (progress) => {
        // Map extraction progress to 0-40% of total
        if (options?.onProgress) {
          options.onProgress(Math.floor(progress * 0.4));
        }
      }
    );

    // Step 5: Score and filter frames
    // Evaluate quality and remove unusable frames
    const scoredFrames = await this.scoreAndFilterFrames(
      candidateFrames,
      (progress) => {
        // Map scoring progress to 40-70% of total
        if (options?.onProgress) {
          options.onProgress(40 + Math.floor(progress * 0.3));
        }
      }
    );

    // Report scoring complete
    if (options?.onProgress) {
      options.onProgress(70);
    }

    // Step 6: Select best frames with diversity
    // Apply temporal diversity filter to spread thumbnails across video
    const selectedFrames = this.applyDiversityFilter(
      scoredFrames,
      normalizedOptions.count,
      video.duration
    );

    // Step 7: Generate final thumbnails
    // Convert to blobs with proper format, quality, and dimensions
    const thumbnails = await this.generateThumbnails(
      selectedFrames,
      normalizedOptions,
      (progress) => {
        // Map generation progress to 70-100% of total
        if (options?.onProgress) {
          options.onProgress(70 + Math.floor(progress * 0.3));
        }
      }
    );

    // Report complete
    if (options?.onProgress) {
      options.onProgress(100);
    }

    // Step 8: Clean up temporary canvases
    // IMPROVEMENT: Could track these during processing for better cleanup
    candidateFrames.forEach(frame => {
      this.memoryManager.cleanupCanvas(frame.canvas);
    });

    return thumbnails;
  }

  // ============================================================================
  // VALIDATION
  // ============================================================================

  /**
   * Validate that video element is ready for processing.
   * 
   * Checks:
   * - Video has metadata loaded (readyState >= 1)
   * - Video has valid dimensions (not 0x0)
   * - Video has valid duration (not 0 or NaN)
   * 
   * @param video - Video element to validate
   * @throws VideoIntelError if video is not ready
   */
  private validateVideo(video: HTMLVideoElement): void {
    // Check metadata is loaded
    if (video.readyState < 1) {
      throw new VideoIntelError(
        'Video metadata not loaded. Ensure the video is fully loaded before generating thumbnails.',
        ErrorCode.VIDEO_NOT_READY,
        { readyState: video.readyState }
      );
    }

    // Check valid dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      throw new VideoIntelError(
        'Video has invalid dimensions (0x0). The video may be audio-only or corrupted.',
        ErrorCode.VIDEO_NOT_READY,
        { width: video.videoWidth, height: video.videoHeight }
      );
    }

    // Check valid duration
    if (!video.duration || video.duration <= 0 || !Number.isFinite(video.duration)) {
      throw new VideoIntelError(
        'Video has invalid duration. The video may be corrupted or still loading.',
        ErrorCode.VIDEO_NOT_READY,
        { duration: video.duration }
      );
    }
  }

  /**
   * Validate and normalize thumbnail options with defaults.
   * 
   * Sets sensible defaults for all options and validates ranges.
   * 
   * Default values:
   * - count: 5 thumbnails
   * - quality: 0.8 (80% JPEG quality)
   * - format: 'jpeg'
   * - timestamps: true (include timestamp in result)
   * 
   * @param options - User-provided options (may be undefined)
   * @returns Normalized options with all fields set
   * @throws VideoIntelError if any option is invalid
   */
  private validateAndNormalizeOptions(
    options?: ThumbnailOptions
  ): Required<Omit<ThumbnailOptions, 'size'>> & { size?: { width?: number; height?: number } } {
    // Set defaults
    const normalized = {
      count: options?.count ?? 5,
      quality: options?.quality ?? 0.8,
      format: (options?.format ?? 'jpeg') as 'jpeg' | 'png',
      timestamps: options?.timestamps ?? true,
      size: options?.size
    };

    // Validate count range (1-10)
    if (normalized.count < 1 || normalized.count > 10) {
      throw new VideoIntelError(
        `Thumbnail count must be between 1 and 10. Received: ${normalized.count}`,
        ErrorCode.INVALID_INPUT,
        { count: normalized.count, validRange: [1, 10] }
      );
    }

    // Validate count is integer
    if (!Number.isInteger(normalized.count)) {
      throw new VideoIntelError(
        `Thumbnail count must be an integer. Received: ${normalized.count}`,
        ErrorCode.INVALID_INPUT,
        { count: normalized.count }
      );
    }

    // Validate quality range (0-1)
    if (normalized.quality < 0 || normalized.quality > 1) {
      throw new VideoIntelError(
        `Quality must be between 0 and 1. Received: ${normalized.quality}`,
        ErrorCode.INVALID_INPUT,
        { quality: normalized.quality, validRange: [0, 1] }
      );
    }

    // Validate format
    if (normalized.format !== 'jpeg' && normalized.format !== 'png') {
      throw new VideoIntelError(
        `Format must be 'jpeg' or 'png'. Received: ${normalized.format}`,
        ErrorCode.INVALID_INPUT,
        { format: normalized.format, validFormats: ['jpeg', 'png'] }
      );
    }

    // Validate size dimensions if provided
    if (normalized.size) {
      if (normalized.size.width !== undefined && normalized.size.width <= 0) {
        throw new VideoIntelError(
          `Width must be greater than 0. Received: ${normalized.size.width}`,
          ErrorCode.INVALID_INPUT,
          { width: normalized.size.width }
        );
      }

      if (normalized.size.height !== undefined && normalized.size.height <= 0) {
        throw new VideoIntelError(
          `Height must be greater than 0. Received: ${normalized.size.height}`,
          ErrorCode.INVALID_INPUT,
          { height: normalized.size.height }
        );
      }
    }

    return normalized;
  }

  // ============================================================================
  // EXTRACTION STRATEGY
  // ============================================================================

  /**
   * Calculate which frames to extract as candidates.
   * 
   * Strategy:
   * 1. Extract more candidates than needed (CANDIDATE_MULTIPLIER)
   * 2. Skip margins at start/end of video (fade in/out)
   * 3. Distribute candidates evenly across video
   * 4. Ensure minimum spacing between candidates
   * 
   * For short videos (< 30s):
   * - Use higher density sampling
   * - May reduce multiplier to avoid over-sampling
   * 
   * For long videos (> 30 min):
   * - Use normal sampling
   * - IMPROVEMENT: Could implement batched processing
   * 
   * @param videoDuration - Duration of video in seconds
   * @param targetCount - Number of final thumbnails desired
   * @returns Object with timestamps array and sampling interval
   * 
   * @example
   * ```typescript
   * // For 60s video, 5 thumbnails:
   * // Result: Extract 15 candidates from 3s to 57s (skipping 5% margins)
   * const { timestamps } = calculateExtractionStrategy(60, 5);
   * // timestamps: [3, 6.6, 10.2, 13.8, ..., 57]
   * ```
   */
  private calculateExtractionStrategy(
    videoDuration: number,
    targetCount: number
  ): { timestamps: number[]; samplingInterval: number } {
    // Calculate usable duration (excluding margins)
    const margin = videoDuration * VIDEO_MARGIN_PERCENT;
    const startTime = margin;
    const endTime = videoDuration - margin;
    const usableDuration = endTime - startTime;

    // Adjust multiplier for very short videos
    // Don't over-sample short videos
    let adjustedMultiplier = CANDIDATE_MULTIPLIER;
    if (videoDuration < SHORT_VIDEO_THRESHOLD) {
      // For videos < 30s, reduce multiplier to avoid extracting too many
      // similar frames. Use at least 2x multiplier.
      adjustedMultiplier = Math.max(2, Math.floor(videoDuration / 10));
    }

    // Calculate number of candidates to extract
    const candidateCount = targetCount * adjustedMultiplier;

    // Calculate interval between candidates
    let interval = usableDuration / (candidateCount - 1);

    // Ensure minimum spacing between candidates
    // This prevents extracting almost identical adjacent frames
    if (interval < MIN_CANDIDATE_SPACING) {
      interval = MIN_CANDIDATE_SPACING;
    }

    // Generate timestamps array
    const timestamps: number[] = [];
    for (let time = startTime; time <= endTime && timestamps.length < candidateCount; time += interval) {
      timestamps.push(time);
    }

    // Ensure we have at least one timestamp
    if (timestamps.length === 0) {
      // For very short videos, just take the middle frame
      timestamps.push(videoDuration / 2);
    }

    return {
      timestamps,
      samplingInterval: interval
    };
  }

  // ============================================================================
  // FRAME EXTRACTION
  // ============================================================================

  /**
   * Extract candidate frames from video at specified timestamps.
   * 
   * Uses FrameExtractor to get canvas elements at each timestamp.
   * Frames are extracted in chronological order for performance.
   * 
   * @param video - Video element to extract from
   * @param timestamps - Array of timestamps to extract
   * @param onProgress - Optional progress callback (0-100)
   * @returns Array of canvas + timestamp + dimensions
   * @throws VideoIntelError if extraction fails
   */
  private async extractCandidateFrames(
    video: HTMLVideoElement,
    timestamps: number[],
    onProgress?: ProgressCallback
  ): Promise<Array<{ canvas: HTMLCanvasElement; timestamp: number; width: number; height: number }>> {
    try {
      // Use FrameExtractor's batch extraction (optimized)
      const canvases = await this.frameExtractor.extractFrames(
        video,
        timestamps,
        onProgress
      );

      // Map canvases to frames with metadata
      return canvases.map((canvas, index) => ({
        canvas,
        timestamp: timestamps[index],
        width: canvas.width,
        height: canvas.height
      }));
    } catch (error) {
      if (error instanceof VideoIntelError) {
        throw error;
      }

      throw new VideoIntelError(
        'Failed to extract candidate frames from video.',
        ErrorCode.PROCESSING_ERROR,
        error
      );
    }
  }

  // ============================================================================
  // FRAME SCORING
  // ============================================================================

  /**
   * Score all frames and filter out unusable ones.
   * 
   * Process:
   * 1. Score each frame using FrameScorer
   * 2. Filter out frames marked as unusable (black, white, blurry)
   * 3. Sort by score (descending - best first)
   * 4. Check if we have enough usable frames
   * 
   * Returns both the score and the original canvas so we can use it
   * for thumbnail generation without re-extracting.
   * 
   * @param frames - Candidate frames to score
   * @param onProgress - Optional progress callback (0-100)
   * @returns Array of scored frames with canvases, sorted by quality
   * @throws VideoIntelError if no usable frames found
   */
  private async scoreAndFilterFrames(
    frames: Array<{ canvas: HTMLCanvasElement; timestamp: number }>,
    onProgress?: ProgressCallback
  ): Promise<Array<{ score: FrameScore; canvas: HTMLCanvasElement }>> {
    const scoredFrames: Array<{ score: FrameScore; canvas: HTMLCanvasElement }> = [];

    // Score each frame
    for (let i = 0; i < frames.length; i++) {
      const { canvas, timestamp } = frames[i];

      try {
        // Score the frame
        const score = await this.frameScorer.analyze(canvas, timestamp);
        
        // Keep both score and canvas together
        scoredFrames.push({ score, canvas });

        // Report progress
        if (onProgress) {
          const progress = Math.round(((i + 1) / frames.length) * 100);
          onProgress(progress);
        }
      } catch (error) {
        // Log warning but continue with other frames
        // Don't let one bad frame break the entire process
        console.warn(`Failed to score frame at ${timestamp}s:`, error);
      }
    }

    // Filter out unusable frames
    const usableFrames = scoredFrames.filter(frame => frame.score.isUsable);

    // Check if we have enough usable frames
    if (usableFrames.length < MIN_USABLE_FRAMES) {
      throw new VideoIntelError(
        `Could not find any usable frames. All ${scoredFrames.length} candidate frames were filtered out (black, white, or too blurry). The video may be corrupted or extremely low quality.`,
        ErrorCode.PROCESSING_ERROR,
        {
          totalCandidates: frames.length,
          scoredFrames: scoredFrames.length,
          usableFrames: usableFrames.length
        }
      );
    }

    // Sort by score (descending - highest quality first)
    usableFrames.sort((a, b) => b.score.score - a.score.score);

    // Log warning if we filtered out many frames
    const filterRate = 1 - (usableFrames.length / scoredFrames.length);
    if (filterRate > 0.5) {
      console.warn(
        `High filter rate: ${Math.round(filterRate * 100)}% of frames were filtered as unusable. ` +
        `This may indicate low video quality or excessive fades/transitions.`
      );
    }

    return usableFrames;
  }

  // ============================================================================
  // FRAME SELECTION
  // ============================================================================

  /**
   * Apply diversity filter to select best frames spread across video.
   * 
   * Strategy:
   * 1. Always take the highest-scoring frame
   * 2. For remaining slots, take next highest-scoring frame that's not too close
   * 3. "Too close" means within MIN_THUMBNAIL_SPACING seconds
   * 
   * This ensures:
   * - High quality (prioritizes score)
   * - Temporal diversity (spreads across video timeline)
   * - No clustering (avoids adjacent frames)
   * 
   * IMPROVEMENT: Could implement segment-based selection where we divide
   * video into N segments and select best frame from each segment.
   * 
   * @param scoredFrames - Frames with scores and canvases, sorted by score (best first)
   * @param targetCount - Number of thumbnails to select
   * @param videoDuration - Total video duration (for percentage-based spacing)
   * @returns Selected frames (sorted by timestamp)
   */
  private applyDiversityFilter(
    scoredFrames: Array<{ score: FrameScore; canvas: HTMLCanvasElement }>,
    targetCount: number,
    videoDuration: number
  ): Array<{ score: FrameScore; canvas: HTMLCanvasElement }> {
    // If we have fewer frames than requested, return all
    if (scoredFrames.length <= targetCount) {
      return scoredFrames.sort((a, b) => (a.score.timestamp ?? 0) - (b.score.timestamp ?? 0));
    }

    // Array to store selected frames
    const selected: Array<{ score: FrameScore; canvas: HTMLCanvasElement }> = [];

    // Always take the best frame first
    selected.push(scoredFrames[0]);

    // Calculate minimum spacing as percentage of duration
    // This makes spacing adaptive to video length
    const minSpacing = Math.min(
      MIN_THUMBNAIL_SPACING,
      videoDuration * 0.05 // 5% of video duration
    );

    // Select remaining frames
    for (let i = 1; i < scoredFrames.length && selected.length < targetCount; i++) {
      const candidate = scoredFrames[i];
      const candidateTime = candidate.score.timestamp ?? 0;

      // Check if candidate is far enough from all selected frames
      const isFarEnough = selected.every(selectedFrame => {
        const selectedTime = selectedFrame.score.timestamp ?? 0;
        const distance = Math.abs(candidateTime - selectedTime);
        return distance >= minSpacing;
      });

      // If far enough, add to selected
      if (isFarEnough) {
        selected.push(candidate);
      }
    }

    // Sort by timestamp for chronological order
    // This makes the thumbnail array easier to use (ordered by appearance)
    selected.sort((a, b) => (a.score.timestamp ?? 0) - (b.score.timestamp ?? 0));

    // Log warning if we couldn't get the full count
    if (selected.length < targetCount) {
      console.warn(
        `Could only select ${selected.length} of ${targetCount} requested thumbnails ` +
        `after applying diversity filter. Video may be too short or have clustered good frames.`
      );
    }

    return selected;
  }

  // ============================================================================
  // THUMBNAIL GENERATION
  // ============================================================================

  /**
   * Generate final Thumbnail objects from selected frames.
   * 
   * Process for each frame:
   * 1. Use the canvas we already have from extraction/scoring
   * 2. Resize if size options specified
   * 3. Convert to Blob with specified format and quality
   * 4. Create Thumbnail object with all metadata
   * 5. Clean up temporary canvas
   * 
   * @param selectedFrames - Frames with scores and canvases to convert to thumbnails
   * @param options - Thumbnail generation options
   * @param onProgress - Optional progress callback (0-100)
   * @returns Array of final Thumbnail objects
   */
  private async generateThumbnails(
    selectedFrames: Array<{ score: FrameScore; canvas: HTMLCanvasElement }>,
    options: Required<Omit<ThumbnailOptions, 'size'>> & { size?: { width?: number; height?: number } },
    onProgress?: ProgressCallback
  ): Promise<Thumbnail[]> {
    const thumbnails: Thumbnail[] = [];

    // Process each selected frame
    for (let i = 0; i < selectedFrames.length; i++) {
      const { score: frame, canvas } = selectedFrames[i];
      const timestamp = frame.timestamp ?? 0;

      try {
        // Resize if needed
        const finalCanvas = options.size
          ? this.resizeCanvas(canvas, options.size.width, options.size.height)
          : canvas;

        // Convert to blob
        const imageType = options.format === 'png' ? 'image/png' : 'image/jpeg';
        const blob = await this.frameExtractor.canvasToBlob(
          finalCanvas,
          imageType,
          options.quality
        );

        // Create thumbnail object
        const thumbnail: Thumbnail = {
          image: blob,
          timestamp: timestamp,
          score: frame.score,
          width: finalCanvas.width,
          height: finalCanvas.height
        };

        thumbnails.push(thumbnail);

        // Clean up resized canvas if we created one
        // Don't clean up the original canvas yet - we'll do that in the main generate method
        if (finalCanvas !== canvas) {
          this.memoryManager.cleanupCanvas(finalCanvas);
        }

        // Report progress
        if (onProgress) {
          const progress = Math.round(((i + 1) / selectedFrames.length) * 100);
          onProgress(progress);
        }
      } catch (error) {
        // Log error but try to continue with other thumbnails
        console.error(`Failed to generate thumbnail at ${timestamp}s:`, error);
        
        // If this was the only thumbnail, re-throw
        if (selectedFrames.length === 1) {
          throw new VideoIntelError(
            `Failed to generate thumbnail: ${error instanceof Error ? error.message : 'Unknown error'}`,
            ErrorCode.PROCESSING_ERROR,
            error
          );
        }
      }
    }

    // Ensure we generated at least one thumbnail
    if (thumbnails.length === 0) {
      throw new VideoIntelError(
        'Failed to generate any thumbnails from selected frames.',
        ErrorCode.PROCESSING_ERROR
      );
    }

    return thumbnails;
  }

  /**
   * Resize a canvas to specified dimensions.
   * 
   * Maintains aspect ratio if only one dimension is specified.
   * Uses high-quality scaling (drawImage is GPU-accelerated).
   * 
   * Note: FrameExtractor has a private resizeCanvas method. We implement
   * our own here to avoid modifying core files. If this becomes widely
   * used, we could ask to make FrameExtractor.resizeCanvas public.
   * 
   * IMPROVEMENT: Could implement step-down scaling for better quality
   * when downscaling by large factors (e.g., 4K → 640px).
   * 
   * @param sourceCanvas - Canvas to resize
   * @param targetWidth - Desired width (optional if height provided)
   * @param targetHeight - Desired height (optional if width provided)
   * @returns New canvas with resized content
   */
  private resizeCanvas(
    sourceCanvas: HTMLCanvasElement,
    targetWidth?: number,
    targetHeight?: number
  ): HTMLCanvasElement {
    // If no dimensions specified, return original
    if (!targetWidth && !targetHeight) {
      return sourceCanvas;
    }

    // Calculate final dimensions maintaining aspect ratio
    let newWidth: number;
    let newHeight: number;

    if (targetWidth && targetHeight) {
      // Both dimensions specified - use as-is
      newWidth = targetWidth;
      newHeight = targetHeight;
    } else if (targetWidth) {
      // Only width specified - calculate height maintaining aspect ratio
      newWidth = targetWidth;
      newHeight = Math.round(
        (sourceCanvas.height / sourceCanvas.width) * targetWidth
      );
    } else {
      // Only height specified - calculate width maintaining aspect ratio
      newHeight = targetHeight!;
      newWidth = Math.round(
        (sourceCanvas.width / sourceCanvas.height) * targetHeight!
      );
    }

    // Create new canvas with target dimensions
    const resizedCanvas = document.createElement('canvas');
    resizedCanvas.width = newWidth;
    resizedCanvas.height = newHeight;

    // Get context and draw scaled image
    const ctx = resizedCanvas.getContext('2d');
    if (!ctx) {
      throw new VideoIntelError(
        'Failed to get 2D context for resized canvas.',
        ErrorCode.CANVAS_CONTEXT_ERROR,
        { width: newWidth, height: newHeight }
      );
    }

    // Draw source canvas scaled to new dimensions
    // The browser handles the scaling efficiently (usually GPU-accelerated)
    ctx.drawImage(sourceCanvas, 0, 0, newWidth, newHeight);

    return resizedCanvas;
  }
}


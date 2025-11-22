/**
 * FrameExtractor - Core utility for extracting frames from HTML5 video elements
 * 
 * This module provides the fundamental capability to extract individual frames from
 * videos at specific timestamps and convert them to various formats (Canvas/Blob).
 * It serves as the foundation for all video analysis features in VideoIntel.
 * 
 * Key Features:
 * - Extract single frames at specific timestamps
 * - Extract multiple frames efficiently in batch
 * - Extract frames at regular intervals
 * - Convert frames to Blobs (JPEG/PNG) with quality control
 * - Progress tracking for long operations
 * - Robust error handling with specific error codes
 * 
 * Design Considerations:
 * - Simple, focused API (single responsibility)
 * - Optimized for sequential frame extraction
 * - Memory efficient with proper cleanup
 * - Built with future enhancements in mind
 * 
 * Future Improvements:
 * - TODO: Add frame caching mechanism for repeated access to same frames
 * - TODO: Support Web Worker-based extraction for better performance
 * - TODO: Add OffscreenCanvas support when available
 * - TODO: Implement frame pooling to reduce memory allocation
 * - TODO: Add adaptive timeout based on video size/format
 * - TODO: Support batch extraction with parallel seeking (when browser supports it)
 */

import { VideoIntelError, ErrorCode, IntervalOptions, BlobOptions } from '../types';

/**
 * Default timeout for video seek operations (5 seconds)
 * Prevents infinite waiting if seek gets stuck
 * 
 * IMPROVEMENT NOTE: This could be made adaptive based on video size
 * or configurable via constructor options in the future
 */
const DEFAULT_SEEK_TIMEOUT = 5000;

/**
 * Minimum valid timestamp value (0 seconds)
 */
const MIN_TIMESTAMP = 0;

/**
 * FrameExtractor class
 * 
 * Handles extraction of individual frames from HTMLVideoElement and conversion
 * to various formats (Canvas, Blob). All methods are async to support the
 * asynchronous nature of video seeking and processing.
 * 
 * Usage Example:
 * ```typescript
 * const extractor = new FrameExtractor();
 * const video = await videoLoader.load(file);
 * 
 * // Extract single frame
 * const canvas = await extractor.extractFrame(video, 10.5);
 * 
 * // Extract multiple frames
 * const frames = await extractor.extractFrames(video, [1, 5, 10, 15]);
 * 
 * // Extract at intervals
 * const allFrames = await extractor.extractFramesAtInterval(video, 2.0);
 * ```
 * 
 * FUTURE ENHANCEMENT: Add constructor options for:
 * - seekTimeout: Custom timeout duration
 * - enableCaching: Turn on/off frame caching
 * - maxCacheSize: Maximum number of frames to cache
 * - workerEnabled: Use Web Workers for extraction
 */
export class FrameExtractor {
  /**
   * FUTURE ENHANCEMENT: Frame cache for repeated access
   * 
   * Frame caching would significantly improve performance when:
   * - Multiple analyzers need the same frames
   * - Thumbnail scoring requires multiple passes
   * - Scene detection needs to compare adjacent frames
   * 
   * Implementation ideas:
   * - Use Map<string, HTMLCanvasElement> with key: "videoId:timestamp"
   * - Add LRU eviction policy to prevent memory bloat
   * - Make cache size configurable
   * - Add cache statistics for debugging
   * 
   * Example:
   * private frameCache?: Map<string, HTMLCanvasElement>;
   * private cacheEnabled: boolean = false;
   */

  /**
   * FUTURE ENHANCEMENT: Web Worker pool for parallel frame extraction
   * 
   * Web Workers would enable:
   * - Parallel frame extraction without blocking main thread
   * - Better performance on multi-core devices
   * - Smoother UI during processing
   * 
   * Implementation considerations:
   * - Transfer video URL to worker (not video element itself)
   * - Use OffscreenCanvas in worker for frame drawing
   * - Implement message-based communication protocol
   * - Add worker pool management for multiple concurrent operations
   * 
   * Example:
   * private workerPool?: WorkerPool;
   */

  /**
   * Extract a single frame from video at a specific timestamp
   * 
   * This is the core method that all other extraction methods build upon.
   * It handles video seeking, waits for seek completion, and draws the frame
   * to a canvas element.
   * 
   * Process:
   * 1. Validate video element and timestamp
   * 2. Create canvas matching video dimensions
   * 3. Seek to target timestamp
   * 4. Wait for 'seeked' event
   * 5. Draw video frame to canvas
   * 6. Return canvas
   * 
   * @param video - The loaded HTMLVideoElement to extract from
   * @param timestamp - The timestamp in seconds (must be 0 <= timestamp <= duration)
   * @returns Promise resolving to canvas containing the frame
   * @throws VideoIntelError with specific error codes for different failure modes
   * 
   * Error Codes:
   * - VIDEO_NOT_READY: Video metadata not loaded
   * - INVALID_TIMESTAMP: Timestamp out of valid range
   * - CANVAS_CONTEXT_ERROR: Failed to get 2D context
   * - SEEK_FAILED: Video seeking failed or timed out
   * - PROCESSING_ERROR: Frame drawing failed
   * 
   * @example
   * ```typescript
   * const extractor = new FrameExtractor();
   * const frame = await extractor.extractFrame(video, 5.5);
   * // frame is an HTMLCanvasElement with the video frame at 5.5 seconds
   * ```
   */
  async extractFrame(
    video: HTMLVideoElement,
    timestamp: number
  ): Promise<HTMLCanvasElement> {
    // Step 1: Validate video is ready for processing
    // readyState >= 1 means HAVE_METADATA - we have dimensions and duration
    this.validateVideoReady(video);

    // Step 2: Validate timestamp is within valid range
    this.validateTimestamp(timestamp, video.duration);

    // Step 3: Create canvas with same dimensions as video
    // This ensures we capture the full frame at original resolution
    const canvas = this.createCanvas(video.videoWidth, video.videoHeight);

    // Step 4: Get 2D rendering context
    // We use 2D context because it's universally supported and sufficient
    // for frame extraction
    const ctx = canvas.getContext('2d', {
      // PERFORMANCE NOTE: willReadFrequently: false tells browser we won't
      // read pixel data often, enabling GPU optimizations
      willReadFrequently: false,
    });

    if (!ctx) {
      throw new VideoIntelError(
        'Failed to get 2D canvas context. This may indicate a browser limitation or memory issue.',
        ErrorCode.CANVAS_CONTEXT_ERROR,
        { width: video.videoWidth, height: video.videoHeight }
      );
    }

    // Step 5: Seek to target timestamp and wait for completion
    // This is async because seeking takes time (especially for remote videos)
    await this.seekToTimestamp(video, timestamp);

    // Step 6: Draw the current video frame to canvas
    try {
      // drawImage() copies the current video frame to the canvas
      // Parameters: (source, destX, destY, destWidth, destHeight)
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    } catch (error) {
      throw new VideoIntelError(
        'Failed to draw video frame to canvas. The video may be corrupted or in an unsupported format.',
        ErrorCode.PROCESSING_ERROR,
        { timestamp, error }
      );
    }

    // Return the canvas containing the extracted frame
    return canvas;
  }

  /**
   * Extract multiple frames at specified timestamps
   * 
   * This method efficiently extracts multiple frames by:
   * - Sorting timestamps to minimize seeking distance
   * - Processing frames sequentially (reduces seek time)
   * - Providing progress updates for long operations
   * - Mapping results back to original order
   * 
   * OPTIMIZATION: Frames are processed in chronological order (sorted)
   * because video seeking is faster when going forward than backward.
   * The results are then reordered to match the input timestamp order.
   * 
   * FUTURE ENHANCEMENT: Could support parallel extraction using Web Workers
   * when the browser environment supports OffscreenCanvas and multiple
   * video element instances.
   * 
   * @param video - The loaded HTMLVideoElement to extract from
   * @param timestamps - Array of timestamps in seconds to extract
   * @param onProgress - Optional callback receiving progress (0-100)
   * @returns Promise resolving to array of canvases in same order as timestamps
   * @throws VideoIntelError if any frame extraction fails
   * 
   * @example
   * ```typescript
   * const extractor = new FrameExtractor();
   * const frames = await extractor.extractFrames(
   *   video,
   *   [10, 5, 15, 3],  // Unordered timestamps
   *   (progress) => console.log(`Progress: ${progress}%`)
   * );
   * // frames[0] is from timestamp 10
   * // frames[1] is from timestamp 5
   * // frames[2] is from timestamp 15
   * // frames[3] is from timestamp 3
   * ```
   */
  async extractFrames(
    video: HTMLVideoElement,
    timestamps: number[],
    onProgress?: (progress: number) => void
  ): Promise<HTMLCanvasElement[]> {
    // Handle edge case: empty array
    if (timestamps.length === 0) {
      return [];
    }

    // Create array to track extraction order
    // We need this to map sorted results back to original order
    const indexedTimestamps = timestamps.map((timestamp, index) => ({
      timestamp,
      originalIndex: index,
    }));

    // Sort by timestamp to optimize seeking
    // Video seeking is much faster when moving forward
    indexedTimestamps.sort((a, b) => a.timestamp - b.timestamp);

    // Array to store extracted frames (will be in sorted order initially)
    const sortedFrames: HTMLCanvasElement[] = [];

    // Extract frames in sorted order
    for (let i = 0; i < indexedTimestamps.length; i++) {
      const { timestamp } = indexedTimestamps[i];

      // Extract the frame
      try {
        const canvas = await this.extractFrame(video, timestamp);
        sortedFrames.push(canvas);
      } catch (error) {
        // Re-throw with additional context about which frame failed
        if (error instanceof VideoIntelError) {
          throw new VideoIntelError(
            `Failed to extract frame ${i + 1} of ${timestamps.length} at timestamp ${timestamp}s: ${error.message}`,
            error.code,
            { 
              ...(error.details && typeof error.details === 'object' ? error.details : {}),
              frameIndex: i, 
              timestamp 
            }
          );
        }
        throw error;
      }

      // Report progress if callback provided
      if (onProgress) {
        const progress = Math.round(((i + 1) / timestamps.length) * 100);
        try {
          onProgress(progress);
        } catch (error) {
          // Don't let callback errors break frame extraction
          console.warn('Progress callback error:', error);
        }
      }
    }

    // Map frames back to original order
    // Create array with correct length
    const orderedFrames: HTMLCanvasElement[] = new Array(timestamps.length);
    
    // Place each frame at its original index
    for (let i = 0; i < indexedTimestamps.length; i++) {
      const { originalIndex } = indexedTimestamps[i];
      orderedFrames[originalIndex] = sortedFrames[i];
    }

    return orderedFrames;
  }

  /**
   * Extract frames at regular intervals throughout the video
   * 
   * This is a convenience method that generates timestamps automatically
   * and extracts frames at regular intervals. Very useful for:
   * - Creating thumbnail galleries
   * - Scene detection
   * - Color analysis
   * - Video summarization
   * 
   * The method calculates timestamps from start to end (or full duration)
   * in steps of `intervalSeconds`.
   * 
   * FUTURE ENHANCEMENT: Add adaptive interval sizing based on video length
   * to automatically determine optimal sampling rate.
   * 
   * @param video - The loaded HTMLVideoElement to extract from
   * @param intervalSeconds - Time between frames in seconds (e.g., 2.0 = every 2 seconds)
   * @param options - Optional configuration for time range and progress
   * @returns Promise resolving to array of canvases
   * @throws VideoIntelError if extraction fails
   * 
   * @example
   * ```typescript
   * const extractor = new FrameExtractor();
   * 
   * // Extract frames every 2 seconds
   * const frames = await extractor.extractFramesAtInterval(video, 2.0);
   * 
   * // Extract frames every 5 seconds from 10s to 60s
   * const frames = await extractor.extractFramesAtInterval(video, 5.0, {
   *   startTime: 10,
   *   endTime: 60,
   *   onProgress: (p) => console.log(`${p}%`)
   * });
   * ```
   */
  async extractFramesAtInterval(
    video: HTMLVideoElement,
    intervalSeconds: number,
    options?: IntervalOptions
  ): Promise<HTMLCanvasElement[]> {
    // Validate video is ready
    this.validateVideoReady(video);

    // Validate interval is positive and reasonable
    if (intervalSeconds <= 0) {
      throw new VideoIntelError(
        'Interval must be greater than 0 seconds.',
        ErrorCode.INVALID_INPUT,
        { interval: intervalSeconds }
      );
    }

    // Extract options with defaults
    const startTime = options?.startTime ?? 0;
    const endTime = options?.endTime ?? video.duration;
    const onProgress = options?.onProgress;

    // Validate time range
    if (startTime < 0 || startTime >= video.duration) {
      throw new VideoIntelError(
        `Start time (${startTime}s) must be between 0 and video duration (${video.duration}s).`,
        ErrorCode.INVALID_TIMESTAMP,
        { startTime, duration: video.duration }
      );
    }

    if (endTime <= startTime || endTime > video.duration) {
      throw new VideoIntelError(
        `End time (${endTime}s) must be greater than start time (${startTime}s) and not exceed duration (${video.duration}s).`,
        ErrorCode.INVALID_TIMESTAMP,
        { startTime, endTime, duration: video.duration }
      );
    }

    // Generate timestamps array
    const timestamps: number[] = [];
    
    // Start from startTime and increment by interval until we reach endTime
    for (let time = startTime; time < endTime; time += intervalSeconds) {
      timestamps.push(time);
    }

    // Handle edge case: if interval is larger than video duration
    if (timestamps.length === 0) {
      // Include at least the start frame
      timestamps.push(startTime);
    }

    // Optionally include the exact end time if we didn't already
    // This ensures we get the last frame if interval doesn't land on endTime
    const lastTimestamp = timestamps[timestamps.length - 1];
    if (endTime - lastTimestamp > intervalSeconds * 0.1) {
      // Add end frame if it's at least 10% of an interval away
      timestamps.push(endTime);
    }

    // Delegate to extractFrames which handles the actual extraction
    return this.extractFrames(video, timestamps, onProgress);
  }

  /**
   * Convert a canvas to a Blob (binary data)
   * 
   * This method converts a canvas element to a Blob object that can be:
   * - Saved to disk
   * - Sent over network
   * - Stored in IndexedDB
   * - Used with FormData for uploads
   * 
   * Supports JPEG and PNG formats with quality control for JPEG.
   * 
   * PERFORMANCE NOTE: JPEG with quality 0.8 provides good balance between
   * file size and quality. PNG is lossless but results in larger files.
   * 
   * @param canvas - The canvas to convert
   * @param type - Image format ('image/jpeg' or 'image/png')
   * @param quality - JPEG quality 0-1 (only applies to JPEG, ignored for PNG)
   * @returns Promise resolving to Blob
   * @throws VideoIntelError if conversion fails
   * 
   * @example
   * ```typescript
   * const extractor = new FrameExtractor();
   * const canvas = await extractor.extractFrame(video, 10);
   * 
   * // Convert to JPEG with 80% quality
   * const jpegBlob = await extractor.canvasToBlob(canvas, 'image/jpeg', 0.8);
   * 
   * // Convert to PNG (lossless)
   * const pngBlob = await extractor.canvasToBlob(canvas, 'image/png');
   * ```
   */
  async canvasToBlob(
    canvas: HTMLCanvasElement,
    type: string = 'image/jpeg',
    quality: number = 0.8
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      // toBlob is async and callback-based, so we wrap it in a Promise
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            // toBlob returns null on failure
            reject(
              new VideoIntelError(
                'Failed to convert canvas to blob. This may indicate a memory issue or browser limitation.',
                ErrorCode.PROCESSING_ERROR,
                { canvasWidth: canvas.width, canvasHeight: canvas.height, type, quality }
              )
            );
          }
        },
        type,
        quality
      );
    });
  }

  /**
   * Extract a frame directly as a Blob (convenience method)
   * 
   * This combines extractFrame() and canvasToBlob() into a single operation
   * with optional resizing. Useful when you need the frame as binary data
   * immediately without keeping the canvas around.
   * 
   * Benefits:
   * - Simpler API (one call instead of two)
   * - Automatic canvas cleanup (canvas not returned)
   * - Optional resizing built-in
   * - Memory efficient (canvas can be GC'd immediately)
   * 
   * @param video - The loaded HTMLVideoElement
   * @param timestamp - Timestamp in seconds
   * @param options - Blob conversion options (format, quality, size)
   * @returns Promise resolving to Blob
   * @throws VideoIntelError if extraction or conversion fails
   * 
   * @example
   * ```typescript
   * const extractor = new FrameExtractor();
   * 
   * // Extract and convert in one call
   * const blob = await extractor.extractFrameAsBlob(video, 10, {
   *   type: 'image/jpeg',
   *   quality: 0.9,
   *   width: 640  // Resize to 640px wide
   * });
   * ```
   */
  async extractFrameAsBlob(
    video: HTMLVideoElement,
    timestamp: number,
    options?: BlobOptions
  ): Promise<Blob> {
    // Extract the frame as canvas
    let canvas = await this.extractFrame(video, timestamp);

    // Apply resizing if dimensions specified
    if (options?.width || options?.height) {
      canvas = this.resizeCanvas(canvas, options.width, options.height);
    }

    // Convert to blob with specified options
    const type = options?.type ?? 'image/jpeg';
    const quality = options?.quality ?? 0.8;

    return this.canvasToBlob(canvas, type, quality);
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Validate that video element has metadata loaded
   * 
   * readyState values:
   * - 0 HAVE_NOTHING: No data available
   * - 1 HAVE_METADATA: Metadata loaded (duration, dimensions)
   * - 2 HAVE_CURRENT_DATA: Data at current position available
   * - 3 HAVE_FUTURE_DATA: Current and some future data available
   * - 4 HAVE_ENOUGH_DATA: Enough data to play without buffering
   * 
   * We need at least HAVE_METADATA (1) to get dimensions and duration
   * 
   * @param video - Video element to validate
   * @throws VideoIntelError if video not ready
   */
  private validateVideoReady(video: HTMLVideoElement): void {
    if (video.readyState < 1) {
      throw new VideoIntelError(
        'Video metadata not loaded. Ensure video is fully loaded before extracting frames.',
        ErrorCode.VIDEO_NOT_READY,
        { readyState: video.readyState }
      );
    }

    // Also validate video has valid dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      throw new VideoIntelError(
        'Video has invalid dimensions (0x0). The video may be audio-only or corrupted.',
        ErrorCode.VIDEO_NOT_READY,
        { width: video.videoWidth, height: video.videoHeight }
      );
    }
  }

  /**
   * Validate timestamp is within valid range
   * 
   * @param timestamp - Timestamp to validate
   * @param duration - Video duration
   * @throws VideoIntelError if timestamp invalid
   */
  private validateTimestamp(timestamp: number, duration: number): void {
    if (timestamp < MIN_TIMESTAMP) {
      throw new VideoIntelError(
        `Timestamp cannot be negative. Received: ${timestamp}s`,
        ErrorCode.INVALID_TIMESTAMP,
        { timestamp, minTimestamp: MIN_TIMESTAMP }
      );
    }

    if (timestamp > duration) {
      throw new VideoIntelError(
        `Timestamp (${timestamp}s) exceeds video duration (${duration}s).`,
        ErrorCode.INVALID_TIMESTAMP,
        { timestamp, duration }
      );
    }

    // Check for NaN or Infinity
    if (!Number.isFinite(timestamp)) {
      throw new VideoIntelError(
        `Timestamp must be a finite number. Received: ${timestamp}`,
        ErrorCode.INVALID_TIMESTAMP,
        { timestamp }
      );
    }
  }

  /**
   * Create a canvas element with specified dimensions
   * 
   * FUTURE ENHANCEMENT: Use OffscreenCanvas when available and in worker context
   * for better performance and to avoid DOM operations.
   * 
   * @param width - Canvas width in pixels
   * @param height - Canvas height in pixels
   * @returns New canvas element
   */
  private createCanvas(width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  /**
   * Seek video to specific timestamp and wait for completion
   * 
   * This method handles the async nature of video seeking:
   * 1. Set video.currentTime to target timestamp
   * 2. Wait for 'seeked' event (indicates seek completed)
   * 3. Handle timeout to prevent infinite waiting
   * 4. Handle seek errors
   * 
   * BROWSER NOTE: Different browsers have different seek behaviors:
   * - Chrome: Generally fast and reliable
   * - Firefox: Can be slower, especially for remote videos
   * - Safari: May seek to nearest keyframe (not exact timestamp)
   * 
   * FUTURE ENHANCEMENT: Add retry logic for failed seeks, especially
   * useful for network videos that may have temporary connectivity issues.
   * 
   * @param video - Video element to seek
   * @param timestamp - Target timestamp in seconds
   * @throws VideoIntelError if seek fails or times out
   */
  private async seekToTimestamp(
    video: HTMLVideoElement,
    timestamp: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      let isSettled = false;

      // Timeout handler - prevents infinite waiting
      const timeoutId = setTimeout(() => {
        if (!isSettled) {
          isSettled = true;
          cleanup();
          reject(
            new VideoIntelError(
              `Video seek timed out after ${DEFAULT_SEEK_TIMEOUT / 1000} seconds at timestamp ${timestamp}s. The video may be buffering or corrupted.`,
              ErrorCode.TIMEOUT_ERROR,
              { timestamp, timeout: DEFAULT_SEEK_TIMEOUT }
            )
          );
        }
      }, DEFAULT_SEEK_TIMEOUT);

      // Success handler - seek completed successfully
      const onSeeked = () => {
        if (!isSettled) {
          isSettled = true;
          cleanup();
          resolve();
        }
      };

      // Error handler - seek failed
      const onError = (event: Event) => {
        if (!isSettled) {
          isSettled = true;
          cleanup();
          reject(
            new VideoIntelError(
              `Video seek failed at timestamp ${timestamp}s. The video may be corrupted or in an unsupported format.`,
              ErrorCode.SEEK_FAILED,
              { timestamp, event }
            )
          );
        }
      };

      // Cleanup function - remove listeners and clear timeout
      const cleanup = () => {
        clearTimeout(timeoutId);
        video.removeEventListener('seeked', onSeeked);
        video.removeEventListener('error', onError);
      };

      // Attach event listeners BEFORE seeking
      video.addEventListener('seeked', onSeeked);
      video.addEventListener('error', onError);

      // Perform the seek
      try {
        video.currentTime = timestamp;
      } catch (error) {
        // Seeking itself can throw (e.g., invalid timestamp)
        cleanup();
        reject(
          new VideoIntelError(
            `Failed to set video timestamp to ${timestamp}s.`,
            ErrorCode.SEEK_FAILED,
            { timestamp, error }
          )
        );
      }
    });
  }

  /**
   * Resize a canvas to specified dimensions
   * 
   * Creates a new canvas and draws the source canvas scaled to new dimensions.
   * Maintains aspect ratio if only one dimension is specified.
   * 
   * PERFORMANCE NOTE: Uses drawImage() for scaling which is GPU-accelerated
   * in most browsers. For very large images, consider using multiple passes
   * for better quality (step-down scaling).
   * 
   * FUTURE ENHANCEMENT: Add quality options:
   * - Fast: Single-pass scaling
   * - Balanced: Two-pass scaling
   * - Best: Multi-pass scaling with filtering
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
    // If neither dimension specified, return original
    if (!targetWidth && !targetHeight) {
      return sourceCanvas;
    }

    // Calculate dimensions maintaining aspect ratio
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
    const resizedCanvas = this.createCanvas(newWidth, newHeight);
    const ctx = resizedCanvas.getContext('2d');

    if (!ctx) {
      throw new VideoIntelError(
        'Failed to get 2D context for resized canvas.',
        ErrorCode.CANVAS_CONTEXT_ERROR,
        { width: newWidth, height: newHeight }
      );
    }

    // Draw source canvas scaled to new dimensions
    ctx.drawImage(sourceCanvas, 0, 0, newWidth, newHeight);

    return resizedCanvas;
  }
}


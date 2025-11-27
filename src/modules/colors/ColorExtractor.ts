/**
 * ColorExtractor - Extract dominant colors from videos
 * 
 * This class orchestrates the color extraction process by:
 * 1. Sampling frames from the video
 * 2. Extracting pixels from those frames
 * 3. Clustering pixels to find dominant colors
 * 4. Converting results to the Color API format
 * 
 * Uses K-means clustering algorithm to identify the most common colors
 * in a video, which is useful for:
 * - UI theming based on video content
 * - Video categorization by color
 * - Creating color palettes for design
 * - Thumbnail color matching
 * 
 * @module modules/colors/ColorExtractor
 */

import type { ColorOptions, Color } from '../../types';
import type { RGB } from './ColorConverter';
import { FrameExtractor } from '../../core/FrameExtractor';
import { KMeansClustering } from './KMeansClustering';
import { ColorConverter } from './ColorConverter';
import { VideoIntelError, ErrorCode } from '../../types';

/**
 * ColorExtractor class
 * 
 * Main class for extracting dominant colors from videos.
 * Uses existing FrameExtractor to get frames, then performs color analysis.
 * 
 * Usage:
 * ```typescript
 * const extractor = new ColorExtractor(
 *   new FrameExtractor(),
 *   new KMeansClustering(),
 *   new ColorConverter()
 * );
 * 
 * const colors = await extractor.extract(video, {
 *   count: 5,
 *   sampleFrames: 10,
 *   quality: 'balanced'
 * });
 * ```
 */
export class ColorExtractor {
  /**
   * Create a new ColorExtractor instance
   * 
   * @param frameExtractor - Instance of FrameExtractor for getting video frames
   * @param clustering - Instance of KMeansClustering for color clustering
   * 
   * Note: Dependencies are injected for testability and flexibility
   * Note: ColorConverter is not needed as it only has static methods
   */
  constructor(
    private frameExtractor: FrameExtractor,
    private clustering: KMeansClustering
  ) {}

  /**
   * Extract dominant colors from a video
   * 
   * Process:
   * 1. Sample frames evenly throughout video
   * 2. Extract pixel data from frames
   * 3. Run K-means clustering to find dominant colors
   * 4. Convert to Color objects with all formats (hex, rgb, hsl)
   * 5. Sort by dominance (most common first)
   * 
   * @param video - Loaded HTMLVideoElement to analyze
   * @param options - Optional configuration for color extraction
   * @returns Promise resolving to array of dominant colors
   * @throws VideoIntelError if extraction fails
   * 
   * @example
   * ```typescript
   * const extractor = new ColorExtractor(...);
   * 
   * // Extract 5 colors using balanced quality
   * const colors = await extractor.extract(video, {
   *   count: 5,
   *   sampleFrames: 10,
   *   quality: 'balanced'
   * });
   * 
   * // Use the colors
   * colors.forEach(color => {
   *   console.log(`${color.hex} - ${color.percentage.toFixed(1)}% dominant`);
   * });
   * ```
   * 
   * IMPROVEMENT: Could add progress callbacks for long operations
   * IMPROVEMENT: Could support region-of-interest analysis (e.g., center only)
   * IMPROVEMENT: Could filter out near-black/white colors as option
   */
  async extract(video: HTMLVideoElement, options: ColorOptions = {}): Promise<Color[]> {
    // Parse options with defaults
    const {
      count = 5,
      sampleFrames = 10,
      quality = 'balanced',
    } = options;

    // Validate inputs
    this.validateInputs(video, count, sampleFrames);

    try {
      // Step 1: Sample frames evenly throughout video
      const frames = await this.sampleFramesFromVideo(video, sampleFrames);

      // Step 2: Extract pixels from all frames
      const pixels = this.extractPixelsFromFrames(frames, quality);

      // If we got no pixels, something went wrong
      if (pixels.length === 0) {
        throw new VideoIntelError(
          'No pixels extracted from video frames',
          ErrorCode.PROCESSING_ERROR,
          { frameCount: frames.length }
        );
      }

      // Step 3: Run K-means clustering to find dominant colors
      const clusters = this.clustering.cluster(pixels, count, {
        maxIterations: this.getMaxIterations(quality),
        initMethod: 'kmeans++',
        samplingRatio: 1.0, // We already sampled at frame level
      });

      // Step 4: Convert clusters to Color objects
      const colors = this.clustersToColors(clusters);

      // Colors are already sorted by dominance in clustering
      return colors;
    } catch (error) {
      // Wrap any errors in VideoIntelError for consistency
      if (error instanceof VideoIntelError) {
        throw error;
      }

      throw new VideoIntelError(
        `Color extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ErrorCode.PROCESSING_ERROR,
        { originalError: error }
      );
    }
  }

  /**
   * Validate inputs before processing
   * 
   * Checks that all inputs are valid and within expected ranges
   * 
   * @param video - Video element to validate
   * @param count - Number of colors to extract
   * @param sampleFrames - Number of frames to sample
   * @throws VideoIntelError if validation fails
   */
  private validateInputs(
    video: HTMLVideoElement,
    count: number,
    sampleFrames: number
  ): void {
    // Check video is valid and ready
    if (!video || video.readyState < 1) {
      throw new VideoIntelError(
        'Video is not ready. Please wait for metadata to load.',
        ErrorCode.VIDEO_NOT_READY,
        { readyState: video?.readyState }
      );
    }

    // Check video has valid dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      throw new VideoIntelError(
        'Video has invalid dimensions (0x0). The video may be audio-only or corrupted.',
        ErrorCode.VIDEO_NOT_READY,
        { width: video.videoWidth, height: video.videoHeight }
      );
    }

    // Check count is in valid range (2-10)
    if (count < 2 || count > 10) {
      throw new VideoIntelError(
        'Color count must be between 2 and 10',
        ErrorCode.INVALID_INPUT,
        { count, min: 2, max: 10 }
      );
    }

    // Check sampleFrames is reasonable
    if (sampleFrames < 1 || sampleFrames > 100) {
      throw new VideoIntelError(
        'Sample frames must be between 1 and 100',
        ErrorCode.INVALID_INPUT,
        { sampleFrames, min: 1, max: 100 }
      );
    }
  }

  /**
   * Sample frames evenly throughout video
   * 
   * Extracts frames at regular intervals across the entire video duration
   * This ensures we get representative colors from the whole video
   * 
   * @param video - Video element to sample from
   * @param count - Number of frames to extract
   * @returns Promise resolving to array of canvas elements
   * 
   * IMPROVEMENT: Could use smart sampling (avoid black frames, transitions)
   * IMPROVEMENT: Could weight sampling toward middle of video
   */
  private async sampleFramesFromVideo(
    video: HTMLVideoElement,
    count: number
  ): Promise<HTMLCanvasElement[]> {
    // Calculate timestamps evenly distributed across video
    // Example: 60s video, 10 frames = 0s, 6s, 12s, 18s, ..., 54s
    const interval = video.duration / count;
    const timestamps: number[] = [];

    for (let i = 0; i < count; i++) {
      // Start from 1/2 interval to avoid starting at exact 0
      // This helps skip black frames at the very beginning
      const timestamp = (i + 0.5) * interval;
      timestamps.push(Math.min(timestamp, video.duration - 0.1));
    }

    // Use FrameExtractor to extract frames
    // This leverages the existing, well-tested frame extraction code
    const frames = await this.frameExtractor.extractFrames(video, timestamps);

    return frames;
  }

  /**
   * Extract pixel data from frames
   * 
   * Gets pixel data from each canvas and samples based on quality setting
   * Lower quality = fewer pixels sampled = faster but less accurate
   * 
   * @param frames - Array of canvas elements containing frames
   * @param quality - Quality setting ('fast', 'balanced', 'best')
   * @returns Array of RGB pixel values
   * 
   * IMPROVEMENT: Could use adaptive sampling (more samples in colorful regions)
   * IMPROVEMENT: Could filter out edge pixels (often black bars)
   */
  private extractPixelsFromFrames(frames: HTMLCanvasElement[], quality: string): RGB[] {
    const pixels: RGB[] = [];
    const samplingRate = this.getSamplingRate(quality);

    for (const canvas of frames) {
      // Get 2D context
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        continue; // Skip this frame if we can't get context
      }

      // Extract image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Sample pixels based on quality setting
      // ImageData format: [R, G, B, A, R, G, B, A, ...]
      // We skip every Nth pixel based on sampling rate
      const step = Math.max(1, Math.round(1 / samplingRate));

      for (let i = 0; i < data.length; i += 4 * step) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3]; // Alpha channel

        // Skip fully transparent pixels
        if (a === 0) {
          continue;
        }

        pixels.push([r, g, b]);
      }
    }

    return pixels;
  }

  /**
   * Get pixel sampling rate based on quality setting
   * 
   * Higher quality = more pixels analyzed = slower but more accurate
   * Lower quality = fewer pixels analyzed = faster but less accurate
   * 
   * @param quality - Quality setting
   * @returns Sampling ratio (0-1)
   * 
   * Quality trade-offs:
   * - Fast: 10% of pixels, ~1-2 seconds
   * - Balanced: 30% of pixels, ~3-5 seconds
   * - Best: 100% of pixels, ~10-15 seconds
   */
  private getSamplingRate(quality: string): number {
    switch (quality) {
      case 'fast':
        return 0.1; // 10% of pixels
      case 'best':
        return 1.0; // 100% of pixels
      case 'balanced':
      default:
        return 0.3; // 30% of pixels
    }
  }

  /**
   * Get maximum K-means iterations based on quality
   * 
   * @param quality - Quality setting
   * @returns Maximum iterations
   */
  private getMaxIterations(quality: string): number {
    switch (quality) {
      case 'fast':
        return 10;
      case 'best':
        return 50;
      case 'balanced':
      default:
        return 20;
    }
  }

  /**
   * Convert color clusters to Color API objects
   * 
   * Transforms internal ColorCluster objects to the public Color interface
   * Includes hex, RGB, HSL formats and percentage dominance
   * 
   * @param clusters - Array of color clusters from K-means
   * @returns Array of Color objects
   * 
   * IMPROVEMENT: Could add color names (e.g., "Red", "Blue") using color libraries
   */
  private clustersToColors(clusters: Array<{ centroid: RGB; percentage: number }>): Color[] {
    return clusters.map((cluster) => ({
      hex: ColorConverter.rgbToHex(cluster.centroid),
      rgb: cluster.centroid,
      hsl: ColorConverter.rgbToHsl(cluster.centroid),
      percentage: Math.round(cluster.percentage * 10) / 10, // Round to 1 decimal
    }));
  }
}


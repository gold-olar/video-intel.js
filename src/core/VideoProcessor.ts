/**
 * VideoProcessor - Main coordinator for video processing
 */

import type {
  VideoInput,
  AnalysisOptions,
  AnalysisResult,
  ThumbnailOptions,
  Thumbnail,
  SceneOptions,
  Scene,
  VideoMetadata,
  ColorOptions,
  Color,
} from '../types';
import { VideoLoader } from '../utils/VideoLoader';
import { MemoryManager } from '../utils/MemoryManager';
import { FrameExtractor } from './FrameExtractor';
import { SceneDetector, FrameDifferenceCalculator } from '../modules/scenes';
import { ColorExtractor, KMeansClustering } from '../modules/colors';
import { MetadataExtractor } from '../modules/metadata';

export class VideoProcessor {
  private videoLoader: VideoLoader;
  private memoryManager: MemoryManager;
  private frameExtractor: FrameExtractor;

  constructor() {
    this.videoLoader = new VideoLoader();
    this.memoryManager = MemoryManager.getInstance();
    this.frameExtractor = new FrameExtractor();
  }

  /**
   * Analyze video with multiple features
   */
  async analyze(_videoInput: VideoInput, _options: AnalysisOptions = {}): Promise<AnalysisResult> {
    throw new Error('Not implemented yet');
  }

  /**
   * Generate smart thumbnails
   */
  async getThumbnails(_videoInput: VideoInput, _options?: ThumbnailOptions): Promise<Thumbnail[]> {
    throw new Error('Not implemented yet');
  }

  /**
   * Detect scene changes
   * 
   * Analyzes a video to automatically identify scene changes (cuts, transitions).
   * Returns an array of Scene objects with start/end times, thumbnails, and confidence scores.
   * 
   * @param videoInput - Video to analyze (File, Blob, or URL string)
   * @param options - Optional configuration for scene detection
   * @returns Promise resolving to array of detected scenes
   * 
   * @example
   * ```typescript
   * const processor = new VideoProcessor();
   * const scenes = await processor.detectScenes(videoFile, {
   *   minSceneLength: 3,      // Minimum 3 seconds per scene
   *   threshold: 0.3,         // 30% difference triggers scene boundary
   *   includeThumbnails: true // Generate thumbnails for each scene
   * });
   * ```
   */
  async detectScenes(videoInput: VideoInput, options?: SceneOptions): Promise<Scene[]> {
    // Load the video from input
    const video = await this.videoLoader.load(videoInput);

    try {
      // Create scene detector with required dependencies
      const differenceCalculator = new FrameDifferenceCalculator();
      const sceneDetector = new SceneDetector(
        this.frameExtractor,
        differenceCalculator
      );

      // Detect scenes
      const scenes = await sceneDetector.detect(video, options);

      return scenes;
    } finally {
      // Always clean up resources, even if detection fails
      this.memoryManager.cleanupVideo(video);
      this.videoLoader.cleanup();
    }
  }

  /**
   * Extract video metadata
   * 
   * Extracts comprehensive metadata from a video including:
   * - Duration, dimensions, format
   * - Aspect ratio, FPS
   * - Audio/video track presence
   * - File size and bitrate (when available)
   * 
   * @param videoInput - Video to analyze (File, Blob, or URL string)
   * @returns Promise resolving to VideoMetadata object
   * 
   * @example
   * ```typescript
   * const processor = new VideoProcessor();
   * const metadata = await processor.getMetadata(videoFile);
   * 
   * console.log(`Video: ${metadata.width}x${metadata.height}`);
   * console.log(`Duration: ${metadata.duration}s`);
   * console.log(`Aspect Ratio: ${metadata.aspectRatio}`);
   * console.log(`Has Audio: ${metadata.hasAudio}`);
   * ```
   */
  async getMetadata(videoInput: VideoInput): Promise<VideoMetadata> {
    // Load the video from input
    const video = await this.videoLoader.load(videoInput);

    try {
      // Create metadata extractor
      const metadataExtractor = new MetadataExtractor();

      // Extract metadata
      const metadata = await metadataExtractor.extract(video);

      return metadata;
    } finally {
      // Always clean up resources, even if extraction fails
      this.memoryManager.cleanupVideo(video);
      this.videoLoader.cleanup();
    }
  }

  /**
   * Extract dominant colors
   * 
   * Analyzes a video to extract the most dominant colors using K-means clustering.
   * Useful for:
   * - UI theming based on video content
   * - Color palette generation
   * - Video categorization by color
   * 
   * @param videoInput - Video to analyze (File, Blob, or URL string)
   * @param options - Optional configuration for color extraction
   * @returns Promise resolving to array of Color objects sorted by dominance
   * 
   * @example
   * ```typescript
   * const processor = new VideoProcessor();
   * const colors = await processor.extractColors(videoFile, {
   *   count: 5,           // Extract 5 dominant colors
   *   sampleFrames: 10,   // Sample 10 frames from video
   *   quality: 'balanced' // Balance between speed and accuracy
   * });
   * 
   * // Use the colors
   * colors.forEach(color => {
   *   console.log(`${color.hex} - ${color.percentage.toFixed(1)}% of video`);
   * });
   * ```
   */
  async extractColors(videoInput: VideoInput, options?: ColorOptions): Promise<Color[]> {
    // Load the video from input
    const video = await this.videoLoader.load(videoInput);

    try {
      // Create color extractor with required dependencies
      const clustering = new KMeansClustering();
      const colorExtractor = new ColorExtractor(
        this.frameExtractor,
        clustering
      );

      // Extract colors
      const colors = await colorExtractor.extract(video, options);

      return colors;
    } finally {
      // Always clean up resources, even if extraction fails
      this.memoryManager.cleanupVideo(video);
      this.videoLoader.cleanup();
    }
  }
}

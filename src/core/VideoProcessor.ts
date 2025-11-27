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
   */
  async getMetadata(_videoInput: VideoInput): Promise<VideoMetadata> {
    throw new Error('Not implemented yet');
  }

  /**
   * Extract dominant colors
   */
  async extractColors(_videoInput: VideoInput, _options?: ColorOptions): Promise<Color[]> {
    throw new Error('Not implemented yet');
  }
}

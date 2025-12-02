/**
 * VideoIntel.js - Smart Video Analysis Library
 * Main entry point
 */

import { VideoProcessor } from './core/VideoProcessor';
import { ModelLoader } from './models/ModelLoader';
import { WorkerPool } from './workers/WorkerPool';
import type {
  VideoIntelConfig,
  AnalysisOptions,
  AnalysisResult,
  ThumbnailOptions,
  Thumbnail,
  SceneOptions,
  Scene,
  VideoMetadata,
  ColorOptions,
  Color,
  VideoInput,
  FaceOptions,
  FaceDetection,
} from './types';

class VideoIntel {
  private processor: VideoProcessor;
  private modelLoader: ModelLoader;
  private workerPool: WorkerPool;
  private initialized = false;

  constructor() {
    this.processor = new VideoProcessor();
    this.modelLoader = new ModelLoader();
    this.workerPool = new WorkerPool();
  }

  /**
   * Initialize VideoIntel with optional configuration
   */
  async init(config?: VideoIntelConfig): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Initialize worker pool
    const workerCount = config?.workers || navigator.hardwareConcurrency || 4;
    await this.workerPool.init(workerCount);

    // Preload models if specified
    if (config?.models) {
      await this.modelLoader.preload(config.models);
    }

    this.initialized = true;
  }

  /**
   * Analyze video with multiple features
   */
  async analyze(videoInput: VideoInput, options: AnalysisOptions = {}): Promise<AnalysisResult> {
    await this.ensureInitialized();
    return this.processor.analyze(videoInput, options);
  }

  /**
   * Generate smart thumbnails
   */
  async getThumbnails(videoInput: VideoInput, options?: ThumbnailOptions): Promise<Thumbnail[]> {
    await this.ensureInitialized();
    return this.processor.getThumbnails(videoInput, options);
  }

  /**
   * Detect scene changes
   */
  async detectScenes(videoInput: VideoInput, options?: SceneOptions): Promise<Scene[]> {
    await this.ensureInitialized();
    return this.processor.detectScenes(videoInput, options);
  }

  /**
   * Extract video metadata
   */
  async getMetadata(videoInput: VideoInput): Promise<VideoMetadata> {
    await this.ensureInitialized();
    return this.processor.getMetadata(videoInput);
  }

  /**
   * Extract dominant colors
   */
  async extractColors(videoInput: VideoInput, options?: ColorOptions): Promise<Color[]> {
    await this.ensureInitialized();
    return this.processor.extractColors(videoInput, options);
  }

  /**
   * Detect faces in video (Phase 3: NEW!)
   * 
   * Analyzes a video to detect faces in frames at specified intervals.
   * Can return basic counts, bounding box coordinates, and face thumbnails.
   * 
   * @param videoInput - Video to analyze (File, Blob, or URL string)
   * @param options - Optional configuration for face detection
   * @returns Promise resolving to FaceDetection result
   * 
   * @example
   * ```typescript
   * // Basic detection (count only)
   * const result = await VideoIntel.detectFaces(videoFile);
   * console.log(`Faces detected: ${result.detected}`);
   * console.log(`Average faces: ${result.averageCount}`);
   * 
   * // With coordinates
   * const result = await VideoIntel.detectFaces(videoFile, {
   *   confidence: 0.8,
   *   returnCoordinates: true
   * });
   * 
   * // With face thumbnails
   * const result = await VideoIntel.detectFaces(videoFile, {
   *   confidence: 0.7,
   *   returnCoordinates: true,
   *   returnThumbnails: true,
   *   thumbnailFormat: 'jpeg',
   *   thumbnailQuality: 0.9
   * });
   * ```
   */
  async detectFaces(videoInput: VideoInput, options?: FaceOptions): Promise<FaceDetection> {
    await this.ensureInitialized();
    return this.processor.detectFaces(videoInput, options);
  }

  /**
   * Cleanup resources
   */
  async dispose(): Promise<void> {
    await this.workerPool.terminate();
    this.modelLoader.clearCache();
    this.initialized = false;
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.init();
    }
  }
}

// Export singleton instance
const videoIntel = new VideoIntel();

export default videoIntel;
export * from './types';

// Export utility classes for advanced users
export { VideoLoader } from './utils/VideoLoader';
export { FrameExtractor } from './core/FrameExtractor';
export { FrameAnalyzer } from './core/FrameAnalyzer';
export { MemoryManager } from './utils/MemoryManager';

// Export thumbnail generation classes
export { ThumbnailGenerator } from './modules/thumbnails/ThumbnailGenerator';
export { FrameScorer } from './modules/thumbnails/FrameScorer';

// Export scene detection classes
export { SceneDetector } from './modules/scenes/SceneDetector';
export { FrameDifferenceCalculator } from './modules/scenes/FrameDifferenceCalculator';

// Export face detection classes (Phase 3: NEW!)
export { FaceDetector } from './modules/faces/FaceDetector';

// Export model loading classes
export { ModelLoader } from './models/ModelLoader';

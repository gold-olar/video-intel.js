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
export { MemoryManager } from './utils/MemoryManager';

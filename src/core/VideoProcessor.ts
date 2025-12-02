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
  FaceOptions,
  FaceDetection,
} from '../types';
import { VideoLoader } from '../utils/VideoLoader';
import { MemoryManager } from '../utils/MemoryManager';
import { FrameExtractor } from './FrameExtractor';
import { SceneDetector, FrameDifferenceCalculator } from '../modules/scenes';
import { ColorExtractor, KMeansClustering } from '../modules/colors';
import { MetadataExtractor } from '../modules/metadata';
import { ThumbnailGenerator } from '../modules/thumbnails/ThumbnailGenerator';
import { FrameScorer } from '../modules/thumbnails/FrameScorer';
import { FaceDetector } from '../modules/faces';
import { ModelLoader } from '../models/ModelLoader';

export class VideoProcessor {
  private videoLoader: VideoLoader;
  private memoryManager: MemoryManager;
  private frameExtractor: FrameExtractor;
  private modelLoader: ModelLoader;

  constructor() {
    this.videoLoader = new VideoLoader();
    this.memoryManager = MemoryManager.getInstance();
    this.frameExtractor = new FrameExtractor();
    this.modelLoader = new ModelLoader();
  }

  /**
   * Analyze video with multiple features
   * 
   * This is the most efficient way to extract multiple features from a video.
   * It intelligently coordinates the extraction of thumbnails, scenes, colors,
   * and metadata, providing progress tracking across all operations.
   * 
   * @param videoInput - Video to analyze (File, Blob, or URL string)
   * @param options - Configuration for which features to extract
   * @returns Promise resolving to analysis results
   * 
   * @example
   * ```typescript
   * const processor = new VideoProcessor();
   * const result = await processor.analyze(videoFile, {
   *   metadata: true,
   *   thumbnails: { count: 5 },
   *   scenes: { minSceneLength: 3 },
   *   colors: { count: 5 },
   *   onProgress: (progress) => {
   *     console.log(`Analysis: ${progress}% complete`);
   *   }
   * });
   * 
   * console.log(`Duration: ${result.metadata?.duration}s`);
   * console.log(`Found ${result.scenes?.length} scenes`);
   * console.log(`Generated ${result.thumbnails?.length} thumbnails`);
   * ```
   */
  async analyze(videoInput: VideoInput, options: AnalysisOptions = {}): Promise<AnalysisResult> {
    const result: AnalysisResult = {};
    
    // Count requested features for progress tracking
    const totalFeatures = this.countRequestedFeatures(options);
    let completedFeatures = 0;
    
    // Helper to update progress (with error handling)
    const updateProgress = () => {
      if (options.onProgress) {
        try {
          const progress = Math.round((completedFeatures / totalFeatures) * 100);
          options.onProgress(progress);
        } catch (error) {
          // Silently ignore progress callback errors - they shouldn't break analysis
          console.warn('Progress callback error:', error);
        }
      }
    };
    
    // Report initial progress
    if (options.onProgress) {
      try {
        options.onProgress(0);
      } catch (error) {
        console.warn('Progress callback error:', error);
      }
    }
    
    // Extract metadata (fast operation, do first)
    if (options.metadata) {
      result.metadata = await this.getMetadata(videoInput);
      completedFeatures++;
      updateProgress();
    }
    
    // Extract thumbnails
    if (options.thumbnails) {
      const thumbnailOpts = typeof options.thumbnails === 'boolean' 
        ? undefined 
        : options.thumbnails;
      result.thumbnails = await this.getThumbnails(videoInput, thumbnailOpts);
      completedFeatures++;
      updateProgress();
    }
    
    // Detect scenes
    if (options.scenes) {
      const sceneOpts = typeof options.scenes === 'boolean' 
        ? undefined 
        : options.scenes;
      result.scenes = await this.detectScenes(videoInput, sceneOpts);
      completedFeatures++;
      updateProgress();
    }
    
    // Extract colors
    if (options.colors) {
      const colorOpts = typeof options.colors === 'boolean' 
        ? undefined 
        : options.colors;
      result.colors = await this.extractColors(videoInput, colorOpts);
      completedFeatures++;
      updateProgress();
    }
    
    // Detect faces (Phase 3: NEW!)
    if (options.faces) {
      const faceOpts = typeof options.faces === 'boolean' 
        ? undefined 
        : options.faces;
      result.faces = await this.detectFaces(videoInput, faceOpts);
      completedFeatures++;
      updateProgress();
    }
    
    // Report completion
    if (options.onProgress) {
      try {
        options.onProgress(100);
      } catch (error) {
        console.warn('Progress callback error:', error);
      }
    }
    
    return result;
  }
  
  /**
   * Count how many features are requested in the options.
   * Used for progress calculation.
   * 
   * @param options - Analysis options
   * @returns Number of requested features
   */
  private countRequestedFeatures(options: AnalysisOptions): number {
    let count = 0;
    if (options.metadata) count++;
    if (options.thumbnails) count++;
    if (options.scenes) count++;
    if (options.colors) count++;
    // Phase 2 features (not yet implemented)
    if (options.faces) count++;
    if (options.objects) count++;
    if (options.quality) count++;
    if (options.safety) count++;
    return Math.max(count, 1); // At least 1 to avoid division by zero
  }

  /**
   * Generate smart thumbnails
   * 
   * Analyzes a video to automatically select the best frames to use as thumbnails.
   * Uses intelligent quality scoring to filter out black frames, blurry frames,
   * and other unsuitable content.
   * 
   * @param videoInput - Video to analyze (File, Blob, or URL string)
   * @param options - Optional configuration for thumbnail generation
   * @returns Promise resolving to array of high-quality thumbnails
   * 
   * @example
   * ```typescript
   * const processor = new VideoProcessor();
   * const thumbnails = await processor.getThumbnails(videoFile, {
   *   count: 5,           // Generate 5 thumbnails
   *   quality: 0.9,       // High JPEG quality
   *   format: 'jpeg',     // Output as JPEG
   *   size: { width: 640 } // Resize to 640px wide
   * });
   * 
   * // Use the thumbnails
   * thumbnails.forEach(thumb => {
   *   console.log(`Thumbnail at ${thumb.timestamp}s with score ${thumb.score}`);
   * });
   * ```
   */
  async getThumbnails(videoInput: VideoInput, options?: ThumbnailOptions): Promise<Thumbnail[]> {
    // Load the video from input
    const video = await this.videoLoader.load(videoInput);

    try {
      // Create thumbnail generator with required dependencies
      const generator = new ThumbnailGenerator(
        this.frameExtractor,
        new FrameScorer()
      );

      // Generate thumbnails
      const thumbnails = await generator.generate(video, options);

      return thumbnails;
    } finally {
      // Always clean up resources, even if generation fails
      this.memoryManager.cleanupVideo(video);
      this.videoLoader.cleanup();
    }
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

  /**
   * Detect faces in video (Phase 3: NEW!)
   * 
   * Analyzes a video to detect faces in frames at specified intervals.
   * Uses face-api.js with TinyFaceDetector model for fast, accurate detection.
   * 
   * Features:
   * - Configurable confidence threshold
   * - Optional bounding box coordinates
   * - Optional face thumbnails (cropped face images)
   * - Configurable sampling rate
   * 
   * Use cases:
   * - Count people in video
   * - Create face galleries
   * - Content moderation
   * - Find specific people
   * - Analyze face presence over time
   * 
   * @param videoInput - Video to analyze (File, Blob, or URL string)
   * @param options - Optional configuration for face detection
   * @returns Promise resolving to FaceDetection result
   * 
   * @example
   * ```typescript
   * const processor = new VideoProcessor();
   * 
   * // Basic detection (count only)
   * const result = await processor.detectFaces(videoFile);
   * console.log(`Faces detected: ${result.detected}`);
   * console.log(`Average faces per frame: ${result.averageCount}`);
   * 
   * // With coordinates
   * const result = await processor.detectFaces(videoFile, {
   *   confidence: 0.8,
   *   returnCoordinates: true,
   *   samplingRate: 1.0  // Check every second
   * });
   * 
   * // With face thumbnails
   * const result = await processor.detectFaces(videoFile, {
   *   confidence: 0.7,
   *   returnCoordinates: true,
   *   returnThumbnails: true,
   *   thumbnailFormat: 'jpeg',
   *   thumbnailQuality: 0.9
   * });
   * 
   * // Display faces
   * result.frames.forEach(frame => {
   *   console.log(`At ${frame.timestamp}s: ${frame.faces.length} faces`);
   *   frame.faces.forEach(face => {
   *     console.log(`  Face at (${face.x}, ${face.y})`);
   *     if (face.thumbnail) {
   *       // Display or save thumbnail
   *       const url = URL.createObjectURL(face.thumbnail);
   *       console.log(`  Thumbnail: ${url}`);
   *     }
   *   });
   * });
   * ```
   */
  async detectFaces(videoInput: VideoInput, options?: FaceOptions): Promise<FaceDetection> {
    // Load the video from input
    const video = await this.videoLoader.load(videoInput);

    try {
      // Create face detector with required dependencies
      // - FrameExtractor: For extracting frames from video
      // - ModelLoader: For loading face detection models
      const faceDetector = new FaceDetector(
        this.frameExtractor,
        this.modelLoader
      );

      // Detect faces
      // This will:
      // 1. Load face detection model (if not already loaded)
      // 2. Extract frames at specified sampling rate
      // 3. Detect faces in each frame
      // 4. Optionally extract face thumbnails
      // 5. Return aggregated results
      const result = await faceDetector.detect(video, options);

      return result;
    } finally {
      // Always clean up resources, even if detection fails
      // Note: We don't clear the model cache here because it's shared
      // across multiple calls and expensive to reload
      this.memoryManager.cleanupVideo(video);
      this.videoLoader.cleanup();
    }
  }
}

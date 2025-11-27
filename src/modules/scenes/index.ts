/**
 * Scenes Module - Scene detection and video segmentation
 * 
 * This module provides comprehensive scene detection functionality for videos.
 * It can automatically identify scene changes (cuts, transitions) and segment
 * videos into meaningful scenes with thumbnails.
 * 
 * Main exports:
 * - SceneDetector: Main class for detecting scenes
 * - FrameDifferenceCalculator: Utility for comparing frames
 * - Scene types and interfaces
 * 
 * @module modules/scenes
 * 
 * @example
 * ```typescript
 * import { SceneDetector } from 'videointel/modules/scenes';
 * import { FrameExtractor } from 'videointel/core';
 * 
 * const extractor = new FrameExtractor();
 * const detector = new SceneDetector(extractor);
 * 
 * const scenes = await detector.detect(video, {
 *   minSceneLength: 3,
 *   threshold: 0.3,
 *   includeThumbnails: true
 * });
 * ```
 */

// Export main classes
export { SceneDetector } from './SceneDetector';
export { FrameDifferenceCalculator } from './FrameDifferenceCalculator';

// Export all types
export type {
  SceneDetailed,
  FrameDifference,
  SceneBoundary,
  DifferenceOptions,
  SceneDetectionStats,
  ExtractedFrameWithData,
  SmoothingConfig
} from './types';

// Re-export base Scene types from main types for convenience
export type { Scene, SceneOptions } from '../../types';


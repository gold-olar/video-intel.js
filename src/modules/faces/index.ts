/**
 * Face Detection Module
 * 
 * This module provides face detection capabilities for videos.
 * 
 * Features:
 * - Detect faces in video frames with configurable confidence threshold
 * - Return bounding box coordinates for detected faces
 * - Extract face thumbnails (cropped face images with padding)
 * - Configurable sampling rate and thumbnail options
 * 
 * Usage:
 * ```typescript
 * import { FaceDetector } from './modules/faces';
 * 
 * const detector = new FaceDetector(frameExtractor, modelLoader);
 * const result = await detector.detect(video, {
 *   confidence: 0.7,
 *   returnCoordinates: true,
 *   returnThumbnails: true
 * });
 * ```
 * 
 * @module modules/faces
 */

// Export main FaceDetector class
export { FaceDetector } from './FaceDetector';

// Export internal types (for advanced usage)
export type {
  FaceThumbnailOptions,
  RawFaceDetection,
  FaceDetectionProgress,
  // Future types (commented out until implemented)
  // TrackedFace,
  // RecognizedFace,
  // FaceQuality,
} from './types';

// Re-export public types from main types file for convenience
// This allows users to import everything face-related from one place
export type {
  FaceOptions,
  FaceDetection,
  FaceFrame,
  Face,
} from '../../types';


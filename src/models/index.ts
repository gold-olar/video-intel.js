/**
 * Models Module - ML model loading and management
 * 
 * This module exports model loading functionality and configuration
 * for machine learning powered video analysis features.
 * 
 * @module models
 */

export { ModelLoader } from './ModelLoader';
export type { FaceModelOptions } from './ModelLoader';
export {
  getModelConfig,
  checkBrowserCompatibility,
  estimateLoadingTime,
  CDN_URLS,
  RETRY_CONFIG,
  PERFORMANCE_RECOMMENDATIONS,
  DEFAULT_MODEL_TYPE,
  TINY_FACE_DETECTOR_CONFIG,
  SSD_MOBILENET_CONFIG,
} from './faceModelConfig';
export type { FaceModelType, FaceModelConfig } from './faceModelConfig';


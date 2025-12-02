/**
 * Face Detection Model Configuration
 * 
 * This module provides centralized configuration for face detection models,
 * including CDN URLs, model characteristics, and browser compatibility information.
 * 
 * @module models/faceModelConfig
 */

/**
 * Model types supported by VideoIntel.js face detection
 */
export type FaceModelType = 'tiny' | 'ssd';

/**
 * Model configuration interface
 */
export interface FaceModelConfig {
  /** Base URL for model weights (CDN or local) */
  baseUrl: string;
  /** Model size in bytes */
  sizeBytes: number;
  /** Estimated loading time on fast connection (milliseconds) */
  estimatedLoadTime: number;
  /** Estimated inference time per frame (milliseconds) */
  estimatedInferenceTime: number;
  /** Minimum browser versions required */
  browserSupport: {
    chrome: number;
    firefox: number;
    safari: number;
    edge: number;
  };
  /** Model description */
  description: string;
}

/**
 * CDN configuration for face-api.js models
 * 
 * Primary: jsDelivr CDN (fast, reliable, global)
 * Fallback: unpkg CDN (backup option)
 */
export const CDN_URLS = {
  primary: 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights',
  fallback: 'https://unpkg.com/face-api.js@0.22.2/weights',
} as const;

/**
 * TinyFaceDetector model configuration
 * 
 * Characteristics:
 * - Smallest model (~190KB)
 * - Fastest inference (~50-100ms per frame on modern hardware)
 * - Good accuracy for most use cases
 * - Recommended for most applications
 */
export const TINY_FACE_DETECTOR_CONFIG: FaceModelConfig = {
  baseUrl: CDN_URLS.primary,
  sizeBytes: 190 * 1024, // ~190KB
  estimatedLoadTime: 1500, // 1.5 seconds on fast connection
  estimatedInferenceTime: 75, // 75ms average per frame
  browserSupport: {
    chrome: 57, // Chrome 57+ (March 2017)
    firefox: 52, // Firefox 52+ (March 2017)
    safari: 11, // Safari 11+ (September 2017)
    edge: 79, // Edge 79+ (Chromium-based, January 2020)
  },
  description: 'Lightweight face detector with good accuracy. Best for real-time applications.',
};

/**
 * SSD MobileNet V1 model configuration
 * 
 * Characteristics:
 * - Larger model (~5MB)
 * - Slower inference (~200-400ms per frame)
 * - Better accuracy, especially for small/angled faces
 * - Recommended for high-accuracy requirements
 * 
 * Note: Not implemented yet, reserved for future enhancement
 */
export const SSD_MOBILENET_CONFIG: FaceModelConfig = {
  baseUrl: CDN_URLS.primary,
  sizeBytes: 5 * 1024 * 1024, // ~5MB
  estimatedLoadTime: 3000, // 3 seconds on fast connection
  estimatedInferenceTime: 300, // 300ms average per frame
  browserSupport: {
    chrome: 57,
    firefox: 52,
    safari: 11,
    edge: 79,
  },
  description: 'Higher accuracy face detector. Better for challenging conditions and small faces.',
};

/**
 * Get model configuration by type
 */
export function getModelConfig(modelType: FaceModelType): FaceModelConfig {
  switch (modelType) {
    case 'tiny':
      return TINY_FACE_DETECTOR_CONFIG;
    case 'ssd':
      return SSD_MOBILENET_CONFIG;
    default:
      return TINY_FACE_DETECTOR_CONFIG;
  }
}

/**
 * Default model type to use
 */
export const DEFAULT_MODEL_TYPE: FaceModelType = 'tiny';

/**
 * Model loading retry configuration
 */
export const RETRY_CONFIG = {
  /** Maximum number of retry attempts */
  maxRetries: 3,
  /** Initial delay before first retry (milliseconds) */
  initialDelayMs: 1000,
  /** Multiplier for exponential backoff */
  backoffMultiplier: 2,
} as const;

/**
 * Browser compatibility check
 * 
 * Checks if the current browser meets minimum requirements for face detection.
 * This is a basic check - face-api.js will do more thorough validation.
 */
export function checkBrowserCompatibility(): {
  supported: boolean;
  reason?: string;
} {
  // Check for required browser APIs
  if (typeof HTMLCanvasElement === 'undefined') {
    return {
      supported: false,
      reason: 'HTMLCanvasElement not available',
    };
  }

  if (typeof HTMLVideoElement === 'undefined') {
    return {
      supported: false,
      reason: 'HTMLVideoElement not available',
    };
  }

  // Check for Canvas 2D context
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return {
        supported: false,
        reason: 'Canvas 2D context not available',
      };
    }
  } catch (error) {
    return {
      supported: false,
      reason: 'Canvas API error',
    };
  }

  return { supported: true };
}

/**
 * Calculate expected loading time based on connection speed
 * 
 * @param modelType - Type of model to load
 * @param connectionSpeed - Estimated download speed in Mbps (optional)
 * @returns Estimated loading time in milliseconds
 */
export function estimateLoadingTime(
  modelType: FaceModelType,
  connectionSpeed?: number
): number {
  const config = getModelConfig(modelType);
  
  // If no connection speed provided, use conservative estimate
  if (!connectionSpeed) {
    return config.estimatedLoadTime;
  }
  
  // Calculate based on model size and connection speed
  // Convert Mbps to bytes per second: Mbps * 1000000 / 8
  const bytesPerSecond = (connectionSpeed * 1000000) / 8;
  const downloadTimeMs = (config.sizeBytes / bytesPerSecond) * 1000;
  
  // Add 500ms overhead for parsing and initialization
  return Math.ceil(downloadTimeMs + 500);
}

/**
 * Performance recommendations based on model type
 */
export const PERFORMANCE_RECOMMENDATIONS = {
  tiny: {
    samplingRate: 2, // Check every 2 seconds
    maxVideoLength: 600, // 10 minutes
    recommendedFor: 'Real-time analysis, long videos, mobile devices',
  },
  ssd: {
    samplingRate: 3, // Check every 3 seconds (slower inference)
    maxVideoLength: 300, // 5 minutes
    recommendedFor: 'High-accuracy requirements, short videos, desktop only',
  },
} as const;


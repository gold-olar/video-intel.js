/**
 * ModelLoader - Lazy load ML models for video analysis
 * 
 * This module handles loading and caching of machine learning models used
 * for face detection and other ML-powered features. It provides:
 * - Lazy loading (load on first use)
 * - Model caching to avoid redundant downloads
 * - Retry logic with exponential backoff for network failures
 * - Support for CDN and custom model URLs
 * - Browser compatibility checks
 * 
 * @module models/ModelLoader
 */

import * as faceapi from 'face-api.js';
import { VideoIntelError, ErrorCode } from '../types';
import {
  getModelConfig,
  checkBrowserCompatibility,
  RETRY_CONFIG,
  DEFAULT_MODEL_TYPE,
  CDN_URLS,
  type FaceModelType,
} from './faceModelConfig';

/**
 * Options for loading face detection models
 */
export interface FaceModelOptions {
  /** URL to load models from (defaults to CDN) */
  modelUrl?: string;
  /** Type of model to load ('tiny' | 'ssd') */
  modelType?: FaceModelType;
  /** Force reload even if already cached */
  forceReload?: boolean;
}

/**
 * Internal state for face detection models
 */
interface FaceModelState {
  /** Whether the model is loaded */
  loaded: boolean;
  /** Type of loaded model */
  modelType?: FaceModelType;
  /** URL models were loaded from */
  loadedFrom?: string;
  /** Timestamp when model was loaded */
  loadedAt?: number;
}

/**
 * ModelLoader class
 * 
 * Manages loading and caching of ML models for video analysis features.
 * Implements retry logic and error handling for robust model loading.
 * 
 * @example
 * ```typescript
 * const loader = new ModelLoader();
 * 
 * // Load face detection model
 * await loader.loadFaceDetectionModel();
 * 
 * // Get loaded model for use
 * const model = loader.getFaceDetectionModel();
 * 
 * // Preload multiple models
 * await loader.preload(['faces']);
 * ```
 */
export class ModelLoader {
  /** General purpose cache for various models */
  private cache = new Map<string, unknown>();
  
  /** Face detection model state */
  private faceModelState: FaceModelState = {
    loaded: false,
  };

  /**
   * Load face detection model with retry logic
   * 
   * This method:
   * 1. Checks browser compatibility
   * 2. Checks if model is already loaded (uses cache)
   * 3. Loads model from CDN or custom URL
   * 4. Retries up to 3 times with exponential backoff on failure
   * 5. Caches the loaded model
   * 
   * @param options - Configuration for model loading
   * @throws {VideoIntelError} If model loading fails after all retries
   * 
   * @example
   * ```typescript
   * // Load default model (TinyFaceDetector from CDN)
   * await loader.loadFaceDetectionModel();
   * 
   * // Load specific model type
   * await loader.loadFaceDetectionModel({ modelType: 'ssd' });
   * 
   * // Load from custom URL
   * await loader.loadFaceDetectionModel({ 
   *   modelUrl: 'https://my-cdn.com/models' 
   * });
   * 
   * // Force reload even if cached
   * await loader.loadFaceDetectionModel({ forceReload: true });
   * ```
   */
  async loadFaceDetectionModel(options: FaceModelOptions = {}): Promise<void> {
    const modelType = options.modelType || DEFAULT_MODEL_TYPE;
    const modelUrl = options.modelUrl || getModelConfig(modelType).baseUrl;

    // Check if already loaded (and not forcing reload)
    if (this.faceModelState.loaded && !options.forceReload) {
      // Check if it's the same model type and URL
      if (
        this.faceModelState.modelType === modelType &&
        this.faceModelState.loadedFrom === modelUrl
      ) {
        return; // Already loaded, no need to reload
      }
    }

    // Check browser compatibility
    const compatibility = checkBrowserCompatibility();
    if (!compatibility.supported) {
      throw new VideoIntelError(
        `Browser not compatible with face detection: ${compatibility.reason}`,
        ErrorCode.MODEL_LOAD_ERROR,
        { reason: compatibility.reason }
      );
    }

    // Ensure we're using absolute URL
    const absoluteModelUrl = modelUrl.startsWith('http') 
      ? modelUrl 
      : CDN_URLS.primary;

    // Load model with retry logic
    await this.loadWithRetry(async (urlToUse: string) => {
      try {
        console.log(`🔄 Loading face detection model (${modelType}) from: ${urlToUse}`);

        // Load the appropriate model based on type
        if (modelType === 'tiny') {
          await faceapi.nets.tinyFaceDetector.loadFromUri(urlToUse);
        } else if (modelType === 'ssd') {
          await faceapi.nets.ssdMobilenetv1.loadFromUri(urlToUse);
        } else {
          throw new VideoIntelError(
            `Unknown model type: ${modelType}`,
            ErrorCode.MODEL_LOAD_ERROR,
            { modelType }
          );
        }

        // Verify model loaded successfully
        const isLoaded = modelType === 'tiny' 
          ? faceapi.nets.tinyFaceDetector.isLoaded 
          : faceapi.nets.ssdMobilenetv1.isLoaded;

        if (!isLoaded) {
          throw new VideoIntelError(
            'Model loaded but verification failed',
            ErrorCode.MODEL_LOAD_ERROR,
            { modelType, modelUrl: urlToUse }
          );
        }

        console.log(`✅ Face detection model loaded successfully from ${urlToUse}`);

        // Update state
        this.faceModelState = {
          loaded: true,
          modelType,
          loadedFrom: urlToUse,
          loadedAt: Date.now(),
        };

      } catch (error) {
        // Wrap any errors in VideoIntelError
        if (error instanceof VideoIntelError) {
          throw error;
        }
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ Model loading error:', errorMessage);
        
        throw new VideoIntelError(
          `Failed to load face detection model: ${errorMessage}. Check console for details.`,
          ErrorCode.MODEL_LOAD_ERROR,
          { 
            modelType, 
            modelUrl, 
            originalError: error 
          }
        );
      }
    }, absoluteModelUrl, modelType);
  }

  /**
   * Get the loaded face detection model
   * 
   * Returns the face-api.js nets object for performing face detection.
   * You must call loadFaceDetectionModel() before calling this method.
   * 
   * @returns The face-api.js model object
   * @throws {VideoIntelError} If model is not loaded
   * 
   * @example
   * ```typescript
   * await loader.loadFaceDetectionModel();
   * const model = loader.getFaceDetectionModel();
   * 
   * // Use model for detection
   * const detections = await faceapi.detectAllFaces(
   *   canvas, 
   *   new faceapi.TinyFaceDetectorOptions()
   * );
   * ```
   */
  getFaceDetectionModel(): typeof faceapi.nets {
    if (!this.faceModelState.loaded) {
      throw new VideoIntelError(
        'Face detection model not loaded. Call loadFaceDetectionModel() first.',
        ErrorCode.MODEL_LOAD_ERROR,
        { loaded: false }
      );
    }

    return faceapi.nets;
  }

  /**
   * Check if face detection model is loaded
   * 
   * @returns true if model is loaded and ready to use
   */
  isFaceModelLoaded(): boolean {
    return this.faceModelState.loaded;
  }

  /**
   * Get information about the loaded face detection model
   * 
   * @returns Model state information, or null if not loaded
   */
  getFaceModelInfo(): FaceModelState | null {
    if (!this.faceModelState.loaded) {
      return null;
    }
    return { ...this.faceModelState };
  }

  /**
   * Preload specified models
   * 
   * This method allows preloading models before they're needed, which
   * improves the user experience by avoiding loading delays later.
   * 
   * @param models - Array of model identifiers to preload
   * @throws {VideoIntelError} If any model fails to load
   * 
   * @example
   * ```typescript
   * const loader = new ModelLoader();
   * 
   * // Preload face detection model
   * await loader.preload(['faces']);
   * 
   * // Later, model is already loaded
   * const model = loader.getFaceDetectionModel(); // instant
   * ```
   */
  async preload(models: string[]): Promise<void> {
    const loadPromises: Promise<void>[] = [];

    for (const model of models) {
      if (model === 'faces' || model === 'face' || model === 'face-detection') {
        loadPromises.push(this.loadFaceDetectionModel());
      }
      // Future: Add other model types here
      // else if (model === 'objects') { ... }
      // else if (model === 'safety') { ... }
    }

    // Load all models in parallel
    await Promise.all(loadPromises);
  }

  /**
   * Clear model cache and release memory
   * 
   * This will dispose of loaded models and clear the cache.
   * You'll need to reload models before using them again.
   * 
   * @example
   * ```typescript
   * // After analysis is complete
   * loader.clearCache();
   * ```
   */
  clearCache(): void {
    // Clear general cache
    this.cache.clear();

    // Dispose face detection models
    if (this.faceModelState.loaded) {
      try {
        if (this.faceModelState.modelType === 'tiny') {
          faceapi.nets.tinyFaceDetector.dispose();
        } else if (this.faceModelState.modelType === 'ssd') {
          faceapi.nets.ssdMobilenetv1.dispose();
        }
      } catch (error) {
        console.warn('Error disposing face detection model:', error);
      }

      // Reset state
      this.faceModelState = {
        loaded: false,
      };
    }
  }

  /**
   * Load with retry logic and exponential backoff
   * 
   * Attempts to load a model up to 3 times with exponential backoff.
   * On final attempt, tries fallback CDN.
   * 
   * @param loadFn - Async function that performs the actual loading
   * @param primaryUrl - Primary URL being loaded from
   * @param modelType - Type of model being loaded
   * @throws {VideoIntelError} If all retry attempts fail
   * 
   * @private
   */
  private async loadWithRetry(
    loadFn: (url: string) => Promise<void>,
    primaryUrl: string,
    modelType: FaceModelType = 'tiny'
  ): Promise<void> {
    const { maxRetries, initialDelayMs, backoffMultiplier } = RETRY_CONFIG;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Try fallback URL on last attempt if using primary CDN
        let urlToTry = primaryUrl;
        if (attempt === maxRetries && primaryUrl === CDN_URLS.primary) {
          urlToTry = CDN_URLS.fallback;
          console.warn(`🔄 Final attempt: trying fallback CDN: ${urlToTry}`);
        }

        await loadFn(urlToTry);
        return; // Success!
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // If this was the last attempt, throw the error
        if (attempt === maxRetries) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = initialDelayMs * Math.pow(backoffMultiplier, attempt);
        
        console.warn(
          `⚠️ Model loading attempt ${attempt + 1}/${maxRetries + 1} failed. Retrying in ${delay}ms...`,
          lastError.message
        );

        // Wait before retrying
        await this.sleep(delay);
      }
    }

    // All retries failed
    throw new VideoIntelError(
      `Failed to load model after ${maxRetries + 1} attempts: ${lastError?.message || 'Unknown error'}. CDNs may be unreachable.`,
      ErrorCode.MODEL_LOAD_ERROR,
      {
        attempts: maxRetries + 1,
        primaryUrl,
        fallbackUrl: CDN_URLS.fallback,
        lastError: lastError?.message,
      }
    );
  }

  /**
   * Sleep utility for retry delays
   * 
   * @param ms - Milliseconds to sleep
   * @returns Promise that resolves after delay
   * 
   * @private
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

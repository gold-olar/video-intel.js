/**
 * VideoLoader - Responsible for loading videos from various input sources
 * 
 * This module handles loading videos from File objects, Blob objects, or URL strings
 * and returns a fully loaded HTMLVideoElement ready for processing.
 * 
 * Features:
 * - Multiple input types (File, Blob, URL string)
 * - File size validation (max 500MB)
 * - Proper error handling with descriptive messages
 * - Memory cleanup (object URL revocation)
 * - Timeout protection (30 seconds default)
 */

import { VideoInput, VideoIntelError, ErrorCode } from '../types';

/**
 * Maximum allowed file size in bytes (500MB)
 * This prevents memory issues with extremely large videos
 */
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB in bytes

/**
 * Default timeout for video loading operations (30 seconds)
 * Prevents infinite waiting if video fails to load
 */
const DEFAULT_LOAD_TIMEOUT = 30000; // 30 seconds

/**
 * VideoLoader class
 * 
 * Handles the creation and loading of HTMLVideoElement from various input sources.
 * Manages object URL lifecycle and provides cleanup functionality.
 */
export class VideoLoader {
  /**
   * Array to track object URLs created during loading
   * These need to be revoked later to prevent memory leaks
   */
  private objectURLs: string[] = [];

  /**
   * Load a video from File, Blob, or URL string
   * 
   * @param input - The video source (File, Blob, or URL string)
   * @returns Promise that resolves to a loaded HTMLVideoElement
   * @throws VideoIntelError if loading fails
   * 
   * @example
   * ```typescript
   * const loader = new VideoLoader();
   * const video = await loader.load(file);
   * // Use video for processing
   * loader.cleanup(); // Clean up when done
   * ```
   */
  async load(input: VideoInput): Promise<HTMLVideoElement> {
    // Step 1: Validate input
    this.validateInput(input);

    // Step 2: Validate file size if input is File or Blob
    if (input instanceof File || input instanceof Blob) {
      this.validateFileSize(input);
    }

    // Step 3: Get the video URL (create object URL if needed)
    const videoUrl = this.getVideoUrl(input);

    // Step 4: Create and configure video element
    const video = this.createVideoElement();

    // Step 5: Load the video with timeout protection
    try {
      await this.loadVideoElement(video, videoUrl);
      return video;
    } catch (error) {
      // Clean up on error
      this.cleanup();
      throw error;
    }
  }

  /**
   * Validate that the input is not null/undefined and is of correct type
   * 
   * @param input - The input to validate
   * @throws VideoIntelError if input is invalid
   */
  private validateInput(input: VideoInput): void {
    // Check for null/undefined first
    if (input === null || input === undefined) {
      throw new VideoIntelError(
        'Video input is required. Please provide a File, Blob, or URL string.',
        ErrorCode.INVALID_INPUT
      );
    }

    // Check if input is one of the supported types
    const isValidType =
      input instanceof File ||
      input instanceof Blob ||
      typeof input === 'string';

    if (!isValidType) {
      throw new VideoIntelError(
        'Invalid input type. Expected File, Blob, or URL string.',
        ErrorCode.INVALID_INPUT,
        { inputType: typeof input }
      );
    }

    // Validate URL string format (check for empty string)
    if (typeof input === 'string' && input.trim().length === 0) {
      throw new VideoIntelError(
        'Video URL cannot be empty.',
        ErrorCode.INVALID_INPUT
      );
    }
  }

  /**
   * Validate that the file size is within acceptable limits
   * 
   * @param file - The File or Blob to validate
   * @throws VideoIntelError if file is too large
   */
  private validateFileSize(file: File | Blob): void {
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = Math.round(file.size / 1024 / 1024);
      const maxSizeMB = Math.round(MAX_FILE_SIZE / 1024 / 1024);

      throw new VideoIntelError(
        `File size (${sizeMB}MB) exceeds maximum allowed size (${maxSizeMB}MB). Please use a smaller video file.`,
        ErrorCode.INVALID_INPUT,
        { fileSize: file.size, maxSize: MAX_FILE_SIZE }
      );
    }

    // Also validate that the file is not empty
    if (file.size === 0) {
      throw new VideoIntelError(
        'Video file is empty (0 bytes). Please provide a valid video file.',
        ErrorCode.INVALID_INPUT
      );
    }
  }

  /**
   * Get a video URL from the input source
   * Creates an object URL for File/Blob, returns string URL as-is
   * 
   * @param input - The video source
   * @returns URL string that can be used as video src
   */
  private getVideoUrl(input: VideoInput): string {
    if (typeof input === 'string') {
      // Input is already a URL string
      return input;
    }

    // Input is File or Blob - create object URL
    try {
      const objectUrl = URL.createObjectURL(input);
      
      // Track the object URL so we can revoke it later
      this.objectURLs.push(objectUrl);
      
      return objectUrl;
    } catch (error) {
      throw new VideoIntelError(
        'Failed to create object URL from file/blob. The file may be corrupted.',
        ErrorCode.PROCESSING_ERROR,
        error
      );
    }
  }

  /**
   * Create and configure an HTMLVideoElement
   * 
   * @returns A configured video element (not yet loaded)
   */
  private createVideoElement(): HTMLVideoElement {
    const video = document.createElement('video');

    // Configure video element attributes
    // preload: 'metadata' loads just enough info to get dimensions and duration
    video.preload = 'metadata';
    
    // muted: true helps avoid autoplay restrictions in some browsers
    video.muted = true;
    
    // crossOrigin: 'anonymous' enables CORS for videos from different origins
    // This allows us to process the video data with canvas
    video.crossOrigin = 'anonymous';
    
    // playsInline: prevents fullscreen on mobile devices
    video.playsInline = true;

    return video;
  }

  /**
   * Load the video element and wait for it to be ready
   * Uses Promise-based approach to handle async video loading
   * 
   * @param video - The video element to load
   * @param url - The video URL to load
   * @throws VideoIntelError if loading fails or times out
   */
  private async loadVideoElement(
    video: HTMLVideoElement,
    url: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // Track if the promise has been settled
      // This prevents multiple resolve/reject calls
      let isSettled = false;

      /**
       * Timeout handler
       * Rejects the promise if video doesn't load within timeout period
       */
      const timeoutId = setTimeout(() => {
        if (!isSettled) {
          isSettled = true;
          cleanup();
          reject(
            new VideoIntelError(
              `Video loading timed out after ${DEFAULT_LOAD_TIMEOUT / 1000} seconds. The file may be too large or the network connection is slow.`,
              ErrorCode.TIMEOUT_ERROR,
              { url, timeout: DEFAULT_LOAD_TIMEOUT }
            )
          );
        }
      }, DEFAULT_LOAD_TIMEOUT);

      /**
       * Success handler
       * Called when video metadata has loaded successfully
       */
      const onLoadedMetadata = () => {
        if (!isSettled) {
          isSettled = true;
          cleanup();
          resolve();
        }
      };

      /**
       * Error handler
       * Called when video loading fails
       */
      const onError = () => {
        if (!isSettled) {
          isSettled = true;
          cleanup();

          // Get detailed error information from the video element
          const error = video.error;
          let errorMessage = 'Failed to load video.';
          let errorCode = ErrorCode.PROCESSING_ERROR;

          if (error) {
            // Map native MediaError codes to our error codes
            switch (error.code) {
              case error.MEDIA_ERR_ABORTED:
                errorMessage = 'Video loading was aborted. Please try again.';
                errorCode = ErrorCode.PROCESSING_ERROR;
                break;
              case error.MEDIA_ERR_NETWORK:
                errorMessage = 'Network error while loading video. Please check your connection and try again.';
                errorCode = ErrorCode.PROCESSING_ERROR;
                break;
              case error.MEDIA_ERR_DECODE:
                errorMessage = 'Failed to decode video. The file may be corrupted or in an unsupported format.';
                errorCode = ErrorCode.UNSUPPORTED_FORMAT;
                break;
              case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                errorMessage = 'Video format not supported by this browser. Please try MP4, WebM, or OGG format.';
                errorCode = ErrorCode.UNSUPPORTED_FORMAT;
                break;
              default:
                errorMessage = `Video loading error: ${error.message || 'Unknown error'}`;
            }
          }

          reject(
            new VideoIntelError(errorMessage, errorCode, {
              url,
              nativeError: error,
            })
          );
        }
      };

      /**
       * Cleanup function
       * Removes event listeners and clears timeout
       */
      const cleanup = () => {
        clearTimeout(timeoutId);
        video.removeEventListener('loadedmetadata', onLoadedMetadata);
        video.removeEventListener('error', onError);
      };

      // Attach event listeners BEFORE setting src
      // This ensures we don't miss any events
      video.addEventListener('loadedmetadata', onLoadedMetadata);
      video.addEventListener('error', onError);

      // Set the video source to start loading
      video.src = url;

      // Explicitly load the video
      // Some browsers require this call
      video.load();
    });
  }

  /**
   * Clean up resources created by the loader
   * 
   * This method revokes all object URLs created during loading
   * to prevent memory leaks. Should be called when done processing
   * the video.
   * 
   * @example
   * ```typescript
   * const loader = new VideoLoader();
   * try {
   *   const video = await loader.load(file);
   *   // Process video...
   * } finally {
   *   loader.cleanup(); // Always cleanup
   * }
   * ```
   */
  cleanup(): void {
    // Revoke all object URLs we created
    for (const url of this.objectURLs) {
      try {
        URL.revokeObjectURL(url);
      } catch (error) {
        // Ignore errors during cleanup
        // The URL may have already been revoked
        console.warn('Failed to revoke object URL:', error);
      }
    }

    // Clear the array
    this.objectURLs = [];
  }

  /**
   * Check if a video format is supported by the browser
   * Static utility method that can be called without creating an instance
   * 
   * @param mimeType - The MIME type to check (e.g., 'video/mp4', 'video/webm')
   * @returns true if the format is supported, false otherwise
   * 
   * @example
   * ```typescript
   * if (VideoLoader.isFormatSupported('video/mp4')) {
   *   console.log('MP4 is supported');
   * }
   * ```
   */
  static isFormatSupported(mimeType: string): boolean {
    const video = document.createElement('video');
    
    // canPlayType returns 'probably', 'maybe', or '' (empty string)
    // We consider 'probably' and 'maybe' as supported
    const support = video.canPlayType(mimeType);
    
    return support === 'probably' || support === 'maybe';
  }
}


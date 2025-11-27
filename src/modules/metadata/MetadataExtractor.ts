/**
 * MetadataExtractor - Extract comprehensive metadata from videos
 * 
 * This class extracts all available metadata from HTMLVideoElement using
 * the HTML5 Video API. It provides information about:
 * - Duration, dimensions, format
 * - Aspect ratio, FPS
 * - Audio/video track presence
 * - File size and bitrate (when available)
 * 
 * Most information comes directly from the browser's video API,
 * with some calculated/estimated properties.
 * 
 * @module modules/metadata/MetadataExtractor
 */

import type { VideoMetadata } from '../../types';
import { VideoIntelError, ErrorCode } from '../../types';

/**
 * MetadataExtractor class
 * 
 * Extracts comprehensive metadata from video elements.
 * Uses HTML5 Video API and browser capabilities for detection.
 * 
 * Usage:
 * ```typescript
 * const extractor = new MetadataExtractor();
 * const metadata = await extractor.extract(video);
 * 
 * console.log(`Video: ${metadata.width}x${metadata.height}`);
 * console.log(`Duration: ${metadata.duration}s`);
 * console.log(`Aspect Ratio: ${metadata.aspectRatio}`);
 * ```
 */
export class MetadataExtractor {
  /**
   * Extract metadata from a video element
   * 
   * Waits for metadata to load if needed, then extracts all available
   * information about the video file.
   * 
   * @param video - HTMLVideoElement to extract metadata from
   * @returns Promise resolving to VideoMetadata object
   * @throws VideoIntelError if extraction fails
   * 
   * @example
   * ```typescript
   * const extractor = new MetadataExtractor();
   * const video = document.querySelector('video');
   * 
   * const metadata = await extractor.extract(video);
   * 
   * // Use metadata
   * if (metadata.hasAudio) {
   *   console.log('Video has audio track');
   * }
   * ```
   * 
   * IMPROVEMENT: Could add codec detection using MediaSource API
   * IMPROVEMENT: Could detect HDR/color space information
   * IMPROVEMENT: Could extract rotation metadata (for mobile videos)
   */
  async extract(video: HTMLVideoElement): Promise<VideoMetadata> {
    // Validate video element
    if (!video) {
      throw new VideoIntelError(
        'Invalid video element provided',
        ErrorCode.INVALID_INPUT,
        { video: null }
      );
    }

    // Wait for metadata to load if not ready yet
    // readyState >= 1 means HAVE_METADATA
    if (video.readyState < 1) {
      await this.waitForMetadata(video);
    }

    try {
      // Extract basic properties from video element
      const duration = video.duration;
      const width = video.videoWidth;
      const height = video.videoHeight;

      // Calculate/detect derived properties
      const aspectRatio = this.calculateAspectRatio(width, height);
      const format = this.detectFormat(video);
      const fps = this.estimateFPS(video);
      const size = this.getFileSize(video);
      const hasAudio = this.detectAudioTrack(video);
      const hasVideo = this.detectVideoTrack(video);
      const bitrate = this.estimateBitrate(size, duration);

      // Build metadata object
      const metadata: VideoMetadata = {
        duration,
        width,
        height,
        fps,
        codec: undefined, // Difficult to detect reliably in browser
        format,
        size,
        aspectRatio,
        bitrate,
        hasAudio,
        hasVideo,
      };

      return metadata;
    } catch (error) {
      throw new VideoIntelError(
        `Failed to extract metadata: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ErrorCode.PROCESSING_ERROR,
        { originalError: error }
      );
    }
  }

  /**
   * Wait for video metadata to load
   * 
   * Returns a promise that resolves when 'loadedmetadata' event fires
   * or rejects after timeout
   * 
   * @param video - Video element to wait for
   * @returns Promise that resolves when metadata is loaded
   * 
   * IMPROVEMENT: Could make timeout configurable
   */
  private async waitForMetadata(video: HTMLVideoElement): Promise<void> {
    return new Promise((resolve, reject) => {
      // Set timeout to prevent infinite waiting
      const timeout = setTimeout(() => {
        video.removeEventListener('loadedmetadata', onLoaded);
        reject(
          new VideoIntelError(
            'Timeout waiting for video metadata to load',
            ErrorCode.TIMEOUT_ERROR,
            { readyState: video.readyState }
          )
        );
      }, 10000); // 10 second timeout

      // Listen for metadata loaded event
      const onLoaded = () => {
        clearTimeout(timeout);
        resolve();
      };

      video.addEventListener('loadedmetadata', onLoaded, { once: true });
    });
  }

  /**
   * Calculate aspect ratio from dimensions
   * 
   * Simplifies width:height ratio using GCD (Greatest Common Divisor)
   * Also maps to common aspect ratio names
   * 
   * @param width - Video width in pixels
   * @param height - Video height in pixels
   * @returns Aspect ratio string (e.g., "16:9", "4:3")
   * 
   * @example
   * ```typescript
   * calculateAspectRatio(1920, 1080) // "16:9"
   * calculateAspectRatio(1280, 720)  // "16:9"
   * calculateAspectRatio(640, 480)   // "4:3"
   * calculateAspectRatio(1080, 1920) // "9:16" (vertical)
   * ```
   * 
   * IMPROVEMENT: Could add more aspect ratio mappings (21:9, etc.)
   */
  private calculateAspectRatio(width: number, height: number): string {
    // Handle invalid dimensions
    if (width <= 0 || height <= 0) {
      return 'unknown';
    }

    // Calculate GCD to simplify ratio
    const gcd = this.gcd(width, height);
    const ratioW = width / gcd;
    const ratioH = height / gcd;

    // Map to common aspect ratios for readability
    const ratioString = `${ratioW}:${ratioH}`;

    // Common aspect ratio mappings
    const commonRatios: Record<string, string> = {
      '16:9': '16:9',   // Standard HD (1920x1080, 1280x720)
      '4:3': '4:3',     // Classic TV (640x480)
      '1:1': '1:1',     // Square (Instagram)
      '21:9': '21:9',   // Ultra-wide
      '9:16': '9:16',   // Vertical (TikTok, Stories)
      '3:2': '3:2',     // Classic photography
      '5:4': '5:4',     // Old monitors
    };

    return commonRatios[ratioString] || ratioString;
  }

  /**
   * Calculate Greatest Common Divisor using Euclidean algorithm
   * 
   * Used to simplify aspect ratios
   * 
   * @param a - First number
   * @param b - Second number
   * @returns GCD of a and b
   * 
   * @example
   * ```typescript
   * gcd(1920, 1080) // 120
   * gcd(16, 9)      // 1
   * ```
   */
  private gcd(a: number, b: number): number {
    // Euclidean algorithm: GCD(a,b) = GCD(b, a mod b)
    return b === 0 ? a : this.gcd(b, a % b);
  }

  /**
   * Detect video format from source URL
   * 
   * Extracts file extension from video source URL
   * Works for most common video formats
   * 
   * @param video - Video element
   * @returns Format string (e.g., "mp4", "webm")
   * 
   * IMPROVEMENT: Could check MIME type from network request headers
   * IMPROVEMENT: Could detect format from video data if URL unavailable
   */
  private detectFormat(video: HTMLVideoElement): string {
    // Get source URL
    const src = video.currentSrc || video.src;

    if (!src) {
      return 'unknown';
    }

    // Extract extension from URL
    // Handle URLs with query parameters (e.g., video.mp4?v=123)
    const urlWithoutQuery = src.split('?')[0];
    
    // Get the filename part (after last slash)
    const pathParts = urlWithoutQuery.split('/');
    const filename = pathParts[pathParts.length - 1];
    
    // Check if filename has an extension (contains a dot)
    if (!filename.includes('.')) {
      return 'unknown';
    }
    
    // Extract extension
    const extension = filename.split('.').pop()?.toLowerCase();

    // If no extension found, return unknown
    if (!extension) {
      return 'unknown';
    }

    // Map extensions to standard format names
    const formatMap: Record<string, string> = {
      mp4: 'mp4',
      webm: 'webm',
      ogg: 'ogg',
      ogv: 'ogg',
      mov: 'mov',
      avi: 'avi',
      m4v: 'm4v',
      mkv: 'mkv',
      flv: 'flv',
    };

    return formatMap[extension] || extension || 'unknown';
  }

  /**
   * Estimate video frame rate (FPS)
   * 
   * Frame rate estimation is difficult in browsers as the API
   * doesn't directly expose this information.
   * 
   * For now, we return common frame rates as a reasonable estimate.
   * 
   * @param video - Video element
   * @returns Estimated FPS
   * 
   * IMPROVEMENT: Could use requestVideoFrameCallback to measure actual FPS
   * IMPROVEMENT: Could analyze frame timestamps if available
   * 
   * Note: requestVideoFrameCallback is only available in Chrome 83+
   * For now, we use a conservative default of 30 FPS
   */
  private estimateFPS(_video: HTMLVideoElement): number {
    // Most videos are either 24, 25, 30, 50, or 60 FPS
    // Without direct API access, we default to 30 (most common)

    // FUTURE IMPLEMENTATION:
    // if ('requestVideoFrameCallback' in video) {
    //   return await this.measureFPSUsingCallback(video);
    // }

    // Default to 30 FPS (reasonable for most web videos)
    return 30;
  }

  /**
   * Get file size if available
   * 
   * File size is not directly available from HTMLVideoElement
   * We try to get it from various sources
   * 
   * @param video - Video element
   * @returns File size in bytes, or 0 if unavailable
   * 
   * IMPROVEMENT: Could extract from Content-Length header if available
   * IMPROVEMENT: Could estimate from buffered data
   */
  private getFileSize(_video: HTMLVideoElement): number {
    // File size is not directly available from video element
    // It would need to be passed in or fetched from network headers

    // For now, we return 0 to indicate unavailable
    // This could be improved by:
    // 1. Accepting file size in options
    // 2. Fetching Content-Length header
    // 3. Using File API if video loaded from File object

    return 0;
  }

  /**
   * Detect if video has audio track
   * 
   * Uses browser-specific properties to detect audio presence
   * Different browsers expose this information differently
   * 
   * @param video - Video element
   * @returns true if audio detected, false otherwise
   * 
   * IMPROVEMENT: Could check audio data in buffers
   */
  private detectAudioTrack(video: HTMLVideoElement): boolean {
    // Try multiple methods as different browsers expose this differently
    const videoWithExtras = video as HTMLVideoElement & {
      mozHasAudio?: boolean;
      webkitAudioDecodedByteCount?: number;
      audioTracks?: { length: number };
    };

    // Method 1: mozHasAudio (Firefox)
    if (videoWithExtras.mozHasAudio) {
      return true;
    }

    // Method 2: webkitAudioDecodedByteCount (Chrome/Safari)
    if (
      videoWithExtras.webkitAudioDecodedByteCount !== undefined &&
      videoWithExtras.webkitAudioDecodedByteCount > 0
    ) {
      return true;
    }

    // Method 3: audioTracks API (if available)
    if (videoWithExtras.audioTracks !== undefined) {
      return videoWithExtras.audioTracks.length > 0;
    }

    // Method 4: Check if video is muted (not reliable but a hint)
    // If video has been muted by page, it likely has audio
    // This is weak evidence but better than nothing
    if (video.muted && !video.defaultMuted) {
      return true;
    }

    // Unable to detect - assume it has audio to be safe
    // Most videos have audio, so this is a reasonable default
    return true;
  }

  /**
   * Detect if video has video track
   * 
   * Simple check: if video has dimensions, it has video
   * 
   * @param video - Video element
   * @returns true if video detected, false otherwise
   */
  private detectVideoTrack(video: HTMLVideoElement): boolean {
    // Video track exists if dimensions are non-zero
    return video.videoWidth > 0 && video.videoHeight > 0;
  }

  /**
   * Estimate bitrate from file size and duration
   * 
   * Calculates average bitrate if file size is known
   * Bitrate = (file size in bits) / duration in seconds
   * 
   * @param fileSize - File size in bytes
   * @param duration - Video duration in seconds
   * @returns Bitrate in kbps, or undefined if can't calculate
   * 
   * Note: This is overall bitrate (video + audio combined)
   * 
   * IMPROVEMENT: Could separate video and audio bitrates
   */
  private estimateBitrate(fileSize: number, duration: number): number | undefined {
    // Can't calculate without valid inputs
    if (fileSize <= 0 || duration <= 0) {
      return undefined;
    }

    // Calculate bitrate in kbps (kilobits per second)
    // Formula: (bytes * 8) / seconds / 1000
    const bits = fileSize * 8;
    const kbps = Math.round(bits / duration / 1000);

    return kbps;
  }
}


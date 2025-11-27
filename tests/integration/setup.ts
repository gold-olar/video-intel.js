/**
 * Integration Test Setup Utilities
 * 
 * Provides utilities for loading and working with real video files in integration tests.
 * Supports both local files and remote URLs.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

/**
 * Load a test video file from the fixtures directory
 * @param filename - Name of the video file in tests/fixtures/
 * @returns Promise<File> - File object for use with VideoIntel
 */
export const loadTestVideo = async (filename: string): Promise<File> => {
  const path = resolve(__dirname, '../fixtures', filename);
  
  if (!existsSync(path)) {
    throw new Error(
      `Test video not found: ${filename}\n` +
      `Expected path: ${path}\n` +
      `Make sure to run 'npm run test:download-fixtures' first to download test videos.`
    );
  }
  
  const buffer = readFileSync(path);
  const blob = new Blob([buffer], { type: getMimeType(filename) });
  return new File([blob], filename, { type: getMimeType(filename) });
};

/**
 * Get a remote video URL for testing URL-based video loading
 * @param videoKey - Key identifying which test video to use
 * @returns string - URL to the test video
 */
export const getTestVideoURL = (videoKey: 'short' | 'medium' | 'long' | 'hd' = 'short'): string => {
  // Using publicly available test videos (Big Buck Bunny is a common choice for testing)
  const urls = {
    // ~10 second clip, 480p
    short: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    
    // ~30 second clip, 720p
    medium: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    
    // ~2 minute clip, 720p
    long: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    
    // ~1 minute clip, 1080p
    hd: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  };
  
  return urls[videoKey];
};

/**
 * Create a Blob from a URL for testing
 * @param url - Video URL
 * @returns Promise<Blob> - Blob containing the video data
 */
export const fetchVideoBlob = async (url: string): Promise<Blob> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch video from ${url}: ${response.statusText}`);
  }
  return await response.blob();
};

/**
 * Create a File object from a URL
 * @param url - Video URL
 * @param filename - Optional filename for the File object
 * @returns Promise<File>
 */
export const fetchVideoFile = async (url: string, filename = 'test-video.mp4'): Promise<File> => {
  const blob = await fetchVideoBlob(url);
  return new File([blob], filename, { type: blob.type || 'video/mp4' });
};

/**
 * Wait for a specified duration (useful for timing tests)
 * @param ms - Milliseconds to wait
 * @returns Promise<void>
 */
export const wait = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Create a mock video element for testing (Node.js environment)
 * Note: This creates a minimal mock. For browser tests, use a real HTMLVideoElement.
 * @returns Partial mock of HTMLVideoElement
 */
export const createMockVideoElement = (): Partial<HTMLVideoElement> => {
  const mockVideo: Partial<HTMLVideoElement> = {
    // Video properties
    duration: 60,
    videoWidth: 1920,
    videoHeight: 1080,
    currentTime: 0,
    paused: true,
    readyState: 4, // HAVE_ENOUGH_DATA
    
    // Playback methods
    play: async () => {},
    pause: () => {},
    load: () => {},
    
    // Canvas capture (would normally return ImageBitmap or canvas data)
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  };
  
  return mockVideo;
};

/**
 * Get MIME type based on file extension
 * @param filename - File name with extension
 * @returns MIME type string
 */
function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'ogg': 'video/ogg',
    'mov': 'video/quicktime',
    'avi': 'video/x-msvideo',
  };
  return mimeTypes[ext || 'mp4'] || 'video/mp4';
}

/**
 * Test video metadata for reference
 */
export const TEST_VIDEOS = {
  // Local fixtures (after running download script)
  fixtures: {
    short: 'test-video-10s.mp4',      // 10 seconds, 480p
    medium: 'test-video-30s.mp4',     // 30 seconds, 720p
    scenes: 'test-video-scenes.mp4',  // Multiple distinct scenes
    blackframes: 'test-video-black.mp4', // Contains black frames
  },
  
  // Remote URLs (always available, no download needed)
  urls: {
    short: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    medium: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    long: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    hd: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  }
} as const;

/**
 * Assert that a value is defined (TypeScript type guard)
 */
export function assertDefined<T>(value: T | undefined | null, message?: string): asserts value is T {
  if (value === undefined || value === null) {
    throw new Error(message || 'Expected value to be defined');
  }
}

/**
 * Calculate average of an array of numbers
 */
export function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

/**
 * Measure memory usage
 * @returns Memory usage in bytes
 */
export function getMemoryUsage(): number {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    return process.memoryUsage().heapUsed;
  }
  
  // Browser environment
  if (typeof performance !== 'undefined' && 'memory' in performance) {
    return (performance as any).memory.usedJSHeapSize;
  }
  
  return 0;
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}


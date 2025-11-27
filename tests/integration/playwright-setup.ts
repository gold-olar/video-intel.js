/**
 * Playwright Test Setup Utilities
 * 
 * Provides utilities for running VideoIntel integration tests in real browsers.
 * These utilities handle:
 * - Loading the VideoIntel library into browser context
 * - Creating File objects from test video fixtures
 * - Executing VideoIntel operations in the browser
 * - Extracting and validating results
 */

import { Page } from '@playwright/test';
import { resolve } from 'path';
import { existsSync, readFileSync } from 'fs';

/**
 * Test video metadata for reference
 */
export const TEST_VIDEOS = {
  fixtures: {
    short: 'test-video-10s.mp4',      // 10 seconds, 480p
    medium: 'test-video-30s.mp4',     // 30 seconds, 720p
    scenes: 'test-video-scenes.mp4',  // Multiple distinct scenes
  },
  urls: {
    short: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    medium: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    long: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    hd: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  }
} as const;

/**
 * Initialize a Playwright page for VideoIntel testing
 * - Loads the VideoIntel library
 * - Sets up error handling
 * - Prepares the browser environment
 */
export async function setupVideoIntelPage(page: Page): Promise<void> {
  // Navigate to a blank page
  await page.goto('about:blank');
  
  // Inject the VideoIntel library
  await injectVideoIntel(page);
  
  // Set up console error capturing
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('Browser console error:', msg.text());
    }
  });
  
  // Set up page error capturing
  page.on('pageerror', error => {
    console.error('Browser page error:', error);
  });
}

/**
 * Inject the VideoIntel library into the page context
 * Uses the UMD build from dist/ folder
 */
export async function injectVideoIntel(page: Page): Promise<void> {
  const libPath = resolve(__dirname, '../../dist/index.umd.js');
  
  if (!existsSync(libPath)) {
    throw new Error(
      `VideoIntel library not found at ${libPath}\n` +
      `Run 'npm run build' first to build the library.`
    );
  }
  
  // Read the library code
  const libCode = readFileSync(libPath, 'utf-8');
  
  // Inject it into the page
  await page.addScriptTag({
    content: libCode,
  });
  
  // Verify the library is loaded
  const isLoaded = await page.evaluate(() => {
    // The UMD build exports as 'VideoIntel.default' for the singleton instance
    const lib = (window as any).VideoIntel;
    return lib && (lib.default || lib);
  });
  
  if (!isLoaded) {
    throw new Error('Failed to load VideoIntel library into browser');
  }
  
  // Store the default instance for convenience
  await page.evaluate(() => {
    const lib = (window as any).VideoIntel;
    (window as any).videoIntel = lib.default || lib;
  });
}

/**
 * Load a test video file into the browser as a File object
 * @param page - Playwright page
 * @param filename - Name of the video file in tests/fixtures/
 * @returns Handle to the File object in the browser
 */
export async function loadTestVideo(page: Page, filename: string): Promise<void> {
  const videoPath = resolve(__dirname, '../fixtures', filename);
  
  if (!existsSync(videoPath)) {
    throw new Error(
      `Test video not found: ${filename}\n` +
      `Expected path: ${videoPath}\n` +
      `Run 'npm run test:download-fixtures' to download test videos.`
    );
  }
  
  // Read the video file
  const videoBuffer = readFileSync(videoPath);
  const base64Video = videoBuffer.toString('base64');
  const mimeType = getMimeType(filename);
  
  // Create a File object in the browser context
  await page.evaluate(({ base64Data, mimeType, filename }) => {
    // Convert base64 to Uint8Array
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Create Blob and File
    const blob = new Blob([bytes], { type: mimeType });
    const file = new File([blob], filename, { type: mimeType });
    
    // Store in window for test access
    (window as any).testVideoFile = file;
  }, { base64Data: base64Video, mimeType, filename });
}

/**
 * Load a test video from a URL into the browser as a File object
 * @param page - Playwright page
 * @param url - URL to the video
 * @param filename - Optional filename for the File object
 */
export async function loadTestVideoFromURL(
  page: Page, 
  url: string, 
  filename = 'test-video.mp4'
): Promise<void> {
  await page.evaluate(async ({ url, filename }) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.statusText}`);
    }
    const blob = await response.blob();
    const file = new File([blob], filename, { type: blob.type || 'video/mp4' });
    
    // Store in window for test access
    (window as any).testVideoFile = file;
  }, { url, filename });
}

/**
 * Analyze a video using VideoIntel in the browser
 * @param page - Playwright page
 * @param options - Analysis options (optional)
 * @returns Analysis result
 */
export async function analyzeVideo(page: Page, options?: any): Promise<any> {
  const result = await page.evaluate(async (opts) => {
    const videoIntel = (window as any).videoIntel;
    const videoFile = (window as any).testVideoFile;
    
    if (!videoFile) {
      throw new Error('No test video loaded. Call loadTestVideo() first.');
    }
    
    // Run analysis
    const result = await videoIntel.analyze(videoFile, opts);
    
    return result;
  }, options);
  
  return result;
}

/**
 * Generate thumbnails using VideoIntel in the browser
 * @param page - Playwright page
 * @param options - Thumbnail options (optional)
 * @returns Array of thumbnail objects with metadata
 */
export async function generateThumbnails(page: Page, options?: any): Promise<any> {
  const result = await page.evaluate(async (opts) => {
    const videoIntel = (window as any).videoIntel;
    const videoFile = (window as any).testVideoFile;
    
    if (!videoFile) {
      throw new Error('No test video loaded. Call loadTestVideo() first.');
    }
    
    // Generate thumbnails
    const thumbnails = await videoIntel.getThumbnails(videoFile, opts);
    
    // Convert Blobs to metadata we can return (can't transfer Blobs directly)
    const thumbnailsData = await Promise.all(
      thumbnails.map(async (thumb: any) => ({
        timestamp: thumb.timestamp,
        quality: thumb.quality,
        size: thumb.blob.size,
        type: thumb.blob.type,
        // Store blob in window for later retrieval if needed
      }))
    );
    
    // Store actual blobs in window for verification
    (window as any).thumbnailBlobs = thumbnails.map((t: any) => t.blob);
    
    return thumbnailsData;
  }, options);
  
  return result;
}

/**
 * Extract metadata from a video using VideoIntel in the browser
 * @param page - Playwright page
 * @returns Metadata object
 */
export async function extractMetadata(page: Page): Promise<any> {
  const result = await page.evaluate(async () => {
    const videoIntel = (window as any).videoIntel;
    const videoFile = (window as any).testVideoFile;
    
    if (!videoFile) {
      throw new Error('No test video loaded. Call loadTestVideo() first.');
    }
    
    const metadata = await videoIntel.getMetadata(videoFile);
    return metadata;
  });
  
  return result;
}

/**
 * Detect scenes in a video using VideoIntel in the browser
 * @param page - Playwright page
 * @param options - Scene detection options (optional)
 * @returns Array of scene objects
 */
export async function detectScenes(page: Page, options?: any): Promise<any> {
  const result = await page.evaluate(async (opts) => {
    const videoIntel = (window as any).videoIntel;
    const videoFile = (window as any).testVideoFile;
    
    if (!videoFile) {
      throw new Error('No test video loaded. Call loadTestVideo() first.');
    }
    
    const scenes = await videoIntel.detectScenes(videoFile, opts);
    return scenes;
  }, options);
  
  return result;
}

/**
 * Extract colors from a video using VideoIntel in the browser
 * @param page - Playwright page
 * @param options - Color extraction options (optional)
 * @returns Color analysis result
 */
export async function extractColors(page: Page, options?: any): Promise<any> {
  const result = await page.evaluate(async (opts) => {
    const videoIntel = (window as any).videoIntel;
    const videoFile = (window as any).testVideoFile;
    
    if (!videoFile) {
      throw new Error('No test video loaded. Call loadTestVideo() first.');
    }
    
    const colors = await videoIntel.extractColors(videoFile, opts);
    return colors;
  }, options);
  
  return result;
}

/**
 * Wait for a specified duration (useful for timing tests)
 */
export const wait = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get MIME type based on file extension
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
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

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


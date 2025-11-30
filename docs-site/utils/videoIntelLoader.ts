/**
 * Utility to load and initialize VideoIntel library
 * Handles dynamic imports and error cases gracefully
 */

let videoIntelInstance: any = null;

export async function loadVideoIntel() {
  // Return cached instance if available
  if (videoIntelInstance) {
    return videoIntelInstance;
  }

  // Only load in browser environment
  if (typeof window === 'undefined') {
    throw new Error('VideoIntel can only be loaded in the browser');
  }

  try {
    // Try to dynamically import the library
    const videoIntelModule = await import('videointel');
    videoIntelInstance = videoIntelModule.default;
    
    if (!videoIntelInstance) {
      throw new Error('VideoIntel module not found');
    }

    return videoIntelInstance;
  } catch (error) {
    console.error('Failed to load VideoIntel:', error);
    throw new Error(
      'VideoIntel library could not be loaded. Please ensure the library is built:\n' +
      '1. Run `npm run build` in the root directory\n' +
      '2. Restart the dev server'
    );
  }
}

export function clearVideoIntelCache() {
  videoIntelInstance = null;
}


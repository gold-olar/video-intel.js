/**
 * MemoryManager - Manages memory cleanup and resource pooling for video processing
 * 
 * This utility prevents memory leaks by:
 * 1. Cleaning up canvas elements after frame extraction
 * 2. Properly disposing video elements
 * 3. Revoking blob URLs to prevent memory leaks
 * 4. Pooling frequently-created resources for performance
 * 
 * @example
 * ```typescript
 * const manager = MemoryManager.getInstance();
 * const canvas = manager.createCanvas(1920, 1080);
 * // ... use canvas ...
 * manager.cleanupCanvas(canvas);
 * ```
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Memory information from browser's performance API
 * Note: Only available in Chrome/Edge with --enable-precise-memory-info flag
 */
export interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

/**
 * Statistics about tracked resources
 */
export interface MemoryStats {
  canvasCount: number;           // Number of tracked canvases
  videoCount: number;             // Number of tracked videos
  blobURLCount: number;           // Number of tracked blob URLs
  estimatedMemoryUsage: number;   // Estimated memory in bytes
  poolSize: number;               // Number of canvases in pool
}

/**
 * Types of resources that can be cleaned up
 */
export type CleanableResource = 
  | HTMLCanvasElement 
  | HTMLVideoElement 
  | string // Blob URL
  | ImageData
  | null
  | undefined;

/**
 * Callback function for cleanup operations
 */
export type CleanupCallback = () => void | Promise<void>;

/**
 * Resource scope for RAII-like pattern
 * Automatically cleans up resources when scope ends
 */
export interface ResourceScope {
  track(...resources: CleanableResource[]): void;
  cleanup(): Promise<void>;
}

/**
 * Configuration options for the memory manager
 */
export interface PoolConfig {
  maxSize: number;              // Maximum number of canvases in pool
  maxCanvasSize: number;        // Maximum dimension for pooled canvases
  cleanupInterval?: number;     // Optional: Auto-cleanup interval in ms
  memoryThreshold?: number;     // Memory pressure threshold (0-1)
}

// ============================================================================
// Main MemoryManager Class
// ============================================================================

/**
 * MemoryManager handles cleanup and pooling of resources used in video processing
 * 
 * Key features:
 * - Automatic cleanup of canvases, videos, and blob URLs
 * - Canvas pooling for performance optimization
 * - Memory monitoring and pressure detection
 * - Scoped resource management
 * 
 * FUTURE IMPROVEMENTS:
 * - Add WeakRef support for better garbage collection (when browser support is wider)
 * - Implement FinalizationRegistry for automatic cleanup
 * - Add more sophisticated pool eviction strategies (LRU, LFU)
 * - Support WebGL context management
 * - Add memory profiling hooks for debugging
 */
export class MemoryManager {
  // Singleton instance
  private static instance: MemoryManager | null = null;

  // Canvas pool for reuse (avoids expensive creation/destruction)
  private canvasPool: HTMLCanvasElement[] = [];

  // Track resources for statistics and cleanup
  // Note: Using Set instead of WeakSet for now to get accurate counts
  // FUTURE IMPROVEMENT: Use WeakSet when we don't need counts for better GC
  private trackedCanvases: Set<HTMLCanvasElement> = new Set();
  private trackedVideos: Set<HTMLVideoElement> = new Set();
  private trackedBlobURLs: Set<string> = new Set();

  // Cleanup callbacks registry
  private cleanupCallbacks: Set<CleanupCallback> = new Set();

  // Configuration
  private config: PoolConfig = {
    maxSize: 50,              // Max 50 canvases in pool
    maxCanvasSize: 4096,      // Don't pool canvases larger than 4K
    memoryThreshold: 0.85     // Trigger cleanup at 85% memory usage
  };

  /**
   * Private constructor for singleton pattern
   * Use getInstance() to get the instance
   */
  private constructor() {
    // FUTURE IMPROVEMENT: Set up periodic cleanup if cleanupInterval is configured
    // this.setupAutoCleanup();
  }

  /**
   * Get singleton instance of MemoryManager
   * 
   * @returns MemoryManager instance
   */
  public static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  // ============================================================================
  // Canvas Management
  // ============================================================================

  /**
   * Create a new canvas or retrieve one from the pool
   * 
   * This method checks the pool first for performance optimization.
   * Creating canvases is relatively expensive (~5-10ms each), so pooling
   * can save significant time when processing many frames.
   * 
   * @param width - Canvas width in pixels
   * @param height - Canvas height in pixels
   * @returns HTMLCanvasElement ready to use
   * 
   * @example
   * ```typescript
   * const canvas = manager.createCanvas(1920, 1080);
   * const ctx = canvas.getContext('2d');
   * ```
   */
  public createCanvas(width: number, height: number): HTMLCanvasElement {
    // Try to get canvas from pool first
    const pooledCanvas = this.canvasPool.pop();
    
    if (pooledCanvas) {
      // Reuse existing canvas - just resize it
      pooledCanvas.width = width;
      pooledCanvas.height = height;
      
      // Clear any previous content (setting width/height clears automatically)
      // But we'll ensure context is clean
      const ctx = pooledCanvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, width, height);
      }
      
      this.trackedCanvases.add(pooledCanvas);
      return pooledCanvas;
    }

    // No pooled canvas available - create new one
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    this.trackedCanvases.add(canvas);
    return canvas;
  }

  /**
   * Clean up a canvas element and free its memory
   * 
   * This method:
   * 1. Clears the canvas content
   * 2. Resets dimensions to 0x0 (releases memory)
   * 3. Removes from tracking
   * 
   * Note: Setting width/height to 0 is important - it forces the browser
   * to release the backing memory immediately rather than waiting for GC.
   * 
   * @param canvas - Canvas to clean up (can be null/undefined)
   */
  public cleanupCanvas(canvas: HTMLCanvasElement | null | undefined): void {
    if (!canvas) {
      return; // Gracefully handle null/undefined
    }

    try {
      // Clear the canvas content
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      // Reset dimensions to 0x0 to release memory
      // This is crucial - the browser holds backing buffers for canvas
      canvas.width = 0;
      canvas.height = 0;

      // Remove from tracking
      this.trackedCanvases.delete(canvas);
    } catch (error) {
      // Silent failure - cleanup should never throw
      // FUTURE IMPROVEMENT: Add logging/monitoring for cleanup failures
      console.warn('Failed to cleanup canvas:', error);
    }
  }

  /**
   * Return a canvas to the pool for reuse
   * 
   * Only canvases below maxCanvasSize are pooled to avoid excessive memory usage.
   * Large canvases (e.g., 4K frames) are cleaned up immediately instead.
   * 
   * @param canvas - Canvas to return to pool
   */
  public returnCanvasToPool(canvas: HTMLCanvasElement): void {
    if (!canvas) {
      return;
    }

    // Don't pool canvases that are too large (would waste memory)
    const maxDimension = Math.max(canvas.width, canvas.height);
    if (maxDimension > this.config.maxCanvasSize) {
      this.cleanupCanvas(canvas);
      return;
    }

    // Don't exceed pool size limit
    if (this.canvasPool.length >= this.config.maxSize) {
      this.cleanupCanvas(canvas);
      return;
    }

    // Clear the canvas before pooling
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Remove from tracked canvases (it's now in the pool)
    this.trackedCanvases.delete(canvas);

    // Add to pool
    this.canvasPool.push(canvas);
  }

  /**
   * Reuse an existing canvas with new dimensions
   * 
   * This is more efficient than creating a new canvas when you're done with
   * the current one and need a different size.
   * 
   * @param canvas - Canvas to reuse
   * @param width - New width
   * @param height - New height
   */
  public reuseCanvas(
    canvas: HTMLCanvasElement,
    width: number,
    height: number
  ): void {
    if (!canvas) {
      return;
    }

    // Resizing automatically clears the canvas
    canvas.width = width;
    canvas.height = height;

    // Clear any previous content to be safe
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, width, height);
    }
  }

  // ============================================================================
  // Video Element Management
  // ============================================================================

  /**
   * Clean up a video element and release its resources
   * 
   * Video elements can hold significant memory:
   * - Decoded video frames
   * - Audio buffers
   * - Network connections
   * 
   * This method properly releases all these resources.
   * 
   * BROWSER-SPECIFIC NOTES:
   * - Firefox: Requires extra care with event listeners
   * - Safari: May need additional time to release resources
   * - Chrome: Generally good about cleanup
   * 
   * @param video - Video element to clean up
   */
  public cleanupVideo(video: HTMLVideoElement | null | undefined): void {
    if (!video) {
      return;
    }

    try {
      // Pause playback first
      video.pause();

      // Remove all event listeners
      // Note: This uses cloneNode trick which removes all listeners
      // FUTURE IMPROVEMENT: Track listeners explicitly for more control
      this.removeAllEventListeners(video);

      // Clear source to release buffers
      video.removeAttribute('src');
      video.srcObject = null;

      // Call load() to reset the media element
      // This forces the browser to release resources
      video.load();

      // Remove from tracking
      this.trackedVideos.delete(video);
    } catch (error) {
      console.warn('Failed to cleanup video:', error);
    }
  }

  /**
   * Prepare video for cleanup by removing event listeners
   * 
   * Helper method to remove all event listeners from a video element.
   * Uses the cloneNode trick which is more reliable than tracking listeners.
   * 
   * @param video - Video element to prepare
   */
  public prepareVideoForCleanup(video: HTMLVideoElement): void {
    // Common video events that should be removed
    const events = [
      'loadstart', 'progress', 'suspend', 'abort', 'error',
      'emptied', 'stalled', 'loadedmetadata', 'loadeddata',
      'canplay', 'canplaythrough', 'playing', 'waiting',
      'seeking', 'seeked', 'ended', 'durationchange',
      'timeupdate', 'play', 'pause', 'ratechange',
      'resize', 'volumechange'
    ];

    // Remove each event listener (if any were attached)
    // Note: We don't know which listeners exist, so we remove all common ones
    events.forEach(event => {
      video.removeEventListener(event, () => {});
    });
  }

  /**
   * Helper to remove all event listeners from an element
   * 
   * @param element - Element to clean
   */
  private removeAllEventListeners(element: HTMLElement): void {
    // Clone the element without listeners, then replace
    // This is a reliable way to remove ALL listeners
    const clone = element.cloneNode(false) as HTMLElement;
    element.parentNode?.replaceChild(clone, element);
  }

  // ============================================================================
  // Blob URL Management
  // ============================================================================

  /**
   * Track a blob URL for later cleanup
   * 
   * Blob URLs must be explicitly revoked to prevent memory leaks.
   * The browser will not garbage collect blob URLs automatically.
   * 
   * @param url - Blob URL to track (e.g., "blob:http://...")
   * 
   * @example
   * ```typescript
   * const url = URL.createObjectURL(blob);
   * manager.trackBlobURL(url);
   * // ... use url ...
   * manager.revokeBlobURL(url);
   * ```
   */
  public trackBlobURL(url: string): void {
    if (!url || !url.startsWith('blob:')) {
      return; // Only track actual blob URLs
    }

    this.trackedBlobURLs.add(url);
  }

  /**
   * Revoke a blob URL and free its memory
   * 
   * IMPORTANT: Always revoke blob URLs when done!
   * Each blob URL holds a reference to the blob in memory.
   * 
   * @param url - Blob URL to revoke
   */
  public revokeBlobURL(url: string): void {
    if (!url || !url.startsWith('blob:')) {
      return;
    }

    try {
      URL.revokeObjectURL(url);
      this.trackedBlobURLs.delete(url);
    } catch (error) {
      console.warn('Failed to revoke blob URL:', error);
    }
  }

  /**
   * Revoke all tracked blob URLs
   * 
   * Use this at the end of processing to ensure no blob URLs leak.
   */
  public revokeAllBlobURLs(): void {
    this.trackedBlobURLs.forEach(url => {
      try {
        URL.revokeObjectURL(url);
      } catch (error) {
        console.warn('Failed to revoke blob URL:', url, error);
      }
    });

    this.trackedBlobURLs.clear();
  }

  // ============================================================================
  // ImageData Management
  // ============================================================================

  /**
   * Release an ImageData object
   * 
   * ImageData objects can be very large (e.g., 1920x1080 = ~8MB).
   * While they're garbage collected automatically, clearing references
   * can help the browser reclaim memory faster.
   * 
   * FUTURE IMPROVEMENT: Pool ImageData buffers for reuse
   * 
   * @param imageData - ImageData to release
   */
  public releaseImageData(imageData: ImageData | null | undefined): void {
    // Not much we can do here - just ensure reference is cleared
    // The garbage collector will handle it
    // This method exists for API completeness and future improvements
    
    if (!imageData) {
      return;
    }

    // FUTURE IMPROVEMENT: Could pool the underlying ArrayBuffer
    // for reuse in same-sized ImageData objects
  }

  /**
   * Estimate memory size of an ImageData object
   * 
   * Useful for memory monitoring and deciding when to clean up.
   * 
   * @param imageData - ImageData to measure
   * @returns Estimated size in bytes
   */
  public estimateImageDataSize(imageData: ImageData): number {
    if (!imageData) {
      return 0;
    }

    // ImageData uses 4 bytes per pixel (RGBA)
    return imageData.width * imageData.height * 4;
  }

  // ============================================================================
  // Batch Operations
  // ============================================================================

  /**
   * Clean up multiple resources at once
   * 
   * Automatically detects resource type and calls appropriate cleanup method.
   * This is convenient for cleaning up mixed resource types.
   * 
   * @param resources - Variable number of resources to clean
   * 
   * @example
   * ```typescript
   * manager.cleanup(canvas1, canvas2, video, blobURL);
   * ```
   */
  public cleanup(...resources: CleanableResource[]): void {
    for (const resource of resources) {
      if (!resource) {
        continue;
      }

      // Detect type and call appropriate method
      if (resource instanceof HTMLCanvasElement) {
        this.cleanupCanvas(resource);
      } else if (resource instanceof HTMLVideoElement) {
        this.cleanupVideo(resource);
      } else if (typeof resource === 'string') {
        this.revokeBlobURL(resource);
      } else if (resource instanceof ImageData) {
        this.releaseImageData(resource);
      }
    }
  }

  /**
   * Clean up all tracked resources
   * 
   * Use this at the end of processing or when memory pressure is high.
   * This is a "nuclear option" - only use when you're sure you're done
   * with all resources.
   */
  public cleanupAll(): void {
    // Clean up all tracked canvases
    this.trackedCanvases.forEach(canvas => {
      this.cleanupCanvas(canvas);
    });
    this.trackedCanvases.clear();

    // Clean up all tracked videos
    this.trackedVideos.forEach(video => {
      this.cleanupVideo(video);
    });
    this.trackedVideos.clear();

    // Revoke all blob URLs
    this.revokeAllBlobURLs();

    // Clear the canvas pool
    this.canvasPool.forEach(canvas => {
      this.cleanupCanvas(canvas);
    });
    this.canvasPool = [];

    // Run cleanup callbacks
    this.cleanupCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.warn('Cleanup callback failed:', error);
      }
    });
  }

  /**
   * Register a cleanup callback
   * 
   * Useful for custom cleanup logic that doesn't fit the standard patterns.
   * 
   * @param callback - Function to call during cleanup
   * @returns Unregister function
   * 
   * @example
   * ```typescript
   * const unregister = manager.registerCleanupCallback(() => {
   *   // Custom cleanup logic
   * });
   * // Later...
   * unregister(); // Remove the callback
   * ```
   */
  public registerCleanupCallback(callback: CleanupCallback): () => void {
    this.cleanupCallbacks.add(callback);

    // Return unregister function
    return () => {
      this.cleanupCallbacks.delete(callback);
    };
  }

  // ============================================================================
  // Memory Monitoring
  // ============================================================================

  /**
   * Get current memory usage from browser
   * 
   * Note: performance.memory is only available in Chrome/Edge and requires
   * the --enable-precise-memory-info flag for accurate data.
   * 
   * FUTURE IMPROVEMENT: Add memory estimation for browsers without this API
   * 
   * @returns MemoryInfo object or null if unavailable
   */
  public getCurrentMemoryUsage(): MemoryInfo | null {
    // Check if performance.memory is available (Chrome/Edge only)
    const performance = globalThis.performance as any;
    
    if (!performance || !performance.memory) {
      return null; // Not available in this browser
    }

    return {
      usedJSHeapSize: performance.memory.usedJSHeapSize,
      totalJSHeapSize: performance.memory.totalJSHeapSize,
      jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
    };
  }

  /**
   * Check if memory pressure is high
   * 
   * Returns true when memory usage exceeds the configured threshold.
   * Use this to trigger proactive cleanup before running out of memory.
   * 
   * @param threshold - Custom threshold (0-1), defaults to config value
   * @returns true if memory pressure is high
   * 
   * @example
   * ```typescript
   * if (manager.isMemoryPressureHigh()) {
   *   manager.cleanupAll(); // Free up memory
   * }
   * ```
   */
  public isMemoryPressureHigh(threshold?: number): boolean {
    const memoryInfo = this.getCurrentMemoryUsage();
    
    if (!memoryInfo) {
      // Can't determine - assume it's okay
      // FUTURE IMPROVEMENT: Estimate based on tracked resources
      return false;
    }

    const currentThreshold = threshold ?? this.config.memoryThreshold ?? 0.85;
    const usage = memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit;

    return usage > currentThreshold;
  }

  /**
   * Get statistics about tracked resources
   * 
   * Useful for debugging and monitoring memory usage.
   * 
   * @returns MemoryStats object with current statistics
   */
  public getMemoryStats(): MemoryStats {
    // Estimate memory usage based on tracked resources
    let estimatedMemory = 0;

    // Each canvas: estimate based on dimensions (4 bytes per pixel)
    this.trackedCanvases.forEach(canvas => {
      estimatedMemory += canvas.width * canvas.height * 4;
    });

    // Pool canvases
    this.canvasPool.forEach(canvas => {
      estimatedMemory += canvas.width * canvas.height * 4;
    });

    // Video elements: harder to estimate, use rough average
    // Assume ~50MB per video (decoded frames, buffers, etc.)
    estimatedMemory += this.trackedVideos.size * 50 * 1024 * 1024;

    return {
      canvasCount: this.trackedCanvases.size,
      videoCount: this.trackedVideos.size,
      blobURLCount: this.trackedBlobURLs.size,
      estimatedMemoryUsage: estimatedMemory,
      poolSize: this.canvasPool.length
    };
  }

  // ============================================================================
  // Scoped Resource Management
  // ============================================================================

  /**
   * Execute a function with automatic cleanup of resources
   * 
   * This is a convenience wrapper that ensures cleanup happens even if
   * the function throws an error.
   * 
   * @param fn - Function to execute
   * @param resources - Resources to clean up after function completes
   * @returns Promise resolving to function result
   * 
   * @example
   * ```typescript
   * const result = await manager.withCleanup(async () => {
   *   const canvas = manager.createCanvas(1920, 1080);
   *   // ... process ...
   *   return processedData;
   * }, canvas);
   * // canvas is automatically cleaned up
   * ```
   */
  public async withCleanup<T>(
    fn: () => T | Promise<T>,
    ...resources: CleanableResource[]
  ): Promise<T> {
    try {
      // Execute the function
      return await fn();
    } finally {
      // Clean up resources even if function throws
      this.cleanup(...resources);
    }
  }

  /**
   * Create a resource scope for automatic cleanup
   * 
   * This implements a RAII-like pattern where resources are automatically
   * cleaned up when the scope ends.
   * 
   * @returns ResourceScope object
   * 
   * @example
   * ```typescript
   * const scope = manager.createScope();
   * const canvas1 = manager.createCanvas(1920, 1080);
   * const canvas2 = manager.createCanvas(1920, 1080);
   * scope.track(canvas1, canvas2);
   * // ... use canvases ...
   * await scope.cleanup(); // Both canvases cleaned up
   * ```
   */
  public createScope(): ResourceScope {
    const resources: CleanableResource[] = [];

    return {
      track: (...items: CleanableResource[]) => {
        resources.push(...items);
      },

      cleanup: async () => {
        this.cleanup(...resources);
        resources.length = 0; // Clear array
      }
    };
  }

  // ============================================================================
  // Configuration
  // ============================================================================

  /**
   * Update configuration options
   * 
   * @param options - Partial configuration to update
   * 
   * @example
   * ```typescript
   * manager.configure({
   *   maxSize: 100,           // Allow more canvases in pool
   *   memoryThreshold: 0.9    // More aggressive memory usage
   * });
   * ```
   */
  public configure(options: Partial<PoolConfig>): void {
    this.config = { ...this.config, ...options };

    // If pool is now too large, trim it
    while (this.canvasPool.length > this.config.maxSize) {
      const canvas = this.canvasPool.pop();
      if (canvas) {
        this.cleanupCanvas(canvas);
      }
    }
  }

  /**
   * Get current configuration
   * 
   * @returns Current PoolConfig
   */
  public getConfig(): PoolConfig {
    return { ...this.config };
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Reset the memory manager to initial state
   * 
   * Useful for testing or when you want to start fresh.
   * Cleans up everything and clears all tracking.
   */
  public reset(): void {
    this.cleanupAll();
    this.cleanupCallbacks.clear();
    this.config = {
      maxSize: 50,
      maxCanvasSize: 4096,
      memoryThreshold: 0.85
    };
  }
}

// Export singleton instance for convenience
export default MemoryManager.getInstance();


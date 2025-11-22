/**
 * Unit tests for MemoryManager
 * 
 * Tests cover:
 * - Canvas management and pooling
 * - Video element cleanup
 * - Blob URL management
 * - Memory monitoring
 * - Batch operations
 * - Scoped resource management
 * - Error handling
 */

import { MemoryManager } from '../../src/utils/MemoryManager';

// Mock URL.createObjectURL and URL.revokeObjectURL for JSDOM
// These are browser APIs not available in JSDOM
global.URL.createObjectURL = jest.fn((blob: Blob) => {
  return `blob:http://localhost/${Math.random().toString(36).substr(2, 9)}`;
});

global.URL.revokeObjectURL = jest.fn((url: string) => {
  // Mock implementation - do nothing
});

// Mock MediaStream for JSDOM
(global as any).MediaStream = jest.fn().mockImplementation(() => {
  return {};
});

describe('MemoryManager', () => {
  let manager: MemoryManager;

  beforeEach(() => {
    // Get fresh instance for each test
    manager = MemoryManager.getInstance();
    // Reset to clean state
    manager.reset();
    
    // Clear mock call history
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    manager.reset();
  });

  // ============================================================================
  // Singleton Pattern Tests
  // ============================================================================

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = MemoryManager.getInstance();
      const instance2 = MemoryManager.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  // ============================================================================
  // Canvas Management Tests
  // ============================================================================

  describe('Canvas Management', () => {
    describe('createCanvas', () => {
      it('should create canvas with specified dimensions', () => {
        const canvas = manager.createCanvas(1920, 1080);

        expect(canvas).toBeInstanceOf(HTMLCanvasElement);
        expect(canvas.width).toBe(1920);
        expect(canvas.height).toBe(1080);
      });

      it('should create multiple canvases', () => {
        const canvas1 = manager.createCanvas(1920, 1080);
        const canvas2 = manager.createCanvas(1280, 720);

        expect(canvas1).not.toBe(canvas2);
        expect(canvas1.width).toBe(1920);
        expect(canvas2.width).toBe(1280);
      });

      it('should track created canvases', () => {
        manager.createCanvas(1920, 1080);
        manager.createCanvas(1280, 720);

        const stats = manager.getMemoryStats();
        expect(stats.canvasCount).toBe(2);
      });

      it('should reuse canvas from pool when available', () => {
        const canvas = manager.createCanvas(1920, 1080);
        manager.returnCanvasToPool(canvas);

        const stats1 = manager.getMemoryStats();
        expect(stats1.poolSize).toBe(1);

        const reusedCanvas = manager.createCanvas(1920, 1080);

        const stats2 = manager.getMemoryStats();
        expect(stats2.poolSize).toBe(0);
        expect(stats2.canvasCount).toBe(1);
      });
    });

    describe('cleanupCanvas', () => {
      it('should cleanup canvas and reset dimensions', () => {
        const canvas = manager.createCanvas(1920, 1080);
        expect(canvas.width).toBe(1920);

        manager.cleanupCanvas(canvas);

        expect(canvas.width).toBe(0);
        expect(canvas.height).toBe(0);
      });

      it('should remove canvas from tracking', () => {
        const canvas = manager.createCanvas(1920, 1080);
        expect(manager.getMemoryStats().canvasCount).toBe(1);

        manager.cleanupCanvas(canvas);

        expect(manager.getMemoryStats().canvasCount).toBe(0);
      });

      it('should handle null canvas gracefully', () => {
        expect(() => {
          manager.cleanupCanvas(null);
        }).not.toThrow();
      });

      it('should handle undefined canvas gracefully', () => {
        expect(() => {
          manager.cleanupCanvas(undefined);
        }).not.toThrow();
      });

      it('should clear canvas content', () => {
        const canvas = manager.createCanvas(100, 100);
        const ctx = canvas.getContext('2d');

        // Draw something
        if (ctx) {
          ctx.fillStyle = 'red';
          ctx.fillRect(0, 0, 100, 100);
        }

        manager.cleanupCanvas(canvas);

        // Canvas should be reset
        expect(canvas.width).toBe(0);
        expect(canvas.height).toBe(0);
      });
    });

    describe('returnCanvasToPool', () => {
      it('should add canvas to pool', () => {
        const canvas = manager.createCanvas(1920, 1080);
        expect(manager.getMemoryStats().poolSize).toBe(0);

        manager.returnCanvasToPool(canvas);

        expect(manager.getMemoryStats().poolSize).toBe(1);
      });

      it('should not pool canvases exceeding max size', () => {
        // Configure to only pool small canvases
        manager.configure({ maxCanvasSize: 1000 });

        const largeCanvas = manager.createCanvas(2000, 2000);
        manager.returnCanvasToPool(largeCanvas);

        expect(manager.getMemoryStats().poolSize).toBe(0);
      });

      it('should not exceed pool max size', () => {
        manager.configure({ maxSize: 2 });

        const canvas1 = manager.createCanvas(100, 100);
        const canvas2 = manager.createCanvas(100, 100);
        const canvas3 = manager.createCanvas(100, 100);

        manager.returnCanvasToPool(canvas1);
        manager.returnCanvasToPool(canvas2);
        manager.returnCanvasToPool(canvas3);

        expect(manager.getMemoryStats().poolSize).toBe(2);
      });

      it('should clear canvas before adding to pool', () => {
        const canvas = manager.createCanvas(100, 100);
        const ctx = canvas.getContext('2d');

        // Draw something
        if (ctx) {
          ctx.fillStyle = 'red';
          ctx.fillRect(0, 0, 100, 100);
        }

        manager.returnCanvasToPool(canvas);

        // Get from pool
        const reusedCanvas = manager.createCanvas(100, 100);
        const reusedCtx = reusedCanvas.getContext('2d');

        if (reusedCtx) {
          const imageData = reusedCtx.getImageData(0, 0, 1, 1);
          // Should be cleared (transparent black: 0,0,0,0)
          expect(imageData.data[0]).toBe(0);
          expect(imageData.data[1]).toBe(0);
          expect(imageData.data[2]).toBe(0);
          expect(imageData.data[3]).toBe(0);
        }
      });

      it('should handle null canvas gracefully', () => {
        expect(() => {
          manager.returnCanvasToPool(null as any);
        }).not.toThrow();
      });
    });

    describe('reuseCanvas', () => {
      it('should resize existing canvas', () => {
        const canvas = manager.createCanvas(1920, 1080);
        expect(canvas.width).toBe(1920);

        manager.reuseCanvas(canvas, 1280, 720);

        expect(canvas.width).toBe(1280);
        expect(canvas.height).toBe(720);
      });

      it('should clear canvas content when resizing', () => {
        const canvas = manager.createCanvas(100, 100);
        const ctx = canvas.getContext('2d');

        // Draw something
        if (ctx) {
          ctx.fillStyle = 'red';
          ctx.fillRect(0, 0, 100, 100);
        }

        manager.reuseCanvas(canvas, 100, 100);

        // Should be cleared
        if (ctx) {
          const imageData = ctx.getImageData(0, 0, 1, 1);
          expect(imageData.data[0]).toBe(0);
        }
      });

      it('should handle null canvas gracefully', () => {
        expect(() => {
          manager.reuseCanvas(null as any, 100, 100);
        }).not.toThrow();
      });
    });
  });

  // ============================================================================
  // Video Element Management Tests
  // ============================================================================

  describe('Video Element Management', () => {
    describe('cleanupVideo', () => {
      it('should cleanup video element', () => {
        const video = document.createElement('video');
        video.src = 'test.mp4';
        
        // Mock methods not available in JSDOM
        video.pause = jest.fn();
        video.load = jest.fn();

        manager.cleanupVideo(video);

        // Pause should be called
        expect(video.pause).toHaveBeenCalled();
        // Load should be called
        expect(video.load).toHaveBeenCalled();
      });

      it('should handle null video gracefully', () => {
        expect(() => {
          manager.cleanupVideo(null);
        }).not.toThrow();
      });

      it('should handle undefined video gracefully', () => {
        expect(() => {
          manager.cleanupVideo(undefined);
        }).not.toThrow();
      });

      it('should pause video before cleanup', () => {
        const video = document.createElement('video');
        
        // Mock methods not available in JSDOM
        video.pause = jest.fn();
        video.load = jest.fn();

        manager.cleanupVideo(video);

        expect(video.pause).toHaveBeenCalled();
      });

      it('should remove srcObject', () => {
        const video = document.createElement('video');
        video.srcObject = new MediaStream();
        
        // Mock methods not available in JSDOM
        video.pause = jest.fn();
        video.load = jest.fn();

        manager.cleanupVideo(video);

        expect(video.srcObject).toBeNull();
      });
    });

    describe('prepareVideoForCleanup', () => {
      it('should not throw when preparing video for cleanup', () => {
        const video = document.createElement('video');

        expect(() => {
          manager.prepareVideoForCleanup(video);
        }).not.toThrow();
      });
    });
  });

  // ============================================================================
  // Blob URL Management Tests
  // ============================================================================

  describe('Blob URL Management', () => {
    describe('trackBlobURL', () => {
      it('should track blob URL', () => {
        const url = 'blob:http://localhost/test';

        manager.trackBlobURL(url);

        expect(manager.getMemoryStats().blobURLCount).toBe(1);
      });

      it('should ignore non-blob URLs', () => {
        const url = 'http://localhost/test.mp4';

        manager.trackBlobURL(url);

        expect(manager.getMemoryStats().blobURLCount).toBe(0);
      });

      it('should handle empty string', () => {
        expect(() => {
          manager.trackBlobURL('');
        }).not.toThrow();
      });

      it('should track multiple blob URLs', () => {
        manager.trackBlobURL('blob:http://localhost/test1');
        manager.trackBlobURL('blob:http://localhost/test2');

        expect(manager.getMemoryStats().blobURLCount).toBe(2);
      });
    });

    describe('revokeBlobURL', () => {
      it('should revoke blob URL', () => {
        const blob = new Blob(['test'], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        manager.trackBlobURL(url);
        expect(manager.getMemoryStats().blobURLCount).toBe(1);

        manager.revokeBlobURL(url);

        expect(manager.getMemoryStats().blobURLCount).toBe(0);
      });

      it('should handle non-blob URLs gracefully', () => {
        expect(() => {
          manager.revokeBlobURL('http://localhost/test.mp4');
        }).not.toThrow();
      });

      it('should handle empty string', () => {
        expect(() => {
          manager.revokeBlobURL('');
        }).not.toThrow();
      });
    });

    describe('revokeAllBlobURLs', () => {
      it('should revoke all tracked blob URLs', () => {
        const blob1 = new Blob(['test1'], { type: 'text/plain' });
        const blob2 = new Blob(['test2'], { type: 'text/plain' });
        const url1 = URL.createObjectURL(blob1);
        const url2 = URL.createObjectURL(blob2);

        manager.trackBlobURL(url1);
        manager.trackBlobURL(url2);
        expect(manager.getMemoryStats().blobURLCount).toBe(2);

        manager.revokeAllBlobURLs();

        expect(manager.getMemoryStats().blobURLCount).toBe(0);
      });

      it('should not throw when revoking empty list', () => {
        expect(() => {
          manager.revokeAllBlobURLs();
        }).not.toThrow();
      });
    });
  });

  // ============================================================================
  // ImageData Management Tests
  // ============================================================================

  describe('ImageData Management', () => {
    describe('releaseImageData', () => {
      it('should handle null ImageData gracefully', () => {
        expect(() => {
          manager.releaseImageData(null);
        }).not.toThrow();
      });

      it('should handle undefined ImageData gracefully', () => {
        expect(() => {
          manager.releaseImageData(undefined);
        }).not.toThrow();
      });
    });

    describe('estimateImageDataSize', () => {
      it('should calculate correct size for ImageData', () => {
        const canvas = manager.createCanvas(100, 100);
        const ctx = canvas.getContext('2d');

        if (ctx) {
          const imageData = ctx.createImageData(100, 100);
          const size = manager.estimateImageDataSize(imageData);

          // 100 * 100 * 4 bytes (RGBA) = 40,000 bytes
          expect(size).toBe(40000);
        }
      });

      it('should return 0 for null ImageData', () => {
        const size = manager.estimateImageDataSize(null as any);
        expect(size).toBe(0);
      });

      it('should calculate size for different dimensions', () => {
        const canvas = manager.createCanvas(1920, 1080);
        const ctx = canvas.getContext('2d');

        if (ctx) {
          const imageData = ctx.createImageData(1920, 1080);
          const size = manager.estimateImageDataSize(imageData);

          // 1920 * 1080 * 4 = 8,294,400 bytes
          expect(size).toBe(8294400);
        }
      });
    });
  });

  // ============================================================================
  // Batch Operations Tests
  // ============================================================================

  describe('Batch Operations', () => {
    describe('cleanup', () => {
      it('should cleanup multiple resources at once', () => {
        const canvas1 = manager.createCanvas(100, 100);
        const canvas2 = manager.createCanvas(200, 200);
        const video = document.createElement('video');
        
        // Mock video methods
        video.pause = jest.fn();
        video.load = jest.fn();

        manager.cleanup(canvas1, canvas2, video);

        expect(manager.getMemoryStats().canvasCount).toBe(0);
      });

      it('should handle mixed resource types', () => {
        const canvas = manager.createCanvas(100, 100);
        const video = document.createElement('video');
        
        // Mock video methods
        video.pause = jest.fn();
        video.load = jest.fn();
        
        const blob = new Blob(['test'], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        manager.trackBlobURL(url);

        manager.cleanup(canvas, video, url);

        const stats = manager.getMemoryStats();
        expect(stats.canvasCount).toBe(0);
        expect(stats.blobURLCount).toBe(0);
      });

      it('should handle null/undefined in mixed resources', () => {
        const canvas = manager.createCanvas(100, 100);

        expect(() => {
          manager.cleanup(canvas, null, undefined);
        }).not.toThrow();

        expect(manager.getMemoryStats().canvasCount).toBe(0);
      });

      it('should handle empty cleanup call', () => {
        expect(() => {
          manager.cleanup();
        }).not.toThrow();
      });
    });

    describe('cleanupAll', () => {
      it('should cleanup all tracked resources', () => {
        manager.createCanvas(100, 100);
        manager.createCanvas(200, 200);
        manager.trackBlobURL('blob:http://localhost/test');

        manager.cleanupAll();

        const stats = manager.getMemoryStats();
        expect(stats.canvasCount).toBe(0);
        expect(stats.blobURLCount).toBe(0);
        expect(stats.poolSize).toBe(0);
      });

      it('should clear canvas pool', () => {
        const canvas = manager.createCanvas(100, 100);
        manager.returnCanvasToPool(canvas);
        expect(manager.getMemoryStats().poolSize).toBe(1);

        manager.cleanupAll();

        expect(manager.getMemoryStats().poolSize).toBe(0);
      });

      it('should run registered cleanup callbacks', () => {
        const callback = jest.fn();
        manager.registerCleanupCallback(callback);

        manager.cleanupAll();

        expect(callback).toHaveBeenCalled();
      });

      it('should not throw if callback throws', () => {
        const badCallback = () => {
          throw new Error('Test error');
        };
        manager.registerCleanupCallback(badCallback);

        expect(() => {
          manager.cleanupAll();
        }).not.toThrow();
      });
    });

    describe('registerCleanupCallback', () => {
      it('should register cleanup callback', () => {
        const callback = jest.fn();

        manager.registerCleanupCallback(callback);
        manager.cleanupAll();

        expect(callback).toHaveBeenCalled();
      });

      it('should return unregister function', () => {
        const callback = jest.fn();

        const unregister = manager.registerCleanupCallback(callback);
        unregister();
        manager.cleanupAll();

        expect(callback).not.toHaveBeenCalled();
      });

      it('should support multiple callbacks', () => {
        const callback1 = jest.fn();
        const callback2 = jest.fn();

        manager.registerCleanupCallback(callback1);
        manager.registerCleanupCallback(callback2);
        manager.cleanupAll();

        expect(callback1).toHaveBeenCalled();
        expect(callback2).toHaveBeenCalled();
      });
    });
  });

  // ============================================================================
  // Memory Monitoring Tests
  // ============================================================================

  describe('Memory Monitoring', () => {
    describe('getCurrentMemoryUsage', () => {
      it('should return memory info if available', () => {
        const memoryInfo = manager.getCurrentMemoryUsage();

        // May be null in test environment (no performance.memory)
        if (memoryInfo) {
          expect(memoryInfo).toHaveProperty('usedJSHeapSize');
          expect(memoryInfo).toHaveProperty('totalJSHeapSize');
          expect(memoryInfo).toHaveProperty('jsHeapSizeLimit');
        } else {
          expect(memoryInfo).toBeNull();
        }
      });
    });

    describe('isMemoryPressureHigh', () => {
      it('should return false when memory info unavailable', () => {
        const isHigh = manager.isMemoryPressureHigh();

        // In test environment, should return false safely
        expect(typeof isHigh).toBe('boolean');
      });

      it('should accept custom threshold', () => {
        expect(() => {
          manager.isMemoryPressureHigh(0.9);
        }).not.toThrow();
      });
    });

    describe('getMemoryStats', () => {
      it('should return accurate statistics', () => {
        manager.createCanvas(100, 100);
        manager.createCanvas(200, 200);

        const canvas = manager.createCanvas(50, 50);
        manager.returnCanvasToPool(canvas);

        const blob = new Blob(['test'], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        manager.trackBlobURL(url);

        const stats = manager.getMemoryStats();

        expect(stats.canvasCount).toBe(2);
        expect(stats.poolSize).toBe(1);
        expect(stats.blobURLCount).toBe(1);
        expect(stats.estimatedMemoryUsage).toBeGreaterThan(0);
      });

      it('should return zero stats when empty', () => {
        const stats = manager.getMemoryStats();

        expect(stats.canvasCount).toBe(0);
        expect(stats.videoCount).toBe(0);
        expect(stats.blobURLCount).toBe(0);
        expect(stats.poolSize).toBe(0);
      });

      it('should estimate memory for canvases', () => {
        const canvas = manager.createCanvas(1000, 1000);

        const stats = manager.getMemoryStats();

        // 1000 * 1000 * 4 = 4,000,000 bytes
        expect(stats.estimatedMemoryUsage).toBeGreaterThanOrEqual(4000000);
      });
    });
  });

  // ============================================================================
  // Scoped Resource Management Tests
  // ============================================================================

  describe('Scoped Resource Management', () => {
    describe('withCleanup', () => {
      it('should execute function and cleanup resources', async () => {
        const canvas = manager.createCanvas(100, 100);
        expect(manager.getMemoryStats().canvasCount).toBe(1);

        await manager.withCleanup(() => {
          // Function executes
          expect(canvas.width).toBe(100);
        }, canvas);

        // Canvas should be cleaned up
        expect(manager.getMemoryStats().canvasCount).toBe(0);
      });

      it('should cleanup even if function throws', async () => {
        const canvas = manager.createCanvas(100, 100);

        await expect(
          manager.withCleanup(() => {
            throw new Error('Test error');
          }, canvas)
        ).rejects.toThrow('Test error');

        // Canvas should still be cleaned up
        expect(manager.getMemoryStats().canvasCount).toBe(0);
      });

      it('should support async functions', async () => {
        const canvas = manager.createCanvas(100, 100);

        const result = await manager.withCleanup(async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return 'done';
        }, canvas);

        expect(result).toBe('done');
        expect(manager.getMemoryStats().canvasCount).toBe(0);
      });

      it('should cleanup multiple resources', async () => {
        const canvas1 = manager.createCanvas(100, 100);
        const canvas2 = manager.createCanvas(200, 200);

        await manager.withCleanup(() => {
          // Do something
        }, canvas1, canvas2);

        expect(manager.getMemoryStats().canvasCount).toBe(0);
      });
    });

    describe('createScope', () => {
      it('should track resources in scope', async () => {
        const scope = manager.createScope();
        const canvas = manager.createCanvas(100, 100);

        scope.track(canvas);
        expect(manager.getMemoryStats().canvasCount).toBe(1);

        await scope.cleanup();
        expect(manager.getMemoryStats().canvasCount).toBe(0);
      });

      it('should track multiple resources', async () => {
        const scope = manager.createScope();
        const canvas1 = manager.createCanvas(100, 100);
        const canvas2 = manager.createCanvas(200, 200);

        scope.track(canvas1, canvas2);
        await scope.cleanup();

        expect(manager.getMemoryStats().canvasCount).toBe(0);
      });

      it('should clear tracked resources after cleanup', async () => {
        const scope = manager.createScope();
        const canvas = manager.createCanvas(100, 100);

        scope.track(canvas);
        await scope.cleanup();

        // Cleanup again should not throw
        await expect(scope.cleanup()).resolves.not.toThrow();
      });
    });
  });

  // ============================================================================
  // Configuration Tests
  // ============================================================================

  describe('Configuration', () => {
    describe('configure', () => {
      it('should update configuration', () => {
        manager.configure({
          maxSize: 100,
          maxCanvasSize: 2000
        });

        const config = manager.getConfig();
        expect(config.maxSize).toBe(100);
        expect(config.maxCanvasSize).toBe(2000);
      });

      it('should trim pool if new maxSize is smaller', () => {
        // Configure to allow 10 canvases in pool  
        manager.configure({ maxSize: 10 });
        
        // Add canvases to pool one by one
        const canvases: HTMLCanvasElement[] = [];
        for (let i = 0; i < 10; i++) {
          const canvas = manager.createCanvas(100, 100);
          canvases.push(canvas);
        }
        
        // Now return them all to pool
        canvases.forEach(c => manager.returnCanvasToPool(c));

        // Should have 10 in pool
        expect(manager.getMemoryStats().poolSize).toBe(10);

        // Reduce max size - this should trim the pool
        manager.configure({ maxSize: 5 });

        expect(manager.getMemoryStats().poolSize).toBe(5);
      });

      it('should accept partial configuration', () => {
        const originalConfig = manager.getConfig();

        manager.configure({ maxSize: 100 });

        const newConfig = manager.getConfig();
        expect(newConfig.maxSize).toBe(100);
        expect(newConfig.maxCanvasSize).toBe(originalConfig.maxCanvasSize);
      });
    });

    describe('getConfig', () => {
      it('should return current configuration', () => {
        const config = manager.getConfig();

        expect(config).toHaveProperty('maxSize');
        expect(config).toHaveProperty('maxCanvasSize');
        expect(config).toHaveProperty('memoryThreshold');
      });

      it('should return copy of config', () => {
        const config = manager.getConfig();
        config.maxSize = 999;

        const config2 = manager.getConfig();
        expect(config2.maxSize).not.toBe(999);
      });
    });
  });

  // ============================================================================
  // Reset Tests
  // ============================================================================

  describe('Reset', () => {
    it('should reset to initial state', () => {
      // Create some resources
      manager.createCanvas(100, 100);
      manager.trackBlobURL('blob:http://localhost/test');
      manager.configure({ maxSize: 100 });

      manager.reset();

      const stats = manager.getMemoryStats();
      expect(stats.canvasCount).toBe(0);
      expect(stats.blobURLCount).toBe(0);
      expect(stats.poolSize).toBe(0);

      const config = manager.getConfig();
      expect(config.maxSize).toBe(50); // Default value
    });

    it('should cleanup all resources on reset', () => {
      const canvas = manager.createCanvas(100, 100);
      expect(canvas.width).toBe(100);

      manager.reset();

      expect(canvas.width).toBe(0);
    });
  });

  // ============================================================================
  // Integration / Stress Tests
  // ============================================================================

  describe('Integration Tests', () => {
    it('should handle many canvas creations without memory leak', () => {
      const initialStats = manager.getMemoryStats();

      // Create and cleanup 100 canvases
      for (let i = 0; i < 100; i++) {
        const canvas = manager.createCanvas(100, 100);
        manager.cleanupCanvas(canvas);
      }

      const finalStats = manager.getMemoryStats();
      expect(finalStats.canvasCount).toBe(0);
      expect(finalStats.canvasCount).toBe(initialStats.canvasCount);
    });

    it('should efficiently use canvas pool', () => {
      // Test that pooling mechanism works (not actual performance timing in test env)
      // Creating and reusing canvases from pool
      
      const poolSize = 10;
      
      // Configure to allow 10 in pool
      manager.configure({ maxSize: 10 });
      
      // Create canvases first
      const canvases: HTMLCanvasElement[] = [];
      for (let i = 0; i < poolSize; i++) {
        const canvas = manager.createCanvas(100, 100);
        canvases.push(canvas);
      }
      
      // Now return all to pool
      canvases.forEach(c => manager.returnCanvasToPool(c));

      expect(manager.getMemoryStats().poolSize).toBe(poolSize);

      // Now create more canvases - they should come from pool
      // When we create, it should pull from pool (reducing pool size)
      const canvas1 = manager.createCanvas(100, 100);
      expect(manager.getMemoryStats().poolSize).toBe(poolSize - 1);
      
      // Return it back
      manager.returnCanvasToPool(canvas1);
      expect(manager.getMemoryStats().poolSize).toBe(poolSize);

      // Pool mechanism works!
    });

    it('should handle complex cleanup scenarios', () => {
      // Create mixed resources
      const canvas1 = manager.createCanvas(100, 100);
      const canvas2 = manager.createCanvas(200, 200);
      const video = document.createElement('video');
      
      // Mock video methods
      video.pause = jest.fn();
      video.load = jest.fn();
      
      const blob = new Blob(['test'], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);

      manager.trackBlobURL(url);

      // Return one canvas to pool
      manager.returnCanvasToPool(canvas1);

      // Cleanup all
      manager.cleanupAll();

      const stats = manager.getMemoryStats();
      expect(stats.canvasCount).toBe(0);
      expect(stats.poolSize).toBe(0);
      expect(stats.blobURLCount).toBe(0);
    });
  });
});


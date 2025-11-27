/**
 * Integration Tests - Full Analysis Workflow (Playwright Browser Tests)
 * 
 * Tests the complete VideoIntel.analyze() method which coordinates
 * all features (metadata, thumbnails, scenes, colors) in a single operation.
 * 
 * This is the Playwright version that runs in real browsers.
 */

import { test, expect, Page } from '@playwright/test';
import { 
  setupVideoIntelPage,
  loadTestVideo,
  TEST_VIDEOS
} from './playwright-setup';

test.describe('VideoIntel.analyze() - Full Integration', () => {
  test.beforeEach(async ({ page }) => {
    await setupVideoIntelPage(page);
    await loadTestVideo(page, TEST_VIDEOS.fixtures.short);
  });

  test.describe('Complete Analysis', () => {
    test('should analyze video with all features enabled', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;

        return await videoIntel.analyze(videoFile, {
          thumbnails: { count: 5 },
          scenes: true,
          colors: { count: 5 },
          metadata: true
        });
      });

      // Verify metadata
      expect(result.metadata).toBeDefined();
      expect(result.metadata.duration).toBeGreaterThan(0);
      expect(result.metadata.width).toBeGreaterThan(0);
      expect(result.metadata.height).toBeGreaterThan(0);

      // Verify thumbnails
      expect(result.thumbnails).toBeDefined();
      expect(result.thumbnails).toHaveLength(5);
      for (const thumb of result.thumbnails) {
        expect(thumb.timestamp).toBeGreaterThanOrEqual(0);
        expect(thumb.score).toBeGreaterThan(0);
      }

      // Verify scenes
      expect(result.scenes).toBeDefined();
      expect(result.scenes.length).toBeGreaterThan(0);
      for (const scene of result.scenes) {
        expect(scene.start).toBeGreaterThanOrEqual(0);
        expect(scene.end).toBeGreaterThan(scene.start);
        expect(scene.confidence).toBeGreaterThan(0);
      }

      // Verify colors
      expect(result.colors).toBeDefined();
      expect(result.colors).toHaveLength(5);
      for (const color of result.colors) {
        expect(color.hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(color.percentage).toBeGreaterThan(0);
      }
    });

    test('should analyze video with default options', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;
        return await videoIntel.analyze(videoFile);
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    test('should analyze medium-length video', async ({ page }) => {
      await loadTestVideo(page, TEST_VIDEOS.fixtures.medium);

      const result = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;

        return await videoIntel.analyze(videoFile, {
          metadata: true,
          thumbnails: { count: 5 },
          scenes: true
        });
      });

      expect(result.metadata).toBeDefined();
      expect(result.metadata.duration).toBeGreaterThan(10); // Medium video > 10s

      expect(result.thumbnails).toBeDefined();
      expect(result.thumbnails).toHaveLength(5);

      expect(result.scenes).toBeDefined();
      expect(result.scenes.length).toBeGreaterThan(0);
    });
  });

  test.describe('Progress Tracking', () => {
    test('should track progress correctly through all features', async ({ page }) => {
      const progressValues = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;
        const progressValues: number[] = [];

        await videoIntel.analyze(videoFile, {
          thumbnails: { count: 3 },
          scenes: true,
          colors: { count: 5 },
          metadata: true,
          onProgress: (progress: number) => {
            progressValues.push(progress);
          }
        });

        return progressValues;
      });

      // Should have progress updates
      expect(progressValues.length).toBeGreaterThan(0);
      
      // First progress should be 0 or greater
      expect(progressValues[0]).toBeGreaterThanOrEqual(0);
      
      // Last progress should be 100
      expect(progressValues[progressValues.length - 1]).toBe(100);

      // Progress should be monotonically increasing
      for (let i = 1; i < progressValues.length; i++) {
        expect(progressValues[i]).toBeGreaterThanOrEqual(progressValues[i - 1]);
      }
    });

    test('should provide progress updates for each feature', async ({ page }) => {
      const progressValues = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;
        const progressValues: number[] = [];

        await videoIntel.analyze(videoFile, {
          metadata: true,
          thumbnails: { count: 3 },
          scenes: true,
          colors: { count: 5 },
          onProgress: (p: number) => progressValues.push(p)
        });

        return progressValues;
      });

      // With 4 features, we should have at least 4 progress updates
      expect(progressValues.length).toBeGreaterThanOrEqual(4);
    });

    test('should handle progress callback errors gracefully', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;

        const badCallback = () => {
          throw new Error('Progress callback error');
        };

        // Should not fail even if progress callback throws
        return await videoIntel.analyze(videoFile, {
          metadata: true,
          onProgress: badCallback
        });
      });

      expect(result).toBeDefined();
    });
  });

  test.describe('Partial Feature Requests', () => {
    test('should return only metadata when only metadata requested', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;
        return await videoIntel.analyze(videoFile, { metadata: true });
      });

      expect(result.metadata).toBeDefined();
      expect(result.thumbnails).toBeUndefined();
      expect(result.scenes).toBeUndefined();
      expect(result.colors).toBeUndefined();
    });

    test('should return only thumbnails when only thumbnails requested', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;
        return await videoIntel.analyze(videoFile, { thumbnails: { count: 3 } });
      });

      expect(result.thumbnails).toBeDefined();
      expect(result.thumbnails).toHaveLength(3);
      expect(result.metadata).toBeUndefined();
      expect(result.scenes).toBeUndefined();
      expect(result.colors).toBeUndefined();
    });

    test('should return metadata and thumbnails when both requested', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;
        return await videoIntel.analyze(videoFile, {
          metadata: true,
          thumbnails: { count: 5 }
        });
      });

      expect(result.metadata).toBeDefined();
      expect(result.thumbnails).toBeDefined();
      expect(result.thumbnails).toHaveLength(5);
      expect(result.scenes).toBeUndefined();
      expect(result.colors).toBeUndefined();
    });

    test('should handle boolean true for thumbnail options', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;
        return await videoIntel.analyze(videoFile, { thumbnails: true });
      });

      expect(result.thumbnails).toBeDefined();
      expect(result.thumbnails.length).toBeGreaterThan(0);
    });

    test('should handle boolean true for scene options', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;
        return await videoIntel.analyze(videoFile, { scenes: true });
      });

      expect(result.scenes).toBeDefined();
      expect(result.scenes.length).toBeGreaterThan(0);
    });

    test('should handle boolean true for color options', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;
        return await videoIntel.analyze(videoFile, { colors: true });
      });

      expect(result.colors).toBeDefined();
      expect(result.colors.length).toBeGreaterThan(0);
    });
  });

  test.describe('Resource Cleanup', () => {
    test('should cleanup resources after successful analysis', async ({ page }) => {
      // Run analysis multiple times
      for (let i = 0; i < 5; i++) {
        const result = await page.evaluate(async () => {
          const videoIntel = (window as any).videoIntel;
          const videoFile = (window as any).testVideoFile;
          return await videoIntel.analyze(videoFile, {
            metadata: true,
            thumbnails: { count: 3 }
          });
        });
        expect(result.metadata).toBeDefined();
      }

      // Should still be able to analyze
      const finalResult = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;
        return await videoIntel.analyze(videoFile, { metadata: true });
      });
      expect(finalResult.metadata).toBeDefined();
    });

    test('should not leak memory over multiple analyses', async ({ page }) => {
      const memoryData = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;
        const iterations = 10;
        const memoryReadings: number[] = [];

        for (let i = 0; i < iterations; i++) {
          await videoIntel.analyze(videoFile, { metadata: true });
          
          if ((performance as any).memory) {
            memoryReadings.push((performance as any).memory.usedJSHeapSize);
          }
        }

        return memoryReadings;
      });

      if (memoryData.length > 0) {
        // Memory shouldn't grow significantly
        const first5Avg = memoryData.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
        const last5Avg = memoryData.slice(-5).reduce((a, b) => a + b, 0) / 5;
        const growth = last5Avg - first5Avg;

        // Allow up to 10MB growth
        expect(growth).toBeLessThan(10 * 1024 * 1024);
      }
    });
  });

  test.describe('URL-based Analysis', () => {
    test('should analyze video from URL', async ({ page }) => {
      const result = await page.evaluate(async (url) => {
        const videoIntel = (window as any).videoIntel;
        return await videoIntel.analyze(url, {
          metadata: true,
          thumbnails: { count: 3 }
        });
      }, TEST_VIDEOS.urls.short);

      expect(result.metadata).toBeDefined();
      expect(result.thumbnails).toBeDefined();
      expect(result.thumbnails).toHaveLength(3);
    });

    test('should handle URL with all features', async ({ page }) => {
      const result = await page.evaluate(async (url) => {
        const videoIntel = (window as any).videoIntel;
        return await videoIntel.analyze(url, {
          metadata: true,
          thumbnails: { count: 3 },
          scenes: true,
          colors: { count: 5 }
        });
      }, TEST_VIDEOS.urls.short);

      expect(result.metadata).toBeDefined();
      expect(result.thumbnails).toBeDefined();
      expect(result.scenes).toBeDefined();
      expect(result.colors).toBeDefined();
    });
  });

  test.describe('Custom Options', () => {
    test('should respect thumbnail count option', async ({ page }) => {
      const counts = [1, 3, 5];

      for (const count of counts) {
        const result = await page.evaluate(async (count) => {
          const videoIntel = (window as any).videoIntel;
          const videoFile = (window as any).testVideoFile;
          return await videoIntel.analyze(videoFile, { thumbnails: { count } });
        }, count);

        expect(result.thumbnails).toBeDefined();
        // For short videos, we might get fewer due to quality/diversity filters
        expect(result.thumbnails.length).toBeGreaterThanOrEqual(Math.min(count, 1));
        expect(result.thumbnails.length).toBeLessThanOrEqual(count);
      }
    });

    test('should respect thumbnail quality option', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;
        return await videoIntel.analyze(videoFile, {
          thumbnails: { count: 3, quality: 0.5 }
        });
      });

      expect(result.thumbnails).toBeDefined();
      expect(result.thumbnails).toHaveLength(3);
      
      // Thumbnails should have valid data
      for (const thumb of result.thumbnails) {
        expect(thumb.timestamp).toBeGreaterThanOrEqual(0);
      }
    });

    test('should respect scene detection threshold', async ({ page }) => {
      const results = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;

        const result1 = await videoIntel.analyze(videoFile, {
          scenes: { threshold: 0.2 } // More sensitive
        });

        const result2 = await videoIntel.analyze(videoFile, {
          scenes: { threshold: 0.5 } // Less sensitive
        });

        return { result1, result2 };
      });

      expect(results.result1.scenes).toBeDefined();
      expect(results.result2.scenes).toBeDefined();

      // Lower threshold should detect more scenes
      expect(results.result1.scenes.length).toBeGreaterThanOrEqual(results.result2.scenes.length);
    });

    test('should respect color count option', async ({ page }) => {
      const counts = [3, 5, 10];

      for (const count of counts) {
        const result = await page.evaluate(async (count) => {
          const videoIntel = (window as any).videoIntel;
          const videoFile = (window as any).testVideoFile;
          return await videoIntel.analyze(videoFile, { colors: { count } });
        }, count);

        expect(result.colors).toBeDefined();
        expect(result.colors).toHaveLength(count);
      }
    });
  });

  test.describe('Different Video Types', () => {
    test('should analyze video with distinct scenes', async ({ page }) => {
      await loadTestVideo(page, TEST_VIDEOS.fixtures.scenes);

      const result = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;

        return await videoIntel.analyze(videoFile, {
          scenes: true,
          thumbnails: { count: 5 }
        });
      });

      expect(result.scenes).toBeDefined();
      expect(result.thumbnails).toBeDefined();

      // Video with distinct scenes should have multiple scenes
      expect(result.scenes.length).toBeGreaterThan(1);
    });
  });

  test.describe('Result Structure', () => {
    test('should return properly typed result object', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;

        return await videoIntel.analyze(videoFile, {
          metadata: true,
          thumbnails: { count: 3 },
          scenes: true,
          colors: { count: 5 }
        });
      });

      // Check result structure
      expect(result).toHaveProperty('metadata');
      expect(result).toHaveProperty('thumbnails');
      expect(result).toHaveProperty('scenes');
      expect(result).toHaveProperty('colors');

      // Metadata structure
      if (result.metadata) {
        expect(result.metadata).toHaveProperty('duration');
        expect(result.metadata).toHaveProperty('width');
        expect(result.metadata).toHaveProperty('height');
      }

      // Thumbnails structure
      if (result.thumbnails) {
        for (const thumb of result.thumbnails) {
          expect(thumb).toHaveProperty('timestamp');
          expect(thumb).toHaveProperty('score');
          expect(thumb).toHaveProperty('width');
          expect(thumb).toHaveProperty('height');
        }
      }

      // Scenes structure
      if (result.scenes) {
        for (const scene of result.scenes) {
          expect(scene).toHaveProperty('start');
          expect(scene).toHaveProperty('end');
          expect(scene).toHaveProperty('confidence');
        }
      }

      // Colors structure
      if (result.colors) {
        for (const color of result.colors) {
          expect(color).toHaveProperty('rgb');
          expect(color).toHaveProperty('hex');
          expect(color).toHaveProperty('hsl');
          expect(color).toHaveProperty('percentage');
        }
      }
    });
  });
});


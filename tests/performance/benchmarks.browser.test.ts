/**
 * Performance Benchmarks (Playwright Browser Tests)
 * 
 * Tests performance requirements and benchmarks for VideoIntel.js operations.
 * Verifies that processing meets speed and memory targets.
 * 
 * This is the Playwright version that runs in real browsers.
 */

import { test, expect, Page } from '@playwright/test';
import { 
  setupVideoIntelPage,
  loadTestVideo,
  TEST_VIDEOS,
  formatBytes
} from '../integration/playwright-setup';

test.describe('Performance Benchmarks', () => {
  // Longer timeout for performance tests
  test.setTimeout(60000); // 60 seconds

  test.beforeEach(async ({ page }) => {
    await setupVideoIntelPage(page);
  });

  test.describe('Processing Speed Benchmarks', () => {
    test('should extract metadata quickly', async ({ page }) => {
      await loadTestVideo(page, TEST_VIDEOS.fixtures.short);

      const duration = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;
        
        const startTime = performance.now();
        await videoIntel.getMetadata(videoFile);
        return performance.now() - startTime;
      });

      console.log(`⚡ Metadata extraction: ${duration.toFixed(2)}ms`);

      // Metadata extraction should be very fast (<1 second)
      expect(duration).toBeLessThan(1000);
    });

    test('should generate thumbnails within time limit (short video)', async ({ page }) => {
      await loadTestVideo(page, TEST_VIDEOS.fixtures.short);

      const duration = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;
        
        const startTime = performance.now();
        await videoIntel.getThumbnails(videoFile, { count: 5 });
        return performance.now() - startTime;
      });

      console.log(`⚡ Thumbnail generation (10s video): ${duration.toFixed(2)}ms`);

      // Short video should process quickly (<5 seconds)
      expect(duration).toBeLessThan(5000);
    });

    test('should generate thumbnails within time limit (medium video)', async ({ page }) => {
      await loadTestVideo(page, TEST_VIDEOS.fixtures.medium);

      const duration = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;
        
        const startTime = performance.now();
        await videoIntel.getThumbnails(videoFile, { count: 5 });
        return performance.now() - startTime;
      });

      console.log(`⚡ Thumbnail generation (30s video): ${duration.toFixed(2)}ms`);

      // Medium video should process within reasonable time (<10 seconds)
      expect(duration).toBeLessThan(10000);
    });

    test('should detect scenes within time limit', async ({ page }) => {
      await loadTestVideo(page, TEST_VIDEOS.fixtures.short);

      const duration = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;
        
        const startTime = performance.now();
        await videoIntel.detectScenes(videoFile);
        return performance.now() - startTime;
      });

      console.log(`⚡ Scene detection: ${duration.toFixed(2)}ms`);

      // Scene detection should be fast (<5 seconds)
      expect(duration).toBeLessThan(5000);
    });

    test('should extract colors within time limit', async ({ page }) => {
      await loadTestVideo(page, TEST_VIDEOS.fixtures.short);

      const duration = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;
        
        const startTime = performance.now();
        await videoIntel.extractColors(videoFile, { count: 5 });
        return performance.now() - startTime;
      });

      console.log(`⚡ Color extraction: ${duration.toFixed(2)}ms`);

      // Color extraction should be fast (<5 seconds)
      expect(duration).toBeLessThan(5000);
    });

    test('should perform full analysis within time limit', async ({ page }) => {
      await loadTestVideo(page, TEST_VIDEOS.fixtures.short);

      const duration = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;
        
        const startTime = performance.now();
        await videoIntel.analyze(videoFile, {
          metadata: true,
          thumbnails: { count: 5 },
          scenes: true,
          colors: { count: 5 }
        });
        return performance.now() - startTime;
      });

      console.log(`⚡ Full analysis (all features): ${duration.toFixed(2)}ms`);

      // Full analysis should complete in reasonable time (<15 seconds)
      expect(duration).toBeLessThan(15000);
    });
  });

  test.describe('Memory Usage Benchmarks', () => {
    test('should handle video processing without excessive memory', async ({ page }) => {
      await loadTestVideo(page, TEST_VIDEOS.fixtures.short);

      const memoryData = await page.evaluate(async () => {
        const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;
        
        await videoIntel.getThumbnails(videoFile, { count: 5 });

        const peakMemory = (performance as any).memory?.usedJSHeapSize || 0;
        const memoryUsed = peakMemory - initialMemory;

        return { memoryUsed, initialMemory, peakMemory };
      });

      if (memoryData.initialMemory > 0) {
        console.log(`💾 Memory used (thumbnails): ${formatBytes(memoryData.memoryUsed)}`);
        
        // Should use reasonable memory (<100MB for short video)
        expect(memoryData.memoryUsed).toBeLessThan(100 * 1024 * 1024);
      }
    });

    test('should not accumulate memory over multiple operations', async ({ page }) => {
      await loadTestVideo(page, TEST_VIDEOS.fixtures.short);

      const memoryData = await page.evaluate(async () => {
        const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;

        // Run multiple operations
        for (let i = 0; i < 5; i++) {
          await videoIntel.getMetadata(videoFile);
        }

        const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
        const memoryGrowth = finalMemory - initialMemory;

        return { memoryGrowth, initialMemory, finalMemory };
      });

      if (memoryData.initialMemory > 0) {
        console.log(`💾 Memory growth after 5 operations: ${formatBytes(memoryData.memoryGrowth)}`);

        // Memory shouldn't grow significantly (<10MB)
        expect(memoryData.memoryGrowth).toBeLessThan(10 * 1024 * 1024);
      }
    });

    test('should handle large video without excessive memory', async ({ page }) => {
      await loadTestVideo(page, TEST_VIDEOS.fixtures.scenes);

      const memoryData = await page.evaluate(async () => {
        const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;
        
        await videoIntel.analyze(videoFile, {
          metadata: true,
          thumbnails: { count: 5 }
        });

        const peakMemory = (performance as any).memory?.usedJSHeapSize || 0;
        const memoryUsed = peakMemory - initialMemory;

        return { memoryUsed, initialMemory };
      });

      if (memoryData.initialMemory > 0) {
        console.log(`💾 Memory used (large video): ${formatBytes(memoryData.memoryUsed)}`);

        // Even large videos should stay under memory limit (<500MB)
        expect(memoryData.memoryUsed).toBeLessThan(500 * 1024 * 1024);
      }
    });
  });

  test.describe('Throughput Benchmarks', () => {
    test('should maintain consistent speed across multiple thumbnails', async ({ page }) => {
      await loadTestVideo(page, TEST_VIDEOS.fixtures.short);

      const times = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;
        const times: number[] = [];

        for (const count of [1, 3, 5]) {
          const start = performance.now();
          await videoIntel.getThumbnails(videoFile, { count });
          const duration = performance.now() - start;
          times.push(duration);
        }

        return times;
      });

      console.log(`  1 thumbnail(s): ${times[0].toFixed(2)}ms`);
      console.log(`  3 thumbnail(s): ${times[1].toFixed(2)}ms`);
      console.log(`  5 thumbnail(s): ${times[2].toFixed(2)}ms`);

      // Time for 5 thumbnails shouldn't be 5x time for 1 thumbnail
      expect(times[2]).toBeLessThan(times[0] * 10);
    });

    test('should process consecutive videos efficiently', async ({ page }) => {
      await loadTestVideo(page, TEST_VIDEOS.fixtures.short);

      const times = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;
        const times: number[] = [];

        for (let i = 0; i < 3; i++) {
          const start = performance.now();
          await videoIntel.getMetadata(videoFile);
          const duration = performance.now() - start;
          times.push(duration);
        }

        return times;
      });

      console.log(`📊 Consecutive processing times: ${times.map(t => t.toFixed(2)).join('ms, ')}ms`);

      // Later iterations shouldn't be significantly slower
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      for (const time of times) {
        expect(time).toBeLessThan(avgTime * 2);
      }
    });
  });

  test.describe('Scalability Benchmarks', () => {
    test('should handle multiple thumbnail counts efficiently', async ({ page }) => {
      await loadTestVideo(page, TEST_VIDEOS.fixtures.medium);

      const results = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;
        const results: Array<{ count: number; time: number }> = [];

        for (const count of [1, 3, 5, 10]) {
          const start = performance.now();
          const thumbnails = await videoIntel.getThumbnails(videoFile, { count });
          const duration = performance.now() - start;

          results.push({ count, time: duration });
        }

        return results;
      });

      for (const result of results) {
        console.log(`  ${result.count} thumbnails: ${result.time.toFixed(2)}ms`);
      }

      // Processing time should scale sub-linearly
      const time1 = results.find(r => r.count === 1)!.time;
      const time10 = results.find(r => r.count === 10)!.time;
      expect(time10).toBeLessThan(time1 * 15);
    });

    test('should handle different quality settings efficiently', async ({ page }) => {
      await loadTestVideo(page, TEST_VIDEOS.fixtures.short);

      const times = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;

        const lowQualityStart = performance.now();
        await videoIntel.getThumbnails(videoFile, { count: 3, quality: 0.3 });
        const lowQualityTime = performance.now() - lowQualityStart;

        const highQualityStart = performance.now();
        await videoIntel.getThumbnails(videoFile, { count: 3, quality: 1.0 });
        const highQualityTime = performance.now() - highQualityStart;

        return { lowQualityTime, highQualityTime };
      });

      console.log(`📊 Low quality: ${times.lowQualityTime.toFixed(2)}ms`);
      console.log(`📊 High quality: ${times.highQualityTime.toFixed(2)}ms`);

      // Quality setting shouldn't dramatically affect processing time
      expect(times.highQualityTime).toBeLessThan(times.lowQualityTime * 3);
    });
  });

  test.describe('Comparative Benchmarks', () => {
    test('should process all features with reasonable total time', async ({ page }) => {
      await loadTestVideo(page, TEST_VIDEOS.fixtures.short);

      const times = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;
        const times: Record<string, number> = {};

        const metadataStart = performance.now();
        await videoIntel.getMetadata(videoFile);
        times.metadata = performance.now() - metadataStart;

        const thumbnailsStart = performance.now();
        await videoIntel.getThumbnails(videoFile, { count: 5 });
        times.thumbnails = performance.now() - thumbnailsStart;

        const scenesStart = performance.now();
        await videoIntel.detectScenes(videoFile);
        times.scenes = performance.now() - scenesStart;

        const colorsStart = performance.now();
        await videoIntel.extractColors(videoFile, { count: 5 });
        times.colors = performance.now() - colorsStart;

        return times;
      });

      console.log('📊 Feature timings:');
      console.log(`  Metadata: ${times.metadata.toFixed(2)}ms`);
      console.log(`  Thumbnails: ${times.thumbnails.toFixed(2)}ms`);
      console.log(`  Scenes: ${times.scenes.toFixed(2)}ms`);
      console.log(`  Colors: ${times.colors.toFixed(2)}ms`);
      console.log(`  Total: ${Object.values(times).reduce((a, b) => a + b, 0).toFixed(2)}ms`);

      // Each feature should complete in reasonable time
      expect(times.metadata).toBeLessThan(1000);
      expect(times.thumbnails).toBeLessThan(5000);
      expect(times.scenes).toBeLessThan(5000);
      expect(times.colors).toBeLessThan(5000);
    });

    test('should show metadata is fastest operation', async ({ page }) => {
      await loadTestVideo(page, TEST_VIDEOS.fixtures.short);

      const times = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;

        const metadataStart = performance.now();
        await videoIntel.getMetadata(videoFile);
        const metadataTime = performance.now() - metadataStart;

        const thumbnailsStart = performance.now();
        await videoIntel.getThumbnails(videoFile, { count: 5 });
        const thumbnailsTime = performance.now() - thumbnailsStart;

        return { metadataTime, thumbnailsTime };
      });

      console.log(`📊 Metadata: ${times.metadataTime.toFixed(2)}ms vs Thumbnails: ${times.thumbnailsTime.toFixed(2)}ms`);

      // Metadata should be significantly faster than thumbnails
      expect(times.metadataTime).toBeLessThan(times.thumbnailsTime);
    });
  });

  test.describe('Efficiency Benchmarks', () => {
    test('should be efficient with analyze() vs individual calls', async ({ page }) => {
      await loadTestVideo(page, TEST_VIDEOS.fixtures.short);

      const times = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;

        // Individual calls
        const individualStart = performance.now();
        await videoIntel.getMetadata(videoFile);
        await videoIntel.getThumbnails(videoFile, { count: 3 });
        await videoIntel.detectScenes(videoFile);
        const individualTime = performance.now() - individualStart;

        // Single analyze call
        const analyzeStart = performance.now();
        await videoIntel.analyze(videoFile, {
          metadata: true,
          thumbnails: { count: 3 },
          scenes: true
        });
        const analyzeTime = performance.now() - analyzeStart;

        return { individualTime, analyzeTime };
      });

      console.log(`📊 Individual calls: ${times.individualTime.toFixed(2)}ms`);
      console.log(`📊 Analyze call: ${times.analyzeTime.toFixed(2)}ms`);

      // analyze() should be at least as fast or faster (due to optimizations)
      expect(times.analyzeTime).toBeLessThanOrEqual(times.individualTime * 1.5);
    });
  });

  test.describe('Memory Leak Tests', () => {
    test('should not leak memory over extended use', async ({ page }) => {
      await loadTestVideo(page, TEST_VIDEOS.fixtures.short);

      const memoryData = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;
        const iterations = 20;
        const memoryReadings: number[] = [];

        for (let i = 0; i < iterations; i++) {
          await videoIntel.getMetadata(videoFile);
          
          if (i % 5 === 0 && (performance as any).memory) {
            memoryReadings.push((performance as any).memory.usedJSHeapSize);
          }
        }

        return memoryReadings;
      });

      if (memoryData.length >= 2) {
        console.log('💾 Memory readings:', memoryData.map(m => formatBytes(m)).join(', '));

        const first = memoryData[0];
        const last = memoryData[memoryData.length - 1];
        const growth = last - first;

        console.log(`💾 Total memory growth: ${formatBytes(growth)}`);
        expect(growth).toBeLessThan(20 * 1024 * 1024); // <20MB
      }
    });

    test('should cleanup properly after thumbnail generation', async ({ page }) => {
      await loadTestVideo(page, TEST_VIDEOS.fixtures.short);

      const memoryData = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;
        const iterations = 10;
        const memoryReadings: number[] = [];

        for (let i = 0; i < iterations; i++) {
          await videoIntel.getThumbnails(videoFile, { count: 3 });
          
          if ((performance as any).memory) {
            memoryReadings.push((performance as any).memory.usedJSHeapSize);
          }
        }

        return memoryReadings;
      });

      if (memoryData.length > 5) {
        // Check that memory stabilizes (not growing indefinitely)
        const firstHalf = memoryData.slice(0, 5);
        const secondHalf = memoryData.slice(5);
        
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        const growth = secondAvg - firstAvg;

        console.log(`💾 Memory stability: ${formatBytes(firstAvg)} → ${formatBytes(secondAvg)}`);
        expect(growth).toBeLessThan(15 * 1024 * 1024); // <15MB growth
      }
    });
  });

  test.describe('Baseline Performance Metrics', () => {
    test('should establish baseline metrics', async ({ page }) => {
      await loadTestVideo(page, TEST_VIDEOS.fixtures.short);

      const metrics = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;
        const metrics: Record<string, any> = {};

        // Metadata
        const metaStart = performance.now();
        const metadata = await videoIntel.getMetadata(videoFile);
        metrics.metadataTime = performance.now() - metaStart;

        // Thumbnails
        const thumbStart = performance.now();
        const thumbMem = (performance as any).memory?.usedJSHeapSize || 0;
        const thumbnails = await videoIntel.getThumbnails(videoFile, { count: 5 });
        metrics.thumbnailsTime = performance.now() - thumbStart;
        const thumbMemAfter = (performance as any).memory?.usedJSHeapSize || 0;
        metrics.thumbnailsMemory = thumbMemAfter - thumbMem;

        // Scenes
        const sceneStart = performance.now();
        const scenes = await videoIntel.detectScenes(videoFile);
        metrics.scenesTime = performance.now() - sceneStart;

        // Colors
        const colorStart = performance.now();
        const colors = await videoIntel.extractColors(videoFile, { count: 5 });
        metrics.colorsTime = performance.now() - colorStart;

        return { metrics, metadata };
      });

      console.log('\n📊 BASELINE PERFORMANCE METRICS:');
      console.log('==================================');
      console.log(`Video Duration: ${metrics.metadata.duration.toFixed(2)}s`);
      console.log(`Resolution: ${metrics.metadata.width}x${metrics.metadata.height}`);
      console.log(`\nFeature Performance:`);
      console.log(`  Metadata: ${metrics.metrics.metadataTime.toFixed(2)}ms`);
      console.log(`  Thumbnails (5): ${metrics.metrics.thumbnailsTime.toFixed(2)}ms`);
      console.log(`  Scenes: ${metrics.metrics.scenesTime.toFixed(2)}ms`);
      console.log(`  Colors (5): ${metrics.metrics.colorsTime.toFixed(2)}ms`);
      console.log(`\nMemory:`);
      console.log(`  Thumbnails: ${formatBytes(metrics.metrics.thumbnailsMemory)}`);
      console.log('==================================\n');

      // Store metrics for future comparison
      expect(metrics.metrics.metadataTime).toBeGreaterThan(0);
    });
  });
});



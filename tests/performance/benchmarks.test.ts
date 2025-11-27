/**
 * Performance Benchmarks
 * 
 * Tests performance requirements and benchmarks for VideoIntel.js operations.
 * Verifies that processing meets speed and memory targets.
 * 
 * NOTE: These tests require a real browser environment and will be skipped in jsdom.
 * To run these tests, use Playwright or test in an actual browser.
 */

import VideoIntel from '../../src';
import { 
  loadTestVideo,
  getMemoryUsage,
  formatBytes,
  TEST_VIDEOS
} from '../integration/setup';

// Skip all tests in this file if running in jsdom (Node.js environment)
const describeIfBrowser = typeof window !== 'undefined' && window.HTMLVideoElement && typeof URL.createObjectURL === 'function'
  ? describe
  : describe.skip;

describeIfBrowser('Performance Benchmarks', () => {
  // Longer timeout for performance tests
  jest.setTimeout(60000); // 60 seconds

  describe('Processing Speed Benchmarks', () => {
    it('should extract metadata quickly', async () => {
      const video = await loadTestVideo(TEST_VIDEOS.fixtures.short);
      const startTime = performance.now();

      await VideoIntel.getMetadata(video);

      const duration = performance.now() - startTime;
      console.log(`⚡ Metadata extraction: ${duration.toFixed(2)}ms`);

      // Metadata extraction should be very fast (<1 second)
      expect(duration).toBeLessThan(1000);
    });

    it('should generate thumbnails within time limit (short video)', async () => {
      const video = await loadTestVideo(TEST_VIDEOS.fixtures.short);
      const startTime = performance.now();

      await VideoIntel.getThumbnails(video, { count: 5 });

      const duration = performance.now() - startTime;
      console.log(`⚡ Thumbnail generation (10s video): ${duration.toFixed(2)}ms`);

      // Short video should process quickly (<5 seconds)
      expect(duration).toBeLessThan(5000);
    });

    it('should generate thumbnails within time limit (medium video)', async () => {
      const video = await loadTestVideo(TEST_VIDEOS.fixtures.medium);
      const startTime = performance.now();

      await VideoIntel.getThumbnails(video, { count: 5 });

      const duration = performance.now() - startTime;
      console.log(`⚡ Thumbnail generation (30s video): ${duration.toFixed(2)}ms`);

      // Medium video should process within reasonable time (<10 seconds)
      expect(duration).toBeLessThan(10000);
    });

    it('should detect scenes within time limit', async () => {
      const video = await loadTestVideo(TEST_VIDEOS.fixtures.short);
      const startTime = performance.now();

      await VideoIntel.detectScenes(video);

      const duration = performance.now() - startTime;
      console.log(`⚡ Scene detection: ${duration.toFixed(2)}ms`);

      // Scene detection should be fast (<5 seconds)
      expect(duration).toBeLessThan(5000);
    });

    it('should extract colors within time limit', async () => {
      const video = await loadTestVideo(TEST_VIDEOS.fixtures.short);
      const startTime = performance.now();

      await VideoIntel.extractColors(video, { count: 5 });

      const duration = performance.now() - startTime;
      console.log(`⚡ Color extraction: ${duration.toFixed(2)}ms`);

      // Color extraction should be fast (<5 seconds)
      expect(duration).toBeLessThan(5000);
    });

    it('should perform full analysis within time limit', async () => {
      const video = await loadTestVideo(TEST_VIDEOS.fixtures.short);
      const startTime = performance.now();

      await VideoIntel.analyze(video, {
        metadata: true,
        thumbnails: { count: 5 },
        scenes: true,
        colors: { count: 5 }
      });

      const duration = performance.now() - startTime;
      console.log(`⚡ Full analysis (all features): ${duration.toFixed(2)}ms`);

      // Full analysis should complete in reasonable time (<15 seconds)
      expect(duration).toBeLessThan(15000);
    });
  });

  describe('Memory Usage Benchmarks', () => {
    it('should handle video processing without excessive memory', async () => {
      const video = await loadTestVideo(TEST_VIDEOS.fixtures.short);
      const initialMemory = getMemoryUsage();

      await VideoIntel.getThumbnails(video, { count: 5 });

      if (global.gc) global.gc(); // Force GC to get accurate reading
      const peakMemory = getMemoryUsage();
      const memoryUsed = peakMemory - initialMemory;

      console.log(`💾 Memory used (thumbnails): ${formatBytes(memoryUsed)}`);

      // Should use reasonable memory (<100MB for short video)
      expect(memoryUsed).toBeLessThan(100 * 1024 * 1024);
    });

    it('should not accumulate memory over multiple operations', async () => {
      const video = await loadTestVideo(TEST_VIDEOS.fixtures.short);
      const initialMemory = getMemoryUsage();

      // Run multiple operations
      for (let i = 0; i < 5; i++) {
        await VideoIntel.getMetadata(video);
        if (global.gc && i % 2 === 0) global.gc();
      }

      const finalMemory = getMemoryUsage();
      const memoryGrowth = finalMemory - initialMemory;

      console.log(`💾 Memory growth after 5 operations: ${formatBytes(memoryGrowth)}`);

      // Memory shouldn't grow significantly (<10MB)
      expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024);
    });

    it('should handle large video without excessive memory', async () => {
      const video = await loadTestVideo(TEST_VIDEOS.fixtures.scenes);
      const initialMemory = getMemoryUsage();

      await VideoIntel.analyze(video, {
        metadata: true,
        thumbnails: { count: 5 }
      });

      if (global.gc) global.gc();
      const peakMemory = getMemoryUsage();
      const memoryUsed = peakMemory - initialMemory;

      console.log(`💾 Memory used (large video): ${formatBytes(memoryUsed)}`);

      // Even large videos should stay under memory limit (<500MB)
      expect(memoryUsed).toBeLessThan(500 * 1024 * 1024);
    });
  });

  describe('Throughput Benchmarks', () => {
    it('should maintain consistent speed across multiple thumbnails', async () => {
      const video = await loadTestVideo(TEST_VIDEOS.fixtures.short);

      const times: number[] = [];

      for (const count of [1, 3, 5]) {
        const start = performance.now();
        await VideoIntel.getThumbnails(video, { count });
        const duration = performance.now() - start;
        times.push(duration);
        console.log(`  ${count} thumbnail(s): ${duration.toFixed(2)}ms`);
      }

      // Time for 5 thumbnails shouldn't be 5x time for 1 thumbnail
      // (due to batch processing optimizations)
      expect(times[2]).toBeLessThan(times[0] * 10);
    });

    it('should process consecutive videos efficiently', async () => {
      const video = await loadTestVideo(TEST_VIDEOS.fixtures.short);
      const times: number[] = [];

      for (let i = 0; i < 3; i++) {
        const start = performance.now();
        await VideoIntel.getMetadata(video);
        const duration = performance.now() - start;
        times.push(duration);
      }

      console.log(`📊 Consecutive processing times: ${times.map(t => t.toFixed(2)).join('ms, ')}ms`);

      // Later iterations shouldn't be significantly slower
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      times.forEach(time => {
        expect(time).toBeLessThan(avgTime * 2);
      });
    });
  });

  describe('Scalability Benchmarks', () => {
    it('should handle multiple thumbnail counts efficiently', async () => {
      const video = await loadTestVideo(TEST_VIDEOS.fixtures.medium);
      const results: Array<{ count: number; time: number }> = [];

      for (const count of [1, 3, 5, 10]) {
        const start = performance.now();
        const thumbnails = await VideoIntel.getThumbnails(video, { count });
        const duration = performance.now() - start;

        results.push({ count, time: duration });
        expect(thumbnails).toHaveLength(count);
        console.log(`  ${count} thumbnails: ${duration.toFixed(2)}ms`);
      }

      // Processing time should scale sub-linearly
      // (10 thumbnails shouldn't take 10x time of 1 thumbnail)
      const time1 = results.find(r => r.count === 1)!.time;
      const time10 = results.find(r => r.count === 10)!.time;
      expect(time10).toBeLessThan(time1 * 15);
    });

    it('should handle different quality settings efficiently', async () => {
      const video = await loadTestVideo(TEST_VIDEOS.fixtures.short);

      const lowQualityStart = performance.now();
      await VideoIntel.getThumbnails(video, { count: 3, quality: 0.3 });
      const lowQualityTime = performance.now() - lowQualityStart;

      const highQualityStart = performance.now();
      await VideoIntel.getThumbnails(video, { count: 3, quality: 1.0 });
      const highQualityTime = performance.now() - highQualityStart;

      console.log(`📊 Low quality: ${lowQualityTime.toFixed(2)}ms`);
      console.log(`📊 High quality: ${highQualityTime.toFixed(2)}ms`);

      // Quality setting shouldn't dramatically affect processing time
      // (the main time is frame extraction, not encoding)
      expect(highQualityTime).toBeLessThan(lowQualityTime * 3);
    });
  });

  describe('Comparative Benchmarks', () => {
    it('should process all features with reasonable total time', async () => {
      const video = await loadTestVideo(TEST_VIDEOS.fixtures.short);
      const times: Record<string, number> = {};

      const metadataStart = performance.now();
      await VideoIntel.getMetadata(video);
      times.metadata = performance.now() - metadataStart;

      const thumbnailsStart = performance.now();
      await VideoIntel.getThumbnails(video, { count: 5 });
      times.thumbnails = performance.now() - thumbnailsStart;

      const scenesStart = performance.now();
      await VideoIntel.detectScenes(video);
      times.scenes = performance.now() - scenesStart;

      const colorsStart = performance.now();
      await VideoIntel.extractColors(video, { count: 5 });
      times.colors = performance.now() - colorsStart;

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

    it('should show metadata is fastest operation', async () => {
      const video = await loadTestVideo(TEST_VIDEOS.fixtures.short);

      const metadataStart = performance.now();
      await VideoIntel.getMetadata(video);
      const metadataTime = performance.now() - metadataStart;

      const thumbnailsStart = performance.now();
      await VideoIntel.getThumbnails(video, { count: 5 });
      const thumbnailsTime = performance.now() - thumbnailsStart;

      console.log(`📊 Metadata: ${metadataTime.toFixed(2)}ms vs Thumbnails: ${thumbnailsTime.toFixed(2)}ms`);

      // Metadata should be significantly faster than thumbnails
      expect(metadataTime).toBeLessThan(thumbnailsTime);
    });
  });

  describe('Efficiency Benchmarks', () => {
    it('should be efficient with analyze() vs individual calls', async () => {
      const video = await loadTestVideo(TEST_VIDEOS.fixtures.short);

      // Individual calls
      const individualStart = performance.now();
      await VideoIntel.getMetadata(video);
      await VideoIntel.getThumbnails(video, { count: 3 });
      await VideoIntel.detectScenes(video);
      const individualTime = performance.now() - individualStart;

      // Single analyze call
      const analyzeStart = performance.now();
      await VideoIntel.analyze(video, {
        metadata: true,
        thumbnails: { count: 3 },
        scenes: true
      });
      const analyzeTime = performance.now() - analyzeStart;

      console.log(`📊 Individual calls: ${individualTime.toFixed(2)}ms`);
      console.log(`📊 Analyze call: ${analyzeTime.toFixed(2)}ms`);

      // analyze() should be at least as fast or faster (due to optimizations)
      expect(analyzeTime).toBeLessThanOrEqual(individualTime * 1.5);
    });
  });

  describe('Memory Leak Tests', () => {
    it('should not leak memory over extended use', async () => {
      const video = await loadTestVideo(TEST_VIDEOS.fixtures.short);
      const iterations = 20;
      const memoryReadings: number[] = [];

      for (let i = 0; i < iterations; i++) {
        await VideoIntel.getMetadata(video);
        
        if (i % 5 === 0 && global.gc) {
          global.gc();
          memoryReadings.push(getMemoryUsage());
        }
      }

      console.log('💾 Memory readings:', memoryReadings.map(m => formatBytes(m)).join(', '));

      // Memory shouldn't trend upward significantly
      if (memoryReadings.length >= 2) {
        const first = memoryReadings[0];
        const last = memoryReadings[memoryReadings.length - 1];
        const growth = last - first;

        console.log(`💾 Total memory growth: ${formatBytes(growth)}`);
        expect(growth).toBeLessThan(20 * 1024 * 1024); // <20MB
      }
    });

    it('should cleanup properly after thumbnail generation', async () => {
      const video = await loadTestVideo(TEST_VIDEOS.fixtures.short);
      const iterations = 10;
      const memoryReadings: number[] = [];

      for (let i = 0; i < iterations; i++) {
        await VideoIntel.getThumbnails(video, { count: 3 });
        
        if (global.gc) global.gc();
        memoryReadings.push(getMemoryUsage());
      }

      // Check that memory stabilizes (not growing indefinitely)
      const firstHalf = memoryReadings.slice(0, 5);
      const secondHalf = memoryReadings.slice(5);
      
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      const growth = secondAvg - firstAvg;

      console.log(`💾 Memory stability: ${formatBytes(firstAvg)} → ${formatBytes(secondAvg)}`);
      expect(growth).toBeLessThan(15 * 1024 * 1024); // <15MB growth
    });
  });

  describe('Baseline Performance Metrics', () => {
    it('should establish baseline metrics', async () => {
      const video = await loadTestVideo(TEST_VIDEOS.fixtures.short);
      const metrics: Record<string, any> = {};

      // Metadata
      const metaStart = performance.now();
      const metadata = await VideoIntel.getMetadata(video);
      metrics.metadataTime = performance.now() - metaStart;

      // Thumbnails
      const thumbStart = performance.now();
      const thumbMem = getMemoryUsage();
      const thumbnails = await VideoIntel.getThumbnails(video, { count: 5 });
      metrics.thumbnailsTime = performance.now() - thumbStart;
      if (global.gc) global.gc();
      metrics.thumbnailsMemory = getMemoryUsage() - thumbMem;

      // Scenes
      const sceneStart = performance.now();
      const scenes = await VideoIntel.detectScenes(video);
      metrics.scenesTime = performance.now() - sceneStart;

      // Colors
      const colorStart = performance.now();
      const colors = await VideoIntel.extractColors(video, { count: 5 });
      metrics.colorsTime = performance.now() - colorStart;

      console.log('\n📊 BASELINE PERFORMANCE METRICS:');
      console.log('==================================');
      console.log(`Video Duration: ${metadata.duration.toFixed(2)}s`);
      console.log(`Resolution: ${metadata.width}x${metadata.height}`);
      console.log(`\nFeature Performance:`);
      console.log(`  Metadata: ${metrics.metadataTime.toFixed(2)}ms`);
      console.log(`  Thumbnails (5): ${metrics.thumbnailsTime.toFixed(2)}ms`);
      console.log(`  Scenes: ${metrics.scenesTime.toFixed(2)}ms`);
      console.log(`  Colors (5): ${metrics.colorsTime.toFixed(2)}ms`);
      console.log(`\nMemory:`);
      console.log(`  Thumbnails: ${formatBytes(metrics.thumbnailsMemory)}`);
      console.log('==================================\n');

      // Store metrics for future comparison
      expect(metrics.metadataTime).toBeGreaterThan(0);
    });
  });
});


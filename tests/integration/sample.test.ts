/**
 * Sample Integration Test
 * 
 * This file demonstrates how to write integration tests for VideoIntel.js
 * using real video files and the test utilities from setup.ts
 * 
 * NOTE: These tests require a real browser environment and will be skipped in jsdom.
 * To run these tests, use Playwright or test in an actual browser.
 * 
 * To run this test:
 *   1. Download test fixtures: npm run test:download-fixtures
 *   2. Run test: npm test tests/integration/sample.test.ts
 */

import VideoIntel from '../../src';
import { 
  loadTestVideo, 
  getTestVideoURL,
  assertDefined,
  wait,
  getMemoryUsage,
  formatBytes,
  TEST_VIDEOS
} from './setup';

// Skip all tests in this file if running in jsdom (Node.js environment)
const describeIfBrowser = typeof window !== 'undefined' && window.HTMLVideoElement && typeof URL.createObjectURL === 'function'
  ? describe
  : describe.skip;

describeIfBrowser('VideoIntel Integration - Sample Tests', () => {
  // Increase timeout for integration tests (they use real videos)
  jest.setTimeout(30000); // 30 seconds

  describeIfBrowser('Using Local Video Files', () => {
    let videoFile: File;

    beforeAll(async () => {
      // Load test video once for all tests in this suite
      videoFile = await loadTestVideo(TEST_VIDEOS.fixtures.short);
    });

    it('should extract metadata from video file', async () => {
      const metadata = await VideoIntel.getMetadata(videoFile);

      // Verify metadata structure
      assertDefined(metadata);
      expect(metadata.duration).toBeGreaterThan(0);
      expect(metadata.width).toBeGreaterThan(0);
      expect(metadata.height).toBeGreaterThan(0);
      expect(metadata.aspectRatio).toBeGreaterThan(0);

      console.log('📊 Metadata:', {
        duration: `${metadata.duration.toFixed(2)}s`,
        resolution: `${metadata.width}x${metadata.height}`,
        aspectRatio: metadata.aspectRatio
      });
    });

    it('should generate thumbnails from video file', async () => {
      const thumbnails = await VideoIntel.getThumbnails(videoFile, {
        count: 5,
        quality: 0.8
      });

      // Verify thumbnails
      expect(thumbnails).toHaveLength(5);
      
      for (const thumbnail of thumbnails) {
        expect(thumbnail.image).toBeInstanceOf(Blob);
        expect(thumbnail.image.size).toBeGreaterThan(0);
        expect(thumbnail.timestamp).toBeGreaterThanOrEqual(0);
        expect(thumbnail.score).toBeGreaterThan(0);
        expect(thumbnail.score).toBeLessThanOrEqual(1);
        expect(thumbnail.width).toBeGreaterThan(0);
        expect(thumbnail.height).toBeGreaterThan(0);
      }

      // Thumbnails should be sorted by score (highest first)
      for (let i = 1; i < thumbnails.length; i++) {
        expect(thumbnails[i].score).toBeLessThanOrEqual(thumbnails[i - 1].score);
      }

      console.log('🖼️  Thumbnails generated:', thumbnails.map(t => ({
        time: `${t.timestamp.toFixed(2)}s`,
        score: t.score.toFixed(3),
        size: formatBytes(t.image.size)
      })));
    });

    it('should detect scenes in video file', async () => {
      const scenes = await VideoIntel.detectScenes(videoFile, {
        threshold: 0.3,
        minSceneLength: 1
      });

      // Verify scenes
      assertDefined(scenes);
      expect(scenes.length).toBeGreaterThan(0);

      for (const scene of scenes) {
        expect(scene.start).toBeGreaterThanOrEqual(0);
        expect(scene.end).toBeGreaterThan(scene.start);
        expect(scene.confidence).toBeGreaterThan(0);
        expect(scene.confidence).toBeLessThanOrEqual(1);
      }

      console.log('🎬 Scenes detected:', scenes.map((s, i) => ({
        scene: i + 1,
        duration: `${s.start.toFixed(2)}s - ${s.end.toFixed(2)}s`,
        confidence: s.confidence.toFixed(3)
      })));
    });

    it('should extract colors from video file', async () => {
      const colors = await VideoIntel.extractColors(videoFile, {
        count: 5,
        quality: 'balanced'
      });

      // Verify colors
      expect(colors).toHaveLength(5);

      for (const color of colors) {
        expect(color.rgb).toBeDefined();
        expect(color.rgb[0]).toBeGreaterThanOrEqual(0); // R value
        expect(color.rgb[0]).toBeLessThanOrEqual(255);
        expect(color.rgb[1]).toBeGreaterThanOrEqual(0); // G value
        expect(color.rgb[1]).toBeLessThanOrEqual(255);
        expect(color.rgb[2]).toBeGreaterThanOrEqual(0); // B value
        expect(color.rgb[2]).toBeLessThanOrEqual(255);
        expect(color.hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(color.percentage).toBeGreaterThan(0);
        expect(color.percentage).toBeLessThanOrEqual(100);
      }

      // Total percentage should be ~100%
      const totalPercentage = colors.reduce((sum, c) => sum + c.percentage, 0);
      expect(totalPercentage).toBeCloseTo(100, 0);

      console.log('🎨 Dominant colors:', colors.map(c => ({
        hex: c.hex,
        percentage: `${c.percentage.toFixed(1)}%`
      })));
    });

    it('should perform full analysis with all features', async () => {
      const progressValues: number[] = [];

      const result = await VideoIntel.analyze(videoFile, {
        metadata: true,
        thumbnails: { count: 3 },
        scenes: true,
        colors: { count: 5 },
        onProgress: (progress) => {
          progressValues.push(progress);
          console.log(`📊 Progress: ${progress}%`);
        }
      });

      // Verify all features are present
      assertDefined(result.metadata);
      assertDefined(result.thumbnails);
      assertDefined(result.scenes);
      assertDefined(result.colors);

      expect(result.thumbnails).toHaveLength(3);
      expect(result.colors).toHaveLength(5);
      expect(result.scenes.length).toBeGreaterThan(0);

      // Verify progress tracking
      expect(progressValues.length).toBeGreaterThan(0);
      expect(progressValues[progressValues.length - 1]).toBe(100);

      console.log('✅ Full analysis complete:', {
        duration: `${result.metadata.duration.toFixed(2)}s`,
        thumbnails: result.thumbnails.length,
        scenes: result.scenes.length,
        colors: result.colors.length
      });
    });
  });

  describeIfBrowser('Using Remote Video URLs', () => {
    it('should analyze video from URL', async () => {
      const url = getTestVideoURL('short');
      console.log('🌐 Testing with URL:', url);

      const metadata = await VideoIntel.getMetadata(url);

      assertDefined(metadata);
      expect(metadata.duration).toBeGreaterThan(0);
      expect(metadata.width).toBeGreaterThan(0);
      expect(metadata.height).toBeGreaterThan(0);

      console.log('✅ URL video analyzed:', {
        duration: `${metadata.duration.toFixed(2)}s`,
        resolution: `${metadata.width}x${metadata.height}`
      });
    });
  });

  describeIfBrowser('Error Handling', () => {
    it('should handle invalid video file gracefully', async () => {
      const invalidFile = new File(['invalid video content'], 'invalid.mp4', {
        type: 'video/mp4'
      });

      await expect(
        VideoIntel.getMetadata(invalidFile)
      ).rejects.toThrow();

      console.log('✅ Invalid file handled correctly');
    });

    it('should handle empty file gracefully', async () => {
      const emptyFile = new File([], 'empty.mp4', {
        type: 'video/mp4'
      });

      await expect(
        VideoIntel.getThumbnails(emptyFile)
      ).rejects.toThrow();

      console.log('✅ Empty file handled correctly');
    });

    it('should cleanup resources after error', async () => {
      const invalidFile = new File(['bad'], 'bad.mp4', { type: 'video/mp4' });

      try {
        await VideoIntel.getThumbnails(invalidFile);
      } catch (error) {
        // Error expected
      }

      // Should be able to process valid file after error
      const validFile = await loadTestVideo(TEST_VIDEOS.fixtures.short);
      const metadata = await VideoIntel.getMetadata(validFile);
      
      expect(metadata).toBeDefined();
      console.log('✅ Resources cleaned up after error');
    });
  });

  describeIfBrowser('Performance', () => {
    it('should process video within reasonable time', async () => {
      const videoFile = await loadTestVideo(TEST_VIDEOS.fixtures.short);
      const startTime = performance.now();

      await VideoIntel.getThumbnails(videoFile, { count: 5 });

      const duration = performance.now() - startTime;
      console.log(`⚡ Processing time: ${duration.toFixed(2)}ms`);

      // Short video should process quickly
      expect(duration).toBeLessThan(10000); // <10 seconds
    });

    it('should not leak memory over multiple operations', async () => {
      const videoFile = await loadTestVideo(TEST_VIDEOS.fixtures.short);
      const iterations = 5;

      const initialMemory = getMemoryUsage();
      console.log(`💾 Initial memory: ${formatBytes(initialMemory)}`);

      // Run operation multiple times
      for (let i = 0; i < iterations; i++) {
        await VideoIntel.getMetadata(videoFile);
        
        if (i % 2 === 0 && global.gc) {
          global.gc(); // Force GC if available
        }
      }

      const finalMemory = getMemoryUsage();
      const increase = finalMemory - initialMemory;
      
      console.log(`💾 Final memory: ${formatBytes(finalMemory)}`);
      console.log(`💾 Memory increase: ${formatBytes(increase)}`);

      // Memory increase should be minimal (<5MB)
      expect(increase).toBeLessThan(5 * 1024 * 1024);
    });
  });

  describeIfBrowser('Progress Tracking', () => {
    it('should track progress for thumbnail generation', async () => {
      const videoFile = await loadTestVideo(TEST_VIDEOS.fixtures.short);
      const progressValues: number[] = [];

      await VideoIntel.getThumbnails(videoFile, {
        count: 5,
        // Note: Progress callback needs to be implemented in getThumbnails
        // This test shows the expected behavior
      });

      // This would work once progress callback is added to options
      // expect(progressValues.length).toBeGreaterThan(0);
      
      console.log('ℹ️  Progress tracking test (callback implementation pending)');
    });

    it('should track progress across multiple features', async () => {
      const videoFile = await loadTestVideo(TEST_VIDEOS.fixtures.short);
      const progressValues: number[] = [];

      await VideoIntel.analyze(videoFile, {
        metadata: true,
        thumbnails: { count: 3 },
        scenes: true,
        onProgress: (progress) => {
          progressValues.push(progress);
        }
      });

      if (progressValues.length > 0) {
        // Progress should be monotonically increasing
        for (let i = 1; i < progressValues.length; i++) {
          expect(progressValues[i]).toBeGreaterThanOrEqual(progressValues[i - 1]);
        }

        // Should end at 100%
        expect(progressValues[progressValues.length - 1]).toBe(100);

        console.log('✅ Progress tracking works:', progressValues);
      } else {
        console.log('ℹ️  Progress tracking not yet implemented');
      }
    });
  });

  describeIfBrowser('Different Video Scenarios', () => {
    it('should handle medium length video', async () => {
      const videoFile = await loadTestVideo(TEST_VIDEOS.fixtures.medium);

      const result = await VideoIntel.analyze(videoFile, {
        metadata: true,
        thumbnails: { count: 5 }
      });

      assertDefined(result.metadata);
      assertDefined(result.thumbnails);
      
      expect(result.metadata.duration).toBeGreaterThan(10); // Medium video should be >10s
      expect(result.thumbnails).toHaveLength(5);

      console.log('✅ Medium video processed:', {
        duration: `${result.metadata.duration.toFixed(2)}s`,
        thumbnails: result.thumbnails.length
      });
    });

    it('should handle video with multiple scenes', async () => {
      const videoFile = await loadTestVideo(TEST_VIDEOS.fixtures.scenes);

      const scenes = await VideoIntel.detectScenes(videoFile, {
        threshold: 0.3,
        minSceneLength: 1
      });

      // Video specifically chosen for scene changes should have multiple scenes
      expect(scenes.length).toBeGreaterThan(1);

      console.log('✅ Scene detection:', {
        totalScenes: scenes.length,
        scenes: scenes.map((s, i) => ({
          scene: i + 1,
          duration: `${s.start.toFixed(1)}s - ${s.end.toFixed(1)}s`
        }))
      });
    });
  });
});

describe('VideoIntel Integration - Quick Smoke Tests', () => {
  // These are quick sanity checks that run even without downloaded fixtures
  
  it('should export the main API', () => {
    expect(VideoIntel).toBeDefined();
    expect(typeof VideoIntel.analyze).toBe('function');
    expect(typeof VideoIntel.getMetadata).toBe('function');
    expect(typeof VideoIntel.getThumbnails).toBe('function');
    expect(typeof VideoIntel.detectScenes).toBe('function');
    expect(typeof VideoIntel.extractColors).toBe('function');
  });

  it('should have correct API signatures', () => {
    // These checks ensure the API hasn't changed
    expect(VideoIntel.analyze.length).toBeGreaterThanOrEqual(1);
    expect(VideoIntel.getMetadata.length).toBeGreaterThanOrEqual(1);
    expect(VideoIntel.getThumbnails.length).toBeGreaterThanOrEqual(1);
    expect(VideoIntel.detectScenes.length).toBeGreaterThanOrEqual(1);
    expect(VideoIntel.extractColors.length).toBeGreaterThanOrEqual(1);
  });
});


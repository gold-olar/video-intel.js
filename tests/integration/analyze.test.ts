/**
 * Integration Tests - Full Analysis Workflow
 * 
 * Tests the complete VideoIntel.analyze() method which coordinates
 * all features (metadata, thumbnails, scenes, colors) in a single operation.
 * 
 * NOTE: These tests require a real browser environment and will be skipped in jsdom.
 * To run these tests, use Playwright or test in an actual browser.
 */

import VideoIntel from '../../src';
import { 
  loadTestVideo, 
  assertDefined,
  getTestVideoURL,
  TEST_VIDEOS
} from './setup';

// Skip all tests in this file if running in jsdom (Node.js environment)
const describeIfBrowser = typeof window !== 'undefined' && window.HTMLVideoElement && typeof URL.createObjectURL === 'function'
  ? describe
  : describe.skip;

describeIfBrowser('VideoIntel.analyze() - Full Integration', () => {
  jest.setTimeout(30000); // 30 seconds for integration tests

  let videoFile: File;

  beforeAll(async () => {
    videoFile = await loadTestVideo(TEST_VIDEOS.fixtures.short);
  });

  describe('Complete Analysis', () => {
    it('should analyze video with all features enabled', async () => {
      const result = await VideoIntel.analyze(videoFile, {
        thumbnails: { count: 5 },
        scenes: true,
        colors: { count: 5 },
        metadata: true
      });

      // Verify metadata
      assertDefined(result.metadata);
      expect(result.metadata.duration).toBeGreaterThan(0);
      expect(result.metadata.width).toBeGreaterThan(0);
      expect(result.metadata.height).toBeGreaterThan(0);

      // Verify thumbnails
      assertDefined(result.thumbnails);
      expect(result.thumbnails).toHaveLength(5);
      result.thumbnails.forEach(thumb => {
        expect(thumb.image).toBeInstanceOf(Blob);
        expect(thumb.timestamp).toBeGreaterThanOrEqual(0);
        expect(thumb.score).toBeGreaterThan(0);
      });

      // Verify scenes
      assertDefined(result.scenes);
      expect(result.scenes.length).toBeGreaterThan(0);
      result.scenes.forEach(scene => {
        expect(scene.start).toBeGreaterThanOrEqual(0);
        expect(scene.end).toBeGreaterThan(scene.start);
        expect(scene.confidence).toBeGreaterThan(0);
      });

      // Verify colors
      assertDefined(result.colors);
      expect(result.colors).toHaveLength(5);
      result.colors.forEach(color => {
        expect(color.hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(color.percentage).toBeGreaterThan(0);
      });
    });

    it('should analyze video with default options', async () => {
      const result = await VideoIntel.analyze(videoFile);

      // With no options, it should return an empty result object
      // (or metadata by default depending on implementation)
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('should analyze medium-length video', async () => {
      const mediumVideo = await loadTestVideo(TEST_VIDEOS.fixtures.medium);

      const result = await VideoIntel.analyze(mediumVideo, {
        metadata: true,
        thumbnails: { count: 5 },
        scenes: true
      });

      assertDefined(result.metadata);
      expect(result.metadata.duration).toBeGreaterThan(10); // Medium video > 10s

      assertDefined(result.thumbnails);
      expect(result.thumbnails).toHaveLength(5);

      assertDefined(result.scenes);
      expect(result.scenes.length).toBeGreaterThan(0);
    });
  });

  describe('Progress Tracking', () => {
    it('should track progress correctly through all features', async () => {
      const progressValues: number[] = [];

      await VideoIntel.analyze(videoFile, {
        thumbnails: { count: 3 },
        scenes: true,
        colors: { count: 5 },
        metadata: true,
        onProgress: (progress) => {
          progressValues.push(progress);
        }
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

    it('should provide progress updates for each feature', async () => {
      const progressValues: number[] = [];

      await VideoIntel.analyze(videoFile, {
        metadata: true,
        thumbnails: { count: 3 },
        scenes: true,
        colors: { count: 5 },
        onProgress: (p) => progressValues.push(p)
      });

      // With 4 features, we should have at least 4 progress updates
      // (one for each completed feature)
      expect(progressValues.length).toBeGreaterThanOrEqual(4);
    });

    it('should handle progress callback errors gracefully', async () => {
      const badCallback = () => {
        throw new Error('Progress callback error');
      };

      // Should not fail even if progress callback throws
      await expect(
        VideoIntel.analyze(videoFile, {
          metadata: true,
          onProgress: badCallback
        })
      ).resolves.toBeDefined();
    });
  });

  describe('Partial Feature Requests', () => {
    it('should return only metadata when only metadata requested', async () => {
      const result = await VideoIntel.analyze(videoFile, {
        metadata: true
      });

      assertDefined(result.metadata);
      expect(result.thumbnails).toBeUndefined();
      expect(result.scenes).toBeUndefined();
      expect(result.colors).toBeUndefined();
    });

    it('should return only thumbnails when only thumbnails requested', async () => {
      const result = await VideoIntel.analyze(videoFile, {
        thumbnails: { count: 3 }
      });

      assertDefined(result.thumbnails);
      expect(result.thumbnails).toHaveLength(3);
      expect(result.metadata).toBeUndefined();
      expect(result.scenes).toBeUndefined();
      expect(result.colors).toBeUndefined();
    });

    it('should return metadata and thumbnails when both requested', async () => {
      const result = await VideoIntel.analyze(videoFile, {
        metadata: true,
        thumbnails: { count: 5 }
      });

      assertDefined(result.metadata);
      assertDefined(result.thumbnails);
      expect(result.thumbnails).toHaveLength(5);
      expect(result.scenes).toBeUndefined();
      expect(result.colors).toBeUndefined();
    });

    it('should handle boolean true for thumbnail options', async () => {
      const result = await VideoIntel.analyze(videoFile, {
        thumbnails: true // Boolean instead of options object
      });

      assertDefined(result.thumbnails);
      expect(result.thumbnails.length).toBeGreaterThan(0);
    });

    it('should handle boolean true for scene options', async () => {
      const result = await VideoIntel.analyze(videoFile, {
        scenes: true
      });

      assertDefined(result.scenes);
      expect(result.scenes.length).toBeGreaterThan(0);
    });

    it('should handle boolean true for color options', async () => {
      const result = await VideoIntel.analyze(videoFile, {
        colors: true
      });

      assertDefined(result.colors);
      expect(result.colors.length).toBeGreaterThan(0);
    });
  });

  describe('Resource Cleanup', () => {
    it('should cleanup resources after successful analysis', async () => {
      // Run analysis multiple times
      for (let i = 0; i < 5; i++) {
        const result = await VideoIntel.analyze(videoFile, {
          metadata: true,
          thumbnails: { count: 3 }
        });
        expect(result.metadata).toBeDefined();
      }

      // Should still be able to analyze
      const finalResult = await VideoIntel.analyze(videoFile, {
        metadata: true
      });
      expect(finalResult.metadata).toBeDefined();
    });

    it('should not leak memory over multiple analyses', async () => {
      const iterations = 10;
      const memoryReadings: number[] = [];

      for (let i = 0; i < iterations; i++) {
        await VideoIntel.analyze(videoFile, { metadata: true });
        
        if (global.gc) global.gc(); // Force GC if available
        
        const memory = process.memoryUsage().heapUsed;
        memoryReadings.push(memory);
      }

      // Memory shouldn't grow significantly
      const first5Avg = memoryReadings.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
      const last5Avg = memoryReadings.slice(-5).reduce((a, b) => a + b, 0) / 5;
      const growth = last5Avg - first5Avg;

      // Allow up to 10MB growth
      expect(growth).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('URL-based Analysis', () => {
    it('should analyze video from URL', async () => {
      const url = getTestVideoURL('short');

      const result = await VideoIntel.analyze(url, {
        metadata: true,
        thumbnails: { count: 3 }
      });

      assertDefined(result.metadata);
      assertDefined(result.thumbnails);
      expect(result.thumbnails).toHaveLength(3);
    });

    it('should handle URL with all features', async () => {
      const url = getTestVideoURL('short');

      const result = await VideoIntel.analyze(url, {
        metadata: true,
        thumbnails: { count: 3 },
        scenes: true,
        colors: { count: 5 }
      });

      assertDefined(result.metadata);
      assertDefined(result.thumbnails);
      assertDefined(result.scenes);
      assertDefined(result.colors);
    });
  });

  describe('Custom Options', () => {
    it('should respect thumbnail count option', async () => {
      const counts = [1, 3, 5, 10];

      for (const count of counts) {
        const result = await VideoIntel.analyze(videoFile, {
          thumbnails: { count }
        });

        assertDefined(result.thumbnails);
        expect(result.thumbnails).toHaveLength(count);
      }
    });

    it('should respect thumbnail quality option', async () => {
      const result = await VideoIntel.analyze(videoFile, {
        thumbnails: { count: 3, quality: 0.5 }
      });

      assertDefined(result.thumbnails);
      expect(result.thumbnails).toHaveLength(3);
      
      // Lower quality should result in smaller file sizes
      result.thumbnails.forEach(thumb => {
        expect(thumb.image.size).toBeGreaterThan(0);
      });
    });

    it('should respect scene detection threshold', async () => {
      const result1 = await VideoIntel.analyze(videoFile, {
        scenes: { threshold: 0.2 } // More sensitive
      });

      const result2 = await VideoIntel.analyze(videoFile, {
        scenes: { threshold: 0.5 } // Less sensitive
      });

      assertDefined(result1.scenes);
      assertDefined(result2.scenes);

      // Lower threshold should detect more scenes
      expect(result1.scenes.length).toBeGreaterThanOrEqual(result2.scenes.length);
    });

    it('should respect color count option', async () => {
      const counts = [3, 5, 10];

      for (const count of counts) {
        const result = await VideoIntel.analyze(videoFile, {
          colors: { count }
        });

        assertDefined(result.colors);
        expect(result.colors).toHaveLength(count);
      }
    });
  });

  describe('Different Video Types', () => {
    it('should analyze video with distinct scenes', async () => {
      const sceneVideo = await loadTestVideo(TEST_VIDEOS.fixtures.scenes);

      const result = await VideoIntel.analyze(sceneVideo, {
        scenes: true,
        thumbnails: { count: 5 }
      });

      assertDefined(result.scenes);
      assertDefined(result.thumbnails);

      // Video with distinct scenes should have multiple scenes
      expect(result.scenes.length).toBeGreaterThan(1);
    });
  });

  describe('Result Structure', () => {
    it('should return properly typed result object', async () => {
      const result = await VideoIntel.analyze(videoFile, {
        metadata: true,
        thumbnails: { count: 3 },
        scenes: true,
        colors: { count: 5 }
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
        result.thumbnails.forEach(thumb => {
          expect(thumb).toHaveProperty('image');
          expect(thumb).toHaveProperty('timestamp');
          expect(thumb).toHaveProperty('score');
          expect(thumb).toHaveProperty('width');
          expect(thumb).toHaveProperty('height');
        });
      }

      // Scenes structure
      if (result.scenes) {
        result.scenes.forEach(scene => {
          expect(scene).toHaveProperty('start');
          expect(scene).toHaveProperty('end');
          expect(scene).toHaveProperty('confidence');
        });
      }

      // Colors structure
      if (result.colors) {
        result.colors.forEach(color => {
          expect(color).toHaveProperty('rgb');
          expect(color).toHaveProperty('hex');
          expect(color).toHaveProperty('hsl');
          expect(color).toHaveProperty('percentage');
        });
      }
    });
  });
});


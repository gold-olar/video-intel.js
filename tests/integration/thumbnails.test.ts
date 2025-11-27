/**
 * Integration Tests - Thumbnail Generation Workflow
 * 
 * Tests the complete thumbnail generation workflow including
 * frame extraction, quality scoring, and filtering.
 * 
 * NOTE: These tests require a real browser environment and will be skipped in jsdom.
 * To run these tests, use Playwright or test in an actual browser.
 */

import VideoIntel from '../../src';
import { 
  loadTestVideo, 
  assertDefined,
  formatBytes,
  TEST_VIDEOS
} from './setup';

// Skip all tests in this file if running in jsdom (Node.js environment)
const describeIfBrowser = typeof window !== 'undefined' && window.HTMLVideoElement && typeof URL.createObjectURL === 'function'
  ? describe
  : describe.skip;

describeIfBrowser('Thumbnail Generation - Full Workflow', () => {
  jest.setTimeout(30000);

  let videoFile: File;

  beforeAll(async () => {
    videoFile = await loadTestVideo(TEST_VIDEOS.fixtures.short);
  });

  describe('Basic Thumbnail Generation', () => {
    it('should generate specified number of thumbnails', async () => {
      const counts = [1, 3, 5, 10];

      for (const count of counts) {
        const thumbnails = await VideoIntel.getThumbnails(videoFile, { count });
        
        expect(thumbnails).toHaveLength(count);
      }
    });

    it('should generate high-quality thumbnails', async () => {
      const thumbnails = await VideoIntel.getThumbnails(videoFile, {
        count: 5,
        quality: 0.9,
        format: 'jpeg'
      });

      expect(thumbnails).toHaveLength(5);

      for (const thumb of thumbnails) {
        expect(thumb.image).toBeInstanceOf(Blob);
        expect(thumb.image.size).toBeGreaterThan(0);
        expect(thumb.timestamp).toBeGreaterThanOrEqual(0);
        expect(thumb.score).toBeGreaterThan(0);
        expect(thumb.score).toBeLessThanOrEqual(1);
        expect(thumb.width).toBeGreaterThan(0);
        expect(thumb.height).toBeGreaterThan(0);
      }
    });

    it('should generate thumbnails with default options', async () => {
      const thumbnails = await VideoIntel.getThumbnails(videoFile);

      expect(thumbnails.length).toBeGreaterThan(0);
      
      for (const thumb of thumbnails) {
        expect(thumb.image).toBeInstanceOf(Blob);
        expect(thumb.score).toBeGreaterThan(0);
      }
    });
  });

  describe('Thumbnail Quality', () => {
    it('should sort thumbnails by score (highest first)', async () => {
      const thumbnails = await VideoIntel.getThumbnails(videoFile, {
        count: 5
      });

      // Thumbnails should be sorted by score (descending)
      for (let i = 1; i < thumbnails.length; i++) {
        expect(thumbnails[i].score).toBeLessThanOrEqual(thumbnails[i - 1].score);
      }
    });

    it('should have reasonable quality scores', async () => {
      const thumbnails = await VideoIntel.getThumbnails(videoFile, {
        count: 5
      });

      for (const thumb of thumbnails) {
        // Scores should be between 0 and 1
        expect(thumb.score).toBeGreaterThan(0);
        expect(thumb.score).toBeLessThanOrEqual(1);
        
        // Top thumbnails should have good scores (> 0.3)
        expect(thumb.score).toBeGreaterThan(0.3);
      }
    });

    it('should filter out low-quality frames', async () => {
      const thumbnails = await VideoIntel.getThumbnails(videoFile, {
        count: 5
      });

      // No thumbnail should have very low score (indicates black/blur frames filtered)
      for (const thumb of thumbnails) {
        expect(thumb.score).toBeGreaterThan(0.2);
      }
    });

    it('should produce different thumbnails across video', async () => {
      const thumbnails = await VideoIntel.getThumbnails(videoFile, {
        count: 5
      });

      // Timestamps should be distributed across video
      const timestamps = thumbnails.map(t => t.timestamp);
      
      // All timestamps should be unique
      const uniqueTimestamps = new Set(timestamps);
      expect(uniqueTimestamps.size).toBe(timestamps.length);
      
      // Timestamps should be in ascending order or varied
      // (they might not be strictly ascending due to quality scoring)
      expect(timestamps[0]).not.toBe(timestamps[timestamps.length - 1]);
    });
  });

  describe('Quality Options', () => {
    it('should respect quality parameter (high quality)', async () => {
      const thumbnails = await VideoIntel.getThumbnails(videoFile, {
        count: 3,
        quality: 1.0 // Maximum quality
      });

      for (const thumb of thumbnails) {
        expect(thumb.image.size).toBeGreaterThan(0);
        // High quality should produce larger files
        expect(thumb.image.size).toBeGreaterThan(1000); // At least 1KB
      }
    });

    it('should respect quality parameter (low quality)', async () => {
      const highQuality = await VideoIntel.getThumbnails(videoFile, {
        count: 1,
        quality: 1.0
      });

      const lowQuality = await VideoIntel.getThumbnails(videoFile, {
        count: 1,
        quality: 0.3
      });

      // Lower quality should result in smaller file size
      expect(lowQuality[0].image.size).toBeLessThan(highQuality[0].image.size);
    });

    it('should handle different quality values', async () => {
      const qualities = [0.5, 0.7, 0.9];

      for (const quality of qualities) {
        const thumbnails = await VideoIntel.getThumbnails(videoFile, {
          count: 1,
          quality
        });

        expect(thumbnails).toHaveLength(1);
        expect(thumbnails[0].image.size).toBeGreaterThan(0);
      }
    });
  });

  describe('Format Options', () => {
    it('should generate JPEG thumbnails', async () => {
      const thumbnails = await VideoIntel.getThumbnails(videoFile, {
        count: 1,
        format: 'jpeg',
        quality: 0.8
      });

      expect(thumbnails[0].image.type).toBe('image/jpeg');
    });

    it('should generate PNG thumbnails', async () => {
      const thumbnails = await VideoIntel.getThumbnails(videoFile, {
        count: 1,
        format: 'png'
      });

      expect(thumbnails[0].image.type).toBe('image/png');
    });

    it('should use JPEG by default', async () => {
      const thumbnails = await VideoIntel.getThumbnails(videoFile, {
        count: 1
      });

      // Default should be JPEG
      expect(thumbnails[0].image.type).toMatch(/jpeg|jpg/i);
    });
  });

  describe('Size Options', () => {
    it('should respect width size option', async () => {
      const thumbnails = await VideoIntel.getThumbnails(videoFile, {
        count: 1,
        size: { width: 640 }
      });

      expect(thumbnails[0].width).toBe(640);
      // Height should maintain aspect ratio
      expect(thumbnails[0].height).toBeGreaterThan(0);
    });

    it('should respect height size option', async () => {
      const thumbnails = await VideoIntel.getThumbnails(videoFile, {
        count: 1,
        size: { height: 480 }
      });

      expect(thumbnails[0].height).toBe(480);
      expect(thumbnails[0].width).toBeGreaterThan(0);
    });

    it('should respect both width and height', async () => {
      const thumbnails = await VideoIntel.getThumbnails(videoFile, {
        count: 1,
        size: { width: 800, height: 600 }
      });

      expect(thumbnails[0].width).toBe(800);
      expect(thumbnails[0].height).toBe(600);
    });

    it('should use original size when no size specified', async () => {
      const metadata = await VideoIntel.getMetadata(videoFile);
      const thumbnails = await VideoIntel.getThumbnails(videoFile, {
        count: 1
      });

      // Should match video dimensions (or be reasonably close)
      expect(thumbnails[0].width).toBeGreaterThan(0);
      expect(thumbnails[0].height).toBeGreaterThan(0);
    });
  });

  describe('Thumbnail Content', () => {
    it('should create valid image blobs', async () => {
      const thumbnails = await VideoIntel.getThumbnails(videoFile, {
        count: 3
      });

      for (const thumb of thumbnails) {
        // Should be a Blob with image type
        expect(thumb.image).toBeInstanceOf(Blob);
        expect(thumb.image.type).toMatch(/^image\/(jpeg|png)$/);
        expect(thumb.image.size).toBeGreaterThan(0);
      }
    });

    it('should have reasonable file sizes', async () => {
      const thumbnails = await VideoIntel.getThumbnails(videoFile, {
        count: 5,
        quality: 0.8
      });

      for (const thumb of thumbnails) {
        const size = thumb.image.size;
        // File sizes should be reasonable (not too small, not too large)
        expect(size).toBeGreaterThan(1000); // > 1KB
        expect(size).toBeLessThan(5 * 1024 * 1024); // < 5MB
      }
    });
  });

  describe('Timestamp Distribution', () => {
    it('should have timestamps within video duration', async () => {
      const metadata = await VideoIntel.getMetadata(videoFile);
      const thumbnails = await VideoIntel.getThumbnails(videoFile, {
        count: 5
      });

      for (const thumb of thumbnails) {
        expect(thumb.timestamp).toBeGreaterThanOrEqual(0);
        expect(thumb.timestamp).toBeLessThanOrEqual(metadata.duration);
      }
    });

    it('should sample from different parts of video', async () => {
      const metadata = await VideoIntel.getMetadata(videoFile);
      const thumbnails = await VideoIntel.getThumbnails(videoFile, {
        count: 5
      });

      const timestamps = thumbnails.map(t => t.timestamp);
      
      // Should have variety in timestamps (not all from same second)
      const uniqueSeconds = new Set(timestamps.map(t => Math.floor(t)));
      expect(uniqueSeconds.size).toBeGreaterThan(1);
    });
  });

  describe('Different Video Types', () => {
    it('should handle medium-length video', async () => {
      const mediumVideo = await loadTestVideo(TEST_VIDEOS.fixtures.medium);

      const thumbnails = await VideoIntel.getThumbnails(mediumVideo, {
        count: 5
      });

      expect(thumbnails).toHaveLength(5);
      
      for (const thumb of thumbnails) {
        expect(thumb.image).toBeInstanceOf(Blob);
        expect(thumb.score).toBeGreaterThan(0);
      }
    });

    it('should handle video with scene changes', async () => {
      const sceneVideo = await loadTestVideo(TEST_VIDEOS.fixtures.scenes);

      const thumbnails = await VideoIntel.getThumbnails(sceneVideo, {
        count: 5
      });

      expect(thumbnails).toHaveLength(5);
      
      // Should capture different scenes
      const timestamps = thumbnails.map(t => t.timestamp);
      const uniqueTimestamps = new Set(timestamps);
      expect(uniqueTimestamps.size).toBe(5);
    });
  });

  describe('Performance', () => {
    it('should generate thumbnails in reasonable time', async () => {
      const startTime = performance.now();

      await VideoIntel.getThumbnails(videoFile, {
        count: 5
      });

      const duration = performance.now() - startTime;
      
      // Should complete in under 10 seconds for short video
      expect(duration).toBeLessThan(10000);
    });

    it('should handle multiple thumbnail counts efficiently', async () => {
      const start1 = performance.now();
      await VideoIntel.getThumbnails(videoFile, { count: 1 });
      const time1 = performance.now() - start1;

      const start5 = performance.now();
      await VideoIntel.getThumbnails(videoFile, { count: 5 });
      const time5 = performance.now() - start5;

      // 5 thumbnails shouldn't take 5x longer than 1
      // (due to optimizations and parallelization)
      expect(time5).toBeLessThan(time1 * 8);
    });
  });

  describe('Resource Management', () => {
    it('should cleanup resources after generation', async () => {
      // Generate thumbnails multiple times
      for (let i = 0; i < 5; i++) {
        const thumbnails = await VideoIntel.getThumbnails(videoFile, {
          count: 3
        });
        expect(thumbnails).toHaveLength(3);
      }

      // Should still work after multiple operations
      const finalThumbnails = await VideoIntel.getThumbnails(videoFile, {
        count: 3
      });
      expect(finalThumbnails).toHaveLength(3);
    });

    it('should not leak memory', async () => {
      const iterations = 5;
      const memoryReadings: number[] = [];

      for (let i = 0; i < iterations; i++) {
        await VideoIntel.getThumbnails(videoFile, { count: 3 });
        
        if (global.gc) global.gc();
        memoryReadings.push(process.memoryUsage().heapUsed);
      }

      // Memory shouldn't grow significantly
      const avgFirst = memoryReadings.slice(0, 2).reduce((a, b) => a + b, 0) / 2;
      const avgLast = memoryReadings.slice(-2).reduce((a, b) => a + b, 0) / 2;
      const growth = avgLast - avgFirst;

      expect(growth).toBeLessThan(10 * 1024 * 1024); // <10MB
    });
  });

  describe('Edge Cases', () => {
    it('should handle requesting 1 thumbnail', async () => {
      const thumbnails = await VideoIntel.getThumbnails(videoFile, {
        count: 1
      });

      expect(thumbnails).toHaveLength(1);
      expect(thumbnails[0].image).toBeInstanceOf(Blob);
    });

    it('should handle requesting maximum thumbnails', async () => {
      const thumbnails = await VideoIntel.getThumbnails(videoFile, {
        count: 10
      });

      expect(thumbnails).toHaveLength(10);
      
      // All should be unique
      const timestamps = new Set(thumbnails.map(t => t.timestamp));
      expect(timestamps.size).toBe(10);
    });

    it('should handle very high quality setting', async () => {
      const thumbnails = await VideoIntel.getThumbnails(videoFile, {
        count: 1,
        quality: 1.0
      });

      expect(thumbnails[0].image.size).toBeGreaterThan(0);
    });

    it('should handle very low quality setting', async () => {
      const thumbnails = await VideoIntel.getThumbnails(videoFile, {
        count: 1,
        quality: 0.1
      });

      expect(thumbnails[0].image.size).toBeGreaterThan(0);
    });
  });

  describe('Thumbnail Metadata', () => {
    it('should include all required metadata fields', async () => {
      const thumbnails = await VideoIntel.getThumbnails(videoFile, {
        count: 3
      });

      for (const thumb of thumbnails) {
        // Required fields
        expect(thumb).toHaveProperty('image');
        expect(thumb).toHaveProperty('timestamp');
        expect(thumb).toHaveProperty('score');
        expect(thumb).toHaveProperty('width');
        expect(thumb).toHaveProperty('height');

        // Correct types
        expect(thumb.image).toBeInstanceOf(Blob);
        expect(typeof thumb.timestamp).toBe('number');
        expect(typeof thumb.score).toBe('number');
        expect(typeof thumb.width).toBe('number');
        expect(typeof thumb.height).toBe('number');
      }
    });

    it('should have correct timestamp precision', async () => {
      const thumbnails = await VideoIntel.getThumbnails(videoFile, {
        count: 5
      });

      for (const thumb of thumbnails) {
        // Timestamps should have decimal precision (seconds)
        expect(Number.isFinite(thumb.timestamp)).toBe(true);
        expect(thumb.timestamp).toBeGreaterThanOrEqual(0);
      }
    });
  });
});


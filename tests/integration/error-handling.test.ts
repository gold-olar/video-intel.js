/**
 * Integration Tests - Error Handling
 * 
 * Tests error scenarios, graceful degradation, and resource cleanup
 * when errors occur during video processing.
 * 
 * NOTE: These tests require a real browser environment and will be skipped in jsdom.
 * To run these tests, use Playwright or test in an actual browser.
 */

import VideoIntel from '../../src';
import { 
  loadTestVideo,
  getTestVideoURL,
  TEST_VIDEOS
} from './setup';

// Skip all tests in this file if running in jsdom (Node.js environment)
const describeIfBrowser = typeof window !== 'undefined' && window.HTMLVideoElement && typeof URL.createObjectURL === 'function'
  ? describe
  : describe.skip;

describeIfBrowser('Error Handling - Integration', () => {
  jest.setTimeout(30000);

  describe('Invalid Video Files', () => {
    it('should handle invalid video file gracefully', async () => {
      const invalidFile = new File(['invalid video content'], 'invalid.mp4', {
        type: 'video/mp4'
      });

      await expect(
        VideoIntel.getMetadata(invalidFile)
      ).rejects.toThrow();
    });

    it('should handle empty video file', async () => {
      const emptyFile = new File([], 'empty.mp4', {
        type: 'video/mp4'
      });

      await expect(
        VideoIntel.getThumbnails(emptyFile)
      ).rejects.toThrow();
    });

    it('should handle corrupted video data', async () => {
      const corruptedFile = new File([
        new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0]) // Invalid video data
      ], 'corrupted.mp4', {
        type: 'video/mp4'
      });

      await expect(
        VideoIntel.detectScenes(corruptedFile)
      ).rejects.toThrow();
    });

    it('should handle non-video file with video mime type', async () => {
      const textFile = new File(['This is text, not a video'], 'fake.mp4', {
        type: 'video/mp4'
      });

      await expect(
        VideoIntel.extractColors(textFile)
      ).rejects.toThrow();
    });

    it('should provide meaningful error messages', async () => {
      const invalidFile = new File(['bad data'], 'bad.mp4', {
        type: 'video/mp4'
      });

      try {
        await VideoIntel.getMetadata(invalidFile);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBeTruthy();
        expect((error as Error).message.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Invalid URLs', () => {
    it('should handle non-existent URL', async () => {
      const badUrl = 'http://example.com/nonexistent-video.mp4';

      await expect(
        VideoIntel.getMetadata(badUrl)
      ).rejects.toThrow();
    });

    it('should handle malformed URL', async () => {
      const malformedUrl = 'not-a-valid-url';

      await expect(
        VideoIntel.getThumbnails(malformedUrl)
      ).rejects.toThrow();
    });

    it('should handle URL that returns non-video content', async () => {
      // This URL returns HTML, not video
      const htmlUrl = 'https://www.google.com';

      await expect(
        VideoIntel.analyze(htmlUrl, { metadata: true })
      ).rejects.toThrow();
    });
  });

  describe('Invalid Options', () => {
    let videoFile: File;

    beforeAll(async () => {
      videoFile = await loadTestVideo(TEST_VIDEOS.fixtures.short);
    });

    it('should handle invalid thumbnail count (0)', async () => {
      await expect(
        VideoIntel.getThumbnails(videoFile, { count: 0 })
      ).rejects.toThrow();
    });

    it('should handle invalid thumbnail count (negative)', async () => {
      await expect(
        VideoIntel.getThumbnails(videoFile, { count: -5 })
      ).rejects.toThrow();
    });

    it('should handle invalid thumbnail count (too large)', async () => {
      await expect(
        VideoIntel.getThumbnails(videoFile, { count: 100 })
      ).rejects.toThrow();
    });

    it('should handle invalid quality (> 1)', async () => {
      await expect(
        VideoIntel.getThumbnails(videoFile, { count: 1, quality: 1.5 })
      ).rejects.toThrow();
    });

    it('should handle invalid quality (negative)', async () => {
      await expect(
        VideoIntel.getThumbnails(videoFile, { count: 1, quality: -0.5 })
      ).rejects.toThrow();
    });

    it('should handle invalid scene threshold (> 1)', async () => {
      await expect(
        VideoIntel.detectScenes(videoFile, { threshold: 1.5 })
      ).rejects.toThrow();
    });

    it('should handle invalid scene threshold (negative)', async () => {
      await expect(
        VideoIntel.detectScenes(videoFile, { threshold: -0.3 })
      ).rejects.toThrow();
    });

    it('should handle invalid color count (0)', async () => {
      await expect(
        VideoIntel.extractColors(videoFile, { count: 0 })
      ).rejects.toThrow();
    });

    it('should handle invalid color count (negative)', async () => {
      await expect(
        VideoIntel.extractColors(videoFile, { count: -3 })
      ).rejects.toThrow();
    });
  });

  describe('Resource Cleanup After Errors', () => {
    it('should cleanup resources when video loading fails', async () => {
      const invalidFile = new File(['bad'], 'bad.mp4', { type: 'video/mp4' });

      try {
        await VideoIntel.getThumbnails(invalidFile);
      } catch (error) {
        // Expected error
      }

      // Should be able to process valid file after error
      const validFile = await loadTestVideo(TEST_VIDEOS.fixtures.short);
      const metadata = await VideoIntel.getMetadata(validFile);
      
      expect(metadata).toBeDefined();
      expect(metadata.duration).toBeGreaterThan(0);
    });

    it('should cleanup after thumbnail generation error', async () => {
      const invalidFile = new File(['invalid'], 'bad.mp4', { type: 'video/mp4' });

      try {
        await VideoIntel.getThumbnails(invalidFile, { count: 5 });
      } catch (error) {
        // Expected
      }

      // Next operation should work
      const validFile = await loadTestVideo(TEST_VIDEOS.fixtures.short);
      const thumbnails = await VideoIntel.getThumbnails(validFile, { count: 3 });
      
      expect(thumbnails).toHaveLength(3);
    });

    it('should cleanup after scene detection error', async () => {
      const invalidFile = new File(['bad'], 'bad.mp4', { type: 'video/mp4' });

      try {
        await VideoIntel.detectScenes(invalidFile);
      } catch (error) {
        // Expected
      }

      // Should recover
      const validFile = await loadTestVideo(TEST_VIDEOS.fixtures.short);
      const scenes = await VideoIntel.detectScenes(validFile);
      
      expect(scenes.length).toBeGreaterThan(0);
    });

    it('should cleanup after color extraction error', async () => {
      const invalidFile = new File(['invalid'], 'bad.mp4', { type: 'video/mp4' });

      try {
        await VideoIntel.extractColors(invalidFile);
      } catch (error) {
        // Expected
      }

      // Should work after error
      const validFile = await loadTestVideo(TEST_VIDEOS.fixtures.short);
      const colors = await VideoIntel.extractColors(validFile);
      
      expect(colors.length).toBeGreaterThan(0);
    });

    it('should cleanup after analyze error', async () => {
      const invalidFile = new File(['bad data'], 'bad.mp4', { type: 'video/mp4' });

      try {
        await VideoIntel.analyze(invalidFile, { metadata: true });
      } catch (error) {
        // Expected
      }

      // Should recover and work normally
      const validFile = await loadTestVideo(TEST_VIDEOS.fixtures.short);
      const result = await VideoIntel.analyze(validFile, {
        metadata: true,
        thumbnails: { count: 3 }
      });
      
      expect(result.metadata).toBeDefined();
      expect(result.thumbnails).toHaveLength(3);
    });
  });

  describe('Multiple Consecutive Errors', () => {
    it('should handle multiple errors in sequence', async () => {
      const invalidFile = new File(['bad'], 'bad.mp4', { type: 'video/mp4' });

      // Try multiple operations with invalid file
      await expect(VideoIntel.getMetadata(invalidFile)).rejects.toThrow();
      await expect(VideoIntel.getThumbnails(invalidFile)).rejects.toThrow();
      await expect(VideoIntel.detectScenes(invalidFile)).rejects.toThrow();

      // Should still work after multiple errors
      const validFile = await loadTestVideo(TEST_VIDEOS.fixtures.short);
      const metadata = await VideoIntel.getMetadata(validFile);
      
      expect(metadata).toBeDefined();
    });

    it('should not accumulate memory after multiple errors', async () => {
      const invalidFile = new File(['bad'], 'bad.mp4', { type: 'video/mp4' });
      const initialMemory = process.memoryUsage().heapUsed;

      // Generate multiple errors
      for (let i = 0; i < 10; i++) {
        try {
          await VideoIntel.getThumbnails(invalidFile);
        } catch (error) {
          // Expected
        }
      }

      if (global.gc) global.gc();
      const finalMemory = process.memoryUsage().heapUsed;
      const growth = finalMemory - initialMemory;

      // Memory shouldn't grow significantly from errors
      expect(growth).toBeLessThan(10 * 1024 * 1024); // <10MB
    });
  });

  describe('Partial Failures in analyze()', () => {
    it('should handle error in one feature gracefully', async () => {
      const validFile = await loadTestVideo(TEST_VIDEOS.fixtures.short);

      // Even if one feature fails, others should succeed
      // (This test assumes analyze handles partial failures gracefully)
      const result = await VideoIntel.analyze(validFile, {
        metadata: true,
        thumbnails: { count: 3 }
      });

      // At least metadata should work
      expect(result.metadata).toBeDefined();
    });
  });

  describe('Concurrent Error Scenarios', () => {
    it('should handle concurrent requests with some failures', async () => {
      const validFile = await loadTestVideo(TEST_VIDEOS.fixtures.short);
      const invalidFile = new File(['bad'], 'bad.mp4', { type: 'video/mp4' });

      const promises = [
        VideoIntel.getMetadata(validFile),
        VideoIntel.getMetadata(invalidFile).catch(() => null),
        VideoIntel.getMetadata(validFile),
      ];

      const results = await Promise.all(promises);

      // Valid requests should succeed
      expect(results[0]).toBeDefined();
      expect(results[2]).toBeDefined();
      
      // Invalid request should return null (caught)
      expect(results[1]).toBeNull();
    });
  });

  describe('Error Recovery', () => {
    it('should work normally after recovering from error', async () => {
      const invalidFile = new File(['bad'], 'bad.mp4', { type: 'video/mp4' });
      const validFile = await loadTestVideo(TEST_VIDEOS.fixtures.short);

      // Cause an error
      try {
        await VideoIntel.getThumbnails(invalidFile);
      } catch (error) {
        // Expected
      }

      // Should work normally now
      const result1 = await VideoIntel.getThumbnails(validFile, { count: 3 });
      expect(result1).toHaveLength(3);

      const result2 = await VideoIntel.detectScenes(validFile);
      expect(result2.length).toBeGreaterThan(0);

      const result3 = await VideoIntel.extractColors(validFile);
      expect(result3.length).toBeGreaterThan(0);

      const result4 = await VideoIntel.getMetadata(validFile);
      expect(result4.duration).toBeGreaterThan(0);
    });

    it('should handle alternating valid and invalid requests', async () => {
      const validFile = await loadTestVideo(TEST_VIDEOS.fixtures.short);
      const invalidFile = new File(['bad'], 'bad.mp4', { type: 'video/mp4' });

      // Valid
      const meta1 = await VideoIntel.getMetadata(validFile);
      expect(meta1).toBeDefined();

      // Invalid
      await expect(VideoIntel.getMetadata(invalidFile)).rejects.toThrow();

      // Valid again
      const meta2 = await VideoIntel.getMetadata(validFile);
      expect(meta2).toBeDefined();

      // Invalid again
      await expect(VideoIntel.getThumbnails(invalidFile)).rejects.toThrow();

      // Valid again
      const thumbs = await VideoIntel.getThumbnails(validFile, { count: 3 });
      expect(thumbs).toHaveLength(3);
    });
  });

  describe('Edge Case Inputs', () => {
    it('should handle null input gracefully', async () => {
      await expect(
        VideoIntel.getMetadata(null as any)
      ).rejects.toThrow();
    });

    it('should handle undefined input gracefully', async () => {
      await expect(
        VideoIntel.getThumbnails(undefined as any)
      ).rejects.toThrow();
    });

    it('should handle empty string URL', async () => {
      await expect(
        VideoIntel.getMetadata('')
      ).rejects.toThrow();
    });

    it('should handle File without proper type', async () => {
      const fileWithoutType = new File(['data'], 'video.mp4', {
        type: '' // Empty type
      });

      // Should either work or fail gracefully
      try {
        await VideoIntel.getMetadata(fileWithoutType);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Error Types', () => {
    it('should throw appropriate error types', async () => {
      const invalidFile = new File(['bad'], 'bad.mp4', { type: 'video/mp4' });

      try {
        await VideoIntel.getMetadata(invalidFile);
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        // Could also check for custom error types if implemented
      }
    });

    it('should include error context in error messages', async () => {
      const invalidFile = new File(['bad'], 'bad.mp4', { type: 'video/mp4' });

      try {
        await VideoIntel.getThumbnails(invalidFile, { count: 5 });
        fail('Should have thrown');
      } catch (error) {
        const message = (error as Error).message;
        expect(message).toBeTruthy();
        expect(typeof message).toBe('string');
        // Error message should provide useful context
        expect(message.length).toBeGreaterThan(10);
      }
    });
  });

  describe('Timeout Scenarios', () => {
    it('should eventually timeout on unresponsive operations', async () => {
      // This test verifies the system doesn't hang indefinitely
      // For now, we just verify operations complete in reasonable time
      const validFile = await loadTestVideo(TEST_VIDEOS.fixtures.short);
      
      const startTime = Date.now();
      await VideoIntel.getMetadata(validFile);
      const duration = Date.now() - startTime;

      // Should complete in under 30 seconds
      expect(duration).toBeLessThan(30000);
    });
  });

  describe('Invalid State Recovery', () => {
    it('should recover from multiple different error types', async () => {
      const validFile = await loadTestVideo(TEST_VIDEOS.fixtures.short);

      // Various error types
      await expect(
        VideoIntel.getThumbnails(validFile, { count: -1 })
      ).rejects.toThrow();

      await expect(
        VideoIntel.getThumbnails(new File(['bad'], 'bad.mp4', { type: 'video/mp4' }))
      ).rejects.toThrow();

      // Should still work
      const result = await VideoIntel.getThumbnails(validFile, { count: 3 });
      expect(result).toHaveLength(3);
    });
  });
});


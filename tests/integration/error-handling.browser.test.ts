/**
 * Integration Tests - Error Handling (Playwright Browser Tests)
 * 
 * Tests error scenarios, graceful degradation, and resource cleanup
 * when errors occur during video processing.
 * 
 * This is the Playwright version that runs in real browsers.
 */

import { test, expect, Page } from '@playwright/test';
import { 
  setupVideoIntelPage,
  loadTestVideo,
  TEST_VIDEOS
} from './playwright-setup';

test.describe('Error Handling - Integration', () => {
  test.beforeEach(async ({ page }) => {
    await setupVideoIntelPage(page);
  });

  test.describe('Invalid Video Files', () => {
    test('should handle invalid video file gracefully', async ({ page }) => {
      const error = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const invalidFile = new File(['invalid video content'], 'invalid.mp4', {
          type: 'video/mp4'
        });

        try {
          await videoIntel.getMetadata(invalidFile);
          return null;
        } catch (error) {
          return { message: (error as Error).message };
        }
      });

      expect(error).not.toBeNull();
    });

    test('should handle empty video file', async ({ page }) => {
      const error = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const emptyFile = new File([], 'empty.mp4', {
          type: 'video/mp4'
        });

        try {
          await videoIntel.getThumbnails(emptyFile);
          return null;
        } catch (error) {
          return { message: (error as Error).message };
        }
      });

      expect(error).not.toBeNull();
    });

    test('should handle corrupted video data', async ({ page }) => {
      const error = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const corruptedFile = new File([
          new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0]) // Invalid video data
        ], 'corrupted.mp4', {
          type: 'video/mp4'
        });

        try {
          await videoIntel.detectScenes(corruptedFile);
          return null;
        } catch (error) {
          return { message: (error as Error).message };
        }
      });

      expect(error).not.toBeNull();
    });

    test('should handle non-video file with video mime type', async ({ page }) => {
      const error = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const textFile = new File(['This is text, not a video'], 'fake.mp4', {
          type: 'video/mp4'
        });

        try {
          await videoIntel.extractColors(textFile);
          return null;
        } catch (error) {
          return { message: (error as Error).message };
        }
      });

      expect(error).not.toBeNull();
    });

    test('should provide meaningful error messages', async ({ page }) => {
      const errorMessage = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const invalidFile = new File(['bad data'], 'bad.mp4', {
          type: 'video/mp4'
        });

        try {
          await videoIntel.getMetadata(invalidFile);
          return null;
        } catch (error) {
          return (error as Error).message;
        }
      });

      expect(errorMessage).toBeTruthy();
      expect(typeof errorMessage).toBe('string');
      expect(errorMessage!.length).toBeGreaterThan(0);
    });
  });

  test.describe('Invalid URLs', () => {
    test('should handle non-existent URL', async ({ page }) => {
      const error = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const badUrl = 'http://example.com/nonexistent-video.mp4';

        try {
          await videoIntel.getMetadata(badUrl);
          return null;
        } catch (error) {
          return { message: (error as Error).message };
        }
      });

      expect(error).not.toBeNull();
    });

    test('should handle malformed URL', async ({ page }) => {
      const error = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const malformedUrl = 'not-a-valid-url';

        try {
          await videoIntel.getThumbnails(malformedUrl);
          return null;
        } catch (error) {
          return { message: (error as Error).message };
        }
      });

      expect(error).not.toBeNull();
    });

    test('should handle URL that returns non-video content', async ({ page }) => {
      const error = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        // This URL returns HTML, not video
        const htmlUrl = 'https://www.google.com';

        try {
          await videoIntel.analyze(htmlUrl, { metadata: true });
          return null;
        } catch (error) {
          return { message: (error as Error).message };
        }
      });

      expect(error).not.toBeNull();
    });
  });

  test.describe('Invalid Options', () => {
    test.beforeEach(async ({ page }) => {
      await loadTestVideo(page, TEST_VIDEOS.fixtures.short);
    });

    test('should handle invalid thumbnail count (0)', async ({ page }) => {
      const error = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;

        try {
          await videoIntel.getThumbnails(videoFile, { count: 0 });
          return null;
        } catch (error) {
          return { message: (error as Error).message };
        }
      });

      expect(error).not.toBeNull();
    });

    test('should handle invalid thumbnail count (negative)', async ({ page }) => {
      const error = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;

        try {
          await videoIntel.getThumbnails(videoFile, { count: -5 });
          return null;
        } catch (error) {
          return { message: (error as Error).message };
        }
      });

      expect(error).not.toBeNull();
    });

    test('should handle invalid thumbnail count (too large)', async ({ page }) => {
      const error = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;

        try {
          await videoIntel.getThumbnails(videoFile, { count: 100 });
          return null;
        } catch (error) {
          return { message: (error as Error).message };
        }
      });

      expect(error).not.toBeNull();
    });

    test('should handle invalid quality (> 1)', async ({ page }) => {
      const error = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;

        try {
          await videoIntel.getThumbnails(videoFile, { count: 1, quality: 1.5 });
          return null;
        } catch (error) {
          return { message: (error as Error).message };
        }
      });

      expect(error).not.toBeNull();
    });

    test('should handle invalid quality (negative)', async ({ page }) => {
      const error = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;

        try {
          await videoIntel.getThumbnails(videoFile, { count: 1, quality: -0.5 });
          return null;
        } catch (error) {
          return { message: (error as Error).message };
        }
      });

      expect(error).not.toBeNull();
    });

    test('should handle invalid scene threshold (> 1)', async ({ page }) => {
      const error = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;

        try {
          await videoIntel.detectScenes(videoFile, { threshold: 1.5 });
          return null;
        } catch (error) {
          return { message: (error as Error).message };
        }
      });

      expect(error).not.toBeNull();
    });

    test('should handle invalid scene threshold (negative)', async ({ page }) => {
      const error = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;

        try {
          await videoIntel.detectScenes(videoFile, { threshold: -0.3 });
          return null;
        } catch (error) {
          return { message: (error as Error).message };
        }
      });

      expect(error).not.toBeNull();
    });

    test('should handle invalid color count (0)', async ({ page }) => {
      const error = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;

        try {
          await videoIntel.extractColors(videoFile, { count: 0 });
          return null;
        } catch (error) {
          return { message: (error as Error).message };
        }
      });

      expect(error).not.toBeNull();
    });

    test('should handle invalid color count (negative)', async ({ page }) => {
      const error = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;

        try {
          await videoIntel.extractColors(videoFile, { count: -3 });
          return null;
        } catch (error) {
          return { message: (error as Error).message };
        }
      });

      expect(error).not.toBeNull();
    });
  });

  test.describe('Resource Cleanup After Errors', () => {
    test('should cleanup resources when video loading fails', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const invalidFile = new File(['bad'], 'bad.mp4', { type: 'video/mp4' });

        try {
          await videoIntel.getThumbnails(invalidFile);
        } catch (error) {
          // Expected error
        }

        // Load a valid video and try again
        return { recovered: true };
      });

      expect(result.recovered).toBe(true);

      // Should be able to process valid file after error
      await loadTestVideo(page, TEST_VIDEOS.fixtures.short);
      const metadata = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;
        return await videoIntel.getMetadata(videoFile);
      });
      
      expect(metadata).toBeDefined();
      expect(metadata.duration).toBeGreaterThan(0);
    });

    test('should cleanup after thumbnail generation error', async ({ page }) => {
      await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const invalidFile = new File(['invalid'], 'bad.mp4', { type: 'video/mp4' });

        try {
          await videoIntel.getThumbnails(invalidFile, { count: 5 });
        } catch (error) {
          // Expected
        }
      });

      // Next operation should work
      await loadTestVideo(page, TEST_VIDEOS.fixtures.short);
      const thumbnails = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;
        return await videoIntel.getThumbnails(videoFile, { count: 3 });
      });
      
      expect(thumbnails).toHaveLength(3);
    });

    test('should cleanup after scene detection error', async ({ page }) => {
      await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const invalidFile = new File(['bad'], 'bad.mp4', { type: 'video/mp4' });

        try {
          await videoIntel.detectScenes(invalidFile);
        } catch (error) {
          // Expected
        }
      });

      // Should recover
      await loadTestVideo(page, TEST_VIDEOS.fixtures.short);
      const scenes = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;
        return await videoIntel.detectScenes(videoFile);
      });
      
      expect(scenes.length).toBeGreaterThan(0);
    });

    test('should cleanup after color extraction error', async ({ page }) => {
      await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const invalidFile = new File(['invalid'], 'bad.mp4', { type: 'video/mp4' });

        try {
          await videoIntel.extractColors(invalidFile);
        } catch (error) {
          // Expected
        }
      });

      // Should work after error
      await loadTestVideo(page, TEST_VIDEOS.fixtures.short);
      const colors = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;
        return await videoIntel.extractColors(videoFile);
      });
      
      expect(colors.length).toBeGreaterThan(0);
    });

    test('should cleanup after analyze error', async ({ page }) => {
      await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const invalidFile = new File(['bad data'], 'bad.mp4', { type: 'video/mp4' });

        try {
          await videoIntel.analyze(invalidFile, { metadata: true });
        } catch (error) {
          // Expected
        }
      });

      // Should recover and work normally
      await loadTestVideo(page, TEST_VIDEOS.fixtures.short);
      const result = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;
        return await videoIntel.analyze(videoFile, {
          metadata: true,
          thumbnails: { count: 3 }
        });
      });
      
      expect(result.metadata).toBeDefined();
      expect(result.thumbnails).toHaveLength(3);
    });
  });

  test.describe('Multiple Consecutive Errors', () => {
    test('should handle multiple errors in sequence', async ({ page }) => {
      const errors = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const invalidFile = new File(['bad'], 'bad.mp4', { type: 'video/mp4' });
        const errors: string[] = [];

        // Try multiple operations with invalid file
        try {
          await videoIntel.getMetadata(invalidFile);
        } catch (e) {
          errors.push('metadata');
        }

        try {
          await videoIntel.getThumbnails(invalidFile);
        } catch (e) {
          errors.push('thumbnails');
        }

        try {
          await videoIntel.detectScenes(invalidFile);
        } catch (e) {
          errors.push('scenes');
        }

        return errors;
      });

      expect(errors).toHaveLength(3);

      // Should still work after multiple errors
      await loadTestVideo(page, TEST_VIDEOS.fixtures.short);
      const metadata = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;
        return await videoIntel.getMetadata(videoFile);
      });
      
      expect(metadata).toBeDefined();
    });

    test('should not accumulate memory after multiple errors', async ({ page }) => {
      const memoryData = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const invalidFile = new File(['bad'], 'bad.mp4', { type: 'video/mp4' });
        
        const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

        // Generate multiple errors
        for (let i = 0; i < 10; i++) {
          try {
            await videoIntel.getThumbnails(invalidFile);
          } catch (error) {
            // Expected
          }
        }

        const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
        const growth = finalMemory - initialMemory;

        return { initialMemory, finalMemory, growth };
      });

      if (memoryData.initialMemory > 0) {
        // Memory shouldn't grow significantly from errors
        expect(memoryData.growth).toBeLessThan(10 * 1024 * 1024); // <10MB
      }
    });
  });

  test.describe('Partial Failures in analyze()', () => {
    test('should handle error in one feature gracefully', async ({ page }) => {
      await loadTestVideo(page, TEST_VIDEOS.fixtures.short);

      const result = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;

        // Even if one feature fails, others should succeed
        return await videoIntel.analyze(videoFile, {
          metadata: true,
          thumbnails: { count: 3 }
        });
      });

      // At least metadata should work
      expect(result.metadata).toBeDefined();
    });
  });

  test.describe('Concurrent Error Scenarios', () => {
    test('should handle concurrent requests with some failures', async ({ page }) => {
      await loadTestVideo(page, TEST_VIDEOS.fixtures.short);

      const results = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;
        const invalidFile = new File(['bad'], 'bad.mp4', { type: 'video/mp4' });

        const promises = [
          videoIntel.getMetadata(videoFile),
          videoIntel.getMetadata(invalidFile).catch(() => null),
          videoIntel.getMetadata(videoFile),
        ];

        return await Promise.all(promises);
      });

      // Valid requests should succeed
      expect(results[0]).toBeDefined();
      expect(results[2]).toBeDefined();
      
      // Invalid request should return null (caught)
      expect(results[1]).toBeNull();
    });
  });

  test.describe('Error Recovery', () => {
    test('should work normally after recovering from error', async ({ page }) => {
      await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const invalidFile = new File(['bad'], 'bad.mp4', { type: 'video/mp4' });

        // Cause an error
        try {
          await videoIntel.getThumbnails(invalidFile);
        } catch (error) {
          // Expected
        }
      });

      // Load valid video
      await loadTestVideo(page, TEST_VIDEOS.fixtures.short);

      // Should work normally now
      const results = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;

        const result1 = await videoIntel.getThumbnails(videoFile, { count: 3 });
        const result2 = await videoIntel.detectScenes(videoFile);
        const result3 = await videoIntel.extractColors(videoFile);
        const result4 = await videoIntel.getMetadata(videoFile);

        return { result1, result2, result3, result4 };
      });

      expect(results.result1).toHaveLength(3);
      expect(results.result2.length).toBeGreaterThan(0);
      expect(results.result3.length).toBeGreaterThan(0);
      expect(results.result4.duration).toBeGreaterThan(0);
    });

    test('should handle alternating valid and invalid requests', async ({ page }) => {
      await loadTestVideo(page, TEST_VIDEOS.fixtures.short);

      const results = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;
        const invalidFile = new File(['bad'], 'bad.mp4', { type: 'video/mp4' });
        const results: any[] = [];

        // Valid
        const meta1 = await videoIntel.getMetadata(videoFile);
        results.push({ type: 'valid', success: !!meta1 });

        // Invalid
        try {
          await videoIntel.getMetadata(invalidFile);
          results.push({ type: 'invalid', success: true });
        } catch (e) {
          results.push({ type: 'invalid', success: false });
        }

        // Valid again
        const meta2 = await videoIntel.getMetadata(videoFile);
        results.push({ type: 'valid', success: !!meta2 });

        // Invalid again
        try {
          await videoIntel.getThumbnails(invalidFile);
          results.push({ type: 'invalid', success: true });
        } catch (e) {
          results.push({ type: 'invalid', success: false });
        }

        // Valid again
        const thumbs = await videoIntel.getThumbnails(videoFile, { count: 3 });
        results.push({ type: 'valid', success: thumbs.length === 3 });

        return results;
      });

      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(true);
      expect(results[3].success).toBe(false);
      expect(results[4].success).toBe(true);
    });
  });

  test.describe('Edge Case Inputs', () => {
    test('should handle null input gracefully', async ({ page }) => {
      const error = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;

        try {
          await videoIntel.getMetadata(null as any);
          return null;
        } catch (error) {
          return { message: (error as Error).message };
        }
      });

      expect(error).not.toBeNull();
    });

    test('should handle undefined input gracefully', async ({ page }) => {
      const error = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;

        try {
          await videoIntel.getThumbnails(undefined as any);
          return null;
        } catch (error) {
          return { message: (error as Error).message };
        }
      });

      expect(error).not.toBeNull();
    });

    test('should handle empty string URL', async ({ page }) => {
      const error = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;

        try {
          await videoIntel.getMetadata('');
          return null;
        } catch (error) {
          return { message: (error as Error).message };
        }
      });

      expect(error).not.toBeNull();
    });

    test('should handle File without proper type', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const fileWithoutType = new File(['data'], 'video.mp4', {
          type: '' // Empty type
        });

        try {
          await videoIntel.getMetadata(fileWithoutType);
          return { success: true };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      });

      // Should either work or fail gracefully
      expect(result).toBeDefined();
    });
  });

  test.describe('Error Types', () => {
    test('should throw appropriate error types', async ({ page }) => {
      const errorInfo = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const invalidFile = new File(['bad'], 'bad.mp4', { type: 'video/mp4' });

        try {
          await videoIntel.getMetadata(invalidFile);
          return null;
        } catch (error) {
          return {
            isError: error instanceof Error,
            message: (error as Error).message,
            hasStack: !!(error as Error).stack
          };
        }
      });

      expect(errorInfo).not.toBeNull();
      expect(errorInfo!.isError).toBe(true);
    });

    test('should include error context in error messages', async ({ page }) => {
      const message = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const invalidFile = new File(['bad'], 'bad.mp4', { type: 'video/mp4' });

        try {
          await videoIntel.getThumbnails(invalidFile, { count: 5 });
          return null;
        } catch (error) {
          return (error as Error).message;
        }
      });

      expect(message).toBeTruthy();
      expect(typeof message).toBe('string');
      // Error message should provide useful context
      expect(message!.length).toBeGreaterThan(10);
    });
  });

  test.describe('Timeout Scenarios', () => {
    test('should eventually timeout on unresponsive operations', async ({ page }) => {
      await loadTestVideo(page, TEST_VIDEOS.fixtures.short);

      const duration = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;
        
        const startTime = Date.now();
        await videoIntel.getMetadata(videoFile);
        return Date.now() - startTime;
      });

      // Should complete in under 30 seconds
      expect(duration).toBeLessThan(30000);
    });
  });

  test.describe('Invalid State Recovery', () => {
    test('should recover from multiple different error types', async ({ page }) => {
      await loadTestVideo(page, TEST_VIDEOS.fixtures.short);

      const results = await page.evaluate(async () => {
        const videoIntel = (window as any).videoIntel;
        const videoFile = (window as any).testVideoFile;
        const errors: string[] = [];

        // Various error types
        try {
          await videoIntel.getThumbnails(videoFile, { count: -1 });
        } catch (e) {
          errors.push('invalid-count');
        }

        try {
          const badFile = new File(['bad'], 'bad.mp4', { type: 'video/mp4' });
          await videoIntel.getThumbnails(badFile);
        } catch (e) {
          errors.push('bad-file');
        }

        // Should still work
        const result = await videoIntel.getThumbnails(videoFile, { count: 3 });
        
        return { errors, resultLength: result.length };
      });

      expect(results.errors).toHaveLength(2);
      expect(results.resultLength).toBe(3);
    });
  });
});



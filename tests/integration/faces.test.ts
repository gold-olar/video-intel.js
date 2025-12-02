/**
 * Face Detection Integration Tests
 * 
 * These tests verify face detection works end-to-end with real videos.
 * 
 * NOTE: These tests require a real browser environment and will be skipped in jsdom.
 * To run these tests, use Playwright or test in an actual browser.
 * 
 * To run this test:
 *   1. Download test fixtures: npm run test:download-fixtures
 *   2. Run test: npm test tests/integration/faces.test.ts
 */

import VideoIntel from '../../src';
import { 
  loadTestVideo, 
  getTestVideoURL,
  assertDefined,
  TEST_VIDEOS,
  formatBytes
} from './setup';

// Skip all tests in this file if running in jsdom (Node.js environment)
const describeIfBrowser = typeof window !== 'undefined' && window.HTMLVideoElement && typeof URL.createObjectURL === 'function'
  ? describe
  : describe.skip;

describeIfBrowser('Face Detection Integration Tests', () => {
  // Increase timeout for integration tests (model loading + video processing)
  jest.setTimeout(60000); // 60 seconds

  describe('Basic Face Detection', () => {
    let videoFile: File;

    beforeAll(async () => {
      // Load test video once for all tests in this suite
      try {
        videoFile = await loadTestVideo(TEST_VIDEOS.fixtures.short);
      } catch (error) {
        console.warn('⚠️  Test video not available. Run: npm run test:download-fixtures');
        throw error;
      }
    });

    it('should detect faces in video (basic detection)', async () => {
      const result = await VideoIntel.detectFaces(videoFile);

      // Verify result structure
      assertDefined(result);
      expect(result).toHaveProperty('detected');
      expect(result).toHaveProperty('averageCount');
      expect(result).toHaveProperty('frames');

      expect(typeof result.detected).toBe('boolean');
      expect(typeof result.averageCount).toBe('number');
      expect(Array.isArray(result.frames)).toBe(true);

      console.log('👤 Face detection result:', {
        detected: result.detected,
        averageCount: result.averageCount.toFixed(2),
        framesAnalyzed: result.frames.length
      });
    });

    it('should respect confidence threshold option', async () => {
      const lowConfidence = await VideoIntel.detectFaces(videoFile, {
        confidence: 0.3 // Very permissive
      });

      const highConfidence = await VideoIntel.detectFaces(videoFile, {
        confidence: 0.9 // Very strict
      });

      // Low confidence should detect at least as many faces as high confidence
      expect(lowConfidence.averageCount).toBeGreaterThanOrEqual(highConfidence.averageCount);

      console.log('🎯 Confidence threshold comparison:', {
        lowThreshold: { confidence: 0.3, avgFaces: lowConfidence.averageCount.toFixed(2) },
        highThreshold: { confidence: 0.9, avgFaces: highConfidence.averageCount.toFixed(2) }
      });
    });

    it('should respect sampling rate option', async () => {
      const startTime = performance.now();

      await VideoIntel.detectFaces(videoFile, {
        samplingRate: 5.0 // Sample every 5 seconds (fewer frames)
      });

      const duration = performance.now() - startTime;

      console.log(`⚡ Processing time with 5s sampling: ${duration.toFixed(2)}ms`);

      // With fewer frames, should be faster (though model loading dominates first run)
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
    });
  });

  describe('Face Detection with Coordinates', () => {
    let videoFile: File;

    beforeAll(async () => {
      videoFile = await loadTestVideo(TEST_VIDEOS.fixtures.short);
    });

    it('should return bounding boxes when returnCoordinates is true', async () => {
      const result = await VideoIntel.detectFaces(videoFile, {
        returnCoordinates: true
      });

      assertDefined(result);

      if (result.detected && result.frames.length > 0) {
        // Check first frame with faces
        const frameWithFaces = result.frames.find(f => f.faces.length > 0);

        if (frameWithFaces) {
          const face = frameWithFaces.faces[0];

          // Verify face structure
          expect(face).toHaveProperty('x');
          expect(face).toHaveProperty('y');
          expect(face).toHaveProperty('width');
          expect(face).toHaveProperty('height');
          expect(face).toHaveProperty('confidence');

          // Verify values are reasonable
          expect(face.x).toBeGreaterThanOrEqual(0);
          expect(face.y).toBeGreaterThanOrEqual(0);
          expect(face.width).toBeGreaterThan(0);
          expect(face.height).toBeGreaterThan(0);
          expect(face.confidence).toBeGreaterThan(0);
          expect(face.confidence).toBeLessThanOrEqual(1);

          console.log('📦 Face bounding box:', {
            position: `(${face.x}, ${face.y})`,
            size: `${face.width}x${face.height}`,
            confidence: face.confidence.toFixed(3)
          });
        }
      }
    });

    it('should not return frames when returnCoordinates is false', async () => {
      const result = await VideoIntel.detectFaces(videoFile, {
        returnCoordinates: false
      });

      // Frames array should be empty when coordinates not requested
      expect(result.frames).toHaveLength(0);

      // But should still report detection status
      expect(result).toHaveProperty('detected');
      expect(result).toHaveProperty('averageCount');
    });

    it('should return frames at correct timestamps', async () => {
      const result = await VideoIntel.detectFaces(videoFile, {
        returnCoordinates: true,
        samplingRate: 2.0
      });

      if (result.frames.length > 0) {
        // Verify timestamps are in order
        for (let i = 1; i < result.frames.length; i++) {
          expect(result.frames[i].timestamp).toBeGreaterThan(result.frames[i - 1].timestamp);
        }

        // Verify timestamps match sampling rate (approximately)
        if (result.frames.length >= 2) {
          const timeDiff = result.frames[1].timestamp - result.frames[0].timestamp;
          expect(timeDiff).toBeCloseTo(2.0, 0); // Within 1 second tolerance
        }

        console.log('⏱️  Frame timestamps:', result.frames.map(f => `${f.timestamp.toFixed(1)}s`).join(', '));
      }
    });
  });

  describe('Face Thumbnail Extraction', () => {
    let videoFile: File;

    beforeAll(async () => {
      videoFile = await loadTestVideo(TEST_VIDEOS.fixtures.short);
    });

    it('should extract face thumbnails when returnThumbnails is true', async () => {
      const result = await VideoIntel.detectFaces(videoFile, {
        returnCoordinates: true,
        returnThumbnails: true
      });

      if (result.detected && result.frames.length > 0) {
        const frameWithFaces = result.frames.find(f => f.faces.length > 0);

        if (frameWithFaces) {
          const face = frameWithFaces.faces[0];

          // Should have thumbnail
          expect(face.thumbnail).toBeDefined();
          expect(face.thumbnail).toBeInstanceOf(Blob);
          expect(face.thumbnail!.size).toBeGreaterThan(0);

          console.log('🖼️  Face thumbnail:', {
            size: formatBytes(face.thumbnail!.size),
            type: face.thumbnail!.type
          });
        }
      }
    });

    it('should respect thumbnailFormat option (jpeg)', async () => {
      const result = await VideoIntel.detectFaces(videoFile, {
        returnCoordinates: true,
        returnThumbnails: true,
        thumbnailFormat: 'jpeg'
      });

      if (result.detected && result.frames.length > 0) {
        const frameWithFaces = result.frames.find(f => f.faces.length > 0);

        if (frameWithFaces && frameWithFaces.faces[0].thumbnail) {
          const thumbnail = frameWithFaces.faces[0].thumbnail;

          expect(thumbnail.type).toContain('jpeg');
          console.log('📸 JPEG thumbnail size:', formatBytes(thumbnail.size));
        }
      }
    });

    it('should respect thumbnailFormat option (png)', async () => {
      const result = await VideoIntel.detectFaces(videoFile, {
        returnCoordinates: true,
        returnThumbnails: true,
        thumbnailFormat: 'png'
      });

      if (result.detected && result.frames.length > 0) {
        const frameWithFaces = result.frames.find(f => f.faces.length > 0);

        if (frameWithFaces && frameWithFaces.faces[0].thumbnail) {
          const thumbnail = frameWithFaces.faces[0].thumbnail;

          expect(thumbnail.type).toContain('png');
          console.log('📸 PNG thumbnail size:', formatBytes(thumbnail.size));
        }
      }
    });

    it('should validate returnThumbnails requires returnCoordinates', async () => {
      await expect(
        VideoIntel.detectFaces(videoFile, {
          returnCoordinates: false,
          returnThumbnails: true
        })
      ).rejects.toThrow();

      await expect(
        VideoIntel.detectFaces(videoFile, {
          returnCoordinates: false,
          returnThumbnails: true
        })
      ).rejects.toThrow(/returnThumbnails requires returnCoordinates/i);

      console.log('✅ Validation working: returnThumbnails requires returnCoordinates');
    });

    it('should extract multiple face thumbnails from same frame', async () => {
      const result = await VideoIntel.detectFaces(videoFile, {
        returnCoordinates: true,
        returnThumbnails: true,
        confidence: 0.5 // Lower to increase chance of multiple faces
      });

      if (result.frames.length > 0) {
        const multipleFrame = result.frames.find(f => f.faces.length > 1);

        if (multipleFrame) {
          console.log(`👥 Found frame with ${multipleFrame.faces.length} faces`);

          // All faces should have thumbnails
          multipleFrame.faces.forEach((face, i) => {
            expect(face.thumbnail).toBeDefined();
            expect(face.thumbnail).toBeInstanceOf(Blob);
            console.log(`  Face ${i + 1}: ${formatBytes(face.thumbnail!.size)}`);
          });
        }
      }
    });
  });

  describe('Integration with analyze()', () => {
    let videoFile: File;

    beforeAll(async () => {
      videoFile = await loadTestVideo(TEST_VIDEOS.fixtures.short);
    });

    it('should detect faces through analyze() method', async () => {
      const result = await VideoIntel.analyze(videoFile, {
        faces: {
          confidence: 0.7,
          returnCoordinates: true
        },
        metadata: true
      });

      // Verify faces are included in analysis result
      assertDefined(result.faces);
      expect(result.faces).toHaveProperty('detected');
      expect(result.faces).toHaveProperty('averageCount');
      expect(result.faces).toHaveProperty('frames');

      console.log('🎬 Full analysis with faces:', {
        duration: result.metadata?.duration.toFixed(2),
        facesDetected: result.faces.detected,
        avgFaceCount: result.faces.averageCount.toFixed(2)
      });
    });

    it('should work with multiple features simultaneously', async () => {
      const progressValues: number[] = [];

      const result = await VideoIntel.analyze(videoFile, {
        metadata: true,
        thumbnails: { count: 3 },
        faces: {
          returnCoordinates: true
        },
        colors: { count: 5 },
        onProgress: (progress) => {
          progressValues.push(progress);
        }
      });

      // All features should be present
      assertDefined(result.metadata);
      assertDefined(result.thumbnails);
      assertDefined(result.faces);
      assertDefined(result.colors);

      expect(result.thumbnails).toHaveLength(3);
      expect(result.colors).toHaveLength(5);

      // Progress should reach 100%
      if (progressValues.length > 0) {
        expect(progressValues[progressValues.length - 1]).toBe(100);
      }

      console.log('✅ Multi-feature analysis complete:', {
        thumbnails: result.thumbnails.length,
        faces: result.faces.detected ? 'Yes' : 'No',
        colors: result.colors.length
      });
    });

    it('should handle boolean faces option', async () => {
      // Boolean true should use defaults
      const result = await VideoIntel.analyze(videoFile, {
        faces: true,
        metadata: true
      });

      assertDefined(result.faces);
      expect(result.faces).toHaveProperty('detected');
      expect(result.faces).toHaveProperty('averageCount');
    });
  });

  describe('Performance', () => {
    let videoFile: File;

    beforeAll(async () => {
      videoFile = await loadTestVideo(TEST_VIDEOS.fixtures.short);
    });

    it('should complete detection within reasonable time', async () => {
      const startTime = performance.now();

      await VideoIntel.detectFaces(videoFile, {
        samplingRate: 2.0
      });

      const duration = performance.now() - startTime;

      console.log(`⚡ Total detection time: ${duration.toFixed(2)}ms`);

      // Should complete within 30 seconds (including model load)
      expect(duration).toBeLessThan(30000);
    });

    it('should be faster on subsequent runs (model cached)', async () => {
      // First run (model may need to load)
      const start1 = performance.now();
      await VideoIntel.detectFaces(videoFile);
      const duration1 = performance.now() - start1;

      // Second run (model should be cached)
      const start2 = performance.now();
      await VideoIntel.detectFaces(videoFile);
      const duration2 = performance.now() - start2;

      console.log('🚀 Performance comparison:', {
        firstRun: `${duration1.toFixed(2)}ms`,
        secondRun: `${duration2.toFixed(2)}ms`,
        improvement: `${((1 - duration2/duration1) * 100).toFixed(1)}%`
      });

      // Second run should be faster (or at least not slower)
      expect(duration2).toBeLessThanOrEqual(duration1 * 1.2); // Allow 20% variance
    });

    it('should handle different sampling rates efficiently', async () => {
      const rates = [1.0, 2.0, 5.0];
      const times: number[] = [];

      for (const rate of rates) {
        const start = performance.now();
        await VideoIntel.detectFaces(videoFile, { samplingRate: rate });
        const duration = performance.now() - start;
        times.push(duration);

        console.log(`⏱️  Sampling rate ${rate}s: ${duration.toFixed(2)}ms`);
      }

      // Higher sampling rate should generally be faster (fewer frames)
      // But model overhead may dominate, so we just check it completes
      times.forEach(time => {
        expect(time).toBeLessThan(30000);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid video file', async () => {
      const invalidFile = new File(['not a video'], 'invalid.mp4', {
        type: 'video/mp4'
      });

      await expect(
        VideoIntel.detectFaces(invalidFile)
      ).rejects.toThrow();

      console.log('✅ Invalid file handled correctly');
    });

    it('should handle empty video file', async () => {
      const emptyFile = new File([], 'empty.mp4', {
        type: 'video/mp4'
      });

      await expect(
        VideoIntel.detectFaces(emptyFile)
      ).rejects.toThrow();

      console.log('✅ Empty file handled correctly');
    });

    it('should cleanup resources after error', async () => {
      const invalidFile = new File(['bad'], 'bad.mp4', { type: 'video/mp4' });

      try {
        await VideoIntel.detectFaces(invalidFile);
      } catch (error) {
        // Error expected
      }

      // Should be able to process valid file after error
      const validFile = await loadTestVideo(TEST_VIDEOS.fixtures.short);
      const result = await VideoIntel.detectFaces(validFile);

      expect(result).toBeDefined();
      console.log('✅ Resources cleaned up after error');
    });
  });

  describe('Edge Cases', () => {
    it('should handle video with no faces', async () => {
      // Most videos should have some content, but detection might not find faces
      const videoFile = await loadTestVideo(TEST_VIDEOS.fixtures.short);

      const result = await VideoIntel.detectFaces(videoFile, {
        confidence: 0.99 // Very strict to simulate no faces
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('detected');
      expect(result).toHaveProperty('averageCount');

      // If no faces, averageCount should be 0
      if (!result.detected) {
        expect(result.averageCount).toBe(0);
      }

      console.log('📊 High confidence result:', {
        detected: result.detected,
        averageCount: result.averageCount
      });
    });

    it('should handle different video lengths', async () => {
      const videoFile = await loadTestVideo(TEST_VIDEOS.fixtures.medium);

      const result = await VideoIntel.detectFaces(videoFile, {
        samplingRate: 3.0
      });

      expect(result).toBeDefined();
      console.log('📹 Medium video result:', {
        detected: result.detected,
        averageCount: result.averageCount.toFixed(2)
      });
    });
  });

  describe('Using Remote Video URLs', () => {
    it('should detect faces from remote video URL', async () => {
      const url = getTestVideoURL('short');
      console.log('🌐 Testing with URL:', url);

      try {
        const result = await VideoIntel.detectFaces(url, {
          samplingRate: 3.0 // Faster for remote videos
        });

        assertDefined(result);
        expect(result).toHaveProperty('detected');
        expect(result).toHaveProperty('averageCount');

        console.log('✅ Remote video processed:', {
          detected: result.detected,
          averageCount: result.averageCount.toFixed(2)
        });
      } catch (error) {
        // Network issues can cause this to fail
        console.warn('⚠️  Remote video test failed (network issue?):', error);
      }
    });
  });
});

describe('Face Detection API Exports', () => {
  // Quick smoke tests that run even without browser environment

  it('should export detectFaces method', () => {
    expect(VideoIntel).toBeDefined();
    expect(typeof VideoIntel.detectFaces).toBe('function');
  });

  it('should have correct detectFaces signature', () => {
    expect(VideoIntel.detectFaces.length).toBeGreaterThanOrEqual(1);
  });
});


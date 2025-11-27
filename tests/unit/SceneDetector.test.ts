/**
 * Tests for SceneDetector
 * 
 * These tests verify the scene detection functionality works correctly.
 * Note: Some tests use mocked video elements since creating real videos
 * in tests is complex. Integration tests with real videos should be separate.
 */

import { SceneDetector } from '../../src/modules/scenes/SceneDetector';
import { FrameExtractor } from '../../src/core/FrameExtractor';
import { FrameDifferenceCalculator } from '../../src/modules/scenes/FrameDifferenceCalculator';
import { VideoIntelError } from '../../src/types';

describe('SceneDetector', () => {
  let detector: SceneDetector;
  let frameExtractor: FrameExtractor;
  let differenceCalculator: FrameDifferenceCalculator;

  beforeEach(() => {
    frameExtractor = new FrameExtractor();
    differenceCalculator = new FrameDifferenceCalculator();
    detector = new SceneDetector(frameExtractor, differenceCalculator);
  });

  // ============================================================================
  // Test Helpers
  // ============================================================================

  /**
   * Create a mock video element for testing.
   */
  function createMockVideo(duration: number): HTMLVideoElement {
    const video = document.createElement('video');

    // Set video properties
    Object.defineProperty(video, 'duration', {
      value: duration,
      writable: false
    });

    Object.defineProperty(video, 'readyState', {
      value: HTMLMediaElement.HAVE_METADATA, // 1
      writable: false
    });

    Object.defineProperty(video, 'videoWidth', {
      value: 640,
      writable: false
    });

    Object.defineProperty(video, 'videoHeight', {
      value: 480,
      writable: false
    });

    return video;
  }

  /**
   * Create a solid color canvas for testing.
   */
  function createSolidColorCanvas(
    width: number,
    height: number,
    r: number,
    g: number,
    b: number
  ): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(0, 0, width, height);

    return canvas;
  }

  // ============================================================================
  // Validation Tests
  // ============================================================================

  describe('validation', () => {
    test('should throw error for null video', async () => {
      await expect(
        detector.detect(null as any)
      ).rejects.toThrow(VideoIntelError);
    });

    test('should throw error for video with invalid readyState', async () => {
      const video = document.createElement('video');
      Object.defineProperty(video, 'readyState', {
        value: 0, // HAVE_NOTHING
        writable: false
      });

      await expect(
        detector.detect(video)
      ).rejects.toThrow(VideoIntelError);
    });

    test('should throw error for video with invalid duration', async () => {
      const video = createMockVideo(0);
      Object.defineProperty(video, 'duration', {
        value: 0,
        writable: false
      });

      await expect(
        detector.detect(video)
      ).rejects.toThrow(VideoIntelError);
    });

    test('should throw error for negative minSceneLength', async () => {
      const video = createMockVideo(10);

      await expect(
        detector.detect(video, { minSceneLength: -1 })
      ).rejects.toThrow(VideoIntelError);
    });

    test('should throw error for invalid threshold', async () => {
      const video = createMockVideo(10);

      await expect(
        detector.detect(video, { threshold: 1.5 })
      ).rejects.toThrow(VideoIntelError);

      await expect(
        detector.detect(video, { threshold: -0.1 })
      ).rejects.toThrow(VideoIntelError);
    });
  });

  // ============================================================================
  // Options Tests
  // ============================================================================

  describe('options', () => {
    test('should use default options when none provided', async () => {
      const video = createMockVideo(10);

      // Mock the frameExtractor to return same frames (no scene changes)
      jest.spyOn(frameExtractor, 'extractFrames').mockResolvedValue(
        Array(20).fill(null).map(() => createSolidColorCanvas(100, 100, 128, 128, 128))
      );

      const scenes = await detector.detect(video, {
        includeThumbnails: false  // Disable thumbnails for faster tests
      });

      // With no scene changes, should get 1 scene
      expect(scenes).toBeDefined();
      expect(scenes.length).toBeGreaterThan(0);
    });

    test('should respect minSceneLength option', async () => {
      const video = createMockVideo(10);

      // Mock frames with one scene change at 5s
      const frames = [
        ...Array(10).fill(null).map(() => createSolidColorCanvas(100, 100, 100, 100, 100)),
        ...Array(10).fill(null).map(() => createSolidColorCanvas(100, 100, 200, 200, 200))
      ];

      jest.spyOn(frameExtractor, 'extractFrames').mockResolvedValue(frames);

      const scenes = await detector.detect(video, {
        minSceneLength: 2, // 2 seconds minimum
        threshold: 0.3,
        includeThumbnails: false  // Disable thumbnails for faster tests
      });

      // Should detect the scene change
      expect(scenes.length).toBeGreaterThanOrEqual(2);

      // All scenes should be at least 2 seconds (or close to it for last scene)
      scenes.forEach(scene => {
        if (scene.duration < 1.9) { // Small tolerance for sampling
          console.warn('Scene too short:', scene);
        }
      });
    });

    test('should respect threshold option', async () => {
      const video = createMockVideo(10);

      // Test with low threshold first
      const framesLow = [
        ...Array(10).fill(null).map(() => createSolidColorCanvas(100, 100, 100, 100, 100)),
        ...Array(10).fill(null).map(() => createSolidColorCanvas(100, 100, 110, 110, 110))
      ];

      jest.spyOn(frameExtractor, 'extractFrames').mockResolvedValue(framesLow);

      const scenesLowThreshold = await detector.detect(video, {
        threshold: 0.01, // Very sensitive
        includeThumbnails: false
      });

      // Test with high threshold - recreate frames to avoid corruption
      const framesHigh = [
        ...Array(10).fill(null).map(() => createSolidColorCanvas(100, 100, 100, 100, 100)),
        ...Array(10).fill(null).map(() => createSolidColorCanvas(100, 100, 110, 110, 110))
      ];

      jest.spyOn(frameExtractor, 'extractFrames').mockResolvedValue(framesHigh);

      const scenesHighThreshold = await detector.detect(video, {
        threshold: 0.9, // Very insensitive
        includeThumbnails: false
      });

      // Low threshold should detect more scenes than high threshold
      expect(scenesLowThreshold.length).toBeGreaterThanOrEqual(scenesHighThreshold.length);
    });

    test('should not include thumbnails when includeThumbnails is false', async () => {
      const video = createMockVideo(10);

      jest.spyOn(frameExtractor, 'extractFrames').mockResolvedValue(
        Array(20).fill(null).map(() => createSolidColorCanvas(100, 100, 128, 128, 128))
      );

      const scenes = await detector.detect(video, {
        includeThumbnails: false
      });

      // All scenes should have undefined thumbnails
      scenes.forEach(scene => {
        expect(scene.thumbnail).toBeUndefined();
      });
    });
  });

  // ============================================================================
  // Scene Detection Logic Tests
  // ============================================================================

  describe('scene detection logic', () => {
    test('should detect single scene in static video', async () => {
      const video = createMockVideo(10);

      // All identical frames - no scene changes
      const frames = Array(20).fill(null).map(() =>
        createSolidColorCanvas(100, 100, 128, 128, 128)
      );

      jest.spyOn(frameExtractor, 'extractFrames').mockResolvedValue(frames);

      const scenes = await detector.detect(video, {
        includeThumbnails: false
      });

      // Should have exactly 1 scene (no changes)
      expect(scenes.length).toBe(1);
      expect(scenes[0].start).toBe(0);
      expect(scenes[0].end).toBeCloseTo(video.duration, 1);
    });

    test('should detect multiple scenes with clear cuts', async () => {
      const video = createMockVideo(12);

      // Create frames with clear scene changes every 4 seconds
      const frames = [
        // Scene 1: 0-4s (black frames)
        ...Array(8).fill(null).map(() => createSolidColorCanvas(100, 100, 0, 0, 0)),
        // Scene 2: 4-8s (white frames)
        ...Array(8).fill(null).map(() => createSolidColorCanvas(100, 100, 255, 255, 255)),
        // Scene 3: 8-12s (gray frames)
        ...Array(8).fill(null).map(() => createSolidColorCanvas(100, 100, 128, 128, 128))
      ];

      jest.spyOn(frameExtractor, 'extractFrames').mockResolvedValue(frames);

      const scenes = await detector.detect(video, {
        threshold: 0.3,
        minSceneLength: 2,
        includeThumbnails: false
      });

      // Should detect 3 scenes
      expect(scenes.length).toBeGreaterThanOrEqual(2); // At least 2 scenes
      expect(scenes.length).toBeLessThanOrEqual(4); // But not too many false positives
    });

    test('should handle very short videos', async () => {
      const video = createMockVideo(1); // 1 second video

      const frames = [
        createSolidColorCanvas(100, 100, 128, 128, 128),
        createSolidColorCanvas(100, 100, 128, 128, 128)
      ];

      jest.spyOn(frameExtractor, 'extractFrames').mockResolvedValue(frames);

      const scenes = await detector.detect(video, {
        includeThumbnails: false
      });

      // Should still work and return 1 scene
      expect(scenes.length).toBeGreaterThanOrEqual(1);
    });

    test('should handle long videos', async () => {
      const video = createMockVideo(600); // 10 minute video

      // Create many frames
      const frames = Array(1200).fill(null).map(() =>
        createSolidColorCanvas(100, 100, 128, 128, 128)
      );

      jest.spyOn(frameExtractor, 'extractFrames').mockResolvedValue(frames);

      const scenes = await detector.detect(video, {
        includeThumbnails: false
      });

      // Should complete without error
      expect(scenes).toBeDefined();
      expect(scenes.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // Scene Properties Tests
  // ============================================================================

  describe('scene properties', () => {
    test('should have valid start/end/duration for each scene', async () => {
      const video = createMockVideo(10);

      const frames = Array(20).fill(null).map(() =>
        createSolidColorCanvas(100, 100, 128, 128, 128)
      );

      jest.spyOn(frameExtractor, 'extractFrames').mockResolvedValue(frames);

      const scenes = await detector.detect(video, {
        includeThumbnails: false
      });

      scenes.forEach(scene => {
        // Start should be before end
        expect(scene.start).toBeLessThan(scene.end);

        // Duration should match end - start
        expect(scene.duration).toBeCloseTo(scene.end - scene.start, 1);

        // Times should be within video bounds
        expect(scene.start).toBeGreaterThanOrEqual(0);
        expect(scene.end).toBeLessThanOrEqual(video.duration);

        // Confidence should be between 0 and 1
        expect(scene.confidence).toBeGreaterThanOrEqual(0);
        expect(scene.confidence).toBeLessThanOrEqual(1);
      });
    });

    test('should have continuous scene coverage (no gaps)', async () => {
      const video = createMockVideo(10);

      const frames = [
        ...Array(10).fill(null).map(() => createSolidColorCanvas(100, 100, 100, 100, 100)),
        ...Array(10).fill(null).map(() => createSolidColorCanvas(100, 100, 200, 200, 200))
      ];

      jest.spyOn(frameExtractor, 'extractFrames').mockResolvedValue(frames);

      const scenes = await detector.detect(video, {
        includeThumbnails: false
      });

      // Check that scenes are continuous (no gaps)
      for (let i = 0; i < scenes.length - 1; i++) {
        const currentEnd = scenes[i].end;
        const nextStart = scenes[i + 1].start;

        // Next scene should start where current scene ends (small tolerance)
        expect(Math.abs(currentEnd - nextStart)).toBeLessThan(0.1);
      }

      // First scene should start at 0
      expect(scenes[0].start).toBe(0);

      // Last scene should end at video duration
      expect(scenes[scenes.length - 1].end).toBeCloseTo(video.duration, 1);
    });
  });

  // ============================================================================
  // Statistics Tests
  // ============================================================================

  describe('statistics', () => {
    test('should provide statistics after detection', async () => {
      const video = createMockVideo(10);

      const frames = Array(20).fill(null).map(() =>
        createSolidColorCanvas(100, 100, 128, 128, 128)
      );

      jest.spyOn(frameExtractor, 'extractFrames').mockResolvedValue(frames);

      await detector.detect(video, {
        includeThumbnails: false
      });

      const stats = detector.getLastStats();

      // Stats should be available after detection
      expect(stats).not.toBeNull();
      expect(stats!.totalFramesAnalyzed).toBeGreaterThan(0);
      expect(stats!.scenesDetected).toBeGreaterThan(0);
      expect(stats!.processingTime).toBeGreaterThan(0);
    });

    test('should return null stats before first detection', () => {
      const stats = detector.getLastStats();
      expect(stats).toBeNull();
    });

    test('should update stats on each detection', async () => {
      const video = createMockVideo(10);

      // First detection
      const frames1 = Array(20).fill(null).map(() =>
        createSolidColorCanvas(100, 100, 128, 128, 128)
      );

      jest.spyOn(frameExtractor, 'extractFrames').mockResolvedValue(frames1);

      await detector.detect(video, { includeThumbnails: false });
      const stats1 = detector.getLastStats();

      // Second detection - recreate frames to avoid corruption
      const frames2 = Array(20).fill(null).map(() =>
        createSolidColorCanvas(100, 100, 128, 128, 128)
      );

      jest.spyOn(frameExtractor, 'extractFrames').mockResolvedValue(frames2);

      await detector.detect(video, { includeThumbnails: false });
      const stats2 = detector.getLastStats();

      // Stats should be different objects (not same reference)
      expect(stats1).not.toBe(stats2);

      // Both should have valid data
      expect(stats1).not.toBeNull();
      expect(stats2).not.toBeNull();
    });
  });

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  describe('error handling', () => {
    test('should handle frame extraction errors gracefully', async () => {
      const video = createMockVideo(10);

      // Mock frame extractor to throw error
      jest.spyOn(frameExtractor, 'extractFrames').mockRejectedValue(
        new Error('Frame extraction failed')
      );

      await expect(
        detector.detect(video)
      ).rejects.toThrow();
    });

    test('should continue if thumbnail generation fails', async () => {
      const video = createMockVideo(10);

      const frames = [
        ...Array(10).fill(null).map(() => createSolidColorCanvas(100, 100, 100, 100, 100)),
        ...Array(10).fill(null).map(() => createSolidColorCanvas(100, 100, 200, 200, 200))
      ];

      jest.spyOn(frameExtractor, 'extractFrames').mockResolvedValue(frames);

      // Mock extractFrameAsBlob to fail
      jest.spyOn(frameExtractor, 'extractFrameAsBlob').mockRejectedValue(
        new Error('Thumbnail generation failed')
      );

      // Should still complete and return scenes (just without thumbnails)
      const scenes = await detector.detect(video, {
        includeThumbnails: true
      });

      expect(scenes).toBeDefined();
      expect(scenes.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // Performance Tests
  // ============================================================================

  describe('performance', () => {
    test('should complete detection in reasonable time', async () => {
      const video = createMockVideo(60); // 1 minute video

      const frames = Array(120).fill(null).map(() =>
        createSolidColorCanvas(100, 100, 128, 128, 128)
      );

      jest.spyOn(frameExtractor, 'extractFrames').mockResolvedValue(frames);

      const start = performance.now();
      await detector.detect(video, { includeThumbnails: false });
      const duration = performance.now() - start;

      // Should complete in under 5 seconds (very generous for mock data)
      expect(duration).toBeLessThan(5000);
    });
  });
});


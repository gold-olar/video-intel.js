/**
 * ThumbnailGenerator Unit Tests
 * 
 * Tests all aspects of thumbnail generation including:
 * - Option validation and normalization
 * - Extraction strategy calculation
 * - Frame scoring and filtering
 * - Diversity filter application
 * - Final thumbnail generation
 * - Error handling
 */

import { ThumbnailGenerator } from '../../src/modules/thumbnails/ThumbnailGenerator';
import { FrameExtractor } from '../../src/core/FrameExtractor';
import { FrameScorer } from '../../src/modules/thumbnails/FrameScorer';
import { MemoryManager } from '../../src/utils/MemoryManager';
import { VideoIntelError, ErrorCode } from '../../src/types';

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Create a mock video element for testing
 */
function createMockVideo(options: {
  duration?: number;
  width?: number;
  height?: number;
  readyState?: number;
} = {}): HTMLVideoElement {
  const video = document.createElement('video');
  
  // Set properties
  Object.defineProperty(video, 'duration', {
    get: () => options.duration ?? 60,
    configurable: true
  });
  
  Object.defineProperty(video, 'videoWidth', {
    get: () => options.width ?? 1920,
    configurable: true
  });
  
  Object.defineProperty(video, 'videoHeight', {
    get: () => options.height ?? 1080,
    configurable: true
  });
  
  Object.defineProperty(video, 'readyState', {
    get: () => options.readyState ?? 4, // HAVE_ENOUGH_DATA
    configurable: true
  });
  
  return video;
}

/**
 * Create a mock canvas for testing with realistic content
 */
function createMockCanvas(width: number = 1920, height: number = 1080): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  // Create a more complex pattern that will pass quality scoring
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Fill with a gradient background (simulates real footage)
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#4A90E2');
    gradient.addColorStop(0.5, '#7ED321');
    gradient.addColorStop(1, '#F5A623');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add some "noise" for sharpness - creates edge variations
    for (let i = 0; i < 500; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 20 + 5;
      const brightness = Math.floor(Math.random() * 255);
      ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
      ctx.fillRect(x, y, size, size);
    }
    
    // Add some geometric shapes (simulates content/subjects)
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(width * 0.3, height * 0.4, 100, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#FF5733';
    ctx.fillRect(width * 0.6, height * 0.5, 200, 150);
    
    // Add some lines (simulates edges for sharpness detection)
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, height * 0.2);
    ctx.lineTo(width, height * 0.2);
    ctx.moveTo(0, height * 0.8);
    ctx.lineTo(width, height * 0.8);
    ctx.stroke();
  }
  
  return canvas;
}

// ============================================================================
// Test Suites
// ============================================================================

describe('ThumbnailGenerator', () => {
  let generator: ThumbnailGenerator;
  let frameExtractor: FrameExtractor;
  let frameScorer: FrameScorer;
  let memoryManager: MemoryManager;
  
  beforeEach(() => {
    frameExtractor = new FrameExtractor();
    // Use a non-strict FrameScorer with very lenient thresholds for testing
    frameScorer = new FrameScorer({
      strictMode: false,
      blackFrameThreshold: 0.01,  // Very lenient (1%)
      whiteFrameThreshold: 0.99,  // Very lenient (99%)
      blurThreshold: 0.1          // Very lenient (10%)
    });
    memoryManager = MemoryManager.getInstance();
    generator = new ThumbnailGenerator(frameExtractor, frameScorer, memoryManager);
  });
  
  afterEach(() => {
    // Clean up memory after each test
    memoryManager.cleanupAll();
  });

  // ==========================================================================
  // Constructor Tests
  // ==========================================================================

  describe('constructor', () => {
    it('should create instance with default dependencies', () => {
      const gen = new ThumbnailGenerator();
      expect(gen).toBeInstanceOf(ThumbnailGenerator);
    });

    it('should accept custom dependencies', () => {
      const customExtractor = new FrameExtractor();
      const customScorer = new FrameScorer({ strictMode: true });
      const gen = new ThumbnailGenerator(customExtractor, customScorer);
      expect(gen).toBeInstanceOf(ThumbnailGenerator);
    });
  });

  // ==========================================================================
  // Video Validation Tests
  // ==========================================================================

  describe('video validation', () => {
    it('should reject video with metadata not loaded', async () => {
      const video = createMockVideo({ readyState: 0 });
      
      await expect(generator.generate(video)).rejects.toThrow(VideoIntelError);
      await expect(generator.generate(video)).rejects.toThrow('metadata not loaded');
    });

    it('should reject video with invalid dimensions', async () => {
      const video = createMockVideo({ width: 0, height: 0 });
      
      await expect(generator.generate(video)).rejects.toThrow(VideoIntelError);
      await expect(generator.generate(video)).rejects.toThrow('invalid dimensions');
    });

    it('should reject video with invalid duration', async () => {
      const video = createMockVideo({ duration: 0 });
      
      await expect(generator.generate(video)).rejects.toThrow(VideoIntelError);
      await expect(generator.generate(video)).rejects.toThrow('invalid duration');
    });

    it('should accept valid video', async () => {
      const video = createMockVideo();
      
      // Mock the frame extraction to avoid actual video processing
      jest.spyOn(frameExtractor, 'extractFrames').mockResolvedValue([
        createMockCanvas()
      ]);
      
      // Mock frame scoring
      jest.spyOn(frameScorer, 'analyze').mockResolvedValue({
        score: 0.8,
        statistics: {
          brightness: 0.5,
          contrast: 0.6,
          sharpness: 0.7,
          colorVariance: 0.5,
          isBlackFrame: false,
          isWhiteFrame: false,
          isBlurry: false
        },
        components: {
          sharpness: 0.7,
          brightness: 1.0,
          colorVariance: 0.5
        },
        isUsable: true,
        issues: [],
        timestamp: 0,
        metadata: {}
      });
      
      // Should not throw
      await expect(generator.generate(video, { count: 1 })).resolves.toBeDefined();
    });
  });

  // ==========================================================================
  // Options Validation Tests
  // ==========================================================================

  describe('options validation', () => {
    let video: HTMLVideoElement;
    
    beforeEach(() => {
      video = createMockVideo();
      // Mock frame extraction
      jest.spyOn(frameExtractor, 'extractFrames').mockResolvedValue([
        createMockCanvas()
      ]);
      
      // Mock frame scoring to return usable frames
      jest.spyOn(frameScorer, 'analyze').mockResolvedValue({
        score: 0.8,
        statistics: {
          brightness: 0.5,
          contrast: 0.6,
          sharpness: 0.7,
          colorVariance: 0.5,
          isBlackFrame: false,
          isWhiteFrame: false,
          isBlurry: false
        },
        components: {
          sharpness: 0.7,
          brightness: 1.0,
          colorVariance: 0.5
        },
        isUsable: true,
        issues: [],
        timestamp: 0,
        metadata: {}
      });
    });

    it('should use default options when none provided', async () => {
      const result = await generator.generate(video);
      
      // Default count is 5, but we'll only get 1 since that's what we mocked
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should reject invalid count (too low)', async () => {
      await expect(
        generator.generate(video, { count: 0 })
      ).rejects.toThrow('count must be between 1 and 10');
    });

    it('should reject invalid count (too high)', async () => {
      await expect(
        generator.generate(video, { count: 11 })
      ).rejects.toThrow('count must be between 1 and 10');
    });

    it('should reject non-integer count', async () => {
      await expect(
        generator.generate(video, { count: 3.5 })
      ).rejects.toThrow('count must be an integer');
    });

    it('should reject invalid quality (negative)', async () => {
      await expect(
        generator.generate(video, { quality: -0.1 })
      ).rejects.toThrow('Quality must be between 0 and 1');
    });

    it('should reject invalid quality (too high)', async () => {
      await expect(
        generator.generate(video, { quality: 1.1 })
      ).rejects.toThrow('Quality must be between 0 and 1');
    });

    it('should reject invalid format', async () => {
      await expect(
        generator.generate(video, { format: 'gif' as any })
      ).rejects.toThrow("Format must be 'jpeg' or 'png'");
    });

    it('should reject invalid width', async () => {
      await expect(
        generator.generate(video, { size: { width: 0 } })
      ).rejects.toThrow('Width must be greater than 0');
    });

    it('should reject invalid height', async () => {
      await expect(
        generator.generate(video, { size: { height: -100 } })
      ).rejects.toThrow('Height must be greater than 0');
    });

    it('should accept valid options', async () => {
      await expect(
        generator.generate(video, {
          count: 3,
          quality: 0.9,
          format: 'png',
          size: { width: 640, height: 480 }
        })
      ).resolves.toBeDefined();
    });
  });

  // ==========================================================================
  // Extraction Strategy Tests
  // ==========================================================================

  describe('extraction strategy', () => {
    it('should calculate timestamps for normal video', () => {
      // Access private method through any for testing
      const genAny = generator as any;
      const { timestamps } = genAny.calculateExtractionStrategy(60, 5);
      
      // Should extract more than requested (multiplier)
      expect(timestamps.length).toBeGreaterThan(5);
      
      // Timestamps should be sorted
      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i]).toBeGreaterThan(timestamps[i - 1]);
      }
      
      // Should skip margins (5% at start and end)
      expect(timestamps[0]).toBeGreaterThan(0);
      expect(timestamps[timestamps.length - 1]).toBeLessThan(60);
    });

    it('should handle very short videos', () => {
      const genAny = generator as any;
      const { timestamps } = genAny.calculateExtractionStrategy(10, 5);
      
      // Should still generate timestamps
      expect(timestamps.length).toBeGreaterThan(0);
      
      // All timestamps should be within video duration
      timestamps.forEach((t: number) => {
        expect(t).toBeGreaterThanOrEqual(0);
        expect(t).toBeLessThanOrEqual(10);
      });
    });

    it('should handle single thumbnail request', () => {
      const genAny = generator as any;
      const { timestamps } = genAny.calculateExtractionStrategy(60, 1);
      
      // Should still extract multiple candidates
      expect(timestamps.length).toBeGreaterThan(1);
    });

    it('should ensure minimum spacing between candidates', () => {
      const genAny = generator as any;
      const { timestamps, samplingInterval } = genAny.calculateExtractionStrategy(60, 5);
      
      // Interval should be at least 2 seconds (MIN_CANDIDATE_SPACING)
      expect(samplingInterval).toBeGreaterThanOrEqual(2);
      
      // Verify spacing
      for (let i = 1; i < timestamps.length; i++) {
        const spacing = timestamps[i] - timestamps[i - 1];
        expect(spacing).toBeGreaterThanOrEqual(1.9); // Allow small floating point error
      }
    });
  });

  // ==========================================================================
  // Frame Scoring Tests
  // ==========================================================================

  describe('frame scoring and filtering', () => {
    it('should score and filter frames', async () => {
      const frames = [
        { canvas: createMockCanvas(), timestamp: 10, width: 1920, height: 1080 },
        { canvas: createMockCanvas(), timestamp: 20, width: 1920, height: 1080 },
        { canvas: createMockCanvas(), timestamp: 30, width: 1920, height: 1080 }
      ];
      
      // Mock frame scoring to return usable scores
      let callCount = 0;
      jest.spyOn(frameScorer, 'analyze').mockImplementation(async (_canvas, timestamp) => ({
        score: 0.9 - (callCount++ * 0.1), // Descending scores
        statistics: {
          brightness: 0.5,
          contrast: 0.6,
          sharpness: 0.7,
          colorVariance: 0.5,
          isBlackFrame: false,
          isWhiteFrame: false,
          isBlurry: false
        },
        components: {
          sharpness: 0.7,
          brightness: 1.0,
          colorVariance: 0.5
        },
        isUsable: true,
        issues: [],
        timestamp,
        metadata: {}
      }));
      
      const genAny = generator as any;
      const scored = await genAny.scoreAndFilterFrames(frames);
      
      // Should return scored frames
      expect(scored.length).toBeGreaterThan(0);
      
      // Each should have score and canvas
      scored.forEach((frame: any) => {
        expect(frame).toHaveProperty('score');
        expect(frame).toHaveProperty('canvas');
        expect(frame.score.score).toBeGreaterThanOrEqual(0);
        expect(frame.score.score).toBeLessThanOrEqual(1);
      });
      
      // Should be sorted by score (descending)
      for (let i = 1; i < scored.length; i++) {
        expect(scored[i].score.score).toBeLessThanOrEqual(scored[i - 1].score.score);
      }
    });

    it('should filter out black frames', async () => {
      // Create a black canvas
      const blackCanvas = document.createElement('canvas');
      blackCanvas.width = 1920;
      blackCanvas.height = 1080;
      // Don't fill it - it will be black
      
      const frames = [
        { canvas: createMockCanvas(), timestamp: 10, width: 1920, height: 1080 },
        { canvas: blackCanvas, timestamp: 20, width: 1920, height: 1080 },
        { canvas: createMockCanvas(), timestamp: 30, width: 1920, height: 1080 }
      ];
      
      // Mock scoring - mark black frame as unusable
      jest.spyOn(frameScorer, 'analyze').mockImplementation(async (canvas, timestamp) => {
        const isBlack = canvas === blackCanvas;
        return {
          score: isBlack ? 0.1 : 0.8,
          statistics: {
            brightness: isBlack ? 0.05 : 0.5,
            contrast: 0.6,
            sharpness: 0.7,
            colorVariance: 0.5,
            isBlackFrame: isBlack,
            isWhiteFrame: false,
            isBlurry: false
          },
          components: {
            sharpness: 0.7,
            brightness: 1.0,
            colorVariance: 0.5
          },
          isUsable: !isBlack,
          issues: isBlack ? ['Frame is predominantly black'] : [],
          timestamp,
          metadata: {}
        };
      });
      
      const genAny = generator as any;
      const scored = await genAny.scoreAndFilterFrames(frames);
      
      // Black frame should be filtered out
      expect(scored.length).toBeLessThan(frames.length);
      expect(scored.length).toBe(2); // Should have 2 usable frames
    });

    it('should throw error if no usable frames', async () => {
      // Create all black canvases
      const blackCanvas1 = document.createElement('canvas');
      blackCanvas1.width = 1920;
      blackCanvas1.height = 1080;
      
      const blackCanvas2 = document.createElement('canvas');
      blackCanvas2.width = 1920;
      blackCanvas2.height = 1080;
      
      const frames = [
        { canvas: blackCanvas1, timestamp: 10, width: 1920, height: 1080 },
        { canvas: blackCanvas2, timestamp: 20, width: 1920, height: 1080 }
      ];
      
      const genAny = generator as any;
      
      await expect(genAny.scoreAndFilterFrames(frames)).rejects.toThrow(
        'Could not find any usable frames'
      );
    });
  });

  // ==========================================================================
  // Diversity Filter Tests
  // ==========================================================================

  describe('diversity filter', () => {
    it('should spread thumbnails across video', () => {
      // Create mock scored frames
      const scoredFrames = [
        { score: { score: 0.9, timestamp: 10, isUsable: true }, canvas: createMockCanvas() },
        { score: { score: 0.88, timestamp: 12, isUsable: true }, canvas: createMockCanvas() },
        { score: { score: 0.85, timestamp: 30, isUsable: true }, canvas: createMockCanvas() },
        { score: { score: 0.82, timestamp: 50, isUsable: true }, canvas: createMockCanvas() },
        { score: { score: 0.80, timestamp: 52, isUsable: true }, canvas: createMockCanvas() }
      ] as any;
      
      const genAny = generator as any;
      const selected = genAny.applyDiversityFilter(scoredFrames, 3, 60);
      
      // Should select 3 frames
      expect(selected.length).toBe(3);
      
      // Should prioritize best score
      expect(selected[0].score.timestamp).toBe(10);
      
      // Should not select adjacent frames (12 is too close to 10)
      const timestamps = selected.map((f: any) => f.score.timestamp);
      expect(timestamps).not.toContain(12);
      expect(timestamps).not.toContain(52);
    });

    it('should return all frames if fewer than requested', () => {
      const scoredFrames = [
        { score: { score: 0.9, timestamp: 10, isUsable: true }, canvas: createMockCanvas() },
        { score: { score: 0.85, timestamp: 30, isUsable: true }, canvas: createMockCanvas() }
      ] as any;
      
      const genAny = generator as any;
      const selected = genAny.applyDiversityFilter(scoredFrames, 5, 60);
      
      // Should return all 2 frames even though 5 were requested
      expect(selected.length).toBe(2);
    });

    it('should sort output by timestamp', () => {
      const scoredFrames = [
        { score: { score: 0.9, timestamp: 50, isUsable: true }, canvas: createMockCanvas() },
        { score: { score: 0.85, timestamp: 10, isUsable: true }, canvas: createMockCanvas() },
        { score: { score: 0.82, timestamp: 30, isUsable: true }, canvas: createMockCanvas() }
      ] as any;
      
      const genAny = generator as any;
      const selected = genAny.applyDiversityFilter(scoredFrames, 3, 60);
      
      // Should be sorted by timestamp (chronological order)
      expect(selected[0].score.timestamp).toBe(10);
      expect(selected[1].score.timestamp).toBe(30);
      expect(selected[2].score.timestamp).toBe(50);
    });
  });

  // ==========================================================================
  // Canvas Resizing Tests
  // ==========================================================================

  describe('canvas resizing', () => {
    it('should resize canvas maintaining aspect ratio (width only)', () => {
      const sourceCanvas = createMockCanvas(1920, 1080);
      const genAny = generator as any;
      
      const resized = genAny.resizeCanvas(sourceCanvas, 640, undefined);
      
      expect(resized.width).toBe(640);
      expect(resized.height).toBe(360); // Maintains 16:9 ratio
    });

    it('should resize canvas maintaining aspect ratio (height only)', () => {
      const sourceCanvas = createMockCanvas(1920, 1080);
      const genAny = generator as any;
      
      const resized = genAny.resizeCanvas(sourceCanvas, undefined, 480);
      
      expect(resized.height).toBe(480);
      expect(resized.width).toBe(853); // Maintains 16:9 ratio
    });

    it('should resize canvas to specific dimensions (both)', () => {
      const sourceCanvas = createMockCanvas(1920, 1080);
      const genAny = generator as any;
      
      const resized = genAny.resizeCanvas(sourceCanvas, 800, 600);
      
      expect(resized.width).toBe(800);
      expect(resized.height).toBe(600);
    });

    it('should return original canvas if no dimensions specified', () => {
      const sourceCanvas = createMockCanvas(1920, 1080);
      const genAny = generator as any;
      
      const result = genAny.resizeCanvas(sourceCanvas, undefined, undefined);
      
      expect(result).toBe(sourceCanvas);
    });
  });

  // ==========================================================================
  // Integration Tests
  // ==========================================================================

  describe('full generation workflow', () => {
    it('should generate thumbnails successfully', async () => {
      const video = createMockVideo({ duration: 60 });
      
      // Mock frame extraction
      const mockCanvases = [
        createMockCanvas(),
        createMockCanvas(),
        createMockCanvas()
      ];
      jest.spyOn(frameExtractor, 'extractFrames').mockResolvedValue(mockCanvases);
      
      // Mock frame scoring
      let scoreCallCount = 0;
      jest.spyOn(frameScorer, 'analyze').mockImplementation(async (_canvas, timestamp) => ({
        score: 0.9 - (scoreCallCount++ * 0.05),
        statistics: {
          brightness: 0.5,
          contrast: 0.6,
          sharpness: 0.7,
          colorVariance: 0.5,
          isBlackFrame: false,
          isWhiteFrame: false,
          isBlurry: false
        },
        components: {
          sharpness: 0.7,
          brightness: 1.0,
          colorVariance: 0.5
        },
        isUsable: true,
        issues: [],
        timestamp,
        metadata: {}
      }));
      
      // Generate thumbnails
      const thumbnails = await generator.generate(video, { count: 2 });
      
      // Should return thumbnails
      expect(thumbnails.length).toBeGreaterThan(0);
      expect(thumbnails.length).toBeLessThanOrEqual(2);
      
      // Each thumbnail should have required properties
      thumbnails.forEach(thumb => {
        expect(thumb).toHaveProperty('image');
        expect(thumb).toHaveProperty('timestamp');
        expect(thumb).toHaveProperty('score');
        expect(thumb).toHaveProperty('width');
        expect(thumb).toHaveProperty('height');
        
        expect(thumb.image).toBeInstanceOf(Blob);
        expect(thumb.timestamp).toBeGreaterThanOrEqual(0);
        expect(thumb.score).toBeGreaterThanOrEqual(0);
        expect(thumb.score).toBeLessThanOrEqual(1);
        expect(thumb.width).toBeGreaterThan(0);
        expect(thumb.height).toBeGreaterThan(0);
      });
    });

    it('should call progress callback', async () => {
      const video = createMockVideo({ duration: 60 });
      const progressSpy = jest.fn();
      
      // Mock frame extraction
      jest.spyOn(frameExtractor, 'extractFrames').mockResolvedValue([
        createMockCanvas()
      ]);
      
      // Mock frame scoring
      jest.spyOn(frameScorer, 'analyze').mockResolvedValue({
        score: 0.8,
        statistics: {
          brightness: 0.5,
          contrast: 0.6,
          sharpness: 0.7,
          colorVariance: 0.5,
          isBlackFrame: false,
          isWhiteFrame: false,
          isBlurry: false
        },
        components: {
          sharpness: 0.7,
          brightness: 1.0,
          colorVariance: 0.5
        },
        isUsable: true,
        issues: [],
        timestamp: 0,
        metadata: {}
      });
      
      await generator.generate(video, {
        count: 1,
        onProgress: progressSpy
      });
      
      // Progress callback should be called
      expect(progressSpy).toHaveBeenCalled();
      
      // Should receive 100% at the end
      const calls = progressSpy.mock.calls;
      expect(calls[calls.length - 1][0]).toBe(100);
    });

    it('should respect format option', async () => {
      const video = createMockVideo({ duration: 60 });
      
      // Mock frame extraction
      jest.spyOn(frameExtractor, 'extractFrames').mockResolvedValue([
        createMockCanvas()
      ]);
      
      // Mock frame scoring
      jest.spyOn(frameScorer, 'analyze').mockResolvedValue({
        score: 0.8,
        statistics: {
          brightness: 0.5,
          contrast: 0.6,
          sharpness: 0.7,
          colorVariance: 0.5,
          isBlackFrame: false,
          isWhiteFrame: false,
          isBlurry: false
        },
        components: {
          sharpness: 0.7,
          brightness: 1.0,
          colorVariance: 0.5
        },
        isUsable: true,
        issues: [],
        timestamp: 0,
        metadata: {}
      });
      
      const thumbnails = await generator.generate(video, {
        count: 1,
        format: 'png'
      });
      
      // Check blob type
      expect(thumbnails[0].image.type).toContain('png');
    });

    it('should respect size options', async () => {
      const video = createMockVideo({ duration: 60 });
      
      // Mock frame extraction
      jest.spyOn(frameExtractor, 'extractFrames').mockResolvedValue([
        createMockCanvas()
      ]);
      
      // Mock frame scoring
      jest.spyOn(frameScorer, 'analyze').mockResolvedValue({
        score: 0.8,
        statistics: {
          brightness: 0.5,
          contrast: 0.6,
          sharpness: 0.7,
          colorVariance: 0.5,
          isBlackFrame: false,
          isWhiteFrame: false,
          isBlurry: false
        },
        components: {
          sharpness: 0.7,
          brightness: 1.0,
          colorVariance: 0.5
        },
        isUsable: true,
        issues: [],
        timestamp: 0,
        metadata: {}
      });
      
      const thumbnails = await generator.generate(video, {
        count: 1,
        size: { width: 640 }
      });
      
      // Check thumbnail dimensions
      expect(thumbnails[0].width).toBe(640);
      expect(thumbnails[0].height).toBe(360); // 16:9 aspect ratio
    });
  });

  // ==========================================================================
  // Error Handling Tests
  // ==========================================================================

  describe('error handling', () => {
    it('should handle frame extraction errors', async () => {
      const video = createMockVideo();
      
      // Mock extraction to fail
      jest.spyOn(frameExtractor, 'extractFrames').mockRejectedValue(
        new Error('Extraction failed')
      );
      
      await expect(generator.generate(video)).rejects.toThrow();
    });

    it('should continue if one thumbnail fails but others succeed', async () => {
      const video = createMockVideo();
      
      // Mock frame extraction
      jest.spyOn(frameExtractor, 'extractFrames').mockResolvedValue([
        createMockCanvas(),
        createMockCanvas()
      ]);
      
      // Mock frame scoring
      jest.spyOn(frameScorer, 'analyze').mockResolvedValue({
        score: 0.8,
        statistics: {
          brightness: 0.5,
          contrast: 0.6,
          sharpness: 0.7,
          colorVariance: 0.5,
          isBlackFrame: false,
          isWhiteFrame: false,
          isBlurry: false
        },
        components: {
          sharpness: 0.7,
          brightness: 1.0,
          colorVariance: 0.5
        },
        isUsable: true,
        issues: [],
        timestamp: 0,
        metadata: {}
      });
      
      // Mock blob conversion to fail for one frame
      let callCount = 0;
      jest.spyOn(frameExtractor, 'canvasToBlob').mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Blob conversion failed'));
        }
        return Promise.resolve(new Blob());
      });
      
      // Should still succeed with remaining thumbnails
      const result = await generator.generate(video, { count: 2 });
      
      // Should have at least one thumbnail
      expect(result.length).toBeGreaterThan(0);
    });
  });
});


/**
 * Tests for ColorExtractor
 * 
 * Tests color extraction from videos
 */

import { ColorExtractor } from '../../src/modules/colors/ColorExtractor';
import { FrameExtractor } from '../../src/core/FrameExtractor';
import { KMeansClustering } from '../../src/modules/colors/KMeansClustering';
import { ColorConverter, RGB } from '../../src/modules/colors/ColorConverter';
import { VideoIntelError } from '../../src/types';

// Mock FrameExtractor
jest.mock('../../src/core/FrameExtractor');

/**
 * Helper to create mock video element
 */
function createMockVideo(overrides: Partial<HTMLVideoElement> = {}): HTMLVideoElement {
  return {
    duration: 60,
    videoWidth: 1920,
    videoHeight: 1080,
    readyState: 1,
    src: 'test.mp4',
    ...overrides,
  } as unknown as HTMLVideoElement;
}

/**
 * Helper to create mock canvas with specific color
 */
function createMockCanvas(color: RGB, width: number = 100, height: number = 100): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Fill canvas with the specified color
    ctx.fillStyle = ColorConverter.rgbToHex(color);
    ctx.fillRect(0, 0, width, height);
  }

  return canvas;
}

describe('ColorExtractor', () => {
  let extractor: ColorExtractor;
  let mockFrameExtractor: jest.Mocked<FrameExtractor>;
  let clustering: KMeansClustering;

  beforeEach(() => {
    // Create real instances of dependencies
    clustering = new KMeansClustering();

    // Create mock frame extractor
    mockFrameExtractor = new FrameExtractor() as jest.Mocked<FrameExtractor>;

    // Create extractor with mocked frame extractor
    extractor = new ColorExtractor(mockFrameExtractor, clustering);
  });

  describe('extract - basic functionality', () => {
    it('should extract colors from video', async () => {
      const video = createMockVideo();

      // Mock frame extraction to return red and blue frames
      const redCanvas = createMockCanvas([255, 0, 0]);
      const blueCanvas = createMockCanvas([0, 0, 255]);

      mockFrameExtractor.extractFrames = jest.fn().mockResolvedValue([
        redCanvas,
        blueCanvas,
      ]);

      const colors = await extractor.extract(video, {
        count: 2,
        sampleFrames: 2,
        quality: 'balanced',
      });

      expect(colors).toHaveLength(2);
      expect(mockFrameExtractor.extractFrames).toHaveBeenCalled();
    });

    it('should return colors sorted by dominance', async () => {
      const video = createMockVideo();

      // Mock frames: 3 red, 1 blue (red should be more dominant)
      const redCanvas = createMockCanvas([255, 0, 0]);
      const blueCanvas = createMockCanvas([0, 0, 255]);

      mockFrameExtractor.extractFrames = jest.fn().mockResolvedValue([
        redCanvas,
        redCanvas,
        redCanvas,
        blueCanvas,
      ]);

      const colors = await extractor.extract(video, {
        count: 2,
        sampleFrames: 4,
      });

      // First color should be more dominant (higher percentage)
      expect(colors[0].percentage).toBeGreaterThan(colors[1].percentage);
    });

    it('should return colors in all formats (hex, rgb, hsl)', async () => {
      const video = createMockVideo();
      const redCanvas = createMockCanvas([255, 0, 0]);

      mockFrameExtractor.extractFrames = jest.fn().mockResolvedValue([redCanvas]);

      const colors = await extractor.extract(video, {
        count: 2,
        sampleFrames: 1,
      });

      expect(colors[0]).toHaveProperty('hex');
      expect(colors[0]).toHaveProperty('rgb');
      expect(colors[0]).toHaveProperty('hsl');
      expect(colors[0]).toHaveProperty('percentage');

      // Check types
      expect(typeof colors[0].hex).toBe('string');
      expect(Array.isArray(colors[0].rgb)).toBe(true);
      expect(Array.isArray(colors[0].hsl)).toBe(true);
      expect(typeof colors[0].percentage).toBe('number');
    });

    it('should calculate percentages that sum to ~100', async () => {
      const video = createMockVideo();
      const redCanvas = createMockCanvas([255, 0, 0]);
      const blueCanvas = createMockCanvas([0, 0, 255]);

      mockFrameExtractor.extractFrames = jest.fn().mockResolvedValue([
        redCanvas,
        blueCanvas,
      ]);

      const colors = await extractor.extract(video, {
        count: 2,
        sampleFrames: 2,
      });

      const totalPercentage = colors.reduce((sum, color) => sum + color.percentage, 0);
      
      // Should be close to 100 (allow small rounding errors)
      expect(totalPercentage).toBeGreaterThan(95);
      expect(totalPercentage).toBeLessThanOrEqual(100);
    });
  });

  describe('extract - options handling', () => {
    it('should respect count option', async () => {
      const video = createMockVideo();
      const canvas = createMockCanvas([255, 0, 0]);

      mockFrameExtractor.extractFrames = jest.fn().mockResolvedValue([canvas, canvas, canvas]);

      const colors = await extractor.extract(video, {
        count: 3,
      });

      expect(colors.length).toBeLessThanOrEqual(3);
    });

    it('should respect sampleFrames option', async () => {
      const video = createMockVideo();
      const canvas = createMockCanvas([255, 0, 0]);

      mockFrameExtractor.extractFrames = jest.fn().mockResolvedValue([
        canvas,
        canvas,
        canvas,
        canvas,
        canvas,
      ]);

      await extractor.extract(video, {
        count: 2,
        sampleFrames: 5,
      });

      // Should request extraction of 5 frames
      expect(mockFrameExtractor.extractFrames).toHaveBeenCalledWith(
        video,
        expect.arrayContaining([expect.any(Number)])
      );

      const call = (mockFrameExtractor.extractFrames as jest.Mock).mock.calls[0];
      expect(call[1]).toHaveLength(5);
    });

    it('should use default options when not provided', async () => {
      const video = createMockVideo();
      const canvas = createMockCanvas([255, 0, 0]);

      mockFrameExtractor.extractFrames = jest.fn().mockResolvedValue([canvas]);

      const colors = await extractor.extract(video);

      expect(colors).toBeDefined();
      expect(mockFrameExtractor.extractFrames).toHaveBeenCalled();
    });
  });

  describe('extract - quality settings', () => {
    it('should work with "fast" quality', async () => {
      const video = createMockVideo();
      const canvas = createMockCanvas([255, 0, 0]);

      mockFrameExtractor.extractFrames = jest.fn().mockResolvedValue([canvas]);

      const colors = await extractor.extract(video, {
        quality: 'fast',
      });

      expect(colors).toBeDefined();
    });

    it('should work with "balanced" quality', async () => {
      const video = createMockVideo();
      const canvas = createMockCanvas([255, 0, 0]);

      mockFrameExtractor.extractFrames = jest.fn().mockResolvedValue([canvas]);

      const colors = await extractor.extract(video, {
        quality: 'balanced',
      });

      expect(colors).toBeDefined();
    });

    it('should work with "best" quality', async () => {
      const video = createMockVideo();
      const canvas = createMockCanvas([255, 0, 0]);

      mockFrameExtractor.extractFrames = jest.fn().mockResolvedValue([canvas]);

      const colors = await extractor.extract(video, {
        quality: 'best',
      });

      expect(colors).toBeDefined();
    });
  });

  describe('extract - validation', () => {
    it('should throw error for invalid video (not ready)', async () => {
      const video = createMockVideo({
        readyState: 0, // Not ready
      });

      await expect(
        extractor.extract(video)
      ).rejects.toThrow(VideoIntelError);
    });

    it('should throw error for invalid video dimensions', async () => {
      const video = createMockVideo({
        videoWidth: 0,
        videoHeight: 0,
      });

      await expect(
        extractor.extract(video)
      ).rejects.toThrow(VideoIntelError);
    });

    it('should throw error for invalid count (too low)', async () => {
      const video = createMockVideo();

      await expect(
        extractor.extract(video, { count: 1 })
      ).rejects.toThrow(VideoIntelError);
    });

    it('should throw error for invalid count (too high)', async () => {
      const video = createMockVideo();

      await expect(
        extractor.extract(video, { count: 11 })
      ).rejects.toThrow(VideoIntelError);
    });

    it('should throw error for invalid sampleFrames (too low)', async () => {
      const video = createMockVideo();

      await expect(
        extractor.extract(video, { sampleFrames: 0 })
      ).rejects.toThrow(VideoIntelError);
    });

    it('should throw error for invalid sampleFrames (too high)', async () => {
      const video = createMockVideo();

      await expect(
        extractor.extract(video, { sampleFrames: 101 })
      ).rejects.toThrow(VideoIntelError);
    });
  });

  describe('extract - edge cases', () => {
    it('should handle video with single solid color', async () => {
      const video = createMockVideo();
      const redCanvas = createMockCanvas([255, 0, 0]);

      mockFrameExtractor.extractFrames = jest.fn().mockResolvedValue([
        redCanvas,
        redCanvas,
        redCanvas,
      ]);

      const colors = await extractor.extract(video, {
        count: 2,
        sampleFrames: 3,
      });

      // Should still return results, even if only one color
      expect(colors).toBeDefined();
      expect(colors.length).toBeGreaterThan(0);
    });

    it('should handle very short video (1 frame)', async () => {
      const video = createMockVideo({
        duration: 0.1,
      });
      const canvas = createMockCanvas([255, 0, 0]);

      mockFrameExtractor.extractFrames = jest.fn().mockResolvedValue([canvas]);

      const colors = await extractor.extract(video, {
        count: 2,
        sampleFrames: 1,
      });

      expect(colors).toBeDefined();
    });

    it('should handle extraction with minimal pixels', async () => {
      const video = createMockVideo();
      // Create very small canvas (1x1 pixel)
      const canvas = createMockCanvas([255, 0, 0], 1, 1);

      mockFrameExtractor.extractFrames = jest.fn().mockResolvedValue([canvas]);

      const colors = await extractor.extract(video, {
        count: 2,
        sampleFrames: 1,
      });

      expect(colors).toBeDefined();
    });
  });

  describe('extract - realistic scenarios', () => {
    it('should extract colors from gradient video', async () => {
      const video = createMockVideo();

      // Create frames with gradient colors
      const frame1 = createMockCanvas([255, 0, 0]);   // Red
      const frame2 = createMockCanvas([255, 128, 0]); // Orange
      const frame3 = createMockCanvas([255, 255, 0]); // Yellow
      const frame4 = createMockCanvas([0, 255, 0]);   // Green
      const frame5 = createMockCanvas([0, 0, 255]);   // Blue

      mockFrameExtractor.extractFrames = jest.fn().mockResolvedValue([
        frame1,
        frame2,
        frame3,
        frame4,
        frame5,
      ]);

      const colors = await extractor.extract(video, {
        count: 5,
        sampleFrames: 5,
      });

      expect(colors).toHaveLength(5);
      
      // All colors should have some percentage
      colors.forEach(color => {
        expect(color.percentage).toBeGreaterThan(0);
      });
    });

    it('should extract colors with different dominance', async () => {
      const video = createMockVideo();

      // Create frames: 60% red, 30% green, 10% blue
      const redCanvas = createMockCanvas([255, 0, 0]);
      const greenCanvas = createMockCanvas([0, 255, 0]);
      const blueCanvas = createMockCanvas([0, 0, 255]);

      mockFrameExtractor.extractFrames = jest.fn().mockResolvedValue([
        redCanvas,
        redCanvas,
        redCanvas,
        redCanvas,
        redCanvas,
        redCanvas,
        greenCanvas,
        greenCanvas,
        greenCanvas,
        blueCanvas,
      ]);

      const colors = await extractor.extract(video, {
        count: 3,
        sampleFrames: 10,
      });

      // Should find 3 colors
      expect(colors).toHaveLength(3);

      // First color should be most dominant
      expect(colors[0].percentage).toBeGreaterThan(colors[1].percentage);
      expect(colors[1].percentage).toBeGreaterThan(colors[2].percentage);
    });
  });

  describe('extract - return value structure', () => {
    it('should return array of Color objects', async () => {
      const video = createMockVideo();
      const canvas = createMockCanvas([255, 0, 0]);

      mockFrameExtractor.extractFrames = jest.fn().mockResolvedValue([canvas]);

      const colors = await extractor.extract(video, {
        count: 2,
        sampleFrames: 1,
      });

      expect(Array.isArray(colors)).toBe(true);
    });

    it('should have valid hex format', async () => {
      const video = createMockVideo();
      const canvas = createMockCanvas([255, 0, 0]);

      mockFrameExtractor.extractFrames = jest.fn().mockResolvedValue([canvas]);

      const colors = await extractor.extract(video, {
        count: 2,
        sampleFrames: 1,
      });

      colors.forEach(color => {
        expect(color.hex).toMatch(/^#[0-9a-f]{6}$/);
      });
    });

    it('should have valid RGB values', async () => {
      const video = createMockVideo();
      const canvas = createMockCanvas([255, 0, 0]);

      mockFrameExtractor.extractFrames = jest.fn().mockResolvedValue([canvas]);

      const colors = await extractor.extract(video, {
        count: 2,
        sampleFrames: 1,
      });

      colors.forEach(color => {
        expect(color.rgb).toHaveLength(3);
        color.rgb.forEach(value => {
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThanOrEqual(255);
        });
      });
    });

    it('should have valid HSL values', async () => {
      const video = createMockVideo();
      const canvas = createMockCanvas([255, 0, 0]);

      mockFrameExtractor.extractFrames = jest.fn().mockResolvedValue([canvas]);

      const colors = await extractor.extract(video, {
        count: 2,
        sampleFrames: 1,
      });

      colors.forEach(color => {
        expect(color.hsl).toHaveLength(3);
        expect(color.hsl[0]).toBeGreaterThanOrEqual(0);   // Hue: 0-360
        expect(color.hsl[0]).toBeLessThanOrEqual(360);
        expect(color.hsl[1]).toBeGreaterThanOrEqual(0);   // Saturation: 0-100
        expect(color.hsl[1]).toBeLessThanOrEqual(100);
        expect(color.hsl[2]).toBeGreaterThanOrEqual(0);   // Lightness: 0-100
        expect(color.hsl[2]).toBeLessThanOrEqual(100);
      });
    });

    it('should have valid percentage values', async () => {
      const video = createMockVideo();
      const canvas = createMockCanvas([255, 0, 0]);

      mockFrameExtractor.extractFrames = jest.fn().mockResolvedValue([canvas]);

      const colors = await extractor.extract(video, {
        count: 2,
        sampleFrames: 1,
      });

      colors.forEach(color => {
        expect(color.percentage).toBeGreaterThanOrEqual(0);
        expect(color.percentage).toBeLessThanOrEqual(100);
      });
    });
  });
});


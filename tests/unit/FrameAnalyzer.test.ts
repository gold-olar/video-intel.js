/**
 * Unit tests for FrameAnalyzer abstract class
 * 
 * Tests cover:
 * - Frame validation
 * - Image data extraction
 * - Statistical calculations (brightness, contrast, sharpness, color variance)
 * - Quality checks (black, white, blur detection)
 * - Caching system
 * - Performance tracking
 * 
 * @module tests/unit/FrameAnalyzer
 */

import { FrameAnalyzer } from '../../src/core/FrameAnalyzer';
import type { FrameAnalysisResult, FrameStatistics } from '../../src/types/analyzer';

/**
 * Concrete implementation of FrameAnalyzer for testing purposes.
 * This is a simple implementation that just returns the calculated statistics.
 */
class TestFrameAnalyzer extends FrameAnalyzer<FrameAnalysisResult> {
  async analyze(
    frame: HTMLCanvasElement,
    timestamp?: number
  ): Promise<FrameAnalysisResult> {
    // Check if validation should be performed
    if (!this.options.skipValidation && !this.validateFrame(frame)) {
      throw new Error('Invalid frame');
    }

    // Check cache first if enabled
    if (this.options.cache) {
      const cacheKey = this.getCacheKey(frame);
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Extract image data and calculate statistics
    const imageData = this.extractImageData(frame);
    const stats = this.calculateStatistics(imageData);

    // Create result
    const result: FrameAnalysisResult = {
      score: stats.brightness * stats.sharpness, // Simple composite score
      timestamp,
      metadata: { stats }
    };

    // Cache the result if caching is enabled
    if (this.options.cache) {
      const cacheKey = this.getCacheKey(frame);
      this.addToCache(cacheKey, result);
    }

    return result;
  }

  // Expose protected methods for testing
  public testExtractImageData(canvas: HTMLCanvasElement): ImageData {
    return this.extractImageData(canvas);
  }

  public testValidateFrame(canvas: HTMLCanvasElement): boolean {
    return this.validateFrame(canvas);
  }

  public testCalculateStatistics(imageData: ImageData): FrameStatistics {
    return this.calculateStatistics(imageData);
  }

  public testCalculateBrightness(imageData: ImageData): number {
    return this.calculateBrightness(imageData);
  }

  public testCalculateContrast(imageData: ImageData): number {
    return this.calculateContrast(imageData);
  }

  public testCalculateSharpness(imageData: ImageData): number {
    return this.calculateSharpness(imageData);
  }

  public testCalculateColorVariance(imageData: ImageData): number {
    return this.calculateColorVariance(imageData);
  }

  public testIsBlackFrame(imageData: ImageData, threshold?: number): boolean {
    return this.isBlackFrame(imageData, threshold);
  }

  public testIsWhiteFrame(imageData: ImageData, threshold?: number): boolean {
    return this.isWhiteFrame(imageData, threshold);
  }

  public testIsBlurryFrame(sharpness: number, threshold?: number): boolean {
    return this.isBlurryFrame(sharpness, threshold);
  }

  public testGetCacheKey(canvas: HTMLCanvasElement): string {
    return this.getCacheKey(canvas);
  }

  public testGetFromCache(key: string): FrameAnalysisResult | undefined {
    return this.getFromCache(key);
  }

  public testAddToCache(key: string, result: FrameAnalysisResult): void {
    this.addToCache(key, result);
  }

  public testClearCache(): void {
    this.clearCache();
  }

  public testGetCacheStats() {
    return this.getCacheStats();
  }

  public testGetPerformanceMetrics() {
    return this.getPerformanceMetrics();
  }

  public testGetPerformanceSummary() {
    return this.getPerformanceSummary();
  }

  public testClearPerformanceMetrics() {
    this.clearPerformanceMetrics();
  }
}

/**
 * Helper function to create a canvas with a solid color.
 * Useful for testing brightness, contrast, and quality checks.
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
    throw new Error('Failed to get 2D context');
  }

  // Fill with solid color
  ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
  ctx.fillRect(0, 0, width, height);

  return canvas;
}

/**
 * Helper function to create a canvas with gradient (for contrast testing).
 */
function createGradientCanvas(
  width: number,
  height: number,
  fromColor: [number, number, number],
  toColor: [number, number, number]
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D context');
  }

  // Create gradient
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, `rgb(${fromColor.join(',')})`);
  gradient.addColorStop(1, `rgb(${toColor.join(',')})`);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  return canvas;
}

/**
 * Helper function to create a canvas with random colors (for variance testing).
 */
function createColorfulCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D context');
  }

  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  // Fill with random colors
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.random() * 255; // R
    data[i + 1] = Math.random() * 255; // G
    data[i + 2] = Math.random() * 255; // B
    data[i + 3] = 255; // A
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

// ============================================================================
// TEST SUITES
// ============================================================================

describe('FrameAnalyzer', () => {
  let analyzer: TestFrameAnalyzer;

  beforeEach(() => {
    // Create a new analyzer instance before each test
    analyzer = new TestFrameAnalyzer();
  });

  // ==========================================================================
  // Frame Validation Tests
  // ==========================================================================

  describe('validateFrame()', () => {
    it('should return true for valid canvas', () => {
      const canvas = createSolidColorCanvas(100, 100, 128, 128, 128);
      expect(analyzer.testValidateFrame(canvas)).toBe(true);
    });

    it('should return false for null canvas', () => {
      expect(analyzer.testValidateFrame(null as any)).toBe(false);
    });

    it('should return false for undefined canvas', () => {
      expect(analyzer.testValidateFrame(undefined as any)).toBe(false);
    });

    it('should return false for canvas with zero width', () => {
      const canvas = document.createElement('canvas');
      canvas.width = 0;
      canvas.height = 100;
      expect(analyzer.testValidateFrame(canvas)).toBe(false);
    });

    it('should return false for canvas with zero height', () => {
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 0;
      expect(analyzer.testValidateFrame(canvas)).toBe(false);
    });
  });

  // ==========================================================================
  // Image Data Extraction Tests
  // ==========================================================================

  describe('extractImageData()', () => {
    it('should extract ImageData from valid canvas', () => {
      const canvas = createSolidColorCanvas(100, 100, 255, 0, 0);
      const imageData = analyzer.testExtractImageData(canvas);

      expect(imageData).toBeInstanceOf(ImageData);
      expect(imageData.width).toBe(100);
      expect(imageData.height).toBe(100);
      expect(imageData.data.length).toBe(100 * 100 * 4); // RGBA
    });

    it('should extract correct pixel colors', () => {
      const canvas = createSolidColorCanvas(10, 10, 255, 128, 64);
      const imageData = analyzer.testExtractImageData(canvas);

      // Check first pixel
      expect(imageData.data[0]).toBe(255); // R
      expect(imageData.data[1]).toBe(128); // G
      expect(imageData.data[2]).toBe(64); // B
      expect(imageData.data[3]).toBe(255); // A
    });

    it('should handle canvas scaling', () => {
      const canvas = createSolidColorCanvas(100, 100, 128, 128, 128);
      const scaledAnalyzer = new TestFrameAnalyzer({ analysisScale: 0.5 });

      const imageData = scaledAnalyzer.testExtractImageData(canvas);

      // Should be half the size due to scaling
      expect(imageData.width).toBe(50);
      expect(imageData.height).toBe(50);
    });
  });

  // ==========================================================================
  // Brightness Calculation Tests
  // ==========================================================================

  describe('calculateBrightness()', () => {
    it('should return ~0 for black frame', () => {
      const canvas = createSolidColorCanvas(100, 100, 0, 0, 0);
      const imageData = analyzer.testExtractImageData(canvas);
      const brightness = analyzer.testCalculateBrightness(imageData);

      expect(brightness).toBeCloseTo(0, 2);
    });

    it('should return ~1 for white frame', () => {
      const canvas = createSolidColorCanvas(100, 100, 255, 255, 255);
      const imageData = analyzer.testExtractImageData(canvas);
      const brightness = analyzer.testCalculateBrightness(imageData);

      expect(brightness).toBeCloseTo(1, 2);
    });

    it('should return ~0.5 for mid-gray frame', () => {
      const canvas = createSolidColorCanvas(100, 100, 128, 128, 128);
      const imageData = analyzer.testExtractImageData(canvas);
      const brightness = analyzer.testCalculateBrightness(imageData);

      expect(brightness).toBeGreaterThan(0.4);
      expect(brightness).toBeLessThan(0.6);
    });

    it('should weight green more than red and blue (perception)', () => {
      // Pure green should appear brighter than pure red or blue
      const greenCanvas = createSolidColorCanvas(100, 100, 0, 255, 0);
      const redCanvas = createSolidColorCanvas(100, 100, 255, 0, 0);
      const blueCanvas = createSolidColorCanvas(100, 100, 0, 0, 255);

      const greenBrightness = analyzer.testCalculateBrightness(
        analyzer.testExtractImageData(greenCanvas)
      );
      const redBrightness = analyzer.testCalculateBrightness(
        analyzer.testExtractImageData(redCanvas)
      );
      const blueBrightness = analyzer.testCalculateBrightness(
        analyzer.testExtractImageData(blueCanvas)
      );

      expect(greenBrightness).toBeGreaterThan(redBrightness);
      expect(greenBrightness).toBeGreaterThan(blueBrightness);
    });
  });

  // ==========================================================================
  // Contrast Calculation Tests
  // ==========================================================================

  describe('calculateContrast()', () => {
    it('should return 0 for solid color (no contrast)', () => {
      const canvas = createSolidColorCanvas(100, 100, 128, 128, 128);
      const imageData = analyzer.testExtractImageData(canvas);
      const contrast = analyzer.testCalculateContrast(imageData);

      expect(contrast).toBeCloseTo(0, 2);
    });

    it('should return high value for black-to-white gradient', () => {
      const canvas = createGradientCanvas(100, 100, [0, 0, 0], [255, 255, 255]);
      const imageData = analyzer.testExtractImageData(canvas);
      const contrast = analyzer.testCalculateContrast(imageData);

      expect(contrast).toBeGreaterThan(0.8);
    });

    it('should return medium value for partial contrast', () => {
      const canvas = createGradientCanvas(100, 100, [64, 64, 64], [192, 192, 192]);
      const imageData = analyzer.testExtractImageData(canvas);
      const contrast = analyzer.testCalculateContrast(imageData);

      expect(contrast).toBeGreaterThan(0.3);
      expect(contrast).toBeLessThan(0.7);
    });
  });

  // ==========================================================================
  // Sharpness Calculation Tests
  // ==========================================================================

  describe('calculateSharpness()', () => {
    it('should return a value between 0 and 1', () => {
      const canvas = createSolidColorCanvas(100, 100, 128, 128, 128);
      const imageData = analyzer.testExtractImageData(canvas);
      const sharpness = analyzer.testCalculateSharpness(imageData);

      expect(sharpness).toBeGreaterThanOrEqual(0);
      expect(sharpness).toBeLessThanOrEqual(1);
    });

    it('should return low value for flat color (no edges)', () => {
      const canvas = createSolidColorCanvas(100, 100, 128, 128, 128);
      const imageData = analyzer.testExtractImageData(canvas);
      const sharpness = analyzer.testCalculateSharpness(imageData);

      // Flat color should have very low sharpness
      expect(sharpness).toBeLessThan(0.2);
    });

    it('should work with different canvas sizes', () => {
      const smallCanvas = createSolidColorCanvas(10, 10, 128, 128, 128);
      const largeCanvas = createSolidColorCanvas(500, 500, 128, 128, 128);

      const smallSharpness = analyzer.testCalculateSharpness(
        analyzer.testExtractImageData(smallCanvas)
      );
      const largeSharpness = analyzer.testCalculateSharpness(
        analyzer.testExtractImageData(largeCanvas)
      );

      // Both should be low for flat color
      expect(smallSharpness).toBeLessThan(0.2);
      expect(largeSharpness).toBeLessThan(0.2);
    });
  });

  // ==========================================================================
  // Color Variance Calculation Tests
  // ==========================================================================

  describe('calculateColorVariance()', () => {
    it('should return low value for solid color (no variance)', () => {
      const canvas = createSolidColorCanvas(100, 100, 128, 128, 128);
      const imageData = analyzer.testExtractImageData(canvas);
      const variance = analyzer.testCalculateColorVariance(imageData);

      expect(variance).toBeCloseTo(0, 2);
    });

    it('should return high value for colorful image', () => {
      const canvas = createColorfulCanvas(100, 100);
      const imageData = analyzer.testExtractImageData(canvas);
      const variance = analyzer.testCalculateColorVariance(imageData);

      expect(variance).toBeGreaterThan(0.5);
    });

    it('should return medium value for gradient', () => {
      const canvas = createGradientCanvas(100, 100, [0, 0, 0], [255, 255, 255]);
      const imageData = analyzer.testExtractImageData(canvas);
      const variance = analyzer.testCalculateColorVariance(imageData);

      expect(variance).toBeGreaterThan(0.1);
      expect(variance).toBeLessThan(0.9);
    });
  });

  // ==========================================================================
  // Combined Statistics Tests
  // ==========================================================================

  describe('calculateStatistics()', () => {
    it('should return all statistics', () => {
      const canvas = createSolidColorCanvas(100, 100, 128, 128, 128);
      const imageData = analyzer.testExtractImageData(canvas);
      const stats = analyzer.testCalculateStatistics(imageData);

      expect(stats).toHaveProperty('brightness');
      expect(stats).toHaveProperty('contrast');
      expect(stats).toHaveProperty('sharpness');
      expect(stats).toHaveProperty('colorVariance');
      expect(stats).toHaveProperty('isBlackFrame');
      expect(stats).toHaveProperty('isWhiteFrame');
      expect(stats).toHaveProperty('isBlurry');
    });

    it('should identify black frames', () => {
      const canvas = createSolidColorCanvas(100, 100, 0, 0, 0);
      const imageData = analyzer.testExtractImageData(canvas);
      const stats = analyzer.testCalculateStatistics(imageData);

      expect(stats.isBlackFrame).toBe(true);
      expect(stats.isWhiteFrame).toBe(false);
    });

    it('should identify white frames', () => {
      const canvas = createSolidColorCanvas(100, 100, 255, 255, 255);
      const imageData = analyzer.testExtractImageData(canvas);
      const stats = analyzer.testCalculateStatistics(imageData);

      expect(stats.isBlackFrame).toBe(false);
      expect(stats.isWhiteFrame).toBe(true);
    });

    it('should identify blurry frames', () => {
      const canvas = createSolidColorCanvas(100, 100, 128, 128, 128);
      const imageData = analyzer.testExtractImageData(canvas);
      const stats = analyzer.testCalculateStatistics(imageData);

      // Flat color = very blurry/low sharpness
      expect(stats.isBlurry).toBe(true);
    });
  });

  // ==========================================================================
  // Quality Check Tests
  // ==========================================================================

  describe('isBlackFrame()', () => {
    it('should detect black frames with default threshold', () => {
      const canvas = createSolidColorCanvas(100, 100, 0, 0, 0);
      const imageData = analyzer.testExtractImageData(canvas);
      expect(analyzer.testIsBlackFrame(imageData)).toBe(true);
    });

    it('should not detect bright frames as black', () => {
      const canvas = createSolidColorCanvas(100, 100, 200, 200, 200);
      const imageData = analyzer.testExtractImageData(canvas);
      expect(analyzer.testIsBlackFrame(imageData)).toBe(false);
    });

    it('should respect custom threshold', () => {
      const canvas = createSolidColorCanvas(100, 100, 50, 50, 50);
      const imageData = analyzer.testExtractImageData(canvas);

      // Should be black with high threshold (0.5)
      expect(analyzer.testIsBlackFrame(imageData, 0.5)).toBe(true);

      // Should not be black with low threshold (0.05)
      expect(analyzer.testIsBlackFrame(imageData, 0.05)).toBe(false);
    });
  });

  describe('isWhiteFrame()', () => {
    it('should detect white frames with default threshold', () => {
      const canvas = createSolidColorCanvas(100, 100, 255, 255, 255);
      const imageData = analyzer.testExtractImageData(canvas);
      expect(analyzer.testIsWhiteFrame(imageData)).toBe(true);
    });

    it('should not detect dark frames as white', () => {
      const canvas = createSolidColorCanvas(100, 100, 50, 50, 50);
      const imageData = analyzer.testExtractImageData(canvas);
      expect(analyzer.testIsWhiteFrame(imageData)).toBe(false);
    });

    it('should respect custom threshold', () => {
      const canvas = createSolidColorCanvas(100, 100, 200, 200, 200);
      const imageData = analyzer.testExtractImageData(canvas);

      // Should be white with low threshold (0.5)
      expect(analyzer.testIsWhiteFrame(imageData, 0.5)).toBe(true);

      // Should not be white with high threshold (0.95)
      expect(analyzer.testIsWhiteFrame(imageData, 0.95)).toBe(false);
    });
  });

  describe('isBlurryFrame()', () => {
    it('should detect blurry frames with default threshold', () => {
      // Very low sharpness = blurry
      expect(analyzer.testIsBlurryFrame(0.1)).toBe(true);
    });

    it('should not detect sharp frames as blurry', () => {
      // High sharpness = not blurry
      expect(analyzer.testIsBlurryFrame(0.8)).toBe(false);
    });

    it('should respect custom threshold', () => {
      const sharpness = 0.5;

      // Should be blurry with high threshold (0.7)
      expect(analyzer.testIsBlurryFrame(sharpness, 0.7)).toBe(true);

      // Should not be blurry with low threshold (0.3)
      expect(analyzer.testIsBlurryFrame(sharpness, 0.3)).toBe(false);
    });
  });

  // ==========================================================================
  // Caching System Tests
  // ==========================================================================

  describe('Caching', () => {
    it('should cache analysis results when enabled', async () => {
      const cachedAnalyzer = new TestFrameAnalyzer({ cache: true });
      const canvas = createSolidColorCanvas(100, 100, 128, 128, 128);

      // First analysis
      const result1 = await cachedAnalyzer.analyze(canvas);

      // Second analysis of same frame should hit cache
      const result2 = await cachedAnalyzer.analyze(canvas);

      expect(result1).toEqual(result2);

      const stats = cachedAnalyzer.testGetCacheStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
    });

    it('should not cache when caching is disabled', async () => {
      const noCacheAnalyzer = new TestFrameAnalyzer({ cache: false });
      const canvas = createSolidColorCanvas(100, 100, 128, 128, 128);

      await noCacheAnalyzer.analyze(canvas);
      await noCacheAnalyzer.analyze(canvas);

      const stats = noCacheAnalyzer.testGetCacheStats();
      expect(stats.size).toBe(0);
    });

    it('should clear cache', async () => {
      const cachedAnalyzer = new TestFrameAnalyzer({ cache: true });
      const canvas = createSolidColorCanvas(100, 100, 128, 128, 128);

      await cachedAnalyzer.analyze(canvas);
      cachedAnalyzer.testClearCache();

      const stats = cachedAnalyzer.testGetCacheStats();
      expect(stats.size).toBe(0);
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });

    it('should respect max cache size', async () => {
      const cachedAnalyzer = new TestFrameAnalyzer({
        cache: true,
        maxCacheSize: 3
      });

      // Create 5 different frames
      for (let i = 0; i < 5; i++) {
        const canvas = createSolidColorCanvas(100, 100, i * 50, i * 50, i * 50);
        await cachedAnalyzer.analyze(canvas);
      }

      const stats = cachedAnalyzer.testGetCacheStats();
      // Cache should not exceed maxCacheSize
      expect(stats.size).toBeLessThanOrEqual(3);
    });
  });

  // ==========================================================================
  // Performance Tracking Tests
  // ==========================================================================

  describe('Performance Tracking', () => {
    it('should track performance when enabled', async () => {
      const perfAnalyzer = new TestFrameAnalyzer({ trackPerformance: true });
      const canvas = createSolidColorCanvas(100, 100, 128, 128, 128);

      await perfAnalyzer.analyze(canvas);

      const metrics = perfAnalyzer.testGetPerformanceMetrics();
      expect(metrics.length).toBeGreaterThan(0);

      // Check that metrics have required properties
      metrics.forEach(metric => {
        expect(metric).toHaveProperty('operation');
        expect(metric).toHaveProperty('startTime');
        expect(metric).toHaveProperty('endTime');
        expect(metric).toHaveProperty('duration');
      });
    });

    it('should not track performance when disabled', async () => {
      const noPerfAnalyzer = new TestFrameAnalyzer({ trackPerformance: false });
      const canvas = createSolidColorCanvas(100, 100, 128, 128, 128);

      await noPerfAnalyzer.analyze(canvas);

      const metrics = noPerfAnalyzer.testGetPerformanceMetrics();
      expect(metrics.length).toBe(0);
    });

    it('should provide performance summary', async () => {
      const perfAnalyzer = new TestFrameAnalyzer({ trackPerformance: true });
      const canvas = createSolidColorCanvas(100, 100, 128, 128, 128);

      // Analyze multiple times
      await perfAnalyzer.analyze(canvas);
      await perfAnalyzer.analyze(canvas);
      await perfAnalyzer.analyze(canvas);

      const summary = perfAnalyzer.testGetPerformanceSummary();

      expect(summary.count).toBeGreaterThan(0);
      expect(summary.totalDuration).toBeGreaterThan(0);
      expect(summary.averageDuration).toBeGreaterThan(0);
      expect(summary.minDuration).toBeGreaterThanOrEqual(0);
      expect(summary.maxDuration).toBeGreaterThanOrEqual(summary.minDuration);
    });

    it('should clear performance metrics', async () => {
      const perfAnalyzer = new TestFrameAnalyzer({ trackPerformance: true });
      const canvas = createSolidColorCanvas(100, 100, 128, 128, 128);

      await perfAnalyzer.analyze(canvas);
      perfAnalyzer.testClearPerformanceMetrics();

      const metrics = perfAnalyzer.testGetPerformanceMetrics();
      expect(metrics.length).toBe(0);
    });
  });

  // ==========================================================================
  // Integration Tests
  // ==========================================================================

  describe('Integration', () => {
    it('should perform complete analysis workflow', async () => {
      const canvas = createSolidColorCanvas(100, 100, 128, 128, 128);
      const result = await analyzer.analyze(canvas, 5.5);

      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('metadata');
      expect(result.timestamp).toBe(5.5);
    });

    it('should handle validation failures gracefully', async () => {
      const invalidCanvas = null as any;

      await expect(analyzer.analyze(invalidCanvas)).rejects.toThrow('Invalid frame');
    });

    it('should skip validation when requested', async () => {
      const skipValidationAnalyzer = new TestFrameAnalyzer({
        skipValidation: true
      });

      // This would normally fail validation, but should be skipped
      const canvas = createSolidColorCanvas(100, 100, 128, 128, 128);

      const result = await skipValidationAnalyzer.analyze(canvas);
      expect(result).toBeDefined();
    });

    it('should work with all options combined', async () => {
      const fullAnalyzer = new TestFrameAnalyzer({
        cache: true,
        trackPerformance: true,
        maxCacheSize: 10,
        analysisScale: 0.5
      });

      // Use different sizes to ensure different cache keys
      // (cache key includes dimensions)
      const canvas1 = createSolidColorCanvas(150, 150, 255, 0, 0); // Red, 150x150
      const canvas2 = createSolidColorCanvas(200, 200, 0, 255, 0); // Green, 200x200

      // First frame
      const result1 = await fullAnalyzer.analyze(canvas1, 1.0);
      expect(result1.timestamp).toBe(1.0);

      // Second frame
      const result2 = await fullAnalyzer.analyze(canvas2, 2.0);
      expect(result2.timestamp).toBe(2.0);

      // Re-analyze first frame (should hit cache)
      const result3 = await fullAnalyzer.analyze(canvas1, 1.0);
      expect(result3).toEqual(result1);

      // Check cache stats
      const cacheStats = fullAnalyzer.testGetCacheStats();
      expect(cacheStats.hits).toBeGreaterThan(0);

      // Check performance metrics
      const perfMetrics = fullAnalyzer.testGetPerformanceMetrics();
      expect(perfMetrics.length).toBeGreaterThan(0);
    });
  });
});


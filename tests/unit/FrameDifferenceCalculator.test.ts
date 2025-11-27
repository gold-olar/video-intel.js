/**
 * Tests for FrameDifferenceCalculator
 * 
 * These tests verify the frame difference calculation algorithms work correctly.
 */

import { FrameDifferenceCalculator } from '../../src/modules/scenes/FrameDifferenceCalculator';
import { VideoIntelError } from '../../src/types';

describe('FrameDifferenceCalculator', () => {
  let calculator: FrameDifferenceCalculator;

  beforeEach(() => {
    calculator = new FrameDifferenceCalculator();
  });

  // ============================================================================
  // Test Helpers
  // ============================================================================

  /**
   * Create a canvas with solid color for testing.
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

  /**
   * Create a canvas with gradient for testing.
   */
  function createGradientCanvas(
    width: number,
    height: number
  ): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, 'red');
    gradient.addColorStop(0.5, 'green');
    gradient.addColorStop(1, 'blue');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    return canvas;
  }

  // ============================================================================
  // Basic Functionality Tests
  // ============================================================================

  describe('calculateDifference()', () => {
    test('should return 0 difference for identical frames', () => {
      const frame1 = createSolidColorCanvas(100, 100, 128, 128, 128);
      const frame2 = createSolidColorCanvas(100, 100, 128, 128, 128);

      const result = calculator.calculateDifference(frame1, frame2, 0, 1);

      // Identical frames should have 0 or near-0 difference
      expect(result.difference).toBeLessThan(0.01);
      expect(result.timestamp1).toBe(0);
      expect(result.timestamp2).toBe(1);
    });

    test('should return high difference for completely different frames', () => {
      const frame1 = createSolidColorCanvas(100, 100, 0, 0, 0); // Black
      const frame2 = createSolidColorCanvas(100, 100, 255, 255, 255); // White

      const result = calculator.calculateDifference(frame1, frame2, 0, 1);

      // Completely different frames should have high difference (close to 1)
      expect(result.difference).toBeGreaterThan(0.9);
    });

    test('should return moderate difference for similar frames', () => {
      const frame1 = createSolidColorCanvas(100, 100, 100, 100, 100);
      const frame2 = createSolidColorCanvas(100, 100, 120, 120, 120);

      const result = calculator.calculateDifference(frame1, frame2, 0, 1);

      // Similar frames should have low to moderate difference
      expect(result.difference).toBeGreaterThan(0);
      expect(result.difference).toBeLessThan(0.5);
    });

    test('should include metadata in result', () => {
      const frame1 = createSolidColorCanvas(100, 100, 128, 128, 128);
      const frame2 = createSolidColorCanvas(100, 100, 128, 128, 128);

      const result = calculator.calculateDifference(frame1, frame2, 5.5, 6.0);

      expect(result.timestamp1).toBe(5.5);
      expect(result.timestamp2).toBe(6.0);
      expect(result.method).toBe('pixel'); // Default method
    });
  });

  // ============================================================================
  // Validation Tests
  // ============================================================================

  describe('validation', () => {
    test('should throw error for null frames', () => {
      const frame = createSolidColorCanvas(100, 100, 128, 128, 128);

      expect(() => {
        calculator.calculateDifference(null as any, frame, 0, 1);
      }).toThrow(VideoIntelError);

      expect(() => {
        calculator.calculateDifference(frame, null as any, 0, 1);
      }).toThrow(VideoIntelError);
    });

    test('should throw error for frames with invalid dimensions', () => {
      const validFrame = createSolidColorCanvas(100, 100, 128, 128, 128);
      const invalidFrame = createSolidColorCanvas(0, 0, 128, 128, 128);

      expect(() => {
        calculator.calculateDifference(validFrame, invalidFrame, 0, 1);
      }).toThrow(VideoIntelError);
    });

    test('should throw error for frames with mismatched aspect ratios', () => {
      const frame1 = createSolidColorCanvas(100, 100, 128, 128, 128); // 1:1
      const frame2 = createSolidColorCanvas(200, 100, 128, 128, 128); // 2:1

      expect(() => {
        calculator.calculateDifference(frame1, frame2, 0, 1);
      }).toThrow(VideoIntelError);
    });

    test('should accept frames with same aspect ratio but different sizes', () => {
      const frame1 = createSolidColorCanvas(100, 100, 128, 128, 128); // 1:1
      const frame2 = createSolidColorCanvas(200, 200, 128, 128, 128); // 1:1

      // Should not throw
      const result = calculator.calculateDifference(frame1, frame2, 0, 1);
      expect(result).toBeDefined();
    });
  });

  // ============================================================================
  // Method Options Tests
  // ============================================================================

  describe('method options', () => {
    test('should support pixel method', () => {
      const frame1 = createSolidColorCanvas(100, 100, 100, 100, 100);
      const frame2 = createSolidColorCanvas(100, 100, 200, 200, 200);

      const result = calculator.calculateDifference(frame1, frame2, 0, 1, {
        method: 'pixel'
      });

      expect(result.method).toBe('pixel');
      expect(result.difference).toBeGreaterThan(0);
    });

    test('should support histogram method', () => {
      const frame1 = createSolidColorCanvas(100, 100, 100, 100, 100);
      const frame2 = createSolidColorCanvas(100, 100, 200, 200, 200);

      const result = calculator.calculateDifference(frame1, frame2, 0, 1, {
        method: 'histogram'
      });

      expect(result.method).toBe('histogram');
      expect(result.difference).toBeGreaterThan(0);
    });

    test('should support combined method', () => {
      const frame1 = createSolidColorCanvas(100, 100, 100, 100, 100);
      const frame2 = createSolidColorCanvas(100, 100, 200, 200, 200);

      const result = calculator.calculateDifference(frame1, frame2, 0, 1, {
        method: 'combined'
      });

      expect(result.method).toBe('combined');
      expect(result.difference).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // Downscaling Tests
  // ============================================================================

  describe('downscaling', () => {
    test('should produce similar results with different downscale values', () => {
      const frame1 = createSolidColorCanvas(400, 400, 100, 100, 100);
      const frame2 = createSolidColorCanvas(400, 400, 200, 200, 200);

      const result1 = calculator.calculateDifference(frame1, frame2, 0, 1, {
        downscale: 1.0 // No downscaling
      });

      const result2 = calculator.calculateDifference(frame1, frame2, 0, 1, {
        downscale: 0.25 // 4x downscaling
      });

      // Results should be similar (within 10% tolerance)
      const tolerance = 0.1;
      expect(Math.abs(result1.difference - result2.difference)).toBeLessThan(tolerance);
    });
  });

  // ============================================================================
  // Grayscale Tests
  // ============================================================================

  describe('grayscale option', () => {
    test('should work with grayscale enabled', () => {
      const frame1 = createSolidColorCanvas(100, 100, 100, 100, 100);
      const frame2 = createSolidColorCanvas(100, 100, 200, 200, 200);

      const result = calculator.calculateDifference(frame1, frame2, 0, 1, {
        grayscale: true
      });

      expect(result.difference).toBeGreaterThan(0);
    });

    test('should work with grayscale disabled', () => {
      const frame1 = createSolidColorCanvas(100, 100, 100, 100, 100);
      const frame2 = createSolidColorCanvas(100, 100, 200, 200, 200);

      const result = calculator.calculateDifference(frame1, frame2, 0, 1, {
        grayscale: false
      });

      expect(result.difference).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // Utility Methods Tests
  // ============================================================================

  describe('areFramesIdentical()', () => {
    test('should return true for identical frames', () => {
      const frame1 = createSolidColorCanvas(100, 100, 128, 128, 128);
      const frame2 = createSolidColorCanvas(100, 100, 128, 128, 128);

      const result = calculator.areFramesIdentical(frame1, frame2);

      expect(result).toBe(true);
    });

    test('should return false for different frames', () => {
      const frame1 = createSolidColorCanvas(100, 100, 100, 100, 100);
      const frame2 = createSolidColorCanvas(100, 100, 200, 200, 200);

      const result = calculator.areFramesIdentical(frame1, frame2);

      expect(result).toBe(false);
    });

    test('should return false for frames with different dimensions', () => {
      const frame1 = createSolidColorCanvas(100, 100, 128, 128, 128);
      const frame2 = createSolidColorCanvas(200, 200, 128, 128, 128);

      const result = calculator.areFramesIdentical(frame1, frame2);

      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // Edge Cases Tests
  // ============================================================================

  describe('edge cases', () => {
    test('should handle small canvases', () => {
      const frame1 = createSolidColorCanvas(1, 1, 100, 100, 100);
      const frame2 = createSolidColorCanvas(1, 1, 200, 200, 200);

      const result = calculator.calculateDifference(frame1, frame2, 0, 1);

      expect(result.difference).toBeGreaterThan(0);
    });

    test('should handle large canvases', () => {
      const frame1 = createSolidColorCanvas(1000, 1000, 100, 100, 100);
      const frame2 = createSolidColorCanvas(1000, 1000, 200, 200, 200);

      const result = calculator.calculateDifference(frame1, frame2, 0, 1);

      expect(result.difference).toBeGreaterThan(0);
    });

    test('should handle frames with gradients', () => {
      const frame1 = createGradientCanvas(100, 100);
      const frame2 = createGradientCanvas(100, 100);

      const result = calculator.calculateDifference(frame1, frame2, 0, 1);

      // Same gradient should have low difference
      expect(result.difference).toBeLessThan(0.1);
    });
  });

  // ============================================================================
  // Performance Tests (basic timing checks)
  // ============================================================================

  describe('performance', () => {
    test('should complete pixel comparison in reasonable time', () => {
      const frame1 = createSolidColorCanvas(640, 480, 100, 100, 100);
      const frame2 = createSolidColorCanvas(640, 480, 200, 200, 200);

      const start = performance.now();
      calculator.calculateDifference(frame1, frame2, 0, 1, {
        method: 'pixel',
        downscale: 0.25
      });
      const duration = performance.now() - start;

      // Should complete in under 100ms (very generous)
      expect(duration).toBeLessThan(100);
    });

    test('should complete histogram comparison in reasonable time', () => {
      const frame1 = createSolidColorCanvas(640, 480, 100, 100, 100);
      const frame2 = createSolidColorCanvas(640, 480, 200, 200, 200);

      const start = performance.now();
      calculator.calculateDifference(frame1, frame2, 0, 1, {
        method: 'histogram',
        downscale: 0.25
      });
      const duration = performance.now() - start;

      // Should complete in under 200ms (very generous)
      expect(duration).toBeLessThan(200);
    });
  });
});


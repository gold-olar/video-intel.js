/**
 * Tests for ColorConverter
 * 
 * Tests all color space conversions and utility methods
 */

import { ColorConverter, RGB, HSL } from '../../src/modules/colors/ColorConverter';

describe('ColorConverter', () => {
  describe('rgbToHex', () => {
    it('should convert red to hex', () => {
      const rgb: RGB = [255, 0, 0];
      expect(ColorConverter.rgbToHex(rgb)).toBe('#ff0000');
    });

    it('should convert green to hex', () => {
      const rgb: RGB = [0, 255, 0];
      expect(ColorConverter.rgbToHex(rgb)).toBe('#00ff00');
    });

    it('should convert blue to hex', () => {
      const rgb: RGB = [0, 0, 255];
      expect(ColorConverter.rgbToHex(rgb)).toBe('#0000ff');
    });

    it('should convert white to hex', () => {
      const rgb: RGB = [255, 255, 255];
      expect(ColorConverter.rgbToHex(rgb)).toBe('#ffffff');
    });

    it('should convert black to hex', () => {
      const rgb: RGB = [0, 0, 0];
      expect(ColorConverter.rgbToHex(rgb)).toBe('#000000');
    });

    it('should pad single digit hex values with zero', () => {
      const rgb: RGB = [1, 2, 3];
      expect(ColorConverter.rgbToHex(rgb)).toBe('#010203');
    });

    it('should handle mid-range values', () => {
      const rgb: RGB = [128, 128, 128];
      expect(ColorConverter.rgbToHex(rgb)).toBe('#808080');
    });
  });

  describe('hexToRgb', () => {
    it('should convert hex red to RGB', () => {
      expect(ColorConverter.hexToRgb('#ff0000')).toEqual([255, 0, 0]);
    });

    it('should convert hex green to RGB', () => {
      expect(ColorConverter.hexToRgb('#00ff00')).toEqual([0, 255, 0]);
    });

    it('should convert hex blue to RGB', () => {
      expect(ColorConverter.hexToRgb('#0000ff')).toEqual([0, 0, 255]);
    });

    it('should convert hex without # prefix', () => {
      expect(ColorConverter.hexToRgb('ff0000')).toEqual([255, 0, 0]);
    });

    it('should convert shorthand hex', () => {
      expect(ColorConverter.hexToRgb('#f00')).toEqual([255, 0, 0]);
    });

    it('should convert shorthand hex without #', () => {
      expect(ColorConverter.hexToRgb('0f0')).toEqual([0, 255, 0]);
    });

    it('should handle uppercase hex', () => {
      expect(ColorConverter.hexToRgb('#FF0000')).toEqual([255, 0, 0]);
    });

    it('should handle mixed case hex', () => {
      expect(ColorConverter.hexToRgb('#Ff00fF')).toEqual([255, 0, 255]);
    });
  });

  describe('rgbToHsl', () => {
    it('should convert red to HSL', () => {
      const rgb: RGB = [255, 0, 0];
      const hsl = ColorConverter.rgbToHsl(rgb);
      expect(hsl).toEqual([0, 100, 50]);
    });

    it('should convert green to HSL', () => {
      const rgb: RGB = [0, 255, 0];
      const hsl = ColorConverter.rgbToHsl(rgb);
      expect(hsl).toEqual([120, 100, 50]);
    });

    it('should convert blue to HSL', () => {
      const rgb: RGB = [0, 0, 255];
      const hsl = ColorConverter.rgbToHsl(rgb);
      expect(hsl).toEqual([240, 100, 50]);
    });

    it('should convert white to HSL', () => {
      const rgb: RGB = [255, 255, 255];
      const hsl = ColorConverter.rgbToHsl(rgb);
      expect(hsl[2]).toBe(100); // Lightness should be 100
      expect(hsl[1]).toBe(0); // Saturation should be 0 (grayscale)
    });

    it('should convert black to HSL', () => {
      const rgb: RGB = [0, 0, 0];
      const hsl = ColorConverter.rgbToHsl(rgb);
      expect(hsl[2]).toBe(0); // Lightness should be 0
      expect(hsl[1]).toBe(0); // Saturation should be 0 (grayscale)
    });

    it('should convert gray to HSL with 0 saturation', () => {
      const rgb: RGB = [128, 128, 128];
      const hsl = ColorConverter.rgbToHsl(rgb);
      expect(hsl[1]).toBe(0); // Saturation should be 0 for gray
      expect(hsl[2]).toBe(50); // Lightness should be around 50
    });
  });

  describe('hslToRgb', () => {
    it('should convert HSL red to RGB', () => {
      const hsl: HSL = [0, 100, 50];
      const rgb = ColorConverter.hslToRgb(hsl);
      expect(rgb).toEqual([255, 0, 0]);
    });

    it('should convert HSL green to RGB', () => {
      const hsl: HSL = [120, 100, 50];
      const rgb = ColorConverter.hslToRgb(hsl);
      expect(rgb).toEqual([0, 255, 0]);
    });

    it('should convert HSL blue to RGB', () => {
      const hsl: HSL = [240, 100, 50];
      const rgb = ColorConverter.hslToRgb(hsl);
      expect(rgb).toEqual([0, 0, 255]);
    });

    it('should convert HSL white to RGB', () => {
      const hsl: HSL = [0, 0, 100];
      const rgb = ColorConverter.hslToRgb(hsl);
      expect(rgb).toEqual([255, 255, 255]);
    });

    it('should convert HSL black to RGB', () => {
      const hsl: HSL = [0, 0, 0];
      const rgb = ColorConverter.hslToRgb(hsl);
      expect(rgb).toEqual([0, 0, 0]);
    });

    it('should convert HSL gray to RGB', () => {
      const hsl: HSL = [0, 0, 50];
      const rgb = ColorConverter.hslToRgb(hsl);
      // Gray should have all channels equal (within rounding)
      expect(Math.abs(rgb[0] - rgb[1])).toBeLessThanOrEqual(1);
      expect(Math.abs(rgb[1] - rgb[2])).toBeLessThanOrEqual(1);
    });
  });

  describe('Round-trip conversions', () => {
    it('should maintain color through RGB -> HSL -> RGB', () => {
      const originalRgb: RGB = [200, 150, 100];
      const hsl = ColorConverter.rgbToHsl(originalRgb);
      const convertedRgb = ColorConverter.hslToRgb(hsl);

      // Allow small rounding errors (within 2 units)
      expect(Math.abs(convertedRgb[0] - originalRgb[0])).toBeLessThanOrEqual(2);
      expect(Math.abs(convertedRgb[1] - originalRgb[1])).toBeLessThanOrEqual(2);
      expect(Math.abs(convertedRgb[2] - originalRgb[2])).toBeLessThanOrEqual(2);
    });

    it('should maintain color through RGB -> HEX -> RGB', () => {
      const originalRgb: RGB = [200, 150, 100];
      const hex = ColorConverter.rgbToHex(originalRgb);
      const convertedRgb = ColorConverter.hexToRgb(hex);

      expect(convertedRgb).toEqual(originalRgb);
    });
  });

  describe('colorDistance', () => {
    it('should return 0 for identical colors', () => {
      const color: RGB = [255, 0, 0];
      expect(ColorConverter.colorDistance(color, color)).toBe(0);
    });

    it('should return positive value for different colors', () => {
      const red: RGB = [255, 0, 0];
      const blue: RGB = [0, 0, 255];
      const distance = ColorConverter.colorDistance(red, blue);
      expect(distance).toBeGreaterThan(0);
    });

    it('should return small distance for similar colors', () => {
      const red1: RGB = [255, 0, 0];
      const red2: RGB = [250, 5, 5];
      const distance = ColorConverter.colorDistance(red1, red2);
      expect(distance).toBeLessThan(10);
    });

    it('should return large distance for very different colors', () => {
      const black: RGB = [0, 0, 0];
      const white: RGB = [255, 255, 255];
      const distance = ColorConverter.colorDistance(black, white);
      expect(distance).toBeGreaterThan(400);
    });

    it('should be symmetric', () => {
      const color1: RGB = [100, 150, 200];
      const color2: RGB = [50, 75, 100];
      
      const distance1 = ColorConverter.colorDistance(color1, color2);
      const distance2 = ColorConverter.colorDistance(color2, color1);
      
      expect(distance1).toBe(distance2);
    });
  });

  describe('isValidRgb', () => {
    it('should return true for valid RGB', () => {
      expect(ColorConverter.isValidRgb([255, 0, 0])).toBe(true);
      expect(ColorConverter.isValidRgb([0, 0, 0])).toBe(true);
      expect(ColorConverter.isValidRgb([128, 128, 128])).toBe(true);
    });

    it('should return false for invalid RGB (negative values)', () => {
      expect(ColorConverter.isValidRgb([-1, 0, 0])).toBe(false);
    });

    it('should return false for invalid RGB (values > 255)', () => {
      expect(ColorConverter.isValidRgb([256, 0, 0])).toBe(false);
    });

    it('should return false for wrong array length', () => {
      expect(ColorConverter.isValidRgb([255, 0] as any)).toBe(false);
      expect(ColorConverter.isValidRgb([255, 0, 0, 0] as any)).toBe(false);
    });
  });

  describe('isValidHex', () => {
    it('should return true for valid 6-digit hex', () => {
      expect(ColorConverter.isValidHex('#ff0000')).toBe(true);
      expect(ColorConverter.isValidHex('ff0000')).toBe(true);
    });

    it('should return true for valid 3-digit hex', () => {
      expect(ColorConverter.isValidHex('#f00')).toBe(true);
      expect(ColorConverter.isValidHex('f00')).toBe(true);
    });

    it('should return true for uppercase hex', () => {
      expect(ColorConverter.isValidHex('#FF0000')).toBe(true);
    });

    it('should return false for invalid hex characters', () => {
      expect(ColorConverter.isValidHex('#gg0000')).toBe(false);
      expect(ColorConverter.isValidHex('#ff00zz')).toBe(false);
    });

    it('should return false for wrong length', () => {
      expect(ColorConverter.isValidHex('#ff00')).toBe(false);
      expect(ColorConverter.isValidHex('#ff00000')).toBe(false);
    });
  });
});



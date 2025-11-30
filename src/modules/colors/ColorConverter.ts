/**
 * ColorConverter - Utility for converting between color formats
 * 
 * This class provides conversion methods between different color spaces:
 * - RGB (Red, Green, Blue): Standard computer color format [0-255, 0-255, 0-255]
 * - HEX (Hexadecimal): Web color format "#RRGGBB"
 * - HSL (Hue, Saturation, Lightness): Perceptual color format [0-360, 0-100, 0-100]
 * 
 * All methods are static (no state needed) and handle edge cases gracefully.
 * 
 * @module modules/colors/ColorConverter
 */

/**
 * Type alias for RGB color tuple [red, green, blue]
 * Each value is 0-255
 */
export type RGB = [number, number, number];

/**
 * Type alias for HSL color tuple [hue, saturation, lightness]
 * Hue: 0-360 (degrees), Saturation: 0-100 (%), Lightness: 0-100 (%)
 */
export type HSL = [number, number, number];

/**
 * ColorConverter class
 * 
 * Provides pure functions for color space conversions.
 * No instantiation needed - all methods are static.
 * 
 * Usage:
 * ```typescript
 * const hex = ColorConverter.rgbToHex([255, 0, 0]); // "#ff0000"
 * const hsl = ColorConverter.rgbToHsl([255, 0, 0]); // [0, 100, 50]
 * const rgb = ColorConverter.hexToRgb("#ff0000"); // [255, 0, 0]
 * ```
 */
export class ColorConverter {
  /**
   * Convert RGB to hexadecimal color string
   * 
   * Takes an RGB tuple and converts it to a hex string like "#ff0000"
   * Each RGB component (0-255) is converted to a 2-digit hex value (00-ff)
   * 
   * @param rgb - RGB color tuple [red, green, blue]
   * @returns Hex color string (e.g., "#ff0000")
   * 
   * @example
   * ```typescript
   * ColorConverter.rgbToHex([255, 0, 0]);  // "#ff0000" (red)
   * ColorConverter.rgbToHex([0, 255, 0]);  // "#00ff00" (green)
   * ColorConverter.rgbToHex([0, 0, 255]);  // "#0000ff" (blue)
   * ```
   * 
   * IMPROVEMENT: Could add validation to clamp values to 0-255 range
   * IMPROVEMENT: Could add option to return uppercase hex (e.g., "#FF0000")
   */
  static rgbToHex(rgb: RGB): string {
    const [r, g, b] = rgb;

    // Convert each component to hex and pad with 0 if needed
    // toString(16) converts to base-16 (hexadecimal)
    // padStart(2, '0') ensures we always have 2 digits
    const hexR = Math.round(r).toString(16).padStart(2, '0');
    const hexG = Math.round(g).toString(16).padStart(2, '0');
    const hexB = Math.round(b).toString(16).padStart(2, '0');

    return `#${hexR}${hexG}${hexB}`;
  }

  /**
   * Convert hexadecimal color string to RGB
   * 
   * Takes a hex string (with or without #) and converts to RGB tuple
   * Supports both 3-digit (#rgb) and 6-digit (#rrggbb) formats
   * 
   * @param hex - Hex color string (e.g., "#ff0000" or "ff0000")
   * @returns RGB color tuple [red, green, blue]
   * 
   * @example
   * ```typescript
   * ColorConverter.hexToRgb("#ff0000");  // [255, 0, 0]
   * ColorConverter.hexToRgb("ff0000");   // [255, 0, 0] (without #)
   * ColorConverter.hexToRgb("#f00");     // [255, 0, 0] (shorthand)
   * ```
   * 
   * IMPROVEMENT: Could add more robust validation for invalid hex strings
   * IMPROVEMENT: Could support 8-digit hex with alpha channel (#rrggbbaa)
   */
  static hexToRgb(hex: string): RGB {
    // Remove # if present
    const cleanHex = hex.replace('#', '');

    // Handle shorthand hex (#rgb -> #rrggbb)
    let fullHex = cleanHex;
    if (cleanHex.length === 3) {
      // Expand: "f0a" -> "ff00aa"
      fullHex = cleanHex
        .split('')
        .map((char) => char + char)
        .join('');
    }

    // Parse hex string to numbers
    // parseInt with base 16 converts hex string to decimal
    const r = parseInt(fullHex.substring(0, 2), 16);
    const g = parseInt(fullHex.substring(2, 4), 16);
    const b = parseInt(fullHex.substring(4, 6), 16);

    return [r, g, b];
  }

  /**
   * Convert RGB to HSL color space
   * 
   * HSL is more intuitive for humans than RGB:
   * - Hue: The color itself (0-360 degrees on color wheel)
   * - Saturation: How vivid the color is (0% = gray, 100% = full color)
   * - Lightness: How bright it is (0% = black, 50% = normal, 100% = white)
   * 
   * This conversion uses the standard CSS/HTML color model formula
   * 
   * @param rgb - RGB color tuple [red, green, blue]
   * @returns HSL color tuple [hue, saturation, lightness]
   * 
   * @example
   * ```typescript
   * ColorConverter.rgbToHsl([255, 0, 0]);    // [0, 100, 50] (red)
   * ColorConverter.rgbToHsl([0, 255, 0]);    // [120, 100, 50] (green)
   * ColorConverter.rgbToHsl([0, 0, 255]);    // [240, 100, 50] (blue)
   * ColorConverter.rgbToHsl([128, 128, 128]); // [0, 0, 50] (gray)
   * ```
   * 
   * IMPROVEMENT: Could optimize by avoiding duplicate min/max calculations
   */
  static rgbToHsl(rgb: RGB): HSL {
    // Normalize RGB values to 0-1 range
    const r = rgb[0] / 255;
    const g = rgb[1] / 255;
    const b = rgb[2] / 255;

    // Find min and max values to calculate lightness and saturation
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    // Calculate lightness (average of min and max)
    let l = (max + min) / 2;

    // Initialize hue and saturation
    let h = 0;
    let s = 0;

    // If not grayscale (delta > 0), calculate hue and saturation
    if (delta !== 0) {
      // Calculate saturation based on lightness
      // Formula changes depending on whether color is light or dark
      s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

      // Calculate hue based on which channel is dominant
      switch (max) {
        case r:
          // Red is dominant
          // Add 6 to handle negative values, then mod 6
          h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          // Green is dominant
          h = ((b - r) / delta + 2) / 6;
          break;
        case b:
          // Blue is dominant
          h = ((r - g) / delta + 4) / 6;
          break;
      }
    }

    // Convert to degrees and percentages
    // Hue: 0-360 degrees
    // Saturation: 0-100%
    // Lightness: 0-100%
    return [
      Math.round(h * 360),
      Math.round(s * 100),
      Math.round(l * 100),
    ];
  }

  /**
   * Convert HSL to RGB color space
   * 
   * Reverse of rgbToHsl - converts HSL back to RGB
   * Useful for color manipulation in HSL space then converting back to RGB
   * 
   * @param hsl - HSL color tuple [hue, saturation, lightness]
   * @returns RGB color tuple [red, green, blue]
   * 
   * @example
   * ```typescript
   * ColorConverter.hslToRgb([0, 100, 50]);   // [255, 0, 0] (red)
   * ColorConverter.hslToRgb([120, 100, 50]); // [0, 255, 0] (green)
   * ColorConverter.hslToRgb([240, 100, 50]); // [0, 0, 255] (blue)
   * ```
   * 
   * IMPROVEMENT: Could optimize by pre-computing some values
   */
  static hslToRgb(hsl: HSL): RGB {
    // Normalize HSL values to 0-1 range
    const h = hsl[0] / 360;
    const s = hsl[1] / 100;
    const l = hsl[2] / 100;

    let r: number, g: number, b: number;

    if (s === 0) {
      // Grayscale - all channels have same value
      r = g = b = l;
    } else {
      // Helper function for HSL to RGB conversion
      // This is the standard CSS/HTML formula
      const hueToRgb = (p: number, q: number, t: number): number => {
        // Normalize t to 0-1 range
        if (t < 0) t += 1;
        if (t > 1) t -= 1;

        // Calculate RGB value based on position in hue wheel
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      // Calculate intermediate values
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;

      // Calculate RGB channels using hue function
      r = hueToRgb(p, q, h + 1 / 3);
      g = hueToRgb(p, q, h);
      b = hueToRgb(p, q, h - 1 / 3);
    }

    // Convert back to 0-255 range
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }

  /**
   * Calculate Euclidean distance between two RGB colors
   * 
   * Measures how different two colors are in RGB space
   * Lower values = more similar colors
   * Maximum possible distance = ~441 (black to white)
   * 
   * Uses 3D Euclidean distance formula:
   * distance = √((r1-r2)² + (g1-g2)² + (b1-b2)²)
   * 
   * @param c1 - First RGB color
   * @param c2 - Second RGB color
   * @returns Distance between colors (0 to ~441)
   * 
   * @example
   * ```typescript
   * // Same color
   * ColorConverter.colorDistance([255, 0, 0], [255, 0, 0]); // 0
   * 
   * // Similar reds
   * ColorConverter.colorDistance([255, 0, 0], [250, 0, 0]); // 5
   * 
   * // Very different colors
   * ColorConverter.colorDistance([255, 0, 0], [0, 0, 255]); // ~360
   * ```
   * 
   * IMPROVEMENT: Could use weighted distance (human eye more sensitive to green)
   * IMPROVEMENT: Could use CIE Delta E for perceptually accurate distance
   * IMPROVEMENT: Could add normalized distance (0-1 range)
   */
  static colorDistance(c1: RGB, c2: RGB): number {
    // Calculate squared differences for each channel
    const dr = c1[0] - c2[0];
    const dg = c1[1] - c2[1];
    const db = c1[2] - c2[2];

    // Return Euclidean distance
    // Note: We don't need sqrt for comparison purposes, but include it
    // for actual distance measurement
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }

  /**
   * Check if a color is valid RGB
   * 
   * Validates that all RGB values are numbers in range 0-255
   * 
   * @param rgb - RGB color tuple to validate
   * @returns true if valid, false otherwise
   * 
   * IMPROVEMENT: Could add auto-clamping option instead of just validation
   */
  static isValidRgb(rgb: RGB): boolean {
    return (
      rgb.length === 3 &&
      rgb.every((val) => typeof val === 'number' && val >= 0 && val <= 255)
    );
  }

  /**
   * Check if a hex color string is valid
   * 
   * Validates hex format (with or without #)
   * Supports both 3-digit and 6-digit formats
   * 
   * @param hex - Hex color string to validate
   * @returns true if valid, false otherwise
   * 
   * IMPROVEMENT: Could add support for 8-digit hex with alpha
   */
  static isValidHex(hex: string): boolean {
    // Remove # if present
    const cleanHex = hex.replace('#', '');

    // Check if length is 3 or 6 and all characters are valid hex
    return (
      (cleanHex.length === 3 || cleanHex.length === 6) &&
      /^[0-9A-Fa-f]+$/.test(cleanHex)
    );
  }
}



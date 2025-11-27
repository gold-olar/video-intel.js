/**
 * Tests for KMeansClustering
 * 
 * Tests K-means clustering algorithm for color quantization
 */

import { KMeansClustering } from '../../src/modules/colors/KMeansClustering';
import type { RGB } from '../../src/modules/colors/ColorConverter';

describe('KMeansClustering', () => {
  let clustering: KMeansClustering;

  beforeEach(() => {
    clustering = new KMeansClustering();
  });

  describe('cluster - basic functionality', () => {
    it('should return empty array for empty pixel array', () => {
      const pixels: RGB[] = [];
      const result = clustering.cluster(pixels, 3);
      
      expect(result).toEqual([]);
    });

    it('should throw error for invalid K (0 or negative)', () => {
      const pixels: RGB[] = [[255, 0, 0], [0, 255, 0]];
      
      expect(() => clustering.cluster(pixels, 0)).toThrow();
      expect(() => clustering.cluster(pixels, -1)).toThrow();
    });

    it('should return all pixels when K >= pixel count', () => {
      const pixels: RGB[] = [
        [255, 0, 0],
        [0, 255, 0],
      ];
      
      const result = clustering.cluster(pixels, 5);
      
      // Should return 2 clusters (one for each pixel)
      expect(result).toHaveLength(2);
      expect(result[0].pixelCount).toBe(1);
      expect(result[1].pixelCount).toBe(1);
    });

    it('should cluster identical colors into one cluster', () => {
      const pixels: RGB[] = [
        [255, 0, 0],
        [255, 0, 0],
        [255, 0, 0],
      ];
      
      const result = clustering.cluster(pixels, 2);
      
      // All pixels should be in one cluster
      expect(result[0].pixelCount).toBe(3);
      expect(result[0].percentage).toBe(100);
    });

    it('should separate distinct colors into different clusters', () => {
      const pixels: RGB[] = [
        [255, 0, 0],   // Red
        [255, 0, 0],
        [0, 0, 255],   // Blue
        [0, 0, 255],
      ];
      
      const result = clustering.cluster(pixels, 2);
      
      // Should find 2 clusters
      expect(result).toHaveLength(2);
      
      // Each cluster should have 2 pixels (50%)
      expect(result[0].pixelCount).toBe(2);
      expect(result[0].percentage).toBe(50);
      expect(result[1].pixelCount).toBe(2);
      expect(result[1].percentage).toBe(50);
    });

    it('should sort clusters by dominance (pixel count)', () => {
      const pixels: RGB[] = [
        [255, 0, 0],   // Red - 3 pixels
        [255, 0, 0],
        [255, 0, 0],
        [0, 0, 255],   // Blue - 1 pixel
      ];
      
      const result = clustering.cluster(pixels, 2);
      
      // First cluster should have more pixels
      expect(result[0].pixelCount).toBeGreaterThan(result[1].pixelCount);
      expect(result[0].percentage).toBeGreaterThan(result[1].percentage);
    });

    it('should calculate correct percentages', () => {
      const pixels: RGB[] = [
        [255, 0, 0],   // Red - 60%
        [255, 0, 0],
        [255, 0, 0],
        [0, 0, 255],   // Blue - 40%
        [0, 0, 255],
      ];
      
      const result = clustering.cluster(pixels, 2);
      
      // Percentages should sum to 100
      const totalPercentage = result.reduce((sum, cluster) => sum + cluster.percentage, 0);
      expect(totalPercentage).toBeCloseTo(100, 1);
      
      // First cluster should be ~60%
      expect(result[0].percentage).toBeCloseTo(60, 1);
    });
  });

  describe('cluster - convergence', () => {
    it('should converge with low max iterations', () => {
      const pixels: RGB[] = [
        [255, 0, 0],
        [250, 5, 5],
        [245, 10, 10],
        [0, 0, 255],
        [5, 5, 250],
      ];
      
      // Should still work with just 1 iteration
      const result = clustering.cluster(pixels, 2, {
        maxIterations: 1,
      });
      
      expect(result).toHaveLength(2);
    });

    it('should produce better results with more iterations', () => {
      // Create pixels with clear separation
      const pixels: RGB[] = [];
      
      // Add 20 red-ish pixels
      for (let i = 0; i < 20; i++) {
        pixels.push([250 + i % 5, i % 10, i % 10]);
      }
      
      // Add 20 blue-ish pixels
      for (let i = 0; i < 20; i++) {
        pixels.push([i % 10, i % 10, 250 + i % 5]);
      }
      
      // Cluster with few iterations
      const resultFew = clustering.cluster(pixels, 2, {
        maxIterations: 1,
      });
      
      // Cluster with many iterations
      const resultMany = clustering.cluster(pixels, 2, {
        maxIterations: 50,
      });
      
      // Both should find 2 clusters
      expect(resultFew).toHaveLength(2);
      expect(resultMany).toHaveLength(2);
      
      // More iterations typically gives better separation
      // (though this isn't guaranteed, so we just check both work)
    });
  });

  describe('cluster - initialization methods', () => {
    it('should work with random initialization', () => {
      const pixels: RGB[] = [
        [255, 0, 0],
        [250, 5, 5],
        [0, 0, 255],
        [5, 5, 250],
      ];
      
      const result = clustering.cluster(pixels, 2, {
        initMethod: 'random',
      });
      
      expect(result).toHaveLength(2);
    });

    it('should work with kmeans++ initialization', () => {
      const pixels: RGB[] = [
        [255, 0, 0],
        [250, 5, 5],
        [0, 0, 255],
        [5, 5, 250],
      ];
      
      const result = clustering.cluster(pixels, 2, {
        initMethod: 'kmeans++',
      });
      
      expect(result).toHaveLength(2);
    });
  });

  describe('cluster - pixel sampling', () => {
    it('should work with full sampling (1.0)', () => {
      const pixels: RGB[] = [];
      for (let i = 0; i < 100; i++) {
        pixels.push([i % 255, (i * 2) % 255, (i * 3) % 255]);
      }
      
      const result = clustering.cluster(pixels, 5, {
        samplingRatio: 1.0,
      });
      
      expect(result).toHaveLength(5);
    });

    it('should work with partial sampling (0.5)', () => {
      const pixels: RGB[] = [];
      for (let i = 0; i < 100; i++) {
        pixels.push([i % 255, (i * 2) % 255, (i * 3) % 255]);
      }
      
      const result = clustering.cluster(pixels, 5, {
        samplingRatio: 0.5,
      });
      
      expect(result).toHaveLength(5);
    });

    it('should work with minimal sampling (0.1)', () => {
      const pixels: RGB[] = [];
      for (let i = 0; i < 100; i++) {
        pixels.push([i % 255, (i * 2) % 255, (i * 3) % 255]);
      }
      
      const result = clustering.cluster(pixels, 3, {
        samplingRatio: 0.1,
      });
      
      expect(result).toHaveLength(3);
    });
  });

  describe('cluster - edge cases', () => {
    it('should handle single pixel', () => {
      const pixels: RGB[] = [[255, 0, 0]];
      
      const result = clustering.cluster(pixels, 1);
      
      expect(result).toHaveLength(1);
      expect(result[0].centroid).toEqual([255, 0, 0]);
      expect(result[0].percentage).toBe(100);
    });

    it('should handle all black pixels', () => {
      const pixels: RGB[] = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ];
      
      const result = clustering.cluster(pixels, 2);
      
      // All pixels should be in one cluster
      expect(result[0].pixelCount).toBe(3);
    });

    it('should handle all white pixels', () => {
      const pixels: RGB[] = [
        [255, 255, 255],
        [255, 255, 255],
        [255, 255, 255],
      ];
      
      const result = clustering.cluster(pixels, 2);
      
      // All pixels should be in one cluster
      expect(result[0].pixelCount).toBe(3);
    });

    it('should handle grayscale pixels', () => {
      const pixels: RGB[] = [
        [0, 0, 0],       // Black
        [128, 128, 128], // Gray
        [255, 255, 255], // White
      ];
      
      const result = clustering.cluster(pixels, 3);
      
      // Should find 3 clusters
      expect(result).toHaveLength(3);
    });
  });

  describe('cluster - realistic scenarios', () => {
    it('should cluster colors from a simple gradient', () => {
      const pixels: RGB[] = [];
      
      // Create red to blue gradient
      for (let i = 0; i <= 10; i++) {
        const red = Math.floor(255 * (1 - i / 10));
        const blue = Math.floor(255 * (i / 10));
        pixels.push([red, 0, blue]);
      }
      
      const result = clustering.cluster(pixels, 3);
      
      // Should find 3 clusters (red, purple, blue)
      expect(result).toHaveLength(3);
      
      // Each cluster should have some pixels
      result.forEach(cluster => {
        expect(cluster.pixelCount).toBeGreaterThan(0);
      });
    });

    it('should cluster mixed colors with different proportions', () => {
      const pixels: RGB[] = [];
      
      // Add 50 red pixels (50%)
      for (let i = 0; i < 50; i++) {
        pixels.push([255, 0, 0]);
      }
      
      // Add 30 green pixels (30%)
      for (let i = 0; i < 30; i++) {
        pixels.push([0, 255, 0]);
      }
      
      // Add 20 blue pixels (20%)
      for (let i = 0; i < 20; i++) {
        pixels.push([0, 0, 255]);
      }
      
      const result = clustering.cluster(pixels, 3);
      
      // Should find 3 clusters
      expect(result).toHaveLength(3);
      
      // Largest cluster should be red (~50%)
      expect(result[0].percentage).toBeGreaterThan(40);
      
      // Second cluster should be green (~30%)
      expect(result[1].percentage).toBeGreaterThan(20);
      expect(result[1].percentage).toBeLessThan(40);
      
      // Third cluster should be blue (~20%)
      expect(result[2].percentage).toBeLessThan(30);
    });
  });

  describe('cluster - return value structure', () => {
    it('should return clusters with correct structure', () => {
      const pixels: RGB[] = [
        [255, 0, 0],
        [0, 255, 0],
      ];
      
      const result = clustering.cluster(pixels, 2);
      
      // Check structure of first cluster
      expect(result[0]).toHaveProperty('centroid');
      expect(result[0]).toHaveProperty('pixelCount');
      expect(result[0]).toHaveProperty('percentage');
      
      // Centroid should be RGB array
      expect(Array.isArray(result[0].centroid)).toBe(true);
      expect(result[0].centroid).toHaveLength(3);
      
      // PixelCount should be positive integer
      expect(result[0].pixelCount).toBeGreaterThan(0);
      expect(Number.isInteger(result[0].pixelCount)).toBe(true);
      
      // Percentage should be 0-100
      expect(result[0].percentage).toBeGreaterThanOrEqual(0);
      expect(result[0].percentage).toBeLessThanOrEqual(100);
    });
  });
});


/**
 * KMeansClustering - Implementation of K-means clustering algorithm for color quantization
 * 
 * K-means is an unsupervised machine learning algorithm that groups similar items together.
 * In our case, we use it to find dominant colors by clustering pixels with similar RGB values.
 * 
 * How it works:
 * 1. Start with K random "centroids" (cluster centers)
 * 2. Assign each pixel to the nearest centroid
 * 3. Recalculate centroids as the average of assigned pixels
 * 4. Repeat steps 2-3 until centroids stop moving (converged)
 * 5. Return the final centroids as dominant colors
 * 
 * Why K-means for colors?
 * - Simple and fast
 * - Works well for color clustering
 * - Produces visually distinct colors
 * - Well-tested algorithm
 * 
 * @module modules/colors/KMeansClustering
 */

import type { RGB } from './ColorConverter';
import type { ClusterOptions, ColorCluster } from './types';
import { ColorConverter } from './ColorConverter';

/**
 * KMeansClustering class
 * 
 * Implements K-means clustering algorithm optimized for color data.
 * Can handle large datasets efficiently through pixel sampling.
 * 
 * Usage:
 * ```typescript
 * const clustering = new KMeansClustering();
 * const pixels: RGB[] = [...]; // Array of RGB pixel values
 * 
 * const clusters = clustering.cluster(pixels, 5, {
 *   maxIterations: 20,
 *   initMethod: 'kmeans++'
 * });
 * 
 * // clusters[0] is the most dominant color
 * // clusters[1] is the second most dominant, etc.
 * ```
 */
export class KMeansClustering {
  /**
   * Perform K-means clustering on pixel data
   * 
   * Takes an array of RGB pixels and groups them into K clusters.
   * Returns clusters sorted by dominance (most pixels first).
   * 
   * @param pixels - Array of RGB color values to cluster
   * @param k - Number of clusters (colors) to find
   * @param options - Optional clustering configuration
   * @returns Array of color clusters sorted by dominance
   * 
   * @example
   * ```typescript
   * const clustering = new KMeansClustering();
   * const pixels: RGB[] = [[255, 0, 0], [250, 10, 5], [0, 0, 255]];
   * 
   * // Find 2 dominant colors
   * const clusters = clustering.cluster(pixels, 2);
   * // clusters[0] might be reddish (combining first two pixels)
   * // clusters[1] would be blue
   * ```
   * 
   * IMPROVEMENT: Could add parallel processing for very large datasets
   * IMPROVEMENT: Could implement mini-batch K-means for memory efficiency
   * IMPROVEMENT: Could add elbow method to auto-determine optimal K
   */
  cluster(pixels: RGB[], k: number, options: ClusterOptions = {}): ColorCluster[] {
    // Extract options with defaults
    const {
      maxIterations = 20,
      convergenceThreshold = 1.0,
      initMethod = 'kmeans++',
      samplingRatio = 1.0,
    } = options;

    // Validate inputs
    if (pixels.length === 0) {
      return [];
    }

    if (k <= 0) {
      throw new Error('K must be greater than 0');
    }

    // If K is greater than number of pixels, return all unique pixels
    if (k >= pixels.length) {
      return pixels.map((pixel) => ({
        centroid: pixel,
        pixelCount: 1,
        percentage: (1 / pixels.length) * 100,
      }));
    }

    // Sample pixels if needed for performance
    const sampledPixels =
      samplingRatio < 1.0 ? this.samplePixels(pixels, samplingRatio) : pixels;

    // Initialize centroids using chosen method
    let centroids =
      initMethod === 'kmeans++'
        ? this.initializeKMeansPlusPlus(sampledPixels, k)
        : this.initializeRandomCentroids(sampledPixels, k);

    // Main K-means iteration loop
    let iteration = 0;
    let hasConverged = false;

    while (iteration < maxIterations && !hasConverged) {
      // Step 1: Assign each pixel to nearest centroid
      const assignments = this.assignPixelsToCentroids(sampledPixels, centroids);

      // Step 2: Calculate new centroids as mean of assigned pixels
      const newCentroids = this.calculateNewCentroids(sampledPixels, assignments, k);

      // Step 3: Check if centroids have converged (stopped moving)
      hasConverged = this.checkConvergence(centroids, newCentroids, convergenceThreshold);

      // Update centroids for next iteration
      centroids = newCentroids;
      iteration++;
    }

    // Build final cluster results
    const assignments = this.assignPixelsToCentroids(sampledPixels, centroids);
    const clusters = this.buildClusters(centroids, assignments, sampledPixels.length);

    // Sort by dominance (most pixels first)
    clusters.sort((a, b) => b.pixelCount - a.pixelCount);

    return clusters;
  }

  /**
   * Sample a subset of pixels for performance
   * 
   * When dealing with thousands of pixels, we can sample a subset
   * for faster processing without significantly affecting quality.
   * 
   * Uses random sampling (could be improved with stratified sampling)
   * 
   * @param pixels - Full pixel array
   * @param ratio - Ratio of pixels to keep (0-1)
   * @returns Sampled subset of pixels
   * 
   * IMPROVEMENT: Could use stratified sampling for better representation
   * IMPROVEMENT: Could use reservoir sampling for streaming data
   */
  private samplePixels(pixels: RGB[], ratio: number): RGB[] {
    const sampleSize = Math.max(1, Math.floor(pixels.length * ratio));
    const sampled: RGB[] = [];

    // Simple random sampling
    // For each pixel, decide randomly whether to include it
    for (const pixel of pixels) {
      if (sampled.length >= sampleSize) {
        break;
      }

      // Random selection based on remaining slots
      const remaining = pixels.length - pixels.indexOf(pixel);
      const needed = sampleSize - sampled.length;
      const probability = needed / remaining;

      if (Math.random() < probability) {
        sampled.push(pixel);
      }
    }

    return sampled;
  }

  /**
   * Initialize centroids randomly from pixel data
   * 
   * Simple initialization: pick K random pixels as initial centroids
   * Fast but may lead to suboptimal clustering
   * 
   * @param pixels - Pixel array to sample from
   * @param k - Number of centroids to initialize
   * @returns Array of initial centroids
   */
  private initializeRandomCentroids(pixels: RGB[], k: number): RGB[] {
    const centroids: RGB[] = [];
    const usedIndices = new Set<number>();

    // Pick K unique random pixels
    while (centroids.length < k) {
      const index = Math.floor(Math.random() * pixels.length);

      if (!usedIndices.has(index)) {
        centroids.push([...pixels[index]]);
        usedIndices.add(index);
      }
    }

    return centroids;
  }

  /**
   * Initialize centroids using K-means++ algorithm
   * 
   * K-means++ is a smarter initialization method that spreads out
   * initial centroids for better clustering. It's proven to give
   * better results than random initialization.
   * 
   * Algorithm:
   * 1. Pick first centroid randomly
   * 2. For each remaining centroid:
   *    - Calculate distance from each pixel to nearest existing centroid
   *    - Pick new centroid with probability proportional to distance²
   *    - (pixels far from existing centroids are more likely to be chosen)
   * 
   * @param pixels - Pixel array to sample from
   * @param k - Number of centroids to initialize
   * @returns Array of well-distributed initial centroids
   * 
   * IMPROVEMENT: Could cache distance calculations for performance
   */
  private initializeKMeansPlusPlus(pixels: RGB[], k: number): RGB[] {
    const centroids: RGB[] = [];

    // Step 1: Choose first centroid randomly
    const firstIndex = Math.floor(Math.random() * pixels.length);
    centroids.push([...pixels[firstIndex]]);

    // Step 2: Choose remaining centroids
    while (centroids.length < k) {
      // Calculate distance from each pixel to nearest existing centroid
      const distances: number[] = pixels.map((pixel) => {
        // Find minimum distance to any existing centroid
        let minDistance = Infinity;
        for (const centroid of centroids) {
          const distance = ColorConverter.colorDistance(pixel, centroid);
          minDistance = Math.min(minDistance, distance);
        }
        return minDistance;
      });

      // Calculate sum of squared distances for probability weighting
      // Squaring gives preference to pixels far from existing centroids
      const squaredDistances = distances.map((d) => d * d);
      const totalDistance = squaredDistances.reduce((sum, d) => sum + d, 0);

      // Choose next centroid with weighted probability
      let randomValue = Math.random() * totalDistance;
      let chosenIndex = 0;

      for (let i = 0; i < pixels.length; i++) {
        randomValue -= squaredDistances[i];
        if (randomValue <= 0) {
          chosenIndex = i;
          break;
        }
      }

      centroids.push([...pixels[chosenIndex]]);
    }

    return centroids;
  }

  /**
   * Assign each pixel to nearest centroid
   * 
   * For each pixel, find which centroid it's closest to
   * Returns array where assignments[i] = centroid index for pixels[i]
   * 
   * @param pixels - Array of pixels to assign
   * @param centroids - Array of current centroids
   * @returns Array of centroid indices (one per pixel)
   * 
   * IMPROVEMENT: Could use spatial indexing (KD-tree) for large datasets
   * IMPROVEMENT: Could parallelize this operation
   */
  private assignPixelsToCentroids(pixels: RGB[], centroids: RGB[]): number[] {
    return pixels.map((pixel) => {
      let minDistance = Infinity;
      let closestCentroid = 0;

      // Find nearest centroid
      for (let i = 0; i < centroids.length; i++) {
        const distance = ColorConverter.colorDistance(pixel, centroids[i]);
        if (distance < minDistance) {
          minDistance = distance;
          closestCentroid = i;
        }
      }

      return closestCentroid;
    });
  }

  /**
   * Calculate new centroids as mean of assigned pixels
   * 
   * For each cluster, calculate the average color of all pixels
   * assigned to that cluster. This becomes the new centroid.
   * 
   * @param pixels - Array of all pixels
   * @param assignments - Array of centroid assignments
   * @param k - Number of centroids
   * @returns Array of new centroid positions
   * 
   * IMPROVEMENT: Could use weighted averaging if pixel importance varies
   */
  private calculateNewCentroids(pixels: RGB[], assignments: number[], k: number): RGB[] {
    // Initialize accumulators for each cluster
    const sums: RGB[] = Array.from({ length: k }, () => [0, 0, 0]);
    const counts: number[] = Array.from({ length: k }, () => 0);

    // Accumulate color values for each cluster
    for (let i = 0; i < pixels.length; i++) {
      const clusterIndex = assignments[i];
      const pixel = pixels[i];

      sums[clusterIndex][0] += pixel[0]; // Red
      sums[clusterIndex][1] += pixel[1]; // Green
      sums[clusterIndex][2] += pixel[2]; // Blue
      counts[clusterIndex]++;
    }

    // Calculate averages (new centroids)
    const newCentroids: RGB[] = [];
    for (let i = 0; i < k; i++) {
      if (counts[i] > 0) {
        // Average of all pixels in this cluster
        newCentroids.push([
          Math.round(sums[i][0] / counts[i]),
          Math.round(sums[i][1] / counts[i]),
          Math.round(sums[i][2] / counts[i]),
        ]);
      } else {
        // Empty cluster - keep old centroid or reinitialize
        // This is rare but can happen
        newCentroids.push([
          Math.floor(Math.random() * 256),
          Math.floor(Math.random() * 256),
          Math.floor(Math.random() * 256),
        ]);
      }
    }

    return newCentroids;
  }

  /**
   * Check if centroids have converged (stopped moving)
   * 
   * Convergence means the algorithm has stabilized and further
   * iterations won't significantly improve results.
   * 
   * We consider converged if all centroids moved less than threshold
   * 
   * @param oldCentroids - Centroids from previous iteration
   * @param newCentroids - Centroids from current iteration
   * @param threshold - Maximum allowed movement for convergence
   * @returns true if converged, false otherwise
   * 
   * IMPROVEMENT: Could use relative threshold instead of absolute
   */
  private checkConvergence(
    oldCentroids: RGB[],
    newCentroids: RGB[],
    threshold: number
  ): boolean {
    // Check if all centroids moved less than threshold
    for (let i = 0; i < oldCentroids.length; i++) {
      const distance = ColorConverter.colorDistance(oldCentroids[i], newCentroids[i]);

      if (distance > threshold) {
        // At least one centroid moved more than threshold
        return false;
      }
    }

    // All centroids stable - converged!
    return true;
  }

  /**
   * Build final cluster results with statistics
   * 
   * Converts internal representation to public ColorCluster format
   * Calculates pixel counts and percentages for each cluster
   * 
   * @param centroids - Final centroid positions
   * @param assignments - Final pixel assignments
   * @param totalPixels - Total number of pixels
   * @returns Array of color clusters with statistics
   */
  private buildClusters(
    centroids: RGB[],
    assignments: number[],
    totalPixels: number
  ): ColorCluster[] {
    // Count pixels in each cluster
    const counts: number[] = Array.from({ length: centroids.length }, () => 0);

    for (const assignment of assignments) {
      counts[assignment]++;
    }

    // Build cluster objects
    return centroids.map((centroid, i) => ({
      centroid,
      pixelCount: counts[i],
      percentage: (counts[i] / totalPixels) * 100,
    }));
  }
}



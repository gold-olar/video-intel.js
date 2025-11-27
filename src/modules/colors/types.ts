/**
 * Internal types for the colors module
 * 
 * These types are used internally by the color extraction system
 * and are not exported to the main API (those are in src/types/index.ts)
 */

import type { RGB } from './ColorConverter';

/**
 * Options for K-means clustering algorithm
 * 
 * Controls how the clustering algorithm behaves
 */
export interface ClusterOptions {
  /**
   * Maximum number of iterations before stopping
   * Higher = more accurate but slower
   * Default: 20
   * 
   * IMPROVEMENT: Could make this adaptive based on convergence rate
   */
  maxIterations?: number;

  /**
   * Threshold for convergence detection
   * If centroids move less than this distance, we consider it converged
   * Lower = stricter convergence, more iterations
   * Default: 1.0 (1 color unit of movement)
   * 
   * IMPROVEMENT: Could make this relative to color space size
   */
  convergenceThreshold?: number;

  /**
   * Method for initializing cluster centroids
   * - 'random': Random pixels from the dataset (fast but less accurate)
   * - 'kmeans++': Smart initialization for better clustering (slower but better)
   * Default: 'kmeans++'
   * 
   * IMPROVEMENT: Could add 'grid' method for evenly distributed initial centroids
   */
  initMethod?: 'random' | 'kmeans++';

  /**
   * Ratio of pixels to use (0-1)
   * For performance, we can sample a subset of pixels
   * 1.0 = use all pixels
   * 0.1 = use 10% of pixels
   * Default: 1.0
   * 
   * IMPROVEMENT: Could use stratified sampling for better representation
   */
  samplingRatio?: number;
}

/**
 * Result of clustering - a group of similar colors
 * 
 * Represents one cluster from K-means algorithm
 */
export interface ColorCluster {
  /**
   * Center of the cluster (average color of all pixels in cluster)
   * This is the "dominant color" we're interested in
   */
  centroid: RGB;

  /**
   * Number of pixels assigned to this cluster
   * Used to calculate percentage dominance
   */
  pixelCount: number;

  /**
   * Percentage of total pixels in this cluster (0-100)
   * Indicates how dominant this color is in the video
   */
  percentage: number;
}

/**
 * Internal representation of pixel data during extraction
 * 
 * This is used during the color extraction process before
 * conversion to the final Color type
 * 
 * IMPROVEMENT: Could add position information for spatial color analysis
 */
export interface PixelData {
  /** RGB color value */
  rgb: RGB;

  /** Optional frame index this pixel came from */
  frameIndex?: number;
}


/**
 * Colors module - Extract dominant colors from videos
 * 
 * This module provides functionality to extract and analyze dominant colors
 * from video content using K-means clustering.
 * 
 * Main exports:
 * - ColorExtractor: Main class for color extraction
 * - KMeansClustering: K-means clustering algorithm
 * - ColorConverter: Color format conversion utilities
 * 
 * @module modules/colors
 */

// Main classes
export { ColorExtractor } from './ColorExtractor';
export { KMeansClustering } from './KMeansClustering';
export { ColorConverter } from './ColorConverter';

// Types
export type { RGB, HSL } from './ColorConverter';
export type { ClusterOptions, ColorCluster, PixelData } from './types';


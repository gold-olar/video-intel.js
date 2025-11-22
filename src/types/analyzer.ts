/**
 * Type definitions for Frame Analyzer
 * 
 * This file contains all TypeScript types and interfaces used by the FrameAnalyzer
 * abstract class and its implementations.
 * 
 * @module types/analyzer
 */

/**
 * Base interface for all frame analysis results.
 * All concrete analyzers should extend this interface with their specific result types.
 * 
 * @example
 * interface ThumbnailAnalysisResult extends FrameAnalysisResult {
 *   qualityScore: number;
 *   hasFeatures: boolean;
 * }
 */
export interface FrameAnalysisResult {
  /** Optional quality or confidence score (0-1 range) */
  score?: number;

  /** Optional timestamp in video (in seconds) */
  timestamp?: number;

  /** Flexible metadata object for storing additional analysis data */
  metadata?: Record<string, unknown>;
}

/**
 * Comprehensive statistics about a video frame.
 * These are commonly used metrics across different analysis types.
 * 
 * All values are normalized to 0-1 range for consistency.
 */
export interface FrameStatistics {
  /** Average brightness (0 = black, 1 = white) */
  brightness: number;

  /** Contrast level (0 = no contrast, 1 = high contrast) */
  contrast: number;

  /** Sharpness/focus quality (0 = very blurry, 1 = very sharp) */
  sharpness: number;

  /** Color variance/diversity (0 = monochrome, 1 = highly diverse colors) */
  colorVariance: number;

  /** True if frame is predominantly black */
  isBlackFrame: boolean;

  /** True if frame is predominantly white/overexposed */
  isWhiteFrame: boolean;

  /** True if frame appears blurry/out of focus */
  isBlurry: boolean;
}

/**
 * Configuration options for frame analyzers.
 * These options control caching, validation, and performance tracking.
 */
export interface FrameAnalyzerOptions {
  /**
   * Enable result caching to avoid re-analyzing the same frame.
   * Default: false
   * 
   * IMPROVEMENT: Could add cache expiration time or max cache size
   */
  cache?: boolean;

  /**
   * Skip frame validation checks for better performance.
   * Only use this if you're certain the frames are valid.
   * Default: false
   */
  skipValidation?: boolean;

  /**
   * Track performance metrics for each analysis operation.
   * Useful for debugging and optimization.
   * Default: false
   */
  trackPerformance?: boolean;

  /**
   * Maximum number of items to store in cache.
   * Prevents memory issues with large video analysis.
   * Default: 100
   * 
   * IMPROVEMENT: Could implement LRU (Least Recently Used) eviction strategy
   */
  maxCacheSize?: number;

  /**
   * Scale factor for downsampling frames before analysis (0-1).
   * Lower values = faster but less accurate.
   * 1.0 = full resolution, 0.5 = half resolution
   * Default: 1.0
   * 
   * IMPROVEMENT: Auto-scaling based on frame size could be implemented
   */
  analysisScale?: number;
}

/**
 * Performance metrics for a single analysis operation.
 * Useful for identifying bottlenecks and optimizing performance.
 */
export interface AnalysisPerformance {
  /** Operation identifier (e.g., 'calculateBrightness', 'analyze') */
  operation: string;

  /** Start timestamp in milliseconds */
  startTime: number;

  /** End timestamp in milliseconds */
  endTime: number;

  /** Duration in milliseconds */
  duration: number;

  /** Number of pixels or operations processed */
  operationsCount?: number;

  /**
   * IMPROVEMENT: Could add memory usage tracking
   * memoryUsed?: number;
   */
}

/**
 * Thresholds for frame quality detection.
 * These values determine what constitutes a "black", "white", or "blurry" frame.
 * 
 * All values are in 0-1 range to match normalized statistics.
 */
export interface FrameQualityThresholds {
  /** Brightness threshold below which a frame is considered black (default: 0.1) */
  blackFrameThreshold: number;

  /** Brightness threshold above which a frame is considered white (default: 0.9) */
  whiteFrameThreshold: number;

  /** Sharpness threshold below which a frame is considered blurry (default: 0.3) */
  blurThreshold: number;

  /**
   * IMPROVEMENT: Could add more thresholds:
   * - lowContrastThreshold: for detecting flat/boring frames
   * - lowColorVarianceThreshold: for detecting monochrome frames
   * - motionBlurThreshold: for detecting motion blur specifically
   */
}

/**
 * Error codes specific to frame analysis operations.
 * Extends the base VideoIntelError with analyzer-specific codes.
 */
export enum FrameAnalyzerErrorCode {
  INVALID_FRAME = 'INVALID_FRAME',
  EXTRACTION_ERROR = 'EXTRACTION_ERROR',
  ANALYSIS_ERROR = 'ANALYSIS_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}


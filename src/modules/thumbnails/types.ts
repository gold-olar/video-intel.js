/**
 * Type definitions for Thumbnail generation module
 * 
 * This file contains TypeScript types specific to the thumbnail generation
 * and frame scoring functionality.
 * 
 * @module modules/thumbnails/types
 */

import type { FrameAnalysisResult, FrameStatistics } from '../../types/analyzer';

/**
 * Result of frame scoring operation.
 * Extends FrameAnalysisResult with detailed scoring breakdown.
 * 
 * The overall score is calculated as a weighted combination of:
 * - Sharpness (40%): How in-focus the frame is
 * - Brightness quality (30%): How well-lit (not too dark/bright)
 * - Color variance (30%): How colorful/diverse the frame is
 */
export interface FrameScore extends FrameAnalysisResult {
  /** 
   * Overall quality score (0-1).
   * Higher scores indicate better frames for thumbnails.
   * Typically scores > 0.7 are excellent, 0.5-0.7 are good, < 0.5 are poor.
   */
  score: number;

  /** 
   * Detailed breakdown of all frame statistics.
   * Includes brightness, contrast, sharpness, color variance, and quality flags.
   */
  statistics: FrameStatistics;

  /** 
   * Individual component scores before weighting.
   * Useful for debugging and understanding why a frame scored high/low.
   */
  components: {
    /** Raw sharpness score (0-1) */
    sharpness: number;
    /** Raw brightness quality score (0-1) */
    brightness: number;
    /** Raw color variance score (0-1) */
    colorVariance: number;
  };

  /** 
   * Indicates if this frame is suitable for use as a thumbnail.
   * False for black frames, white frames, or very blurry frames.
   */
  isUsable: boolean;

  /**
   * Human-readable reasons why frame may not be usable.
   * Empty array if frame is usable.
   * 
   * Examples:
   * - "Frame is predominantly black"
   * - "Frame is out of focus (blurry)"
   * - "Frame is overexposed (too bright)"
   */
  issues: string[];
}

/**
 * Configurable weights for frame scoring components.
 * All weights should sum to 1.0 for proper normalization.
 * 
 * Default weights prioritize sharpness since blurry thumbnails
 * look unprofessional, followed by brightness and color diversity.
 */
export interface ScoringWeights {
  /** Weight for sharpness (default: 0.4 = 40%) */
  sharpness: number;

  /** Weight for brightness quality (default: 0.3 = 30%) */
  brightness: number;

  /** Weight for color variance (default: 0.3 = 30%) */
  colorVariance: number;
}

/**
 * Options for configuring the FrameScorer behavior.
 * Extends base analyzer options with scoring-specific settings.
 */
export interface FrameScorerOptions {
  /**
   * Custom weights for scoring components.
   * If not provided, uses default balanced weights.
   * 
   * IMPROVEMENT: Could add presets like 'sharpness-focused', 'color-focused', etc.
   */
  weights?: Partial<ScoringWeights>;

  /**
   * Strict mode rejects more frames (higher quality threshold).
   * When true, only frames with score > 0.6 are considered usable.
   * When false, frames with score > 0.4 are considered usable.
   * Default: false
   * 
   * Use strict mode when you need very high-quality thumbnails
   * and have many frames to choose from.
   */
  strictMode?: boolean;

  /**
   * Custom threshold for black frame detection (0-1).
   * Overrides the default threshold from FrameAnalyzer.
   * Default: 0.1 (10% brightness)
   */
  blackFrameThreshold?: number;

  /**
   * Custom threshold for white frame detection (0-1).
   * Overrides the default threshold from FrameAnalyzer.
   * Default: 0.9 (90% brightness)
   */
  whiteFrameThreshold?: number;

  /**
   * Custom threshold for blur detection (0-1).
   * Overrides the default threshold from FrameAnalyzer.
   * Default: 0.3 (30% sharpness)
   * 
   * IMPROVEMENT: Could add separate thresholds for different blur types
   * (motion blur vs out-of-focus blur)
   */
  blurThreshold?: number;
}

/**
 * Comparison result when comparing two frames.
 * Used for sorting frames by quality.
 */
export interface FrameComparison {
  /** The frame with the higher score */
  winner: 'frame1' | 'frame2' | 'tie';

  /** Score difference (positive = frame1 better, negative = frame2 better) */
  scoreDifference: number;

  /** Full scores for both frames */
  scores: {
    frame1: FrameScore;
    frame2: FrameScore;
  };
}


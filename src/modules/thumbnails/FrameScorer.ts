/**
 * FrameScorer - Intelligent frame quality scoring for thumbnail selection
 * 
 * This class extends FrameAnalyzer to provide specialized scoring for selecting
 * the best frames to use as video thumbnails. It combines multiple quality metrics
 * (sharpness, brightness, color variance) into a single score that indicates
 * how suitable a frame is for use as a thumbnail.
 * 
 * Key Features:
 * - Multi-factor scoring (sharpness, brightness, color diversity)
 * - Configurable weights for different use cases
 * - Automatic detection of unusable frames (black, white, blurry)
 * - Detailed scoring breakdown for debugging
 * - Comparison methods for sorting frames
 * 
 * Design Philosophy:
 * - Simple and focused: Does one thing well (score frames)
 * - Leverages FrameAnalyzer: Reuses existing calculation methods
 * - Configurable: Allows customization for different needs
 * - Well-documented: Every method explains what it does and why
 * 
 * Usage Example:
 * ```typescript
 * const scorer = new FrameScorer();
 * const canvas = await frameExtractor.extractFrame(video, 10);
 * const score = await scorer.analyze(canvas);
 * 
 * if (score.isUsable && score.score > 0.7) {
 *   // This is an excellent thumbnail candidate
 *   useThumbnail(canvas);
 * }
 * ```
 * 
 * Future Improvements:
 * - TODO: Add face detection bonus (frames with faces score higher)
 * - TODO: Add composition analysis (rule of thirds, etc.)
 * - TODO: Add motion detection (prefer static frames over motion blur)
 * - TODO: Add scene context awareness (prefer frames from scene midpoint)
 * - TODO: Add machine learning model for learned preferences
 * 
 * @module modules/thumbnails/FrameScorer
 */

import { FrameAnalyzer } from '../../core/FrameAnalyzer';
import type { FrameAnalyzerOptions, FrameQualityThresholds } from '../../types/analyzer';
import type { FrameScore, ScoringWeights, FrameScorerOptions } from './types';

/**
 * Default weights for scoring components.
 * These weights are optimized for general-purpose thumbnail selection.
 * 
 * Rationale:
 * - Sharpness (40%): Most important - blurry thumbnails look unprofessional
 * - Brightness (30%): Important - too dark/bright frames are hard to see
 * - Color Variance (30%): Nice to have - colorful frames are more engaging
 * 
 * IMPROVEMENT: Could create presets for different use cases:
 * - 'professional': Higher sharpness weight (0.5, 0.3, 0.2)
 * - 'vibrant': Higher color weight (0.3, 0.2, 0.5)
 * - 'balanced': Current defaults
 */
const DEFAULT_WEIGHTS: ScoringWeights = {
  sharpness: 0.4,      // 40% - Prioritize sharp, in-focus frames
  brightness: 0.3,     // 30% - Prefer well-lit frames
  colorVariance: 0.3   // 30% - Prefer colorful, diverse frames
};

/**
 * Minimum score threshold for usable frames in strict mode.
 * Frames below this score are marked as unusable.
 */
const STRICT_USABILITY_THRESHOLD = 0.3;

/**
 * Minimum score threshold for usable frames in normal mode.
 * More lenient to accept a wider range of frames.
 * Set very low to accept most frames that aren't black/white/extremely blurry.
 */
const NORMAL_USABILITY_THRESHOLD = 0.1;

/**
 * FrameScorer class
 * 
 * Extends FrameAnalyzer to provide specialized frame scoring for thumbnail selection.
 * Combines multiple quality metrics into a single score that indicates how suitable
 * a frame is for use as a thumbnail.
 * 
 * The class leverages all the statistical calculation methods from FrameAnalyzer
 * (brightness, contrast, sharpness, color variance) and adds scoring logic on top.
 */
export class FrameScorer extends FrameAnalyzer<FrameScore> {
  /** 
   * Scoring weights configuration.
   * Determines how much each factor contributes to the final score.
   */
  private weights: ScoringWeights;

  /** 
   * Strict mode flag.
   * When true, applies more aggressive filtering of low-quality frames.
   */
  private strictMode: boolean;

  /**
   * Creates a new FrameScorer instance.
   * 
   * @param options - Configuration options for scoring behavior
   * 
   * Options include:
   * - weights: Custom scoring weights
   * - strictMode: Enable stricter quality requirements
   * - blackFrameThreshold: Custom threshold for black frame detection
   * - whiteFrameThreshold: Custom threshold for white frame detection
   * - blurThreshold: Custom threshold for blur detection
   * 
   * @example
   * ```typescript
   * // Default configuration
   * const scorer = new FrameScorer();
   * 
   * // Strict mode with custom weights
   * const strictScorer = new FrameScorer({
   *   strictMode: true,
   *   weights: {
   *     sharpness: 0.5,  // Prioritize sharpness even more
   *     brightness: 0.3,
   *     colorVariance: 0.2
   *   }
   * });
   * ```
   */
  constructor(options: FrameScorerOptions = {}) {
    // Extract threshold options to pass to parent FrameAnalyzer
    const thresholds: Partial<FrameQualityThresholds> = {};
    if (options.blackFrameThreshold !== undefined) {
      thresholds.blackFrameThreshold = options.blackFrameThreshold;
    }
    if (options.whiteFrameThreshold !== undefined) {
      thresholds.whiteFrameThreshold = options.whiteFrameThreshold;
    }
    if (options.blurThreshold !== undefined) {
      thresholds.blurThreshold = options.blurThreshold;
    }

    // Configure analyzer options
    // We enable caching by default for FrameScorer since thumbnails
    // often involve scoring the same frames multiple times
    const analyzerOptions: FrameAnalyzerOptions = {
      cache: true,              // Enable caching for repeated scoring
      skipValidation: false,    // Always validate for safety
      trackPerformance: false,  // Can be enabled for debugging
      maxCacheSize: 100,        // Reasonable cache size for thumbnail selection
      analysisScale: 1.0        // Use full resolution for accurate scoring
    };

    // Call parent constructor with configuration
    super(analyzerOptions, thresholds);

    // Configure scoring weights by merging custom weights with defaults
    this.weights = {
      ...DEFAULT_WEIGHTS,
      ...options.weights
    };

    // Validate weights sum to approximately 1.0
    // Small tolerance for floating point arithmetic
    const weightSum = this.weights.sharpness + this.weights.brightness + this.weights.colorVariance;
    if (Math.abs(weightSum - 1.0) > 0.01) {
      console.warn(
        `FrameScorer: Weights should sum to 1.0, got ${weightSum}. ` +
        `Scores may be unnormalized. Consider adjusting weights.`
      );
    }

    // Set strict mode
    this.strictMode = options.strictMode ?? false;
  }

  // ============================================================================
  // MAIN ANALYSIS METHOD (Required by FrameAnalyzer)
  // ============================================================================

  /**
   * Analyze a frame and calculate its quality score for thumbnail selection.
   * 
   * This is the main entry point for frame scoring. It:
   * 1. Validates the frame
   * 2. Extracts image data
   * 3. Calculates all statistics (brightness, sharpness, etc.)
   * 4. Computes weighted score
   * 5. Determines usability
   * 6. Identifies any issues
   * 
   * Process Flow:
   * - Extract image data from canvas
   * - Calculate comprehensive statistics using parent class methods
   * - Calculate individual component scores
   * - Apply weights to get final score
   * - Check for quality issues (black, white, blurry)
   * - Determine if frame is usable for thumbnails
   * 
   * @param frame - The canvas containing the video frame to score
   * @param timestamp - Optional timestamp of the frame in the video (seconds)
   * @returns Promise resolving to FrameScore with detailed scoring breakdown
   * 
   * @throws VideoIntelError if frame is invalid or analysis fails
   * 
   * @example
   * ```typescript
   * const scorer = new FrameScorer();
   * const canvas = await extractor.extractFrame(video, 10);
   * const result = await scorer.analyze(canvas, 10);
   * 
   * console.log(`Score: ${result.score}`);
   * console.log(`Usable: ${result.isUsable}`);
   * console.log(`Issues: ${result.issues.join(', ')}`);
   * ```
   */
  async analyze(frame: HTMLCanvasElement, timestamp?: number): Promise<FrameScore> {
    // Step 1: Validate frame is suitable for analysis
    // This checks that canvas exists, has valid dimensions, and has a context
    if (!this.validateFrame(frame)) {
      // Return a default "unusable" score for invalid frames
      return this.createUnusableScore('Frame validation failed - invalid canvas', timestamp);
    }

    // Step 2: Extract image data from canvas
    // This is required for all statistical calculations
    // Uses parent class method which includes error handling
    const imageData = this.extractImageData(frame);

    // Step 3: Calculate comprehensive statistics
    // Uses parent class method that efficiently calculates all metrics in one pass:
    // - brightness (luminance)
    // - contrast (range of values)
    // - sharpness (edge detection)
    // - colorVariance (color diversity)
    // - isBlackFrame, isWhiteFrame, isBlurry flags
    const statistics = this.calculateStatistics(imageData);

    // Step 4: Calculate individual component scores
    // These are the raw scores before weighting
    const components = {
      sharpness: statistics.sharpness,
      brightness: this.calculateBrightnessScore(statistics.brightness),
      colorVariance: statistics.colorVariance
    };

    // Step 5: Calculate weighted overall score
    // Combines component scores using configured weights
    const score = this.calculateWeightedScore(components);

    // Step 6: Determine usability and identify issues
    // A frame is unusable if it's black, white, very blurry, or scores too low
    const issues: string[] = [];
    
    // Check for common quality issues
    if (statistics.isBlackFrame) {
      issues.push('Frame is predominantly black (fade out or invalid frame)');
    }
    if (statistics.isWhiteFrame) {
      issues.push('Frame is overexposed or predominantly white (fade in or invalid frame)');
    }
    if (statistics.isBlurry) {
      issues.push('Frame is out of focus or blurry (low sharpness)');
    }

    // Check if score meets minimum threshold
    const minThreshold = this.strictMode ? STRICT_USABILITY_THRESHOLD : NORMAL_USABILITY_THRESHOLD;
    if (score < minThreshold) {
      issues.push(`Overall quality score (${score.toFixed(2)}) below threshold (${minThreshold})`);
    }

    // Frame is usable if it's not black/white AND (not blurry OR score is acceptable)
    // More lenient: Accept frames that might be slightly blurry if they score well enough
    const isUsable = !statistics.isBlackFrame && !statistics.isWhiteFrame && 
                     (!statistics.isBlurry || score >= minThreshold * 0.8);

    // Step 7: Return comprehensive score result
    return {
      score,
      statistics,
      components,
      isUsable,
      issues,
      timestamp,
      metadata: {
        weights: this.weights,
        strictMode: this.strictMode,
        // Include useful debugging information
        frameSize: {
          width: frame.width,
          height: frame.height
        }
      }
    };
  }

  // ============================================================================
  // SCORING CALCULATION METHODS
  // ============================================================================

  /**
   * Calculate brightness quality score.
   * 
   * Ideal brightness is around 0.5 (50% gray).
   * Frames that are too dark or too bright get lower scores.
   * This creates a "bell curve" where midtones score highest.
   * 
   * Scoring formula:
   * - Brightness 0.5 (ideal midtone) → score 1.0
   * - Brightness 0.0 or 1.0 (extremes) → score 0.0
   * - Formula: 1 - abs(brightness - 0.5) * 2
   * 
   * Examples:
   * - brightness 0.5 → score 1.0 (perfect)
   * - brightness 0.4 or 0.6 → score 0.8 (good)
   * - brightness 0.2 or 0.8 → score 0.4 (poor)
   * - brightness 0.0 or 1.0 → score 0.0 (very poor)
   * 
   * @param brightness - Raw brightness value from FrameAnalyzer (0-1)
   * @returns Brightness quality score (0-1)
   * 
   * IMPROVEMENT: Could use a more sophisticated curve that's more forgiving
   * of slightly dark/bright frames (e.g., Gaussian distribution)
   * 
   * IMPROVEMENT: Could adjust ideal brightness based on video type
   * (e.g., nighttime scenes might have lower ideal brightness)
   */
  private calculateBrightnessScore(brightness: number): number {
    // Calculate distance from ideal brightness (0.5)
    const distanceFromIdeal = Math.abs(brightness - 0.5);
    
    // Convert distance to score (closer = higher score)
    // Multiply by 2 because max distance is 0.5
    const score = 1 - (distanceFromIdeal * 2);
    
    // Ensure score is in valid range (handle floating point errors)
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculate weighted final score from component scores.
   * 
   * Combines individual component scores using configured weights.
   * This allows different use cases to prioritize different factors.
   * 
   * Formula:
   * score = (sharpness × sharpnessWeight) +
   *         (brightness × brightnessWeight) +
   *         (colorVariance × colorVarianceWeight)
   * 
   * @param components - Individual component scores
   * @returns Weighted overall score (0-1)
   * 
   * Example:
   * - sharpness: 0.8, brightness: 0.6, colorVariance: 0.7
   * - weights: 0.4, 0.3, 0.3
   * - score: (0.8×0.4) + (0.6×0.3) + (0.7×0.3) = 0.32 + 0.18 + 0.21 = 0.71
   */
  private calculateWeightedScore(components: {
    sharpness: number;
    brightness: number;
    colorVariance: number;
  }): number {
    const score =
      (components.sharpness * this.weights.sharpness) +
      (components.brightness * this.weights.brightness) +
      (components.colorVariance * this.weights.colorVariance);
    
    // Clamp to 0-1 range (handle potential floating point overflow)
    return Math.max(0, Math.min(1, score));
  }

  // ============================================================================
  // CONVENIENCE METHODS
  // ============================================================================

  /**
   * Quick check if a frame is suitable for use as a thumbnail.
   * 
   * This is a convenience method that performs a full analysis but only
   * returns the boolean usability result. Useful when you just need to
   * filter frames without caring about the detailed scores.
   * 
   * A frame is considered usable if:
   * - Not predominantly black or white
   * - Not too blurry
   * - Score meets minimum threshold
   * 
   * @param frame - The canvas to check
   * @returns Promise resolving to true if usable, false otherwise
   * 
   * @example
   * ```typescript
   * const scorer = new FrameScorer();
   * const isGood = await scorer.isUsableFrame(canvas);
   * 
   * if (isGood) {
   *   // Frame is suitable for thumbnail
   *   processThumbnail(canvas);
   * }
   * ```
   */
  async isUsableFrame(frame: HTMLCanvasElement): Promise<boolean> {
    const result = await this.analyze(frame);
    return result.isUsable;
  }

  /**
   * Compare two frames and determine which is better for thumbnails.
   * 
   * This method scores both frames and compares them. Useful for:
   * - Sorting frames by quality
   * - Picking the best frame from a pair
   * - Implementing custom selection algorithms
   * 
   * Returns a comparison result indicating:
   * - Which frame won (or if they tied)
   * - The score difference
   * - Full scores for both frames
   * 
   * @param frame1 - First frame to compare
   * @param frame2 - Second frame to compare
   * @returns Promise resolving to comparison result
   * 
   * @example
   * ```typescript
   * const scorer = new FrameScorer();
   * const comparison = await scorer.compareFrames(canvas1, canvas2);
   * 
   * if (comparison.winner === 'frame1') {
   *   console.log(`Frame 1 is better by ${comparison.scoreDifference.toFixed(2)}`);
   * } else if (comparison.winner === 'tie') {
   *   console.log('Frames are equally good');
   * }
   * ```
   */
  async compareFrames(
    frame1: HTMLCanvasElement,
    frame2: HTMLCanvasElement
  ): Promise<{
    winner: 'frame1' | 'frame2' | 'tie';
    scoreDifference: number;
    scores: { frame1: FrameScore; frame2: FrameScore };
  }> {
    // Score both frames in parallel for efficiency
    const [score1, score2] = await Promise.all([
      this.analyze(frame1),
      this.analyze(frame2)
    ]);

    // Calculate score difference
    const difference = score1.score - score2.score;

    // Determine winner
    // Use small threshold for tie to handle floating point comparison
    const tieThreshold = 0.001;
    let winner: 'frame1' | 'frame2' | 'tie';
    
    if (Math.abs(difference) < tieThreshold) {
      winner = 'tie';
    } else if (difference > 0) {
      winner = 'frame1';
    } else {
      winner = 'frame2';
    }

    return {
      winner,
      scoreDifference: difference,
      scores: {
        frame1: score1,
        frame2: score2
      }
    };
  }

  /**
   * Get a comparator function for sorting frames by quality.
   * 
   * This method returns a function that can be used with Array.sort()
   * to sort frames from best to worst quality. Useful for:
   * - Selecting top N frames from a large set
   * - Ordering thumbnail candidates by quality
   * 
   * The comparator sorts in DESCENDING order (highest scores first).
   * 
   * @returns Comparator function for Array.sort()
   * 
   * @example
   * ```typescript
   * const scorer = new FrameScorer();
   * const frames = [canvas1, canvas2, canvas3];
   * 
   * // Create array with frames and their scores
   * const scored = await Promise.all(
   *   frames.map(async (frame) => ({
   *     frame,
   *     score: await scorer.analyze(frame)
   *   }))
   * );
   * 
   * // Sort by quality (best first)
   * scored.sort((a, b) => b.score.score - a.score.score);
   * 
   * // Get top 3 frames
   * const topFrames = scored.slice(0, 3).map(s => s.frame);
   * ```
   * 
   * NOTE: This method is synchronous and expects pre-scored frames.
   * You need to score frames first, then sort them.
   */
  getComparator(): (a: FrameScore, b: FrameScore) => number {
    // Return a comparator that sorts in descending order (highest scores first)
    return (a: FrameScore, b: FrameScore) => {
      // Sort by score (descending)
      if (a.score !== b.score) {
        return b.score - a.score;
      }
      
      // If scores are equal, prioritize usable frames
      if (a.isUsable !== b.isUsable) {
        return a.isUsable ? -1 : 1;
      }
      
      // If still tied, compare sharpness as tiebreaker
      return b.components.sharpness - a.components.sharpness;
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Create an unusable score result for invalid or problematic frames.
   * 
   * This is a helper method used internally when a frame cannot be analyzed
   * (e.g., validation failed) or is clearly unusable.
   * 
   * @param reason - Human-readable reason why frame is unusable
   * @param timestamp - Optional timestamp in video
   * @returns FrameScore marked as unusable with zero score
   */
  private createUnusableScore(reason: string, timestamp?: number): FrameScore {
    return {
      score: 0,
      statistics: {
        brightness: 0,
        contrast: 0,
        sharpness: 0,
        colorVariance: 0,
        isBlackFrame: true,
        isWhiteFrame: false,
        isBlurry: true
      },
      components: {
        sharpness: 0,
        brightness: 0,
        colorVariance: 0
      },
      isUsable: false,
      issues: [reason],
      timestamp,
      metadata: {
        weights: this.weights,
        strictMode: this.strictMode,
        error: true
      }
    };
  }

  // ============================================================================
  // PUBLIC CONFIGURATION METHODS
  // ============================================================================

  /**
   * Update scoring weights dynamically.
   * 
   * Allows changing the scoring weights after the scorer is created.
   * Useful for A/B testing different weight configurations or adapting
   * to different video types.
   * 
   * @param weights - New weights (partial update supported)
   * 
   * @example
   * ```typescript
   * const scorer = new FrameScorer();
   * 
   * // Analyze with default weights
   * const score1 = await scorer.analyze(frame);
   * 
   * // Change to prioritize color
   * scorer.setWeights({ colorVariance: 0.5, sharpness: 0.3, brightness: 0.2 });
   * 
   * // Analyze with new weights
   * const score2 = await scorer.analyze(frame);
   * ```
   * 
   * IMPROVEMENT: Could validate that weights sum to 1.0 and normalize if not
   */
  setWeights(weights: Partial<ScoringWeights>): void {
    this.weights = {
      ...this.weights,
      ...weights
    };
  }

  /**
   * Get current scoring weights.
   * 
   * @returns Current weights configuration (copy to prevent mutation)
   */
  getWeights(): ScoringWeights {
    // Return a copy to prevent external modification
    return { ...this.weights };
  }

  /**
   * Set strict mode on or off.
   * 
   * @param strict - True to enable strict mode, false for normal mode
   */
  setStrictMode(strict: boolean): void {
    this.strictMode = strict;
  }

  /**
   * Check if strict mode is enabled.
   * 
   * @returns True if in strict mode, false otherwise
   */
  isStrictMode(): boolean {
    return this.strictMode;
  }
}


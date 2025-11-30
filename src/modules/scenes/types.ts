/**
 * Type definitions for Scene Detection module
 * 
 * This file contains TypeScript types specific to scene detection functionality.
 * Scene detection identifies scene changes (cuts, transitions) in videos by
 * analyzing frame differences.
 * 
 * @module modules/scenes/types
 */

import type { Scene } from '../../types';

// ============================================================================
// Extended Scene Types
// ============================================================================

/**
 * Extended scene information with additional metadata and transition details.
 * 
 * This extends the base Scene type with optional additional information
 * that can be useful for advanced use cases like:
 * - Displaying transition types in UI
 * - Filtering scenes by transition type
 * - Analyzing video composition patterns
 * 
 * FUTURE IMPROVEMENT: Could add semantic labels like:
 * - Scene content type (indoor/outdoor, day/night)
 * - Dominant objects in scene
 * - Audio characteristics (music, speech, silence)
 */
export interface SceneDetailed extends Scene {
  /**
   * Type of transition from previous scene.
   * 
   * - 'hard_cut': Instant scene change (most common)
   * - 'fade': Gradual fade to/from black or white
   * - 'dissolve': Cross-fade between scenes
   * - 'wipe': One scene wipes/slides into another
   * - 'unknown': Couldn't determine transition type
   * 
   * Note: Basic implementation only detects hard_cut.
   * Advanced transitions require multi-frame analysis.
   */
  transitionType?: 'hard_cut' | 'fade' | 'dissolve' | 'wipe' | 'unknown';

  /**
   * Duration of the transition in seconds.
   * 
   * For hard cuts, this is ~0.
   * For gradual transitions, this is the fade/dissolve duration.
   * 
   * FUTURE IMPROVEMENT: Detect and measure transition durations
   */
  transitionDuration?: number;

  /**
   * Approximate number of frames in this scene.
   * 
   * Calculated as: duration * estimatedFPS
   * Useful for determining scene complexity and content amount.
   */
  frameCount?: number;

  /**
   * Average brightness of the scene (0-1).
   * 
   * Useful for:
   * - Filtering dark/bright scenes
   * - Detecting day/night scenes
   * - Quality checks
   */
  averageBrightness?: number;

  /**
   * Dominant colors in the scene as hex codes.
   * Example: ['#FF5733', '#33FF57', '#3357FF']
   * 
   * FUTURE IMPROVEMENT: Extract colors from scene frames
   */
  dominantColors?: string[];
}

// ============================================================================
// Frame Difference Analysis
// ============================================================================

/**
 * Result of comparing two frames to determine how different they are.
 * 
 * This is the fundamental building block of scene detection.
 * Higher difference values indicate potential scene boundaries.
 */
export interface FrameDifference {
  /**
   * Normalized difference value (0-1).
   * 
   * - 0.0: Frames are identical
   * - 0.0-0.2: Very similar (same scene, minor changes)
   * - 0.2-0.3: Similar (same scene, more motion/changes)
   * - 0.3-0.5: Different (potential scene boundary)
   * - 0.5-1.0: Very different (likely scene boundary)
   * 
   * The threshold for detecting scenes is typically 0.3-0.4
   */
  difference: number;

  /**
   * Timestamp of first frame in seconds
   */
  timestamp1: number;

  /**
   * Timestamp of second frame in seconds
   */
  timestamp2: number;

  /**
   * Method used to calculate the difference.
   * Different methods have different strengths:
   * 
   * - 'pixel': Fast, good for hard cuts, sensitive to motion
   * - 'histogram': Slower, good for gradual transitions, robust to motion
   * - 'combined': Uses both methods for best accuracy
   * - 'structural': Advanced similarity detection (future)
   */
  method: 'pixel' | 'histogram' | 'combined' | 'structural';
}

// ============================================================================
// Scene Boundary Detection
// ============================================================================

/**
 * Represents a potential scene boundary with confidence metrics.
 * 
 * During scene detection, we identify timestamps where frames differ significantly.
 * Not all high-difference timestamps are valid boundaries (could be motion, flashes, etc.)
 * so we track confidence and apply filtering.
 */
export interface SceneBoundary {
  /**
   * Timestamp where the scene boundary occurs (seconds)
   */
  timestamp: number;

  /**
   * Confidence that this is a real scene boundary (0-1).
   * 
   * Higher values mean more confident.
   * Calculated based on:
   * - How much the frames differ
   * - How stable surrounding frames are
   * - Distance from other boundaries
   * 
   * Typical threshold: 0.5 (reject boundaries with confidence < 0.5)
   */
  confidence: number;

  /**
   * Raw frame difference value that triggered this boundary (0-1)
   */
  difference: number;

  /**
   * Whether this boundary passed all filtering criteria.
   * 
   * Boundaries can be rejected for:
   * - Low confidence
   * - Too close to another boundary (minimum scene length)
   * - Detected as false positive (camera shake, flash, etc.)
   */
  isValidBoundary: boolean;

  /**
   * Optional: Reason why boundary was rejected (if not valid)
   * 
   * FUTURE IMPROVEMENT: Add detailed rejection reasons for debugging
   * Examples: 'too_close_to_previous', 'low_confidence', 'motion_detected'
   */
  rejectionReason?: string;
}

// ============================================================================
// Configuration Options
// ============================================================================

/**
 * Options for configuring frame difference calculation algorithms.
 * 
 * These options allow fine-tuning the frame comparison for different
 * video types and use cases.
 */
export interface DifferenceOptions {
  /**
   * Algorithm to use for frame comparison.
   * 
   * - 'pixel': Direct pixel-by-pixel comparison (fastest)
   * - 'histogram': Compare color distributions (better for transitions)
   * - 'combined': Use both methods and average results (most accurate)
   * 
   * Default: 'pixel' for speed
   */
  method?: 'pixel' | 'histogram' | 'combined';

  /**
   * Scale factor for downsampling frames before comparison.
   * 
   * Values between 0 and 1:
   * - 1.0: Compare full resolution (slow but accurate)
   * - 0.5: Compare at half resolution (4x faster)
   * - 0.25: Compare at quarter resolution (16x faster)
   * 
   * Default: 0.25 (good balance of speed and accuracy)
   * 
   * PERFORMANCE TIP: Scene detection usually doesn't need full resolution.
   * Downsampling to 25-50% gives almost identical results but much faster.
   */
  downscale?: number;

  /**
   * Whether to ignore edge pixels during comparison.
   * 
   * Edge pixels can be noisy due to:
   * - Compression artifacts
   * - Letterboxing (black bars)
   * - Watermarks or overlays
   * 
   * When true, ignores outermost 5% of pixels on each edge.
   * 
   * Default: false
   * 
   * FUTURE IMPROVEMENT: Make edge percentage configurable
   */
  ignoreEdges?: boolean;

  /**
   * Whether to use grayscale (luminance) comparison instead of RGB.
   * 
   * Grayscale comparison:
   * - 3x faster (only one channel instead of three)
   * - Usually sufficient for scene detection
   * - May miss some color-only transitions
   * 
   * Default: true (for performance)
   */
  grayscale?: boolean;
}

// ============================================================================
// Statistics and Monitoring
// ============================================================================

/**
 * Statistics about a scene detection operation.
 * 
 * Useful for:
 * - Performance monitoring
 * - Debugging scene detection issues
 * - Optimizing parameters
 * - Quality assurance
 */
export interface SceneDetectionStats {
  /**
   * Total number of frames analyzed during detection
   */
  totalFramesAnalyzed: number;

  /**
   * Number of scenes detected after filtering
   */
  scenesDetected: number;

  /**
   * Average scene length in seconds
   */
  averageSceneLength: number;

  /**
   * Shortest scene duration in seconds
   */
  shortestScene: number;

  /**
   * Longest scene duration in seconds
   */
  longestScene: number;

  /**
   * Total processing time in milliseconds
   */
  processingTime: number;

  /**
   * Average confidence score of detected boundaries (0-1)
   */
  averageConfidence: number;

  /**
   * Number of potential boundaries detected before filtering
   */
  rawBoundariesDetected: number;

  /**
   * Number of boundaries rejected during filtering
   */
  boundariesRejected: number;

  /**
   * Frame sampling interval used (seconds)
   */
  samplingInterval: number;

  /**
   * Threshold value used for detection
   */
  threshold: number;
}

// ============================================================================
// Internal Processing Types
// ============================================================================

/**
 * Extracted frame with metadata for processing.
 * 
 * Used internally during scene detection to track frames
 * and their associated information.
 */
export interface ExtractedFrameWithData {
  /** Canvas containing the frame image */
  canvas: HTMLCanvasElement;

  /** Timestamp in seconds */
  timestamp: number;

  /** Frame width in pixels */
  width: number;

  /** Frame height in pixels */
  height: number;

  /**
   * Optional: Cached ImageData for this frame.
   * Caching can speed up repeated analysis but uses more memory.
   */
  imageData?: ImageData;

  /**
   * Optional: Pre-calculated frame statistics.
   * Can be reused if multiple analyses are performed.
   */
  statistics?: {
    brightness: number;
    contrast: number;
    sharpness: number;
  };
}

/**
 * Configuration for scene smoothing/filtering algorithms.
 * 
 * These settings control how aggressively we filter false positives
 * from camera shake, motion, and compression artifacts.
 */
export interface SmoothingConfig {
  /**
   * Enable temporal smoothing (averaging differences over time).
   * Helps reduce false positives from momentary spikes.
   * 
   * Default: true
   */
  enabled: boolean;

  /**
   * Window size for temporal smoothing (number of frames).
   * 
   * Larger windows = more smoothing = fewer false positives but may miss quick cuts.
   * Typical values: 3-5 frames
   * 
   * Default: 3
   */
  windowSize: number;

  /**
   * Only keep boundaries that are local maxima in their neighborhood.
   * This prevents detecting multiple boundaries for single transitions.
   * 
   * Default: true
   */
  useLocalMaxima: boolean;

  /**
   * Minimum relative prominence for a boundary to be considered valid.
   * 
   * A boundary must be at least this much higher than its neighbors
   * to be considered a real scene change (as a fraction of its value).
   * 
   * Values: 0.1 - 0.5 (0.2 = boundary must be 20% higher than neighbors)
   * Default: 0.2
   * 
   * FUTURE IMPROVEMENT: Could use more sophisticated peak detection algorithms
   */
  prominenceThreshold: number;
}

// ============================================================================
// Export all types
// ============================================================================

/**
 * Re-export base Scene types from main types
 */
export type { Scene } from '../../types';



/**
 * VideoIntel.js Type Definitions
 * Complete TypeScript types for the library
 */

// ============================================================================
// Core Types
// ============================================================================

export type VideoInput = File | Blob | string; // URL

export interface VideoIntelConfig {
  models?: ('faces' | 'objects' | 'nsfw')[];
  workers?: number;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

export interface ProgressCallback {
  (progress: number): void;
}

// ============================================================================
// Analysis Types
// ============================================================================

export interface AnalysisOptions {
  thumbnails?: ThumbnailOptions | boolean;
  scenes?: SceneOptions | boolean;
  faces?: FaceOptions | boolean;
  objects?: ObjectOptions | boolean;
  colors?: ColorOptions | boolean;
  metadata?: boolean;
  quality?: boolean;
  safety?: SafetyOptions | boolean;
  onProgress?: ProgressCallback;
}

export interface AnalysisResult {
  metadata?: VideoMetadata;
  thumbnails?: Thumbnail[];
  scenes?: Scene[];
  faces?: FaceDetection;
  objects?: ObjectDetection;
  colors?: Color[];
  quality?: QualityAssessment;
  safety?: SafetyAnalysis;
}

// ============================================================================
// Thumbnail Types
// ============================================================================

export interface ThumbnailOptions {
  count?: number; // Default: 5, Range: 1-10
  quality?: number; // JPEG quality 0-1, Default: 0.8
  size?: {
    width?: number;
    height?: number;
  };
  format?: 'jpeg' | 'png'; // Default: 'jpeg'
  timestamps?: boolean; // Default: true
}

export interface Thumbnail {
  image: Blob;
  timestamp: number; // Seconds
  score: number; // Quality score 0-1
  width: number;
  height: number;
}

// ============================================================================
// Scene Types
// ============================================================================

export interface SceneOptions {
  minSceneLength?: number; // Minimum seconds, Default: 3
  threshold?: number; // Sensitivity 0-1, Default: 0.3
  includeThumbnails?: boolean; // Default: true
}

export interface Scene {
  start: number; // Seconds
  end: number;
  duration: number;
  thumbnail?: Blob;
  confidence: number; // 0-1
}

// ============================================================================
// Metadata Types
// ============================================================================

export interface VideoMetadata {
  duration: number; // Seconds
  width: number;
  height: number;
  fps: number;
  codec?: string;
  format: string; // 'mp4', 'webm', etc.
  size: number; // Bytes
  aspectRatio: string; // '16:9', '4:3', etc.
  bitrate?: number; // kbps
  hasAudio: boolean;
  hasVideo: boolean;
}

// ============================================================================
// Color Types
// ============================================================================

export interface ColorOptions {
  count?: number; // Default: 5, Range: 2-10
  sampleFrames?: number; // Default: 10
  quality?: 'fast' | 'balanced' | 'best'; // Default: 'balanced'
}

export interface Color {
  hex: string; // '#RRGGBB'
  rgb: [number, number, number];
  hsl: [number, number, number];
  percentage: number; // 0-100
}

// ============================================================================
// Face Detection Types (Phase 2)
// ============================================================================

export interface FaceOptions {
  /** Confidence threshold for face detection (0-1). Default: 0.7 */
  confidence?: number;
  
  /** Return bounding box coordinates for detected faces. Default: false */
  returnCoordinates?: boolean;
  
  /** Return cropped face thumbnails. Requires returnCoordinates: true. Default: false */
  returnThumbnails?: boolean;
  
  /** Thumbnail image format when returnThumbnails is true. Default: 'jpeg' */
  thumbnailFormat?: 'jpeg' | 'png';
  
  /** Thumbnail quality for JPEG format (0-1). Default: 0.8 */
  thumbnailQuality?: number;
  
  /** Sampling rate in seconds between frame analysis. Default: 2 */
  samplingRate?: number;
}

export interface FaceDetection {
  detected: boolean;
  averageCount: number;
  frames: FaceFrame[];
}

export interface FaceFrame {
  timestamp: number;
  faces: Face[];
}

export interface Face {
  /** X coordinate of bounding box (top-left corner) */
  x: number;
  
  /** Y coordinate of bounding box (top-left corner) */
  y: number;
  
  /** Width of bounding box in pixels */
  width: number;
  
  /** Height of bounding box in pixels */
  height: number;
  
  /** Detection confidence score (0-1) */
  confidence: number;
  
  /** Cropped face image (only present when returnThumbnails: true) */
  thumbnail?: Blob;
}

// ============================================================================
// Object Detection Types (Phase 2)
// ============================================================================

export interface ObjectOptions {
  classes?: string[]; // Filter specific objects
  confidence?: number; // Default: 0.6
  samplingRate?: number; // FPS to analyze
}

export interface ObjectDetection {
  detected: string[]; // Unique object classes
  timeline: ObjectFrame[];
}

export interface ObjectFrame {
  timestamp: number;
  objects: DetectedObject[];
}

export interface DetectedObject {
  class: string;
  confidence: number;
  bbox: BoundingBox;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ============================================================================
// Quality Assessment Types (Phase 2)
// ============================================================================

export type QualityLevel = 'SD' | 'HD' | 'FHD' | '4K';

export interface QualityAssessment {
  overallQuality: QualityLevel;
  score: number; // 0-100
  bitrate: number; // kbps
  encodingQuality: number; // 0-1
  issues: QualityIssue[];
  recommendations: string[];
}

export interface QualityIssue {
  type: 'low_bitrate' | 'low_resolution' | 'codec_outdated' | 'frame_drops';
  severity: 'low' | 'medium' | 'high';
  description: string;
}

// ============================================================================
// Safety Analysis Types (Phase 2)
// ============================================================================

export interface SafetyOptions {
  checks?: ('nsfw' | 'violence' | 'gore')[];
  threshold?: number; // Default: 0.7
}

export interface SafetyAnalysis {
  safe: boolean;
  confidence: number; // 0-1
  flags: SafetyFlag[];
  recommendations: string[];
}

export interface SafetyFlag {
  type: 'nudity' | 'violence' | 'gore' | 'suggestive';
  confidence: number;
  severity: 'low' | 'medium' | 'high';
  timestamps: number[];
}

// ============================================================================
// Frame Extraction Types
// ============================================================================

/**
 * Options for extracting frames at regular intervals
 */
export interface IntervalOptions {
  /** Start extracting from this timestamp (seconds) */
  startTime?: number;
  /** Stop extracting at this timestamp (seconds) */
  endTime?: number;
  /** Progress callback - receives percentage (0-100) */
  onProgress?: ProgressCallback;
}

/**
 * Options for converting canvas to blob
 */
export interface BlobOptions {
  /** Image format - jpeg or png */
  type?: 'image/jpeg' | 'image/png';
  /** JPEG quality (0-1, only applies to jpeg) */
  quality?: number;
  /** Resize width (maintains aspect ratio if height not provided) */
  width?: number;
  /** Resize height (maintains aspect ratio if width not provided) */
  height?: number;
}

/**
 * Frame extraction result with metadata
 * Useful for tracking frame information during processing
 */
export interface ExtractedFrame {
  /** The canvas containing the frame data */
  canvas: HTMLCanvasElement;
  /** Timestamp in seconds where frame was extracted */
  timestamp: number;
  /** Width of the frame in pixels */
  width: number;
  /** Height of the frame in pixels */
  height: number;
}

// ============================================================================
// Error Types
// ============================================================================

export class VideoIntelError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public details?: unknown
  ) {
    super(message);
    this.name = 'VideoIntelError';
  }
}

export enum ErrorCode {
  INVALID_INPUT = 'INVALID_INPUT',
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',
  PROCESSING_ERROR = 'PROCESSING_ERROR',
  MODEL_LOAD_ERROR = 'MODEL_LOAD_ERROR',
  MEMORY_ERROR = 'MEMORY_ERROR',
  WORKER_ERROR = 'WORKER_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  // Frame extraction specific errors
  SEEK_FAILED = 'SEEK_FAILED',
  CANVAS_CONTEXT_ERROR = 'CANVAS_CONTEXT_ERROR',
  INVALID_TIMESTAMP = 'INVALID_TIMESTAMP',
  VIDEO_NOT_READY = 'VIDEO_NOT_READY',
}

// ============================================================================
// Frame Analyzer Types
// ============================================================================

// Export all analyzer types
export * from './analyzer';

// ============================================================================
// Thumbnail Generation Types
// ============================================================================

// Export thumbnail-specific types
export type {
  FrameScore,
  ScoringWeights,
  FrameScorerOptions,
  FrameComparison
} from '../modules/thumbnails/types';

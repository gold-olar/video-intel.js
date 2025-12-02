/**
 * Internal types for face detection module
 * 
 * These types are used internally within the face detection module.
 * Public-facing types (FaceOptions, FaceDetection, etc.) are in src/types/index.ts
 * 
 * IMPROVEMENT: As the face detection module grows, we might add:
 * - Face tracking types (tracking same face across frames)
 * - Face recognition types (identifying specific people)
 * - Emotion detection types
 * - Face quality assessment types
 * 
 * @module modules/faces/types
 */

/**
 * Options for face thumbnail extraction
 * 
 * Internal type used when extracting face thumbnails.
 * Simplified version of FaceOptions with only thumbnail-related fields.
 */
export interface FaceThumbnailOptions {
  /** Whether to extract thumbnails */
  returnThumbnails: boolean;
  
  /** Thumbnail format */
  thumbnailFormat: 'jpeg' | 'png';
  
  /** JPEG quality (0-1) */
  thumbnailQuality: number;
}

/**
 * Intermediate face detection result from face-api.js
 * 
 * This represents the raw result from face-api.js before
 * converting to our Face interface.
 * 
 * IMPROVEMENT: Could extend this to include:
 * - Landmarks (eye, nose, mouth positions)
 * - Face descriptors (for recognition)
 * - Face angles (yaw, pitch, roll)
 */
export interface RawFaceDetection {
  /** Bounding box coordinates */
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  
  /** Detection confidence score (0-1) */
  score: number;
}

/**
 * Progress tracking state for face detection
 * 
 * Used internally to track progress across the three phases:
 * 1. Frame extraction (0-40%)
 * 2. Face detection (40-90%)
 * 3. Thumbnail generation (90-100%)
 * 
 * IMPROVEMENT: Could add more granular progress tracking:
 * - Current frame number
 * - Estimated time remaining
 * - Current phase name
 */
export interface FaceDetectionProgress {
  /** Current progress percentage (0-100) */
  current: number;
  
  /** Total frames to process */
  totalFrames: number;
  
  /** Frames processed so far */
  processedFrames: number;
  
  /** Current phase ('extraction' | 'detection' | 'thumbnails') */
  phase: 'extraction' | 'detection' | 'thumbnails';
}

// FUTURE TYPES (not yet implemented)

/**
 * Face tracking result
 * 
 * For tracking the same face across multiple frames.
 * Not yet implemented, but structure planned for future.
 * 
 * FUTURE FEATURE: Face tracking would enable:
 * - Counting unique individuals in video
 * - Analyzing face movement patterns
 * - Creating per-person highlight reels
 */
export interface TrackedFace {
  /** Unique identifier for this face across frames */
  id: string;
  
  /** All appearances of this face */
  appearances: {
    timestamp: number;
    x: number;
    y: number;
    width: number;
    height: number;
    confidence: number;
  }[];
  
  /** Best quality frame for this face */
  bestFrame?: {
    timestamp: number;
    thumbnail: Blob;
    quality: number;
  };
}

/**
 * Face recognition result
 * 
 * For identifying specific known people in video.
 * Not yet implemented, but structure planned for future.
 * 
 * FUTURE FEATURE: Face recognition would enable:
 * - Finding all appearances of specific people
 * - Content filtering by person
 * - Automatic tagging of people in videos
 */
export interface RecognizedFace {
  /** Detected face information */
  detection: {
    x: number;
    y: number;
    width: number;
    height: number;
    confidence: number;
  };
  
  /** Recognized person information */
  identity?: {
    /** Person name or ID */
    name: string;
    
    /** Recognition confidence (0-1) */
    confidence: number;
    
    /** Match distance (lower is better match) */
    distance: number;
  };
}

/**
 * Face quality assessment
 * 
 * For assessing the quality of detected faces.
 * Not yet implemented, but structure planned for future.
 * 
 * FUTURE FEATURE: Quality assessment would enable:
 * - Filtering out low-quality faces (blurry, dark, etc.)
 * - Selecting best face images for thumbnails
 * - Optimizing face recognition accuracy
 */
export interface FaceQuality {
  /** Overall quality score (0-1) */
  score: number;
  
  /** Sharpness/blur score (0-1) */
  sharpness: number;
  
  /** Lighting quality (0-1) */
  lighting: number;
  
  /** Face angle score (0-1, frontal = 1, profile = 0) */
  angle: number;
  
  /** Face size relative to frame (0-1) */
  size: number;
  
  /** Issues detected */
  issues: ('blur' | 'dark' | 'overexposed' | 'partial' | 'small')[];
}


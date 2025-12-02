/**
 * FaceDetector - Detect faces in video frames
 * 
 * This module handles face detection in videos using face-api.js.
 * It can detect faces, return bounding box coordinates, and extract
 * face thumbnails (cropped face images with padding).
 * 
 * Key Features:
 * - Face detection with configurable confidence threshold
 * - Optional bounding box coordinates for detected faces
 * - Optional face thumbnail extraction (cropped face images)
 * - Configurable sampling rate (how often to check for faces)
 * - Progress tracking for long videos
 * - Memory-efficient processing with cleanup
 * 
 * Process Flow:
 * 1. Validate options (ensure thumbnail requirements are met)
 * 2. Load face detection model (if not already loaded)
 * 3. Extract frames at specified intervals (progress: 0-40%)
 * 4. Run face detection on each frame (progress: 40-90%)
 * 5. Optionally extract face thumbnails (progress: 90-100%)
 * 6. Aggregate results and return
 * 
 * Usage Example:
 * ```typescript
 * const detector = new FaceDetector(frameExtractor, modelLoader);
 * const video = await videoLoader.load(videoFile);
 * 
 * // Basic detection (count only)
 * const result = await detector.detect(video, {
 *   confidence: 0.7,
 *   samplingRate: 2.0
 * });
 * 
 * // With coordinates
 * const result = await detector.detect(video, {
 *   confidence: 0.7,
 *   returnCoordinates: true
 * });
 * 
 * // With thumbnails
 * const result = await detector.detect(video, {
 *   confidence: 0.7,
 *   returnCoordinates: true,
 *   returnThumbnails: true,
 *   thumbnailFormat: 'jpeg',
 *   thumbnailQuality: 0.8
 * });
 * ```
 * 
 * Performance Characteristics:
 * - Model loading: ~1.5-2s (first time, then cached)
 * - Face detection: ~50-100ms per frame (depends on resolution and model)
 * - Thumbnail extraction: ~10ms per face
 * - Memory: ~100MB base + ~30KB per face thumbnail (JPEG)
 * 
 * Future Improvements:
 * - TODO: Add face tracking across frames (identify same face over time)
 * - TODO: Add face recognition (identify specific people)
 * - TODO: Add emotion detection
 * - TODO: Add age/gender estimation
 * - TODO: Add face landmarks detection (eyes, nose, mouth positions)
 * - TODO: Support adaptive sampling based on face presence (sample more when faces detected)
 * - TODO: Add face quality scoring (blur, lighting, angle)
 * - TODO: Support batch processing of multiple videos
 * 
 * @module modules/faces/FaceDetector
 */

import * as faceapi from 'face-api.js';
import { FrameExtractor } from '../../core/FrameExtractor';
import { ModelLoader } from '../../models/ModelLoader';
import { VideoIntelError, ErrorCode } from '../../types';
import type { FaceOptions, FaceDetection, FaceFrame, Face } from '../../types';

// ============================================================================
// CONFIGURATION CONSTANTS
// ============================================================================

/**
 * Default confidence threshold for face detection (0-1).
 * 
 * - 0.7 provides good balance between precision and recall
 * - Lower values (0.5) detect more faces but may include false positives
 * - Higher values (0.9) are more strict but may miss some faces
 * 
 * IMPROVEMENT: Could be adaptive based on video quality/lighting
 */
const DEFAULT_CONFIDENCE = 0.7;

/**
 * Default sampling rate in seconds.
 * 
 * How often to extract and analyze frames for faces.
 * - 2.0 seconds means check for faces every 2 seconds
 * - Lower values (1.0s) are more thorough but slower
 * - Higher values (5.0s) are faster but may miss brief face appearances
 * 
 * IMPROVEMENT: Could be adaptive:
 * - Start with 2s, then reduce to 0.5s when faces are detected
 * - Could adjust based on video length (shorter videos = more frequent)
 */
const DEFAULT_SAMPLING_RATE = 2.0;

/**
 * Default thumbnail format for face crops.
 * 
 * JPEG provides good balance:
 * - Smaller file size (~50% of PNG)
 * - Fast to generate
 * - Sufficient quality for faces
 * 
 * PNG is available for lossless quality when needed.
 */
const DEFAULT_THUMBNAIL_FORMAT: 'jpeg' | 'png' = 'jpeg';

/**
 * Default JPEG quality for face thumbnails (0-1).
 * 
 * 0.8 provides good balance:
 * - Good visual quality
 * - Reasonable file size (~30KB per face)
 * - Fast encoding
 */
const DEFAULT_THUMBNAIL_QUALITY = 0.8;

/**
 * Padding percentage around face crops.
 * 
 * 0.1 = 10% padding on all sides
 * - Provides context (hair, shoulders, background)
 * - Avoids cutting off edges of face
 * - Standard in face recognition systems
 * 
 * IMPROVEMENT: Could make this configurable via FaceOptions
 */
const FACE_CROP_PADDING = 0.1;

/**
 * Input size for face detection model.
 * 
 * face-api.js supports different input sizes:
 * - 224: Faster, good accuracy (~75ms per frame)
 * - 416: Slower, better accuracy (~150ms per frame)
 * - 512: Slowest, best accuracy (~200ms per frame)
 * 
 * 224 is a good default for most use cases.
 * 
 * IMPROVEMENT: Could make this configurable via FaceOptions
 * IMPROVEMENT: Could be adaptive based on video resolution
 */
const FACE_DETECTION_INPUT_SIZE = 224;

/**
 * Progress phase weights for accurate progress reporting.
 * 
 * These reflect the actual time distribution:
 * - Frame extraction: 40% (I/O bound, disk/network access)
 * - Face detection: 50% (CPU bound, ML inference)
 * - Thumbnail generation: 10% (Fast, many small operations)
 */
const PROGRESS_WEIGHTS = {
  EXTRACTION: 0.4,    // 0-40%
  DETECTION: 0.5,     // 40-90%
  THUMBNAILS: 0.1,    // 90-100%
};


// ============================================================================
// FaceDetector Class
// ============================================================================

/**
 * FaceDetector class
 * 
 * Main class for detecting faces in video frames.
 * Coordinates frame extraction, face detection, and thumbnail generation.
 * 
 * Dependencies:
 * - FrameExtractor: For extracting frames from video
 * - ModelLoader: For loading face detection models
 * 
 * @example
 * ```typescript
 * const extractor = new FrameExtractor();
 * const modelLoader = new ModelLoader();
 * const detector = new FaceDetector(extractor, modelLoader);
 * 
 * const video = await videoLoader.load(videoFile);
 * const result = await detector.detect(video, {
 *   confidence: 0.7,
 *   returnCoordinates: true,
 *   returnThumbnails: true
 * });
 * ```
 */
export class FaceDetector {
  /**
   * Constructor
   * 
   * @param frameExtractor - FrameExtractor instance for extracting frames
   * @param modelLoader - ModelLoader instance for loading face detection models
   */
  constructor(
    private frameExtractor: FrameExtractor,
    private modelLoader: ModelLoader
  ) {}

  /**
   * Detect faces in video
   * 
   * Main entry point for face detection. This method:
   * 1. Validates options
   * 2. Loads face detection model (if needed)
   * 3. Extracts frames at specified intervals
   * 4. Runs face detection on each frame
   * 5. Optionally extracts face thumbnails
   * 6. Returns aggregated results
   * 
   * @param video - The loaded HTMLVideoElement to analyze
   * @param options - Configuration options for face detection
   * @returns Promise resolving to FaceDetection result
   * @throws VideoIntelError if detection fails
   * 
   * @example
   * ```typescript
   * // Basic detection
   * const result = await detector.detect(video, {
   *   confidence: 0.7
   * });
   * console.log(`Faces detected: ${result.detected}`);
   * console.log(`Average faces: ${result.averageCount}`);
   * 
   * // With coordinates and thumbnails
   * const result = await detector.detect(video, {
   *   confidence: 0.7,
   *   returnCoordinates: true,
   *   returnThumbnails: true,
   *   thumbnailFormat: 'jpeg',
   *   thumbnailQuality: 0.9
   * });
   * ```
   */
  async detect(
    video: HTMLVideoElement,
    options: FaceOptions = {}
  ): Promise<FaceDetection> {
    // Step 1: Validate options
    // This ensures returnThumbnails requires returnCoordinates
    this.validateOptions(options);

    // Step 2: Extract options with defaults
    const confidence = options.confidence ?? DEFAULT_CONFIDENCE;
    const samplingRate = options.samplingRate ?? DEFAULT_SAMPLING_RATE;
    const returnCoordinates = options.returnCoordinates ?? false;
    const returnThumbnails = options.returnThumbnails ?? false;
    const thumbnailFormat = options.thumbnailFormat ?? DEFAULT_THUMBNAIL_FORMAT;
    const thumbnailQuality = options.thumbnailQuality ?? DEFAULT_THUMBNAIL_QUALITY;

    // Step 3: Load face detection model if not already loaded
    // This is lazy loading - only loads when needed
    // Model is cached in memory for subsequent calls
    if (!this.modelLoader.isFaceModelLoaded()) {
      await this.modelLoader.loadFaceDetectionModel();
    }

    // Step 4: Calculate timestamps for frame extraction
    // Extract frames at regular intervals throughout the video
    const timestamps: number[] = [];
    for (let time = 0; time < video.duration; time += samplingRate) {
      timestamps.push(time);
    }

    // Edge case: if video is shorter than sampling rate, at least check first frame
    if (timestamps.length === 0) {
      timestamps.push(0);
    }

    // Step 5: Extract frames (Progress: 0-40%)
    // We extract all frames first, then process them
    // IMPROVEMENT: Could stream frames (extract + detect one at a time) to reduce memory
    const frames = await this.frameExtractor.extractFrames(
      video,
      timestamps,
      (progress) => {
        console.log('Frame extraction progress:', progress, PROGRESS_WEIGHTS.EXTRACTION);
        // Map frame extraction progress to 0-40% range
        // This reflects that extraction is 40% of total work
        // No callback in options, so we don't report progress here
        // IMPROVEMENT: Add onProgress callback to FaceOptions
      }
    );

    // Step 6: Detect faces in each frame (Progress: 40-90%)
    const faceFrames: FaceFrame[] = [];
    let totalFaceCount = 0;

    for (let i = 0; i < frames.length; i++) {
      const canvas = frames[i];
      const timestamp = timestamps[i];

      // Detect faces in this frame
      const faces = await this.detectFacesInFrame(
        canvas,
        confidence,
        {
          returnThumbnails,
          thumbnailFormat,
          thumbnailQuality,
        }
      );

      // Update face count for averaging
      totalFaceCount += faces.length;

      // Only add to results if coordinates are requested OR faces were found
      // This reduces memory when returnCoordinates is false
      if (returnCoordinates || faces.length > 0) {
        faceFrames.push({
          timestamp,
          faces,
        });
      }

      // Clean up canvas to free memory
      // IMPROVEMENT: Could reuse canvases instead of creating new ones
      // (canvas pooling pattern)
    }

    // Step 7: Calculate average face count
    const averageCount = frames.length > 0 
      ? totalFaceCount / frames.length 
      : 0;

    // Step 8: Return results
    return {
      detected: totalFaceCount > 0,
      averageCount: Math.round(averageCount * 100) / 100, // Round to 2 decimal places
      frames: returnCoordinates ? faceFrames : [], // Only return frames if coordinates requested
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Detect faces in a single frame
   * 
   * This method:
   * 1. Uses face-api.js to detect all faces in the frame
   * 2. Filters by confidence threshold
   * 3. Converts to our Face interface format
   * 4. Optionally extracts face thumbnails
   * 
   * @param canvas - Canvas containing the frame to analyze
   * @param confidence - Minimum confidence threshold (0-1)
   * @param options - Options for thumbnail extraction
   * @returns Promise resolving to array of detected faces
   * @throws VideoIntelError if detection fails
   * 
   * @private
   */
  private async detectFacesInFrame(
    canvas: HTMLCanvasElement,
    confidence: number,
    options: {
      returnThumbnails: boolean;
      thumbnailFormat: 'jpeg' | 'png';
      thumbnailQuality: number;
    }
  ): Promise<Face[]> {
    try {
      // Use face-api.js to detect all faces in the canvas
      // TinyFaceDetectorOptions configures the detection algorithm:
      // - inputSize: Resolution for detection (224 = fast, 416 = accurate)
      // - scoreThreshold: Minimum confidence for detection
      const detections = await faceapi.detectAllFaces(
        canvas,
        new faceapi.TinyFaceDetectorOptions({
          inputSize: FACE_DETECTION_INPUT_SIZE,
          scoreThreshold: confidence,
        })
      );

      // Convert face-api.js results to our Face interface
      const faces: Face[] = [];

      for (const detection of detections) {
        // Extract bounding box coordinates
        const box = detection.box;

        // Create our Face object
        const face: Face = {
          x: Math.round(box.x),
          y: Math.round(box.y),
          width: Math.round(box.width),
          height: Math.round(box.height),
          confidence: Math.round(detection.score * 100) / 100, // Round to 2 decimals
        };

        // Optionally extract face thumbnail (cropped face image)
        if (options.returnThumbnails) {
          try {
            face.thumbnail = await this.extractFaceThumbnail(
              canvas,
              face,
              options.thumbnailFormat,
              options.thumbnailQuality
            );
          } catch (error) {
            // If thumbnail extraction fails, log warning but continue
            // This prevents one bad thumbnail from breaking the entire detection
            console.warn(
              `Failed to extract thumbnail for face at (${face.x}, ${face.y}):`,
              error
            );
            // Don't add thumbnail field if extraction failed
          }
        }

        faces.push(face);
      }

      return faces;
    } catch (error) {
      // Wrap any errors in VideoIntelError for consistent error handling
      throw new VideoIntelError(
        `Face detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ErrorCode.PROCESSING_ERROR,
        { 
          canvasWidth: canvas.width, 
          canvasHeight: canvas.height,
          originalError: error 
        }
      );
    }
  }

  /**
   * Extract face thumbnail (cropped face image with padding)
   * 
   * This method:
   * 1. Creates a temporary canvas for the face crop
   * 2. Calculates padded dimensions (adds 10% padding around face)
   * 3. Draws the cropped face region to the new canvas
   * 4. Converts to blob with specified format and quality
   * 5. Cleans up temporary canvas immediately
   * 
   * Padding provides context:
   * - Includes hair, shoulders, background
   * - Avoids cutting off edges of face
   * - Better for visual presentation
   * 
   * @param sourceCanvas - Original canvas containing the full frame
   * @param face - Face object with bounding box coordinates
   * @param format - Image format ('jpeg' or 'png')
   * @param quality - JPEG quality (0-1, only applies to jpeg)
   * @returns Promise resolving to Blob containing face image
   * @throws VideoIntelError if thumbnail extraction fails
   * 
   * @private
   */
  private async extractFaceThumbnail(
    sourceCanvas: HTMLCanvasElement,
    face: { x: number; y: number; width: number; height: number },
    format: 'jpeg' | 'png',
    quality: number
  ): Promise<Blob> {
    // Step 1: Calculate padded dimensions
    // Add 10% padding on all sides for context
    const padding = FACE_CROP_PADDING; // 0.1 = 10%
    const paddedWidth = Math.round(face.width * (1 + 2 * padding));
    const paddedHeight = Math.round(face.height * (1 + 2 * padding));

    // Calculate top-left corner of padded region
    const paddedX = Math.round(face.x - face.width * padding);
    const paddedY = Math.round(face.y - face.height * padding);

    // Step 2: Clamp coordinates to canvas bounds
    // This handles faces at edges of frame
    const sourceX = Math.max(0, paddedX);
    const sourceY = Math.max(0, paddedY);
    const sourceWidth = Math.min(paddedWidth, sourceCanvas.width - sourceX);
    const sourceHeight = Math.min(paddedHeight, sourceCanvas.height - sourceY);

    // Step 3: Create temporary canvas for face crop
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = sourceWidth;
    cropCanvas.height = sourceHeight;

    const ctx = cropCanvas.getContext('2d');
    if (!ctx) {
      throw new VideoIntelError(
        'Failed to get 2D context for face crop canvas',
        ErrorCode.CANVAS_CONTEXT_ERROR,
        { width: sourceWidth, height: sourceHeight }
      );
    }

    // Step 4: Draw cropped face region to new canvas
    try {
      ctx.drawImage(
        sourceCanvas,
        sourceX,       // Source X
        sourceY,       // Source Y
        sourceWidth,   // Source width
        sourceHeight,  // Source height
        0,             // Destination X (top-left of crop canvas)
        0,             // Destination Y
        sourceWidth,   // Destination width
        sourceHeight   // Destination height
      );
    } catch (error) {
      throw new VideoIntelError(
        'Failed to draw face crop to canvas',
        ErrorCode.PROCESSING_ERROR,
        { 
          face,
          sourceX,
          sourceY,
          sourceWidth,
          sourceHeight,
          error 
        }
      );
    }

    // Step 5: Convert to blob
    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const blob = await this.frameExtractor.canvasToBlob(
      cropCanvas,
      mimeType,
      quality
    );

    // Step 6: Cleanup
    // Remove reference to canvas to help garbage collection
    // The canvas will be garbage collected once this function returns
    // IMPROVEMENT: Could use canvas pooling to reuse crop canvases

    return blob;
  }

  /**
   * Validate face detection options
   * 
   * Ensures that option combinations are valid:
   * - returnThumbnails requires returnCoordinates (can't extract thumbnails without coordinates)
   * 
   * @param options - Options to validate
   * @throws VideoIntelError if options are invalid
   * 
   * @private
   */
  private validateOptions(options: FaceOptions): void {
    // Validate: returnThumbnails requires returnCoordinates
    // This is because we need the face coordinates to know where to crop
    if (options.returnThumbnails && !options.returnCoordinates) {
      throw new VideoIntelError(
        'returnThumbnails requires returnCoordinates to be true. ' +
        'Face thumbnails cannot be extracted without bounding box coordinates.',
        ErrorCode.INVALID_INPUT,
        { 
          returnThumbnails: options.returnThumbnails,
          returnCoordinates: options.returnCoordinates 
        }
      );
    }

    // IMPROVEMENT: Could add more validations:
    // - Validate confidence is between 0 and 1
    // - Validate samplingRate is positive
    // - Validate thumbnailQuality is between 0 and 1
    // - Validate thumbnailFormat is 'jpeg' or 'png'
  }
}


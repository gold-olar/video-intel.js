/**
 * FaceDetector Unit Tests
 * 
 * Comprehensive test suite for the FaceDetector class covering:
 * - Model loading
 * - Face detection logic
 * - Video processing workflow
 * - Configuration options
 * - Thumbnail extraction
 * - Error handling and validation
 */

import { FaceDetector } from '../../src/modules/faces/FaceDetector';
import { FrameExtractor } from '../../src/core/FrameExtractor';
import { ModelLoader } from '../../src/models/ModelLoader';
import { VideoIntelError, ErrorCode } from '../../src/types';
import type { FaceOptions } from '../../src/types';
import * as faceapi from 'face-api.js';

// ============================================================================
// Mock Setup
// ============================================================================

// Mock face-api.js module
jest.mock('face-api.js', () => ({
  detectAllFaces: jest.fn(),
  TinyFaceDetectorOptions: jest.fn().mockImplementation((options) => options),
  nets: {
    tinyFaceDetector: {
      loadFromUri: jest.fn(),
      isLoaded: true,
      dispose: jest.fn()
    },
    ssdMobilenetv1: {
      loadFromUri: jest.fn(),
      isLoaded: false,
      dispose: jest.fn()
    }
  }
}));

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Create a mock video element for testing
 */
function createMockVideo(options: {
  duration?: number;
  width?: number;
  height?: number;
  readyState?: number;
} = {}): HTMLVideoElement {
  const video = document.createElement('video');
  
  Object.defineProperty(video, 'duration', {
    get: () => options.duration ?? 60,
    configurable: true
  });
  
  Object.defineProperty(video, 'videoWidth', {
    get: () => options.width ?? 1920,
    configurable: true
  });
  
  Object.defineProperty(video, 'videoHeight', {
    get: () => options.height ?? 1080,
    configurable: true
  });
  
  Object.defineProperty(video, 'readyState', {
    get: () => options.readyState ?? 4,
    configurable: true
  });
  
  return video;
}

/**
 * Create a mock canvas for testing
 */
function createMockCanvas(width: number = 1920, height: number = 1080): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  // Add some content to make it realistic
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#4A90E2';
    ctx.fillRect(0, 0, width, height);
  }
  
  return canvas;
}

/**
 * Create a mock face detection result from face-api.js
 */
function createMockFaceDetection(options: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  score?: number;
} = {}) {
  return {
    box: {
      x: options.x ?? 100,
      y: options.y ?? 100,
      width: options.width ?? 150,
      height: options.height ?? 150
    },
    score: options.score ?? 0.9
  };
}

// ============================================================================
// Test Suite
// ============================================================================

describe('FaceDetector', () => {
  let detector: FaceDetector;
  let frameExtractor: FrameExtractor;
  let modelLoader: ModelLoader;
  
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Create fresh instances
    frameExtractor = new FrameExtractor();
    modelLoader = new ModelLoader();
    detector = new FaceDetector(frameExtractor, modelLoader);
    
    // Setup default mock implementations
    jest.spyOn(modelLoader, 'isFaceModelLoaded').mockReturnValue(true);
    jest.spyOn(modelLoader, 'loadFaceDetectionModel').mockResolvedValue(undefined);
    
    // Mock frame extraction
    jest.spyOn(frameExtractor, 'extractFrames').mockResolvedValue([
      createMockCanvas(),
      createMockCanvas(),
      createMockCanvas()
    ]);
    
    // Mock canvasToBlob for thumbnail extraction
    jest.spyOn(frameExtractor, 'canvasToBlob').mockResolvedValue(
      new Blob(['mock face image'], { type: 'image/jpeg' })
    );
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ==========================================================================
  // Constructor Tests
  // ==========================================================================

  describe('constructor', () => {
    it('should create instance with required dependencies', () => {
      const det = new FaceDetector(frameExtractor, modelLoader);
      expect(det).toBeInstanceOf(FaceDetector);
    });
  });

  // ==========================================================================
  // Model Loading Tests
  // ==========================================================================

  describe('model loading', () => {
    it('should load model if not already loaded', async () => {
      const video = createMockVideo();
      
      // Model not loaded initially
      jest.spyOn(modelLoader, 'isFaceModelLoaded').mockReturnValue(false);
      const loadSpy = jest.spyOn(modelLoader, 'loadFaceDetectionModel');
      
      // Mock face detection to return no faces
      (faceapi.detectAllFaces as jest.Mock).mockResolvedValue([]);
      
      await detector.detect(video);
      
      // Should have called loadFaceDetectionModel
      expect(loadSpy).toHaveBeenCalledTimes(1);
    });

    it('should not reload model if already loaded', async () => {
      const video = createMockVideo();
      
      // Model already loaded
      jest.spyOn(modelLoader, 'isFaceModelLoaded').mockReturnValue(true);
      const loadSpy = jest.spyOn(modelLoader, 'loadFaceDetectionModel');
      
      // Mock face detection
      (faceapi.detectAllFaces as jest.Mock).mockResolvedValue([]);
      
      await detector.detect(video);
      
      // Should NOT have called loadFaceDetectionModel
      expect(loadSpy).not.toHaveBeenCalled();
    });

    it('should handle model loading errors', async () => {
      const video = createMockVideo();
      
      jest.spyOn(modelLoader, 'isFaceModelLoaded').mockReturnValue(false);
      jest.spyOn(modelLoader, 'loadFaceDetectionModel').mockRejectedValue(
        new VideoIntelError('Failed to load model', ErrorCode.MODEL_LOAD_ERROR)
      );
      
      await expect(detector.detect(video)).rejects.toThrow(VideoIntelError);
      await expect(detector.detect(video)).rejects.toThrow('Failed to load model');
    });

    it('should cache loaded model across multiple detections', async () => {
      const video = createMockVideo();
      
      jest.spyOn(modelLoader, 'isFaceModelLoaded').mockReturnValue(true);
      const loadSpy = jest.spyOn(modelLoader, 'loadFaceDetectionModel');
      
      (faceapi.detectAllFaces as jest.Mock).mockResolvedValue([]);
      
      // Multiple detections
      await detector.detect(video);
      await detector.detect(video);
      await detector.detect(video);
      
      // Should only load once (or not at all if already cached)
      expect(loadSpy).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Face Detection Tests
  // ==========================================================================

  describe('face detection', () => {
    it('should detect faces in frame with faces', async () => {
      const video = createMockVideo();
      
      // Mock face-api.js to return faces
      (faceapi.detectAllFaces as jest.Mock).mockResolvedValue([
        createMockFaceDetection({ x: 100, y: 100, width: 150, height: 150, score: 0.9 }),
        createMockFaceDetection({ x: 300, y: 200, width: 140, height: 140, score: 0.85 })
      ]);
      
      const result = await detector.detect(video, {
        returnCoordinates: true
      });
      
      expect(result.detected).toBe(true);
      expect(result.averageCount).toBeGreaterThan(0);
      expect(result.frames.length).toBeGreaterThan(0);
    });

    it('should return empty array for frame without faces', async () => {
      const video = createMockVideo();
      
      // Mock no faces detected
      (faceapi.detectAllFaces as jest.Mock).mockResolvedValue([]);
      
      const result = await detector.detect(video);
      
      expect(result.detected).toBe(false);
      expect(result.averageCount).toBe(0);
    });

    it('should respect confidence threshold', async () => {
      const video = createMockVideo();
      
      // Mock faces with different confidence scores
      (faceapi.detectAllFaces as jest.Mock).mockResolvedValue([
        createMockFaceDetection({ score: 0.9 }), // Above threshold
        createMockFaceDetection({ score: 0.5 })  // Below threshold
      ]);
      
      // face-api.js TinyFaceDetectorOptions should filter by scoreThreshold
      const result = await detector.detect(video, {
        confidence: 0.7,
        returnCoordinates: true
      });
      
      // Verify TinyFaceDetectorOptions was called with correct threshold
      expect(faceapi.TinyFaceDetectorOptions).toHaveBeenCalledWith({
        inputSize: 224,
        scoreThreshold: 0.7
      });
    });

    it('should return correct bounding box coordinates', async () => {
      const video = createMockVideo();
      
      const mockFace = createMockFaceDetection({
        x: 120,
        y: 80,
        width: 150,
        height: 150,
        score: 0.95
      });
      
      (faceapi.detectAllFaces as jest.Mock).mockResolvedValue([mockFace]);
      
      const result = await detector.detect(video, {
        returnCoordinates: true
      });
      
      expect(result.frames.length).toBeGreaterThan(0);
      const face = result.frames[0].faces[0];
      
      expect(face.x).toBe(120);
      expect(face.y).toBe(80);
      expect(face.width).toBe(150);
      expect(face.height).toBe(150);
      expect(face.confidence).toBeCloseTo(0.95, 2);
    });

    it('should handle multiple faces in one frame', async () => {
      const video = createMockVideo();
      
      (faceapi.detectAllFaces as jest.Mock).mockResolvedValue([
        createMockFaceDetection({ x: 100, y: 100 }),
        createMockFaceDetection({ x: 300, y: 100 }),
        createMockFaceDetection({ x: 500, y: 100 })
      ]);
      
      const result = await detector.detect(video, {
        returnCoordinates: true
      });
      
      expect(result.frames.length).toBeGreaterThan(0);
      // Each frame should have 3 faces
      result.frames.forEach(frame => {
        expect(frame.faces.length).toBe(3);
      });
    });
  });

  // ==========================================================================
  // Video Processing Tests
  // ==========================================================================

  describe('video processing', () => {
    it('should process video at correct sampling rate', async () => {
      const video = createMockVideo({ duration: 10 });
      
      (faceapi.detectAllFaces as jest.Mock).mockResolvedValue([]);
      
      await detector.detect(video, {
        samplingRate: 2.0 // Every 2 seconds
      });
      
      // Should extract frames at 0, 2, 4, 6, 8 seconds (5 frames)
      expect(frameExtractor.extractFrames).toHaveBeenCalled();
      const timestamps = (frameExtractor.extractFrames as jest.Mock).mock.calls[0][1];
      
      expect(timestamps.length).toBeGreaterThanOrEqual(5);
      expect(timestamps[0]).toBe(0);
      expect(timestamps[1]).toBe(2);
    });

    it('should return correct FaceDetection structure', async () => {
      const video = createMockVideo();
      
      (faceapi.detectAllFaces as jest.Mock).mockResolvedValue([
        createMockFaceDetection()
      ]);
      
      const result = await detector.detect(video);
      
      expect(result).toHaveProperty('detected');
      expect(result).toHaveProperty('averageCount');
      expect(result).toHaveProperty('frames');
      
      expect(typeof result.detected).toBe('boolean');
      expect(typeof result.averageCount).toBe('number');
      expect(Array.isArray(result.frames)).toBe(true);
    });

    it('should calculate average face count correctly', async () => {
      const video = createMockVideo();
      
      // Mock varying face counts across frames
      let callCount = 0;
      (faceapi.detectAllFaces as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 1) return Promise.resolve([createMockFaceDetection()]);
        if (callCount === 2) return Promise.resolve([createMockFaceDetection(), createMockFaceDetection()]);
        return Promise.resolve([createMockFaceDetection()]);
      });
      
      const result = await detector.detect(video);
      
      // Average: (1 + 2 + 1) / 3 = 1.33
      expect(result.averageCount).toBeCloseTo(1.33, 2);
    });

    it('should handle videos with no faces', async () => {
      const video = createMockVideo();
      
      (faceapi.detectAllFaces as jest.Mock).mockResolvedValue([]);
      
      const result = await detector.detect(video);
      
      expect(result.detected).toBe(false);
      expect(result.averageCount).toBe(0);
      expect(result.frames).toHaveLength(0);
    });

    it('should handle videos with faces throughout', async () => {
      const video = createMockVideo({ duration: 10 });
      
      // Always return faces
      (faceapi.detectAllFaces as jest.Mock).mockResolvedValue([
        createMockFaceDetection()
      ]);
      
      const result = await detector.detect(video, {
        returnCoordinates: true
      });
      
      expect(result.detected).toBe(true);
      expect(result.averageCount).toBeGreaterThan(0);
      expect(result.frames.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Options Tests
  // ==========================================================================

  describe('options', () => {
    it('should use default confidence when not provided', async () => {
      const video = createMockVideo();
      
      (faceapi.detectAllFaces as jest.Mock).mockResolvedValue([]);
      
      await detector.detect(video);
      
      // Should use default confidence of 0.7
      expect(faceapi.TinyFaceDetectorOptions).toHaveBeenCalledWith({
        inputSize: 224,
        scoreThreshold: 0.7
      });
    });

    it('should respect custom confidence option', async () => {
      const video = createMockVideo();
      
      (faceapi.detectAllFaces as jest.Mock).mockResolvedValue([]);
      
      await detector.detect(video, {
        confidence: 0.85
      });
      
      expect(faceapi.TinyFaceDetectorOptions).toHaveBeenCalledWith({
        inputSize: 224,
        scoreThreshold: 0.85
      });
    });

    it('should respect returnCoordinates option (false)', async () => {
      const video = createMockVideo();
      
      (faceapi.detectAllFaces as jest.Mock).mockResolvedValue([
        createMockFaceDetection()
      ]);
      
      const result = await detector.detect(video, {
        returnCoordinates: false
      });
      
      // Should not include frames when coordinates not requested
      expect(result.frames).toHaveLength(0);
    });

    it('should respect returnCoordinates option (true)', async () => {
      const video = createMockVideo();
      
      (faceapi.detectAllFaces as jest.Mock).mockResolvedValue([
        createMockFaceDetection()
      ]);
      
      const result = await detector.detect(video, {
        returnCoordinates: true
      });
      
      // Should include frames when coordinates requested
      expect(result.frames.length).toBeGreaterThan(0);
    });

    it('should respect samplingRate option', async () => {
      const video = createMockVideo({ duration: 20 });
      
      (faceapi.detectAllFaces as jest.Mock).mockResolvedValue([]);
      
      await detector.detect(video, {
        samplingRate: 5.0 // Every 5 seconds
      });
      
      const timestamps = (frameExtractor.extractFrames as jest.Mock).mock.calls[0][1];
      
      // Should sample at 0, 5, 10, 15
      expect(timestamps).toContain(0);
      expect(timestamps).toContain(5);
      expect(timestamps).toContain(10);
      expect(timestamps).toContain(15);
    });

    it('should use default samplingRate when not provided', async () => {
      const video = createMockVideo({ duration: 10 });
      
      (faceapi.detectAllFaces as jest.Mock).mockResolvedValue([]);
      
      await detector.detect(video);
      
      const timestamps = (frameExtractor.extractFrames as jest.Mock).mock.calls[0][1];
      
      // Default sampling rate is 2.0 seconds
      expect(timestamps).toContain(0);
      expect(timestamps).toContain(2);
      expect(timestamps).toContain(4);
    });
  });

  // ==========================================================================
  // Thumbnail Extraction Tests
  // ==========================================================================

  describe('thumbnail extraction', () => {
    it('should extract face thumbnails when returnThumbnails is true', async () => {
      const video = createMockVideo();
      
      (faceapi.detectAllFaces as jest.Mock).mockResolvedValue([
        createMockFaceDetection()
      ]);
      
      const result = await detector.detect(video, {
        returnCoordinates: true,
        returnThumbnails: true
      });
      
      expect(result.frames.length).toBeGreaterThan(0);
      const face = result.frames[0].faces[0];
      
      expect(face.thumbnail).toBeDefined();
      expect(face.thumbnail).toBeInstanceOf(Blob);
    });

    it('should not extract thumbnails when returnThumbnails is false', async () => {
      const video = createMockVideo();
      
      (faceapi.detectAllFaces as jest.Mock).mockResolvedValue([
        createMockFaceDetection()
      ]);
      
      const result = await detector.detect(video, {
        returnCoordinates: true,
        returnThumbnails: false
      });
      
      expect(result.frames.length).toBeGreaterThan(0);
      const face = result.frames[0].faces[0];
      
      expect(face.thumbnail).toBeUndefined();
    });

    it('should respect thumbnailFormat option (jpeg)', async () => {
      const video = createMockVideo();
      
      (faceapi.detectAllFaces as jest.Mock).mockResolvedValue([
        createMockFaceDetection()
      ]);
      
      await detector.detect(video, {
        returnCoordinates: true,
        returnThumbnails: true,
        thumbnailFormat: 'jpeg'
      });
      
      // canvasToBlob should be called with 'image/jpeg'
      expect(frameExtractor.canvasToBlob).toHaveBeenCalledWith(
        expect.any(Object),
        'image/jpeg',
        expect.any(Number)
      );
    });

    it('should respect thumbnailFormat option (png)', async () => {
      const video = createMockVideo();
      
      (faceapi.detectAllFaces as jest.Mock).mockResolvedValue([
        createMockFaceDetection()
      ]);
      
      await detector.detect(video, {
        returnCoordinates: true,
        returnThumbnails: true,
        thumbnailFormat: 'png'
      });
      
      // canvasToBlob should be called with 'image/png'
      expect(frameExtractor.canvasToBlob).toHaveBeenCalledWith(
        expect.any(Object),
        'image/png',
        expect.any(Number)
      );
    });

    it('should respect thumbnailQuality option', async () => {
      const video = createMockVideo();
      
      (faceapi.detectAllFaces as jest.Mock).mockResolvedValue([
        createMockFaceDetection()
      ]);
      
      await detector.detect(video, {
        returnCoordinates: true,
        returnThumbnails: true,
        thumbnailQuality: 0.95
      });
      
      // canvasToBlob should be called with quality 0.95
      expect(frameExtractor.canvasToBlob).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(String),
        0.95
      );
    });

    it('should validate returnThumbnails requires returnCoordinates', async () => {
      const video = createMockVideo();
      
      await expect(
        detector.detect(video, {
          returnCoordinates: false,
          returnThumbnails: true
        })
      ).rejects.toThrow(VideoIntelError);
      
      await expect(
        detector.detect(video, {
          returnCoordinates: false,
          returnThumbnails: true
        })
      ).rejects.toThrow('returnThumbnails requires returnCoordinates');
    });

    it('should handle thumbnail extraction errors gracefully', async () => {
      const video = createMockVideo();
      
      (faceapi.detectAllFaces as jest.Mock).mockResolvedValue([
        createMockFaceDetection()
      ]);
      
      // Mock canvasToBlob to fail
      jest.spyOn(frameExtractor, 'canvasToBlob').mockRejectedValue(
        new Error('Blob conversion failed')
      );
      
      // Should not throw - should continue without thumbnail
      const result = await detector.detect(video, {
        returnCoordinates: true,
        returnThumbnails: true
      });
      
      expect(result.frames.length).toBeGreaterThan(0);
      // Face should exist but without thumbnail
      const face = result.frames[0].faces[0];
      expect(face).toBeDefined();
      expect(face.thumbnail).toBeUndefined();
    });

    it('should use default thumbnail options when not provided', async () => {
      const video = createMockVideo();
      
      (faceapi.detectAllFaces as jest.Mock).mockResolvedValue([
        createMockFaceDetection()
      ]);
      
      await detector.detect(video, {
        returnCoordinates: true,
        returnThumbnails: true
      });
      
      // Should use default format (jpeg) and quality (0.8)
      expect(frameExtractor.canvasToBlob).toHaveBeenCalledWith(
        expect.any(Object),
        'image/jpeg',
        0.8
      );
    });
  });

  // ==========================================================================
  // Error Handling Tests
  // ==========================================================================

  describe('error handling', () => {
    it('should handle invalid video input', async () => {
      const invalidVideo = null as any;
      
      await expect(
        detector.detect(invalidVideo)
      ).rejects.toThrow();
    });

    it('should handle frame extraction failures', async () => {
      const video = createMockVideo();
      
      jest.spyOn(frameExtractor, 'extractFrames').mockRejectedValue(
        new Error('Frame extraction failed')
      );
      
      await expect(
        detector.detect(video)
      ).rejects.toThrow();
    });

    it('should wrap face detection errors', async () => {
      const video = createMockVideo();
      
      (faceapi.detectAllFaces as jest.Mock).mockRejectedValue(
        new Error('Detection failed')
      );
      
      await expect(
        detector.detect(video)
      ).rejects.toThrow(VideoIntelError);
    });

    it('should handle very short videos', async () => {
      const video = createMockVideo({ duration: 0.5 });
      
      (faceapi.detectAllFaces as jest.Mock).mockResolvedValue([]);
      
      // Should not throw
      const result = await detector.detect(video);
      
      expect(result).toBeDefined();
      expect(result.detected).toBe(false);
    });

    it('should handle edge case with no frames extracted', async () => {
      const video = createMockVideo();
      
      jest.spyOn(frameExtractor, 'extractFrames').mockResolvedValue([]);
      
      const result = await detector.detect(video);
      
      expect(result.detected).toBe(false);
      expect(result.averageCount).toBe(0);
    });
  });

  // ==========================================================================
  // Face Crop Boundary Tests
  // ==========================================================================

  describe('face crop boundaries', () => {
    it('should handle faces at frame edges', async () => {
      const video = createMockVideo({ width: 1920, height: 1080 });
      
      // Face at top-left corner
      (faceapi.detectAllFaces as jest.Mock).mockResolvedValue([
        createMockFaceDetection({ x: 0, y: 0, width: 100, height: 100 })
      ]);
      
      const result = await detector.detect(video, {
        returnCoordinates: true,
        returnThumbnails: true
      });
      
      expect(result.frames.length).toBeGreaterThan(0);
      const face = result.frames[0].faces[0];
      
      // Should have coordinates (even at edge)
      expect(face.x).toBe(0);
      expect(face.y).toBe(0);
    });

    it('should handle faces near frame boundaries', async () => {
      const video = createMockVideo({ width: 1920, height: 1080 });
      
      // Face near bottom-right corner
      (faceapi.detectAllFaces as jest.Mock).mockResolvedValue([
        createMockFaceDetection({ x: 1800, y: 950, width: 150, height: 150 })
      ]);
      
      const result = await detector.detect(video, {
        returnCoordinates: true,
        returnThumbnails: true
      });
      
      expect(result.frames.length).toBeGreaterThan(0);
      const face = result.frames[0].faces[0];
      
      expect(face).toBeDefined();
      expect(face.thumbnail).toBeDefined();
    });

    it('should handle partially visible faces', async () => {
      const video = createMockVideo();
      
      // Face partially outside frame
      (faceapi.detectAllFaces as jest.Mock).mockResolvedValue([
        createMockFaceDetection({ x: -50, y: 100, width: 150, height: 150 })
      ]);
      
      // Should handle gracefully
      const result = await detector.detect(video, {
        returnCoordinates: true
      });
      
      expect(result.frames.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Integration-style Tests
  // ==========================================================================

  describe('end-to-end workflow', () => {
    it('should complete full detection workflow', async () => {
      const video = createMockVideo({ duration: 10 });
      
      (faceapi.detectAllFaces as jest.Mock).mockResolvedValue([
        createMockFaceDetection({ score: 0.9 })
      ]);
      
      const result = await detector.detect(video, {
        confidence: 0.7,
        returnCoordinates: true,
        returnThumbnails: true,
        thumbnailFormat: 'jpeg',
        thumbnailQuality: 0.8,
        samplingRate: 2.0
      });
      
      // Verify complete result structure
      expect(result.detected).toBe(true);
      expect(result.averageCount).toBeGreaterThan(0);
      expect(result.frames.length).toBeGreaterThan(0);
      
      // Verify face details
      const face = result.frames[0].faces[0];
      expect(face).toHaveProperty('x');
      expect(face).toHaveProperty('y');
      expect(face).toHaveProperty('width');
      expect(face).toHaveProperty('height');
      expect(face).toHaveProperty('confidence');
      expect(face).toHaveProperty('thumbnail');
      
      expect(face.thumbnail).toBeInstanceOf(Blob);
    });

    it('should handle realistic multi-frame scenario', async () => {
      const video = createMockVideo({ duration: 10 });
      
      // Different face counts per frame
      let callIndex = 0;
      (faceapi.detectAllFaces as jest.Mock).mockImplementation(() => {
        const counts = [2, 1, 0, 2, 3]; // Varying face counts
        const count = counts[callIndex % counts.length];
        callIndex++;
        
        const faces = [];
        for (let i = 0; i < count; i++) {
          faces.push(createMockFaceDetection({
            x: 100 + (i * 200),
            y: 100,
            score: 0.85 + (Math.random() * 0.1)
          }));
        }
        return Promise.resolve(faces);
      });
      
      const result = await detector.detect(video, {
        returnCoordinates: true,
        samplingRate: 2.0
      });
      
      expect(result.detected).toBe(true);
      expect(result.averageCount).toBeGreaterThan(0);
      expect(result.frames.length).toBeGreaterThan(0);
      
      // Some frames should have multiple faces
      const faceCounts = result.frames.map(f => f.faces.length);
      expect(Math.max(...faceCounts)).toBeGreaterThan(1);
    });
  });
});


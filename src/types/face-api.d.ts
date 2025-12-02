/**
 * Minimal TypeScript type definitions for face-api.js
 * Only includes types needed for VideoIntel.js face detection implementation
 */

declare module 'face-api.js' {
  // ==========================================
  // Core Detection Classes
  // ==========================================

  /**
   * Tiny Face Detector - lightweight model for face detection
   */
  export class TinyFaceDetectorOptions {
    constructor(options?: { inputSize?: number; scoreThreshold?: number });
    inputSize: number;
    scoreThreshold: number;
  }

  /**
   * SSD MobileNet V1 options (for future use)
   */
  export class SsdMobilenetv1Options {
    constructor(options?: { minConfidence?: number; maxResults?: number });
    minConfidence: number;
    maxResults: number;
  }

  // ==========================================
  // Detection Results
  // ==========================================

  /**
   * Box coordinates for detected face
   */
  export class Box {
    x: number;
    y: number;
    width: number;
    height: number;
    constructor(x: number, y: number, width: number, height: number);
  }

  /**
   * Bounding box with additional methods
   */
  export class Rect {
    x: number;
    y: number;
    width: number;
    height: number;
    constructor(x: number, y: number, width: number, height: number);
  }

  /**
   * Face detection result with bounding box and score
   */
  export class FaceDetection {
    score: number;
    box: Box;
    constructor(score: number, relativeBox: Box, dimensions: { width: number; height: number });
    forSize(width: number, height: number): FaceDetection;
  }

  /**
   * Face detection with additional data (landmarks, descriptors, etc.)
   */
  export interface WithFaceDetection<TSource> {
    detection: FaceDetection;
    source: TSource;
  }

  // ==========================================
  // Detection Functions
  // ==========================================

  /**
   * Detect all faces in an image
   */
  export function detectAllFaces(
    input: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement,
    options?: TinyFaceDetectorOptions | SsdMobilenetv1Options
  ): Promise<FaceDetection[]>;

  /**
   * Detect single face in an image
   */
  export function detectSingleFace(
    input: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement,
    options?: TinyFaceDetectorOptions | SsdMobilenetv1Options
  ): Promise<FaceDetection | undefined>;

  // ==========================================
  // Model Loading (nets)
  // ==========================================

  export interface NeuralNetwork<TNetParams = any> {
    load(url: string): Promise<TNetParams>;
    loadFromUri(uri: string): Promise<TNetParams>;
    loadFromDisk(filePath: string): Promise<TNetParams>;
    loadFromWeightMap(weightMap: any): Promise<TNetParams>;
    isLoaded: boolean;
    dispose(): void;
  }

  export namespace nets {
    /**
     * Tiny Face Detector model
     */
    export const tinyFaceDetector: NeuralNetwork;

    /**
     * SSD MobileNet V1 model (for future use)
     */
    export const ssdMobilenetv1: NeuralNetwork;

    /**
     * Face Landmark 68 model (for future use)
     */
    export const faceLandmark68Net: NeuralNetwork;

    /**
     * Face Recognition model (for future use)
     */
    export const faceRecognitionNet: NeuralNetwork;
  }

  // ==========================================
  // Utility Types
  // ==========================================

  /**
   * Dimensions interface
   */
  export interface IDimensions {
    width: number;
    height: number;
  }

  /**
   * Point interface
   */
  export interface IPoint {
    x: number;
    y: number;
  }

  /**
   * Rectangle interface
   */
  export interface IRect {
    x: number;
    y: number;
    width: number;
    height: number;
  }

  // ==========================================
  // Environment Setup
  // ==========================================

  /**
   * Environment configuration
   */
  export namespace env {
    export function setModelFilePrefix(prefix: string): void;
    export function setWasmPaths(path: string): void;
    export function isBrowser(): boolean;
    export function isNodejs(): boolean;
  }

  // ==========================================
  // TensorFlow.js re-exports (if needed)
  // ==========================================

  export interface TNetInput {
    inputs: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement;
  }
}


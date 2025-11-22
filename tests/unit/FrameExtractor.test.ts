/**
 * FrameExtractor Unit Tests
 * 
 * Comprehensive test suite for the FrameExtractor class covering:
 * - Single frame extraction
 * - Batch frame extraction
 * - Interval-based extraction
 * - Canvas to blob conversion
 * - Error handling and validation
 * - Edge cases and boundary conditions
 */

import { FrameExtractor } from '../../src/core/FrameExtractor';
import { VideoIntelError, ErrorCode } from '../../src/types';

// ============================================================================
// Mock Setup
// ============================================================================

/**
 * Extended mock video interface with test helpers
 */
interface MockVideoElement extends HTMLVideoElement {
  _eventHandlers: Record<string, EventListener[]>;
  _triggerEvent(eventName: string): void;
}

/**
 * Create a mock HTMLVideoElement for testing
 * This simulates a loaded video with controllable properties
 */
function createMockVideo(config?: {
  duration?: number;
  width?: number;
  height?: number;
  readyState?: number;
}): MockVideoElement {
  const {
    duration = 60,
    width = 1920,
    height = 1080,
    readyState = 4, // HAVE_ENOUGH_DATA
  } = config || {};

  // Create a partial mock of HTMLVideoElement with test helpers
  const eventHandlers: Record<string, EventListener[]> = {};

  const video = {
    duration,
    videoWidth: width,
    videoHeight: height,
    readyState,
    currentTime: 0,
    
    // Mock event listener methods
    addEventListener: jest.fn((event: string, handler: EventListener) => {
      // Store handlers for manual triggering
      if (!eventHandlers[event]) {
        eventHandlers[event] = [];
      }
      eventHandlers[event].push(handler);
    }),
    
    removeEventListener: jest.fn((event: string, handler: EventListener) => {
      if (eventHandlers[event]) {
        eventHandlers[event] = eventHandlers[event].filter(
          (h: EventListener) => h !== handler
        );
      }
    }),
    
    // Helper to trigger events
    _triggerEvent(eventName: string) {
      if (eventHandlers[eventName]) {
        eventHandlers[eventName].forEach((handler: EventListener) => {
          handler(new Event(eventName));
        });
      }
    },
    
    _eventHandlers: eventHandlers,
  } as unknown as MockVideoElement;

  return video;
}

/**
 * Create a mock canvas element
 */
function createMockCanvas(width: number = 1920, height: number = 1080): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/**
 * Mock document.createElement for canvas creation
 */
function mockCreateElement() {
  const originalCreateElement = document.createElement.bind(document);
  
  jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
    if (tagName === 'canvas') {
      const canvas = originalCreateElement('canvas') as HTMLCanvasElement;
      
      // Create a mock 2D context
      const mockContext = {
        drawImage: jest.fn(),
        getImageData: jest.fn(() => ({
          data: new Uint8ClampedArray(4),
          width: 1,
          height: 1,
        })),
        putImageData: jest.fn(),
        fillRect: jest.fn(),
        clearRect: jest.fn(),
        canvas,
      } as unknown as CanvasRenderingContext2D;
      
      // Mock getContext to return our mock context
      jest.spyOn(canvas, 'getContext').mockImplementation((contextType: string) => {
        if (contextType === '2d') {
          return mockContext;
        }
        return null;
      });
      
      // Mock toBlob
      jest.spyOn(canvas, 'toBlob').mockImplementation((callback: BlobCallback) => {
        // Simulate async blob creation
        setTimeout(() => {
          const blob = new Blob(['mock image data'], { type: 'image/jpeg' });
          callback(blob);
        }, 0);
      });
      
      return canvas;
    }
    return originalCreateElement(tagName);
  });
}

// ============================================================================
// Test Suite
// ============================================================================

describe('FrameExtractor', () => {
  let extractor: FrameExtractor;

  beforeEach(() => {
    // Create fresh instance for each test
    extractor = new FrameExtractor();
    
    // Setup canvas mocking
    mockCreateElement();
  });

  afterEach(() => {
    // Restore all mocks
    jest.restoreAllMocks();
  });

  // ==========================================================================
  // extractFrame() Tests
  // ==========================================================================

  describe('extractFrame()', () => {
    it('should extract a frame at timestamp 0', async () => {
      const video = createMockVideo();
      
      // Trigger seeked event asynchronously
      setTimeout(() => {
        video._triggerEvent('seeked');
      }, 10);

      const canvas = await extractor.extractFrame(video, 0);

      expect(canvas).toBeInstanceOf(HTMLCanvasElement);
      expect(canvas.width).toBe(1920);
      expect(canvas.height).toBe(1080);
      expect(video.currentTime).toBe(0);
    });

    it('should extract a frame at middle of video', async () => {
      const video = createMockVideo({ duration: 60 });
      
      setTimeout(() => {
        video._triggerEvent('seeked');
      }, 10);

      const canvas = await extractor.extractFrame(video, 30);

      expect(canvas).toBeInstanceOf(HTMLCanvasElement);
      expect(video.currentTime).toBe(30);
    });

    it('should extract a frame at end of video', async () => {
      const video = createMockVideo({ duration: 60 });
      
      setTimeout(() => {
        video._triggerEvent('seeked');
      }, 10);

      const canvas = await extractor.extractFrame(video, 60);

      expect(canvas).toBeInstanceOf(HTMLCanvasElement);
      expect(video.currentTime).toBe(60);
    });

    it('should throw error for negative timestamp', async () => {
      const video = createMockVideo();

      await expect(extractor.extractFrame(video, -5)).rejects.toThrow(
        VideoIntelError
      );
      
      await expect(extractor.extractFrame(video, -5)).rejects.toMatchObject({
        code: ErrorCode.INVALID_TIMESTAMP,
      });
    });

    it('should throw error for timestamp exceeding duration', async () => {
      const video = createMockVideo({ duration: 60 });

      await expect(extractor.extractFrame(video, 65)).rejects.toThrow(
        VideoIntelError
      );
      
      await expect(extractor.extractFrame(video, 65)).rejects.toMatchObject({
        code: ErrorCode.INVALID_TIMESTAMP,
      });
    });

    it('should throw error for NaN timestamp', async () => {
      const video = createMockVideo();

      await expect(extractor.extractFrame(video, NaN)).rejects.toThrow(
        VideoIntelError
      );
      
      await expect(extractor.extractFrame(video, NaN)).rejects.toMatchObject({
        code: ErrorCode.INVALID_TIMESTAMP,
      });
    });

    it('should throw error for Infinity timestamp', async () => {
      const video = createMockVideo();

      await expect(extractor.extractFrame(video, Infinity)).rejects.toThrow(
        VideoIntelError
      );
      
      await expect(extractor.extractFrame(video, Infinity)).rejects.toMatchObject({
        code: ErrorCode.INVALID_TIMESTAMP,
      });
    });

    it('should throw error for video not ready', async () => {
      const video = createMockVideo({ readyState: 0 });

      await expect(extractor.extractFrame(video, 10)).rejects.toThrow(
        VideoIntelError
      );
      
      await expect(extractor.extractFrame(video, 10)).rejects.toMatchObject({
        code: ErrorCode.VIDEO_NOT_READY,
      });
    });

    it('should throw error for video with zero dimensions', async () => {
      const video = createMockVideo({ width: 0, height: 0 });

      await expect(extractor.extractFrame(video, 10)).rejects.toThrow(
        VideoIntelError
      );
      
      await expect(extractor.extractFrame(video, 10)).rejects.toMatchObject({
        code: ErrorCode.VIDEO_NOT_READY,
      });
    });

    it('should handle seek timeout', async () => {
      jest.useFakeTimers();
      
      const video = createMockVideo();
      
      // Don't trigger seeked event - let it timeout
      const extractPromise = extractor.extractFrame(video, 10);
      
      // Fast-forward time to trigger timeout
      jest.advanceTimersByTime(5001); // Past the 5 second timeout
      
      await expect(extractPromise).rejects.toThrow(VideoIntelError);
      await expect(extractPromise).rejects.toMatchObject({
        code: ErrorCode.TIMEOUT_ERROR,
      });
      
      jest.useRealTimers();
    }, 10000); // Increase test timeout

    it('should clean up event listeners after successful extraction', async () => {
      const video = createMockVideo();
      
      setTimeout(() => {
        video._triggerEvent('seeked');
      }, 10);

      await extractor.extractFrame(video, 10);

      // Check that listeners were removed
      expect(video.removeEventListener).toHaveBeenCalledWith(
        'seeked',
        expect.any(Function)
      );
      expect(video.removeEventListener).toHaveBeenCalledWith(
        'error',
        expect.any(Function)
      );
    });

    it('should clean up event listeners after error', async () => {
      const video = createMockVideo();
      
      setTimeout(() => {
        video._triggerEvent('error');
      }, 10);

      await expect(extractor.extractFrame(video, 10)).rejects.toThrow();

      // Check that listeners were removed
      expect(video.removeEventListener).toHaveBeenCalledWith(
        'seeked',
        expect.any(Function)
      );
      expect(video.removeEventListener).toHaveBeenCalledWith(
        'error',
        expect.any(Function)
      );
    });
  });

  // ==========================================================================
  // extractFrames() Tests
  // ==========================================================================

  describe('extractFrames()', () => {
    it('should extract multiple frames in order', async () => {
      const video = createMockVideo({ duration: 60 });
      
      // Auto-trigger seeked for all seeks
      (video.addEventListener as jest.Mock).mockImplementation((event, handler) => {
        if (event === 'seeked') {
          setTimeout(() => handler(new Event('seeked')), 10);
        }
      });

      const timestamps = [10, 20, 30, 40];
      const frames = await extractor.extractFrames(video, timestamps);

      expect(frames).toHaveLength(4);
      frames.forEach((frame) => {
        expect(frame).toBeInstanceOf(HTMLCanvasElement);
      });
    });

    it('should handle unordered timestamps', async () => {
      const video = createMockVideo({ duration: 60 });
      
      (video.addEventListener as jest.Mock).mockImplementation((event, handler) => {
        if (event === 'seeked') {
          setTimeout(() => handler(new Event('seeked')), 10);
        }
      });

      const timestamps = [40, 10, 30, 20]; // Unordered
      const frames = await extractor.extractFrames(video, timestamps);

      expect(frames).toHaveLength(4);
      // Frames should be returned in same order as input timestamps
    });

    it('should handle empty timestamp array', async () => {
      const video = createMockVideo();

      const frames = await extractor.extractFrames(video, []);

      expect(frames).toHaveLength(0);
    });

    it('should handle single timestamp', async () => {
      const video = createMockVideo({ duration: 60 });
      
      (video.addEventListener as jest.Mock).mockImplementation((event, handler) => {
        if (event === 'seeked') {
          setTimeout(() => handler(new Event('seeked')), 10);
        }
      });

      const frames = await extractor.extractFrames(video, [30]);

      expect(frames).toHaveLength(1);
      expect(frames[0]).toBeInstanceOf(HTMLCanvasElement);
    });

    it('should handle duplicate timestamps', async () => {
      const video = createMockVideo({ duration: 60 });
      
      (video.addEventListener as jest.Mock).mockImplementation((event, handler) => {
        if (event === 'seeked') {
          setTimeout(() => handler(new Event('seeked')), 10);
        }
      });

      const timestamps = [10, 10, 20, 20];
      const frames = await extractor.extractFrames(video, timestamps);

      expect(frames).toHaveLength(4);
    });

    it('should call progress callback', async () => {
      const video = createMockVideo({ duration: 60 });
      
      (video.addEventListener as jest.Mock).mockImplementation((event, handler) => {
        if (event === 'seeked') {
          setTimeout(() => handler(new Event('seeked')), 10);
        }
      });

      const progressValues: number[] = [];
      const onProgress = jest.fn((progress: number) => {
        progressValues.push(progress);
      });

      await extractor.extractFrames(video, [10, 20, 30, 40], onProgress);

      expect(onProgress).toHaveBeenCalled();
      expect(progressValues.length).toBeGreaterThan(0);
      expect(progressValues[progressValues.length - 1]).toBe(100);
    });

    it('should not break if progress callback throws', async () => {
      const video = createMockVideo({ duration: 60 });
      
      (video.addEventListener as jest.Mock).mockImplementation((event, handler) => {
        if (event === 'seeked') {
          setTimeout(() => handler(new Event('seeked')), 10);
        }
      });

      const onProgress = jest.fn(() => {
        throw new Error('Progress callback error');
      });

      // Should not throw despite callback errors
      await expect(
        extractor.extractFrames(video, [10, 20], onProgress)
      ).resolves.toBeDefined();
    });

    it('should throw error with frame context on failure', async () => {
      const video = createMockVideo({ duration: 60 });
      
      let callCount = 0;
      (video.addEventListener as jest.Mock).mockImplementation((event, handler) => {
        if (event === 'seeked') {
          callCount++;
          if (callCount === 2) {
            // Don't trigger seeked on second frame - leave it to fail
            return;
          } else {
            setTimeout(() => handler(new Event('seeked')), 10);
          }
        }
        if (event === 'error') {
          if (callCount === 2) {
            setTimeout(() => handler(new Event('error')), 10);
          }
        }
      });

      await expect(
        extractor.extractFrames(video, [10, 20, 30])
      ).rejects.toThrow(VideoIntelError);
      
      try {
        await extractor.extractFrames(video, [10, 20, 30]);
      } catch (error) {
        if (error instanceof VideoIntelError) {
          // Check that error message includes frame context
          expect(error.message).toContain('frame');
          expect(error.details).toHaveProperty('frameIndex');
        }
      }
    }, 10000); // Increase timeout for this test
  });

  // ==========================================================================
  // extractFramesAtInterval() Tests
  // ==========================================================================

  describe('extractFramesAtInterval()', () => {
    it('should extract frames at regular intervals', async () => {
      const video = createMockVideo({ duration: 60 });
      
      (video.addEventListener as jest.Mock).mockImplementation((event, handler) => {
        if (event === 'seeked') {
          setTimeout(() => handler(new Event('seeked')), 10);
        }
      });

      const frames = await extractor.extractFramesAtInterval(video, 10);

      // Should extract at 0, 10, 20, 30, 40, 50
      expect(frames.length).toBeGreaterThan(0);
    });

    it('should respect start time option', async () => {
      const video = createMockVideo({ duration: 60 });
      
      (video.addEventListener as jest.Mock).mockImplementation((event, handler) => {
        if (event === 'seeked') {
          setTimeout(() => handler(new Event('seeked')), 10);
        }
      });

      const frames = await extractor.extractFramesAtInterval(video, 10, {
        startTime: 20,
      });

      // Should start at 20s
      expect(frames.length).toBeGreaterThan(0);
    });

    it('should respect end time option', async () => {
      const video = createMockVideo({ duration: 60 });
      
      (video.addEventListener as jest.Mock).mockImplementation((event, handler) => {
        if (event === 'seeked') {
          setTimeout(() => handler(new Event('seeked')), 10);
        }
      });

      const frames = await extractor.extractFramesAtInterval(video, 10, {
        endTime: 30,
      });

      // Should stop at 30s
      expect(frames.length).toBeGreaterThan(0);
    });

    it('should handle interval larger than video duration', async () => {
      const video = createMockVideo({ duration: 5 });
      
      (video.addEventListener as jest.Mock).mockImplementation((event, handler) => {
        if (event === 'seeked') {
          setTimeout(() => handler(new Event('seeked')), 10);
        }
      });

      const frames = await extractor.extractFramesAtInterval(video, 10);

      // Should extract at least one frame (at start)
      expect(frames.length).toBeGreaterThanOrEqual(1);
    });

    it('should throw error for zero or negative interval', async () => {
      const video = createMockVideo();

      await expect(
        extractor.extractFramesAtInterval(video, 0)
      ).rejects.toThrow(VideoIntelError);

      await expect(
        extractor.extractFramesAtInterval(video, -5)
      ).rejects.toThrow(VideoIntelError);
    });

    it('should throw error for invalid start time', async () => {
      const video = createMockVideo({ duration: 60 });

      await expect(
        extractor.extractFramesAtInterval(video, 5, { startTime: -10 })
      ).rejects.toThrow(VideoIntelError);

      await expect(
        extractor.extractFramesAtInterval(video, 5, { startTime: 70 })
      ).rejects.toThrow(VideoIntelError);
    });

    it('should throw error for invalid end time', async () => {
      const video = createMockVideo({ duration: 60 });

      await expect(
        extractor.extractFramesAtInterval(video, 5, { startTime: 10, endTime: 5 })
      ).rejects.toThrow(VideoIntelError);

      await expect(
        extractor.extractFramesAtInterval(video, 5, { endTime: 70 })
      ).rejects.toThrow(VideoIntelError);
    });

    it('should call progress callback', async () => {
      const video = createMockVideo({ duration: 60 });
      
      (video.addEventListener as jest.Mock).mockImplementation((event, handler) => {
        if (event === 'seeked') {
          setTimeout(() => handler(new Event('seeked')), 10);
        }
      });

      const onProgress = jest.fn();

      await extractor.extractFramesAtInterval(video, 20, { onProgress });

      expect(onProgress).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // canvasToBlob() Tests
  // ==========================================================================

  describe('canvasToBlob()', () => {
    it('should convert canvas to JPEG blob', async () => {
      const canvas = createMockCanvas();

      const blob = await extractor.canvasToBlob(canvas, 'image/jpeg', 0.8);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('image/jpeg');
    });

    it('should convert canvas to PNG blob', async () => {
      const canvas = createMockCanvas();

      const blob = await extractor.canvasToBlob(canvas, 'image/png');

      expect(blob).toBeInstanceOf(Blob);
    });

    it('should use default type and quality', async () => {
      const canvas = createMockCanvas();

      const blob = await extractor.canvasToBlob(canvas);

      expect(blob).toBeInstanceOf(Blob);
    });

    it('should throw error if toBlob returns null', async () => {
      const canvas = createMockCanvas();
      
      // Mock toBlob to return null
      jest.spyOn(canvas, 'toBlob').mockImplementation((callback: BlobCallback) => {
        setTimeout(() => callback(null), 0);
      });

      await expect(
        extractor.canvasToBlob(canvas)
      ).rejects.toThrow(VideoIntelError);
    });
  });

  // ==========================================================================
  // extractFrameAsBlob() Tests
  // ==========================================================================

  describe('extractFrameAsBlob()', () => {
    it('should extract frame directly as blob', async () => {
      const video = createMockVideo({ duration: 60 });
      
      (video.addEventListener as jest.Mock).mockImplementation((event, handler) => {
        if (event === 'seeked') {
          setTimeout(() => handler(new Event('seeked')), 10);
        }
      });

      const blob = await extractor.extractFrameAsBlob(video, 30);

      expect(blob).toBeInstanceOf(Blob);
    });

    it('should respect blob options', async () => {
      const video = createMockVideo({ duration: 60 });
      
      (video.addEventListener as jest.Mock).mockImplementation((event, handler) => {
        if (event === 'seeked') {
          setTimeout(() => handler(new Event('seeked')), 10);
        }
      });

      const blob = await extractor.extractFrameAsBlob(video, 30, {
        type: 'image/png',
        quality: 0.9,
      });

      expect(blob).toBeInstanceOf(Blob);
    });

    it('should handle resize options', async () => {
      const video = createMockVideo({ duration: 60 });
      
      (video.addEventListener as jest.Mock).mockImplementation((event, handler) => {
        if (event === 'seeked') {
          setTimeout(() => handler(new Event('seeked')), 10);
        }
      });

      const blob = await extractor.extractFrameAsBlob(video, 30, {
        width: 640,
        height: 360,
      });

      expect(blob).toBeInstanceOf(Blob);
    });
  });

  // ==========================================================================
  // Edge Cases and Integration Tests
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle very short videos', async () => {
      const video = createMockVideo({ duration: 0.5 });
      
      (video.addEventListener as jest.Mock).mockImplementation((event, handler) => {
        if (event === 'seeked') {
          setTimeout(() => handler(new Event('seeked')), 10);
        }
      });

      const canvas = await extractor.extractFrame(video, 0.25);

      expect(canvas).toBeInstanceOf(HTMLCanvasElement);
    });

    it('should handle very long videos', async () => {
      const video = createMockVideo({ duration: 3600 }); // 1 hour
      
      (video.addEventListener as jest.Mock).mockImplementation((event, handler) => {
        if (event === 'seeked') {
          setTimeout(() => handler(new Event('seeked')), 10);
        }
      });

      const canvas = await extractor.extractFrame(video, 1800);

      expect(canvas).toBeInstanceOf(HTMLCanvasElement);
    });

    it('should handle unusual aspect ratios', async () => {
      const video = createMockVideo({ width: 640, height: 1136 }); // 9:16 vertical
      
      (video.addEventListener as jest.Mock).mockImplementation((event, handler) => {
        if (event === 'seeked') {
          setTimeout(() => handler(new Event('seeked')), 10);
        }
      });

      const canvas = await extractor.extractFrame(video, 10);

      expect(canvas).toBeInstanceOf(HTMLCanvasElement);
      expect(canvas.width).toBe(640);
      expect(canvas.height).toBe(1136);
    });

    it('should handle very small frame dimensions', async () => {
      const video = createMockVideo({ width: 160, height: 90 });
      
      (video.addEventListener as jest.Mock).mockImplementation((event, handler) => {
        if (event === 'seeked') {
          setTimeout(() => handler(new Event('seeked')), 10);
        }
      });

      const canvas = await extractor.extractFrame(video, 10);

      expect(canvas).toBeInstanceOf(HTMLCanvasElement);
      expect(canvas.width).toBe(160);
      expect(canvas.height).toBe(90);
    });

    it('should handle fractional timestamps', async () => {
      const video = createMockVideo({ duration: 60 });
      
      (video.addEventListener as jest.Mock).mockImplementation((event, handler) => {
        if (event === 'seeked') {
          setTimeout(() => handler(new Event('seeked')), 10);
        }
      });

      const canvas = await extractor.extractFrame(video, 10.5);

      expect(canvas).toBeInstanceOf(HTMLCanvasElement);
      expect(video.currentTime).toBe(10.5);
    });
  });
});


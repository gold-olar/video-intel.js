/**
 * VideoLoader Tests
 * 
 * Comprehensive test suite for the VideoLoader module
 * Tests all functionality including:
 * - Input validation
 * - File size validation
 * - Error handling
 * - Cleanup functionality
 */

import { VideoLoader } from '../../src/utils/VideoLoader';
import { VideoIntelError, ErrorCode } from '../../src/types';

/**
 * Helper function to create a mock video File object
 * @param size - Size in bytes
 * @param type - MIME type
 */
function createMockVideoFile(size: number = 1024, type: string = 'video/mp4'): File {
  const buffer = new ArrayBuffer(size);
  const blob = new Blob([buffer], { type });
  return new File([blob], 'test-video.mp4', { type });
}

/**
 * Helper function to create a mock video Blob object
 * @param size - Size in bytes
 * @param type - MIME type
 */
function createMockVideoBlob(size: number = 1024, type: string = 'video/mp4'): Blob {
  const buffer = new ArrayBuffer(size);
  return new Blob([buffer], { type });
}

describe('VideoLoader', () => {
  let loader: VideoLoader;

  beforeEach(() => {
    // Create a fresh loader instance for each test
    loader = new VideoLoader();
    
    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();
    
    // Mock console.warn to avoid cluttering test output
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    // Clean up after each test
    loader.cleanup();
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('Input Validation', () => {
    it('should throw error for null input', async () => {
      await expect(loader.load(null as any)).rejects.toThrow(VideoIntelError);
      await expect(loader.load(null as any)).rejects.toThrow('Video input is required');
    });

    it('should throw error for undefined input', async () => {
      await expect(loader.load(undefined as any)).rejects.toThrow(VideoIntelError);
    });

    it('should throw error for invalid type (number)', async () => {
      await expect(loader.load(123 as any)).rejects.toThrow(VideoIntelError);
      await expect(loader.load(123 as any)).rejects.toThrow('Invalid input type');
    });

    it('should throw error for invalid type (object)', async () => {
      await expect(loader.load({} as any)).rejects.toThrow(VideoIntelError);
    });

    it('should throw error for empty string URL', async () => {
      await expect(loader.load('')).rejects.toThrow(VideoIntelError);
      await expect(loader.load('')).rejects.toThrow('cannot be empty');
    });

    it('should throw error for whitespace-only URL', async () => {
      await expect(loader.load('   ')).rejects.toThrow(VideoIntelError);
    });
  });

  describe('File Size Validation', () => {
    it('should accept file within size limit', () => {
      const file = createMockVideoFile(100 * 1024 * 1024); // 100MB - valid
      
      // Should not throw during validation
      expect(() => {
        const videoUrl = (loader as any).getVideoUrl(file);
        expect(videoUrl).toBeDefined();
      }).not.toThrow();
    });

    it('should reject file exceeding 500MB limit', async () => {
      const file = createMockVideoFile(501 * 1024 * 1024); // 501MB - too large
      
      await expect(loader.load(file)).rejects.toThrow(VideoIntelError);
      await expect(loader.load(file)).rejects.toThrow('exceeds maximum allowed size');
    });

    it('should reject file exactly at 501MB', async () => {
      const file = createMockVideoFile(501 * 1024 * 1024);
      
      await expect(loader.load(file)).rejects.toThrow(VideoIntelError);
      
      try {
        await loader.load(file);
      } catch (error) {
        expect(error).toBeInstanceOf(VideoIntelError);
        expect((error as VideoIntelError).code).toBe(ErrorCode.INVALID_INPUT);
      }
    });

    it('should accept file at exactly 500MB', () => {
      const file = createMockVideoFile(500 * 1024 * 1024); // Exactly 500MB
      
      // Should not throw during validation
      expect(() => {
        const videoUrl = (loader as any).getVideoUrl(file);
        expect(videoUrl).toBe('blob:mock-url');
      }).not.toThrow();
    });

    it('should reject empty file (0 bytes)', async () => {
      const file = createMockVideoFile(0);
      
      await expect(loader.load(file)).rejects.toThrow(VideoIntelError);
      await expect(loader.load(file)).rejects.toThrow('empty (0 bytes)');
    });

    it('should validate Blob size same as File', async () => {
      const blob = createMockVideoBlob(501 * 1024 * 1024);
      
      await expect(loader.load(blob)).rejects.toThrow(VideoIntelError);
    });
  });

  describe('Object URL Creation', () => {
    it('should create object URL for File input', () => {
      const file = createMockVideoFile();
      
      const videoUrl = (loader as any).getVideoUrl(file);
      
      expect(URL.createObjectURL).toHaveBeenCalledWith(file);
      expect(videoUrl).toBe('blob:mock-url');
    });

    it('should create object URL for Blob input', () => {
      const blob = createMockVideoBlob();
      
      const videoUrl = (loader as any).getVideoUrl(blob);
      
      expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
      expect(videoUrl).toBe('blob:mock-url');
    });

    it('should NOT create object URL for string input', () => {
      const url = 'https://example.com/video.mp4';
      
      const videoUrl = (loader as any).getVideoUrl(url);
      
      expect(URL.createObjectURL).not.toHaveBeenCalled();
      expect(videoUrl).toBe(url);
    });

    it('should track created object URLs', () => {
      const file1 = createMockVideoFile();
      const file2 = createMockVideoFile();
      
      (loader as any).getVideoUrl(file1);
      (loader as any).getVideoUrl(file2);
      
      expect((loader as any).objectURLs).toHaveLength(2);
    });

    it('should handle createObjectURL errors', () => {
      (URL.createObjectURL as jest.Mock).mockImplementation(() => {
        throw new Error('Failed to create URL');
      });
      
      const file = createMockVideoFile();
      
      expect(() => {
        (loader as any).getVideoUrl(file);
      }).toThrow(VideoIntelError);
    });
  });

  describe('Video Element Creation', () => {
    it('should create video element with correct attributes', () => {
      const video = (loader as any).createVideoElement();
      
      expect(video).toBeInstanceOf(HTMLVideoElement);
      expect(video.preload).toBe('metadata');
      expect(video.muted).toBe(true);
      expect(video.crossOrigin).toBe('anonymous');
      expect(video.playsInline).toBe(true);
    });
  });

  describe('Input Validation Helper', () => {
    it('should validate File input without throwing', () => {
      const file = createMockVideoFile();
      
      expect(() => {
        (loader as any).validateInput(file);
      }).not.toThrow();
    });

    it('should validate Blob input without throwing', () => {
      const blob = createMockVideoBlob();
      
      expect(() => {
        (loader as any).validateInput(blob);
      }).not.toThrow();
    });

    it('should validate URL string without throwing', () => {
      const url = 'https://example.com/video.mp4';
      
      expect(() => {
        (loader as any).validateInput(url);
      }).not.toThrow();
    });

    it('should throw for invalid input', () => {
      expect(() => {
        (loader as any).validateInput(null);
      }).toThrow(VideoIntelError);
      
      expect(() => {
        (loader as any).validateInput(123);
      }).toThrow(VideoIntelError);
      
      expect(() => {
        (loader as any).validateInput({});
      }).toThrow(VideoIntelError);
    });
  });

  describe('File Size Validation Helper', () => {
    it('should validate file within size limit', () => {
      const file = createMockVideoFile(100 * 1024 * 1024);
      
      expect(() => {
        (loader as any).validateFileSize(file);
      }).not.toThrow();
    });

    it('should throw for oversized file', () => {
      const file = createMockVideoFile(501 * 1024 * 1024);
      
      expect(() => {
        (loader as any).validateFileSize(file);
      }).toThrow(VideoIntelError);
      
      try {
        (loader as any).validateFileSize(file);
      } catch (error) {
        expect((error as VideoIntelError).code).toBe(ErrorCode.INVALID_INPUT);
        expect((error as VideoIntelError).message).toContain('exceeds maximum');
      }
    });

    it('should throw for empty file', () => {
      const file = createMockVideoFile(0);
      
      expect(() => {
        (loader as any).validateFileSize(file);
      }).toThrow(VideoIntelError);
      
      try {
        (loader as any).validateFileSize(file);
      } catch (error) {
        expect((error as VideoIntelError).message).toContain('empty (0 bytes)');
      }
    });

    it('should include file size in error details', () => {
      const file = createMockVideoFile(600 * 1024 * 1024);
      
      try {
        (loader as any).validateFileSize(file);
      } catch (error) {
        expect((error as VideoIntelError).details).toHaveProperty('fileSize');
        expect((error as VideoIntelError).details).toHaveProperty('maxSize');
      }
    });
  });

  describe('Cleanup', () => {
    it('should revoke object URLs on cleanup', () => {
      const file = createMockVideoFile();
      (loader as any).getVideoUrl(file);
      
      loader.cleanup();
      
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should handle multiple cleanups gracefully', () => {
      loader.cleanup();
      loader.cleanup();
      
      // Should not throw error
      expect(true).toBe(true);
    });

    it('should clear tracked URLs after cleanup', () => {
      const file = createMockVideoFile();
      (loader as any).getVideoUrl(file);
      
      expect((loader as any).objectURLs).toHaveLength(1);
      
      loader.cleanup();
      
      expect((loader as any).objectURLs).toHaveLength(0);
    });

    it('should handle errors during URL revocation', () => {
      (URL.revokeObjectURL as jest.Mock).mockImplementation(() => {
        throw new Error('Revocation failed');
      });
      
      const file = createMockVideoFile();
      (loader as any).getVideoUrl(file);
      
      // Should not throw even if revocation fails
      expect(() => loader.cleanup()).not.toThrow();
      expect(console.warn).toHaveBeenCalled();
    });

    it('should revoke multiple URLs', () => {
      const file1 = createMockVideoFile();
      const file2 = createMockVideoFile();
      
      (loader as any).getVideoUrl(file1);
      (loader as any).getVideoUrl(file2);
      
      loader.cleanup();
      
      expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
    });
  });

  describe('Static Method: isFormatSupported', () => {
    it('should check if video format is supported', () => {
      // This will use the actual browser implementation
      const mp4Support = VideoLoader.isFormatSupported('video/mp4');
      
      // MP4 is widely supported
      expect(typeof mp4Support).toBe('boolean');
    });

    it('should return false for unsupported format', () => {
      const support = VideoLoader.isFormatSupported('video/xyz-fake-format');
      
      expect(support).toBe(false);
    });

    it('should work without creating an instance', () => {
      // Should be callable as static method
      expect(() => {
        VideoLoader.isFormatSupported('video/webm');
      }).not.toThrow();
    });

    it('should handle empty string', () => {
      const support = VideoLoader.isFormatSupported('');
      
      expect(typeof support).toBe('boolean');
      expect(support).toBe(false);
    });
  });

  describe('Error Code Mapping', () => {
    it('should use INVALID_INPUT for null', async () => {
      try {
        await loader.load(null as any);
      } catch (error) {
        expect(error).toBeInstanceOf(VideoIntelError);
        expect((error as VideoIntelError).code).toBe(ErrorCode.INVALID_INPUT);
      }
    });

    it('should use INVALID_INPUT for wrong type', async () => {
      try {
        await loader.load(123 as any);
      } catch (error) {
        expect(error).toBeInstanceOf(VideoIntelError);
        expect((error as VideoIntelError).code).toBe(ErrorCode.INVALID_INPUT);
      }
    });

    it('should use INVALID_INPUT for oversized file', async () => {
      const file = createMockVideoFile(501 * 1024 * 1024);
      
      try {
        await loader.load(file);
      } catch (error) {
        expect((error as VideoIntelError).code).toBe(ErrorCode.INVALID_INPUT);
      }
    });

    it('should use INVALID_INPUT for empty file', async () => {
      const file = createMockVideoFile(0);
      
      try {
        await loader.load(file);
      } catch (error) {
        expect((error as VideoIntelError).code).toBe(ErrorCode.INVALID_INPUT);
      }
    });

    it('should use PROCESSING_ERROR for URL creation failure', () => {
      (URL.createObjectURL as jest.Mock).mockImplementation(() => {
        throw new Error('Failed');
      });
      
      const file = createMockVideoFile();
      
      try {
        (loader as any).getVideoUrl(file);
      } catch (error) {
        expect((error as VideoIntelError).code).toBe(ErrorCode.PROCESSING_ERROR);
      }
    });
  });

  describe('Error Details', () => {
    it('should include details in errors', async () => {
      const file = createMockVideoFile(501 * 1024 * 1024);
      
      try {
        await loader.load(file);
      } catch (error) {
        expect((error as VideoIntelError).details).toBeDefined();
        expect((error as VideoIntelError).details).toHaveProperty('fileSize');
        expect((error as VideoIntelError).details).toHaveProperty('maxSize');
      }
    });

    it('should include input type in validation error', async () => {
      try {
        await loader.load(123 as any);
      } catch (error) {
        expect((error as VideoIntelError).details).toBeDefined();
        expect((error as VideoIntelError).details).toHaveProperty('inputType');
      }
    });
  });

  describe('VideoIntelError Properties', () => {
    it('should have correct error name', async () => {
      try {
        await loader.load(null as any);
      } catch (error) {
        expect((error as VideoIntelError).name).toBe('VideoIntelError');
      }
    });

    it('should have message property', async () => {
      try {
        await loader.load(null as any);
      } catch (error) {
        expect((error as VideoIntelError).message).toBeDefined();
        expect(typeof (error as VideoIntelError).message).toBe('string');
      }
    });

    it('should have code property', async () => {
      try {
        await loader.load(null as any);
      } catch (error) {
        expect((error as VideoIntelError).code).toBeDefined();
        expect(Object.values(ErrorCode)).toContain((error as VideoIntelError).code);
      }
    });
  });
});

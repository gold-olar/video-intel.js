/**
 * Tests for MetadataExtractor
 * 
 * Tests metadata extraction from video elements
 */

import { MetadataExtractor } from '../../src/modules/metadata/MetadataExtractor';

/**
 * Helper function to create mock video element
 */
function createMockVideo(overrides: Partial<any> = {}): HTMLVideoElement {
  const defaultVideo = {
    duration: 60,
    videoWidth: 1920,
    videoHeight: 1080,
    readyState: 1, // HAVE_METADATA
    src: 'test.mp4',
    currentSrc: 'http://example.com/test.mp4',
    audioTracks: { length: 1 },
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };

  return {
    ...defaultVideo,
    ...overrides,
  } as unknown as HTMLVideoElement;
}

describe('MetadataExtractor', () => {
  let extractor: MetadataExtractor;

  beforeEach(() => {
    extractor = new MetadataExtractor();
  });

  describe('extract - basic metadata', () => {
    it('should extract duration', async () => {
      const video = createMockVideo({ duration: 120 });
      
      const metadata = await extractor.extract(video);
      
      expect(metadata.duration).toBe(120);
    });

    it('should extract width and height', async () => {
      const video = createMockVideo({
        videoWidth: 1280,
        videoHeight: 720,
      });
      
      const metadata = await extractor.extract(video);
      
      expect(metadata.width).toBe(1280);
      expect(metadata.height).toBe(720);
    });

    it('should extract format from URL', async () => {
      const video = createMockVideo({
        currentSrc: 'http://example.com/video.mp4',
      });
      
      const metadata = await extractor.extract(video);
      
      expect(metadata.format).toBe('mp4');
    });

    it('should handle webm format', async () => {
      const video = createMockVideo({
        currentSrc: 'http://example.com/video.webm',
      });
      
      const metadata = await extractor.extract(video);
      
      expect(metadata.format).toBe('webm');
    });

    it('should return fps (default 30)', async () => {
      const video = createMockVideo();
      
      const metadata = await extractor.extract(video);
      
      expect(metadata.fps).toBe(30);
    });
  });

  describe('extract - aspect ratio', () => {
    it('should calculate 16:9 aspect ratio', async () => {
      const video = createMockVideo({
        videoWidth: 1920,
        videoHeight: 1080,
      });
      
      const metadata = await extractor.extract(video);
      
      expect(metadata.aspectRatio).toBe('16:9');
    });

    it('should calculate 4:3 aspect ratio', async () => {
      const video = createMockVideo({
        videoWidth: 640,
        videoHeight: 480,
      });
      
      const metadata = await extractor.extract(video);
      
      expect(metadata.aspectRatio).toBe('4:3');
    });

    it('should calculate 1:1 aspect ratio (square)', async () => {
      const video = createMockVideo({
        videoWidth: 1080,
        videoHeight: 1080,
      });
      
      const metadata = await extractor.extract(video);
      
      expect(metadata.aspectRatio).toBe('1:1');
    });

    it('should calculate 9:16 aspect ratio (vertical)', async () => {
      const video = createMockVideo({
        videoWidth: 1080,
        videoHeight: 1920,
      });
      
      const metadata = await extractor.extract(video);
      
      expect(metadata.aspectRatio).toBe('9:16');
    });

    it('should handle custom aspect ratios', async () => {
      const video = createMockVideo({
        videoWidth: 800,
        videoHeight: 600,
      });
      
      const metadata = await extractor.extract(video);
      
      expect(metadata.aspectRatio).toBe('4:3');
    });

    it('should return "unknown" for invalid dimensions', async () => {
      const video = createMockVideo({
        videoWidth: 0,
        videoHeight: 0,
      });
      
      const metadata = await extractor.extract(video);
      
      expect(metadata.aspectRatio).toBe('unknown');
    });
  });

  describe('extract - audio/video track detection', () => {
    it('should detect audio track when audioTracks has length > 0', async () => {
      const video = createMockVideo({
        audioTracks: { length: 1 },
      });
      
      const metadata = await extractor.extract(video);
      
      expect(metadata.hasAudio).toBe(true);
    });

    it('should detect no audio when audioTracks is empty', async () => {
      const video = createMockVideo({
        audioTracks: { length: 0 },
      });
      
      const metadata = await extractor.extract(video);
      
      expect(metadata.hasAudio).toBe(false);
    });

    it('should detect video track when dimensions are valid', async () => {
      const video = createMockVideo({
        videoWidth: 1920,
        videoHeight: 1080,
      });
      
      const metadata = await extractor.extract(video);
      
      expect(metadata.hasVideo).toBe(true);
    });

    it('should detect no video when dimensions are 0', async () => {
      const video = createMockVideo({
        videoWidth: 0,
        videoHeight: 0,
      });
      
      const metadata = await extractor.extract(video);
      
      expect(metadata.hasVideo).toBe(false);
    });
  });

  describe('extract - format detection', () => {
    it('should detect mp4 format', async () => {
      const video = createMockVideo({
        currentSrc: 'http://example.com/video.mp4',
      });
      
      const metadata = await extractor.extract(video);
      
      expect(metadata.format).toBe('mp4');
    });

    it('should detect webm format', async () => {
      const video = createMockVideo({
        currentSrc: 'http://example.com/video.webm',
      });
      
      const metadata = await extractor.extract(video);
      
      expect(metadata.format).toBe('webm');
    });

    it('should detect ogg format', async () => {
      const video = createMockVideo({
        currentSrc: 'http://example.com/video.ogg',
      });
      
      const metadata = await extractor.extract(video);
      
      expect(metadata.format).toBe('ogg');
    });

    it('should detect mov format', async () => {
      const video = createMockVideo({
        currentSrc: 'http://example.com/video.mov',
      });
      
      const metadata = await extractor.extract(video);
      
      expect(metadata.format).toBe('mov');
    });

    it('should handle URLs with query parameters', async () => {
      const video = createMockVideo({
        currentSrc: 'http://example.com/video.mp4?v=123&t=456',
      });
      
      const metadata = await extractor.extract(video);
      
      expect(metadata.format).toBe('mp4');
    });

    it('should return "unknown" for missing extension', async () => {
      const video = createMockVideo({
        currentSrc: 'http://example.com/video',
      });
      
      const metadata = await extractor.extract(video);
      
      expect(metadata.format).toBe('unknown');
    });

    it('should return "unknown" for unrecognized extension', async () => {
      const video = createMockVideo({
        currentSrc: 'http://example.com/video.xyz',
      });
      
      const metadata = await extractor.extract(video);
      
      expect(metadata.format).toBe('xyz');
    });

    it('should return "unknown" when no src available', async () => {
      const video = createMockVideo({
        src: '',
        currentSrc: '',
      });
      
      const metadata = await extractor.extract(video);
      
      expect(metadata.format).toBe('unknown');
    });
  });

  describe('extract - size and bitrate', () => {
    it('should return 0 for size (not available from video element)', async () => {
      const video = createMockVideo();
      
      const metadata = await extractor.extract(video);
      
      expect(metadata.size).toBe(0);
    });

    it('should return undefined for bitrate when size is 0', async () => {
      const video = createMockVideo();
      
      const metadata = await extractor.extract(video);
      
      expect(metadata.bitrate).toBeUndefined();
    });
  });

  describe('extract - codec', () => {
    it('should return undefined for codec (not reliably detectable)', async () => {
      const video = createMockVideo();
      
      const metadata = await extractor.extract(video);
      
      expect(metadata.codec).toBeUndefined();
    });
  });

  describe('extract - error handling', () => {
    it('should throw error for null video', async () => {
      await expect(extractor.extract(null as any)).rejects.toThrow();
    });

    it('should throw error for undefined video', async () => {
      await expect(extractor.extract(undefined as any)).rejects.toThrow();
    });
  });

  describe('extract - waiting for metadata', () => {
    it('should wait for metadata if readyState < 1', async () => {
      let currentReadyState = 0;
      const video = createMockVideo({
        get readyState() {
          return currentReadyState;
        },
      });

      // Mock addEventListener to immediately fire callback
      const mockAddEventListener = jest.fn((event, callback: any) => {
        if (event === 'loadedmetadata') {
          // Simulate metadata loading
          currentReadyState = 1;
          setTimeout(() => callback(), 0);
        }
      });

      video.addEventListener = mockAddEventListener;

      const metadata = await extractor.extract(video);

      expect(mockAddEventListener).toHaveBeenCalledWith(
        'loadedmetadata',
        expect.any(Function),
        expect.any(Object)
      );
      expect(metadata).toBeDefined();
    });

    it('should not wait if metadata already loaded', async () => {
      const video = createMockVideo({
        readyState: 1, // HAVE_METADATA
      });

      const mockAddEventListener = jest.fn();
      video.addEventListener = mockAddEventListener;

      const metadata = await extractor.extract(video);

      // addEventListener should not be called
      expect(mockAddEventListener).not.toHaveBeenCalled();
      expect(metadata).toBeDefined();
    });
  });

  describe('extract - complete metadata object', () => {
    it('should return complete VideoMetadata object', async () => {
      const video = createMockVideo({
        duration: 120,
        videoWidth: 1920,
        videoHeight: 1080,
        currentSrc: 'http://example.com/video.mp4',
      });

      const metadata = await extractor.extract(video);

      // Check all required fields
      expect(metadata).toHaveProperty('duration');
      expect(metadata).toHaveProperty('width');
      expect(metadata).toHaveProperty('height');
      expect(metadata).toHaveProperty('fps');
      expect(metadata).toHaveProperty('codec');
      expect(metadata).toHaveProperty('format');
      expect(metadata).toHaveProperty('size');
      expect(metadata).toHaveProperty('aspectRatio');
      expect(metadata).toHaveProperty('bitrate');
      expect(metadata).toHaveProperty('hasAudio');
      expect(metadata).toHaveProperty('hasVideo');
    });

    it('should have correct types for all fields', async () => {
      const video = createMockVideo();

      const metadata = await extractor.extract(video);

      expect(typeof metadata.duration).toBe('number');
      expect(typeof metadata.width).toBe('number');
      expect(typeof metadata.height).toBe('number');
      expect(typeof metadata.fps).toBe('number');
      expect(typeof metadata.format).toBe('string');
      expect(typeof metadata.size).toBe('number');
      expect(typeof metadata.aspectRatio).toBe('string');
      expect(typeof metadata.hasAudio).toBe('boolean');
      expect(typeof metadata.hasVideo).toBe('boolean');
    });
  });
});


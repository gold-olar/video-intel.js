# Integration Tests

This directory contains integration tests for VideoIntel.js that test end-to-end workflows with real video files.

## Overview

Integration tests verify that all modules work together correctly in real-world scenarios. Unlike unit tests that test individual components in isolation, these tests:

- Use real video files (not mocks)
- Test complete workflows (e.g., full analysis pipeline)
- Verify resource cleanup and memory management
- Test error handling with invalid inputs
- Benchmark performance with real data

## Setup

### 1. Download Test Videos

First, download the test video fixtures:

```bash
npm run test:download-fixtures
```

This downloads small test videos (~15-20 MB total) to `tests/fixtures/`.

### 2. Run Integration Tests

```bash
# Run all integration tests
npm run test:integration

# Run specific test file
npm test tests/integration/sample.test.ts

# Run with coverage
npm test -- --coverage tests/integration
```

## Test Structure

```
tests/
├── integration/
│   ├── setup.ts              # Test utilities and helpers
│   ├── README.md             # This file
│   ├── sample.test.ts        # Example test showing usage
│   └── [future tests]        # More integration tests to be added
├── fixtures/
│   ├── download-test-videos.js  # Script to download videos
│   ├── README.md                # Fixtures documentation
│   └── *.mp4                    # Test video files (gitignored)
└── unit/                     # Unit tests for individual modules
    └── ...
```

## Writing Integration Tests

### Basic Template

```typescript
import VideoIntel from '../../src';
import { loadTestVideo, assertDefined } from './setup';

describe('Feature Integration Tests', () => {
  let videoFile: File;
  
  beforeAll(async () => {
    // Load test video once for all tests
    videoFile = await loadTestVideo('test-video-10s.mp4');
  });
  
  it('should perform complete analysis', async () => {
    const result = await VideoIntel.analyze(videoFile, {
      metadata: true,
      thumbnails: { count: 5 }
    });
    
    assertDefined(result.metadata);
    expect(result.metadata.duration).toBeGreaterThan(0);
    
    assertDefined(result.thumbnails);
    expect(result.thumbnails).toHaveLength(5);
  });
});
```

### Using Local Video Files

```typescript
import { loadTestVideo, TEST_VIDEOS } from './setup';

// Load by filename
const video = await loadTestVideo('test-video-10s.mp4');

// Or use constants
const video = await loadTestVideo(TEST_VIDEOS.fixtures.short);
```

### Using Remote URLs

```typescript
import { getTestVideoURL, fetchVideoFile } from './setup';

// Get URL (no download)
const url = getTestVideoURL('short');
const result = await VideoIntel.analyze(url);

// Or fetch as File object
const videoFile = await fetchVideoFile(url);
```

### Testing Progress Tracking

```typescript
it('should track progress correctly', async () => {
  const progressValues: number[] = [];
  
  await VideoIntel.analyze(videoFile, {
    thumbnails: true,
    onProgress: (progress) => progressValues.push(progress)
  });
  
  // Verify progress tracking
  expect(progressValues.length).toBeGreaterThan(0);
  expect(progressValues[0]).toBe(0);
  expect(progressValues[progressValues.length - 1]).toBe(100);
  
  // Progress should be monotonically increasing
  for (let i = 1; i < progressValues.length; i++) {
    expect(progressValues[i]).toBeGreaterThanOrEqual(progressValues[i - 1]);
  }
});
```

### Testing Error Handling

```typescript
import { VideoIntelError } from '../../src/types';

it('should handle invalid video gracefully', async () => {
  const invalidFile = new File(['invalid content'], 'bad.mp4', {
    type: 'video/mp4'
  });
  
  await expect(
    VideoIntel.analyze(invalidFile, { metadata: true })
  ).rejects.toThrow(VideoIntelError);
});
```

### Testing Memory Management

```typescript
import { getMemoryUsage, formatBytes } from './setup';

it('should not leak memory', async () => {
  const initialMemory = getMemoryUsage();
  
  // Run operation multiple times
  for (let i = 0; i < 10; i++) {
    await VideoIntel.getThumbnails(videoFile, { count: 3 });
  }
  
  // Force garbage collection if available
  if (global.gc) global.gc();
  
  const finalMemory = getMemoryUsage();
  const increase = finalMemory - initialMemory;
  
  console.log(`Memory increase: ${formatBytes(increase)}`);
  
  // Memory shouldn't increase significantly
  expect(increase).toBeLessThan(10 * 1024 * 1024); // <10MB
});
```

### Performance Benchmarking

```typescript
describe('Performance Benchmarks', () => {
  jest.setTimeout(30000); // 30 second timeout
  
  it('should process video within time limit', async () => {
    const startTime = performance.now();
    
    await VideoIntel.getThumbnails(videoFile, { count: 5 });
    
    const duration = performance.now() - startTime;
    console.log(`Processing time: ${duration.toFixed(2)}ms`);
    
    expect(duration).toBeLessThan(10000); // <10 seconds
  });
});
```

## Available Test Utilities

See `setup.ts` for all available utilities:

### Video Loading
- `loadTestVideo(filename)` - Load local test video
- `getTestVideoURL(key)` - Get remote video URL
- `fetchVideoFile(url)` - Download video as File object

### Assertions
- `assertDefined(value, message)` - TypeScript type guard
- `average(numbers)` - Calculate average of array
- `wait(ms)` - Wait for specified duration

### Memory & Performance
- `getMemoryUsage()` - Get current memory usage
- `formatBytes(bytes)` - Format bytes to human-readable

### Mocking (for Node.js)
- `createMockVideoElement()` - Create mock HTMLVideoElement

## Best Practices

### 1. Use Appropriate Test Videos

```typescript
// ✅ Good: Use short video for quick tests
const video = await loadTestVideo('test-video-10s.mp4');

// ❌ Bad: Don't use large videos for simple tests
const video = await loadTestVideo('test-video-5min.mp4'); // Too slow
```

### 2. Clean Up Resources

```typescript
// ✅ Good: Resources are automatically cleaned up
await VideoIntel.getThumbnails(videoFile);

// The library handles cleanup in finally blocks
```

### 3. Test Real Scenarios

```typescript
// ✅ Good: Test real user workflows
it('should generate thumbnail gallery', async () => {
  const thumbnails = await VideoIntel.getThumbnails(videoFile, {
    count: 5,
    quality: 0.8
  });
  
  // Verify thumbnails can be displayed
  thumbnails.forEach(thumb => {
    expect(thumb.image).toBeInstanceOf(Blob);
    expect(thumb.image.size).toBeGreaterThan(0);
  });
});
```

### 4. Use Descriptive Test Names

```typescript
// ✅ Good: Clear what's being tested
it('should filter out black frames from thumbnail selection', async () => {
  // ...
});

// ❌ Bad: Vague test name
it('should work', async () => {
  // ...
});
```

### 5. Test Edge Cases

```typescript
describe('Edge Cases', () => {
  it('should handle very short videos (< 1 second)', async () => {
    // Test with minimal video
  });
  
  it('should handle videos with only black frames', async () => {
    // Test error handling
  });
  
  it('should handle invalid format', async () => {
    // Test graceful failure
  });
});
```

## Test Categories

### 1. Happy Path Tests
Test normal, expected usage:
- Analyze video with all features
- Generate thumbnails with various options
- Extract colors from different videos
- Detect scenes in video with scene changes

### 2. Error Path Tests
Test error handling:
- Invalid video file
- Corrupted video data
- Network errors (for URLs)
- Invalid options/parameters

### 3. Performance Tests
Benchmark operations:
- Processing time for different video lengths
- Memory usage during operations
- Concurrent operations

### 4. Resource Management Tests
Verify cleanup:
- No memory leaks after multiple operations
- Video elements removed from DOM
- Canvases properly disposed

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Integration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Download test fixtures
        run: npm run test:download-fixtures
      
      - name: Run integration tests
        run: npm run test:integration
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Debugging Tests

### Enable Verbose Output

```bash
# Run with verbose output
npm test -- --verbose tests/integration

# Run with debug info
DEBUG=videointel:* npm test tests/integration
```

### Run Specific Test

```bash
# Run single test file
npm test tests/integration/sample.test.ts

# Run specific test case
npm test -- -t "should analyze video with all features"
```

### Memory Profiling

```bash
# Run with memory profiling
node --expose-gc node_modules/.bin/jest tests/integration
```

## Common Issues

### "Test video not found"

**Solution:** Download test fixtures first:
```bash
npm run test:download-fixtures
```

### "Cannot find module '../fixtures'"

**Solution:** Make sure you're importing from the correct path relative to your test file.

### "Timeout of 5000ms exceeded"

**Solution:** Increase timeout for integration tests:
```typescript
jest.setTimeout(30000); // 30 seconds
```

### Memory leak warnings

**Solution:** Ensure you're not keeping references to video elements or large data structures.

## Future Test Plans

Integration tests to be added (from Day 2 of integration plan):

### Week 7, Day 2 - Task 2.2: Core Integration Tests
- [ ] `analyze.test.ts` - Full analysis workflow
- [ ] `thumbnails.test.ts` - Thumbnail generation
- [ ] `error-handling.test.ts` - Error scenarios

### Week 7, Day 2 - Task 2.3: Performance Tests
- [ ] `benchmarks.test.ts` - Performance benchmarks
  - Video processing speed
  - Memory usage
  - Concurrent operations

These will be implemented as the integration phase continues.

## Contributing

When adding new integration tests:

1. **Follow the naming convention:** `feature.test.ts`
2. **Use the test utilities** from `setup.ts`
3. **Document complex tests** with comments
4. **Update this README** if you add new patterns or utilities
5. **Keep tests focused** - one feature or workflow per file
6. **Run tests locally** before committing

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Testing Best Practices](https://testingjavascript.com/)
- [Main Project README](../../README.md)
- [Test Fixtures Documentation](../fixtures/README.md)

---

**Ready to write tests?** Check out `sample.test.ts` for a complete working example!


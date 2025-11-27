# Integration Tests - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Download Test Videos (one-time setup)
```bash
npm run test:download-fixtures
```

This downloads 3 small test videos (~50 MB total) to `tests/fixtures/`.

### Step 2: Run Integration Tests
```bash
# Run all integration tests
npm run test:integration

# Or run the sample test
npm test tests/integration/sample.test.ts
```

### Step 3: Write Your Own Tests

Create a new test file: `tests/integration/my-test.test.ts`

```typescript
import VideoIntel from '../../src';
import { loadTestVideo, assertDefined } from './setup';

describe('My Integration Test', () => {
  it('should analyze video', async () => {
    // Load a test video
    const video = await loadTestVideo('test-video-10s.mp4');
    
    // Analyze it
    const result = await VideoIntel.analyze(video, {
      metadata: true,
      thumbnails: { count: 5 }
    });
    
    // Verify results
    assertDefined(result.metadata);
    expect(result.metadata.duration).toBeGreaterThan(0);
    expect(result.thumbnails).toHaveLength(5);
  });
});
```

---

## 📁 Available Test Videos

After running `npm run test:download-fixtures`:

| File | Duration | Use For |
|------|----------|---------|
| `test-video-10s.mp4` | ~10s | Quick tests |
| `test-video-30s.mp4` | ~30s | Standard tests |
| `test-video-scenes.mp4` | ~30s | Scene detection tests |

---

## 🔧 Useful Utilities

```typescript
import {
  loadTestVideo,        // Load local video file
  getTestVideoURL,      // Get remote video URL
  fetchVideoFile,       // Download video from URL
  assertDefined,        // Type-safe assertion
  getMemoryUsage,       // Check memory usage
  formatBytes,          // Format bytes (e.g., "2.38 MB")
  wait,                 // Async delay
  TEST_VIDEOS           // Video catalog
} from './setup';
```

---

## 💡 Common Patterns

### Test with Local File
```typescript
const video = await loadTestVideo('test-video-10s.mp4');
const result = await VideoIntel.getThumbnails(video);
```

### Test with Remote URL
```typescript
const url = getTestVideoURL('short');
const result = await VideoIntel.analyze(url, { metadata: true });
```

### Test Error Handling
```typescript
const badFile = new File(['invalid'], 'bad.mp4', { type: 'video/mp4' });
await expect(VideoIntel.analyze(badFile)).rejects.toThrow();
```

### Test Memory Usage
```typescript
const before = getMemoryUsage();
await VideoIntel.getThumbnails(video);
const after = getMemoryUsage();
console.log(`Used: ${formatBytes(after - before)}`);
```

---

## 📚 Full Documentation

- **README.md** - Complete guide with examples
- **sample.test.ts** - 14 working test cases
- **../fixtures/README.md** - Video fixture documentation

---

## 🆘 Troubleshooting

**"Test video not found"**
→ Run: `npm run test:download-fixtures`

**"Test timeout"**
→ Add: `jest.setTimeout(30000);` at top of describe block

**Need help?**
→ See example: `tests/integration/sample.test.ts`

---

Happy testing! 🎉


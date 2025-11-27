# Test Video Fixtures

This directory contains test video files used for integration testing.

## Setup

Video files are not committed to the repository due to their size. You need to download them before running integration tests.

### Download Test Videos

```bash
# Download all test videos
npm run test:download-fixtures

# Or run the script directly
node tests/fixtures/download-test-videos.js
```

## Available Test Videos

After downloading, you'll have the following test videos:

| File | Duration | Resolution | Description | Use Case |
|------|----------|------------|-------------|----------|
| `test-video-10s.mp4` | ~10s | 480p | Short, simple clip | Quick tests, basic functionality |
| `test-video-30s.mp4` | ~30s | 720p | Medium length clip | Standard integration tests |
| `test-video-scenes.mp4` | ~30s | 720p | Multiple scene changes | Scene detection tests |

## Using Test Videos in Tests

### Load from Local File

```typescript
import { loadTestVideo } from '../integration/setup';

// In your test
const videoFile = await loadTestVideo('test-video-10s.mp4');
const result = await VideoIntel.analyze(videoFile);
```

### Use Remote URL

```typescript
import { getTestVideoURL, fetchVideoFile } from '../integration/setup';

// Get URL (no download needed)
const url = getTestVideoURL('short');

// Or fetch as File object
const videoFile = await fetchVideoFile(url);
```

## Video Sources

Test videos are downloaded from Google's public test video collection:
- Source: `http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/`
- License: These are publicly available test videos
- Quality: Various resolutions from 480p to 1080p

## Managing Fixtures

### Re-download Videos

Simply run the download script again. It will skip already downloaded videos:

```bash
npm run test:download-fixtures
```

### Clean Up

To remove downloaded videos and free up space:

```bash
rm tests/fixtures/*.mp4
```

Video files are ignored by git (see `.gitignore`), so they won't be committed.

## File Size

Total download size: ~15-20 MB for all test videos

Individual sizes (approximate):
- `test-video-10s.mp4`: ~2-3 MB
- `test-video-30s.mp4`: ~5-7 MB
- `test-video-scenes.mp4`: ~5-7 MB

## Alternative: Use Remote URLs

If you prefer not to download files, you can use remote URLs directly in tests:

```typescript
import { TEST_VIDEOS } from '../integration/setup';

// Use remote URL (no download needed)
const url = TEST_VIDEOS.urls.short;
const result = await VideoIntel.analyze(url);
```

This is useful for:
- CI/CD environments
- Quick testing without setup
- Testing URL-based video loading

## Troubleshooting

### Download fails

**Problem:** Download script fails with network error

**Solution:**
1. Check your internet connection
2. Try again later (CDN might be temporarily unavailable)
3. Use remote URLs instead of local files

### Test videos not found

**Problem:** Integration tests fail with "Test video not found"

**Solution:**
Run the download script:
```bash
npm run test:download-fixtures
```

### Permission denied

**Problem:** Can't execute download script

**Solution:**
Make sure the script is executable:
```bash
chmod +x tests/fixtures/download-test-videos.js
```

Or run with node:
```bash
node tests/fixtures/download-test-videos.js
```

## Adding New Test Videos

To add a new test video:

1. **Edit `download-test-videos.js`:**
   ```javascript
   const TEST_VIDEOS = [
     // ... existing videos
     {
       name: 'my-test-video.mp4',
       url: 'http://example.com/video.mp4',
       description: 'Description of the video',
     },
   ];
   ```

2. **Update `setup.ts`:**
   ```typescript
   export const TEST_VIDEOS = {
     fixtures: {
       myTest: 'my-test-video.mp4',
       // ... other fixtures
     },
   };
   ```

3. **Run download:**
   ```bash
   npm run test:download-fixtures
   ```

## CI/CD Integration

For continuous integration, you have two options:

### Option 1: Download in CI (Recommended)

Add to your CI pipeline:
```yaml
- name: Download test fixtures
  run: npm run test:download-fixtures

- name: Run integration tests
  run: npm run test:integration
```

### Option 2: Use Remote URLs Only

Don't download files, use remote URLs in all tests:
```typescript
// In your test
const url = getTestVideoURL('short');
const result = await VideoIntel.analyze(url);
```

This is faster but requires stable internet in CI.

## Best Practices

1. **Use small videos** - Keep test videos under 10 MB each
2. **Test different formats** - Include mp4, webm if possible
3. **Test edge cases** - Include videos with black frames, scene changes, etc.
4. **Document usage** - Update this README when adding new fixtures
5. **Clean up** - Remove videos you no longer need

## License

Test videos are sourced from public repositories and are available for testing purposes. Make sure any videos you add comply with licensing requirements.


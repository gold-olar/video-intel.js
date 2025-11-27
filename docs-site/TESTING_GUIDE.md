# Testing Guide - Interactive Playground

## Quick Start

```bash
# 1. Start the development server
cd docs-site
npm run dev

# 2. Open browser
# Visit: http://localhost:3000/playground
```

## Testing Scenarios

### Test 1: Basic Thumbnail Generation

1. Upload a video (or use sample)
2. Enable only "Generate Thumbnails"
3. Set count to 5
4. Set quality to 0.8
5. Click "Analyze Video"
6. **Expected:** 5 thumbnails from key moments
7. **Verify:** Click download on each thumbnail
8. **Check:** Timestamps are reasonable

### Test 2: Color Extraction

1. Upload a colorful video
2. Enable only "Extract Colors"
3. Set color count to 5
4. Click "Analyze Video"
5. **Expected:** 5 dominant colors from video
6. **Verify:** Colors match video content
7. **Check:** Percentages add up close to 100%

### Test 3: Scene Detection

1. Upload a video with scene changes
2. Enable only "Detect Scenes"
3. Set threshold to 30
4. Click "Analyze Video"
5. **Expected:** List of scene change timestamps
6. **Verify:** Timestamps correspond to actual scene changes
7. **Check:** Scores reflect confidence

### Test 4: Full Analysis

1. Upload any video
2. Enable all features
3. Click "Analyze Video"
4. **Expected:** All results populate
5. **Verify:** 
   - Thumbnails tab shows images
   - Scenes tab shows timestamps
   - Colors tab shows palette
   - Metadata tab shows video info
   - Performance tab shows timing
6. **Check:** Code Generator shows correct code

### Test 5: Download Functionality

1. Generate thumbnails
2. Click download on first thumbnail
3. **Expected:** File downloads as JPG
4. **Verify:** Filename includes timestamp
5. **Check:** Image opens correctly

### Test 6: Code Generator

1. Configure analysis settings
2. Click "Analyze Video"
3. Scroll to Code Generator
4. Switch between frameworks (TypeScript, JavaScript, React, Vue)
5. **Expected:** Code updates for each framework
6. **Verify:** Copy button works
7. **Check:** Code is syntactically correct

### Test 7: Performance Metrics

1. Run full analysis on a 30-second video
2. View Performance tab in results
3. **Expected:** Timing breakdown displayed
4. **Verify:** Total time = sum of parts
5. **Check:** Speed multiplier is calculated
6. Scroll to detailed performance section
7. **Expected:** Charts and metrics visible

## Video Recommendations

### For Testing:

- **10-second video:** Quick tests
- **30-second video:** Standard tests
- **60-second+ video:** Performance tests

### Content Types:

- **Static scenes:** Test thumbnail quality
- **Multiple scenes:** Test scene detection
- **Colorful content:** Test color extraction
- **Various resolutions:** Test metadata

## Expected Results

### Thumbnails:
- Clear, representative frames
- Quality scores between 0.0-1.0
- Timestamps in seconds
- Downloadable as JPG

### Colors:
- 5 most dominant colors
- Hex and RGB values
- Percentage distribution
- Copy to clipboard works

### Scenes:
- Timestamps where scenes change
- Confidence scores (0-100)
- Reasonable scene boundaries

### Metadata:
- Accurate duration
- Correct resolution
- True frame rate
- Exact file size

## Troubleshooting

### No results appear:
- Check console for errors
- Verify library is built
- Try refreshing page

### Downloads don't work:
- Check browser permissions
- Try different browser
- Check console for errors

### Colors look wrong:
- May need more samples
- Try different quality setting
- Check video has color content

### Slow performance:
- Normal for long/high-res videos
- Try smaller videos
- Reduce thumbnail count
- Lower quality setting

## Performance Benchmarks

### Expected Times (1080p video):

| Operation | 10s | 30s | 60s |
|-----------|-----|-----|-----|
| Metadata | 50ms | 50ms | 50ms |
| Thumbnails (5) | 2-3s | 5-7s | 10-15s |
| Scenes | 3-4s | 8-10s | 15-20s |
| Colors | 2-3s | 5-6s | 8-10s |
| Full Analysis | 8-10s | 20-25s | 35-45s |

*Times vary based on hardware and browser*

## Success Criteria

✅ All features work without errors  
✅ Thumbnails are clear and relevant  
✅ Colors accurately represent video  
✅ Metadata matches video properties  
✅ Downloads work correctly  
✅ Code generator produces valid code  
✅ Performance metrics display correctly  
✅ UI is responsive and intuitive  

## Reporting Issues

If you find issues:

1. Note the video used (format, size, duration)
2. Note the configuration settings
3. Check browser console for errors
4. Screenshot the issue
5. Note browser and version
6. Create an issue on GitHub with details


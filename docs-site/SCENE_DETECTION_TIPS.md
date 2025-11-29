# Scene Detection Quick Tips

## ⚡ Quick Fix for "Only 2 Scenes Detected"

If you're seeing only the start and end of your video as scenes:

**Lower the threshold to 10-15%** in the configuration panel.

The default 30% threshold is too high for videos without dramatic visual changes.

## 🎯 Recommended Thresholds

| Video Type | Recommended Threshold |
|------------|----------------------|
| Vlogs / Talking Head | **10-15%** |
| Action / Sports | 25-35% |
| Movies / TV | 20-30% |
| Montages | 15-25% |
| Screen Recordings | 20-30% |

## 📊 Understanding Results

- **1 scene**: No changes detected - entire video is one continuous shot
- **2 scenes**: Only start/end detected - **threshold too high!**
- **Many scenes**: Good detection or threshold too low

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| Too few scenes | Lower threshold (try 10%) |
| Too many scenes | Raise threshold (try 30-40%) |
| Missing obvious cuts | Lower threshold by 5-10% |
| Detecting camera shake | Raise threshold by 10% |

## 💡 Pro Tips

1. Start with 15% and adjust based on results
2. Videos with continuous shots won't have scene boundaries
3. Lower confidence scores (<40%) may be false positives
4. Enable thumbnails to visually verify detected scenes

## 📖 Full Guide

For detailed information, see [SCENE_DETECTION_GUIDE.md](../SCENE_DETECTION_GUIDE.md)


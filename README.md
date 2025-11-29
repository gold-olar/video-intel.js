# VideoIntel.js

> **Smart video analysis in 3 lines of code.** Extract thumbnails, detect scenes, analyze colors, and more — all in the browser, with zero server costs.

[![NPM Version](https://img.shields.io/npm/v/videointel)](https://www.npmjs.com/package/videointel)
[![NPM Downloads](https://img.shields.io/npm/dm/videointel)](https://www.npmjs.com/package/videointel)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/npm/l/videointel)](https://github.com/gold-olar/video-intel.js/blob/main/LICENSE)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/videointel)](https://bundlephobia.com/package/videointel)

---

## 🎯 What is VideoIntel.js?

**VideoIntel.js** is a TypeScript-first video intelligence library that runs entirely in the browser. It provides powerful video analysis capabilities without sending data to any server — perfect for privacy-focused applications, cost-effective solutions, and offline-first experiences.

### Why VideoIntel.js?

- **🔒 Privacy-First**: All processing happens client-side. Your users' videos never leave their device.
- **💰 Zero Server Costs**: No API keys, no usage limits, no monthly bills.
- **⚡ Lightning Fast**: Optimized algorithms with intelligent frame sampling.
- **🎨 Feature-Rich**: Thumbnails, scene detection, color extraction, and metadata analysis.
- **💪 Type-Safe**: Built with TypeScript for excellent developer experience.
- **🌐 Universal**: Works in any modern browser — Chrome, Firefox, Safari, Edge.

---

## 📦 Installation

```bash
npm install videointel
```

```bash
yarn add videointel
```

```bash
pnpm add videointel
```
## 🚀 Quick Start

### Basic Usage

```typescript
import VideoIntel from 'videointel';

// From a file input
const file = document.querySelector('input[type="file"]').files[0];
const analysis = await VideoIntel.analyze(file, {
  thumbnails: { count: 5 },
  scenes: true,
  colors: true,
  metadata: true
});

console.log(analysis);
// {
//   thumbnails: [...],  // 5 smart thumbnails
//   scenes: [...],      // Detected scene changes
//   colors: [...],      // Dominant color palette
//   metadata: {...}     // Video duration, dimensions, etc.
// }
```

### Individual Features

```typescript
// Generate smart thumbnails
const thumbnails = await VideoIntel.getThumbnails(videoFile, {
  count: 5,
  quality: 0.9,
  format: 'jpeg'
});

// Detect scene changes
const scenes = await VideoIntel.detectScenes(videoFile, {
  minSceneLength: 3,
  threshold: 0.3
});

// Extract dominant colors
const colors = await VideoIntel.extractColors(videoFile, {
  count: 5
});

// Get video metadata
const metadata = await VideoIntel.getMetadata(videoFile);
console.log(`${metadata.width}x${metadata.height}, ${metadata.duration}s`);
```

### With Progress Tracking

```typescript
const analysis = await VideoIntel.analyze(videoFile, {
  thumbnails: { count: 5 },
  scenes: true,
  colors: true,
  onProgress: (progress) => {
    console.log(`Analysis: ${progress}% complete`);
    updateProgressBar(progress);
  }
});
```

### React Example

```tsx
import { useState } from 'react';
import VideoIntel from 'videointel';

function VideoUploader() {
  const [thumbnails, setThumbnails] = useState([]);
  const [progress, setProgress] = useState(0);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    
    const result = await VideoIntel.analyze(file, {
      thumbnails: { count: 6 },
      colors: true,
      onProgress: setProgress
    });
    
    setThumbnails(result.thumbnails);
  };

  return (
    <div>
      <input type="file" accept="video/*" onChange={handleFileUpload} />
      <progress value={progress} max="100" />
      <div className="thumbnails">
        {thumbnails.map(thumb => (
          <img key={thumb.timestamp} src={thumb.dataUrl} alt="Thumbnail" />
        ))}
      </div>
    </div>
  );
}
```

---

## ✨ Features

### Currently Available

- ✅ **Smart Thumbnail Generation** - Automatically select the best frames using quality scoring
- ✅ **Scene Detection** - Identify scene changes and transitions with configurable sensitivity
- ✅ **Color Extraction** - Extract dominant colors using K-means clustering
- ✅ **Metadata Extraction** - Duration, dimensions, aspect ratio, FPS, audio/video tracks
- ✅ **Progress Tracking** - Real-time progress callbacks for long operations
- ✅ **Memory Management** - Intelligent cleanup to prevent memory leaks
- ✅ **TypeScript Support** - Full type definitions for excellent DX
- ✅ **Multiple Formats** - Support for File, Blob, and URL inputs

---

## 📊 Performance Benchmarks

Real-world performance on a modern laptop (tested on M1 MacBook):

| Operation | 10s Video | 30s Video |
|-----------|-----------|-----------|
| **Metadata Extraction** | <100ms | <150ms |
| **Thumbnail Generation (5)** | <3s | <8s |
| **Scene Detection** | <3s | <8s |
| **Color Extraction (5)** | <3s | <8s |
| **Full Analysis** | <10s | <25s |

**Memory Usage**: <100MB for typical videos

**Key Performance Features**:
- Intelligent frame sampling (doesn't process every frame)
- Sub-linear scaling (10 thumbnails ≠ 10× time)
- Memory-efficient processing with automatic cleanup
- No memory leaks over extended usage

> 💡 **Tip**: Use the `analyze()` method to extract multiple features at once for better performance.

---

## 📖 API Reference

### `VideoIntel.analyze(video, options)`

Perform comprehensive video analysis with multiple features in a single call.

**Parameters**:
- `video`: `File | Blob | string` - Video to analyze
- `options`: `AnalysisOptions` - Configuration object

**Returns**: `Promise<AnalysisResult>`

**Example**:
```typescript
const result = await VideoIntel.analyze(file, {
  metadata: true,
  thumbnails: { count: 5, quality: 0.9 },
  scenes: { minSceneLength: 3 },
  colors: { count: 5 },
  onProgress: (progress) => console.log(`${progress}%`)
});
```

### `VideoIntel.getThumbnails(video, options?)`

Generate smart thumbnails from a video.

**Options**:
- `count`: Number of thumbnails (default: 5)
- `quality`: JPEG quality 0-1 (default: 0.85)
- `format`: `'jpeg' | 'png' | 'webp'` (default: 'jpeg')
- `size`: `{ width?: number, height?: number }`

### `VideoIntel.detectScenes(video, options?)`

Detect scene changes in a video.

**Options**:
- `minSceneLength`: Minimum scene duration in seconds (default: 2)
- `threshold`: Sensitivity 0-1 (default: 0.3)
- `includeThumbnails`: Generate thumbnails for each scene (default: false)

### `VideoIntel.extractColors(video, options?)`

Extract dominant colors from a video.

**Options**:
- `count`: Number of colors to extract (default: 5)
- `sampleFrames`: Number of frames to sample (default: 10)
- `quality`: `'fast' | 'balanced' | 'accurate'` (default: 'balanced')

### `VideoIntel.getMetadata(video)`

Extract video metadata (duration, dimensions, format, etc.).

**Returns**: `Promise<VideoMetadata>`

---

## 📚 Documentation

For comprehensive guides, API reference, and interactive examples:

**[📖 Full Documentation](https://gold-olar.github.io/video_intel_js/)** *(Coming Soon)*

### Running Docs Locally

```bash

cd docs-site
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## 🌐 Browser Support

VideoIntel.js works in all modern browsers that support:
- Canvas API
- Video element
- Promises/async-await
- ES6+

| Browser | Minimum Version |
|---------|-----------------|
| **Chrome** | 90+ |
| **Edge** | 90+ |
| **Firefox** | 88+ |
| **Safari** | 14+ |
| **Opera** | 76+ |

**Progressive Enhancement**: The library gracefully handles unsupported features.

---

## 🛠️ Use Cases

### Video Platforms & CDNs
- Generate thumbnails on upload without server processing
- Create video previews and chapter markers
- Extract colors for UI theming

### Content Management Systems
- Automatic video metadata extraction
- Smart thumbnail selection for listings
- Scene-based navigation

### Video Editors & Tools
- Timeline preview generation
- Scene detection for automatic splitting
- Color grading analysis

### E-learning Platforms
- Chapter detection for course videos
- Thumbnail generation for video libraries
- Metadata extraction for search/filtering

### Social Media & Marketing
- Automatic thumbnail selection for posts
- Color palette extraction for branding
- Video quality assessment

---

## 🔧 Advanced Configuration

### Custom Worker Pool

```typescript
await VideoIntel.init({
  workers: 4,  // Number of worker threads
  models: ['thumbnail', 'scene']  // Preload specific models
});
```

### Memory Management

```typescript
import { MemoryManager } from 'videointel';

const memoryManager = MemoryManager.getInstance();
memoryManager.setMaxMemoryUsage(512 * 1024 * 1024); // 512MB
```

### Direct Module Access

```typescript
import { 
  ThumbnailGenerator, 
  SceneDetector,
  ColorExtractor 
} from 'videointel';

// Use individual modules for fine-grained control
const generator = new ThumbnailGenerator(frameExtractor, frameScorer);
const thumbnails = await generator.generate(video, options);
```

---

## 🧪 Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run integration tests
npm run test:integration

# Run browser tests with Playwright
npm run test:browser

# Build the library
npm run build

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

---

## 🤝 Contributing

Contributions are welcome! This project is in active development.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure:
- ✅ All tests pass (`npm test`)
- ✅ Code is formatted (`npm run format`)
- ✅ No linting errors (`npm run lint`)
- ✅ TypeScript types are correct (`npm run type-check`)

---

## 🗺️ Roadmap

### Phase 1: Core Features ✅ (Current)
- [x] Thumbnail generation
- [x] Scene detection
- [x] Color extraction
- [x] Metadata extraction
- [x] TypeScript support
- [x] Browser compatibility

### Phase 2: Advanced AI Features (Coming Soon)
- [ ] 👤 **Face Detection** - Identify and track faces in videos
- [ ] 🔍 **Object Detection** - Recognize 80+ common objects (COCO dataset)
- [ ] 📊 **Quality Assessment** - Automatic video quality scoring
- [ ] 🎬 **Action Recognition** - Detect activities and movements
- [ ] 🔒 **Content Safety** - NSFW and inappropriate content detection
- [ ] 📝 **Text Detection** - OCR for text in video frames
- [ ] 🎭 **Emotion Detection** - Facial expression analysis

### Phase 3: Performance & Optimization
- [ ] WebAssembly acceleration
- [ ] GPU processing with WebGL
- [ ] Worker pool optimization
- [ ] Streaming video support
- [ ] Real-time processing

### Phase 4: Extended Features
- [ ] Audio analysis (volume, silence detection)
- [ ] Shot classification
- [ ] Automatic highlight detection
- [ ] Video comparison/similarity
- [ ] Custom ML model support

---

## 🎓 Examples

Check out the [examples](./examples) directory for more use cases:
- Video upload with preview
- Batch thumbnail generation
- Scene-based video player
- Color palette generator
- Video metadata dashboard

---

## 📄 License

MIT © 2025 Samuel Olamide

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

---

## 🔗 Links

- **NPM Package**: https://www.npmjs.com/package/videointel
- **GitHub Repository**: https://github.com/gold-olar/video-intel.js
- **Documentation**: https://gold-olar.github.io/video-intel.js/ 
- **Issue Tracker**: https://github.com/gold-olar/video-intel.js/issues

---

## ⭐ Show Your Support

If VideoIntel.js helps you build something awesome, give it a ⭐ on GitHub!

Want to support the development? Buy me a coffee! ☕

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-Support-yellow?style=for-the-badge&logo=buy-me-a-coffee)](https://buymeacoffee.com/gold_olar)

---

<div align="center">

**Built with ❤️ using TypeScript**

[Report Bug](https://github.com/gold-olar/video-intel.js/issues) · [Request Feature](https://github.com/gold-olar/video-intel.js/issues) · [Documentation](https://gold-olar.github.io/video_intel_js/)

</div>

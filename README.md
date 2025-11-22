# VideoIntel.js

> Smart video analysis in 3 lines of code. TypeScript-first, privacy-focused, zero-cost.

[![NPM Version](https://img.shields.io/npm/v/videointel)](https://www.npmjs.com/package/videointel)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)](https://www.typescriptlang.org/)
[![Build Status](https://github.com/gold-olar/video-intel.js/workflows/test/badge.svg)](https://github.com/gold-olar/video-intel.js/actions)
[![GitHub stars](https://img.shields.io/github/stars/gold-olar/video-intel.js?style=social)](https://github.com/gold-olar/video-intel.js)

## 🚧 Work In Progress

This library is currently under active development.

## Features (Planned)

✨ **Smart Thumbnails** - AI-powered frame selection  
🎬 **Scene Detection** - Automatic chapter markers  
🎨 **Color Extraction** - Dominant color palettes  
👤 **Face Detection** - Identify faces in videos  
🔍 **Object Recognition** - Detect 80+ objects  
📊 **Quality Assessment** - Video quality scoring  
🔒 **Privacy-First** - All processing in browser  
💪 **Type-Safe** - Full TypeScript support  

## Installation

```bash
npm install videointel
```

## Quick Start

```typescript
import VideoIntel from 'videointel';

// Analyze video
const file: File = uploadInput.files[0];
const analysis = await VideoIntel.analyze(file, {
  thumbnails: { count: 5 },
  scenes: true,
  colors: true
});

// Use results
analysis.thumbnails?.forEach(thumb => {
  displayThumbnail(thumb.image);
});
```


## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Contributing

Contributions welcome! This project is in early development.

## License

MIT © 2025

---

**Author:** Samuel Olamide  
**Status:** In Development  
**Language:** TypeScript 5.x


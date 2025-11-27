# VideoIntel.js Documentation Site

A comprehensive documentation and playground website for VideoIntel.js, built with Next.js 15, TypeScript, and Tailwind CSS.

## 🚀 Features

### 📚 Complete Documentation
- **Getting Started Guide** - Installation, quick start, and basic examples
- **API Reference** - Full API documentation with TypeScript types
- **Feature Guides** - In-depth tutorials for thumbnails, scenes, colors, etc.
- **Integration Examples** - React, Vue, and framework-specific code
- **FAQ** - Common questions and troubleshooting

### 🎮 Interactive Playground
- Upload and analyze videos directly in the browser
- Configure analysis features with real-time settings
- View results in organized tabs (thumbnails, scenes, colors, metadata)
- **Code Generator** - Get framework-specific code for your configuration
- **Performance Metrics** - Detailed analysis timing and benchmarks
- **Sample Videos** - Pre-loaded videos for quick testing

### 📊 Performance Benchmarks
- Real-world performance metrics
- Interactive charts and visualizations
- Browser comparison data
- Detailed metrics tables
- Test environment information

### 🎨 Beautiful Design
- Modern, clean interface
- Dark mode support
- Fully responsive (mobile, tablet, desktop)
- Smooth animations and transitions
- Accessible (WCAG compliant)

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Icons:** React Icons (Feather Icons)
- **Deployment:** Static export for GitHub Pages

## 📦 Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Export static site
npm run export
```

## 📁 Project Structure

```
docs-site/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── playground/page.tsx         # Interactive playground
│   ├── benchmarks/page.tsx         # Performance benchmarks
│   └── docs/
│       ├── getting-started/page.tsx
│       ├── api/page.tsx
│       ├── guides/
│       ├── examples/
│       └── faq/page.tsx
├── components/
│   ├── Landing/                    # Landing page components
│   ├── Playground/                 # Playground components
│   ├── Benchmarks/                 # Benchmark components
│   ├── Docs/                       # Documentation components
│   └── Shared/                     # Shared components
├── utils/                          # Utility functions
├── public/
│   ├── videos/                     # Sample videos
│   └── benchmarks/                 # Benchmark data
└── out/                           # Static export output
```

## 🎯 Key Components

### Documentation
- **`Sidebar`** - Navigation with hierarchical structure
- **`TableOfContents`** - Auto-generated TOC with scroll tracking
- **`CodeBlock`** - Syntax-highlighted code with copy button
- **`DocsLayout`** - Consistent layout for all docs pages

### Playground
- **`VideoUploader`** - Drag-and-drop video upload
- **`FeatureSelector`** - Configure analysis settings
- **`ResultsDisplay`** - Tabbed results viewer
- **`CodeGenerator`** - Generate framework-specific code
- **`PerformanceMetrics`** - Visualize analysis performance
- **`SampleVideoSelector`** - Load pre-configured samples

### Benchmarks
- **`MetricsCard`** - Display key metrics with trends
- **`ComparisonChart`** - Bar chart visualizations
- **`MetricsTable`** - Detailed performance data

## 🚢 Deployment

### GitHub Pages

1. **Configure GitHub Pages:**
   - Go to repository Settings → Pages
   - Source: Deploy from a branch
   - Branch: `gh-pages` / root

2. **Deploy:**
   ```bash
   npm run build
   npm run export
   ```

3. **Push to gh-pages branch:**
   ```bash
   # The GitHub Actions workflow will handle this automatically
   git push
   ```

### Manual Deployment

```bash
# Build and export
npm run build
npm run export

# The static site is in the 'out' directory
# Deploy 'out' to any static hosting service
```

## 🔧 Configuration

### Environment Variables

Create `.env.local` for local development:

```bash
# Optional: Analytics
NEXT_PUBLIC_GA_ID=your-ga-id

# Optional: Custom domain
NEXT_PUBLIC_DOMAIN=videointel.example.com
```

### Next.js Config

Edit `next.config.ts` for custom settings:

```typescript
const nextConfig = {
  output: 'export',
  basePath: process.env.NODE_ENV === 'production' ? '/video-intel-js' : '',
  images: {
    unoptimized: true,
  },
};
```

## 📝 Adding Content

### New Documentation Page

1. Create file in `app/docs/your-page/page.tsx`:

```typescript
import DocsLayout from '@/components/Docs/DocsLayout';
import CodeBlock from '@/components/Shared/CodeBlock';

const tocItems = [
  { id: 'section-1', title: 'Section 1', level: 2 },
  // ... more sections
];

export default function YourPage() {
  return (
    <DocsLayout tocItems={tocItems}>
      <h1>Your Page Title</h1>
      <p>Your content here...</p>
      
      <CodeBlock
        language="typescript"
        code={`// Your code here`}
      />
    </DocsLayout>
  );
}
```

2. Add to sidebar in `components/Shared/Sidebar.tsx`

### New Example

Add to `app/docs/examples/your-example/page.tsx` following the same pattern.

## 🎨 Customization

### Colors

Edit `tailwind.config.ts`:

```typescript
theme: {
  extend: {
    colors: {
      primary: '#6366f1', // Indigo
      // ... add custom colors
    },
  },
},
```

### Fonts

Update `app/globals.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Your+Font&display=swap');

body {
  font-family: 'Your Font', sans-serif;
}
```

## 🧪 Testing

```bash
# Run linting
npm run lint

# Type checking
npm run type-check

# Build test (checks for build errors)
npm run build
```

## 📊 Sample Data

### Adding Sample Videos

Place video files in `public/videos/`:

- `sample-10s.mp4` - Short demo video
- `sample-30s.mp4` - Product showcase
- `sample-scenes.mp4` - Scene detection test

Update `utils/sampleVideos.ts` with metadata.

### Adding Benchmark Data

Save benchmark results to `public/benchmarks/latest.json`:

```json
{
  "version": "0.1.0",
  "timestamp": "2025-11-27T12:00:00Z",
  "environment": {
    "browser": "Chrome 120",
    "os": "macOS",
    "cpu": "Apple M1"
  },
  "metrics": {
    "thumbnails_10s": { "avg": 2845, "min": 2650, "max": 3200 }
  }
}
```

## 🔗 Integration with VideoIntel.js

### Using the Real Library

1. Install VideoIntel:
   ```bash
   npm install video-intel
   # or use local build
   npm install ../dist
   ```

2. Update playground to use real library:
   ```typescript
   import videoIntel from 'video-intel';
   
   const results = await videoIntel.analyze(file, options);
   ```

3. Replace mock data with actual analysis

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](../LICENSE) file for details

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons from [React Icons](https://react-icons.github.io/react-icons/)

## 📞 Support

- [Documentation](https://yourusername.github.io/video-intel-js/docs)
- [Issues](https://github.com/yourusername/video-intel-js/issues)
- [Discussions](https://github.com/yourusername/video-intel-js/discussions)

---

**Built with ❤️ for the VideoIntel.js community**

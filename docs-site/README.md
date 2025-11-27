# VideoIntel.js Documentation Site

This is the official documentation and playground site for VideoIntel.js, built with Next.js, React, and Tailwind CSS.

## 🚀 Getting Started

### Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

### Build

```bash
# Build for production
npm run build
```

The static site will be generated in the `out` directory.

## 📁 Project Structure

```
docs-site/
├── app/                      # Next.js app directory
│   ├── page.tsx             # Landing page
│   ├── playground/          # Interactive playground
│   ├── docs/                # Documentation pages
│   └── benchmarks/          # Benchmark results
├── components/
│   ├── Landing/             # Landing page components
│   │   ├── Hero.tsx
│   │   ├── Features.tsx
│   │   ├── QuickStart.tsx
│   │   ├── PerformanceHighlights.tsx
│   │   └── Footer.tsx
│   ├── Playground/          # Playground components
│   │   ├── VideoUploader.tsx
│   │   ├── FeatureSelector.tsx
│   │   └── ResultsDisplay.tsx
│   └── Shared/              # Shared components
├── public/                  # Static assets
└── utils/                   # Utility functions
```

## 🎨 Features

- **Landing Page**: Hero section, features showcase, quick start guide, performance highlights
- **Interactive Playground**: Upload videos and test VideoIntel features in real-time
- **Documentation**: API reference and guides (coming soon)
- **Benchmarks**: Performance metrics (coming soon)

## 🚢 Deployment

The site is automatically deployed to GitHub Pages when changes are pushed to the `main` branch.

### Manual Deployment

1. Ensure you have GitHub Pages enabled in your repository settings
2. Push changes to the `main` branch
3. The GitHub Actions workflow will automatically build and deploy

## 🛠️ Tech Stack

- **Framework**: Next.js 16
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **Icons**: React Icons
- **Code Highlighting**: Prism React Renderer
- **Deployment**: GitHub Pages

## 📝 License

MIT License - see the LICENSE file in the root directory.

# Quick Start Guide

## 🚀 Running the Documentation Site

### Prerequisites
- Node.js 20+ installed
- npm or yarn package manager

### Installation

```bash
# Navigate to the docs site directory
cd docs-site

# Install dependencies
npm install
```

### Development

```bash
# Start the development server
npm run dev
```

The site will be available at: **http://localhost:3000**

### Building for Production

```bash
# Create a production build
npm run build
```

The static site will be generated in the `out/` directory.

### Testing the Production Build

```bash
# After building, serve the static files
cd out
python3 -m http.server 8000
# Or use any static file server
```

Visit: **http://localhost:8000**

---

## 📄 Available Pages

### 1. Landing Page - `/`
- **URL**: http://localhost:3000
- **Features**:
  - Hero section with code example
  - Features showcase (8 key features)
  - Quick start guide with tabbed examples
  - Performance highlights
  - Footer with navigation

### 2. Interactive Playground - `/playground`
- **URL**: http://localhost:3000/playground
- **Features**:
  - Video upload (drag & drop or file picker)
  - Feature configuration:
    - Thumbnails (count, quality)
    - Scene detection (threshold)
    - Color extraction (count)
    - Metadata extraction
  - Results display (tabbed):
    - Thumbnails gallery
    - Scene timeline
    - Color palette
    - Metadata JSON
    - Performance metrics
  - Mock data demonstration (will be replaced with real VideoIntel integration)

### 3. Documentation - `/docs`
- **URL**: http://localhost:3000/docs
- **Status**: Placeholder
- **Coming in Phase 2**:
  - API Reference
  - Guides & Tutorials
  - Examples
  - FAQ

### 4. Benchmarks - `/benchmarks`
- **URL**: http://localhost:3000/benchmarks
- **Status**: Placeholder
- **Coming in Phase 2**:
  - Performance metrics
  - Browser comparisons
  - Historical trends
  - Test methodology

---

## 🎨 Development Tips

### Hot Reload
Changes to files will automatically reload in development mode:
- React components
- CSS/Tailwind classes
- TypeScript files

### Code Structure
```
docs-site/
├── app/              # Next.js pages
├── components/       # React components
│   ├── Landing/     # Landing page components
│   ├── Playground/  # Playground components
│   └── Shared/      # Shared components (future)
├── public/          # Static assets
└── utils/           # Utility functions (future)
```

### Component Guidelines

1. **Use TypeScript** - All components are fully typed
2. **Client Components** - Use `'use client'` for interactive components
3. **Dark Mode** - Support both light and dark themes
4. **Responsive** - Mobile-first design approach
5. **Accessibility** - Use semantic HTML and ARIA labels

### Styling

- **Tailwind CSS 4** - Utility-first CSS framework
- **Dark Mode** - Automatic dark mode support
- **Custom Classes** - Defined in `globals.css`
- **Icons** - React Icons (Feather Icons set)

### Common Tasks

#### Adding a New Page

```bash
# Create a new directory in app/
mkdir app/new-page

# Create the page component
touch app/new-page/page.tsx
```

```tsx
// app/new-page/page.tsx
export default function NewPage() {
  return (
    <div>
      <h1>New Page</h1>
    </div>
  );
}
```

#### Adding a New Component

```bash
# Create a new component
touch components/Landing/NewComponent.tsx
```

```tsx
// components/Landing/NewComponent.tsx
'use client';

export default function NewComponent() {
  return (
    <div className="p-4">
      {/* Component content */}
    </div>
  );
}
```

#### Using Environment Variables

```bash
# Create .env.local file
touch .env.local
```

```env
# .env.local
NEXT_PUBLIC_API_URL=https://api.example.com
```

---

## 🐛 Troubleshooting

### Port Already in Use

If port 3000 is already in use:

```bash
# Use a different port
npm run dev -- -p 3001
```

### Module Not Found Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build Errors

```bash
# Check for TypeScript errors
npm run lint

# Check for type errors
npx tsc --noEmit
```

### Styling Issues

```bash
# If Tailwind classes aren't applying
# Make sure your file is included in tailwind.config.js

# Clear Next.js cache
rm -rf .next
npm run dev
```

---

## 📝 Making Changes

### Before Committing

1. **Lint your code**
   ```bash
   npm run lint
   ```

2. **Build successfully**
   ```bash
   npm run build
   ```

3. **Test in browser**
   - Check all pages load
   - Test responsive design
   - Verify dark mode works

### Git Workflow

```bash
# Create a feature branch
git checkout -b feature/my-feature

# Make your changes
# ...

# Commit changes
git add .
git commit -m "Add my feature"

# Push to GitHub
git push origin feature/my-feature
```

---

## 🔗 Useful Links

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Icons](https://react-icons.github.io/react-icons/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

---

## 💡 Next Steps

### Phase 2 Implementation

1. **Documentation Pages**
   - Write API reference
   - Create guides
   - Add examples
   - Implement search

2. **Playground Integration**
   - Replace mock data with real VideoIntel integration
   - Add sample videos
   - Implement code generator
   - Add sharing functionality

3. **Benchmarks Page**
   - Create visualization components
   - Integrate real benchmark data
   - Add comparison tools

---

## 📞 Getting Help

If you encounter issues:

1. Check this guide first
2. Review the component files for examples
3. Check the GitHub issues
4. Ask in discussions

---

**Happy Coding! 🎉**


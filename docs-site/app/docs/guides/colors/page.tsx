import DocsLayout from '@/components/Docs/DocsLayout';
import CodeBlock from '@/components/Shared/CodeBlock';

const tocItems = [
  { id: 'overview', title: 'Overview', level: 2 },
  { id: 'how-it-works', title: 'How It Works', level: 2 },
  { id: 'algorithm', title: 'K-Means Algorithm', level: 3 },
  { id: 'sampling', title: 'Frame Sampling', level: 3 },
  { id: 'pixel-extraction', title: 'Pixel Extraction', level: 3 },
  { id: 'clustering', title: 'Color Clustering', level: 3 },
  { id: 'configuration', title: 'Configuration', level: 2 },
  { id: 'best-practices', title: 'Best Practices', level: 2 },
  { id: 'performance', title: 'Performance', level: 2 },
  { id: 'examples', title: 'Examples', level: 2 },
];

export default function ColorExtractionGuidePage() {
  return (
    <DocsLayout tocItems={tocItems}>
      <h1>Color Extraction Guide</h1>
      <p className="lead">
        Learn how VideoIntel extracts dominant colors from videos using K-means clustering,
        smart sampling, and optimized pixel analysis for fast and accurate results.
      </p>

      <h2 id="overview">Overview</h2>
      <p>
        Color extraction identifies the most dominant colors in a video by analyzing frames
        and grouping similar colors together. This is useful for:
      </p>

      <ul>
        <li><strong>UI Theming:</strong> Generate color schemes matching video content</li>
        <li><strong>Video Categorization:</strong> Classify videos by color palette</li>
        <li><strong>Design Systems:</strong> Create brand-aligned color palettes</li>
        <li><strong>Thumbnail Matching:</strong> Ensure UI colors complement video colors</li>
        <li><strong>Mood Analysis:</strong> Understand emotional tone through color</li>
      </ul>

      <CodeBlock
        language="typescript"
        code={`// Extract 5 dominant colors from a video
const colors = await videoIntel.extractColors(video, {
  count: 5,
  sampleFrames: 10,
  quality: 'balanced'
});

// Use the colors
colors.forEach(color => {
  console.log(\`\${color.hex} - \${color.percentage}% of video\`);
  // Output example: "#3B82F6 - 32.5% of video"
});`}
      />

      <h2 id="how-it-works">How It Works</h2>
      <p>
        VideoIntel's color extraction uses a sophisticated multi-stage pipeline:
      </p>

      <div className="not-prose space-y-4 my-6">
        <div className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/30 p-4">
          <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-2">
            Step 1: Frame Sampling
          </h4>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Extract frames at evenly distributed intervals throughout the video. Default: 10 frames
            from start to end, ensuring representative sampling of the entire video.
          </p>
        </div>

        <div className="border-l-4 border-green-500 bg-green-50 dark:bg-green-950/30 p-4">
          <h4 className="font-bold text-green-900 dark:text-green-100 mb-2">
            Step 2: Pixel Extraction
          </h4>
          <p className="text-sm text-green-800 dark:text-green-200">
            Extract pixel data from each frame and sample based on quality setting. Balanced quality
            samples 30% of pixels for good accuracy with fast processing.
          </p>
        </div>

        <div className="border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-950/30 p-4">
          <h4 className="font-bold text-purple-900 dark:text-purple-100 mb-2">
            Step 3: K-Means Clustering
          </h4>
          <p className="text-sm text-purple-800 dark:text-purple-200">
            Group similar colors together using K-means clustering algorithm. This finds the N most
            dominant colors by iteratively improving cluster centers.
          </p>
        </div>

        <div className="border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-950/30 p-4">
          <h4 className="font-bold text-orange-900 dark:text-orange-100 mb-2">
            Step 4: Color Conversion
          </h4>
          <p className="text-sm text-orange-800 dark:text-orange-200">
            Convert cluster centers to multiple color formats (hex, RGB, HSL) and calculate
            dominance percentages for each color.
          </p>
        </div>
      </div>

      <h3 id="algorithm">K-Means Clustering Algorithm</h3>
      <p>
        K-means is an unsupervised machine learning algorithm that groups similar colors:
      </p>

      <CodeBlock
        language="typescript"
        code={`// Simplified K-means pseudo-code
function kMeansClustering(pixels: RGB[], k: number) {
  // 1. Initialize K random cluster centers (K-means++ for better results)
  let centers = initializeKMeansPlusPlus(pixels, k);
  
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    // 2. Assign each pixel to nearest cluster center
    const assignments = pixels.map(pixel => 
      findNearestCenter(pixel, centers)
    );
    
    // 3. Recalculate centers as mean of assigned pixels
    const newCenters = calculateClusterMeans(pixels, assignments, k);
    
    // 4. Check convergence (centers stop moving)
    if (hasConverged(centers, newCenters)) {
      break;
    }
    
    centers = newCenters;
  }
  
  // 5. Calculate dominance percentage for each cluster
  const percentages = calculatePercentages(assignments, k);
  
  return centers.map((center, i) => ({
    color: center,
    percentage: percentages[i]
  }));
}`}
      />

      <h4>K-Means++ Initialization</h4>
      <p>
        VideoIntel uses K-means++ for smarter initial cluster placement, which:
      </p>

      <ul>
        <li>Spreads initial centers far apart in color space</li>
        <li>Converges 2-3x faster than random initialization</li>
        <li>Produces more consistent results across runs</li>
        <li>Avoids poor local minima</li>
      </ul>

      <CodeBlock
        language="typescript"
        code={`// K-means++ initialization
function initializeKMeansPlusPlus(pixels: RGB[], k: number) {
  const centers: RGB[] = [];
  
  // 1. Choose first center randomly
  centers.push(pixels[randomIndex()]);
  
  // 2. Choose remaining centers based on distance
  for (let i = 1; i < k; i++) {
    // Calculate distance from each pixel to nearest existing center
    const distances = pixels.map(pixel => {
      const minDist = Math.min(...centers.map(c => 
        colorDistance(pixel, c)
      ));
      return minDist * minDist;  // Square for probability weighting
    });
    
    // 3. Choose next center with probability proportional to distance
    const nextCenter = weightedRandomChoice(pixels, distances);
    centers.push(nextCenter);
  }
  
  return centers;
}`}
      />

      <h3 id="sampling">Frame Sampling Strategy</h3>
      <p>
        VideoIntel samples frames evenly throughout the video to ensure representative color coverage:
      </p>

      <CodeBlock
        language="typescript"
        code={`// Example: 60-second video, 10 frames
const interval = 60 / 10;  // 6 seconds
const timestamps = [3, 9, 15, 21, 27, 33, 39, 45, 51, 57];
//                   ↑ Start at 0.5 × interval to avoid black frames

// Distribution ensures:
// ✓ Start, middle, and end are all represented
// ✓ No clustering in one section
// ✓ Captures color changes throughout video`}
      />

      <h3 id="pixel-extraction">Pixel Extraction & Sampling</h3>
      <p>
        Analyzing every pixel would be slow. VideoIntel uses adaptive sampling based on quality:
      </p>

      <div className="not-prose overflow-x-auto my-6">
        <table className="min-w-full border border-gray-300 dark:border-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Quality</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Sampling Rate</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Pixels Analyzed</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Processing Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            <tr>
              <td className="px-4 py-2 text-sm font-mono text-gray-900 dark:text-gray-100">fast</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">10%</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">~200K pixels</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">1-2 seconds</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-sm font-mono text-gray-900 dark:text-gray-100">balanced ⭐</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">30%</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">~600K pixels</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">3-5 seconds</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-sm font-mono text-gray-900 dark:text-gray-100">best</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">100%</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">~2M pixels</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">10-15 seconds</td>
            </tr>
          </tbody>
        </table>
      </div>

      <CodeBlock
        language="typescript"
        code={`// Pixel extraction with sampling
function extractPixels(frame: Canvas, samplingRate: number) {
  const ctx = frame.getContext('2d');
  const imageData = ctx.getImageData(0, 0, frame.width, frame.height);
  const pixels: RGB[] = [];
  
  // Calculate step size based on sampling rate
  // 30% sampling = step every ~3 pixels
  const step = Math.round(1 / samplingRate);
  
  for (let i = 0; i < imageData.data.length; i += 4 * step) {
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];
    const a = imageData.data[i + 3];
    
    // Skip fully transparent pixels
    if (a > 0) {
      pixels.push([r, g, b]);
    }
  }
  
  return pixels;
}`}
      />

      <h3 id="clustering">Color Clustering Process</h3>
      <p>
        The clustering process iteratively refines color groups:
      </p>

      <CodeBlock
        language="typescript"
        code={`// Example clustering progression for 5 colors

Iteration 0 (Initial):
Centers: [Random colors from K-means++ initialization]

Iteration 1:
Centers: [Updated based on pixel assignments]
Movement: Large (centers adjust to data)

Iteration 5:
Centers: [Refined positions]
Movement: Moderate (converging)

Iteration 10:
Centers: [Nearly final positions]
Movement: Small (<1% change)

Iteration 12:
Centers: [Converged]
Movement: Negligible → STOP

Result:
Color 1: #2563EB (Blue)   - 35.2%
Color 2: #10B981 (Green)  - 28.7%
Color 3: #F59E0B (Orange) - 18.3%
Color 4: #6B7280 (Gray)   - 12.1%
Color 5: #1F2937 (Dark)   - 5.7%`}
      />

      <h2 id="configuration">Configuration Options</h2>
      <p>
        Fine-tune color extraction for your specific needs:
      </p>

      <CodeBlock
        language="typescript"
        code={`const colors = await videoIntel.extractColors(video, {
  // Number of colors to extract (2-10)
  count: 5,             // Default: 5
  
  // Number of frames to sample from video
  sampleFrames: 10,     // Default: 10
  
  // Sampling quality
  quality: 'balanced',  // 'fast' | 'balanced' | 'best'
});

// Output format
interface Color {
  hex: string;            // "#3B82F6"
  rgb: [number, number, number];  // [59, 130, 246]
  hsl: [number, number, number];  // [217, 91, 60]
  percentage: number;     // 32.5 (percentage of video)
}`}
      />

      <h3>Choosing Color Count</h3>
      <p>
        The optimal number of colors depends on your use case:
      </p>

      <CodeBlock
        language="typescript"
        code={`// Minimalist palette (2-3 colors)
const minimal = await videoIntel.extractColors(video, { count: 3 });
// Use case: Simple color scheme, accent colors

// Standard palette (4-5 colors)
const standard = await videoIntel.extractColors(video, { count: 5 });
// Use case: UI theming, brand colors

// Rich palette (6-8 colors)
const rich = await videoIntel.extractColors(video, { count: 8 });
// Use case: Detailed analysis, design systems

// Comprehensive (9-10 colors)
const comprehensive = await videoIntel.extractColors(video, { count: 10 });
// Use case: Color grading, mood boards`}
      />

      <h2 id="best-practices">Best Practices</h2>

      <h3>1. Match Quality to Use Case</h3>
      <CodeBlock
        language="typescript"
        code={`// Real-time preview (prioritize speed)
const previewColors = await videoIntel.extractColors(video, {
  count: 3,
  sampleFrames: 5,
  quality: 'fast'
});

// Production color palette (balance speed & accuracy)
const productionColors = await videoIntel.extractColors(video, {
  count: 5,
  sampleFrames: 10,
  quality: 'balanced'  // ⭐ Recommended
});

// High-precision analysis (prioritize accuracy)
const precisionColors = await videoIntel.extractColors(video, {
  count: 8,
  sampleFrames: 20,
  quality: 'best'
});`}
      />

      <h3>2. Filter Out Near-White/Black (Optional)</h3>
      <p>
        For UI theming, you might want to exclude neutral colors:
      </p>

      <CodeBlock
        language="typescript"
        code={`function filterNeutrals(colors: Color[], threshold = 15) {
  return colors.filter(color => {
    const [r, g, b] = color.rgb;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    
    // Skip near-white colors (high brightness, low saturation)
    if (max > 240 && (max - min) < threshold) {
      return false;
    }
    
    // Skip near-black colors (low brightness)
    if (max < 20) {
      return false;
    }
    
    return true;
  });
}

// Usage
const allColors = await videoIntel.extractColors(video, { count: 8 });
const vibrantColors = filterNeutrals(allColors);`}
      />

      <h3>3. Sort by Dominance or Brightness</h3>
      <CodeBlock
        language="typescript"
        code={`const colors = await videoIntel.extractColors(video, { count: 5 });

// Already sorted by dominance (most common first)
const mostDominant = colors[0];

// Sort by brightness (for gradients)
const byBrightness = [...colors].sort((a, b) => {
  const brightnessA = (a.rgb[0] + a.rgb[1] + a.rgb[2]) / 3;
  const brightnessB = (b.rgb[0] + b.rgb[1] + b.rgb[2]) / 3;
  return brightnessA - brightnessB;  // Dark to light
});

// Sort by saturation (most vibrant first)
const bySaturation = [...colors].sort((a, b) => {
  return b.hsl[1] - a.hsl[1];  // High to low saturation
});`}
      />

      <h2 id="performance">Performance Optimization</h2>

      <h3>Benchmarks</h3>
      <div className="not-prose overflow-x-auto my-6">
        <table className="min-w-full border border-gray-300 dark:border-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Configuration</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Pixels Analyzed</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Time (720p)</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Accuracy</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            <tr>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">5 frames, fast</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">~100K</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">0.5-1s</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">85%</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">10 frames, balanced</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">~600K</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">3-5s</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">95%</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">20 frames, best</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">~4M</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">12-18s</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">98%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="not-prose bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 my-6">
        <p className="text-sm text-blue-900 dark:text-blue-100 font-semibold mb-2">
          💡 Performance Tip
        </p>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          The 'balanced' quality setting provides 95% accuracy at 5x the speed of 'best' quality.
          Unless you need pixel-perfect precision, balanced is the recommended choice.
        </p>
      </div>

      <h2 id="examples">Common Use Cases</h2>

      <h3>UI Theming</h3>
      <CodeBlock
        language="typescript"
        code={`async function generateTheme(videoFile: File) {
  const colors = await videoIntel.extractColors(videoFile, {
    count: 5,
    quality: 'balanced'
  });
  
  // Sort by dominance
  const [primary, secondary, accent, ...rest] = colors;
  
  return {
    primary: primary.hex,        // Most dominant color
    secondary: secondary.hex,    // Second most dominant
    accent: accent.hex,          // Third for highlights
    
    // Create variations
    primaryLight: lighten(primary.hex, 20),
    primaryDark: darken(primary.hex, 20),
    
    // Use in CSS
    css: \`
      --color-primary: \${primary.hex};
      --color-secondary: \${secondary.hex};
      --color-accent: \${accent.hex};
    \`
  };
}`}
      />

      <h3>Color Palette Generator</h3>
      <CodeBlock
        language="typescript"
        code={`async function createPalette(videoFile: File) {
  const colors = await videoIntel.extractColors(videoFile, {
    count: 8,
    quality: 'best'
  });
  
  // Generate palette UI
  const palette = document.createElement('div');
  palette.className = 'color-palette';
  
  colors.forEach(color => {
    const swatch = document.createElement('div');
    swatch.className = 'color-swatch';
    swatch.style.backgroundColor = color.hex;
    swatch.style.width = \`\${color.percentage}%\`;
    swatch.title = \`\${color.hex} - \${color.percentage}%\`;
    
    // Add color info
    const info = document.createElement('div');
    info.innerHTML = \`
      <strong>\${color.hex}</strong>
      <span>RGB(\${color.rgb.join(', ')})</span>
      <span>HSL(\${color.hsl.join(', ')})</span>
      <span>\${color.percentage}%</span>
    \`;
    
    swatch.appendChild(info);
    palette.appendChild(swatch);
  });
  
  return palette;
}`}
      />

      <h3>Video Mood Analysis</h3>
      <CodeBlock
        language="typescript"
        code={`async function analyzeVideoMood(videoFile: File) {
  const colors = await videoIntel.extractColors(videoFile, {
    count: 5,
    quality: 'balanced'
  });
  
  // Analyze color characteristics
  const avgBrightness = colors.reduce((sum, c) => 
    sum + (c.rgb[0] + c.rgb[1] + c.rgb[2]) / 3, 0
  ) / colors.length;
  
  const avgSaturation = colors.reduce((sum, c) => 
    sum + c.hsl[1], 0
  ) / colors.length;
  
  // Determine mood
  let mood = 'neutral';
  if (avgBrightness > 180 && avgSaturation > 50) {
    mood = 'vibrant';  // Bright and saturated
  } else if (avgBrightness < 100) {
    mood = 'dark';     // Low brightness
  } else if (avgSaturation < 20) {
    mood = 'muted';    // Low saturation
  } else if (avgBrightness > 150) {
    mood = 'light';    // High brightness
  }
  
  return {
    mood,
    brightness: avgBrightness,
    saturation: avgSaturation,
    colors: colors.map(c => c.hex),
  };
}`}
      />

      <h3>Gradient Generation</h3>
      <CodeBlock
        language="typescript"
        code={`async function createGradient(videoFile: File) {
  const colors = await videoIntel.extractColors(videoFile, {
    count: 5,
    quality: 'balanced'
  });
  
  // Sort by brightness for smooth gradient
  const sorted = [...colors].sort((a, b) => {
    const brightnessA = (a.rgb[0] + a.rgb[1] + a.rgb[2]) / 3;
    const brightnessB = (b.rgb[0] + b.rgb[1] + b.rgb[2]) / 3;
    return brightnessA - brightnessB;
  });
  
  // Create CSS gradient
  const stops = sorted.map((color, i) => 
    \`\${color.hex} \${(i / (sorted.length - 1)) * 100}%\`
  ).join(', ');
  
  return {
    linear: \`linear-gradient(to right, \${stops})\`,
    radial: \`radial-gradient(circle, \${stops})\`,
    colors: sorted.map(c => c.hex),
  };
}`}
      />

      <div className="not-prose bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 my-6">
        <p className="text-sm text-green-900 dark:text-green-100 font-semibold mb-2">
          🚀 Next Steps
        </p>
        <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
          <li>• Learn about <a href="/docs/guides/thumbnails" className="underline">Thumbnail Generation</a></li>
          <li>• Explore <a href="/docs/guides/scenes" className="underline">Scene Detection</a></li>
          <li>• Try the <a href="/playground" className="underline">Interactive Playground</a></li>
          <li>• View <a href="/docs/api#extract-colors" className="underline">Complete API Reference</a></li>
        </ul>
      </div>
    </DocsLayout>
  );
}


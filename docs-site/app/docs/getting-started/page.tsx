import DocsLayout from '@/components/Docs/DocsLayout';
import CodeBlock from '@/components/Shared/CodeBlock';

const tocItems = [
  { id: 'installation', title: 'Installation', level: 2 },
  { id: 'quick-start', title: 'Quick Start', level: 2 },
  { id: 'examples', title: 'Basic Examples', level: 2 },
  { id: 'browser-compatibility', title: 'Browser Compatibility', level: 2 },
  { id: 'typescript-setup', title: 'TypeScript Setup', level: 2 },
];

export default function GettingStartedPage() {
  return (
    <DocsLayout tocItems={tocItems}>
      <h1 id="getting-started">Getting Started</h1>
      <p className="lead">
        Learn how to install and use VideoIntel.js in your project. Get up and running in minutes
        with smart video analysis capabilities.
      </p>

      <h2 id="installation">Installation</h2>
      <p>Install VideoIntel.js using your preferred package manager:</p>

      <CodeBlock
        language="bash"
        code={`# Using npm
npm install video-intel

# Using yarn
yarn add video-intel

# Using pnpm
pnpm add video-intel`}
      />

      <h2 id="quick-start">Quick Start</h2>
      <p>
        Here's a simple example to get you started with VideoIntel.js. This example shows how to
        analyze a video and extract thumbnails:
      </p>

      <CodeBlock
        language="typescript"
        filename="example.ts"
        code={`import videoIntel from 'video-intel';

// Analyze a video file
async function analyzeVideo(file: File) {
  // Initialize (optional - will auto-initialize if not called)
  await videoIntel.init();

  // Analyze video with all features
  const results = await videoIntel.analyze(file, {
    thumbnails: { count: 5, quality: 0.8 },
    scenes: { threshold: 30 },
    colors: { count: 5 },
    metadata: true,
  });

  console.log('Thumbnails:', results.thumbnails);
  console.log('Scenes:', results.scenes);
  console.log('Colors:', results.colors);
  console.log('Metadata:', results.metadata);
}

// Use with a file input
const input = document.querySelector('input[type="file"]');
input?.addEventListener('change', (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) analyzeVideo(file);
});`}
      />

      <h2 id="examples">Basic Examples</h2>

      <h3>Generate Thumbnails Only</h3>
      <p>Extract high-quality thumbnails from key moments in your video:</p>

      <CodeBlock
        language="typescript"
        code={`import videoIntel from 'video-intel';

async function generateThumbnails(videoFile: File) {
  const thumbnails = await videoIntel.getThumbnails(videoFile, {
    count: 10,        // Number of thumbnails to generate
    quality: 0.9,     // Image quality (0-1)
    width: 640,       // Optional: resize width
    height: 360,      // Optional: resize height
  });

  // Each thumbnail contains:
  // - dataUrl: Base64 image data
  // - timestamp: Time in video (seconds)
  // - quality: Quality score (0-1)
  thumbnails.forEach((thumb, i) => {
    console.log(\`Thumbnail \${i + 1}: \${thumb.timestamp}s, quality: \${thumb.quality}\`);
    // Use thumb.dataUrl in an <img> tag
  });
}

generateThumbnails(myVideoFile);`}
      />

      <h3>Detect Scene Changes</h3>
      <p>Automatically detect when scenes change in your video:</p>

      <CodeBlock
        language="typescript"
        code={`import videoIntel from 'video-intel';

async function detectScenes(videoFile: File) {
  const scenes = await videoIntel.detectScenes(videoFile, {
    threshold: 30,    // Sensitivity (0-100, higher = less sensitive)
    minDuration: 1,   // Minimum scene duration in seconds
  });

  console.log(\`Found \${scenes.length} scenes:\`);
  scenes.forEach((scene, i) => {
    console.log(\`Scene \${i + 1}: \${scene.timestamp}s (score: \${scene.score})\`);
  });
}

detectScenes(myVideoFile);`}
      />

      <h3>Extract Dominant Colors</h3>
      <p>Get the most prominent colors from your video:</p>

      <CodeBlock
        language="typescript"
        code={`import videoIntel from 'video-intel';

async function extractColors(videoFile: File) {
  const colors = await videoIntel.extractColors(videoFile, {
    count: 5,         // Number of colors to extract
    quality: 10,      // Sample quality (1-10, higher = slower but better)
  });

  console.log('Dominant colors:');
  colors.forEach((color, i) => {
    console.log(\`Color \${i + 1}: \${color.hex}\`);
    console.log(\`  RGB: \${color.rgb.join(', ')}\`);
    console.log(\`  Percentage: \${color.percentage}%\`);
  });
}

extractColors(myVideoFile);`}
      />

      <h3>Get Video Metadata</h3>
      <p>Extract technical information about the video:</p>

      <CodeBlock
        language="typescript"
        code={`import videoIntel from 'video-intel';

async function getVideoInfo(videoFile: File) {
  const metadata = await videoIntel.getMetadata(videoFile);

  console.log('Video Information:');
  console.log(\`Duration: \${metadata.duration}s\`);
  console.log(\`Resolution: \${metadata.width}x\${metadata.height}\`);
  console.log(\`Frame Rate: \${metadata.frameRate} fps\`);
  console.log(\`Size: \${(metadata.size / 1024 / 1024).toFixed(2)} MB\`);
  console.log(\`Format: \${metadata.format}\`);
}

getVideoInfo(myVideoFile);`}
      />

      <h2 id="browser-compatibility">Browser Compatibility</h2>
      <p>VideoIntel.js works in all modern browsers that support:</p>
      <ul>
        <li>HTML5 Video API</li>
        <li>Canvas API</li>
        <li>File API</li>
        <li>Web Workers (optional, for better performance)</li>
      </ul>

      <div className="not-prose bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 my-6">
        <p className="text-sm text-blue-900 dark:text-blue-100 font-semibold mb-2">
          ✅ Supported Browsers
        </p>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• Chrome/Edge 90+</li>
          <li>• Firefox 88+</li>
          <li>• Safari 14+</li>
          <li>• Opera 76+</li>
        </ul>
      </div>

      <h2 id="typescript-setup">TypeScript Setup</h2>
      <p>
        VideoIntel.js is written in TypeScript and provides full type definitions. No additional
        setup is required - types are included automatically:
      </p>

      <CodeBlock
        language="typescript"
        filename="example.ts"
        code={`import videoIntel, { 
  type AnalysisOptions, 
  type AnalysisResult,
  type Thumbnail,
  type Scene,
  type Color,
  type VideoMetadata,
} from 'video-intel';

// Full type inference
const options: AnalysisOptions = {
  thumbnails: { count: 5 },
  scenes: { threshold: 30 },
  colors: { count: 5 },
  metadata: true,
};

// Result is fully typed
const result: AnalysisResult = await videoIntel.analyze(file, options);

// Access typed properties
const firstThumbnail: Thumbnail = result.thumbnails![0];
const firstScene: Scene = result.scenes![0];
const firstColor: Color = result.colors![0];
const metadata: VideoMetadata = result.metadata!;`}
      />

      <div className="not-prose bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 my-6">
        <p className="text-sm text-green-900 dark:text-green-100 font-semibold mb-2">
          💡 Next Steps
        </p>
        <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
          <li>• Check out the <a href="/docs/api" className="underline">API Reference</a> for detailed documentation</li>
          <li>• Read the <a href="/docs/guides" className="underline">Guides</a> for in-depth tutorials</li>
          <li>• Try the <a href="/playground" className="underline">Interactive Playground</a></li>
          <li>• View <a href="/docs/examples" className="underline">Framework Integration Examples</a></li>
        </ul>
      </div>
    </DocsLayout>
  );
}


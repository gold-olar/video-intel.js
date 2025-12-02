import DocsLayout from '@/components/Docs/DocsLayout';
import CodeBlock from '@/components/Shared/CodeBlock';

const tocItems = [
  { id: 'videointel', title: 'VideoIntel Class', level: 2 },
  { id: 'init', title: 'init()', level: 3 },
  { id: 'analyze', title: 'analyze()', level: 3 },
  { id: 'get-thumbnails', title: 'getThumbnails()', level: 3 },
  { id: 'detect-scenes', title: 'detectScenes()', level: 3 },
  { id: 'extract-colors', title: 'extractColors()', level: 3 },
  { id: 'detect-faces', title: 'detectFaces()', level: 3 },
  { id: 'get-metadata', title: 'getMetadata()', level: 3 },
  { id: 'dispose', title: 'dispose()', level: 3 },
  { id: 'types', title: 'Type Definitions', level: 2 },
];

export default function APIReferencePage() {
  return (
    <DocsLayout tocItems={tocItems}>
      <h1>API Reference</h1>
      <p className="lead">
        Complete reference for all VideoIntel.js classes, methods, and types.
      </p>

      <h2 id="videointel">VideoIntel Class</h2>
      <p>
        The main class for video analysis. Import the default export to get a singleton instance:
      </p>

      <CodeBlock
        language="typescript"
        code={`import videoIntel from 'videointel';

// Use the singleton instance
await videoIntel.init();
const results = await videoIntel.analyze(file);`}
      />

      <h3 id="init">init(config?)</h3>
      <p>
        Initialize VideoIntel with optional configuration. This method is optional - the library
        will auto-initialize on first use if not called explicitly.
      </p>

      <CodeBlock
        language="typescript"
        code={`interface VideoIntelConfig {
  workers?: number;           // Number of web workers (default: CPU cores)
  models?: string[];          // Models to preload (future feature)
}

await videoIntel.init({
  workers: 4,
});`}
      />

      <h4>Parameters</h4>
      <ul>
        <li>
          <code>config</code> <span className="text-gray-500">(optional)</span> - Configuration
          object
        </li>
      </ul>

      <h4>Returns</h4>
      <p>
        <code>Promise&lt;void&gt;</code>
      </p>

      <h3 id="analyze">analyze(videoInput, options?)</h3>
      <p>Analyze a video with multiple features in a single call. Most efficient method when you need multiple analysis results.</p>

      <CodeBlock
        language="typescript"
        code={`interface AnalysisOptions {
  thumbnails?: {
    enabled?: boolean;        // Default: true
    count?: number;          // Default: 5
    quality?: number;        // Default: 0.8 (0-1)
    width?: number;          // Optional resize width
    height?: number;         // Optional resize height
  };
  scenes?: {
    enabled?: boolean;       // Default: true
    threshold?: number;      // Default: 30 (0-100)
    minDuration?: number;    // Default: 1 (seconds)
  };
  colors?: {
    enabled?: boolean;       // Default: true
    count?: number;          // Default: 5
    quality?: number;        // Default: 10 (1-10)
  };
  metadata?: boolean;        // Default: true
}

const results = await videoIntel.analyze(file, {
  thumbnails: { count: 10, quality: 0.9 },
  scenes: { threshold: 25 },
  colors: { count: 8 },
  metadata: true,
});`}
      />

      <h4>Parameters</h4>
      <ul>
        <li>
          <code>videoInput</code> - Video file (File, Blob, or HTMLVideoElement)
        </li>
        <li>
          <code>options</code> <span className="text-gray-500">(optional)</span> - Analysis options
        </li>
      </ul>

      <h4>Returns</h4>
      <CodeBlock
        language="typescript"
        code={`interface AnalysisResult {
  thumbnails?: Thumbnail[];
  scenes?: Scene[];
  colors?: Color[];
  metadata?: VideoMetadata;
  performance?: {
    totalTime: number;
    thumbnailTime?: number;
    sceneTime?: number;
    colorTime?: number;
    metadataTime?: number;
  };
}`}
      />

      <h3 id="get-thumbnails">getThumbnails(videoInput, options?)</h3>
      <p>Generate smart thumbnails from key moments in the video.</p>

      <CodeBlock
        language="typescript"
        code={`interface ThumbnailOptions {
  count?: number;          // Number of thumbnails (default: 5)
  quality?: number;        // Image quality 0-1 (default: 0.8)
  width?: number;          // Resize width (optional)
  height?: number;         // Resize height (optional)
  format?: 'jpeg' | 'png'; // Image format (default: 'jpeg')
}

const thumbnails = await videoIntel.getThumbnails(file, {
  count: 10,
  quality: 0.9,
  width: 1280,
  height: 720,
});`}
      />

      <h4>Returns</h4>
      <CodeBlock
        language="typescript"
        code={`interface Thumbnail {
  dataUrl: string;         // Base64 encoded image
  timestamp: number;       // Time in video (seconds)
  quality: number;         // Quality score 0-1
  width: number;          // Image width
  height: number;         // Image height
}

// Example usage
thumbnails.forEach(thumb => {
  const img = document.createElement('img');
  img.src = thumb.dataUrl;
  img.alt = \`Thumbnail at \${thumb.timestamp}s\`;
  document.body.appendChild(img);
});`}
      />

      <h3 id="detect-scenes">detectScenes(videoInput, options?)</h3>
      <p>Automatically detect scene changes in the video.</p>

      <CodeBlock
        language="typescript"
        code={`interface SceneOptions {
  threshold?: number;      // Sensitivity 0-100 (default: 30)
  minDuration?: number;    // Min scene duration in seconds (default: 1)
  maxScenes?: number;      // Max number of scenes (optional)
}

const scenes = await videoIntel.detectScenes(file, {
  threshold: 25,
  minDuration: 2,
});`}
      />

      <h4>Returns</h4>
      <CodeBlock
        language="typescript"
        code={`interface Scene {
  timestamp: number;       // Scene start time (seconds)
  score: number;          // Detection confidence 0-100
  duration?: number;      // Scene duration (if known)
}

// Example: Create chapter markers
scenes.forEach((scene, i) => {
  console.log(\`Chapter \${i + 1}: \${scene.timestamp}s\`);
});`}
      />

      <h3 id="extract-colors">extractColors(videoInput, options?)</h3>
      <p>Extract dominant colors from the video using advanced color quantization.</p>

      <CodeBlock
        language="typescript"
        code={`interface ColorOptions {
  count?: number;          // Number of colors (default: 5)
  quality?: number;        // Sampling quality 1-10 (default: 10)
  sampleSize?: number;     // Number of frames to sample (optional)
}

const colors = await videoIntel.extractColors(file, {
  count: 8,
  quality: 10,
});`}
      />

      <h4>Returns</h4>
      <CodeBlock
        language="typescript"
        code={`interface Color {
  hex: string;                    // Hex color code
  rgb: [number, number, number];  // RGB values (0-255)
  percentage: number;             // Usage percentage (0-100)
  pixels?: number;                // Pixel count (optional)
}

// Example: Create color palette
colors.forEach(color => {
  const div = document.createElement('div');
  div.style.backgroundColor = color.hex;
  div.style.width = \`\${color.percentage}%\`;
  div.title = \`\${color.hex} - \${color.percentage}%\`;
  document.body.appendChild(div);
});`}
      />

      <h3 id="detect-faces">detectFaces(videoInput, options?)</h3>
      <p>Detect faces in videos with optional bounding boxes and face thumbnails.</p>

      <CodeBlock
        language="typescript"
        code={`interface FaceOptions {
  confidence?: number;              // Confidence threshold (0-1, default: 0.7)
  returnCoordinates?: boolean;      // Return bounding boxes (default: false)
  returnThumbnails?: boolean;       // Extract face images (default: false)
  thumbnailFormat?: 'jpeg' | 'png'; // Image format (default: 'jpeg')
  thumbnailQuality?: number;        // JPEG quality 0-1 (default: 0.8)
  samplingRate?: number;            // Sampling interval in seconds (default: 2)
}

// Basic detection (count only)
const faces = await videoIntel.detectFaces(file);

// With bounding boxes
const facesWithBoxes = await videoIntel.detectFaces(file, {
  confidence: 0.8,
  returnCoordinates: true,
  samplingRate: 1
});

// With face thumbnails
const facesWithThumbnails = await videoIntel.detectFaces(file, {
  confidence: 0.7,
  returnCoordinates: true,
  returnThumbnails: true,
  thumbnailFormat: 'jpeg',
  thumbnailQuality: 0.9
});`}
      />

      <h4>Returns</h4>
      <CodeBlock
        language="typescript"
        code={`interface FaceDetection {
  detected: boolean;               // Whether any faces were detected
  averageCount: number;            // Average faces per frame
  frames: FaceFrame[];             // Frames with faces (if returnCoordinates)
}

interface FaceFrame {
  timestamp: number;               // Time in video (seconds)
  faces: Face[];                   // Detected faces in this frame
}

interface Face {
  x: number;                       // Bounding box X (top-left)
  y: number;                       // Bounding box Y (top-left)
  width: number;                   // Bounding box width
  height: number;                  // Bounding box height
  confidence: number;              // Detection confidence (0-1)
  thumbnail?: Blob;                // Face image (if returnThumbnails)
}

// Example: Display face gallery
facesWithThumbnails.frames.forEach(frame => {
  console.log(\`At \${frame.timestamp}s: \${frame.faces.length} faces\`);
  
  frame.faces.forEach((face, i) => {
    if (face.thumbnail) {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(face.thumbnail);
      img.alt = \`Face \${i + 1}\`;
      img.title = \`Confidence: \${(face.confidence * 100).toFixed(0)}%\`;
      document.body.appendChild(img);
    }
  });
});`}
      />

      <div className="not-prose bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 my-6">
        <p className="text-sm text-yellow-900 dark:text-yellow-100 font-semibold mb-2">
          📝 Important Note
        </p>
        <p className="text-sm text-yellow-700 dark:text-yellow-300">
          <code>returnThumbnails: true</code> requires <code>returnCoordinates: true</code>.
          The first call will load the face detection model (~190KB) from CDN, which takes ~2
          seconds. Subsequent calls reuse the cached model.
        </p>
      </div>

      <h3 id="get-metadata">getMetadata(videoInput)</h3>
      <p>Extract technical metadata from the video file.</p>

      <CodeBlock
        language="typescript"
        code={`const metadata = await videoIntel.getMetadata(file);

console.log(\`Duration: \${metadata.duration}s\`);
console.log(\`Resolution: \${metadata.width}x\${metadata.height}\`);
console.log(\`Frame Rate: \${metadata.frameRate} fps\`);`}
      />

      <h4>Returns</h4>
      <CodeBlock
        language="typescript"
        code={`interface VideoMetadata {
  duration: number;        // Video duration in seconds
  width: number;          // Video width in pixels
  height: number;         // Video height in pixels
  frameRate: number;      // Frames per second
  size: number;           // File size in bytes
  format?: string;        // Video format/codec
  bitrate?: number;       // Bitrate in bps
  hasAudio?: boolean;     // Whether video has audio track
}`}
      />

      <h3 id="dispose">dispose()</h3>
      <p>
        Clean up resources and terminate worker threads. Call this when you're done using
        VideoIntel to free memory.
      </p>

      <CodeBlock
        language="typescript"
        code={`// When finished with video analysis
await videoIntel.dispose();

// Re-initialize if you need to use it again
await videoIntel.init();`}
      />

      <h4>Returns</h4>
      <p>
        <code>Promise&lt;void&gt;</code>
      </p>

      <h2 id="types">Type Definitions</h2>
      <p>VideoIntel.js exports all TypeScript types for use in your projects:</p>

      <CodeBlock
        language="typescript"
        code={`import type {
  // Main types
  VideoIntelConfig,
  AnalysisOptions,
  AnalysisResult,
  
  // Feature-specific types
  ThumbnailOptions,
  Thumbnail,
  SceneOptions,
  Scene,
  ColorOptions,
  Color,
  FaceOptions,
  FaceDetection,
  FaceFrame,
  Face,
  VideoMetadata,
  
  // Input types
  VideoInput,
} from 'videointel';

// Use in your code for type safety
const config: VideoIntelConfig = { workers: 4 };
const options: AnalysisOptions = { 
  thumbnails: { count: 10 },
  faces: { confidence: 0.8 }
};`}
      />

      <div className="not-prose bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 my-6">
        <p className="text-sm text-blue-900 dark:text-blue-100 font-semibold mb-2">
          💡 Pro Tip
        </p>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Use the <code>analyze()</code> method when you need multiple features - it's more
          efficient than calling each method separately as it only processes the video once.
        </p>
      </div>

      <div className="not-prose bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 my-6">
        <p className="text-sm text-green-900 dark:text-green-100 font-semibold mb-2">
          📚 Next Steps
        </p>
        <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
          <li>• Read the <a href="/docs/guides" className="underline">Guides</a> for detailed tutorials</li>
          <li>• Check out <a href="/docs/examples" className="underline">Framework Integration Examples</a></li>
          <li>• Try the <a href="/playground" className="underline">Interactive Playground</a></li>
        </ul>
      </div>
    </DocsLayout>
  );
}


import DocsLayout from '@/components/Docs/DocsLayout';
import CodeBlock from '@/components/Shared/CodeBlock';

const tocItems = [
  { id: 'overview', title: 'Overview', level: 2 },
  { id: 'how-it-works', title: 'How It Works', level: 2 },
  { id: 'usage-modes', title: 'Usage Modes', level: 2 },
  { id: 'configuration', title: 'Configuration Options', level: 2 },
  { id: 'thumbnails', title: 'Face Thumbnails', level: 2 },
  { id: 'best-practices', title: 'Best Practices', level: 2 },
  { id: 'performance', title: 'Performance', level: 2 },
  { id: 'examples', title: 'Common Examples', level: 2 },
];

export default function FaceDetectionGuidePage() {
  return (
    <DocsLayout tocItems={tocItems}>
      <h1>Face Detection Guide</h1>
      <p className="lead">
        Learn how to detect faces in videos using VideoIntel's built-in face detection capabilities.
        Detect face presence, get bounding box coordinates, and extract face thumbnails with configurable
        confidence thresholds and sampling rates.
      </p>

      <h2 id="overview">Overview</h2>
      <p>
        VideoIntel provides client-side face detection powered by face-api.js and the TinyFaceDetector
        model. All processing happens in the browser with no data sent to servers, making it perfect
        for privacy-focused applications.
      </p>

      <ul>
        <li><strong>Face Counting:</strong> Count average faces detected across sampled frames</li>
        <li><strong>Bounding Boxes:</strong> Get precise coordinates for each detected face</li>
        <li><strong>Face Thumbnails:</strong> Extract cropped face images with 10% padding</li>
        <li><strong>Confidence Filtering:</strong> Configurable threshold to control detection sensitivity</li>
        <li><strong>Performance Optimized:</strong> Intelligent sampling and frame downscaling</li>
      </ul>

      <h2 id="how-it-works">How It Works</h2>
      <p>
        The face detection process follows a three-phase pipeline optimized for both accuracy and
        performance:
      </p>

      <div className="not-prose space-y-4 my-6">
        <div className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/30 p-4">
          <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-2">
            Phase 1: Frame Extraction (0-40%)
          </h4>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Extract frames at regular intervals based on the sampling rate (default: every 2 seconds).
            This provides comprehensive coverage while keeping processing time reasonable. Frames are
            extracted in chronological order for optimal performance.
          </p>
        </div>

        <div className="border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-950/30 p-4">
          <h4 className="font-bold text-purple-900 dark:text-purple-100 mb-2">
            Phase 2: Face Detection (40-90%)
          </h4>
          <p className="text-sm text-purple-800 dark:text-purple-200">
            Run face detection on each extracted frame using the TinyFaceDetector model. The model
            operates on downscaled frames (inputSize: 224) for 4x faster processing with minimal
            accuracy loss. Each detection includes bounding box coordinates and confidence score.
          </p>
        </div>

        <div className="border-l-4 border-green-500 bg-green-50 dark:bg-green-950/30 p-4">
          <h4 className="font-bold text-green-900 dark:text-green-100 mb-2">
            Phase 3: Thumbnail Generation (90-100%)
          </h4>
          <p className="text-sm text-green-800 dark:text-green-200">
            If thumbnails are requested, extract cropped face regions with 10% padding for context.
            Convert to JPEG or PNG blobs based on configuration. Temporary crop canvases are disposed
            immediately after conversion to minimize memory usage (~10-50KB per face).
          </p>
        </div>
      </div>

      <h3>Detection Algorithm</h3>
      <p>VideoIntel uses the TinyFaceDetector model from face-api.js:</p>

      <CodeBlock
        language="typescript"
        code={`// Simplified detection process
async function detectFaces(frame: HTMLCanvasElement) {
  // 1. Model processes frame at reduced size (inputSize: 224)
  //    - 4x faster than full resolution
  //    - Minimal accuracy impact
  
  // 2. Returns detections with:
  //    - Bounding box coordinates (x, y, width, height)
  //    - Confidence score (0-1)
  //    - Face landmarks (optional, not exposed in API)
  
  // 3. Filter by confidence threshold (default: 0.7)
  const detections = await faceapi
    .detectAllFaces(frame, new faceapi.TinyFaceDetectorOptions({
      inputSize: 224,
      scoreThreshold: 0.7
    }));
  
  // 4. Convert to VideoIntel Face format
  return detections.map(det => ({
    x: det.box.x,
    y: det.box.y,
    width: det.box.width,
    height: det.box.height,
    confidence: det.score
  }));
}`}
      />

      <h2 id="usage-modes">Usage Modes</h2>
      <p>
        Face detection supports three usage modes, each optimized for different use cases:
      </p>

      <h3>Mode 1: Basic Detection (Count Only)</h3>
      <p>
        Get face presence and average count without coordinate overhead. Perfect for analytics
        and content classification.
      </p>

      <CodeBlock
        language="typescript"
        code={`const faces = await videoIntel.detectFaces(videoFile);

console.log(\`Faces detected: \${faces.detected}\`);
console.log(\`Average count: \${faces.averageCount}\`);
console.log(\`Frames analyzed: \${faces.frames.length}\`); // Empty array

// Use cases:
// - Content moderation (does video contain faces?)
// - Video categorization (single person vs group)
// - Privacy filtering (exclude face-containing videos)`}
      />

      <h3>Mode 2: With Coordinates</h3>
      <p>
        Get bounding box coordinates for drawing overlays, cropping, or spatial analysis.
      </p>

      <CodeBlock
        language="typescript"
        code={`const faces = await videoIntel.detectFaces(videoFile, {
  confidence: 0.8,
  returnCoordinates: true,
  samplingRate: 1  // Check every second
});

// Process each frame with faces
faces.frames.forEach(frame => {
  console.log(\`At \${frame.timestamp}s: \${frame.faces.length} faces\`);
  
  frame.faces.forEach(face => {
    // Draw bounding box
    drawRect(
      face.x, 
      face.y, 
      face.width, 
      face.height,
      \`\${(face.confidence * 100).toFixed(0)}%\`
    );
  });
});

// Use cases:
// - Video player overlays
// - Face tracking/following
// - Spatial analytics (face positions)
// - Custom cropping logic`}
      />

      <h3>Mode 3: With Face Thumbnails</h3>
      <p>
        Extract cropped face images with padding for galleries, previews, or analysis.
      </p>

      <CodeBlock
        language="typescript"
        code={`const faces = await videoIntel.detectFaces(videoFile, {
  confidence: 0.7,
  returnCoordinates: true,
  returnThumbnails: true,      // Enable thumbnail extraction
  thumbnailFormat: 'jpeg',     // 'jpeg' or 'png'
  thumbnailQuality: 0.9        // JPEG quality (0-1)
});

// Display face gallery
const gallery = document.createElement('div');
gallery.className = 'face-gallery';

faces.frames.forEach(frame => {
  frame.faces.forEach((face, i) => {
    if (face.thumbnail) {
      // Create image from blob
      const img = document.createElement('img');
      img.src = URL.createObjectURL(face.thumbnail);
      img.alt = \`Face at \${frame.timestamp}s\`;
      img.title = \`Confidence: \${(face.confidence * 100).toFixed(0)}%\`;
      
      gallery.appendChild(img);
      
      // Optional: Download thumbnail
      downloadFaceThumbnail(face.thumbnail, \`face-\${i}.jpg\`);
    }
  });
});

// Use cases:
// - Face galleries/mosaics
// - Content moderation dashboards
// - Face search/matching
// - Thumbnail previews in UI`}
      />

      <div className="not-prose bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 my-6">
        <p className="text-sm text-yellow-900 dark:text-yellow-100 font-semibold mb-2">
          ⚠️ Important Requirement
        </p>
        <p className="text-sm text-yellow-700 dark:text-yellow-300">
          <code>returnThumbnails: true</code> requires <code>returnCoordinates: true</code>.
          Attempting to enable thumbnails without coordinates will throw a validation error.
        </p>
      </div>

      <h2 id="configuration">Configuration Options</h2>
      <p>
        Fine-tune face detection behavior for your specific use case:
      </p>

      <CodeBlock
        language="typescript"
        code={`interface FaceOptions {
  // Detection confidence threshold (0-1)
  // Higher = fewer false positives, might miss some faces
  // Lower = more detections, may include false positives
  confidence?: number;              // Default: 0.7
  
  // Return bounding box coordinates
  // Required for drawing overlays or extracting thumbnails
  returnCoordinates?: boolean;      // Default: false
  
  // Extract cropped face images (requires returnCoordinates)
  // Adds ~10-50KB memory per face (JPEG) or ~20-100KB (PNG)
  returnThumbnails?: boolean;       // Default: false
  
  // Thumbnail image format
  // JPEG: Smaller files, faster processing
  // PNG: Lossless quality, larger files
  thumbnailFormat?: 'jpeg' | 'png'; // Default: 'jpeg'
  
  // JPEG quality setting (ignored for PNG)
  // Higher = better quality, larger file size
  thumbnailQuality?: number;        // Default: 0.8 (0-1)
  
  // Frame sampling interval in seconds
  // Smaller = more frames analyzed, slower processing
  // Larger = fewer frames, faster but might miss faces
  samplingRate?: number;            // Default: 2 seconds
}

// Example configurations
const quickScan = await videoIntel.detectFaces(video, {
  samplingRate: 5,      // Every 5 seconds
  confidence: 0.8       // High confidence only
});

const thoroughScan = await videoIntel.detectFaces(video, {
  samplingRate: 0.5,    // Every 0.5 seconds
  confidence: 0.6       // Lower threshold for more coverage
});

const highQualityThumbnails = await videoIntel.detectFaces(video, {
  returnCoordinates: true,
  returnThumbnails: true,
  thumbnailFormat: 'png',      // Lossless
  samplingRate: 2
});`}
      />

      <h3>Confidence Threshold Guide</h3>

      <div className="not-prose overflow-x-auto my-6">
        <table className="min-w-full border border-gray-300 dark:border-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Threshold</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Behavior</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Use Case</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            <tr>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">0.5 - 0.6</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">Sensitive</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">Catch all possible faces, accept false positives</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">0.7 - 0.8</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">Balanced ⭐</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">Good balance of accuracy and coverage</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">0.85 - 0.95</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">Conservative</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">Only high-confidence faces, minimize false positives</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>Sampling Rate Guide</h3>

      <div className="not-prose overflow-x-auto my-6">
        <table className="min-w-full border border-gray-300 dark:border-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Rate</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Frames/Min</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Use Case</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            <tr>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">0.5s</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">120</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">Very thorough, action videos with quick cuts</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">1s</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">60</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">Thorough coverage, most video types</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">2s ⭐</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">30</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">Balanced performance and coverage</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">5s</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">12</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">Fast scan, long videos, static content</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 id="thumbnails">Face Thumbnails</h2>
      <p>
        Face thumbnails are automatically cropped images of detected faces with 10% padding on all
        sides for context. This padding ensures you capture hair, ears, and background elements
        around the face.
      </p>

      <h3>Thumbnail Extraction Process</h3>

      <CodeBlock
        language="typescript"
        code={`// Pseudo-code showing thumbnail extraction
function extractFaceThumbnail(face, sourceFrame) {
  // 1. Calculate padded dimensions (10% on each side = 1.2x total)
  const paddingPercent = 0.1;
  const paddedWidth = face.width * 1.2;
  const paddedHeight = face.height * 1.2;
  
  // 2. Calculate crop coordinates (centered)
  const cropX = face.x - (face.width * paddingPercent);
  const cropY = face.y - (face.height * paddingPercent);
  
  // 3. Clamp to frame boundaries (handle faces at edges)
  const clampedX = Math.max(0, cropX);
  const clampedY = Math.max(0, cropY);
  const clampedWidth = Math.min(paddedWidth, frame.width - clampedX);
  const clampedHeight = Math.min(paddedHeight, frame.height - clampedY);
  
  // 4. Create crop canvas and draw region
  const cropCanvas = createCanvas(clampedWidth, clampedHeight);
  cropCanvas.drawImage(
    sourceFrame,
    clampedX, clampedY, clampedWidth, clampedHeight,
    0, 0, clampedWidth, clampedHeight
  );
  
  // 5. Convert to blob
  const blob = await cropCanvas.toBlob(format, quality);
  
  // 6. Dispose canvas immediately
  disposeCropCanvas();
  
  return blob;
}`}
      />

      <h3>Format Comparison</h3>

      <div className="not-prose overflow-x-auto my-6">
        <table className="min-w-full border border-gray-300 dark:border-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Format</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Size</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Quality</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Speed</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Best For</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            <tr>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">JPEG (q=0.8) ⭐</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">10-30KB</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">Good</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">Fast</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">Most use cases, galleries</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">JPEG (q=0.95)</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">30-50KB</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">Excellent</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">Fast</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">High-quality previews</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">PNG</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">20-100KB</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">Lossless</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">Slower</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">Archival, further processing</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 id="best-practices">Best Practices</h2>

      <h3>1. Choose the Right Mode</h3>

      <CodeBlock
        language="typescript"
        code={`// ❌ Don't request coordinates if you only need count
const faces = await videoIntel.detectFaces(video, {
  returnCoordinates: true  // Unnecessary overhead
});
if (faces.detected) {
  // Only using detected flag
}

// ✅ Do use basic mode for simple checks
const faces = await videoIntel.detectFaces(video);
if (faces.detected) {
  console.log(\`Average faces: \${faces.averageCount}\`);
}

// ❌ Don't request thumbnails if you're just drawing boxes
const faces = await videoIntel.detectFaces(video, {
  returnCoordinates: true,
  returnThumbnails: true  // Wasted memory and processing
});
drawBoundingBoxes(faces.frames);

// ✅ Do request only what you need
const faces = await videoIntel.detectFaces(video, {
  returnCoordinates: true  // Just coordinates for drawing
});
drawBoundingBoxes(faces.frames);`}
      />

      <h3>2. Optimize for Video Type</h3>

      <CodeBlock
        language="typescript"
        code={`// Talking head / interview videos
const interview = await videoIntel.detectFaces(video, {
  samplingRate: 3,      // Faces don't change much
  confidence: 0.75      // Standard confidence
});

// Action videos / vlog with movement
const vlog = await videoIntel.detectFaces(video, {
  samplingRate: 1,      // More frequent sampling
  confidence: 0.8       // Higher confidence (motion blur)
});

// Group videos / events
const event = await videoIntel.detectFaces(video, {
  samplingRate: 2,
  confidence: 0.7,      // Lower threshold to catch all
  returnThumbnails: true // Extract face gallery
});`}
      />

      <h3>3. Handle Thumbnails Efficiently</h3>

      <CodeBlock
        language="typescript"
        code={`const faces = await videoIntel.detectFaces(video, {
  returnCoordinates: true,
  returnThumbnails: true,
  thumbnailFormat: 'jpeg',
  thumbnailQuality: 0.8
});

// ✅ Do revoke object URLs when done
faces.frames.forEach(frame => {
  frame.faces.forEach(face => {
    if (face.thumbnail) {
      const url = URL.createObjectURL(face.thumbnail);
      displayImage(url);
      
      // Clean up when image is loaded or component unmounts
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    }
  });
});

// ✅ Do batch process thumbnails
const allThumbnails = faces.frames.flatMap(f => f.faces)
  .filter(face => face.thumbnail)
  .map(face => face.thumbnail);

console.log(\`Total faces: \${allThumbnails.length}\`);
console.log(\`Total memory: ~\${allThumbnails.length * 25}KB\`);`}
      />

      <h3>4. Validate Configuration</h3>

      <CodeBlock
        language="typescript"
        code={`// ❌ This will throw an error
try {
  const faces = await videoIntel.detectFaces(video, {
    returnThumbnails: true,
    returnCoordinates: false  // Error: thumbnails require coordinates
  });
} catch (error) {
  console.error(error.message);
  // "returnThumbnails requires returnCoordinates to be true"
}

// ✅ Correct usage
const faces = await videoIntel.detectFaces(video, {
  returnCoordinates: true,  // Required for thumbnails
  returnThumbnails: true
});`}
      />

      <h2 id="performance">Performance</h2>

      <h3>Benchmarks</h3>

      <div className="not-prose overflow-x-auto my-6">
        <table className="min-w-full border border-gray-300 dark:border-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Video Length</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Mode</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Processing Time</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Memory Usage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            <tr>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">10 seconds</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">Basic</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">2-3s</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">~100MB</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">10 seconds</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">With Coordinates</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">2-3s</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">~100MB</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">10 seconds</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">With Thumbnails</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">2.5-3.5s</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">~100MB + 150KB</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">30 seconds</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">Basic</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">5-7s</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">~100MB</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">30 seconds</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">With Thumbnails</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">6-8s</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">~100MB + 450KB</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
        *Benchmarks measured on M1 MacBook Pro. First run includes ~2s model loading time.
        Subsequent calls reuse cached model. Thumbnail memory assumes ~30KB per face × 5 frames × 3 faces/frame.
      </p>

      <h3>Performance Tips</h3>

      <CodeBlock
        language="typescript"
        code={`// 1. Preload model for faster first detection
await videoIntel.init({
  models: ['faces']  // Preload face detection model
});

// 2. Adjust sampling rate based on video length
const samplingRate = videoDuration < 30 ? 1 : 
                     videoDuration < 120 ? 2 : 5;

const faces = await videoIntel.detectFaces(video, {
  samplingRate
});

// 3. Use lower quality for thumbnails in galleries
const faces = await videoIntel.detectFaces(video, {
  returnCoordinates: true,
  returnThumbnails: true,
  thumbnailQuality: 0.7,  // Good enough for previews
  samplingRate: 3         // Less frequent for performance
});

// 4. Process long videos in chunks
async function processLongVideo(video: HTMLVideoElement) {
  const chunkDuration = 60; // 1-minute chunks
  const chunks = Math.ceil(video.duration / chunkDuration);
  
  for (let i = 0; i < chunks; i++) {
    const start = i * chunkDuration;
    const end = Math.min((i + 1) * chunkDuration, video.duration);
    
    // Process chunk (implementation depends on your setup)
    const chunkFaces = await detectFacesInRange(video, start, end);
    
    // Small delay to prevent browser freezing
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}`}
      />

      <div className="not-prose bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 my-6">
        <p className="text-sm text-blue-900 dark:text-blue-100 font-semibold mb-2">
          ⚡ Performance Note
        </p>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Face detection uses the TinyFaceDetector model (~190KB) for optimal speed. The model
          is loaded from CDN on first use and cached in memory. Expect ~2 seconds for initial
          model loading, then fast subsequent detections. Frame processing uses inputSize: 224
          for 4x speedup with minimal accuracy impact.
        </p>
      </div>

      <h2 id="examples">Common Examples</h2>

      <h3>Content Moderation Dashboard</h3>

      <CodeBlock
        language="typescript"
        code={`async function moderateVideo(videoFile: File) {
  // Detect faces with thumbnails for preview
  const faces = await videoIntel.detectFaces(videoFile, {
    confidence: 0.75,
    returnCoordinates: true,
    returnThumbnails: true,
    thumbnailFormat: 'jpeg',
    thumbnailQuality: 0.85
  });
  
  // Create moderation summary
  const summary = {
    videoId: videoFile.name,
    faceDetected: faces.detected,
    averageFaceCount: faces.averageCount,
    totalFaces: faces.frames.reduce((sum, f) => sum + f.faces.length, 0),
    needsReview: faces.averageCount > 5, // Flag crowded videos
    thumbnails: []
  };
  
  // Extract face thumbnails for review
  faces.frames.forEach((frame, frameIdx) => {
    frame.faces.forEach((face, faceIdx) => {
      if (face.thumbnail) {
        summary.thumbnails.push({
          id: \`\${frameIdx}-\${faceIdx}\`,
          timestamp: frame.timestamp,
          confidence: face.confidence,
          blob: face.thumbnail,
          url: URL.createObjectURL(face.thumbnail)
        });
      }
    });
  });
  
  return summary;
}

// Display moderation UI
const result = await moderateVideo(uploadedFile);
displayModerationDashboard(result);`}
      />

      <h3>Video Player with Face Tracking</h3>

      <CodeBlock
        language="typescript"
        code={`async function createFaceTrackingPlayer(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement
) {
  // Detect faces
  const faces = await videoIntel.detectFaces(video, {
    returnCoordinates: true,
    samplingRate: 1,
    confidence: 0.8
  });
  
  // Create time-based lookup
  const facesByTime = new Map(
    faces.frames.map(f => [Math.floor(f.timestamp), f.faces])
  );
  
  // Draw overlay during playback
  const ctx = canvas.getContext('2d')!;
  video.addEventListener('timeupdate', () => {
    const currentSecond = Math.floor(video.currentTime);
    const currentFaces = facesByTime.get(currentSecond);
    
    if (currentFaces) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      currentFaces.forEach(face => {
        // Draw bounding box
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 3;
        ctx.strokeRect(face.x, face.y, face.width, face.height);
        
        // Draw confidence label
        ctx.fillStyle = '#00ff00';
        ctx.font = '16px Arial';
        ctx.fillText(
          \`\${(face.confidence * 100).toFixed(0)}%\`,
          face.x,
          face.y - 5
        );
      });
    }
  });
}

// Usage
const video = document.querySelector('video')!;
const overlay = document.querySelector('canvas')!;
await createFaceTrackingPlayer(video, overlay);`}
      />

      <h3>Face Gallery Creator</h3>

      <CodeBlock
        language="typescript"
        code={`async function createFaceGallery(videoFile: File) {
  const faces = await videoIntel.detectFaces(videoFile, {
    returnCoordinates: true,
    returnThumbnails: true,
    thumbnailFormat: 'jpeg',
    thumbnailQuality: 0.9,
    samplingRate: 2,
    confidence: 0.8
  });
  
  // Create gallery container
  const gallery = document.createElement('div');
  gallery.className = 'face-gallery grid grid-cols-4 gap-4';
  
  let faceCount = 0;
  
  faces.frames.forEach(frame => {
    frame.faces.forEach(face => {
      if (face.thumbnail) {
        faceCount++;
        
        // Create face card
        const card = document.createElement('div');
        card.className = 'face-card relative rounded-lg overflow-hidden shadow';
        
        // Face image
        const img = document.createElement('img');
        img.src = URL.createObjectURL(face.thumbnail);
        img.className = 'w-full h-auto';
        
        // Metadata overlay
        const info = document.createElement('div');
        info.className = 'absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2 text-xs';
        info.innerHTML = \`
          <div>Face #\${faceCount}</div>
          <div>Time: \${frame.timestamp.toFixed(1)}s</div>
          <div>Confidence: \${(face.confidence * 100).toFixed(0)}%</div>
        \`;
        
        card.appendChild(img);
        card.appendChild(info);
        gallery.appendChild(card);
      }
    });
  });
  
  // Add download all button
  const downloadBtn = document.createElement('button');
  downloadBtn.textContent = \`Download All (\${faceCount} faces)\`;
  downloadBtn.onclick = () => downloadAllFaces(faces);
  
  return { gallery, downloadBtn, faceCount };
}

function downloadAllFaces(faces: FaceDetection) {
  let index = 0;
  faces.frames.forEach(frame => {
    frame.faces.forEach(face => {
      if (face.thumbnail) {
        const url = URL.createObjectURL(face.thumbnail);
        const a = document.createElement('a');
        a.href = url;
        a.download = \`face-\${index++}-\${frame.timestamp.toFixed(1)}s.jpg\`;
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  });
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
          <li>• View <a href="/docs/api#detect-faces" className="underline">Complete API Reference</a></li>
        </ul>
      </div>
    </DocsLayout>
  );
}


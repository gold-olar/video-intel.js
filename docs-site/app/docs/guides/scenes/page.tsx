import DocsLayout from '@/components/Docs/DocsLayout';
import CodeBlock from '@/components/Shared/CodeBlock';

const tocItems = [
  { id: 'overview', title: 'Overview', level: 2 },
  { id: 'how-it-works', title: 'How It Works', level: 2 },
  { id: 'algorithm', title: 'Detection Algorithm', level: 3 },
  { id: 'frame-sampling', title: 'Frame Sampling', level: 3 },
  { id: 'difference-calculation', title: 'Difference Calculation', level: 3 },
  { id: 'filtering', title: 'False Positive Filtering', level: 3 },
  { id: 'configuration', title: 'Configuration', level: 2 },
  { id: 'best-practices', title: 'Best Practices', level: 2 },
  { id: 'performance', title: 'Performance', level: 2 },
  { id: 'examples', title: 'Examples', level: 2 },
];

export default function SceneDetectionGuidePage() {
  return (
    <DocsLayout tocItems={tocItems}>
      <h1>Scene Detection Guide</h1>
      <p className="lead">
        Learn how VideoIntel detects scene changes in videos using advanced computer vision techniques,
        frame difference analysis, and intelligent filtering algorithms.
      </p>

      <h2 id="overview">Overview</h2>
      <p>
        Scene detection is the process of identifying where one scene ends and another begins in a video.
        This is useful for:
      </p>

      <ul>
        <li><strong>Video Segmentation:</strong> Automatically split videos into meaningful chapters</li>
        <li><strong>Content Analysis:</strong> Understand video structure and pacing</li>
        <li><strong>Smart Navigation:</strong> Create chapter markers for easier video browsing</li>
        <li><strong>Thumbnail Selection:</strong> Generate one thumbnail per scene</li>
        <li><strong>Video Editing:</strong> Identify natural cut points for trimming</li>
      </ul>

      <h2 id="how-it-works">How It Works</h2>
      <p>
        VideoIntel&apos;s scene detection uses a multi-stage pipeline that balances accuracy with performance:
      </p>

      <h3 id="algorithm">Detection Algorithm</h3>
      <p>The scene detection process follows these 7 steps:</p>

      <div className="not-prose space-y-4 my-6">
        <div className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/30 p-4">
          <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-2">
            Step 1: Frame Extraction
          </h4>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Sample frames at regular intervals (default: every 0.5 seconds) throughout the video.
            This provides sufficient temporal resolution while keeping processing time reasonable.
          </p>
        </div>

        <div className="border-l-4 border-green-500 bg-green-50 dark:bg-green-950/30 p-4">
          <h4 className="font-bold text-green-900 dark:text-green-100 mb-2">
            Step 2: Frame Difference Calculation
          </h4>
          <p className="text-sm text-green-800 dark:text-green-200">
            Compare each frame with the previous frame using pixel-level difference calculation.
            Frames are downscaled to 25% size and converted to grayscale for 48x faster processing.
          </p>
        </div>

        <div className="border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-950/30 p-4">
          <h4 className="font-bold text-purple-900 dark:text-purple-100 mb-2">
            Step 3: Boundary Identification
          </h4>
          <p className="text-sm text-purple-800 dark:text-purple-200">
            Mark timestamps where frame difference exceeds the threshold (default: 30%) as
            potential scene boundaries. Higher differences indicate more significant visual changes.
          </p>
        </div>

        <div className="border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-950/30 p-4">
          <h4 className="font-bold text-orange-900 dark:text-orange-100 mb-2">
            Step 4: False Positive Filtering
          </h4>
          <p className="text-sm text-orange-800 dark:text-orange-200">
            Apply smoothing and local maxima detection to remove false positives caused by camera
            motion, fast object movement, or flashes. Reduces false positives by 50-70%.
          </p>
        </div>

        <div className="border-l-4 border-red-500 bg-red-50 dark:bg-red-950/30 p-4">
          <h4 className="font-bold text-red-900 dark:text-red-100 mb-2">
            Step 5: Minimum Scene Length
          </h4>
          <p className="text-sm text-red-800 dark:text-red-200">
            Remove boundaries that create scenes shorter than the minimum length (default: 3 seconds).
            This prevents micro-scenes from quick cuts or transitions.
          </p>
        </div>

        <div className="border-l-4 border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 p-4">
          <h4 className="font-bold text-indigo-900 dark:text-indigo-100 mb-2">
            Step 6: Scene Grouping
          </h4>
          <p className="text-sm text-indigo-800 dark:text-indigo-200">
            Group timestamps into coherent Scene objects with start time, end time, duration,
            and confidence scores.
          </p>
        </div>

        <div className="border-l-4 border-pink-500 bg-pink-50 dark:bg-pink-950/30 p-4">
          <h4 className="font-bold text-pink-900 dark:text-pink-100 mb-2">
            Step 7: Thumbnail Generation
          </h4>
          <p className="text-sm text-pink-800 dark:text-pink-200">
            Extract a representative frame from each scene&apos;s midpoint (if enabled). Midpoint frames
            are most stable and representative of the scene.
          </p>
        </div>
      </div>

      <h3 id="frame-sampling">Frame Sampling Strategy</h3>
      <p>
        VideoIntel samples frames at 0.5-second intervals, providing ~2 frames per second of analysis.
        This is optimal because:
      </p>

      <ul>
        <li><strong>Fast enough</strong> to catch quick cuts and transitions</li>
        <li><strong>Slow enough</strong> for efficient processing (analyzing every frame would be 60x slower)</li>
        <li><strong>Memory efficient</strong> - only keeps frames needed for comparison</li>
      </ul>

      <CodeBlock
        language="typescript"
        code={`// Example: 60-second video with 0.5s sampling
// Extracts: 120 frames (60 ÷ 0.5)
// Memory: ~30MB peak (frames processed progressively)
// Time: ~3-5 seconds on modern hardware

const scenes = await videoIntel.detectScenes(video, {
  minSceneLength: 3,    // Filter scenes shorter than 3s
  threshold: 0.3,       // 30% difference required
});`}
      />

      <h3 id="difference-calculation">Frame Difference Calculation</h3>
      <p>
        VideoIntel calculates frame differences using pixel-level comparison with optimizations:
      </p>

      <CodeBlock
        language="typescript"
        code={`// Pseudo-code showing the difference calculation
function calculateFrameDifference(frame1, frame2) {
  // 1. Downscale frames to 25% size (4x4 = 16x fewer pixels)
  const small1 = downscale(frame1, 0.25);
  const small2 = downscale(frame2, 0.25);
  
  // 2. Convert to grayscale (3x faster than RGB)
  const gray1 = toGrayscale(small1);
  const gray2 = toGrayscale(small2);
  
  // 3. Calculate pixel-by-pixel difference
  let totalDifference = 0;
  for (let i = 0; i < pixels.length; i++) {
    const diff = Math.abs(gray1[i] - gray2[i]);
    totalDifference += diff;
  }
  
  // 4. Normalize to 0-1 range
  const avgDifference = totalDifference / pixels.length;
  return avgDifference / 255;
}

// Result: 48x faster than full-res RGB comparison
// Accuracy: >95% scene detection rate`}
      />

      <h3 id="filtering">False Positive Filtering</h3>
      <p>
        Raw difference detection produces many false positives. VideoIntel applies two filters:
      </p>

      <h4>1. Local Maxima Detection</h4>
      <p>
        Only keeps boundaries that are peaks in their neighborhood. This removes spurious
        detections during gradual transitions or panning shots.
      </p>

      <CodeBlock
        language="typescript"
        code={`// A boundary is kept only if it's higher than neighbors
// Window size: ±3 frames

Difference:  [0.2, 0.4, 0.8, 0.5, 0.3, 0.9, 0.4]
                    ↓    ↑              ↑
              kept (local max)    kept (local max)
              
// The 0.4 spike is rejected because 0.8 is nearby`}
      />

      <h4>2. Prominence Filtering</h4>
      <p>
        Boundaries must be significantly higher (20% threshold) than their neighbors to be
        considered valid scene changes.
      </p>

      <CodeBlock
        language="typescript"
        code={`// Prominence = (boundary - avg_neighbors) / avg_neighbors
// Must be ≥ 20% to be kept

Boundary: 0.8, Neighbors: [0.7, 0.65]
Avg neighbors: 0.675
Prominence: (0.8 - 0.675) / 0.675 = 18.5%
Result: REJECTED (below 20% threshold)

Boundary: 0.8, Neighbors: [0.5, 0.45]
Avg neighbors: 0.475
Prominence: (0.8 - 0.475) / 0.475 = 68%
Result: KEPT (above threshold)`}
      />

      <h2 id="configuration">Configuration Options</h2>
      <p>
        Fine-tune scene detection for your specific use case:
      </p>

      <CodeBlock
        language="typescript"
        code={`const scenes = await videoIntel.detectScenes(video, {
  // Minimum scene length in seconds
  // Shorter scenes are merged with adjacent scenes
  minSceneLength: 3,    // Default: 3 seconds
  
  // Detection sensitivity (0-1)
  // Lower = more scenes, Higher = fewer scenes
  threshold: 0.3,       // Default: 0.3 (30%)
  
  // Generate thumbnails for each scene
  includeThumbnails: true,  // Default: true
});`}
      />

      <h3>Threshold Tuning Guide</h3>

      <div className="not-prose overflow-x-auto my-6">
        <table className="min-w-full border border-gray-300 dark:border-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Threshold</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Sensitivity</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Use Case</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            <tr>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">0.15 - 0.25</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">Very High</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">Catch subtle transitions, slow pans, lighting changes</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">0.25 - 0.35</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">Balanced ⭐</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">Most videos - good balance of accuracy and precision</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">0.35 - 0.50</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">Conservative</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">Only obvious cuts, action films with fast motion</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">0.50+</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">Very Low</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">Only dramatic scene changes</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 id="best-practices">Best Practices</h2>

      <h3>1. Choose the Right Threshold</h3>
      <p>
        Different video types need different thresholds:
      </p>

      <CodeBlock
        language="typescript"
        code={`// Talking head videos (static scenes, few cuts)
const talkingHead = await videoIntel.detectScenes(video, {
  threshold: 0.25,      // Lower threshold to catch subtle changes
  minSceneLength: 5,    // Longer minimum (scenes tend to be long)
});

// Action movies (fast cuts, lots of motion)
const actionMovie = await videoIntel.detectScenes(video, {
  threshold: 0.40,      // Higher threshold to avoid motion blur
  minSceneLength: 2,    // Shorter minimum (scenes are quick)
});

// Documentaries (mix of interviews and B-roll)
const documentary = await videoIntel.detectScenes(video, {
  threshold: 0.30,      // Balanced detection
  minSceneLength: 3,    // Standard minimum
});

// Music videos (very fast cuts, artistic transitions)
const musicVideo = await videoIntel.detectScenes(video, {
  threshold: 0.35,      // Higher to avoid detecting every beat
  minSceneLength: 1,    // Allow very short scenes
});`}
      />

      <h3>2. Validate Results</h3>
      <p>
        Use the statistics API to understand detection quality:
      </p>

      <CodeBlock
        language="typescript"
        code={`const detector = new SceneDetector(
  new FrameExtractor(),
  new FrameDifferenceCalculator()
);

const scenes = await detector.detect(video, options);

// Get detection statistics
const stats = detector.getLastStats();

console.log(\`Detected \${stats.scenesDetected} scenes\`);
console.log(\`Average scene length: \${stats.averageSceneLength}s\`);
console.log(\`False positives filtered: \${stats.boundariesRejected}\`);
console.log(\`Processing time: \${stats.processingTime}ms\`);

// If too many scenes detected:
// → Increase threshold
// If too few scenes detected:
// → Decrease threshold`}
      />

      <h3>3. Handle Edge Cases</h3>

      <CodeBlock
        language="typescript"
        code={`// Very short videos (< 5 seconds)
if (video.duration < 5) {
  // Might not find any scenes - that's okay
  const scenes = await videoIntel.detectScenes(video, {
    minSceneLength: 0.5,  // Lower minimum
    threshold: 0.2,       // More sensitive
  });
}

// Very long videos (> 30 minutes)
if (video.duration > 1800) {
  // Consider higher threshold for efficiency
  const scenes = await videoIntel.detectScenes(video, {
    minSceneLength: 5,    // Longer scenes likely
    threshold: 0.35,      // Less sensitive = faster
  });
}

// Videos with fades/transitions
const artisticVideo = await videoIntel.detectScenes(video, {
  threshold: 0.25,      // Lower to catch gradual transitions
  minSceneLength: 2,
});`}
      />

      <h2 id="performance">Performance</h2>

      <h3>Benchmarks</h3>
      <div className="not-prose overflow-x-auto my-6">
        <table className="min-w-full border border-gray-300 dark:border-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Video Length</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Frames Analyzed</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Processing Time</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Memory Peak</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            <tr>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">30 seconds</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">~60 frames</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">1-2 seconds</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">~50MB</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">2 minutes</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">~240 frames</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">3-5 seconds</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">~100MB</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">10 minutes</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">~1,200 frames</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">15-20 seconds</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">~200MB</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">30 minutes</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">~3,600 frames</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">45-60 seconds</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">~300MB</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="not-prose bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 my-6">
        <p className="text-sm text-yellow-900 dark:text-yellow-100 font-semibold mb-2">
          ⚡ Performance Note
        </p>
        <p className="text-sm text-yellow-700 dark:text-yellow-300">
          Scene detection is CPU-intensive. For very long videos (`{'>'}`1 hour), consider processing
          in chunks or using a lower sampling rate. The algorithm is already optimized with
          downscaling and grayscale conversion for maximum speed.
        </p>
      </div>

      <h2 id="examples">Common Examples</h2>

      <h3>Create Video Chapters</h3>
      <CodeBlock
        language="typescript"
        code={`async function createChapters(video: HTMLVideoElement) {
  const scenes = await videoIntel.detectScenes(video, {
    minSceneLength: 5,    // Chapters should be substantial
    threshold: 0.3,
    includeThumbnails: true,
  });
  
  return scenes.map((scene, i) => ({
    title: \`Chapter \${i + 1}\`,
    start: scene.start,
    end: scene.end,
    duration: scene.duration,
    thumbnail: scene.thumbnail,  // Use scene thumbnail
  }));
}

// Usage in video player
const chapters = await createChapters(videoElement);
chapters.forEach(chapter => {
  addChapterMarker(chapter);
});`}
      />

      <h3>Smart Video Trimming</h3>
      <CodeBlock
        language="typescript"
        code={`async function suggestTrimPoints(video: HTMLVideoElement) {
  const scenes = await videoIntel.detectScenes(video, {
    threshold: 0.35,  // Conservative - only clear cuts
  });
  
  // Suggest natural cut points at scene boundaries
  return {
    suggestedTrims: scenes.map(scene => scene.start),
    scenes: scenes.map(scene => ({
      start: scene.start,
      end: scene.end,
      canTrim: scene.duration > 3,  // Only suggest if scene is long enough
    })),
  };
}`}
      />

      <h3>Automatic Highlights</h3>
      <CodeBlock
        language="typescript"
        code={`async function findHighlightScenes(video: HTMLVideoElement) {
  const scenes = await videoIntel.detectScenes(video, {
    threshold: 0.3,
  });
  
  // Get thumbnails for scene analysis
  const thumbnails = await videoIntel.getThumbnails(video, {
    count: scenes.length,
  });
  
  // Match thumbnails to scenes and score them
  const scoredScenes = scenes.map((scene, i) => ({
    ...scene,
    score: thumbnails[i]?.score || 0,  // Use thumbnail quality as proxy
  }));
  
  // Return top 3 highest-scoring scenes as highlights
  return scoredScenes
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}`}
      />

      <div className="not-prose bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 my-6">
        <p className="text-sm text-green-900 dark:text-green-100 font-semibold mb-2">
          🚀 Next Steps
        </p>
        <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
          <li>• Learn about <a href="/docs/guides/thumbnails" className="underline">Thumbnail Generation</a></li>
          <li>• Explore <a href="/docs/guides/colors" className="underline">Color Extraction</a></li>
          <li>• Try the <a href="/playground" className="underline">Interactive Playground</a></li>
          <li>• View <a href="/docs/api#detect-scenes" className="underline">Complete API Reference</a></li>
        </ul>
      </div>
    </DocsLayout>
  );
}


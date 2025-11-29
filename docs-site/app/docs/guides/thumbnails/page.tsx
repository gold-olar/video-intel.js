import DocsLayout from '@/components/Docs/DocsLayout';
import CodeBlock from '@/components/Shared/CodeBlock';

const tocItems = [
  { id: 'overview', title: 'Overview', level: 2 },
  { id: 'how-it-works', title: 'How It Works', level: 2 },
  { id: 'best-practices', title: 'Best Practices', level: 2 },
  { id: 'quality-optimization', title: 'Quality Optimization', level: 2 },
  { id: 'performance-tips', title: 'Performance Tips', level: 2 },
  { id: 'common-use-cases', title: 'Common Use Cases', level: 2 },
];

export default function ThumbnailGuidePage() {
  return (
    <DocsLayout tocItems={tocItems}>
      <h1>Thumbnail Generation Guide</h1>
      <p className="lead">
        Learn how to generate high-quality, representative thumbnails from your videos using
        VideoIntel's intelligent frame scoring algorithm.
      </p>

      <h2 id="overview">Overview</h2>
      <p>
        VideoIntel uses advanced computer vision techniques to analyze every frame and select the
        most visually appealing and representative moments for thumbnails. Unlike simple
        time-based sampling, our algorithm considers:
      </p>

      <ul>
        <li><strong>Visual Quality:</strong> Sharpness, contrast, and clarity</li>
        <li><strong>Content Diversity:</strong> Avoids similar-looking frames</li>
        <li><strong>Face Detection:</strong> Prefers frames with visible faces (coming soon)</li>
        <li><strong>Color Distribution:</strong> Balanced and vibrant colors</li>
        <li><strong>Motion Blur:</strong> Avoids blurry frames</li>
      </ul>

      <h2 id="how-it-works">How It Works</h2>
      <p>The thumbnail generation process follows a sophisticated 7-step pipeline:</p>

      <div className="not-prose space-y-4 my-6">
        <div className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/30 p-4">
          <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-2">
            Step 1: Extraction Strategy
          </h4>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Calculate which frames to extract as candidates. Extracts 3x more candidates than needed
            (e.g., 15 candidates for 5 thumbnails) and skips 5% margins at start/end to avoid
            fade-in/fade-out transitions.
          </p>
        </div>

        <div className="border-l-4 border-green-500 bg-green-50 dark:bg-green-950/30 p-4">
          <h4 className="font-bold text-green-900 dark:text-green-100 mb-2">
            Step 2: Frame Extraction
          </h4>
          <p className="text-sm text-green-800 dark:text-green-200">
            Extract candidate frames at calculated timestamps. Frames are extracted in chronological
            order for optimal performance with minimum 2-second spacing between candidates.
          </p>
        </div>

        <div className="border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-950/30 p-4">
          <h4 className="font-bold text-purple-900 dark:text-purple-100 mb-2">
            Step 3: Quality Scoring
          </h4>
          <p className="text-sm text-purple-800 dark:text-purple-200">
            Score each frame using a composite algorithm that evaluates: <strong>sharpness</strong> (Laplacian
            variance), <strong>brightness</strong> (luminance formula), <strong>contrast</strong> (min-max range),
            and <strong>color variance</strong> (RGB diversity). Scores are normalized to 0-1 range.
          </p>
        </div>

        <div className="border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-950/30 p-4">
          <h4 className="font-bold text-orange-900 dark:text-orange-100 mb-2">
            Step 4: Frame Filtering
          </h4>
          <p className="text-sm text-orange-800 dark:text-orange-200">
            Filter out unusable frames: black frames ({"<"}5% brightness), white/overexposed frames
            ({">"}95% brightness), and blurry frames ({"<"}5% sharpness). Typically filters 20-30% of candidates.
          </p>
        </div>

        <div className="border-l-4 border-red-500 bg-red-50 dark:bg-red-950/30 p-4">
          <h4 className="font-bold text-red-900 dark:text-red-100 mb-2">
            Step 5: Diversity Filter
          </h4>
          <p className="text-sm text-red-800 dark:text-red-200">
            Apply temporal diversity to spread thumbnails across video timeline. Always selects
            highest-scoring frame, then adds frames that are at least 5 seconds apart for
            comprehensive video coverage.
          </p>
        </div>

        <div className="border-l-4 border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 p-4">
          <h4 className="font-bold text-indigo-900 dark:text-indigo-100 mb-2">
            Step 6: Thumbnail Generation
          </h4>
          <p className="text-sm text-indigo-800 dark:text-indigo-200">
            Convert selected frames to final thumbnails with specified format (JPEG/PNG), quality
            (0-1), and dimensions. Maintains aspect ratio automatically if only one dimension specified.
          </p>
        </div>

        <div className="border-l-4 border-pink-500 bg-pink-50 dark:bg-pink-950/30 p-4">
          <h4 className="font-bold text-pink-900 dark:text-pink-100 mb-2">
            Step 7: Memory Cleanup
          </h4>
          <p className="text-sm text-pink-800 dark:text-pink-200">
            Clean up temporary canvas elements to prevent memory leaks. Essential for processing
            multiple videos or generating many thumbnails.
          </p>
        </div>
      </div>

      <h3>Quality Scoring Algorithm</h3>
      <p>
        Each frame receives a composite quality score based on four metrics:
      </p>

      <CodeBlock
        language="typescript"
        code={`// Simplified scoring algorithm
function scoreFrame(imageData: ImageData) {
  // 1. Sharpness (0-1): Laplacian variance edge detection
  // Sharp images have strong edges and high variance
  const sharpness = calculateLaplacianVariance(imageData);
  
  // 2. Brightness (0-1): Perceptual luminance
  // Y = 0.299R + 0.587G + 0.114B (weighted for human perception)
  const brightness = calculatePerceptualBrightness(imageData);
  
  // 3. Contrast (0-1): Dynamic range
  // High contrast = wide range of brightness values
  const contrast = (maxLuminance - minLuminance) / 255;
  
  // 4. Color Variance (0-1): RGB diversity
  // Colorful images have high variance across channels
  const colorVariance = calculateRGBVariance(imageData);
  
  // Composite score with weighted average
  const score = (
    sharpness * 0.4 +      // 40% weight (most important)
    brightness * 0.2 +     // 20% weight
    contrast * 0.2 +       // 20% weight
    colorVariance * 0.2    // 20% weight
  );
  
  return score;
}`}
      />

      <h3>Frame Filtering Thresholds</h3>
      <p>
        VideoIntel uses conservative thresholds to filter unusable frames:
      </p>

      <div className="not-prose overflow-x-auto my-6">
        <table className="min-w-full border border-gray-300 dark:border-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Check</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Threshold</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Purpose</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            <tr>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">Black Frame</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{"<"} 5% brightness</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">Filter fade-to-black transitions</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">White Frame</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{"> "}95% brightness</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">Filter overexposed/fade-to-white</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">Blurry Frame</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{"<"} 5% sharpness</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">Filter out-of-focus or motion blur</td>
            </tr>
          </tbody>
        </table>
      </div>

      <CodeBlock
        language="typescript"
        code={`import videoIntel from 'video-intel';

// Generate 10 high-quality thumbnails
const thumbnails = await videoIntel.getThumbnails(videoFile, {
  count: 10,
  quality: 0.9,
  width: 1280,
  height: 720,
});

// Thumbnails are automatically sorted by quality (best first)
const bestThumbnail = thumbnails[0];
console.log(\`Best thumbnail at \${bestThumbnail.timestamp}s\`);
console.log(\`Quality score: \${bestThumbnail.quality}\`);`}
      />

      <h2 id="best-practices">Best Practices</h2>

      <h3>Choose the Right Count</h3>
      <p>The optimal number of thumbnails depends on your use case:</p>

      <CodeBlock
        language="typescript"
        code={`// For video previews (single thumbnail)
const thumbnails = await videoIntel.getThumbnails(file, { count: 1 });

// For video galleries (3-5 thumbnails)
const thumbnails = await videoIntel.getThumbnails(file, { count: 5 });

// For video seekbar/timeline (10-20 thumbnails)
const thumbnails = await videoIntel.getThumbnails(file, { count: 15 });

// For comprehensive analysis (30+ thumbnails)
const thumbnails = await videoIntel.getThumbnails(file, { count: 50 });`}
      />

      <div className="not-prose bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 my-6">
        <p className="text-sm text-blue-900 dark:text-blue-100 font-semibold mb-2">
          💡 Performance Tip
        </p>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          More thumbnails = longer processing time. For a 10-second video: 5 thumbnails ≈ 2s, 20
          thumbnails ≈ 5s. Balance quality with user experience.
        </p>
      </div>

      <h3>Set Quality Appropriately</h3>
      <p>The quality parameter affects both file size and visual fidelity:</p>

      <CodeBlock
        language="typescript"
        code={`// Low quality - Small file size, good for previews (0.5-0.6)
const lowQuality = await videoIntel.getThumbnails(file, { 
  quality: 0.6,
  width: 640,
  height: 360 
});

// Medium quality - Balanced (0.7-0.8) ⭐ Recommended
const mediumQuality = await videoIntel.getThumbnails(file, { 
  quality: 0.8,
  width: 1280,
  height: 720 
});

// High quality - Large files, best visual quality (0.9-1.0)
const highQuality = await videoIntel.getThumbnails(file, { 
  quality: 0.95,
  width: 1920,
  height: 1080 
});`}
      />

      <h2 id="quality-optimization">Quality Optimization</h2>

      <h3>Resize for Target Display</h3>
      <p>
        Always resize thumbnails to match your display size. This reduces memory usage and improves
        performance:
      </p>

      <CodeBlock
        language="typescript"
        code={`// For mobile thumbnails
const mobileThumbs = await videoIntel.getThumbnails(file, {
  width: 320,
  height: 180,
  quality: 0.7,
});

// For desktop gallery
const desktopThumbs = await videoIntel.getThumbnails(file, {
  width: 640,
  height: 360,
  quality: 0.8,
});

// For full-screen hero images
const heroThumbs = await videoIntel.getThumbnails(file, {
  width: 1920,
  height: 1080,
  quality: 0.9,
});`}
      />

      <h3>Maintain Aspect Ratio</h3>
      <p>VideoIntel automatically maintains the source video's aspect ratio:</p>

      <CodeBlock
        language="typescript"
        code={`// Specify only width - height calculated automatically
const thumbnails = await videoIntel.getThumbnails(file, {
  width: 1280,
  // height will be calculated based on video aspect ratio
});

// Or specify both for exact dimensions (may crop or pad)
const thumbnails = await videoIntel.getThumbnails(file, {
  width: 1280,
  height: 720,  // Forces 16:9 aspect ratio
});`}
      />

      <h2 id="performance-tips">Performance Tips</h2>

      <h3>Use Appropriate Sample Sizes</h3>
      <p>For long videos, you don't need to analyze every second:</p>

      <CodeBlock
        language="typescript"
        code={`// For short videos (< 1 min) - High frequency sampling
const shortVideo = await videoIntel.getThumbnails(file, {
  count: 10,  // Dense sampling for detailed analysis
});

// For medium videos (1-10 min) - Medium frequency
const mediumVideo = await videoIntel.getThumbnails(file, {
  count: 15,  // Good balance
});

// For long videos (> 10 min) - Strategic sampling
const longVideo = await videoIntel.getThumbnails(file, {
  count: 20,  // Sufficient coverage without overhead
});`}
      />

      <h3>Process in Batches</h3>
      <p>When generating thumbnails for multiple videos, process them sequentially to avoid memory issues:</p>

      <CodeBlock
        language="typescript"
        code={`async function processManyVideos(files: File[]) {
  const allThumbnails = [];
  
  for (const file of files) {
    const thumbnails = await videoIntel.getThumbnails(file, {
      count: 5,
      quality: 0.8,
    });
    
    allThumbnails.push({ file: file.name, thumbnails });
    
    // Optional: Small delay to prevent overwhelming the browser
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return allThumbnails;
}

// Usage
const results = await processManyVideos(videoFiles);`}
      />

      <h2 id="common-use-cases">Common Use Cases</h2>

      <h3>Video Gallery Thumbnail</h3>
      <p>Generate a single, high-quality representative thumbnail:</p>

      <CodeBlock
        language="typescript"
        code={`async function createGalleryThumbnail(videoFile: File) {
  const thumbnails = await videoIntel.getThumbnails(videoFile, {
    count: 1,
    quality: 0.85,
    width: 640,
    height: 360,
  });
  
  // Use the best thumbnail
  const thumbnail = thumbnails[0];
  
  // Create img element
  const img = document.createElement('img');
  img.src = thumbnail.dataUrl;
  img.alt = \`Video thumbnail at \${thumbnail.timestamp}s\`;
  img.className = 'rounded-lg shadow-lg';
  
  return img;
}`}
      />

      <h3>Video Timeline/Scrubber</h3>
      <p>Create preview thumbnails for video timeline navigation:</p>

      <CodeBlock
        language="typescript"
        code={`async function createTimelineThumbnails(videoFile: File, videoElement: HTMLVideoElement) {
  const duration = videoElement.duration;
  const thumbnails = await videoIntel.getThumbnails(videoFile, {
    count: 20,
    quality: 0.7,
    width: 160,
    height: 90,
  });
  
  // Create hover preview
  const previewContainer = document.createElement('div');
  previewContainer.className = 'timeline-preview';
  
  videoElement.addEventListener('mousemove', (e) => {
    const rect = videoElement.getBoundingClientRect();
    const position = (e.clientX - rect.left) / rect.width;
    const time = position * duration;
    
    // Find closest thumbnail
    const closest = thumbnails.reduce((prev, curr) => 
      Math.abs(curr.timestamp - time) < Math.abs(prev.timestamp - time) 
        ? curr 
        : prev
    );
    
    // Show preview
    previewContainer.innerHTML = \`
      <img src="\${closest.dataUrl}" alt="Preview">
      <span>\${formatTime(closest.timestamp)}</span>
    \`;
  });
}`}
      />

      <h3>Chapter Selection</h3>
      <p>Generate thumbnails for video chapters or sections:</p>

      <CodeBlock
        language="typescript"
        code={`async function createChapterThumbnails(videoFile: File) {
  // First detect scenes (natural chapter breaks)
  const scenes = await videoIntel.detectScenes(videoFile);
  
  // Then generate thumbnails
  const thumbnails = await videoIntel.getThumbnails(videoFile, {
    count: scenes.length,
    quality: 0.85,
  });
  
  // Match thumbnails to scenes
  const chapters = scenes.map((scene, i) => ({
    title: \`Chapter \${i + 1}\`,
    timestamp: scene.timestamp,
    thumbnail: thumbnails[i].dataUrl,
  }));
  
  return chapters;
}`}
      />

      <div className="not-prose bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 my-6">
        <p className="text-sm text-green-900 dark:text-green-100 font-semibold mb-2">
          🚀 Next Steps
        </p>
        <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
          <li>• Learn about <a href="/docs/guides/scenes" className="underline">Scene Detection</a></li>
          <li>• Explore <a href="/docs/guides/colors" className="underline">Color Extraction</a></li>
          <li>• Try the <a href="/playground" className="underline">Interactive Playground</a></li>
          <li>• View <a href="/docs/api#get-thumbnails" className="underline">Complete API Reference</a></li>
        </ul>
      </div>
    </DocsLayout>
  );
}


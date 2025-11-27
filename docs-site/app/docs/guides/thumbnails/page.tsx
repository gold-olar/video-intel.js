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
      <p>The thumbnail generation process follows these steps:</p>

      <ol>
        <li><strong>Frame Extraction:</strong> Sample frames at regular intervals</li>
        <li><strong>Quality Scoring:</strong> Rate each frame based on multiple criteria</li>
        <li><strong>Deduplication:</strong> Remove visually similar frames</li>
        <li><strong>Selection:</strong> Choose top N frames with highest scores</li>
        <li><strong>Optimization:</strong> Resize and compress to target quality</li>
      </ol>

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


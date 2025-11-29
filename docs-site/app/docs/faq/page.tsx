import DocsLayout from '@/components/Docs/DocsLayout';

const tocItems = [
  { id: 'general', title: 'General Questions', level: 2 },
  { id: 'performance', title: 'Performance', level: 2 },
  { id: 'compatibility', title: 'Browser Compatibility', level: 2 },
  { id: 'troubleshooting', title: 'Troubleshooting', level: 2 },
];

export default function FAQPage() {
  return (
    <DocsLayout tocItems={tocItems}>
      <h1>Frequently Asked Questions</h1>
      <p className="lead">
        Find answers to common questions about VideoIntel.js
      </p>

      <h2 id="general">General Questions</h2>

      <h3>What is VideoIntel.js?</h3>
      <p>
        VideoIntel.js is a browser-based video analysis library that provides smart thumbnail generation,
        scene detection, color extraction, and metadata extraction capabilities. All processing happens
        directly in the browser, ensuring privacy and eliminating server costs.
      </p>

      <h3>Is VideoIntel.js free to use?</h3>
      <p>
        Yes! VideoIntel.js is open-source and released under the MIT license. You can use it freely
        in both personal and commercial projects.
      </p>

      <h3>Does it require a backend server?</h3>
      <p>
        No. All video processing happens entirely in the browser using JavaScript. Your videos never
        leave the user's device, which ensures privacy and reduces infrastructure costs.
      </p>

      <h3>What video formats are supported?</h3>
      <p>
        VideoIntel.js supports all video formats that are natively supported by the browser's HTML5
        video element. This typically includes:
      </p>
      <ul>
        <li>MP4 (H.264)</li>
        <li>WebM (VP8, VP9)</li>
        <li>Ogg (Theora)</li>
      </ul>
      <p>
        Support varies by browser. MP4 with H.264 encoding has the widest compatibility.
      </p>

      <h2 id="performance">Performance</h2>

      <h3>How long does video analysis take?</h3>
      <p>
        Performance depends on several factors:
      </p>
      <ul>
        <li>Video length and resolution</li>
        <li>Number of features enabled</li>
        <li>Device hardware (CPU, RAM)</li>
        <li>Browser performance</li>
      </ul>
      <p>
        As a rough guide, a 10-second 1080p video typically takes 3-5 seconds to analyze with all
        features enabled on a modern laptop.
      </p>

      <h3>Can I analyze multiple videos simultaneously?</h3>
      <p>
        While technically possible, it's recommended to process videos sequentially to avoid memory
        issues and ensure optimal performance. Use a queue system for batch processing:
      </p>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
        <code>{`for (const video of videos) {
  await videoIntel.analyze(video);
  // Small delay to prevent memory buildup
  await new Promise(resolve => setTimeout(resolve, 100));
}`}</code>
      </pre>

      <h3>How can I improve performance?</h3>
      <p>
        Several strategies can help:
      </p>
      <ul>
        <li>Reduce the number of thumbnails requested (fewer = faster)</li>
        <li>Lower the quality setting for thumbnails</li>
        <li>Enable only the features you need</li>
        <li>Use the <code>analyze()</code> method for multiple features instead of calling each separately</li>
        <li>Consider downscaling videos before analysis if you don't need full resolution</li>
      </ul>

      <h3>What's the maximum video size?</h3>
      <p>
        There's no hard limit imposed by VideoIntel.js, but practical limits depend on:
      </p>
      <ul>
        <li>Available browser memory (typically 1-2GB per tab)</li>
        <li>Video resolution and codec efficiency</li>
        <li>Device capabilities</li>
      </ul>
      <p>
        For web applications, we recommend limiting uploads to 100-200MB for the best user experience.
      </p>

      <h2 id="compatibility">Browser Compatibility</h2>

      <h3>Which browsers are supported?</h3>
      <p>
        VideoIntel.js works in all modern browsers:
      </p>
      <ul>
        <li><strong>Chrome/Edge:</strong> Version 90+</li>
        <li><strong>Firefox:</strong> Version 88+</li>
        <li><strong>Safari:</strong> Version 14+</li>
        <li><strong>Opera:</strong> Version 76+</li>
      </ul>

      <h3>Does it work on mobile devices?</h3>
      <p>
        Yes! VideoIntel.js works on mobile browsers, but performance will be slower due to limited
        device resources. For mobile apps, consider:
      </p>
      <ul>
        <li>Reducing analysis complexity (fewer thumbnails, lower quality)</li>
        <li>Showing progress indicators for user feedback</li>
        <li>Adding file size limits (e.g., 50MB max)</li>
      </ul>

      <h3>Is Internet Explorer supported?</h3>
      <p>
        No. VideoIntel.js requires modern JavaScript features (ES6+) and Web APIs that aren't
        available in Internet Explorer. Please use a modern browser.
      </p>

      <h2 id="troubleshooting">Troubleshooting</h2>

      <h3>I'm getting "Out of memory" errors</h3>
      <p>
        This typically happens with large videos or when processing multiple videos. Try:
      </p>
      <ul>
        <li>Calling <code>dispose()</code> after each analysis to free resources</li>
        <li>Reducing thumbnail count and quality</li>
        <li>Processing videos sequentially instead of in parallel</li>
        <li>Implementing file size limits in your app</li>
      </ul>

      <h3>Video analysis is stuck or taking too long</h3>
      <p>
        Check the following:
      </p>
      <ul>
        <li>Is the video file corrupted or in an unsupported format?</li>
        <li>Is the browser tab active? Some browsers throttle background tabs</li>
        <li>Are other CPU-intensive tasks running?</li>
        <li>Try reducing the analysis complexity (fewer features, lower quality)</li>
      </ul>

      <h3>Thumbnails are blurry or low quality</h3>
      <p>
        This could be due to:
      </p>
      <ul>
        <li>Low quality setting - try increasing the <code>quality</code> parameter (0-1)</li>
        <li>Source video quality - analysis can't improve poor source material</li>
        <li>Resize settings - make sure width/height match your display size</li>
      </ul>

      <h3>Scene detection is missing some scenes</h3>
      <p>
        Try adjusting the threshold:
      </p>
      <ul>
        <li><strong>Lower threshold (0-20):</strong> More sensitive, detects more scenes (may include false positives)</li>
        <li><strong>Medium threshold (20-40):</strong> Balanced (recommended)</li>
        <li><strong>Higher threshold (40-100):</strong> Less sensitive, only detects major scene changes</li>
      </ul>

      <h3>How do I report a bug?</h3>
      <p>
        Please open an issue on our{' '}
        <a href="https:/github.com/gold-olar/video-intel.js/issues" className="text-indigo-600 dark:text-indigo-400 underline">
          GitHub repository
        </a>{' '}
        with:
      </p>
      <ul>
        <li>Clear description of the issue</li>
        <li>Steps to reproduce</li>
        <li>Browser and version</li>
        <li>Sample video (if possible)</li>
        <li>Console error messages</li>
      </ul>

      <div className="not-prose bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 my-6">
        <p className="text-sm text-blue-900 dark:text-blue-100 font-semibold mb-2">
          Can't find your answer?
        </p>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Check out the{' '}
          <a href="/docs/api" className="underline">API Reference</a>,{' '}
          <a href="/docs/guides" className="underline">Guides</a>, or{' '}
          <a href="https:/github.com/gold-olar/video-intel.js/discussions" className="underline">
            open a discussion on GitHub
          </a>.
        </p>
      </div>
    </DocsLayout>
  );
}


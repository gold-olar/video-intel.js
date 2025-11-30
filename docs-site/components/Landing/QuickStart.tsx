'use client';

import { useState } from 'react';
import { FiCopy, FiCheck } from 'react-icons/fi';

const codeExamples = {
  thumbnails: `import VideoIntel from 'videointel';

const analyzer = new VideoIntel();
const results = await analyzer.analyze(videoFile, {
  thumbnails: {
    count: 5,
    quality: 0.8
  }
});

// Access generated thumbnails
results.thumbnails.forEach(thumb => {
  console.log(thumb.dataUrl, thumb.timestamp);
});`,

  scenes: `import VideoIntel from 'videointel';

const analyzer = new VideoIntel();
const results = await analyzer.analyze(videoFile, {
  scenes: {
    threshold: 30 // Sensitivity (0-100)
  }
});

// Get scene timestamps
results.scenes.forEach(scene => {
  console.log(\`Scene at \${scene.timestamp}s\`);
});`,

  colors: `import VideoIntel from 'videointel';

const analyzer = new VideoIntel();
const results = await analyzer.analyze(videoFile, {
  colors: {
    count: 5 // Number of dominant colors
  }
});

// Extract color palette
results.colors.forEach(color => {
  console.log(color.hex, color.percentage);
});`,

  full: `import VideoIntel from 'videointel';

const analyzer = new VideoIntel();
const results = await analyzer.analyze(videoFile, {
  thumbnails: { count: 3, quality: 0.9 },
  scenes: { threshold: 30 },
  colors: { count: 5 },
  metadata: true
});

console.log('All results:', results);`
};

type ExampleKey = keyof typeof codeExamples;

export default function QuickStart() {
  const [activeTab, setActiveTab] = useState<ExampleKey>('thumbnails');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeExamples[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="py-24 sm:py-32 bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Quick Start
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
            Get started in three simple steps
          </p>
        </div>

        {/* Installation Steps */}
        <div className="mx-auto mt-16 max-w-4xl">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white text-xl font-bold">
                1
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                Install
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                <code className="rounded bg-gray-200 dark:bg-gray-800 px-2 py-1">
                  npm install videointel
                </code>
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white text-xl font-bold">
                2
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                Import
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Import the library in your code
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white text-xl font-bold">
                3
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                Analyze
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Start analyzing videos instantly
              </p>
            </div>
          </div>
        </div>

        {/* Code Examples */}
        <div className="mx-auto mt-16 max-w-4xl">
          <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-800">
            {Object.keys(codeExamples).map((key) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as ExampleKey)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === key
                    ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </button>
            ))}
          </div>

          <div className="relative mt-4 overflow-hidden rounded-lg bg-gray-900 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <div className="h-3 w-3 rounded-full bg-green-500" />
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 rounded-md bg-gray-800 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
              >
                {copied ? (
                  <>
                    <FiCheck className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <FiCopy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <pre className="overflow-x-auto p-6 text-sm leading-relaxed">
              <code className="text-gray-100">{codeExamples[activeTab]}</code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}


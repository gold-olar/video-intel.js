'use client';

import { useState } from 'react';
import { FiCode, FiCopy, FiCheck } from 'react-icons/fi';
import { AnalysisConfig } from './FeatureSelector';
import { trackCodeCopy } from '@/lib/analytics';

interface CodeGeneratorProps {
  config: AnalysisConfig;
  videoFileName?: string;
}

export default function CodeGenerator({ config, videoFileName = 'video.mp4' }: CodeGeneratorProps) {
  const [copied, setCopied] = useState(false);
  const [framework, setFramework] = useState<'typescript' | 'javascript' | 'react' | 'vue'>('typescript');

  const generateCode = () => {
    const features: string[] = [];
    
    if (config.thumbnails.enabled) {
      features.push(`thumbnails: { count: ${config.thumbnails.count}, quality: ${config.thumbnails.quality} }`);
    }
    if (config.scenes.enabled) {
      features.push(`scenes: { threshold: ${config.scenes.threshold} }`);
    }
    if (config.colors.enabled) {
      features.push(`colors: { count: ${config.colors.count} }`);
    }
    if (config.metadata) {
      features.push(`metadata: true`);
    }

    const optionsStr = features.length > 0 ? `,\n  {\n    ${features.join(',\n    ')}\n  }` : '';

    switch (framework) {
      case 'typescript':
        return `import videoIntel from 'videointel';

async function analyzeVideo(file: File) {
  // Initialize VideoIntel (optional)
  await videoIntel.init();

  // Analyze video with configured features
  const results = await videoIntel.analyze(file${optionsStr});

  ${config.thumbnails.enabled ? '// Access thumbnails\n  console.log(\'Thumbnails:\', results.thumbnails);\n  ' : ''}${config.scenes.enabled ? '// Access scenes\n  console.log(\'Scenes:\', results.scenes);\n  ' : ''}${config.colors.enabled ? '// Access colors\n  console.log(\'Colors:\', results.colors);\n  ' : ''}${config.metadata ? '// Access metadata\n  console.log(\'Metadata:\', results.metadata);\n  ' : ''}
  return results;
}

// Use with file input
const input = document.querySelector('input[type="file"]') as HTMLInputElement;
input?.addEventListener('change', async (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    const results = await analyzeVideo(file);
    console.log('Analysis complete:', results);
  }
});`;

      case 'javascript':
        return `import videoIntel from 'videointel';

async function analyzeVideo(file) {
  // Initialize VideoIntel (optional)
  await videoIntel.init();

  // Analyze video with configured features
  const results = await videoIntel.analyze(file${optionsStr});

  ${config.thumbnails.enabled ? '// Access thumbnails\n  console.log(\'Thumbnails:\', results.thumbnails);\n  ' : ''}${config.scenes.enabled ? '// Access scenes\n  console.log(\'Scenes:\', results.scenes);\n  ' : ''}${config.colors.enabled ? '// Access colors\n  console.log(\'Colors:\', results.colors);\n  ' : ''}${config.metadata ? '// Access metadata\n  console.log(\'Metadata:\', results.metadata);\n  ' : ''}
  return results;
}

// Use with file input
const input = document.querySelector('input[type="file"]');
input?.addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (file) {
    const results = await analyzeVideo(file);
    console.log('Analysis complete:', results);
  }
});`;

      case 'react': {
        const thumbnailsCode = config.thumbnails.enabled 
          ? `<div>
            <h3>Thumbnails</h3>
            {results.thumbnails?.map((thumb, i) => (
              <img key={i} src={thumb.dataUrl} alt={\`Thumbnail \${i + 1}\`} />
            ))}
          </div>
          ` : '';
        
        const scenesCode = config.scenes.enabled
          ? `<div>
            <h3>Scenes</h3>
            <ul>
              {results.scenes?.map((scene, i) => (
                <li key={i}>Scene at {scene.timestamp}s</li>
              ))}
            </ul>
          </div>
          ` : '';
        
        const colorsCode = config.colors.enabled
          ? `<div>
            <h3>Colors</h3>
            {results.colors?.map((color, i) => (
              <div key={i} style=\{\{ backgroundColor: color.hex \}\}>
                {color.hex} - {color.percentage}%
              </div>
            ))}
          </div>
          ` : '';
        
        const metadataCode = config.metadata
          ? `<div>
            <h3>Metadata</h3>
            <p>Duration: {results.metadata?.duration}s</p>
            <p>Resolution: {results.metadata?.width}x{results.metadata?.height}</p>
          </div>` : '';

        return `import { useState } from 'react';
import videoIntel from 'videointel';

function VideoAnalyzer() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const analysisResults = await videoIntel.analyze(file${optionsStr});
      setResults(analysisResults);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        disabled={loading}
      />
      
      {loading && <p>Analyzing video...</p>}
      
      {results && (
        <div>
          ${thumbnailsCode}${scenesCode}${colorsCode}${metadataCode}
        </div>
      )}
    </div>
  );
}

export default VideoAnalyzer;`;
      }

      case 'vue': {
        const thumbnailsCode = config.thumbnails.enabled
          ? `<div>
        <h3>Thumbnails</h3>
        <img
          v-for="(thumb, i) in results.thumbnails"
          :key="i"
          :src="thumb.dataUrl"
          :alt="\`Thumbnail \${i + 1}\`"
        />
      </div>
      ` : '';
        
        const scenesCode = config.scenes.enabled
          ? `<div>
        <h3>Scenes</h3>
        <ul>
          <li v-for="(scene, i) in results.scenes" :key="i">
            Scene at {{ scene.timestamp }}s
          </li>
        </ul>
      </div>
      ` : '';
        
        const colorsCode = config.colors.enabled
          ? `<div>
        <h3>Colors</h3>
        <div
          v-for="(color, i) in results.colors"
          :key="i"
          :style="{ backgroundColor: color.hex }"
        >
          {{ color.hex }} - {{ color.percentage }}%
        </div>
      </div>
      ` : '';
        
        const metadataCode = config.metadata
          ? `<div>
        <h3>Metadata</h3>
        <p>Duration: {{ results.metadata?.duration }}s</p>
        <p>Resolution: {{ results.metadata?.width }}x{{ results.metadata?.height }}</p>
      </div>` : '';

        return `<template>
  <div>
    <input
      type="file"
      accept="video/*"
      @change="handleFileChange"
      :disabled="loading"
    />
    
    <p v-if="loading">Analyzing video...</p>
    
    <div v-if="results">
      ${thumbnailsCode}${scenesCode}${colorsCode}${metadataCode}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import videoIntel from 'videointel';

const results = ref(null);
const loading = ref(false);

const handleFileChange = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  loading.value = true;
  try {
    const analysisResults = await videoIntel.analyze(file${optionsStr});
    results.value = analysisResults;
  } catch (error) {
    console.error('Analysis failed:', error);
  } finally {
    loading.value = false;
  }
};
</script>`;
      }

      default:
        return '';
    }
  };

  const code = generateCode();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    // Track code copy event
    trackCodeCopy(`playground-generated-${framework}`);
  };

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <FiCode className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Generated Code
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={framework}
            onChange={(e) => setFramework(e.target.value as any)}
            className="text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="typescript">TypeScript</option>
            <option value="javascript">JavaScript</option>
            <option value="react">React</option>
            <option value="vue">Vue</option>
          </select>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
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
      </div>
      <div className="relative">
        <pre className="overflow-x-auto p-4 text-sm bg-gray-900 text-gray-100 rounded-b-lg">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}


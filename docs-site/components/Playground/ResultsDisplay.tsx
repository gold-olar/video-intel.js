'use client';

import { useState } from 'react';
import { FiImage, FiFilm, FiDroplet, FiInfo, FiActivity, FiDownload, FiCopy, FiCheck } from 'react-icons/fi';

interface Thumbnail {
  dataUrl: string;
  timestamp: number;
  quality: number;
}

interface Scene {
  timestamp?: number; // For display
  start?: number; // From library
  end?: number;
  score?: number; // For display
  confidence?: number; // From library
}

interface Color {
  hex: string;
  rgb: [number, number, number];
  percentage: number;
}

interface AnalysisResults {
  thumbnails?: Thumbnail[];
  scenes?: Scene[];
  colors?: Color[];
  metadata?: {
    duration: number;
    width: number;
    height: number;
    frameRate: number;
    size: number;
  };
  performance?: {
    totalTime: number;
    thumbnailTime?: number;
    sceneTime?: number;
    colorTime?: number;
    metadataTime?: number;
  };
}

interface ResultsDisplayProps {
  results: AnalysisResults | null;
  loading: boolean;
}

export default function ResultsDisplay({ results, loading }: ResultsDisplayProps) {
  const [activeTab, setActiveTab] = useState<'thumbnails' | 'scenes' | 'colors' | 'metadata' | 'performance'>('thumbnails');
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          Analyzing video...
        </p>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-4">
          <FiActivity className="h-8 w-8 text-gray-400" />
        </div>
        <p className="mt-4 text-base font-medium text-gray-900 dark:text-white">
          No results yet
        </p>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Upload a video and configure features to start analysis
        </p>
      </div>
    );
  }

  const tabs = [
    { id: 'thumbnails' as const, name: 'Thumbnails', icon: FiImage, count: results.thumbnails?.length },
    { id: 'scenes' as const, name: 'Scenes', icon: FiFilm, count: results.scenes?.length },
    { id: 'colors' as const, name: 'Colors', icon: FiDroplet, count: results.colors?.length },
    { id: 'metadata' as const, name: 'Metadata', icon: FiInfo, count: results.metadata ? 1 : 0 },
    { id: 'performance' as const, name: 'Performance', icon: FiActivity, count: results.performance ? 1 : 0 },
  ];

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.name}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="rounded-full bg-gray-200 dark:bg-gray-700 px-2 py-0.5 text-xs">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'thumbnails' && results.thumbnails && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.thumbnails.map((thumb, index) => {
              const handleDownload = () => {
                const link = document.createElement('a');
                link.href = thumb.dataUrl;
                link.download = `thumbnail-${index + 1}-${(thumb.timestamp || 0).toFixed(2)}s.jpg`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              };

              return (
                <div key={index} className="group relative rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900">
                  <img src={thumb.dataUrl} alt={`Thumbnail ${index + 1}`} className="w-full h-auto" />
                  <div className="p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        {(thumb.timestamp || 0).toFixed(2)}s
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        Score: {(thumb.quality || 0).toFixed(2)}
                      </span>
                    </div>
                    <button 
                      onClick={handleDownload}
                      className="mt-2 w-full flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 transition-colors"
                    >
                      <FiDownload className="h-3 w-3" />
                      Download
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'scenes' && results.scenes && (
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Score
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-950 divide-y divide-gray-200 dark:divide-gray-800">
                  {results.scenes.map((scene, index) => {
                    const timestamp = scene.timestamp ?? scene.start ?? 0;
                    const score = scene.score ?? scene.confidence ?? 0;
                    return (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {timestamp.toFixed(2)}s
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {(score * 100).toFixed(0)}% {/* Convert 0-1 to percentage */}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'colors' && results.colors && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.colors.map((color, index) => (
              <div key={index} className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900 p-4">
                <div
                  className="w-full h-24 rounded-lg mb-3"
                  style={{ backgroundColor: color.hex }}
                />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {color.hex}
                    </span>
                    <button
                      onClick={() => handleCopy(color.hex)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {copied ? <FiCheck className="h-4 w-4" /> : <FiCopy className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    RGB: {color.rgb.join(', ')}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Usage: {(color.percentage || 0).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'metadata' && results.metadata && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 overflow-hidden">
            <pre className="p-6 text-sm overflow-x-auto">
              <code className="text-gray-900 dark:text-gray-100">
                {JSON.stringify(results.metadata, null, 2)}
              </code>
            </pre>
          </div>
        )}

        {activeTab === 'performance' && results.performance && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
                <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                  {(results.performance.totalTime / 1000).toFixed(2)}s
                </div>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Total Analysis Time
                </div>
              </div>
              {results.performance.thumbnailTime && (
                <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
                  <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                    {(results.performance.thumbnailTime / 1000).toFixed(2)}s
                  </div>
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Thumbnail Generation
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


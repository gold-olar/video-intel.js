'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FiArrowLeft, FiPlay } from 'react-icons/fi';
import VideoUploader from '@/components/Playground/VideoUploader';
import FeatureSelector, { AnalysisConfig } from '@/components/Playground/FeatureSelector';
import ResultsDisplay from '@/components/Playground/ResultsDisplay';
import Footer from '@/components/Landing/Footer';

export default function PlaygroundPage() {
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [config, setConfig] = useState<AnalysisConfig>({
    thumbnails: {
      enabled: true,
      count: 5,
      quality: 0.8,
    },
    scenes: {
      enabled: true,
      threshold: 30,
    },
    colors: {
      enabled: true,
      count: 5,
    },
    metadata: true,
  });
  const [results, setResults] = useState<{
    thumbnails?: Array<{ dataUrl: string; timestamp: number; quality: number }>;
    scenes?: Array<{ timestamp: number; score: number }>;
    colors?: Array<{ hex: string; rgb: [number, number, number]; percentage: number }>;
    metadata?: { duration: number; width: number; height: number; frameRate: number; size: number };
    performance?: { totalTime: number; thumbnailTime?: number; sceneTime?: number; colorTime?: number; metadataTime?: number };
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!selectedVideo) return;

    setLoading(true);
    setError(null);

    try {
      // Mock analysis for now - replace with actual VideoIntel integration
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const mockResults = {
        thumbnails: config.thumbnails.enabled
          ? Array.from({ length: config.thumbnails.count }, (_, i) => ({
              dataUrl: `https://via.placeholder.com/640x360?text=Thumbnail+${i + 1}`,
              timestamp: (i + 1) * 2,
              quality: 0.8 + Math.random() * 0.2,
            }))
          : undefined,
        scenes: config.scenes.enabled
          ? Array.from({ length: 4 }, (_, i) => ({
              timestamp: (i + 1) * 3,
              score: 50 + Math.random() * 50,
            }))
          : undefined,
        colors: config.colors.enabled
          ? [
              { hex: '#FF6B6B', rgb: [255, 107, 107] as [number, number, number], percentage: 35 },
              { hex: '#4ECDC4', rgb: [78, 205, 196] as [number, number, number], percentage: 25 },
              { hex: '#45B7D1', rgb: [69, 183, 209] as [number, number, number], percentage: 20 },
              { hex: '#FFA07A', rgb: [255, 160, 122] as [number, number, number], percentage: 12 },
              { hex: '#98D8C8', rgb: [152, 216, 200] as [number, number, number], percentage: 8 },
            ].slice(0, config.colors.count)
          : undefined,
        metadata: config.metadata
          ? {
              duration: 30,
              width: 1920,
              height: 1080,
              frameRate: 30,
              size: selectedVideo.size,
            }
          : undefined,
        performance: {
          totalTime: 2000,
          thumbnailTime: 800,
          sceneTime: 600,
          colorTime: 400,
          metadataTime: 200,
        },
      };

      setResults(mockResults);
    } catch (err) {
      setError('Failed to analyze video. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const hasAnyFeatureEnabled =
    config.thumbnails.enabled ||
    config.scenes.enabled ||
    config.colors.enabled ||
    config.metadata;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                <FiArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-700" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Interactive Playground
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
                <span className="text-lg font-bold text-white">VI</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <p className="text-base text-gray-600 dark:text-gray-300">
            Upload a video and configure analysis features to see VideoIntel in action.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Input */}
          <div className="lg:col-span-1 space-y-6">
            {/* Video Upload */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                1. Upload Video
              </h2>
              <VideoUploader
                onVideoSelect={setSelectedVideo}
                selectedVideo={selectedVideo}
                onClear={() => {
                  setSelectedVideo(null);
                  setResults(null);
                }}
              />
            </div>

            {/* Feature Selection */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                2. Configure Features
              </h2>
              <FeatureSelector config={config} onChange={setConfig} />
            </div>

            {/* Analyze Button */}
            <button
              onClick={handleAnalyze}
              disabled={!selectedVideo || !hasAnyFeatureEnabled || loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-4 text-base font-semibold text-white shadow-lg hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600"
            >
              <FiPlay className="h-5 w-5" />
              {loading ? 'Analyzing...' : 'Analyze Video'}
            </button>

            {error && (
              <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-2">
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                3. View Results
              </h2>
              <ResultsDisplay results={results} loading={loading} />
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-6">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
            🔒 Privacy Notice
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            All video processing happens directly in your browser. Your videos never leave your device
            and are not uploaded to any server. This ensures complete privacy and security.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}


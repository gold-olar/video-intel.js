'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FiArrowLeft, FiPlay } from 'react-icons/fi';
import VideoUploader from '@/components/Playground/VideoUploader';
import FeatureSelector, { AnalysisConfig } from '@/components/Playground/FeatureSelector';
import ResultsDisplay from '@/components/Playground/ResultsDisplay';
import CodeGenerator from '@/components/Playground/CodeGenerator';
import PerformanceMetrics from '@/components/Playground/PerformanceMetrics';
import Footer from '@/components/Landing/Footer';
import { loadVideoIntel } from '@/utils/videoIntelLoader';
import { trackPlaygroundAction, trackVideoProcessing } from '@/lib/analytics';

export default function PlaygroundPage() {
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [libraryLoaded, setLibraryLoaded] = useState<boolean | null>(null);
  const [config, setConfig] = useState<AnalysisConfig>({
    thumbnails: {
      enabled: true,
      count: 5,
      quality: 0.8,
    },
    scenes: {
      enabled: true,
      threshold: 15, // Lower default for better scene detection
    },
    colors: {
      enabled: true,
      count: 5,
    },
    faces: {
      enabled: false,
      confidence: 0.7,
      returnCoordinates: true,
      returnThumbnails: true,
      thumbnailFormat: 'jpeg',
      thumbnailQuality: 0.8,
      samplingRate: 2,
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
    
    // Track analysis start
    const enabledFeatures = [];
    if (config.thumbnails.enabled) enabledFeatures.push('thumbnails');
    if (config.scenes.enabled) enabledFeatures.push('scenes');
    if (config.colors.enabled) enabledFeatures.push('colors');
    if (config.faces.enabled) enabledFeatures.push('faces');
    if (config.metadata) enabledFeatures.push('metadata');
    
    trackPlaygroundAction('start', {
      features: enabledFeatures.join(','),
      file_size: selectedVideo.size,
    });

    try {
      // Load VideoIntel library
      const videoIntel = await loadVideoIntel();

      // Initialize (worker pool warnings in console are expected and safe to ignore)
      try {
        await videoIntel.init({ workers: 0 });
      } catch (initError) {
        // Init errors are non-critical, continue with analysis
      }

      const startTime = performance.now();
      const timings: { [key: string]: number } = {};

      // Build analysis options
      const analysisOptions: any = {};

      if (config.thumbnails.enabled) {
        analysisOptions.thumbnails = {
          count: config.thumbnails.count,
          quality: config.thumbnails.quality,
        };
      }

      if (config.scenes.enabled) {
        analysisOptions.scenes = {
          // Convert threshold from 0-100 UI range to 0-1 library range
          threshold: config.scenes.threshold / 100,
        };
      }

      if (config.colors.enabled) {
        analysisOptions.colors = {
          count: config.colors.count,
        };
      }

      if (config.faces.enabled) {
        analysisOptions.faces = {
          confidence: config.faces.confidence,
          returnCoordinates: config.faces.returnCoordinates,
          returnThumbnails: config.faces.returnThumbnails,
          thumbnailFormat: config.faces.thumbnailFormat,
          thumbnailQuality: config.faces.thumbnailQuality,
          samplingRate: config.faces.samplingRate,
        };
      }

      if (config.metadata) {
        analysisOptions.metadata = true;
      }

      // Perform analysis
      const analysisResult = await videoIntel.analyze(selectedVideo, analysisOptions);

      const totalTime = performance.now() - startTime;

      // Convert thumbnail Blobs to data URLs for display
      let thumbnails = analysisResult.thumbnails;
      if (thumbnails && thumbnails.length > 0) {
        thumbnails = await Promise.all(
          thumbnails.map(async (thumb: any) => {
            // Convert Blob to data URL
            const dataUrl = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(thumb.image);
            });

            return {
              dataUrl,
              timestamp: thumb.timestamp,
              quality: thumb.score, // Map 'score' to 'quality'
              width: thumb.width,
              height: thumb.height,
            };
          })
        );
      }

      // Extract timing information (if available from library)
      const results = {
        thumbnails,
        scenes: analysisResult.scenes,
        colors: analysisResult.colors,
        faces: analysisResult.faces,
        metadata: analysisResult.metadata,
        performance: {
          totalTime: Math.round(totalTime),
          thumbnailTime: analysisResult.performance?.thumbnailTime,
          sceneTime: analysisResult.performance?.sceneTime,
          colorTime: analysisResult.performance?.colorTime,
          faceTime: analysisResult.performance?.faceTime,
          metadataTime: analysisResult.performance?.metadataTime,
        },
      };

      setResults(results);
      
      // Track successful analysis completion
      trackPlaygroundAction('complete', {
        total_time: results.performance.totalTime,
        features: enabledFeatures.join(','),
      });
      
      // Track detailed video processing metrics
      trackVideoProcessing({
        duration: results.metadata?.duration,
        fileSize: selectedVideo.size,
        features: enabledFeatures,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze video';
      setError(errorMessage);
      console.error('Analysis error:', err);
      
      // Check if it's a library loading error
      if (errorMessage.includes('VideoIntel library could not be loaded')) {
        setLibraryLoaded(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const hasAnyFeatureEnabled =
    config.thumbnails.enabled ||
    config.scenes.enabled ||
    config.colors.enabled ||
    config.faces.enabled ||
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

        {/* Code Generator */}
        {results && (
          <div className="mt-8">
            <CodeGenerator config={config} videoFileName={selectedVideo?.name} />
          </div>
        )}

        {/* Performance Metrics - Alternative View */}
        {results && results.performance && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Detailed Performance Metrics
            </h2>
            <PerformanceMetrics 
              performance={results.performance} 
              metadata={results.metadata}
            />
          </div>
        )}

        {/* Library Status Warning */}
        {libraryLoaded === false && (
          <div className="mt-8 rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30 p-6">
            <h3 className="text-sm font-semibold text-orange-900 dark:text-orange-100 mb-2">
              ⚠️ VideoIntel Library Not Available
            </h3>
            <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
              The VideoIntel library needs to be built before the playground can function.
            </p>
            <div className="text-sm text-orange-700 dark:text-orange-300">
              <p className="font-semibold mb-2">To fix this:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Open a terminal in the project root directory</li>
                <li>Run: <code className="bg-orange-900/20 px-2 py-0.5 rounded">npm run build</code></li>
                <li>Restart the dev server: <code className="bg-orange-900/20 px-2 py-0.5 rounded">npm run dev</code></li>
                <li>Refresh this page</li>
              </ol>
            </div>
          </div>
        )}

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


'use client';

import { useState, useEffect } from 'react';
import { FiImage, FiFilm, FiDroplet, FiInfo, FiActivity, FiDownload, FiCopy, FiCheck, FiUser } from 'react-icons/fi';

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

interface Face {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  thumbnail?: Blob;
}

interface FaceFrame {
  timestamp: number;
  faces: Face[];
}

interface FaceDetection {
  detected: boolean;
  averageCount: number;
  frames: FaceFrame[];
}

interface AnalysisResults {
  thumbnails?: Thumbnail[];
  scenes?: Scene[];
  colors?: Color[];
  faces?: FaceDetection;
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
    faceTime?: number;
    metadataTime?: number;
  };
}

interface ResultsDisplayProps {
  results: AnalysisResults | null;
  loading: boolean;
}

export default function ResultsDisplay({ results, loading }: ResultsDisplayProps) {
  const [activeTab, setActiveTab] = useState<'thumbnails' | 'scenes' | 'colors' | 'faces' | 'metadata' | 'performance'>('thumbnails');
  const [copied, setCopied] = useState(false);
  const [faceImageUrls, setFaceImageUrls] = useState<Map<string, string>>(new Map());

  // Create object URLs for face thumbnails - MUST be before any conditional returns
  useEffect(() => {
    if (!results?.faces) {
      setFaceImageUrls(new Map());
      return;
    }

    const urls = new Map<string, string>();
    results.faces.frames.forEach((frame, frameIdx) => {
      frame.faces.forEach((face, faceIdx) => {
        if (face.thumbnail) {
          const key = `${frameIdx}-${faceIdx}`;
          urls.set(key, URL.createObjectURL(face.thumbnail));
        }
      });
    });

    setFaceImageUrls(urls);

    // Cleanup function
    return () => {
      urls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [results?.faces]);

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

  // Calculate total faces count
  // Note: If returnCoordinates is false, frames will be empty, so we can't count individual faces
  // In that case, we show the averageCount instead
  const totalFaces = results?.faces?.frames.reduce((sum, frame) => sum + frame.faces.length, 0) || 0;

  const tabs = [
    { id: 'thumbnails' as const, name: 'Thumbnails', icon: FiImage, count: results.thumbnails?.length },
    { id: 'scenes' as const, name: 'Scenes', icon: FiFilm, count: results.scenes?.length },
    { id: 'colors' as const, name: 'Colors', icon: FiDroplet, count: results.colors?.length },
    { id: 'faces' as const, name: 'Faces', icon: FiUser, count: results.faces ? totalFaces : 0 },
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
            {/* Warning for videos with few or no scene changes */}
            {results.scenes.length <= 2 && (
              <div className="rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/30 p-4">
                <div className="flex items-start gap-3">
                  <div className="text-yellow-600 dark:text-yellow-400 text-lg">⚠️</div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                      {results.scenes.length === 1 ? 'No Scene Changes Detected' : 'Limited Scene Changes Detected'}
                    </h4>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-2">
                      {results.scenes.length === 1 
                        ? 'The entire video appears to be one continuous scene.'
                        : 'Only the start and end of the video were detected as scenes.'}
                    </p>
                    <div className="text-xs text-yellow-700 dark:text-yellow-300">
                      <p className="font-semibold mb-1">Try these solutions:</p>
                      <ul className="list-disc list-inside space-y-0.5 ml-2">
                        <li><strong>Lower the threshold</strong> to 5-10% in the configuration panel</li>
                        <li>Ensure your video has actual scene changes (cuts, transitions)</li>
                        <li>Videos with continuous shots may not have detectable scene boundaries</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
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
                      Confidence
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

        {activeTab === 'faces' && results.faces && (
          <div className="space-y-6">
            {/* Face Detection Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Faces Detected
                </div>
                <div className={`text-3xl font-bold ${results.faces.detected ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                  {results.faces.detected ? 'Yes' : 'No'}
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Average per Frame
                </div>
                <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                  {results.faces.averageCount.toFixed(1)}
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Total Faces Found
                </div>
                <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                  {totalFaces}
                </div>
              </div>
            </div>

            {/* Face Thumbnails Gallery */}
            {results.faces.frames.length > 0 && results.faces.frames.some(f => f.faces.some(face => face.thumbnail)) && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Face Gallery ({totalFaces} faces)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
                  {results.faces.frames.map((frame, frameIdx) =>
                    frame.faces.map((face, faceIdx) => {
                      const key = `${frameIdx}-${faceIdx}`;
                      const imageUrl = faceImageUrls.get(key);
                      
                      if (!face.thumbnail || !imageUrl) return null;

                      const handleDownloadFace = () => {
                        const link = document.createElement('a');
                        link.href = imageUrl;
                        link.download = `face-${frameIdx}-${faceIdx}-${frame.timestamp.toFixed(1)}s.jpg`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      };

                      return (
                        <div key={key} className="group relative rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900">
                          <img src={imageUrl} alt={`Face ${faceIdx + 1}`} className="w-full h-auto" />
                          
                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-0 left-0 right-0 p-3">
                              <div className="text-white text-xs space-y-1 mb-2">
                                <div className="font-semibold">Face #{frameIdx * frame.faces.length + faceIdx + 1}</div>
                                <div>Time: {frame.timestamp.toFixed(1)}s</div>
                                <div>Confidence: {(face.confidence * 100).toFixed(0)}%</div>
                                <div>Size: {face.width}×{face.height}</div>
                              </div>
                              <button
                                onClick={handleDownloadFace}
                                className="w-full flex items-center justify-center gap-1 rounded bg-white/20 hover:bg-white/30 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm transition-colors"
                              >
                                <FiDownload className="h-3 w-3" />
                                Download
                              </button>
                            </div>
                          </div>

                          {/* Confidence Badge */}
                          <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-medium bg-black/60 text-white">
                            {(face.confidence * 100).toFixed(0)}%
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Frame-by-Frame Data Table (when coordinates but no thumbnails) */}
            {results.faces.frames.length > 0 && !results.faces.frames.some(f => f.faces.some(face => face.thumbnail)) && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Detection Timeline
                </h3>
                <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Timestamp
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Faces Found
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Avg Confidence
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-950 divide-y divide-gray-200 dark:divide-gray-800">
                      {results.faces.frames.map((frame, index) => {
                        const avgConfidence = frame.faces.reduce((sum, f) => sum + f.confidence, 0) / frame.faces.length;
                        return (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {frame.timestamp.toFixed(2)}s
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {frame.faces.length}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {(avgConfidence * 100).toFixed(0)}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* No faces with coordinates warning */}
            {results.faces.detected && results.faces.frames.length === 0 && (
              <div className="rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/30 p-6">
                <div className="flex items-start gap-3">
                  <div className="text-yellow-600 dark:text-yellow-400 text-lg">⚠️</div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                      Faces Detected, But No Details Available
                    </h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-2">
                      <strong>Average {results.faces.averageCount.toFixed(1)} face(s) per frame were detected</strong>, 
                      but coordinate details are not available because <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">returnCoordinates</code> was disabled.
                    </p>
                    <div className="text-xs text-yellow-700 dark:text-yellow-300">
                      <p className="font-semibold mb-1">To see face details:</p>
                      <ul className="list-disc list-inside space-y-0.5 ml-2">
                        <li>Enable <strong>Return Coordinates</strong> in the face detection configuration</li>
                        <li>Optionally enable <strong>Extract Face Thumbnails</strong> to see cropped face images</li>
                        <li>Run the analysis again</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* No faces detected message */}
            {!results.faces.detected && (
              <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-8 text-center">
                <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-4 inline-block mb-4">
                  <FiUser className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-base font-medium text-gray-900 dark:text-white mb-2">
                  No Faces Detected
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No faces were found in the analyzed frames. Try adjusting the confidence threshold or using a video with visible faces.
                </p>
              </div>
            )}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
              {results.performance.sceneTime && (
                <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
                  <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                    {(results.performance.sceneTime / 1000).toFixed(2)}s
                  </div>
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Scene Detection
                  </div>
                </div>
              )}
              {results.performance.colorTime && (
                <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
                  <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                    {(results.performance.colorTime / 1000).toFixed(2)}s
                  </div>
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Color Extraction
                  </div>
                </div>
              )}
              {results.performance.faceTime && (
                <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
                  <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                    {(results.performance.faceTime / 1000).toFixed(2)}s
                  </div>
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Face Detection
                  </div>
                </div>
              )}
              {results.performance.metadataTime && (
                <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
                  <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                    {(results.performance.metadataTime / 1000).toFixed(2)}s
                  </div>
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Metadata Extraction
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


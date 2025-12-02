'use client';

import { FiImage, FiFilm, FiDroplet, FiInfo, FiUser } from 'react-icons/fi';

export interface AnalysisConfig {
  thumbnails: {
    enabled: boolean;
    count: number;
    quality: number;
  };
  scenes: {
    enabled: boolean;
    threshold: number;
  };
  colors: {
    enabled: boolean;
    count: number;
  };
  faces: {
    enabled: boolean;
    confidence: number;
    returnCoordinates: boolean;
    returnThumbnails: boolean;
    thumbnailFormat: 'jpeg' | 'png';
    thumbnailQuality: number;
    samplingRate: number;
  };
  metadata: boolean;
}

interface FeatureSelectorProps {
  config: AnalysisConfig;
  onChange: (config: AnalysisConfig) => void;
}

export default function FeatureSelector({ config, onChange }: FeatureSelectorProps) {
  const updateConfig = (updates: Partial<AnalysisConfig>) => {
    onChange({ ...config, ...updates });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Select Features
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Choose which analysis features to run on your video.
        </p>
      </div>

      {/* Thumbnails */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-100 dark:bg-indigo-950/50 p-2">
              <FiImage className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                Generate Thumbnails
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Auto-select best frames based on sharpness, brightness & color
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.thumbnails.enabled}
              onChange={(e) =>
                updateConfig({
                  thumbnails: { ...config.thumbnails, enabled: e.target.checked },
                })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        {config.thumbnails.enabled && (
          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-800">
            <div>
              <label className="flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Number of Thumbnails: {config.thumbnails.count}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={config.thumbnails.count}
                onChange={(e) =>
                  updateConfig({
                    thumbnails: { ...config.thumbnails, count: parseInt(e.target.value) },
                  })
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                How many thumbnails to generate from the video
              </p>
            </div>
            <div>
              <label className="flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <span>Image Compression Quality: {config.thumbnails.quality.toFixed(1)}</span>
              </label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={config.thumbnails.quality}
                onChange={(e) =>
                  updateConfig({
                    thumbnails: { ...config.thumbnails, quality: parseFloat(e.target.value) },
                  })
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                <span className="font-medium">Note:</span> This controls JPEG compression quality (file size vs image quality), not which frames are selected. All frames are scored, and the best ones are automatically chosen.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Scene Detection */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 dark:bg-purple-950/50 p-2">
              <FiFilm className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                Detect Scenes
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Identify scene changes in video
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.scenes.enabled}
              onChange={(e) =>
                updateConfig({
                  scenes: { ...config.scenes, enabled: e.target.checked },
                })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
          </label>
        </div>

        {config.scenes.enabled && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <span>Threshold</span>
              <span className="font-mono text-purple-600 dark:text-purple-400">{config.scenes.threshold}%</span>
            </label>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={config.scenes.threshold}
              onChange={(e) =>
                updateConfig({
                  scenes: { ...config.scenes, threshold: parseInt(e.target.value) },
                })
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
              <span>More sensitive (5%)</span>
              <span>Less sensitive (50%)</span>
            </div>
            <div className="mt-3 p-2 bg-purple-50 dark:bg-purple-950/30 rounded border border-purple-200 dark:border-purple-800">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                <strong className="text-purple-600 dark:text-purple-400">Tip:</strong> Start with 10-15% for videos with subtle scene changes. Use 25-30% for videos with clear, distinct cuts.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Color Extraction */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 dark:bg-green-950/50 p-2">
              <FiDroplet className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                Extract Colors
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Get dominant color palette
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.colors.enabled}
              onChange={(e) =>
                updateConfig({
                  colors: { ...config.colors, enabled: e.target.checked },
                })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
          </label>
        </div>

        {config.colors.enabled && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color Count: {config.colors.count}
            </label>
            <input
              type="range"
              min="3"
              max="10"
              value={config.colors.count}
              onChange={(e) =>
                updateConfig({
                  colors: { ...config.colors, count: parseInt(e.target.value) },
                })
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
          </div>
        )}
      </div>

      {/* Face Detection */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-pink-100 dark:bg-pink-950/50 p-2">
              <FiUser className="h-5 w-5 text-pink-600 dark:text-pink-400" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                Detect Faces
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Find faces with optional bounding boxes & thumbnails
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.faces.enabled}
              onChange={(e) =>
                updateConfig({
                  faces: { ...config.faces, enabled: e.target.checked },
                })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 dark:peer-focus:ring-pink-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-pink-600"></div>
          </label>
        </div>

        {config.faces.enabled && (
          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-800">
            <div>
              <label className="flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <span>Confidence Threshold</span>
                <span className="font-mono text-pink-600 dark:text-pink-400">{config.faces.confidence.toFixed(1)}</span>
              </label>
              <input
                type="range"
                min="0.5"
                max="0.95"
                step="0.05"
                value={config.faces.confidence}
                onChange={(e) =>
                  updateConfig({
                    faces: { ...config.faces, confidence: parseFloat(e.target.value) },
                  })
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                <span>More faces (0.5)</span>
                <span>High confidence (0.95)</span>
              </div>
            </div>

            <div>
              <label className="flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sampling Rate: {config.faces.samplingRate}s
              </label>
              <input
                type="range"
                min="0.5"
                max="5"
                step="0.5"
                value={config.faces.samplingRate}
                onChange={(e) =>
                  updateConfig({
                    faces: { ...config.faces, samplingRate: parseFloat(e.target.value) },
                  })
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                How often to check for faces (in seconds)
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Return Coordinates
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Get bounding box positions
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.faces.returnCoordinates}
                  onChange={(e) =>
                    updateConfig({
                      faces: { 
                        ...config.faces, 
                        returnCoordinates: e.target.checked,
                        // Disable thumbnails if coordinates are disabled
                        returnThumbnails: e.target.checked ? config.faces.returnThumbnails : false
                      },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 dark:peer-focus:ring-pink-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-pink-600"></div>
              </label>
            </div>

            {config.faces.returnCoordinates && (
              <div className="pl-4 border-l-2 border-pink-200 dark:border-pink-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Extract Face Thumbnails
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Crop detected faces as images
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.faces.returnThumbnails}
                      onChange={(e) =>
                        updateConfig({
                          faces: { ...config.faces, returnThumbnails: e.target.checked },
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 dark:peer-focus:ring-pink-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-pink-600"></div>
                  </label>
                </div>

                {config.faces.returnThumbnails && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                        Thumbnail Format
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            updateConfig({
                              faces: { ...config.faces, thumbnailFormat: 'jpeg' },
                            })
                          }
                          className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                            config.faces.thumbnailFormat === 'jpeg'
                              ? 'border-pink-600 bg-pink-50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400'
                              : 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          JPEG
                        </button>
                        <button
                          onClick={() =>
                            updateConfig({
                              faces: { ...config.faces, thumbnailFormat: 'png' },
                            })
                          }
                          className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                            config.faces.thumbnailFormat === 'png'
                              ? 'border-pink-600 bg-pink-50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400'
                              : 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          PNG
                        </button>
                      </div>
                    </div>

                    {config.faces.thumbnailFormat === 'jpeg' && (
                      <div>
                        <label className="flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          <span>Thumbnail Quality</span>
                          <span className="font-mono text-pink-600 dark:text-pink-400">{config.faces.thumbnailQuality.toFixed(1)}</span>
                        </label>
                        <input
                          type="range"
                          min="0.5"
                          max="1"
                          step="0.1"
                          value={config.faces.thumbnailQuality}
                          onChange={(e) =>
                            updateConfig({
                              faces: { ...config.faces, thumbnailQuality: parseFloat(e.target.value) },
                            })
                          }
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Higher quality = larger file size
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="mt-3 p-2 bg-pink-50 dark:bg-pink-950/30 rounded border border-pink-200 dark:border-pink-800">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                <strong className="text-pink-600 dark:text-pink-400">Note:</strong> Face detection uses AI models (~2MB) loaded on first use. Enable thumbnails to see detected faces visually.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-100 dark:bg-orange-950/50 p-2">
              <FiInfo className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                Get Metadata
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Extract video information
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.metadata}
              onChange={(e) => updateConfig({ metadata: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 dark:peer-focus:ring-orange-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-orange-600"></div>
          </label>
        </div>
      </div>
    </div>
  );
}


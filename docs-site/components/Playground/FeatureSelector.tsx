'use client';

import { FiImage, FiFilm, FiDroplet, FiInfo } from 'react-icons/fi';

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
                Extract smart thumbnails from video
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
                Count: {config.thumbnails.count}
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
            </div>
            <div>
              <label className="flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quality: {config.thumbnails.quality.toFixed(1)}
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
              Sensitivity: {config.scenes.threshold}
            </label>
            <input
              type="range"
              min="10"
              max="100"
              value={config.scenes.threshold}
              onChange={(e) =>
                updateConfig({
                  scenes: { ...config.scenes, threshold: parseInt(e.target.value) },
                })
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Lower values detect more subtle changes
            </p>
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


'use client';

import { FiClock, FiCpu, FiActivity, FiZap } from 'react-icons/fi';

interface PerformanceMetricsProps {
  performance?: {
    totalTime: number;
    thumbnailTime?: number;
    sceneTime?: number;
    colorTime?: number;
    metadataTime?: number;
  };
  metadata?: {
    duration: number;
    width: number;
    height: number;
    size: number;
  };
}

export default function PerformanceMetrics({ performance, metadata }: PerformanceMetricsProps) {
  if (!performance) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <FiActivity className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>Performance metrics will appear here after analysis</p>
      </div>
    );
  }

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const calculateSpeed = () => {
    if (!metadata) return null;
    const videoDuration = metadata.duration;
    const processingTime = performance.totalTime / 1000;
    return (videoDuration / processingTime).toFixed(2);
  };

  const getSpeedRating = () => {
    const speed = calculateSpeed();
    if (!speed) return null;
    const speedNum = parseFloat(speed);
    if (speedNum > 5) return { label: 'Excellent', color: 'text-green-600 dark:text-green-400' };
    if (speedNum > 2) return { label: 'Good', color: 'text-blue-600 dark:text-blue-400' };
    if (speedNum > 1) return { label: 'Fair', color: 'text-yellow-600 dark:text-yellow-400' };
    return { label: 'Slow', color: 'text-orange-600 dark:text-orange-400' };
  };

  const speed = calculateSpeed();
  const speedRating = getSpeedRating();

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-gray-900 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-100 dark:bg-indigo-900/50 p-2">
              <FiClock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Total Time</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {formatTime(performance.totalTime)}
              </p>
            </div>
          </div>
        </div>

        {speed && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-gray-900 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 dark:bg-green-900/50 p-2">
                <FiZap className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Speed</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {speed}x
                </p>
              </div>
            </div>
          </div>
        )}

        {metadata && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-gray-900 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 dark:bg-blue-900/50 p-2">
                <FiActivity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Video Duration</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {metadata.duration.toFixed(1)}s
                </p>
              </div>
            </div>
          </div>
        )}

        {speedRating && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-gray-900 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 dark:bg-purple-900/50 p-2">
                <FiCpu className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Performance</p>
                <p className={`text-lg font-bold ${speedRating.color}`}>
                  {speedRating.label}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Breakdown */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
          Time Breakdown
        </h4>
        <div className="space-y-3">
          {performance.metadataTime !== undefined && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Metadata Extraction</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatTime(performance.metadataTime)}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${(performance.metadataTime / performance.totalTime) * 100}%` }}
                />
              </div>
            </div>
          )}

          {performance.thumbnailTime !== undefined && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Thumbnail Generation</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatTime(performance.thumbnailTime)}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-indigo-500 h-2 rounded-full"
                  style={{ width: `${(performance.thumbnailTime / performance.totalTime) * 100}%` }}
                />
              </div>
            </div>
          )}

          {performance.sceneTime !== undefined && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Scene Detection</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatTime(performance.sceneTime)}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${(performance.sceneTime / performance.totalTime) * 100}%` }}
                />
              </div>
            </div>
          )}

          {performance.colorTime !== undefined && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Color Extraction</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatTime(performance.colorTime)}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full"
                  style={{ width: `${(performance.colorTime / performance.totalTime) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Additional Info */}
      {metadata && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Video Information
          </h4>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-600 dark:text-gray-400">Resolution</dt>
              <dd className="font-medium text-gray-900 dark:text-white">
                {metadata.width} × {metadata.height}
              </dd>
            </div>
            <div>
              <dt className="text-gray-600 dark:text-gray-400">File Size</dt>
              <dd className="font-medium text-gray-900 dark:text-white">
                {(metadata.size / 1024 / 1024).toFixed(2)} MB
              </dd>
            </div>
            <div>
              <dt className="text-gray-600 dark:text-gray-400">Processing Speed</dt>
              <dd className="font-medium text-gray-900 dark:text-white">
                {speed ? `${speed}x real-time` : 'N/A'}
              </dd>
            </div>
            <div>
              <dt className="text-gray-600 dark:text-gray-400">Efficiency</dt>
              <dd className="font-medium text-gray-900 dark:text-white">
                {metadata.duration > 0
                  ? `${((metadata.duration / (performance.totalTime / 1000)) * 100).toFixed(0)}%`
                  : 'N/A'}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}


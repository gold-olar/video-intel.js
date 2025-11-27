'use client';

import { useState } from 'react';
import { FiVideo, FiDownload } from 'react-icons/fi';
import { sampleVideos, fetchSampleVideo, type SampleVideo } from '@/utils/sampleVideos';

interface SampleVideoSelectorProps {
  onVideoSelect: (file: File) => void;
}

export default function SampleVideoSelector({ onVideoSelect }: SampleVideoSelectorProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelectSample = async (video: SampleVideo) => {
    setLoading(video.id);
    setError(null);

    try {
      const file = await fetchSampleVideo(video.url);
      onVideoSelect(file);
    } catch (err) {
      setError(`Failed to load ${video.name}`);
      console.error('Error loading sample video:', err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <FiVideo className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Or Try a Sample Video
        </h3>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        {sampleVideos.map((video) => (
          <button
            key={video.id}
            onClick={() => handleSelectSample(video)}
            disabled={loading !== null}
            className="w-full flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex-shrink-0">
              <div className="w-16 h-12 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                {loading === video.id ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600" />
                ) : (
                  <FiVideo className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {video.name}
                </h4>
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  {video.duration}s
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 truncate">
                {video.description}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                <span>{video.size}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          💡 <strong>Tip:</strong> Sample videos are loaded from the docs site and won't count
          towards your bandwidth limits.
        </p>
      </div>
    </div>
  );
}


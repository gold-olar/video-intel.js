'use client';

import { useCallback, useState } from 'react';
import { FiUpload, FiVideo, FiX } from 'react-icons/fi';

interface VideoUploaderProps {
  onVideoSelect: (file: File) => void;
  selectedVideo: File | null;
  onClear: () => void;
}

export default function VideoUploader({ onVideoSelect, selectedVideo, onClear }: VideoUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  const handleFileSelect = useCallback((file: File) => {
    onVideoSelect(file);
    const url = URL.createObjectURL(file);
    setVideoPreview(url);
  }, [onVideoSelect]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        handleFileSelect(file);
      }
    }
  }, [handleFileSelect]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleClear = () => {
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
      setVideoPreview(null);
    }
    onClear();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {!selectedVideo ? (
        <div
          className={`relative rounded-lg border-2 border-dashed transition-colors ${
            dragActive
              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/30'
              : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="video-upload"
            accept="video/*"
            onChange={handleChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="rounded-full bg-indigo-100 dark:bg-indigo-950/50 p-4">
              <FiUpload className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <p className="mt-4 text-base font-medium text-gray-900 dark:text-white">
              Drop your video here or click to browse
            </p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Supports MP4, WebM, and other common formats
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
            {videoPreview && (
              <video
                src={videoPreview}
                controls
                className="w-full h-auto max-h-96 bg-black"
              />
            )}
          </div>
          
          <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-indigo-100 dark:bg-indigo-950/50 p-2">
                <FiVideo className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {selectedVideo.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatFileSize(selectedVideo.size)} • {selectedVideo.type}
                </p>
              </div>
            </div>
            <button
              onClick={handleClear}
              className="rounded-lg p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Sample Videos (Optional) */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Or try a sample video:
        </p>
        <div className="flex flex-wrap gap-2">
          <button className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Sample 10s
          </button>
          <button className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Sample 30s
          </button>
          <button className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Scene Changes
          </button>
        </div>
      </div>
    </div>
  );
}


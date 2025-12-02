import DocsLayout from '@/components/Docs/DocsLayout';
import CodeBlock from '@/components/Shared/CodeBlock';

const tocItems = [
  { id: 'basic-integration', title: 'Basic Integration', level: 2 },
  { id: 'video-uploader', title: 'Video Uploader Component', level: 2 },
  { id: 'thumbnail-gallery', title: 'Thumbnail Gallery', level: 2 },
  { id: 'face-detection', title: 'Face Detection Integration', level: 2 },
  { id: 'face-gallery', title: 'Face Gallery Component', level: 2 },
  { id: 'progress-tracking', title: 'Progress Tracking', level: 2 },
  { id: 'error-handling', title: 'Error Handling', level: 2 },
];

export default function ReactIntegrationPage() {
  return (
    <DocsLayout tocItems={tocItems}>
      <h1>React Integration</h1>
      <p className="lead">
        Learn how to integrate VideoIntel.js into your React applications with practical examples
        and best practices.
      </p>

      <h2 id="basic-integration">Basic Integration</h2>
      <p>
        Here's a simple React component that uses VideoIntel to analyze videos:
      </p>

      <CodeBlock
        language="typescript"
        filename="VideoAnalyzer.tsx"
        code={`import { useState } from 'react';
import videoIntel, { type AnalysisResult } from 'videointel';

export default function VideoAnalyzer() {
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const analyzeVideo = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const result = await videoIntel.analyze(file, {
        thumbnails: { count: 5, quality: 0.8 },
        scenes: { threshold: 30 },
        colors: { count: 5 },
        metadata: true,
      });
      setResults(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze video');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Video Analyzer</h1>
      
      <div className="mb-6">
        <input
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          className="block w-full text-sm"
        />
      </div>

      <button
        onClick={analyzeVideo}
        disabled={!file || loading}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {loading ? 'Analyzing...' : 'Analyze Video'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded">
          {error}
        </div>
      )}

      {results && (
        <div className="mt-6 space-y-4">
          {results.thumbnails && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Thumbnails</h2>
              <div className="grid grid-cols-3 gap-4">
                {results.thumbnails.map((thumb, i) => (
                  <img
                    key={i}
                    src={thumb.dataUrl}
                    alt={\`Thumbnail \${i + 1}\`}
                    className="rounded shadow"
                  />
                ))}
              </div>
            </div>
          )}

          {results.colors && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Colors</h2>
              <div className="flex gap-2">
                {results.colors.map((color, i) => (
                  <div
                    key={i}
                    className="w-16 h-16 rounded"
                    style={{ backgroundColor: color.hex }}
                    title={\`\${color.hex} - \${color.percentage}%\`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}`}
      />

      <h2 id="video-uploader">Video Uploader Component</h2>
      <p>
        A reusable video uploader component with drag-and-drop support:
      </p>

      <CodeBlock
        language="typescript"
        filename="VideoUploader.tsx"
        code={`import { useCallback, useState } from 'react';

interface VideoUploaderProps {
  onVideoSelect: (file: File) => void;
  accept?: string;
  maxSizeMB?: number;
}

export default function VideoUploader({
  onVideoSelect,
  accept = 'video/*',
  maxSizeMB = 100,
}: VideoUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): boolean => {
    // Check file type
    if (!file.type.startsWith('video/')) {
      setError('Please select a valid video file');
      return false;
    }

    // Check file size
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      setError(\`File size exceeds \${maxSizeMB}MB limit\`);
      return false;
    }

    setError(null);
    return true;
  };

  const handleFile = (file: File) => {
    if (validateFile(file)) {
      onVideoSelect(file);
    }
  };

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

    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={\`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors \${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }\`}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="pointer-events-none">
          <p className="text-lg font-medium text-gray-700">
            Drag and drop your video here
          </p>
          <p className="mt-1 text-sm text-gray-500">
            or click to browse (max {maxSizeMB}MB)
          </p>
        </div>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}`}
      />

      <h2 id="thumbnail-gallery">Thumbnail Gallery</h2>
      <p>
        Display thumbnails in a responsive gallery with download functionality:
      </p>

      <CodeBlock
        language="typescript"
        filename="ThumbnailGallery.tsx"
        code={`import type { Thumbnail } from 'videointel';

interface ThumbnailGalleryProps {
  thumbnails: Thumbnail[];
  onThumbnailClick?: (thumbnail: Thumbnail, index: number) => void;
}

export default function ThumbnailGallery({
  thumbnails,
  onThumbnailClick,
}: ThumbnailGalleryProps) {
  const downloadThumbnail = (thumb: Thumbnail, index: number) => {
    const link = document.createElement('a');
    link.href = thumb.dataUrl;
    link.download = \`thumbnail-\${index + 1}.jpg\`;
    link.click();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return \`\${mins}:\${secs.toString().padStart(2, '0')}\`;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {thumbnails.map((thumb, index) => (
        <div
          key={index}
          className="group relative rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
        >
          <img
            src={thumb.dataUrl}
            alt={\`Thumbnail at \${formatTime(thumb.timestamp)}\`}
            className="w-full h-auto cursor-pointer"
            onClick={() => onThumbnailClick?.(thumb, index)}
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex items-center justify-between text-white">
                <div>
                  <div className="text-sm font-medium">
                    {formatTime(thumb.timestamp)}
                  </div>
                  <div className="text-xs opacity-80">
                    Quality: {(thumb.quality * 100).toFixed(0)}%
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadThumbnail(thumb, index);
                  }}
                  className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm backdrop-blur-sm transition-colors"
                >
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}`}
      />

      <h2 id="face-detection">Face Detection Integration</h2>
      <p>
        Integrate face detection into your React components with real-time results:
      </p>

      <CodeBlock
        language="typescript"
        filename="FaceDetectionComponent.tsx"
        code={`import { useState } from 'react';
import videoIntel, { type FaceDetection } from 'videointel';

export default function FaceDetectionComponent() {
  const [file, setFile] = useState<File | null>(null);
  const [faceResults, setFaceResults] = useState<FaceDetection | null>(null);
  const [loading, setLoading] = useState(false);

  const detectFaces = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const faces = await videoIntel.detectFaces(file, {
        confidence: 0.75,
        returnCoordinates: true,
        returnThumbnails: true,
        thumbnailFormat: 'jpeg',
        thumbnailQuality: 0.85
      });
      setFaceResults(faces);
    } catch (error) {
      console.error('Face detection failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Face Detection</h1>

      <div className="mb-6">
        <input
          type="file"
          accept="video/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm"
        />
      </div>

      <button
        onClick={detectFaces}
        disabled={!file || loading}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {loading ? 'Detecting Faces...' : 'Detect Faces'}
      </button>

      {faceResults && (
        <div className="mt-6">
          <div className="mb-4 p-4 bg-gray-100 rounded">
            <p><strong>Faces Detected:</strong> {faceResults.detected ? 'Yes' : 'No'}</p>
            <p><strong>Average Count:</strong> {faceResults.averageCount.toFixed(1)}</p>
            <p><strong>Frames Analyzed:</strong> {faceResults.frames.length}</p>
            <p><strong>Total Faces:</strong> {
              faceResults.frames.reduce((sum, f) => sum + f.faces.length, 0)
            }</p>
          </div>

          {faceResults.frames.length > 0 && (
            <div className="space-y-4">
              {faceResults.frames.map((frame, frameIdx) => (
                <div key={frameIdx} className="border rounded p-4">
                  <h3 className="font-semibold mb-2">
                    At {frame.timestamp.toFixed(1)}s - {frame.faces.length} face(s)
                  </h3>
                  <div className="grid grid-cols-4 gap-4">
                    {frame.faces.map((face, faceIdx) => (
                      <div key={faceIdx} className="relative">
                        {face.thumbnail && (
                          <div>
                            <img
                              src={URL.createObjectURL(face.thumbnail)}
                              alt={\`Face \${faceIdx + 1}\`}
                              className="rounded shadow"
                            />
                            <p className="text-xs text-center mt-1">
                              {(face.confidence * 100).toFixed(0)}% confidence
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}`}
      />

      <h2 id="face-gallery">Face Gallery Component</h2>
      <p>
        Create a reusable face gallery component with download functionality:
      </p>

      <CodeBlock
        language="typescript"
        filename="FaceGallery.tsx"
        code={`import { useEffect, useState } from 'react';
import type { FaceDetection, Face } from 'videointel';

interface FaceGalleryProps {
  faceResults: FaceDetection;
  onFaceClick?: (face: Face, timestamp: number) => void;
}

interface FaceItem {
  face: Face;
  timestamp: number;
  frameIndex: number;
  faceIndex: number;
}

export default function FaceGallery({ faceResults, onFaceClick }: FaceGalleryProps) {
  const [allFaces, setAllFaces] = useState<FaceItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'high-confidence'>('all');

  useEffect(() => {
    // Flatten all faces from all frames
    const faces: FaceItem[] = [];
    faceResults.frames.forEach((frame, frameIdx) => {
      frame.faces.forEach((face, faceIdx) => {
        faces.push({
          face,
          timestamp: frame.timestamp,
          frameIndex: frameIdx,
          faceIndex: faceIdx
        });
      });
    });
    setAllFaces(faces);

    // Cleanup object URLs on unmount
    return () => {
      faces.forEach(({ face }) => {
        if (face.thumbnail) {
          URL.revokeObjectURL(URL.createObjectURL(face.thumbnail));
        }
      });
    };
  }, [faceResults]);

  const filteredFaces = allFaces.filter(item => {
    if (filter === 'high-confidence') {
      return item.face.confidence >= 0.8;
    }
    return true;
  });

  const downloadFace = (face: Face, timestamp: number, index: number) => {
    if (!face.thumbnail) return;

    const url = URL.createObjectURL(face.thumbnail);
    const a = document.createElement('a');
    a.href = url;
    a.download = \`face-\${index}-\${timestamp.toFixed(1)}s.jpg\`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAll = () => {
    filteredFaces.forEach((item, index) => {
      setTimeout(() => {
        downloadFace(item.face, item.timestamp, index);
      }, index * 100); // Stagger downloads
    });
  };

  return (
    <div className="face-gallery">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">
            Face Gallery ({filteredFaces.length} faces)
          </h2>
          <p className="text-sm text-gray-600">
            Average: {faceResults.averageCount.toFixed(1)} faces per frame
          </p>
        </div>

        <div className="flex gap-4">
          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-2 border rounded text-sm"
          >
            <option value="all">All Faces</option>
            <option value="high-confidence">High Confidence Only</option>
          </select>

          {/* Download All Button */}
          <button
            onClick={downloadAll}
            className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            Download All ({filteredFaces.length})
          </button>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filteredFaces.map((item, index) => (
          <FaceCard
            key={\`\${item.frameIndex}-\${item.faceIndex}\`}
            item={item}
            index={index}
            onClick={() => onFaceClick?.(item.face, item.timestamp)}
            onDownload={() => downloadFace(item.face, item.timestamp, index)}
          />
        ))}
      </div>

      {filteredFaces.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No faces found matching the current filter.
        </div>
      )}
    </div>
  );
}

interface FaceCardProps {
  item: FaceItem;
  index: number;
  onClick: () => void;
  onDownload: () => void;
}

function FaceCard({ item, index, onClick, onDownload }: FaceCardProps) {
  const { face, timestamp } = item;

  if (!face.thumbnail) return null;

  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    const url = URL.createObjectURL(face.thumbnail!);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [face.thumbnail]);

  return (
    <div className="group relative rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow bg-white">
      <img
        src={imageUrl}
        alt={\`Face \${index + 1}\`}
        className="w-full h-auto cursor-pointer"
        onClick={onClick}
      />

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <div className="text-white space-y-1">
            <div className="text-xs font-medium">
              Face #{index + 1}
            </div>
            <div className="text-xs opacity-90">
              Time: {timestamp.toFixed(1)}s
            </div>
            <div className="text-xs opacity-90">
              Confidence: {(face.confidence * 100).toFixed(0)}%
            </div>
            <div className="text-xs opacity-90">
              Size: {face.width}×{face.height}
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
            className="mt-2 w-full px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-xs backdrop-blur-sm transition-colors"
          >
            Download
          </button>
        </div>
      </div>

      {/* Confidence Badge */}
      <div className="absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium bg-black/60 text-white">
        {(face.confidence * 100).toFixed(0)}%
      </div>
    </div>
  );
}

// Usage Example
function App() {
  const [faceResults, setFaceResults] = useState<FaceDetection | null>(null);

  const handleFileUpload = async (file: File) => {
    const faces = await videoIntel.detectFaces(file, {
      returnCoordinates: true,
      returnThumbnails: true,
      confidence: 0.7
    });
    setFaceResults(faces);
  };

  return (
    <div>
      {/* File upload UI */}
      {faceResults && (
        <FaceGallery
          faceResults={faceResults}
          onFaceClick={(face, timestamp) => {
            console.log(\`Clicked face at \${timestamp}s\`, face);
          }}
        />
      )}
    </div>
  );
}`}
      />

      <h2 id="progress-tracking">Progress Tracking</h2>
      <p>
        Track analysis progress with a custom hook:
      </p>

      <CodeBlock
        language="typescript"
        filename="useVideoAnalysis.ts"
        code={`import { useState, useCallback } from 'react';
import videoIntel, { type AnalysisOptions, type AnalysisResult } from 'videointel';

interface AnalysisState {
  loading: boolean;
  progress: number;
  status: string;
  results: AnalysisResult | null;
  error: Error | null;
}

export function useVideoAnalysis() {
  const [state, setState] = useState<AnalysisState>({
    loading: false,
    progress: 0,
    status: '',
    results: null,
    error: null,
  });

  const analyze = useCallback(async (file: File, options?: AnalysisOptions) => {
    setState({
      loading: true,
      progress: 0,
      status: 'Initializing...',
      results: null,
      error: null,
    });

    try {
      // Initialize
      await videoIntel.init();
      setState(prev => ({ ...prev, progress: 10, status: 'Loading video...' }));

      // Start analysis
      setState(prev => ({ ...prev, progress: 20, status: 'Analyzing video...' }));
      
      const results = await videoIntel.analyze(file, options);

      setState({
        loading: false,
        progress: 100,
        status: 'Complete',
        results,
        error: null,
      });

      return results;
    } catch (error) {
      setState({
        loading: false,
        progress: 0,
        status: 'Failed',
        results: null,
        error: error as Error,
      });
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      loading: false,
      progress: 0,
      status: '',
      results: null,
      error: null,
    });
  }, []);

  return { ...state, analyze, reset };
}

// Usage example
function VideoAnalyzer() {
  const { loading, progress, status, results, error, analyze } = useVideoAnalysis();

  const handleAnalyze = async (file: File) => {
    try {
      await analyze(file, {
        thumbnails: { count: 5 },
        scenes: { threshold: 30 },
        colors: { count: 5 },
        metadata: true,
      });
    } catch (err) {
      console.error('Analysis failed:', err);
    }
  };

  return (
    <div>
      {loading && (
        <div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: \`\${progress}%\` }}
            />
          </div>
          <p className="mt-2 text-sm text-gray-600">{status}</p>
        </div>
      )}
      {/* ... rest of component ... */}
    </div>
  );
}`}
      />

      <h2 id="error-handling">Error Handling</h2>
      <p>
        Implement robust error handling for video analysis:
      </p>

      <CodeBlock
        language="typescript"
        filename="ErrorBoundary.tsx"
        code={`import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class VideoAnalysisErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Video analysis error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
            <h2 className="text-lg font-semibold text-red-900 mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-red-700">
              {this.state.error?.message || 'Failed to analyze video'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

// Usage
function App() {
  return (
    <VideoAnalysisErrorBoundary>
      <VideoAnalyzer />
    </VideoAnalysisErrorBoundary>
  );
}`}
      />

      <div className="not-prose bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 my-6">
        <p className="text-sm text-green-900 dark:text-green-100 font-semibold mb-2">
          💡 Pro Tips
        </p>
        <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
          <li>• Use React.memo() to prevent unnecessary re-renders of thumbnail components</li>
          <li>• Implement cleanup in useEffect when component unmounts</li>
          <li>• Consider using React Query for caching analysis results</li>
          <li>• Use Web Workers via VideoIntel's built-in support for better performance</li>
        </ul>
      </div>

      <div className="not-prose bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 my-6">
        <p className="text-sm text-blue-900 dark:text-blue-100 font-semibold mb-2">
          📚 More Examples
        </p>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• <a href="/docs/guides/faces" className="underline">Face Detection Guide</a></li>
          <li>• <a href="/docs/examples/vue" className="underline">Vue Integration</a></li>
          <li>• <a href="/docs/examples/upload" className="underline">Complete Upload Flow</a></li>
          <li>• <a href="/playground" className="underline">Try Interactive Playground</a></li>
        </ul>
      </div>
    </DocsLayout>
  );
}


export interface SampleVideo {
  id: string;
  name: string;
  description: string;
  url: string;
  duration: number;
  size: string;
  thumbnail: string;
}

export const sampleVideos: SampleVideo[] = [
  {
    id: '10s-demo',
    name: '10 Second Demo',
    description: 'Short demonstration video - perfect for quick testing',
    url: '/videos/sample-10s.mp4',
    duration: 10,
    size: '2.4 MB',
    thumbnail: 'https://via.placeholder.com/320x180?text=10s+Demo',
  },
  {
    id: '30s-product',
    name: '30 Second Video',
    description: 'Medium length video for comprehensive testing',
    url: '/videos/sample-30s.mp4',
    duration: 30,
    size: '2.2 MB',
    thumbnail: 'https://via.placeholder.com/320x180?text=30s+Video',
  },
  {
    id: 'scene-changes',
    name: 'Multiple Scene Changes',
    description: 'Longer video with various scenes - great for scene detection',
    url: '/videos/sample-scenes.mp4',
    duration: 20,
    size: '46 MB',
    thumbnail: 'https://via.placeholder.com/320x180?text=Scene+Changes',
  },
];

export async function fetchSampleVideo(url: string): Promise<File> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch sample video: ${response.statusText}`);
  }
  
  const blob = await response.blob();
  const filename = url.split('/').pop() || 'sample-video.mp4';
  return new File([blob], filename, { type: 'video/mp4' });
}


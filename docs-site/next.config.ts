import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: process.env.NODE_ENV === 'production' ? '/video_intel_js' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/video_intel_js/' : '',
};

export default nextConfig;

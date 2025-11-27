'use client';

import { FiTarget, FiFilm, FiDroplet, FiBarChart2, FiLock, FiCode, FiZap, FiPackage } from 'react-icons/fi';

const features = [
  {
    name: 'Smart Thumbnails',
    description: 'Automatically generate high-quality thumbnails using advanced frame scoring algorithms.',
    icon: FiTarget,
  },
  {
    name: 'Scene Detection',
    description: 'Detect scene changes with configurable sensitivity and transition detection.',
    icon: FiFilm,
  },
  {
    name: 'Color Extraction',
    description: 'Extract dominant colors from videos using k-means clustering for palettes.',
    icon: FiDroplet,
  },
  {
    name: 'Video Metadata',
    description: 'Get comprehensive metadata including duration, resolution, and frame rate.',
    icon: FiBarChart2,
  },
  {
    name: 'Privacy-First',
    description: 'All processing happens in the browser. Your videos never leave your device.',
    icon: FiLock,
  },
  {
    name: 'TypeScript Native',
    description: 'Built with TypeScript for excellent type safety and developer experience.',
    icon: FiCode,
  },
  {
    name: 'High Performance',
    description: 'Optimized for speed with Web Workers and efficient memory management.',
    icon: FiZap,
  },
  {
    name: 'Zero Dependencies',
    description: 'Lightweight with minimal dependencies for a smaller bundle size.',
    icon: FiPackage,
  },
];

export default function Features() {
  return (
    <section className="py-24 sm:py-32 bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-indigo-600 dark:text-indigo-400">
            Everything you need
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Powerful video analysis features
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
            Extract insights from videos with a simple, intuitive API. Built for modern web applications.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-7xl">
          <dl className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.name} className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg blur opacity-0 group-hover:opacity-25 transition duration-300" />
                <div className="relative rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-6 hover:shadow-lg transition-shadow">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900 dark:text-white">
                    <feature.icon className="h-6 w-6 flex-none text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                    {feature.name}
                  </dt>
                  <dd className="mt-4 text-base leading-7 text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}


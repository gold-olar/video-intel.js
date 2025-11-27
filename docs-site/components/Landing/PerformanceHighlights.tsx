'use client';

import Link from 'next/link';
import { FiTrendingUp, FiCpu, FiDatabase, FiZap } from 'react-icons/fi';

const metrics = [
  {
    name: 'Fast Processing',
    value: '<5s',
    description: 'Generate thumbnails from a 10-second video',
    icon: FiZap,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
  },
  {
    name: 'Low Memory',
    value: '<100MB',
    description: 'Efficient memory usage during processing',
    icon: FiDatabase,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
  },
  {
    name: 'Browser-Based',
    value: '100%',
    description: 'Client-side processing, no server costs',
    icon: FiCpu,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
  },
  {
    name: 'High Throughput',
    value: '60fps',
    description: 'Efficient frame extraction and analysis',
    icon: FiTrendingUp,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
  },
];

export default function PerformanceHighlights() {
  return (
    <section className="py-24 sm:py-32 bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Built for Performance
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
            Optimized for speed and efficiency. See how VideoIntel performs in real-world scenarios.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-7xl">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric) => (
              <div
                key={metric.name}
                className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-8 shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className={`inline-flex rounded-lg p-3 ${metric.bgColor}`}>
                  <metric.icon className={`h-6 w-6 ${metric.color}`} />
                </div>
                <div className="mt-6">
                  <div className={`text-4xl font-bold ${metric.color}`}>
                    {metric.value}
                  </div>
                  <div className="mt-2 text-base font-semibold text-gray-900 dark:text-white">
                    {metric.name}
                  </div>
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {metric.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 text-center">
          <Link
            href="/benchmarks"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-3 text-base font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
          >
            View Full Benchmarks
            <FiTrendingUp className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}


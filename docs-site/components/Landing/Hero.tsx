'use client';

import Link from 'next/link';
import { FiPlay, FiBook, FiCoffee } from 'react-icons/fi';

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950">
      <div className="absolute inset-0 bg-grid-gray-900/[0.04] dark:bg-grid-white/[0.02]" />
      
      <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-7xl">
            Smart Video Analysis in{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              3 Lines of Code
            </span>
          </h1>
          
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
            TypeScript-first, privacy-focused, zero-cost video intelligence. 
            Extract thumbnails, detect scenes, analyze colors, and more—all in the browser.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4">
            <div className="flex items-center justify-center gap-x-6">
              <Link
                href="/playground"
                className="group flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-lg hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all"
              >
                <FiPlay className="h-5 w-5" />
                Try Playground
              </Link>
              <Link
                href="/docs"
                className="group flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-3 text-base font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                <FiBook className="h-5 w-5" />
                View Docs
              </Link>
            </div>
            <a
              href="https://buymeacoffee.com/gold_olar"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <FiCoffee className="h-4 w-4" />
              <span>Support this project</span>
            </a>
          </div>

          {/* Code Example */}
          <div className="mt-16 overflow-hidden rounded-2xl bg-gray-900 shadow-2xl">
            <div className="flex items-center gap-2 border-b border-gray-800 px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span className="ml-2 text-sm text-gray-400">quick-start.ts</span>
            </div>
            <pre className="overflow-x-auto p-6 text-left text-sm leading-relaxed">
              <code className="text-gray-100">
                <span className="text-purple-400">import</span>{' '}
                <span className="text-blue-400">VideoIntel</span>{' '}
                <span className="text-purple-400">from</span>{' '}
                <span className="text-green-400">&apos;video-intel&apos;</span>
                <span className="text-gray-500">;</span>
                {'\n\n'}
                <span className="text-purple-400">const</span>{' '}
                <span className="text-blue-400">analyzer</span>{' '}
                <span className="text-pink-400">=</span>{' '}
                <span className="text-purple-400">new</span>{' '}
                <span className="text-yellow-400">VideoIntel</span>
                <span className="text-gray-500">()</span>
                <span className="text-gray-500">;</span>
                {'\n'}
                <span className="text-purple-400">const</span>{' '}
                <span className="text-blue-400">results</span>{' '}
                <span className="text-pink-400">=</span>{' '}
                <span className="text-purple-400">await</span>{' '}
                <span className="text-blue-400">analyzer</span>
                <span className="text-gray-500">.</span>
                <span className="text-yellow-400">analyze</span>
                <span className="text-gray-500">(</span>
                <span className="text-blue-400">videoFile</span>
                <span className="text-gray-500">)</span>
                <span className="text-gray-500">;</span>
                {'\n'}
                <span className="text-blue-400">console</span>
                <span className="text-gray-500">.</span>
                <span className="text-yellow-400">log</span>
                <span className="text-gray-500">(</span>
                <span className="text-blue-400">results</span>
                <span className="text-gray-500">.</span>
                <span className="text-blue-400">thumbnails</span>
                <span className="text-gray-500">)</span>
                <span className="text-gray-500">;</span>{' '}
                <span className="text-gray-500">{'//'} ✨ Smart thumbnails generated!</span>
              </code>
            </pre>
          </div>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-800/50 p-6 backdrop-blur-sm">
              <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                {'<'}5s
              </div>
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Thumbnail generation (10s video)
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-800/50 p-6 backdrop-blur-sm">
              <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                {'<'}100MB
              </div>
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Memory usage
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-800/50 p-6 backdrop-blur-sm">
              <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                100%
              </div>
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Browser-based, no server costs
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


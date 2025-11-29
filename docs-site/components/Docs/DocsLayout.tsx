'use client';

import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';
import Sidebar from '@/components/Shared/Sidebar';
import TableOfContents from '@/components/Shared/TableOfContents';
import Footer from '@/components/Landing/Footer';

interface TOCItem {
  id: string;
  title: string;
  level: number;
}

interface DocsLayoutProps {
  children: React.ReactNode;
  tocItems?: TOCItem[];
}

export default function DocsLayout({ children, tocItems = [] }: DocsLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between max-w-[1800px] mx-auto">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                <FiArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-700" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Documentation
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/playground"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                Playground
              </Link>
              <Link
                href="/benchmarks"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                Benchmarks
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex max-w-[1800px] mx-auto w-full h-[95vh] overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Content */}
        <main className="flex-1 px-6 py-8 lg:px-12 lg:py-12 overflow-y-auto h-full">
          <article className="prose prose-gray dark:prose-invert max-w-3xl text-gray-900 dark:text-gray-100">
            {children}
          </article>
        </main>

        {/* Table of Contents */}
        {tocItems.length > 0 && <TableOfContents items={tocItems} />}
      </div>

      <Footer />
    </div>
  );
}


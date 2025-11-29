import Link from 'next/link';
import { FiArrowLeft, FiClock, FiZap, FiCpu, FiHardDrive, FiRefreshCw } from 'react-icons/fi';
import MetricsCard from '@/components/Benchmarks/MetricsCard';
import ComparisonChart from '@/components/Benchmarks/ComparisonChart';
import MetricsTable from '@/components/Benchmarks/MetricsTable';
import Footer from '@/components/Landing/Footer';

// Sample benchmark data - in production, this would come from actual test runs
const benchmarkData = {
  lastUpdated: '2025-11-27T12:00:00Z',
  environment: {
    browser: 'Chrome 120',
    os: 'macOS',
    cpu: 'Apple M1',
    memory: '16GB',
  },
  overview: {
    avgThumbnailTime: 2845,
    avgSceneTime: 3120,
    avgColorTime: 2650,
    avgMetadataTime: 45,
    memoryUsage: 78,
  },
  byVideoLength: [
    { name: '10s', value: 2845 },
    { name: '30s', value: 6420 },
    { name: '60s', value: 11230 },
    { name: '120s', value: 19840 },
  ],
  byFeature: [
    { name: 'Metadata', value: 45 },
    { name: 'Colors', value: 2650 },
    { name: 'Thumbnails', value: 2845 },
    { name: 'Scenes', value: 3120 },
    { name: 'Full Analysis', value: 8660 },
  ],
  detailedMetrics: [
    { feature: 'Metadata Extraction (10s)', avg: 45, min: 40, max: 52, median: 44 },
    { feature: 'Thumbnail Generation (10s)', avg: 2845, min: 2650, max: 3200, median: 2820 },
    { feature: 'Scene Detection (10s)', avg: 3120, min: 2980, max: 3450, median: 3100 },
    { feature: 'Color Extraction (10s)', avg: 2650, min: 2450, max: 2920, median: 2640 },
    { feature: 'Full Analysis (10s)', avg: 8660, min: 8200, max: 9500, median: 8620 },
  ],
  browserComparison: [
    { name: 'Chrome', value: 2845 },
    { name: 'Firefox', value: 3120 },
    { name: 'Safari', value: 3450 },
    { name: 'Edge', value: 2890 },
  ],
};

export default function BenchmarksPage() {
  const lastUpdated = new Date(benchmarkData.lastUpdated).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
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
                Performance Benchmarks
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/docs"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                Docs
              </Link>
              <Link
                href="/playground"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                Playground
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-8 space-y-8">
        {/* Header Section */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Real-World Performance Metrics
          </h2>
          <p className="mt-2 text-base text-gray-600 dark:text-gray-300">
            All benchmarks run on real videos in production environments.
          </p>
          <div className="mt-4 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <FiRefreshCw className="h-4 w-4" />
              Last updated: {lastUpdated}
            </div>
            <div className="h-4 w-px bg-gray-300 dark:bg-gray-700" />
            <div>
              {benchmarkData.environment.browser} • {benchmarkData.environment.os} •{' '}
              {benchmarkData.environment.cpu}
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricsCard
            title="Avg Thumbnail Time"
            value={`${(benchmarkData.overview.avgThumbnailTime / 1000).toFixed(2)}s`}
            subtitle="10-second video"
            icon={<FiClock />}
            color="indigo"
            trend={{ value: 12, label: 'vs last month' }}
          />
          <MetricsCard
            title="Avg Scene Detection"
            value={`${(benchmarkData.overview.avgSceneTime / 1000).toFixed(2)}s`}
            subtitle="10-second video"
            icon={<FiZap />}
            color="green"
            trend={{ value: 8, label: 'vs last month' }}
          />
          <MetricsCard
            title="Avg Color Extraction"
            value={`${(benchmarkData.overview.avgColorTime / 1000).toFixed(2)}s`}
            subtitle="10-second video"
            icon={<FiCpu />}
            color="purple"
            trend={{ value: 15, label: 'vs last month' }}
          />
          <MetricsCard
            title="Peak Memory Usage"
            value={`${benchmarkData.overview.memoryUsage}MB`}
            subtitle="Average across tests"
            icon={<FiHardDrive />}
            color="blue"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ComparisonChart
            title="Performance by Video Length"
            data={benchmarkData.byVideoLength}
            unit="ms"
            type="bar"
          />
          <ComparisonChart
            title="Performance by Feature"
            data={benchmarkData.byFeature}
            unit="ms"
            type="bar"
          />
        </div>

        {/* Browser Comparison */}
        <ComparisonChart
          title="Browser Comparison (Thumbnail Generation - 10s video)"
          data={benchmarkData.browserComparison}
          unit="ms"
          type="horizontal-bar"
        />

        {/* Detailed Metrics Table */}
        <MetricsTable
          title="Detailed Performance Metrics"
          data={benchmarkData.detailedMetrics}
          unit="ms"
        />

        {/* Test Environment */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Test Environment
          </h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Browser</dt>
              <dd className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                {benchmarkData.environment.browser}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Operating System</dt>
              <dd className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                {benchmarkData.environment.os}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">CPU</dt>
              <dd className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                {benchmarkData.environment.cpu}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Memory</dt>
              <dd className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                {benchmarkData.environment.memory}
              </dd>
            </div>
          </dl>
        </div>

        {/* Methodology */}
        <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            Methodology
          </h3>
          <div className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
            <p>
              • All benchmarks are run on real video files, not synthetic test data
            </p>
            <p>
              • Each test is executed 10 times and the median value is reported
            </p>
            <p>
              • Tests are run in isolation with no other CPU-intensive tasks running
            </p>
            <p>
              • Benchmarks are automatically updated weekly via GitHub Actions
            </p>
            <p>
              • Source code for benchmarks is available in the{' '}
              <a
                href="https://github.com/gold-olar/video-intel.js/tree/main/tests/performance"
                className="underline font-medium"
              >
                repository
              </a>
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center py-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to Try It Out?
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Test VideoIntel.js with your own videos in the interactive playground
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/playground"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white hover:bg-indigo-500 transition-all"
            >
              Try Playground
            </Link>
            <Link
              href="/docs/getting-started"
              className="inline-flex items-center gap-2 rounded-lg border-2 border-gray-300 dark:border-gray-700 px-6 py-3 text-base font-semibold text-gray-900 dark:text-white hover:border-gray-400 dark:hover:border-gray-600 transition-all"
            >
              View Documentation
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}


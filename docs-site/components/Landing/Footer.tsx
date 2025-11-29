'use client';

import Link from 'next/link';
import { FiGithub, FiPackage, FiTwitter, FiHeart, FiCoffee } from 'react-icons/fi';

const navigation = {
  product: [
    { name: 'Playground', href: '/playground' },
    { name: 'Documentation', href: '/docs' },
    { name: 'Benchmarks', href: '/benchmarks' },
    { name: 'Examples', href: '/docs/examples' },
  ],
  resources: [
    { name: 'Getting Started', href: '/docs/getting-started' },
    { name: 'API Reference', href: '/docs/api' },
    { name: 'Guides', href: '/docs/guides' },
    { name: 'FAQ', href: '/docs/faq' },
  ],
  community: [
    { name: 'GitHub', href: 'https://github.com/yourusername/video_intel_js' },
    { name: 'NPM', href: 'https://npmjs.com/package/video-intel' },
    { name: 'Issues', href: 'https://github.com/yourusername/video_intel_js/issues' },
    { name: 'Contributing', href: '/contributing' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-gray-900" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="mx-auto max-w-7xl px-6 pb-8 pt-16 sm:pt-24 lg:px-8 lg:pt-32">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
                <span className="text-xl font-bold text-white">VI</span>
              </div>
              <span className="text-xl font-bold text-white">VideoIntel.js</span>
            </div>
            <p className="text-sm leading-6 text-gray-400">
              Smart video analysis in the browser. TypeScript-first, privacy-focused, and lightning fast.
            </p>
            <div className="flex space-x-6">
              <a
                href="https://github.com/yourusername/video_intel_js"
                className="text-gray-400 hover:text-gray-300 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="sr-only">GitHub</span>
                <FiGithub className="h-6 w-6" />
              </a>
              <a
                href="https://npmjs.com/package/video-intel"
                className="text-gray-400 hover:text-gray-300 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="sr-only">NPM</span>
                <FiPackage className="h-6 w-6" />
              </a>
              <a
                href="https://buymeacoffee.com/gold_olar"
                className="text-gray-400 hover:text-gray-300 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="sr-only">Buy Me a Coffee</span>
                <FiCoffee className="h-6 w-6" />
              </a>
            </div>
          </div>
          <div className="mt-16 grid grid-cols-3 gap-8 xl:col-span-2 xl:mt-0">
            <div>
              <h3 className="text-sm font-semibold leading-6 text-white">Product</h3>
              <ul role="list" className="mt-6 space-y-4">
                {navigation.product.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-sm leading-6 text-gray-400 hover:text-white transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold leading-6 text-white">Resources</h3>
              <ul role="list" className="mt-6 space-y-4">
                {navigation.resources.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-sm leading-6 text-gray-400 hover:text-white transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold leading-6 text-white">Community</h3>
              <ul role="list" className="mt-6 space-y-4">
                {navigation.community.map((item) => (
                  <li key={item.name}>
                    <a
                      href={item.href}
                      className="text-sm leading-6 text-gray-400 hover:text-white transition-colors"
                      target={item.href.startsWith('http') ? '_blank' : undefined}
                      rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    >
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-16 border-t border-gray-800 pt-8 sm:mt-20 lg:mt-24">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-xs leading-5 text-gray-400">
              &copy; {new Date().getFullYear()} VideoIntel Released under MIT License.
            </p>
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-4">
              <p className="flex items-center gap-1 text-xs leading-5 text-gray-400">
                Made with <FiHeart className="h-4 w-4 text-red-500" /> by Samuel Olamide
              </p>
              <a
                href="https://buymeacoffee.com/gold_olar"
                className="flex items-center gap-1 text-xs leading-5 text-gray-400 hover:text-yellow-400 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FiCoffee className="h-4 w-4" /> Support this project
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}


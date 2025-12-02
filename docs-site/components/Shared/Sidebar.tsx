'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiBook, FiZap, FiCode, FiPackage, FiFileText, FiHelpCircle, FiShield } from 'react-icons/fi';

interface NavItem {
  title: string;
  href: string;
  icon?: React.ReactNode;
  items?: { title: string; href: string }[];
}

const navigation: NavItem[] = [
  {
    title: 'Getting Started',
    href: '/docs/getting-started',
    icon: <FiZap className="w-4 h-4" />,
    items: [
      { title: 'Installation', href: '/docs/getting-started#installation' },
      { title: 'Quick Start', href: '/docs/getting-started#quick-start' },
      { title: 'Basic Examples', href: '/docs/getting-started#examples' },
    ],
  },
  {
    title: 'API Reference',
    href: '/docs/api',
    icon: <FiCode className="w-4 h-4" />,
    items: [
      { title: 'VideoIntel Class', href: '/docs/api#videointel' },
      { title: 'analyze()', href: '/docs/api#analyze' },
      { title: 'getThumbnails()', href: '/docs/api#get-thumbnails' },
      { title: 'detectScenes()', href: '/docs/api#detect-scenes' },
      { title: 'extractColors()', href: '/docs/api#extract-colors' },
      { title: 'detectFaces()', href: '/docs/api#detect-faces' },
      { title: 'getMetadata()', href: '/docs/api#get-metadata' },
    ],
  },
  {
    title: 'Guides',
    href: '/docs/guides',
    icon: <FiBook className="w-4 h-4" />,
    items: [
      { title: 'Thumbnail Generation', href: '/docs/guides/thumbnails' },
      { title: 'Scene Detection', href: '/docs/guides/scenes' },
      { title: 'Color Extraction', href: '/docs/guides/colors' },
      { title: 'Face Detection', href: '/docs/guides/faces' },
      { title: 'Memory Management', href: '/docs/guides/memory' },
      { title: 'Performance Tips', href: '/docs/guides/performance' },
    ],
  },
  {
    title: 'Examples',
    href: '/docs/examples',
    icon: <FiPackage className="w-4 h-4" />,
    items: [
      { title: 'React Integration', href: '/docs/examples/react' },
      { title: 'Vue Integration', href: '/docs/examples/vue' },
      { title: 'Video Upload Flow', href: '/docs/examples/upload' },
      { title: 'Progress Indicators', href: '/docs/examples/progress' },
    ],
  },
  {
    title: 'Advanced',
    href: '/docs/advanced',
    icon: <FiFileText className="w-4 h-4" />,
    items: [
      { title: 'Custom Frame Scoring', href: '/docs/advanced/custom-scoring' },
      { title: 'Extending the Library', href: '/docs/advanced/extending' },
      { title: 'TypeScript Types', href: '/docs/advanced/types' },
    ],
  },
  {
    title: 'FAQ',
    href: '/docs/faq',
    icon: <FiHelpCircle className="w-4 h-4" />,
  },
  {
    title: 'Privacy Policy',
    href: '/docs/privacy',
    icon: <FiShield className="w-4 h-4" />,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/docs') return pathname === '/docs';
    return pathname?.startsWith(href);
  };

  return (
    <aside className="w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 h-[95vh] overflow-y-auto">
      <nav className="p-6 space-y-8">
        {navigation.map((section) => (
          <div key={section.href}>
            <Link
              href={section.href}
              className={`flex items-center gap-2 text-sm font-semibold mb-3 transition-colors ${
                isActive(section.href)
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
            >
              {section.icon}
              {section.title}
            </Link>
            {section.items && (
              <ul className="ml-6 space-y-2">
                {section.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`text-sm block py-1 transition-colors ${
                        pathname === item.href
                          ? 'text-indigo-600 dark:text-indigo-400 font-medium'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}


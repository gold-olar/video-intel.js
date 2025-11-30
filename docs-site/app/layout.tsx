import type { Metadata } from 'next';
import './globals.css';
import AnalyticsProvider from '@/components/Analytics/AnalyticsProvider';

export const metadata: Metadata = {
  title: 'VideoIntel.js - Smart Video Analysis in 3 Lines of Code',
  description: 'TypeScript-first, privacy-focused, zero-cost video intelligence. Extract thumbnails, detect scenes, analyze colors, and more—all in the browser.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AnalyticsProvider />
        {children}
      </body>
    </html>
  );
}

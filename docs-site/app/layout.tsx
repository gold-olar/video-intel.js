import type { Metadata } from 'next';
import './globals.css';
import GoogleAnalytics from '@/components/Analytics/GoogleAnalytics';

export const metadata: Metadata = {
  title: 'VideoIntel.js - Smart Video Analysis in 3 Lines of Code',
  description: 'TypeScript-first, privacy-focused, zero-cost video intelligence. Extract thumbnails, detect scenes, analyze colors, and more—all in the browser.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html lang="en">
      <body className="antialiased">
        {gaId && <GoogleAnalytics measurementId={gaId} />}
        {children}
      </body>
    </html>
  );
}

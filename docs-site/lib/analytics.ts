/**
 * Analytics utility functions for tracking custom events
 * Works with Google Analytics 4
 */

// Type-safe event names
export type AnalyticsEvent =
  | 'video_processed'
  | 'code_copied'
  | 'github_click'
  | 'npm_click'
  | 'benchmark_viewed'
  | 'docs_section_viewed'
  | 'external_link_click'
  | 'playground_upload'
  | 'playground_start'
  | 'playground_complete';

interface EventParams {
  [key: string]: string | number | boolean;
}

/**
 * Track a custom event in Google Analytics
 * @param eventName - Name of the event to track
 * @param params - Optional parameters to send with the event
 */
export function trackEvent(eventName: AnalyticsEvent, params?: EventParams): void {
  // Check if gtag is available (GA4 loaded)
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  } else {
    // Fallback for development or when GA is blocked
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Analytics Event:', eventName, params);
    }
  }
}

/**
 * Track video processing in the playground
 */
export function trackVideoProcessing(params: {
  duration?: number;
  fileSize?: number;
  features?: string[];
}): void {
  trackEvent('video_processed', {
    video_duration: params.duration || 0,
    file_size: params.fileSize || 0,
    features_used: params.features?.join(',') || 'unknown',
  });
}

/**
 * Track code snippet copying
 */
export function trackCodeCopy(section: string): void {
  trackEvent('code_copied', {
    section,
  });
}

/**
 * Track external link clicks
 */
export function trackExternalLink(destination: 'github' | 'npm' | 'other', url?: string): void {
  if (destination === 'github') {
    trackEvent('github_click', { url: url || 'repository' });
  } else if (destination === 'npm') {
    trackEvent('npm_click', { url: url || 'package' });
  } else {
    trackEvent('external_link_click', { url: url || 'unknown' });
  }
}

/**
 * Track benchmark page views
 */
export function trackBenchmarkView(benchmarkType?: string): void {
  trackEvent('benchmark_viewed', {
    type: benchmarkType || 'overview',
  });
}

/**
 * Track docs section navigation
 */
export function trackDocsView(section: string): void {
  trackEvent('docs_section_viewed', {
    section,
  });
}

/**
 * Track playground interactions
 */
export function trackPlaygroundAction(
  action: 'upload' | 'start' | 'complete',
  metadata?: Record<string, string | number>
): void {
  const eventMap = {
    upload: 'playground_upload',
    start: 'playground_start',
    complete: 'playground_complete',
  } as const;

  trackEvent(eventMap[action], metadata);
}

// Extend the Window interface to include gtag
declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string | Date,
      config?: Record<string, unknown>
    ) => void;
  }
}


'use client';

import { useState, useCallback } from 'react';
import GoogleAnalytics from './GoogleAnalytics';
import CookieConsent from './CookieConsent';

/**
 * Analytics Provider Component
 * Manages cookie consent and conditionally loads Google Analytics
 */
export default function AnalyticsProvider() {
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  const handleAccept = useCallback(() => {
    setAnalyticsEnabled(true);
  }, []);

  const handleDecline = useCallback(() => {
    setAnalyticsEnabled(false);
  }, []);

  // Don't render anything if no GA ID is configured
  if (!gaId) {
    return null;
  }

  return (
    <>
      {/* Only load GA4 if user has accepted cookies */}
      {analyticsEnabled && <GoogleAnalytics measurementId={gaId} />}
      
      {/* Cookie Consent Banner */}
      <CookieConsent onAccept={handleAccept} onDecline={handleDecline} />
    </>
  );
}


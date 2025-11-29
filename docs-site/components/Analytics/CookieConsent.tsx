'use client';

import { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';

const CONSENT_COOKIE_NAME = 'videointel_cookie_consent';

interface CookieConsentProps {
  onAccept: () => void;
  onDecline: () => void;
}

/**
 * GDPR-compliant cookie consent banner
 * Stores user preference in localStorage
 */
export default function CookieConsent({ onAccept, onDecline }: CookieConsentProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem(CONSENT_COOKIE_NAME);
    
    if (consent === null) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (consent === 'accepted') {
      // User previously accepted - initialize analytics
      onAccept();
    }
  }, [onAccept]);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_COOKIE_NAME, 'accepted');
    setIsVisible(false);
    onAccept();
  };

  const handleDecline = () => {
    localStorage.setItem(CONSENT_COOKIE_NAME, 'declined');
    setIsVisible(false);
    onDecline();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl">
          <div className="p-4 sm:p-6">
            <div className="flex items-start gap-4">
              {/* Cookie Icon */}
              <div className="shrink-0 rounded-lg bg-indigo-100 dark:bg-indigo-950/50 p-3">
                <span className="text-2xl" role="img" aria-label="Cookie">
                  🍪
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                  🍪 We Value Your Privacy
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  We use cookies to analyze site traffic and improve your experience. 
                  Your data is anonymized and never sold to third parties. 
                  You can change your preferences at any time.
                </p>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleAccept}
                    className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 transition-all"
                  >
                    Accept All
                  </button>
                  <button
                    onClick={handleDecline}
                    className="inline-flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                  >
                    Decline
                  </button>
                  <a
                    href="/docs/privacy"
                    className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Learn More
                  </a>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={handleDecline}
                className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Close"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to check if user has given consent
 */
export function useCookieConsent(): boolean | null {
  const [hasConsent] = useState<boolean | null>(() => {
    // Initialize state from localStorage on mount
    if (typeof window !== 'undefined') {
      const consent = localStorage.getItem(CONSENT_COOKIE_NAME);
      return consent === 'accepted' ? true : consent === 'declined' ? false : null;
    }
    return null;
  });

  return hasConsent;
}

/**
 * Function to reset consent (for testing or user preference change)
 */
export function resetCookieConsent(): void {
  localStorage.removeItem(CONSENT_COOKIE_NAME);
  window.location.reload();
}


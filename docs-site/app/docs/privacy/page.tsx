import DocsLayout from '@/components/Docs/DocsLayout';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - VideoIntel.js',
  description: 'Privacy policy for the VideoIntel.js documentation site. Learn how we collect, use, and protect your information. GDPR and CCPA compliant.',
};

const tocItems = [
  { id: 'overview', title: 'Overview', level: 2 },
  { id: 'information-we-collect', title: 'Information We Collect', level: 2 },
  { id: 'how-we-use-information', title: 'How We Use Information', level: 2 },
  { id: 'cookies-and-tracking', title: 'Cookies and Tracking', level: 2 },
  { id: 'third-party-services', title: 'Third-Party Services', level: 2 },
  { id: 'data-security', title: 'Data Security', level: 2 },
  { id: 'your-rights', title: 'Your Rights', level: 2 },
  { id: 'childrens-privacy', title: "Children's Privacy", level: 2 },
  { id: 'changes-to-policy', title: 'Changes to This Policy', level: 2 },
  { id: 'contact', title: 'Contact Us', level: 2 },
];

export default function PrivacyPage() {
  return (
    <DocsLayout tocItems={tocItems}>
      <h1 id="privacy-policy">Privacy Policy</h1>
      <p className="lead">
        Last updated: November 29, 2025
      </p>
      <p className="lead">
        Your privacy is important to us. This Privacy Policy explains how we collect, use, and
        protect your information when you visit the VideoIntel.js documentation site.
      </p>

      <h2 id="overview">Overview</h2>
      <p>
        VideoIntel.js is a client-side JavaScript library for video analysis. This privacy policy
        applies specifically to this documentation and demonstration website (
        <code>https://gold-olar.github.io/video-intel.js</code>), not to the library itself.
      </p>
      <p>
        <strong>Key Points:</strong>
      </p>
      <ul>
        <li>We respect your privacy and only collect anonymous analytics data</li>
        <li>We ask for your consent before using cookies or tracking technologies</li>
        <li>We never collect personal information like names, emails, or addresses</li>
        <li>All video processing happens in your browser - files never leave your device</li>
        <li>You can opt-out of analytics at any time</li>
      </ul>

      <h2 id="information-we-collect">Information We Collect</h2>
      
      <h3>Analytics Information (With Your Consent)</h3>
      <p>
        When you consent to analytics cookies, we collect anonymous usage data through Google
        Analytics 4, including:
      </p>
      <ul>
        <li>
          <strong>Page views:</strong> Which pages you visit and how long you spend on them
        </li>
        <li>
          <strong>Geographic data:</strong> Your approximate location (country and city only, no
          precise location)
        </li>
        <li>
          <strong>Device information:</strong> Browser type, operating system, device type
          (desktop/mobile/tablet), and screen resolution
        </li>
        <li>
          <strong>Referral source:</strong> The website that referred you to our documentation
        </li>
        <li>
          <strong>User interactions:</strong> Button clicks, link clicks, code copying, and
          playground usage (anonymous)
        </li>
        <li>
          <strong>Technical data:</strong> Loading times, errors, and performance metrics
        </li>
      </ul>

      <h3>Information We Do NOT Collect</h3>
      <ul>
        <li>❌ Names, email addresses, or contact information</li>
        <li>❌ User accounts or login credentials (we don&apos;t have user accounts)</li>
        <li>❌ Payment information (the library is free and open source)</li>
        <li>❌ Your video files (all processing happens locally in your browser)</li>
        <li>❌ Precise geolocation or IP addresses (IPs are anonymized)</li>
        <li>❌ Cross-site tracking or browsing history</li>
      </ul>

      <h3>Automatically Collected Information</h3>
      <p>
        Some technical information is automatically collected by your browser when you visit our
        site, even without analytics enabled:
      </p>
      <ul>
        <li>Server logs (IP address, user agent, pages accessed)</li>
        <li>Error reports (for debugging purposes)</li>
      </ul>
      <p>
        This information is stored by GitHub Pages (our hosting provider) and is subject to{' '}
        <a
          href="https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub&apos;s Privacy Policy
        </a>
        .
      </p>

      <h2 id="how-we-use-information">How We Use Information</h2>
      <p>We use the collected information to:</p>
      <ul>
        <li>
          <strong>Improve the documentation:</strong> Understand which pages are most useful and
          which need improvement
        </li>
        <li>
          <strong>Enhance user experience:</strong> Identify usability issues and optimize the site
          layout
        </li>
        <li>
          <strong>Track feature usage:</strong> See which library features are most popular to
          prioritize development
        </li>
        <li>
          <strong>Monitor performance:</strong> Identify and fix slow-loading pages or technical
          issues
        </li>
        <li>
          <strong>Understand our audience:</strong> Learn about our users&apos; needs and
          backgrounds
        </li>
      </ul>
      <p>
        <strong>We will NEVER:</strong>
      </p>
      <ul>
        <li>Sell your data to third parties</li>
        <li>Use your data for advertising</li>
        <li>Share your data with anyone except as described in this policy</li>
        <li>Track you across other websites</li>
      </ul>

      <h2 id="cookies-and-tracking">Cookies and Tracking Technologies</h2>
      
      <h3>What Are Cookies?</h3>
      <p>
        Cookies are small text files stored on your device by your web browser. They help websites
        remember information about your visit.
      </p>

      <h3>Cookies We Use</h3>
      
      <h4>Essential Cookies (Always Active)</h4>
      <p>These cookies are necessary for the site to function and cannot be disabled:</p>
      <ul>
        <li>
          <strong>localStorage (consent preference):</strong> Remembers your cookie consent choice
          (accept/decline)
        </li>
      </ul>

      <h4>Analytics Cookies (Optional - Requires Consent)</h4>
      <p>
        These cookies are only used if you click &quot;Accept All&quot; on the cookie consent banner:
      </p>
      <ul>
        <li>
          <strong>Google Analytics 4 cookies:</strong> Track anonymous usage statistics
          <ul>
            <li>
              <code>_ga</code> - Distinguishes unique users (expires after 2 years)
            </li>
            <li>
              <code>_ga_*</code> - Persists session state (expires after 2 years)
            </li>
          </ul>
        </li>
      </ul>

      <h3>How to Control Cookies</h3>
      <p>You have several options to control cookies:</p>
      <ul>
        <li>
          <strong>Cookie Consent Banner:</strong> Click &quot;Decline&quot; when you first visit the site
        </li>
        <li>
          <strong>Browser Settings:</strong> Configure your browser to block or delete cookies
        </li>
        <li>
          <strong>Do Not Track:</strong> Enable Do Not Track in your browser settings
        </li>
        <li>
          <strong>Ad Blockers:</strong> Use ad blocking extensions that also block analytics
        </li>
      </ul>
      <p>
        Note: Declining cookies will not affect your ability to use the documentation or
        playground features.
      </p>

      <h2 id="third-party-services">Third-Party Services</h2>
      
      <h3>Google Analytics 4</h3>
      <p>
        We use Google Analytics to collect anonymous usage statistics. Google Analytics is
        configured with privacy-friendly settings:
      </p>
      <ul>
        <li>IP anonymization enabled</li>
        <li>User ID tracking disabled</li>
        <li>Advertising features disabled</li>
        <li>Data sharing with Google disabled</li>
      </ul>
      <p>
        Google&apos;s use of analytics data is governed by the{' '}
        <a
          href="https://policies.google.com/privacy"
          target="_blank"
          rel="noopener noreferrer"
        >
          Google Privacy Policy
        </a>
        .
      </p>

      <h3>GitHub Pages</h3>
      <p>
        This site is hosted on GitHub Pages, which may collect technical information as described
        in{' '}
        <a
          href="https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub&apos;s Privacy Policy
        </a>
        .
      </p>

      <h3>CDNs and External Resources</h3>
      <p>
        The site may load resources from Content Delivery Networks (CDNs) to improve performance.
        These services may log access information.
      </p>

      <h2 id="data-security">Data Security</h2>
      <p>We take data security seriously:</p>
      <ul>
        <li>
          <strong>HTTPS encryption:</strong> All traffic to our site is encrypted
        </li>
        <li>
          <strong>No data storage:</strong> We don&apos;t maintain databases of user information
        </li>
        <li>
          <strong>Client-side processing:</strong> Video files are processed entirely in your
          browser and never uploaded
        </li>
        <li>
          <strong>Anonymous analytics:</strong> All analytics data is anonymized and aggregated
        </li>
        <li>
          <strong>Regular updates:</strong> We keep our dependencies and infrastructure updated
        </li>
      </ul>

      <h2 id="your-rights">Your Rights (GDPR & Privacy Laws)</h2>
      <p>
        Under privacy laws like GDPR (Europe), CCPA (California), and others, you have the
        following rights:
      </p>

      <h3>Right to Access</h3>
      <p>
        You can request information about what data we have about you. Since we only collect
        anonymous analytics, we cannot identify individual users.
      </p>

      <h3>Right to Deletion</h3>
      <p>You can delete your cookie consent preference and analytics cookies at any time:</p>
      <ul>
        <li>Clear your browser&apos;s cookies and localStorage</li>
        <li>Use browser privacy/incognito mode for future visits</li>
      </ul>

      <h3>Right to Opt-Out</h3>
      <p>You can opt-out of analytics tracking by:</p>
      <ul>
        <li>Clicking &quot;Decline&quot; on the cookie consent banner</li>
        <li>Installing a browser extension like uBlock Origin or Privacy Badger</li>
        <li>
          Using the{' '}
          <a
            href="https://tools.google.com/dlpage/gaoptout"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Analytics Opt-out Browser Add-on
          </a>
        </li>
      </ul>

      <h3>Right to Data Portability</h3>
      <p>
        Since we don&apos;t store personal data, there is no data to export. All analytics data is
        anonymous and aggregated.
      </p>

      <h3>Right to Object</h3>
      <p>
        You can object to data processing at any time by declining cookies or clearing your
        browser data.
      </p>

      <h2 id="childrens-privacy">Children&apos;s Privacy</h2>
      <p>
        Our documentation site is not directed at children under 13 years of age. We do not
        knowingly collect personal information from children. If you believe we have collected
        information from a child, please contact us immediately.
      </p>

      <h2 id="changes-to-policy">Changes to This Privacy Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. Changes will be posted on this page
        with an updated &quot;Last updated&quot; date. Significant changes will be prominently
        announced.
      </p>
      <p>
        We encourage you to review this Privacy Policy periodically to stay informed about how we
        protect your privacy.
      </p>

      <h2 id="contact">Contact Us</h2>
      <p>If you have questions, concerns, or requests regarding this Privacy Policy, you can:</p>
      <ul>
        <li>
          Open an issue on{' '}
          <a
            href="https://github.com/gold-olar/video-intel.js/issues"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </li>
        <li>
          Contact the maintainer:{' '}
          <a href="mailto:sam99kupo@gmail.com">sam99kupo@gmail.com</a>
        </li>
      </ul>

      <div className="not-prose bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-6 my-8">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
          🔒 Your Privacy Matters
        </h3>
        <div className="text-sm text-blue-700 dark:text-blue-300 space-y-3">
          <p>
            <strong>Remember:</strong> All video processing in the playground happens entirely in
            your browser. Your videos never leave your device, and we have no access to them.
          </p>
          <p>
            The VideoIntel.js library itself is privacy-first by design - it runs 100% client-side
            with no server requirements or data collection.
          </p>
          <p>
            This privacy policy only covers the documentation website&apos;s analytics. The library
            itself collects zero data and respects your privacy completely.
          </p>
        </div>
      </div>

      <div className="not-prose bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 my-8">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
          Additional Resources
        </h3>
        <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
          <li>
            •{' '}
            <a
              href="https://gdpr.eu/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Learn about GDPR
            </a>
          </li>
          <li>
            •{' '}
            <a
              href="https://oag.ca.gov/privacy/ccpa"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              California Consumer Privacy Act (CCPA)
            </a>
          </li>
          <li>
            •{' '}
            <a
              href="https://policies.google.com/technologies/partner-sites"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              How Google uses data from sites that use their services
            </a>
          </li>
          <li>
            •{' '}
            <a
              href="https://github.com/gold-olar/video-intel.js"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              VideoIntel.js GitHub Repository
            </a>
          </li>
        </ul>
      </div>

      <div className="text-center py-8 border-t border-gray-200 dark:border-gray-800 mt-12">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Thank you for trusting VideoIntel.js and respecting your privacy.
        </p>
      </div>
    </DocsLayout>
  );
}


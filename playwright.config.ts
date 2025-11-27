import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for VideoIntel browser integration tests
 * 
 * These tests run in real browsers (Chromium, Firefox, WebKit) to test
 * HTML5 video APIs that don't work in jsdom (Node.js environment).
 * 
 * Test files must end with `.browser.test.ts` to avoid conflicts with Jest.
 */
export default defineConfig({
  // Test directory
  testDir: './tests/integration',
  
  // Match only browser test files
  testMatch: '**/*.browser.test.ts',
  
  // Timeout for each test (video processing can take time)
  timeout: 60000, // 60 seconds
  
  // Expect timeout for assertions
  expect: {
    timeout: 10000, // 10 seconds
  },
  
  // Run tests in files in parallel, but conservatively due to video processing
  fullyParallel: false,
  
  // Number of parallel workers (conservative for video processing)
  workers: 2,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 1 : 0,
  
  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],
  
  // Shared settings for all projects
  use: {
    // Base URL for the tests (not applicable for library testing, but kept for consistency)
    // baseURL: undefined,
    
    // Collect trace on first retry
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on first retry
    video: 'retain-on-failure',
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Allow file access for loading test videos
        permissions: ['clipboard-read', 'clipboard-write'],
      },
    },

    // Uncomment when ready to test in Firefox
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // Uncomment when ready to test in WebKit (Safari)
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // Output folder for test artifacts
  outputDir: 'test-results/',
});


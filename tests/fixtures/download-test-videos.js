#!/usr/bin/env node

/**
 * Download Test Video Fixtures
 * 
 * This script downloads small test videos from the web for use in integration tests.
 * Videos are saved to tests/fixtures/ directory.
 * 
 * Usage:
 *   node tests/fixtures/download-test-videos.js
 *   npm run test:download-fixtures
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const FIXTURES_DIR = __dirname;
const TIMEOUT = 60000; // 60 second timeout per download

/**
 * Test videos to download
 * Using Google's publicly available test videos
 */
const TEST_VIDEOS = [
  {
    name: 'test-video-10s.mp4',
    url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    description: '~10 second clip, 480p - Good for quick tests',
  },
  {
    name: 'test-video-30s.mp4',
    url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    description: '~30 second clip, 720p - Medium length tests',
  },
  {
    name: 'test-video-scenes.mp4',
    url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
    description: '~30 second clip with scene changes - Scene detection tests',
  },
];

/**
 * Download a file from URL
 */
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);
    
    console.log(`  Downloading from: ${url}`);
    
    const request = client.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirect
        file.close();
        fs.unlinkSync(destPath);
        return downloadFile(response.headers.location, destPath)
          .then(resolve)
          .catch(reject);
      }
      
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(destPath);
        return reject(new Error(`Failed to download: HTTP ${response.statusCode}`));
      }
      
      const totalSize = parseInt(response.headers['content-length'] || '0', 10);
      let downloadedSize = 0;
      let lastPercent = 0;
      
      response.on('data', (chunk) => {
        downloadedSize += chunk.length;
        const percent = Math.floor((downloadedSize / totalSize) * 100);
        
        if (percent >= lastPercent + 10 || percent === 100) {
          process.stdout.write(`\r  Progress: ${percent}% (${formatBytes(downloadedSize)} / ${formatBytes(totalSize)})`);
          lastPercent = percent;
        }
      });
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log('\n  ✓ Download complete');
        resolve();
      });
    });
    
    request.on('error', (err) => {
      file.close();
      fs.unlinkSync(destPath);
      reject(err);
    });
    
    request.setTimeout(TIMEOUT, () => {
      request.destroy();
      file.close();
      fs.unlinkSync(destPath);
      reject(new Error('Download timeout'));
    });
  });
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Main download function
 */
async function downloadTestVideos() {
  console.log('📥 Downloading test video fixtures...\n');
  
  // Ensure fixtures directory exists
  if (!fs.existsSync(FIXTURES_DIR)) {
    fs.mkdirSync(FIXTURES_DIR, { recursive: true });
  }
  
  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;
  
  for (const video of TEST_VIDEOS) {
    const destPath = path.join(FIXTURES_DIR, video.name);
    
    console.log(`\n📹 ${video.name}`);
    console.log(`  ${video.description}`);
    
    // Check if already exists
    if (fs.existsSync(destPath)) {
      const stats = fs.statSync(destPath);
      console.log(`  ⏭️  Already exists (${formatBytes(stats.size)}) - Skipping`);
      skipCount++;
      continue;
    }
    
    try {
      await downloadFile(video.url, destPath);
      const stats = fs.statSync(destPath);
      console.log(`  📊 Size: ${formatBytes(stats.size)}`);
      successCount++;
    } catch (error) {
      console.error(`  ❌ Failed: ${error.message}`);
      failCount++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary:');
  console.log(`  ✓ Downloaded: ${successCount}`);
  console.log(`  ⏭️  Skipped: ${skipCount}`);
  console.log(`  ❌ Failed: ${failCount}`);
  console.log('='.repeat(60));
  
  if (failCount > 0) {
    console.log('\n⚠️  Some downloads failed. Please check your internet connection and try again.');
    process.exit(1);
  } else {
    console.log('\n✅ All test video fixtures ready!');
    console.log('\nYou can now run integration tests with:');
    console.log('  npm test tests/integration');
  }
}

// Run the script
downloadTestVideos().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});


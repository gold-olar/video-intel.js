/**
 * Jest setup file for configuring the test environment
 * 
 * This file is run before each test suite and sets up necessary
 * polyfills and mocks for the test environment.
 */

const { createCanvas, ImageData, Canvas } = require('canvas');

// Make ImageData and Canvas available globally for tests
global.ImageData = ImageData;
global.HTMLCanvasElement = Canvas; // So instanceof checks work correctly

// Store original createElement
const originalCreateElement = document.createElement.bind(document);

// Override document.createElement to return proper canvas instances
document.createElement = function(tagName, options) {
  if (tagName === 'canvas') {
    // Create a node canvas instance
    const canvas = createCanvas(300, 150); // Default canvas size
    
    // Add properties that are expected on HTMLCanvasElement
    Object.defineProperty(canvas, 'style', {
      value: {},
      writable: true,
    });
    
    // Ensure toBlob is available (canvas package provides this)
    // The canvas package's toBlob should already be there, but we ensure it's accessible
    if (!canvas.toBlob) {
      // Fallback implementation if for some reason it's not there
      canvas.toBlob = function(callback, type = 'image/png', quality = 0.92) {
        try {
          // Use the canvas package's toBuffer method as a fallback
          const buffer = this.toBuffer(type.replace('image/', ''), { quality });
          const blob = new Blob([buffer], { type });
          setTimeout(() => callback(blob), 0);
        } catch (error) {
          setTimeout(() => callback(null), 0);
        }
      };
    }
    
    return canvas;
  }
  
  return originalCreateElement(tagName, options);
};


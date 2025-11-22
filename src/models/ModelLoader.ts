/**
 * ModelLoader - Lazy load ML models
 */

export class ModelLoader {
  private cache = new Map<string, unknown>();

  /**
   * Preload specified models
   */
  async preload(_models: string[]): Promise<void> {
    console.log('Model preloading not yet implemented');
  }

  /**
   * Clear model cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

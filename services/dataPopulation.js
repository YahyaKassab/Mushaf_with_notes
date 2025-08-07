const quranApi = require('./quranApi');
const imageService = require('./imageService');
const { Page } = require('../models');

class DataPopulationService {
  constructor() {
    this.totalPages = 604;
    this.batchSize = 10; // Process pages in batches
    this.retryAttempts = 3;
    this.delayBetweenRequests = 1000; // 1 second delay between API calls
  }

  /**
   * Populate all pages with images and verses
   * @param {Object} options - Population options
   * @returns {Promise<Object>} Population results
   */
  async populateAllPages(options = {}) {
    const {
      startPage = 1,
      endPage = this.totalPages,
      forceUpdate = false,
      downloadImages = true,
      imageQuality = 'high'
    } = options;

    console.log(`🚀 Starting data population for pages ${startPage}-${endPage}`);
    console.log(`📊 Options: forceUpdate=${forceUpdate}, downloadImages=${downloadImages}, quality=${imageQuality}`);

    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      startTime: new Date(),
      endTime: null
    };

    // Test API connection first
    const apiConnected = await quranApi.testConnection();
    if (!apiConnected) {
      throw new Error('Cannot connect to Quran API. Please check your internet connection.');
    }

    // Process pages in batches
    for (let i = startPage; i <= endPage; i += this.batchSize) {
      const batchEnd = Math.min(i + this.batchSize - 1, endPage);
      console.log(`📦 Processing batch: pages ${i}-${batchEnd}`);

      const batchPromises = [];
      for (let pageNum = i; pageNum <= batchEnd; pageNum++) {
        batchPromises.push(this.populatePage(pageNum, { forceUpdate, downloadImages, imageQuality }));
      }

      // Wait for batch to complete
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Process batch results
      batchResults.forEach((result, index) => {
        const pageNum = i + index;
        if (result.status === 'fulfilled') {
          if (result.value.success) {
            results.success++;
            console.log(`✅ Page ${pageNum} populated successfully`);
          } else {
            results.skipped++;
            console.log(`⏭️ Page ${pageNum} skipped: ${result.value.reason}`);
          }
        } else {
          results.failed++;
          results.errors.push({ page: pageNum, error: result.reason });
          console.error(`❌ Page ${pageNum} failed: ${result.reason}`);
        }
      });

      // Delay between batches to avoid overwhelming the API
      if (batchEnd < endPage) {
        console.log(`⏸️ Waiting ${this.delayBetweenRequests}ms before next batch...`);
        await this.delay(this.delayBetweenRequests);
      }
    }

    results.endTime = new Date();
    results.duration = results.endTime - results.startTime;

    console.log('\n📊 Population Summary:');
    console.log(`✅ Successful: ${results.success}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`⏭️ Skipped: ${results.skipped}`);
    console.log(`⏱️ Duration: ${Math.round(results.duration / 1000)}s`);

    return results;
  }

  /**
   * Populate a single page
   * @param {number} pageNumber - Page number to populate
   * @param {Object} options - Population options
   * @returns {Promise<Object>} Population result
   */
  async populatePage(pageNumber, options = {}) {
    const { forceUpdate = false, downloadImages = true, imageQuality = 'high' } = options;

    try {
      // Check if page already exists
      const existingPage = await Page.findOne({ pageNumber });
      if (existingPage && !forceUpdate) {
        return { success: false, reason: 'Page already exists' };
      }

      // Fetch data from APIs with retries - coordinates are optional
      let versesData, coordinatesData, layoutData;
      
      try {
        [versesData, coordinatesData, layoutData] = await Promise.all([
          this.retryOperation(() => quranApi.getPageVerses(pageNumber)),
          quranApi.getPageWordCoordinates(pageNumber), // Don't retry coordinates, they're optional
          this.retryOperation(() => quranApi.getPageLayout(pageNumber))
        ]);
      } catch (error) {
        // If verses fail, this is critical
        if (!versesData) {
          throw error;
        }
        // If coordinates fail, continue without them
        console.warn(`⚠️ Continuing page ${pageNumber} without coordinates`);
        coordinatesData = { words: [] };
      }

      // Get image URL and download if requested
      const imageUrl = quranApi.getPageImageUrl(pageNumber, imageQuality);
      let imageInfo = null;
      
      if (downloadImages) {
        try {
          imageInfo = await imageService.downloadPageImage(pageNumber, imageUrl, imageQuality);
        } catch (imageError) {
          console.warn(`⚠️ Image download failed for page ${pageNumber}, continuing without local image`);
        }
      }

      // Process word coordinates
      const wordCoordinates = this.processWordCoordinates(coordinatesData);

      // Create page document
      const pageData = {
        pageNumber,
        imageUrl: imageInfo ? `${process.env.BASE_URL || 'http://localhost:3000'}${imageInfo.publicUrl}` : imageUrl,
        imageMetadata: imageInfo ? {
          width: 1920,
          height: 1080,
          format: 'png',
          size: imageInfo.size
        } : {
          width: 1920,
          height: 1080,
          format: 'png',
          size: null
        },
        wordCoordinates,
        lineCoordinates: layoutData?.lineCoordinates || [],
        surahInfo: layoutData?.surahInfo || []
      };

      // Save or update page
      if (existingPage) {
        await Page.findOneAndUpdate({ pageNumber }, pageData);
      } else {
        await Page.create(pageData);
      }

      return { success: true };

    } catch (error) {
      console.error(`Error populating page ${pageNumber}:`, error.message);
      throw error;
    }
  }

  /**
   * Process word coordinates from API response
   * @private
   */
  processWordCoordinates(coordinatesData) {
    if (!coordinatesData || !coordinatesData.words) {
      return [];
    }

    return coordinatesData.words.map(word => ({
      wordId: word.id || `${word.verse_key}_${word.position}`,
      text: word.text_uthmani || word.text,
      position: {
        x: word.location?.x || 0,
        y: word.location?.y || 0,
        width: word.location?.width || 0,
        height: word.location?.height || 0
      },
      surah: word.chapter_id || parseInt(word.verse_key?.split(':')[0]) || 0,
      ayah: word.verse_id || parseInt(word.verse_key?.split(':')[1]) || 0,
      wordIndex: word.position || 0
    }));
  }

  /**
   * Retry operation with exponential backoff
   * @private
   */
  async retryOperation(operation, maxRetries = this.retryAttempts) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (attempt === maxRetries) break;
        
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`⚠️ Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await this.delay(delay);
      }
    }
    
    throw lastError;
  }

  /**
   * Delay helper
   * @private
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get population status
   * @returns {Promise<Object>} Population status
   */
  async getPopulationStatus() {
    try {
      const totalPages = await Page.countDocuments();
      const pagesWithImages = await Page.countDocuments({ 
        imageUrl: { $exists: true, $ne: null } 
      });
      const pagesWithCoordinates = await Page.countDocuments({ 
        'wordCoordinates.0': { $exists: true } 
      });

      const storageStats = await imageService.getStorageStats();

      return {
        totalPages,
        expectedPages: this.totalPages,
        pagesWithImages,
        pagesWithCoordinates,
        completionPercentage: Math.round((totalPages / this.totalPages) * 100),
        storageStats
      };
    } catch (error) {
      console.error('Error getting population status:', error);
      throw error;
    }
  }

  /**
   * Clean up incomplete or corrupted data
   * @returns {Promise<Object>} Cleanup results
   */
  async cleanupData() {
    try {
      console.log('🧹 Starting data cleanup...');

      // Remove pages without essential data
      const incompletePages = await Page.find({
        $or: [
          { imageUrl: { $exists: false } },
          { imageUrl: null },
          { imageUrl: '' }
        ]
      });

      let removedPages = 0;
      for (const page of incompletePages) {
        await Page.deleteOne({ _id: page._id });
        removedPages++;
      }

      // Clean up images
      const imageCleanup = await imageService.cleanupImages();

      console.log(`✅ Cleanup completed: ${removedPages} pages removed`);

      return {
        removedPages,
        imageCleanup
      };
    } catch (error) {
      console.error('Error during cleanup:', error);
      throw error;
    }
  }
}

module.exports = new DataPopulationService();

const axios = require('axios');

class QuranApiService {
  constructor() {
    this.baseUrl = 'https://api.quran.com/api/v4';
    this.cloudQuranBaseUrl = 'https://api.qurancdn.com/api/qdc';
    this.imageBaseUrl = 'https://cdn.qurancdn.com/images/mushaf/medina';
    
    // Create axios instance with default config
    this.api = axios.create({
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mushaf-with-Notes/1.0.0'
      }
    });
  }

  /**
   * Get verse text for a specific page
   * @param {number} pageNumber - Page number (1-604)
   * @returns {Promise<Object>} Verse data
   */
  async getPageVerses(pageNumber) {
    try {
      const response = await this.api.get(
        `${this.baseUrl}/verses/by_page/${pageNumber}`,
        {
          params: {
            language: 'ar',
            text_type: 'uthmani'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching verses for page ${pageNumber}:`, error.message);
      throw new Error(`Failed to fetch verses for page ${pageNumber}`);
    }
  }

  /**
   * Get word-by-word data for a verse
   * @param {number} surah - Surah number
   * @param {number} ayah - Ayah number
   * @returns {Promise<Object>} Word data
   */
  async getVerseWords(surah, ayah) {
    try {
      const response = await this.api.get(
        `${this.baseUrl}/verses/by_key/${surah}:${ayah}`,
        {
          params: {
            language: 'ar',
            text_type: 'uthmani',
            words: true,
            word_fields: 'verse_key,word_number,location,text_uthmani'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching words for ${surah}:${ayah}:`, error.message);
      throw new Error(`Failed to fetch words for verse ${surah}:${ayah}`);
    }
  }

  /**
   * Get page image URL
   * @param {number} pageNumber - Page number (1-604)
   * @param {string} quality - Image quality ('high', 'medium', 'low')
   * @returns {string} Image URL
   */
  getPageImageUrl(pageNumber, quality = 'high') {
    const paddedPageNumber = pageNumber.toString().padStart(3, '0');
    
    const qualityMap = {
      high: '1920x1080',
      medium: '1280x720',
      low: '640x360'
    };
    
    const resolution = qualityMap[quality] || qualityMap.high;
    return `${this.imageBaseUrl}/${resolution}/page${paddedPageNumber}.png`;
  }

  /**
   * Get word coordinates from Quran Cloud API
   * @param {number} pageNumber - Page number (1-604)
   * @returns {Promise<Object>} Word coordinates
   */
  async getPageWordCoordinates(pageNumber) {
    try {
      // Try the primary endpoint first
      const response = await this.api.get(
        `${this.cloudQuranBaseUrl}/words/by_page/${pageNumber}`,
        {
          params: {
            mushaf: 1, // Medina Mushaf
            include_coordinates: true
          }
        }
      );
      
      return response.data;
    } catch (error) {
      // If that fails, try alternative approach using verses endpoint
      try {
        console.log(`📍 Trying alternative coordinate source for page ${pageNumber}...`);
        const versesResponse = await this.getPageVerses(pageNumber);
        
        // Generate mock coordinates based on verse data
        const mockCoordinates = this.generateMockCoordinates(pageNumber, versesResponse);
        return { words: mockCoordinates };
        
      } catch (altError) {
        console.warn(`⚠️ No coordinates available for page ${pageNumber}, using empty coordinates`);
        return { words: [] };
      }
    }
  }

  /**
   * Get surah information
   * @returns {Promise<Object>} All surahs data
   */
  async getAllSurahs() {
    try {
      const response = await this.api.get(`${this.baseUrl}/chapters`);
      return response.data;
    } catch (error) {
      console.error('Error fetching surahs:', error.message);
      throw new Error('Failed to fetch surah information');
    }
  }

  /**
   * Get page layout information (lines, etc.)
   * @param {number} pageNumber - Page number (1-604)
   * @returns {Promise<Object>} Page layout data
   */
  async getPageLayout(pageNumber) {
    try {
      // This is a mock implementation - you might need to adjust based on actual API
      const verses = await this.getPageVerses(pageNumber);
      
      // Generate line coordinates based on verse distribution
      const lineCoordinates = this.generateLineCoordinates(pageNumber, verses);
      
      return {
        pageNumber,
        lineCoordinates,
        surahInfo: this.extractSurahInfo(verses)
      };
    } catch (error) {
      console.error(`Error fetching layout for page ${pageNumber}:`, error.message);
      throw new Error(`Failed to fetch layout for page ${pageNumber}`);
    }
  }

  /**
   * Generate line coordinates (estimated based on standard Medina Mushaf layout)
   * @private
   */
  generateLineCoordinates(pageNumber, verses) {
    const linesPerPage = 15; // Standard Medina Mushaf has 15 lines per page
    const pageHeight = 1080; // Assuming 1920x1080 resolution
    const lineHeight = pageHeight / (linesPerPage + 2); // +2 for margins
    const startY = lineHeight;
    
    const lineCoordinates = [];
    
    for (let i = 1; i <= linesPerPage; i++) {
      lineCoordinates.push({
        lineNumber: i,
        position: {
          x: 50,
          y: startY + (i - 1) * lineHeight,
          width: 1820, // Full width minus margins
          height: lineHeight * 0.8
        }
      });
    }
    
    return lineCoordinates;
  }

  /**
   * Extract surah information from verses
   * @private
   */
  extractSurahInfo(versesData) {
    if (!versesData || !versesData.verses) return [];
    
    const surahMap = new Map();
    
    versesData.verses.forEach((verse, index) => {
      const surahNumber = verse.chapter_id;
      if (!surahMap.has(surahNumber)) {
        surahMap.set(surahNumber, {
          surahNumber,
          surahName: verse.chapter?.name_arabic || `سورة ${surahNumber}`,
          startLine: Math.floor(index / 10) + 1, // Estimated line distribution
          endLine: Math.floor((index + verse.text_uthmani?.length || 50) / 50) + 1
        });
      }
    });
    
    return Array.from(surahMap.values());
  }

  /**
   * Generate mock coordinates based on verse data
   * @private
   */
  generateMockCoordinates(pageNumber, versesData) {
    if (!versesData || !versesData.verses) return [];
    
    const mockCoordinates = [];
    const pageWidth = 1920;
    const pageHeight = 1080;
    const lineHeight = pageHeight / 16; // Approximate 15 lines per page + margins
    
    let currentLine = 1;
    let currentX = 100; // Start with right margin (RTL)
    let wordIndex = 0;
    
    versesData.verses.forEach((verse) => {
      if (!verse.text_uthmani) return;
      
      const words = verse.text_uthmani.split(' ').filter(word => word.trim());
      
      words.forEach((word, idx) => {
        const wordWidth = word.length * 15; // Approximate width
        
        // Check if we need to wrap to next line
        if (currentX + wordWidth > pageWidth - 100) {
          currentLine++;
          currentX = 100;
        }
        
        mockCoordinates.push({
          id: `${verse.verse_key}_${idx}`,
          text_uthmani: word,
          text: word,
          verse_key: verse.verse_key,
          chapter_id: verse.chapter_id,
          verse_id: verse.verse_number,
          position: wordIndex++,
          location: {
            x: currentX,
            y: currentLine * lineHeight,
            width: wordWidth,
            height: lineHeight * 0.7
          }
        });
        
        currentX += wordWidth + 20; // Add spacing
      });
    });
    
    return mockCoordinates;
  }

  /**
   * Test API connectivity
   * @returns {Promise<boolean>} Connection status
   */
  async testConnection() {
    try {
      await this.api.get(`${this.baseUrl}/chapters/1`);
      console.log('✅ Quran API connection successful');
      return true;
    } catch (error) {
      console.error('❌ Quran API connection failed:', error.message);
      return false;
    }
  }
}

module.exports = new QuranApiService();

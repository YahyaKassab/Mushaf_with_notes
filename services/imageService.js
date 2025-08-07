const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

class ImageService {
  constructor() {
    this.imagesDir = path.join(__dirname, '..', 'public', 'images', 'pages');
    this.thumbnailsDir = path.join(__dirname, '..', 'public', 'images', 'thumbnails');
    this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    
    // Ensure directories exist
    this.initializeDirectories();
  }

  async initializeDirectories() {
    try {
      await fs.ensureDir(this.imagesDir);
      await fs.ensureDir(this.thumbnailsDir);
      console.log('📁 Image directories initialized');
    } catch (error) {
      console.error('Error creating image directories:', error);
    }
  }

  /**
   * Download and save page image
   * @param {number} pageNumber - Page number (1-604)
   * @param {string} imageUrl - Source image URL
   * @param {string} quality - Image quality
   * @returns {Promise<Object>} Local image info
   */
  async downloadPageImage(pageNumber, imageUrl, quality = 'high') {
    try {
      const paddedPageNumber = pageNumber.toString().padStart(3, '0');
      const filename = `page_${paddedPageNumber}_${quality}.png`;
      const localPath = path.join(this.imagesDir, filename);
      
      // Check if image already exists
      if (await fs.pathExists(localPath)) {
        const stats = await fs.stat(localPath);
        return {
          pageNumber,
          localPath,
          publicUrl: `/images/pages/${filename}`,
          size: stats.size,
          exists: true
        };
      }

      console.log(`📥 Downloading page ${pageNumber} image...`);
      
      // Download image
      const response = await axios({
        method: 'GET',
        url: imageUrl,
        responseType: 'stream',
        timeout: 60000
      });

      // Save to file
      const writer = fs.createWriteStream(localPath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', async () => {
          try {
            const stats = await fs.stat(localPath);
            resolve({
              pageNumber,
              localPath,
              publicUrl: `/images/pages/${filename}`,
              size: stats.size,
              exists: false
            });
          } catch (error) {
            reject(error);
          }
        });
        
        writer.on('error', reject);
      });

    } catch (error) {
      console.error(`Error downloading page ${pageNumber} image:`, error.message);
      throw new Error(`Failed to download image for page ${pageNumber}`);
    }
  }

  /**
   * Get local image info
   * @param {number} pageNumber - Page number
   * @param {string} quality - Image quality
   * @returns {Promise<Object|null>} Image info or null if not found
   */
  async getLocalImageInfo(pageNumber, quality = 'high') {
    try {
      const paddedPageNumber = pageNumber.toString().padStart(3, '0');
      const filename = `page_${paddedPageNumber}_${quality}.png`;
      const localPath = path.join(this.imagesDir, filename);
      
      if (await fs.pathExists(localPath)) {
        const stats = await fs.stat(localPath);
        return {
          pageNumber,
          localPath,
          publicUrl: `/images/pages/${filename}`,
          size: stats.size,
          width: null, // You could add image dimension detection here
          height: null,
          format: 'png'
        };
      }
      
      return null;
    } catch (error) {
      console.error(`Error checking local image for page ${pageNumber}:`, error);
      return null;
    }
  }

  /**
   * Get image metadata (dimensions, etc.)
   * @param {string} imagePath - Path to image file
   * @returns {Promise<Object>} Image metadata
   */
  async getImageMetadata(imagePath) {
    try {
      const stats = await fs.stat(imagePath);
      
      // For now, return basic metadata
      // You could add actual image dimension detection using a library like 'sharp'
      return {
        size: stats.size,
        format: path.extname(imagePath).slice(1).toLowerCase(),
        width: 1920, // Default for high quality
        height: 1080,
        created: stats.birthtime,
        modified: stats.mtime
      };
    } catch (error) {
      console.error('Error getting image metadata:', error);
      return null;
    }
  }

  /**
   * Clean up old or corrupted images
   * @returns {Promise<Object>} Cleanup results
   */
  async cleanupImages() {
    try {
      const files = await fs.readdir(this.imagesDir);
      let cleaned = 0;
      let errors = 0;

      for (const file of files) {
        try {
          const filePath = path.join(this.imagesDir, file);
          const stats = await fs.stat(filePath);
          
          // Remove files smaller than 10KB (likely corrupted)
          if (stats.size < 10240) {
            await fs.remove(filePath);
            cleaned++;
            console.log(`🗑️ Removed corrupted image: ${file}`);
          }
        } catch (error) {
          errors++;
          console.error(`Error processing file ${file}:`, error);
        }
      }

      return { cleaned, errors, total: files.length };
    } catch (error) {
      console.error('Error during cleanup:', error);
      throw error;
    }
  }

  /**
   * Get storage statistics
   * @returns {Promise<Object>} Storage stats
   */
  async getStorageStats() {
    try {
      const files = await fs.readdir(this.imagesDir);
      let totalSize = 0;
      let imageCount = 0;

      for (const file of files) {
        try {
          const filePath = path.join(this.imagesDir, file);
          const stats = await fs.stat(filePath);
          totalSize += stats.size;
          imageCount++;
        } catch (error) {
          // Skip problematic files
        }
      }

      return {
        imageCount,
        totalSize,
        totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100,
        averageSize: imageCount > 0 ? Math.round(totalSize / imageCount) : 0
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return { imageCount: 0, totalSize: 0, totalSizeMB: 0, averageSize: 0 };
    }
  }
}

module.exports = new ImageService();

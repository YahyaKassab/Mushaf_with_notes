const express = require('express');
const dataPopulation = require('../services/dataPopulation');
const quranApi = require('../services/quranApi');
const imageService = require('../services/imageService');
const authenticate = require('../middleware/auth');

const router = express.Router();

// Test API connectivity
router.get('/test-connection', authenticate, async (req, res) => {
  try {
    const isConnected = await quranApi.testConnection();
    
    res.json({
      success: true,
      data: {
        apiConnected: isConnected,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to test API connection',
      error: error.message
    });
  }
});

// Get population status
router.get('/status', authenticate, async (req, res) => {
  try {
    const status = await dataPopulation.getPopulationStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get population status',
      error: error.message
    });
  }
});

// Start data population
router.post('/populate', authenticate, async (req, res) => {
  try {
    const {
      startPage = 1,
      endPage = 604,
      forceUpdate = false,
      downloadImages = true,
      imageQuality = 'high'
    } = req.body;

    // Validate inputs
    if (startPage < 1 || endPage > 604 || startPage > endPage) {
      return res.status(400).json({
        success: false,
        message: 'Invalid page range. Must be between 1-604 and startPage <= endPage'
      });
    }

    if (!['high', 'medium', 'low'].includes(imageQuality)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image quality. Must be: high, medium, or low'
      });
    }

    // Start population (this will run in background for large ranges)
    const pageCount = endPage - startPage + 1;
    
    if (pageCount <= 10) {
      // For small ranges, wait for completion
      const results = await dataPopulation.populateAllPages({
        startPage,
        endPage,
        forceUpdate,
        downloadImages,
        imageQuality
      });

      res.json({
        success: true,
        data: results,
        message: `Population completed for pages ${startPage}-${endPage}`
      });
    } else {
      // For large ranges, start background process
      dataPopulation.populateAllPages({
        startPage,
        endPage,
        forceUpdate,
        downloadImages,
        imageQuality
      }).catch(error => {
        console.error('Background population error:', error);
      });

      res.json({
        success: true,
        message: `Population started for pages ${startPage}-${endPage}. This will run in background.`,
        data: {
          startPage,
          endPage,
          pageCount,
          estimatedDuration: `${Math.round(pageCount * 2 / 60)} minutes`
        }
      });
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to start population',
      error: error.message
    });
  }
});

// Populate single page
router.post('/populate/:pageNumber', authenticate, async (req, res) => {
  try {
    const pageNumber = parseInt(req.params.pageNumber);
    const {
      forceUpdate = false,
      downloadImages = true,
      imageQuality = 'high'
    } = req.body;

    if (pageNumber < 1 || pageNumber > 604) {
      return res.status(400).json({
        success: false,
        message: 'Invalid page number. Must be between 1 and 604.'
      });
    }

    const result = await dataPopulation.populatePage(pageNumber, {
      forceUpdate,
      downloadImages,
      imageQuality
    });

    res.json({
      success: true,
      data: result,
      message: `Page ${pageNumber} ${result.success ? 'populated successfully' : 'skipped'}`
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to populate page ${req.params.pageNumber}`,
      error: error.message
    });
  }
});

// Clean up data
router.post('/cleanup', authenticate, async (req, res) => {
  try {
    const results = await dataPopulation.cleanupData();
    
    res.json({
      success: true,
      data: results,
      message: 'Cleanup completed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup data',
      error: error.message
    });
  }
});

// Get storage statistics
router.get('/storage-stats', authenticate, async (req, res) => {
  try {
    const stats = await imageService.getStorageStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get storage statistics',
      error: error.message
    });
  }
});

// Get sample page data for testing
router.get('/sample/:pageNumber', authenticate, async (req, res) => {
  try {
    const pageNumber = parseInt(req.params.pageNumber);
    
    if (pageNumber < 1 || pageNumber > 604) {
      return res.status(400).json({
        success: false,
        message: 'Invalid page number. Must be between 1 and 604.'
      });
    }

    // Get sample data without saving to database
    const [versesData, imageUrl] = await Promise.all([
      quranApi.getPageVerses(pageNumber),
      Promise.resolve(quranApi.getPageImageUrl(pageNumber, 'high'))
    ]);

    res.json({
      success: true,
      data: {
        pageNumber,
        imageUrl,
        versesCount: versesData.verses?.length || 0,
        verses: versesData.verses?.slice(0, 3) || [], // First 3 verses as sample
        apiResponse: {
          hasVerses: !!versesData.verses,
          hasCoordinates: !!versesData.words,
          timestamp: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to get sample data for page ${req.params.pageNumber}`,
      error: error.message
    });
  }
});

module.exports = router;

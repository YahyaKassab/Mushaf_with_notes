const express = require('express');
const { Page } = require('../models');
const authenticate = require('../middleware/auth');
const quranApi = require('../services/quranApi');

const router = express.Router();

// Get all pages (with pagination)
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const pages = await Page.find()
      .sort({ pageNumber: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-wordCoordinates -lineCoordinates') // Exclude large coordinate arrays for list view
      .exec();

    const total = await Page.countDocuments();

    res.json({
      success: true,
      data: {
        pages,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get specific page by page number
router.get('/:pageNumber', authenticate, async (req, res) => {
  try {
    const pageNumber = parseInt(req.params.pageNumber);
    
    if (pageNumber < 1 || pageNumber > 604) {
      return res.status(400).json({
        success: false,
        message: 'Invalid page number. Must be between 1 and 604.'
      });
    }

    const page = await Page.findOne({ pageNumber });

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }

    res.json({
      success: true,
      data: {
        page
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get page image metadata only
router.get('/:pageNumber/metadata', authenticate, async (req, res) => {
  try {
    const pageNumber = parseInt(req.params.pageNumber);
    
    if (pageNumber < 1 || pageNumber > 604) {
      return res.status(400).json({
        success: false,
        message: 'Invalid page number. Must be between 1 and 604.'
      });
    }

    const page = await Page.findOne({ pageNumber })
      .select('pageNumber imageUrl imageMetadata surahInfo');

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }

    res.json({
      success: true,
      data: {
        pageNumber: page.pageNumber,
        imageUrl: page.imageUrl,
        imageMetadata: page.imageMetadata,
        surahInfo: page.surahInfo
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get word coordinates for a specific page
router.get('/:pageNumber/words', authenticate, async (req, res) => {
  try {
    const pageNumber = parseInt(req.params.pageNumber);
    
    if (pageNumber < 1 || pageNumber > 604) {
      return res.status(400).json({
        success: false,
        message: 'Invalid page number. Must be between 1 and 604.'
      });
    }

    const page = await Page.findOne({ pageNumber })
      .select('pageNumber wordCoordinates');

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }

    res.json({
      success: true,
      data: {
        pageNumber: page.pageNumber,
        wordCoordinates: page.wordCoordinates
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get line coordinates for a specific page
router.get('/:pageNumber/lines', authenticate, async (req, res) => {
  try {
    const pageNumber = parseInt(req.params.pageNumber);
    
    if (pageNumber < 1 || pageNumber > 604) {
      return res.status(400).json({
        success: false,
        message: 'Invalid page number. Must be between 1 and 604.'
      });
    }

    const page = await Page.findOne({ pageNumber })
      .select('pageNumber lineCoordinates');

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }

    res.json({
      success: true,
      data: {
        pageNumber: page.pageNumber,
        lineCoordinates: page.lineCoordinates
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Search words on a specific page
router.get('/:pageNumber/search', authenticate, async (req, res) => {
  try {
    const pageNumber = parseInt(req.params.pageNumber);
    const { query, surah, ayah } = req.query;
    
    if (pageNumber < 1 || pageNumber > 604) {
      return res.status(400).json({
        success: false,
        message: 'Invalid page number. Must be between 1 and 604.'
      });
    }

    const page = await Page.findOne({ pageNumber });

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }

    let filteredWords = page.wordCoordinates;

    // Filter by search query
    if (query) {
      filteredWords = filteredWords.filter(word => 
        word.text && word.text.includes(query)
      );
    }

    // Filter by surah
    if (surah) {
      filteredWords = filteredWords.filter(word => 
        word.surah === parseInt(surah)
      );
    }

    // Filter by ayah
    if (ayah) {
      filteredWords = filteredWords.filter(word => 
        word.ayah === parseInt(ayah)
      );
    }

    res.json({
      success: true,
      data: {
        pageNumber,
        matchedWords: filteredWords,
        totalMatches: filteredWords.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get verses text for a specific page
router.get('/:pageNumber/verses', authenticate, async (req, res) => {
  try {
    const pageNumber = parseInt(req.params.pageNumber);
    
    if (pageNumber < 1 || pageNumber > 604) {
      return res.status(400).json({
        success: false,
        message: 'Invalid page number. Must be between 1 and 604.'
      });
    }

    // Try to get verses from Quran API
    try {
      const versesData = await quranApi.getPageVerses(pageNumber);
      
      res.json({
        success: true,
        data: {
          pageNumber,
          verses: versesData.verses || [],
          totalVerses: versesData.verses?.length || 0,
          source: 'api'
        }
      });
    } catch (apiError) {
      // Fallback: return verses from page word coordinates if API fails
      const page = await Page.findOne({ pageNumber }).select('wordCoordinates');
      
      if (!page) {
        return res.status(404).json({
          success: false,
          message: 'Page not found and API unavailable'
        });
      }

      // Group words by verse
      const versesMap = new Map();
      page.wordCoordinates.forEach(word => {
        const verseKey = `${word.surah}:${word.ayah}`;
        if (!versesMap.has(verseKey)) {
          versesMap.set(verseKey, {
            chapter_id: word.surah,
            verse_number: word.ayah,
            verse_key: verseKey,
            text_uthmani: '',
            words: []
          });
        }
        versesMap.get(verseKey).words.push(word);
        versesMap.get(verseKey).text_uthmani += (word.text || '') + ' ';
      });

      const verses = Array.from(versesMap.values()).map(verse => ({
        ...verse,
        text_uthmani: verse.text_uthmani.trim()
      }));

      res.json({
        success: true,
        data: {
          pageNumber,
          verses,
          totalVerses: verses.length,
          source: 'local'
        },
        warning: 'Data retrieved from local coordinates due to API unavailability'
      });
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
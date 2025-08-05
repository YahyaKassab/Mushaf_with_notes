const express = require('express');
const { Note, WordInteraction, LetterMark, Page, Mushaf } = require('../models');
const authenticate = require('../middleware/auth');

const router = express.Router();

// Global search across all user's data
router.get('/', authenticate, async (req, res) => {
  try {
    const { query, mushaf, type, limit = 20 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Build base search criteria
    const baseCriteria = { user: req.user._id };
    if (mushaf) baseCriteria.mushaf = mushaf;

    const results = {
      notes: [],
      letterMarks: [],
      pages: [],
      total: 0
    };

    // Search in notes if not type-specific or type is 'notes'
    if (!type || type === 'notes') {
      const notesCriteria = {
        ...baseCriteria,
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { content: { $regex: query, $options: 'i' } },
          { tags: { $regex: query, $options: 'i' } }
        ]
      };

      results.notes = await Note.find(notesCriteria)
        .populate('page', 'pageNumber')
        .populate('mushaf', 'name')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));
    }

    // Search in letter marks if not type-specific or type is 'marks'
    if (!type || type === 'marks') {
      const marksCriteria = {
        ...baseCriteria,
        note: { $regex: query, $options: 'i' }
      };

      results.letterMarks = await LetterMark.find(marksCriteria)
        .populate('page', 'pageNumber')
        .populate('mushaf', 'name')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));
    }

    // Search in pages/Quran text if not type-specific or type is 'quran'
    if (!type || type === 'quran') {
      const pagesCriteria = {
        'wordCoordinates.text': { $regex: query, $options: 'i' }
      };

      results.pages = await Page.find(pagesCriteria)
        .select('pageNumber wordCoordinates')
        .limit(parseInt(limit));

      // Filter word coordinates to only include matching words
      results.pages = results.pages.map(page => ({
        ...page.toObject(),
        wordCoordinates: page.wordCoordinates.filter(word => 
          word.text && word.text.match(new RegExp(query, 'i'))
        )
      }));
    }

    // Calculate total results
    results.total = results.notes.length + results.letterMarks.length + results.pages.length;

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Search specifically in notes
router.get('/notes', authenticate, async (req, res) => {
  try {
    const { query, mushaf, category, tags, page = 1, limit = 20 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Build search criteria
    const searchCriteria = {
      user: req.user._id,
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { content: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } }
      ]
    };

    if (mushaf) searchCriteria.mushaf = mushaf;
    if (category) searchCriteria.category = category;
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      searchCriteria.tags = { $in: tagArray };
    }

    const notes = await Note.find(searchCriteria)
      .populate('page', 'pageNumber')
      .populate('mushaf', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Note.countDocuments(searchCriteria);

    res.json({
      success: true,
      data: {
        notes,
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

// Search in Quran text
router.get('/quran', authenticate, async (req, res) => {
  try {
    const { query, surah, ayah, page = 1, limit = 20 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Build search criteria
    const searchCriteria = {
      'wordCoordinates.text': { $regex: query, $options: 'i' }
    };

    if (surah) {
      searchCriteria['wordCoordinates.surah'] = parseInt(surah);
    }

    if (ayah) {
      searchCriteria['wordCoordinates.ayah'] = parseInt(ayah);
    }

    const pages = await Page.find(searchCriteria)
      .select('pageNumber wordCoordinates surahInfo')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    // Filter and highlight matching words
    const results = pages.map(pageDoc => {
      const matchingWords = pageDoc.wordCoordinates.filter(word => 
        word.text && word.text.match(new RegExp(query, 'i'))
      );

      return {
        pageNumber: pageDoc.pageNumber,
        surahInfo: pageDoc.surahInfo,
        matchingWords: matchingWords.map(word => ({
          ...word,
          highlighted: word.text.replace(
            new RegExp(query, 'gi'), 
            `<mark>$&</mark>`
          )
        })),
        totalMatches: matchingWords.length
      };
    }).filter(result => result.totalMatches > 0);

    const total = results.length;

    res.json({
      success: true,
      data: {
        results,
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

// Advanced search with filters
router.post('/advanced', authenticate, async (req, res) => {
  try {
    const {
      query,
      mushaf,
      dateRange,
      categories,
      includeNotes = true,
      includeMarks = true,
      includeQuran = false,
      sortBy = 'relevance',
      page = 1,
      limit = 20
    } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const results = {
      notes: [],
      letterMarks: [],
      pages: [],
      total: 0
    };

    // Base criteria for user data
    const baseCriteria = { user: req.user._id };
    if (mushaf) baseCriteria.mushaf = mushaf;

    // Date range filter
    if (dateRange && dateRange.from && dateRange.to) {
      baseCriteria.createdAt = {
        $gte: new Date(dateRange.from),
        $lte: new Date(dateRange.to)
      };
    }

    // Search in notes
    if (includeNotes) {
      const notesCriteria = {
        ...baseCriteria,
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { content: { $regex: query, $options: 'i' } }
        ]
      };

      if (categories && categories.length > 0) {
        notesCriteria.category = { $in: categories };
      }

      let notesQuery = Note.find(notesCriteria)
        .populate('page', 'pageNumber')
        .populate('mushaf', 'name');

      // Apply sorting
      if (sortBy === 'date') {
        notesQuery = notesQuery.sort({ createdAt: -1 });
      } else if (sortBy === 'relevance') {
        // Simple relevance scoring based on title vs content match
        notesQuery = notesQuery.sort({ 
          title: { $regex: query, $options: 'i' } ? -1 : 1,
          createdAt: -1 
        });
      }

      results.notes = await notesQuery
        .limit(parseInt(limit))
        .skip((page - 1) * limit);
    }

    // Search in letter marks
    if (includeMarks) {
      const marksCriteria = {
        ...baseCriteria,
        note: { $regex: query, $options: 'i' }
      };

      if (categories && categories.length > 0) {
        marksCriteria.category = { $in: categories };
      }

      results.letterMarks = await LetterMark.find(marksCriteria)
        .populate('page', 'pageNumber')
        .populate('mushaf', 'name')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));
    }

    // Search in Quran text
    if (includeQuran) {
      results.pages = await Page.find({
        'wordCoordinates.text': { $regex: query, $options: 'i' }
      })
      .select('pageNumber wordCoordinates surahInfo')
      .limit(parseInt(limit));
    }

    results.total = results.notes.length + results.letterMarks.length + results.pages.length;

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get search suggestions/autocomplete
router.get('/suggestions', authenticate, async (req, res) => {
  try {
    const { query, type = 'all', limit = 10 } = req.query;

    if (!query || query.length < 2) {
      return res.json({
        success: true,
        data: {
          suggestions: []
        }
      });
    }

    const suggestions = [];

    // Get suggestions from notes
    if (type === 'all' || type === 'notes') {
      const notesTitles = await Note.find({
        user: req.user._id,
        title: { $regex: query, $options: 'i' }
      })
      .select('title')
      .limit(parseInt(limit))
      .lean();

      suggestions.push(...notesTitles.map(note => ({
        text: note.title,
        type: 'note'
      })));
    }

    // Get suggestions from tags
    if (type === 'all' || type === 'tags') {
      const notesWithTags = await Note.find({
        user: req.user._id,
        tags: { $regex: query, $options: 'i' }
      })
      .select('tags')
      .limit(parseInt(limit))
      .lean();

      const matchingTags = [];
      notesWithTags.forEach(note => {
        note.tags.forEach(tag => {
          if (tag.toLowerCase().includes(query.toLowerCase()) && !matchingTags.includes(tag)) {
            matchingTags.push(tag);
          }
        });
      });

      suggestions.push(...matchingTags.slice(0, limit).map(tag => ({
        text: tag,
        type: 'tag'
      })));
    }

    // Remove duplicates and limit results
    const uniqueSuggestions = suggestions
      .filter((suggestion, index, self) => 
        index === self.findIndex(s => s.text === suggestion.text)
      )
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      data: {
        suggestions: uniqueSuggestions
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

module.exports = router;
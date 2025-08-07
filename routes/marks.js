const express = require('express');
const { LetterMark, Mushaf } = require('../models');
const authenticate = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

const router = express.Router();

// Get all letter marks for a specific Mushaf/page
router.get('/', authenticate, async (req, res) => {
  try {
    const { mushaf, page, category, markType } = req.query;

    if (!mushaf) {
      return res.status(400).json({
        success: false,
        message: 'Mushaf ID is required'
      });
    }

    // Verify user owns the Mushaf
    const mushafDoc = await Mushaf.findOne({
      _id: mushaf,
      owner: req.user._id
    });

    if (!mushafDoc) {
      return res.status(404).json({
        success: false,
        message: 'Mushaf not found'
      });
    }

    // Build query
    const query = { mushaf, user: req.user._id };
    if (page) query.page = page;
    if (category) query.category = category;
    if (markType) query.markType = markType;

    const marks = await LetterMark.find(query)
      .populate('page', 'pageNumber')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        marks
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

// Get specific letter mark
router.get('/:id', authenticate, async (req, res) => {
  try {
    const mark = await LetterMark.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('page', 'pageNumber')
     .populate('mushaf', 'name');

    if (!mark) {
      return res.status(404).json({
        success: false,
        message: 'Letter mark not found'
      });
    }

    res.json({
      success: true,
      data: {
        mark
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

// Create new letter mark
router.post('/', authenticate, validate(schemas.createLetterMark), async (req, res) => {
  try {
    const { 
      mushaf, 
      page, 
      wordId, 
      letterPosition, 
      markType, 
      coordinates, 
      style, 
      category, 
      note 
    } = req.body;

    // Verify user owns the Mushaf
    const mushafDoc = await Mushaf.findOne({
      _id: mushaf,
      owner: req.user._id
    });

    if (!mushafDoc) {
      return res.status(404).json({
        success: false,
        message: 'Mushaf not found'
      });
    }

    // Check if mark already exists
    const existingMark = await LetterMark.findOne({
      mushaf,
      user: req.user._id,
      wordId,
      letterPosition,
      markType
    });

    if (existingMark) {
      return res.status(409).json({
        success: false,
        message: 'Letter mark already exists for this position and type'
      });
    }

    const letterMark = new LetterMark({
      mushaf,
      user: req.user._id,
      page,
      wordId,
      letterPosition,
      markType,
      coordinates,
      style: {
        color: style?.color || '#FF6B6B',
        thickness: style?.thickness || 1,
        opacity: style?.opacity || 0.8
      },
      category: category || 'emphasis',
      note
    });

    await letterMark.save();

    // Update Mushaf statistics
    await Mushaf.findByIdAndUpdate(mushaf, {
      $inc: { 'statistics.totalMarks': 1 }
    });

    const populatedMark = await LetterMark.findById(letterMark._id)
      .populate('page', 'pageNumber')
      .populate('mushaf', 'name');

    res.status(201).json({
      success: true,
      message: 'Letter mark created successfully',
      data: {
        mark: populatedMark
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

// Update letter mark
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { coordinates, style, category, note } = req.body;

    const mark = await LetterMark.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!mark) {
      return res.status(404).json({
        success: false,
        message: 'Letter mark not found'
      });
    }

    // Update fields
    if (coordinates) mark.coordinates = { ...mark.coordinates, ...coordinates };
    if (style) mark.style = { ...mark.style, ...style };
    if (category !== undefined) mark.category = category;
    if (note !== undefined) mark.note = note;

    await mark.save();

    const populatedMark = await LetterMark.findById(mark._id)
      .populate('page', 'pageNumber')
      .populate('mushaf', 'name');

    res.json({
      success: true,
      message: 'Letter mark updated successfully',
      data: {
        mark: populatedMark
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

// Delete letter mark
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const mark = await LetterMark.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!mark) {
      return res.status(404).json({
        success: false,
        message: 'Letter mark not found'
      });
    }

    // Update Mushaf statistics
    await Mushaf.findByIdAndUpdate(mark.mushaf, {
      $inc: { 'statistics.totalMarks': -1 }
    });

    res.json({
      success: true,
      message: 'Letter mark deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get marks by word
router.get('/word/:wordId', authenticate, async (req, res) => {
  try {
    const { mushaf } = req.query;

    if (!mushaf) {
      return res.status(400).json({
        success: false,
        message: 'Mushaf ID is required'
      });
    }

    // Verify user owns the Mushaf
    const mushafDoc = await Mushaf.findOne({
      _id: mushaf,
      owner: req.user._id
    });

    if (!mushafDoc) {
      return res.status(404).json({
        success: false,
        message: 'Mushaf not found'
      });
    }

    const marks = await LetterMark.find({
      wordId: req.params.wordId,
      mushaf,
      user: req.user._id
    })
    .populate('page', 'pageNumber')
    .sort({ letterPosition: 1 });

    res.json({
      success: true,
      data: {
        marks
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

// Get marks by category
router.get('/category/:category', authenticate, async (req, res) => {
  try {
    const { mushaf } = req.query;

    if (!mushaf) {
      return res.status(400).json({
        success: false,
        message: 'Mushaf ID is required'
      });
    }

    // Verify user owns the Mushaf
    const mushafDoc = await Mushaf.findOne({
      _id: mushaf,
      owner: req.user._id
    });

    if (!mushafDoc) {
      return res.status(404).json({
        success: false,
        message: 'Mushaf not found'
      });
    }

    const marks = await LetterMark.find({
      category: req.params.category,
      mushaf,
      user: req.user._id
    })
    .populate('page', 'pageNumber')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        marks,
        category: req.params.category
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

// Search marks by note content
router.get('/search', authenticate, async (req, res) => {
  try {
    const { query, mushaf, category } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Build search criteria
    const searchCriteria = {
      user: req.user._id,
      note: { $regex: query, $options: 'i' }
    };

    if (mushaf) searchCriteria.mushaf = mushaf;
    if (category) searchCriteria.category = category;

    const marks = await LetterMark.find(searchCriteria)
      .populate('page', 'pageNumber')
      .populate('mushaf', 'name')
      .sort({ createdAt: -1 })
      .limit(50); // Limit search results

    res.json({
      success: true,
      data: {
        marks,
        totalResults: marks.length
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
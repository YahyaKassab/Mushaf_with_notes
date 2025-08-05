const express = require('express');
const { Note, Mushaf } = require('../models');
const authenticate = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

const router = express.Router();

// Get all notes for a specific Mushaf
router.get('/', authenticate, async (req, res) => {
  try {
    const { mushaf, page, category, tags, page: pageNum = 1, limit = 20 } = req.query;

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
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      query.tags = { $in: tagArray };
    }

    const notes = await Note.find(query)
      .populate('page', 'pageNumber')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((pageNum - 1) * limit)
      .exec();

    const total = await Note.countDocuments(query);

    res.json({
      success: true,
      data: {
        notes,
        pagination: {
          currentPage: parseInt(pageNum),
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

// Get specific note
router.get('/:id', authenticate, async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('page', 'pageNumber')
     .populate('mushaf', 'name');

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    res.json({
      success: true,
      data: {
        note
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

// Create new note
router.post('/', authenticate, validate(schemas.createNote), async (req, res) => {
  try {
    const { title, content, mushaf, page, position, category, tags, color } = req.body;

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

    const note = new Note({
      title,
      content,
      mushaf,
      user: req.user._id,
      page,
      position,
      category: category || 'general',
      tags: tags || [],
      color: color || '#FFE4B5'
    });

    await note.save();

    // Update Mushaf statistics
    await Mushaf.findByIdAndUpdate(mushaf, {
      $inc: { 'statistics.totalNotes': 1 }
    });

    const populatedNote = await Note.findById(note._id)
      .populate('page', 'pageNumber')
      .populate('mushaf', 'name');

    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      data: {
        note: populatedNote
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

// Update note
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { title, content, category, tags, color, isPrivate } = req.body;

    const note = await Note.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    // Update fields
    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    if (category !== undefined) note.category = category;
    if (tags !== undefined) note.tags = tags;
    if (color !== undefined) note.color = color;
    if (isPrivate !== undefined) note.isPrivate = isPrivate;

    await note.save();

    const populatedNote = await Note.findById(note._id)
      .populate('page', 'pageNumber')
      .populate('mushaf', 'name');

    res.json({
      success: true,
      message: 'Note updated successfully',
      data: {
        note: populatedNote
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

// Delete note
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    // Update Mushaf statistics
    await Mushaf.findByIdAndUpdate(note.mushaf, {
      $inc: { 'statistics.totalNotes': -1 }
    });

    res.json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get notes by page
router.get('/page/:pageId', authenticate, async (req, res) => {
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

    const notes = await Note.find({
      page: req.params.pageId,
      mushaf,
      user: req.user._id
    }).sort({ 'position.lineNumber': 1, createdAt: 1 });

    res.json({
      success: true,
      data: {
        notes
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

// Search notes
router.get('/search', authenticate, async (req, res) => {
  try {
    const { query, mushaf, category, tags } = req.query;

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
        { content: { $regex: query, $options: 'i' } }
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
      .limit(50); // Limit search results

    res.json({
      success: true,
      data: {
        notes,
        totalResults: notes.length
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
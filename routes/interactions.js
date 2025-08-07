const express = require('express');
const { WordInteraction, Mushaf } = require('../models');
const authenticate = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

const router = express.Router();

// Get all word interactions for a specific Mushaf/page
router.get('/', authenticate, async (req, res) => {
  try {
    const { mushaf, page, interactionType } = req.query;

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
    if (interactionType) query.interactionType = interactionType;

    const interactions = await WordInteraction.find(query)
      .populate('page', 'pageNumber')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        interactions
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

// Get specific word interaction
router.get('/:id', authenticate, async (req, res) => {
  try {
    const interaction = await WordInteraction.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('page', 'pageNumber')
     .populate('mushaf', 'name');

    if (!interaction) {
      return res.status(404).json({
        success: false,
        message: 'Word interaction not found'
      });
    }

    res.json({
      success: true,
      data: {
        interaction
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

// Create new word interaction
router.post('/', authenticate, validate(schemas.createWordInteraction), async (req, res) => {
  try {
    const { mushaf, page, wordId, interactionType, style } = req.body;

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

    // Check if interaction already exists
    const existingInteraction = await WordInteraction.findOne({
      mushaf,
      user: req.user._id,
      wordId,
      interactionType
    });

    if (existingInteraction) {
      return res.status(409).json({
        success: false,
        message: 'Word interaction already exists for this word and type'
      });
    }

    const interaction = new WordInteraction({
      mushaf,
      user: req.user._id,
      page,
      wordId,
      interactionType,
      style: {
        color: style?.color || '#FFD700',
        thickness: style?.thickness || 2,
        opacity: style?.opacity || 0.7
      }
    });

    await interaction.save();

    // Update Mushaf statistics
    await Mushaf.findByIdAndUpdate(mushaf, {
      $inc: { 'statistics.totalInteractions': 1 }
    });

    const populatedInteraction = await WordInteraction.findById(interaction._id)
      .populate('page', 'pageNumber')
      .populate('mushaf', 'name');

    res.status(201).json({
      success: true,
      message: 'Word interaction created successfully',
      data: {
        interaction: populatedInteraction
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

// Update word interaction
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { style } = req.body;

    const interaction = await WordInteraction.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!interaction) {
      return res.status(404).json({
        success: false,
        message: 'Word interaction not found'
      });
    }

    // Update style
    if (style) {
      interaction.style = { ...interaction.style, ...style };
    }

    await interaction.save();

    const populatedInteraction = await WordInteraction.findById(interaction._id)
      .populate('page', 'pageNumber')
      .populate('mushaf', 'name');

    res.json({
      success: true,
      message: 'Word interaction updated successfully',
      data: {
        interaction: populatedInteraction
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

// Delete word interaction
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const interaction = await WordInteraction.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!interaction) {
      return res.status(404).json({
        success: false,
        message: 'Word interaction not found'
      });
    }

    // Update Mushaf statistics
    await Mushaf.findByIdAndUpdate(interaction.mushaf, {
      $inc: { 'statistics.totalInteractions': -1 }
    });

    res.json({
      success: true,
      message: 'Word interaction deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get interactions by word
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

    const interactions = await WordInteraction.find({
      wordId: req.params.wordId,
      mushaf,
      user: req.user._id
    }).populate('page', 'pageNumber');

    res.json({
      success: true,
      data: {
        interactions
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

// Toggle word interaction (create if not exists, delete if exists)
router.post('/toggle', authenticate, async (req, res) => {
  try {
    const { mushaf, page, wordId, interactionType, style } = req.body;

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

    // Check if interaction already exists
    const existingInteraction = await WordInteraction.findOne({
      mushaf,
      user: req.user._id,
      wordId,
      interactionType
    });

    if (existingInteraction) {
      // Delete existing interaction
      await WordInteraction.findByIdAndDelete(existingInteraction._id);
      
      // Update Mushaf statistics
      await Mushaf.findByIdAndUpdate(mushaf, {
        $inc: { 'statistics.totalInteractions': -1 }
      });

      res.json({
        success: true,
        message: 'Word interaction removed',
        data: {
          action: 'removed'
        }
      });
    } else {
      // Create new interaction
      const interaction = new WordInteraction({
        mushaf,
        user: req.user._id,
        page,
        wordId,
        interactionType,
        style: {
          color: style?.color || '#FFD700',
          thickness: style?.thickness || 2,
          opacity: style?.opacity || 0.7
        }
      });

      await interaction.save();

      // Update Mushaf statistics
      await Mushaf.findByIdAndUpdate(mushaf, {
        $inc: { 'statistics.totalInteractions': 1 }
      });

      const populatedInteraction = await WordInteraction.findById(interaction._id)
        .populate('page', 'pageNumber')
        .populate('mushaf', 'name');

      res.status(201).json({
        success: true,
        message: 'Word interaction created',
        data: {
          action: 'created',
          interaction: populatedInteraction
        }
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
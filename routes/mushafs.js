const express = require('express');
const { Mushaf } = require('../models');
const authenticate = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

const router = express.Router();

// Get all user's Mushafs
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = req.query;
    
    const mushafs = await Mushaf.find({ owner: req.user._id })
      .sort({ [sort]: order === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Mushaf.countDocuments({ owner: req.user._id });

    res.json({
      success: true,
      data: {
        mushafs,
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

// Get specific Mushaf
router.get('/:id', authenticate, async (req, res) => {
  try {
    const mushaf = await Mushaf.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!mushaf) {
      return res.status(404).json({
        success: false,
        message: 'Mushaf not found'
      });
    }

    // Update last accessed time
    mushaf.metadata.lastAccessed = new Date();
    await mushaf.save();

    res.json({
      success: true,
      data: {
        mushaf
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

// Create new Mushaf
router.post('/', authenticate, validate(schemas.createMushaf), async (req, res) => {
  try {
    const { name, description, settings } = req.body;

    const mushaf = new Mushaf({
      name,
      description,
      owner: req.user._id,
      settings: {
        ...settings,
        isPublic: settings?.isPublic || false,
        allowCollaboration: settings?.allowCollaboration || false,
        theme: settings?.theme || 'classic'
      }
    });

    await mushaf.save();

    res.status(201).json({
      success: true,
      message: 'Mushaf created successfully',
      data: {
        mushaf
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

// Update Mushaf
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, description, settings } = req.body;
    
    const mushaf = await Mushaf.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!mushaf) {
      return res.status(404).json({
        success: false,
        message: 'Mushaf not found'
      });
    }

    // Update fields
    if (name !== undefined) mushaf.name = name;
    if (description !== undefined) mushaf.description = description;
    if (settings) {
      mushaf.settings = { ...mushaf.settings, ...settings };
    }

    await mushaf.save();

    res.json({
      success: true,
      message: 'Mushaf updated successfully',
      data: {
        mushaf
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

// Delete Mushaf
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const mushaf = await Mushaf.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!mushaf) {
      return res.status(404).json({
        success: false,
        message: 'Mushaf not found'
      });
    }

    // TODO: Also delete related notes, interactions, and marks
    // This would be implemented in a production environment

    res.json({
      success: true,
      message: 'Mushaf deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Update current page
router.patch('/:id/current-page', authenticate, async (req, res) => {
  try {
    const { pageNumber } = req.body;

    if (!pageNumber || pageNumber < 1 || pageNumber > 604) {
      return res.status(400).json({
        success: false,
        message: 'Invalid page number. Must be between 1 and 604.'
      });
    }

    const mushaf = await Mushaf.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { 
        'metadata.currentPage': pageNumber,
        'metadata.lastAccessed': new Date()
      },
      { new: true }
    );

    if (!mushaf) {
      return res.status(404).json({
        success: false,
        message: 'Mushaf not found'
      });
    }

    res.json({
      success: true,
      message: 'Current page updated successfully',
      data: {
        mushaf
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

// Get Mushaf statistics
router.get('/:id/statistics', authenticate, async (req, res) => {
  try {
    const mushaf = await Mushaf.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!mushaf) {
      return res.status(404).json({
        success: false,
        message: 'Mushaf not found'
      });
    }

    // TODO: Calculate real-time statistics from related collections
    // For now, return the stored statistics

    res.json({
      success: true,
      data: {
        statistics: mushaf.statistics,
        metadata: mushaf.metadata
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
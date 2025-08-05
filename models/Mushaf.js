const mongoose = require('mongoose');

const mushafSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  settings: {
    isPublic: {
      type: Boolean,
      default: false
    },
    allowCollaboration: {
      type: Boolean,
      default: false
    },
    theme: {
      type: String,
      default: 'classic'
    }
  },
  metadata: {
    totalPages: {
      type: Number,
      default: 604
    },
    currentPage: {
      type: Number,
      default: 1
    },
    lastAccessed: {
      type: Date,
      default: Date.now
    }
  },
  statistics: {
    totalNotes: {
      type: Number,
      default: 0
    },
    totalInteractions: {
      type: Number,
      default: 0
    },
    totalMarks: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Index for efficient queries
mushafSchema.index({ owner: 1, createdAt: -1 });
mushafSchema.index({ 'settings.isPublic': 1 });

module.exports = mongoose.model('Mushaf', mushafSchema);
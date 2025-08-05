const mongoose = require('mongoose');

const letterMarkSchema = new mongoose.Schema({
  mushaf: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mushaf',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  page: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Page',
    required: true
  },
  wordId: {
    type: String,
    required: true
  },
  letterPosition: {
    type: Number,
    required: true,
    min: 0
  },
  markType: {
    type: String,
    enum: ['circle', 'underline', 'highlight', 'cross'],
    required: true
  },
  coordinates: {
    x: {
      type: Number,
      required: true
    },
    y: {
      type: Number,
      required: true
    },
    radius: {
      type: Number,
      default: 10
    }
  },
  style: {
    color: {
      type: String,
      default: '#FF6B6B'
    },
    thickness: {
      type: Number,
      default: 1
    },
    opacity: {
      type: Number,
      default: 0.8,
      min: 0,
      max: 1
    }
  },
  category: {
    type: String,
    enum: ['tajweed', 'mistake', 'emphasis', 'question'],
    default: 'emphasis'
  },
  note: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Compound index for uniqueness
letterMarkSchema.index({ 
  mushaf: 1, 
  user: 1, 
  wordId: 1, 
  letterPosition: 1,
  markType: 1
}, { unique: true });

// Index for efficient queries
letterMarkSchema.index({ mushaf: 1, page: 1 });
letterMarkSchema.index({ user: 1, category: 1 });

module.exports = mongoose.model('LetterMark', letterMarkSchema);
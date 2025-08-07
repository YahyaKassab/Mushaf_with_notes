const mongoose = require('mongoose');

const wordInteractionSchema = new mongoose.Schema({
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
  interactionType: {
    type: String,
    enum: ['underline', 'highlight', 'bookmark'],
    required: true
  },
  style: {
    color: {
      type: String,
      default: '#FFD700'
    },
    thickness: {
      type: Number,
      default: 2
    },
    opacity: {
      type: Number,
      default: 0.7,
      min: 0,
      max: 1
    }
  },
  metadata: {
    surah: Number,
    ayah: Number,
    wordIndex: Number,
    arabicText: String
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate interactions
wordInteractionSchema.index({ 
  mushaf: 1, 
  user: 1, 
  wordId: 1, 
  interactionType: 1 
}, { unique: true });

// Index for efficient queries
wordInteractionSchema.index({ mushaf: 1, page: 1 });
wordInteractionSchema.index({ user: 1, interactionType: 1 });

module.exports = mongoose.model('WordInteraction', wordInteractionSchema);
const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
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
  position: {
    lineNumber: {
      type: Number,
      required: true
    },
    x: Number,
    y: Number
  },
  category: {
    type: String,
    enum: ['memorization', 'tajweed', 'general', 'reflection'],
    default: 'general'
  },
  tags: [String],
  isPrivate: {
    type: Boolean,
    default: true
  },
  color: {
    type: String,
    default: '#FFE4B5'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
noteSchema.index({ mushaf: 1, page: 1 });
noteSchema.index({ user: 1, createdAt: -1 });
noteSchema.index({ category: 1 });
noteSchema.index({ tags: 1 });

module.exports = mongoose.model('Note', noteSchema);
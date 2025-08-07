const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema({
  pageNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 604
  },
  imageUrl: {
    type: String,
    required: true
  },
  imageMetadata: {
    width: Number,
    height: Number,
    format: String,
    size: Number
  },
  wordCoordinates: [{
    wordId: String,
    text: String,
    position: {
      x: Number,
      y: Number,
      width: Number,
      height: Number
    },
    surah: Number,
    ayah: Number,
    wordIndex: Number
  }],
  lineCoordinates: [{
    lineNumber: Number,
    position: {
      x: Number,
      y: Number,
      width: Number,
      height: Number
    }
  }],
  surahInfo: [{
    surahNumber: Number,
    surahName: String,
    startLine: Number,
    endLine: Number
  }]
}, {
  timestamps: true
});

// Ensure unique page numbers
pageSchema.index({ pageNumber: 1 }, { unique: true });

// Index for efficient word lookups
pageSchema.index({ 'wordCoordinates.wordId': 1 });
pageSchema.index({ 'wordCoordinates.surah': 1, 'wordCoordinates.ayah': 1 });

module.exports = mongoose.model('Page', pageSchema);
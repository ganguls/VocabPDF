const mongoose = require('mongoose');

const vocabularySchema = new mongoose.Schema(
  {
    word: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    meaning_en: {
      type: String,
      required: true,
      trim: true,
    },
    meaning_si: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Vocabulary', vocabularySchema);

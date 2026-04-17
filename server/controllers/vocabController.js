const Vocabulary = require('../models/Vocabulary');

// GET /api/vocab — return all saved words
const getAllWords = async (req, res, next) => {
  try {
    const words = await Vocabulary.find().sort({ createdAt: -1 });
    res.json(words);
  } catch (error) {
    next(error);
  }
};

// GET /api/vocab/check?words=word1,word2
const checkWords = async (req, res, next) => {
  try {
    const { words } = req.query;
    if (!words) return res.json({ existing: [], new: [] });

    const wordList = words
      .split(',')
      .map((w) => w.trim().toLowerCase())
      .filter(Boolean);

    const found = await Vocabulary.find({ word: { $in: wordList } }).select('word');
    const existingSet = new Set(found.map((v) => v.word));

    const existing = wordList.filter((w) => existingSet.has(w));
    const newWords = wordList.filter((w) => !existingSet.has(w));

    res.json({ existing, new: newWords });
  } catch (error) {
    next(error);
  }
};

// POST /api/vocab/save
const saveWords = async (req, res, next) => {
  try {
    const { words } = req.body;

    if (!words || !Array.isArray(words) || words.length === 0) {
      return res.status(400).json({ error: 'Words array is required.' });
    }

    const normalizedWords = words.map((w) => ({
      word: w.word.toLowerCase().trim(),
      meaning_en: w.meaning_en,
      meaning_si: w.meaning_si,
    }));

    const wordList = normalizedWords.map((w) => w.word);
    const alreadyExisting = await Vocabulary.find({ word: { $in: wordList } }).select('word');
    const existingSet = new Set(alreadyExisting.map((v) => v.word));

    const toInsert = normalizedWords.filter((w) => !existingSet.has(w.word));
    const skipped = normalizedWords.length - toInsert.length;

    let savedCount = 0;
    if (toInsert.length > 0) {
      await Vocabulary.insertMany(toInsert, { ordered: false });
      savedCount = toInsert.length;
    }

    res.json({
      success: true,
      saved: savedCount,
      skipped,
      message: `${savedCount} word(s) saved, ${skipped} duplicate(s) skipped.`,
    });
  } catch (error) {
    // Handle duplicate key errors from race conditions
    if (error.code === 11000) {
      return res.json({
        success: true,
        saved: 0,
        skipped: req.body.words?.length || 0,
        message: 'All words already exist in the database.',
      });
    }
    next(error);
  }
};

module.exports = { getAllWords, checkWords, saveWords };

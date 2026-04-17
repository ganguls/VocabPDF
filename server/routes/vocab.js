const express = require('express');
const router = express.Router();
const { getAllWords, checkWords, saveWords } = require('../controllers/vocabController');

// GET /api/vocab
router.get('/', getAllWords);

// GET /api/vocab/check?words=word1,word2
router.get('/check', checkWords);

// POST /api/vocab/save
router.post('/save', saveWords);

module.exports = router;

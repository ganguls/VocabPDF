const express = require('express');
const router = express.Router();
const { processText, processImage, explainWord, fastTranslate } = require('../controllers/aiController');

// POST /api/ai/process
router.post('/process', processText);
router.post('/process-image', processImage);
router.post('/explain', explainWord);
router.post('/fast-translate', fastTranslate);

module.exports = router;

const express = require('express');
const router = express.Router();
const { processText, processImage, explainWord } = require('../controllers/aiController');

// POST /api/ai/process
router.post('/process', processText);
router.post('/process-image', processImage);
router.post('/explain', explainWord);

module.exports = router;

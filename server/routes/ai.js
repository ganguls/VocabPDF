const express = require('express');
const router = express.Router();
const { processText } = require('../controllers/aiController');

// POST /api/ai/process
router.post('/process', processText);

module.exports = router;

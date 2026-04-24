const { GoogleGenAI } = require('@google/genai');

const MAX_TEXT_LENGTH = 3000;

const processText = async (req, res, next) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Selected text is required.' });
    }

    const trimmedText = text.trim().slice(0, MAX_TEXT_LENGTH);

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `You are a language assistant.

For the given English text:
1. Translate it into natural, fluent Sinhala. Ensure the entire translation is in Sinhala.
2. Extract important or advanced vocabulary words from the text.
3. For each word, provide:
   - English meaning
   - Sinhala meaning

Return ONLY valid JSON in the following format:
{
  "translation": "Sinhala translation of the full text",
  "words": [
    {
      "word": "string",
      "meaning_en": "string",
      "meaning_si": "string"
    }
  ]
}

Rules:
- Only include meaningful vocabulary words, not basic common words.
- Avoid duplicates in the word list.
- Keep output strictly JSON, no explanations or extra text.

Input text:
"${trimmedText}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const responseText = response.text;

    // Safely extract JSON (strip markdown fences if present)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(502).json({
        error: 'AI returned an invalid response. Please try again.',
        raw: responseText,
      });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed.translation || !Array.isArray(parsed.words)) {
      return res.status(502).json({
        error: 'AI response structure is invalid.',
        raw: responseText,
      });
    }

    // Normalize words to lowercase
    parsed.words = parsed.words.map((w) => ({
      ...w,
      word: w.word.toLowerCase().trim(),
    }));

    res.json(parsed);
  } catch (error) {
    console.error('[AI Controller Error]', error.message);
    next(error);
  }
};

const processImage = async (req, res, next) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'Missing imageBase64 data' });

    // Clean data URL prefix if present
    const base64Data = imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

    const prompt = `
    You are an expert language OCR and extraction system. Look at the image provided, which is a snippet from a document.
    Extract the main text visible in the image. Then, generate a translation entirely in fluent Sinhala, and extract vocabulary from the text.
    Return ONLY valid JSON matching this schema:
    {
      "translation_si": "The translation of the extracted text in Sinhala",
      "vocabulary": [
        { "word": "example", "meaning_en": "example meaning", "meaning_si": "උදාහරණය", "context": "example context" }
      ]
    }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Data
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: 'application/json',
      }
    });

    const resultText = response.text;
    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid JSON format from AI');

    const result = JSON.parse(jsonMatch[0]);
    res.json(result);
  } catch (error) {
    console.error('Gemini Vision API Error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to process image snippet.' });
  }
};

const explainWord = async (req, res, next) => {
  try {
    const { word } = req.body;
    if (!word) return res.status(400).json({ error: 'Missing word parameter.' });

    const prompt = `
    You are an expert English-Sinhala language tutor.
    Provide a deep explanation for the English word: "${word}"

    Return ONLY a valid JSON object matching this schema:
    {
      "word": "${word}",
      "partOfSpeech": "noun/verb/etc.",
      "explanation_en": "Detailed nuanced explanation in English.",
      "explanation_si": "Detailed nuanced explanation in fluent Sinhala.",
      "examples": [
        { "en": "Example sentence 1", "si": "Translation of example 1 in Sinhala" },
        { "en": "Example sentence 2", "si": "Translation of example 2 in Sinhala" }
      ],
      "synonyms": ["word1", "word2"]
    }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const resultText = response.text;
    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid JSON format from AI');

    const result = JSON.parse(jsonMatch[0]);
    res.json(result);
  } catch (error) {
    console.error('Gemini Explain API Error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to explain word.' });
  }
};

const fastTranslate = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required for fast translation.' });
    }

    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=si&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    const data = await response.json();

    const translation = data[0].map(item => item[0]).join('');

    res.json({ translation });
  } catch (error) {
    console.error('[Fast Translate Error]', error.message);
    res.status(500).json({ error: 'Failed to perform fast translation.' });
  }
};

module.exports = { processText, processImage, explainWord, fastTranslate };

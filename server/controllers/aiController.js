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
1. Translate it into Sinhala clearly and naturally.
2. Extract important or advanced vocabulary words from the text.
3. For each word, provide:
   - English meaning
   - Sinhala meaning

Return ONLY valid JSON in the following format:
{
  "translation": "Sinhala translation of full text",
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

module.exports = { processText };

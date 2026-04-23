const { Client } = require('@notionhq/client');

// Initialize Notion Client
const notion = new Client({ auth: process.env.NOTION_TOKEN });

/**
 * Asynchronously syncs a newly saved word to the configured Notion Database.
 * Fails safely (logs error) to avoid crashing the server if Notion API fails.
 * 
 * @param {Object} wordData 
 * @param {string} wordData.word
 * @param {string} wordData.meaning_en
 * @param {string} wordData.meaning_si
 * @param {string} wordData.sentence
 */
const syncWordToNotion = async (wordData) => {
  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!process.env.NOTION_TOKEN || !databaseId) {
    console.warn('Notion sync skipped: NOTION_TOKEN or NOTION_DATABASE_ID missing in .env');
    return;
  }

  try {
    await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        // "Word" (title property)
        Word: {
          title: [
            {
              text: {
                content: wordData.word || '',
              },
            },
          ],
        },
        // "Meaning (EN)" (rich_text property)
        'Meaning (EN)': {
          rich_text: [
            {
              text: {
                content: wordData.meaning_en || '',
              },
            },
          ],
        },
        // "Meaning (SI)" (rich_text property)
        'Meaning (SI)': {
          rich_text: [
            {
              text: {
                content: wordData.meaning_si || '',
              },
            },
          ],
        },
        // "Sentence" (rich_text property)
        Sentence: {
          rich_text: [
            {
              text: {
                content: wordData.sentence || '',
              },
            },
          ],
        },
      },
    });
    console.log(`Successfully synced word to Notion: ${wordData.word}`);
  } catch (error) {
    console.error(`Failed to sync '${wordData.word}' to Notion:`, error.body || error.message);
  }
};

module.exports = { syncWordToNotion };

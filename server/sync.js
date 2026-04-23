require('dotenv').config();
const mongoose = require('mongoose');
const { syncWordToNotion } = require('./services/notionService');
const Vocabulary = require('./models/Vocabulary');

async function main() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    
    const words = await Vocabulary.find();
    console.log(`Found ${words.length} words in MongoDB. Syncing to Notion...`);
    
    let count = 0;
    for (const w of words) {
      count++;
      console.log(`Syncing word ${count}/${words.length}: ${w.word}`);
      await syncWordToNotion({ 
        word: w.word, 
        meaning_en: w.meaning_en, 
        meaning_si: w.meaning_si, 
        sentence: w.sentence || '' 
      });
      // Wait 500ms to avoid Notion rate limits (3 requests per second)
      await new Promise(res => setTimeout(res, 500));
    }
    
    console.log('Sync complete!');
    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}
main();

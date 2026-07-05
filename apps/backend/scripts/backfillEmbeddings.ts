import 'dotenv/config';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { connectDB } from '../config/db.js';
import mongoose from 'mongoose';
import { FAQ } from '../models/FAQ.js';
import { tryGenerateEmbedding } from '../utils/embeddings.js';

async function main() {
  await connectDB();

  const missing = await FAQ.find({ embedding: { $exists: false } }).select('question answer');
  console.log(`Found ${missing.length} FAQ(s) without an embedding.`);

  let succeeded = 0;
  let failed = 0;

  for (const faq of missing) {
    const embedding = await tryGenerateEmbedding(`${faq.question}\n${faq.answer}`);
    if (embedding) {
      await FAQ.updateOne({ _id: faq._id }, { $set: { embedding } });
      succeeded++;
    } else {
      failed++;
    }
    if ((succeeded + failed) % 25 === 0) {
      console.log(`  ...${succeeded + failed}/${missing.length} processed`);
    }
  }

  console.log(`Done. ${succeeded} embedded, ${failed} failed (will retry next run).`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

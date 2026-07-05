import 'dotenv/config';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { connectDB } from '../config/db.js';
import mongoose from 'mongoose';
import { EMBEDDING_DIMENSIONS } from '../utils/embeddings.js';
import { VECTOR_INDEX_NAME } from '../controllers/searchController.js';

async function main() {
  await connectDB();
  const db = mongoose.connection.db;
  if (!db) throw new Error('No active DB connection');

  const collection = db.collection('yaksha_faq_faqs');

  const existing = await collection.listSearchIndexes().toArray().catch(() => []);
  if (existing.some((idx: any) => idx.name === VECTOR_INDEX_NAME)) {
    console.log(`Index "${VECTOR_INDEX_NAME}" already exists — nothing to do.`);
    await mongoose.disconnect();
    return;
  }

  try {
    await collection.createSearchIndex({
      name: VECTOR_INDEX_NAME,
      type: 'vectorSearch',
      definition: {
        fields: [
          {
            type: 'vector',
            path: 'embedding',
            numDimensions: EMBEDDING_DIMENSIONS,
            similarity: 'cosine',
          },
          { type: 'filter', path: 'batchId' },
          { type: 'filter', path: 'reviewStatus' },
        ],
      },
    });
    console.log(`Created vector search index "${VECTOR_INDEX_NAME}". It may take a few minutes to become queryable — check Atlas UI for status.`);
  } catch (err) {
    console.error(
      'Failed to create vector search index. This is expected on non-Atlas MongoDB (e.g. local mongod) — ' +
        'vector search requires Atlas. Keyword search will continue to work regardless.'
    );
    console.error((err as Error).message);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

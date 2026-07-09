import 'dotenv/config';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { FAQ } from '../models/FAQ.js';
import { Category } from '../models/Category.js';
import { getOrCreateAiUser } from '../utils/systemUser.js';
import { tryGenerateEmbedding } from '../utils/embeddings.js';

async function main() {
  await connectDB();

  const adminUser = await getOrCreateAiUser();

  let category = await Category.findOne({ slug: 'general-internship' });
  if (!category) {
    category = await Category.create({
      name: 'General Internship',
      slug: 'general-internship',
      description: 'Imported from initial FAQ seed'
    });
  }

  const filePath = path.join(process.cwd(), 'scripts', 'raw-faqs.txt');
  const rawText = fs.readFileSync(filePath, 'utf-8');


  const lines = rawText.split(/\r?\n/);
  let successCount = 0;
  let currentQuestion = '';
  let currentAnswer: string[] = [];

  async function saveFaq() {
    if (currentQuestion && currentAnswer.length > 0) {
      const answerText = currentAnswer.join('\n').trim();
      if (answerText) {
        console.log(`Seeding: ${currentQuestion}`);
        const embedding = await tryGenerateEmbedding(`${currentQuestion}\n${answerText}`);
        
        await FAQ.create({
          question: currentQuestion,
          answer: answerText,
          categoryId: category._id,
          createdBy: adminUser._id,
          reviewStatus: 'approved',
          ...(embedding ? { embedding } : {}),
        });
        successCount++;
      }
    }
  }

  for (const line of lines) {
    
    const questionMatch = line.match(/^\d+\.\d+\s+(.*?)\s*§\s*$/);
    
    const headerMatch = line.match(/^\d+\.\s+.*§\s*$/);

    if (questionMatch) {
      await saveFaq(); 
      currentQuestion = questionMatch[1].trim();
      currentAnswer = [];
    } else if (headerMatch) {

      continue;
    } else if (currentQuestion) {
      
      currentAnswer.push(line);
    }
  }
  
  
  await saveFaq();

  console.log(`\nSuccessfully seeded ${successCount} FAQs into the database.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
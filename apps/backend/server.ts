import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { connectDB } from './config/db.js';
import { globalLimiter } from './utils/rateLimit.js';
import { logger } from './utils/logger.js';

import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import faqRoutes from './routes/faq.js';
import searchRoutes from './routes/search.js';
import batchRoutes from './routes/batch.js';
import publicFaqRoutes from './routes/publicFaq.js';
import communityRoutes from './routes/community.js';
import reputationRoutes from './routes/reputation.js';
import adminAutoAnswerRoutes from './routes/adminAutoAnswer.js';
import adminAuditRoutes from './routes/adminAudit.js';
import zoomRoutes from './routes/zoom.js';
import knowledgeRoutes from './routes/knowledge.js';
import { startSchedulers } from './utils/scheduler.js';

const app = express();
const PORT = Number(process.env.PORT) || 6767;


app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '2mb' }));
app.use(globalLimiter);


app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/faq', faqRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/public', publicFaqRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/reputation', reputationRoutes);
app.use('/api/admin', adminAutoAnswerRoutes);
app.use('/api/admin', adminAuditRoutes);
app.use('/api/zoom', zoomRoutes);
app.use('/api/knowledge', knowledgeRoutes);


app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});


// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { message: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});


async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      logger.info(`Backend listening on http://localhost:${PORT}`);
    });

    
    if (process.env.ENABLE_SCHEDULERS === 'true') {
      startSchedulers();
    } else {
      logger.info('Schedulers disabled (set ENABLE_SCHEDULERS=true to enable). Manual admin trigger endpoints still work.');
    }
  } catch (err) {
    logger.error('Failed to start server', { err });
    process.exit(1);
  }
}

start();

export default app;

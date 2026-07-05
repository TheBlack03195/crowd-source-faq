import { Router } from 'express';
import {
  listTranscriptKnowledge,
  listZoomInsights,
  promoteInsight,
  rejectInsight,
  listZoomMeetings,
  zoomHealthCheck,
} from '../controllers/knowledgeController.js';
import { adminOnly } from '../middleware/admin.js';

const router = Router();

router.get('/transcripts', ...adminOnly, listTranscriptKnowledge);
router.get('/insights', ...adminOnly, listZoomInsights);
router.post('/insights/:id/promote', ...adminOnly, promoteInsight);
router.post('/insights/:id/reject', ...adminOnly, rejectInsight);
router.get('/meetings', ...adminOnly, listZoomMeetings);
router.get('/health', ...adminOnly, zoomHealthCheck);

export default router;

import { Router } from 'express';
import {
  zoomAuthorize,
  zoomCallback,
  zoomWebhook,
  zoomManualUpload,
  zoomStatus,
} from '../controllers/zoomController.js';
import { protect } from '../middleware/auth.js';
import { uploadTranscript } from '../utils/upload.js';

const router = Router();


router.get('/callback', zoomCallback);
router.post('/webhook', zoomWebhook);


router.get('/authorize', protect, zoomAuthorize);
router.get('/status', protect, zoomStatus);
router.post('/upload', protect, uploadTranscript.single('transcript'), zoomManualUpload);

export default router;

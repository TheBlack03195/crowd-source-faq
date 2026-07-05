import multer from 'multer';

/**
 * In-memory storage — transcripts are small text files, parsed and
 * discarded immediately, no need to touch disk. 5MB cap is generous for
 * a VTT transcript (even a 2-hour meeting is typically under 1MB).
 */
export const uploadTranscript = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.vtt', '.txt'];
    const ok = allowed.some((ext) => file.originalname.toLowerCase().endsWith(ext));
    if (!ok) {
      cb(new Error('Only .vtt and .txt transcript files are accepted'));
      return;
    }
    cb(null, true);
  },
});

import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { adminOnly } from '../middleware/admin.js';
import { validateBody } from '../utils/validation.js';

import { listPosts, getPost, relatedPosts } from '../controllers/postReadsController.js';
import {
  createPost,
  editPost,
  votePost,
  resolvePost,
  createPostSchema,
  updatePostSchema,
} from '../controllers/postMutationsController.js';
import { closePost, reopenPost } from '../controllers/postLifecycleController.js';
import {
  reportPost,
  takeDownPost,
  restorePost,
  reportComment,
  dismissCommentReport,
  listReportedComments,
} from '../controllers/postModerationController.js';
import {
  addComment,
  editComment,
  deleteComment,
  acceptAnswer,
  createCommentSchema,
} from '../controllers/commentController.js';
import { voteComment } from '../controllers/commentVoteController.js';
import { toggleBookmark, listBookmarks } from '../controllers/bookmarkController.js';

const router = Router();


router.get('/comments/reported', ...adminOnly, listReportedComments);


router.get('/posts', listPosts);
router.get('/posts/:id', getPost);
router.get('/posts/:id/related', relatedPosts);
router.post('/posts', protect, validateBody(createPostSchema), createPost);
router.patch('/posts/:id', protect, validateBody(updatePostSchema), editPost);
router.post('/posts/:id/vote', protect, votePost);
router.post('/posts/:id/resolve', protect, resolvePost);
router.post('/posts/:id/close', protect, closePost);
router.post('/posts/:id/reopen', protect, reopenPost);
router.post('/posts/:id/report', protect, reportPost);

router.post('/posts/:id/take-down', ...adminOnly, takeDownPost);
router.post('/posts/:id/restore', ...adminOnly, restorePost);


router.post('/posts/:postId/comments', protect, validateBody(createCommentSchema), addComment);
router.patch('/posts/:postId/comments/:commentId', protect, editComment);
router.delete('/posts/:postId/comments/:commentId', protect, deleteComment);
router.post('/posts/:postId/comments/:commentId/accept', protect, acceptAnswer);
router.post('/posts/:postId/comments/:commentId/vote', protect, voteComment);
router.post('/posts/:postId/comments/:commentId/report', protect, reportComment);
router.post('/posts/:postId/comments/:commentId/dismiss-report', ...adminOnly, dismissCommentReport);


router.post('/bookmarks/:postId', protect, toggleBookmark);
router.get('/bookmarks', protect, listBookmarks);

export default router;

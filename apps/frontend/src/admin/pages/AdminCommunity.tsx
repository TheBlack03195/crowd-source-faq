import { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import { Button } from '../../components/ui/Button';

interface ReportedPost {
  _id: string;
  title: string;
  body: string;
  status: string;
  createdAt: string;
}

interface ReportedComment {
  postId: string;
  postTitle: string;
  commentId: string;
  content: string;
  authorId: { name: string } | string;
  createdAt: string;
}

export function AdminCommunity() {
  const [posts, setPosts] = useState<ReportedPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [comments, setComments] = useState<ReportedComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);

  function loadPosts() {
    setPostsLoading(true);
    api
      .get('/community/posts', { params: { isReported: 'true' } })
      .then(({ data }) => setPosts(data.items))
      .finally(() => setPostsLoading(false));
  }

  function loadComments() {
    setCommentsLoading(true);
    api
      .get('/community/comments/reported')
      .then(({ data }) => setComments(data.items))
      .finally(() => setCommentsLoading(false));
  }

  useEffect(() => {
    loadPosts();
    loadComments();
  }, []);

  async function handleTakeDown(id: string) {
    await api.post(`/community/posts/${id}/take-down`);
    loadPosts();
  }

  async function handleRestore(id: string) {
    await api.post(`/community/posts/${id}/restore`);
    loadPosts();
  }

  async function handleRemoveComment(postId: string, commentId: string) {
    await api.delete(`/community/posts/${postId}/comments/${commentId}`);
    loadComments();
  }

  async function handleDismissCommentReport(postId: string, commentId: string) {
    await api.post(`/community/posts/${postId}/comments/${commentId}/dismiss-report`);
    loadComments();
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-900">Community Moderation</h1>

      <h2 className="mb-2 text-sm font-semibold text-slate-700">Reported posts</h2>
      {postsLoading && <p className="text-sm text-slate-500">Loading…</p>}
      {!postsLoading && posts.length === 0 && (
        <p className="text-sm text-slate-500">No reported posts right now.</p>
      )}
      <div className="space-y-3">
        {posts.map((post) => (
          <div key={post._id} className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-slate-900">{post.title}</p>
            <p className="mt-1 line-clamp-2 text-sm text-slate-600">{post.body}</p>
            <div className="mt-3 flex gap-2">
              <Button variant="secondary" onClick={() => handleTakeDown(post._id)}>
                Take down
              </Button>
              <Button variant="ghost" onClick={() => handleRestore(post._id)}>
                Dismiss report
              </Button>
            </div>
          </div>
        ))}
      </div>

      <h2 className="mt-8 mb-2 text-sm font-semibold text-slate-700">Reported comments</h2>
      {commentsLoading && <p className="text-sm text-slate-500">Loading…</p>}
      {!commentsLoading && comments.length === 0 && (
        <p className="text-sm text-slate-500">No reported comments right now.</p>
      )}
      <div className="space-y-3">
        {comments.map((c) => (
          <div key={c.commentId} className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-xs text-slate-500">
              on <span className="font-medium">{c.postTitle}</span> ·{' '}
              {typeof c.authorId === 'string' ? c.authorId : c.authorId.name}
            </p>
            <p className="mt-1 text-sm text-slate-700">{c.content}</p>
            <div className="mt-3 flex gap-2">
              <Button variant="secondary" onClick={() => handleRemoveComment(c.postId, c.commentId)}>
                Remove comment
              </Button>
              <Button variant="ghost" onClick={() => handleDismissCommentReport(c.postId, c.commentId)}>
                Dismiss report
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

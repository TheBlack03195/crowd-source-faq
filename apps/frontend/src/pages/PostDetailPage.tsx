import { useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import type { CommunityPost, PostAuthor } from '../utils/types';

function authorName(a: PostAuthor | string) {
  return typeof a === 'string' ? 'Unknown' : a.name;
}
function authorId(a: PostAuthor | string) {
  return typeof a === 'string' ? a : a._id;
}

export function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    api
      .get(`/community/posts/${id}`)
      .then(({ data }) => setPost(data.post))
      .finally(() => setLoading(false));
  }

  useEffect(load, [id]);

  async function handleVotePost(direction: 1 | -1) {
    await api.post(`/community/posts/${id}/vote`, { direction });
    load();
  }

  async function handleAddComment(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post(`/community/posts/${id}/comments`, { content: commentText });
      setCommentText('');
      load();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Could not add comment');
    }
  }

  async function handleVoteComment(commentId: string, direction: 1 | -1) {
    await api.post(`/community/posts/${id}/comments/${commentId}/vote`, { direction });
    load();
  }

  async function handleAccept(commentId: string) {
    await api.post(`/community/posts/${id}/comments/${commentId}/accept`);
    load();
  }

  if (loading) return <p className="mx-auto mt-10 max-w-3xl px-4 text-sm text-slate-500">Loading…</p>;
  if (!post) return <p className="mx-auto mt-10 max-w-3xl px-4 text-sm text-slate-500">Post not found.</p>;

  const isPostAuthor = isAuthenticated && authorId(post.authorId) === user?.id;

  return (
    <div className="mx-auto mt-10 max-w-3xl px-4">
      <div className="rounded-lg border border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-900">{post.title}</h1>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              post.status === 'resolved'
                ? 'bg-emerald-100 text-emerald-700'
                : post.status === 'closed'
                  ? 'bg-slate-200 text-slate-600'
                  : 'bg-amber-100 text-amber-700'
            }`}
          >
            {post.status}
          </span>
        </div>
        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{post.body}</p>
        <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
          <span>by {authorName(post.authorId)}</span>
          {isAuthenticated && (
            <div className="flex gap-1">
              <button onClick={() => handleVotePost(1)} className="rounded border px-2 py-0.5 hover:bg-slate-50">
                ▲
              </button>
              <span>{post.upvotes}</span>
              <button onClick={() => handleVotePost(-1)} className="rounded border px-2 py-0.5 hover:bg-slate-50">
                ▼
              </button>
            </div>
          )}
        </div>
      </div>

      <h2 className="mt-6 mb-3 text-sm font-semibold text-slate-700">
        {post.comments.filter((c) => !c.isDeleted).length} comments
      </h2>

      <div className="space-y-3">
        {post.comments
          .filter((c) => !c.isDeleted)
          .map((c) => (
            <div
              key={c._id}
              className={`rounded-lg border p-3 ${
                c.isAccepted ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200'
              }`}
            >
              <p className="text-sm text-slate-800">{c.content}</p>
              <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                <span>
                  {authorName(c.authorId)} {c.isVerified && <span className="text-emerald-600">✓ expert</span>}
                </span>
                {isAuthenticated && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleVoteComment(c._id, 1)}
                      className="rounded border px-1.5 py-0.5 hover:bg-slate-50"
                    >
                      ▲
                    </button>
                    <span>{c.upvotes - c.downvotes}</span>
                    <button
                      onClick={() => handleVoteComment(c._id, -1)}
                      className="rounded border px-1.5 py-0.5 hover:bg-slate-50"
                    >
                      ▼
                    </button>
                  </div>
                )}
                {isPostAuthor && !c.isAccepted && post.status !== 'closed' && (
                  <button onClick={() => handleAccept(c._id)} className="text-emerald-700 hover:underline">
                    Accept answer
                  </button>
                )}
                {c.isAccepted && <span className="font-medium text-emerald-700">✓ Accepted</span>}
              </div>
            </div>
          ))}
      </div>

      {isAuthenticated ? (
        post.status !== 'closed' && (
          <form onSubmit={handleAddComment} className="mt-6 space-y-2">
            <textarea
              required
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a reply…"
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit">Reply</Button>
          </form>
        )
      ) : (
        <p className="mt-6 text-sm text-slate-500">Log in to reply or vote.</p>
      )}
    </div>
  );
}

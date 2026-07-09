import { useEffect, useState, type FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { StatusPill } from '../components/ui/StatusPill';
import { LoadingRow } from '../components/ui/Spinner';
import type { CommunityPost, PostAuthor } from '../utils/types';

function authorName(a: PostAuthor | string) {
  return typeof a === 'string' ? 'Unknown' : a.name;
}
function authorId(a: PostAuthor | string) {
  return typeof a === 'string' ? a : a._id;
}

const statusTone: Record<string, 'forest' | 'mist' | 'gold'> = {
  resolved: 'forest',
  closed: 'mist',
  open: 'gold',
};

function VoteControl({
  score,
  onUp,
  onDown,
  userVote = 0,
  size = 'md',
}: {
  score: number;
  onUp: () => void;
  onDown: () => void;
  userVote?: 1 | -1 | 0;
  size?: 'sm' | 'md';
}) {
  const btnSize = size === 'sm' ? 'h-5 w-5' : 'h-6 w-6';
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div className="flex items-center gap-1 rounded-full bg-ink/90 px-1.5 py-1 shadow-sm">
      <button
        onClick={onUp}
        aria-label="Upvote"
        className={`flex ${btnSize} items-center justify-center rounded-full transition-colors ${
          userVote === 1
            ? 'bg-emerald-500/20 text-emerald-400'
            : 'text-white/70 hover:bg-white/10 hover:text-emerald-400'
        }`}
      >
        <svg className={iconSize} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
        </svg>
      </button>

      <span
        className={`min-w-[1.25rem] text-center ${textSize} font-bold tabular-nums ${
          userVote === 1 ? 'text-emerald-400' : userVote === -1 ? 'text-red-400' : 'text-white'
        }`}
      >
        {score}
      </span>

      <button
        onClick={onDown}
        aria-label="Downvote"
        className={`flex ${btnSize} items-center justify-center rounded-full transition-colors ${
          userVote === -1
            ? 'bg-red-500/20 text-red-400'
            : 'text-white/70 hover:bg-white/10 hover:text-red-400'
        }`}
      >
        <svg className={iconSize} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  );
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

  async function handleReportPost() {
    if (!confirm('Report this post to moderators?')) return;
    await api.post(`/community/posts/${id}/report`);
    load();
  }

  async function handleReportComment(commentId: string) {
    if (!confirm('Report this comment to moderators?')) return;
    await api.post(`/community/posts/${id}/comments/${commentId}/report`);
    load();
  }

  if (loading) return <div className="mx-auto max-w-3xl px-6 py-12"><LoadingRow /></div>;
  if (!post)
    return (
      <div className="mx-auto max-w-3xl px-6 py-12 text-sm text-ink-soft">
        Post not found. <Link to="/community" className="text-forest underline">Back to community</Link>
      </div>
    );

  const isPostAuthor = isAuthenticated && authorId(post.authorId) === user?.id;
  const visibleComments = post.comments.filter((c) => !c.isDeleted);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link to="/community" className="text-xs text-ink-soft hover:text-forest">← Back to community</Link>

      <div className="mt-3 rounded-xl border border-mist bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <h1 className="font-display text-2xl font-semibold text-ink">{post.title}</h1>
          <StatusPill tone={statusTone[post.status] ?? 'mist'}>{post.status}</StatusPill>
        </div>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">{post.body}</p>

        <div className="mt-5 flex items-center gap-3 border-t border-mist pt-4 text-xs text-ink-soft">
          {isAuthenticated && (
            <VoteControl
              score={post.upvotes}
              userVote={(post as any).userVote ?? 0}
              onUp={() => handleVotePost(1)}
              onDown={() => handleVotePost(-1)}
            />
          )}

          <div className="flex items-center gap-1.5 rounded-full bg-ink/90 px-3 py-1.5 text-sm font-semibold text-white shadow-sm">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="tabular-nums">{visibleComments.length}</span>
          </div>

          <span className="ml-auto">by {authorName(post.authorId)}</span>

          {isAuthenticated && !isPostAuthor && (
            <button onClick={handleReportPost} className="text-ink-soft/70 hover:text-clay">
              ⚑ Report
            </button>
          )}
        </div>
      </div>

      <h2 className="mb-3 mt-8 font-mono text-xs font-medium uppercase tracking-[0.15em] text-ink-soft">
        {visibleComments.length} {visibleComments.length === 1 ? 'reply' : 'replies'}
      </h2>

      <div className="space-y-3">
        {visibleComments.map((c) => (
          <div
            key={c._id}
            className={`rounded-xl border p-4 ${
              c.isAccepted ? 'border-forest/30 bg-forest-soft/40' : 'border-mist bg-white'
            }`}
          >
            <p className="text-sm text-ink">{c.content}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-ink-soft">
              <span>
                {authorName(c.authorId)}{' '}
                {c.isVerified && <span className="font-mono uppercase tracking-wide text-forest">✓ expert</span>}
              </span>
              {isAuthenticated && (
                <VoteControl
                  size="sm"
                  score={c.upvotes - c.downvotes}
                  onUp={() => handleVoteComment(c._id, 1)}
                  onDown={() => handleVoteComment(c._id, -1)}
                />
              )}
              {isPostAuthor && !c.isAccepted && post.status !== 'closed' && (
                <button onClick={() => handleAccept(c._id)} className="font-medium text-forest hover:underline">
                  Accept answer
                </button>
              )}
              {c.isAccepted && <StatusPill tone="forest">✓ Accepted</StatusPill>}
              {isAuthenticated && authorId(c.authorId) !== user?.id && (
                <button onClick={() => handleReportComment(c._id)} className="text-ink-soft/70 hover:text-clay">
                  ⚑ Report
                </button>
              )}
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
              className="w-full rounded-lg border border-mist-dark px-3 py-2 text-sm focus:border-forest focus:outline-none"
            />
            {error && <p className="text-sm text-clay">{error}</p>}
            <Button type="submit">Reply</Button>
          </form>
        )
      ) : (
        <p className="mt-6 text-sm text-ink-soft">
          <Link to="/login" className="text-forest underline">Log in</Link> to reply or vote.
        </p>
      )}
    </div>
  );
}
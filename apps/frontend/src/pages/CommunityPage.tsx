import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import type { CommunityPost } from '../utils/types';

export function CommunityPage() {
  const { isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);

  function loadPosts() {
    setLoading(true);
    api
      .get('/community/posts')
      .then(({ data }) => setPosts(data.items))
      .finally(() => setLoading(false));
  }

  useEffect(loadPosts, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/community/posts', { title, body });
      setTitle('');
      setBody('');
      setShowForm(false);
      loadPosts();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Could not create post');
    }
  }

  return (
    <div className="mx-auto mt-10 max-w-3xl px-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Community</h1>
        {isAuthenticated && (
          <Button onClick={() => setShowForm((s) => !s)}>{showForm ? 'Cancel' : 'Ask a question'}</Button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 space-y-3 rounded-lg border border-slate-200 p-4">
          <input
            required
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
          />
          <textarea
            required
            placeholder="Describe your question…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit">Post</Button>
        </form>
      )}

      <div className="space-y-2">
        {loading && <p className="text-sm text-slate-500">Loading…</p>}
        {!loading && posts.length === 0 && (
          <p className="text-sm text-slate-500">No posts yet. Be the first to ask something.</p>
        )}
        {posts.map((post) => (
          <Link
            key={post._id}
            to={`/community/${post._id}`}
            className="block rounded-lg border border-slate-200 px-4 py-3 hover:border-emerald-400"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-900">{post.title}</h3>
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
            <p className="mt-1 line-clamp-1 text-xs text-slate-500">{post.body}</p>
            <div className="mt-2 flex gap-3 text-xs text-slate-400">
              <span>▲ {post.upvotes}</span>
              <span>{post.comments?.length ?? 0} comments</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

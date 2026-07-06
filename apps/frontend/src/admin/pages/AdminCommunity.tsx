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

export function AdminCommunity() {
  const [posts, setPosts] = useState<ReportedPost[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api
      .get('/community/posts', { params: { isReported: 'true' } })
      .then(({ data }) => setPosts(data.items))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleTakeDown(id: string) {
    await api.post(`/community/posts/${id}/take-down`);
    load();
  }

  async function handleRestore(id: string) {
    await api.post(`/community/posts/${id}/restore`);
    load();
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-900">Community Moderation</h1>

      {loading && <p className="text-sm text-slate-500">Loading…</p>}
      {!loading && posts.length === 0 && <p className="text-sm text-slate-500">No reported posts right now.</p>}

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
    </div>
  );
}

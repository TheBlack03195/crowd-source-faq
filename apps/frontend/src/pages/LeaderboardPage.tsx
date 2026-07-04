import { useEffect, useState } from 'react';
import { api } from '../utils/api';

interface LeaderboardUser {
  _id: string;
  name: string;
  reputation: number;
  role: string;
}

export function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/reputation/leaderboard')
      .then(({ data }) => setUsers(data.leaderboard))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto mt-10 max-w-xl px-4">
      <h1 className="mb-4 text-2xl font-semibold text-slate-900">Leaderboard</h1>
      {loading && <p className="text-sm text-slate-500">Loading…</p>}
      <ol className="space-y-1">
        {users.map((u, i) => (
          <li
            key={u._id}
            className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-2 text-sm"
          >
            <span className="flex items-center gap-3">
              <span className="w-6 text-slate-400">{i + 1}</span>
              <span className="font-medium text-slate-900">{u.name}</span>
              {u.role !== 'user' && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">{u.role}</span>
              )}
            </span>
            <span className="font-semibold text-emerald-700">{u.reputation} pts</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

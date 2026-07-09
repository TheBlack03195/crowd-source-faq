import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { StatusPill } from '../components/ui/StatusPill';
import { LoadingRow } from '../components/ui/Spinner';

interface LeaderboardUser {
  _id: string;
  name: string;
  reputation: number;
  role: string;
}

const medal = ['🥇', '🥈', '🥉'];

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
    <div className="mx-auto max-w-xl px-6 py-12">
      <span className="font-mono text-xs uppercase tracking-[0.15em] text-forest">Standings</span>
      <h1 className="mt-1 font-display text-3xl font-semibold text-ink">Leaderboard</h1>

      {loading && <LoadingRow />}
      <ol className="mt-6 space-y-1.5">
        {users.map((u, i) => (
          <li
            key={u._id}
            className="flex items-center justify-between rounded-lg border border-mist bg-white px-4 py-3"
          >
            <span className="flex items-center gap-3">
              <span className="w-6 text-center font-mono text-sm text-ink-soft">{medal[i] ?? i + 1}</span>
              <span className="text-sm font-medium text-ink">{u.name}</span>
              {u.role !== 'user' && <StatusPill tone="forest">{u.role}</StatusPill>}
            </span>
            <span className="font-mono text-sm font-semibold text-forest">{u.reputation} pts</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
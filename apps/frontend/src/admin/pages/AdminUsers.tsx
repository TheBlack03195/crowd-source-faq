import { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import { Button } from '../../components/ui/Button';

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  reputation: number;
  isBanned: boolean;
  suspendedUntil: string | null;
  sp: number;
}

export function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api
      .get('/admin/users', { params: search ? { search } : {} })
      .then(({ data }) => setUsers(data.items))
      .finally(() => setLoading(false));
  }

  useEffect(load, [search]);

  async function handleBan(id: string) {
    await api.post(`/moderation/${id}/ban`, { reason: 'Admin action' });
    load();
  }
  async function handleUnban(id: string) {
    await api.post(`/moderation/${id}/unban`);
    load();
  }
  async function handleSuspend(id: string) {
    const hours = prompt('Suspend for how many hours?', '24');
    if (!hours) return;
    await api.post(`/moderation/${id}/suspend`, { hours: Number(hours), reason: 'Admin action' });
    load();
  }
  async function handleRoleChange(id: string, role: string) {
    await api.patch(`/admin/users/${id}/role`, { role });
    load();
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-900">Users</h1>

      <input
        placeholder="Search by name or email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
      />

      {loading && <p className="text-sm text-slate-500">Loading…</p>}

      <div className="space-y-2">
        {users.map((u) => (
          <div key={u._id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
            <div>
              <p className="text-sm font-medium text-slate-900">
                {u.name} {u.isBanned && <span className="ml-2 text-xs text-red-600">BANNED</span>}
                {u.suspendedUntil && new Date(u.suspendedUntil) > new Date() && (
                  <span className="ml-2 text-xs text-amber-600">SUSPENDED</span>
                )}
              </p>
              <p className="text-xs text-slate-500">
                {u.email} · rep {u.reputation} · {u.sp} SP
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={u.role}
                onChange={(e) => handleRoleChange(u._id, e.target.value)}
                className="rounded border border-slate-300 px-2 py-1 text-xs"
              >
                <option value="user">user</option>
                <option value="moderator">moderator</option>
                <option value="admin">admin</option>
              </select>
              {u.isBanned ? (
                <Button variant="ghost" onClick={() => handleUnban(u._id)}>
                  Unban
                </Button>
              ) : (
                <Button variant="ghost" onClick={() => handleBan(u._id)}>
                  Ban
                </Button>
              )}
              <Button variant="ghost" onClick={() => handleSuspend(u._id)}>
                Suspend
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

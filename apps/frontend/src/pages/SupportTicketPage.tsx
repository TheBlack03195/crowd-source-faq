import { useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';

interface FollowUp {
  _id: string;
  authorId: { name: string; role: string } | string;
  isAdmin: boolean;
  message: string;
  createdAt: string;
}

interface SupportTicket {
  _id: string;
  issueType: string;
  description: string;
  status: string;
  isGolden: boolean;
  followUps: FollowUp[];
}

export function SupportTicketPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isMod = user?.role === 'admin' || user?.role === 'moderator';
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  function load() {
    api.get(`/support/${id}`).then(({ data }) => setTicket(data.request));
  }

  useEffect(load, [id]);

  async function handleReply(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post(`/support/${id}/follow-up`, { message });
      setMessage('');
      load();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Reply failed');
    }
  }

  async function handleStatusChange(status: string) {
    await api.patch(`/support/${id}/status`, { status });
    load();
  }

  if (!ticket) return <p className="mx-auto mt-10 max-w-2xl px-4 text-sm text-slate-500">Loading…</p>;

  return (
    <div className="mx-auto mt-10 max-w-2xl px-4">
      <div className="rounded-lg border border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-slate-900">
            [{ticket.issueType}] Support Request {ticket.isGolden && <span className="text-amber-600">🔥</span>}
          </h1>
          <span className="text-xs text-slate-500">{ticket.status}</span>
        </div>
        <p className="mt-2 text-sm text-slate-700">{ticket.description}</p>

        {isMod && (
          <div className="mt-3 flex gap-2">
            <Button variant="secondary" onClick={() => handleStatusChange('in_progress')}>
              In progress
            </Button>
            <Button variant="secondary" onClick={() => handleStatusChange('resolved')}>
              Resolve
            </Button>
            <Button variant="ghost" onClick={() => handleStatusChange('rejected')}>
              Reject
            </Button>
          </div>
        )}
      </div>

      <h2 className="mt-6 mb-3 text-sm font-semibold text-slate-700">Follow-ups</h2>
      <div className="space-y-2">
        {ticket.followUps.length === 0 && <p className="text-sm text-slate-500">No follow-ups yet.</p>}
        {ticket.followUps.map((f) => (
          <div
            key={f._id}
            className={`rounded-lg border p-3 text-sm ${f.isAdmin ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200'}`}
          >
            <p className="text-slate-800">{f.message}</p>
            <p className="mt-1 text-xs text-slate-500">
              {typeof f.authorId === 'string' ? 'User' : f.authorId.name} {f.isAdmin && '(staff)'}
            </p>
          </div>
        ))}
      </div>

      <form onSubmit={handleReply} className="mt-4 space-y-2">
        <textarea
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="Add a follow-up…"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit">Reply</Button>
      </form>
    </div>
  );
}

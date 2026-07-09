import { useEffect, useState, type FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { StatusPill } from '../components/ui/StatusPill';
import { LoadingRow } from '../components/ui/Spinner';

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

const statusTone: Record<string, 'forest' | 'mist' | 'gold' | 'clay'> = {
  resolved: 'forest',
  open: 'gold',
  in_progress: 'mist',
  rejected: 'clay',
};

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

  if (!ticket) return <div className="mx-auto max-w-2xl px-6 py-12"><LoadingRow /></div>;

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Link to="/support" className="text-xs text-ink-soft hover:text-forest">← Back to support</Link>

      <div className="spine mt-3 rounded-r-lg border border-l-0 border-mist bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-display text-xl font-semibold text-ink">
            [{ticket.issueType}] Support Request {ticket.isGolden && <span>🔥</span>}
          </h1>
          <StatusPill tone={statusTone[ticket.status] ?? 'mist'}>{ticket.status}</StatusPill>
        </div>
        <p className="mt-3 text-sm text-ink-soft">{ticket.description}</p>

        {isMod && (
          <div className="mt-4 flex gap-2 border-t border-mist pt-3">
            <Button variant="secondary" onClick={() => handleStatusChange('in_progress')}>
              In progress
            </Button>
            <Button variant="secondary" onClick={() => handleStatusChange('resolved')}>
              Resolve
            </Button>
            <Button variant="danger" onClick={() => handleStatusChange('rejected')}>
              Reject
            </Button>
          </div>
        )}
      </div>

      <h2 className="mb-3 mt-8 font-mono text-xs font-medium uppercase tracking-[0.15em] text-ink-soft">
        Follow-ups
      </h2>
      <div className="space-y-2">
        {ticket.followUps.length === 0 && <p className="text-sm text-ink-soft">No follow-ups yet.</p>}
        {ticket.followUps.map((f) => (
          <div
            key={f._id}
            className={`rounded-r-lg border border-l-0 p-3 text-sm ${
              f.isAdmin ? 'spine-forest border-mist bg-forest-soft/40' : 'spine border-mist bg-white'
            }`}
          >
            <p className="text-ink">{f.message}</p>
            <p className="mt-1 text-xs text-ink-soft">
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
          className="w-full rounded-lg border border-mist-dark px-3 py-2 text-sm focus:border-forest focus:outline-none"
        />
        {error && <p className="text-sm text-clay">{error}</p>}
        <Button type="submit">Reply</Button>
      </form>
    </div>
  );
}
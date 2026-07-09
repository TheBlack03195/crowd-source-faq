import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { Button } from '../components/ui/Button';
import { StatusPill } from '../components/ui/StatusPill';
import { LoadingRow } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';

interface SupportTicket {
  _id: string;
  issueType: string;
  description: string;
  status: string;
  isGolden: boolean;
  createdAt: string;
}

const ISSUE_TYPES = ['internet', 'camera', 'microphone', 'device', 'power', 'other'];

const statusTone: Record<string, 'forest' | 'mist' | 'gold' | 'clay'> = {
  resolved: 'forest',
  open: 'gold',
  in_progress: 'mist',
  rejected: 'clay',
};

export function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [issueType, setIssueType] = useState('internet');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api
      .get('/support/mine')
      .then(({ data }) => setTickets(data.requests))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/support', { issueType, description });
      setDescription('');
      setShowForm(false);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Could not create support request');
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <span className="font-mono text-xs uppercase tracking-[0.15em] text-forest">Help desk</span>
          <h1 className="mt-1 font-display text-3xl font-semibold text-ink">Support Requests</h1>
        </div>
        <Button onClick={() => setShowForm((s) => !s)}>{showForm ? 'Cancel' : 'New request'}</Button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 space-y-3 rounded-lg border border-mist-dark bg-white p-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Issue type</label>
            <select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              className="w-full rounded-lg border border-mist-dark px-3 py-2 text-sm focus:border-forest focus:outline-none"
            >
              {ISSUE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Describe the issue</label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-mist-dark px-3 py-2 text-sm focus:border-forest focus:outline-none"
            />
          </div>
          {error && <p className="text-sm text-clay">{error}</p>}
          <Button type="submit">Submit</Button>
        </form>
      )}

      {loading && <LoadingRow />}
      {!loading && tickets.length === 0 && (
        <EmptyState title="No support requests yet" description="Hit a snag? Open a new request above." />
      )}

      <div className="space-y-2">
        {tickets.map((t) => (
          <Link
            key={t._id}
            to={`/support/${t._id}`}
            className="spine block rounded-r-lg border border-l-0 border-mist bg-white px-4 py-3.5 transition-shadow hover:shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-ink">
                [{t.issueType}] {t.description.slice(0, 60)}
                {t.isGolden && <span className="ml-2">🔥</span>}
              </span>
              <StatusPill tone={statusTone[t.status] ?? 'mist'}>{t.status}</StatusPill>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
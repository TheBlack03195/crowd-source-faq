import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { Button } from '../components/ui/Button';

interface SupportTicket {
  _id: string;
  issueType: string;
  description: string;
  status: string;
  isGolden: boolean;
  createdAt: string;
}

const ISSUE_TYPES = ['internet', 'camera', 'microphone', 'device', 'power', 'other'];

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
    <div className="mx-auto mt-10 max-w-2xl px-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Support Requests</h1>
        <Button onClick={() => setShowForm((s) => !s)}>{showForm ? 'Cancel' : 'New request'}</Button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 space-y-3 rounded-lg border border-slate-200 p-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Issue type</label>
            <select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {ISSUE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Describe the issue</label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit">Submit</Button>
        </form>
      )}

      {loading && <p className="text-sm text-slate-500">Loading…</p>}
      {!loading && tickets.length === 0 && <p className="text-sm text-slate-500">No support requests yet.</p>}

      <div className="space-y-2">
        {tickets.map((t) => (
          <Link
            key={t._id}
            to={`/support/${t._id}`}
            className="block rounded-lg border border-slate-200 px-4 py-3 hover:border-emerald-400"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-900">
                [{t.issueType}] {t.description.slice(0, 60)}
                {t.isGolden && <span className="ml-2 text-amber-600">🔥</span>}
              </span>
              <span className="text-xs text-slate-500">{t.status}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

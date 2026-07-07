import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../utils/api';

interface SupportTicketRow {
  _id: string;
  issueType: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'rejected';
  isGolden: boolean;
  createdAt: string;
  userId: { name: string; email: string } | string;
}

const STATUS_FILTERS = ['', 'open', 'in_progress', 'resolved', 'rejected'] as const;

/**
 * Admin/mod view of every support ticket. The dashboard only ever
 * showed a count and there was no way to actually browse tickets —
 * this lists them and links into the existing `/support/:id` page,
 * which already has the reply/resolve/reject controls for mods.
 */
export function AdminSupport() {
  const [items, setItems] = useState<SupportTicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>('');

  function load() {
    setLoading(true);
    api
      .get('/support', { params: status ? { status } : {} })
      .then(({ data }) => setItems(data.items))
      .finally(() => setLoading(false));
  }

  useEffect(load, [status]);

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-900">Support Tickets</h1>

      <div className="mb-4 flex gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              status === s ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {s === '' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-slate-500">Loading…</p>}
      {!loading && items.length === 0 && <p className="text-sm text-slate-500">No tickets match this filter.</p>}

      <div className="space-y-3">
        {items.map((ticket) => (
          <Link
            key={ticket._id}
            to={`/support/${ticket._id}`}
            className={`block rounded-lg border p-4 hover:border-emerald-400 ${
              ticket.isGolden ? 'border-amber-300 bg-amber-50' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-900">
                [{ticket.issueType}] {ticket.isGolden && <span className="text-amber-600">🔥</span>}
              </p>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  ticket.status === 'resolved'
                    ? 'bg-emerald-100 text-emerald-700'
                    : ticket.status === 'rejected'
                      ? 'bg-slate-200 text-slate-600'
                      : ticket.status === 'in_progress'
                        ? 'bg-sky-100 text-sky-700'
                        : 'bg-amber-100 text-amber-700'
                }`}
              >
                {ticket.status.replace('_', ' ')}
              </span>
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-slate-600">{ticket.description}</p>
            <p className="mt-2 text-xs text-slate-500">
              {typeof ticket.userId === 'string' ? 'Unknown user' : `${ticket.userId.name} (${ticket.userId.email})`}{' '}
              · {new Date(ticket.createdAt).toLocaleString()}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
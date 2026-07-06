import { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import { Button } from '../../components/ui/Button';

interface FlaggedFaq {
  _id: string;
  question: string;
  answer: string;
  flagType: 'auto' | 'manual' | null;
  reviewCycle: number;
  lastVerifiedAt: string;
}

export function AdminFaqReview() {
  const [items, setItems] = useState<FlaggedFaq[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  function load() {
    setLoading(true);
    api
      .get('/freshness/review-queue')
      .then(({ data }) => setItems(data.items))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleDismiss(id: string) {
    await api.post(`/freshness/${id}/dismiss`);
    load();
  }

  async function handleRunAudit() {
    setRunning(true);
    try {
      await api.post('/admin/faq-audit/run');
      load();
    } finally {
      setRunning(false);
    }
  }

  async function handleRunFreshness() {
    setRunning(true);
    try {
      await api.post('/freshness/run');
      load();
    } finally {
      setRunning(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">FAQ Review Queue</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleRunFreshness} disabled={running}>
            Run freshness check
          </Button>
          <Button variant="secondary" onClick={handleRunAudit} disabled={running}>
            Run AI audit
          </Button>
        </div>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading…</p>}
      {!loading && items.length === 0 && (
        <p className="text-sm text-slate-500">Nothing flagged right now. Nice.</p>
      )}

      <div className="space-y-3">
        {items.map((faq) => (
          <div key={faq._id} className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-medium text-amber-800">
                {faq.flagType === 'auto' ? 'AI-flagged' : 'Manually flagged'} · cycle {faq.reviewCycle}
              </span>
              <Button variant="secondary" onClick={() => handleDismiss(faq._id)}>
                Approve as-is
              </Button>
            </div>
            <p className="mt-2 text-sm font-medium text-slate-900">{faq.question}</p>
            <p className="mt-1 text-sm text-slate-600">{faq.answer}</p>
            <p className="mt-2 text-xs text-slate-500">
              Last verified: {new Date(faq.lastVerifiedAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

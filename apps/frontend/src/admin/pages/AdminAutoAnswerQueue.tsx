import { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import { Button } from '../../components/ui/Button';

interface QueueItem {
  _id: string;
  targetTitle: string;
  score: number;
  verdict: string;
  reasoning?: string;
  checkedAt: string;
}

export function AdminAutoAnswerQueue() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [lastRunSummary, setLastRunSummary] = useState<string | null>(null);

  function load() {
    setLoading(true);
    api
      .get('/admin/auto-answer/queue')
      .then(({ data }) => setItems(data.items))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleRun() {
    setRunning(true);
    setLastRunSummary(null);
    try {
      const { data } = await api.post('/admin/auto-answer/run');
      setLastRunSummary(`Processed ${data.processed} unanswered post(s).`);
      load();
    } finally {
      setRunning(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Auto-Answer Queue</h1>
        <Button onClick={handleRun} disabled={running}>
          {running ? 'Running…' : 'Run AI'}
        </Button>
      </div>

      {lastRunSummary && (
        <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{lastRunSummary}</p>
      )}

      {loading && <p className="text-sm text-slate-500">Loading…</p>}
      {!loading && items.length === 0 && (
        <p className="text-sm text-slate-500">Nothing flagged for review right now.</p>
      )}

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item._id} className="rounded-lg border border-slate-200 p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-900">{item.targetTitle}</p>
              <span className="text-xs text-slate-500">
                {item.verdict} · {(item.score * 100).toFixed(0)}% confidence
              </span>
            </div>
            {item.reasoning && <p className="mt-1 text-xs text-slate-500">{item.reasoning}</p>}
            <p className="mt-1 text-xs text-slate-400">{new Date(item.checkedAt).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import { Button } from '../../components/ui/Button';

interface ZoomMeeting {
  _id: string;
  topic: string;
  sourcing: string;
  status: string;
  insightsExtracted: number;
  deadLettered: boolean;
  createdAt: string;
}

interface ZoomInsight {
  _id: string;
  question: string;
  answer: string;
  reviewStatus: string;
}

interface Category {
  _id: string;
  name: string;
}

export function AdminZoom() {
  const [meetings, setMeetings] = useState<ZoomMeeting[]>([]);
  const [insights, setInsights] = useState<ZoomInsight[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [health, setHealth] = useState<{ circuitState: string; failingMeetings: number; deadLetterCount: number } | null>(null);

  const [promotingId, setPromotingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('');

  function load() {
    api.get('/knowledge/meetings').then(({ data }) => setMeetings(data.meetings));
    api.get('/knowledge/insights').then(({ data }) => setInsights(data.insights));
    api.get('/knowledge/health').then(({ data }) => setHealth(data.health));
    api.get('/public/categories').then(({ data }) => {
      setCategories(data.categories);
      if (data.categories.length > 0) setSelectedCategory(data.categories[0]._id);
    });
  }

  useEffect(load, []);

  async function confirmPromotion() {
    if (!promotingId || !selectedCategory) return;
    try {
      await api.post(`/knowledge/insights/${promotingId}/promote`, { categoryId: selectedCategory });
      setPromotingId(null);
      load();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Promotion failed');
    }
  }

  async function handleReject(id: string) {
    await api.post(`/knowledge/insights/${id}/reject`);
    load();
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-900">Zoom Ingestion</h1>

      {health && (
        <div className="mb-6 flex gap-4 rounded-lg border border-slate-200 p-3 text-sm">
          <span>Circuit: <strong>{health.circuitState}</strong></span>
          <span>Failing: <strong>{health.failingMeetings}</strong></span>
          <span>Dead-lettered: <strong>{health.deadLetterCount}</strong></span>
        </div>
      )}

      <h2 className="mb-2 text-sm font-semibold text-slate-700">Recent meetings</h2>
      <div className="mb-6 space-y-1">
        {meetings.map((m) => (
          <div key={m._id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <span>{m.topic}</span>
            <span className="text-xs text-slate-500">
              {m.sourcing} · {m.status} · {m.insightsExtracted} insights
              {m.deadLettered && <span className="ml-2 text-red-600">dead-lettered</span>}
            </span>
          </div>
        ))}
        {meetings.length === 0 && <p className="text-sm text-slate-500">No meetings processed yet.</p>}
      </div>

      <h2 className="mb-2 text-sm font-semibold text-slate-700">Insights pending review</h2>
      <div className="space-y-2">
        {insights.map((insight) => (
          <div key={insight._id} className="rounded-lg border border-slate-200 p-3">
            <p className="text-sm font-medium text-slate-900">{insight.question}</p>
            <p className="mt-1 text-sm text-slate-600">{insight.answer}</p>

            {promotingId === insight._id ? (
              <div className="mt-3 flex gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="rounded border border-slate-300 px-2 py-1 text-sm"
                >
                  {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
                <Button onClick={confirmPromotion}>Confirm</Button>
                <Button variant="ghost" onClick={() => setPromotingId(null)}>Cancel</Button>
              </div>
            ) : (
              <div className="mt-2 flex gap-2">
                <Button variant="secondary" onClick={() => setPromotingId(insight._id)}>Promote to FAQ</Button>
                <Button variant="ghost" onClick={() => handleReject(insight._id)}>Reject</Button>
              </div>
            )}
          </div>
        ))}
        {insights.length === 0 && <p className="text-sm text-slate-500">Nothing pending review.</p>}
      </div>
    </div>
  );
}
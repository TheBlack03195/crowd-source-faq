import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';

interface FlaggedFaq {
  _id: string;
  question: string;
  answer: string;
  flagType: 'auto' | 'manual' | null;
  reviewCycle: number;
}

export function FAQReviewQueuePage() {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<FlaggedFaq[]>([]);
  const [loading, setLoading] = useState(true);
  const [voted, setVoted] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    api
      .get('/freshness/review-queue')
      .then(({ data }) => setItems(data.items))
      .catch(() => setError('Could not load the review queue. You may need to be logged in.'))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleVote(id: string, vote: 'still_accurate' | 'needs_update') {
    setError(null);
    try {
      await api.post(`/freshness/${id}/vote`, { vote });
      setVoted((v) => ({ ...v, [id]: true }));
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Vote failed');
    }
  }

  return (
    <div className="mx-auto mt-10 max-w-2xl px-4">
      <h1 className="text-2xl font-semibold text-slate-900">FAQ Review Queue</h1>
      <p className="mt-2 text-sm text-slate-600">
        These FAQs have been flagged as possibly outdated. Help the community by voting on whether the answer is
        still accurate — enough "still accurate" votes automatically clears the flag.
      </p>

      {!isAuthenticated && (
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Log in to vote on flagged FAQs.
        </p>
      )}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {loading && <p className="mt-4 text-sm text-slate-500">Loading…</p>}
      {!loading && items.length === 0 && (
        <p className="mt-4 text-sm text-slate-500">Nothing under review right now — the knowledge base is fresh.</p>
      )}

      <div className="mt-6 space-y-3">
        {items.map((faq) => (
          <div key={faq._id} className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-medium text-amber-800">
              {faq.flagType === 'auto' ? 'AI-flagged' : 'Community-flagged'}
            </span>
            <p className="mt-2 text-sm font-medium text-slate-900">{faq.question}</p>
            <p className="mt-1 text-sm text-slate-600">{faq.answer}</p>

            {isAuthenticated && (
              <div className="mt-3 flex gap-2">
                {voted[faq._id] ? (
                  <span className="text-sm text-emerald-700">Thanks for voting!</span>
                ) : (
                  <>
                    <Button variant="secondary" onClick={() => handleVote(faq._id, 'still_accurate')}>
                      Still accurate
                    </Button>
                    <Button variant="ghost" onClick={() => handleVote(faq._id, 'needs_update')}>
                      Needs update
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

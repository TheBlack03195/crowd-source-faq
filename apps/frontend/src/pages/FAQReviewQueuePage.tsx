import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { StatusPill } from '../components/ui/StatusPill';
import { LoadingRow } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';

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
    <div className="mx-auto max-w-2xl px-6 py-12">
      <span className="font-mono text-xs uppercase tracking-[0.15em] text-gold-dark">Peer review</span>
      <h1 className="mt-1 font-display text-3xl font-semibold text-ink">FAQ Review Queue</h1>
      <p className="mt-2 text-sm text-ink-soft">
        These FAQs have been flagged as possibly outdated. Vote on whether the answer is still accurate — enough
        "still accurate" votes automatically clears the flag.
      </p>

      {!isAuthenticated && (
        <p className="mt-4 rounded-lg bg-gold-soft px-3 py-2 text-sm text-gold-dark">Log in to vote on flagged FAQs.</p>
      )}
      {error && <p className="mt-4 text-sm text-clay">{error}</p>}

      {loading && <LoadingRow />}
      {!loading && items.length === 0 && (
        <EmptyState title="Nothing under review" description="The knowledge base is fresh right now." />
      )}

      <div className="mt-6 space-y-3">
        {items.map((faq) => (
          <div key={faq._id} className="spine-gold rounded-r-lg border border-l-0 border-mist bg-white p-4">
            <StatusPill tone="gold">{faq.flagType === 'auto' ? 'AI-flagged' : 'Community-flagged'}</StatusPill>
            <p className="mt-2 text-sm font-medium text-ink">{faq.question}</p>
            <p className="mt-1 text-sm text-ink-soft">{faq.answer}</p>

            {isAuthenticated && (
              <div className="mt-3 flex gap-2 border-t border-dashed border-mist pt-3">
                {voted[faq._id] ? (
                  <span className="text-sm text-forest-dark">Thanks for voting!</span>
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
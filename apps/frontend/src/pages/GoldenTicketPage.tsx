import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';

interface MyTicket {
  _id: string;
  issueType: string;
  description: string;
  status: string;
  isGolden: boolean;
}

interface QueueItem {
  _id: string;
  issueType: string;
  description: string;
  status: string;
  spSpent: number;
  createdAt: string;
}

export function GoldenTicketPage() {
  const [sp, setSp] = useState(0);
  const [cooldownRemainingMs, setCooldownRemainingMs] = useState(0);
  const [myTickets, setMyTickets] = useState<MyTicket[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [selectedTicket, setSelectedTicket] = useState('');
  const [spAmount, setSpAmount] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function load() {
    api.get('/support/golden/balance').then(({ data }) => {
      setSp(data.sp);
      setCooldownRemainingMs(data.cooldownRemainingMs);
    });
    api.get('/support/mine').then(({ data }) => setMyTickets(data.requests));
    api.get('/support/golden/queue').then(({ data }) => setQueue(data.queue));
  }

  useEffect(load, []);

  async function handleSubmit() {
    setError(null);
    setSuccess(null);
    if (!selectedTicket) {
      setError('Pick one of your open support tickets to escalate.');
      return;
    }
    try {
      await api.post(`/support/golden/${selectedTicket}`, { spAmount });
      setSuccess('Escalated! Your ticket has been bumped to the priority queue.');
      load();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Escalation failed');
    }
  }

  const cooldownHoursLeft = (cooldownRemainingMs / (1000 * 60 * 60)).toFixed(1);
  const eligibleTickets = myTickets.filter((t) => !t.isGolden && t.status !== 'resolved' && t.status !== 'rejected');

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <span className="font-mono text-xs uppercase tracking-[0.15em] text-gold-dark">Priority escalation</span>
      <h1 className="mt-1 font-display text-3xl font-semibold text-ink">Golden Ticket</h1>
      <p className="mt-2 max-w-lg text-sm text-ink-soft">
        Spend Spurti Points to bump a time-sensitive support ticket to the top of the review queue. Higher SP =
        higher priority. No penalty for a rejected escalation — just the SP spent.
      </p>

      
      <div className="ticket-stub mt-8 flex items-center justify-between px-8 py-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-wide text-ink-soft">Your balance</p>
          <p className="mt-1 font-display text-4xl font-semibold text-gold-dark">{sp} <span className="text-xl">SP</span></p>
        </div>
        <div className="ticket-perforation h-16 pl-8 text-right">
          <p className="font-mono text-xs uppercase tracking-wide text-ink-soft">Status</p>
          <p className="mt-1 text-sm font-medium text-ink">
            {cooldownRemainingMs > 0 ? `Cooldown · ${cooldownHoursLeft}h` : 'Ready to escalate'}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-mist bg-white p-5">
        <h2 className="text-sm font-semibold text-ink">Escalate a ticket</h2>

        {cooldownRemainingMs > 0 ? (
          <p className="mt-2 text-sm text-gold-dark">On cooldown — try again in {cooldownHoursLeft}h.</p>
        ) : eligibleTickets.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">
            No eligible open tickets. Create a support request first, then come back here to escalate it.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            <select
              value={selectedTicket}
              onChange={(e) => setSelectedTicket(e.target.value)}
              className="w-full rounded-lg border border-mist-dark px-3 py-2 text-sm focus:border-forest focus:outline-none"
            >
              <option value="">Select a ticket…</option>
              {eligibleTickets.map((t) => (
                <option key={t._id} value={t._id}>
                  [{t.issueType}] {t.description.slice(0, 60)}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={sp}
                value={spAmount}
                onChange={(e) => setSpAmount(Number(e.target.value))}
                className="w-24 rounded-lg border border-mist-dark px-3 py-2 text-sm focus:border-forest focus:outline-none"
              />
              <span className="text-sm text-ink-soft">SP to spend</span>
              <Button onClick={handleSubmit}>Escalate</Button>
            </div>
          </div>
        )}
        {error && <p className="mt-2 text-sm text-clay">{error}</p>}
        {success && <p className="mt-2 text-sm text-forest-dark">{success}</p>}
      </div>

      <h2 className="mb-3 mt-8 font-mono text-xs font-medium uppercase tracking-[0.15em] text-ink-soft">
        Live Escalation Queue
      </h2>
      <div className="space-y-2">
        {queue.length === 0 && <EmptyState title="No active escalations" description="The queue is calm right now." />}
        {queue.map((item) => (
          <div
            key={item._id}
            className="spine-gold flex items-center justify-between rounded-r-lg border border-l-0 border-mist bg-white px-4 py-3 text-sm"
          >
            <span className="text-ink">
              [{item.issueType}] {item.description.slice(0, 50)}
            </span>
            <span className="font-mono font-semibold text-gold-dark">{item.spSpent} SP</span>
          </div>
        ))}
      </div>
    </div>
  );
}
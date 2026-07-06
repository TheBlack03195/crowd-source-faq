import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { Button } from '../components/ui/Button';

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
    <div className="mx-auto mt-10 max-w-2xl px-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Golden Ticket</h1>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">🔥 {sp} SP</span>
      </div>
      <p className="text-sm text-slate-600">
        Spend Spurti Points to bump a time-sensitive support ticket to the top of the review queue. Higher SP =
        higher priority. No penalty for a rejected escalation — just the SP spent.
      </p>

      <div className="mt-6 rounded-lg border border-slate-200 p-4">
        <h2 className="text-sm font-semibold text-slate-700">Escalate a ticket</h2>

        {cooldownRemainingMs > 0 ? (
          <p className="mt-2 text-sm text-amber-700">On cooldown — try again in {cooldownHoursLeft}h.</p>
        ) : eligibleTickets.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            No eligible open tickets. Create a support request first, then come back here to escalate it.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            <select
              value={selectedTicket}
              onChange={(e) => setSelectedTicket(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
                className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <span className="text-sm text-slate-500">SP to spend</span>
              <Button onClick={handleSubmit}>Escalate</Button>
            </div>
          </div>
        )}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        {success && <p className="mt-2 text-sm text-emerald-700">{success}</p>}
      </div>

      <h2 className="mt-8 mb-3 text-sm font-semibold text-slate-700">Live Escalation Queue</h2>
      <div className="space-y-2">
        {queue.length === 0 && <p className="text-sm text-slate-500">No active escalations right now.</p>}
        {queue.map((item) => (
          <div
            key={item._id}
            className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <span>
              [{item.issueType}] {item.description.slice(0, 50)}
            </span>
            <span className="font-medium text-amber-700">{item.spSpent} SP</span>
          </div>
        ))}
      </div>
    </div>
  );
}

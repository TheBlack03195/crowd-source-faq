import { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import { AdminStatCard } from '../components/AdminStatCard';

interface DashboardStats {
  totalUsers: number;
  totalFaqs: number;
  pendingReviewFaqs: number;
  totalPosts: number;
  openPosts: number;
  openSupportTickets: number;
  goldenTickets: number;
  failedZoomMeetings: number;
  recentPipelineActivity: Array<{
    _id: string;
    pipeline: string;
    verdict: string;
    targetTitle: string;
    score: number;
    checkedAt: string;
  }>;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    api.get('/admin/dashboard').then(({ data }) => setStats(data));
  }, []);

  if (!stats) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-900">Overview</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <AdminStatCard label="Users" value={stats.totalUsers} />
        <AdminStatCard label="FAQs" value={stats.totalFaqs} />
        <AdminStatCard
          label="Pending review"
          value={stats.pendingReviewFaqs}
          tone={stats.pendingReviewFaqs > 0 ? 'warn' : 'default'}
        />
        <AdminStatCard label="Community posts" value={stats.totalPosts} />
        <AdminStatCard label="Open posts" value={stats.openPosts} />
        <AdminStatCard label="Open support tickets" value={stats.openSupportTickets} />
        <AdminStatCard
          label="Golden tickets"
          value={stats.goldenTickets}
          tone={stats.goldenTickets > 0 ? 'warn' : 'default'}
        />
        <AdminStatCard
          label="Failed Zoom meetings"
          value={stats.failedZoomMeetings}
          tone={stats.failedZoomMeetings > 0 ? 'danger' : 'default'}
        />
      </div>

      <h2 className="mt-8 mb-3 text-sm font-semibold text-slate-700">Recent pipeline activity</h2>
      <div className="space-y-1">
        {stats.recentPipelineActivity.length === 0 && (
          <p className="text-sm text-slate-500">No pipeline runs yet.</p>
        )}
        {stats.recentPipelineActivity.map((item) => (
          <div
            key={item._id}
            className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <span className="text-slate-700">
              <span className="font-medium">{item.pipeline}</span> — {item.targetTitle}
            </span>
            <span className="text-xs text-slate-500">
              {item.verdict} ({(item.score * 100).toFixed(0)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

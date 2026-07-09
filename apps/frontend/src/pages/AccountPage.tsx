import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { Button } from '../components/ui/Button';
import { StatusPill } from '../components/ui/StatusPill';

interface ZoomStatus {
  connected: boolean;
  lastMeeting: {
    topic: string;
    status: string;
    insightsExtracted: number;
    createdAt: string;
  } | null;
}

export function AccountPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [zoomStatus, setZoomStatus] = useState<ZoomStatus | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const zoomParam = searchParams.get('zoom');

  function loadZoomStatus() {
    api
      .get('/zoom/status')
      .then(({ data }) => setZoomStatus(data))
      .catch(() => setZoomStatus(null));
  }

  useEffect(loadZoomStatus, []);

  async function handleConnectZoom() {
    try {
      const { data } = await api.get('/zoom/authorize');
      window.location.href = data.url;
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Could not start Zoom connection. Has ZOOM_CLIENT_ID been set?');
    }
  }

  async function handleUpload(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setUploadResult(null);
    setUploadError(null);

    const formData = new FormData();
    formData.append('transcript', file);
    formData.append('topic', file.name);

    try {
      const { data } = await api.post('/zoom/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadResult(`Processed! Extracted ${data.extracted} Q&A pair(s) from the transcript.`);
      loadZoomStatus();
    } catch (err: any) {
      setUploadError(err?.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-12">
      <span className="font-mono text-xs uppercase tracking-[0.15em] text-forest">Profile</span>
      <h1 className="mt-1 font-display text-3xl font-semibold text-ink">Account</h1>

      <div className="mt-6 rounded-lg border border-mist bg-white p-5">
        <dl className="grid grid-cols-2 gap-y-3 text-sm">
          <dt className="text-ink-soft">Name</dt>
          <dd className="text-ink">{user?.name}</dd>
          <dt className="text-ink-soft">Email</dt>
          <dd className="text-ink">{user?.email}</dd>
          <dt className="text-ink-soft">Role</dt>
          <dd><StatusPill tone="forest">{user?.role}</StatusPill></dd>
          <dt className="text-ink-soft">Reputation</dt>
          <dd className="font-mono text-forest">{user?.reputation} pts</dd>
        </dl>
      </div>

      <h2 className="mt-8 font-display text-lg font-semibold text-ink">Zoom integration</h2>

      {zoomParam === 'connected' && (
        <p className="mt-2 rounded-lg bg-forest-soft px-3 py-2 text-sm text-forest-dark">
          Zoom account connected successfully.
        </p>
      )}
      {zoomParam === 'error' && (
        <p className="mt-2 rounded-lg bg-clay-soft px-3 py-2 text-sm text-clay-dark">
          Zoom connection failed. Check backend logs.
        </p>
      )}

      <div className="mt-3 rounded-lg border border-mist bg-white p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-ink-soft">Status</span>
          <StatusPill tone={zoomStatus?.connected ? 'forest' : 'mist'}>
            {zoomStatus?.connected ? 'Connected' : 'Not connected'}
          </StatusPill>
        </div>
        {!zoomStatus?.connected && (
          <Button variant="secondary" className="mt-3 w-full" onClick={handleConnectZoom}>
            Connect Zoom account
          </Button>
        )}
        {zoomStatus?.lastMeeting && (
          <p className="mt-3 border-t border-mist pt-3 text-xs text-ink-soft">
            Last sync: <strong className="text-ink">{zoomStatus.lastMeeting.topic}</strong> —{' '}
            {zoomStatus.lastMeeting.status} ({zoomStatus.lastMeeting.insightsExtracted} insights extracted)
          </p>
        )}
      </div>

      <h3 className="mt-6 text-sm font-semibold text-ink">
        Manual transcript upload
        <span className="ml-2 font-normal text-ink-soft">(works without connecting Zoom)</span>
      </h3>
      <form onSubmit={handleUpload} className="mt-2 space-y-2 rounded-lg border border-dashed border-mist-dark bg-white p-4">
        <input
          type="file"
          accept=".vtt,.txt"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-ink-soft file:mr-3 file:rounded-md file:border-0 file:bg-forest-soft file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-forest-dark"
        />
        {uploadError && <p className="text-sm text-clay">{uploadError}</p>}
        {uploadResult && <p className="text-sm text-forest-dark">{uploadResult}</p>}
        <Button type="submit" disabled={!file || uploading}>
          {uploading ? 'Processing (this can take a minute)…' : 'Upload transcript'}
        </Button>
      </form>
    </div>
  );
}
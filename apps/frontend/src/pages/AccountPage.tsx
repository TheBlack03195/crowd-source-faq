import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { Button } from '../components/ui/Button';

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
    <div className="mx-auto mt-16 max-w-lg px-4">
      <h1 className="text-2xl font-semibold text-slate-900">Account</h1>
      <div className="mt-4 space-y-2 text-sm text-slate-700">
        <p>
          <span className="font-medium">Name:</span> {user?.name}
        </p>
        <p>
          <span className="font-medium">Email:</span> {user?.email}
        </p>
        <p>
          <span className="font-medium">Role:</span> {user?.role}
        </p>
        <p>
          <span className="font-medium">Reputation:</span> {user?.reputation}
        </p>
      </div>

      <hr className="my-6 border-slate-200" />

      <h2 className="text-lg font-semibold text-slate-900">Zoom integration</h2>

      {zoomParam === 'connected' && (
        <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Zoom account connected successfully.
        </p>
      )}
      {zoomParam === 'error' && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          Zoom connection failed. Check backend logs.
        </p>
      )}

      <div className="mt-3 rounded-lg border border-slate-200 p-4">
        <p className="text-sm text-slate-700">
          Status:{' '}
          <strong className={zoomStatus?.connected ? 'text-emerald-700' : 'text-slate-500'}>
            {zoomStatus?.connected ? 'Connected' : 'Not connected'}
          </strong>
        </p>
        {!zoomStatus?.connected && (
          <Button variant="secondary" className="mt-3" onClick={handleConnectZoom}>
            Connect Zoom account
          </Button>
        )}
        {zoomStatus?.lastMeeting && (
          <p className="mt-3 text-xs text-slate-500">
            Last sync: <strong>{zoomStatus.lastMeeting.topic}</strong> — {zoomStatus.lastMeeting.status} (
            {zoomStatus.lastMeeting.insightsExtracted} insights extracted)
          </p>
        )}
      </div>

      <h3 className="mt-6 text-sm font-semibold text-slate-700">
        Manual transcript upload
        <span className="ml-2 font-normal text-slate-400">(works without connecting Zoom)</span>
      </h3>
      <form onSubmit={handleUpload} className="mt-2 space-y-2">
        <input
          type="file"
          accept=".vtt,.txt"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-slate-600"
        />
        {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
        {uploadResult && <p className="text-sm text-emerald-700">{uploadResult}</p>}
        <Button type="submit" disabled={!file || uploading}>
          {uploading ? 'Processing (this can take a minute)…' : 'Upload transcript'}
        </Button>
      </form>
    </div>
  );
}

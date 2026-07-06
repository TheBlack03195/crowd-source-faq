import { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import { Button } from '../../components/ui/Button';

interface FeatureFlag {
  _id: string;
  key: string;
  label: string;
  enabled: boolean;
}

export function AdminSettings() {
  const [cooldownHours, setCooldownHours] = useState(48);
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [saved, setSaved] = useState(false);

  function load() {
    api.get('/app-settings').then(({ data }) => setCooldownHours(data.goldenCooldownHours));
    api.get('/feature-flags').then(({ data }) => setFlags(data.flags));
  }

  useEffect(load, []);

  async function handleSaveCooldown() {
    await api.patch('/app-settings', { goldenCooldownHours: cooldownHours });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleToggleFlag(key: string, enabled: boolean) {
    await api.patch(`/feature-flags/${key}`, { enabled });
    load();
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-900">Settings</h1>

      <div className="mb-6 rounded-lg border border-slate-200 p-4">
        <h2 className="text-sm font-semibold text-slate-700">Golden Ticket cooldown</h2>
        <p className="mt-1 text-xs text-slate-500">Hours a user must wait between escalation submissions. 0 disables the cooldown.</p>
        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={720}
            value={cooldownHours}
            onChange={(e) => setCooldownHours(Number(e.target.value))}
            className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <span className="text-sm text-slate-500">hours</span>
          <Button onClick={handleSaveCooldown}>Save</Button>
          {saved && <span className="text-sm text-emerald-700">Saved!</span>}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <h2 className="text-sm font-semibold text-slate-700">Feature flags</h2>
        <div className="mt-3 space-y-2">
          {flags.length === 0 && (
            <p className="text-xs text-slate-500">
              No flags created yet — toggling a new key here will create it (e.g. "goldenTicket", "sessionSupport").
            </p>
          )}
          {flags.map((flag) => (
            <label key={flag._id} className="flex items-center justify-between text-sm">
              <span>{flag.label || flag.key}</span>
              <input
                type="checkbox"
                checked={flag.enabled}
                onChange={(e) => handleToggleFlag(flag.key, e.target.checked)}
              />
            </label>
          ))}
          <div className="flex gap-2 pt-2">
            <input
              id="new-flag-key"
              placeholder="new-flag-key"
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            />
            <Button
              variant="secondary"
              onClick={() => {
                const input = document.getElementById('new-flag-key') as HTMLInputElement;
                if (input.value) handleToggleFlag(input.value, true).then(() => (input.value = ''));
              }}
            >
              Add + enable
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

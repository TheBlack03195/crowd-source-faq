import { useAuth } from '../hooks/useAuth';

export function AccountPage() {
  const { user } = useAuth();

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
      <p className="mt-6 text-xs text-slate-400">
        Zoom OAuth connect, profile editing, and password change land in a later phase.
      </p>
    </div>
  );
}

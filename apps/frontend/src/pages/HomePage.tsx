import { useAuth } from '../hooks/useAuth';

export function HomePage() {
  const { isAuthenticated, user, isLoading } = useAuth();

  return (
    <div className="mx-auto mt-16 max-w-2xl px-4 text-center">
      <h1 className="text-3xl font-semibold text-slate-900">Crowd Source FAQ</h1>
      <p className="mt-3 text-slate-600">
        Phase 0 foundation is live: auth, JWT, protected routes, and the base layout.
      </p>

      {!isLoading && (
        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          {isAuthenticated ? (
            <>
              Logged in as <strong>{user?.name}</strong> ({user?.email}) — role:{' '}
              <code className="rounded bg-slate-200 px-1">{user?.role}</code>
            </>
          ) : (
            'Not logged in. Search, FAQs, and community boards arrive in Phase 1.'
          )}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { SearchBar } from '../components/ui/SearchBar';
import type { Faq } from '../utils/types';

export function HomePage() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [trending, setTrending] = useState<Faq[]>([]);

  useEffect(() => {
    api.get('/search/trending').then(({ data }) => setTrending(data.results)).catch(() => {});
  }, []);

  return (
    <div className="mx-auto mt-16 max-w-2xl px-4 text-center">
      <h1 className="text-3xl font-semibold text-slate-900">Crowd Source FAQ</h1>
      <p className="mt-3 text-slate-600">
        Search the knowledge base, or ask the community if you can't find your answer.
      </p>

      <div className="mt-6">
        <SearchBar onSearch={(q) => navigate(`/faq?q=${encodeURIComponent(q)}`)} />
      </div>

      {!isLoading && (
        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          {isAuthenticated ? (
            <>
              Logged in as <strong>{user?.name}</strong> — role:{' '}
              <code className="rounded bg-slate-200 px-1">{user?.role}</code>
            </>
          ) : (
            'Not logged in — you can still search and browse FAQs as a guest.'
          )}
        </div>
      )}

      {trending.length > 0 && (
        <div className="mt-10 text-left">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Trending questions
          </h2>
          <ul className="space-y-2">
            {trending.map((faq) => (
              <li
                key={faq._id}
                className="cursor-pointer rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-800 hover:border-emerald-400"
                onClick={() => navigate('/faq')}
              >
                {faq.question}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

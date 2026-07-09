import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { SearchBar } from '../components/ui/SearchBar';
import { StatusPill } from '../components/ui/StatusPill';
import type { Faq } from '../utils/types';

export function HomePage() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [trending, setTrending] = useState<Faq[]>([]);

  useEffect(() => {
    api.get('/search/trending').then(({ data }) => setTrending(data.results)).catch(() => {});
  }, []);

  return (
    <div>
      <section className="border-b border-mist bg-white">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center animate-fade-up">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-forest">
            The knowledge base that answers itself
          </span>
          <h1 className="mt-4 font-display text-5xl font-semibold leading-tight text-ink sm:text-6xl">
            Ask once. It's answered
            <br />
            for everyone after.
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-ink-soft">
            Search the archive, or ask the community — the AI assistant, your peers, or a moderator will get
            you the answer.
          </p>

          <div className="mx-auto mt-8 max-w-xl">
            <SearchBar large onSearch={(q) => navigate(`/faq?q=${encodeURIComponent(q)}`)} />
          </div>

          <p className="mt-4 text-xs text-ink-soft">
            or try{' '}
            <Link to="/faq/voice" className="text-forest underline underline-offset-2">
              voice search
            </Link>
          </p>

          {!isLoading && isAuthenticated && (
            <div className="mx-auto mt-8 inline-flex items-center gap-2 rounded-full border border-mist-dark bg-paper px-4 py-1.5 text-sm text-ink-soft">
              Welcome back, <strong className="text-ink">{user?.name}</strong>
              <StatusPill tone="forest">{user?.role}</StatusPill>
            </div>
          )}
        </div>
      </section>

      {trending.length > 0 && (
        <section className="mx-auto max-w-3xl px-6 py-14">
          <h2 className="mb-4 font-mono text-xs font-medium uppercase tracking-[0.15em] text-ink-soft">
            Trending in the archive
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {trending.slice(0, 6).map((faq) => (
              <button
                key={faq._id}
                onClick={() => navigate('/faq')}
                className="spine group rounded-r-lg border border-l-0 border-mist bg-white px-4 py-3 text-left text-sm text-ink transition-shadow hover:shadow-sm"
              >
                <span className="line-clamp-2 group-hover:text-forest">{faq.question}</span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
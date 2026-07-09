import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from './Button';

const links = [
  { to: '/faq', label: 'FAQs' },
  { to: '/faq/voice', label: 'Voice search' },
  { to: '/community', label: 'Community' },
  { to: '/leaderboard', label: 'Leaderboard' },
];

const authedLinks = [
  { to: '/golden', label: 'Golden Ticket' },
  { to: '/support', label: 'Support' },
  { to: '/faq/review-queue', label: 'Review Queue' },
];

export function Navbar() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const navigate = useNavigate();
  const isStaff = user?.role === 'admin' || user?.role === 'moderator';

  return (
    <nav className="sticky top-0 z-40 border-b border-mist bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-8">
          <Link to="/" className="font-display text-xl font-semibold text-ink">
            Crowd&nbsp;Source&nbsp;FAQ
          </Link>
          
          <div className="hidden items-center gap-6 text-sm text-ink-soft lg:flex">
            {links.map((l) => (
              <Link key={l.to} to={l.to} className="transition-colors hover:text-forest">
                {l.label}
              </Link>
            ))}
            
            <a
              href="https://samagama.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-forest"
            >
              samagama.in
            </a>

            {/* Separator and Authenticated Links */}
            {isAuthenticated && (
              <>
                <div className="h-4 w-px bg-mist-dark" />
                {authedLinks.map((l) => (
                  <Link key={l.to} to={l.to} className="transition-colors hover:text-forest">
                    {l.label}
                  </Link>
                ))}
              </>
            )}

            {/* Separator and Admin Link */}
            {isStaff && (
              <>
                <div className="h-4 w-px bg-mist-dark" />
                <Link
                  to="/admin"
                  className="rounded border border-gold/40 bg-gold-soft px-2 py-0.5 font-mono text-xs font-medium uppercase tracking-wide text-gold-dark transition-colors hover:border-gold"
                >
                  Admin
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isLoading ? null : isAuthenticated ? (
            <>
              <Link to="/account" className="hidden text-sm text-ink-soft hover:text-forest sm:inline">
                {user?.name}
              </Link>
              <Button
                variant="ghost"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
              >
                Log out
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost">Log in</Button>
              </Link>
              <Link to="/register">
                <Button variant="primary">Sign up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
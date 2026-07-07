import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from './Button';

export function Navbar() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const navigate = useNavigate();
  const isStaff = user?.role === 'admin' || user?.role === 'moderator';

  return (
    <nav className="flex items-center justify-between border-b border-slate-200 px-6 py-3">
      <div className="flex items-center gap-6">
        <Link to="/" className="text-lg font-semibold text-emerald-800">
          Crowd Source FAQ
        </Link>
        <div className="hidden gap-4 text-sm text-slate-600 sm:flex">
          <Link to="/faq" className="hover:text-emerald-700">
            FAQs
          </Link>
          <Link to="/faq/voice" className="hover:text-emerald-700">
            Voice
          </Link>
          <Link to="/community" className="hover:text-emerald-700">
            Community
          </Link>
          <a
            href="https://samagama.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-emerald-700"
          >
            samagama.in
          </a>
          <Link to="/leaderboard" className="hover:text-emerald-700">
            Leaderboard
          </Link>
          {isAuthenticated && (
            <>
              <Link to="/golden" className="hover:text-emerald-700">
                Golden Ticket
              </Link>
              <Link to="/support" className="hover:text-emerald-700">
                Support
              </Link>
              <Link to="/faq/review-queue" className="hover:text-emerald-700">
                Review Queue
              </Link>
            </>
          )}
          {isStaff && (
            <Link to="/admin" className="font-medium text-emerald-700 hover:text-emerald-800">
              Admin
            </Link>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {isLoading ? null : isAuthenticated ? (
          <>
            <Link to="/account" className="text-sm text-slate-600 hover:text-emerald-700">
              Hi, {user?.name}
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
    </nav>
  );
}

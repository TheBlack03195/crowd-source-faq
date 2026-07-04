import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from './Button';

export function Navbar() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="flex items-center justify-between border-b border-slate-200 px-6 py-3">
      <Link to="/" className="text-lg font-semibold text-emerald-800">
        Crowd Source FAQ
      </Link>

      <div className="flex items-center gap-3">
        {isLoading ? null : isAuthenticated ? (
          <>
            <span className="text-sm text-slate-600">Hi, {user?.name}</span>
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

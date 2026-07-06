import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

const links = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/faq-review', label: 'FAQ Review' },
  { to: '/admin/auto-answer', label: 'Auto-Answer Queue' },
  { to: '/admin/community', label: 'Community Moderation' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/zoom', label: 'Zoom Ingestion' },
  { to: '/admin/settings', label: 'Settings' },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6">
      <aside className="w-48 flex-shrink-0">
        <nav className="space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 text-sm ${
                  isActive ? 'bg-emerald-100 font-medium text-emerald-800' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}

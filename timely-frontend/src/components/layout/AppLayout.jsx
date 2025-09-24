import React, { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const role = user?.role || 'PUBLIC';

  const links = useMemo(() => {
    if (!user) {
      return [
        { href: '/', label: 'Home' },
        { href: '/events', label: 'Events' },
        { href: '/news', label: 'News' },
        { href: '/media', label: 'Gallery' },
        { href: '/tickets', label: 'Tickets' },
      ];
    }
    if (role === 'ADMIN' || role === 'ORGANIZER') {
      return [
        { href: '/', label: 'Home' },
        { href: '/admin/events', label: 'My Events' },
        { href: '/admin/registrations', label: 'Registrations' },
        { href: '/admin/fixtures', label: 'Fixtures' },
        { href: '/admin/results', label: 'Results' },
        { href: '/admin/venues', label: 'Venues' },
        { href: '/admin/announcements', label: 'Announcements' },
        { href: '/admin/reports', label: 'Reports' },
      ];
    }
    if (role === 'COACH') {
      return [
        { href: '/', label: 'Home' },
        { href: '/coach', label: 'My Team' },
        { href: '/coach', label: 'Schedule' },
        { href: '/coach', label: 'Results' },
      ];
    }
    if (role === 'ATHLETE') {
      return [
        { href: '/', label: 'Home' },
        { href: '/athlete', label: 'My Schedule' },
        { href: '/athlete', label: 'My Results' },
        { href: '/tickets', label: 'My Tickets' },
      ];
    }
    // SPECTATOR
    return [
      { href: '/', label: 'Home' },
      { href: '/events', label: 'Events' },
      { href: '/news', label: 'News' },
      { href: '/media', label: 'Gallery' },
      { href: '/tickets', label: 'Tickets' },
    ];
  }, [user, role]);

  const AvatarMenu = () => (
    <div className="relative">
      <button
        aria-label="Account menu"
        className="ml-3 inline-flex items-center rounded-full bg-slate-100 hover:bg-slate-200 px-3 py-1 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 active:translate-y-px"
        onClick={() => setOpen((v) => !v)}
      >
        {user?.first_name ? user.first_name[0] : 'U'}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded-lg border border-slate-200 bg-white shadow-lg z-50">
          <a href="/profile" className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">Profile</a>
          {(role === 'ADMIN' || role === 'ORGANIZER') && (
            <a href="/admin/" className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">Django Admin</a>
          )}
          <button onClick={logout} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">Sign out</button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex h-14 items-center justify-between">
            <a href="/" className="inline-flex items-center gap-2 font-semibold text-slate-900">
              <span className="inline-block h-6 w-6 rounded bg-blue-500" aria-hidden="true" />
              Timely
            </a>
            <nav className="hidden md:flex items-center gap-6 text-sm">
              {links.map((l) => (
                <a key={l.href} href={l.href} className="text-slate-700 hover:text-slate-900 transition-colors">
                  {l.label}
                </a>
              ))}
              {!user && (
                <div className="flex items-center gap-3">
                  <a href="/login" className="text-blue-600 hover:text-blue-700 font-medium">Sign in</a>
                  <a href="/register" className="inline-flex items-center rounded-md bg-blue-500 px-3 py-1.5 text-white shadow hover:bg-blue-600 active:translate-y-px transition">Sign up</a>
                </div>
              )}
              {user && <AvatarMenu />}
            </nav>
            <button
              className="md:hidden inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 active:translate-y-px"
              onClick={() => setOpen((v) => !v)}
              aria-label="Open menu"
            >
              Menu
            </button>
          </div>
        </div>
        {open && (
          <div className="md:hidden border-t border-slate-200 bg-white">
            <nav className="mx-auto max-w-6xl px-4 py-3 space-y-1">
              {links.map((l) => (
                <a key={l.href} href={l.href} className="block rounded px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                  {l.label}
                </a>
              ))}
              {!user ? (
                <div className="flex items-center gap-3 px-1 pt-2">
                  <a href="/login" className="text-blue-600 hover:text-blue-700 font-medium">Sign in</a>
                  <a href="/register" className="inline-flex items-center rounded-md bg-blue-500 px-3 py-1.5 text-white shadow hover:bg-blue-600 active:translate-y-px transition">Sign up</a>
                </div>
              ) : (
                <div className="pt-2">
                  {(role === 'ADMIN' || role === 'ORGANIZER') && (
                    <a href="/admin/" className="block rounded px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">Django Admin</a>
                  )}
                  <a href="/profile" className="block rounded px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">Profile</a>
                  <button onClick={logout} className="mt-1 w-full rounded px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">Sign out</button>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>

      <main id="main-content" className="mx-auto min-h-[70vh] max-w-6xl px-4 py-6 animate-[fadeIn_200ms_ease-out]">
        {children}
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 text-sm text-slate-600">
          <span>© {new Date().getFullYear()} Timely</span>
          <div className="flex items-center gap-4">
            <a href="/events" className="hover:text-slate-900">Events</a>
            <a href="/news" className="hover:text-slate-900">News</a>
            <a href="/media" className="hover:text-slate-900">Gallery</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

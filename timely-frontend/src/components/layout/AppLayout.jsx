import { useAuth } from '../../context/AuthContext.jsx';

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();

  const publicLinks = [
    { href: '/', label: 'Home' },
    { href: '/events', label: 'Events' },
    { href: '/news', label: 'News' },
    { href: '/media', label: 'Gallery' },
    { href: '/tickets', label: 'Tickets' },
  ];

  const adminLinks = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/events', label: 'Events' },
    { href: '/admin/users', label: 'Users' },
    { href: '/admin/registrations', label: 'Registrations' },
    { href: '/admin/fixtures', label: 'Fixtures' },
    { href: '/admin/results', label: 'Results' },
    { href: '/admin/venues', label: 'Venues' },
    { href: '/admin/announcements', label: 'Announcements' },
    { href: '/admin/reports', label: 'Reports' },
    { href: '/admin/settings', label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="font-semibold">Timely</a>
          <nav className="text-sm flex items-center gap-4">
            {publicLinks.map((l) => (
              <a key={l.href} href={l.href} className="hover:text-gray-900 text-gray-700">{l.label}</a>
            ))}
            {!user ? (
              <>
                <a href="/login" className="text-blue-600">Sign in</a>
                <a href="/register" className="text-blue-600">Sign up</a>
              </>
            ) : (
              <>
                <a href="/dashboard" className="text-gray-700">Dashboard</a>
                <button onClick={logout} className="text-gray-700">Sign out</button>
              </>
            )}
          </nav>
        </div>
      </header>
      <div className="max-w-5xl mx-auto flex">
        {user && (user.role === 'ADMIN' || user.role === 'ORGANIZER') ? (
          <aside className="w-56 shrink-0 border-r border-gray-200 hidden md:block">
            <nav className="px-4 py-4 text-sm space-y-1">
              {adminLinks.map((l) => (
                <a key={l.href} href={l.href} className="block px-3 py-2 rounded hover:bg-gray-50 text-gray-700">{l.label}</a>
              ))}
            </nav>
          </aside>
        ) : null}
        <main id="main-content" className="min-h-[70vh] flex-1 px-4">
          {children}
        </main>
      </div>
      <footer className="border-t border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-6 text-sm text-gray-500">
          © {new Date().getFullYear()} Timely
        </div>
      </footer>
    </div>
  );
}

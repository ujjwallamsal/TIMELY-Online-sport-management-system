import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { NotificationBell } from "./NotificationSystem";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, loading } = useAuth();

  const isActive = (path) =>
    location.pathname === path
      ? "text-gray-900"
      : "text-gray-600 hover:text-gray-900";

  async function handleLogout() {
    await logout();
    navigate("/", { replace: true });
  }

  return (
    <nav className="sticky top-0 z-40 backdrop-blur bg-white/70 border-b border-gray-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center space-x-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold shadow-sm">T</span>
          <span className="text-lg font-semibold tracking-tight">Timely</span>
        </Link>

        {/* Links */}
        <div className="hidden md:flex items-center space-x-6">
          <Link to="/" className={`transition-colors ${isActive("/")}`}>Home</Link>
          <Link to="/events" className={`transition-colors ${isActive("/events")}`}>Events</Link>
          <Link to="/matches" className={`transition-colors ${isActive("/matches")}`}>Matches</Link>
          <Link to="/results" className={`transition-colors ${isActive("/results")}`}>Results</Link>
          <Link to="/news" className={`transition-colors ${isActive("/news")}`}>News</Link>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          {loading ? (
            <div className="animate-pulse h-9 w-24 rounded-xl bg-gray-200" />
          ) : isAuthenticated ? (
            <>
              {user?.role === "ADMIN" && (
                <>
                  <Link to="/admin" className="px-3 py-2 rounded-xl text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100">⚙️ Admin</Link>
                  <Link to="/admin/users" className="px-3 py-2 rounded-xl text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100">👥 Users</Link>
                </>
              )}
              <NotificationBell />
              <Link to="/my-tickets" className="px-3 py-2 rounded-xl text-sm font-medium bg-gray-100 text-gray-900 hover:bg-gray-200">🎫 My Tickets</Link>
              <Link to="/profile" className="px-3 py-2 rounded-xl text-sm font-medium bg-gray-100 text-gray-900 hover:bg-gray-200">Profile</Link>
              <Link to="/dashboard" className="px-3 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm">Dashboard</Link>
              <button onClick={handleLogout} className="px-3 py-2 rounded-xl text-sm font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-50">Logout</button>
            </>
          ) : (
            <>
              <Link to="/signup" className="px-3 py-2 rounded-xl text-sm font-medium bg-gray-100 text-gray-900 hover:bg-gray-200">Sign Up</Link>
              <Link to="/login" className="px-3 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm">Login</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

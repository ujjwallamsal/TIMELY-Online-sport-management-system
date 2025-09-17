import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { NotificationBell } from "./NotificationSystem";
import { ClockIcon, UserCircleIcon } from '@heroicons/react/24/outline';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, loading } = useAuth();

  const isActive = (path) =>
    location.pathname === path
      ? "text-slate-900"
      : "text-slate-600 hover:text-slate-900";

  async function handleLogout() {
    await logout();
    navigate("/", { replace: true });
  }

  return (
    <nav className="sticky top-0 z-40 backdrop-blur bg-white/95 border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center group-hover:bg-slate-800 transition-colors duration-200">
            <ClockIcon className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-semibold text-slate-900">Timely</span>
        </Link>

        {/* Links */}
        <div className="hidden md:flex items-center space-x-8">
          <Link to="/" className={`font-medium transition-colors duration-200 ${isActive("/")}`}>Home</Link>
          <Link to="/events" className={`font-medium transition-colors duration-200 ${isActive("/events")}`}>Events</Link>
          <Link to="/matches" className={`font-medium transition-colors duration-200 ${isActive("/matches")}`}>Matches</Link>
          <Link to="/results" className={`font-medium transition-colors duration-200 ${isActive("/results")}`}>Results</Link>
          <Link to="/news" className={`font-medium transition-colors duration-200 ${isActive("/news")}`}>News</Link>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          {loading ? (
            <div className="animate-pulse h-9 w-24 rounded-lg bg-slate-200" />
          ) : isAuthenticated ? (
            <>
              {user?.role === "ADMIN" && (
                <>
                  <Link 
                    to="/admin" 
                    className="px-3 py-2 rounded-lg text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors duration-200"
                  >
                    Admin
                  </Link>
                  <Link 
                    to="/admin/users" 
                    className="px-3 py-2 rounded-lg text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors duration-200"
                  >
                    Users
                  </Link>
                </>
              )}
              <NotificationBell />
              <Link 
                to="/my-tickets" 
                className="px-3 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors duration-200"
              >
                My Tickets
              </Link>
              <Link 
                to="/profile" 
                className="px-3 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors duration-200 flex items-center space-x-2"
              >
                <UserCircleIcon className="w-4 h-4" />
                <span>Profile</span>
              </Link>
              <Link 
                to="/dashboard" 
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors duration-200"
              >
                Dashboard
              </Link>
              <button 
                onClick={handleLogout} 
                className="px-3 py-2 rounded-lg text-sm font-medium bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition-colors duration-200"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link 
                to="/signup" 
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors duration-200"
              >
                Sign up
              </Link>
              <Link 
                to="/login" 
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors duration-200"
              >
                Sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

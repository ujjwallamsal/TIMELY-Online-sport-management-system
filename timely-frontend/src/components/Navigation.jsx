// src/components/Navigation.jsx
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NotificationBell } from './NotificationSystem';
import { 
  ClockIcon, 
  UserCircleIcon, 
  ChevronDownIcon,
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  CalendarDaysIcon,
  TrophyIcon,
  NewspaperIcon,
  PhotoIcon,
  Cog6ToothIcon,
  TicketIcon,
  UserGroupIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  MegaphoneIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  UsersIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  StarIcon,
  AcademicCapIcon,
  HeartIcon
} from '@heroicons/react/24/outline';

export default function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, loading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const isActiveClass = (path) => {
    const active = isActive(path);
    return active 
      ? "text-blue-600 bg-blue-50 border-blue-200" 
      : "text-gray-700 hover:text-gray-900 hover:bg-gray-50 border-transparent";
  };

  const isActiveLinkClass = (path) => {
    const active = isActive(path);
    return active 
      ? "text-blue-600 font-semibold" 
      : "text-gray-600 hover:text-gray-900";
  };

  async function handleLogout() {
    await logout();
    navigate("/", { replace: true });
    setIsUserMenuOpen(false);
  }

  const getRoleBasedNavigation = () => {
    if (!user) return [];

    const baseNav = [
      { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
      { name: 'My Tickets', href: '/my-tickets', icon: TicketIcon },
      { name: 'My Registrations', href: '/my-registrations', icon: ClipboardDocumentListIcon },
      { name: 'Profile', href: '/profile', icon: UserCircleIcon },
    ];

    switch (user.role) {
      case 'ADMIN':
        return [
          ...baseNav,
          { name: 'Admin Dashboard', href: '/admin', icon: ShieldCheckIcon, admin: true },
          { name: 'Events', href: '/admin/events', icon: CalendarDaysIcon, admin: true },
          { name: 'Users', href: '/admin/users', icon: UsersIcon, admin: true },
          { name: 'Registrations', href: '/admin/registrations', icon: ClipboardDocumentListIcon, admin: true },
          { name: 'Fixtures', href: '/admin/fixtures', icon: CalendarIcon, admin: true },
          { name: 'Results', href: '/admin/results', icon: TrophyIcon, admin: true },
          { name: 'Venues', href: '/admin/venues', icon: BuildingOfficeIcon, admin: true },
          { name: 'Announcements', href: '/admin/announcements', icon: MegaphoneIcon, admin: true },
          { name: 'Reports', href: '/admin/reports', icon: ChartBarIcon, admin: true },
          { name: 'Settings', href: '/admin/settings', icon: Cog6ToothIcon, admin: true },
        ];
      
      case 'ORGANIZER':
        return [
          ...baseNav,
          { name: 'Event Management', href: '/organizer/dashboard', icon: CalendarDaysIcon, organizer: true },
          { name: 'Create Event', href: '/organizer/events/create', icon: PlusIcon, organizer: true },
          { name: 'Fixtures', href: '/organizer/fixtures', icon: CalendarIcon, organizer: true },
          { name: 'Matches', href: '/organizer/matches', icon: TrophyIcon, organizer: true },
          { name: 'Results', href: '/organizer/results', icon: StarIcon, organizer: true },
          { name: 'Venues', href: '/organizer/venues', icon: BuildingOfficeIcon, organizer: true },
        ];
      
      case 'ATHLETE':
        return [
          ...baseNav,
          { name: 'My Events', href: '/athlete/events', icon: CalendarDaysIcon, athlete: true },
          { name: 'My Results', href: '/athlete/results', icon: TrophyIcon, athlete: true },
          { name: 'Athlete Profile', href: '/athlete/profile', icon: HeartIcon, athlete: true },
        ];
      
      case 'COACH':
        return [
          ...baseNav,
          { name: 'Team Events', href: '/coach/events', icon: CalendarDaysIcon, coach: true },
          { name: 'Team Results', href: '/coach/results', icon: TrophyIcon, coach: true },
          { name: 'Coach Profile', href: '/coach/profile', icon: AcademicCapIcon, coach: true },
        ];
      
      default:
        return baseNav;
    }
  };

  const publicNavItems = [
    { name: 'Home', href: '/', icon: HomeIcon },
    { name: 'Events', href: '/events', icon: CalendarDaysIcon },
    { name: 'Schedule', href: '/schedule', icon: CalendarIcon },
    { name: 'Results', href: '/results', icon: TrophyIcon },
    { name: 'News', href: '/news', icon: NewspaperIcon },
    { name: 'Gallery', href: '/gallery', icon: PhotoIcon },
  ];

  const roleBasedNav = getRoleBasedNavigation();

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/95 border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center group-hover:from-blue-700 group-hover:to-blue-800 transition-all duration-200 shadow-sm">
              <ClockIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
              Timely
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {isAuthenticated ? (
              <>
                {/* Public links for authenticated users */}
                {publicNavItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActiveLinkClass(item.href)}`}
                  >
                    {item.name}
                  </Link>
                ))}
                
                {/* Role-based navigation */}
                {roleBasedNav.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
                      item.admin 
                        ? 'text-red-700 hover:text-red-800 hover:bg-red-50 border-red-200' 
                        : item.organizer
                        ? 'text-purple-700 hover:text-purple-800 hover:bg-purple-50 border-purple-200'
                        : item.athlete
                        ? 'text-green-700 hover:text-green-800 hover:bg-green-50 border-green-200'
                        : item.coach
                        ? 'text-orange-700 hover:text-orange-800 hover:bg-orange-50 border-orange-200'
                        : isActiveLinkClass(item.href)
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </>
            ) : (
              /* Public navigation for unauthenticated users */
              publicNavItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActiveLinkClass(item.href)}`}
                >
                  {item.name}
                </Link>
              ))
            )}
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-3">
            {loading ? (
              <div className="animate-pulse h-9 w-24 rounded-lg bg-gray-200" />
            ) : isAuthenticated ? (
              <>
                <NotificationBell />
                
                {/* User menu */}
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-200"
                  >
                    <UserCircleIcon className="w-5 h-5" />
                    <span className="hidden sm:block">{user.first_name || user.email}</span>
                    <ChevronDownIcon className="w-4 h-4" />
                  </button>

                  {/* User dropdown */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <UserCircleIcon className="w-4 h-4 mr-3" />
                        Profile
                      </Link>
                      <Link
                        to="/settings"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Cog6ToothIcon className="w-4 h-4 mr-3" />
                        Settings
                      </Link>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <XMarkIcon className="w-4 h-4 mr-3" />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-200"
                >
                  Sign up
                </Link>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200 shadow-sm"
                >
                  Sign in
                </Link>
              </>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-200"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4">
            <div className="space-y-1">
              {isAuthenticated ? (
                <>
                  {/* Public links */}
                  {publicNavItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActiveClass(item.href)}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <item.icon className="w-4 h-4 mr-3" />
                      {item.name}
                    </Link>
                  ))}
                  
                  <div className="border-t border-gray-200 my-2"></div>
                  
                  {/* Role-based navigation */}
                  {roleBasedNav.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        item.admin 
                          ? 'text-red-700 bg-red-50 border border-red-200' 
                          : item.organizer
                          ? 'text-purple-700 bg-purple-50 border border-purple-200'
                          : item.athlete
                          ? 'text-green-700 bg-green-50 border border-green-200'
                          : item.coach
                          ? 'text-orange-700 bg-orange-50 border border-orange-200'
                          : isActiveClass(item.href)
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <item.icon className="w-4 h-4 mr-3" />
                      {item.name}
                    </Link>
                  ))}
                </>
              ) : (
                /* Public navigation for unauthenticated users */
                publicNavItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActiveClass(item.href)}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <item.icon className="w-4 h-4 mr-3" />
                    {item.name}
                  </Link>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

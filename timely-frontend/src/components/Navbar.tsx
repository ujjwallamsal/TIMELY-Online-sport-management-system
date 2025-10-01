/**
 * Main Navigation Component
 * Role-based navigation with dropdowns, badges, and responsive mobile menu
 */

import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, X, User, LogOut, Settings, Bell, Search, 
  Ticket, UserCircle, ChevronDown 
} from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { getRoleDisplayName } from '../utils/role';
import { getNavigationByRole } from '../config/navigation';
import { useGetUnreadNotificationsCount } from '../api/queries';
import { usePendingRegistrationsCount, usePendingApprovalsCount } from '../hooks/usePendingCounts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { ENDPOINTS } from '../api/ENDPOINTS';
import { formatTimeAgo } from '../utils/dateUtils';
import NavDropdown from './NavDropdown';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();

  // Disable badge fetching on checkout pages to prevent request storms
  const isCheckoutPage = location.pathname.includes('/checkout') || location.pathname.includes('/tickets/success') || location.pathname.includes('/tickets/cancel');
  const shouldFetchBadges = isAuthenticated && !isCheckoutPage;
  
  // Fetch badge counts
  const isOrganizer = user?.role === 'ORGANIZER' || user?.role === 'ADMIN';
  const { data: unreadCount = 0 } = useGetUnreadNotificationsCount();
  const { data: pendingRegistrations = 0 } = usePendingRegistrationsCount(isOrganizer && shouldFetchBadges);
  const { data: pendingApprovals = 0 } = usePendingApprovalsCount(isOrganizer && shouldFetchBadges);

  const badges = {
    notifications: unreadCount,
    registrations: pendingRegistrations,
    approvals: pendingApprovals,
  };

  // Fetch recent notifications
  const { data: recentNotifications } = useQuery({
    queryKey: ['notifications', 'recent'],
    queryFn: async () => {
      const response = await api.get(ENDPOINTS.notifications, {
        params: { page_size: 5, ordering: '-created_at' }
      });
      return response.data?.results || [];
    },
    enabled: isAuthenticated && showNotifications,
  });

  // Handle scroll for sticky header shadow
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showNotifications]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isUserMenuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsUserMenuOpen(false);
  };

  const handleNotificationClick = async (notification: any) => {
    try {
      if (!notification.read_at) {
        await api.patch(`${ENDPOINTS.notifications}${notification.id}/mark_read/`);
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }

      if (notification.link_url) {
        navigate(notification.link_url);
      }

      setShowNotifications(false);
    } catch (error) {
      console.error('Failed to handle notification click:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post(`${ENDPOINTS.notifications}mark_all_read/`);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setShowNotifications(false);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  // Get navigation items based on role
  const navItems = getNavigationByRole(user?.role || null, isAuthenticated);

  // Render minimal nav while loading
  if (isLoading) {
    return (
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">T</span>
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900">Timely</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav
      className={`bg-white border-b border-gray-200 sticky top-0 z-40 transition-shadow ${
        isScrolled ? 'shadow-md' : ''
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left section: Logo and primary navigation */}
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0 flex items-center">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">Timely</span>
            </Link>

            {/* Desktop navigation */}
            <div className="hidden lg:flex lg:items-center lg:space-x-1">
              {navItems.map((item, index) => {
                if (item.children) {
                  return (
                    <NavDropdown
                      key={item.label || index}
                      item={item}
                      badges={badges}
                    />
                  );
                }

                if (!item.to) return null;

                const isActive = location.pathname === item.to;

                return (
                  <Link
                    key={item.to || index}
                    to={item.to}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right section: Utilities */}
          <div className="flex items-center space-x-2">
            {isAuthenticated ? (
              <>
                {/* Search - placeholder for future implementation */}
                <button
                  className="hidden lg:flex p-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
                  aria-label="Search"
                  title="Search (Coming Soon)"
                >
                  <Search className="h-5 w-5" />
                </button>

                {/* Notifications */}
                <div className="relative" ref={notificationRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
                    aria-label="Notifications"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-xs text-blue-600 hover:text-blue-700"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      
                      <div className="max-h-96 overflow-y-auto">
                        {recentNotifications && recentNotifications.length > 0 ? (
                          recentNotifications.map((notification: any) => (
                            <button
                              key={notification.id}
                              onClick={() => handleNotificationClick(notification)}
                              className={`w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 transition-colors ${
                                !notification.read_at ? 'bg-blue-50' : ''
                              }`}
                            >
                              <div className="flex items-start space-x-3">
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm ${!notification.read_at ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                    {notification.title}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                    {notification.body || notification.message}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {formatTimeAgo(notification.created_at)}
                                  </p>
                                </div>
                                {!notification.read_at && (
                                  <div className="flex-shrink-0">
                                    <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                                  </div>
                                )}
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-8 text-center text-gray-500">
                            <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">No notifications yet</p>
                          </div>
                        )}
                      </div>

                      <div className="px-4 py-3 border-t border-gray-200 text-center">
                        <Link
                          to="/notifications"
                          onClick={() => setShowNotifications(false)}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          View all notifications
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* My Tickets - visible for all authenticated users */}
                <Link
                  to="/tickets/me"
                  className="hidden lg:flex items-center p-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
                  aria-label="My Tickets"
                  title="My Tickets"
                >
                  <Ticket className="h-5 w-5" />
                </Link>

                {/* User menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 p-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
                    aria-label="User menu"
                  >
                    <UserCircle className="h-6 w-6" />
                    <span className="hidden md:inline text-sm font-medium">
                      {user?.first_name}
                    </span>
                    <ChevronDown className="hidden md:inline h-4 w-4" />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                      <div className="px-4 py-3 text-sm border-b border-gray-200">
                        <p className="font-medium text-gray-900">
                          {user?.first_name} {user?.last_name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {getRoleDisplayName(user?.role || 'SPECTATOR')}
                        </p>
                      </div>
                      
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <User className="h-4 w-4 mr-3" />
                        Profile
                      </Link>
                      
                      <Link
                        to="/settings"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4 mr-3" />
                        Account Settings
                      </Link>

                      {/* TODO: Switch Role - implement if user has multiple roles */}
                      
                      <div className="border-t border-gray-200 mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <LogOut className="h-4 w-4 mr-3" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile menu button */}
                <div className="lg:hidden">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="p-2 text-gray-700 hover:text-blue-600 rounded-md"
                    aria-label="Menu"
                  >
                    {isMenuOpen ? (
                      <X className="h-6 w-6" />
                    ) : (
                      <Menu className="h-6 w-6" />
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && isAuthenticated && (
          <div className="lg:hidden border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {/* Render navigation items for mobile */}
              {navItems.map((item, index) => {
                if (item.children) {
                  return (
                    <div key={item.label || index} className="space-y-1">
                      <div className="px-3 py-2 text-sm font-semibold text-gray-900">
                        {item.label}
                      </div>
                      {item.children.map((child, childIndex) => {
                        if (!child.to) return null;
                        const badge = child.badgeKey ? badges[child.badgeKey] : 0;
                        return (
                          <Link
                            key={child.to || childIndex}
                            to={child.to}
                            className="flex items-center justify-between pl-6 pr-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 rounded-md"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <span>{child.label}</span>
                            {badge > 0 && (
                              <span className="ml-2 px-2 py-0.5 text-xs font-semibold text-white bg-red-500 rounded-full">
                                {badge > 99 ? '99+' : badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  );
                }

                if (!item.to) return null;

                return (
                  <Link
                    key={item.to || index}
                    to={item.to}
                    className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 rounded-md font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                );
              })}

              {/* Mobile: My Tickets */}
              <Link
                to="/tickets/me"
                className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 rounded-md font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                My Tickets
              </Link>

              {/* Mobile: Profile & Settings */}
              <div className="border-t border-gray-200 mt-4 pt-4">
                <Link
                  to="/profile"
                  className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile
                </Link>
                <Link
                  to="/settings"
                  className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Settings
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

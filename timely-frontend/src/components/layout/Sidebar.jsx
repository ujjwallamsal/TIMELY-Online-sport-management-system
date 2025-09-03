import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  HomeIcon, 
  CalendarIcon, 
  TrophyIcon, 
  NewspaperIcon, 
  UserGroupIcon, 
  CogIcon, 
  ChartBarIcon,
  TicketIcon,
  PlusIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  CreditCardIcon,
  UserIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (path) => location.pathname === path;

  // Role-based navigation configuration
  const getNavigationItems = (userRole) => {
    const baseItems = [
      { name: 'Home', path: '/', icon: HomeIcon, public: true },
      { name: 'Events', path: '/events', icon: CalendarIcon, public: true },
      { name: 'Schedule', path: '/schedule', icon: TrophyIcon, public: true },
      { name: 'Results', path: '/results', icon: ChartBarIcon, public: true },
      { name: 'News', path: '/news', icon: NewspaperIcon, public: true },
    ];

    const roleSpecificItems = {
      'ADMIN': [
        { name: 'Dashboard', path: '/dashboard', icon: CogIcon },
        { name: 'Manage Users', path: '/admin/users', icon: UserGroupIcon },
        { name: 'Venues', path: '/admin/venues', icon: BuildingOfficeIcon },
        { name: 'View Reports', path: '/admin/reports', icon: ChartBarIcon },
        { name: 'System Settings', path: '/admin/settings', icon: CogIcon },
      ],
      'ORGANIZER': [
        { name: 'Dashboard', path: '/dashboard', icon: HomeIcon },
        { name: 'Create Event', path: '/create-event', icon: PlusIcon },
        { name: 'Manage Events', path: '/admin/events', icon: CalendarIcon },
        { name: 'Venues', path: '/admin/venues', icon: BuildingOfficeIcon },
        { name: 'Matches', path: '/admin/matches', icon: ClipboardDocumentListIcon },
        { name: 'Registrations', path: '/registrations', icon: DocumentTextIcon },
        { name: 'Results Entry', path: '/results-entry', icon: ChartBarIcon },
      ],
      'ATHLETE': [
        { name: 'Dashboard', path: '/dashboard', icon: HomeIcon },
        { name: 'My Registrations', path: '/my-registrations', icon: DocumentTextIcon },
        { name: 'My Tickets', path: '/my-tickets', icon: TicketIcon },
        { name: 'My Results', path: '/my-results', icon: ChartBarIcon },
        { name: 'Payment History', path: '/payments', icon: CreditCardIcon },
      ],
      'COACH': [
        { name: 'Dashboard', path: '/dashboard', icon: HomeIcon },
        { name: 'My Teams', path: '/my-teams', icon: UserGroupIcon },
        { name: 'Team Registrations', path: '/team-registrations', icon: DocumentTextIcon },
        { name: 'Team Results', path: '/team-results', icon: ChartBarIcon },
      ],
      'SPECTATOR': [
        { name: 'Dashboard', path: '/dashboard', icon: HomeIcon },
        { name: 'My Tickets', path: '/my-tickets', icon: TicketIcon },
        { name: 'Favorites', path: '/favorites', icon: TrophyIcon },
      ]
    };

    // Add role-specific items
    if (userRole && roleSpecificItems[userRole]) {
      baseItems.push(...roleSpecificItems[userRole]);
    }

    // Add common authenticated items
    if (userRole) {
      baseItems.push(
        { name: 'Profile', path: '/profile', icon: UserIcon },
        { name: 'Settings', path: '/settings', icon: CogIcon }
      );
    }

    return baseItems;
  };

  const navigationItems = getNavigationItems(user?.role);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Timely</span>
            </div>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:block p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`
                    flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive(item.path) 
                      ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border-r-2 border-blue-600 shadow-sm' 
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
                    }
                  `}
                  onClick={onClose}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          {user && (
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {user.first_name?.[0] || user.email[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.first_name ? `${user.first_name} ${user.last_name}` : user.email}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{user.role?.toLowerCase()}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;

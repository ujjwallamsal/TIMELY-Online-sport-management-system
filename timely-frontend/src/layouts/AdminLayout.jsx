// src/layouts/AdminLayout.jsx
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, 
  X, 
  Search, 
  Bell, 
  Settings, 
  HelpCircle,
  Users,
  Calendar,
  Ticket,
  BarChart3,
  MapPin,
  CreditCard,
  ChevronDown,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LiveDot from '../components/ui/LiveDot.jsx';
import useSocket from '../hooks/useSocket.js';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState(0);

  // WebSocket connection for real-time updates
  const { isConnected, lastMessage } = useSocket('/ws/admin/', {
    onMessage: (data) => {
      console.log('Admin layout real-time update:', data);
      
      // Handle notification updates
      if (data.type === 'notification') {
        setNotifications(prev => prev + 1);
      }
    }
  });

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: BarChart3, current: location.pathname === '/admin/dashboard' },
    { name: 'Events', href: '/admin/events', icon: Calendar, current: location.pathname.startsWith('/admin/events') },
    { name: 'Venues', href: '/admin/venues', icon: MapPin, current: location.pathname.startsWith('/admin/venues') },
    { name: 'Users', href: '/admin/users', icon: Users, current: location.pathname.startsWith('/admin/users') },
    { name: 'Tickets', href: '/admin/tickets', icon: Ticket, current: location.pathname.startsWith('/admin/tickets') },
    { name: 'Payments', href: '/admin/payments', icon: CreditCard, current: location.pathname.startsWith('/admin/payments') },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={handleSidebarToggle}></div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
          <button
            onClick={handleSidebarToggle}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    item.current
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.name}
                </a>
              );
            })}
          </div>
        </nav>

        {/* User section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.first_name?.charAt(0) || user?.email?.charAt(0) || 'A'}
                </span>
              </div>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.first_name || user?.email || 'Admin'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.role || 'Administrator'}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="ml-2 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button
                onClick={handleSidebarToggle}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <Menu className="h-6 w-6" />
              </button>
              
              <div className="ml-4 lg:ml-0">
                <h2 className="text-lg font-semibold text-gray-900">
                  {navigation.find(item => item.current)?.name || 'Dashboard'}
                </h2>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="hidden md:block">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              {/* Notifications */}
              <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md">
                <Bell className="h-6 w-6" />
                {notifications > 0 && (
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"></span>
                )}
              </button>

              {/* Settings */}
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md">
                <Settings className="h-6 w-6" />
              </button>

              {/* Help */}
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md">
                <HelpCircle className="h-6 w-6" />
              </button>

              {/* Live indicator */}
              <LiveDot isConnected={isConnected} />
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

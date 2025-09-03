import { useState, createContext, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import { 
  Bars3Icon, 
  XMarkIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';

// Create sidebar context
const SidebarContext = createContext();

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

export default function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  const isAuthPage = ['/login', '/signup', '/password-reset'].includes(location.pathname);
  const isPublicPage = ['/', '/events', '/schedule', '/results', '/news'].includes(location.pathname);
  const isHomePage = location.pathname === '/';

  const sidebarContextValue = {
    isOpen: sidebarOpen,
    open: () => setSidebarOpen(true),
    close: () => setSidebarOpen(false),
    toggle: () => setSidebarOpen(!sidebarOpen)
  };

  return (
    <SidebarContext.Provider value={sidebarContextValue}>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar - show for authenticated users on non-auth pages, but not home page */}
        {user && !isAuthPage && !isHomePage && (
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        )}
        
        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar - only show for authenticated users and non-auth pages, but not home page */}
          {user && !isAuthPage && !isHomePage && (
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between lg:hidden sticky top-0 z-40">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                aria-label="Open sidebar"
              >
                <Bars3Icon className="w-6 h-6" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <TrophyIcon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Timely
                </span>
              </div>
              <div className="w-10"></div> {/* Spacer for centering */}
            </div>
          )}

          {/* Public navigation header for Spectator Portal */}
          {!user && !isAuthPage && (
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <TrophyIcon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Timely Sports
                </span>
              </div>
              
              <nav className="hidden md:flex items-center space-x-6">
                <a href="/" className="text-gray-600 hover:text-blue-600 font-medium">Home</a>
                <a href="/events" className="text-gray-600 hover:text-blue-600 font-medium">Events</a>
                <a href="/schedule" className="text-gray-600 hover:text-blue-600 font-medium">Schedule</a>
                <a href="/results" className="text-gray-600 hover:text-blue-600 font-medium">Results</a>
                <a href="/news" className="text-gray-600 hover:text-blue-600 font-medium">News</a>
              </nav>
              
              <div className="flex items-center space-x-3">
                <a 
                  href="/login" 
                  className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 font-medium transition-colors"
                >
                  Sign In
                </a>
                <a 
                  href="/signup" 
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-medium transition-all"
                >
                  Sign Up
                </a>
              </div>
            </div>
          )}

          {/* Page content */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}

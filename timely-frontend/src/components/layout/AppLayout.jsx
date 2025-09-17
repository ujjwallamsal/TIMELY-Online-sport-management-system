import { useState, createContext, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import Navigation from '../Navigation';
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
  const isAdminPage = location.pathname.startsWith('/admin');
  const isHomePage = location.pathname === '/';

  const sidebarContextValue = {
    isOpen: sidebarOpen,
    open: () => setSidebarOpen(true),
    close: () => setSidebarOpen(false),
    toggle: () => setSidebarOpen(!sidebarOpen)
  };

  return (
    <SidebarContext.Provider value={sidebarContextValue}>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation - show for all pages except auth pages */}
        {!isAuthPage && <Navigation />}
        
        {/* Sidebar - show for authenticated users on non-auth pages, but not home page or admin pages */}
        {user && !isAuthPage && !isHomePage && !isAdminPage && (
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        )}
        
        {/* Main content */}
        <div className="flex-1">
          {/* Page content */}
          <main id="main-content" className="min-h-screen">
            {children}
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}

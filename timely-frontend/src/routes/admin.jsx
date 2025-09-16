// src/routes/admin.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../layouts/AdminLayout.jsx';
import Dashboard from '../pages/admin/Dashboard.jsx';
import EventsManage from '../pages/admin/EventsManage.jsx';
import EventForm from '../pages/admin/EventForm.jsx';
import EventDetail from '../pages/admin/EventDetail.jsx';
import Venues from '../pages/admin/Venues.jsx';
import VenueSlots from '../pages/admin/VenueSlots.jsx';
import Users from '../pages/admin/Users.jsx';
import NotFound from '../pages/NotFound';

// Admin route guard component
const AdminGuard = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has admin privileges
  if (user.role !== 'ADMIN' && !user.is_staff && !user.is_superuser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You don't have permission to access the admin dashboard. Please contact an administrator if you believe this is an error.
          </p>
          <a
            href="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Admin routes component
const AdminRoutes = () => {
  return (
    <AdminGuard>
      <AdminLayout>
        <Routes>
          {/* Dashboard */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Events Management */}
          <Route path="/events" element={<EventsManage />} />
          <Route path="/events/new" element={<EventForm />} />
          <Route path="/events/:id/edit" element={<EventForm />} />
          <Route path="/events/:id" element={<EventDetail />} />
          
          {/* Venues Management */}
          <Route path="/venues" element={<Venues />} />
          <Route path="/venues/:id/slots" element={<VenueSlots />} />
          
          {/* Users Management */}
          <Route path="/users" element={<Users />} />
          
          {/* Catch all - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AdminLayout>
    </AdminGuard>
  );
};

export default AdminRoutes;

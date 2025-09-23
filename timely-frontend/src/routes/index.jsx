// src/routes/index.jsx
import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout.jsx';
import Home from '../pages/public/Home.jsx';
import Login from '../pages/Login.jsx';
import Register from '../pages/Register.jsx';
import Events from '../pages/public/Events.jsx';
import EventDetail from '../pages/public/EventDetail.jsx';
import Media from '../pages/public/Media.jsx';
import News from '../pages/public/News.jsx';
import Tickets from '../pages/public/Tickets.jsx';
import NotFound from '../pages/NotFound.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import AdminDashboard from '../pages/admin/Dashboard.jsx';
import AdminEvents from '../pages/admin/Events.jsx';
import AdminRegistrations from '../pages/admin/Registrations.jsx';
import AdminFixtures from '../pages/admin/Fixtures.jsx';
import AdminResults from '../pages/admin/Results.jsx';
import AdminVenues from '../pages/admin/Venues.jsx';
import AdminUsers from '../pages/admin/Users.jsx';
import AdminAnnouncements from '../pages/admin/Announcements.jsx';
import AdminReports from '../pages/admin/Reports.jsx';
import AdminSettings from '../pages/admin/Settings.jsx';
import CoachDashboard from '../pages/coach/Dashboard.jsx';
import CoachTeam from '../pages/coach/Team.jsx';
import CoachEvent from '../pages/coach/Event.jsx';
import AthleteDashboard from '../pages/athlete/Dashboard.jsx';

/**
 * SkipLink component for accessibility
 */
const SkipLink = () => (
  <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
  >
    Skip to main content
  </a>
);

/**
 * Custom fallback component for admin access denied
 */
const AdminAccessDenied = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
      <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
      <p className="text-gray-600 mb-6">
        You don't have permission to access the admin dashboard.
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

/**
 * Main App Routes Component
 */
export default function AppRoutes() {
  const { user, loading } = useAuth();

  function RequireAuth({ children }) {
    const location = useLocation();
    if (loading) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-pulse text-sm text-gray-500">Loading…</div>
        </div>
      );
    }
    if (!user) {
      return <Navigate to="/login" replace state={{ from: location }} />;
    }
    return children;
  }

  function RequireRole({ roles = [], children }) {
    const location = useLocation();
    if (loading) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-pulse text-sm text-gray-500">Loading…</div>
        </div>
      );
    }
    if (!user) {
      return <Navigate to="/login" replace state={{ from: location }} />;
    }
    if (roles.length && !roles.includes(user.role)) {
      return <AdminAccessDenied />;
    }
    return children;
  }

  return (
    <AppLayout>
      <SkipLink />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* Public routes */}
        <Route path="/events" element={<Events />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/media" element={<Media />} />
        <Route path="/news" element={<News />} />
        <Route path="/tickets" element={<Tickets />} />

        {/* Admin/Organizer dashboard */}
        <Route path="/admin" element={<RequireAuth><RequireRole roles={["ADMIN", "ORGANIZER"]}><AdminDashboard /></RequireRole></RequireAuth>} />
        <Route
          path="/admin/events"
          element={
            <RequireAuth>
              <RequireRole roles={["ADMIN", "ORGANIZER"]}>
                <AdminEvents />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/registrations"
          element={
            <RequireAuth>
              <RequireRole roles={["ADMIN", "ORGANIZER"]}>
                <AdminRegistrations />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/fixtures"
          element={
            <RequireAuth>
              <RequireRole roles={["ADMIN", "ORGANIZER"]}>
                <AdminFixtures />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/results"
          element={
            <RequireAuth>
              <RequireRole roles={["ADMIN", "ORGANIZER"]}>
                <AdminResults />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/venues"
          element={
            <RequireAuth>
              <RequireRole roles={["ADMIN", "ORGANIZER"]}>
                <AdminVenues />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/users"
          element={
            <RequireAuth>
              <RequireRole roles={["ADMIN", "ORGANIZER"]}>
                <AdminUsers />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/announcements"
          element={
            <RequireAuth>
              <RequireRole roles={["ADMIN", "ORGANIZER"]}>
                <AdminAnnouncements />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <RequireAuth>
              <RequireRole roles={["ADMIN", "ORGANIZER"]}>
                <AdminReports />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <RequireAuth>
              <RequireRole roles={["ADMIN", "ORGANIZER"]}>
                <AdminSettings />
              </RequireRole>
            </RequireAuth>
          }
        />

        {/* Coach */}
        <Route path="/coach" element={<RequireAuth><RequireRole roles={["COACH"]}><CoachDashboard /></RequireRole></RequireAuth>} />
        <Route
          path="/coach/teams/:id"
          element={
            <RequireAuth>
              <RequireRole roles={["COACH"]}>
                <CoachTeam />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/coach/events/:eventId"
          element={
            <RequireAuth>
              <RequireRole roles={["COACH"]}>
                <CoachEvent />
              </RequireRole>
            </RequireAuth>
          }
        />

        {/* Athlete */}
        <Route path="/athlete" element={<RequireAuth><RequireRole roles={["ATHLETE"]}><AthleteDashboard /></RequireRole></RequireAuth>} />
        <Route
          path="/teams/:id"
          element={
            <RequireAuth>
              <RequireRole roles={["ATHLETE"]}>
                <div className="p-6">Athlete Team</div>
              </RequireRole>
            </RequireAuth>
          }
        />

        {/* Duplicate tickets path already defined above for public */}

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}

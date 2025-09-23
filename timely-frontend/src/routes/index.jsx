// src/routes/index.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Layouts
import AppLayout from '../components/layout/AppLayout.jsx';
import AdminLayout from '../components/admin/AdminLayout.jsx';

// Public Pages
import Home from '../pages/public/Home.jsx';
import Login from '../pages/Login.jsx';
import Signup from '../pages/Signup.jsx';
import PasswordReset from '../pages/PasswordReset.jsx';
import EventDetail from '../pages/public/EventDetail.jsx';
import Events from '../pages/public/Events.jsx';
import Schedule from '../pages/SpectatorSchedule.jsx';
import News from '../pages/public/News.jsx';
import Gallery from '../pages/public/Gallery.jsx';
import Results from '../pages/Results.jsx';
import NotFound from '../pages/NotFound.jsx';
import Error500 from '../pages/Error500.jsx';

// Admin Pages
import AdminDashboard from '../pages/admin/Dashboard.jsx';
import EventsManage from '../pages/admin/EventsManage.jsx';
import EventForm from '../pages/admin/EventForm.jsx';
import EventDetailAdmin from '../pages/admin/EventDetail.jsx';
import RegistrationsManage from '../pages/admin/RegistrationsManage.jsx';
import FixturesManage from '../pages/admin/FixturesManage.jsx';
import ResultsManage from '../pages/admin/ResultsManage.jsx';
import Venues from '../pages/admin/Venues.jsx';
import VenueForm from '../pages/admin/VenueForm.jsx';
import Users from '../pages/admin/Users.jsx';
import AnnouncementsManage from '../pages/admin/AnnouncementsManage.jsx';
import ReportsManage from '../pages/admin/ReportsManage.jsx';
import SettingsManage from '../pages/admin/SettingsManage.jsx';

// Coach Pages
import CoachDashboard from '../pages/coach/Dashboard.jsx';
import CoachTeamDashboard from '../pages/coach/TeamDashboard.jsx';
import CoachTeamFixtures from '../pages/coach/TeamFixtures.jsx';

// Athlete Pages
import AthleteDashboard from '../pages/athlete/Dashboard.jsx';
import AthleteMyTickets from '../pages/athlete/MyTickets.jsx';
import AthleteMyRegistrations from '../pages/athlete/MyRegistrations.jsx';
import AthleteNotifications from '../pages/athlete/Notifications.jsx';
import AthleteRegistrationWizard from '../pages/athlete/RegistrationWizard.jsx';

// Spectator Pages (Public)
import SpectatorDashboard from '../pages/spectator/Dashboard.jsx';
import SpectatorEvents from '../pages/public/Home.jsx'; // Same as home
import SpectatorTickets from '../pages/athlete/MyTickets.jsx'; // Reuse athlete tickets

// Components
import RequireRole from '../components/RequireRole.jsx';
import ErrorBoundary from '../components/ErrorBoundary.jsx';
import AppToaster from '../components/AppToaster.jsx';
import TestUIComponents from '../components/TestUIComponents.jsx';
import FormTest from '../components/FormTest.jsx';

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
  return (
    <ErrorBoundary>
      <AppToaster>
        <AppLayout>
          <SkipLink />
          <Routes>
            {/* ==================== PUBLIC ROUTES ==================== */}
            
            {/* Spectator Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/matches" element={<Schedule />} />
            <Route path="/news" element={<News />} />
            <Route path="/results" element={<Results />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/media" element={<Gallery />} />
            <Route path="/tickets" element={<SpectatorTickets />} />
            
            {/* Authentication */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/password-reset" element={<PasswordReset />} />
            
            {/* UI Components Demo */}
            <Route path="/ui-demo" element={<TestUIComponents />} />
            <Route path="/form-test" element={<FormTest />} />
            
            {/* ==================== ROLE-BASED ROUTES ==================== */}
            
            {/* Admin & Organizer Routes */}
            <Route path="/admin/*" element={
              <RequireRole roles={['ADMIN', 'ORGANIZER']} fallback={<AdminAccessDenied />}>
                <AdminLayout>
                  <Routes>
                    <Route path="/" element={<AdminDashboard />} />
                    <Route path="/events" element={<EventsManage />} />
                    <Route path="/events/new" element={<EventForm />} />
                    <Route path="/events/:id/edit" element={<EventForm />} />
                    <Route path="/events/:id" element={<EventDetailAdmin />} />
                    <Route path="/registrations" element={<RegistrationsManage />} />
                    <Route path="/fixtures" element={<FixturesManage />} />
                    <Route path="/results" element={<ResultsManage />} />
                    <Route path="/venues" element={<Venues />} />
                    <Route path="/venues/new" element={<VenueForm />} />
                    <Route path="/venues/:id/edit" element={<VenueForm />} />
                    <Route path="/users" element={<Users />} />
                    <Route path="/announcements" element={<AnnouncementsManage />} />
                    <Route path="/reports" element={<ReportsManage />} />
                    <Route path="/settings" element={<SettingsManage />} />
                    <Route path="*" element={<Navigate to="/admin" replace />} />
                  </Routes>
                </AdminLayout>
              </RequireRole>
            } />
            
            {/* Coach Routes */}
            <Route path="/coach/*" element={
              <RequireRole roles={['COACH', 'ADMIN']}>
                <Routes>
                  <Route path="/" element={<CoachDashboard />} />
                  <Route path="/teams/:id" element={<CoachTeamDashboard />} />
                  <Route path="/events/:eventId" element={<CoachTeamFixtures />} />
                  <Route path="*" element={<Navigate to="/coach" replace />} />
                </Routes>
              </RequireRole>
            } />
            
            {/* Athlete Routes */}
            <Route path="/athlete/*" element={
              <RequireRole roles={['ATHLETE', 'ADMIN']}>
                <Routes>
                  <Route path="/" element={<AthleteDashboard />} />
                  <Route path="/tickets" element={<AthleteMyTickets />} />
                  <Route path="/teams/:id" element={<AthleteMyRegistrations />} />
                  <Route path="*" element={<Navigate to="/athlete" replace />} />
                </Routes>
              </RequireRole>
            } />
            
            {/* Spectator Routes */}
            <Route path="/spectator/*" element={
              <RequireRole roles={['SPECTATOR', 'ADMIN']}>
                <Routes>
                  <Route path="/" element={<SpectatorDashboard />} />
                  <Route path="/events" element={<SpectatorEvents />} />
                  <Route path="/tickets" element={<SpectatorTickets />} />
                  <Route path="*" element={<Navigate to="/spectator" replace />} />
                </Routes>
              </RequireRole>
            } />
            
            {/* ==================== ERROR ROUTES ==================== */}
            <Route path="/500" element={<Error500 />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </AppToaster>
    </ErrorBoundary>
  );
}

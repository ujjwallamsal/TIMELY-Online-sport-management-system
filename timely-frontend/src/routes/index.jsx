// src/routes/index.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Layouts
import AppLayout from '../components/layout/AppLayout.jsx';
import AdminLayout from '../layouts/AdminLayout.jsx';

// Public Pages
import Home from '../pages/public/Home.jsx';
import Login from '../pages/Login.jsx';
import Signup from '../pages/Signup.jsx';
import PasswordReset from '../pages/PasswordReset.jsx';
import EventPublic from '../pages/public/EventPublic.jsx';
import SpectatorEvents from '../pages/SpectatorEvents.jsx';
import SpectatorSchedule from '../pages/SpectatorSchedule.jsx';
import SpectatorResults from '../pages/SpectatorResults.jsx';
import News from '../pages/public/News.jsx';
import Gallery from '../pages/public/Gallery.jsx';
import NotFound from '../pages/NotFound.jsx';
import Error500 from '../pages/Error500.jsx';

// Protected Pages
import Dashboard from '../pages/Dashboard.jsx';
import Profile from '../pages/Profile.jsx';
import Settings from '../pages/Settings.jsx';
import MyTickets from '../pages/MyTickets.jsx';
import MyRegistrations from '../pages/MyRegistrations.jsx';
import RegistrationWizard from '../pages/RegistrationWizard.jsx';

// Admin Pages
import AdminDashboard from '../pages/admin/Dashboard.jsx';
import EventsManage from '../pages/admin/EventsManage.jsx';
import EventForm from '../pages/admin/EventForm.jsx';
import EventDetail from '../pages/admin/EventDetail.jsx';
import RegistrationsManage from '../pages/admin/RegistrationsManage.jsx';
import FixturesManage from '../pages/admin/FixturesManage.jsx';
import ResultsManage from '../pages/admin/ResultsManage.jsx';
import Venues from '../pages/admin/Venues.jsx';
import VenueForm from '../pages/admin/VenueForm.jsx';
import Users from '../pages/admin/Users.jsx';
import AnnouncementsManage from '../pages/admin/AnnouncementsManage.jsx';
import ReportsManage from '../pages/admin/ReportsManage.jsx';
import SettingsManage from '../pages/admin/SettingsManage.jsx';

// Organizer Pages
import OrganizerDashboard from '../pages/organizer/Dashboard.jsx';
import EventEditor from '../pages/EventEditor.jsx';
import CreateEvent from '../pages/CreateEvent.jsx';
import EventManagement from '../pages/EventManagement.jsx';
import RegistrationManagement from '../pages/RegistrationManagement.jsx';
import Fixtures from '../pages/Fixtures.jsx';
import Matches from '../pages/Matches.jsx';
import Results from '../pages/Results.jsx';
import VenuesPage from '../pages/Venues.jsx';

// Athlete Pages
import AthleteDashboard from '../pages/athlete/Dashboard.jsx';
import AthleteMessages from '../pages/athlete/Messages.jsx';
import AthleteMyRegistrations from '../pages/athlete/MyRegistrations.jsx';
import AthleteMyTickets from '../pages/athlete/MyTickets.jsx';
import AthleteNotifications from '../pages/athlete/Notifications.jsx';
import AthletePayments from '../pages/athlete/Payments.jsx';
import AthleteRegistrationWizard from '../pages/athlete/RegistrationWizard.jsx';
import AthleteUploadDocs from '../pages/athlete/UploadDocs.jsx';

// Coach Pages
import CoachDashboard from '../pages/coach/Dashboard.jsx';
import CoachRoster from '../pages/coach/Roster.jsx';
import CoachTeamDashboard from '../pages/coach/TeamDashboard.jsx';
import CoachTeamFixtures from '../pages/coach/TeamFixtures.jsx';
import CoachTeamRegistration from '../pages/coach/TeamRegistration.jsx';
import CoachTeamResults from '../pages/coach/TeamResults.jsx';

// Components
import PrivateRoute from '../components/PrivateRoute.jsx';
import ErrorBoundary from '../components/ErrorBoundary.jsx';
import AppToaster from '../components/AppToaster.jsx';

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
 * Admin route guard component
 */
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
  }

  return <>{children}</>;
};

/**
 * Role-based route guard
 */
const RoleGuard = ({ children, requiredRoles = [] }) => {
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

  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h1>
          <p className="text-gray-600 mb-6">
            This page is only available to {requiredRoles.join(', ')} users.
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
            
            {/* Home & Landing */}
            <Route path="/" element={<Home />} />
            
            {/* Authentication */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/password-reset" element={<PasswordReset />} />
            
            {/* Public Event Pages */}
            <Route path="/events" element={<SpectatorEvents />} />
            <Route path="/events/:id" element={<EventPublic />} />
            <Route path="/schedule" element={<SpectatorSchedule />} />
            <Route path="/results" element={<SpectatorResults />} />
            <Route path="/news" element={<News />} />
            <Route path="/gallery" element={<Gallery />} />
            
            {/* ==================== PROTECTED ROUTES ==================== */}
            
            {/* Common Protected Pages */}
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
            <Route path="/my-tickets" element={<PrivateRoute><MyTickets /></PrivateRoute>} />
            <Route path="/my-registrations" element={<PrivateRoute><MyRegistrations /></PrivateRoute>} />
            <Route path="/events/:eventId/register" element={<PrivateRoute><RegistrationWizard /></PrivateRoute>} />
            
            {/* ==================== ROLE-BASED ROUTES ==================== */}
            
            {/* Admin Routes */}
            <Route path="/admin/*" element={
              <AdminGuard>
                <AdminLayout>
                  <Routes>
                    <Route path="/" element={<AdminDashboard />} />
                    <Route path="/events" element={<EventsManage />} />
                    <Route path="/events/new" element={<EventForm />} />
                    <Route path="/events/:id/edit" element={<EventForm />} />
                    <Route path="/events/:id" element={<EventDetail />} />
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
              </AdminGuard>
            } />
            
            {/* Organizer Routes */}
            <Route path="/organizer/*" element={
              <RoleGuard requiredRoles={['ORGANIZER', 'ADMIN']}>
                <Routes>
                  <Route path="/dashboard" element={<OrganizerDashboard />} />
                  <Route path="/events" element={<EventManagement />} />
                  <Route path="/events/create" element={<CreateEvent />} />
                  <Route path="/events/:id/edit" element={<EventEditor />} />
                  <Route path="/events/:eventId/registrations" element={<RegistrationManagement />} />
                  <Route path="/fixtures" element={<Fixtures />} />
                  <Route path="/matches" element={<Matches />} />
                  <Route path="/results" element={<Results />} />
                  <Route path="/venues" element={<VenuesPage />} />
                  <Route path="*" element={<Navigate to="/organizer/dashboard" replace />} />
                </Routes>
              </RoleGuard>
            } />
            
            {/* Athlete Routes */}
            <Route path="/athlete/*" element={
              <RoleGuard requiredRoles={['ATHLETE', 'ADMIN']}>
                <Routes>
                  <Route path="/dashboard" element={<AthleteDashboard />} />
                  <Route path="/messages" element={<AthleteMessages />} />
                  <Route path="/my-registrations" element={<AthleteMyRegistrations />} />
                  <Route path="/my-tickets" element={<AthleteMyTickets />} />
                  <Route path="/notifications" element={<AthleteNotifications />} />
                  <Route path="/payments" element={<AthletePayments />} />
                  <Route path="/registration-wizard" element={<AthleteRegistrationWizard />} />
                  <Route path="/upload-docs" element={<AthleteUploadDocs />} />
                  <Route path="*" element={<Navigate to="/athlete/dashboard" replace />} />
                </Routes>
              </RoleGuard>
            } />
            
            {/* Coach Routes */}
            <Route path="/coach/*" element={
              <RoleGuard requiredRoles={['COACH', 'ADMIN']}>
                <Routes>
                  <Route path="/dashboard" element={<CoachDashboard />} />
                  <Route path="/roster" element={<CoachRoster />} />
                  <Route path="/fixtures" element={<CoachTeamFixtures />} />
                  <Route path="/registration" element={<CoachTeamRegistration />} />
                  <Route path="/results" element={<CoachTeamResults />} />
                  <Route path="*" element={<Navigate to="/coach/dashboard" replace />} />
                </Routes>
              </RoleGuard>
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

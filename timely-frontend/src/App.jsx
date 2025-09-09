import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import AppToaster from "./components/AppToaster.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminUsers from "./pages/AdminUsers.jsx";
import Profile from "./pages/Profile.jsx";
import PasswordReset from "./pages/PasswordReset.jsx";
import EventsList from "./pages/EventsList.jsx";
import EventDetail from "./pages/EventDetail.jsx";
import EventEditor from "./pages/EventEditor.jsx";
import EventRegistration from "./pages/EventRegistration.jsx";
import RegistrationManagement from "./pages/RegistrationManagement.jsx";
import Fixtures from "./pages/Fixtures.jsx";
import Matches from "./pages/Matches.jsx";
import Results from "./pages/Results.jsx";
import News from "./pages/News.jsx";
import CreateEvent from "./pages/CreateEvent.jsx";
import EventManagement from "./pages/EventManagement.jsx";
import MyTickets from "./pages/MyTickets.jsx";
import MyRegistrations from "./pages/MyRegistrations.jsx";
import RegistrationWizard from "./pages/RegistrationWizard.jsx";
import Settings from "./pages/Settings.jsx";
import Venues from "./pages/Venues.jsx";
import NotFound from "./pages/NotFound.jsx";
import Error500 from "./pages/Error500.jsx";

// Spectator Portal pages
import SpectatorEvents from "./pages/SpectatorEvents.jsx";
import EventPublic from "./pages/EventPublic.jsx";
import SpectatorSchedule from "./pages/SpectatorSchedule.jsx";
import SpectatorResults from "./pages/SpectatorResults.jsx";

/**
 * SkipLink component for accessibility
 * Allows keyboard users to skip to main content
 */
const SkipLink = () => (
  <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
  >
    Skip to main content
  </a>
);

export default function App() {
  return (
    <ErrorBoundary>
      <AppToaster>
        <AppLayout>
          <SkipLink />
          <Routes>
        {/* Public Spectator Portal pages */}
        <Route path="/" element={<Home />} />
        <Route path="/events" element={<SpectatorEvents />} />
        <Route path="/events/:id" element={<EventPublic />} />
        <Route path="/schedule" element={<SpectatorSchedule />} />
        <Route path="/results" element={<SpectatorResults />} />
        <Route path="/news" element={<News />} />
        
        {/* Legacy/Admin pages */}
        <Route path="/admin/events" element={<PrivateRoute><EventsList /></PrivateRoute>} />
        <Route path="/admin/events/:id" element={<PrivateRoute><EventDetail /></PrivateRoute>} />
        <Route path="/admin/events/:id/register" element={<PrivateRoute><EventRegistration /></PrivateRoute>} />
        <Route path="/admin/matches" element={<PrivateRoute><Matches /></PrivateRoute>} />
        <Route path="/admin/venues" element={<PrivateRoute><Venues /></PrivateRoute>} />

        {/* Auth pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/password-reset" element={<PasswordReset />} />

        {/* Protected pages */}
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
        <Route path="/my-tickets" element={<PrivateRoute><MyTickets /></PrivateRoute>} />
        <Route path="/my-registrations" element={<PrivateRoute><MyRegistrations /></PrivateRoute>} />
        <Route path="/events/:eventId/register" element={<PrivateRoute><RegistrationWizard /></PrivateRoute>} />

        {/* Admin pages */}
        <Route path="/admin" element={<PrivateRoute requiredRoles={["ADMIN"]}><AdminDashboard /></PrivateRoute>} />
        <Route path="/admin/users" element={<PrivateRoute requiredRoles={["ADMIN"]}><AdminUsers /></PrivateRoute>} />

        {/* Organizer pages */}
        <Route path="/events/create" element={<PrivateRoute requiredRoles={["ORGANIZER","ADMIN"]}><EventEditor /></PrivateRoute>} />
        <Route path="/events/:id/edit" element={<PrivateRoute requiredRoles={["ORGANIZER","ADMIN"]}><EventEditor /></PrivateRoute>} />
        <Route path="/create-event" element={<PrivateRoute requiredRoles={["ORGANIZER","ADMIN"]}><CreateEvent /></PrivateRoute>} />
        <Route path="/manage-events" element={<PrivateRoute requiredRoles={["ORGANIZER","ADMIN"]}><EventManagement /></PrivateRoute>} />
        <Route path="/events/:eventId/registrations" element={<PrivateRoute requiredRoles={["ORGANIZER","ADMIN"]}><RegistrationManagement /></PrivateRoute>} />
        <Route path="/fixtures" element={<PrivateRoute requiredRoles={["ORGANIZER","ADMIN"]}><Fixtures /></PrivateRoute>} />

        {/* Error pages */}
        <Route path="/500" element={<Error500 />} />
        
        {/* Catch all - 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
    </AppToaster>
    </ErrorBoundary>
  );
}

import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx";
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
import EventRegistration from "./pages/EventRegistration.jsx";
import RegistrationManagement from "./pages/RegistrationManagement.jsx";
import Fixtures from "./pages/Fixtures.jsx";
import Matches from "./pages/Matches.jsx";
import Results from "./pages/Results.jsx";
import News from "./pages/News.jsx";
import CreateEvent from "./pages/CreateEvent.jsx";
import EventManagement from "./pages/EventManagement.jsx";
import { ToastContainer } from "./components/NotificationSystem.jsx";
import MyTickets from "./pages/MyTickets.jsx";

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />

        {/* Public browsing */}
        <Route path="/events" element={<EventsList />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/events/:id/register" element={<EventRegistration />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/results" element={<Results />} />
        <Route path="/news" element={<News />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/my-tickets" element={<PrivateRoute><MyTickets /></PrivateRoute>} />

        {/* Admin */}
        <Route path="/admin" element={<PrivateRoute requiredRoles={["ADMIN"]}><AdminDashboard /></PrivateRoute>} />
        <Route path="/admin/users" element={<PrivateRoute requiredRoles={["ADMIN"]}><AdminUsers /></PrivateRoute>} />
        {/* Profile */}
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/password-reset" element={<PasswordReset />} />

        {/* Organizer */}
        <Route path="/create-event" element={<PrivateRoute requiredRoles={["ORGANIZER","ADMIN"]}><CreateEvent /></PrivateRoute>} />
        <Route path="/manage-events" element={<PrivateRoute requiredRoles={["ORGANIZER","ADMIN"]}><EventManagement /></PrivateRoute>} />
        <Route path="/events/:eventId/registrations" element={<PrivateRoute requiredRoles={["ORGANIZER","ADMIN"]}><RegistrationManagement /></PrivateRoute>} />
        <Route path="/fixtures" element={<PrivateRoute requiredRoles={["ORGANIZER","ADMIN"]}><Fixtures /></PrivateRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer />
      <footer className="site-footer">© {new Date().getFullYear()} Timely</footer>
    </>
  );
}

import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import Home from "./pages/Home.jsx";
import Events from "./pages/Events.jsx";
import EventDetail from "./pages/EventDetail.jsx";
import EventForm from "./pages/EventForm.jsx";
import Login from "./pages/Login.jsx";
import Matches from "./pages/Matches.jsx";
import Results from "./pages/Results.jsx";
import News from "./pages/News.jsx";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route
            path="/events/new"
            element={
              <ProtectedRoute>
                <EventForm mode="create" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/:id/edit"
            element={
              <ProtectedRoute>
                <EventForm mode="edit" />
              </ProtectedRoute>
            }
          />
          <Route path="/matches" element={<Matches />} />
          <Route path="/results" element={<Results />} />
          <Route path="/news" element={<News />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

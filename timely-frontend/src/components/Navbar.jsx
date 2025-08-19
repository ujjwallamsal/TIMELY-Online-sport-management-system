import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../state/AuthContext.jsx";

export default function Navbar() {
  const active = ({ isActive }) =>
    "px-1 " + (isActive ? "underline underline-offset-4 decoration-2" : "");
  const { authed, check, openLogin, doLogout } = useAuth();

  return (
    <header className="border-b">
      <div className="container mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link to="/" className="font-bold">Timely</Link>
        <nav className="flex items-center gap-4">
          <NavLink to="/" className={active} end>Home</NavLink>
          <NavLink to="/events" className={active}>Events</NavLink>
          <NavLink to="/matches" className={active}>Matches</NavLink>
          <NavLink to="/results" className={active}>Results</NavLink>
          <NavLink to="/news" className={active}>News</NavLink>

          {authed ? (
            <>
              <NavLink to="/events/new" className={active}>New Event</NavLink>
              <button className="border rounded px-2 py-1" onClick={doLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <button className="border rounded px-2 py-1" onClick={openLogin}>
                Login
              </button>
              <button
                className="text-xs opacity-70 underline"
                onClick={check}
                title="Refresh login status"
              >
                I’ve logged in
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

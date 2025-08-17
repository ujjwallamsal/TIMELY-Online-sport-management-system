import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext.jsx";

export default function Login() {
  const { authed, openLogin, check } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  async function afterCheck() {
    const ok = await check();
    if (ok) {
      const to = (loc.state && loc.state.from && loc.state.from.pathname) || "/events";
      nav(to, { replace: true });
    }
  }

  return (
    <div className="container mx-auto max-w-md px-4 py-12">
      <h1 className="text-3xl font-bold mb-4">Login</h1>
      <p className="mb-4">This opens the Django login in a new tab. After you sign in there, come back and press “I’m logged in”.</p>
      <div className="flex gap-2">
        <button className="border rounded px-3 py-2" onClick={openLogin}>Open backend login</button>
        <button className="border rounded px-3 py-2" onClick={afterCheck}>I’m logged in</button>
      </div>
      {authed && <div className="mt-4 text-green-700">You’re signed in. You can close this page.</div>}
    </div>
  );
}

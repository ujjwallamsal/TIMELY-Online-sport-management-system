function getCookie(name) {
    const m = document.cookie.match(new RegExp("(^|; )" + name + "=([^;]*)"));
    return m ? decodeURIComponent(m[2]) : "";
  }
  
  function join(base, path) {
    const b = base.replace(/\/+$/, "");
    const p = path.startsWith("/") ? path : `/${path}`;
    return `${b}${p}`;
  }
  
  const BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api").replace(/\/+$/, "");
  const PATHS = {
    login: import.meta.env.VITE_LOGIN_PATH || "/auth/login/",
    logout: import.meta.env.VITE_LOGOUT_PATH || "/auth/logout/",
    ping: import.meta.env.VITE_ME_PATH || "/events/",
  };
  
  export const api = {
    loginUrl: (next = "/api/") => {
      const url = new URL(join(BASE, PATHS.login));
      if (next) url.searchParams.set("next", next);
      return url.toString();
    },
  
    async ensureCsrf() {
      // If no csrftoken yet, GET the login form to receive one (Django sets it on GET)
      if (!getCookie("csrftoken")) {
        await fetch(join(BASE, PATHS.login), { method: "GET", credentials: "include" });
      }
    },
  
    async logout() {
      await api.ensureCsrf();
      const res = await fetch(join(BASE, PATHS.logout), {
        method: "POST",
        credentials: "include",
        headers: {
          "Accept": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
      });
      if (res.status < 200 || res.status >= 300) {
        throw new Error(`Logout failed: ${res.status} ${res.statusText}`);
      }
      return true;
    },
  
    async pingAuth() {
      try {
        const res = await fetch(join(BASE, PATHS.ping), {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        if (res.status >= 200 && res.status < 300) return { ok: true };
        if (res.status === 401 || res.status === 403) return { ok: false };
        return { ok: false, status: res.status };
      } catch (e) {
        return { ok: false, error: String(e) };
      }
    },
  };
  export default api;
  
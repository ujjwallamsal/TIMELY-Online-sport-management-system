import React, { createContext, useContext, useMemo, useState } from "react";

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const api = useMemo(() => ({
    show(msg, type = "info", ms = 3500) {
      const id = Math.random().toString(36).slice(2);
      setToasts((t) => [...t, { id, msg, type }]);
      if (ms) setTimeout(() => setToasts((t) => t.filter(x => x.id !== id)), ms);
    },
    error(msg, ms = 5000) { this.show(msg, "error", ms); },
    success(msg, ms = 2500) { this.show(msg, "success", ms); },
  }), []);

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-0 flex items-end justify-end p-4">
        <div className="space-y-2 w-full max-w-sm">
          {toasts.map(t => (
            <div key={t.id}
                 className={"pointer-events-auto rounded border px-4 py-3 shadow bg-white " +
                   (t.type === "error" ? "border-red-500" :
                    t.type === "success" ? "border-green-500" : "border-gray-300")}>
              <div className="text-sm">{t.msg}</div>
            </div>
          ))}
        </div>
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

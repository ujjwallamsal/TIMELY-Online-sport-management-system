import React, { createContext, useContext, useMemo, useState, useCallback } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const remove = useCallback(id => setToasts(ts => ts.filter(t => t.id !== id)), []);
  const add = useCallback(({ title, description, variant = "default", type, message, duration = 4000 }) => {
    const id = Math.random().toString(36).slice(2);
    // Support both old format (type, message) and new format (variant, description)
    const finalVariant = variant || (type === 'error' ? 'error' : type === 'success' ? 'success' : 'default');
    const finalDescription = description || message || '';
    const toast = { id, title, description: finalDescription, variant: finalVariant };
    setToasts(ts => [...ts, toast]);
    if (duration) setTimeout(() => remove(id), duration);
    return id;
  }, [remove]);
  
  // Add push function for backward compatibility
  const push = useCallback((toastData) => add(toastData), [add]);
  
  const value = useMemo(() => ({ add, remove, push }), [add, remove, push]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2">
        {toasts.map(t => (
          <div key={t.id} role="status" className={`rounded-md border px-3 py-2 shadow ${t.variant === "error" ? "border-red-300 bg-red-50 text-red-800" : t.variant === "success" ? "border-green-300 bg-green-50 text-green-800" : "border-gray-200 bg-white text-gray-900"}`}>
            {t.title && <div className="text-sm font-medium">{t.title}</div>}
            {t.description && <div className="text-xs text-gray-600">{t.description}</div>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export default function Toast() {
  return null;
}

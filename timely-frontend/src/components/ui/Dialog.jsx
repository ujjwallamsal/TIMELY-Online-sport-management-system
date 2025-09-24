import React, { useEffect } from "react";

export default function Dialog({ open, onOpenChange, title, description, children, footer, className = "" }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onOpenChange?.(false);
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={() => onOpenChange?.(false)} />
      <div role="dialog" aria-modal="true" aria-labelledby="dialog-title" aria-describedby="dialog-description" className={`relative z-10 w-full max-w-lg rounded-lg border border-gray-200 bg-white shadow-lg ${className}`}>
        <div className="border-b border-gray-200 px-4 py-3">
          {title && (
            <h2 id="dialog-title" className="text-sm font-semibold text-gray-900">
              {title}
            </h2>
          )}
          {description && (
            <p id="dialog-description" className="mt-1 text-xs text-gray-500">
              {description}
            </p>
          )}
        </div>
        <div className="px-4 py-4 text-sm text-gray-900">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-gray-200 px-4 py-3">{footer}</div>}
      </div>
    </div>
  );
}

// Provide named export for compatibility
export { Dialog };

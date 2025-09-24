import React, { useState } from "react";

export default function Tabs({ tabs = [], value, onChange, className = "" }) {
  const [internal, setInternal] = useState(value ?? tabs[0]?.value);
  const active = value ?? internal;
  function setActive(v) {
    setInternal(v);
    onChange?.(v);
  }
  return (
    <div className={className}>
      <div role="tablist" className="flex border-b border-gray-200">
        {tabs.map(t => (
          <button
            key={t.value}
            role="tab"
            aria-selected={active === t.value}
            className={`-mb-px px-4 py-2 text-sm ${active === t.value ? "border-b-2 border-blue-600 text-blue-700" : "text-gray-600 hover:text-gray-900"}`}
            onClick={() => setActive(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="py-3">
        {tabs.find(t => t.value === active)?.content}
      </div>
    </div>
  );
}

// Also provide a named export for compatibility with existing imports
export { Tabs };

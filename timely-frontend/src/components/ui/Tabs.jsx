import React from 'react';

export function Tabs({ tabs = [], active, onChange }) {
  return (
    <div className="border-b border-gray-200 mb-4 sticky top-0 bg-white z-10">
      <nav className="-mb-px flex gap-4 text-sm">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onChange?.(tab.key)}
            className={`px-3 py-3 ${active === tab.key ? 'border-b-2 border-blue-600 text-blue-700' : 'text-gray-600'}`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}



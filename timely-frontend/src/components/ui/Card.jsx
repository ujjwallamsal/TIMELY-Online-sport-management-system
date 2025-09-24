import React from "react";

export default function Card({ title, subtitle, actions, children, className = "" }) {
  return (
    <div className={`rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}>
      {(title || actions || subtitle) && (
        <div className="flex items-start justify-between gap-3 border-b border-gray-200 px-4 py-3">
          <div>
            {title && <h3 className="text-sm font-semibold text-gray-900">{title}</h3>}
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className="px-4 py-4 text-sm text-gray-900">{children}</div>
    </div>
  );
}
export function Card({ children, className = '' }) {
  return <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>{children}</div>;
}

export function CardHeader({ children, className = '' }) {
  return <div className={`px-4 py-3 border-b border-gray-200 ${className}`}>{children}</div>;
}

export function CardContent({ children, className = '' }) {
  return <div className={`px-4 py-3 ${className}`}>{children}</div>;
}



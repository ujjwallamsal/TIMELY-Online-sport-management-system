import React from "react";
import Button from "./Button";

export default function EmptyState({ icon, title = "No data", description = "There’s nothing to show here yet.", action, onAction, actionVariant = "primary", className = "" }) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white px-6 py-10 text-center ${className}`}>
      {icon && <div className="mb-3 text-gray-400" aria-hidden>{icon}</div>}
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
      {action && (
        <div className="mt-4">
          <Button onClick={onAction} variant={actionVariant}>
            {action}
          </Button>
        </div>
      )}
    </div>
  );
}



import React from "react";

export default function Checkbox({ id, label, error, helper, required, disabled, className = "", inputClassName = "", ...props }) {
  const describedBy = [];
  if (helper) describedBy.push(`${id}-helper`);
  if (error) describedBy.push(`${id}-error`);
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-start gap-2">
        <input
          id={id}
          type="checkbox"
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={describedBy.join(" ") || undefined}
          required={required}
          disabled={disabled}
          className={`mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600 disabled:bg-gray-100 ${inputClassName}`}
          {...props}
        />
        {label && (
          <label htmlFor={id} className="text-sm text-gray-700">
            {label}
            {required ? <span className="text-red-600"> *</span> : null}
          </label>
        )}
      </div>
      {helper && (
        <p id={`${id}-helper`} className="mt-1 text-xs text-gray-500">
          {helper}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
export default function Checkbox({ className = '', label, ...props }) {
  return (
    <label className={`inline-flex items-center space-x-2 text-sm ${className}`}>
      <input type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" {...props} />
      {label ? <span>{label}</span> : null}
    </label>
  );
}



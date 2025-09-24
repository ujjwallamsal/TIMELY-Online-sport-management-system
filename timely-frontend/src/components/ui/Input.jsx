import React from "react";

export default function Input({
  id,
  label,
  type = "text",
  error,
  helper,
  required,
  disabled,
  className = "",
  inputClassName = "",
  ...props
}) {
  const describedBy = [];
  if (helper) describedBy.push(`${id}-helper`);
  if (error) describedBy.push(`${id}-error`);
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700">
          {label}
          {required ? <span className="text-red-600"> *</span> : null}
        </label>
      )}
      <input
        id={id}
        type={type}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy.join(" ") || undefined}
        required={required}
        disabled={disabled}
        className={`w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 shadow-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 disabled:bg-gray-100 ${inputClassName}`}
        {...props}
      />
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
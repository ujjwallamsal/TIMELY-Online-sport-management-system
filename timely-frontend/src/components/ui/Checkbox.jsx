// src/components/ui/Checkbox.jsx
import React from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';

export default function Checkbox({
  checked = false,
  onChange,
  disabled = false,
  indeterminate = false,
  className = "",
  ...props
}) {
  const handleChange = (e) => {
    if (!disabled) {
      onChange?.(e.target.checked);
    }
  };

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        className="sr-only"
        {...props}
      />
      <div
        className={`w-4 h-4 border-2 rounded flex items-center justify-center cursor-pointer transition-colors duration-150 ${
          checked || indeterminate
            ? 'bg-indigo-600 border-indigo-600 text-white'
            : 'border-gray-300 hover:border-gray-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={handleChange}
      >
        {(checked || indeterminate) && (
          <CheckIcon className="w-3 h-3" />
        )}
      </div>
    </div>
  );
}

import React, { forwardRef } from 'react';

const Input = forwardRef(({ 
  name,
  label,
  error,
  helperText,
  className = '',
  as: Component = 'input',
  children,
  value,
  onChange,
  required = false,
  ...props 
}, ref) => {
  const baseClasses = 'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm';
  const errorClasses = error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : '';
  
  // Handle NaN values for number inputs
  const safeValue = (typeof value === 'number' && isNaN(value)) ? '' : value;
  
  const inputProps = {
    ...props,
    name,
    ...(ref ? { ref } : {}),
    ...(value !== undefined ? { value: safeValue } : {}),
    ...(onChange ? { onChange } : {}),
  };
  
  return (
    <div className={className}>
      {label && (
        <label 
          htmlFor={name}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <Component 
        className={`${baseClasses} ${errorClasses}`}
        {...inputProps}
      >
        {children}
      </Component>
      {error && (
        <p className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
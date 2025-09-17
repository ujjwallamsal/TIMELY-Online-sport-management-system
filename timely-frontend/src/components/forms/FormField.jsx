// src/components/forms/FormField.jsx
import React from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

export default function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  required = false,
  disabled = false,
  error,
  helpText,
  className = "",
  inputClassName = "",
  labelClassName = "",
  ...props
}) {
  const inputId = `field-${name}`;
  const hasError = !!error;

  const baseInputClasses = `
    block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 
    focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 
    sm:text-sm transition-colors duration-150
  `;

  const inputClasses = `
    ${baseInputClasses}
    ${hasError 
      ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500' 
      : 'border-gray-300'
    }
    ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}
    ${inputClassName}
  `;

  const labelClasses = `
    block text-sm font-medium text-gray-700 mb-1
    ${required ? 'after:content-["*"] after:ml-0.5 after:text-red-500' : ''}
    ${labelClassName}
  `;

  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <textarea
            id={inputId}
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            rows={4}
            className={inputClasses}
            {...props}
          />
        );
      
      case 'select':
        return (
          <select
            id={inputId}
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            required={required}
            disabled={disabled}
            className={inputClasses}
            {...props}
          >
            {props.children}
          </select>
        );
      
      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              id={inputId}
              name={name}
              type="checkbox"
              checked={value}
              onChange={onChange}
              onBlur={onBlur}
              disabled={disabled}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              {...props}
            />
            <label htmlFor={inputId} className="ml-2 block text-sm text-gray-900">
              {label}
            </label>
          </div>
        );
      
      case 'radio':
        return (
          <div className="space-y-2">
            {props.options?.map((option) => (
              <div key={option.value} className="flex items-center">
                <input
                  id={`${inputId}-${option.value}`}
                  name={name}
                  type="radio"
                  value={option.value}
                  checked={value === option.value}
                  onChange={onChange}
                  onBlur={onBlur}
                  disabled={disabled}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <label htmlFor={`${inputId}-${option.value}`} className="ml-2 block text-sm text-gray-900">
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        );
      
      default:
        return (
          <input
            id={inputId}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            className={inputClasses}
            {...props}
          />
        );
    }
  };

  if (type === 'checkbox' || type === 'radio') {
    return (
      <div className={`space-y-1 ${className}`}>
        {renderInput()}
        {hasError && (
          <div className="flex items-center text-sm text-red-600">
            <ExclamationCircleIcon className="h-4 w-4 mr-1" />
            {error}
          </div>
        )}
        {helpText && !hasError && (
          <p className="text-sm text-gray-500">{helpText}</p>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-1 ${className}`}>
      <label htmlFor={inputId} className={labelClasses}>
        {label}
      </label>
      
      <div className="relative">
        {renderInput()}
        {hasError && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
          </div>
        )}
      </div>
      
      {hasError && (
        <div className="flex items-center text-sm text-red-600">
          <ExclamationCircleIcon className="h-4 w-4 mr-1" />
          {error}
        </div>
      )}
      
      {helpText && !hasError && (
        <p className="text-sm text-gray-500">{helpText}</p>
      )}
    </div>
  );
}

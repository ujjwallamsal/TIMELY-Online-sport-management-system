// src/components/ui/Select.jsx
import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';

const Select = forwardRef(({
  name,
  options = [],
  value,
  onChange,
  placeholder = "Select an option",
  disabled = false,
  error = false,
  className = "",
  size = "md",
  searchable = false,
  multiple = false,
  label,
  required = false,
  helperText,
  ...props
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const selectRef = useRef(null);
  const searchRef = useRef(null);

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  };

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (option) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.includes(option.value)
        ? currentValues.filter(v => v !== option.value)
        : [...currentValues, option.value];
      onChange?.(newValues);
    } else {
      onChange?.(option.value);
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        break;
    }
  };

  const getDisplayValue = () => {
    if (multiple) {
      const selectedOptions = options.filter(option => 
        Array.isArray(value) && value.includes(option.value)
      );
      return selectedOptions.length > 0 
        ? `${selectedOptions.length} selected`
        : placeholder;
    }
    
    const selectedOption = options.find(option => option.value === value);
    return selectedOption ? selectedOption.label : placeholder;
  };

  const isSelected = (optionValue) => {
    if (multiple) {
      return Array.isArray(value) && value.includes(optionValue);
    }
    return value === optionValue;
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchable && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen, searchable]);

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [searchTerm]);

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
      <div className={`relative`} ref={selectRef}>
        <button
          type="button"
          className={`
            w-full ${sizes[size]} text-left border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-gray-400'}
            ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
          `}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          {...props}
        >
        <span className={`block truncate ${value ? 'text-gray-900' : 'text-gray-500'}`}>
          {getDisplayValue()}
        </span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDownIcon 
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
          {searchable && (
            <div className="p-2 border-b border-gray-200">
              <input
                ref={searchRef}
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}
          
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                No options found
              </div>
            ) : (
              filteredOptions.map((option, index) => (
                <button
                  key={option.value}
                  type="button"
                  className={`
                    w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:outline-none focus:bg-gray-100
                    ${isSelected(option.value) ? 'bg-blue-50 text-blue-900' : 'text-gray-900'}
                    ${index === highlightedIndex ? 'bg-gray-100' : ''}
                  `}
                  onClick={() => handleSelect(option)}
                >
                  <div className="flex items-center justify-between">
                    <span className="block truncate">{option.label}</span>
                    {isSelected(option.value) && (
                      <CheckIcon className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
      </div>
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

Select.displayName = 'Select';

export default Select;
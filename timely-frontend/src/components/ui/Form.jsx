import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Common validation schemas
export const commonSchemas = {
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  required: z.string().min(1, 'This field is required'),
  optional: z.string().optional(),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number'),
  url: z.string().url('Please enter a valid URL'),
  number: z.coerce.number().min(0, 'Must be a positive number'),
  positiveNumber: z.coerce.number().positive('Must be a positive number'),
  date: z.string().min(1, 'Please select a date'),
  time: z.string().min(1, 'Please select a time'),
  datetime: z.string().min(1, 'Please select a date and time'),
};

// Form wrapper component
export const Form = ({
  children,
  schema,
  defaultValues = {},
  onSubmit,
  className = '',
  ...props
}) => {
  const methods = useForm({
    resolver: schema ? zodResolver(schema) : undefined,
    defaultValues,
    mode: 'onChange',
  });

  const handleSubmit = (data) => {
    if (onSubmit) {
      onSubmit(data, methods);
    }
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(handleSubmit)}
        className={`space-y-6 ${className}`}
        {...props}
      >
        {children}
      </form>
    </FormProvider>
  );
};

// Form field wrapper
export const FormField = ({
  name,
  label,
  children,
  required = false,
  className = '',
  ...props
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div {...props}>
        {children}
      </div>
    </div>
  );
};

// Form error display
export const FormError = ({ name, className = '' }) => {
  const { formState: { errors } } = useForm();
  const error = errors[name];
  
  if (!error) return null;
  
  return (
    <p className={`text-sm text-red-600 ${className}`}>
      {error.message}
    </p>
  );
};

// Form success message
export const FormSuccess = ({ message, className = '' }) => {
  if (!message) return null;
  
  return (
    <div className={`p-4 bg-green-50 border border-green-200 rounded-md ${className}`}>
      <p className="text-sm text-green-800">{message}</p>
    </div>
  );
};

// Form submit button
export const FormSubmit = ({
  children,
  loading = false,
  disabled = false,
  className = '',
  ...props
}) => {
  const { formState: { isSubmitting } } = useForm();
  
  return (
    <button
      type="submit"
      disabled={disabled || isSubmitting || loading}
      className={`
        inline-flex items-center justify-center px-4 py-2 border border-transparent
        text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200
        ${className}
      `}
      {...props}
    >
      {loading || isSubmitting ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {children || 'Submitting...'}
        </>
      ) : (
        children || 'Submit'
      )}
    </button>
  );
};

// Form reset button
export const FormReset = ({
  children,
  className = '',
  ...props
}) => {
  const { reset } = useForm();
  
  return (
    <button
      type="button"
      onClick={() => reset()}
      className={`
        inline-flex items-center justify-center px-4 py-2 border border-gray-300
        text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        transition-colors duration-200 ${className}
      `}
      {...props}
    >
      {children || 'Reset'}
    </button>
  );
};

export default Form;

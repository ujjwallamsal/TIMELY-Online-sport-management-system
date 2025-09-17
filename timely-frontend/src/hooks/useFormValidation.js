// src/hooks/useFormValidation.js
import { useState, useCallback } from 'react';
import * as yup from 'yup';

export default function useFormValidation(schema, initialValues = {}) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((name, value) => {
    setValues(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  }, [errors]);

  const handleBlur = useCallback((name) => {
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));

    // Validate field on blur
    if (schema.fields[name]) {
      try {
        schema.validateSyncAt(name, values);
        setErrors(prev => ({
          ...prev,
          [name]: undefined
        }));
      } catch (error) {
        setErrors(prev => ({
          ...prev,
          [name]: error.message
        }));
      }
    }
  }, [schema, values]);

  const validateField = useCallback(async (name) => {
    if (!schema.fields[name]) return true;

    try {
      await schema.validateAt(name, values);
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
      return true;
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        [name]: error.message
      }));
      return false;
    }
  }, [schema, values]);

  const validateForm = useCallback(async () => {
    try {
      await schema.validate(values, { abortEarly: false });
      setErrors({});
      return true;
    } catch (error) {
      const newErrors = {};
      error.inner.forEach(err => {
        newErrors[err.path] = err.message;
      });
      setErrors(newErrors);
      return false;
    }
  }, [schema, values]);

  const handleSubmit = useCallback(async (onSubmit) => {
    setIsSubmitting(true);
    
    try {
      const isValid = await validateForm();
      if (isValid) {
        await onSubmit(values);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, values]);

  const resetForm = useCallback((newValues = initialValues) => {
    setValues(newValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  const setFieldValue = useCallback((name, value) => {
    setValues(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const setFieldError = useCallback((name, error) => {
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  }, []);

  const getFieldProps = useCallback((name) => ({
    name,
    value: values[name] || '',
    onChange: (e) => {
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      handleChange(name, value);
    },
    onBlur: () => handleBlur(name),
    error: touched[name] ? errors[name] : undefined,
  }), [values, errors, touched, handleChange, handleBlur]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    validateField,
    validateForm,
    handleSubmit,
    resetForm,
    setFieldValue,
    setFieldError,
    getFieldProps,
    isValid: Object.keys(errors).length === 0,
    isDirty: Object.keys(touched).length > 0,
  };
}

// Common validation schemas
export const commonSchemas = {
  email: yup.string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  
  password: yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .required('Password is required'),
  
  confirmPassword: (passwordField = 'password') => yup.string()
    .oneOf([yup.ref(passwordField)], 'Passwords must match')
    .required('Please confirm your password'),
  
  required: (fieldName) => yup.string().required(`${fieldName} is required`),
  
  phone: yup.string()
    .matches(/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number'),
  
  url: yup.string()
    .url('Please enter a valid URL'),
  
  date: yup.date()
    .typeError('Please enter a valid date')
    .required('Date is required'),
  
  dateRange: yup.object({
    start: yup.date()
      .typeError('Please enter a valid start date')
      .required('Start date is required'),
    end: yup.date()
      .typeError('Please enter a valid end date')
      .required('End date is required')
      .min(yup.ref('start'), 'End date must be after start date'),
  }),
  
  positiveNumber: yup.number()
    .positive('Must be a positive number')
    .required('Number is required'),
  
  currency: yup.number()
    .positive('Amount must be positive')
    .required('Amount is required'),
};

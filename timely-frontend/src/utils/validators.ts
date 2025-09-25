export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;

export const validateEmail = (email: string): string | null => {
  if (!email) return 'Email is required';
  if (!emailRegex.test(email)) return 'Please enter a valid email address';
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters long';
  if (!/(?=.*[a-z])/.test(password)) return 'Password must contain at least one lowercase letter';
  if (!/(?=.*[A-Z])/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/(?=.*\d)/.test(password)) return 'Password must contain at least one number';
  return null;
};

export const validateConfirmPassword = (password: string, confirmPassword: string): string | null => {
  if (!confirmPassword) return 'Please confirm your password';
  if (password !== confirmPassword) return 'Passwords do not match';
  return null;
};

export const validateRequired = (value: string, fieldName: string): string | null => {
  if (!value || value.trim() === '') return `${fieldName} is required`;
  return null;
};

export const validateMinLength = (value: string, minLength: number, fieldName: string): string | null => {
  if (value.length < minLength) return `${fieldName} must be at least ${minLength} characters long`;
  return null;
};

export const validateMaxLength = (value: string, maxLength: number, fieldName: string): string | null => {
  if (value.length > maxLength) return `${fieldName} must be no more than ${maxLength} characters long`;
  return null;
};

export const validatePhone = (phone: string): string | null => {
  if (!phone) return null; // Phone is optional
  if (!phoneRegex.test(phone.replace(/\s/g, ''))) return 'Please enter a valid phone number';
  return null;
};

export const validateUrl = (url: string): string | null => {
  if (!url) return null; // URL is optional
  try {
    new URL(url);
    return null;
  } catch {
    return 'Please enter a valid URL';
  }
};

export const validateDate = (date: string): string | null => {
  if (!date) return 'Date is required';
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return 'Please enter a valid date';
  return null;
};

export const validateFutureDate = (date: string): string | null => {
  const dateError = validateDate(date);
  if (dateError) return dateError;
  
  const dateObj = new Date(date);
  const now = new Date();
  if (dateObj <= now) return 'Date must be in the future';
  return null;
};

export const validatePositiveNumber = (value: string, fieldName: string): string | null => {
  const num = parseFloat(value);
  if (isNaN(num)) return `${fieldName} must be a valid number`;
  if (num < 0) return `${fieldName} must be a positive number`;
  return null;
};

export const validateInteger = (value: string, fieldName: string): string | null => {
  const num = parseInt(value, 10);
  if (isNaN(num) || !Number.isInteger(parseFloat(value))) {
    return `${fieldName} must be a whole number`;
  }
  return null;
};

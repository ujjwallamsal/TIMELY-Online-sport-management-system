/**
 * Date utilities for safe ISO parsing and timezone formatting
 */

/**
 * Safely parse server ISO date string
 * @param dateString - ISO date string from server
 * @returns Date object or null if invalid
 */
export const parseServerDate = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
};

/**
 * Format date with timezone support
 * @param date - Date object or ISO string
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export const formatDate = (
  date: Date | string | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
): string => {
  const dateObj = typeof date === 'string' ? parseServerDate(date) : date;
  if (!dateObj) return '—';
  
  return dateObj.toLocaleDateString('en-US', options);
};

/**
 * Format datetime with timezone support
 * @param date - Date object or ISO string
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted datetime string
 */
export const formatDateTime = (
  date: Date | string | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }
): string => {
  const dateObj = typeof date === 'string' ? parseServerDate(date) : date;
  if (!dateObj) return '—';
  
  return dateObj.toLocaleString('en-US', options);
};

/**
 * Format time only
 * @param date - Date object or ISO string
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted time string
 */
export const formatTime = (
  date: Date | string | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
  }
): string => {
  const dateObj = typeof date === 'string' ? parseServerDate(date) : date;
  if (!dateObj) return '—';
  
  return dateObj.toLocaleTimeString('en-US', options);
};

/**
 * Determine if an event has ended
 * @param startAt - Event start date
 * @param endAt - Event end date (optional)
 * @param status - Event status
 * @returns true if event has ended
 */
export const isEventEnded = (
  startAt: string | null | undefined,
  endAt: string | null | undefined,
  status: string
): boolean => {
  if (status === 'COMPLETED') return true;
  
  const now = new Date();
  const startDate = parseServerDate(startAt);
  const endDate = parseServerDate(endAt);
  
  if (!startDate) return false;
  
  // If no end_at, consider ended if now > start_at and status is COMPLETED
  if (!endDate) {
    return now > startDate && status === 'COMPLETED';
  }
  
  // If end_at exists, consider ended if now > end_at
  return now > endDate;
};

/**
 * Get event status based on dates and status
 * @param startAt - Event start date
 * @param endAt - Event end date (optional)
 * @param status - Event status
 * @returns Event status chip
 */
export const getEventStatusChip = (
  startAt: string | null | undefined,
  endAt: string | null | undefined,
  status: string
): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } => {
  if (status === 'CANCELLED') {
    return { label: 'CANCELLED', variant: 'destructive' };
  }
  
  if (isEventEnded(startAt, endAt, status)) {
    return { label: 'ENDED', variant: 'secondary' };
  }
  
  const now = new Date();
  const startDate = parseServerDate(startAt);
  
  if (!startDate) {
    return { label: 'UNKNOWN', variant: 'outline' };
  }
  
  // Check if event is live (started but not ended)
  const endDate = parseServerDate(endAt);
  const isLive = now >= startDate && (!endDate || now <= endDate);
  
  if (isLive) {
    return { label: 'LIVE', variant: 'destructive' };
  }
  
  return { label: 'UPCOMING', variant: 'default' };
};

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 * @param date - Date object or ISO string
 * @returns Relative time string
 */
export const formatRelativeTime = (date: Date | string | null | undefined): string => {
  const dateObj = typeof date === 'string' ? parseServerDate(date) : date;
  if (!dateObj) return '—';
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  if (Math.abs(diffInSeconds) < 60) {
    return 'Just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (Math.abs(diffInMinutes) < 60) {
    const prefix = diffInMinutes < 0 ? 'in ' : '';
    const suffix = diffInMinutes < 0 ? '' : ' ago';
    return `${prefix}${Math.abs(diffInMinutes)} minute${Math.abs(diffInMinutes) === 1 ? '' : 's'}${suffix}`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (Math.abs(diffInHours) < 24) {
    const prefix = diffInHours < 0 ? 'in ' : '';
    const suffix = diffInHours < 0 ? '' : ' ago';
    return `${prefix}${Math.abs(diffInHours)} hour${Math.abs(diffInHours) === 1 ? '' : 's'}${suffix}`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (Math.abs(diffInDays) < 7) {
    const prefix = diffInDays < 0 ? 'in ' : '';
    const suffix = diffInDays < 0 ? '' : ' ago';
    return `${prefix}${Math.abs(diffInDays)} day${Math.abs(diffInDays) === 1 ? '' : 's'}${suffix}`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (Math.abs(diffInWeeks) < 4) {
    const prefix = diffInWeeks < 0 ? 'in ' : '';
    const suffix = diffInWeeks < 0 ? '' : ' ago';
    return `${prefix}${Math.abs(diffInWeeks)} week${Math.abs(diffInWeeks) === 1 ? '' : 's'}${suffix}`;
  }

  return formatDate(dateObj);
};

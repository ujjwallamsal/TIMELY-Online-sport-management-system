/**
 * Date utility functions to handle server date formats and avoid "Invalid Date" issues
 */

/**
 * Parse a server date string and return a valid Date object
 * Handles various date formats from the backend
 */
export const parseServerDate = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string:', dateString);
      return null;
    }
    return date;
  } catch (error) {
    console.warn('Error parsing date:', dateString, error);
    return null;
  }
};

/**
 * Format a date for display with timezone awareness
 */
export const formatEventDate = (dateString: string | null | undefined): string => {
  const date = parseServerDate(dateString);
  if (!date) return 'Date TBD';
  
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Format time ago (e.g., "2 minutes ago", "3 hours ago")
 */
export const formatTimeAgo = (dateString: string | null | undefined): string => {
  const date = parseServerDate(dateString);
  if (!date) return '';
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffSec < 60) {
    return 'just now';
  } else if (diffMin < 60) {
    return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffHour < 24) {
    return `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffDay < 7) {
    return `${diffDay} ${diffDay === 1 ? 'day' : 'days'} ago`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
};

/**
 * Format a date for display without time
 */
export const formatDate = (dateString: string | null | undefined): string => {
  const date = parseServerDate(dateString);
  if (!date) return 'Date TBD';
  
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric'
  });
};

/**
 * Format a date for display with time only
 */
export const formatTime = (dateString: string | null | undefined): string => {
  const date = parseServerDate(dateString);
  if (!date) return 'Time TBD';
  
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Check if a date is in the future
 */
export const isFutureDate = (dateString: string | null | undefined): boolean => {
  const date = parseServerDate(dateString);
  if (!date) return false;
  
  return date > new Date();
};

/**
 * Check if a date is in the past
 */
export const isPastDate = (dateString: string | null | undefined): boolean => {
  const date = parseServerDate(dateString);
  if (!date) return false;
  
  return date < new Date();
};

/**
 * Get relative time string (e.g., "2 days ago", "in 3 hours")
 */
export const getRelativeTime = (dateString: string | null | undefined): string => {
  const date = parseServerDate(dateString);
  if (!date) return 'Unknown time';
  
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  if (diffDays > 0) {
    return `in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
  } else if (diffDays < 0) {
    return `${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''} ago`;
  } else if (diffHours > 0) {
    return `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
  } else if (diffHours < 0) {
    return `${Math.abs(diffHours)} hour${Math.abs(diffHours) > 1 ? 's' : ''} ago`;
  } else if (diffMinutes > 0) {
    return `in ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
  } else if (diffMinutes < 0) {
    return `${Math.abs(diffMinutes)} minute${Math.abs(diffMinutes) > 1 ? 's' : ''} ago`;
  } else {
    return 'now';
  }
};

/**
 * Format price from cents to dollars
 */
export const formatPrice = (cents: number | null | undefined): string => {
  if (!cents || cents === 0) return 'Free';
  return `$${(cents / 100).toFixed(2)}`;
};

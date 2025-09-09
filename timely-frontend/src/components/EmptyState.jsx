import React from 'react';

/**
 * EmptyState component for when no data is available
 * Provides consistent empty states across the app with proper accessibility
 */
const EmptyState = ({
  icon,
  title,
  description,
  action,
  variant = 'default',
  className = '',
  ...props
}) => {
  const variants = {
    default: 'text-gray-500',
    primary: 'text-blue-500',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    error: 'text-red-500',
  };

  const iconVariants = {
    default: (
      <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
      </svg>
    ),
    events: (
      <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    users: (
      <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
      </svg>
    ),
    tickets: (
      <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
      </svg>
    ),
    notifications: (
      <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-5 5v-5zM4.828 7l2.586 2.586a2 2 0 002.828 0L12 7H4.828zM4 12h.01M8 12h.01M12 12h.01M16 12h.01M20 12h.01" />
      </svg>
    ),
    search: (
      <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    error: (
      <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    ),
  };

  return (
    <div 
      className={`text-center py-12 px-4 ${className}`}
      role="status"
      aria-live="polite"
      {...props}
    >
      <div className={`${variants[variant]} mb-6`}>
        {icon || iconVariants.default}
      </div>
      
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {title || 'No data available'}
      </h3>
      
      {description && (
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          {description}
        </p>
      )}
      
      {action && (
        <div className="flex justify-center">
          {action}
        </div>
      )}
    </div>
  );
};

/**
 * Predefined empty states for common scenarios
 */
export const EmptyEvents = ({ onRefresh, className = '' }) => (
  <EmptyState
    variant="events"
    title="No events found"
    description="There are no events available at the moment. Check back later or create a new event."
    action={
      onRefresh && (
        <button
          onClick={onRefresh}
          className="btn btn-primary"
          aria-label="Refresh events"
        >
          Refresh Events
        </button>
      )
    }
    className={className}
  />
);

export const EmptySearch = ({ onClearFilters, className = '' }) => (
  <EmptyState
    variant="search"
    title="No results found"
    description="Try adjusting your search terms or filters to find what you're looking for."
    action={
      onClearFilters && (
        <button
          onClick={onClearFilters}
          className="btn btn-secondary"
          aria-label="Clear all filters"
        >
          Clear Filters
        </button>
      )
    }
    className={className}
  />
);

export const EmptyTickets = ({ onBrowseEvents, className = '' }) => (
  <EmptyState
    variant="tickets"
    title="No tickets yet"
    description="You haven't purchased any tickets yet. Browse our events to find something you'd like to attend."
    action={
      onBrowseEvents && (
        <button
          onClick={onBrowseEvents}
          className="btn btn-primary"
          aria-label="Browse events"
        >
          Browse Events
        </button>
      )
    }
    className={className}
  />
);

export const EmptyNotifications = ({ className = '' }) => (
  <EmptyState
    variant="notifications"
    title="All caught up!"
    description="You don't have any notifications at the moment. We'll let you know when something important happens."
    className={className}
  />
);

export const EmptyError = ({ onRetry, error, className = '' }) => (
  <EmptyState
    variant="error"
    title="Something went wrong"
    description={error || "We encountered an error while loading your data. Please try again."}
    action={
      onRetry && (
        <button
          onClick={onRetry}
          className="btn btn-primary"
          aria-label="Retry loading data"
        >
          Try Again
        </button>
      )
    }
    className={className}
  />
);

export default EmptyState;

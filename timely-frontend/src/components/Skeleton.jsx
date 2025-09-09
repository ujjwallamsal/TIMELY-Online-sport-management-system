import React from 'react';

/**
 * Skeleton component for loading states
 * Provides consistent loading animations across the app
 */
const Skeleton = ({ 
  variant = 'text', 
  width = '100%', 
  height = '1rem', 
  className = '',
  lines = 1,
  ...props 
}) => {
  const baseClasses = 'loading-shimmer rounded animate-pulse';
  
  const variants = {
    text: 'h-4 bg-gray-200',
    card: 'bg-white rounded-xl shadow-sm border border-gray-200 p-6',
    list: 'bg-white rounded-lg shadow-sm border border-gray-200 p-4',
    avatar: 'rounded-full bg-gray-200',
    button: 'h-10 bg-gray-200 rounded-lg',
    image: 'bg-gray-200 rounded-lg',
    table: 'bg-gray-200 rounded',
    badge: 'h-6 bg-gray-200 rounded-full',
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`} {...props}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseClasses} ${variants.text}`}
            style={{ width: index === lines - 1 ? '75%' : width }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${variants[variant]} ${className}`}
      style={{ width, height }}
      {...props}
    />
  );
};

/**
 * Card skeleton with multiple elements
 */
export const CardSkeleton = ({ className = '', ...props }) => (
  <div className={`${className}`} {...props}>
    <Skeleton variant="card" className="mb-4" />
    <div className="space-y-3">
      <Skeleton variant="text" width="80%" />
      <Skeleton variant="text" width="60%" />
      <Skeleton variant="text" width="40%" />
    </div>
    <div className="flex justify-between items-center mt-4">
      <Skeleton variant="badge" width="60px" />
      <Skeleton variant="button" width="80px" />
    </div>
  </div>
);

/**
 * List skeleton with multiple rows
 */
export const ListSkeleton = ({ 
  rows = 3, 
  showAvatar = false, 
  className = '',
  ...props 
}) => (
  <div className={`space-y-3 ${className}`} {...props}>
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} className="flex items-center space-x-3">
        {showAvatar && <Skeleton variant="avatar" width="40px" height="40px" />}
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="70%" />
          <Skeleton variant="text" width="50%" />
        </div>
        <Skeleton variant="button" width="60px" />
      </div>
    ))}
  </div>
);

/**
 * Table skeleton with headers and rows
 */
export const TableSkeleton = ({ 
  rows = 5, 
  columns = 4, 
  className = '',
  ...props 
}) => (
  <div className={`${className}`} {...props}>
    {/* Header */}
    <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {Array.from({ length: columns }).map((_, index) => (
        <Skeleton key={index} variant="text" width="80%" />
      ))}
    </div>
    
    {/* Rows */}
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div 
          key={rowIndex} 
          className="grid gap-4" 
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} variant="text" width="90%" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

/**
 * Event card skeleton
 */
export const EventCardSkeleton = ({ className = '', ...props }) => (
  <div className={`${className}`} {...props}>
    <Skeleton variant="image" height="200px" className="mb-4" />
    <div className="space-y-3">
      <Skeleton variant="text" width="85%" height="1.5rem" />
      <Skeleton variant="text" width="70%" />
      <Skeleton variant="text" width="60%" />
    </div>
    <div className="flex justify-between items-center mt-4">
      <Skeleton variant="badge" width="80px" />
      <Skeleton variant="button" width="100px" />
    </div>
  </div>
);

/**
 * Dashboard stats skeleton
 */
export const StatsSkeleton = ({ className = '', ...props }) => (
  <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`} {...props}>
    {Array.from({ length: 4 }).map((_, index) => (
      <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton variant="text" width="60px" height="1.25rem" />
          <Skeleton variant="avatar" width="32px" height="32px" />
        </div>
        <Skeleton variant="text" width="80%" height="2rem" />
        <Skeleton variant="text" width="50%" className="mt-2" />
      </div>
    ))}
  </div>
);

export default Skeleton;

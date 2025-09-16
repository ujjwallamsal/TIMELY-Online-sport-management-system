import React from 'react';

const Skeleton = ({ 
  className = '', 
  variant = 'rectangular',
  width,
  height,
  children,
  ...props 
}) => {
  const baseClasses = 'animate-pulse bg-gray-200 rounded';
  
  const variantClasses = {
    rectangular: 'rounded',
    circular: 'rounded-full',
    text: 'h-4',
    button: 'h-10 rounded-md',
    card: 'h-32 rounded-lg',
    avatar: 'w-10 h-10 rounded-full',
    list: 'h-16 rounded-md'
  };

  const style = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
};

// Predefined skeleton components
export const SkeletonText = ({ lines = 1, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        variant="text"
        className={`${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
      />
    ))}
  </div>
);

export const SkeletonCard = ({ className = '' }) => (
  <div className={`p-4 border rounded-lg ${className}`}>
    <Skeleton variant="avatar" className="mb-3" />
    <SkeletonText lines={3} />
    <div className="mt-4 flex gap-2">
      <Skeleton variant="button" className="w-20" />
      <Skeleton variant="button" className="w-16" />
    </div>
  </div>
);

export const SkeletonList = ({ items = 3, className = '' }) => (
  <div className={`space-y-3 ${className}`}>
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
        <Skeleton variant="avatar" />
        <div className="flex-1">
          <SkeletonText lines={2} />
        </div>
        <Skeleton variant="button" className="w-16" />
      </div>
    ))}
  </div>
);

export const SkeletonTable = ({ rows = 5, columns = 4, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {/* Header */}
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} variant="text" className="h-6" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, j) => (
          <Skeleton key={j} variant="text" className="h-4" />
        ))}
      </div>
    ))}
  </div>
);

export default Skeleton;

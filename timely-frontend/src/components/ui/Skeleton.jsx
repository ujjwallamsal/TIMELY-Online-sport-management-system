// src/components/ui/Skeleton.jsx
import React from 'react';

const Skeleton = ({
  className = '',
  variant = 'text',
  width,
  height,
  rounded = true,
  animate = true,
  ...props
}) => {
  const baseClasses = `
    bg-gray-200 ${animate ? 'animate-pulse' : ''} ${rounded ? 'rounded' : ''}
    ${className}
  `;

  const variants = {
    text: 'h-4',
    title: 'h-6',
    subtitle: 'h-5',
    avatar: 'h-10 w-10 rounded-full',
    button: 'h-10 w-24 rounded-lg',
    card: 'h-32 w-full rounded-lg',
    image: 'h-48 w-full rounded-lg',
    table: 'h-12 w-full rounded-lg',
    list: 'h-16 w-full rounded-lg'
  };

  const style = {
    ...(width && { width }),
    ...(height && { height })
  };

  return (
    <div
      className={`${baseClasses} ${variants[variant]}`}
      style={style}
      {...props}
    />
  );
};

// Skeleton components for common layouts
export const SkeletonCard = ({ className = '' }) => (
  <div className={`p-6 border border-gray-200 rounded-lg ${className}`}>
    <div className="flex items-center space-x-4">
      <Skeleton variant="avatar" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="title" width="60%" />
        <Skeleton variant="text" width="40%" />
      </div>
    </div>
    <div className="mt-4 space-y-2">
      <Skeleton variant="text" />
      <Skeleton variant="text" width="80%" />
    </div>
  </div>
);

export const SkeletonTable = ({ rows = 5, columns = 4, className = '' }) => (
  <div className={`space-y-3 ${className}`}>
    {/* Header */}
    <div className="flex space-x-4">
      {[...Array(columns)].map((_, i) => (
        <Skeleton key={i} variant="text" width="20%" />
      ))}
    </div>
    {/* Rows */}
    {[...Array(rows)].map((_, rowIndex) => (
      <div key={rowIndex} className="flex space-x-4">
        {[...Array(columns)].map((_, colIndex) => (
          <Skeleton key={colIndex} variant="text" width="20%" />
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonList = ({ items = 5, className = '' }) => (
  <div className={`space-y-3 ${className}`}>
    {[...Array(items)].map((_, i) => (
      <div key={i} className="flex items-center space-x-3">
        <Skeleton variant="avatar" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="70%" />
          <Skeleton variant="text" width="50%" />
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonForm = ({ fields = 4, className = '' }) => (
  <div className={`space-y-4 ${className}`}>
    {[...Array(fields)].map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton variant="text" width="25%" />
        <Skeleton variant="button" width="100%" />
      </div>
    ))}
  </div>
);

export default Skeleton;
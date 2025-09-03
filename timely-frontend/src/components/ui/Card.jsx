import React from 'react';

const Card = ({ 
  children, 
  className = '', 
  padding = 'p-6', 
  shadow = 'shadow-sm', 
  hover = false,
  onClick,
  ...props 
}) => {
  const baseClasses = 'bg-white rounded-lg border border-gray-200 transition-all duration-200';
  const hoverClasses = hover ? 'hover:shadow-md hover:border-gray-300 cursor-pointer' : '';
  const shadowClasses = shadow;
  
  return (
    <div 
      className={`${baseClasses} ${padding} ${shadowClasses} ${hoverClasses} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;

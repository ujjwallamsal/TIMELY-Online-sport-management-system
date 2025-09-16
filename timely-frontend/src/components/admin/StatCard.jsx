// src/components/admin/StatCard.jsx
import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({
  title,
  value,
  trend,
  icon,
  loading = false,
  className = ''
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (loading) {
      setDisplayValue(0);
      return;
    }

    // Animate count from 0 to target value
    setIsAnimating(true);
    const duration = 1000; // 1 second
    const startTime = Date.now();
    const startValue = displayValue;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.round(startValue + (value - startValue) * easeOutCubic);
      
      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(animate);
  }, [value, loading]);

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-8 w-8 bg-gray-200 rounded"></div>
          </div>
          <div className="mt-4">
            <div className="h-8 bg-gray-200 rounded w-16"></div>
            <div className="mt-2 h-4 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        {icon && (
          <div className="text-gray-400">
            {icon}
          </div>
        )}
      </div>
      
      <div className="mt-4">
        <div className="flex items-baseline">
          <p className={`text-2xl font-semibold text-gray-900 ${isAnimating ? 'transition-all duration-300' : ''}`}>
            {displayValue.toLocaleString()}
          </p>
          {trend && (
            <div className={`ml-2 flex items-center text-sm ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend.isPositive ? (
                <TrendingUp className="h-4 w-4 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 mr-1" />
              )}
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        
        {trend && (
          <p className="text-xs text-gray-500 mt-1">
            {trend.isPositive ? 'vs last period' : 'vs last period'}
          </p>
        )}
      </div>
    </div>
  );
};

export default StatCard;

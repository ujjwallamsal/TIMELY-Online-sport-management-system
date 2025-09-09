import { useState } from 'react';
import { 
  UserGroupIcon, 
  CalendarIcon, 
  TrophyIcon, 
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  FireIcon,
  StarIcon,
  CurrencyDollarIcon,
  BellIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

/**
 * KPI Card component for displaying key performance indicators
 * @param {Object} props - Component props
 * @param {string} props.title - Card title
 * @param {number|string} props.value - KPI value
 * @param {string} props.subtitle - Optional subtitle
 * @param {string} props.icon - Icon name from Heroicons
 * @param {string} props.color - Color theme (blue, green, purple, orange, red, indigo)
 * @param {string} props.trend - Trend indicator (up, down, neutral)
 * @param {string} props.trendValue - Trend percentage or value
 * @param {boolean} props.loading - Loading state
 * @param {Function} props.onClick - Click handler for drilldown
 */
export default function KpiCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color = 'blue', 
  trend, 
  trendValue, 
  loading = false,
  onClick 
}) {
  const [isHovered, setIsHovered] = useState(false);

  // Icon mapping
  const iconMap = {
    users: UserGroupIcon,
    events: CalendarIcon,
    registrations: TrophyIcon,
    revenue: CurrencyDollarIcon,
    notifications: BellIcon,
    errors: ExclamationCircleIcon,
    default: ChartBarIcon
  };

  // Color theme mapping
  const colorThemes = {
    blue: {
      bg: 'from-blue-500 to-blue-600',
      bgHover: 'from-blue-600 to-blue-700',
      text: 'text-blue-100',
      icon: 'text-blue-600'
    },
    green: {
      bg: 'from-green-500 to-green-600',
      bgHover: 'from-green-600 to-green-700',
      text: 'text-green-100',
      icon: 'text-green-600'
    },
    purple: {
      bg: 'from-purple-500 to-purple-600',
      bgHover: 'from-purple-600 to-purple-700',
      text: 'text-purple-100',
      icon: 'text-purple-600'
    },
    orange: {
      bg: 'from-orange-500 to-orange-600',
      bgHover: 'from-orange-600 to-orange-700',
      text: 'text-orange-100',
      icon: 'text-orange-600'
    },
    red: {
      bg: 'from-red-500 to-red-600',
      bgHover: 'from-red-600 to-red-700',
      text: 'text-red-100',
      icon: 'text-red-600'
    },
    indigo: {
      bg: 'from-indigo-500 to-indigo-600',
      bgHover: 'from-indigo-600 to-indigo-700',
      text: 'text-indigo-100',
      icon: 'text-indigo-600'
    }
  };

  const IconComponent = iconMap[icon] || iconMap.default;
  const theme = colorThemes[color] || colorThemes.blue;

  // Format value based on type
  const formatValue = (val) => {
    if (loading) return '...';
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      } else if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`;
      }
      return val.toLocaleString();
    }
    return val;
  };

  // Format currency values
  const formatCurrency = (cents) => {
    if (loading) return '$...';
    if (typeof cents === 'number') {
      return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return cents;
  };

  const isCurrency = title.toLowerCase().includes('revenue') || title.toLowerCase().includes('sales');
  const displayValue = isCurrency ? formatCurrency(value) : formatValue(value);

  return (
    <div 
      className={`
        relative overflow-hidden rounded-xl shadow-lg transition-all duration-300
        ${onClick ? 'cursor-pointer hover:shadow-xl' : ''}
        ${isHovered ? 'scale-105' : 'hover:scale-105'}
        bg-gradient-to-br ${isHovered ? theme.bgHover : theme.bg} text-white
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
      </div>

      {/* Content */}
      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className={`
            flex items-center justify-center w-12 h-12 rounded-lg
            bg-white/20 backdrop-blur-sm
          `}>
            <IconComponent className="w-6 h-6" />
          </div>
          
          {/* Trend indicator */}
          {trend && trendValue && (
            <div className={`
              flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium
              ${trend === 'up' ? 'bg-green-500/20 text-green-100' : 
                trend === 'down' ? 'bg-red-500/20 text-red-100' : 
                'bg-gray-500/20 text-gray-100'}
            `}>
              {trend === 'up' && <span>↗</span>}
              {trend === 'down' && <span>↘</span>}
              {trend === 'neutral' && <span>→</span>}
              <span>{trendValue}</span>
            </div>
          )}
        </div>

        {/* Value */}
        <div className="mb-2">
          <h3 className="text-3xl font-bold tracking-tight">
            {displayValue}
          </h3>
        </div>

        {/* Title and subtitle */}
        <div>
          <p className="text-lg font-semibold mb-1">{title}</p>
          {subtitle && (
            <p className={`text-sm ${theme.text} opacity-90`}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Click indicator */}
        {onClick && (
          <div className="absolute bottom-4 right-4 opacity-60">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        )}
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      )}
    </div>
  );
}

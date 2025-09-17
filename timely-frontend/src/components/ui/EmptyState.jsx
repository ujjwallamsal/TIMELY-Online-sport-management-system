// src/components/ui/EmptyState.jsx
import React from 'react';
import { 
  CalendarDaysIcon,
  TrophyIcon,
  UserGroupIcon,
  DocumentTextIcon,
  PhotoIcon,
  NewspaperIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

const EmptyState = ({
  icon: Icon = InformationCircleIcon,
  title = "No data available",
  description = "There's nothing to show here yet.",
  action,
  actionText = "Get started",
  size = "md",
  className = ""
}) => {
  const sizes = {
    sm: {
      icon: 'w-8 h-8',
      title: 'text-lg',
      description: 'text-sm',
      container: 'py-8'
    },
    md: {
      icon: 'w-12 h-12',
      title: 'text-xl',
      description: 'text-base',
      container: 'py-12'
    },
    lg: {
      icon: 'w-16 h-16',
      title: 'text-2xl',
      description: 'text-lg',
      container: 'py-16'
    }
  };

  const config = sizes[size];

  return (
    <div className={`text-center ${config.container} ${className}`}>
      <div className="flex justify-center mb-4">
        <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full">
          <Icon className={`${config.icon} text-gray-400`} />
        </div>
      </div>
      
      <h3 className={`${config.title} font-medium text-gray-900 mb-2`}>
        {title}
      </h3>
      
      <p className={`${config.description} text-gray-500 mb-6 max-w-sm mx-auto`}>
        {description}
      </p>
      
      {action && (
        <button
          onClick={action}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          {actionText}
        </button>
      )}
    </div>
  );
};

// Predefined empty states for common scenarios
export const EmptyEvents = ({ action, actionText }) => (
  <EmptyState
    icon={CalendarDaysIcon}
    title="No events found"
    description="There are no events scheduled at the moment. Check back later or create a new event."
    action={action}
    actionText={actionText || "Create Event"}
  />
);

export const EmptyResults = ({ action, actionText }) => (
  <EmptyState
    icon={TrophyIcon}
    title="No results available"
    description="Results will appear here once events are completed and scores are recorded."
    action={action}
    actionText={actionText || "View Events"}
  />
);

export const EmptyRegistrations = ({ action, actionText }) => (
  <EmptyState
    icon={UserGroupIcon}
    title="No registrations yet"
    description="No one has registered for this event yet. Share the event to get participants."
    action={action}
    actionText={actionText || "Share Event"}
  />
);

export const EmptyTickets = ({ action, actionText }) => (
  <EmptyState
    icon={DocumentTextIcon}
    title="No tickets purchased"
    description="You haven't purchased any tickets yet. Browse events to find something you'd like to attend."
    action={action}
    actionText={actionText || "Browse Events"}
  />
);

export const EmptyMedia = ({ action, actionText }) => (
  <EmptyState
    icon={PhotoIcon}
    title="No media available"
    description="No photos or videos have been uploaded for this event yet."
    action={action}
    actionText={actionText || "Upload Media"}
  />
);

export const EmptyNews = ({ action, actionText }) => (
  <EmptyState
    icon={NewspaperIcon}
    title="No news articles"
    description="No news articles have been published yet. Check back later for updates."
    action={action}
    actionText={actionText || "View Events"}
  />
);

export const EmptySearch = ({ searchTerm, action, actionText }) => (
  <EmptyState
    icon={ExclamationTriangleIcon}
    title="No results found"
    description={`No results found for "${searchTerm}". Try adjusting your search terms.`}
    action={action}
    actionText={actionText || "Clear Search"}
  />
);

export default EmptyState;
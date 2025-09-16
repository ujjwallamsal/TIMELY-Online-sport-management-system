import React from 'react';
import { 
  ExclamationTriangleIcon, 
  InboxIcon, 
  DocumentTextIcon,
  UserGroupIcon,
  CalendarIcon,
  TicketIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const EmptyState = ({ 
  icon: Icon = InboxIcon,
  title = 'No data available',
  description = 'There are no items to display at the moment.',
  action,
  className = ''
}) => {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="mx-auto w-24 h-24 text-gray-300 mb-4">
        <Icon className="w-full h-full" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {title}
      </h3>
      <p className="text-gray-500 mb-6 max-w-sm mx-auto">
        {description}
      </p>
      {action && (
        <div className="flex justify-center">
          {action}
        </div>
      )}
    </div>
  );
};

// Predefined empty states for common scenarios
export const EmptyRegistrations = ({ action }) => (
  <EmptyState
    icon={DocumentTextIcon}
    title="No registrations yet"
    description="You haven't registered for any events yet. Browse available events to get started."
    action={action}
  />
);

export const EmptyTickets = ({ action }) => (
  <EmptyState
    icon={TicketIcon}
    title="No tickets found"
    description="You don't have any tickets yet. Purchase tickets for upcoming events."
    action={action}
  />
);

export const EmptyTeamMembers = ({ action }) => (
  <EmptyState
    icon={UserGroupIcon}
    title="No team members"
    description="Your team doesn't have any members yet. Invite players to join your team."
    action={action}
  />
);

export const EmptyResults = ({ action }) => (
  <EmptyState
    icon={ChartBarIcon}
    title="No results available"
    description="Results for this event haven't been published yet. Check back later."
    action={action}
  />
);

export const EmptyMessages = ({ action }) => (
  <EmptyState
    icon={DocumentTextIcon}
    title="No messages yet"
    description="Start a conversation with your team or event organizers."
    action={action}
  />
);

export const EmptyNotifications = ({ action }) => (
  <EmptyState
    icon={InboxIcon}
    title="No notifications"
    description="You're all caught up! New notifications will appear here."
    action={action}
  />
);

export const EmptyEvents = ({ action }) => (
  <EmptyState
    icon={CalendarIcon}
    title="No events found"
    description="There are no events available at the moment. Check back later for updates."
    action={action}
  />
);

export const EmptySearch = ({ action }) => (
  <EmptyState
    icon={ExclamationTriangleIcon}
    title="No results found"
    description="Try adjusting your search criteria or filters to find what you're looking for."
    action={action}
  />
);

export default EmptyState;

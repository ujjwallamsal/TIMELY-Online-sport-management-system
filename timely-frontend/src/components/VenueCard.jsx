import React from 'react';
import Badge from './ui/Badge';
import Button from './ui/Button';

const VenueCard = ({ venue, onManageAvailability, userRole }) => {
  const canManage = userRole === 'ADMIN' || userRole === 'ORGANIZER';
  
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {venue.name}
          </h3>
          <p className="text-sm text-gray-600">
            {venue.city && venue.state ? `${venue.city}, ${venue.state}` : venue.address}
          </p>
        </div>
        {venue.is_active ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="secondary">Inactive</Badge>
        )}
      </div>

      {/* Details */}
      <div className="space-y-2 mb-4">
        {venue.capacity > 0 && (
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Capacity: {venue.capacity.toLocaleString()}
          </div>
        )}
        
        {venue.timezone && venue.timezone !== 'UTC' && (
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {venue.timezone}
          </div>
        )}
      </div>

      {/* Facilities */}
      {venue.facilities_list && venue.facilities_list.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {venue.facilities_list.map((facility, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {facility}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {canManage && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onManageAvailability(venue)}
            className="flex-1"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Manage Availability
          </Button>
        </div>
      )}
    </div>
  );
};

export default VenueCard;

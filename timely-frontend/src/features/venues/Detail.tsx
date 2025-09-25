import React from 'react';
import { useParams } from 'react-router-dom';
import { useVenue } from '../../api/queries';

const VenueDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: venue, isLoading } = useVenue(parseInt(id || '0'));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Venue Not Found</h1>
            <p className="text-gray-600">The venue you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="card">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{venue.name}</h1>
          <p className="text-gray-600 mb-6">{venue.address}, {venue.city}, {venue.state}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Contact Information</h3>
              <div className="space-y-2">
                {venue.contact_phone && <p><span className="font-medium">Phone:</span> {venue.contact_phone}</p>}
                {venue.contact_email && <p><span className="font-medium">Email:</span> {venue.contact_email}</p>}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Details</h3>
              <div className="space-y-2">
                {venue.capacity && <p><span className="font-medium">Capacity:</span> {venue.capacity}</p>}
                {venue.facilities.length > 0 && (
                  <div>
                    <span className="font-medium">Facilities:</span>
                    <ul className="list-disc list-inside mt-1">
                      {venue.facilities.map((facility, index) => (
                        <li key={index}>{facility}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueDetail;
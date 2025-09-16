// src/pages/admin/VenueSlots.jsx
import React from 'react';
import { useParams } from 'react-router-dom';

const VenueSlots = () => {
  const { id } = useParams();

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Venue Slots Management</h1>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <p className="text-gray-600">
          Managing slots for venue ID: {id}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          This page will be implemented to manage venue availability slots and check for conflicts.
        </p>
      </div>
    </div>
  );
};

export default VenueSlots;

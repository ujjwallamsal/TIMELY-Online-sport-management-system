import React from 'react';
import { useParams } from 'react-router-dom';

const EventEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="card">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Event</h1>
          <p className="text-gray-600">Event editing form will be implemented here for event ID: {id}</p>
        </div>
      </div>
    </div>
  );
};

export default EventEdit;
// src/pages/admin/VenueForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, MapPin, Users, Wifi } from 'lucide-react';

const VenueForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    capacity: '',
    facilities: {
      wifi: false,
      parking: false,
      food: false,
      restrooms: false,
      changingRooms: false,
      firstAid: false,
      scoreboard: false,
      soundSystem: false
    }
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      fetchVenue();
    }
  }, [id, isEdit]);

  const fetchVenue = async () => {
    try {
      // Mock data - replace with actual API call
      setFormData({
        name: 'Sports Center',
        address: '123 Sports Street, Melbourne VIC 3000',
        capacity: '500',
        facilities: {
          wifi: true,
          parking: true,
          food: true,
          restrooms: true,
          changingRooms: true,
          firstAid: true,
          scoreboard: true,
          soundSystem: false
        }
      });
    } catch (error) {
      console.error('Error fetching venue:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isEdit) {
        // API call to update venue
        console.log('Updating venue:', formData);
      } else {
        // API call to create venue
        console.log('Creating venue:', formData);
      }
      
      navigate('/admin/venues');
    } catch (error) {
      console.error('Error saving venue:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFacilityChange = (facility) => {
    setFormData(prev => ({
      ...prev,
      facilities: {
        ...prev.facilities,
        [facility]: !prev.facilities[facility]
      }
    }));
  };

  const facilityOptions = [
    { key: 'wifi', label: 'WiFi', icon: Wifi },
    { key: 'parking', label: 'Parking', icon: MapPin },
    { key: 'food', label: 'Food & Beverage', icon: Users },
    { key: 'restrooms', label: 'Restrooms', icon: Users },
    { key: 'changingRooms', label: 'Changing Rooms', icon: Users },
    { key: 'firstAid', label: 'First Aid', icon: Users },
    { key: 'scoreboard', label: 'Scoreboard', icon: Users },
    { key: 'soundSystem', label: 'Sound System', icon: Users }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/admin/venues')}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Venue' : 'Create New Venue'}
        </h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Venue Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter venue name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capacity *
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.capacity}
                onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter capacity"
              />
            </div>
          </div>
          
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address *
            </label>
            <textarea
              required
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              rows={3}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter full address"
            />
          </div>
        </div>

        {/* Facilities */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Facilities</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {facilityOptions.map((facility) => {
              const Icon = facility.icon;
              return (
                <div key={facility.key} className="flex items-center">
                  <input
                    type="checkbox"
                    id={facility.key}
                    checked={formData.facilities[facility.key]}
                    onChange={() => handleFacilityChange(facility.key)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={facility.key} className="ml-2 flex items-center text-sm text-gray-900">
                    <Icon className="h-4 w-4 mr-1" />
                    {facility.label}
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/admin/venues')}
            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : (isEdit ? 'Update Venue' : 'Create Venue')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VenueForm;

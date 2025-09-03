import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  getEvent, 
  createEvent, 
  updateEvent, 
  listDivisions, 
  createDivision, 
  updateDivision, 
  deleteDivision 
} from '../lib/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';

const EventEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const isEditing = Boolean(id);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    sport: '',
    description: '',
    start_datetime: '',
    end_datetime: '',
    registration_open_at: '',
    registration_close_at: '',
    location: '',
    capacity: 0,
    fee_cents: 0
  });
  
  const [divisions, setDivisions] = useState([]);
  const [newDivision, setNewDivision] = useState({ name: '', sort_order: 0 });
  const [editingDivision, setEditingDivision] = useState(null);

  useEffect(() => {
    if (isEditing) {
      fetchEvent();
      fetchDivisions();
    }
  }, [id, isEditing]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const response = await getEvent(id);
      const event = response.data;
      
      setFormData({
        name: event.name || '',
        sport: event.sport || '',
        description: event.description || '',
        start_datetime: event.start_datetime ? event.start_datetime.slice(0, 16) : '',
        end_datetime: event.end_datetime ? event.end_datetime.slice(0, 16) : '',
        registration_open_at: event.registration_open_at ? event.registration_open_at.slice(0, 16) : '',
        registration_close_at: event.registration_close_at ? event.registration_close_at.slice(0, 16) : '',
        location: event.location || '',
        capacity: event.capacity || 0,
        fee_cents: event.fee_cents || 0
      });
    } catch (err) {
      console.error('Error fetching event:', err);
      setError('Failed to load event details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDivisions = async () => {
    try {
      const response = await listDivisions(id);
      setDivisions(response.data);
    } catch (err) {
      console.error('Error fetching divisions:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      
      // Convert fee to cents
      const eventData = {
        ...formData,
        fee_cents: Math.round(formData.fee_cents * 100)
      };
      
      if (isEditing) {
        await updateEvent(id, eventData);
      } else {
        await createEvent(eventData);
      }
      
      navigate('/events');
    } catch (err) {
      console.error('Error saving event:', err);
      setError('Failed to save event. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddDivision = async () => {
    if (!newDivision.name.trim()) return;
    
    try {
      const response = await createDivision(id, newDivision);
      setDivisions(prev => [...prev, response.data]);
      setNewDivision({ name: '', sort_order: 0 });
    } catch (err) {
      console.error('Error adding division:', err);
      alert('Failed to add division. Please try again.');
    }
  };

  const handleUpdateDivision = async (divisionId, data) => {
    try {
      const response = await updateDivision(id, divisionId, data);
      setDivisions(prev => prev.map(d => d.id === divisionId ? response.data : d));
      setEditingDivision(null);
    } catch (err) {
      console.error('Error updating division:', err);
      alert('Failed to update division. Please try again.');
    }
  };

  const handleDeleteDivision = async (divisionId) => {
    if (!confirm('Are you sure you want to delete this division?')) return;
    
    try {
      await deleteDivision(id, divisionId);
      setDivisions(prev => prev.filter(d => d.id !== divisionId));
    } catch (err) {
      console.error('Error deleting division:', err);
      alert('Failed to delete division. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Edit Event' : 'Create Event'}
          </h1>
          <p className="mt-2 text-gray-600">
            {isEditing ? 'Update event details and divisions' : 'Create a new sports event'}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Event Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Enter event name"
              />
              
              <Input
                label="Sport"
                name="sport"
                value={formData.sport}
                onChange={handleInputChange}
                required
                placeholder="e.g., Football, Basketball"
              />
            </div>
            
            <div className="mt-6">
              <Input
                label="Description"
                name="description"
                as="textarea"
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the event..."
              />
            </div>
          </div>

          {/* Date and Time */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Date and Time</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Start Date & Time"
                name="start_datetime"
                type="datetime-local"
                value={formData.start_datetime}
                onChange={handleInputChange}
                required
              />
              
              <Input
                label="End Date & Time"
                name="end_datetime"
                type="datetime-local"
                value={formData.end_datetime}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <Input
                label="Registration Opens"
                name="registration_open_at"
                type="datetime-local"
                value={formData.registration_open_at}
                onChange={handleInputChange}
                helperText="When participants can start registering"
              />
              
              <Input
                label="Registration Closes"
                name="registration_close_at"
                type="datetime-local"
                value={formData.registration_close_at}
                onChange={handleInputChange}
                helperText="When registration ends"
              />
            </div>
          </div>

          {/* Location and Capacity */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Location and Capacity</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                required
                placeholder="Event venue or location"
              />
              
              <Input
                label="Capacity"
                name="capacity"
                type="number"
                min="0"
                value={formData.capacity}
                onChange={handleInputChange}
                helperText="Maximum number of participants (0 for unlimited)"
              />
            </div>
          </div>

          {/* Registration Fee */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Registration Fee</h2>
            
            <Input
              label="Fee (USD)"
              name="fee_cents"
              type="number"
              min="0"
              step="0.01"
              value={formData.fee_cents / 100}
              onChange={(e) => setFormData(prev => ({ ...prev, fee_cents: parseFloat(e.target.value) * 100 }))}
              helperText="Registration fee in USD (0 for free)"
            />
          </div>

          {/* Divisions (only for editing) */}
          {isEditing && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Divisions</h2>
              
              {/* Add new division */}
              <div className="border border-gray-200 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add Division</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Division Name"
                    value={newDivision.name}
                    onChange={(e) => setNewDivision(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., U18, Open, Masters"
                  />
                  <Input
                    label="Sort Order"
                    type="number"
                    min="0"
                    value={newDivision.sort_order}
                    onChange={(e) => setNewDivision(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                    helperText="Display order (0 = first)"
                  />
                  <div className="flex items-end">
                    <Button
                      type="button"
                      onClick={handleAddDivision}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add Division
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Existing divisions */}
              {divisions.length > 0 ? (
                <div className="space-y-4">
                  {divisions.map((division) => (
                    <div key={division.id} className="border border-gray-200 rounded-lg p-4">
                      {editingDivision === division.id ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Input
                            label="Division Name"
                            value={division.name}
                            onChange={(e) => setDivisions(prev => prev.map(d => 
                              d.id === division.id ? { ...d, name: e.target.value } : d
                            ))}
                          />
                          <Input
                            label="Sort Order"
                            type="number"
                            min="0"
                            value={division.sort_order}
                            onChange={(e) => setDivisions(prev => prev.map(d => 
                              d.id === division.id ? { ...d, sort_order: parseInt(e.target.value) || 0 } : d
                            ))}
                          />
                          <div className="flex space-x-2">
                            <Button
                              type="button"
                              onClick={() => handleUpdateDivision(division.id, {
                                name: division.name,
                                sort_order: division.sort_order
                              })}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              Save
                            </Button>
                            <Button
                              type="button"
                              onClick={() => setEditingDivision(null)}
                              className="bg-gray-600 hover:bg-gray-700 text-white"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{division.name}</h4>
                            <p className="text-sm text-gray-600">Order: {division.sort_order}</p>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              type="button"
                              onClick={() => setEditingDivision(division.id)}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              onClick={() => handleDeleteDivision(division.id)}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No divisions added yet.</p>
              )}
            </div>
          )}

          {/* Submit buttons */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              onClick={() => navigate('/events')}
              className="bg-gray-600 hover:bg-gray-700 text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isEditing ? 'Update Event' : 'Create Event'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventEditor;

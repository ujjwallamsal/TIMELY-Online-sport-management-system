import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  getEvent, 
  createEvent, 
  updateEvent 
} from '../../lib/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  CalendarIcon,
  MapPinIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

const EventForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const isEditing = Boolean(id);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
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

  useEffect(() => {
    if (isEditing) {
      fetchEvent();
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

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    let processedValue = value;
    
    if (type === 'number') {
      // Handle empty string and NaN values for number inputs
      if (value === '' || isNaN(value)) {
        processedValue = 0;
      } else {
        processedValue = parseFloat(value) || 0;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      
      // Validate required fields
      if (!formData.name.trim()) {
        setError('Event name is required.');
        return;
      }
      if (!formData.sport.trim()) {
        setError('Sport is required.');
        return;
      }
      if (!formData.start_datetime) {
        setError('Start date and time is required.');
        return;
      }
      if (!formData.end_datetime) {
        setError('End date and time is required.');
        return;
      }
      if (!formData.location.trim()) {
        setError('Location is required.');
        return;
      }
      
      // Convert fee to cents
      const eventData = {
        ...formData,
        fee_cents: Math.round(formData.fee_cents)
      };
      
      if (isEditing) {
        await updateEvent(id, eventData);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        await createEvent(eventData);
        setSuccess(true);
        // Navigate after showing success message
        setTimeout(() => {
          navigate('/admin/events');
        }, 2000);
      }
      
    } catch (err) {
      console.error('Error saving event:', err);
      
      // Provide more specific error messages
      if (err.response?.status === 400) {
        const errorData = err.response.data;
        if (typeof errorData === 'object' && errorData !== null) {
          const errorMessages = Object.values(errorData).flat();
          setError(errorMessages.join(', '));
        } else {
          setError('Please check your input and try again.');
        }
      } else if (err.response?.status === 401) {
        setError('You are not authorized to perform this action.');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to create/edit events.');
      } else if (err.response?.status >= 500) {
        setError('Server error. Please try again later.');
      } else {
        setError('Failed to save event. Please try again.');
      }
    } finally {
      setSaving(false);
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
            {isEditing ? 'Update event details' : 'Create a new sports event'}
          </p>
        </div>

        {/* Status messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
              <p className="text-sm text-green-700">
                {isEditing ? 'Event updated successfully!' : 'Event created successfully! Redirecting...'}
              </p>
            </div>
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
              onChange={(e) => {
                const feeValue = parseFloat(e.target.value) || 0;
                setFormData(prev => ({ ...prev, fee_cents: Math.round(feeValue * 100) }));
              }}
              helperText="Registration fee in USD (0 for free)"
            />
          </div>

          {/* Submit buttons */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              onClick={() => navigate('/admin/events')}
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

export default EventForm;

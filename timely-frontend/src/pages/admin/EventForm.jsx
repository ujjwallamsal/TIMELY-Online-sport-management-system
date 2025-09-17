// src/pages/admin/EventForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  CalendarDaysIcon,
  MapPinIcon,
  ClockIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Card from '../../components/ui/Card';
import Dialog from '../../components/ui/Dialog';

export default function EventForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    venue: '',
    category: '',
    maxParticipants: '',
    registrationFee: '',
    visibility: 'PUBLIC',
    status: 'DRAFT'
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const categories = [
    { value: 'BASKETBALL', label: 'Basketball' },
    { value: 'SOCCER', label: 'Soccer' },
    { value: 'TENNIS', label: 'Tennis' },
    { value: 'VOLLEYBALL', label: 'Volleyball' },
    { value: 'SWIMMING', label: 'Swimming' },
    { value: 'TRACK', label: 'Track & Field' }
  ];

  const visibilityOptions = [
    { value: 'PUBLIC', label: 'Public' },
    { value: 'PRIVATE', label: 'Private' }
  ];

  const statusOptions = [
    { value: 'DRAFT', label: 'Draft' },
    { value: 'PUBLISHED', label: 'Published' },
    { value: 'CANCELLED', label: 'Cancelled' }
  ];

  useEffect(() => {
    if (isEdit) {
      // Load event data for editing
      loadEventData();
    }
  }, [id, isEdit]);

  const loadEventData = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      setFormData({
        title: 'Championship Finals 2024',
        description: 'The ultimate championship event',
        startDate: '2024-03-15',
        endDate: '2024-03-17',
        venue: 'Main Arena',
        category: 'BASKETBALL',
        maxParticipants: '32',
        registrationFee: '50',
        visibility: 'PUBLIC',
        status: 'PUBLISHED'
      });
    } catch (error) {
      console.error('Error loading event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }
    
    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }
    
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = 'End date must be after start date';
    }
    
    if (!formData.venue.trim()) {
      newErrors.venue = 'Venue is required';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    if (formData.maxParticipants && (isNaN(formData.maxParticipants) || formData.maxParticipants < 1)) {
      newErrors.maxParticipants = 'Max participants must be a positive number';
    }
    
    if (formData.registrationFee && (isNaN(formData.registrationFee) || formData.registrationFee < 0)) {
      newErrors.registrationFee = 'Registration fee must be a non-negative number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Mock API call - replace with actual API call
      console.log('Saving event:', formData);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate back to events list
      navigate('/admin/events');
    } catch (error) {
      console.error('Error saving event:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEdit ? 'Edit Event' : 'Create Event'}
        </h1>
        <p className="text-gray-600 mt-2">
          {isEdit ? 'Update event details and settings.' : 'Fill in the details to create a new event.'}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
            
            <div className="space-y-4">
              <Input
                label="Event Title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                error={errors.title}
                placeholder="Enter event title"
                required
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={4}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter event description"
                />
              </div>
              
              <Select
                label="Category"
                value={formData.category}
                onChange={(value) => handleChange('category', value)}
                options={categories}
                error={errors.category}
                placeholder="Select category"
                required
              />
              
              <Select
                label="Visibility"
                value={formData.visibility}
                onChange={(value) => handleChange('visibility', value)}
                options={visibilityOptions}
                placeholder="Select visibility"
              />
            </div>
          </Card>

          {/* Date & Time */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Date & Time</h2>
            
            <div className="space-y-4">
              <Input
                label="Start Date"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                error={errors.startDate}
                required
              />
              
              <Input
                label="End Date"
                type="date"
                value={formData.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                error={errors.endDate}
                required
              />
              
              <Input
                label="Venue"
                value={formData.venue}
                onChange={(e) => handleChange('venue', e.target.value)}
                error={errors.venue}
                placeholder="Enter venue name"
                required
              />
            </div>
          </Card>

          {/* Registration Settings */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Registration Settings</h2>
            
            <div className="space-y-4">
              <Input
                label="Max Participants"
                type="number"
                value={formData.maxParticipants}
                onChange={(e) => handleChange('maxParticipants', e.target.value)}
                error={errors.maxParticipants}
                placeholder="Enter maximum participants"
              />
              
              <Input
                label="Registration Fee ($)"
                type="number"
                step="0.01"
                value={formData.registrationFee}
                onChange={(e) => handleChange('registrationFee', e.target.value)}
                error={errors.registrationFee}
                placeholder="Enter registration fee"
              />
              
              {isEdit && (
                <Select
                  label="Status"
                  value={formData.status}
                  onChange={(value) => handleChange('status', value)}
                  options={statusOptions}
                  placeholder="Select status"
                />
              )}
            </div>
          </Card>

          {/* Actions */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions</h2>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="flex-1"
              >
                {isEdit ? 'Update Event' : 'Create Event'}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => navigate('/admin/events')}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      </form>
    </div>
  );
}

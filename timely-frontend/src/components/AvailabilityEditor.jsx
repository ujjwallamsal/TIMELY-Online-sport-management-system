import React, { useState } from 'react';
import Button from './ui/Button';
import Input from './ui/Input';

const AvailabilityEditor = ({ 
  slot = null, 
  onSave, 
  onCancel, 
  isLoading = false 
}) => {
  const [formData, setFormData] = useState({
    start_datetime: slot?.start_datetime || '',
    end_datetime: slot?.end_datetime || '',
    status: slot?.status || 'available',
    note: slot?.note || ''
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.start_datetime) {
      newErrors.start_datetime = 'Start time is required';
    }
    
    if (!formData.end_datetime) {
      newErrors.end_datetime = 'End time is required';
    }
    
    if (formData.start_datetime && formData.end_datetime) {
      const start = new Date(formData.start_datetime);
      const end = new Date(formData.end_datetime);
      
      if (start >= end) {
        newErrors.end_datetime = 'End time must be after start time';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    onSave(formData);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {slot ? 'Edit Availability Slot' : 'Add Availability Slot'}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Start DateTime */}
        <div>
          <label htmlFor="start_datetime" className="block text-sm font-medium text-gray-700 mb-1">
            Start Time *
          </label>
          <Input
            type="datetime-local"
            id="start_datetime"
            name="start_datetime"
            value={formData.start_datetime}
            onChange={handleChange}
            className={errors.start_datetime ? 'border-red-500' : ''}
            disabled={isLoading}
          />
          {errors.start_datetime && (
            <p className="mt-1 text-sm text-red-600">{errors.start_datetime}</p>
          )}
        </div>

        {/* End DateTime */}
        <div>
          <label htmlFor="end_datetime" className="block text-sm font-medium text-gray-700 mb-1">
            End Time *
          </label>
          <Input
            type="datetime-local"
            id="end_datetime"
            name="end_datetime"
            value={formData.end_datetime}
            onChange={handleChange}
            className={errors.end_datetime ? 'border-red-500' : ''}
            disabled={isLoading}
          />
          {errors.end_datetime && (
            <p className="mt-1 text-sm text-red-600">{errors.end_datetime}</p>
          )}
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            <option value="available">Available</option>
            <option value="blocked">Blocked</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>

        {/* Note */}
        <div>
          <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
            Note
          </label>
          <textarea
            id="note"
            name="note"
            value={formData.note}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="Optional note about this slot..."
            disabled={isLoading}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? 'Saving...' : (slot ? 'Update Slot' : 'Add Slot')}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AvailabilityEditor;

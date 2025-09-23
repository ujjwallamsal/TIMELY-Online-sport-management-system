// components/VenueAvailability.jsx
import React, { useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast.jsx';
import * as api from '../services/api.js';
import {
  XMarkIcon,
  PlusIcon,
  CalendarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function VenueAvailability({ venue, onClose }) {
  const { show, error: showError, success } = useToast();
  
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [slotForm, setSlotForm] = useState({
    starts_at: '',
    ends_at: '',
    status: 'available',
    reason: ''
  });
  const [slotErrors, setSlotErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Date range for availability query (default to next 30 days)
  const [dateRange, setDateRange] = useState({
    from: new Date().toISOString().split('T')[0],
    to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  useEffect(() => {
    loadAvailability();
  }, [venue.id, dateRange]);

  const loadAvailability = async () => {
    try {
      setLoading(true);
      setError('');
      
      const fromDate = new Date(dateRange.from + 'T00:00:00Z').toISOString();
      const toDate = new Date(dateRange.to + 'T23:59:59Z').toISOString();
      
      const response = await api.getVenueAvailability(venue.id, fromDate, toDate);
      setAvailability(response.data);
    } catch (err) {
      console.error('Error loading availability:', err);
      setError('Failed to load availability data');
      showError('Failed to load availability data');
    } finally {
      setLoading(false);
    }
  };

  const handleSlotChange = (e) => {
    const { name, value } = e.target;
    setSlotForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (slotErrors[name]) {
      setSlotErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateSlotForm = () => {
    const errors = {};

    if (!slotForm.starts_at) {
      errors.starts_at = 'Start time is required';
    }

    if (!slotForm.ends_at) {
      errors.ends_at = 'End time is required';
    }

    if (slotForm.starts_at && slotForm.ends_at) {
      const start = new Date(slotForm.starts_at);
      const end = new Date(slotForm.ends_at);
      
      if (end <= start) {
        errors.ends_at = 'End time must be after start time';
      }
    }

    if (slotForm.status === 'blocked' && !slotForm.reason.trim()) {
      errors.reason = 'Reason is required for blocked slots';
    }

    setSlotErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();
    
    if (!validateSlotForm()) {
      return;
    }

    setSubmitting(true);
    
    try {
      const slotData = {
        starts_at: new Date(slotForm.starts_at).toISOString(),
        ends_at: new Date(slotForm.ends_at).toISOString(),
        status: slotForm.status,
        reason: slotForm.reason
      };

      await api.addVenueSlots(venue.id, [slotData]);
      
      // Reset form and reload availability
      setSlotForm({
        starts_at: '',
        ends_at: '',
        status: 'available',
        reason: ''
      });
      setShowAddSlot(false);
      await loadAvailability();
      success('Slot added successfully');
    } catch (err) {
      console.error('Error adding slot:', err);
      showError('Failed to add slot');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'blocked':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'blocked':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-6xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Venue Availability - {venue.name}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Manage availability slots and view conflicts
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Date Range Selector */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={loadAvailability}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Add Slot Button */}
          <div className="mb-6">
            <button
              onClick={() => setShowAddSlot(true)}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Add Availability Slot
            </button>
          </div>

          {/* Add Slot Form */}
          {showAddSlot && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="text-md font-medium text-gray-900 mb-4">Add New Slot</h4>
              <form onSubmit={handleAddSlot} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time *
                    </label>
                    <input
                      type="datetime-local"
                      name="starts_at"
                      value={slotForm.starts_at}
                      onChange={handleSlotChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        slotErrors.starts_at ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {slotErrors.starts_at && (
                      <p className="mt-1 text-sm text-red-600">{slotErrors.starts_at}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Time *
                    </label>
                    <input
                      type="datetime-local"
                      name="ends_at"
                      value={slotForm.ends_at}
                      onChange={handleSlotChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        slotErrors.ends_at ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {slotErrors.ends_at && (
                      <p className="mt-1 text-sm text-red-600">{slotErrors.ends_at}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      value={slotForm.status}
                      onChange={handleSlotChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="available">Available</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason
                    </label>
                    <input
                      type="text"
                      name="reason"
                      value={slotForm.reason}
                      onChange={handleSlotChange}
                      placeholder="Reason for blocking (if applicable)"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        slotErrors.reason ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {slotErrors.reason && (
                      <p className="mt-1 text-sm text-red-600">{slotErrors.reason}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {submitting ? 'Adding...' : 'Add Slot'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddSlot(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Availability Content */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading availability...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800">{error}</p>
            </div>
          ) : availability ? (
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-md font-medium text-gray-900 mb-2">Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Total Slots:</span>
                    <span className="ml-2 text-gray-600">{availability.total_slots}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Available:</span>
                    <span className="ml-2 text-green-600">{availability.available_slots.length}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Blocked:</span>
                    <span className="ml-2 text-red-600">{availability.blocked_slots.length}</span>
                  </div>
                </div>
              </div>

              {/* Available Slots */}
              {availability.available_slots.length > 0 && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Available Slots</h4>
                  <div className="space-y-2">
                    {availability.available_slots.map((slot) => (
                      <div key={slot.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(slot.status)}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {formatDateTime(slot.starts_at)} - {formatDateTime(slot.ends_at)}
                            </div>
                            <div className="text-sm text-gray-600">
                              Duration: {slot.duration_minutes} minutes
                            </div>
                          </div>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(slot.status)}`}>
                          {slot.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Blocked Slots */}
              {availability.blocked_slots.length > 0 && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Blocked Slots</h4>
                  <div className="space-y-2">
                    {availability.blocked_slots.map((slot) => (
                      <div key={slot.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-md">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(slot.status)}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {formatDateTime(slot.starts_at)} - {formatDateTime(slot.ends_at)}
                            </div>
                            <div className="text-sm text-gray-600">
                              Reason: {slot.reason || 'No reason provided'}
                            </div>
                          </div>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(slot.status)}`}>
                          {slot.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Slots Message */}
              {availability.total_slots === 0 && (
                <div className="text-center py-12">
                  <CalendarIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Slots Found</h3>
                  <p className="text-gray-600">
                    No availability slots found for the selected date range.
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
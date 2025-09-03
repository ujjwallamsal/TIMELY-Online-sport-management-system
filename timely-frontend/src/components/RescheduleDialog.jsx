// components/RescheduleDialog.jsx
import React, { useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast.jsx';
import * as api from '../lib/api';

export default function RescheduleDialog({ match, onClose, onSuccess }) {
  const { show, error: showError, success } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    starts_at: '',
    venue_id: match.venue_id || '',
  });
  const [conflicts, setConflicts] = useState([]);
  const [venues, setVenues] = useState([]);

  // Load venues
  useEffect(() => {
    const loadVenues = async () => {
      try {
        const response = await api.listVenues();
        setVenues(response.data.results || []);
      } catch (err) {
        console.error('Error loading venues:', err);
      }
    };
    loadVenues();
  }, []);

  // Set initial form data
  useEffect(() => {
    if (match.starts_at) {
      const date = new Date(match.starts_at);
      const localDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
      setFormData(prev => ({
        ...prev,
        starts_at: localDateTime.toISOString().slice(0, 16)
      }));
    }
  }, [match.starts_at]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setConflicts([]);

    try {
      // Convert local datetime to ISO string
      const startsAt = new Date(formData.starts_at).toISOString();
      
      const response = await api.rescheduleMatch(match.id, {
        starts_at: startsAt,
        venue_id: formData.venue_id || null
      });

      success('Match rescheduled successfully');
      onSuccess();
    } catch (err) {
      console.error('Error rescheduling match:', err);
      
      if (err.response?.data?.conflicts) {
        setConflicts(err.response.data.conflicts);
        showError('Reschedule conflicts detected');
      } else {
        showError('Failed to reschedule match');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setConflicts([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Reschedule Match
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Match Info */}
          <div className="mb-4 p-3 bg-gray-50 rounded-md">
            <div className="text-sm text-gray-600">
              <div className="font-medium">
                R{match.round_no} M{match.sequence_no}: {match.team_home_detail?.name || 'TBD'} vs {match.team_away_detail?.name || 'TBD'}
              </div>
              <div className="mt-1">
                Current: {match.starts_at ? new Date(match.starts_at).toLocaleString() : 'TBD'}
                {match.venue_detail && ` at ${match.venue_detail.name}`}
              </div>
            </div>
          </div>

          {/* Conflicts */}
          {conflicts.length > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <h4 className="text-sm font-medium text-red-800 mb-2">Conflicts Detected:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                {conflicts.map((conflict, index) => (
                  <li key={index}>• {conflict.message}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="starts_at" className="block text-sm font-medium text-gray-700 mb-1">
                New Start Time *
              </label>
              <input
                type="datetime-local"
                id="starts_at"
                name="starts_at"
                value={formData.starts_at}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="venue_id" className="block text-sm font-medium text-gray-700 mb-1">
                Venue
              </label>
              <select
                id="venue_id"
                name="venue_id"
                value={formData.venue_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select venue (optional)</option>
                {venues.map(venue => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name} {venue.city && `(${venue.city})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Rescheduling...' : 'Reschedule'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

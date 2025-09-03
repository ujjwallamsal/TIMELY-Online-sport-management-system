import React, { useState } from 'react';
import { getFixtureConflicts } from '../lib/api';
import { useToast } from '../hooks/useToast.jsx';

export default function FixtureRow({ fixture, canManage, onReschedule }) {
  const { showError } = useToast();
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(false);

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'TBD';
    return new Date(dateTime).toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'published': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const checkConflicts = async () => {
    try {
      setLoading(true);
      const response = await getFixtureConflicts(fixture.id);
      setConflicts(response.data.conflicts || []);
    } catch (error) {
      showError('Failed to check conflicts');
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async (newData) => {
    try {
      await onReschedule(fixture.id, newData);
      setShowRescheduleDialog(false);
      setConflicts([]);
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  return (
    <>
      <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-2">
              <span className="text-sm font-medium text-gray-500">
                Round {fixture.round_no}
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(fixture.status)}`}>
                {fixture.status}
              </span>
              {conflicts.length > 0 && (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                  {conflicts.length} conflict{conflicts.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="font-medium text-gray-900">
                    {fixture.home_team_name || 'TBD'}
                  </div>
                  <div className="text-sm text-gray-500">Home</div>
                </div>
                
                <div className="text-gray-400 text-2xl font-bold">vs</div>
                
                <div className="text-center">
                  <div className="font-medium text-gray-900">
                    {fixture.away_team_name || 'TBD'}
                  </div>
                  <div className="text-sm text-gray-500">Away</div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {formatDateTime(fixture.starts_at)}
                </div>
                <div className="text-sm text-gray-500">
                  {fixture.venue_name || 'No venue'}
                </div>
              </div>
            </div>
          </div>
          
          {canManage && (
            <div className="ml-4 flex space-x-2">
              <button
                onClick={checkConflicts}
                disabled={loading}
                className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 disabled:opacity-50"
              >
                {loading ? 'Checking...' : 'Check Conflicts'}
              </button>
              <button
                onClick={() => setShowRescheduleDialog(true)}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
              >
                Reschedule
              </button>
            </div>
          )}
        </div>
        
        {/* Conflicts Display */}
        {conflicts.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <h4 className="text-sm font-medium text-red-800 mb-2">Conflicts Detected:</h4>
            <div className="space-y-1">
              {conflicts.map((conflict, index) => (
                <div key={index} className="text-sm text-red-700">
                  <span className="font-medium">{conflict.type}:</span> {conflict.venue_name || 'Unknown venue'} - 
                  {formatDateTime(conflict.starts_at)} to {formatDateTime(conflict.ends_at)}
                  {conflict.reason && ` (${conflict.reason})`}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reschedule Dialog */}
      {showRescheduleDialog && (
        <RescheduleDialog
          fixture={fixture}
          onClose={() => setShowRescheduleDialog(false)}
          onReschedule={handleReschedule}
        />
      )}
    </>
  );
}

// Reschedule Dialog Component
function RescheduleDialog({ fixture, onClose, onReschedule }) {
  const [formData, setFormData] = useState({
    starts_at: fixture.starts_at ? new Date(fixture.starts_at).toISOString().slice(0, 16) : '',
    ends_at: fixture.ends_at ? new Date(fixture.ends_at).toISOString().slice(0, 16) : '',
    venue_id: fixture.venue || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.starts_at || !formData.ends_at) {
      return;
    }

    try {
      setLoading(true);
      await onReschedule({
        starts_at: new Date(formData.starts_at).toISOString(),
        ends_at: new Date(formData.ends_at).toISOString(),
        venue_id: formData.venue_id || null
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Reschedule Fixture</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Time
            </label>
            <input
              type="datetime-local"
              value={formData.starts_at}
              onChange={(e) => setFormData({...formData, starts_at: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Time
            </label>
            <input
              type="datetime-local"
              value={formData.ends_at}
              onChange={(e) => setFormData({...formData, ends_at: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Venue ID (optional)
            </label>
            <input
              type="number"
              value={formData.venue_id}
              onChange={(e) => setFormData({...formData, venue_id: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Leave empty for no venue"
            />
          </div>
          
          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Rescheduling...' : 'Reschedule'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

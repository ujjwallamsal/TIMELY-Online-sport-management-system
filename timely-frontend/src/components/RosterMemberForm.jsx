import React, { useState, useEffect } from 'react';
import { addTeamMember, updateTeamMember } from '../services/api';

const RosterMemberForm = ({ teamId, member, onClose }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    date_of_birth: '',
    position: '',
    jersey_number: '',
    role: 'PLAYER',
    status: 'active',
    can_manage_team: false,
    can_edit_results: false,
    user_id: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [showUserSearch, setShowUserSearch] = useState(false);

  const isEditing = !!member;

  useEffect(() => {
    if (member) {
      setFormData({
        full_name: member.full_name || '',
        date_of_birth: member.date_of_birth || '',
        position: member.position || '',
        jersey_number: member.jersey_number || '',
        role: member.role || 'PLAYER',
        status: member.status || 'active',
        can_manage_team: member.can_manage_team || false,
        can_edit_results: member.can_edit_results || false,
        user_id: member.user?.id || null
      });
    }
  }, [member]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const submitData = {
        ...formData,
        team: teamId,
        user: formData.user_id || null
      };

      // Remove empty fields
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === '' || submitData[key] === null) {
          delete submitData[key];
        }
      });

      if (isEditing) {
        await updateTeamMember(member.id, submitData);
      } else {
        await addTeamMember(teamId, submitData);
      }

      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save member');
      console.error('Error saving member:', err);
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { value: 'PLAYER', label: 'Player' },
    { value: 'COACH', label: 'Coach' },
    { value: 'MANAGER', label: 'Manager' },
    { value: 'CAPTAIN', label: 'Captain' },
    { value: 'ASSISTANT_COACH', label: 'Assistant Coach' },
    { value: 'PHYSIO', label: 'Physiotherapist' },
    { value: 'SUPPORT', label: 'Support Staff' }
  ];

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'injured', label: 'Injured' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {isEditing ? 'Edit Team Member' : 'Add Team Member'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter full name"
                />
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Position */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Position
                </label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Forward, Defender, Goalkeeper"
                />
              </div>

              {/* Jersey Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jersey Number
                </label>
                <input
                  type="number"
                  name="jersey_number"
                  value={formData.jersey_number}
                  onChange={handleInputChange}
                  min="1"
                  max="99"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="1-99"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {roleOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Link to User Account */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Link to User Account (Optional)
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={formData.user_id ? `User ID: ${formData.user_id}` : 'No user linked'}
                  readOnly
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 bg-gray-50"
                  placeholder="No user account linked"
                />
                <button
                  type="button"
                  onClick={() => setShowUserSearch(!showUserSearch)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {formData.user_id ? 'Change' : 'Link User'}
                </button>
              </div>
              {showUserSearch && (
                <div className="mt-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
                  <p className="text-sm text-gray-600 mb-2">
                    User linking functionality would be implemented here.
                    For now, you can manually enter a user ID if needed.
                  </p>
                  <input
                    type="number"
                    placeholder="Enter user ID"
                    value={formData.user_id || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, user_id: e.target.value || null }))}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  />
                </div>
              )}
            </div>

            {/* Permissions */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-4">Permissions</h4>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="can_manage_team"
                    checked={formData.can_manage_team}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Can manage team settings and roster
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="can_edit_results"
                    checked={formData.can_edit_results}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Can edit match results
                  </span>
                </label>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Saving...' : (isEditing ? 'Update Member' : 'Add Member')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RosterMemberForm;

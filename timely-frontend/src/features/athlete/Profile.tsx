import React, { useState, useEffect } from 'react';
import { 
  User, 
  Save,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  Mail,
  Phone,
  MapPin,
  Calendar
} from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../api/client';
import { ENDPOINTS } from '../../api/ENDPOINTS';
import { formatDateTime } from '../../utils/date';

const AthleteProfile: React.FC = () => {
  const { user, refetchUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    // Add other editable fields as needed
  });
  const { showSuccess, showError } = useToast();

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setProfileForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const handleSaveProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Update profile via PATCH /api/me/
      await api.patch(ENDPOINTS.me, profileForm);
      
      // Send notification about profile update
      try {
        await api.post(ENDPOINTS.notifications, {
          type: 'profile_update',
          message: `Profile updated at ${new Date().toLocaleTimeString()}`,
          user: user?.id,
        });
      } catch (notificationError) {
        console.warn('Failed to send notification:', notificationError);
        // Don't fail the profile update if notification fails
      }

      showSuccess('Profile Updated', 'Your profile has been successfully updated.');
      setIsEditing(false);
      
      // Refetch user data to get latest info
      refetchUser();
    } catch (error) {
      console.error('Profile update error:', error);
      setError('Failed to update profile. Please try again.');
      showError('Update Failed', 'Failed to update your profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original user data
    if (user) {
      setProfileForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
      });
    }
    setIsEditing(false);
    setError(null);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card">
            <div className="text-center py-12">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Profile</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => setError(null)}
                className="btn btn-primary inline-flex items-center"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </button>
            </div>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
              <p className="text-gray-600 mt-2">Manage your personal information and settings</p>
            </div>
            <div className="flex space-x-3">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancel}
                    className="btn btn-outline"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={isLoading}
                    className="btn btn-primary inline-flex items-center"
                  >
                    {isLoading ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn btn-primary inline-flex items-center"
                >
                  <User className="h-4 w-4 mr-2" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Personal Information</h3>
              
              <div className="space-y-6">
                {/* Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">First Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profileForm.first_name}
                        onChange={(e) => setProfileForm({...profileForm, first_name: e.target.value})}
                        className="form-input"
                        placeholder="Enter your first name"
                      />
                    ) : (
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <User className="h-5 w-5 text-gray-400 mr-3" />
                        <span className="text-gray-900">{user?.first_name || 'Not provided'}</span>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="form-label">Last Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profileForm.last_name}
                        onChange={(e) => setProfileForm({...profileForm, last_name: e.target.value})}
                        className="form-input"
                        placeholder="Enter your last name"
                      />
                    ) : (
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <User className="h-5 w-5 text-gray-400 mr-3" />
                        <span className="text-gray-900">{user?.last_name || 'Not provided'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="form-label">Email Address</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                      className="form-input"
                      placeholder="Enter your email address"
                    />
                  ) : (
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <Mail className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-gray-900">{user?.email || 'Not provided'}</span>
                    </div>
                  )}
                </div>

                {/* Role */}
                <div>
                  <label className="form-label">Role</label>
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-gray-900 capitalize">{user?.role || 'Not assigned'}</span>
                  </div>
                </div>

                {/* Account Status */}
                <div>
                  <label className="form-label">Account Status</label>
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <div className={`w-3 h-3 rounded-full mr-3 ${user?.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-gray-900">{user?.is_active ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Account Summary */}
          <div className="lg:col-span-1">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Summary</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Member Since</span>
                  <span className="text-sm font-medium text-gray-900">
                    {user?.date_joined ? formatDateTime(user.date_joined) : 'Unknown'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">User ID</span>
                  <span className="text-sm font-medium text-gray-900">#{user?.id || 'Unknown'}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Role</span>
                  <span className="text-sm font-medium text-gray-900 capitalize">{user?.role || 'Unknown'}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                <button className="w-full flex items-center p-3 text-left rounded-lg hover:bg-gray-50 transition-colors">
                  <Calendar className="h-5 w-5 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">View My Events</p>
                    <p className="text-xs text-gray-500">See all your registered events</p>
                  </div>
                </button>
                
                <button className="w-full flex items-center p-3 text-left rounded-lg hover:bg-gray-50 transition-colors">
                  <User className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">My Results</p>
                    <p className="text-xs text-gray-500">View your match results</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AthleteProfile;

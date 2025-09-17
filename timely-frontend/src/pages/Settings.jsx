import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import { 
  updateProfile, 
  changePassword 
} from '../services/api';
import { 
  UserIcon,
  LockClosedIcon,
  BellIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  CogIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    date_of_birth: '',
    address: '',
    bio: '',
    website: ''
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    new_password_confirm: ''
  });

  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    event_reminders: true,
    result_updates: true,
    marketing_emails: false
  });

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone_number: user.phone_number || '',
        date_of_birth: user.date_of_birth || '',
        address: user.address || '',
        bio: user.bio || '',
        website: user.website || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setNotificationSettings(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setMessage('');

      await updateProfile(formData);
      await refreshUser();
      setMessage('Profile updated successfully!');

    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.detail || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setMessage('');

      if (passwordData.new_password !== passwordData.new_password_confirm) {
        setError('New passwords do not match.');
        return;
      }

      await changePassword({
        old_password: passwordData.current_password,
        new_password: passwordData.new_password
      });

      setMessage('Password changed successfully!');
      setPasswordData({
        current_password: '',
        new_password: '',
        new_password_confirm: ''
      });

    } catch (err) {
      console.error('Error changing password:', err);
      setError(err.response?.data?.detail || 'Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading settings...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm mb-8">
          <div className="p-8">
            <div className="flex items-center space-x-6">
              <div className="h-20 w-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-3xl text-white font-bold">
                  {user.first_name?.[0] || user.email[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Settings</h1>
                <p className="text-xl text-gray-600 mb-4">Manage your account preferences and security</p>
                <div className="flex items-center space-x-3">
                  <Badge variant={user.email_verified ? 'success' : 'warning'} className="flex items-center gap-1">
                    {user.email_verified ? (
                      <CheckCircleIcon className="w-4 h-4" />
                    ) : (
                      <ExclamationTriangleIcon className="w-4 h-4" />
                    )}
                    {user.email_verified ? 'Verified' : 'Unverified'}
                  </Badge>
                  <Badge variant="info" className="flex items-center gap-1">
                    <ShieldCheckIcon className="w-4 h-4" />
                    {user.role}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'profile'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <UserIcon className="w-5 h-5" />
                Profile
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'security'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <LockClosedIcon className="w-5 h-5" />
                Security
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'notifications'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BellIcon className="w-5 h-5" />
                Notifications
              </button>
            </nav>
          </div>

          <div className="p-8">
            {/* Messages */}
            {message && (
              <Card className="mb-6 border-green-200 bg-green-50">
                <div className="p-4 flex items-center">
                  <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3" />
                  <p className="text-green-700 font-medium">{message}</p>
                </div>
              </Card>
            )}

            {error && (
              <Card className="mb-6 border-red-200 bg-red-50">
                <div className="p-4 flex items-center">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-3" />
                  <p className="text-red-700 font-medium">{error}</p>
                </div>
              </Card>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="first_name" className="block text-sm font-semibold text-gray-700 mb-2">
                      First Name *
                    </label>
                    <Input
                      id="first_name"
                      name="first_name"
                      type="text"
                      required
                      value={formData.first_name}
                      onChange={handleChange}
                      icon={UserIcon}
                    />
                  </div>
                  <div>
                    <label htmlFor="last_name" className="block text-sm font-semibold text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <Input
                      id="last_name"
                      name="last_name"
                      type="text"
                      required
                      value={formData.last_name}
                      onChange={handleChange}
                      icon={UserIcon}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="bio" className="block text-sm font-semibold text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows={4}
                    value={formData.bio}
                    onChange={handleChange}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div className="pt-6">
                  <Button 
                    type="submit" 
                    variant="primary"
                    size="lg"
                    loading={loading}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <PencilIcon className="w-5 h-5 mr-2" />
                    {loading ? 'Updating...' : 'Update Profile'}
                  </Button>
                </div>
              </form>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <form onSubmit={handlePasswordSubmit} className="space-y-8">
                <div>
                  <label htmlFor="current_password" className="block text-sm font-semibold text-gray-700 mb-2">
                    Current Password *
                  </label>
                  <Input
                    id="current_password"
                    name="current_password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={passwordData.current_password}
                    onChange={handlePasswordChange}
                    icon={LockClosedIcon}
                  />
                </div>
                    
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="new_password" className="block text-sm font-semibold text-gray-700 mb-2">
                      New Password *
                    </label>
                    <Input
                      id="new_password"
                      name="new_password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      value={passwordData.new_password}
                      onChange={handlePasswordChange}
                      placeholder="Minimum 8 characters"
                      icon={LockClosedIcon}
                    />
                  </div>
                  <div>
                    <label htmlFor="new_password_confirm" className="block text-sm font-semibold text-gray-700 mb-2">
                      Confirm New Password *
                    </label>
                    <Input
                      id="new_password_confirm"
                      name="new_password_confirm"
                      type={showPassword ? "text" : "password"}
                      required
                      value={passwordData.new_password_confirm}
                      onChange={handlePasswordChange}
                      placeholder="Confirm new password"
                      icon={LockClosedIcon}
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    id="show_password"
                    name="show_password"
                    type="checkbox"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="show_password" className="ml-2 block text-sm text-gray-700">
                    Show passwords
                  </label>
                </div>

                <div className="pt-6">
                  <Button 
                    type="submit"
                    variant="danger"
                    size="lg"
                    loading={loading}
                  >
                    <LockClosedIcon className="w-5 h-5 mr-2" />
                    {loading ? 'Changing...' : 'Change Password'}
                  </Button>
                </div>
              </form>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Email Notifications</h3>
                      <p className="text-sm text-gray-600">Receive important updates via email</p>
                    </div>
                    <input
                      type="checkbox"
                      name="email_notifications"
                      checked={notificationSettings.email_notifications}
                      onChange={handleNotificationChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Event Reminders</h3>
                      <p className="text-sm text-gray-600">Get reminded about upcoming events</p>
                    </div>
                    <input
                      type="checkbox"
                      name="event_reminders"
                      checked={notificationSettings.event_reminders}
                      onChange={handleNotificationChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Result Updates</h3>
                      <p className="text-sm text-gray-600">Be notified when results are published</p>
                    </div>
                    <input
                      type="checkbox"
                      name="result_updates"
                      checked={notificationSettings.result_updates}
                      onChange={handleNotificationChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Marketing Emails</h3>
                      <p className="text-sm text-gray-600">Receive promotional content and updates</p>
                    </div>
                    <input
                      type="checkbox"
                      name="marketing_emails"
                      checked={notificationSettings.marketing_emails}
                      onChange={handleNotificationChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                </div>

                <div className="pt-6">
                  <Button 
                    type="button"
                    variant="primary"
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <BellIcon className="w-5 h-5 mr-2" />
                    Save Preferences
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

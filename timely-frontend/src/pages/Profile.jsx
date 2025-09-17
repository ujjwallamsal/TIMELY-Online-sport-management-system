import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import { updateProfile, changePassword } from '../services/api';
import { 
  UserIcon, 
  LockClosedIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  PencilIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    date_of_birth: "",
    address: "",
    city: "",
    state: "",
    postal_code: "",
    country: "Australia",
    bio: "",
    website: ""
  });
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    new_password_confirm: ""
  });
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        phone_number: user.phone_number || "",
        date_of_birth: user.date_of_birth || "",
        address: user.address || "",
        city: user.city || "",
        state: user.state || "",
        postal_code: user.postal_code || "",
        country: user.country || "Australia",
        bio: user.bio || "",
        website: user.website || ""
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await updateProfile(formData);
      await refreshUser();
      setMessage('Profile updated successfully!');
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setError('');
    setMessage('');

    if (passwordData.new_password !== passwordData.new_password_confirm) {
      setError('New passwords don\'t match');
      setPasswordLoading(false);
      return;
    }

    if (passwordData.new_password.length < 8) {
      setError('New password must be at least 8 characters long');
      setPasswordLoading(false);
      return;
    }

    try {
      await changePassword(passwordData);
      setMessage('Password changed successfully!');
      setPasswordData({
        current_password: '',
        new_password: '',
        new_password_confirm: ''
      });
    } catch (err) {
      setError(err.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading profile...</p>
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
                <h1 className="text-4xl font-bold text-gray-900 mb-2">{user.display_name}</h1>
                <p className="text-xl text-gray-600 mb-4">{user.email}</p>
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
                Profile Information
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'password'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <LockClosedIcon className="w-5 h-5" />
                Change Password
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
                  <label htmlFor="phone_number" className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <Input
                    id="phone_number"
                    name="phone_number"
                    type="tel"
                    value={formData.phone_number}
                    onChange={handleChange}
                    placeholder="+61 400 000 000"
                    icon={PhoneIcon}
                  />
                </div>

                <div>
                  <label htmlFor="date_of_birth" className="block text-sm font-semibold text-gray-700 mb-2">
                    Date of Birth
                  </label>
                  <Input
                    id="date_of_birth"
                    name="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    icon={CalendarIcon}
                  />
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    rows={3}
                    value={formData.address}
                    onChange={handleChange}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="Street address"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="city" className="block text-sm font-semibold text-gray-700 mb-2">
                      City
                    </label>
                      <input
                      id="city"
                      name="city"
                        type="text"
                      value={formData.city}
                      onChange={handleChange}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      />
                    </div>
                    <div>
                    <label htmlFor="state" className="block text-sm font-semibold text-gray-700 mb-2">
                      State
                    </label>
                      <input
                      id="state"
                      name="state"
                        type="text"
                      value={formData.state}
                      onChange={handleChange}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      />
                    </div>
                    <div>
                    <label htmlFor="postal_code" className="block text-sm font-semibold text-gray-700 mb-2">
                      Postal Code
                    </label>
                      <input
                      id="postal_code"
                      name="postal_code"
                        type="text"
                      value={formData.postal_code}
                      onChange={handleChange}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="country" className="block text-sm font-semibold text-gray-700 mb-2">
                    Country
                  </label>
                  <select
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  >
                    <option value="Australia">Australia</option>
                    <option value="New Zealand">New Zealand</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Canada">Canada</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="bio" className="block text-sm font-semibold text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows={4}
                    maxLength={500}
                    value={formData.bio}
                    onChange={handleChange}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="Tell us about yourself..."
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    {formData.bio.length}/500 characters
                  </p>
                </div>

                <div>
                  <label htmlFor="website" className="block text-sm font-semibold text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    id="website"
                    name="website"
                    type="url"
                    value={formData.website}
                    onChange={handleChange}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="https://example.com"
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

            {/* Password Tab */}
            {activeTab === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="space-y-8">
                <div>
                  <label htmlFor="current_password" className="block text-sm font-semibold text-gray-700 mb-2">
                    Current Password *
                  </label>
                  <Input
                    id="current_password"
                    name="current_password"
                    type="password"
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
                      type="password"
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
                      type="password"
                      required
                      value={passwordData.new_password_confirm}
                      onChange={handlePasswordChange}
                      placeholder="Confirm new password"
                      icon={LockClosedIcon}
                    />
                  </div>
                </div>

                <div className="pt-6">
                  <Button 
                    type="submit"
                    variant="danger"
                    size="lg"
                    loading={passwordLoading}
                  >
                    <LockClosedIcon className="w-5 h-5 mr-2" />
                    {passwordLoading ? 'Changing...' : 'Change Password'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

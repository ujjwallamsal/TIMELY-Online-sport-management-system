import { useState, useEffect } from 'react';
import { getMe, updateProfile, changePassword } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';

export default function Profile() {
  const { user, logout, refreshUser } = useAuth();
  const { connected } = useWebSocket(); // Real-time updates
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [pwdForm, setPwdForm] = useState({ current_password: '', new_password: '', new_password_confirm: '' });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      const data = await getMe();
      setProfile(data);
      setFormData({
        first_name: data.first_name || '',
        last_name: data.last_name || ''
      });
    } catch (e) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setSaving(true);
      await updateProfile(formData);
      await refreshUser(); // Update auth context
      await loadProfile();
      setEditMode(false);
    } catch (e) {
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-xl rounded-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-20 w-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">
                    {profile?.first_name?.[0] || profile?.email?.[0] || 'U'}
                  </span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">
                    {profile?.first_name && profile?.last_name 
                      ? `${profile.first_name} ${profile.last_name}`
                      : 'My Profile'
                    }
                  </h1>
                  <p className="text-blue-100 mt-1">{profile?.email}</p>
                </div>
              </div>
              
              {/* WebSocket Connection Status */}
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className="text-blue-100 text-sm">
                  {connected ? 'Live updates enabled' : 'Offline mode'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600">{error}</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Profile Information */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h3>
                
                {editMode ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={profile.email}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                      <input
                        type="text"
                        value={formData.first_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                      <input
                        type="text"
                        value={formData.last_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                      <input
                        type="text"
                        value={profile.role}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button 
                        type="submit" 
                        disabled={saving} 
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors duration-200"
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setEditMode(false)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-500">Email</span>
                      <span className="text-gray-900">{profile.email}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-500">First Name</span>
                      <span className="text-gray-900">{profile.first_name || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-500">Last Name</span>
                      <span className="text-gray-900">{profile.last_name || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-500">Role</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {profile.role}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-500">Member Since</span>
                      <span className="text-gray-900">
                        {new Date(profile.date_joined).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-500">Email Verified</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        profile.email_verified 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {profile.email_verified ? 'Verified' : 'Pending'}
                      </span>
                    </div>
                    
                    <button 
                      onClick={() => setEditMode(true)} 
                      className="w-full mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                    >
                      Edit Profile
                    </button>
                  </div>
                )}
              </div>

              {/* Account Actions */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Account Actions</h3>
                <div className="space-y-3">
                  <details className="w-full bg-gray-50 rounded-lg p-3">
                    <summary className="cursor-pointer text-gray-800">Change Password</summary>
                    <form className="mt-3 space-y-3" onSubmit={async (e)=>{e.preventDefault(); setPwdLoading(true); setError(''); try{ await changePassword(pwdForm); setPwdForm({ current_password:'', new_password:'', new_password_confirm:''}); } catch(err){ setError(err.message||'Password change failed'); } finally{ setPwdLoading(false); }}}>
                      <input type="password" placeholder="Current password" value={pwdForm.current_password} onChange={(e)=>setPwdForm(p=>({...p,current_password:e.target.value}))} className="w-full px-3 py-2 border rounded" required />
                      <input type="password" placeholder="New password" value={pwdForm.new_password} onChange={(e)=>setPwdForm(p=>({...p,new_password:e.target.value}))} className="w-full px-3 py-2 border rounded" required />
                      <input type="password" placeholder="Confirm new password" value={pwdForm.new_password_confirm} onChange={(e)=>setPwdForm(p=>({...p,new_password_confirm:e.target.value}))} className="w-full px-3 py-2 border rounded" required />
                      <button type="submit" disabled={pwdLoading} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">{pwdLoading?'Updating...':'Update Password'}</button>
                    </form>
                  </details>
                  <button className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200">
                    Email Preferences
                  </button>
                  <button 
                    onClick={logout} 
                    className="w-full px-4 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
                  >
                    Sign Out
                  </button>
                </div>

                {/* Role Information */}
                <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Your Role: {profile.role}</h4>
                  <p className="text-sm text-blue-700">
                    {profile.role === 'ADMIN' && 'Full system access and user management'}
                    {profile.role === 'ORGANIZER' && 'Create and manage sports events'}
                    {profile.role === 'ATHLETE' && 'Participate in sports events and competitions'}
                    {profile.role === 'COACH' && 'Train athletes and manage team registrations'}
                    {profile.role === 'SPECTATOR' && 'Browse events and purchase tickets'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

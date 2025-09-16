import React, { useState, useEffect } from 'react';
import { 
  getSiteSettings, 
  updateSiteSettings, 
  toggleMaintenanceMode,
  getSystemStatus,
  getAdminFeatureFlags,
  createFeatureFlag,
  updateFeatureFlag,
  deleteFeatureFlag
} from '../lib/api';
import { useAuth } from '../context/AuthContext';

const AdminSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [featureFlags, setFeatureFlags] = useState([]);
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [settingsResponse, flagsResponse, statusResponse] = await Promise.all([
        getSiteSettings(),
        getAdminFeatureFlags(),
        getSystemStatus()
      ]);
      setSettings(settingsResponse.data);
      setFeatureFlags(flagsResponse.data);
      setSystemStatus(statusResponse.data);
    } catch (err) {
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (updatedSettings) => {
    try {
      setLoading(true);
      await updateSiteSettings(updatedSettings);
      setSettings(updatedSettings);
      setSuccess('Settings saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMaintenance = async () => {
    try {
      setLoading(true);
      const response = await toggleMaintenanceMode();
      setSettings(prev => ({
        ...prev,
        maintenance_mode: response.data.maintenance_mode
      }));
      setSuccess(response.data.message);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to toggle maintenance mode');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFeatureFlag = async (flagData) => {
    try {
      setLoading(true);
      const response = await createFeatureFlag(flagData);
      setFeatureFlags(prev => [...prev, response.data]);
      setSuccess('Feature flag created successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to create feature flag');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFeatureFlag = async (flagId, flagData) => {
    try {
      setLoading(true);
      const response = await updateFeatureFlag(flagId, flagData);
      setFeatureFlags(prev => prev.map(flag => 
        flag.id === flagId ? response.data : flag
      ));
      setSuccess('Feature flag updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update feature flag');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFeatureFlag = async (flagId) => {
    try {
      setLoading(true);
      await deleteFeatureFlag(flagId);
      setFeatureFlags(prev => prev.filter(flag => flag.id !== flagId));
      setSuccess('Feature flag deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to delete feature flag');
    } finally {
      setLoading(false);
    }
  };

  if (!user?.is_staff) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading && !settings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
          <p className="mt-2 text-gray-600">Manage site settings and feature flags</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-green-800">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Site Settings */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Site Settings</h2>
            </div>
            <div className="p-6">
              {settings && (
                <SiteSettingsForm 
                  settings={settings} 
                  onSave={handleSaveSettings}
                  onToggleMaintenance={handleToggleMaintenance}
                  loading={loading}
                />
              )}
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">System Status</h2>
            </div>
            <div className="p-6">
              {systemStatus && (
                <SystemStatusDisplay status={systemStatus} />
              )}
            </div>
          </div>
        </div>

        {/* Feature Flags */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Feature Flags</h2>
              <button
                onClick={() => setShowCreateFlag(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create Flag
              </button>
            </div>
          </div>
          <div className="p-6">
            <FeatureFlagsList 
              flags={featureFlags}
              onUpdate={handleUpdateFeatureFlag}
              onDelete={handleDeleteFeatureFlag}
              loading={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const SiteSettingsForm = ({ settings, onSave, onToggleMaintenance, loading }) => {
  const [formData, setFormData] = useState(settings);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">Site Name</label>
        <input
          type="text"
          value={formData.site_name}
          onChange={(e) => handleChange('site_name', e.target.value)}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Support Email</label>
        <input
          type="email"
          value={formData.support_email}
          onChange={(e) => handleChange('support_email', e.target.value)}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Primary Color</label>
        <input
          type="color"
          value={formData.primary_color}
          onChange={(e) => handleChange('primary_color', e.target.value)}
          className="mt-1 block w-20 h-10 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="maintenance_mode"
          checked={formData.maintenance_mode}
          onChange={(e) => handleChange('maintenance_mode', e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="maintenance_mode" className="ml-2 block text-sm text-gray-900">
          Maintenance Mode
        </label>
      </div>

      <div className="flex space-x-4">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Save Settings
        </button>
        <button
          type="button"
          onClick={onToggleMaintenance}
          disabled={loading}
          className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
        >
          Toggle Maintenance
        </button>
      </div>
    </form>
  );
};

const SystemStatusDisplay = ({ status }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-green-50 p-4 rounded-lg">
        <h3 className="font-medium text-green-900">Database</h3>
        <p className="text-sm text-green-700">{status.database}</p>
      </div>
      <div className="bg-green-50 p-4 rounded-lg">
        <h3 className="font-medium text-green-900">Cache</h3>
        <p className="text-sm text-green-700">{status.cache}</p>
      </div>
    </div>
    
    <div className="grid grid-cols-2 gap-4">
      <div>
        <h3 className="font-medium text-gray-900">Users</h3>
        <p className="text-2xl font-bold text-blue-600">{status.stats.total_users}</p>
      </div>
      <div>
        <h3 className="font-medium text-gray-900">Events</h3>
        <p className="text-2xl font-bold text-blue-600">{status.stats.total_events}</p>
      </div>
    </div>
  </div>
);

const FeatureFlagsList = ({ flags, onUpdate, onDelete, loading }) => (
  <div className="space-y-4">
    {flags.map((flag) => (
      <div key={flag.id} className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900">{flag.name}</h3>
            <p className="text-sm text-gray-600">{flag.description}</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              flag.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {flag.enabled ? 'Enabled' : 'Disabled'}
            </span>
            <button
              onClick={() => onUpdate(flag.id, { ...flag, enabled: !flag.enabled })}
              disabled={loading}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Toggle
            </button>
            <button
              onClick={() => onDelete(flag.id)}
              disabled={loading}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    ))}
    {flags.length === 0 && (
      <p className="text-gray-500 text-center py-4">No feature flags found</p>
    )}
  </div>
);

export default AdminSettings;

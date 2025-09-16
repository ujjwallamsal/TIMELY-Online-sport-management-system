// src/pages/admin/SettingsManage.jsx
import React, { useState, useEffect } from 'react';
import { 
  Save,
  Globe,
  Mail,
  Clock,
  Shield,
  Settings as SettingsIcon
} from 'lucide-react';

const SettingsManage = () => {
  const [settings, setSettings] = useState({
    timezone: 'Australia/Sydney',
    emailSender: 'noreply@timely.com',
    emailFrom: 'Timely Sports Management',
    jwtExpiry: 60,
    defaultFixtureLength: 90,
    defaultRRSettings: {
      pointsForWin: 3,
      pointsForDraw: 1,
      pointsForLoss: 0
    },
    defaultKOSettings: {
      extraTime: true,
      penalties: true
    }
  });

  const [rolePermissions, setRolePermissions] = useState({
    ADMIN: {
      read: true,
      write: true,
      manageUsers: true,
      manageEvents: true,
      manageFixtures: true,
      manageResults: true,
      viewReports: true
    },
    ORGANIZER: {
      read: true,
      write: true,
      manageUsers: false,
      manageEvents: true,
      manageFixtures: true,
      manageResults: true,
      viewReports: true
    },
    COACH: {
      read: true,
      write: true,
      manageUsers: false,
      manageEvents: false,
      manageFixtures: false,
      manageResults: false,
      viewReports: false
    },
    ATHLETE: {
      read: true,
      write: true,
      manageUsers: false,
      manageEvents: false,
      manageFixtures: false,
      manageResults: false,
      viewReports: false
    },
    SPECTATOR: {
      read: true,
      write: false,
      manageUsers: false,
      manageEvents: false,
      manageFixtures: false,
      manageResults: false,
      viewReports: false
    }
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // Mock data - replace with actual API call
      console.log('Fetching settings...');
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSaveSettings = async () => {
    try {
      // API call to save settings
      console.log('Saving settings:', settings);
      // Show success message
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleSavePermissions = async () => {
    try {
      // API call to save role permissions
      console.log('Saving role permissions:', rolePermissions);
      // Show success message
    } catch (error) {
      console.error('Error saving permissions:', error);
    }
  };

  const updateRolePermission = (role, permission, value) => {
    setRolePermissions(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [permission]: value
      }
    }));
  };

  const PermissionMatrix = () => (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Role → Permission Matrix</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Read
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Write
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Manage Users
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Manage Events
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Manage Fixtures
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Manage Results
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                View Reports
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Object.entries(rolePermissions).map(([role, permissions]) => (
              <tr key={role}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {role}
                </td>
                {Object.entries(permissions).map(([permission, value]) => (
                  <td key={permission} className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => updateRolePermission(role, permission, e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          onClick={handleSavePermissions}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Permissions
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <button
          onClick={handleSaveSettings}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </button>
      </div>

      {/* System Settings */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">System Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Globe className="h-4 w-4 inline mr-1" />
              Time Zone
            </label>
            <select
              value={settings.timezone}
              onChange={(e) => setSettings(prev => ({ ...prev, timezone: e.target.value }))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Australia/Sydney">Australia/Sydney</option>
              <option value="Australia/Melbourne">Australia/Melbourne</option>
              <option value="Australia/Brisbane">Australia/Brisbane</option>
              <option value="Australia/Perth">Australia/Perth</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="h-4 w-4 inline mr-1" />
              JWT Expiry (minutes)
            </label>
            <input
              type="number"
              value={settings.jwtExpiry}
              onChange={(e) => setSettings(prev => ({ ...prev, jwtExpiry: parseInt(e.target.value) }))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Email Settings */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Email Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="h-4 w-4 inline mr-1" />
              Email Sender
            </label>
            <input
              type="email"
              value={settings.emailSender}
              onChange={(e) => setSettings(prev => ({ ...prev, emailSender: e.target.value }))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="h-4 w-4 inline mr-1" />
              Email From Name
            </label>
            <input
              type="text"
              value={settings.emailFrom}
              onChange={(e) => setSettings(prev => ({ ...prev, emailFrom: e.target.value }))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Default Event Parameters */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Default Event Parameters</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Fixture Length (minutes)
            </label>
            <input
              type="number"
              value={settings.defaultFixtureLength}
              onChange={(e) => setSettings(prev => ({ ...prev, defaultFixtureLength: parseInt(e.target.value) }))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div className="mt-6">
          <h4 className="text-md font-medium text-gray-900 mb-3">Round Robin Settings</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Points for Win
              </label>
              <input
                type="number"
                value={settings.defaultRRSettings.pointsForWin}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  defaultRRSettings: { 
                    ...prev.defaultRRSettings, 
                    pointsForWin: parseInt(e.target.value) 
                  }
                }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Points for Draw
              </label>
              <input
                type="number"
                value={settings.defaultRRSettings.pointsForDraw}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  defaultRRSettings: { 
                    ...prev.defaultRRSettings, 
                    pointsForDraw: parseInt(e.target.value) 
                  }
                }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Points for Loss
              </label>
              <input
                type="number"
                value={settings.defaultRRSettings.pointsForLoss}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  defaultRRSettings: { 
                    ...prev.defaultRRSettings, 
                    pointsForLoss: parseInt(e.target.value) 
                  }
                }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <h4 className="text-md font-medium text-gray-900 mb-3">Knockout Settings</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="extraTime"
                checked={settings.defaultKOSettings.extraTime}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  defaultKOSettings: { 
                    ...prev.defaultKOSettings, 
                    extraTime: e.target.checked 
                  }
                }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="extraTime" className="ml-2 block text-sm text-gray-900">
                Extra Time
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="penalties"
                checked={settings.defaultKOSettings.penalties}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  defaultKOSettings: { 
                    ...prev.defaultKOSettings, 
                    penalties: e.target.checked 
                  }
                }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="penalties" className="ml-2 block text-sm text-gray-900">
                Penalties
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Role Permissions */}
      <PermissionMatrix />
    </div>
  );
};

export default SettingsManage;

import React, { useState, useEffect } from 'react';
import { 
  requestDataExport, 
  getExportStatus, 
  downloadExport, 
  getUserExports,
  requestDataDeletion, 
  getDeletionStatus, 
  getUserDeletions
} from '../../services/api.js';
import { useAuth } from '../context/AuthContext';

const PrivacyCenter = () => {
  const { user } = useAuth();
  const [exports, setExports] = useState([]);
  const [deletions, setDeletions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [exportsResponse, deletionsResponse] = await Promise.all([
        getUserExports(),
        getUserDeletions()
      ]);
      setExports(exportsResponse.data.exports);
      setDeletions(deletionsResponse.data.deletions);
    } catch (err) {
      setError('Failed to load privacy data');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestExport = async () => {
    try {
      setLoading(true);
      const response = await requestDataExport();
      setSuccess('Data export requested successfully');
      setTimeout(() => setSuccess(null), 3000);
      await loadData();
    } catch (err) {
      setError('Failed to request data export');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExport = async (requestId) => {
    try {
      const response = await downloadExport(requestId);
      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user_data_${requestId}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to download export');
    }
  };

  const handleRequestDeletion = async (reason, confirmationText) => {
    try {
      setLoading(true);
      const response = await requestDataDeletion(reason, confirmationText);
      setSuccess('Data deletion request submitted for admin review');
      setTimeout(() => setSuccess(null), 3000);
      await loadData();
    } catch (err) {
      setError('Failed to request data deletion');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Privacy Center</h1>
          <p className="mt-2 text-gray-600">Manage your personal data and privacy settings</p>
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
          {/* Data Export */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Data Export</h2>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">
                  Download a copy of all your personal data stored in our system. 
                  This includes your profile, registrations, tickets, and activity history.
                </p>
                <button
                  onClick={handleRequestExport}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Request Data Export
                </button>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Export History</h3>
                {exports.map((exportItem) => (
                  <div key={exportItem.request_id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        Export #{exportItem.request_id.slice(0, 8)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(exportItem.status)}`}>
                        {exportItem.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      <p>Created: {new Date(exportItem.created_at).toLocaleDateString()}</p>
                      {exportItem.file_size && (
                        <p>Size: {(exportItem.file_size / 1024 / 1024).toFixed(2)} MB</p>
                      )}
                    </div>
                    {exportItem.can_download && (
                      <button
                        onClick={() => handleDownloadExport(exportItem.request_id)}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Download
                      </button>
                    )}
                  </div>
                ))}
                {exports.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No exports found</p>
                )}
              </div>
            </div>
          </div>

          {/* Data Deletion */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Data Deletion</h2>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">
                  Request deletion of your personal data. This action is irreversible 
                  and will remove all your data from our system.
                </p>
                <DataDeletionForm onSubmit={handleRequestDeletion} loading={loading} />
              </div>

              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Deletion Requests</h3>
                {deletions.map((deletion) => (
                  <div key={deletion.request_id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        Request #{deletion.request_id.slice(0, 8)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(deletion.status)}`}>
                        {deletion.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      <p>Reason: {deletion.reason}</p>
                      <p>Created: {new Date(deletion.created_at).toLocaleDateString()}</p>
                      {deletion.admin_notes && (
                        <p>Admin Notes: {deletion.admin_notes}</p>
                      )}
                    </div>
                  </div>
                ))}
                {deletions.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No deletion requests found</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Information */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Privacy Information</h2>
          </div>
          <div className="p-6">
            <div className="prose max-w-none">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Your Rights</h3>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                <li>Right to access: You can request a copy of all your personal data</li>
                <li>Right to rectification: You can update or correct your personal data</li>
                <li>Right to erasure: You can request deletion of your personal data</li>
                <li>Right to portability: You can export your data in a machine-readable format</li>
                <li>Right to restrict processing: You can limit how we use your data</li>
              </ul>
              
              <h3 className="text-lg font-medium text-gray-900 mb-4 mt-6">Data Retention</h3>
              <p className="text-sm text-gray-600">
                We retain your personal data for as long as necessary to provide our services 
                and comply with legal obligations. Data is typically retained for 12 months 
                after account closure, unless you request earlier deletion.
              </p>
              
              <h3 className="text-lg font-medium text-gray-900 mb-4 mt-6">Contact</h3>
              <p className="text-sm text-gray-600">
                For privacy concerns or questions about your data, please contact us at{' '}
                <a href="mailto:privacy@timelyevents.com" className="text-blue-600 hover:text-blue-500">
                  privacy@timelyevents.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DataDeletionForm = ({ onSubmit, loading }) => {
  const [reason, setReason] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (confirmation === 'DELETE MY DATA') {
      onSubmit(reason, confirmation);
      setReason('');
      setConfirmation('');
      setShowForm(false);
    } else {
      alert('Please type "DELETE MY DATA" exactly as shown');
    }
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Request Data Deletion
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Reason for deletion
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
          rows={3}
          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="Please explain why you want to delete your data..."
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Type "DELETE MY DATA" to confirm
        </label>
        <input
          type="text"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          required
          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="DELETE MY DATA"
        />
      </div>
      
      <div className="flex space-x-2">
        <button
          type="submit"
          disabled={loading || confirmation !== 'DELETE MY DATA'}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
        >
          Submit Deletion Request
        </button>
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default PrivacyCenter;

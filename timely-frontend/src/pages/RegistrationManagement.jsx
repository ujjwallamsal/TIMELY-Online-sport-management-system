import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  getEventRegistrations, 
  approveRegistration, 
  rejectRegistration,
  getDocuments,
  approveDocument,
  rejectDocument,
  downloadDocument
} from '../../services/api.js';

export default function RegistrationManagement() {
  const { eventId } = useParams();
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [showDocuments, setShowDocuments] = useState(false);

  useEffect(() => {
    if (eventId) {
      loadRegistrations();
    }
  }, [eventId]);

  async function loadRegistrations() {
    try {
      setLoading(true);
      const data = await getEventRegistrations(eventId);
      setRegistrations(data || []);
    } catch (err) {
      setError('Failed to load registrations');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(registrationId) {
    try {
      setActionLoading(registrationId);
      await approveRegistration(registrationId);
      await loadRegistrations();
      alert('Registration approved successfully');
    } catch (err) {
      alert(err.message || 'Failed to approve registration');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(registrationId) {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      setActionLoading(registrationId);
      await rejectRegistration(registrationId, reason);
      await loadRegistrations();
      alert('Registration rejected');
    } catch (err) {
      alert(err.message || 'Failed to reject registration');
    } finally {
      setActionLoading(null);
    }
  }

  async function loadDocuments(registrationId) {
    try {
      const docs = await getDocuments(registrationId);
      setDocuments(docs || []);
      setSelectedRegistration(registrationId);
      setShowDocuments(true);
    } catch (err) {
      alert('Failed to load documents');
    }
  }

  async function handleDocumentAction(documentId, action) {
    const notes = action === 'reject' ? prompt('Please provide review notes:') : '';
    if (action === 'reject' && !notes) return;

    try {
      if (action === 'approve') {
        await approveDocument(documentId, notes);
      } else {
        await rejectDocument(documentId, notes);
      }
      await loadDocuments(selectedRegistration);
      alert(`Document ${action}d successfully`);
    } catch (err) {
      alert(`Failed to ${action} document`);
    }
  }

  async function handleDownload(documentId) {
    try {
      const blob = await downloadDocument(documentId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'document';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Failed to download document');
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'CONFIRMED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800',
      'WITHDRAWN': 'bg-gray-100 text-gray-800',
      'WAITLISTED': 'bg-blue-100 text-blue-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const getDocumentStatusBadge = (status) => {
    const statusConfig = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  if (!user || !['ORGANIZER', 'ADMIN'].includes(user.role)) {
    return (
      <div className="page-wrap">
        <div className="card">
          <div className="card-body text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
            <p className="text-gray-600">You need organizer privileges to manage registrations.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrap">
      <div className="card mb-6">
        <div className="card-header">
          <h1>Event Registrations</h1>
          <p className="text-gray-600">Review and manage event registrations</p>
        </div>
      </div>

      {/* Registrations Table */}
      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-8">
              <div className="loading-spinner"></div>
              <p className="mt-3">Loading registrations...</p>
            </div>
          ) : error ? (
            <div className="error-message"><p>{error}</p></div>
          ) : registrations.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📝</div>
              <h3 className="empty-state-title">No registrations yet</h3>
              <p className="empty-state-description">Registrations will appear here once participants sign up.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4">Participant</th>
                    <th className="text-left py-3 px-4">Type</th>
                    <th className="text-left py-3 px-4">Division</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Documents</th>
                    <th className="text-left py-3 px-4">Payment</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map(registration => (
                    <tr key={registration.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{registration.user_name || registration.user_email}</div>
                          <div className="text-sm text-gray-600">{registration.user_email}</div>
                          {registration.team_name && (
                            <div className="text-sm text-blue-600">Team: {registration.team_name}</div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="capitalize">{registration.registration_type?.toLowerCase()}</span>
                      </td>
                      <td className="py-3 px-4">
                        {registration.division_name || 'No division'}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(registration.status)}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => loadDocuments(registration.id)}
                          className="btn btn-secondary btn-sm"
                        >
                          View ({registration.documents_count || 0})
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          registration.is_paid 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {registration.is_paid ? 'Paid' : 'Unpaid'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          {registration.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleApprove(registration.id)}
                                disabled={actionLoading === registration.id}
                                className="btn btn-success btn-sm"
                              >
                                {actionLoading === registration.id ? 'Processing...' : 'Approve'}
                              </button>
                              <button
                                onClick={() => handleReject(registration.id)}
                                disabled={actionLoading === registration.id}
                                className="btn btn-danger btn-sm"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {registration.status === 'CONFIRMED' && (
                            <span className="text-green-600 text-sm">✓ Confirmed</span>
                          )}
                          {registration.status === 'REJECTED' && (
                            <span className="text-red-600 text-sm">✗ Rejected</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Documents Modal */}
      {showDocuments && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Registration Documents</h2>
                <button
                  onClick={() => setShowDocuments(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {documents.length === 0 ? (
                <p className="text-gray-600">No documents uploaded yet.</p>
              ) : (
                <div className="space-y-4">
                  {documents.map(document => (
                    <div key={document.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{document.title}</h4>
                          <p className="text-sm text-gray-600">
                            {document.document_type} • {document.file_size_mb}MB
                          </p>
                          <p className="text-xs text-gray-500">
                            Uploaded: {new Date(document.uploaded_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getDocumentStatusBadge(document.status)}
                        </div>
                      </div>
                      
                      {document.description && (
                        <p className="text-sm text-gray-600 mb-3">{document.description}</p>
                      )}
                      
                      {document.review_notes && (
                        <div className="bg-gray-50 rounded p-3 mb-3">
                          <p className="text-sm"><strong>Review Notes:</strong> {document.review_notes}</p>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDownload(document.id)}
                          className="btn btn-secondary btn-sm"
                        >
                          Download
                        </button>
                        
                        {document.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleDocumentAction(document.id, 'approve')}
                              className="btn btn-success btn-sm"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleDocumentAction(document.id, 'reject')}
                              className="btn btn-danger btn-sm"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

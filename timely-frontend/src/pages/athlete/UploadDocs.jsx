import React, { useState, useEffect } from 'react';
import { 
  DocumentTextIcon, 
  CloudArrowUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import api from '../../lib/api';
import useSocket from '../../hooks/useSocket';
import LiveIndicator from '../../components/ui/LiveIndicator';
import Skeleton, { SkeletonCard } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';

const UploadDocs = ({ registrationId, onComplete }) => {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [registration, setRegistration] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // WebSocket connection for real-time updates
  const { connectionStatus, lastMessage } = useSocket(
    `${import.meta.env.VITE_WS_URL}/ws/athlete/`,
    {
      onMessage: (message) => {
        console.log('Received message:', message);
        handleRealtimeUpdate(message);
      }
    }
  );

  const fetchRegistrationData = async () => {
    try {
      setLoading(true);
      const [registrationResponse, documentsResponse] = await Promise.all([
        api.get(`registrations/${registrationId}/`),
        api.get(`registrations/${registrationId}/documents/`)
      ]);
      
      setRegistration(registrationResponse.data);
      setDocuments(documentsResponse.data);
    } catch (error) {
      console.error('Error fetching registration data:', error);
      setError('Failed to load registration data');
    } finally {
      setLoading(false);
    }
  };

  const handleRealtimeUpdate = (message) => {
    switch (message.type) {
      case 'registration_update':
        if (message.data.registration_id === registrationId) {
          // Refresh documents when registration is updated
          fetchRegistrationData();
        }
        break;
      default:
        break;
    }
  };

  const handleFileUpload = async (file, docType) => {
    try {
      setUploading(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('doc_type', docType);
      
      const response = await api.post(`registrations/${registrationId}/documents/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setDocuments(prev => [...prev, response.data]);
      setSuccess('Document uploaded successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error uploading document:', error);
      setError('Failed to upload document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    try {
      await api.delete(`documents/${documentId}/`);
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      setSuccess('Document deleted successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error deleting document:', error);
      setError('Failed to delete document. Please try again.');
    }
  };

  const handleViewDocument = async (documentId) => {
    try {
      const response = await api.get(`documents/${documentId}/download/`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `document_${documentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      setError('Failed to download document. Please try again.');
    }
  };

  const getDocumentStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDocumentTypeLabel = (docType) => {
    const labels = {
      'id': 'ID Document',
      'medical': 'Medical Certificate',
      'insurance': 'Insurance Document',
      'waiver': 'Waiver Form',
      'general': 'General Document'
    };
    return labels[docType] || docType;
  };

  useEffect(() => {
    if (registrationId) {
      fetchRegistrationData();
    }
  }, [registrationId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SkeletonCard />
      </div>
    );
  }

  if (!registration) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <EmptyState 
          title="Registration Not Found"
          description="The registration you're looking for doesn't exist."
          action={
            <button onClick={() => window.history.back()} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              Go Back
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Upload Documents</h1>
          <LiveIndicator status={connectionStatus} />
        </div>
        <p className="text-gray-600">
          Upload required documents for your registration in <strong>{registration.event_name}</strong>
        </p>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5 text-green-500" />
            <p className="text-sm text-green-700">{success}</p>
          </div>
        </div>
      )}

      {/* Registration Status */}
      <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-blue-900">Registration Status</h3>
            <p className="text-sm text-blue-700">
              {registration.status} • Payment: {registration.payment_status}
            </p>
          </div>
          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
            registration.status === 'approved' ? 'bg-green-100 text-green-800' :
            registration.status === 'rejected' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {registration.status}
          </span>
        </div>
      </div>

      {/* Upload Area */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Documents</h2>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
          <div className="text-center">
            <CloudArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Upload Required Documents
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Supported formats: PDF, JPG, PNG (Max 10MB each)
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Type
                </label>
                <select
                  id="doc-type"
                  className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="id">ID Document</option>
                  <option value="medical">Medical Certificate</option>
                  <option value="insurance">Insurance Document</option>
                  <option value="waiver">Waiver Form</option>
                  <option value="general">General Document</option>
                </select>
              </div>
              
              <div>
                <input
                  type="file"
                  id="file-upload"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    const docType = document.getElementById('doc-type').value;
                    if (file) {
                      handleFileUpload(file, docType);
                    }
                  }}
                  className="hidden"
                  disabled={uploading}
                />
                <label
                  htmlFor="file-upload"
                  className={`inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer ${
                    uploading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <CloudArrowUpIcon className="w-4 h-4" />
                      Choose File
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Uploaded Documents</h2>
        {documents.length > 0 ? (
          <div className="space-y-4">
            {documents.map((doc) => (
              <div key={doc.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <DocumentTextIcon className="w-8 h-8 text-gray-400" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {getDocumentTypeLabel(doc.doc_type)}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                      </p>
                      {doc.approved_at && (
                        <p className="text-sm text-gray-500">
                          {doc.status === 'approved' ? 'Approved' : 'Rejected'}: {new Date(doc.approved_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getDocumentStatusColor(doc.status)}`}>
                      {doc.status}
                    </span>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewDocument(doc.id)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                        title="View Document"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-2 text-red-400 hover:text-red-600"
                        title="Delete Document"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState 
            title="No Documents Uploaded"
            description="Upload your required documents to complete your registration."
          />
        )}
      </div>

      {/* Required Documents Info */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Required Documents</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>• <strong>ID Document:</strong> Government-issued photo ID</p>
          <p>• <strong>Medical Certificate:</strong> Recent medical clearance (within 6 months)</p>
          <p>• <strong>Insurance Document:</strong> Valid sports insurance coverage</p>
          <p>• <strong>Waiver Form:</strong> Signed liability waiver</p>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          All documents will be reviewed by event organizers. You'll be notified of approval status.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-8">
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Back to Registration
        </button>
        
        {onComplete && (
          <button
            onClick={() => onComplete(registration)}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
};

export default UploadDocs;

// pages/KycCenter.jsx
import React, { useState, useEffect } from 'react';
import { kycAPI } from '../../services/api.js';
import KycStatusBadge from '../components/KycStatusBadge';
import { toast } from 'react-hot-toast';

const KycCenter = () => {
  const [kycProfile, setKycProfile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    date_of_birth: '',
    nationality: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    document_type: '',
    document_number: '',
    document_issuer: '',
    document_expiry: ''
  });

  useEffect(() => {
    loadKycData();
  }, []);

  const loadKycData = async () => {
    try {
      setLoading(true);
      const [profileResponse, documentsResponse] = await Promise.all([
        kycAPI.getProfile(),
        kycAPI.listDocuments()
      ]);
      
      setKycProfile(profileResponse.data);
      setDocuments(documentsResponse.data);
      
      // Populate form with existing data
      if (profileResponse.data) {
        setFormData(prev => ({
          ...prev,
          ...profileResponse.data
        }));
      }
    } catch (error) {
      console.error('Error loading KYC data:', error);
      if (error.response?.status === 404) {
        // No KYC profile exists yet
        setKycProfile(null);
      } else {
        toast.error('Failed to load KYC information');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      
      if (kycProfile) {
        await kycAPI.updateProfile(formData);
        toast.success('KYC profile updated successfully');
      } else {
        await kycAPI.createProfile(formData);
        toast.success('KYC profile created successfully');
      }
      
      await loadKycData();
    } catch (error) {
      console.error('Error saving KYC profile:', error);
      toast.error('Failed to save KYC profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitForReview = async () => {
    try {
      setSubmitting(true);
      await kycAPI.submitProfile();
      toast.success('KYC profile submitted for review');
      await loadKycData();
    } catch (error) {
      console.error('Error submitting KYC profile:', error);
      toast.error(error.response?.data?.error || 'Failed to submit KYC profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('File size cannot exceed 10MB');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPEG, PNG, and PDF files are allowed');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', e.target.name);

      await kycAPI.uploadDocument(formData);
      toast.success('Document uploaded successfully');
      await loadKycData();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset file input
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await kycAPI.deleteDocument(documentId);
      toast.success('Document deleted successfully');
      await loadKycData();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const canSubmit = kycProfile?.status === 'unverified' || kycProfile?.status === 'rejected';
  const hasRequiredDocs = documents.some(doc => doc.document_type === 'id_front') && 
                         documents.some(doc => doc.document_type === 'id_back');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">KYC Center</h1>
          <p className="mt-2 text-gray-600">
            Complete your Know Your Customer verification to access additional features.
          </p>
          {kycProfile && (
            <div className="mt-4">
              <KycStatusBadge status={kycProfile.status} className="text-sm" />
            </div>
          )}
        </div>

        {/* KYC Status Information */}
        {kycProfile && (
          <div className="mb-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Status:</span>
                <span className="ml-2">
                  <KycStatusBadge status={kycProfile.status} />
                </span>
              </div>
              {kycProfile.submitted_at && (
                <div>
                  <span className="font-medium text-gray-700">Submitted:</span>
                  <span className="ml-2 text-gray-600">
                    {new Date(kycProfile.submitted_at).toLocaleString()}
                  </span>
                </div>
              )}
              {kycProfile.reviewed_at && (
                <div>
                  <span className="font-medium text-gray-700">Reviewed:</span>
                  <span className="ml-2 text-gray-600">
                    {new Date(kycProfile.reviewed_at).toLocaleString()}
                  </span>
                </div>
              )}
              {kycProfile.review_notes && (
                <div className="md:col-span-2">
                  <span className="font-medium text-gray-700">Review Notes:</span>
                  <p className="mt-1 text-gray-600">{kycProfile.review_notes}</p>
                </div>
              )}
              {kycProfile.rejection_reason && (
                <div className="md:col-span-2">
                  <span className="font-medium text-red-700">Rejection Reason:</span>
                  <p className="mt-1 text-red-600">{kycProfile.rejection_reason}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Personal Information Form */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
          </div>
          <form onSubmit={handleSaveProfile} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  id="date_of_birth"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="nationality" className="block text-sm font-medium text-gray-700 mb-2">
                  Nationality
                </label>
                <input
                  type="text"
                  id="nationality"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="document_type" className="block text-sm font-medium text-gray-700 mb-2">
                  Document Type
                </label>
                <select
                  id="document_type"
                  name="document_type"
                  value={formData.document_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select document type</option>
                  <option value="passport">Passport</option>
                  <option value="driver_license">Driver License</option>
                  <option value="national_id">National ID</option>
                </select>
              </div>

              <div>
                <label htmlFor="document_number" className="block text-sm font-medium text-gray-700 mb-2">
                  Document Number
                </label>
                <input
                  type="text"
                  id="document_number"
                  name="document_number"
                  value={formData.document_number}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="document_issuer" className="block text-sm font-medium text-gray-700 mb-2">
                  Document Issuer
                </label>
                <input
                  type="text"
                  id="document_issuer"
                  name="document_issuer"
                  value={formData.document_issuer}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                  State/Province
                </label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700 mb-2">
                  Postal Code
                </label>
                <input
                  type="text"
                  id="postal_code"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Saving...' : 'Save Information'}
              </button>
            </div>
          </form>
        </div>

        {/* Document Upload */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Document Upload</h2>
            <p className="text-sm text-gray-600 mt-1">
              Upload clear photos or scans of your identification documents.
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ID Front */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID Front *
                </label>
                <input
                  type="file"
                  name="id_front"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Upload the front of your ID document
                </p>
              </div>

              {/* ID Back */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID Back *
                </label>
                <input
                  type="file"
                  name="id_back"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Upload the back of your ID document
                </p>
              </div>

              {/* Selfie (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selfie (Optional)
                </label>
                <input
                  type="file"
                  name="selfie"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Upload a clear selfie for verification
                </p>
              </div>
            </div>

            {uploading && (
              <div className="mt-4 text-center">
                <div className="inline-flex items-center text-sm text-gray-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Uploading document...
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Uploaded Documents */}
        {documents.length > 0 && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Uploaded Documents</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-900 capitalize">
                        {doc.document_type.replace('_', ' ')}
                      </h3>
                      {doc.is_verified && (
                        <span className="text-green-600 text-xs">✓ Verified</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mb-2">
                      {doc.file_name} ({Math.round(doc.file_size / 1024)} KB)
                    </p>
                    <p className="text-xs text-gray-500">
                      Uploaded: {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                    {kycProfile?.status === 'unverified' && (
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="mt-2 text-xs text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Submit for Review */}
        {canSubmit && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Submit for Review</h2>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Requirements:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li className="flex items-center">
                    <span className={`mr-2 ${formData.full_name ? 'text-green-600' : 'text-gray-400'}`}>
                      {formData.full_name ? '✓' : '○'}
                    </span>
                    Complete personal information
                  </li>
                  <li className="flex items-center">
                    <span className={`mr-2 ${hasRequiredDocs ? 'text-green-600' : 'text-gray-400'}`}>
                      {hasRequiredDocs ? '✓' : '○'}
                    </span>
                    Upload ID front and back documents
                  </li>
                </ul>
              </div>

              <button
                onClick={handleSubmitForReview}
                disabled={submitting || !formData.full_name || !hasRequiredDocs}
                className="w-full bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit for Review'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KycCenter;

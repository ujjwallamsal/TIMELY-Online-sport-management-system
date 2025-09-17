import React, { useState, useEffect } from 'react';
import { 
  UserIcon, 
  DocumentTextIcon, 
  CreditCardIcon, 
  CheckCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import api from '../../lib/api';
import useSocket from '../../hooks/useSocket';
import LiveIndicator from '../../components/ui/LiveIndicator';
import Skeleton, { SkeletonCard } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';

const RegistrationWizard = ({ eventId, onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [event, setEvent] = useState(null);
  const [formData, setFormData] = useState({
    // Personal Information
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    emergency_contact: '',
    emergency_phone: '',
    
    // Registration Details
    division: '',
    experience_level: 'beginner',
    special_requirements: '',
    
    // Team Information (if applicable)
    team_name: '',
    team_members: [],
    
    // Documents
    documents: [],
    
    // Payment
    payment_method: 'card'
  });

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

  const fetchEventData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`events/${eventId}/`);
      setEvent(response.data);
    } catch (error) {
      console.error('Error fetching event data:', error);
      setError('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const handleRealtimeUpdate = (message) => {
    switch (message.type) {
      case 'registration_update':
        // Handle registration status updates
        if (message.data.user_id === formData.user_id) {
          // Update UI based on registration status
          console.log('Registration status updated:', message.data);
        }
        break;
      default:
        break;
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDocumentUpload = async (file, docType) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('doc_type', docType);
      
      const response = await api.post('uploads/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setFormData(prev => ({
        ...prev,
        documents: [...prev.documents, {
          id: response.data.id,
          file: response.data.file,
          doc_type: docType,
          name: file.name
        }]
      }));
    } catch (error) {
      console.error('Error uploading document:', error);
      setError('Failed to upload document');
    }
  };

  const validateStep = (step) => {
    switch (step) {
      case 1: // Personal Information
        return formData.first_name && formData.last_name && formData.email && formData.phone;
      case 2: // Registration Details
        return formData.division;
      case 3: // Documents
        return formData.documents.length > 0;
      case 4: // Payment
        return true; // Payment validation handled by payment provider
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const registrationData = {
        event_id: eventId,
        type: formData.team_name ? 'team' : 'individual',
        division: formData.division,
        team_name: formData.team_name,
        special_requirements: formData.special_requirements,
        experience_level: formData.experience_level,
        emergency_contact: formData.emergency_contact,
        emergency_phone: formData.emergency_phone
      };
      
      const response = await api.post('registrations/', registrationData);
      
      // Upload documents
      for (const doc of formData.documents) {
        await api.post(`registrations/${response.data.id}/documents/`, {
          file: doc.id,
          doc_type: doc.doc_type
        });
      }
      
      // Create payment intent
      const paymentResponse = await api.post(`registrations/${response.data.id}/pay/`);
      
      onComplete?.(response.data, paymentResponse.data);
    } catch (error) {
      console.error('Error submitting registration:', error);
      setError('Failed to submit registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchEventData();
    }
  }, [eventId]);

  const steps = [
    { id: 1, name: 'Personal Info', icon: UserIcon },
    { id: 2, name: 'Registration', icon: DocumentTextIcon },
    { id: 3, name: 'Documents', icon: DocumentTextIcon },
    { id: 4, name: 'Payment', icon: CreditCardIcon }
  ];

  if (loading && !event) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SkeletonCard />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <EmptyState 
          title="Event Not Found"
          description="The event you're trying to register for doesn't exist."
          action={
            <button onClick={onCancel} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
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
          <h1 className="text-3xl font-bold text-gray-900">Register for {event.name}</h1>
          <LiveIndicator status={connectionStatus} />
        </div>
        <p className="text-gray-600">{event.description}</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <nav aria-label="Progress">
          <ol className="flex items-center justify-center space-x-8">
            {steps.map((step, stepIdx) => (
              <li key={step.name} className="flex items-center">
                <div className={`flex items-center ${stepIdx !== steps.length - 1 ? 'pr-8' : ''}`}>
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep >= step.id
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-gray-300 text-gray-500'
                  }`}>
                    <step.icon className="w-5 h-5" />
                  </div>
                  <span className={`ml-4 text-sm font-medium ${
                    currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {step.name}
                  </span>
                </div>
                {stepIdx !== steps.length - 1 && (
                  <div className="flex-1 h-0.5 bg-gray-300 ml-8" />
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emergency Contact
                </label>
                <input
                  type="text"
                  value={formData.emergency_contact}
                  onChange={(e) => handleInputChange('emergency_contact', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Registration Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Division *
                </label>
                <select
                  value={formData.division}
                  onChange={(e) => handleInputChange('division', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Division</option>
                  {event.divisions?.map(division => (
                    <option key={division.id} value={division.id}>
                      {division.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experience Level
                </label>
                <select
                  value={formData.experience_level}
                  onChange={(e) => handleInputChange('experience_level', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="professional">Professional</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Requirements
                </label>
                <textarea
                  value={formData.special_requirements}
                  onChange={(e) => handleInputChange('special_requirements', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Any special requirements or accommodations needed..."
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Required Documents</h2>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 mb-4">
                    Upload required documents (ID, medical certificate, etc.)
                  </p>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      Array.from(e.target.files).forEach(file => {
                        handleDocumentUpload(file, 'general');
                      });
                    }}
                    className="hidden"
                    id="document-upload"
                  />
                  <label
                    htmlFor="document-upload"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 cursor-pointer"
                  >
                    Upload Documents
                  </label>
                </div>
              </div>
              
              {formData.documents.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-900">Uploaded Documents</h3>
                  {formData.documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <span className="text-sm text-gray-700">{doc.name}</span>
                      <button
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            documents: prev.documents.filter((_, i) => i !== index)
                          }));
                        }}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Payment</h2>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Registration Fee</h3>
                <span className="text-2xl font-bold text-gray-900">
                  ${(event.price_cents / 100).toFixed(2)}
                </span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    id="card"
                    name="payment_method"
                    value="card"
                    checked={formData.payment_method === 'card'}
                    onChange={(e) => handleInputChange('payment_method', e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <label htmlFor="card" className="text-sm font-medium text-gray-700">
                    Credit/Debit Card
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    id="paypal"
                    name="payment_method"
                    value="paypal"
                    checked={formData.payment_method === 'paypal'}
                    onChange={(e) => handleInputChange('payment_method', e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <label htmlFor="paypal" className="text-sm font-medium text-gray-700">
                    PayPal
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8">
        <button
          onClick={currentStep === 1 ? onCancel : handlePrevious}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          {currentStep === 1 ? 'Cancel' : 'Previous'}
        </button>
        
        <div className="flex items-center gap-4">
          {currentStep < 4 ? (
            <button
              onClick={handleNext}
              disabled={!validateStep(currentStep)}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Complete Registration'}
              <CheckCircleIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegistrationWizard;

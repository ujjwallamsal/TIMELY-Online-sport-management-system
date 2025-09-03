import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  getEvent, 
  listDivisions, 
  createRegistration,
  uploadRegistrationDoc,
  createRegPaymentIntent,
  confirmRegPayment
} from '../lib/api';
import DocUpload from '../components/DocUpload';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ArrowRightIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

const DOCUMENT_TYPES = [
  { value: 'id_card', label: 'ID Card', required: true },
  { value: 'medical_clearance', label: 'Medical Clearance', required: true },
  { value: 'other', label: 'Other Document', required: false }
];

const RegistrationWizard = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // Data
  const [event, setEvent] = useState(null);
  const [divisions, setDivisions] = useState([]);
  const [registration, setRegistration] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    division: '',
    type: 'individual',
    team_name: '',
    team_manager_name: '',
    team_contact: ''
  });
  
  const [documents, setDocuments] = useState([]);
  const [paymentData, setPaymentData] = useState(null);

  const steps = [
    { id: 1, title: 'Event & Division', description: 'Select event division' },
    { id: 2, title: 'Registration Type', description: 'Individual or team registration' },
    { id: 3, title: 'Documents', description: 'Upload required documents' },
    { id: 4, title: 'Payment', description: 'Pay registration fee' },
    { id: 5, title: 'Confirmation', description: 'Review and submit' }
  ];

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadData();
  }, [eventId, user, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [eventData, divisionsData] = await Promise.all([
        getEvent(eventId),
        listDivisions(eventId)
      ]);
      
      setEvent(eventData);
      setDivisions(divisionsData?.results || divisionsData || []);
    } catch (err) {
      setError('Failed to load event information');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (file) => {
    setDocuments(prev => [...prev, file]);
  };

  const handleFileRemove = (index) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreatePaymentIntent = async () => {
    try {
      const response = await createRegPaymentIntent(registration.id);
      setPaymentData(response);
    } catch (err) {
      setError('Failed to create payment intent');
    }
  };

  const handleConfirmPayment = async () => {
    try {
      setSubmitting(true);
      await confirmRegPayment(registration.id, {
        client_secret: paymentData.client_secret
      });
      nextStep();
    } catch (err) {
      setError('Payment confirmation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitRegistration = async () => {
    try {
      setSubmitting(true);
      
      // Create registration
      const registrationData = {
        event: eventId,
        division: formData.division || null,
        type: formData.type,
        team_name: formData.type === 'team' ? formData.team_name : '',
        team_manager_name: formData.type === 'team' ? formData.team_manager_name : '',
        team_contact: formData.type === 'team' ? formData.team_contact : ''
      };
      
      const newRegistration = await createRegistration(registrationData);
      setRegistration(newRegistration);
      
      // Upload documents
      for (const doc of documents) {
        const formData = new FormData();
        formData.append('doc_type', doc.docType || 'other');
        formData.append('file', doc);
        await uploadRegistrationDoc(newRegistration.id, formData);
      }
      
      // Handle payment if required
      if (event.fee_cents > 0) {
        await handleCreatePaymentIntent();
        setCurrentStep(4);
      } else {
        setCurrentStep(5);
      }
      
    } catch (err) {
      setError('Failed to submit registration');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Select Division</h3>
              <div className="space-y-3">
                {divisions.map(division => (
                  <label key={division.id} className="flex items-center">
                    <input
                      type="radio"
                      name="division"
                      value={division.id}
                      checked={formData.division === division.id}
                      onChange={(e) => handleInputChange('division', e.target.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-3 text-sm text-gray-700">{division.name}</span>
                  </label>
                ))}
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="division"
                    value=""
                    checked={formData.division === ''}
                    onChange={(e) => handleInputChange('division', e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-3 text-sm text-gray-700">No specific division</span>
                </label>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Registration Type</h3>
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="individual"
                    checked={formData.type === 'individual'}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-3 text-sm text-gray-700">Individual Registration</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="team"
                    checked={formData.type === 'team'}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-3 text-sm text-gray-700">Team Registration</span>
                </label>
              </div>
            </div>

            {formData.type === 'team' && (
              <div className="space-y-4">
                <Input
                  label="Team Name"
                  value={formData.team_name}
                  onChange={(e) => handleInputChange('team_name', e.target.value)}
                  required
                />
                <Input
                  label="Team Manager Name"
                  value={formData.team_manager_name}
                  onChange={(e) => handleInputChange('team_manager_name', e.target.value)}
                  required
                />
                <Input
                  label="Team Contact Email"
                  type="email"
                  value={formData.team_contact}
                  onChange={(e) => handleInputChange('team_contact', e.target.value)}
                  required
                />
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Required Documents</h3>
              <p className="text-sm text-gray-600 mb-6">
                Please upload the following documents. All documents must be clear and legible.
              </p>
              
              <div className="space-y-4 mb-6">
                {DOCUMENT_TYPES.map(docType => (
                  <div key={docType.value} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-900">{docType.label}</span>
                      {docType.required && (
                        <span className="ml-2 text-red-500 text-sm">* Required</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {documents.filter(doc => doc.docType === docType.value).length > 0 ? (
                        <span className="text-green-600">✓ Uploaded</span>
                      ) : (
                        <span className="text-gray-400">Not uploaded</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <DocUpload
                onFileSelect={handleFileSelect}
                onFileRemove={handleFileRemove}
                files={documents}
                maxFiles={5}
                acceptedTypes={['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx']}
                maxSizeMB={10}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Payment</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 text-blue-400 mr-2" />
                  <span className="text-sm text-blue-700">
                    This is a test payment. No real money will be charged.
                  </span>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-900">Registration Fee</span>
                  <span className="text-lg font-bold text-gray-900">
                    ${(event.fee_cents / 100).toFixed(2)}
                  </span>
                </div>
              </div>
              
              {paymentData ? (
                <div className="mt-6">
                  <Button
                    onClick={handleConfirmPayment}
                    loading={submitting}
                    className="w-full"
                  >
                    Confirm Payment
                  </Button>
                </div>
              ) : (
                <div className="mt-6">
                  <Button
                    onClick={handleCreatePaymentIntent}
                    loading={submitting}
                    className="w-full"
                  >
                    Create Payment Intent
                  </Button>
                </div>
              )}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Registration Submitted!</h3>
              <p className="text-sm text-gray-600 mb-6">
                Your registration has been submitted successfully. You will receive a confirmation email shortly.
              </p>
              
              <div className="space-y-4">
                <Button
                  onClick={() => navigate('/registrations')}
                  className="w-full"
                >
                  View My Registrations
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/events')}
                  className="w-full"
                >
                  Browse More Events
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <div className="text-center">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
            <p className="text-sm text-gray-600 mb-6">{error}</p>
            <Button onClick={() => navigate('/events')}>
              Back to Events
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Register for {event?.name}
          </h1>
          <p className="text-gray-600">{event?.sport} • {event?.location}</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  currentStep >= step.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step.id}
                </div>
                <div className="ml-3 hidden sm:block">
                  <p className={`text-sm font-medium ${
                    currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`hidden sm:block w-16 h-0.5 ml-4 ${
                    currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <Card className="mb-8">
          {renderStepContent()}
        </Card>

        {/* Navigation */}
        {currentStep < 5 && (
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="flex space-x-3">
              {currentStep === 3 ? (
                <Button
                  onClick={handleSubmitRegistration}
                  loading={submitting}
                  className="flex items-center"
                >
                  Submit Registration
                  <ArrowRightIcon className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={nextStep}
                  disabled={currentStep === steps.length}
                  className="flex items-center"
                >
                  Next
                  <ArrowRightIcon className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegistrationWizard;
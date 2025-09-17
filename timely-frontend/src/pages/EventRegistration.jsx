import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  getEvent, 
  listDivisions, 
  createRegistration
} from '../services/api';

const DOCUMENT_TYPES = [
  { value: 'ID', label: 'Identity Document', required: true, description: 'Valid government-issued ID' },
  { value: 'MEDICAL', label: 'Medical Certificate', required: true, description: 'Medical clearance from doctor' },
  { value: 'INSURANCE', label: 'Insurance Certificate', required: false, description: 'Sports insurance coverage' },
  { value: 'WAIVER', label: 'Liability Waiver', required: false, description: 'Signed liability waiver' },
  { value: 'PHOTO', label: 'Passport Photo', required: false, description: 'Recent passport-style photo' }
];

const KYC_DOCUMENT_TYPES = [
  { value: 'KYC_IDENTITY', label: 'Identity Verification', required: true, description: 'Additional identity verification document' },
  { value: 'KYC_PROOF', label: 'Proof of Address', required: true, description: 'Recent utility bill or bank statement' }
];

export default function EventRegistration() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [event, setEvent] = useState(null);
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState('');
  const [registrationId, setRegistrationId] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    division: '',
    registration_type: 'INDIVIDUAL',
    team_name: '',
    team_members: [],
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
    medical_conditions: '',
    dietary_requirements: ''
  });
  
  // Document upload state
  const [documents, setDocuments] = useState({});
  const [uploadProgress, setUploadProgress] = useState({});
  
  // Payment state
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [paymentIntent, setPaymentIntent] = useState(null);
  
  // KYC state
  const [kycDocuments, setKycDocuments] = useState({});
  const [kycStatus, setKycStatus] = useState('pending');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadData();
  }, [eventId, isAuthenticated, navigate]);

  async function loadData() {
    try {
      setLoading(true);
      const [eventData, divisionsData] = await Promise.all([
        getEvent(eventId),
        listDivisions(eventId)
      ]);
      setEvent(eventData);
      setDivisions(divisionsData?.results || divisionsData || []);
    } catch (err) {
      setError('Failed to load event details');
    } finally {
      setLoading(false);
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTeamMemberAdd = () => {
    const newMember = {
      name: '',
      email: '',
      phone: '',
      position: ''
    };
    setFormData(prev => ({
      ...prev,
      team_members: [...prev.team_members, newMember]
    }));
  };

  const handleTeamMemberChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      team_members: prev.team_members.map((member, i) => 
        i === index ? { ...member, [field]: value } : member
      )
    }));
  };

  const handleTeamMemberRemove = (index) => {
    setFormData(prev => ({
      ...prev,
      team_members: prev.team_members.filter((_, i) => i !== index)
    }));
  };

  const validateStep = (step) => {
    const errors = [];
    
    if (step === 1) {
      if (!formData.emergency_contact_name) errors.push('Emergency contact name is required');
      if (!formData.emergency_contact_phone) errors.push('Emergency contact phone is required');
      if (!formData.emergency_contact_relationship) errors.push('Emergency contact relationship is required');
      
      if (formData.registration_type === 'TEAM') {
        if (!formData.team_name) errors.push('Team name is required');
        if (formData.team_members.length === 0) errors.push('At least one team member is required');
      }
    }
    
    if (step === 2) {
      const requiredDocs = DOCUMENT_TYPES.filter(doc => doc.required);
      for (const docType of requiredDocs) {
        if (!documents[docType.value]) {
          errors.push(`${docType.label} is required`);
        }
      }
    }
    
    if (step === 3 && event?.fee_cents > 0) {
      if (paymentStatus !== 'completed') {
        errors.push('Payment must be completed to continue');
      }
    }
    
    if (step === 4) {
      const requiredKycDocs = KYC_DOCUMENT_TYPES.filter(doc => doc.required);
      for (const docType of requiredKycDocs) {
        if (!kycDocuments[docType.value]) {
          errors.push(`${docType.label} is required for KYC verification`);
        }
      }
    }
    
    return errors;
  };

  const nextStep = () => {
    const errors = validateStep(currentStep);
    if (errors.length > 0) {
      setError(errors.join(', '));
      return;
    }
    setError('');
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    setError('');
    setCurrentStep(prev => prev - 1);
  };

  const handleFileUpload = async (documentType, file, isKyc = false) => {
    if (!file) return;
    
    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('File size must be less than 5MB');
      return;
    }
    
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setError('Only PDF, JPG, and PNG files are allowed');
      return;
    }
    
    const targetState = isKyc ? setKycDocuments : setDocuments;
    const targetProgress = isKyc ? setUploadProgress : setUploadProgress;
    
    targetState(prev => ({
      ...prev,
      [documentType]: { file, name: file.name, uploading: true }
    }));
    
    targetProgress(prev => ({ ...prev, [documentType]: 0 }));
    
    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        targetProgress(prev => ({
          ...prev,
          [documentType]: Math.min(prev[documentType] + 10, 90)
        }));
      }, 100);
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate upload time
      clearInterval(progressInterval);
      
      targetProgress(prev => ({ ...prev, [documentType]: 100 }));
      targetState(prev => ({
        ...prev,
        [documentType]: { ...prev[documentType], uploading: false, uploaded: true }
      }));
    } catch (err) {
      targetState(prev => ({
        ...prev,
        [documentType]: { ...prev[documentType], uploading: false, error: true }
      }));
      setError('Failed to upload document');
    }
  };

  const handlePayment = async () => {
    if (!event?.fee_cents || event.fee_cents === 0) {
      setPaymentStatus('completed');
      return;
    }
    
    try {
      setPaymentStatus('processing');
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In real implementation, this would integrate with Stripe
      setPaymentStatus('completed');
      setPaymentIntent({ id: 'pi_test_123', status: 'succeeded' });
      
    } catch (err) {
      setPaymentStatus('failed');
      setError('Payment failed. Please try again.');
    }
  };

  const handleSubmit = async () => {
    const errors = validateStep(1);
    if (errors.length > 0) {
      setError(errors.join(', '));
      return;
    }
    
    try {
      setSubmitting(true);
      setError('');
      
      // Create registration
      const registrationData = {
        event: eventId,
        ...formData
      };
      
      const registration = await createRegistration(registrationData);
      setRegistrationId(registration.id);
      
      // Upload documents - TODO: Implement document upload API
      console.log('Document upload to be implemented');
      
      // Upload KYC documents - TODO: Implement KYC document upload API
      console.log('KYC document upload to be implemented');
      
      setCurrentStep(5); // Success step
    } catch (err) {
      setError(err.message || 'Failed to submit registration');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-wrap">
        <div className="card">
          <div className="card-body text-center py-8">
            <div className="loading-spinner"></div>
            <p className="mt-3">Loading event details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="page-wrap">
        <div className="error-message">
          <h3>Event Not Found</h3>
          <p>The event you're trying to register for could not be found.</p>
        </div>
      </div>
    );
  }

  const totalSteps = event.fee_cents > 0 ? 5 : 4;
  const stepLabels = [
    'Registration Details',
    'Document Upload',
    event.fee_cents > 0 ? 'Payment' : 'KYC Verification',
    event.fee_cents > 0 ? 'KYC Verification' : 'Confirmation',
    'Confirmation'
  ];

  return (
    <div className="page-wrap">
      <div className="max-w-4xl mx-auto">
        {/* Progress Steps */}
        <div className="card mb-6">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h1>Register for {event.name}</h1>
              <div className="flex items-center space-x-2">
                {Array.from({ length: totalSteps }, (_, i) => (
                  <div key={i} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep >= i + 1 ? 'bg-blue-500 text-white' : 'bg-gray-200'
                    }`}>
                      {i + 1 === totalSteps ? '✓' : i + 1}
                    </div>
                    {i < totalSteps - 1 && (
                      <div className="w-16 h-1 bg-gray-200 relative mx-2">
                        <div className={`h-full bg-blue-500 transition-all ${
                          currentStep > i + 1 ? 'w-full' : 'w-0'
                        }`}></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-between text-sm text-gray-600">
              {stepLabels.map((label, index) => (
                <span key={index} className="text-center flex-1">
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {error && <div className="error-message mb-6"><p>{error}</p></div>}

        {/* Step 1: Registration Details */}
        {currentStep === 1 && (
          <div className="card">
            <div className="card-header">
              <h2>Registration Details</h2>
            </div>
            <div className="card-body space-y-6">
              {/* Registration Type */}
              <div>
                <label className="form-label">Registration Type</label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="registration_type"
                      value="INDIVIDUAL"
                      checked={formData.registration_type === 'INDIVIDUAL'}
                      onChange={(e) => handleInputChange('registration_type', e.target.value)}
                      className="form-radio"
                    />
                    <div>
                      <div className="font-medium">Individual</div>
                      <div className="text-sm text-gray-600">Register as an individual participant</div>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="registration_type"
                      value="TEAM"
                      checked={formData.registration_type === 'TEAM'}
                      onChange={(e) => handleInputChange('registration_type', e.target.value)}
                      className="form-radio"
                    />
                    <div>
                      <div className="font-medium">Team</div>
                      <div className="text-sm text-gray-600">Register as a team</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Division Selection */}
              {divisions.length > 0 && (
                <div>
                  <label className="form-label">Division</label>
                  <select
                    value={formData.division}
                    onChange={(e) => handleInputChange('division', e.target.value)}
                    className="form-input"
                  >
                    <option value="">Select a division (optional)</option>
                    {divisions.map(division => (
                      <option key={division.id} value={division.id}>
                        {division.name} - {division.description}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Team Details */}
              {formData.registration_type === 'TEAM' && (
                <div className="space-y-4">
                  <div>
                    <label className="form-label">Team Name *</label>
                    <input
                      type="text"
                      value={formData.team_name}
                      onChange={(e) => handleInputChange('team_name', e.target.value)}
                      className="form-input"
                      placeholder="Enter team name"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <label className="form-label">Team Members</label>
                      <button
                        type="button"
                        onClick={handleTeamMemberAdd}
                        className="btn btn-secondary btn-sm"
                      >
                        + Add Member
                      </button>
                    </div>
                    
                    {formData.team_members.map((member, index) => (
                      <div key={index} className="border rounded-lg p-4 mb-3">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-medium">Member {index + 1}</h4>
                          <button
                            type="button"
                            onClick={() => handleTeamMemberRemove(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input
                            type="text"
                            placeholder="Full Name"
                            value={member.name}
                            onChange={(e) => handleTeamMemberChange(index, 'name', e.target.value)}
                            className="form-input"
                          />
                          <input
                            type="email"
                            placeholder="Email"
                            value={member.email}
                            onChange={(e) => handleTeamMemberChange(index, 'email', e.target.value)}
                            className="form-input"
                          />
                          <input
                            type="tel"
                            placeholder="Phone"
                            value={member.phone}
                            onChange={(e) => handleTeamMemberChange(index, 'phone', e.target.value)}
                            className="form-input"
                          />
                          <input
                            type="text"
                            placeholder="Position"
                            value={member.position}
                            onChange={(e) => handleTeamMemberChange(index, 'position', e.target.value)}
                            className="form-input"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Emergency Contact */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Emergency Contact Name *</label>
                  <input
                    type="text"
                    value={formData.emergency_contact_name}
                    onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                    className="form-input"
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <label className="form-label">Emergency Contact Phone *</label>
                  <input
                    type="tel"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                    className="form-input"
                    placeholder="Phone number"
                  />
                </div>
                <div>
                  <label className="form-label">Relationship *</label>
                  <input
                    type="text"
                    value={formData.emergency_contact_relationship}
                    onChange={(e) => handleInputChange('emergency_contact_relationship', e.target.value)}
                    className="form-input"
                    placeholder="e.g., Parent, Spouse"
                  />
                </div>
              </div>

              {/* Medical Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Medical Conditions</label>
                  <textarea
                    value={formData.medical_conditions}
                    onChange={(e) => handleInputChange('medical_conditions', e.target.value)}
                    className="form-input"
                    rows={3}
                    placeholder="Any medical conditions, allergies, or medications..."
                  />
                </div>
                <div>
                  <label className="form-label">Dietary Requirements</label>
                  <textarea
                    value={formData.dietary_requirements}
                    onChange={(e) => handleInputChange('dietary_requirements', e.target.value)}
                    className="form-input"
                    rows={3}
                    placeholder="Any special dietary needs..."
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button onClick={nextStep} className="btn btn-primary">
                  Next: Upload Documents
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Document Upload */}
        {currentStep === 2 && (
          <div className="card">
            <div className="card-header">
              <h2>Document Upload</h2>
              <p className="text-gray-600">Upload the required documents for your registration</p>
            </div>
            <div className="card-body space-y-6">
              {DOCUMENT_TYPES.map(docType => (
                <div key={docType.value} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium">{docType.label}</h4>
                      <p className="text-sm text-gray-600">{docType.description}</p>
                    </div>
                    <div className="text-sm">
                      {documents[docType.value]?.uploaded && (
                        <span className="text-green-600">✓ Uploaded</span>
                      )}
                    </div>
                  </div>
                  
                  {!documents[docType.value]?.uploaded ? (
                    <div>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload(docType.value, e.target.files[0])}
                        className="form-input"
                      />
                      {documents[docType.value]?.uploading && (
                        <div className="mt-2">
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Uploading...</span>
                            <span>{uploadProgress[docType.value] || 0}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all"
                              style={{ width: `${uploadProgress[docType.value] || 0}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                      <span className="text-green-800">
                        📄 {documents[docType.value].name}
                      </span>
                      <button
                        onClick={() => setDocuments(prev => ({ ...prev, [docType.value]: null }))}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              ))}

              <div className="flex justify-between">
                <button onClick={prevStep} className="btn btn-secondary">
                  Back
                </button>
                <button onClick={nextStep} className="btn btn-primary">
                  Next: {event.fee_cents > 0 ? 'Payment' : 'KYC Verification'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Payment (if required) */}
        {currentStep === 3 && event.fee_cents > 0 && (
          <div className="card">
            <div className="card-header">
              <h2>Payment</h2>
              <p className="text-gray-600">Complete payment to continue with registration</p>
            </div>
            <div className="card-body space-y-6">
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Registration Fee</h3>
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  ${(event.fee_cents / 100).toFixed(2)} AUD
                </div>
                <p className="text-gray-600">This fee covers event participation and administrative costs.</p>
              </div>

              {paymentStatus === 'pending' && (
                <div className="text-center">
                  <button
                    onClick={handlePayment}
                    className="btn btn-primary btn-lg"
                  >
                    💳 Pay Now
                  </button>
                  <p className="text-sm text-gray-600 mt-2">
                    You will be redirected to our secure payment processor
                  </p>
                </div>
              )}

              {paymentStatus === 'processing' && (
                <div className="text-center">
                  <div className="loading-spinner mb-4"></div>
                  <p className="text-gray-600">Processing payment...</p>
                </div>
              )}

              {paymentStatus === 'completed' && (
                <div className="text-center">
                  <div className="text-6xl mb-4">✅</div>
                  <h3 className="text-xl font-semibold text-green-600 mb-2">Payment Successful!</h3>
                  <p className="text-gray-600">Your payment has been processed successfully.</p>
                </div>
              )}

              {paymentStatus === 'failed' && (
                <div className="text-center">
                  <div className="text-6xl mb-4">❌</div>
                  <h3 className="text-xl font-semibold text-red-600 mb-2">Payment Failed</h3>
                  <p className="text-gray-600">There was an issue processing your payment.</p>
                  <button
                    onClick={handlePayment}
                    className="btn btn-primary mt-4"
                  >
                    Try Again
                  </button>
                </div>
              )}

              <div className="flex justify-between">
                <button onClick={prevStep} className="btn btn-secondary">
                  Back
                </button>
                {paymentStatus === 'completed' && (
                  <button onClick={nextStep} className="btn btn-primary">
                    Next: KYC Verification
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: KYC Verification */}
        {currentStep === 4 && (
          <div className="card">
            <div className="card-header">
              <h2>KYC Verification</h2>
              <p className="text-gray-600">Complete identity verification for enhanced security</p>
            </div>
            <div className="card-body space-y-6">
              <div className="bg-yellow-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2">Know Your Customer (KYC)</h3>
                <p className="text-gray-600">
                  To ensure the security and integrity of our events, we require additional identity verification.
                  This information is encrypted and stored securely.
                </p>
              </div>

              {KYC_DOCUMENT_TYPES.map(docType => (
                <div key={docType.value} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium">{docType.label}</h4>
                      <p className="text-sm text-gray-600">{docType.description}</p>
                    </div>
                    <div className="text-sm">
                      {kycDocuments[docType.value]?.uploaded && (
                        <span className="text-green-600">✓ Uploaded</span>
                      )}
                    </div>
                  </div>
                  
                  {!kycDocuments[docType.value]?.uploaded ? (
                    <div>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload(docType.value, e.target.files[0], true)}
                        className="form-input"
                      />
                      {kycDocuments[docType.value]?.uploading && (
                        <div className="mt-2">
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Uploading...</span>
                            <span>{uploadProgress[docType.value] || 0}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all"
                              style={{ width: `${uploadProgress[docType.value] || 0}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                      <span className="text-green-800">
                        📄 {kycDocuments[docType.value].name}
                      </span>
                      <button
                        onClick={() => setKycDocuments(prev => ({ ...prev, [docType.value]: null }))}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              ))}

              <div className="flex justify-between">
                <button onClick={prevStep} className="btn btn-secondary">
                  Back
                </button>
                <button onClick={nextStep} className="btn btn-primary">
                  Next: Submit Registration
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Submit Registration */}
        {currentStep === 5 && (
          <div className="card">
            <div className="card-header">
              <h2>Review & Submit</h2>
              <p className="text-gray-600">Review your registration details and submit</p>
            </div>
            <div className="card-body space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Registration Summary</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-700">Event Details</h4>
                    <p className="text-gray-600">{event.name}</p>
                    <p className="text-gray-600">{event.sport_type}</p>
                    <p className="text-gray-600">{new Date(event.start_date).toLocaleDateString()}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-700">Registration Type</h4>
                    <p className="text-gray-600 capitalize">{formData.registration_type}</p>
                    {formData.team_name && (
                      <p className="text-gray-600">Team: {formData.team_name}</p>
                    )}
                  </div>
                </div>
                
                <div className="mt-4">
                  <h4 className="font-medium text-gray-700">Documents Uploaded</h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Object.entries(documents).map(([type, doc]) => (
                      doc?.uploaded && (
                        <span key={type} className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                          ✓ {DOCUMENT_TYPES.find(dt => dt.value === type)?.label}
                        </span>
                      )
                    ))}
                    {Object.entries(kycDocuments).map(([type, doc]) => (
                      doc?.uploaded && (
                        <span key={type} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                          ✓ {KYC_DOCUMENT_TYPES.find(dt => dt.value === type)?.label}
                        </span>
                      )
                    ))}
                  </div>
                </div>
                
                {event.fee_cents > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-700">Payment Status</h4>
                    <p className="text-green-600 font-medium">
                      ✓ Paid ${(event.fee_cents / 100).toFixed(2)} AUD
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <button onClick={prevStep} className="btn btn-secondary">
                  Back
                </button>
                <button 
                  onClick={handleSubmit} 
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting ? 'Submitting...' : 'Submit Registration'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Confirmation */}
        {currentStep === 6 && (
          <div className="card">
            <div className="card-body text-center py-12">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold mb-4">Registration Submitted!</h2>
              <p className="text-gray-600 mb-6">
                Your registration for <strong>{event.name}</strong> has been submitted successfully.
                You will receive a confirmation email shortly.
              </p>
              
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium mb-2">What's Next?</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Your registration is now under review</li>
                  <li>• Event organizers will review your documents and KYC</li>
                  <li>• You'll be notified of the approval status</li>
                  <li>• Check your email for payment receipt (if applicable)</li>
                </ul>
              </div>

              <div className="flex gap-4 justify-center">
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="btn btn-primary"
                >
                  Go to Dashboard
                </button>
                <button 
                  onClick={() => navigate(`/events/${eventId}`)}
                  className="btn btn-secondary"
                >
                  Back to Event
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
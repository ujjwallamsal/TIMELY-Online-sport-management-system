// pages/UpgradeAccount.jsx
import React, { useState, useEffect } from 'react';
import { roleRequestAPI, kycAPI } from '../../services/api.js';
import { toast } from 'react-hot-toast';

const UpgradeAccount = () => {
  const [selectedRole, setSelectedRole] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [kycStatus, setKycStatus] = useState(null);
  const [existingRequest, setExistingRequest] = useState(null);
  const [formData, setFormData] = useState({
    note: '',
    organization_name: '',
    organization_website: '',
    coaching_experience: '',
    sport_discipline: ''
  });

  const roles = [
    {
      id: 'ORGANIZER',
      name: 'Event Organizer',
      description: 'Create and manage sports events, handle registrations, and oversee event operations.',
      icon: '🎯',
      requirements: ['Organization name', 'Website (optional)'],
      benefits: [
        'Create and manage events',
        'Handle participant registrations',
        'Access to event analytics',
        'Custom event branding'
      ]
    },
    {
      id: 'COACH',
      name: 'Coach',
      description: 'Manage teams, track athlete progress, and coordinate training sessions.',
      icon: '🏃‍♂️',
      requirements: ['Coaching experience details'],
      benefits: [
        'Manage team rosters',
        'Track athlete performance',
        'Schedule training sessions',
        'Access coaching tools'
      ]
    },
    {
      id: 'ATHLETE',
      name: 'Athlete',
      description: 'Participate in events, track personal records, and connect with coaches.',
      icon: '🏆',
      requirements: ['Sport discipline'],
      benefits: [
        'Register for events',
        'Track personal records',
        'Connect with coaches',
        'Access training resources'
      ]
    }
  ];

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [kycResponse, requestsResponse] = await Promise.all([
        kycAPI.getProfile().catch(() => ({ data: null })),
        roleRequestAPI.getMyRequests().catch(() => ({ data: [] }))
      ]);

      setKycStatus(kycResponse.data);
      
      // Check for pending request
      const pendingRequest = requestsResponse.data.find(req => req.status === 'pending');
      if (pendingRequest) {
        setExistingRequest(pendingRequest);
        setStep(4); // Show status step
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    setStep(2);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const role = roles.find(r => r.id === selectedRole);
    if (!role) return false;

    if (selectedRole === 'ORGANIZER' && !formData.organization_name.trim()) {
      toast.error('Organization name is required for Organizer role');
      return false;
    }

    if (selectedRole === 'COACH' && !formData.coaching_experience.trim()) {
      toast.error('Coaching experience is required for Coach role');
      return false;
    }

    if (selectedRole === 'ATHLETE' && !formData.sport_discipline.trim()) {
      toast.error('Sport discipline is required for Athlete role');
      return false;
    }

    return true;
  };

  const handleSubmitRequest = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const requestData = {
        requested_role: selectedRole,
        note: formData.note,
        ...(selectedRole === 'ORGANIZER' && {
          organization_name: formData.organization_name,
          organization_website: formData.organization_website
        }),
        ...(selectedRole === 'COACH' && {
          coaching_experience: formData.coaching_experience
        }),
        ...(selectedRole === 'ATHLETE' && {
          sport_discipline: formData.sport_discipline
        })
      };

      await roleRequestAPI.createRequest(requestData);
      toast.success('Role request submitted successfully!');
      setStep(4);
      await loadInitialData();
    } catch (error) {
      console.error('Error submitting role request:', error);
      toast.error(error.response?.data?.error || 'Failed to submit role request');
    } finally {
      setLoading(false);
    }
  };

  const isKycVerified = kycStatus?.status === 'verified' || kycStatus?.status === 'waived';

  if (loading && step === 1) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-lg shadow p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Upgrade Your Account</h1>
          <p className="mt-2 text-gray-600">
            Request access to additional features and capabilities.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3, 4].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= stepNumber
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {stepNumber}
                </div>
                {stepNumber < 4 && (
                  <div
                    className={`w-16 h-1 mx-2 ${
                      step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-4 text-sm text-gray-600">
            <span className={step >= 1 ? 'text-blue-600' : ''}>Choose Role</span>
            <span className={`mx-4 ${step >= 2 ? 'text-blue-600' : ''}`}>Details</span>
            <span className={`mx-4 ${step >= 3 ? 'text-blue-600' : ''}`}>Review</span>
            <span className={step >= 4 ? 'text-blue-600' : ''}>Status</span>
          </div>
        </div>

        {/* Step 1: Role Selection */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Choose Your Role</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {roles.map((role) => (
                <div
                  key={role.id}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-200"
                  onClick={() => handleRoleSelect(role.id)}
                >
                  <div className="p-6">
                    <div className="text-4xl mb-4">{role.icon}</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{role.name}</h3>
                    <p className="text-gray-600 mb-4">{role.description}</p>
                    
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Requirements:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {role.requirements.map((req, index) => (
                          <li key={index} className="flex items-center">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Benefits:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {role.benefits.map((benefit, index) => (
                          <li key={index} className="flex items-center">
                            <span className="text-green-500 mr-2">✓</span>
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Role Details */}
        {step === 2 && (
          <div>
            <div className="mb-6">
              <button
                onClick={() => setStep(1)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                ← Back to role selection
              </button>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              {roles.find(r => r.id === selectedRole)?.name} Details
            </h2>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="space-y-6">
                {/* Common fields */}
                <div>
                  <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-2">
                    Why do you want this role? *
                  </label>
                  <textarea
                    id="note"
                    name="note"
                    value={formData.note}
                    onChange={handleInputChange}
                    rows={4}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Please explain why you're requesting this role and how you plan to use it..."
                  />
                </div>

                {/* Organizer-specific fields */}
                {selectedRole === 'ORGANIZER' && (
                  <>
                    <div>
                      <label htmlFor="organization_name" className="block text-sm font-medium text-gray-700 mb-2">
                        Organization Name *
                      </label>
                      <input
                        type="text"
                        id="organization_name"
                        name="organization_name"
                        value={formData.organization_name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your organization name"
                      />
                    </div>
                    <div>
                      <label htmlFor="organization_website" className="block text-sm font-medium text-gray-700 mb-2">
                        Organization Website
                      </label>
                      <input
                        type="url"
                        id="organization_website"
                        name="organization_website"
                        value={formData.organization_website}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://your-organization.com"
                      />
                    </div>
                  </>
                )}

                {/* Coach-specific fields */}
                {selectedRole === 'COACH' && (
                  <div>
                    <label htmlFor="coaching_experience" className="block text-sm font-medium text-gray-700 mb-2">
                      Coaching Experience *
                    </label>
                    <textarea
                      id="coaching_experience"
                      name="coaching_experience"
                      value={formData.coaching_experience}
                      onChange={handleInputChange}
                      rows={4}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Describe your coaching experience, certifications, and areas of expertise..."
                    />
                  </div>
                )}

                {/* Athlete-specific fields */}
                {selectedRole === 'ATHLETE' && (
                  <div>
                    <label htmlFor="sport_discipline" className="block text-sm font-medium text-gray-700 mb-2">
                      Sport Discipline *
                    </label>
                    <input
                      type="text"
                      id="sport_discipline"
                      name="sport_discipline"
                      value={formData.sport_discipline}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Track and Field, Swimming, Basketball, etc."
                    />
                  </div>
                )}
              </div>

              <div className="mt-8 flex justify-end space-x-4">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div>
            <div className="mb-6">
              <button
                onClick={() => setStep(2)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                ← Back to details
              </button>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Review Your Request</h2>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-gray-700">Requested Role:</span>
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                    {roles.find(r => r.id === selectedRole)?.name}
                  </span>
                </div>

                <div>
                  <span className="text-sm font-medium text-gray-700">Reason:</span>
                  <p className="mt-1 text-gray-600">{formData.note}</p>
                </div>

                {selectedRole === 'ORGANIZER' && (
                  <>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Organization:</span>
                      <p className="mt-1 text-gray-600">{formData.organization_name}</p>
                    </div>
                    {formData.organization_website && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Website:</span>
                        <p className="mt-1 text-gray-600">{formData.organization_website}</p>
                      </div>
                    )}
                  </>
                )}

                {selectedRole === 'COACH' && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Coaching Experience:</span>
                    <p className="mt-1 text-gray-600">{formData.coaching_experience}</p>
                  </div>
                )}

                {selectedRole === 'ATHLETE' && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Sport Discipline:</span>
                    <p className="mt-1 text-gray-600">{formData.sport_discipline}</p>
                  </div>
                )}
              </div>

              {/* KYC Status Warning */}
              {!isKycVerified && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <span className="text-yellow-400">⚠️</span>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        KYC Verification Recommended
                      </h3>
                      <p className="mt-1 text-sm text-yellow-700">
                        While not required, completing KYC verification may speed up the approval process.
                        <a href="/kyc" className="ml-1 text-yellow-800 underline hover:text-yellow-900">
                          Complete KYC verification
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-8 flex justify-end space-x-4">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmitRequest}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Status */}
        {step === 4 && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Request Status</h2>

            {existingRequest ? (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center">
                  <div className="text-6xl mb-4">
                    {existingRequest.status === 'pending' && '⏳'}
                    {existingRequest.status === 'approved' && '✅'}
                    {existingRequest.status === 'rejected' && '❌'}
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {existingRequest.status === 'pending' && 'Request Under Review'}
                    {existingRequest.status === 'approved' && 'Request Approved!'}
                    {existingRequest.status === 'rejected' && 'Request Rejected'}
                  </h3>

                  <p className="text-gray-600 mb-6">
                    {existingRequest.status === 'pending' && 'Your role request is being reviewed by our team. You will be notified once a decision is made.'}
                    {existingRequest.status === 'approved' && 'Congratulations! Your role has been upgraded. You now have access to additional features.'}
                    {existingRequest.status === 'rejected' && 'Unfortunately, your role request was not approved at this time.'}
                  </p>

                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="text-sm text-gray-600 space-y-2">
                      <div>
                        <span className="font-medium">Requested Role:</span> {existingRequest.requested_role_display}
                      </div>
                      <div>
                        <span className="font-medium">Submitted:</span> {new Date(existingRequest.created_at).toLocaleString()}
                      </div>
                      {existingRequest.reviewed_at && (
                        <div>
                          <span className="font-medium">Reviewed:</span> {new Date(existingRequest.reviewed_at).toLocaleString()}
                        </div>
                      )}
                      {existingRequest.review_notes && (
                        <div>
                          <span className="font-medium">Review Notes:</span> {existingRequest.review_notes}
                        </div>
                      )}
                      {existingRequest.rejection_reason && (
                        <div>
                          <span className="font-medium">Rejection Reason:</span> {existingRequest.rejection_reason}
                        </div>
                      )}
                    </div>
                  </div>

                  {existingRequest.status === 'rejected' && (
                    <button
                      onClick={() => {
                        setStep(1);
                        setExistingRequest(null);
                        setFormData({
                          note: '',
                          organization_name: '',
                          organization_website: '',
                          coaching_experience: '',
                          sport_discipline: ''
                        });
                      }}
                      className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Submit New Request
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Request Submitted Successfully!</h3>
                <p className="text-gray-600 mb-6">
                  Your role request has been submitted and is under review. You will be notified once a decision is made.
                </p>
                <button
                  onClick={() => {
                    setStep(1);
                    setFormData({
                      note: '',
                      organization_name: '',
                      organization_website: '',
                      coaching_experience: '',
                      sport_discipline: ''
                    });
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Submit Another Request
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UpgradeAccount;

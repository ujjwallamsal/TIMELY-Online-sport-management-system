import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../services/api.js';
import { useToast } from '../../components/ui/Toast.jsx';
import { 
  UserIcon, 
  AcademicCapIcon, 
  BuildingOfficeIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  DocumentIcon,
  CalendarIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';

const UpgradeCenter = () => {
  const { user, isAuthenticated } = useAuth();
  const { push } = useToast();
  const [applications, setApplications] = useState({
    athlete: null,
    coach: null,
    organizer: null
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeForm, setActiveForm] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchApplications();
    }
  }, [isAuthenticated]);

  const fetchApplications = async () => {
    try {
      const response = await api.get('/auth/applications/');
      setApplications(response.data || {});
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitApplication = async (role, formData) => {
    setSubmitting(true);
    try {
      let endpoint;
      let data = { ...formData };

      // Handle file uploads
      if (role === 'athlete') {
        endpoint = '/auth/apply-athlete/';
        // Convert File objects to FormData
        const formDataObj = new FormData();
        formDataObj.append('date_of_birth', data.date_of_birth);
        formDataObj.append('sports', JSON.stringify(data.sports));
        formDataObj.append('reason', data.reason);
        if (data.id_document) formDataObj.append('id_document', data.id_document);
        if (data.medical_clearance) formDataObj.append('medical_clearance', data.medical_clearance);
        data = formDataObj;
      } else if (role === 'coach') {
        endpoint = '/auth/apply-coach/';
        const formDataObj = new FormData();
        formDataObj.append('sports', JSON.stringify(data.sports));
        formDataObj.append('team_preference', data.team_preference || '');
        formDataObj.append('reason', data.reason);
        if (data.coaching_certificate) formDataObj.append('coaching_certificate', data.coaching_certificate);
        if (data.resume) formDataObj.append('resume', data.resume);
        data = formDataObj;
      } else if (role === 'organizer') {
        endpoint = '/auth/apply-organizer/';
        // Organizer application doesn't require file uploads
      }

      await api.post(endpoint, data);
      push({ 
        type: 'success', 
        title: 'Application Submitted', 
        message: `Your ${role} application has been submitted successfully. You will be notified when it's reviewed.` 
      });
      
      setActiveForm(null);
      fetchApplications();
    } catch (error) {
      push({ 
        type: 'error', 
        title: 'Application Failed', 
        message: error.message || 'Failed to submit application. Please try again.' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'PENDING':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'REJECTED':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Login Required</h2>
          <p className="text-gray-600 mb-6">You need to be logged in to access the upgrade center.</p>
          <div className="space-y-3">
            <Link
              to="/login"
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If user already has a role other than SPECTATOR, redirect to their dashboard
  if (user?.role && user.role !== 'SPECTATOR') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Already Upgraded</h2>
          <p className="text-gray-600 mb-6">
            You already have a {user.role.toLowerCase()} role. You don't need to upgrade.
          </p>
          <Link
            to={user.role === 'ADMIN' ? '/admin' : user.role === 'ORGANIZER' ? '/organizer' : user.role === 'COACH' ? '/coach' : user.role === 'ATHLETE' ? '/athlete' : '/'}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const roleCards = [
    {
      id: 'athlete',
      title: 'Athlete',
      description: 'Participate in sports events and competitions',
      icon: UserIcon,
      requirements: [
        'Valid government-issued ID',
        'Medical clearance certificate',
        'Date of birth verification',
        'Select sports you participate in'
      ],
      color: 'green'
    },
    {
      id: 'coach',
      title: 'Coach',
      description: 'Train and mentor athletes and teams',
      icon: AcademicCapIcon,
      requirements: [
        'Coaching certificate or resume',
        'Sports you can teach',
        'Team preference (optional)',
        'Professional experience'
      ],
      color: 'orange'
    },
    {
      id: 'organizer',
      title: 'Organizer',
      description: 'Create and manage sports events',
      icon: BuildingOfficeIcon,
      requirements: [
        'Organization details',
        'Event management experience',
        'Business registration (if applicable)',
        'Contact information'
      ],
      color: 'purple'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Role Upgrade Center</h1>
          <p className="text-xl text-gray-600">
            Upgrade your account to access more features and participate in the sports community
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {roleCards.map((role) => {
              const application = applications[role.id];
              const hasApplication = application && application.status;
              
              return (
                <div key={role.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className={`p-6 bg-${role.color}-50`}>
                    <div className="flex items-center justify-between">
                      <role.icon className={`h-12 w-12 text-${role.color}-600`} />
                      {hasApplication && getStatusIcon(application.status)}
                    </div>
                    <h3 className="mt-4 text-xl font-semibold text-gray-900">{role.title}</h3>
                    <p className="mt-2 text-gray-600">{role.description}</p>
                  </div>
                  
                  <div className="p-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Requirements:</h4>
                    <ul className="space-y-2 mb-6">
                      {role.requirements.map((req, index) => (
                        <li key={index} className="flex items-center text-sm text-gray-600">
                          <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                          {req}
                        </li>
                      ))}
                    </ul>
                    
                    {hasApplication ? (
                      <div className="space-y-3">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                          {application.status}
                        </div>
                        <p className="text-sm text-gray-500">
                          Submitted: {new Date(application.created_at).toLocaleDateString()}
                        </p>
                        {application.reason && (
                          <p className="text-sm text-gray-600">
                            Reason: {application.reason}
                          </p>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => setActiveForm(role.id)}
                        className={`w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-${role.color}-600 hover:bg-${role.color}-700`}
                      >
                        Apply for {role.title}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Application Forms */}
        {activeForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Apply for {activeForm.charAt(0).toUpperCase() + activeForm.slice(1)}
                  </h3>
                  <button
                    onClick={() => setActiveForm(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>
                
                {activeForm === 'athlete' && (
                  <AthleteForm onSubmit={(data) => handleSubmitApplication('athlete', data)} />
                )}
                {activeForm === 'coach' && (
                  <CoachForm onSubmit={(data) => handleSubmitApplication('coach', data)} />
                )}
                {activeForm === 'organizer' && (
                  <OrganizerForm onSubmit={(data) => handleSubmitApplication('organizer', data)} />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Athlete Application Form
const AthleteForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    date_of_birth: '',
    sports: [],
    reason: '',
    id_document: null,
    medical_clearance: null
  });

  const availableSports = ['Football', 'Basketball', 'Tennis', 'Swimming', 'Track & Field', 'Soccer', 'Baseball', 'Volleyball'];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleFileChange = (field, file) => {
    setFormData(prev => ({ ...prev, [field]: file }));
  };

  const handleSportToggle = (sport) => {
    setFormData(prev => ({
      ...prev,
      sports: prev.sports.includes(sport)
        ? prev.sports.filter(s => s !== sport)
        : [...prev.sports, sport]
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
        <input
          type="date"
          required
          value={formData.date_of_birth}
          onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Sports</label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {availableSports.map((sport) => (
            <label key={sport} className="flex items-center">
              <input
                type="checkbox"
                checked={formData.sports.includes(sport)}
                onChange={() => handleSportToggle(sport)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
              />
              <span className="ml-2 text-sm text-gray-700">{sport}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">ID Document</label>
        <input
          type="file"
          required
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => handleFileChange('id_document', e.target.files[0])}
          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Medical Clearance</label>
        <input
          type="file"
          required
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => handleFileChange('medical_clearance', e.target.files[0])}
          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Reason for Application</label>
        <textarea
          value={formData.reason}
          onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
          rows={3}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="Tell us why you want to become an athlete..."
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => setActiveForm(null)}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
        >
          Submit Application
        </button>
      </div>
    </form>
  );
};

// Coach Application Form
const CoachForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    sports: [],
    team_preference: '',
    reason: '',
    coaching_certificate: null,
    resume: null
  });

  const availableSports = ['Football', 'Basketball', 'Tennis', 'Swimming', 'Track & Field', 'Soccer', 'Baseball', 'Volleyball'];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleFileChange = (field, file) => {
    setFormData(prev => ({ ...prev, [field]: file }));
  };

  const handleSportToggle = (sport) => {
    setFormData(prev => ({
      ...prev,
      sports: prev.sports.includes(sport)
        ? prev.sports.filter(s => s !== sport)
        : [...prev.sports, sport]
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Sports You Can Teach</label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {availableSports.map((sport) => (
            <label key={sport} className="flex items-center">
              <input
                type="checkbox"
                checked={formData.sports.includes(sport)}
                onChange={() => handleSportToggle(sport)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
              />
              <span className="ml-2 text-sm text-gray-700">{sport}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Team Preference (Optional)</label>
        <input
          type="text"
          value={formData.team_preference}
          onChange={(e) => setFormData(prev => ({ ...prev, team_preference: e.target.value }))}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="Specific team or organization you'd like to coach"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Coaching Certificate</label>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => handleFileChange('coaching_certificate', e.target.files[0])}
          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        <p className="text-xs text-gray-500 mt-1">Either certificate or resume is required</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Resume/CV</label>
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={(e) => handleFileChange('resume', e.target.files[0])}
          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        <p className="text-xs text-gray-500 mt-1">Either certificate or resume is required</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Reason for Application</label>
        <textarea
          value={formData.reason}
          onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
          rows={3}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="Tell us about your coaching experience and why you want to become a coach..."
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => setActiveForm(null)}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700"
        >
          Submit Application
        </button>
      </div>
    </form>
  );
};

// Organizer Application Form
const OrganizerForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    reason: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Reason for Application</label>
        <textarea
          value={formData.reason}
          onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
          rows={5}
          required
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="Tell us about your organization, event management experience, and why you want to become an organizer..."
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => setActiveForm(null)}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
        >
          Submit Application
        </button>
      </div>
    </form>
  );
};

export default UpgradeCenter;

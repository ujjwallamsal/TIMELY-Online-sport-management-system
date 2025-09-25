import React, { useState, useEffect } from 'react';
import { useForm } from '../../hooks/useForm';
import { useAuth } from '../../auth/AuthProvider';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../api/client';
import { ENDPOINTS } from '../../api/ENDPOINTS';
import { Form, FormGroup, FormRow, FormActions, Input, Button } from '../../components/Form';
import { User, Mail, Phone, Calendar, MapPin, Shield, Crown, Users, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { z } from 'zod';

interface ProfileData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  address?: string;
  emergency_contact?: string;
}

interface OrganizerApplication {
  reason: string;
  organization_name: string;
  phone: string;
}

const Profile: React.FC = () => {
  const { user, refetchUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [organizerApplication, setOrganizerApplication] = useState<OrganizerApplication>({
    reason: '',
    organization_name: '',
    phone: ''
  });
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);

  const form = useForm<ProfileData>({
    initialValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      phone: user?.profile?.phone || '',
      date_of_birth: user?.profile?.date_of_birth || '',
      address: user?.profile?.address || '',
      emergency_contact: user?.profile?.emergency_contact || '',
    },
    validationSchema: z.object({
      first_name: z.string().min(1, 'First name is required'),
      last_name: z.string().min(1, 'Last name is required'),
      email: z.string().email('Invalid email address'),
      phone: z.string().optional(),
      date_of_birth: z.string().optional(),
      address: z.string().optional(),
      emergency_contact: z.string().optional(),
    }),
    onSubmit: async () => {
      setIsSaving(true);
      try {
        await api.patch(ENDPOINTS.me, form.values);
        
        // Send notification
        await api.post(ENDPOINTS.notifications, {
          title: 'Profile Updated',
          message: `You updated your profile ${new Date().toLocaleTimeString()}`,
          type: 'info'
        });
        
        showSuccess('Profile Updated', 'Your profile has been updated successfully!');
        refetchUser();
        setIsEditing(false);
      } catch (error) {
        console.error('Profile update error:', error);
        showError('Update Failed', 'Failed to update profile. Please try again.');
      } finally {
        setIsSaving(false);
      }
    },
  });

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      form.setValues({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.profile?.phone || '',
        date_of_birth: user.profile?.date_of_birth || '',
        address: user.profile?.address || '',
        emergency_contact: user.profile?.emergency_contact || '',
      });
    }
  }, [user]);

  const handleOrganizerApplication = async () => {
    if (!organizerApplication.reason || !organizerApplication.organization_name || !organizerApplication.phone) {
      showError('Missing Information', 'Please fill in all required fields for the organizer application.');
      return;
    }

    setIsSubmittingApplication(true);
    try {
      await api.post(ENDPOINTS.applyOrganizer, organizerApplication);
      showSuccess('Application Submitted', 'Your organizer application has been submitted successfully!');
      setApplicationStatus('pending');
      setOrganizerApplication({ reason: '', organization_name: '', phone: '' });
    } catch (error) {
      console.error('Organizer application error:', error);
      showError('Application Failed', 'Failed to submit organizer application. Please try again.');
    } finally {
      setIsSubmittingApplication(false);
    }
  };

  const handleAthleteRequest = async () => {
    try {
      await api.post(ENDPOINTS.notifications, {
        title: 'Athlete Role Request',
        message: `${user?.first_name} ${user?.last_name} is requesting athlete role access. Please review their profile.`,
        type: 'info',
        recipient_type: 'admin'
      });
      showSuccess('Request Sent', 'Your athlete role request has been sent to administrators.');
    } catch (error) {
      console.error('Athlete request error:', error);
      showError('Request Failed', 'Failed to send athlete role request. Please try again.');
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Administrator';
      case 'ORGANIZER': return 'Event Organizer';
      case 'COACH': return 'Coach';
      case 'ATHLETE': return 'Athlete';
      case 'SPECTATOR': return 'Spectator';
      default: return role;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return Shield;
      case 'ORGANIZER': return Crown;
      case 'COACH': return Users;
      case 'ATHLETE': return User;
      default: return User;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Profile Not Found</h3>
            <p className="text-gray-500">Unable to load your profile information.</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 mt-2">Manage your account information and role preferences.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Overview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info Card */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Basic Information
                </h2>
                {!isEditing && (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    size="sm"
                  >
                    Edit Profile
                  </Button>
                )}
              </div>

              {isEditing ? (
                <Form onSubmit={form.handleSubmit}>
                  <FormRow>
                    <FormGroup>
                      <Input
                        label="First Name"
                        name="first_name"
                        value={form.values.first_name}
                        onChange={(e) => form.setValue('first_name', e.target.value)}
                        error={form.errors.first_name}
                        required
                      />
                    </FormGroup>
                    <FormGroup>
                      <Input
                        label="Last Name"
                        name="last_name"
                        value={form.values.last_name}
                        onChange={(e) => form.setValue('last_name', e.target.value)}
                        error={form.errors.last_name}
                        required
                      />
                    </FormGroup>
                  </FormRow>

                  <FormGroup>
                    <Input
                      label="Email"
                      name="email"
                      type="email"
                      value={form.values.email}
                      onChange={(e) => form.setValue('email', e.target.value)}
                      error={form.errors.email}
                      required
                    />
                  </FormGroup>

                  <FormGroup>
                    <Input
                      label="Phone"
                      name="phone"
                      value={form.values.phone}
                      onChange={(e) => form.setValue('phone', e.target.value)}
                      error={form.errors.phone}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Input
                      label="Date of Birth"
                      name="date_of_birth"
                      type="date"
                      value={form.values.date_of_birth}
                      onChange={(e) => form.setValue('date_of_birth', e.target.value)}
                      error={form.errors.date_of_birth}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Input
                      label="Address"
                      name="address"
                      value={form.values.address}
                      onChange={(e) => form.setValue('address', e.target.value)}
                      error={form.errors.address}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Input
                      label="Emergency Contact"
                      name="emergency_contact"
                      value={form.values.emergency_contact}
                      onChange={(e) => form.setValue('emergency_contact', e.target.value)}
                      error={form.errors.emergency_contact}
                    />
                  </FormGroup>

                  <FormActions>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      loading={isSaving}
                      disabled={!form.isValid || isSaving}
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </FormActions>
                </Form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Name</p>
                        <p className="font-medium">{user.first_name} {user.last_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{user.email}</p>
                      </div>
                    </div>
                    {user.profile?.phone && (
                      <div className="flex items-center">
                        <Phone className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="font-medium">{user.profile.phone}</p>
                        </div>
                      </div>
                    )}
                    {user.profile?.date_of_birth && (
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm text-gray-500">Date of Birth</p>
                          <p className="font-medium">
                            {new Date(user.profile.date_of_birth).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  {user.profile?.address && (
                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Address</p>
                        <p className="font-medium">{user.profile.address}</p>
                      </div>
                    </div>
                  )}
                  {user.profile?.emergency_contact && (
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Emergency Contact</p>
                        <p className="font-medium">{user.profile.emergency_contact}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Current Role */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Current Role
              </h2>
              <div className="flex items-center space-x-2">
                {(() => {
                  const RoleIcon = getRoleIcon(user.role || 'SPECTATOR');
                  return <RoleIcon className="h-6 w-6 text-primary-600" />;
                })()}
                <span className="text-lg font-medium text-gray-900">
                  {getRoleDisplayName(user.role || 'SPECTATOR')}
                </span>
              </div>
              <p className="text-gray-600 mt-2">
                You currently have {getRoleDisplayName(user.role || 'SPECTATOR').toLowerCase()} access to the platform.
              </p>
            </div>
          </div>

          {/* Upgrade Center */}
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Crown className="h-5 w-5 mr-2" />
                Upgrade Center
              </h2>
              <p className="text-gray-600 mb-6">
                Request additional roles to unlock more features and capabilities.
              </p>

              {/* Organizer Application */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Apply to be Organizer</h3>
                <p className="text-sm text-gray-600">
                  Become an event organizer to create and manage sports events.
                </p>
                
                {applicationStatus === 'pending' ? (
                  <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                    <span className="text-sm text-yellow-800">Application pending review</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Input
                      label="Organization Name"
                      value={organizerApplication.organization_name}
                      onChange={(e) => setOrganizerApplication(prev => ({ ...prev, organization_name: e.target.value }))}
                      placeholder="Your organization or company name"
                    />
                    <Input
                      label="Phone Number"
                      value={organizerApplication.phone}
                      onChange={(e) => setOrganizerApplication(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Your contact phone number"
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reason for Application
                      </label>
                      <textarea
                        value={organizerApplication.reason}
                        onChange={(e) => setOrganizerApplication(prev => ({ ...prev, reason: e.target.value }))}
                        placeholder="Tell us why you want to become an organizer..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        rows={3}
                      />
                    </div>
                    <Button
                      onClick={handleOrganizerApplication}
                      loading={isSubmittingApplication}
                      disabled={isSubmittingApplication}
                      className="w-full"
                    >
                      {isSubmittingApplication ? 'Submitting...' : 'Apply to be Organizer'}
                    </Button>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 my-6"></div>

              {/* Athlete Request */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Become Athlete</h3>
                <p className="text-sm text-gray-600">
                  Request athlete access to participate in sports events and competitions.
                </p>
                <Button
                  onClick={handleAthleteRequest}
                  variant="outline"
                  className="w-full"
                >
                  Request Athlete Access
                </Button>
              </div>
            </div>

            {/* Account Status */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Account Status</span>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm font-medium text-green-600">Active</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Email Verified</span>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm font-medium text-green-600">Verified</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Member Since</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date().toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

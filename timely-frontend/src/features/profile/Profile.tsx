import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from '../../hooks/useForm';
import { useAuth } from '../../auth/AuthProvider';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../api/client';
import { ENDPOINTS } from '../../api/ENDPOINTS';
import { Form, FormGroup, FormRow, FormActions, Input, Button } from '../../components/Form';
import { User, Mail, Shield, Crown, Users, Clock, CheckCircle, Eye, EyeOff, Lock } from 'lucide-react';
import { z } from 'zod';
import { validatePassword, validateConfirmPassword } from '../../utils/validators';

interface ProfileData {
  first_name: string;
  last_name: string;
  email: string;
  username?: string;
}

interface PasswordChangeData {
  current_password: string;
  new_password: string;
  confirm_new_password: string;
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
  
  // Password change state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState<PasswordChangeData>({
    current_password: '',
    new_password: '',
    confirm_new_password: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  const form = useForm<ProfileData>({
    initialValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      username: (user as any)?.username || '',
    },
    validationSchema: z.object({
      first_name: z.string().min(1, 'First name is required'),
      last_name: z.string().min(1, 'Last name is required'),
      email: z.string().email('Invalid email address'),
      username: z.string().optional(),
    }),
    onSubmit: async () => {
      setIsSaving(true);
      try {
        // Call the me endpoint with PATCH
        await api.patch('/users/me/', form.values);
        
        // Send notification (optional, don't fail if it errors)
        try {
          await api.post(ENDPOINTS.notifications, {
            title: 'Profile Updated',
            message: `You updated your profile ${new Date().toLocaleTimeString()}`,
            type: 'info'
          });
        } catch (notifError) {
          console.log('Notification failed (non-critical):', notifError);
        }
        
        showSuccess('Profile Updated', 'Your profile has been updated successfully!');
        await refetchUser();
        setIsEditing(false);
      } catch (error: any) {
        console.error('Profile update error:', error);
        const errorMessage = error?.response?.data?.detail || error?.response?.data?.error || 'Failed to update profile. Please try again.';
        showError('Update Failed', errorMessage);
      } finally {
        setIsSaving(false);
      }
    },
  });

  // Update form when user data changes - only once when component mounts
  // Wrapped in useCallback to prevent re-render loop
  const initializeForm = useCallback(() => {
    if (user && !isEditing) {
      form.setValues({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        username: (user as any)?.username || '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.first_name, user?.last_name, user?.email, (user as any)?.username, isEditing]);
  
  useEffect(() => {
    initializeForm();
  }, [initializeForm]);

  // Password change handlers
  const handlePasswordChange = async () => {
    setPasswordErrors({});
    
    // Client-side validation
    const errors: Record<string, string> = {};
    
    if (!passwordForm.current_password) {
      errors.current_password = 'Current password is required';
    }
    
    const newPasswordError = validatePassword(passwordForm.new_password);
    if (newPasswordError) {
      errors.new_password = newPasswordError;
    }
    
    const confirmPasswordError = validateConfirmPassword(passwordForm.new_password, passwordForm.confirm_new_password);
    if (confirmPasswordError) {
      errors.confirm_new_password = confirmPasswordError;
    }
    
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }
    
    setIsPasswordSaving(true);
    try {
      // Use the correct endpoint with user ID
      if (!user?.id) {
        showError('Error', 'User not found');
        return;
      }
      
      await api.post(`/users/${user.id}/change-password/`, {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
        new_password_confirm: passwordForm.confirm_new_password
      });
      
      showSuccess('Password Updated', 'Your password has been changed successfully');
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_new_password: ''
      });
      setIsChangingPassword(false);
    } catch (error: any) {
      console.error('Password change error:', error);
      if (error.response?.data) {
        setPasswordErrors(error.response.data);
      } else {
        showError('Password Change Failed', 'Failed to change password. Please try again.');
      }
    } finally {
      setIsPasswordSaving(false);
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleOrganizerApplication = async () => {
    if (!organizerApplication.reason || !organizerApplication.organization_name || !organizerApplication.phone) {
      showError('Missing Information', 'Please fill in all required fields for the organizer application.');
      return;
    }

    setIsSubmittingApplication(true);
    try {
      await api.post(ENDPOINTS.applyOrganizer, {
        reason: organizerApplication.reason,
        organization_name: organizerApplication.organization_name,
        phone: organizerApplication.phone
      });
      showSuccess('Application Submitted', 'Your organizer application has been submitted successfully!');
      setApplicationStatus('pending');
      setOrganizerApplication({ reason: '', organization_name: '', phone: '' });
    } catch (error: any) {
      console.error('Organizer application error:', error);
      const errorMessage = error?.response?.data?.error || error?.response?.data?.detail || 'Failed to submit organizer application. Please try again.';
      showError('Application Failed', errorMessage);
    } finally {
      setIsSubmittingApplication(false);
    }
  };

  const handleAthleteRequest = async () => {
    setIsSubmittingApplication(true);
    try {
      await api.post(ENDPOINTS.applyAthlete, {
        reason: 'Requesting athlete access to participate in events'
      });
      showSuccess('Request Sent', 'Your athlete role request has been submitted successfully!');
    } catch (error: any) {
      console.error('Athlete request error:', error);
      const errorMessage = error?.response?.data?.error || error?.response?.data?.detail || 'Failed to send athlete role request. Please try again.';
      showError('Request Failed', errorMessage);
    } finally {
      setIsSubmittingApplication(false);
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
          <div className="card text-center">
            <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Profile Unavailable</h3>
            <p className="text-gray-600 mb-6">We couldn't load your profile right now. This may be a temporary issue.</p>
            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => window.history.back()}
              >
                Go Back
              </Button>
              <Button
                onClick={async () => {
                  try {
                    await refetchUser();
                    showSuccess('Retrying', 'Attempting to reload your profile...');
                  } catch (e) {
                    showError('Still Unavailable', 'Please try again in a moment.');
                  }
                }}
              >
                Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 lg:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Manage your account information and role preferences.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Profile Overview */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Basic Info Card */}
            <div className="card">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Basic Information
                </h2>
                {!isEditing && (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
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
                      disabled
                      helperText="Email cannot be changed"
                    />
                  </FormGroup>

                  <FormGroup>
                    <Input
                      label="Username (Optional)"
                      name="username"
                      value={form.values.username}
                      onChange={(e) => form.setValue('username', e.target.value)}
                      error={form.errors.username}
                      helperText="Optional display name"
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
                <div className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="flex items-center p-3 sm:p-0">
                      <User className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-gray-500">Name</p>
                        <p className="font-medium text-sm sm:text-base truncate">{user.first_name} {user.last_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center p-3 sm:p-0">
                      <Mail className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-gray-500">Email</p>
                        <p className="font-medium text-sm sm:text-base truncate">{user.email}</p>
                      </div>
                    </div>
                    {(user as any)?.username && (
                      <div className="flex items-center p-3 sm:p-0">
                        <User className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm text-gray-500">Username</p>
                          <p className="font-medium text-sm sm:text-base truncate">{(user as any)?.username}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Current Role */}
            <div className="card">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Current Role
              </h2>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                {(() => {
                  const RoleIcon = getRoleIcon(user.role || 'SPECTATOR');
                  return <RoleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />;
                })()}
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-blue-100 text-blue-800">
                  {getRoleDisplayName(user.role || 'SPECTATOR')}
                </span>
              </div>
              <p className="text-sm sm:text-base text-gray-600">
                You currently have {getRoleDisplayName(user.role || 'SPECTATOR').toLowerCase()} access to the platform.
              </p>
            </div>

            {/* Change Password */}
            <div className="card">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center">
                  <Lock className="h-5 w-5 mr-2" />
                  Change Password
                </h2>
                {!isChangingPassword && (
                  <Button
                    onClick={() => setIsChangingPassword(true)}
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    Change Password
                  </Button>
                )}
              </div>

              {isChangingPassword ? (
                <div className="space-y-4">
                  <FormGroup>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showPasswords.current ? "text" : "password"}
                        value={passwordForm.current_password}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))}
                        error={passwordErrors.current_password}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('current')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormGroup>

                  <FormGroup>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showPasswords.new ? "text" : "password"}
                        value={passwordForm.new_password}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, new_password: e.target.value }))}
                        error={passwordErrors.new_password}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('new')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormGroup>

                  <FormGroup>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showPasswords.confirm ? "text" : "password"}
                        value={passwordForm.confirm_new_password}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm_new_password: e.target.value }))}
                        error={passwordErrors.confirm_new_password}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('confirm')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormGroup>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsChangingPassword(false);
                        setPasswordForm({
                          current_password: '',
                          new_password: '',
                          confirm_new_password: ''
                        });
                        setPasswordErrors({});
                      }}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handlePasswordChange}
                      loading={isPasswordSaving}
                      disabled={isPasswordSaving}
                      className="w-full sm:w-auto"
                    >
                      {isPasswordSaving ? 'Changing Password...' : 'Change Password'}
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm sm:text-base text-gray-600">
                  Click "Change Password" to update your account password.
                </p>
              )}
            </div>
          </div>

          {/* Upgrade Center */}
          <div className="space-y-4 sm:space-y-6">
            <div className="card">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                <Crown className="h-5 w-5 mr-2" />
                Upgrade Center
              </h2>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                Request additional roles to unlock more features and capabilities.
              </p>

              {/* Organizer Application */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">Apply to be Organizer</h3>
                <p className="text-xs sm:text-sm text-gray-600">
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
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
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">Become Athlete</h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  Request athlete access to participate in sports events and competitions.
                </p>
                <Button
                  onClick={handleAthleteRequest}
                  variant="outline"
                  className="w-full"
                  loading={isSubmittingApplication}
                  disabled={isSubmittingApplication}
                >
                  {isSubmittingApplication ? 'Submitting...' : 'Request Athlete Access'}
                </Button>
              </div>
            </div>

            {/* Account Status */}
            <div className="card">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Account Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-gray-600">Account Status</span>
                  <div className="flex items-center">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-1" />
                    <span className="text-xs sm:text-sm font-medium text-green-600">Active</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-gray-600">Email Verified</span>
                  <div className="flex items-center">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-1" />
                    <span className="text-xs sm:text-sm font-medium text-green-600">Verified</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-gray-600">Member Since</span>
                  <span className="text-xs sm:text-sm font-medium text-gray-900">
                    {user.date_joined ? new Date(user.date_joined).toLocaleDateString() : 'Unknown'}
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

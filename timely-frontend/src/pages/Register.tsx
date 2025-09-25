import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useForm } from '../hooks/useForm';
import { registerSchema, type RegisterFormData } from '../schemas/auth';
import { Input, Button, Select } from '../components/Form';

const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const form = useForm<RegisterFormData>({
    initialValues: {
      email: '',
      password: '',
      confirmPassword: '',
      first_name: '',
      last_name: '',
      role: 'ATHLETE',
    },
    validationSchema: registerSchema,
    onSubmit: async (values) => {
      try {
        await register({
          email: values.email,
          password: values.password,
          first_name: values.first_name,
          last_name: values.last_name,
          role: values.role,
        });
        
        // Redirect to login after successful registration
        navigate('/login', { 
          state: { message: 'Registration successful! Please login with your credentials.' }
        });
      } catch (err) {
        form.setError('email', err instanceof Error ? err.message : 'Registration failed');
      }
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link
            to="/login"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            sign in to your existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={form.handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                type="text"
                name="first_name"
                value={form.values.first_name}
                onChange={(e) => form.setValue('first_name', e.target.value)}
                onBlur={() => form.validateField('first_name')}
                error={form.errors.first_name}
                placeholder="First name"
                required
              />

              <Input
                label="Last Name"
                type="text"
                name="last_name"
                value={form.values.last_name}
                onChange={(e) => form.setValue('last_name', e.target.value)}
                onBlur={() => form.validateField('last_name')}
                error={form.errors.last_name}
                placeholder="Last name"
                required
              />
            </div>

            <Input
              label="Email address"
              type="email"
              name="email"
              value={form.values.email}
              onChange={(e) => form.setValue('email', e.target.value)}
              onBlur={() => form.validateField('email')}
              error={form.errors.email}
              placeholder="Enter your email"
              autoComplete="email"
              required
            />

            <Select
              label="Role"
              name="role"
              value={form.values.role}
              onChange={(e) => form.setValue('role', e.target.value as any)}
              onBlur={() => form.validateField('role')}
              error={form.errors.role}
              options={[
                { value: 'ATHLETE', label: 'Athlete' },
                { value: 'SPECTATOR', label: 'Spectator' },
                { value: 'COACH', label: 'Coach' },
                { value: 'ORGANIZER', label: 'Organizer' },
              ]}
            />

            <Input
              label="Password"
              type="password"
              name="password"
              value={form.values.password}
              onChange={(e) => form.setValue('password', e.target.value)}
              onBlur={() => form.validateField('password')}
              error={form.errors.password}
              placeholder="Enter your password"
              autoComplete="new-password"
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={form.values.confirmPassword}
              onChange={(e) => form.setValue('confirmPassword', e.target.value)}
              onBlur={() => form.validateField('confirmPassword')}
              error={form.errors.confirmPassword}
              placeholder="Confirm your password"
              autoComplete="new-password"
              required
            />

            <Button
              type="submit"
              loading={form.isSubmitting}
              disabled={!form.isValid || form.isSubmitting}
              className="w-full"
            >
              Create account
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;

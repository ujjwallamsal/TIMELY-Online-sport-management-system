import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getDashboardRoute } from '../utils/role';
import { useForm } from '../hooks/useForm';
import { loginSchema, type LoginFormData } from '../schemas/auth';
import { Input, Button } from '../components/Form';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const form = useForm<LoginFormData>({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: loginSchema,
    onSubmit: async (values) => {
      try {
        await login(values.email, values.password);
        // Get user roles from auth context after successful login
        const userRoles = JSON.parse(localStorage.getItem('timely_user_roles') || '[]');
        const dashboardRoute = getDashboardRoute(userRoles);
        navigate(dashboardRoute, { replace: true });
      } catch (err) {
        form.setError('email', err instanceof Error ? err.message : 'Login failed');
      }
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link
            to="/register"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={form.handleSubmit}>
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

            <Input
              label="Password"
              type="password"
              name="password"
              value={form.values.password}
              onChange={(e) => form.setValue('password', e.target.value)}
              onBlur={() => form.validateField('password')}
              error={form.errors.password}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />

            <Button
              type="submit"
              loading={form.isSubmitting}
              disabled={!form.isValid || form.isSubmitting}
              className="w-full"
            >
              Sign in
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;

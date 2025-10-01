import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getDashboardRoute } from '../utils/role';
import { useForm } from '../hooks/useForm';
import { loginSchema, type LoginFormData } from '../schemas/auth';
import { Input, Button } from '../components/Form';
import { Eye, EyeOff } from 'lucide-react';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  
  // Get redirect URL from query params
  const returnTo = searchParams.get('returnTo') || searchParams.get('redirectTo');

  const form = useForm<LoginFormData>({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: loginSchema,
    onSubmit: async (values) => {
      try {
        await login(values.email, values.password);
        
        // Redirect to returnTo URL if provided, otherwise to dashboard
        if (returnTo) {
          navigate(decodeURIComponent(returnTo), { replace: true });
        } else {
          // Get user roles from auth context after successful login
          const userRoles = JSON.parse(localStorage.getItem('timely_user_roles') || '[]');
          const dashboardRoute = getDashboardRoute(userRoles);
          navigate(dashboardRoute, { replace: true });
        }
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

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.values.password}
                onChange={(e) => form.setValue('password', e.target.value)}
                onBlur={() => form.validateField('password')}
                error={form.errors.password}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

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

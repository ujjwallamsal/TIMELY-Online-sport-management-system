import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/Toast.jsx';

export default function Register() {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    password_confirm: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { signup, getRoleBasedPath } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.first_name) e.first_name = 'First name is required';
    if (!form.last_name) e.last_name = 'Last name is required';
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Min 6 characters';
    if (!form.password_confirm) e.password_confirm = 'Confirm your password';
    else if (form.password_confirm !== form.password) e.password_confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await signup({ ...form });
      push({ type: 'success', title: 'Account created', message: 'Welcome to Timely!' });
      // After signup, user is logged in; route based on role via me
      navigate(getRoleBasedPath('SPECTATOR'), { replace: true });
    } catch (err) {
      const status = err?.status || err?.response?.status;
      if (status === 400 && err?.data) {
        setErrors(err.data);
        push({ type: 'error', title: 'Sign up failed', message: 'Fix the highlighted errors.' });
      } else {
        push({ type: 'error', title: 'Sign up failed', message: err?.message || 'Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto px-4 py-10">
        <h1 className="text-2xl font-semibold mb-6">Create an account</h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">First name</label>
              <Input id="first_name" name="first_name" value={form.first_name} onChange={handleChange} placeholder="Jane" error={!!errors.first_name} />
              {errors.first_name ? <p className="mt-1 text-xs text-red-600">{errors.first_name}</p> : null}
            </div>
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
              <Input id="last_name" name="last_name" value={form.last_name} onChange={handleChange} placeholder="Doe" error={!!errors.last_name} />
              {errors.last_name ? <p className="mt-1 text-xs text-red-600">{errors.last_name}</p> : null}
            </div>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <Input id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={handleChange} placeholder="you@example.com" error={!!errors.email} />
            {errors.email ? <p className="mt-1 text-xs text-red-600">{errors.email}</p> : null}
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <Input id="password" name="password" type="password" autoComplete="new-password" value={form.password} onChange={handleChange} placeholder="••••••••" error={!!errors.password} />
            {errors.password ? <p className="mt-1 text-xs text-red-600">{errors.password}</p> : null}
          </div>
          <div>
            <label htmlFor="password_confirm" className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
            <Input id="password_confirm" name="password_confirm" type="password" autoComplete="new-password" value={form.password_confirm} onChange={handleChange} placeholder="••••••••" error={!!errors.password_confirm} />
            {errors.password_confirm ? <p className="mt-1 text-xs text-red-600">{errors.password_confirm}</p> : null}
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={loading} loading={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </Button>
        </form>
        <p className="mt-4 text-sm text-gray-600">
          Already have an account? <Link to="/login" className="text-blue-600 hover:text-blue-500">Sign in</Link>
        </p>
      </div>
    </div>
  );
}



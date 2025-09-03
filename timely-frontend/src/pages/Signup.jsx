import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { TrophyIcon } from '@heroicons/react/24/outline';

const ROLES = [
  { value: "SPECTATOR", label: "Spectator", description: "Browse and attend events" },
  { value: "ATHLETE", label: "Athlete", description: "Participate in sports events" },
  { value: "COACH", label: "Coach", description: "Train and guide athletes" },
  { value: "ORGANIZER", label: "Organizer", description: "Create and manage events" },
  { value: "ADMIN", label: "Admin", description: "Full system access" }
];

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [form, setForm] = useState({ 
    first_name: "", 
    last_name: "", 
    email: "", 
    password: "", 
    password_confirm: "",
    role: "SPECTATOR" 
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function upd(k, v) { 
    setForm((s) => ({ ...s, [k]: v })); 
    // Clear field-specific error when user starts typing
    if (errors[k]) {
      setErrors(prev => ({ ...prev, [k]: "" }));
    }
  }

  // Client-side validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!form.first_name.trim()) {
      newErrors.first_name = "First name is required";
    } else if (form.first_name.trim().length < 2) {
      newErrors.first_name = "First name must be at least 2 characters";
    }
    
    if (!form.last_name.trim()) {
      newErrors.last_name = "Last name is required";
    } else if (form.last_name.trim().length < 2) {
      newErrors.last_name = "Last name must be at least 2 characters";
    }
    
    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
      newErrors.password = "Password must contain uppercase, lowercase, and number";
    }
    
    if (!form.password_confirm) {
      newErrors.password_confirm = "Please confirm your password";
    } else if (form.password !== form.password_confirm) {
      newErrors.password_confirm = "Passwords do not match";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  async function onSubmit(e) {
    e.preventDefault(); 
    setError(""); 
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      await signup(form);
      setDone(true);
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err) {
      setError(err.message || "Signup failed. Please try again.");
    } finally { 
      setLoading(false); 
    }
  }

  const getFieldError = (fieldName) => errors[fieldName] || "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation Bar */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <TrophyIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Timely Sports
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link to="/" className="text-gray-600 hover:text-blue-600 font-medium">
                Home
              </Link>
              <Link to="/events" className="text-gray-600 hover:text-blue-600 font-medium">
                Events
              </Link>
              <Link to="/schedule" className="text-gray-600 hover:text-blue-600 font-medium">
                Schedule
              </Link>
              <Link to="/results" className="text-gray-600 hover:text-blue-600 font-medium">
                Results
              </Link>
              <Link to="/news" className="text-gray-600 hover:text-blue-600 font-medium">
                News
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-6">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-white">T</span>
          </div>
          <h1 className="mt-6 text-3xl font-extrabold text-gray-900">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Join Timely and start your sports journey
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-xl rounded-xl border border-gray-100">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg" role="alert" aria-live="polite">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          {done && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg" role="alert" aria-live="polite">
              <p className="text-sm text-green-600">
                🎉 Account created successfully! Redirecting to dashboard...
              </p>
            </div>
          )}

          <form className="space-y-6" onSubmit={onSubmit} noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
                  First name <span className="text-red-500">*</span>
                </label>
                <input 
                  id="first_name"
                  name="first_name"
                  type="text"
                  required
                  aria-describedby={getFieldError("first_name") ? "first_name-error" : undefined}
                  aria-invalid={!!getFieldError("first_name")}
                  className={`appearance-none relative block w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:z-10 sm:text-sm transition-all duration-200 ${
                    getFieldError("first_name") 
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500" 
                      : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  }`}
                  value={form.first_name} 
                  onChange={(e) => upd("first_name", e.target.value)}
                  placeholder="John"
                />
                {getFieldError("first_name") && (
                  <p id="first_name-error" className="mt-1 text-sm text-red-600" role="alert">
                    {getFieldError("first_name")}
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Last name <span className="text-red-500">*</span>
                </label>
                <input 
                  id="last_name"
                  name="last_name"
                  type="text"
                  required
                  aria-describedby={getFieldError("last_name") ? "last_name-error" : undefined}
                  aria-invalid={!!getFieldError("last_name")}
                  className={`appearance-none relative block w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:z-10 sm:text-sm transition-all duration-200 ${
                    getFieldError("last_name") 
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500" 
                      : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  }`}
                  value={form.last_name} 
                  onChange={(e) => upd("last_name", e.target.value)}
                  placeholder="Doe"
                />
                {getFieldError("last_name") && (
                  <p id="last_name-error" className="mt-1 text-sm text-red-600" role="alert">
                    {getFieldError("last_name")}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address <span className="text-red-500">*</span>
              </label>
              <input 
                id="email"
                name="email"
                type="email" 
                required
                aria-describedby={getFieldError("email") ? "email-error" : undefined}
                aria-invalid={!!getFieldError("email")}
                className={`appearance-none relative block w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:z-10 sm:text-sm transition-all duration-200 ${
                  getFieldError("email") 
                    ? "border-red-300 focus:ring-red-500 focus:border-red-500" 
                    : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                }`}
                value={form.email} 
                onChange={(e) => upd("email", e.target.value)}
                placeholder="you@example.com"
              />
              {getFieldError("email") && (
                <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
                  {getFieldError("email")}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <input 
                id="password"
                name="password"
                type="password" 
                required
                minLength={8}
                aria-describedby={getFieldError("password") ? "password-error" : "password-help"}
                aria-invalid={!!getFieldError("password")}
                className={`appearance-none relative block w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:z-10 sm:text-sm transition-all duration-200 ${
                  getFieldError("password") 
                    ? "border-red-300 focus:ring-red-500 focus:border-red-500" 
                    : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                }`}
                value={form.password} 
                onChange={(e) => upd("password", e.target.value)}
                placeholder="••••••••"
              />
              {getFieldError("password") ? (
                <p id="password-error" className="mt-1 text-sm text-red-600" role="alert">
                  {getFieldError("password")}
                </p>
              ) : (
                <p id="password-help" className="mt-1 text-xs text-gray-500">
                  Minimum 8 characters with uppercase, lowercase, and number
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password_confirm" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input 
                id="password_confirm"
                name="password_confirm"
                type="password" 
                required
                aria-describedby={getFieldError("password_confirm") ? "password_confirm-error" : undefined}
                aria-invalid={!!getFieldError("password_confirm")}
                className={`appearance-none relative block w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:z-10 sm:text-sm transition-all duration-200 ${
                  getFieldError("password_confirm") 
                    ? "border-red-300 focus:ring-red-500 focus:border-red-500" 
                    : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                }`}
                value={form.password_confirm} 
                onChange={(e) => upd("password_confirm", e.target.value)}
                placeholder="••••••••"
              />
              {getFieldError("password_confirm") && (
                <p id="password_confirm-error" className="mt-1 text-sm text-red-600" role="alert">
                  {getFieldError("password_confirm")}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select 
                id="role"
                name="role"
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition-all duration-200"
                value={form.role} 
                onChange={(e) => upd("role", e.target.value)}
              >
                {ROLES.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label} - {role.description}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Choose the role that best describes your involvement
              </p>
            </div>

            <button 
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              disabled={loading}
              aria-describedby={loading ? "loading-text" : undefined}
            >
              {loading ? (
                <div className="flex items-center" id="loading-text">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" aria-hidden="true"></div>
                  Creating account...
                </div>
              ) : (
                "Create account"
              )}
            </button>

            <p className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <a 
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                href="/login"
              >
                Sign in here
              </a>
            </p>
          </form>
        </div>
        </div>
      </div>
    </div>
  );
}

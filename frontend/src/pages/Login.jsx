import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showSampleAccounts, setShowSampleAccounts] = useState(true);

  const sampleAccounts = [
    { role: 'Super Admin', email: 'superadmin@paypal.test', password: 'SuperAdmin123!', color: 'bg-purple-500', icon: '👑' },
    { role: 'Admin', email: 'admin@paypal.test', password: 'Admin123!', color: 'bg-red-500', icon: '🛡️' },
    { role: 'Manager', email: 'manager@paypal.test', password: 'Manager123!', color: 'bg-blue-500', icon: '📊' },
    { role: 'User', email: 'user@paypal.test', password: 'User123!', color: 'bg-green-500', icon: '👤' },
  ];

  const fillCredentials = (email, password) => {
    setFormData({ email, password });
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const response = await login(formData);
      
      if (response.requires_2fa) {
        // Redirect to 2FA verification page
        navigate('/verify-2fa', { state: { userId: response.user_id } });
      } else {
        // Login successful, redirect to dashboard
        navigate('/dashboard');
      }
    } catch (error) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({ general: error.response?.data?.message || 'Login failed. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl w-full flex gap-6">
        {/* Login Form */}
        <div className="flex-1 space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Sign in to your account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Or{' '}
              <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
                create a new account
              </Link>
            </p>
          </div>

          <div className="card">
            {errors.general && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{errors.general}</p>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="label">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="input-field"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
                {errors.email && (
                  <p className="error-message">{errors.email[0]}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="label">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="input-field"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
                {errors.password && (
                  <p className="error-message">{errors.password[0]}</p>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary"
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
              </div>
            </form>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Secure authentication with 2FA support
            </p>
          </div>
        </div>

        {/* Sample Accounts Panel */}
        {showSampleAccounts && (
          <div className="w-96 space-y-4">
            <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  🧪 Demo Accounts
                </h3>
                <button
                  onClick={() => setShowSampleAccounts(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Hide demo accounts"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="text-xs text-gray-600 mb-4">
                Click any account below to auto-fill the login form for testing different roles.
              </p>

              <div className="space-y-3">
                {sampleAccounts.map((account) => (
                  <button
                    key={account.role}
                    onClick={() => fillCredentials(account.email, account.password)}
                    className="w-full text-left p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`${account.color} w-10 h-10 rounded-lg flex items-center justify-center text-white text-xl flex-shrink-0 group-hover:scale-110 transition-transform`}>
                        {account.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-gray-900">{account.role}</span>
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                            Click to use
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 truncate" title={account.email}>
                          {account.email}
                        </p>
                        <p className="text-xs text-gray-500 font-mono mt-1">
                          {account.password}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800 flex items-start gap-2">
                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>
                    <strong>Development Only:</strong> These demo accounts are for testing purposes. Remove in production.
                  </span>
                </p>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => setShowSampleAccounts(false)}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Hide demo accounts
              </button>
            </div>
          </div>
        )}

        {/* Show Demo Accounts Button (when hidden) */}
        {!showSampleAccounts && (
          <button
            onClick={() => setShowSampleAccounts(true)}
            className="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg transition-all flex items-center gap-2 group"
          >
            <span className="text-lg group-hover:scale-110 transition-transform">🧪</span>
            <span className="text-sm font-medium">Show Demo Accounts</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default Login;

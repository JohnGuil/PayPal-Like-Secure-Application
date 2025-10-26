import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout, updateUser, refreshUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [recentLogins, setRecentLogins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const data = await refreshUser();
      setUserData(data.user);
      setRecentLogins(data.recent_logins || []);
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getBrowserName = (userAgent) => {
    if (!userAgent) return 'Unknown';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <button onClick={handleLogout} className="btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Balance Card - PayPal Style */}
        <div className="mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-8 text-white">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-white text-sm mb-1 opacity-90">Available Balance</p>
                  <h2 className="text-5xl font-bold">
                    ${parseFloat(userData?.balance || user?.balance || 0).toFixed(2)}
                  </h2>
                  <p className="text-white text-sm mt-1 opacity-90">
                    {userData?.currency || user?.currency || 'USD'}
                  </p>
                </div>
                <div className="bg-white bg-opacity-20 p-4 rounded-xl">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              
              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => navigate('/transactions')}
                  className="flex-1 bg-white text-blue-700 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Send Money
                </button>
                <button
                  onClick={() => navigate('/transactions')}
                  className="flex-1 bg-blue-700 bg-opacity-50 text-white px-6 py-3 rounded-lg font-semibold hover:bg-opacity-70 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  View History
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Information */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Account Information</h2>
              <dl className="grid grid-cols-1 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{userData?.full_name || user?.full_name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{userData?.email || user?.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Mobile Number</dt>
                  <dd className="mt-1 text-sm text-gray-900">{userData?.mobile_number || user?.mobile_number}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Two-Factor Authentication</dt>
                  <dd className="mt-1">
                    {userData?.two_factor_enabled || user?.two_factor_enabled ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        ✓ Enabled
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                        ✗ Disabled
                      </span>
                    )}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Account Security */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Account Security</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Last Login</h3>
                  <p className="text-sm text-gray-900">
                    {formatDate(userData?.last_login_at)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    IP Address: {userData?.last_login_ip || 'N/A'}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Recent Login Activity</h3>
                  <div className="space-y-2">
                    {recentLogins.length > 0 ? (
                      recentLogins.map((login, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {getBrowserName(login.user_agent)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {login.ip_address} • {formatDate(login.created_at)}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No recent login activity</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2FA Management */}
          <div className="lg:col-span-1">
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Two-Factor Authentication</h2>
              <p className="text-sm text-gray-600 mb-4">
                Add an extra layer of security to your account by enabling two-factor authentication.
              </p>

              {userData?.two_factor_enabled || user?.two_factor_enabled ? (
                <div>
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800 font-medium">2FA is currently enabled</p>
                    <p className="text-xs text-green-600 mt-1">Your account is protected</p>
                  </div>
                  <button
                    onClick={() => navigate('/disable-2fa')}
                    className="w-full btn-secondary"
                  >
                    Disable 2FA
                  </button>
                </div>
              ) : (
                <div>
                  <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800 font-medium">2FA is not enabled</p>
                    <p className="text-xs text-yellow-600 mt-1">Enable it for better security</p>
                  </div>
                  <button
                    onClick={() => navigate('/setup-2fa')}
                    className="w-full btn-primary"
                  >
                    Enable 2FA
                  </button>
                </div>
              )}

              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Security Tips</h3>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Use a strong, unique password</li>
                  <li>• Enable 2FA for extra security</li>
                  <li>• Review login activity regularly</li>
                  <li>• Never share your credentials</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

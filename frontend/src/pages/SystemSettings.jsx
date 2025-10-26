import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Select from '../components/Select';

export default function SystemSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('application');

  // Helper function to safely parse integers
  const safeParseInt = (value, fallback = 0) => {
    const parsed = parseInt(value);
    return isNaN(parsed) ? fallback : parsed;
  };

  // Helper function to safely parse floats
  const safeParseFloat = (value, fallback = 0) => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? fallback : parsed;
  };

  const [settings, setSettings] = useState({
    // Application Settings
    app_name: 'PayPal Clone',
    app_url: 'https://paypal-clone.local',
    timezone: 'UTC',
    maintenance_mode: false,
    
    // Security Settings
    session_timeout: 30,
    password_min_length: 8,
    password_require_uppercase: true,
    password_require_lowercase: true,
    password_require_numbers: true,
    password_require_special: true,
    enforce_2fa: false,
    max_login_attempts: 5,
    lockout_duration: 15,
    
    // Email Settings
    smtp_host: 'smtp.mailtrap.io',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    smtp_encryption: 'tls',
    from_email: 'noreply@paypal-clone.local',
    from_name: 'PayPal Clone',
    
    // Notification Settings
    notify_new_user: true,
    notify_large_transaction: true,
    large_transaction_amount: 1000,
    notify_failed_login: true,
    
    // API Settings
    api_rate_limit: 100,
    api_rate_limit_window: 60,
    api_timeout: 30
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/settings');
      
      // Merge fetched settings with defaults
      setSettings(prevSettings => ({
        ...prevSettings,
        ...response.data
      }));
      
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings. Using defaults.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    // Log the data being sent for debugging
    console.log('Saving settings:', settings);

    const savePromise = api.put('/settings', settings);

    try {
      await toast.promise(
        savePromise,
        {
          loading: 'Saving settings...',
          success: (response) => {
            // Refresh settings from server after a short delay
            setTimeout(() => {
              fetchSettings();
            }, 500);
            return response.data.message || 'Settings saved successfully!';
          },
          error: (err) => {
            // Log detailed validation errors
            if (err.response?.data?.errors) {
              console.error('Validation errors:', err.response.data.errors);
            }
            console.error('Full error:', err.response?.data);
            
            // Show specific validation errors if available
            if (err.response?.data?.errors) {
              const firstError = Object.values(err.response.data.errors)[0];
              return Array.isArray(firstError) ? firstError[0] : firstError;
            }
            
            return err.response?.data?.message || 'Failed to save settings. Please try again.';
          },
        }
      );
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'application', label: 'Application', icon: 'cog' },
    { id: 'security', label: 'Security', icon: 'lock' },
    { id: 'email', label: 'Email', icon: 'mail' },
    { id: 'notifications', label: 'Notifications', icon: 'bell' },
    { id: 'api', label: 'API', icon: 'code' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure application settings and preferences</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Application Settings */}
          {activeTab === 'application' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Application Name
                </label>
                <input
                  type="text"
                  value={settings.app_name}
                  onChange={(e) => setSettings({ ...settings, app_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Application URL
                </label>
                <input
                  type="url"
                  value={settings.app_url}
                  onChange={(e) => setSettings({ ...settings, app_url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <Select
                  label="Timezone"
                  value={settings.timezone}
                  onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                  options={[
                    { value: 'UTC', label: 'UTC' },
                    { value: 'America/New_York', label: 'Eastern Time' },
                    { value: 'America/Chicago', label: 'Central Time' },
                    { value: 'America/Denver', label: 'Mountain Time' },
                    { value: 'America/Los_Angeles', label: 'Pacific Time' },
                    { value: 'Asia/Manila', label: 'Manila' }
                  ]}
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="maintenance_mode"
                  checked={settings.maintenance_mode}
                  onChange={(e) => setSettings({ ...settings, maintenance_mode: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="maintenance_mode" className="text-sm font-medium text-gray-700">
                  Enable Maintenance Mode
                </label>
              </div>
              {settings.maintenance_mode && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Maintenance mode will prevent users from accessing the application
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Timeout (minutes)
                </label>
                <input
                  type="number"
                  value={settings.session_timeout || ''}
                  onChange={(e) => setSettings({ ...settings, session_timeout: safeParseInt(e.target.value, 30) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="5"
                  max="120"
                />
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Password Requirements</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Length
                    </label>
                    <input
                      type="number"
                      value={settings.password_min_length || ''}
                      onChange={(e) => setSettings({ ...settings, password_min_length: safeParseInt(e.target.value, 8) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="6"
                      max="32"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="password_require_uppercase"
                      checked={settings.password_require_uppercase}
                      onChange={(e) => setSettings({ ...settings, password_require_uppercase: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="password_require_uppercase" className="text-sm text-gray-700">
                      Require uppercase letters
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="password_require_lowercase"
                      checked={settings.password_require_lowercase}
                      onChange={(e) => setSettings({ ...settings, password_require_lowercase: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="password_require_lowercase" className="text-sm text-gray-700">
                      Require lowercase letters
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="password_require_numbers"
                      checked={settings.password_require_numbers}
                      onChange={(e) => setSettings({ ...settings, password_require_numbers: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="password_require_numbers" className="text-sm text-gray-700">
                      Require numbers
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="password_require_special"
                      checked={settings.password_require_special}
                      onChange={(e) => setSettings({ ...settings, password_require_special: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="password_require_special" className="text-sm text-gray-700">
                      Require special characters
                    </label>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Authentication</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="enforce_2fa"
                      checked={settings.enforce_2fa}
                      onChange={(e) => setSettings({ ...settings, enforce_2fa: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="enforce_2fa" className="text-sm font-medium text-gray-700">
                      Enforce Two-Factor Authentication for all users
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Login Attempts
                    </label>
                    <input
                      type="number"
                      value={settings.max_login_attempts || ''}
                      onChange={(e) => setSettings({ ...settings, max_login_attempts: safeParseInt(e.target.value, 5) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="3"
                      max="10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lockout Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={settings.lockout_duration || ''}
                      onChange={(e) => setSettings({ ...settings, lockout_duration: safeParseInt(e.target.value, 15) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="5"
                      max="60"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Email Settings */}
          {activeTab === 'email' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Host
                </label>
                <input
                  type="text"
                  value={settings.smtp_host}
                  onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Port
                </label>
                <input
                  type="number"
                  value={settings.smtp_port || ''}
                  onChange={(e) => setSettings({ ...settings, smtp_port: safeParseInt(e.target.value, 587) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Username
                </label>
                <input
                  type="text"
                  value={settings.smtp_username}
                  onChange={(e) => setSettings({ ...settings, smtp_username: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Password
                </label>
                <input
                  type="password"
                  value={settings.smtp_password}
                  onChange={(e) => setSettings({ ...settings, smtp_password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <Select
                  label="Encryption"
                  value={settings.smtp_encryption}
                  onChange={(e) => setSettings({ ...settings, smtp_encryption: e.target.value })}
                  options={[
                    { value: 'tls', label: 'TLS' },
                    { value: 'ssl', label: 'SSL' },
                    { value: 'none', label: 'None' }
                  ]}
                />
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">From Address</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={settings.from_email}
                      onChange={(e) => setSettings({ ...settings, from_email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      From Name
                    </label>
                    <input
                      type="text"
                      value={settings.from_name}
                      onChange={(e) => setSettings({ ...settings, from_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="notify_new_user"
                  checked={settings.notify_new_user}
                  onChange={(e) => setSettings({ ...settings, notify_new_user: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="notify_new_user" className="text-sm font-medium text-gray-700">
                  Notify administrators when a new user registers
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="notify_large_transaction"
                  checked={settings.notify_large_transaction}
                  onChange={(e) => setSettings({ ...settings, notify_large_transaction: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="notify_large_transaction" className="text-sm font-medium text-gray-700">
                  Notify administrators of large transactions
                </label>
              </div>

              {settings.notify_large_transaction && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Large Transaction Amount Threshold ($)
                  </label>
                  <input
                    type="number"
                    value={settings.large_transaction_amount || ''}
                    onChange={(e) => setSettings({ ...settings, large_transaction_amount: safeParseFloat(e.target.value, 1000) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="100"
                    step="100"
                  />
                </div>
              )}

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="notify_failed_login"
                  checked={settings.notify_failed_login}
                  onChange={(e) => setSettings({ ...settings, notify_failed_login: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="notify_failed_login" className="text-sm font-medium text-gray-700">
                  Notify administrators of failed login attempts
                </label>
              </div>
            </div>
          )}

          {/* API Settings */}
          {activeTab === 'api' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rate Limit (requests per window)
                </label>
                <input
                  type="number"
                  value={settings.api_rate_limit || ''}
                  onChange={(e) => setSettings({ ...settings, api_rate_limit: safeParseInt(e.target.value, 60) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="10"
                  max="1000"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Maximum number of API requests allowed per time window
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rate Limit Window (seconds)
                </label>
                <input
                  type="number"
                  value={settings.api_rate_limit_window || ''}
                  onChange={(e) => setSettings({ ...settings, api_rate_limit_window: safeParseInt(e.target.value, 60) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                  max="3600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Timeout (seconds)
                </label>
                <input
                  type="number"
                  value={settings.api_timeout || ''}
                  onChange={(e) => setSettings({ ...settings, api_timeout: safeParseInt(e.target.value, 30) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="5"
                  max="120"
                />
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="border-t border-gray-200 px-6 py-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}

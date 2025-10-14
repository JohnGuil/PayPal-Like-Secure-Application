import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';

const TwoFactorSetup = () => {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [step, setStep] = useState(1);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSetup = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await authService.setup2FA();
      setQrCode(response.qr_code);
      setSecret(response.secret);
      setStep(2);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to setup 2FA. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authService.verify2FA(code);
      
      // Update user context
      const currentUser = authService.getStoredUser();
      if (currentUser) {
        currentUser.two_factor_enabled = true;
        updateUser(currentUser);
      }

      setStep(3);
    } catch (error) {
      setError(error.response?.data?.message || 'Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Setup Two-Factor Authentication</h1>
            <Link to="/dashboard" className="btn-secondary">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card">
          {/* Step Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-4">
              <div className={`flex items-center ${step >= 1 ? 'text-primary-600' : 'text-gray-400'}`}>
                <span className={`w-8 h-8 flex items-center justify-center rounded-full border-2 ${step >= 1 ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-300'}`}>
                  1
                </span>
                <span className="ml-2 text-sm font-medium">Setup</span>
              </div>
              <div className={`h-0.5 w-16 ${step >= 2 ? 'bg-primary-600' : 'bg-gray-300'}`}></div>
              <div className={`flex items-center ${step >= 2 ? 'text-primary-600' : 'text-gray-400'}`}>
                <span className={`w-8 h-8 flex items-center justify-center rounded-full border-2 ${step >= 2 ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-300'}`}>
                  2
                </span>
                <span className="ml-2 text-sm font-medium">Verify</span>
              </div>
              <div className={`h-0.5 w-16 ${step >= 3 ? 'bg-primary-600' : 'bg-gray-300'}`}></div>
              <div className={`flex items-center ${step >= 3 ? 'text-primary-600' : 'text-gray-400'}`}>
                <span className={`w-8 h-8 flex items-center justify-center rounded-full border-2 ${step >= 3 ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-300'}`}>
                  3
                </span>
                <span className="ml-2 text-sm font-medium">Complete</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Step 1: Introduction */}
          {step === 1 && (
            <div className="text-center">
              <div className="mb-6">
                <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Enable Two-Factor Authentication</h2>
                <p className="text-gray-600">
                  Protect your account with an additional security layer
                </p>
              </div>

              <div className="text-left bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">What you'll need:</h3>
                <ol className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <span className="font-bold mr-2">1.</span>
                    <span>An authenticator app like Google Authenticator, Authy, or Microsoft Authenticator</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2">2.</span>
                    <span>Your smartphone or device to scan the QR code</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2">3.</span>
                    <span>A few minutes to complete the setup</span>
                  </li>
                </ol>
              </div>

              <button
                onClick={handleSetup}
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Setting up...' : 'Start Setup'}
              </button>
            </div>
          )}

          {/* Step 2: Scan QR Code and Verify */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">Scan QR Code</h2>
              
              <div className="mb-6">
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block mx-auto block">
                  <img
                    src={`data:image/svg+xml;base64,${qrCode}`}
                    alt="2FA QR Code"
                    className="w-64 h-64 mx-auto"
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Manual Entry:</strong> If you can't scan the QR code, enter this code manually:
                </p>
                <code className="block bg-white px-4 py-2 rounded border border-gray-300 text-center font-mono text-sm break-all">
                  {secret}
                </code>
              </div>

              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label htmlFor="code" className="label">
                    Enter Verification Code
                  </label>
                  <input
                    id="code"
                    type="text"
                    required
                    maxLength="6"
                    pattern="[0-9]{6}"
                    className="input-field text-center text-2xl tracking-widest"
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the 6-digit code shown in your authenticator app
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="w-full btn-primary"
                >
                  {loading ? 'Verifying...' : 'Verify and Enable 2FA'}
                </button>
              </form>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="text-center">
              <div className="mb-6">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">2FA Successfully Enabled!</h2>
                <p className="text-gray-600 mb-6">
                  Your account is now protected with two-factor authentication
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-blue-900 mb-2">Important:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Keep your authenticator app safe and secure</li>
                  <li>• You'll need to enter a code from your app each time you login</li>
                  <li>• Make sure to backup your authenticator app</li>
                </ul>
              </div>

              <button
                onClick={() => navigate('/dashboard')}
                className="btn-primary"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TwoFactorSetup;

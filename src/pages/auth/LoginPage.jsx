import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNoIndex } from '../../hooks/useNoIndex';
import logo from '../../assets/logo.png';
import { Button, FloatingLabelInput, FileUploadArea } from '../../components';
import { authAPI } from '../../services/api';
import { CLEANER_ROLES } from '../../routeGroups';

// Universal login — replaces password login/signup sitewide. Same phone
// -> code -> (name/email/role, only if the number is new) pattern used
// everywhere else OTP shows up in this app. Reused for both customers and
// providers; existing accounts (any role) log straight in with just their
// phone number.
const LoginPage = () => {
  useNoIndex();
  const navigate = useNavigate();
  const location = useLocation();
  const { updateUser } = useAuth();

  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [devMode, setDevMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Only reached when this phone number turns out to be new.
  const [isNewUser, setIsNewUser] = useState(false);
  const [verifiedSessionToken, setVerifiedSessionToken] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Customer');
  // Only used when role === 'Cleaner' — same details a provider gives when
  // signing up through the subscription page, so it's consistent no matter
  // which door they came in through.
  const [abnNumber, setAbnNumber] = useState('');
  const [providerDocs, setProviderDocs] = useState({ policeCheck: null, photoId: null, trainingCertificates: null });

  // The phone field only ever holds the local part (no +61) — this is the
  // one place that turns whatever the person typed into the full number
  // the backend expects, used everywhere below instead of repeating it.
  const getNormalizedPhone = () => `+61${phone.replace(/[\s\-\(\)]/g, '').replace(/^0/, '')}`;

  const handleProviderFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }
    setError('');
    setProviderDocs(prev => ({ ...prev, [fieldName]: file }));
  };

  const handleProviderFileRemove = (fieldName) => {
    setProviderDocs(prev => ({ ...prev, [fieldName]: null }));
  };

  const goToDashboard = (userRole) => {
    const from = location.state?.from;
    if (from) {
      navigate(from, { replace: true });
      return;
    }
    if (userRole === 'Customer') {
      navigate('/customer-dashboard', { replace: true });
    } else if (CLEANER_ROLES.includes(userRole)) {
      navigate('/cleaner-dashboard', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  const handleSendCode = async () => {
    setError('');
    // Field now only ever holds the local part (user never types +61
    // themselves) — normalize whatever they typed (with or without the
    // leading 0) into the full +61 format the backend expects.
    const cleanedPhone = getNormalizedPhone();
    if (!/^\+614\d{8}$/.test(cleanedPhone)) {
      setError('Please enter a valid Australian mobile number');
      return;
    }
    setLoading(true);
    try {
      const response = await authAPI.requestJobOtp(cleanedPhone);
      if (response.success) {
        setOtpSent(true);
        setDevMode(!!response.data?.devMode);
      } else {
        setError(response.message || 'Could not send verification code');
      }
    } catch (err) {
      setError(err.message || 'Could not send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError('');
    if (!otpCode.trim()) {
      setError('Enter the code we sent you');
      return;
    }
    setLoading(true);
    try {
      const cleanedPhone = getNormalizedPhone();
      const response = await authAPI.loginVerifyOtp(cleanedPhone, otpCode.trim());

      if (!response.success) {
        setError(response.message || 'Incorrect code');
        return;
      }

      if (response.data.isNewUser) {
        setIsNewUser(true);
        setVerifiedSessionToken(response.data.verifiedSessionToken);
      } else {
        updateUser(response.data.user);
        goToDashboard(response.data.user.role);
      }
    } catch (err) {
      setError(err.message || 'Incorrect code');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    setError('');
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    setLoading(true);
    try {
      const cleanedPhone = getNormalizedPhone();
      const response = await authAPI.completeSignup({
        phone: cleanedPhone,
        name: name.trim(),
        email: email.trim() || undefined,
        role,
        verifiedSessionToken,
        abnNumber: role === 'Cleaner' ? (abnNumber.trim() || undefined) : undefined,
        documents: role === 'Cleaner' ? providerDocs : undefined
      });

      if (!response.success) {
        setError(response.message || 'Could not create your account');
        return;
      }

      updateUser(response.data.user);
      goToDashboard(response.data.user.role);
    } catch (err) {
      setError(err.message || 'Could not create your account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <img src={logo} alt="Aussie Mate" className="h-16 w-auto" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 md:p-8 border-2 border-[#8B92A620] space-y-6">
          {error && (
            <div className="text-red-500 font-medium rounded-lg text-sm leading-4">
              {error}
            </div>
          )}

          {!otpSent && (
            <>
              <h2 className="text-2xl md:text-3xl font-bold text-primary-500 mb-2 text-center">Welcome</h2>
              <p className="text-sm md:text-base text-primary-200 font-medium text-center">
                Enter your phone number and we'll send you a one-time code to log in or sign up.
              </p>
              <div className="w-full flex items-center border border-gray-200 rounded-full focus-within:border-primary-600 bg-[#F9FAFB] overflow-hidden">
                <span className="pl-5 pr-2 py-4 text-gray-500 font-medium select-none border-r border-gray-200">+61</span>
                <input
                  type="tel"
                  placeholder="4XX XXX XXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="flex-1 px-4 py-4 bg-transparent focus:outline-none min-w-0"
                />
              </div>
              <Button onClick={handleSendCode} loading={loading} fullWidth size="md">
                Send code
              </Button>
              <p className="text-center text-primary-200 font-medium text-sm">
                No password needed — we'll text you a code every time you log in.
              </p>
            </>
          )}

          {otpSent && !isNewUser && (
            <>
              <h2 className="text-2xl md:text-3xl font-bold text-primary-500 mb-2 text-center">Enter your code</h2>
              <p className="text-sm md:text-base text-primary-200 font-medium text-center">
                We sent a 6-digit code to +61{phone.replace(/[\s\-\(\)]/g, '').replace(/^0/, '')}.
              </p>
              {devMode && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  Dev mode (no SMS provider connected yet) — enter any 6-digit number to continue.
                </p>
              )}
              <input
                type="text"
                inputMode="numeric"
                placeholder="6-digit code"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                maxLength={6}
                className="w-full px-5 py-4 border border-gray-200 rounded-full focus:outline-none focus:border-primary-600 bg-[#F9FAFB] tracking-[0.3em] text-center text-lg"
              />
              <Button onClick={handleVerify} loading={loading} fullWidth size="md">
                Verify & continue
              </Button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={loading}
                  className="text-primary-500 hover:text-primary-600 font-medium cursor-pointer"
                >
                  Resend code
                </button>
              </div>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => { setOtpSent(false); setOtpCode(''); setError(''); }}
                  className="text-primary-200 hover:text-primary-500 font-medium cursor-pointer text-sm"
                >
                  Use a different number
                </button>
              </div>
            </>
          )}

          {isNewUser && (
            <>
              <h2 className="text-2xl md:text-3xl font-bold text-primary-500 mb-2 text-center">Almost there</h2>
              <p className="text-sm md:text-base text-primary-200 font-medium text-center">
                We don't have an account for this number yet — tell us a bit about you.
              </p>
              <input
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-5 py-4 border border-gray-200 rounded-full focus:outline-none focus:border-primary-600 bg-[#F9FAFB]"
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 border border-gray-200 rounded-full focus:outline-none focus:border-primary-600 bg-[#F9FAFB]"
              />
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('Customer')}
                  className={`py-3 rounded-full font-medium border-2 cursor-pointer ${role === 'Customer' ? 'border-primary-600 text-primary-600 bg-primary-50' : 'border-gray-200 text-gray-500'}`}
                >
                  I need a service
                </button>
                <button
                  type="button"
                  onClick={() => setRole('Cleaner')}
                  className={`py-3 rounded-full font-medium border-2 cursor-pointer ${role === 'Cleaner' ? 'border-primary-600 text-primary-600 bg-primary-50' : 'border-gray-200 text-gray-500'}`}
                >
                  I want to find work
                </button>
              </div>

              {/* Same details a provider gives when signing up through the
                  subscription page — kept consistent no matter which door
                  they came in through. */}
              {role === 'Cleaner' && (
                <div className="space-y-4 pt-2 border-t border-gray-100 mt-2">
                  <input
                    type="text"
                    placeholder="ABN Number (11-digit)"
                    value={abnNumber}
                    onChange={(e) => setAbnNumber(e.target.value)}
                    maxLength={11}
                    className="w-full px-5 py-4 border border-gray-200 rounded-full focus:outline-none focus:border-primary-600 bg-[#F9FAFB]"
                  />
                  <FileUploadArea
                    fieldName="policeCheck"
                    title="Police Check"
                    description="Recent background check, mandatory for all providers."
                    placeholder="to Upload PDF/JPEG"
                    onFileSelect={handleProviderFileChange}
                    selectedFile={providerDocs.policeCheck}
                    onRemove={handleProviderFileRemove}
                  />
                  <FileUploadArea
                    fieldName="photoId"
                    title="Photo ID"
                    description="To verify your identity."
                    placeholder="to Upload Documents"
                    onFileSelect={handleProviderFileChange}
                    selectedFile={providerDocs.photoId}
                    onRemove={handleProviderFileRemove}
                  />
                  <FileUploadArea
                    fieldName="trainingCertificates"
                    title="Training Certificates (Optional)"
                    description="NDIS/other certifications if applicable."
                    placeholder="to Upload Documents"
                    onFileSelect={handleProviderFileChange}
                    selectedFile={providerDocs.trainingCertificates}
                    onRemove={handleProviderFileRemove}
                  />
                </div>
              )}

              <Button onClick={handleCreateAccount} loading={loading} fullWidth size="md">
                Create my account
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNoIndex } from '../../hooks/useNoIndex';
import { signupSchema } from '../../utils/validationSchemas';
import logo from '../../assets/logo.png';
import eyeIcon from '../../assets/eye 1.svg';
import eyeOffIcon from '../../assets/eye-off 1.svg';
import { FloatingLabelInput, Button, Checkbox } from '../../components';
import InfoIcon from '../../assets/info.svg';


const SignupPage = () => {
  useNoIndex();
  const location = useLocation();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
    isNDISParticipant: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  // Get role and NDIS status from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const role = params.get('role');
    const ndis = params.get('ndis') === 'true';

    if (role) {
      setFormData(prev => ({
        ...prev,
        role: role,
        isNDISParticipant: ndis
      }));
    }
  }, [location.search]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validate using Yup schema
      await signupSchema.validate(formData, { abortEarly: false });

      // Prepare data for API
      const { agreeToTerms, ...userData } = formData;

      // Format phone number for backend - just return the 9 digits
      const formatPhoneNumber = (phone) => {
        const cleaned = phone.replace(/[^\d]/g, '');
        return cleaned; // Return just the 9 digits
      };

      // Map role to userType/role for backend compatibility
      const roleMapping = {
        'Customer': { userType: 'customer', role: 'Customer' },
        'Service Provider': { userType: 'cleaner', role: 'Cleaner' }
      };

      const selectedMapping = roleMapping[userData.role] || { userType: userData.role.toLowerCase(), role: userData.role };

      // Create clean API data with only required fields
      const apiData = {
        firstName: userData.firstName.trim(),
        lastName: userData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formatPhoneNumber(formData.phone.trim()),
        password: userData.password,
        confirmPassword: userData.confirmPassword,
        userType: selectedMapping.userType,
        role: selectedMapping.role,
      };

      await register(apiData);

      // Navigate based on user role and NDIS status
      if (formData.role === 'Customer') {
        if (formData.isNDISParticipant) {
          navigate('/ndis-plan-info');
        } else {
          navigate('/location');
        }
      } else {
        navigate('/verify-documents');
      }
    } catch (error) {
      // Handle validation errors
      let errorMessage = 'Registration failed. Please try again.';

      // If it's a Yup validation error
      if (error.inner) {
        const firstError = error.inner[0];
        errorMessage = firstError.message;
      } else if (error.status === 400) {
        errorMessage = 'Invalid data provided. Please check all fields and try again.';
        if (error.response && error.response.errors) {
          const errors = error.response.errors;

          // Handle array format with objects containing msg, path, type
          if (Array.isArray(errors)) {
            const errorMessages = errors.map(errorObj => {
              if (errorObj.msg) {
                return errorObj.msg;
              } else if (errorObj.message) {
                return errorObj.message;
              } else if (typeof errorObj === 'string') {
                return errorObj;
              }
              return String(errorObj);
            });
            errorMessage = errorMessages.join('. ');
          } else if (typeof errors === 'object') {
            // Extract error messages from object
            const errorMessages = Object.entries(errors).map(([field, message]) => {
              if (Array.isArray(message)) {
                return `${field}: ${message.join(', ')}`;
              } else if (typeof message === 'string') {
                return `${field}: ${message}`;
              } else if (typeof message === 'object' && message.message) {
                return `${field}: ${message.message}`;
              }
              return `${field}: ${String(message)}`;
            });
            errorMessage = errorMessages.join('. ');
          } else if (typeof errors === 'string') {
            errorMessage = errors;
          }
        }
      } else if (error.status === 409) {
        errorMessage = 'An account with this email already exists. Please use a different email or try logging in.';
      } else if (error.status === 422) {
        errorMessage = 'Please check your information and try again.';
        if (error.response && error.response.message) {
          errorMessage = error.response.message;
        }
      } else if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center mb-4 sm:mb-6">
            <img src={logo} alt="Aussie Mate" className="h-12 sm:h-16 w-auto" />
          </div>
        </div>
        {/* Signup Form */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-primary-500 mb-2 text-center">Let's get started</h2>
            <p className="text-sm sm:text-base text-primary-200 font-medium px-2 text-center">
              Please provide the following details to set up your Aussie Mate account.
            </p>
            <div className="flex flex-col gap-3 mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FloatingLabelInput
                  id="firstName"
                  name="firstName"
                  label="First Name"
                  type="text"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                />
                <FloatingLabelInput
                  id="lastName"
                  name="lastName"
                  label="Last Name"
                  type="text"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <FloatingLabelInput
                id="email"
                name="email"
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
              <FloatingLabelInput
                id="phone"
                name="phone"
                label="Phone Number"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                required
              />
              <FloatingLabelInput
                id="password"
                name="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleInputChange}
                required
              >
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                >
                  <img
                    src={showPassword ? eyeIcon : eyeOffIcon}
                    alt={showPassword ? "Hide password" : "Show password"}
                    className="w-5 h-5"
                  />
                </button>
              </FloatingLabelInput>

              <FloatingLabelInput
                id="confirmPassword"
                name="confirmPassword"
                label="Confirm Password"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
              >
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                >
                  <img
                    src={showConfirmPassword ? eyeIcon : eyeOffIcon}
                    alt={showConfirmPassword ? "Hide password" : "Show password"}
                    className="w-5 h-5 cursor-pointer"
                  />
                </button>
              </FloatingLabelInput>
              {error && (
                <div className=" text-red-500 font-medium rounded-lg text-sm leading-4 mt-0">
                  {error}
                </div>
              )}
            </div>

            {/* Terms & Conditions Checkbox */}
            <Checkbox
              name="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={handleInputChange}
              className="mt-4 sm:mt-6"
              checkboxSize="w-4 h-4 sm:w-5 sm:h-5"
              labelClassName="text-xs sm:text-base leading-relaxed text-primary-200 font-medium"
              required
              label={
                <>
                  I agree to the{' '}
                  <Link to="/platform-policy" className="text-primary-500 hover:text-primary-600 font-medium underline cursor-pointer">
                    Terms & Conditions
                  </Link>
                </>
              }
            />

            <Button
              type="submit"
              loading={isLoading}
              fullWidth
              size="md"
              className="mt-4"
            >
              {formData.role === 'Customer' && formData.isNDISParticipant
                ? 'Continue For NDIS Verification'
                : formData.role === 'Customer'
                  ? 'Continue & Set My Location'
                  : 'Continue For Profile Setup'
              }
            </Button>
          </form>

          <div className="text-center mt-4 sm:mt-6">
            <p className="text-xs sm:text-base text-primary-200 font-medium">
              Already have an account?{' '}
              <Link to="/" className="text-primary-500 hover:text-primary-600 font-semibold cursor-pointer">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;

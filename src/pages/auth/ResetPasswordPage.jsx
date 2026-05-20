import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useNoIndex } from '../../hooks/useNoIndex';
import { authAPI } from '../../services/api';
import { resetPasswordSchema } from '../../utils/validationSchemas';
import logo from '../../assets/logo.png';
import eyeIcon from '../../assets/eye 1.svg';
import eyeOffIcon from '../../assets/eye-off 1.svg';
import { FloatingLabelInput, Button, Loader } from '../../components';

const ResetPasswordPage = () => {
  useNoIndex();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState('');
  const [isTokenLoading, setIsTokenLoading] = useState(true);

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setError('Invalid or missing reset token. Please request a new password reset.');
    }
    setIsTokenLoading(false);
  }, [searchParams]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validate using Yup schema
      await resetPasswordSchema.validate(formData, { abortEarly: false });

      if (!token) {
        setError('Invalid reset token. Please request a new password reset.');
        setIsLoading(false);
        return;
      }

      await authAPI.resetPassword(token, formData.password, formData.confirmPassword);
      setIsSubmitted(true);
    } catch (error) {
      // Handle validation errors
      if (error.inner) {
        const firstError = error.inner[0];
        setError(firstError.message);
      }

      // Handle API errors
      // Handle different types of password reset errors
      let errorMessage = 'Failed to reset password. Please try again.';
      
      if (error.status === 400) {
        errorMessage = 'Invalid password format. Please check your password requirements.';
        if (error.response && error.response.data && error.response.data.errors) {
          // Handle validation errors
          const errors = error.response.data.errors;
          if (Array.isArray(errors)) {
            const errorMessages = errors.map(errorObj => {
              if (errorObj.msg) {
                return errorObj.msg;
              } else if (errorObj.message) {
                return errorObj.message;
              }
              return String(errorObj);
            });
            errorMessage = errorMessages.join('. ');
          } else if (typeof errors === 'string') {
            errorMessage = errors;
          }
        }
      } else if (error.status === 401) {
        errorMessage = 'Invalid or expired reset token. Please request a new password reset.';
      } else if (error.status === 422) {
        errorMessage = 'Please check your password and try again.';
        if (error.response && error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.response && error.response.data) {
        // Handle API error responses
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-0 sm:p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex items-center justify-center mb-4 sm:mb-6">
              <img src={logo} alt="Aussie Mate" className="h-12 sm:h-16 w-auto" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-primary-500 mb-2">Password Reset Successfully!</h2>
            <p className="text-sm sm:text-base text-primary-200 font-medium px-2">
              Your password has been updated successfully. You can now log in with your new password.
            </p>
          </div>

          {/* Success Message */}
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 md:p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-500" strokeWidth={2} />
              </div>
              <h3 className="text-lg font-semibold text-primary-250 mb-2">Password Updated!</h3>
              <p className="text-sm text-primary-200 font-medium mb-6">
                Your password has been successfully reset. You can now log in with your new password.
              </p>
              <Button
                onClick={() => window.location.href = '/'}
                fullWidth
                size="md"
              >
                Continue to Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isTokenLoading) {
    return <Loader fullscreen message="Preparing reset form..." />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center mb-4 sm:mb-6">
            <img src={logo} alt="Aussie Mate" className="h-12 sm:h-16 w-auto" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Reset Password</h2>
          <p className="text-sm sm:text-base text-gray-600 px-2">
            Enter your new password below to complete the reset process.
          </p>
        </div>

        {/* Reset Password Form */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 md:p-8">
          
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div className="relative">
              <p className="text-sm md:text-base text-primary-200 font-medium mb-6 text-center">
                Please enter a new password for your account.
              </p>
              <div className="space-y-3">
              <FloatingLabelInput
                id="password"
                name="password"
                label="New Password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleInputChange}
                required
              >
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <img src={showPassword ? eyeIcon : eyeOffIcon} alt="Toggle password visibility" className="w-5 h-5" />
                </button>
              </FloatingLabelInput>

              <FloatingLabelInput
                id="confirmPassword"
                name="confirmPassword"
                label="Confirm New Password"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
              >
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <img src={showConfirmPassword ? eyeIcon : eyeOffIcon} alt="Toggle password visibility" className="w-5 h-5" />
                </button>
              </FloatingLabelInput>
              </div>
              {error && (
            <div className="mb-4 text-red-500 font-medium rounded-lg text-sm leading-4 mt-3">
              {error}
            </div>
          )}
            </div>
            
            <Button
              type="submit"
              loading={isLoading}
              fullWidth
              size="md"
              className="mt-6"
            >
              Reset Password
            </Button>
          </form>
          
          <div className="text-center mt-4 sm:mt-6">
            <p className="text-xs sm:text-sm text-gray-600">
              Remember your password?{' '}
              <Link to="/" className="text-primary-500 hover:text-primary-600 font-semibold cursor-pointer ">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;

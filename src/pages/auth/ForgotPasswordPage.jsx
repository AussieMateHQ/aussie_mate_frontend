import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNoIndex } from '../../hooks/useNoIndex';
import { authAPI } from '../../services/api';
import { forgotPasswordSchema } from '../../utils/validationSchemas';
import logo from '../../assets/logo.png';
import { FloatingLabelInput, Button } from '../../components';
import ForgotSuccessIcon from '../../assets/forgot success.svg';

const ForgotPasswordPage = () => {
  useNoIndex();
  const [formData, setFormData] = useState({
    email: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
      await forgotPasswordSchema.validate(formData, { abortEarly: false });
      
      await authAPI.forgotPassword(formData.email);
      setIsSubmitted(true);
    } catch (error) {
      // Handle validation errors
      if (error.inner) {
        const firstError = error.inner[0];
        setError(firstError.message);
      } else {
        setError(error.message || 'Failed to send reset email. Please try again.');
      }
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
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Check Your Email</h2>
            <p className="text-sm sm:text-base text-gray-600 px-2">
              We've sent a password reset link to your email address.
            </p>
          </div>

          {/* Success Message */}
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 md:p-8">
             <div className="text-center">
               <div className="flex items-center justify-center mx-auto mb-4">
                 <img src={ForgotSuccessIcon} alt="Success" className="w-40 h-40" />
               </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Check your mail</h3>
              <p className="text-sm text-gray-600 mb-6">
              We have sent a password recover instructions to your email.
              </p>
              <div className="space-x-3 flex flex-col md:flex-row">
                <Button
                  onClick={() => window.location.href = '/'}
                  variant="outline"
                  size="md"
                  fullWidth
                  className="rounded-3xl"
                >
                  Back to Login
                </Button>
                <Button
                  onClick={() => setIsSubmitted(false)}
                  size="md"
                  fullWidth
                >
                  Send Another Email
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center mb-4 sm:mb-6">
            <img src={logo} alt="Aussie Mate" className="h-12 sm:h-16 w-auto" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Forgot Password?</h2>
          <p className="text-sm sm:text-base text-gray-600 px-2">
            No worries! Enter your email address and we'll send you a reset link.
          </p>
        </div>

        {/* Forgot Password Form */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 md:p-8">
          
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4"> 
            <FloatingLabelInput
              label="Email Address"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />  
              {error && (
            <div className="mb-4 text-red-500 font-medium rounded-lg text-sm leading-4">
              {error}
            </div>
          )}
            
            <Button
              type="submit"
              loading={isLoading}
              fullWidth
              size="md"
              className="mt-4"
            >
              Send Reset Link
            </Button>
            
          </form>
          
          <div className="text-center mt-4 sm:mt-6">
            <p className="text-xs sm:text-sm text-gray-600">
              Remember your password?{' '}
              <Link to="/ " className="text-primary-500 hover:text-primary-600 font-semibold cursor-pointer">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

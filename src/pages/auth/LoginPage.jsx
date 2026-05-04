import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { loginSchema } from '../../utils/validationSchemas';
import logo from '../../assets/logo.png';
import eyeIcon from '../../assets/eye 1.svg';
import eyeOffIcon from '../../assets/eye-off 1.svg';
import { FloatingLabelInput, Button } from '../../components';
import { CLEANER_ROLES } from '../../routeGroups';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validate using Yup schema
      await loginSchema.validate(formData, { abortEarly: false });

      let response;
      try {
        response = await login(formData, 'Cleaner');
      } catch (loginErr) {
        // If login as Cleaner fails, try as Customer
        try {
          response = await login(formData, 'Customer');
        } catch (finalErr) {
          // Re-throw the original error if both fail
          throw loginErr;
        }
      }

      // Get user data from response
      const userData = response.data?.user || response.user;
      const userRole = userData?.role || userData?.userType;

      // Navigate based on user role
      if (userRole === 'Customer') {
        navigate('/customer-dashboard');
      } else if (CLEANER_ROLES.includes(userRole)) {
        // Check subscription status for cleaners
        try {
          const { subscriptionsAPI } = await import('../../services/api');
          const statusRes = await subscriptionsAPI.getMyStatus().catch(() => ({ success: false }));

          if (statusRes.success && statusRes.data?.subscription?.status === 'active') {
            navigate('/cleaner-dashboard');
          } else {
            // Redirect to subscription screen if no active plan
            navigate('/my-subscription');
          }
        } catch (err) {
          console.error('Subscription check failed:', err);
          navigate('/cleaner-dashboard'); // Fallback to dashboard
        }
      } else {
        navigate('/');
      }
    } catch (error) {
      // Handle validation errors
      let errorMessage = 'Login failed. Please check your credentials.';

      // If it's a Yup validation error
      if (error.inner) {
        const firstError = error.inner[0];
        errorMessage = firstError.message;
      } else if (error.status === 401) {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (error.status === 404) {
        errorMessage = 'No account found with this email. Please check your email or sign up for a new account.';
      } else if (error.status === 400) {
        errorMessage = 'Invalid email or password format. Please check your credentials.';
      } else if (error.status === 422) {
        errorMessage = 'Please enter a valid email and password.';
      } else if (error.response && error.response.data) {
        // Handle API error responses
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.data.errors) {
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
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <img src={logo} alt="Aussie Mate" className="h-16 w-auto" />
          </div>

        </div>

        {/* Login Form */}
        <div className="bg-white rounded-xl p-6 md:p-8 border-2 border-[#8B92A620]">

          <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold text-primary-500 mb-2 text-center">Welcome Back</h2>
            <p className="text-sm md:text-base text-primary-200 font-medium text-center">
              Log in to continue booking and managing your cleaning services with ease.
            </p>
            <FloatingLabelInput
              id="email"
              name="email"
              label="Email Or Phone"
              type="text"
              value={formData.email}
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
                onClick={togglePasswordVisibility}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
              >
                {showPassword ? (
                  <img src={eyeIcon} alt="Show password" className="w-5 h-5" />
                ) : (
                  <img src={eyeOffIcon} alt="Hide password" className="w-5 h-5" />
                )}
              </button>
            </FloatingLabelInput>
            {error && (
              <div className=" text-red-500 font-medium rounded-lg text-sm leading-4 mt-0">
                {error}
              </div>
            )}

            <div className="text-right">
              <Link to="/forgot-password" className="text-primary-500 hover:text-primary-600 font-medium cursor-pointer">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              loading={isLoading}
              fullWidth
              size="md"
            >
              Login
            </Button>
          </form>

          <div className="text-center mt-6">
            <p className="text-primary-200 font-medium">
              Don't have an account?{' '}
              <Link to="/select-role" className="text-primary-500 hover:text-primary-600 font-medium">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

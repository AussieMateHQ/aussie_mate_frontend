import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Pen, ShieldCheck, Mail, Phone } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { userAPI } from '../../services/api';
import HeaderLocationIcon from '../../assets/headerlocation.svg';
import InfoIcon from '../../assets/info.svg';
import { FloatingLabelInput, Button, PageHeader } from '../../components';
import ProfileBG from '../../assets/CardBG7.png';
import GoldBadgeIcon from '../../assets/goldBadge.svg';
import SilverBadgeIcon from '../../assets/silverBadge.svg';
import BronzeBadgeIcon from '../../assets/bronzeBadge.svg';
import EditIcon from '../../assets/Editicon.svg';

const EditProfilePage = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    countryCode: '+61'
  });
  const [userLocation, setUserLocation] = useState({
    address: '',
    city: ''
  });
  const [loading, setLoading] = useState(false);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
  const formatLabel = useMemo(() => (value, fallback = '') => {
    const source = value || fallback;
    if (!source) return '';
    return source
      .toString()
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }, []);

  const accountTypeLabel = useMemo(() => {
    const rawValue = user?.accountType || user?.role || 'Professional Cleaner';
    const label = formatLabel(rawValue, 'Professional Cleaner');
    return label || 'Professional Cleaner';
  }, [user, formatLabel]);

  const tierInfo = useMemo(() => {
    const rawTier = user?.tier || user?.cleanerTier || user?.badgeLevel || '';
    const normalized = rawTier?.toString().toLowerCase();

    if (!normalized || normalized === 'none') {
      return { label: '', icon: null };
    }

    const baseLabel = formatLabel(rawTier);

    const icon =
      normalized === 'gold'
        ? GoldBadgeIcon
        : normalized === 'silver'
          ? SilverBadgeIcon
          : normalized === 'bronze'
            ? BronzeBadgeIcon
            : null;

    return {
      label: baseLabel ? `${baseLabel} Tier` : '',
      icon,
    };
  }, [user, formatLabel]);

  const resolveProfilePhotoUrl = (userData) => {
    if (!userData) return '';
    if (typeof userData === 'string') return userData;

    if (userData.profilePicture) {
      return userData.profilePicture;
    }

    const photo = userData.profilePhoto;
    if (!photo) return '';

    if (typeof photo === 'string') return photo;

    return photo.secureUrl || photo.url || photo.path || photo.location;
  };


  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || user.name || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phoneNumber || user.phone || '',
        countryCode: '+61'
      });
      const initialPhoto = resolveProfilePhotoUrl(user);
      if (initialPhoto) {
        setProfilePhotoUrl(initialPhoto);
      } else {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          const storedPhoto = resolveProfilePhotoUrl(parsed);
          if (storedPhoto) {
            setProfilePhotoUrl(storedPhoto);
          }
        }
      }
    }

    // Load user location from API first, then fallback to localStorage
    const fetchUserLocation = async () => {
      try {
        const userProfile = await userAPI.getProfile();

        const userData = userProfile.data?.user || userProfile.data || userProfile;
        const location = userData?.location;
        const apiPhoto = resolveProfilePhotoUrl(userData);
        const existingPhoto = resolveProfilePhotoUrl(user);

        if (apiPhoto) {
          setProfilePhotoUrl(apiPhoto);
          if (apiPhoto !== existingPhoto) {
            const mergedUser = {
              ...user,
              ...userData,
              profilePhoto: userData?.profilePhoto || user?.profilePhoto,
              profilePicture: userData?.profilePicture || user?.profilePicture
            };
            localStorage.setItem('user', JSON.stringify(mergedUser));
            updateUser(mergedUser);
          }
        }

        if (location) {
          const fullAddress = location.fullAddress || location.address || '';
          const addressParts = fullAddress.split(',');
          const address = addressParts[0]?.trim() || 'Location not set';
          const city = addressParts.length > 1 ? addressParts[addressParts.length - 2]?.trim() : (location.city || 'Please set your location');

          setUserLocation({
            address: address,
            city: city,
            fullAddress: fullAddress
          });
          return;
        }
      } catch (error) {
        console.error('Error fetching location from API:', error);
      }

      // Fallback to localStorage
      const savedLocation = localStorage.getItem('userLocation');
      if (savedLocation) {
        try {
          const locationData = JSON.parse(savedLocation);
          setUserLocation({
            address: locationData.address || 'Location not set',
            city: locationData.city || 'Please set your location',
            fullAddress: locationData.fullAddress || locationData.address || 'Location not set'
          });
        } catch (error) {
          console.error('Error parsing saved location:', error);
        }
      }
    };

    fetchUserLocation();

    // Listen for location updates
    const handleLocationUpdate = () => {
      fetchUserLocation();
    };

    window.addEventListener('locationUpdated', handleLocationUpdate);

    return () => {
      window.removeEventListener('locationUpdated', handleLocationUpdate);
    };
  }, [user]);

  // Listen for user updates
  useEffect(() => {
    const handleUserUpdate = () => {
      const updatedUser = JSON.parse(localStorage.getItem('user') || 'null');
      if (updatedUser) {
        updateUser(updatedUser);
        const storedPhoto = resolveProfilePhotoUrl(updatedUser);
        setProfilePhotoUrl(storedPhoto || '');
      }
    };

    window.addEventListener('userUpdated', handleUserUpdate);

    return () => {
      window.removeEventListener('userUpdated', handleUserUpdate);
    };
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isCountryDropdownOpen && !event.target.closest('.country-dropdown')) {
        setIsCountryDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCountryDropdownOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Photo upload handlers
  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 50 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      setPhotoError('Invalid file type. Only JPG, PNG, GIF, and WebP are allowed.');
      return;
    }

    if (file.size > maxSize) {
      setPhotoError('File size too large. Maximum size is 50MB.');
      return;
    }

    setPhotoError('');
    setPhotoLoading(true);

    try {
      const data = await userAPI.uploadProfilePhoto(file);

      if (data.success) {
        // Update user context with new photo
        const updatedUser = {
          ...user,
          profilePhoto: data.data.profilePhoto,
          profilePicture: data.data.profilePhoto?.secureUrl || data.data.profilePhoto?.url
        };

        // Update localStorage
        localStorage.setItem('user', JSON.stringify(updatedUser));
        const newPhotoUrl = resolveProfilePhotoUrl(updatedUser);
        setProfilePhotoUrl(newPhotoUrl);

        // Update context
        updateUser(updatedUser);

        // Dispatch custom event to update other components
        window.dispatchEvent(new CustomEvent('userUpdated'));

        // Update form data to trigger re-render
        setFormData(prev => ({ ...prev }));
      } else {
        setPhotoError(data.message || 'Failed to upload photo');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      setPhotoError(error.message || 'Failed to upload photo. Please try again.');
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleEditPhotoClick = () => {
    document.getElementById('photo-upload').click();
  };

  const handleDeletePhoto = async () => {
    if (!profilePhotoUrl) {
      setPhotoError('No profile photo to delete');
      return;
    }

    setPhotoError('');
    setPhotoLoading(true);

    try {
      const data = await userAPI.deleteProfilePhoto();

      if (data.success) {
        // Update user context to remove photo
        const updatedUser = {
          ...user,
          profilePhoto: null,
          profilePicture: null
        };

        // Update localStorage
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setProfilePhotoUrl('');

        // Force update the user context immediately
        updateUser(updatedUser);

        // Dispatch custom event to update other components
        window.dispatchEvent(new CustomEvent('userUpdated'));

        // Update form data to trigger re-render
        setFormData(prev => ({ ...prev }));
      } else {
        setPhotoError(data.message || 'Failed to delete photo');
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      // If API fails, still remove the photo locally
      if (error.message.includes('400')) {
        setPhotoError('Photo may not exist on server, removing locally...');

        // Remove photo locally
        const updatedUser = {
          ...user,
          profilePhoto: null,
          profilePicture: null
        };

        localStorage.setItem('user', JSON.stringify(updatedUser));
        setProfilePhotoUrl('');
        updateUser(updatedUser);
        window.dispatchEvent(new CustomEvent('userUpdated'));
        setFormData(prev => ({ ...prev }));

        // Clear error after a moment
        setTimeout(() => setPhotoError(''), 2000);
      } else {
        setPhotoError(error.message || 'Failed to delete photo. Please try again.');
      }
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Update profile using userAPI
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        phoneNumber: formData.phone,
        phone: formData.phone
      };

      const response = await userAPI.updateProfile(updateData);

      if (response.success) {
        // Update user context with new data
        const updatedUser = {
          ...user,
          ...updateData
        };

        // Update localStorage
        localStorage.setItem('user', JSON.stringify(updatedUser));

        // Update context
        updateUser(updatedUser);

        // Dispatch custom event to update other components
        window.dispatchEvent(new CustomEvent('userUpdated'));

        // Navigate back to profile page
        navigate('/profile');
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      // You can add error handling UI here
      alert('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeLocation = () => {
    const userType = user?.userType || user?.role || '';
    const isCleaner = ['Cleaner', 'cleaner'].includes(userType);

    navigate(isCleaner ? '/location' : '/location', {
      state: {
        fromPage: 'edit-profile',
        step: 'edit-profile'
      }
    });
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeader
          title="Edit Profile"
          onBack={() => navigate(-1)}
          className="h-16"
          titleClassName="text-xl font-semibold text-gray-900"
        />
      </div>

      <div className="max-w-7xl mx-auto py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8 pt-0!">
        {/* Hidden file input for photo upload */}
        <input
          id="photo-upload"
          type="file"
          accept="image/*"
          onChange={handlePhotoUpload}
          className="hidden"
        />

        {/* Profile Picture Section */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8 relative overflow-hidden mb-4 sm:mb-6">
          {/* Background Image */}
          <div
            className="absolute top-0 right-0 w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 bg-cover bg-center bg-no-repeat z-0"
            style={{ backgroundImage: `url(${ProfileBG})` }}
          ></div>

          <div className="relative z-10 flex flex-row items-center space-x-4 sm:space-x-6 lg:space-x-8">
            {/* Profile Picture */}
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                {profilePhotoUrl ? (
                  <img
                    src={profilePhotoUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={() => setProfilePhotoUrl('')}
                  />
                ) : (
                  <div className="w-full h-full bg-primary-500 flex items-center justify-center">
                    <span className="text-white text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold">
                      {(user?.firstName || user?.name || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                {photoLoading && (
                  <div className="absolute inset-0 bg-[#1F6FEB] bg-opacity-50 flex items-center justify-center rounded-full">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <button
                onClick={handleEditPhotoClick}
                disabled={photoLoading}
                className="absolute bottom-1 -right-1 w-7 h-7 sm:w-8 sm:h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-2 border-white"
              >
                <img src={EditIcon} alt="Edit" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              {/* Delete Photo Button - Only show if photo exists */}
              {profilePhotoUrl && (
                <button
                  onClick={handleDeletePhoto}
                  disabled={photoLoading}
                  className="absolute top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 bg-[#EF4444] rounded-full shadow-md flex items-center justify-center transition-colors cursor-pointer"
                  title="Delete photo"
                >
                  <X className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-white" strokeWidth={2} />
                </button>
              )}
            </div>

            {/* User Details Preview */}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-primary-500 mb-2 sm:mb-3 capitalize">
                {`${formData.firstName || user?.firstName || user?.name || 'User'} ${formData.lastName || user?.lastName || ''}`.trim()}
              </h2>

              <div className="space-y-2">
                {user?.role?.toLowerCase() !== 'customer' && accountTypeLabel && (
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                    <div className="text-base text-primary-500 font-medium flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-primary-500" strokeWidth={2} />
                      <span className=" text-base font-medium tracking-wide sm:normal-case sm:tracking-normal">Account Type :-</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <div className="text-sm sm:text-base font-medium text-primary-200">
                        {accountTypeLabel}
                      </div>
                      {tierInfo.label && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-[#F6F8FF] border border-[#E0E7FF] text-xs sm:text-sm font-medium text-primary-500 shadow-sm">
                          {tierInfo.icon && (
                            <img
                              src={tierInfo.icon}
                              alt={`${tierInfo.label} badge`}
                              className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                            />
                          )}
                          {tierInfo.label}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 sm:gap-3">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-primary-500 flex-shrink-0" strokeWidth={2} />
                  <span className="text-xs sm:text-sm md:text-base text-primary-200 truncate font-medium">
                    {formData.email || user?.email || 'user@example.com'}
                  </span>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-primary-500 flex-shrink-0" strokeWidth={2} />
                  <span className="text-xs sm:text-sm md:text-base text-primary-200 font-medium">
                    {formData.phone || user?.phoneNumber || '+61 400 123 456'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Photo Upload Error */}
          {photoError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{photoError}</p>
            </div>
          )}
        </div>

        {/* Form Fields */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* First Name */}
            <div>
              <FloatingLabelInput
                id="firstName"
                name="firstName"
                label="First Name"
                type="text"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder=""
                required
              />
            </div>

            {/* Last Name */}
            <div>
              <FloatingLabelInput
                id="lastName"
                name="lastName"
                label="Last Name"
                type="text"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder=""
                required
              />
            </div>

            {/* Email */}
            <div>
              <FloatingLabelInput
                id="email"
                name="email"
                label="Email address"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder=""
                required
              />
            </div>

            {/* Phone Number */}
            <div>
              <FloatingLabelInput
                id="phone"
                name="phone"
                label="Phone number"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder=""
              />
            </div>
          </div>
        </div>

        {/* Default Location */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6">
          <label className="block text-base font-medium text-primary-500 font-semibold mb-3">
            Your default location
          </label>
          <div className="flex items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-center space-x-3">
              <img src={HeaderLocationIcon} alt="Location" className="w-10 h-10" />
              <div>
                <p className="text-sm sm:text-base font-medium text-primary-200 font-medium">
                  {userLocation.fullAddress || userLocation.address || 'No address set'}
                </p>
                <p className="text-xs sm:text-sm text-primary-200 font-medium">
                  {userLocation.city || 'No city set'}
                </p>
              </div>
            </div>
            <button
              onClick={handleChangeLocation}
              className="text-primary-600 hover:text-primary-600 font-medium text-sm sm:text-base transition-colors cursor-pointer"
            >
              Change
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            loading={loading}
            size="md"
            className="px-10"
          >
            Save
          </Button>
        </div>
      </div>
    </>
  );
};

export default EditProfilePage;

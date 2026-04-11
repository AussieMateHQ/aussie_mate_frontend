import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { userAPI, notificationsAPI } from '../../services/api';
import logo from '../../assets/logo.svg';
import ProfileIcon from '../../assets/User Rounded.svg';
import NotificationIcon from '../../assets/notification2.svg';
import HeaderLocationIcon from '../../assets/headerlocation.svg';
import { socketService } from '../../services/socketService';
import CardBG8 from '../../assets/CardBG8.png';
import CardBG9 from '../../assets/CardBG9.png';

const Header = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState({
    address: 'Location not set',
    city: 'Please set your location'
  });
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  useEffect(() => {
    // Get user location from backend and localStorage
    const updateLocation = async () => {
      try {
        // First try to get from backend
        if (user) {
          const userProfile = await userAPI.getProfile();
          
          // Check different possible locations for user data
          const userData = userProfile.data?.user || userProfile.data || userProfile;
          const location = userData?.location;
          
          if (location) {
            
            // Extract address and city from fullAddress or address
            const fullAddress = location.fullAddress || location.address || '';
            const addressParts = fullAddress.split(',');
            const address = addressParts[0]?.trim() || 'Location not set';
            const city = addressParts.length > 1 ? addressParts[addressParts.length - 2]?.trim() : (location.city || 'Please set your location');
            
            setUserLocation({
              address: address,
              city: city
            });
            return;
          }
        }
      } catch (error) {
        console.error('Error fetching location from backend:', error);
      }
    };

    // Initial load
    updateLocation();

    // Listen for storage changes (when location is updated from other tabs/components)
    const handleStorageChange = (e) => {
      if (e.key === 'userLocation') {
        updateLocation();
      }
    };

    // Listen for custom location update events
    const handleLocationUpdate = () => {
      updateLocation();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('locationUpdated', handleLocationUpdate);

    // Initial check for unread notifications
    const checkNotifications = async () => {
      try {
        if (user) {
          const response = await notificationsAPI.getNotifications();
          if (response.success && response.data) {
            const unread = response.data.some(n => !n.isRead);
            setHasUnreadNotifications(unread);
          }
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    checkNotifications();

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('locationUpdated', handleLocationUpdate);
    window.addEventListener('notificationsUpdated', checkNotifications);

    // Socket listeners for real-time updates
    const handleSocketNotification = () => {
      checkNotifications();
    };

    socketService.on('chatNotification', handleSocketNotification);
    socketService.on('adminChatNotification', handleSocketNotification);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('locationUpdated', handleLocationUpdate);
      window.removeEventListener('notificationsUpdated', checkNotifications);
      socketService.off('chatNotification', handleSocketNotification);
      socketService.off('adminChatNotification', handleSocketNotification);
    };
  }, [user]);

  const handleLogoClick = () => {
    const isCustomer = user && (
      user.userType === 'Customer' || 
      user.role === 'Customer'
    );
    
    if (isCustomer) {
      navigate('/customer-dashboard');
    } else {
      navigate('/cleaner-dashboard');
    }
  };

  const handleChangeLocation = () => {
    navigate('/location', { 
      state: { 
        fromPage: 'header',
        step: 'header'
      } 
    });
  };

  return (
    <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm overflow-hidden" >
      <div className="relative z-10 max-w-7xl mx-auto  overflow-hidden">
      {/* Decorative header backgrounds */}
      <div className="pointer-events-none select-none absolute inset-0">
        {/* Responsive sizing for decorative backgrounds */}
        <img src={CardBG8} alt="CardBG8" aria-hidden className="absolute -top-6 -left-2 w-24 h-24 sm:w-36 sm:h-36 md:w-48 md:h-48 lg:w-60 lg:h-60" />
        <img src={CardBG9} alt="CardBG9" aria-hidden className="absolute -bottom-10 right-0 w-36 h-36 sm:w-48 sm:h-48 md:w-64 md:h-64 lg:w-72 lg:h-72" />
      </div>
      {/* Main Header */}
      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3 md:py-4 flex items-center">
        {/* Left: Location */}
        <div 
          onClick={handleChangeLocation}
          className="flex-1 min-w-0 flex items-center space-x-2 sm:space-x-3 md:space-x-4 cursor-pointer group"
        >
          <div className="flex items-center justify-center"> 
              <img src={HeaderLocationIcon} alt="Location" className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex-shrink-0" />
          </div>
          <div className="min-w-0">
            <div className="text-xs sm:text-sm md:text-base font-medium text-primary-500 truncate group-hover:text-primary-600 transition-colors">
              {userLocation.address}
            </div>
            <div className="text-[10px] sm:text-xs md:text-sm text-primary-200 truncate group-hover:text-primary-300 transition-colors">
              {userLocation.city || 'City not set'}
            </div>
          </div>

          <div className="hidden sm:block text-xs sm:text-sm md:text-base font-medium text-primary-600"> 
            Change
          </div>
        </div>

        {/* Center: Logo */}
        <div className="flex-1 flex justify-center ">
          <button onClick={handleLogoClick} className="flex-shrink-0 cursor-pointer">
            <img src={logo} alt="Aussie Mate" className="h-10 sm:h-12 md:h-14 w-auto" />
          </button>
        </div>

        {/* Right: Icons */}
        <div className="flex-1 flex items-center justify-end space-x-2" >
          {/* Notification Icon */}
          <button 
            onClick={() => navigate('/notifications')}
            className="relative hover:bg-gray-100 rounded-full! transition-colors cursor-pointer"
          >
            <img src={NotificationIcon} alt="Notifications" className="w-9 h-9 sm:w-7 sm:h-7 md:w-11 md:h-11" />
            {hasUnreadNotifications && (
              <span className="absolute top-[8px] right-[8px] sm:top-[6px] sm:right-[6px] md:top-[10px] md:right-[10px] w-2.5 h-2.5 sm:w-2 sm:h-2 md:w-3 md:h-3 bg-[#1D69ED] border-2 border-white rounded-full"></span>
            )}
          </button>

          {/* Profile Icon or Login/Register */}
          {user ? (
            <div className="flex items-center space-x-1">
              <Link 
                to="/profile" 
                className="p-2.5 hover:bg-gray-100 rounded-full! transition-colors"
              >
                <img src={ProfileIcon} alt="Profile" className="w-5 h-5 sm:w-6 sm:h-6 md:w-6 md:h-6" />
              </Link>
              <span className="hidden sm:block text-xs sm:text-sm md:text-base text-primary-200 font-medium capitalize">
                {user.firstName || user.name || 'User'}
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="text-base text-primary-200 font-medium hover:text-gray-800 px-3 py-1 rounded hover:bg-gray-100"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="text-sm bg-primary-500 text-white px-3 py-1 rounded hover:bg-primary-600"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default Header;

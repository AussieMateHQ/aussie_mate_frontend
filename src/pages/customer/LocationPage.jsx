import React, { useState, useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from '@react-google-maps/api';
import { useAuth } from '../../contexts/AuthContext';
import { userAPI } from '../../services/api';
import { MapPin, Navigation, ArrowLeft } from 'lucide-react';
import { Button, Loader, PageHeader } from '../../components';
import { CLEANER_ROLES } from '../../routeGroups';


// Map container style
const mapContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '12px'
};

// Default center
const defaultCenter = {
  lat: -33.839,
  lng: 151.207
};

// Google Maps libraries - static array to prevent reloading
const libraries = ['places'];

const LocationPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [autocomplete, setAutocomplete] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [map, setMap] = useState(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualAddress, setManualAddress] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isFromApp = !!location.state?.fromPage;
  const isCleaner = user && (
    ['Cleaner', 'cleaner', 'CLEANER'].includes(user.role) ||
    ['Cleaner', 'cleaner', 'CLEANER'].includes(user.userType) ||
    CLEANER_ROLES.map(r => r.toLowerCase()).includes((user.role || '').toLowerCase()) ||
    CLEANER_ROLES.map(r => r.toLowerCase()).includes((user.userType || '').toLowerCase())
  );

  const [searchRadius, setSearchRadius] = useState(25);
  const [customRadius, setCustomRadius] = useState("");

  // Load initial radius if cleaner
  useEffect(() => {
    if (isCleaner) {
      const fetchRadius = async () => {
        try {
          const profileResponse = await userAPI.getProfile();
          if (profileResponse.success) {
            const userData = profileResponse.data?.user || profileResponse.data || profileResponse;
            const radius = userData?.searchRadius || userData?.radius || 25;
            setSearchRadius(radius);
          }
        } catch (err) {
          console.error("Failed to fetch radius:", err);
        }
      };
      fetchRadius();
    }
  }, [isCleaner]);

  // Google Maps API key
  const apiKey = import.meta.env.VITE_GOOGLE_MAP_API_KEY;

  // Check if user is logged in when page loads
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    if (!user) {
      navigate("/login");
    }
  }, [navigate]);
  // Load Google Maps
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries: libraries
  });

  // Load saved location on mount
  useEffect(() => {
    const loadSavedLocation = async () => {
      try {
        const savedLocation = localStorage.getItem("userLocation");
        if (savedLocation) {
          const parsed = JSON.parse(savedLocation);
          setSelectedLocation(parsed);
          setSearchQuery(parsed.fullAddress || "");
        } else if (user) {
          const profileResponse = await userAPI.getProfile();
          if (profileResponse.success) {
            const userData = profileResponse.data?.user || profileResponse.data || profileResponse;
            const location = userData?.location;
            if (location) {
              const fullAddress = location.fullAddress || location.address || '';
              const lat = location.coordinates?.[1] || location.lat || -33.839;
              const lng = location.coordinates?.[0] || location.lng || 151.207;

              const initialLocation = {
                fullAddress,
                lat,
                lng,
                coordinates: `${lat}, ${lng}`
              };
              setSelectedLocation(initialLocation);
              setSearchQuery(fullAddress);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load saved location:", err);
      }
    };

    if (isLoaded) {
      loadSavedLocation();
    }
  }, [isLoaded, user]);


  // Map options
  const mapOptions = {
    disableDefaultUI: false,
    clickableIcons: true,
    scrollwheel: true,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false
  };

  // Map callbacks
  const onLoad = useCallback((map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Search function
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Map is already shown, just update location
      setSelectedLocation({
        fullAddress: "1 Denison Street, North Sydney NSW 2060, Australia",
        lat: -33.839,
        lng: 151.207,
        coordinates: "-33.839, 151.207",
      });
    }
  };

  // Get current location with Google Maps API
  const onAutocompleteLoad = (autocompleteInstance) => {
    setAutocomplete(autocompleteInstance);
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (place.geometry) {
        const location = {
          fullAddress: place.formatted_address || place.name,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          coordinates: `${place.geometry.location.lat()}, ${place.geometry.location.lng()}`,
        };
        setSelectedLocation(location);
        setSearchQuery(place.formatted_address || place.name);
      }
    }
  };

  const handleMapClick = (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    setIsLoading(true);
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results[0]) {
        const location = {
          fullAddress: results[0].formatted_address,
          lat,
          lng,
          coordinates: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        };
        setSelectedLocation(location);
        setSearchQuery(results[0].formatted_address);
      }
      setIsLoading(false);
    });
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }

    setIsLoading(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log(`Current position: ${latitude}, ${longitude}`);

        try {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
            if (status === "OK" && results[0]) {
              const location = {
                fullAddress: results[0].formatted_address,
                lat: latitude,
                lng: longitude,
                coordinates: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
              };
              setSelectedLocation(location);
              setSearchQuery(results[0].formatted_address);

              // Pan map if it's available
              if (map) {
                map.panTo({ lat: latitude, lng: longitude });
              }
            } else {
              setError("Google Maps couldn't find an address for this location.");
            }
            setIsLoading(false);
          });
        } catch (err) {
          setError("Reverse geocoding failed");
          setIsLoading(false);
        }
      },
      (err) => {
        setIsLoading(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError("Location access was denied. Please allow it in settings.");
            break;
          case err.POSITION_UNAVAILABLE:
            setError("Location info is unavailable.");
            break;
          case err.TIMEOUT:
            setError("Request to get location timed out.");
            break;
          default:
            setError("Unable to access location.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleManualAddressSubmit = (e) => {
    e.preventDefault();
    if (manualAddress.trim()) {
      // Get current GPS coordinates even when manually entering address
      if (!navigator.geolocation) {
        // Fallback to default coordinates if geolocation not available
        setSelectedLocation({
          fullAddress: manualAddress.trim(),
          lat: -33.839,
          lng: 151.207,
          coordinates: "-33.839, 151.207",
        });
        setShowManualInput(false);
        setManualAddress("");
        return;
      }

      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setSelectedLocation({
            fullAddress: manualAddress.trim(),
            lat: latitude,
            lng: longitude,
            coordinates: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          });
          setShowManualInput(false);
          setManualAddress("");
          setIsLoading(false);
        },
        (err) => {
          console.error("Location error:", err);
          // Fallback to default coordinates if GPS fails
          setSelectedLocation({
            fullAddress: manualAddress.trim(),
            lat: -33.839,
            lng: 151.207,
            coordinates: "-33.839, 151.207",
          });
          setShowManualInput(false);
          setManualAddress("");
          setIsLoading(false);
          setError("GPS access failed. Using default coordinates.");
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    }
  };

  const handleChangeLocation = () => {
    setShowManualInput(true);
    setManualAddress(selectedLocation?.fullAddress || "");
  };

  const handleCancelManual = () => {
    setShowManualInput(false);
    setManualAddress("");
  };

  const handleRadiusChange = (value) => {
    setSearchRadius(value);
    setCustomRadius("");
  };

  const handleCustomRadiusChange = (e) => {
    const inputValue = e.target.value;
    setCustomRadius(inputValue);
    if (inputValue === "") return;

    const value = parseInt(inputValue);
    if (!isNaN(value) && value >= 0 && value <= 50) {
      setSearchRadius(value);
    }
  };

  const handleConfirmLocation = async () => {
    if (!selectedLocation) return;

    const fullAddress = selectedLocation.fullAddress || '';
    const addressParts = fullAddress.split(',');
    const city = addressParts.length > 1
      ? addressParts[addressParts.length - 2]?.trim()
      : "Unknown";

    const locationData = {
      address: selectedLocation.address || selectedLocation.fullAddress,
      city: city,
      fullAddress: selectedLocation.fullAddress,
      lat: selectedLocation.lat,
      lng: selectedLocation.lng,
      coordinates: {
        lat: selectedLocation.lat,
        lng: selectedLocation.lng
      }
    };

    try {
      setIsLoading(true);
      // BACKEND API CALL
      const response = await userAPI.updateLocation(locationData);

      if (response.success && isCleaner) {
        // Persist search radius separately
        try {
          await userAPI.updateSearchRadius(searchRadius);
        } catch (radiusError) {
          // ignore radius save errors
        }
      }

      //  STORE IN LOCAL STORAGE
      localStorage.setItem("userLocation", JSON.stringify(locationData));

      // FIRE FRONTEND EVENT
      window.dispatchEvent(new CustomEvent("locationUpdated", {
        detail: {
          address: selectedLocation.address || selectedLocation.fullAddress,
          city: city,
          coordinates: [selectedLocation.lng, selectedLocation.lat]
        }
      }));

    } catch (error) {
      console.error("Location update failed:", error);
    } finally {
      setIsLoading(false);
    }

    // REDIRECT LOGIC
    if (location.state?.from) {
      const redirectPath = location.state.from.startsWith('/')
        ? location.state.from
        : `/${location.state.from}`;
      return navigate(redirectPath, { state: { ...location.state } });
    }

    const fromEditProfile = location.state?.fromPage === 'edit-profile';
    if (fromEditProfile) {
      return navigate("/profile");
    }

    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;

    if (!user) return navigate("/login");

    const userType = user?.userType || user?.role;
    const existingLocation = localStorage.getItem("userLocation");

    // First time user → Always go to customer dashboard
    if (!existingLocation) return navigate("/customer-dashboard");

    if (["Customer", "customer"].includes(userType)) {
      return navigate("/customer-dashboard");
    }

    return navigate("/cleaner-dashboard");
  };


  return (
    <>
      <div className="py-3 sm:py-8 px-4 sm:px-8">
        <PageHeader
          title="Pick your location"
          onBack={() => navigate(-1)}
          className="mb-6"
          titleClassName="text-xl sm:text-2xl font-semibold text-[#111827]"
          backButtonClassName="cursor-pointer"
        />

        {/* Search Bar Section */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 mb-6 shadow-sm border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5 flex-1">
              <p className="text-[#6B7280] font-medium text-[15px]">
                Add your location so we can match you with the closest cleaners.
              </p>
            </div>

            <div className="w-full md:w-[460px]">
              <form onSubmit={handleSearch}>
                {isLoaded ? (
                  <Autocomplete
                    onLoad={onAutocompleteLoad}
                    onPlaceChanged={onPlaceChanged}
                  >
                    <div className="relative group">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 p-2 bg-primary-50 rounded-full text-primary-600 group-focus-within:bg-primary-600 group-focus-within:text-white transition-all">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search for area, street name..."
                        className="w-full pl-14 pr-6 py-4 border border-gray-200 rounded-full focus:outline-none focus:border-primary-600 text-gray-800 bg-white transition-all shadow-sm group-hover:border-gray-300 placeholder:text-gray-400"
                      />
                    </div>
                  </Autocomplete>
                ) : (
                  <div className="w-full h-[60px] bg-gray-50 border border-gray-100 rounded-full animate-pulse" />
                )}
              </form>
            </div>
          </div>

          {error && (
            <div className="mt-4 text-red-600 text-sm bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              {error}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 pb-10">

          {/* Google Map */}
          <div className="rounded-xl overflow-hidden mb-4 border h-72">
            {isLoaded ? (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={
                  selectedLocation
                    ? { lat: selectedLocation.lat, lng: selectedLocation.lng }
                    : defaultCenter
                }
                zoom={14}
                onLoad={onLoad}
                onUnmount={onUnmount}
                onClick={handleMapClick}
                options={mapOptions}
              >
                {(selectedLocation || defaultCenter) && (
                  <Marker
                    position={
                      selectedLocation
                        ? { lat: selectedLocation.lat, lng: selectedLocation.lng }
                        : defaultCenter
                    }
                  />
                )}
              </GoogleMap>
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-100">
                <Loader message="Loading map..." />
              </div>
            )}
          </div>

          {/* Manual Address Input Form */}
          {showManualInput && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm">
              <h3 className="font-medium text-primary-500 mb-3">Enter Address Manually</h3>
              <form onSubmit={handleManualAddressSubmit} className="space-y-3">
                <textarea
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  placeholder="Enter your full address..."
                  className="w-full p-3 border border-gray-300 rounded-lg! focus:outline-none resize-none text-primary-500 font-medium"
                  rows={3}
                />
                <div className="flex space-x-2 items-center justify-end">
                  <Button
                    type="button"
                    onClick={handleCancelManual}
                    variant="outline"
                    size="sm"
                    className=""
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className=""
                  >
                    Save Address
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Selected Location Card (Figma Style) - Placed Below Map */}
          {selectedLocation && (
            <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-8">
              {/* Address Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="font-semibold text-[#111827] text-base sm:text-lg tracking-tight">
                    {selectedLocation.fullAddress}
                  </div>
                </div>

                <div className="flex items-center space-x-3 self-end sm:self-auto">
                  <button
                    onClick={handleGetCurrentLocation}
                    disabled={isLoading}
                    className="flex items-center space-x-2 px-4 py-2 border border-primary-600 rounded-full text-primary-600 text-sm font-medium hover:bg-blue-50 transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Use Current Location</span>
                  </button>
                  <button
                    onClick={handleChangeLocation}
                    className="text-primary-600 hover:text-primary-700 text-sm font-semibold ml-2 cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              </div>

              {/* Distance Slider (Cleaner Only - Figma Style) */}
              {isCleaner && (
                <div className="space-y-5">
                  <div className="">
                    <div className="flex justify-between text-base">
                      <span className="text-primary-200 font-medium">0 km</span>
                      <span className="font-semibold text-primary-500">{searchRadius} km</span>
                      <span className="text-primary-500 font-bold">50 km</span>
                    </div>

                    <div className="relative">
                      <input
                        type="range"
                        min="0"
                        max="50"
                        value={searchRadius}
                        onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#1F6FEB] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-sm [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#1F6FEB] [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-sm"
                        style={{
                          background: `linear-gradient(to right, #1F6FEB 0%, #1F6FEB ${(searchRadius / 50) * 100}%, #E5E7EB ${(searchRadius / 50) * 100}%, #E5E7EB 100%)`
                        }}
                      />
                    </div>
                  </div>

                  {/* Custom Value and Save Button Row */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1 relative">
                      <input
                        id="customRadius"
                        type="number"
                        value={customRadius}
                        onChange={handleCustomRadiusChange}
                        min="0"
                        max="50"
                        placeholder="Enter Custom Value"
                        className="w-full px-6 py-4 border border-gray-200 rounded-full focus:outline-none focus:border-primary-600 text-gray-500 bg-transparent transition-all placeholder:text-gray-400 placeholder:text-sm"
                      />
                    </div>
                    <Button
                      onClick={handleConfirmLocation}
                      variant="primary"
                      size="lg"
                      loading={isLoading}
                      disabled={isLoading || !selectedLocation}
                      className="rounded-full px-8 whitespace-nowrap min-h-[56px]"
                    >
                      Save Preferences
                    </Button>
                  </div>
                </div>
              )}

              {/* Confirm Button for Customer */}
              {!isCleaner && (
                <Button
                  onClick={handleConfirmLocation}
                  fullWidth
                  size="lg"
                  loading={isLoading}
                  disabled={isLoading || !selectedLocation}
                  className="rounded-full mt-6"
                >
                  Confirm Location
                </Button>
              )}
            </div>
          )}

          {/* Fallback Confirm Button if no selected location */}
          {/* {!selectedLocation && (
            <Button
              onClick={handleConfirmLocation}
              fullWidth
              size="lg"
              loading={isLoading}
              disabled={isLoading || !selectedLocation}
              className="rounded-full"
            >
              Confirm Location
            </Button>
          )} */}
        </div>
      </div>
    </>
  );
};

export default LocationPage;

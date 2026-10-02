import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Loader } from '../../../components';
import MapPinIcon from '../../../assets/map-pin 1.png';
import { userAPI } from '../../../services/api';
import CurrentLocationIcon from '../../../assets/currentLocation.svg';

const AvailabilityPage = () => {
    const navigate = useNavigate();
    const [location, setLocation] = useState('15 Collins Street, Melbourne VIC 3000');
    const [searchRadius, setSearchRadius] = useState(25);
    const [customValue, setCustomValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState('');

    // Fetch user data on component mount
    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            setInitialLoading(true);
            setError('');

            // Fetch user profile and search radius
            const [profileResponse, searchRadiusResponse] = await Promise.all([
                userAPI.getProfile(),
                userAPI.getSearchRadius()
            ]);


            // Set location data from profile
            if (profileResponse.success && profileResponse.data && profileResponse.data.user) {
                const user = profileResponse.data.user;
                setLocation(user.location?.fullAddress || '15 Collins Street, Melbourne VIC 3000');
            }

            // Set search radius from dedicated endpoint
            let radiusValue = 25;
            if (searchRadiusResponse.success && searchRadiusResponse.data) {
                radiusValue = searchRadiusResponse.data.searchRadius || 25;
                setSearchRadius(radiusValue);
            } else if (profileResponse.success && profileResponse.data && profileResponse.data.user) {
                // Fallback to profile data if search radius endpoint fails
                const user = profileResponse.data.user;
                radiusValue = user.location?.searchRadius || 25;
                setSearchRadius(radiusValue);
            }
            setCustomValue(radiusValue.toString());
        } catch (error) {
            console.error('Error fetching user data:', error);
            setError('Failed to load location settings');
        } finally {
            setInitialLoading(false);
        }
    };


    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by this browser.");
            return;
        }

        setLoading(true);
        setError("");

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const apiKey = import.meta.env.VITE_GOOGLE_MAP_API_KEY;

                    const response = await fetch(
                        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
                    );
                    const data = await response.json();

                    if (data.status === "OK") {
                        const fullAddress = data.results[0].formatted_address;
                        setLocation(fullAddress);
                    } else {
                        console.error("Geocoding error:", data.status, data.error_message);

                        let errorMessage = "Unable to get address details. ";
                        switch (data.status) {
                            case "REQUEST_DENIED":
                                errorMessage += "Geocoding API is not enabled. Please enable it in Google Cloud Console.";
                                break;
                            case "OVER_QUERY_LIMIT":
                                errorMessage += "API quota exceeded. Please try again later.";
                                break;
                            case "ZERO_RESULTS":
                                errorMessage += "No results found for this location.";
                                break;
                            default:
                                errorMessage += "Please try again.";
                                break;
                        }
                        setError(errorMessage);
                    }
                } catch (err) {
                    console.error("Reverse geocoding failed:", err);

                    // Fallback: Use coordinates only if geocoding fails
                    const location = `Current Location (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`;
                    setLocation(location);
                    setError("Address lookup failed, but location coordinates are available.");
                } finally {
                    setLoading(false);
                }
            },
            (err) => {
                console.error("Location error:", err);
                setLoading(false);

                let errorMessage = "Unable to access your location. ";
                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        errorMessage += "Please allow location access in your browser settings and try again.";
                        break;
                    case err.POSITION_UNAVAILABLE:
                        errorMessage += "Location information is unavailable. Please check your GPS settings.";
                        break;
                    case err.TIMEOUT:
                        errorMessage += "Location request timed out. Please try again.";
                        break;
                    default:
                        errorMessage += "Please check your GPS settings and try again.";
                        break;
                }
                setError(errorMessage);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    };

    const handleCustomValueChange = (e) => {
        const inputValue = e.target.value;
        setCustomValue(inputValue);

        // Only update searchRadius if the input is a valid number within range
        if (inputValue === "") {
            // Allow clearing the input
            return;
        }

        const value = parseInt(inputValue);
        if (!isNaN(value) && value >= 0 && value <= 50) {
            setSearchRadius(value);
        }
    };

    const handleSliderChange = (e) => {
        const value = parseInt(e.target.value);
        setSearchRadius(value);
        setCustomValue(value.toString());
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            setError('');

            // Update location settings
            const locationData = {
                address: location,
                searchRadius: searchRadius
            };

            // Send location updates
            const [locationResponse, radiusResponse] = await Promise.all([
                userAPI.updateLocation(locationData),
                userAPI.updateSearchRadius(searchRadius)
            ]);

            // Show success message instead of navigating
            setError('Settings saved successfully!');
            setTimeout(() => setError(''), 3000); // Clear success message after 3 seconds
        } catch (error) {
            console.error('Error saving location settings:', error);
            setError('Failed to save settings. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    // Show loading state while fetching initial data
    if (initialLoading) {
        return (
            <>
                <div className="mx-auto w-full max-w-2xl px-3 sm:px-4 py-4 sm:py-6">
                    <PageHeader
                        title="Geo-fencing"
                        onBack={() => navigate(-1)}
                        className="mb-4 sm:mb-6"
                        titleClassName="text-lg sm:text-xl font-semibold text-primary-500"
                    />
                    <Loader message="Loading location settings..." />
                </div>
            </>
        );
    }

    return (
        <>
            <div className="mx-auto w-full max-w-2xl px-3 sm:px-4 py-4 sm:py-6">
                <PageHeader
                    title="Geo-fencing"
                    onBack={() => navigate(-1)}
                    className="mb-4 sm:mb-6"
                    titleClassName="text-base sm:text-lg md:text-xl font-semibold text-primary-500"
                />

                {/* Error/Success Message */}
                {error && (
                    <div className={`mb-4 p-3 rounded-xl ${error.includes('successfully')
                            ? 'bg-green-500 border border-green-500'
                            : 'bg-red-500 border border-red-500'
                        }`}>
                        <p className={`text-sm font-medium ${error.includes('successfully')
                                ? 'text-green-500'
                                : 'text-red-500'
                            }`}>{error}</p>
                        {!error.includes('successfully') && (
                            <button
                                onClick={fetchUserData}
                                className="text-red-500 text-xs underline mt-1"
                            >
                                Retry
                            </button>
                        )}
                    </div>
                )}

                <div className="space-y-4 sm:space-y-6 bg-white rounded-2xl border border-[#F3F3F3] py-4 sm:py-6 px-4 sm:px-6 shadow-custom">

                    {/* Location Preferences Section */}
                    <div className="bg-white rounded-2xl border border-[#F3F3F3] p-3 sm:p-4 md:p-5 shadow-custom">
                        <h2 className="text-sm sm:text-base font-semibold text-primary-500 mb-3 sm:mb-4">Location Preferences</h2>

                        {/* Current Location */}
                        <div className="flex items-center gap-2 mb-3 sm:mb-4">
                            <div className="w-4 h-4 rounded-full flex items-center justify-center">
                                <img src={MapPinIcon} alt="Location" className="w-4 h-4" />
                            </div>
                            <span className="text-xs sm:text-sm font-medium text-primary-500 truncate">{location}</span>
                        </div>

                        {/* Use Current Location Button */}
                        <button
                            onClick={handleUseCurrentLocation}
                            disabled={loading}
                            className="flex items-center justify-center gap-2 py-2.5 sm:py-2 px-3 sm:px-4 border border-[#1F6FEB] rounded-xl text-primary-600 font-medium text-xs sm:text-sm hover:bg-primary-50 transition-colors mb-4 sm:mb-6 disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-3.5 w-3.5 sm:h-4 sm:w-4 border-b-2 border-[#1F6FEB]"></div>
                            ) : (
                                <img src={CurrentLocationIcon} alt="Location" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            )}
                            <span className="truncate">
                                {loading ? "Getting location..." : "Use Current Location"}
                            </span>
                        </button>

                        {/* Distance Slider */}
                        <div className="mb-3 sm:mb-4">
                            <div className="flex justify-between text-xs text-primary-200 font-medium mb-2">
                                <span>0 km</span>
                                <span>25 km</span>
                                <span>50 km</span>
                            </div>
                            <div className="relative px-1">
                                <input
                                    type="range"
                                    min="0"
                                    max="50"
                                    value={searchRadius}
                                    onChange={handleSliderChange}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                                    style={{
                                        background: `linear-gradient(to right, #3354F4 0%, #3354F4 ${(searchRadius / 50) * 100}%, #E5E7EB ${(searchRadius / 50) * 100}%, #E5E7EB 100%)`
                                    }}
                                />
                            </div>
                        </div>

                        {/* Custom Value Input */}
                        <div>
                            <input
                                type="number"
                                placeholder="Enter Custom Value"
                                value={customValue}
                                onChange={handleCustomValueChange}
                                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-[#F3F3F3] rounded-xl text-xs sm:text-sm font-medium text-primary-500 placeholder-primary-200 focus:outline-none"
                                min="0"
                                max="100"
                            />
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="bg-primary-500 text-white font-medium py-3 sm:py-2 px-4 sm:px-16 rounded-xl hover:bg-primary-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
                        >
                            {loading ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                .slider::-webkit-slider-thumb {
                    appearance: none;
                    height: 20px;
                    width: 20px;
                    border-radius: 50%;
                    background: #3354F4;
                    cursor: pointer;
                    border: 2px solid #ffffff;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }
                
                .slider::-moz-range-thumb {
                    height: 20px;
                    width: 20px;
                    border-radius: 50%;
                    background: #3354F4;
                    cursor: pointer;
                    border: 2px solid #ffffff;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }
            `}</style>
        </>
    );
};

export default AvailabilityPage;

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, UserRound, X, CalendarDays, Clock3, CheckCircle, Circle, Calendar, Phone, Mail, Check, MapPin } from 'lucide-react';

import { Button, MapWithPolyline, PageHeader } from '../../components';
import ConfirmationModal from '../../components/modals/ConfirmationModal';

import MapPinIcon1 from '../../assets/location.svg';

import ChatIcon from '../../assets/message2.svg';

import { jobsAPI, userAPI, jobPhotosAPI } from '../../services/api';
import { socketService } from '../../services/socketService';


// Helper functions for weekly job history
const getPreferredDaysDisplay = (preferredDays) => {
    if (!preferredDays || typeof preferredDays !== 'object') return '';

    const days = Object.keys(preferredDays).filter(day => preferredDays[day] === true);
    if (days.length === 0) return '';

    return days.join(', ');
};

const generateWeeklySchedule = (job, workProgress, occurrences) => {
    if (!occurrences || !Array.isArray(occurrences)) return [];

    return occurrences.map(occurrence => {
        // Convert status from API to frontend format
        let status = 'pending';
        let photos = 0;

        switch (occurrence.status) {
            case 'completed':
                status = 'completed';
                photos = occurrence.beforePhotosCount + occurrence.afterPhotosCount;
                break;
            case 'in_progress':
                status = 'in-progress';
                photos = occurrence.beforePhotosCount + occurrence.afterPhotosCount;
                break;
            case 'pending_customer_confirmation':
                status = 'pending_customer_confirmation';
                photos = occurrence.beforePhotosCount + occurrence.afterPhotosCount;
                break;
            case 'pending':
            default:
                status = 'pending';
                photos = 0;
                break;
        }

        // Parse week and day from label (e.g., "Monday - Week 1")
        const labelParts = occurrence.label.split(' - ');
        const day = labelParts[0] || 'Unknown';
        const week = labelParts[1] ? parseInt(labelParts[1].replace('Week ', '')) : 1;

        return {
            id: occurrence._id,
            week,
            day,
            date: new Date(occurrence.scheduledDate),
            status,
            photos,
            amount: occurrence.amount || workProgress?.amountPerOccurrence || 100,
            occurrence: occurrence // Keep original occurrence data for reference
        };
    });
};


const InProgressJobDetailsPage = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [customer, setCustomer] = useState(null);
    const [acceptedQuote, setAcceptedQuote] = useState(null);

    const [workProgress, setWorkProgress] = useState(null);
    const [occurrences, setOccurrences] = useState([]);
    const [weeklySchedule, setWeeklySchedule] = useState([]);
    const [error, setError] = useState('');
    const [showMap, setShowMap] = useState(false);
    const [routeInfo, setRouteInfo] = useState(null);
    const [isNearCustomer, setIsNearCustomer] = useState(false);
    const [cleanerLocation, setCleanerLocation] = useState(null);
    const [customerLocation, setCustomerLocation] = useState(null);
    const [isTrackingLocation, setIsTrackingLocation] = useState(false);
    const [locationError, setLocationError] = useState(null);
    const [selectedWorkProgressId, setSelectedWorkProgressId] = useState(null);
    const [isCompleting, setIsCompleting] = useState(false);
    const [showPhoneModal, setShowPhoneModal] = useState(false);
    const [tempPhone, setTempPhone] = useState('');
    const [showPhoneDisplayModal, setShowPhoneDisplayModal] = useState(false);
    const [phoneToDisplay, setPhoneToDisplay] = useState('');
    const [copied, setCopied] = useState(false);
    const cleanerLocationRef = useRef(null);

    const isToday = (date) => {
        const today = new Date();
        const checkDate = new Date(date);
        return today.toDateString() === checkDate.toDateString();
    };

    useEffect(() => {
        const fetchJobDetails = async () => {
            try {
                setLoading(true);

                let progressData = null;
                try {
                    const progressResponse = await jobsAPI.getCleanerProgress(jobId);
                    if (progressResponse.success && progressResponse.data) {
                        progressData = progressResponse.data;
                    }
                } catch (err) {
                    console.warn('getCleanerProgress failed, attempting fallback to getJobById', err);
                }

                if (!progressData) {
                    const jobResponse = await jobsAPI.getJobById(jobId);
                    if (jobResponse.success && jobResponse.data) {
                        const job = jobResponse.data;
                        progressData = {
                            job,
                            customer: job.customerId || job.customer,
                            quote: job.acceptedQuote || (job.quotes || []).find(q => q.status === 'accepted' || q.isAccepted),
                            workProgress: job.workProgress,
                            occurrences: job.occurrences || []
                        };
                    }
                }



                if (progressData && progressData.job) {
                    const { job, quote, customer, workProgress, occurrences } = progressData;

                    if (job.status === 'completed') {
                        navigate(`/cleaner-job-completed/${jobId}`, { replace: true });
                        return;
                    }

                    setJob(job);
                    setAcceptedQuote(quote);
                    setCustomer(customer);
                    setWorkProgress(workProgress);
                    setOccurrences(occurrences);

                    // Generate weekly schedule from occurrences data
                    if (job.frequency === 'Weekly' && occurrences && occurrences.length > 0) {
                        const schedule = generateWeeklySchedule(job, workProgress, occurrences);
                        setWeeklySchedule(schedule);

                        const todayItem = schedule.find(item => {
                            const checkDate = typeof item.date === 'string' ? new Date(item.date) : item.date;
                            const isTodayDate = isToday(checkDate);
                            const isPending = item.status === 'pending';
                            const result = isTodayDate && isPending;
                            return result;
                        });
                        if (todayItem) {
                            setSelectedWorkProgressId(todayItem.id);
                        } else {
                            setSelectedWorkProgressId(null);
                        }
                    }

                    // Set customer location from job data
                    const coords = job.location?.coordinates;
                    if (coords) {
                        let lat, lng;
                        if (typeof coords === 'string') {
                            const coordsArr = coords.split(',').map(coord => parseFloat(coord.trim()));
                            lat = coordsArr[1];
                            lng = coordsArr[0]
                        } else if (coords.lat && coords.lng) {
                            lat = coords.lat;
                            lng = coords.lng;
                        } else if (Array.isArray(coords)) {
                            // Standardize to [lat, lng] from backend
                            lat = coords[0];
                            lng = coords[1];
                        }

                        if (lat && lng && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                            setCustomerLocation({ lat, lng });
                        } else if (lat && lng && (lat > 90 || lat < -90)) {
                            setCustomerLocation({ lat: lng, lng: lat });
                        }
                    }
                } else {
                    setError('Job not found');
                }


            } catch (err) {
                setError('Failed to load job details');
                console.error('Error fetching job:', err);
            } finally {
                setLoading(false);
            }
        };

        if (jobId) {
            fetchJobDetails();
        }
    }, [jobId]);

    const handleGetDirections = () => {
        setShowMap(!showMap);
    };

    // Haversine formula to calculate distance between two coordinates in meters
    const getDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371e3;
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance in meters
    };

    useEffect(() => {
        if (cleanerLocation && customerLocation) {
            const distance = getDistance(
                cleanerLocation.lat,
                cleanerLocation.lng,
                customerLocation.lat,
                customerLocation.lng
            );

            const near = distance <= 100;
            setIsNearCustomer(near);
        }
    }, [cleanerLocation, customerLocation]);

    // Auto-redirect only if job is completed, and auto-show map if on the way
    useEffect(() => {
        if (job?.status === 'completed') {
            navigate(`/cleaner-job-completed/${jobId}`, { replace: true });
        }
        if (job?.status === 'on_the_way') {
            setShowMap(true);
        } else if (job?.status === 'started' || job?.status === 'pending_customer_confirmation') {
            setShowMap(false);
        }
    }, [job?.status, jobId, navigate]);

    // Socket connection and location tracking
    useEffect(() => {
        if (!jobId || !job) return;

        // Connect to socket
        const token = localStorage.getItem('authToken');
        if (token && !socketService.isConnected) {
            socketService.connect(token);
        }

        // Wait for socket connection before joining room
        const connectionTimeout = setTimeout(() => {
            if (socketService.isConnected) {
                socketService.joinJobRoom(jobId);
            }
        }, 1000);

        // Start location tracking
        let watchId;
        let locationInterval;

        const startLocationTracking = () => {
            if (!navigator.geolocation) {
                setLocationError('Geolocation is not supported by your browser');
                console.error('❌ Geolocation not supported');
                return;
            }

            setIsTrackingLocation(true);

            // Real GPS tracking
            watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const newLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    setCleanerLocation(newLocation);
                    cleanerLocationRef.current = newLocation;
                },
                (error) => {
                    console.error('❌ Geolocation error:', error);
                    setLocationError(error.message);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );

            // Send location updates every 10 seconds
            locationInterval = setInterval(() => {
                const currentLocation = cleanerLocationRef.current;
                if (currentLocation && socketService.isConnected) {
                    socketService.updateCleanerLocation(
                        currentLocation.lat,
                        currentLocation.lng,
                        jobId
                    );
                }
            }, 10000); // Every 10 seconds
        };

        // Start tracking after a short delay to ensure everything is loaded
        const trackingTimeout = setTimeout(startLocationTracking, 1500);

        // Cleanup
        return () => {
            clearTimeout(connectionTimeout);
            clearTimeout(trackingTimeout);

            if (watchId) {
                navigator.geolocation.clearWatch(watchId);
            }

            if (locationInterval) {
                clearInterval(locationInterval);
            }

            if (socketService.isConnected && jobId) {
                socketService.leaveJobRoom(jobId);
            }

            setIsTrackingLocation(false);
        };
    }, [jobId, job]);


    const getCoordinates = (coordinates) => {
        if (!coordinates) return null;

        let lat, lng;

        if (typeof coordinates === 'string') {
            const coords = coordinates.split(',').map(coord => parseFloat(coord.trim()));
            // Most strings are "lat, lng", but let's check
            if (coords[0] < 40 && coords[1] > 40) {
                lat = coords[0];
                lng = coords[1];
            } else {
                lat = coords[1];
                lng = coords[0];
            }
        } else if (coordinates.lat && coordinates.lng) {
            lat = coordinates.lat;
            lng = coordinates.lng;
        } else if (Array.isArray(coordinates)) {
            // GeoJSON is [lng, lat], but some backends send [lat, lng]
            if (coordinates[0] < 40 && coordinates[1] > 40) {
                lat = coordinates[0];
                lng = coordinates[1];
            } else {
                lat = coordinates[1];
                lng = coordinates[0];
            }
        }

        // Final check: if they are swapped (lat > lng for India)
        if (Math.abs(lat) > Math.abs(lng)) {
            [lat, lng] = [lng, lat];
        }

        if (lat && lng && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            return { lat, lng };
        }
        return null;
    };

    const handleChatWithCustomer = () => {
        navigate(`/chat/${jobId}`);
    };

    useEffect(() => {
    }, [selectedWorkProgressId]);

    const handleCallCustomer = () => {
        const phoneNumber = customer?.phone ||
            customer?.phoneNumber ||
            customer?.mobile ||
            job?.customer?.phone ||
            job?.customer?.phoneNumber ||
            job?.customer?.mobile;

        if (phoneNumber) {
            setPhoneToDisplay(phoneNumber);
            setCopied(false);
            setShowPhoneDisplayModal(true);
        } else {
            console.error('Customer phone number not available');
            setTempPhone('');
            setShowPhoneModal(true);
        }
    };

    const handleOnTheWay = async () => {
        try {
            const response = await jobsAPI.updateJobStatus(jobId, 'on_the_way');
            if (response.success) {
                const progressResponse = await jobsAPI.getCleanerProgress(jobId);
                if (progressResponse.success) {
                    setJob(progressResponse.data.job);
                }
            } else {
                alert(response.message || 'Failed to update status');
            }
        } catch (err) {
            console.error('Error updating status:', err);
            alert('An error occurred. Please try again.');
        }
    };

    const handleStartJob = async () => {
        try {
            const response = await jobsAPI.updateJobStatus(jobId, 'started');
            if (response.success) {
                const progressResponse = await jobsAPI.getCleanerProgress(jobId);
                if (progressResponse.success) {
                    setJob(progressResponse.data.job);
                    setShowMap(false);
                }
            } else {
                alert(response.message || 'Failed to update status');
            }
        } catch (err) {
            console.error('Error updating status:', err);
            alert('An error occurred. Please try again.');
        }
    };

    const handleRequestCompletion = async () => {
        let occId = null;
        if (job?.frequency === 'Weekly') {
            occId = selectedWorkProgressId;
            const selectedOccurrence = weeklySchedule.find(item => item.id === selectedWorkProgressId);

            if (!selectedOccurrence) {
                alert('Please select a pending occurrence for today to request completion.');
                return;
            }
            if (selectedOccurrence.status === 'completed') {
                alert('This occurrence is already completed.');
                return;
            }
        } else if (job?.frequency === 'Custom') {
            occId = selectedWorkProgressId;
            const selectedOccurrence = occurrences.find(occ => occ._id === selectedWorkProgressId);

            if (!selectedOccurrence) {
                alert('Please select a pending occurrence for today.');
                return;
            }
            if (selectedOccurrence.status === 'completed') {
                alert('This occurrence is already completed.');
                return;
            }
            if (!isToday(selectedOccurrence.scheduledDate)) {
                alert('You can only complete jobs scheduled for today.');
                return;
            }
        } else {
            occId = occurrences?.[0]?._id;
        }

        try {
            setIsCompleting(true);

            try {
                const paymentStatusResponse = await paymentService.getPaymentStatus(jobId);

                if (paymentStatusResponse?.success && paymentStatusResponse?.data?.payment?._id) {
                    const paymentId = paymentStatusResponse.data.payment._id;
                    const pStatus = paymentStatusResponse.data.payment.status;

                    if (pStatus === 'authorized') {
                        await paymentService.capturePayment(paymentId);
                    }
                }
            } catch (paymentError) {
            }

            const response = await jobPhotosAPI.updateJobStatus(jobId, 'pending_customer_confirmation', occId);

            if (response.success) {
                navigate('/cleaner-jobs', { state: { tab: 'completed' }, replace: true });
            } else {
                alert(response.message || 'Failed to update job status');
            }
        } catch (err) {
            console.error('Error completing job:', err);
            alert('An error occurred while completing the job. Please try again.');
        } finally {
            setIsCompleting(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-gray-50">
                <div className="max-w-sm mx-auto sm:max-w-2xl lg:max-w-4xl xl:max-w-6xl p-4">
                    <div className="bg-white rounded-2xl p-6 animate-pulse">
                        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
                        <div className="space-y-4">
                            <div className="h-20 bg-gray-200 rounded"></div>
                            <div className="h-32 bg-gray-200 rounded"></div>
                            <div className="h-24 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !job) {
        return (
            <div className="bg-gray-50">
                <div className="max-w-sm mx-auto sm:max-w-2xl lg:max-w-4xl xl:max-w-6xl p-4">
                    <div className="bg-white rounded-2xl p-6 text-center">
                        <p className="text-red-500">{error || 'Job not found'}</p>
                        <Button
                            onClick={() => navigate(-1)}
                            variant="primary"
                            className="mt-4"
                        >
                            Go Back
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'Date not specified';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-AU', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTimeAgo = (dateString) => {
        if (!dateString) return 'Recently posted';
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

        if (diffInHours < 1) return 'Posted just now';
        if (diffInHours === 1) return 'Posted 1h ago';
        if (diffInHours < 24) return `Posted ${diffInHours}h ago`;

        const diffInDays = Math.floor(diffInHours / 24);
        return `Posted ${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    };



    const getJobTitle = (job) => {
        return job?.serviceTypeId?.name || job?.serviceType?.name || job?.serviceTypeDisplay || job?.serviceType || job?.title || 'Job Details';
    };

    const getJobCategory = (job) => {
        return job?.categoryId?.name || 'General Cleaning';
    };


    const headerTitle = getJobTitle(job);


    return (
        <>
            <div className="max-w-sm mx-auto sm:max-w-2xl lg:max-w-4xl xl:max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="py-2 sm:py-4">
                    <PageHeader
                        title={headerTitle}
                        onBack={() => {
                            const savedTab = localStorage.getItem('cleanerActiveTab');
                            navigate('/cleaner-jobs', { state: { tab: savedTab || 'accepted' }, replace: true });
                        }}
                        titleClassName="text-lg sm:text-xl font-semibold text-primary-500 truncate"
                    />
                </div>

                <div className="pb-6">
                    {/* Job Details Card (Figma Style) */}
                    <div className="bg-[#F8FAFF] rounded-3xl p-5 mb-6 border border-[#E9EFFF]">
                        <div className="mb-4">
                            <span className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                                {getJobCategory(job)}
                            </span>
                            <h2 className="text-[20px] font-semibold text-primary-500 mt-1 leading-tight">
                                {headerTitle}
                            </h2>
                        </div>

                        <div className="space-y-3">
                            {/* Distance */}
                            <div className="flex items-center text-[#6B7280]">
                                <MapPin className="w-4 h-4 mr-3 opacity-60 text-black" strokeWidth={2.5} />

                                <span className="text-sm font-medium">
                                    Approx. {job.distance || '4.2 km'} away, {job.location?.city || 'VIC'}
                                </span>
                            </div>

                            {/* Date & Time */}
                            <div className="flex items-center text-[#6B7280]">
                                <Calendar className="w-4 h-4 mr-3 opacity-60 text-black" strokeWidth={2.5} />
                                <span className="text-sm font-medium">
                                    {job.scheduledDate ? formatDate(job.scheduledDate) : 'Date not specified'}
                                </span>
                            </div>
                        </div>
                    </div>


                    {/* Location Tracking Status removed as per user request */}

                    {/* Location Error */}
                    {locationError && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-4 shadow-sm">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="w-5 h-5 text-yellow-600" strokeWidth={2} />
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-yellow-800">Location Access Issue</p>
                                    <p className="text-xs text-yellow-600">{locationError}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Map Section */}
                    {showMap && (
                        <div className="bg-white rounded-3xl overflow-hidden mb-6 border border-[#F1F5F9] transition-all duration-300">
                            {/* <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-bold text-primary-500">Route to Customer</h3>
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 rounded-full">
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Active Route</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowMap(false)}
                                    className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="w-5 h-5" strokeWidth={2.5} />
                                </button>
                            </div> */}

                            <div className="relative">
                                {(() => {
                                    const originalCoords = job?.location?.coordinates;
                                    const fixedCoords = getCoordinates(originalCoords);

                                    if (!fixedCoords) {
                                        return (
                                            <div className="h-64 bg-gray-50 flex items-center justify-center">
                                                <div className="text-center">
                                                    <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-2 opacity-50" />
                                                    <p className="text-gray-500 font-medium">Customer location not available</p>
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div>
                                            <MapWithPolyline
                                                customerLocation={fixedCoords}
                                                cleanerLocation={cleanerLocation}
                                                hasArrived={isNearCustomer || job?.isLocationMatched}
                                                // hasArrived={job?.isLocationMatched}
                                                onRouteInfo={(info) => setRouteInfo(info)}
                                            />
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    )}

                    {/* Assigned By Section */}
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-[#111827] mb-3 ml-1">Assigned By</h3>
                        <div className="bg-white rounded-3xl p-4 border border-[#F1F5F9] shadow-sm">
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 bg-gray-50 border border-gray-100">
                                        {customer?.profilePhoto?.url || customer?.profileImage ? (
                                            <img
                                                src={customer?.profilePhoto?.url || customer?.profileImage}
                                                alt="Customer"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                                <UserRound className="w-7 h-7 text-gray-400" strokeWidth={1.5} />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-semibold text-primary-500">
                                            {customer?.firstName || 'Customer'} {customer?.lastName?.slice(0, 1) || ''}.
                                        </h4>
                                        <div className="flex flex-col gap-1 mt-1">
                                            <div className="flex items-center text-sm text-[#4B5563] font-medium mt-0.5">
                                                <Phone className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                                                {customer?.phone || customer?.phoneNumber || 'No phone'}
                                            </div>
                                            {customer?.email && (
                                                <div className="flex items-center text-sm text-[#4B5563] font-medium">
                                                    <Mail className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                                                    {customer.email}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleChatWithCustomer}
                                        className="w-10 h-10 rounded-xl flex items-center justify-center border border-[#9CC0F6] hover:bg-[#EBF2FD] transition-colors cursor-pointer"
                                    >
                                        <img src={ChatIcon} alt="Chat" className="w-5 h-5 opacity-70" />
                                    </button>
                                    <button
                                        onClick={handleCallCustomer}
                                        className="w-10 h-10 rounded-xl flex items-center justify-center border border-[#9CC0F6] hover:bg-[#EBF2FD] transition-colors cursor-pointer"
                                    >
                                        <Phone className="w-5 h-5 text-[#1F6FEB]" strokeWidth={1.5} />
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={handleGetDirections}
                                className="flex items-center gap-2 text-[#1F6FEB] text-sm font-semibold pl-1 hover:underline cursor-pointer"
                            >
                                <img src={MapPinIcon1} alt="Directions" className="w-4 h-4" />
                                {showMap ? 'Hide Map' : 'Get Directions'}
                            </button>
                        </div>
                    </div>


                    {/* Custom Job Dates Section */}
                    {job?.frequency === 'Custom' && occurrences && occurrences.length > 0 && (
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold text-primary-500 mb-3">Job Schedule</h3>
                            <div className="bg-white rounded-2xl p-4 shadow-sm">
                                <div className="space-y-3">
                                    {occurrences.map((occurrence, index) => (
                                        <div
                                            key={occurrence._id || index}
                                            onClick={() => setSelectedWorkProgressId(occurrence._id)}
                                            className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all cursor-pointer ${isToday(occurrence.scheduledDate)
                                                ? 'bg-blue-50 border-blue-300 shadow-md'
                                                : 'bg-gray-50 border-gray-200'
                                                } ${selectedWorkProgressId === occurrence._id
                                                    ? 'ring-2 ring-blue-500 ring-offset-2'
                                                    : ''
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex-shrink-0">
                                                    {occurrence.status === 'completed' ? (
                                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                                    ) : occurrence.status === 'in_progress' ? (
                                                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                                    ) : (
                                                        <Circle className="w-5 h-5 text-gray-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-primary-500 flex items-center gap-2">
                                                        {occurrence.label || `Job ${index + 1}`}
                                                        {isToday(occurrence.scheduledDate) && (
                                                            <span className="text-xs font-bold px-2 py-1 bg-blue-500 text-white rounded-full">
                                                                TODAY
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {new Date(occurrence.scheduledDate).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric'
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <div className="text-sm font-medium text-primary-600">
                                                        ${occurrence.amount || workProgress?.amountPerOccurrence || 0}
                                                    </div>
                                                    {(occurrence.beforePhotosCount + occurrence.afterPhotosCount) > 0 && (
                                                        <div className="text-xs text-gray-500">
                                                            {(occurrence.beforePhotosCount + occurrence.afterPhotosCount)} photo{(occurrence.beforePhotosCount + occurrence.afterPhotosCount) > 1 ? 's' : ''}
                                                        </div>
                                                    )}
                                                </div>
                                                {occurrence.status === 'completed' && (
                                                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-700">
                                                        Completed
                                                    </span>
                                                )}
                                                {occurrence.status === 'in_progress' && (
                                                    <Button size="sm" variant="primary">
                                                        Mark Complete
                                                    </Button>
                                                )}
                                                {occurrence.status === 'pending' && (
                                                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${isToday(occurrence.scheduledDate)
                                                        ? 'bg-blue-100 text-blue-700 font-bold'
                                                        : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        Pending
                                                    </span>
                                                )}
                                                {occurrence.status === 'pending_customer_confirmation' && (
                                                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                                                        Pending Confirmation
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Progress Summary */}
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-gray-600">
                                            <span className="font-medium text-green-600">
                                                {occurrences.filter(occ => occ.status === 'completed').length}
                                            </span> completed •
                                            <span className="font-medium text-blue-600 ml-1">
                                                {occurrences.filter(occ => occ.status === 'in_progress').length}
                                            </span> in progress •
                                            <span className="font-medium text-gray-600 ml-1">
                                                {occurrences.filter(occ => occ.status === 'pending' || occ.status === 'pending_customer_confirmation').length}
                                            </span> pending
                                        </div>
                                        <div className="text-sm font-medium text-primary-600">
                                            Total: ${occurrences.reduce((sum, occ) => sum + (occ.amount || workProgress?.amountPerOccurrence || 0), 0)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Work Progress Section for Weekly Jobs */}
                    {weeklySchedule.length > 0 && (
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold text-primary-500 mb-3">Work Progress</h3>
                            <div className="bg-white rounded-2xl p-4 shadow-sm">
                                <div className="space-y-3">
                                    {weeklySchedule.map((item) => (
                                        <div
                                            key={item.id}
                                            onClick={() => setSelectedWorkProgressId(item.id)}
                                            className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all cursor-pointer ${isToday(item.date)
                                                ? 'bg-blue-50 border-blue-300 shadow-md'
                                                : 'bg-gray-50 border-gray-200'
                                                } ${selectedWorkProgressId === item.id
                                                    ? 'ring-2 ring-blue-500 ring-offset-2'
                                                    : ''
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex-shrink-0">
                                                    {item.status === 'completed' ? (
                                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                                    ) : item.status === 'in-progress' ? (
                                                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                                    ) : (
                                                        <Circle className="w-5 h-5 text-gray-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-primary-500 flex items-center gap-2">
                                                        {item.day} - Week {item.week}
                                                        {isToday(item.date) && (
                                                            <span className="text-xs font-bold px-2 py-1 bg-blue-500 text-white rounded-full">
                                                                TODAY
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {item.date.toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric'
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <div className="text-sm font-medium text-primary-600">
                                                        ${item.amount}
                                                    </div>
                                                    {item.photos > 0 && (
                                                        <div className="text-xs text-gray-500">
                                                            {item.photos} photo{item.photos > 1 ? 's' : ''}
                                                        </div>
                                                    )}
                                                </div>
                                                {item.status === 'completed' && (
                                                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-700">
                                                        Completed
                                                    </span>
                                                )}
                                                {item.status === 'in-progress' && (
                                                    <Button size="sm" variant="primary">
                                                        Mark Complete
                                                    </Button>
                                                )}
                                                {item.status === 'pending' && (
                                                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${isToday(item.date)
                                                        ? 'bg-blue-100 text-blue-700 font-bold'
                                                        : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        Pending
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Progress Summary */}
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-gray-600">
                                            <span className="font-medium text-green-600">
                                                {weeklySchedule.filter(item => item.status === 'completed').length}
                                            </span> completed •
                                            <span className="font-medium text-blue-600 ml-1">
                                                {weeklySchedule.filter(item => item.status === 'in-progress').length}
                                            </span> in progress •
                                            <span className="font-medium text-gray-600 ml-1">
                                                {weeklySchedule.filter(item => item.status === 'pending').length}
                                            </span> pending
                                        </div>
                                        <div className="text-sm font-medium text-primary-600">
                                            Total: ${weeklySchedule.reduce((sum, item) => sum + item.amount, 0)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Sticky Footer Action Button */}
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-10 flex justify-center">
                        <div className="flex justify-center">
                            {job.status === 'started' || job.status === 'in_progress' ? (
                                <Button
                                    onClick={handleRequestCompletion}
                                    variant="primary"
                                    className="w-full sm:w-auto"
                                    loading={isCompleting}
                                    disabled={isCompleting}
                                >
                                    Request For Complete Job
                                </Button>
                            ) : job.status === 'on_the_way' ? (
                                <Button
                                    onClick={handleStartJob}
                                    variant="primary"
                                    disabled={!isNearCustomer}
                                    className={`w-full sm:w-auto ${!isNearCustomer ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    Start Job
                                </Button>
                            ) : job.status === 'pending_customer_confirmation' || job.status === 'completed' ? (
                                <div className="bg-green-50 px-6 py-3 rounded-xl border border-green-100 flex items-center justify-center gap-2">
                                    <Check className="w-5 h-5 text-green-500" />
                                    <span className="text-green-600 font-semibold">
                                        {job.status === 'completed' ? 'Job Completed' : 'Awaiting Customer Confirmation'}
                                    </span>
                                </div>
                            ) : (
                                <Button
                                    onClick={handleOnTheWay}
                                    variant="primary"
                                    className="w-full sm:w-auto"
                                >
                                    I'm On The Way
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="h-24"></div>

                </div>
            </div>

            {/* Phone Number Modal */}
            <ConfirmationModal
                isOpen={showPhoneModal}
                onClose={() => setShowPhoneModal(false)}
                onConfirm={() => {
                    if (tempPhone.trim()) {
                        window.location.href = `tel:${tempPhone.trim()}`;
                        setShowPhoneModal(false);
                    }
                }}
                title="Phone Number Not Available"
                message="The customer has not provided a contact phone number. You can enter a temporary number here to call directly, or choose to chat with them."
                confirmText="Call Number"
                cancelText="Close"
                confirmButtonColor="bg-blue-600 hover:bg-blue-700"
            >
                <div className="mt-4 mb-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider text-left">
                        Enter Phone Number to Call
                    </label>
                    <input
                        type="tel"
                        value={tempPhone}
                        onChange={(e) => setTempPhone(e.target.value)}
                        placeholder="e.g. +61 400 000 000"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-gray-800"
                    />
                </div>
            </ConfirmationModal>

            {/* Phone Number Display Modal */}
            <ConfirmationModal
                isOpen={showPhoneDisplayModal}
                onClose={() => setShowPhoneDisplayModal(false)}
                onConfirm={() => {
                    navigator.clipboard.writeText(phoneToDisplay);
                    setCopied(true);
                    setTimeout(() => {
                        setShowPhoneDisplayModal(false);
                    }, 1200);
                }}
                title="Customer Contact Info"
                message="Choose how you want to connect with the customer:"
                confirmText={copied ? "Copied!" : "Copy Number"}
                cancelText="Close"
                confirmButtonColor="bg-blue-600 hover:bg-blue-700"
            >
                <div className="mt-4 mb-4 text-center">
                    <a 
                        href={`tel:${phoneToDisplay}`}
                        className="inline-flex items-center gap-2 px-5 py-3.5 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-2xl shadow-inner font-bold text-lg text-blue-600 tracking-wide transition-all cursor-pointer"
                    >
                        📞 {phoneToDisplay}
                    </a>
                    <p className="text-xs text-gray-400 font-semibold mt-2.5">
                        {/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
                            ? "📱 Tap the number above to make a direct call." 
                            : "💻 Click the number to call, or click Copy below."}
                    </p>
                    {copied && (
                        <p className="text-xs text-green-600 font-semibold mt-2 animate-pulse">
                            ✓ Copied to clipboard successfully!
                        </p>
                    )}
                </div>
            </ConfirmationModal>
        </>
    );
};

export default InProgressJobDetailsPage;

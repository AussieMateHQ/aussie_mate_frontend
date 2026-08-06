import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Check, UserRound, X, CalendarDays, Clock3, Home as HomeIcon, Wallet, Ruler, AlertTriangle, CheckCircle, Circle, Calendar, MapPinIcon, Mail } from 'lucide-react';

import { Button, MapWithPolyline, PageHeader, Loader, JobOverviewCard } from '../../components';
import ConfirmationModal from '../../components/modals/ConfirmationModal';

import PhoneIcon from '../../assets/phone2.svg?react';
import PhoneIcon2 from '../../assets/phone.svg';
import ChatIcon from '../../assets/message2.svg';
import StarIcon from '../../assets/rating.svg';
import SilverBadgeIcon from '../../assets/silverBadge.svg';
import GoldBadgeIcon from '../../assets/goldBadge.svg';
import BronzeBadgeIcon from '../../assets/bronzeBadge.svg';
import { jobsAPI } from '../../services/api';

import { socketService } from '../../services/socketService';


// Helper functions for weekly job history
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
      occurrence: occurrence
    };
  });
};

const CustomerInProgressJobDetailsPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [job, setJob] = useState(null);
  const [cleaner, setCleaner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [showArrivalStatus, setShowArrivalStatus] = useState(false);
  const [arrivalTime, setArrivalTime] = useState(8);
  const [routeInfo, setRouteInfo] = useState(null);
  const [cleanerLocation, setCleanerLocation] = useState(null);
  const [customerLocation, setCustomerLocation] = useState(null);
  const [isCleanerLocationLive, setIsCleanerLocationLive] = useState(false);
  const [showExtraTimeModal, setShowExtraTimeModal] = useState(false);
  const [extraTimeRequest, setExtraTimeRequest] = useState(null);
  const [processingRequest, setProcessingRequest] = useState(false);
  const [workProgress, setWorkProgress] = useState(null);
  const [occurrences, setOccurrences] = useState([]);
  const [weeklySchedule, setWeeklySchedule] = useState([]);
  const [avatarError, setAvatarError] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [tempPhone, setTempPhone] = useState('');
  const [showPhoneDisplayModal, setShowPhoneDisplayModal] = useState(false);
  const [phoneToDisplay, setPhoneToDisplay] = useState('');
  const [copied, setCopied] = useState(false);
  const scrollPositionRef = useRef(null);

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch customer progress data which includes job, cleaner, workProgress, and occurrences
        const progressResponse = await jobsAPI.getCustomerProgress(jobId);


        if (progressResponse.success && progressResponse.data) {
          const { job, cleaner, workProgress, occurrences, paymentSummary } = progressResponse.data;

          setJob({
            ...job,
            categoryName: job.categoryName || job.categoryId?.name || job.category || 'General Cleaning',
            displayLocation: job.location?.address ? `${job.location.address}${job.location.city ? `, ${job.location.city}` : ''}` : (job.address || 'Location not specified')
          });
          setCleaner(cleaner);
          setWorkProgress(workProgress);
          setOccurrences(occurrences);

          if (job.frequency === 'Weekly' && occurrences && occurrences.length > 0) {
            const schedule = generateWeeklySchedule(job, workProgress, occurrences);
            setWeeklySchedule(schedule);
          }

          if (job.status === 'completed') {
          }
          const coords = job.location?.coordinates;
          if (coords) {
            let lat, lng;
            if (typeof coords === 'string') {
              const coordsArr = coords.split(',').map(coord => parseFloat(coord.trim()));
              lat = coordsArr[1];
              lng = coordsArr[0];
            } else if (coords.lat && coords.lng) {
              lat = coords.lat;
              lng = coords.lng;
            } else if (Array.isArray(coords)) {
              lat = coords[1];
              lng = coords[0];
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

  // Socket connection and real-time location tracking
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

    // Listen for cleaner location updates
    const handleCleanerLocationUpdate = (data) => {

      const newCleanerLocation = {
        lat: data.latitude,
        lng: data.longitude
      };

      setCleanerLocation(newCleanerLocation);
      setIsCleanerLocationLive(true);
      // Calculate distance if customer location exists
      if (customerLocation) {
        const R = 6371e3;
        const φ1 = customerLocation.lat * Math.PI / 180;
        const φ2 = newCleanerLocation.lat * Math.PI / 180;
        const Δφ = (newCleanerLocation.lat - customerLocation.lat) * Math.PI / 180;
        const Δλ = (newCleanerLocation.lng - customerLocation.lng) * Math.PI / 180;
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      }
      if (routeInfo && routeInfo.duration) {
        const mins = parseInt(routeInfo.duration);
        if (!isNaN(mins)) {
          setArrivalTime(mins);
        }
      }
    };

    // Listen for extra time requests
    const handleExtraTimeRequest = (data) => {
      setExtraTimeRequest(data);
      setShowExtraTimeModal(true);
    };

    // Register event listeners
    socketService.on('cleanerLocationUpdate', handleCleanerLocationUpdate);
    socketService.on('extraTimeRequest', handleExtraTimeRequest);

    // Cleanup
    return () => {
      clearTimeout(connectionTimeout);
      socketService.off('cleanerLocationUpdate', handleCleanerLocationUpdate);
      socketService.off('extraTimeRequest', handleExtraTimeRequest);

      if (socketService.isConnected && jobId) {
        socketService.leaveJobRoom(jobId);
      }
    };
  }, [jobId, job, customerLocation]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showExtraTimeModal) {
      // Save current scroll position
      scrollPositionRef.current = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollPositionRef.current}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    } else {
      // Restore scroll position when modal closes
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      if (scrollPositionRef.current !== undefined) {
        window.scrollTo(0, scrollPositionRef.current);
      }
    }

    return () => {
      // Cleanup: restore scroll on unmount if modal was open
      if (showExtraTimeModal) {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        if (scrollPositionRef.current !== undefined) {
          window.scrollTo(0, scrollPositionRef.current);
        }
      }
    };
  }, [showExtraTimeModal]);

  // Update arrival time when route info changes
  useEffect(() => {
    if (routeInfo && routeInfo.durationValue) {
      const mins = Math.round(routeInfo.durationValue / 60);
      setArrivalTime(mins);
    }
  }, [routeInfo]);

  // For testing: Add test function to window object (remove in production)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      window.testExtraTimeModal = () => {
        setExtraTimeRequest({
          time: '1:00',
          amount: '40',
          reason: 'The kitchen requires deep cleaning and will take longer than expected.'
        });
        setShowExtraTimeModal(true);
      };
    }
    return () => {
      if (window.testExtraTimeModal) {
        delete window.testExtraTimeModal;
      }
    };
  }, []);

  const handleGetDirections = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!showMap) {
      setShowMap(true);
    } else {
      // Closing map - hide arrival status
      setShowMap(false);
      setShowArrivalStatus(false);
    }
  };

  const handleChatWithCleaner = () => {
    // Try multiple possible ID locations
    const cleanerId = cleaner?._id || cleaner?.id;

    if (cleanerId) {
      navigate(`/customer-chat/${jobId}?cleaner=${cleanerId}`);
    } else {
      console.error('Cleaner ID not available');
    }
  };

  const handleCallCleaner = () => {
    // Try multiple possible phone number locations
    const phoneNumber = cleaner?.phone ||
      cleaner?.phoneNumber ||
      cleaner?.mobile;

    if (phoneNumber) {
      setPhoneToDisplay(phoneNumber);
      setCopied(false);
      setShowPhoneDisplayModal(true);
    } else {
      console.error('Cleaner phone number not available');
      setTempPhone('');
      setShowPhoneModal(true);
    }
  };


  const getCleanerTier = () => {

    return cleaner?.tier || 'none';
  };

  const getCleanerRating = () => {
    return cleaner?.averageRating !== undefined ? cleaner.averageRating : (cleaner?.rating || 0);
  };

  const handleAcceptExtraTime = async () => {
    if (!extraTimeRequest) return;

    try {
      setProcessingRequest(true);

      await jobsAPI.acceptExtraTimeRequest(jobId, extraTimeRequest.requestId);

      setShowExtraTimeModal(false);
      setExtraTimeRequest(null);
      // Show success message
      alert('Extra time request accepted successfully!');
    } catch (error) {
      console.error('Error accepting extra time request:', error);
      alert('Failed to accept request. Please try again.');
    } finally {
      setProcessingRequest(false);
    }
  };

  const handleMarkSessionComplete = async (sessionId) => {
    try {
      // For customer side, this confirms completion and releases payment
      // The cleaner should have already uploaded photos and status should be pending_customer_confirmation

      // Update local state first for immediate UI feedback
      setWeeklySchedule(prev =>
        prev.map(item =>
          item.id === sessionId
            ? { ...item, status: 'completed', photos: item.photos || 2, amount: item.amount || 50 }
            : item
        )
      );

      // Call API to confirm weekly completion and release payment to cleaner
      await jobsAPI.confirmWeeklyCompletion(jobId, sessionId);

      // Show success message
      alert('Session confirmed! Payment has been released to cleaner.');
    } catch (error) {
      console.error('Error confirming weekly completion:', error);
      // Revert state on error
      setWeeklySchedule(prev =>
        prev.map(item =>
          item.id === sessionId
            ? { ...item, status: 'pending_customer_confirmation' }
            : item
        )
      );
      alert('Failed to confirm completion. Please try again.');
    }
  };

  const handleRejectExtraTime = async () => {
    if (!extraTimeRequest) return;

    try {
      setProcessingRequest(true);

      await jobsAPI.rejectExtraTimeRequest(jobId, extraTimeRequest.requestId);

      setShowExtraTimeModal(false);
      setExtraTimeRequest(null);
      // Show success message
      alert('Extra time request rejected.');
    } catch (error) {
      console.error('Error rejecting extra time request:', error);
      alert('Failed to reject request. Please try again.');
    } finally {
      setProcessingRequest(false);
    }
  };

  // Format time duration (e.g., "1:30" -> "1 Hour 30 Minutes" or "1 Hour")
  const formatTimeDuration = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;

    if (h === 1 && m === 0) return '1 Hour Extra';
    if (h > 1 && m === 0) return `${h} Hours Extra`;
    if (h === 0 && m > 0) return `${m} ${m === 1 ? 'Minute' : 'Minutes'} Extra`;
    if (h > 0 && m > 0) return `${h} ${h === 1 ? 'Hour' : 'Hours'} ${m} ${m === 1 ? 'Minute' : 'Minutes'} Extra`;
    return `${h} Hour${h !== 1 ? 's' : ''} Extra`;
  };

  const resolveImageSrc = (image) => {
    if (!image) return '';
    if (typeof image === 'string') return image;
    return image.url || image.path || image.secureUrl || '';
  };

  const jobPhotos = useMemo(() => {
    if (!job) return [];
    // Only show original job photos, not completion proof photos
    const photos = job.photos || [];
    return photos.map(resolveImageSrc).filter(Boolean);
  }, [job]);

  const getServiceDetail = (job) => {
    if (!job) return '';
    return (
      job.serviceDetail ||
      job.serviceDetailName ||
      job.service?.detail ||
      job.service?.name ||
      job.selectedServiceDetail ||
      ''
    );
  };

  const getJobFrequency = (job) => {
    if (!job) return 'One-time';
    return job.frequency || job.serviceFrequency || job.schedule?.frequency || 'One-time';
  };

  const getJobTitle = (job) => {
    if (!job) return 'Job Details';
    const serviceType = job.serviceType?.charAt(0).toUpperCase() + job.serviceType?.slice(1) || 'Service';
    return `${serviceType} `;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPreferredDaysDisplay = (preferredDays) => {
    if (!preferredDays || typeof preferredDays !== 'object') return '';

    const days = Object.keys(preferredDays).filter(day => preferredDays[day] === true);
    if (days.length === 0) return '';

    return days.join(', ');
  };

  const getRepeatWeeksDisplay = (repeatWeeks) => {
    if (!repeatWeeks) return '';
    return `${repeatWeeks} week${repeatWeeks === '1' ? '' : 's'}`;
  };

  const getFrequencyDisplay = (job) => {
    if (!job) return 'One-time';
    const frequency = job.frequency || job.serviceFrequency || job.schedule?.frequency || 'One-time';
    const preferredDays = getPreferredDaysDisplay(job?.preferredDays);
    const repeatWeeks = getRepeatWeeksDisplay(job?.repeatWeeks);

    let display = frequency;

    if (preferredDays && repeatWeeks) {
      display += ` • ${preferredDays} • ${repeatWeeks}`;
    } else if (preferredDays) {
      display += ` • ${preferredDays}`;
    } else if (repeatWeeks) {
      display += ` • ${repeatWeeks}`;
    }

    return display;
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === '') return '';
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return value;
    return `$${numeric.toLocaleString('en-AU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: numeric % 1 === 0 ? 0 : 2,
    })}`;
  };

  const serviceDetail = getServiceDetail(job);
  const scheduledDateLabel = job?.scheduledDate ? formatDate(job.scheduledDate) : 'Date not set';
  const jobFrequencyLabel = getFrequencyDisplay(job);

  const jobOverviewMeta = useMemo(() => {
    if (!job) return [];
    const meta = [];

    const budgetValue = job.budget || job.estimatedPrice || job.priceEstimate || job.priceRange;
    if (budgetValue) {
      meta.push({
        label: 'Budget',
        value: formatCurrency(budgetValue),
        icon: <Wallet className="w-4 h-4 text-primary-400" strokeWidth={2.2} />,
      });
    }

    const durationValue = job.estimatedDuration || job.duration || job.timeEstimate;
    if (durationValue) {
      meta.push({
        label: 'Duration',
        value: typeof durationValue === 'number' ? `${durationValue} hrs` : durationValue,
        icon: <Clock3 className="w-4 h-4 text-primary-400" strokeWidth={2.2} />,
      });
    }

    const propertyTypeValue = job.propertyType || job.propertyCategory;
    if (propertyTypeValue) {
      meta.push({
        label: 'Property Type',
        value: propertyTypeValue,
        icon: <HomeIcon className="w-4 h-4 text-primary-400" strokeWidth={2.2} />,
      });
    }

    const propertySizeValue = job.propertySize || job.squareFootage || job.propertyArea;
    if (propertySizeValue) {
      meta.push({
        label: 'Property Size',
        value: propertySizeValue,
        icon: <Ruler className="w-4 h-4 text-primary-400" strokeWidth={2.2} />,
      });
    }

    const priorityValue = job.priority || job.priorityLevel;
    if (priorityValue) {
      meta.push({
        label: 'Priority',
        value: priorityValue,
        icon: <AlertTriangle className="w-4 h-4 text-primary-400" strokeWidth={2.2} />,
      });
    }

    // Add preferred days if available
    const preferredDaysDisplay = getPreferredDaysDisplay(job?.preferredDays);
    if (preferredDaysDisplay) {
      meta.push({
        label: 'Preferred Days',
        value: preferredDaysDisplay,
        icon: <CalendarDays className="w-4 h-4 text-primary-400" strokeWidth={2.2} />,
      });
    }

    // Add repeat weeks if available
    const repeatWeeksDisplay = getRepeatWeeksDisplay(job?.repeatWeeks);
    if (repeatWeeksDisplay) {
      meta.push({
        label: 'Duration',
        value: repeatWeeksDisplay,
        icon: <Clock3 className="w-4 h-4 text-primary-400" strokeWidth={2.2} />,
      });
    }

    return meta;
  }, [job]);

  if (loading) {
    return <Loader fullscreen message="Updating your job details..." />;
  }

  if (error || !job) {
    return (
      <div className="bg-gray-50">
        <div className="max-w-sm mx-auto sm:max-w-2xl lg:max-w-4xl xl:max-w-6xl p-4">
          <div className="bg-white rounded-2xl p-6 text-center">
            <p className="text-red-500">{error || 'Job not found'}</p>
            <Button
              onClick={() => {
                const savedTab = localStorage.getItem('customerActiveTab');
                navigate('/my-jobs', { state: { tab: savedTab || 'all' }, replace: true });
              }}
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

  // Find accepted quote for this job
  const acceptedQuote = job.quotes?.find(quote => quote.status === 'accepted');

  return (
    <div className="bg-gray-50 min-h-screen pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4">
        <PageHeader
          title={job.jobId ? ` ${job.categoryName}` : getJobTitle(job)}
          onBack={() => {
            if (location.state?.from === 'dashboard') {
              navigate('/customer-dashboard');
            } else {
              const savedTab = localStorage.getItem('customerActiveTab');
              navigate('/my-jobs', { state: { tab: savedTab || 'all' }, replace: true });
            }
          }}
          titleClassName="text-lg font-semibold text-primary-500 truncate"
        />

        <div>
          {/* Cleaner Info Card (Top) */}
          <div className="mb-6 mt-4">
            {cleaner ? (
              <div className="bg-white rounded-2xl p-4 shadow-custom border border-[#F3F3F3]">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 border border-gray-100">
                      {cleaner.profilePhoto?.url && !avatarError ? (
                        <img
                          src={cleaner.profilePhoto.url}
                          alt="Cleaner"
                          className="w-full h-full object-cover"
                          onError={() => setAvatarError(true)}
                        />
                      ) : (
                        <div className="w-full h-full bg-primary-500 flex items-center justify-center text-white text-xl font-bold uppercase">
                          {cleaner.firstName ? cleaner.firstName.charAt(0).toUpperCase() : 'C'}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-1 flex-1">
                      <h4 className="font-semibold text-gray-900 text-lg leading-tight capitalize">{cleaner.firstName} {cleaner.lastName}</h4>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center text-sm text-gray-500 text-[13px]">
                          <img src={PhoneIcon2} alt="Phone" className="w-3.5 h-3.5 mr-1.5 opacity-60" />
                          {cleaner.phone || cleaner.phoneNumber || cleaner.mobile || 'Phone not available'}
                        </div>
                        {cleaner.email && (
                          <div className="flex items-center text-sm text-gray-500 text-[13px]">
                            <Mail className="w-3.5 h-3.5 mr-1.5 opacity-60" />
                            {cleaner.email}
                          </div>
                        )}
                      </div>
                      <div className="text-[12px] text-gray-400 font-medium !mt-1">
                        {routeInfo ? `${routeInfo.distance} away — En route` : '2.4 km away — En route'}
                      </div>

                      {/* Tier Badge inside the info section */}
                      {getCleanerTier() && getCleanerTier().toLowerCase() !== 'none' && (
                        <div className={`inline-flex items-center font-semibold px-2 py-1 mt-1 rounded-lg text-[11px] border-[0.6px] self-start ${getCleanerTier().toLowerCase() === 'gold'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : getCleanerTier().toLowerCase() === 'silver'
                            ? 'bg-gray-100 text-gray-700 border-gray-300'
                            : 'bg-orange-50 text-orange-700 border-orange-200'
                          }`}>
                          <img
                            src={
                              getCleanerTier() === 'gold'
                                ? GoldBadgeIcon
                                : getCleanerTier() === 'silver'
                                  ? SilverBadgeIcon
                                  : BronzeBadgeIcon
                            }
                            alt="Badge"
                            className="w-3.5 h-3.5 mr-1.5"
                          />
                          <span className="capitalize">{getCleanerTier()} Tier</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Chip (Top Right on Desktop, Stacked on Mobile) */}
                  <div className="flex sm:flex-col sm:items-end justify-between sm:self-stretch mt-1 sm:mt-0">
                    <span className="text-[10px] font-bold px-2.5 py-1.5 rounded-full bg-[#FFEBCA] text-[#FF8800] border border-[#FFEBCA] inline-block self-start sm:self-auto">
                      In Progress
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  {/* Actions (Bottom Right) */}
                  <div className="flex items-center gap-2">

                    <button
                      type="button"
                      onClick={handleChatWithCleaner}
                      className="w-10 h-10 rounded-xl flex items-center justify-center border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <img src={ChatIcon} alt="Chat" className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleCallCleaner}
                      className="w-10 h-10 rounded-xl flex items-center justify-center border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <PhoneIcon className="w-5 h-5 text-[#2563EB]" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-6 shadow-sm flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Job Details Section */}
          <div className="mb-6 space-y-4">
            <div>
              <div className="text-[11px] font-semibold text-[#6B7280] tracking-widest mb-1">
                {job.categoryName || 'Domestic / General Cleaning'}
              </div>
              <h1 className="text-2xl font-semibold text-gray-900 leading-tight">
                {job.title || job.serviceTypeDisplay || 'Service Name'}
              </h1>
            </div>

            <p className="text-sm text-gray-500 leading-relaxed font-medium">
              {job.specialInstructions || job.instructions || job.additionalNotes || 'Make sure you come prepared with all the equipment you’ll need so we can get everything done smoothly.'}
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center text-sm font-semibold text-[#6B7280]">
                <Calendar className="w-4 h-4 mr-3 opacity-60" />
                {scheduledDateLabel} • {jobFrequencyLabel}
              </div>
              <div className="flex items-start text-sm font-semibold text-[#6B7280]">
                <MapPinIcon className="w-4 h-4 mr-3 opacity-60" />
                <span>{job.displayLocation}</span>
              </div>
            </div>

            {(job.roomsNeedCleaning || job.bathroomsNeedCleaning) && (
              <div className="flex flex-wrap gap-2 pt-2">
                {job.roomsNeedCleaning && (
                  <div className="inline-flex items-center gap-1.5 bg-[#F3F4F6] border border-[#E5E7EB] px-3 py-1.5 rounded-full text-xs font-semibold text-gray-700">
                    <span className="text-[#1A73E8]">🛏️</span> {job.roomsNeedCleaning} Room{job.roomsNeedCleaning !== '1' ? 's' : ''}
                  </div>
                )}
                {job.bathroomsNeedCleaning && (
                  <div className="inline-flex items-center gap-1.5 bg-[#F3F4F6] border border-[#E5E7EB] px-3 py-1.5 rounded-full text-xs font-semibold text-gray-700">
                    <span className="text-[#1A73E8]">🚿</span> {job.bathroomsNeedCleaning} Bathroom{job.bathroomsNeedCleaning !== '1' ? 's' : ''}
                  </div>
                )}
              </div>
            )}

            {/* Photo Grid */}
            {jobPhotos.length > 0 && (
              <div className="grid grid-cols-2 gap-3 pt-4 max-w-sm">
                {jobPhotos.slice(0, 4).map((photo, index) => (
                  <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                    <img src={photo} alt={`Job ${index}`} className="w-full h-full object-cover transition-transform hover:scale-105" />
                    {index === 3 && jobPhotos.length > 4 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-xl backdrop-blur-[2px]">
                        +{jobPhotos.length - 3}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>


          {/* Work Progress Section (Keep for Weekly) */}
          {weeklySchedule.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Work Progress</h3>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50">
                <div className="space-y-3">
                  {weeklySchedule.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
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
                          <div className="font-semibold text-gray-800 text-sm">
                            {item.day} - Week {item.week}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.date.toLocaleDateString('en-AU', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right mr-1">
                          <div className="text-sm font-bold text-gray-900">
                            ${item.amount}
                          </div>
                        </div>
                        {item.status === 'completed' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-100">
                            Completed
                          </span>
                        )}
                        {item.status === 'pending_customer_confirmation' && (
                          <button
                            onClick={() => handleMarkSessionComplete(item.id)}
                            className="text-[10px] font-bold px-3 py-1 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition-colors cursor-pointer"
                          >
                            Confirm
                          </button>
                        )}
                        {item.status === 'in-progress' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                            In Progress
                          </span>
                        )}
                        {item.status === 'pending' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tracking Section (Bottom) */}
          <div className="space-y-4 mb-8">
            {/* Arrival Status Card */}
            {showArrivalStatus && (
              <div className="bg-white rounded-2xl p-4 shadow-custom border border-[#F3F3F3]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center overflow-hidden">
                    <div className="min-w-[24px] h-6 bg-green-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      <Check className="w-4 h-4 text-white" strokeWidth={3} />
                    </div>
                    <div className="truncate">
                      <div className="text-green-600 font-bold text-[11px] tracking-wider">ARRIVING</div>
                      <div className="text-lg font-bold text-gray-900 truncate">
                        Arriving in {routeInfo ? routeInfo.duration : `${arrivalTime} mins`}
                      </div>
                      <div className="text-sm text-gray-400 font-medium truncate">
                        {cleaner?.firstName} is {routeInfo ? `${routeInfo.distance} away` : 'reaching your doorstep shortly'}
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#22C55E] text-white rounded-xl min-w-[56px] h-16 flex items-center justify-center flex-shrink-0">
                    <div className="text-center">
                      <div className="text-xl font-bold leading-none mb-0.5">
                        {routeInfo ? Math.round(routeInfo.durationValue / 60) : arrivalTime}
                      </div>
                      <div className="text-[10px] font-bold">mins</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Map Section */}
            <div className="bg-white rounded-2xl p-4 shadow-custom border border-[#F3F3F3]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Track Cleaner</h3>
                <div className="text-[12px] text-gray-400 font-medium">
                  {cleaner?.firstName} is {routeInfo ? `${routeInfo.distance} away, arriving in ${routeInfo.duration}` : `arriving in ${arrivalTime} mins`}
                </div>
              </div>
              <div className="rounded-xl overflow-hidden h-[240px] border border-gray-100 mb-2">
                <MapWithPolyline
                  customerLocation={customerLocation}
                  cleanerLocation={cleanerLocation}
                  onRouteInfo={(info) => {
                    setRouteInfo(info);
                    if (info && info.durationValue) {
                      const mins = Math.round(info.durationValue / 60);
                      setArrivalTime(mins);
                    }
                    if (info) {
                      setShowArrivalStatus(true);
                    }
                  }}
                />
              </div>
              {!showArrivalStatus && (
                <div className="bg-[#F8FAFC] rounded-xl p-4 mt-4">
                  <h4 className="font-medium text-gray-900">Arrived at your location</h4>
                  <p className="text-sm text-gray-500 font-normal">{cleaner?.firstName} is reaching your doorstep shortly</p>
                </div>
              )}
            </div>
          </div>



        </div>
      </div>

      {/* Extra Time Request Modal */}
      {showExtraTimeModal && extraTimeRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Extra Hours Requested</h2>

            <p className="text-sm text-gray-600 mb-6">
              Your cleaner has requested <strong>{formatTimeDuration(extraTimeRequest.time || extraTimeRequest.extraTime)}</strong> for this job after reviewing the scope of work.
            </p>

            <div className="space-y-4 mb-6">
              {/* Reason */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">Reason</h3>
                <p className="text-sm text-primary-200 font-medium" >
                  {extraTimeRequest.reason || extraTimeRequest.extraReason || 'No reason provided'}
                </p>
              </div>

              {/* Time Duration */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">Time Duration</h3>
                <p className="text-sm text-primary-200 font-medium" >
                  {formatTimeDuration(extraTimeRequest.time || extraTimeRequest.extraTime)}
                </p>
              </div>

              {/* Payment Update */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">Payment Update</h3>
                <p className="text-sm text-primary-200 font-medium" >
                  ${extraTimeRequest.amount || extraTimeRequest.extraAmount || '0'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleRejectExtraTime}
                variant="secondary"
                disabled={processingRequest}
                className="flex-1 border border-blue-500 text-blue-500 bg-white hover:bg-gray-50"
              >
                Reject
              </Button>
              <Button
                onClick={handleAcceptExtraTime}
                variant="primary"
                disabled={processingRequest}
                className="flex-1"
              >
                {processingRequest ? 'Processing...' : 'Accept'}
              </Button>
            </div>
          </div>
        </div>
      )}

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
        message="The service provider has not provided a contact phone number. You can enter a temporary number here to call directly, or choose to chat with them."
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
        title="Cleaner Contact Info"
        message="Choose how you want to connect with the service provider:"
        confirmText={copied ? "Copied!" : "Copy Number"}
        cancelText="Close"
        confirmButtonColor="bg-blue-600 hover:bg-blue-700"
      >
        <div className="mt-4 mb-4 text-center">
          <a
            href={`tel:${phoneToDisplay}`}
            className="inline-flex items-center gap-2 px-5 py-3.5 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-2xl shadow-inner font-medium text-lg text-blue-600 tracking-wide transition-all cursor-pointer"
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
    </div>
  );
};

export default CustomerInProgressJobDetailsPage;

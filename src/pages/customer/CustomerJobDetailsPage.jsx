import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Wallet,
  Clock3,
  Home as HomeIcon,
  Ruler,
  AlertTriangle,
  CalendarDays,
  Phone,
  MapPin,
} from 'lucide-react';

import { Button, ConfirmationModal, PageHeader, JobOverviewCard } from '../../components';
import ThreeDotIcon from '../../assets/3dot.svg';
import UserIcon from '../../assets/user.svg';
import RatingIcon from '../../assets/rating.svg';
import SilverBadgeIcon from '../../assets/silverBadge.svg';
import GoldBadgeIcon from '../../assets/goldBadge.svg';
import BronzeBadgeIcon from '../../assets/bronzeBadge.svg';

import CloseIcon from '../../assets/close.svg';
import { jobsAPI, quotesAPI } from '../../services/api';
import { chatAPI } from '../../services/chatAPI';

const CleanerAvatar = ({ src, name, className = "w-16 h-16" }) => {
  const [hasError, setHasError] = useState(false);
  const initials = name ? name.trim().charAt(0).toUpperCase() : 'C';

  return (
    <div className={`${className} rounded-full overflow-hidden flex-shrink-0 border border-gray-100`}>
      {src && !hasError ? (
        <img 
          src={src} 
          alt={name} 
          className="w-full h-full object-cover" 
          onError={() => setHasError(true)} 
        />
      ) : (
        <div className="w-full h-full bg-primary-500 flex items-center justify-center text-white text-xl font-bold uppercase">
          <span>{initials}</span>
        </div>
      )}
    </div>
  );
};

const CustomerJobDetailsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [quoteToConnect, setQuoteToConnect] = useState(null);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [quoteToDecline, setQuoteToDecline] = useState(null);
  const [cleanerQuotes, setCleanerQuotes] = useState([]);
  const [waitlistedCleaners, setWaitlistedCleaners] = useState([]);
  const [chatRooms, setChatRooms] = useState([]);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await jobsAPI.getJobById(jobId);

        if (response.success && response.data) {
          setJob(response.data);
          setCleanerQuotes(response.data.contactedCleaners || []);
          setWaitlistedCleaners(response.data.waitlistedCleaners || []);
        } else {
          setError('Job not found');
        }
      } catch (err) {
        setError('Failed to load job details');
      } finally {
        setLoading(false);
      }
    };

    const fetchChatRooms = async () => {
      try {
        const chatResponse = await chatAPI.getChatRooms();
        if (chatResponse.success) {
          const jobChatRooms = chatResponse.data.filter(room =>
            room.jobId._id === jobId || room.jobId === jobId
          );
          setChatRooms(jobChatRooms);
        }
      } catch (err) {
      }
    };

    if (jobId) {
      fetchJobDetails();
      fetchChatRooms();
    }
  }, [jobId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getJobTitle = (job) => {
    if (!job) return 'Job Details';
    const serviceType = job.serviceType?.charAt(0).toUpperCase() + job.serviceType?.slice(1) || 'Service';
    return `${serviceType} `;
  };

  const getServiceDetail = (job) => {
    if (!job) return '';
    return (
      job.serviceTypeId?.name ||
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

  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === '') return '';
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return value;
    return `$${numeric.toLocaleString('en-AU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: numeric % 1 === 0 ? 0 : 2,
    })}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
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
    const frequency = getJobFrequency(job);
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

  const handleDropdownToggle = () => {
    setShowDropdown(!showDropdown);
  };

  const handleCancelJob = () => {
    setShowDropdown(false);
    setShowCancelModal(true);
  };

  const handleConnect = (cleanerId) => {
    const item = cleanerQuotes.find(q => (q.cleanerId?._id || q.cleanerId) === cleanerId) ||
      waitlistedCleaners.find(q => (q.cleanerId?._id || q.cleanerId) === cleanerId);
    if (item) {
      setQuoteToConnect(item);
      setShowConnectModal(true);
    }
  };

  const handleAcceptQuote = (cleanerId) => {
    const item = cleanerQuotes.find(q => (q.cleanerId?._id || q.cleanerId) === cleanerId) ||
      waitlistedCleaners.find(q => (q.cleanerId?._id || q.cleanerId) === cleanerId);
    if (item) {
      setQuoteToConnect(item);
      setShowConnectModal(true);
    }
  };

  const handleDeclineQuote = (cleanerId) => {
    const item = cleanerQuotes.find(q => (q.cleanerId?._id || q.cleanerId) === cleanerId);
    if (item) {
      setQuoteToDecline(item);
      setShowDeclineModal(true);
    }
  };

  const handleConfirmConnect = async () => {
    if (!quoteToConnect) return;
    const cleanerId = quoteToConnect.cleanerId?._id || quoteToConnect.cleanerId || quoteToConnect.id;

    try {
      setIsConnecting(true);
      setActionError('');
      // Connect with cleaner via job endpoint
      const response = await jobsAPI.connectCleaner(jobId, cleanerId);

      // If success OR if already connected, we can proceed to chat
      if (response.success || response.error === 'Already connected with this cleaner') {
        setShowConnectModal(false);
        navigate(`/customer-chat/${jobId}?cleaner=${cleanerId}`);
      } else {
        setActionError(response.message || response.error || 'Failed to connect with cleaner');
      }
    } catch (err) {
      // Check if error message indicates already connected
      if (err.message && err.message.includes('Already connected')) {
        setShowConnectModal(false);
        navigate(`/customer-chat/${jobId}?cleaner=${cleanerId}`);
      } else {
        setActionError(err.message || 'Failed to connect. Please try again.');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConfirmAcceptQuote = async () => {
    if (!quoteToConnect) return;
    const cleanerId = quoteToConnect.cleanerId?._id || quoteToConnect.cleanerId || quoteToConnect.id;

    try {
      setIsConnecting(true);
      setActionError('');

      const response = await jobsAPI.assignCleaner(jobId, cleanerId);

      if (response.success) {
        setShowConnectModal(false);
        navigate(`/booking-confirmation/${jobId}?cleaner=${cleanerId}`);
      } else {
        setActionError(response.message || response.error || 'Failed to assign cleaner');
      }
    } catch (err) {
      setActionError(err.message || 'Failed to assign cleaner. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCancelConnect = () => {
    setShowConnectModal(false);
    setQuoteToConnect(null);
    setActionError('');
  };

  const handleCancelAcceptQuote = () => {
    setShowConnectModal(false);
    setQuoteToConnect(null);
    setActionError('');
  };

  const handleConfirmDeclineQuote = async () => {
    if (!quoteToDecline) return;

    try {
      setIsDeclining(true);

      // Call API to reject cleaner
      const cleanerId = quoteToDecline.cleanerId?._id || quoteToDecline.cleanerId || quoteToDecline.id;
      const response = await quotesAPI.rejectQuote(jobId, cleanerId);

      if (response.success) {
        // Update the quote status locally
        const updatedQuotes = cleanerQuotes.map(quote =>
          quote._id === quoteToDecline._id
            ? { ...quote, status: 'rejected' }
            : quote
        );
        setCleanerQuotes(updatedQuotes);

        // Close modal
        setShowDeclineModal(false);
        setQuoteToDecline(null);
      } else {
        setError(response.error || 'Failed to decline quote');
        setShowDeclineModal(false);
      }
    } catch (err) {
      setError('Failed to decline quote. Please try again.');
      setShowDeclineModal(false);
    } finally {
      setIsDeclining(false);
    }
  };

  const handleCancelDeclineQuote = () => {
    setShowDeclineModal(false);
    setQuoteToDecline(null);
  };

  const handleConfirmCancel = async () => {
    try {
      setIsCancelling(true);

      const response = await jobsAPI.cancelJob(jobId);

      if (response.success) {
        navigate('/my-jobs');
      } else {
        setError('Failed to cancel job. Please try again.');
        setShowCancelModal(false);
      }
    } catch (error) {
      setError('Failed to cancel job. Please try again.');
      setShowCancelModal(false);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCancelModalClose = () => {
    setShowCancelModal(false);
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
  }, [job, getPreferredDaysDisplay, getRepeatWeeksDisplay]);

  const roleSections = useMemo(() => {
    if (!job) return {};

    const getPersonName = (person) => {
      if (!person) return '';
      const { firstName, lastName, name, fullName } = person;
      const combined = `${firstName || ''} ${lastName || ''}`.trim();
      return combined || fullName || name || '';
    };

    const getPersonPhone = (person) => {
      if (!person) return '';
      return (
        person.phone ||
        person.phoneNumber ||
        person.mobile ||
        person.contactNumber ||
        ''
      );
    };

    const assignedCleaner =
      job.assignedCleaner ||
      job.cleaner ||
      job.acceptedCleaner ||
      job.assignedCleanerInfo ||
      job.assignedTo ||
      job.assignedCleanerId;

    const assignedCleanerName =
      typeof assignedCleaner === 'string'
        ? assignedCleaner
        : getPersonName(assignedCleaner);

    const assignedCleanerPhone =
      typeof assignedCleaner === 'string' ? '' : getPersonPhone(assignedCleaner);

    const assignedCleanerRating =
      typeof assignedCleaner === 'object'
        ? assignedCleaner?.averageRating || assignedCleaner?.rating
        : '';

    const customer =
      job.customer ||
      job.customerId ||
      job.postedBy ||
      job.createdBy;

    const customerName = getPersonName(customer);
    const customerPhone = getPersonPhone(customer);

    const sections = {};

    const customerItems = [
      assignedCleanerName
        ? { label: 'Assigned Cleaner', value: assignedCleanerName }
        : null,
      assignedCleanerPhone
        ? { label: 'Cleaner Contact', value: assignedCleanerPhone }
        : null,
      assignedCleanerRating
        ? { label: 'Cleaner Rating', value: `${assignedCleanerRating}⭐` }
        : null,
      job.specialInstructions
        ? { label: 'Special Instructions', value: job.specialInstructions }
        : null,
    ].filter(Boolean);

    if (customerItems.length > 0) {
      sections.customer = customerItems;
    }

    const cleanerItems = [
      customerName
        ? { label: 'Customer', value: customerName }
        : null,
      customerPhone
        ? { label: 'Customer Contact', value: customerPhone }
        : null,
      job.accessInstructions
        ? { label: 'Access Notes', value: job.accessInstructions }
        : null,
      job.petDetails
        ? { label: 'Pet Details', value: job.petDetails }
        : null,
    ].filter(Boolean);

    if (cleanerItems.length > 0) {
      sections.cleaner = cleanerItems;
    }

    return sections;
  }, [job]);

  // Helper function to check if customer has chatted with a cleaner
  const getChatRoomForCleaner = (cleanerId) => {
    return chatRooms.find(room =>
      room.cleanerId._id === cleanerId || room.cleanerId === cleanerId
    );
  };

  // Helper function to get chat status for a cleaner
  const getChatStatus = (cleanerId) => {
    const chatRoom = getChatRoomForCleaner(cleanerId);
    if (chatRoom) {
      if (chatRoom.lastMessageAt) {
        const lastMessageDate = new Date(chatRoom.lastMessageAt);
        const timeAgo = getTimeAgo(lastMessageDate);
        return {
          hasChat: true,
          lastMessage: timeAgo,
          unreadCount: chatRoom.unreadCount || 0
        };
      }
      return { hasChat: true, lastMessage: 'No messages yet', unreadCount: 0 };
    }
    return { hasChat: false, lastMessage: null, unreadCount: 0 };
  };

  // Helper function to format time ago
  const getTimeAgo = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  // Helper function to format cleaner data from contactedCleaners
  const formatCleanerData = (item) => {
    const cleaner = item.cleaner;
    const cleanerId = item.cleanerId?._id || item.cleanerId || cleaner?._id || cleaner?.id;

    const distance = item.distance || cleaner?.distance;

    return {
      id: cleanerId,
      name: cleaner ? `${cleaner.firstName || ''} ${cleaner.lastName || ''}`.trim() : 'Cleaner',
      phone: cleaner?.phone || '',
      photo: resolveImageSrc(cleaner?.profilePhoto || cleaner?.profileImage),
      rating: cleaner?.averageRating !== undefined ? cleaner.averageRating : (cleaner?.rating || 0),
      reviews: cleaner?.totalReviews || cleaner?.reviewCount || 0,
      tier: (cleaner?.tier || 'none').toLowerCase(),
      isVerified: cleaner?.isVerified || false,
      isConnected: item.isConnected || false,
      chatRoomId: item.chatRoomId,
      distance: distance ? `${distance} km away` : 'Distance unknown',
      message: item.introMessage || 'Hi, I can do this job. I have experience in cleaning.',
      isWaitlisted: item.isWaitlisted || false,
    };
  };


  if (loading) {
    return (
      <>
        <div className="max-w-sm mx-auto min-h-screen sm:max-w-2xl lg:max-w-4xl xl:max-w-6xl">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error || !job) {
    return (
      <>
        <div className="max-w-sm mx-auto min-h-screen sm:max-w-2xl lg:max-w-4xl xl:max-w-6xl">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="text-center py-8">
              <div className="text-red-500 text-lg font-medium">{error || 'Job not found'}</div>
              <Button
                onClick={() => {
                  const savedTab = localStorage.getItem('customerActiveTab');
                  navigate('/my-jobs', { state: { tab: savedTab || 'all' }, replace: true });
                }}
                size="md"
                className="mt-4"
              >
                Go Back
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto py-3  px-3 sm:px-8">
        <PageHeader
          title={serviceDetail || `Job Details - ${job.serviceType || 'Cleaning'}`}
          onBack={() => {
            if (location.state?.from === 'dashboard') {
              navigate('/customer-dashboard');
            } else {
              const savedTab = localStorage.getItem('customerActiveTab');
              navigate('/my-jobs', { state: { tab: savedTab || 'all' }, replace: true });
            }
          }}
          backButtonClassName="cursor-pointer"
          rightSlot={
            <div className="relative" ref={dropdownRef}>
              <Button
                onClick={handleDropdownToggle}
                variant=""
                size="sm"
                icon={ThreeDotIcon}
                className="p-1 sm:p-2"
              />

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-10">
                  <div className="py-1">
                    <Button
                      onClick={handleCancelJob}
                      variant=""
                      size="sm"
                      icon={CloseIcon}
                      className="w-full justify-start "
                    >
                      Cancel Job
                    </Button>
                  </div>
                </div>
              )}
            </div>
          }
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          {/* Status Badge */}
          <div className="mb-4">
            <div className="inline-flex items-center gap-1.5 bg-[#DDEFFF] px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 bg-[#0088FF] rounded-full"></div>
              <span className="text-xs font-medium text-[#0088FF]">
                {cleanerQuotes.length} Quotes Received
              </span>
            </div>
          </div>

          {/* Job Header */}
          <div className="mb-6">
            <p className="text-md font-medium text-gray-500 mb-1 leading-tight">
              {job.categoryId?.name || 'Cleaning'}
            </p>
            <h1 className="text-lg font-medium text-[#111827] mb-2 leading-tight">
              {serviceDetail || job.title}
            </h1>
            <p className="text-sm font-medium text-gray-500 leading-relaxed mb-3">
              {job.instructions || 'No description provided.'}
            </p>

            {/* Meta Info */}
            <div className="flex flex-col gap-3 mb-6">
              <div className="flex items-center text-[#6B7280] font-medium">
                <CalendarDays className="w-5 h-5 mr-3 text-[#111827]" strokeWidth={1.5} />
                <span className="text-sm">{scheduledDateLabel}</span>
              </div>
              <div className="flex items-start text-[#6B7280] font-medium">
                <MapPin className="w-5 h-5 mr-3 mt-0.5 text-[#111827] flex-shrink-0" strokeWidth={1.5} />
                <span className="text-sm leading-snug">{job.location?.address || job.address || 'Location not specified'}</span>
              </div>
            </div>

            {(job.roomsNeedCleaning || job.bathroomsNeedCleaning) && (
              <div className="flex flex-wrap gap-2 mb-4">
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
          </div>

          {/* Photo Grid */}
          {jobPhotos.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mb-8 max-w-md">
              {jobPhotos.slice(0, 4).map((photo, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group">
                  <img
                    src={photo}
                    alt={`Job ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {index === 3 && jobPhotos.length > 4 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white text-xl font-bold">+{jobPhotos.length - 3}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Custom Job Dates Section */}


        {/* Service Provider Quotes Section */}
        <div className="py-4">
          <div className="mb-6">
            <h3 className="text-lg  font-medium text-gray-900">
              Cleaner Quotes <span className="font-medium">({cleanerQuotes.length})</span>
            </h3>
            <p className="text-sm text-gray-500 font-medium leading-relaxed">
              Cleaners nearby have sent their offers. Review and chat before choosing.
            </p>
          </div>

          {cleanerQuotes.length > 0 && (
            <div className="space-y-6">
              {cleanerQuotes.map((item, index) => {
                const cleaner = formatCleanerData(item);

                return (
                  <div key={item._id || item.id || `contacted-${index}`} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                    {/* Header: Avatar, Info, and Tier */}
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex gap-4">
                        <CleanerAvatar src={cleaner.photo} name={cleaner.name} className="w-16 h-16" />
                        <div>
                          <h4 className="text-lg font-medium text-gray-900 mb-1 capitalize">
                            {cleaner.name}
                          </h4>

                          <div className="flex flex-col gap-1">
                            <div className="flex items-center">
                              <Phone className="w-3.5 h-3.5 mr-2" strokeWidth={2} />
                              <span className="text-sm font-medium text-gray-500">{cleaner.phone || '07 3803 6136'}</span>
                            </div>
                            <p className="text-xs text-gray-500 font-medium">
                              {cleaner.distance} — En root
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Tier Badge */}
                      {cleaner.tier && cleaner.tier !== 'none' && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100">
                          <img
                            src={
                              cleaner.tier === 'gold'
                                ? GoldBadgeIcon
                                : cleaner.tier === 'silver'
                                  ? SilverBadgeIcon
                                  : BronzeBadgeIcon
                            }
                            alt="Badge"
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-gray-700 font-bold capitalize">
                            {cleaner.tier} Tier
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Message Bubble */}
                    <div className="bg-[#EBF2FD] rounded-2xl p-5 mb-4 inline-block">
                      <p className="text-gray-900 text-sm font-medium leading-relaxed">
                        {/* Hello,<br /> */}
                        {cleaner.message}
                      </p>
                    </div>

                    {/* Footer Action Button */}
                    <div className="flex justify-end border-t border-gray-100 pt-4">
                      <Button
                        onClick={() => {
                          if (cleaner.isConnected) {
                            navigate(`/customer-chat/${jobId}?cleaner=${cleaner.id}`);
                          } else {
                            handleAcceptQuote(cleaner.id);
                          }
                        }}
                        variant=""
                        className="py-3 text-base font-semibold rounded-full border border-[#DCE4FF] bg-white text-[#1F6FEB] hover:bg-[#1F6FEB] hover:text-white transition-all cursor-pointer"
                      >
                        {cleaner.isConnected ? 'Message' : 'Connect & Message'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Waitlisted Section */}
          {waitlistedCleaners.length > 0 && (
            <div className="mt-8">
              <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Waitlisted Cleaners</h4>
              <div className="space-y-4">
                {waitlistedCleaners.map((item, index) => {
                  const cleaner = formatCleanerData(item);

                  return (
                    <div key={`waitlisted-${index}`} className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm opacity-95">
                      {/* Upper Header: Avatar, Name, Phone, and Tier Badge */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex gap-3 sm:gap-4">
                          <CleanerAvatar src={cleaner.photo} name={cleaner.name} className="w-10 h-10 sm:w-14 sm:h-14" />
                          <div className="pt-0.5 sm:pt-1">
                            <h4 className="text-[18px] sm:text-lg font-semibold text-primary-500 mb-1">
                              {cleaner.name}
                            </h4>
                            <div className="flex items-center gap-1.5 text-[#374151] mb-1">
                              <div className="flex items-center gap-1">
                                <img src={RatingIcon} alt="Rating" className="w-3.5 h-3.5" />
                                <span className="text-sm font-semibold">{cleaner.rating}</span>
                                <span className="text-xs text-gray-400">({cleaner.reviews} reviews)</span>
                              </div>
                            </div>
                            <div className="text-xs sm:text-sm text-gray-400 font-normal">
                              {cleaner.distance}
                            </div>
                          </div>
                        </div>

                        {/* Tier Badge Pill */}
                        {cleaner.tier && cleaner.tier !== 'none' && (
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-100 bg-gray-50/50 shadow-sm`}>
                            <img
                              src={
                                cleaner.tier === 'gold'
                                  ? GoldBadgeIcon
                                  : cleaner.tier === 'silver'
                                    ? SilverBadgeIcon
                                    : BronzeBadgeIcon
                              }
                              alt="Badge"
                              className="w-4 h-4 sm:w-5 sm:h-5"
                            />
                            <span className="text-xs sm:text-sm text-[#374151] font-semibold capitalize whitespace-nowrap">
                              {cleaner.tier} Tier
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Intro Message Bubble */}
                      <div className="bg-[#F8FAFC] rounded-[20px] p-4 mb-4 border border-blue-50/50">
                        <p className="text-gray-500 text-sm font-medium leading-[1.45] italic">
                          "I'm on the waitlist for this job. Connect with me to discuss how I can help!"
                        </p>
                      </div>

                      {/* Footer Action Button */}
                      <div className="flex justify-end">
                        <Button
                          onClick={() => handleAcceptQuote(cleaner.id)}
                          variant=""
                          className="px-8 py-2.5 text-sm sm:text-md font-bold rounded-full border border-[#DCE4FF] bg-white text-[#1F6FEB] hover:bg-[#1F6FEB] hover:text-white hover:border-[#1F6FEB] shadow-sm transition-all cursor-pointer"
                        >
                          Connect & Message
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {cleanerQuotes.filter(quote => quote.status !== 'rejected').length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-500 text-sm">
                {job.serviceType === 'petSitting' ? "Waiting for pet sitters to send quotes..." :
                  job.serviceType === 'cleaning' ? "Waiting for cleaners to send quotes..." :
                    job.serviceType === 'handyman' ? "Waiting for handymen to send quotes..." :
                      job.serviceType === 'housekeeping' ? "Waiting for housekeepers to send quotes..." :
                        job.serviceType === 'commercialCleaning' ? "Waiting for commercial cleaners to send quotes..." :
                          job.serviceType === 'ndisSupport' ? "Waiting for NDIS support providers to send quotes..." :
                            "Waiting for service providers to send quotes..."}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Job Confirmation Modal */}
      <ConfirmationModal
        isOpen={showCancelModal}
        onClose={handleCancelModalClose}
        onConfirm={handleConfirmCancel}
        title="Cancel Job?"
        message="Are you sure you want to cancel this job? This action cannot be undone and all cleaner quotes will be lost."
        confirmText="Cancel Job"
        cancelText="Keep Job"
        confirmButtonColor="bg-[#EF4444] hover:bg-red-600"
        isLoading={isCancelling}
      />

      {/* Connect Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConnectModal}
        onClose={handleCancelConnect}
        onConfirm={handleConfirmConnect}
        title={
          quoteToConnect
            ? `Connect with ${quoteToConnect.cleaner?.firstName || quoteToConnect.cleanerId?.firstName || 'Cleaner'}?`
            : "Connect with Cleaner?"
        }
        message={
          quoteToConnect ?
            `We'll notify ${quoteToConnect.cleaner?.firstName || quoteToConnect.cleanerId?.firstName || 'the cleaner'} that you want to connect about the job.` :
            "We'll notify the cleaner that you want to connect about the job."
        }
        confirmText="Connect"
        cancelText="Not Now"
        confirmButtonColor="bg-blue-600 hover:bg-blue-700"
        isLoading={isConnecting}
        errorMessage={actionError}
      />

      {/* Decline Quote Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeclineModal}
        onClose={handleCancelDeclineQuote}
        onConfirm={handleConfirmDeclineQuote}
        title="Decline Cleaner?"
        message={
          quoteToDecline ?
            `Are you sure you want to decline ${quoteToDecline.cleaner?.firstName || 'this cleaner'}? This action cannot be undone.` :
            "Are you sure you want to decline this cleaner?"
        }
        confirmText="Decline Cleaner"
        cancelText="Cancel"
        confirmButtonColor="bg-red-500 hover:bg-[#EF4444] text-red-500! hover:text-white! border border-red-500"
        isLoading={isDeclining}
      />
    </>
  );
};

export default CustomerJobDetailsPage;

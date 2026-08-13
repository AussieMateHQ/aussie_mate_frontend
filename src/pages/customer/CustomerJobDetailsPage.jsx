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
  Mail,
  MapPin,
  Star,
} from 'lucide-react';

import { Button, ConfirmationModal, PageHeader, JobOverviewCard } from '../../components';
import ThreeDotIcon from '../../assets/3dot.svg';
import UserIcon from '../../assets/user.svg';
import RatingIcon from '../../assets/rating.svg';
import SilverBadgeIcon from '../../assets/silverBadge.svg';
import GoldBadgeIcon from '../../assets/goldBadge.svg';
import BronzeBadgeIcon from '../../assets/bronzeBadge.svg';

import CloseIcon from '../../assets/close.svg';
import { jobsAPI, quotesAPI, reviewsAPI } from '../../services/api';
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
  const [showHireModal, setShowHireModal] = useState(false);
  const [cleanerToHire, setCleanerToHire] = useState(null);
  const [isHiring, setIsHiring] = useState(false);
  const [hireError, setHireError] = useState('');
  const [cleanerQuotes, setCleanerQuotes] = useState([]);
  const [waitlistedCleaners, setWaitlistedCleaners] = useState([]);
  const [chatRooms, setChatRooms] = useState([]);
  const dropdownRef = useRef(null);
  const [selectedCleanerForModal, setSelectedCleanerForModal] = useState(null);
  const [cleanerReviews, setCleanerReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

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

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('en-AU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isJobAssigned = [
    'assigned',
    'accepted',
    'booked',
    'on_the_way',
    'started',
    'in_progress',
    'completed',
  ].includes((job?.status || '').toLowerCase()) || Boolean(job?.assignedCleanerId || job?.assignedCleaner);

  const waitlistUnlocksAt = job?.createdAt
    ? new Date(new Date(job.createdAt).getTime() + 24 * 60 * 60 * 1000)
    : null;
  const is24HoursPassed = waitlistUnlocksAt ? new Date() >= waitlistUnlocksAt : false;
  const waitlistVisible = job?.waitlistVisible === true || is24HoursPassed;
  const waitlistCount = Math.max(Number(job?.waitlistCount || 0), waitlistedCleaners.length);
  const waitlistUnlockLabel = waitlistUnlocksAt ? formatDateTime(waitlistUnlocksAt) : '';

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

  const handleHireClick = (cleanerId) => {
    const item = cleanerQuotes.find(q => (q.cleanerId?._id || q.cleanerId) === cleanerId);
    if (item) {
      setCleanerToHire(item);
      setHireError('');
      setShowHireModal(true);
    }
  };

  const handleConfirmHire = async () => {
    if (!cleanerToHire) return;
    const cleanerId = cleanerToHire.cleanerId?._id || cleanerToHire.cleanerId || cleanerToHire.id;

    try {
      setIsHiring(true);
      setHireError('');

      const response = await jobsAPI.assignCleaner(jobId, cleanerId);

      if (response.success) {
        setShowHireModal(false);
        navigate(`/booking-confirmation/${jobId}?cleaner=${cleanerId}`);
      } else {
        setHireError(response.message || response.error || 'Failed to assign cleaner');
      }
    } catch (err) {
      setHireError(err.message || 'Failed to assign cleaner. Please try again.');
    } finally {
      setIsHiring(false);
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
      email: cleaner?.email || '',
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

  const handleCleanerClick = async (cleaner) => {
    setSelectedCleanerForModal(cleaner);
    setCleanerReviews([]);
    setLoadingReviews(true);
    try {
      const response = await reviewsAPI.getCleanerReviews(cleaner.id);
      if (response.success && response.data) {
        setCleanerReviews(response.data.reviews || []);
      }
    } catch (err) {
      console.error('Failed to fetch cleaner reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
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

            {(job.petType || job.numberOfPets || (job.petNeeds && job.petNeeds.length > 0)) && (
              <div className="space-y-3 mb-4">
                {(job.petType || job.numberOfPets) && (
                  <div className="flex flex-wrap gap-2">
                    {job.petType && (
                      <div className="inline-flex items-center gap-1.5 bg-[#F3F4F6] border border-[#E5E7EB] px-3 py-1.5 rounded-full text-xs font-semibold text-gray-700">
                        Pet Type: {job.petType}
                      </div>
                    )}
                    {job.numberOfPets && (
                      <div className="inline-flex items-center gap-1.5 bg-[#F3F4F6] border border-[#E5E7EB] px-3 py-1.5 rounded-full text-xs font-semibold text-gray-700">
                        Number of Pets: {job.numberOfPets}
                      </div>
                    )}
                  </div>
                )}
                {job.petNeeds && job.petNeeds.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Pet Needs</h4>
                    <div className="flex flex-wrap gap-2">
                      {job.petNeeds.map((item, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full text-xs font-semibold text-blue-700">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {((job.fixingItems && job.fixingItems.length > 0) || (job.handymanRequirements && job.handymanRequirements.length > 0)) && (
              <div className="space-y-3 mb-4">
                {job.fixingItems && job.fixingItems.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Fixing/Installing</h4>
                    <div className="flex flex-wrap gap-2">
                      {job.fixingItems.map((item, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full text-xs font-semibold text-blue-700">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {job.handymanRequirements && job.handymanRequirements.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Requirements</h4>
                    <div className="flex flex-wrap gap-2">
                      {job.handymanRequirements.map((item, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full text-xs font-semibold text-blue-700">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Additional details */}
            {(job.hasPlans || job.hasCouncilApproval || job.budget || job.jobStage || job.propertyType || job.commercialCleaningType || job.preferredCleaningTime || (job.areasNeedCleaning && job.areasNeedCleaning.length > 0)) && (
              <div className="grid gap-3 sm:grid-cols-2 mt-4 mb-6">
                {((job.categoryId?.name?.toLowerCase().includes('commercial') || job.propertyType || job.commercialCleaningType) ? [
                  { label: 'Property Type', value: job.propertyType },
                  { label: 'Cleaning Service Type', value: job.commercialCleaningType },
                  { label: 'Areas to Clean', value: job.areasNeedCleaning && job.areasNeedCleaning.length > 0 ? job.areasNeedCleaning.join(', ') : null },
                  { label: 'Preferred Time', value: job.preferredCleaningTime },
                  { label: 'Job Stage', value: job.jobStage },
                ] : [
                  { label: 'Plans', value: job.hasPlans },
                  { label: 'Council Approval', value: job.hasCouncilApproval },
                  { label: 'Budget', value: job.budget },
                  { label: 'Job Stage', value: job.jobStage },
                ]).filter(item => item.value).map((item, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-xl border border-[#E2E8FF] bg-[#F8FAFF]"
                  >
                    <div className="text-[11px] uppercase text-primary-300 font-semibold tracking-wide mb-1">
                      {item.label}
                    </div>
                    <div className="text-sm text-primary-500 font-medium">
                      {item.value}
                    </div>
                  </div>
                ))}
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
                        <div onClick={() => handleCleanerClick(cleaner)} className="cursor-pointer hover:opacity-90 active:scale-95 transition-all">
                          <CleanerAvatar src={cleaner.photo} name={cleaner.name} className="w-16 h-16" />
                        </div>
                        <div>
                          <h4 
                            onClick={() => handleCleanerClick(cleaner)}
                            className="text-lg font-medium text-gray-900 mb-1 capitalize cursor-pointer hover:text-primary-500 hover:underline transition-all"
                          >
                            {cleaner.name}
                          </h4>
                          
                          <div className="flex items-center gap-1 mt-0.5 mb-1.5">
                            <div className="flex text-yellow-400">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`w-3.5 h-3.5 ${
                                    s <= Math.round(cleaner.rating)
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-gray-500 font-semibold ml-1">
                              {cleaner.rating > 0 ? cleaner.rating.toFixed(1) : 'No reviews'} ({cleaner.reviews} reviews)
                            </span>
                          </div>

                          {(cleaner.phone || cleaner.email) && (
                            <div className="my-3 border border-gray-200 rounded-2xl bg-white overflow-hidden max-w-sm w-full">
                              <div className="px-5 py-4">
                                <h4 className="text-[11px] font-bold text-gray-500 mb-4 tracking-wide uppercase">
                                  Cleaner Contact Details
                                </h4>

                                <div className="flex flex-col">
                                  {cleaner.phone && (
                                    <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 rounded-xl bg-[#F4F3ED] flex items-center justify-center flex-shrink-0">
                                        <Phone className="w-4 h-4 text-gray-700" strokeWidth={2} />
                                      </div>
                                      <div>
                                        <div className="text-[11px] text-gray-500 font-medium">Phone</div>
                                        <div className="text-[14px] font-bold text-gray-900">{cleaner.phone}</div>
                                      </div>
                                    </div>
                                  )}

                                  {cleaner.phone && cleaner.email && (
                                    <div className="h-px bg-gray-200 my-4 w-full"></div>
                                  )}

                                  {cleaner.email && (
                                    <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 rounded-xl bg-[#F4F3ED] flex items-center justify-center flex-shrink-0">
                                        <Mail className="w-4 h-4 text-gray-700" strokeWidth={2} />
                                      </div>
                                      <div>
                                        <div className="text-[11px] text-gray-500 font-medium">Email</div>
                                        <div className="text-[14px] font-bold text-gray-900">{cleaner.email}</div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                          <p className="text-xs text-gray-500 font-medium mt-1">
                            {cleaner.distance}
                          </p>
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

                    {/* Footer Action Buttons */}
                    <div className="border-t border-gray-100 pt-4 flex justify-end gap-3">
                      {item.status === 'rejected' ? (
                        /* Rejected state */
                        <div className="flex justify-center w-full">
                          <span className="py-2 px-5 text-sm font-medium text-red-400 bg-red-50 rounded-full border border-red-100">
                            ✕ Rejected
                          </span>
                        </div>
                      ) : (
                        <>
                          <Button
                            onClick={() => navigate(`/customer-chat/${jobId}?cleaner=${cleaner.id}`)}
                            variant=""
                            className="py-3 px-6 text-base font-semibold rounded-full border border-[#DCE4FF] bg-white text-[#1F6FEB] hover:bg-[#1F6FEB] hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            💬 Chat
                          </Button>
                          <Button
                            onClick={() => handleHireClick(cleaner.id)}
                            variant=""
                            className="py-3 px-6 text-base font-semibold rounded-full border border-green-300 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            ✓ Hire
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Waitlisted Section */}
          {waitlistedCleaners.length > 0 && (
            <div className="mt-8">
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h3 className="text-lg font-medium text-gray-900 uppercase tracking-wider">
                  WAITLISTED CLEANERS
                </h3>
              </div>
              <div className="space-y-6">
                {waitlistedCleaners.map((item, index) => {
                  const cleaner = formatCleanerData(item);

                  return (
                    <div key={`waitlisted-${index}`} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                      {/* Header: Avatar, Info, and Tier */}
                      <div className="mb-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex min-w-0 flex-1 gap-4">
                            <div onClick={() => handleCleanerClick(cleaner)} className="cursor-pointer hover:opacity-90 active:scale-95 transition-all">
                              <CleanerAvatar src={cleaner.photo} name={cleaner.name} className="w-12 h-12" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 
                                onClick={() => handleCleanerClick(cleaner)}
                                className="text-lg font-semibold text-gray-900 capitalize leading-tight cursor-pointer hover:text-primary-500 hover:underline transition-all"
                              >
                                {cleaner.name}
                              </h4>
                              
                              <div className="flex items-center gap-1 mt-0.5 mb-1">
                                <div className="flex text-yellow-400">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <Star
                                      key={s}
                                      className={`w-3 h-3 ${
                                        s <= Math.round(cleaner.rating)
                                          ? 'fill-yellow-400 text-yellow-400'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-[11px] text-gray-500 font-semibold ml-1">
                                  {cleaner.rating > 0 ? cleaner.rating.toFixed(1) : 'No reviews'} ({cleaner.reviews} reviews)
                                </span>
                              </div>
                              
                              <p className="text-xs text-gray-500 font-medium">
                                {cleaner.distance}
                              </p>
                            </div>
                          </div>

                          {/* Tier Badge */}
                          {cleaner.tier && cleaner.tier !== 'none' && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 flex-shrink-0">
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
                              <span className="text-xs text-gray-700 font-semibold capitalize whitespace-nowrap">
                                {cleaner.tier} Tier
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Intro Message Bubble */}
                      <div className="bg-[#F8FAFC] rounded-2xl p-5 mb-4 border border-blue-50/50 inline-block w-full">
                        <p className="text-gray-500 text-sm font-medium leading-relaxed italic">
                          "I'm on the waitlist for this job. Connect with me to discuss how I can help!"
                        </p>
                      </div>

                      {/* Footer Action Button */}
                      <div className="flex justify-end border-t border-gray-100 pt-4">
                        <Button
                          onClick={() => {
                            if (isJobAssigned) return;
                            handleAcceptQuote(cleaner.id);
                          }}
                          variant=""
                          className={`py-3 text-base font-semibold rounded-full border transition-all ${isJobAssigned
                            ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'border-[#DCE4FF] bg-white text-[#1F6FEB] hover:bg-[#1F6FEB] hover:text-white cursor-pointer'
                            }`}
                        >
                          Connect
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

      {/* Accept Cleaner Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConnectModal}
        onClose={handleCancelConnect}
        onConfirm={handleConfirmConnect}
        title={
          quoteToConnect
            ? `Accept ${quoteToConnect.cleaner?.firstName || quoteToConnect.cleanerId?.firstName || 'Cleaner'}?`
            : "Accept Cleaner?"
        }
        message={
          quoteToConnect ?
            `Accepting ${quoteToConnect.cleaner?.firstName || quoteToConnect.cleanerId?.firstName || 'this cleaner'} will deduct credits from their account and open a chat with them.` :
            "Accepting this cleaner will deduct credits from their account and open a chat with them."
        }
        confirmText="Accept & Chat"
        cancelText="Not Now"
        confirmButtonColor="bg-green-600 hover:bg-green-700"
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

      {/* Hire Cleaner Confirmation Modal */}
      <ConfirmationModal
        isOpen={showHireModal}
        onClose={() => setShowHireModal(false)}
        onConfirm={handleConfirmHire}
        title={
          cleanerToHire
            ? `Hire ${cleanerToHire.cleaner?.firstName || cleanerToHire.cleanerId?.firstName || 'Cleaner'}?`
            : "Hire Cleaner?"
        }
        message={
          cleanerToHire ?
            `Are you sure you want to hire ${cleanerToHire.cleaner?.firstName || cleanerToHire.cleanerId?.firstName || 'this cleaner'} and book them for this job?` :
            "Are you sure you want to hire this cleaner and book them for this job?"
        }
        confirmText="Hire & Book"
        cancelText="Not Now"
        confirmButtonColor="bg-green-600 hover:bg-green-700"
        isLoading={isHiring}
        errorMessage={hireError}
      />

      {/* Cleaner Details Modal */}
      {selectedCleanerForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in"
            onClick={() => setSelectedCleanerForModal(null)}
          />
          {/* Modal Content */}
          <div className="relative bg-white rounded-3xl w-full max-w-xl max-h-[85vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col">
            {/* Close Button */}
            <button
              onClick={() => setSelectedCleanerForModal(null)}
              className="absolute right-5 top-5 w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors z-10 cursor-pointer"
            >
              <span className="text-xl font-medium leading-none">&times;</span>
            </button>

            <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
              {/* Profile Header */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                <div className="relative flex-shrink-0">
                  <CleanerAvatar
                    src={selectedCleanerForModal.photo}
                    name={selectedCleanerForModal.name}
                    className="w-24 h-24 sm:w-28 sm:h-28 text-3xl"
                  />
                </div>
                <div className="text-center sm:text-left space-y-2 flex-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h3 className="text-2xl font-bold text-gray-900 capitalize">
                      {selectedCleanerForModal.name}
                    </h3>
                    {selectedCleanerForModal.tier && selectedCleanerForModal.tier !== 'none' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-primary-50 border border-primary-100 text-primary-700 capitalize">
                        {selectedCleanerForModal.tier} Tier
                      </span>
                    )}
                  </div>

                  {/* Rating Stars Summary */}
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <div className="flex text-yellow-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-4 h-4 ${
                            s <= Math.round(selectedCleanerForModal.rating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-gray-700">
                      {selectedCleanerForModal.rating > 0
                        ? selectedCleanerForModal.rating.toFixed(1)
                        : 'No rating'}
                    </span>
                    <span className="text-sm text-gray-400 font-medium">•</span>
                    <span className="text-sm text-gray-500 font-semibold">
                      {selectedCleanerForModal.reviews} reviews
                    </span>
                  </div>

                  {/* Distance */}
                  <p className="text-sm text-gray-500 font-medium">
                    📍 {selectedCleanerForModal.distance}
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-gray-100" />

              {/* Contact Info (If available) */}
              {(selectedCleanerForModal.phone || selectedCleanerForModal.email) && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contact Info</h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {selectedCleanerForModal.phone && (
                      <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100">
                        <div className="w-10 h-10 rounded-xl bg-[#F4F3ED] text-gray-700 flex items-center justify-center flex-shrink-0">
                          <Phone className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Phone</p>
                          <p className="text-sm font-semibold text-gray-800 truncate">{selectedCleanerForModal.phone}</p>
                        </div>
                      </div>
                    )}
                    {selectedCleanerForModal.email && (
                      <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100">
                        <div className="w-10 h-10 rounded-xl bg-[#F4F3ED] text-gray-700 flex items-center justify-center flex-shrink-0">
                          <Mail className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Email</p>
                          <p className="text-sm font-semibold text-gray-800 truncate">{selectedCleanerForModal.email}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Reviews List */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Customer Reviews ({cleanerReviews.length})
                </h4>

                {loadingReviews ? (
                  <div className="py-8 flex flex-col items-center justify-center gap-2 text-gray-400">
                    <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-semibold">Loading reviews...</span>
                  </div>
                ) : cleanerReviews.length === 0 ? (
                  <div className="text-center py-8 text-sm text-gray-400 font-medium">
                    No reviews received yet.
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[30vh] overflow-y-auto pr-1">
                    {cleanerReviews.map((rev) => (
                      <div key={rev.id} className="p-4 bg-gray-50 border border-gray-100 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-gray-850 capitalize">
                            {rev.customer?.name || 'Anonymous Customer'}
                          </p>
                          <span className="text-[10px] text-gray-400 font-semibold">
                            {rev.createdAt
                              ? new Date(rev.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="flex text-yellow-400">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3 h-3 ${
                                  s <= rev.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                  }`}
                              />
                            ))}
                          </div>
                        </div>
                        {rev.feedback && (
                          <p className="text-xs text-gray-650 leading-relaxed font-medium">
                            {rev.feedback}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Close footer button */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedCleanerForModal(null)}
                className="py-2.5 px-6 rounded-2xl bg-white border border-gray-200 hover:bg-gray-100 font-bold text-xs text-gray-600 cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CustomerJobDetailsPage;

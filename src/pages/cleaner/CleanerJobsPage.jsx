import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PageHeader, PaginationRanges, Button, RadioButton, ConfirmationModal } from '../../components';
import { MapPin } from 'lucide-react';
import DownIcon from '../../assets/down2.svg';
import CalendarIcon from '../../assets/Calendar.svg';
import MapPinIcon from '../../assets/map-pin 1.png';
import CurrentLocationIcon from '../../assets/currentLocation.svg';
import SearchIcon from '../../assets/search.svg';
import { jobsAPI, userAPI, reviewsAPI, subscriptionsAPI } from '../../services/api';


const CleanerJobsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const normalizeTab = (tab) => {
    if (tab === 'live-jobs') return 'posted';
    if (tab === 'my-bids') return 'booking_request';
    if (tab === 'accepted') return 'assigned';
    return tab;
  };

  const [activeTab, setActiveTab] = useState(() => {
    return normalizeTab(location.state?.tab) || 'posted';
  });

  const [subFilter, setSubFilter] = useState('request_sent');

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(normalizeTab(location.state.tab));
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate]);



  const [showSortModal, setShowSortModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [requireVerification, setRequireVerification] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const jobsPerPage = 10;

  const [distance, setDistance] = useState(25);
  const [customDistance, setCustomDistance] = useState('');

  const [isUrgent, setIsUrgent] = useState(false);
  const [userLocation, setUserLocation] = useState({
    address: 'Location not set',
    city: 'Please set your location',
    coordinates: null
  });
  const [cleanerReviews, setCleanerReviews] = useState([]);
  const [cleanerProfile, setCleanerProfile] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);

  const getCreditsPerLeadForJob = (job) => {
    if (!subscriptionStatus) return 20;
    const jobCategoryId = job?.originalJob?.categoryId?._id || job?.originalJob?.categoryId || job?.categoryId;

    const multiSubs = subscriptionStatus.subscriptions || [];
    for (const sub of multiSubs) {
      if (sub.status !== 'active') continue;
      const cats = sub.planId?.includedCategories || [];
      const match = cats.some(c => (c._id || c) === jobCategoryId || (c._id || c)?.toString() === jobCategoryId?.toString());
      if (match && sub.planId?.creditsPerLead) return sub.planId.creditsPerLead;
    }

    const anyPlan = multiSubs.find(s => s.status === 'active' && s.planId?.creditsPerLead);
    if (anyPlan) return anyPlan.planId.creditsPerLead;

    return subscriptionStatus?.subscription?.planId?.creditsPerLead || 20;
  };

  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [jobToAccept, setJobToAccept] = useState(null);
  const [jobToReject, setJobToReject] = useState(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [expandedJobId, setExpandedJobId] = useState(null);

  const apiCache = useRef({});
  const activeController = useRef(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const profileResponse = await userAPI.getProfile();
        if (mounted && profileResponse.success) {
          const profileData = profileResponse.data?.user || profileResponse.data;
          setCleanerProfile(profileData);
        }

        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const currentUserId = currentUser.id || currentUser._id;
        if (currentUserId) {
          const reviewsResponse = await reviewsAPI.getCleanerReviews(currentUserId);
          if (mounted && reviewsResponse.success) {
            setCleanerReviews(reviewsResponse.data?.reviews || reviewsResponse.data || []);
          }
        }
      } catch (err) {
      }
      try {
        const statusRes = await subscriptionsAPI.getMyStatus();
        if (mounted && statusRes.success && statusRes.data) setSubscriptionStatus(statusRes.data);
      } catch (err) {
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const fetchUserLocation = async () => {
      try {
        const userProfile = await userAPI.getProfile();
        const userData = userProfile?.data?.user || userProfile?.data || userProfile;
        const location = userData?.location;

        if (location) {
          const fullAddress = location.fullAddress || location.address || '';
          const addressParts = fullAddress.split(',');
          const address = addressParts[0]?.trim() || 'Location not set';
          const city = addressParts.length > 1 ? addressParts[addressParts.length - 2]?.trim() : (location.city || 'Please set your location');
          setUserLocation({ address, city, coordinates: location.coordinates || null });
          return;
        }
      } catch (e) {
      }
      const stored = localStorage.getItem('userLocation');
      if (stored) {
        try {
          const loc = JSON.parse(stored);
          setUserLocation({
            address: loc.address?.split(',')[0] || 'Location not set',
            city: loc.city || 'Please set your location',
            coordinates: loc.coordinates || null
          });
        } catch { /* ignore */ }
      }
    };

    fetchUserLocation();
    const handleLocationUpdate = () => fetchUserLocation();
    window.addEventListener('locationUpdated', handleLocationUpdate);
    const handleStorageChange = (e) => { if (e.key === 'userLocation') fetchUserLocation(); };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('locationUpdated', handleLocationUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // disable body scroll when modal is open (kept)
  useEffect(() => {
    document.body.style.overflow = showSortModal ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [showSortModal]);

  const tabs = [
    { id: 'posted', label: 'Nearby Jobs' },
    { id: 'booking_request', label: 'Booking Requests' },
    { id: 'assigned', label: 'Job Assigned' }
  ];

  // --- NEW: helper to fetch jobs list once per (status,page) and cache ---
  const fetchJobsList = async ({ tab, subFilter, page = 1, limit = jobsPerPage, signal, categoryId, location, isUrgent }) => {
    // key includes tab & subFilter & page so cache is per page
    const cacheKey = `feed::tab:${tab}::sub:${subFilter}::page:${page}::limit:${limit}::cat:${categoryId}::loc:${location}::urgent:${isUrgent}`;

    if (apiCache.current[cacheKey]) {
      return apiCache.current[cacheKey];
    }

    // call backend with feed parameters
    const result = await jobsAPI.getCleanerJobFeed({
      tab,
      subFilter,
      page,
      limit,
      categoryId,
      location,
      isUrgent,
      signal
    });

    // normalize response
    const jobsArray = result?.data?.jobs || result?.data || [];
    const total = result?.data?.totalAvailable || result?.totalAvailable || jobsArray.length;
    const payload = {
      jobs: jobsArray,
      total,
      requireVerification: result?.requireVerification || false
    };
    apiCache.current[cacheKey] = payload;
    return payload;
  };



  // main data loader - reacts to tab/page/search changes
  useEffect(() => {
    // cancel previous requests
    if (activeController.current) {
      activeController.current.abort();
    }
    const controller = new AbortController();
    activeController.current = controller;

    (async () => {
      setLoading(true);
      setError('');
      try {
        // Safety check: Don't fetch jobs if coordinates aren't set yet (unless not in posted tab maybe?)
        // But for 'posted' jobs, distance is key.
        if (activeTab === 'posted' && !userLocation?.coordinates?.lat) {
          setLoading(false);
          return;
        }

        const result = await fetchJobsList({
          tab: activeTab,
          subFilter: activeTab === 'booking_request' ? subFilter : undefined,
          page: currentPage,
          limit: jobsPerPage,
          location: JSON.stringify({
            lat: userLocation?.coordinates?.lat,
            lng: userLocation?.coordinates?.lng,
            radius: distance
          }),
          isUrgent,
          signal: controller.signal
        });

        const jobsList = result.jobs || [];
        const allTransformed = jobsList.map(transformJobForUI);

        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const currentUserId = currentUser.id || currentUser._id;
        const key = `rejected_jobs_${currentUserId}`;
        const rejectedJobs = JSON.parse(localStorage.getItem(key) || '[]');

        // Client-side search and other filtering
        const filteredAll = allTransformed.filter(job => {
          if (activeTab === 'posted' && rejectedJobs.includes(job.id)) return false;
          if (searchQuery.trim() === '') return true;
          return job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.id?.toString().toLowerCase().includes(searchQuery.toLowerCase());
        });

        setJobs(filteredAll);
        setTotalJobs(result.total || filteredAll.length);
        setTotalPages(Math.max(1, Math.ceil((result.total || filteredAll.length) / jobsPerPage)));
        setRequireVerification(result.requireVerification);
      } catch (err) {
        if (err.name === 'AbortError') {
          // request aborted - ignore
        } else {
          setError('Failed to load jobs');
          setJobs([]);
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      controller.abort();
      activeController.current = null;
    };
  }, [activeTab, subFilter, currentPage, searchQuery, distance, isUrgent, refreshTrigger, userLocation]);


  // transform helper (keeps the UI shape identical to your original)
  const transformJobForUI = (job) => {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const currentUserId = currentUser.id || currentUser._id;
    let myQuote = null;
    if (job.quotes && job.quotes.length > 0) {
      myQuote = job.quotes.find(q => {
        const qCleanerId = q.cleanerId?._id || q.cleanerId || q.cleanerId?.id;
        return (qCleanerId === currentUserId || qCleanerId?.toString() === currentUserId?.toString()) && q.status === 'pending';
      }) || null;
    }

    // Use job.distance provided by backend
    const jobDistance = job.distance;

    return {
      id: job._id || job.jobId || job.id,
      title: job.serviceTypeId?.name || job.title || 'Cleaning Job',
      location: job.location?.address || job.location?.fullAddress || 'Location not specified',
      date: job.scheduledDate ? new Date(job.scheduledDate).toLocaleDateString('en-AU', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
      }) : 'Date not specified',
      // price: job.budget ? `$${job.budget}` : 'Price not specified',
      status: job.status || 'posted',
      timeAgo: job.createdAt ? getTimeAgo(new Date(job.createdAt)) : 'Recently posted',
      type: job.serviceType || 'general',
      originalJob: job,
      myQuote,
      isRequestSent: job.isRequestSent || false,
      isWaitlisted: job.isWaitlisted || false,
      distance: (jobDistance !== undefined && jobDistance !== null) ? parseFloat(jobDistance).toFixed(3) : null,
      isUrgent: job.isUrgent || false,
      category: job.categoryId?.name || 'Cleaning',
      customer: job.customerId || null
    };
  };

  // helper for time ago
  const getTimeAgo = (date) => {
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    if (diffInHours < 1) return 'Posted just now';
    if (diffInHours === 1) return 'Posted 1h ago';
    if (diffInHours < 24) return `Posted ${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `Posted ${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  const handleJobClick = (jobId, jobStatus) => {
    if (jobStatus === 'completed' || jobStatus === 'assigned' || activeTab === 'assigned') {
      navigate(`/cleaner-job-completed/${jobId}`);
      return;
    }
    navigate(`/job-details/${jobId}`, { state: { fromTab: activeTab } });
  };

  const handleInProgressJobClick = (jobId) => navigate(`/in-progress-job/${jobId}`);

  const handlePageChange = (_, page) => setCurrentPage(page);

  const handleConfirmReject = () => {
    if (!jobToReject) return;
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const currentUserId = currentUser.id || currentUser._id;
    const key = `rejected_jobs_${currentUserId}`;
    const rejectedJobs = JSON.parse(localStorage.getItem(key) || '[]');
    if (!rejectedJobs.includes(jobToReject)) {
      rejectedJobs.push(jobToReject);
      localStorage.setItem(key, JSON.stringify(rejectedJobs));
    }
    setJobs(prev => prev.filter(j => j.id !== jobToReject));
    setShowRejectModal(false);
    setJobToReject(null);
  };

  const handleConfirmAccept = async () => {
    if (!jobToAccept) return;
    const jobId = jobToAccept.id;

    // Check if cleaner has active subscription (multi-plan or legacy)
    const multiSubs = subscriptionStatus?.subscriptions || [];
    const hasActiveMulti = multiSubs.some(s => s.status === 'active');
    const isSubscribed = hasActiveMulti || subscriptionStatus?.subscription?.status === 'active';
    if (!isSubscribed) {
      navigate('/my-subscription');
      return;
    }

    try {
      setIsAccepting(true);
      setModalError('');
      const response = await jobsAPI.contactJob(jobId, {
        message: 'Hi, I am interested in this job! Let\'s connect and discuss details.'
      });

      if (response.success) {
        setShowAcceptModal(false);
        setJobToAccept(null);
        navigate(`/chat/${jobId}`);
      } else {
        setModalError(response.message || response.error || 'Failed to accept job');
      }
    } catch (err) {
      setModalError(err.message || 'Failed to accept job. Please try again.');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleResetFilters = () => {
    setDistance(25);
    setCustomDistance('');
    setIsUrgent(false);
  };

  const handleApplyFilters = () => {
    setShowSortModal(false);
    apiCache.current = {};
    setRefreshTrigger(prev => prev + 1);
    setCurrentPage(1);
  };

  // Jobs are now filtered on backend, no need for client-side filtering
  const filteredJobs = jobs;

  useEffect(() => {
    setCurrentPage(1);
    // Reset subFilter if navigating to booking_request
    if (activeTab !== 'booking_request') {
      // Keep it saved but show subfilters only when in that tab
    }
  }, [activeTab]);

  // --- rest of your UI markup unchanged, using the same classes and structure ---
  // For brevity, I will reuse the existing UI code you provided earlier
  // The UI uses `jobs`, `loading`, `error`, `totalPages`, `currentPage` etc. which are unchanged

  return (
    <div className='pb-6'>
      <div className="max-w-sm mx-auto sm:max-w-2xl lg:max-w-4xl xl:max-w-7xl">
        <PageHeader
          title="Jobs"
          onBack={() => navigate('/cleaner-dashboard')}
          className="py-3 px-4 sm:px-6 lg:px-8"
          rightSlot={
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => navigate('/location', { state: { from: '/cleaner-jobs' } })}
            >
              <img src={CurrentLocationIcon} alt="Location" className="w-5 h-5" />
              <span className="text-sm text-primary-600 font-medium ">
                {userLocation.address}, {userLocation.city}
              </span>
            </div>
          }
        />

        {/* Flat container (no extra rounded background behind tabs/cards) to match Figma */}
        <div className="bg-transparent rounded-none p-0 shadow-none">
          {/* Search & Sort */}
          <div className="px-4 sm:px-6 lg:px-8 pb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <img src={SearchIcon} alt="Search" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 " />
                <input
                  type="text"
                  placeholder="Search jobs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none text-primary-200 font-medium cursor-pointer"
                />
              </div>

              <div className="relative sm:w-auto w-full ">
                <button onClick={() => setShowSortModal(true)} className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-full text-sm text-primary-200 font-medium hover:bg-gray-50 transition-colors whitespace-nowrap w-full sm:w-auto cursor-pointer ">
                  <span>Sort By</span>
                  <img src={DownIcon} alt="Dropdown" className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-4 sm:px-6 lg:px-8 pb-4">
            <div className="flex gap-2 overflow-x-auto no-scrollbar scrollbar-hide pb-1">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${activeTab === tab.id ? 'bg-[#EBF2FD] text-primary-600 font-semibold border-none' : 'bg-[#F3F3F3] text-gray-600 border border-[#F3F3F3] hover:bg-gray-50'}`}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sub-filters for Booking Requests */}
          {activeTab === 'booking_request' && (
            <div className="px-4 sm:px-6 lg:px-8 pb-4 flex items-center gap-6">
              <RadioButton
                name="subFilter"
                value="request_sent"
                label="Request Sent"
                checked={subFilter === 'request_sent'}
                onChange={(e) => setSubFilter(e.target.value)}
              />
              <RadioButton
                name="subFilter"
                value="waitlisted"
                label="Waitlisted"
                checked={subFilter === 'waitlisted'}
                onChange={(e) => setSubFilter(e.target.value)}
              />
            </div>
          )}

          {/* Cards: uses same rendering as before but using `jobs` from optimized loader */}
          <div className="px-4 sm:px-6 lg:px-8 pb-6">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="bg-white border border-gray-200 rounded-3xl p-6 animate-pulse">...</div>)}
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-8"><div className="text-red-500">{error}</div></div>
            ) : filteredJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 bg-white rounded-3xl border border-dashed border-gray-200">
                {requireVerification ? (
                  <>
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                      <img src={CalendarIcon} alt="Pending" className="w-8 h-8 opacity-50" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">Verification Pending</h4>
                    <p className="text-gray-500 text-center text-sm max-w-xs leading-relaxed">
                      Your documents are being reviewed. Jobs will show up here once you are verified by our team.
                    </p>
                  </>
                ) : (
                  <div className="text-gray-500 font-medium">No jobs found</div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {filteredJobs.map(job => (
                  <div
                    key={job.id}
                    onClick={() => {
                      if (activeTab === 'posted') {
                        setExpandedJobId(prev => prev === job.id ? null : job.id);
                      } else {
                        handleJobClick(job.id, job.originalJob?.status);
                      }
                    }}
                    className="bg-white border border-gray-200 rounded-2xl p-5 cursor-pointer hover:shadow-sm transition-all"
                  >
                    <div className="flex flex-col gap-3">
                      {/* Top Info: Category and Status */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500">
                          {job.category}
                        </span>
                        <div className="flex gap-2">
                          {activeTab === 'posted' && (
                            <span className="text-[12px] font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                              Cost: {getCreditsPerLeadForJob(job)} Credits
                            </span>
                          )}
                          {/* {job.isUrgent && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-200 uppercase tracking-wider">
                              Urgent
                            </span>
                          )} */}
                          {activeTab === 'completed' && (
                            <span className="text-[12px] font-medium px-2 py-1.5 rounded-full bg-green-100 text-green-600 border border-green-200">
                              Completed
                            </span>
                          )}
                          {activeTab === 'assigned' && (
                            <span className="text-[12px] font-medium px-2 py-1.5 rounded-full bg-[#EBF2FD] text-[#1F6FEB] border border-[#dae6fa] capitalize">
                              Assigned
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Job Title */}
                      <h3 className="text-lg font-semibold text-gray-900 leading-tight">
                        {job.title}
                      </h3>

                      {/* Details with Icons */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-500">
                          <img src={CalendarIcon} alt="Date" className="w-4 h-4 opacity-60" />
                          <span className="text-sm font-medium">{job.date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500">
                          <img src={MapPinIcon} alt="Location" className="w-4 h-4 opacity-60" />
                          <div className="min-w-0">
                            <span className="text-sm font-medium truncate block">{job.location}</span>
                            {/* {job.distance !== null && (
                              <span className="text-[11px] font-semibold text-primary-500 uppercase">
                                {job.distance} KM AWAY
                              </span>
                            )} */}
                          </div>
                        </div>
                      </div>

                      {/* Collapsible details for Nearby Jobs */}
                      {expandedJobId === job.id && activeTab === 'posted' && (
                        <div className="mt-2 pt-3 border-t border-gray-100 space-y-4">
                          {/* Description */}
                          {job.originalJob?.instructions && (
                            <div className="space-y-1">
                              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Instructions</h4>
                              <p className="text-sm text-gray-600 font-medium leading-relaxed bg-[#F8FAFF] rounded-xl p-3 border border-[#E2E8FF]">
                                {job.originalJob.instructions}
                              </p>
                            </div>
                          )}

                          {/* Rooms & Bathrooms */}
                          {(job.originalJob?.roomsNeedCleaning || job.originalJob?.bathroomsNeedCleaning) && (
                            <div className="flex flex-wrap gap-2">
                              {job.originalJob.roomsNeedCleaning && (
                                <div className="inline-flex items-center gap-1.5 bg-[#F3F4F6] border border-[#E5E7EB] px-3 py-1.5 rounded-full text-xs font-semibold text-gray-700">
                                  <span className="text-[#1A73E8]">🛏️</span> {job.originalJob.roomsNeedCleaning} Room{job.originalJob.roomsNeedCleaning !== '1' ? 's' : ''}
                                </div>
                              )}
                              {job.originalJob.bathroomsNeedCleaning && (
                                <div className="inline-flex items-center gap-1.5 bg-[#F3F4F6] border border-[#E5E7EB] px-3 py-1.5 rounded-full text-xs font-semibold text-gray-700">
                                  <span className="text-[#1A73E8]">🚿</span> {job.originalJob.bathroomsNeedCleaning} Bathroom{job.originalJob.bathroomsNeedCleaning !== '1' ? 's' : ''}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Pet Sitting Details */}
                          {(job.originalJob?.petType || job.originalJob?.numberOfPets || (job.originalJob?.petNeeds && job.originalJob.petNeeds.length > 0)) && (
                            <div className="space-y-3">
                              <div className="flex flex-wrap gap-2">
                                {job.originalJob.petType && (
                                  <div className="inline-flex items-center gap-1.5 bg-[#F3F4F6] border border-[#E5E7EB] px-3 py-1.5 rounded-full text-xs font-semibold text-gray-700">
                                    Pet: {job.originalJob.petType}
                                  </div>
                                )}
                                {job.originalJob.numberOfPets && (
                                  <div className="inline-flex items-center gap-1.5 bg-[#F3F4F6] border border-[#E5E7EB] px-3 py-1.5 rounded-full text-xs font-semibold text-gray-700">
                                    Count: {job.originalJob.numberOfPets}
                                  </div>
                                )}
                              </div>
                              {job.originalJob.petNeeds && job.originalJob.petNeeds.length > 0 && (
                                <div className="space-y-1.5">
                                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pet Needs</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {job.originalJob.petNeeds.map((need, idx) => (
                                      <span key={idx} className="inline-flex items-center bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full text-xs font-semibold text-blue-700">
                                        {need}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Handyman Details */}
                          {((job.originalJob?.fixingItems && job.originalJob.fixingItems.length > 0) || job.originalJob?.handymanUrgency || (job.originalJob?.handymanRequirements && job.originalJob.handymanRequirements.length > 0)) && (
                            <div className="space-y-3">
                              {job.originalJob.handymanUrgency && job.originalJob.handymanUrgency !== 'Normal' && (
                                <div className="inline-flex items-center gap-1.5 bg-[#F3F4F6] border border-[#E5E7EB] px-3 py-1.5 rounded-full text-xs font-semibold text-gray-700">
                                  Urgency: {job.originalJob.handymanUrgency}
                                </div>
                              )}
                              {job.originalJob.fixingItems && job.originalJob.fixingItems.length > 0 && (
                                <div className="space-y-1.5">
                                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Fixing/Installing</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {job.originalJob.fixingItems.map((item, idx) => (
                                      <span key={idx} className="inline-flex items-center bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full text-xs font-semibold text-blue-700">
                                        {item}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {job.originalJob.handymanRequirements && job.originalJob.handymanRequirements.length > 0 && (
                                <div className="space-y-1.5">
                                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Requirements</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {job.originalJob.handymanRequirements.map((req, idx) => (
                                      <span key={idx} className="inline-flex items-center bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full text-xs font-semibold text-blue-700">
                                        {req}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Extra Service Items */}
                          {job.originalJob?.extraServiceItems && job.originalJob.extraServiceItems.length > 0 && (
                            <div className="space-y-1.5">
                              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Extra Services</h4>
                              <div className="flex flex-wrap gap-2">
                                {job.originalJob.extraServiceItems.map((item, idx) => (
                                  <span key={item._id || idx} className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full text-xs font-semibold text-blue-700">
                                    {item.name || item}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Additional Specs: Plans, Council, Budget, Job Stage, and Commercial Fields */}
                          {(job.originalJob?.hasPlans || job.originalJob?.hasCouncilApproval || job.originalJob?.budget || job.originalJob?.jobStage || job.originalJob?.propertyType || job.originalJob?.commercialCleaningType || job.originalJob?.preferredCleaningTime || (job.originalJob?.areasNeedCleaning && job.originalJob?.areasNeedCleaning.length > 0)) && (
                            <div className="grid gap-3 grid-cols-1">
                              {((job.originalJob?.categoryId?.name?.toLowerCase().includes('commercial') || job.originalJob?.propertyType || job.originalJob?.commercialCleaningType) ? [
                                { label: 'Property Type', value: job.originalJob.propertyType },
                                { label: 'Cleaning Service Type', value: job.originalJob.commercialCleaningType },
                                { label: 'Areas to Clean', value: job.originalJob.areasNeedCleaning && job.originalJob.areasNeedCleaning.length > 0 ? job.originalJob.areasNeedCleaning.join(', ') : null },
                                { label: 'Preferred Time', value: job.originalJob.preferredCleaningTime },
                                { label: 'Job Stage', value: job.originalJob.jobStage },
                              ] : [
                                { label: 'Plans', value: job.originalJob.hasPlans },
                                { label: 'Council Approval', value: job.originalJob.hasCouncilApproval },
                                { label: 'Budget', value: job.originalJob.budget },
                                { label: 'Job Stage', value: job.originalJob.jobStage },
                              ]).filter(item => item.value).map((item, idx) => (
                                <div
                                  key={idx}
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

                          {/* Photos */}
                          {job.originalJob?.photos && job.originalJob.photos.length > 0 && (
                            <div className="space-y-1.5">
                              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Job Photos</h4>
                              <div className="flex flex-wrap gap-2 bg-[#E5E7EB] rounded-xl p-[6px] w-fit">
                                {job.originalJob.photos.map((photo, idx) => {
                                  const photoUrl = typeof photo === 'string' ? photo : (photo.url || photo.path || photo.secureUrl);
                                  return (
                                    <div key={idx} className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                                      <img src={photoUrl} alt={`Job Photo ${idx + 1}`} className="w-full h-full object-cover" />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Customer Info (Assigned By / Posted By) */}
                      {job.customer && (
                        <div className="flex items-center gap-2 border-t border-gray-50 pt-2">
                          <img
                            src={(() => {
                              const img = job.customer.profilePhoto || job.customer.profileImage;
                              if (!img) return `https://ui-avatars.com/api/?name=${job.customer.firstName}+${job.customer.lastName}&background=random`;
                              if (typeof img === 'string') return img;
                              return img.url || img.path || img.secureUrl || `https://ui-avatars.com/api/?name=${job.customer.firstName}+${job.customer.lastName}&background=random`;
                            })()}
                            alt="Customer"
                            className="w-6 h-6 rounded-full object-cover border border-gray-100"
                            onError={(e) => {
                              e.target.src = `https://ui-avatars.com/api/?name=${job.customer.firstName}+${job.customer.lastName}&background=random`;
                            }}
                          />
                          <p className="text-xs text-gray-400">
                            {activeTab === 'assigned' ? 'Assigned by' : 'Posted by'}{' '}
                            <span className="font-semibold text-gray-700 capitalize">{job.customer.firstName}</span>
                          </p>
                        </div>
                      )}

                      {/* Cleaner Actions: Accept / Reject */}
                      {activeTab === 'posted' && (
                        <div className="flex justify-end gap-3 border-t border-gray-100 pt-3 mt-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setJobToReject(job.id);
                              setShowRejectModal(true);
                            }}
                            className="py-2 px-5 text-xs font-semibold rounded-full border border-red-200 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all cursor-pointer text-center"
                          >
                            ✕ Reject
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setJobToAccept(job);
                              setShowAcceptModal(true);
                            }}
                            className="py-2 px-5 text-xs font-semibold rounded-full border border-[#DCE4FF] bg-[#EBF2FD] text-[#1F6FEB] hover:bg-[#1F6FEB] hover:text-white transition-all cursor-pointer text-center"
                          >
                            ✓ Accept
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {!loading && (
            <div className="px-4 pb-6 flex justify-center">
              <PaginationRanges
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                siblingCount={1}
                boundaryCount={1}
                stackProps={{ className: 'mt-6' }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Sort Modal  */}
      {showSortModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setShowSortModal(false)}
        >

          <div
            className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md mx-4 sm:mx-0 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-primary-500">Sort By</h2>
                <button
                  onClick={() => setShowSortModal(false)}
                  className="text-primary-200 font-medium hover:text-primary-600 cursor-pointer"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {/* Handle bar */}
            </div>

            {/* Modal Content */}
            <div className="px-6 py-6 space-y-6">
              {/* Distance Filter */}
              <div>
                <h3 className="text-lg font-semibold text-primary-500 mb-2">Distance</h3>
                <p className="text-sm text-primary-200 font-medium mb-4">Select your preferable distance</p>

                {/* Distance Slider */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-primary-200 font-medium mb-2">
                    <span>0 km</span>
                    <span className="font-medium text-blue-600">{distance} km</span>
                    <span>50 km</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={distance}
                    onChange={(e) => {
                      setDistance(parseInt(e.target.value));
                      setCustomDistance(''); // Clear custom input when slider is moved
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${(distance / 50) * 100}%, #E5E7EB ${(distance / 50) * 100}%, #E5E7EB 100%)`
                    }}
                  />
                </div>

                {/* Custom Distance Input */}
                <div>
                  <label className="block text-sm font-medium text-primary-200 mb-2">
                    Enter Custom Value
                  </label>
                  <input
                    type="number"
                    value={customDistance}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      setCustomDistance(e.target.value);
                      if (value >= 0 && value <= 50) {
                        setDistance(value);
                      }
                    }}
                    placeholder="Enter custom distance"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
                    min="0"
                    max="50"
                  />
                </div>
              </div>


              {/* Urgency Filter */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-primary-500 mb-1">Urgency</h3>
                  <p className="text-sm text-primary-200 font-medium">Tap on toggle to find urgent jobs</p>
                </div>
                <button
                  onClick={() => setIsUrgent(!isUrgent)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${isUrgent ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isUrgent ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3">
              <Button
                onClick={handleResetFilters}
                variant="secondary"
                size="md"
                fullWidth
                className="border-[#9CC0F6] text-"
              >
                Reset
              </Button>
              <Button
                onClick={handleApplyFilters}
                variant="primary"
                size="md"
                fullWidth
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cleaner Accept Job Confirmation Modal */}
      <ConfirmationModal
        isOpen={showAcceptModal}
        onClose={() => { setShowAcceptModal(false); setJobToAccept(null); setModalError(''); }}
        onConfirm={handleConfirmAccept}
        title="Accept Job Interest?"
        message={
          jobToAccept
            ? `Accepting this job will send an interest message to the customer. This will deduct ${getCreditsPerLeadForJob(jobToAccept)} credits from your account.`
            : "Accepting this job will deduct credits from your account."
        }
        confirmText="Confirm Accept"
        cancelText="Cancel"
        confirmButtonColor="bg-green-600 hover:bg-green-700"
        isLoading={isAccepting}
        errorMessage={modalError}
      />

      {/* Cleaner Reject Job Confirmation Modal */}
      <ConfirmationModal
        isOpen={showRejectModal}
        onClose={() => { setShowRejectModal(false); setJobToReject(null); }}
        onConfirm={handleConfirmReject}
        title="Reject Job?"
        message="Are you sure you want to reject this job? It will be hidden from your feed permanently."
        confirmText="Hide Job"
        cancelText="Cancel"
        confirmButtonColor="bg-red-500 hover:bg-red-600"
      />
    </div>
  );
};

export default CleanerJobsPage;
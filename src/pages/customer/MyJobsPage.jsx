import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import { PageHeader, PaginationRanges, Checkbox, FiltersDrawer, Loader } from '../../components';
import SearchIcon from '../../assets/search.svg';
import { SlidersHorizontal, X } from 'lucide-react';
import CalendarIcon from '../../assets/Calendar.svg';
import MapPinIcon from '../../assets/map-pin 1.png';
import UserIcon from '../../assets/user.svg';
import MessageIcon from '../../assets/message2.svg';
import ChatIcon from '../../assets/message2.svg';
import { jobsAPI, userAPI } from '../../services/api';
import { chatAPI } from '../../services/chatAPI';
import { useAuth } from '../../contexts/AuthContext';
import { getStatusChip } from '../../utils/statusUtils';

const tabs = [
  { id: 'all', label: 'All' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'completed', label: 'Completed' }
];

const dateFormatter = new Intl.DateTimeFormat('en-AU', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const formatDate = (iso) => {
  if (!iso) return '';

  try {
    const d = new Date(iso);

    if (Number.isNaN(d.getTime())) {
      console.warn('Invalid date:', iso);
      return '';
    }

    return dateFormatter.format(d);
  } catch (error) {
    console.error('Error formatting date:', iso, error);
    return '';
  }
};

// Helper function to format cleaner data from quotes (same as CustomerJobDetailsPage)
const formatCleanerData = (quote) => {
  const cleaner = quote.cleanerId || quote.cleaner;
  const cleanerId = cleaner?._id || cleaner?.id || quote.cleanerId || quote._id || quote.id;

  return {
    id: cleanerId,
    quoteId: quote._id || quote.id,
    name: cleaner ? `${cleaner.firstName || ''} ${cleaner.lastName || ''}`.trim() || `Cleaner #${cleanerId?.slice(-4)}` : 'Cleaner',
    rating: cleaner?.averageRating !== undefined ? cleaner.averageRating : (cleaner?.rating || 0),
    reviews: cleaner?.reviewCount || 0,
    tier: cleaner?.tier || 'Standard',
    quoteAmount: quote.price || quote.amount || 0,
    distance: quote.distance || cleaner?.distance || 'Distance unknown',
    isVerified: cleaner?.isVerified || false,
    estimatedDuration: quote.estimatedDuration || '2 hours',
    status: quote.status || 'pending'
  };
};

// Helper function to get message count for a job
const getMessageCountForJob = async (jobId) => {
  try {
    const response = await chatAPI.getUnreadCount();

    if (response.success && response.data) {
      // Handle different response formats
      let dataArray = [];

      if (Array.isArray(response.data)) {
        dataArray = response.data;
      } else if (response.data.messages && Array.isArray(response.data.messages)) {
        dataArray = response.data.messages;
      } else if (response.data.unreadCounts && Array.isArray(response.data.unreadCounts)) {
        dataArray = response.data.unreadCounts;
      } else if (typeof response.data === 'object') {
        // If data is an object, try to find job-specific data
        const jobData = response.data[jobId] || response.data[jobId?.toString()];
        return jobData ? (jobData.unreadCount || jobData.count || 0) : 0;
      }

      // Find messages for this specific job
      const jobMessages = dataArray.find(item =>
        item.jobId === jobId || item.jobId?._id === jobId || item.jobId?.id === jobId
      );
      return jobMessages ? (jobMessages.unreadCount || jobMessages.count || 0) : 0;
    }
    return 0;
  } catch (error) {
    console.error('Error fetching message count:', error);
    return 0;
  }
};

const MyJobsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Initialize tab from location state or localStorage
  const [activeTab, setActiveTab] = useState(() => {
    return location.state?.tab || localStorage.getItem('customerActiveTab') || 'all';
  });

  // Update tab if location state changes
  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state]);

  // Save tab to localStorage
  useEffect(() => {
    localStorage.setItem('customerActiveTab', activeTab);
  }, [activeTab]);
  const [jobs, setJobs] = useState([]);
  const [allJobs, setAllJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [bondCleaningFilter, setBondCleaningFilter] = useState(false);
  const [draftCategories, setDraftCategories] = useState([]);
  const [draftBondCleaning, setDraftBondCleaning] = useState(false);
  const [draftDate, setDraftDate] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const statusFilter = useMemo(() => {
    switch (activeTab) {
      case 'upcoming':
        return 'posted,quoted,accepted,assigned';
      case 'completed':
        return 'completed';
      default:
        return undefined;
    }
  }, [activeTab]);

  const isFiltersApplied = selectedCategories.length > 0 || bondCleaningFilter || Boolean(filterDate);
  const isDateRangeApplied = Boolean(startDate || endDate);

  const applyFilters = useCallback((jobList) => {
    let filtered = jobList;

    // Bond cleaning is currently not filtered by backend, so handle in frontend
    if (bondCleaningFilter) {
      filtered = filtered.filter((job) => Boolean(job.originalJob?.bondCleaning || job.originalJob?.isBondCleaning));
    }

    return filtered;
  }, [bondCleaningFilter]);

  useEffect(() => {
    setJobs(applyFilters(allJobs));
  }, [allJobs, applyFilters]);

  // Fetch categories and get current user ID
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch categories
        const catResponse = await jobsAPI.getCategories();
        if (catResponse.success && Array.isArray(catResponse.data)) {
          const formattedCategories = catResponse.data.map(cat => ({
            id: cat._id || cat.id,
            label: cat.name || cat.title || 'Unknown Category'
          }));
          setCategoryOptions(formattedCategories);
        }

        // Fetch user profile if needed
        if (user?.id) {
          setCurrentUserId(user.id);
        } else {
          const userProfile = await userAPI.getProfile();
          const userData = userProfile.data?.user || userProfile.data || userProfile;
          setCurrentUserId(userData?._id || userData?.id);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
        setError('Failed to load initial information');
      }
    };

    fetchInitialData();
  }, [user]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  const toggleDraftCategory = (categoryId) => {
    setDraftCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleClearFilters = () => {
    setDraftCategories([]);
    setDraftBondCleaning(false);
    setDraftDate('');
    setSelectedCategories([]);
    setBondCleaningFilter(false);
    setFilterDate('');
    setStartDate('');
    setEndDate('');
    setPage(1);
    setShowFilters(false);
  };

  const handleApplyFilters = () => {
    setSelectedCategories(draftCategories);
    setBondCleaningFilter(draftBondCleaning);
    setFilterDate(draftDate);

    if (draftDate) {
      setStartDate(draftDate);
      setEndDate(draftDate);
    } else {
      setStartDate('');
      setEndDate('');
    }

    setPage(1);
    setShowFilters(false);
  };

  useEffect(() => {
    if (showFilters) {
      setDraftCategories(selectedCategories);
      setDraftBondCleaning(bondCleaningFilter);
      setDraftDate(filterDate);
    }
  }, [showFilters, selectedCategories, bondCleaningFilter, filterDate]);

  useEffect(() => {
    const fetchJobs = async () => {
      if (!currentUserId) return;

      setLoading(true);
      setError('');

      try {
        const params = {
          page,
          limit: 10,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        };

        if (statusFilter) {
          params.status = statusFilter;
        }
        if (debouncedQuery) {
          params.search = debouncedQuery;
        }
        if (startDate) {
          params.startDate = startDate;
        }
        if (endDate) {
          params.endDate = endDate;
        }

        const response = await jobsAPI.getMyJobs({
          ...params,
          tab: activeTab === 'all' ? 'all' : activeTab,
          categoryId: selectedCategories.join(','),
        });
        const jobList = response?.data || [];
        const paginationMeta = response?.pagination;
        if (paginationMeta) {
          setTotalPages(paginationMeta.totalPages || 1);
        } else {
          setTotalPages(1);
        }

        const normalized = await Promise.all(
          jobList.map(async (job) => {
            const statusRaw = (job.status || '').toString();
            const statusLower = statusRaw.toLowerCase();
            const statusChip = getStatusChip(statusRaw);

            const address = job.location?.address || job.location?.fullAddress || '';
            const dateLabel = formatDate(job.scheduledDate || job.createdAt);
            const paymentAmount = job.payment?.amount ? `$${job.payment.amount}` : job.payment || null;

            let quoteCount = 0;
            if (typeof job.quotesCount === 'number') {
              quoteCount = job.quotesCount;
            } else if (Array.isArray(job.quotesCount)) {
              quoteCount = job.quotesCount.length;
            } else if (job.quotesReceived && job.quotesReceived > 0) {
              quoteCount = job.quotesReceived;
            }

            const shouldShowQuotes = quoteCount > 0 && !['accepted', 'in_progress', 'completed', 'pending_customer_confirmation'].includes(statusLower);
            const quotes = job.quotesReceivedDisplay || (shouldShowQuotes ? `${quoteCount} Quotes Received` : null);

            const jobIdentifier = job._id?.toString?.() || job.id || job.jobId || `job-${Math.random()}`;
            const messageCount = await getMessageCountForJob(jobIdentifier);

            const assignedCleanerName = (() => {
              const cleaner = job.assignedCleaner || job.assignedCleanerId || job.cleaner || job.completedBy;
              if (!cleaner) return null;
              const { firstName, lastName, name, fullName } = cleaner;
              const composed = `${firstName || ''} ${lastName || ''}`.trim();
              return composed || name || fullName || null;
            })();

            const title = job.title || job.serviceTypeDisplay || `${(job.serviceType || '').toString().replace(/\b\w/g, (c) => c.toUpperCase())}`.trim();

            return {
              id: jobIdentifier,
              status: statusRaw,
              statusLabel: statusChip.label,
              statusClass: statusChip.className,
              jobId: job.jobId,
              title,
              dateLabel,
              address,
              payment: paymentAmount,
              quotes,
              assignedTo: assignedCleanerName,
              category: job.categoryId?.name || 'Cleaning',
              scheduledDate: job.scheduledDate,
              createdAt: job.createdAt,
              messageCount,
              originalJob: job,
            };
          })
        );

        const sortedJobs = normalized.sort((a, b) => {
          const dateA = a.scheduledDate || a.createdAt;
          const dateB = b.scheduledDate || b.createdAt;

          if (!dateA && !dateB) return 0;
          if (!dateA) return 1;
          if (!dateB) return -1;
          return new Date(dateB) - new Date(dateA);
        });

        setAllJobs(sortedJobs);
      } catch (err) {
        console.error('Error fetching jobs:', err);
        setError('Failed to load your jobs');
        setAllJobs([]);
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [currentUserId, statusFilter, debouncedQuery, startDate, endDate, page, selectedCategories]);

  return (
    <div className="overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <PageHeader
          title="My Jobs"
          onBack={() => navigate(-1)}
          className="mb-4"
        />

        {/* Search + Calendar */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2">
              <img src={SearchIcon} alt="Search" className="w-4 h-4 sm:w-5 sm:h-5" />
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search jobs..."
              className="w-full pl-9 pr-3 py-2 sm:py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none"
            />
          </div>
          <button
            onClick={() => setShowFilters(true)}
            className={`p-2 sm:p-3 rounded-xl! border cursor-pointer transition ${isFiltersApplied || isDateRangeApplied
              ? 'bg-blue-50 border-blue-300 text-primary-500'
              : 'bg-white border-gray-200 text-gray-600'
              }`}
            title="Filters"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
          {(isFiltersApplied || isDateRangeApplied) && (
            <button
              onClick={handleClearFilters}
              className="p-2 sm:p-3 rounded-xl! bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
              title="Clear all filters"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </div>


        {/* Tabs */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-[8px]! text-sm font-medium whitespace-nowrap cursor-pointer ${activeTab === t.id ? 'bg-[#EBF2FD] text-primary-600 font-semibold' : 'bg-[#F9FAFB] text-gray-600 border border-gray-200  focus:outline-none'
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Job Cards */}
        {!currentUserId && (
          <Loader message="Loading user information..." />
        )}
        {currentUserId && loading && (
          <Loader message="Loading your jobs..." />
        )}
        {(!loading && error) && (
          <div className="text-sm text-red-600">{error}</div>
        )}
        {currentUserId && !loading && !error && jobs.length === 0 && (
          <div className="text-center py-8">
            <div className="text-sm text-gray-500 mb-2">No jobs found</div>
            <div className="text-xs text-gray-400">You haven't posted any jobs yet.</div>
          </div>
        )}
        <div className="space-y-3">
          {jobs.map((job) => (
            <div
              key={job.id}
              onClick={() => {
                if (job.status === 'completed' || job.status === 'assigned' || job.status === 'accepted') {
                  navigate(`/job-completed/${job.id}`);
                } else {
                  navigate(`/customer-job-details/${job.id}`);
                }
              }}
              className="bg-white rounded-2xl border border-gray-200 shadow-custom p-4 cursor-pointer hover:shadow-lg transition-shadow duration-200"
            >

            
              <div className="flex items-center justify-between mb-1">
                <span className="text-[12px] font-medium text-gray-500 tracking-wide capitalize">
                  {job?.category}
                </span>
                {(() => {
                  if (job.status === 'pending_customer_confirmation') {
                    return (
                      <div className={`text-[11px] px-2 py-1 rounded-full font-medium ${job.statusClass} text-center`}>
                        {job.statusLabel}
                      </div>
                    );
                  }
                  // Show quotes badge only if it's not an active/pending job
                  else if (job.quotes && !['in_progress', 'started', 'pending_customer_confirmation', 'completed'].includes(job.status)) {
                    return (
                      <div className="flex items-center gap-1.5 bg-[#DDEFFF] px-2 py-1 rounded-full">
                        <div className="w-2 h-2 bg-[#0088FF] rounded-full"></div>
                        <span className="text-xs font-medium text-[#0088FF]">
                          {job.quotes}
                        </span>
                      </div>
                    );
                  } else {
                    return (
                      <div className={`text-[11px] px-2 py-1 rounded-full font-medium ${job.statusClass} text-center`}>
                        {job.statusLabel}
                      </div>
                    );
                  }
                })()}
              </div>

              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 leading-tight">
                {job.title}
              </h3>

              <div className="space-y-2">
                {/* Assigned cleaner */}
                {(['in_progress', 'accepted', 'on_the_way', 'started'].includes(job.status) && job.assignedTo) && (
                  <div className="flex items-center text-sm text-gray-600 font-medium">
                    <img src={UserIcon} alt="Assigned" className="w-4 h-4 mr-2 opacity-70" />
                    {job.assignedTo}
                  </div>
                )}

                <div className="flex items-center text-sm text-gray-600 font-medium">
                  <img src={CalendarIcon} alt="Date" className="w-4 h-4 mr-2 opacity-70" />
                  {job.dateLabel}
                </div>

                <div className="flex items-center text-sm text-gray-600 font-medium">
                  <img src={MapPinIcon} alt="Location" className="w-4 h-4 mr-2 opacity-70" />
                  <span className="line-clamp-1">{job.address}</span>
                </div>
              </div>

              {/* Footer Row */}
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {job.payment ? (() => {
                    const match = (job.payment || '').match(/^\s*([$£€₹]?\d+(?:[.,]\d{1,2})?)/);
                    const amount = match ? match[1] : null;
                    const rest = amount ? job.payment.slice(match[0].length) : '';
                    return (
                      <div className="text-[11px] sm:text-xs text-primary-200 font-medium">
                        Payment: {amount ? (<><span className="text-primary-600 font-semibold">{amount}</span>{rest}</>) : job.payment}
                      </div>
                    );
                  })() : <span />}

                  {/* Message Count Badge */}
                  {job.messageCount > 0 && (
                    <div className="flex items-center gap-1">
                      <img src={MessageIcon} alt="Messages" className="w-3 h-3" />
                      <span className="text-[10px] sm:text-xs font-medium bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                        {job.messageCount} new
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Chat Button for Accepted Jobs only (not in_progress) */}
                  {job.status === 'accepted' && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();

                        try {
                          // Fetch detailed job data for accepted jobs
                          const jobResponse = await jobsAPI.getJobById(job.id);
                          let jobData = job.originalJob || job;

                          if (jobResponse.success && jobResponse.data) {
                            jobData = jobResponse.data;
                          }

                          const acceptedQuote = jobData.quotes?.find(quote => quote.status === 'accepted');

                          if (acceptedQuote) {
                            const cleanerData = formatCleanerData(acceptedQuote);

                            if (cleanerData.id && cleanerData.id !== 'undefined' && cleanerData.id !== 'null') {
                              navigate(`/customer-chat/${job.id}?cleaner=${cleanerData.id}`);
                            }

                          }
                        } catch (error) {
                          console.error('Error fetching job details for chat:', error);
                        }
                      }}
                      className="text-primary-600 px-3 py-2 rounded-full font-medium transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer text-sm border border-[#9CC0F6] shadow-custom"
                    >
                      <img src={ChatIcon} alt="Chat" className="w-4 h-4" />
                      Chat with Cleaner
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>


        <PaginationRanges
          count={totalPages}
          page={page}
          onChange={(_, value) => setPage(value)}
          siblingCount={1}
          boundaryCount={1}
          stackProps={{ className: 'mt-6' }}
        />
      </div>
      <FiltersDrawer
        open={showFilters}
        onClose={() => setShowFilters(false)}
        categories={categoryOptions}
        draftCategories={draftCategories}
        onToggleCategory={toggleDraftCategory}
        draftBondCleaning={draftBondCleaning}
        onToggleBondCleaning={() => setDraftBondCleaning((prev) => !prev)}
        draftDate={draftDate}
        onDateChange={(value) => setDraftDate(value)}
        onClear={handleClearFilters}
        onApply={handleApplyFilters}
      />
    </div>
  );
};

export default MyJobsPage;
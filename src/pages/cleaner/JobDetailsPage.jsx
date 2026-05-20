import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { PageHeader, JobOverviewCard, ConfirmationModal } from '../../components';
import ChatIcon from '../../assets/message2.svg';
import { jobsAPI, subscriptionsAPI } from '../../services/api';
import { Wallet, Clock3, Home as HomeIcon, Ruler, AlertTriangle, CalendarDays, Trash2, Info, CheckCircle2, Phone, Mail } from 'lucide-react';

const JobDetailsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isContacted, setIsContacted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [modalError, setModalError] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(true);
  const [isWaitlisted, setIsWaitlisted] = useState(false);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [isWaitlistLoading, setIsWaitlistLoading] = useState(false);

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch job details from API
        const response = await jobsAPI.getJobById(jobId);


          if (response.success && response.data) {
          const jobData = response.data;
          setJob(jobData);
          setIsSubscribed(jobData.isSubscribed);

          // Check if current cleaner has already contacted or is connected
          const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
          const currentUserId = currentUser.id || currentUser._id;
          
          const contacted = (jobData.contactedCleaners || []).some(c => 
            (c.cleanerId?._id || c.cleanerId) === currentUserId
          );
          setIsContacted(contacted);

          const isAssignedStatus = ['assigned', 'accepted', 'on_the_way', 'started', 'in_progress'].includes(jobData.status);
          setIsConnected(contacted || isAssignedStatus);
          
          const waitlisted = (jobData.waitlistedCleaners || []).some(w => 
            (w.cleanerId?._id || w.cleanerId) === currentUserId
          );
          setIsWaitlisted(jobData.isWaitlisted || waitlisted || false);
        } else {
          setError('Job not found');
        }
      } catch (err) {
        console.error('Error fetching job details:', err);
        setError('Failed to load job details');
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchJobDetails();
    }
  }, [jobId]);


  const resolveImageSrc = (image) => {
    if (!image) return '';
    if (typeof image === 'string') return image;
    return image.url || image.path || image.secureUrl || '';
  };

  const jobPhotos = useMemo(() => {
    if (!job) return [];
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
    // Figma expects the service type name as the title
    return job?.serviceTypeId?.name || job?.serviceType?.name || job?.serviceType || job?.title || 'Job Details';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }) + ', ' + date.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
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
  const jobFrequencyLabel = getJobFrequency(job);
  const fromTab = location.state?.fromTab;

  const currentUserId = useMemo(() => {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    return currentUser.id || currentUser._id || null;
  }, []);

  const myQuote = useMemo(() => {
    if (!job || !currentUserId) return null;
    
    // Check in quotes array
    const quotes = Array.isArray(job.quotes) ? job.quotes : [];
    const fromQuotes = quotes.find((q) => {
      const qCleanerId = q?.cleanerId?._id || q?.cleanerId || q?.cleaner?._id || q?.cleaner;
      return qCleanerId?.toString() === currentUserId?.toString();
    });

    if (fromQuotes) return fromQuotes;

    // Fallback: Check in contactedCleaners array (requests)
    const contacted = Array.isArray(job.contactedCleaners) ? job.contactedCleaners : [];
    const fromContacted = contacted.find((c) => {
      const cCleanerId = c?.cleanerId?._id || c?.cleanerId || c?.cleaner?._id || c?.cleaner;
      return cCleanerId?.toString() === currentUserId?.toString();
    });

    return fromContacted || null;
  }, [job, currentUserId]);


  const canWithdrawBid = useMemo(() => {
    if (!myQuote || !job) return false;
    
    // If the job is already assigned to SOMEONE (including me) or in progress, usually can't withdraw bid
    const isJobAssigned = ['on_the_way', 'started', 'in_progress', 'completed'].includes(job.status?.toLowerCase());
    if (isJobAssigned) return false;

    const quoteStatus = (myQuote.status || '').toLowerCase();
    // allow withdraw if still pending / waiting / connected / accepted (as long as job is still 'posted' or 'quoting')
    return !['withdrawn', 'rejected'].includes(quoteStatus);
  }, [myQuote, job]);



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

    // Show customer contact info ONLY if connected
    if (isConnected && job.customerId) {
      if (job.customerId.phone) {
        meta.push({
          label: 'Customer Phone',
          value: job.customerId.phone,
          icon: <span className="text-primary-400">📞</span>,
        });
      }
      if (job.customerId.email) {
        meta.push({
          label: 'Customer Email',
          value: job.customerId.email,
          icon: <span className="text-primary-400">📧</span>,
        });
      }
    }

    return meta;
  }, [job]);

  // Figma/Web: Chat should open directly (no intro popup)
  const handleChatWithCustomer = () => {
    if (!isSubscribed && !isContacted) {
      navigate('/my-subscription');
      return;
    }
    navigate(`/chat/${jobId}`);
  };

  const handleJoinWaitlist = async () => {
    try {
      setIsWaitlistLoading(true);
      const res = await jobsAPI.joinWaitlist(jobId);
      if (res.success) {
        setIsWaitlisted(true);
        setShowWaitlistModal(false);
      } else {
        alert(res.message || 'Failed to join waitlist');
      }
    } catch (err) {
      console.error('Error joining waitlist:', err);
      alert('Failed to join waitlist. Please try again.');
    } finally {
      setIsWaitlistLoading(false);
    }
  };

  const handleLeaveWaitlist = async () => {
    try {
      setIsWaitlistLoading(true);
      const res = await jobsAPI.leaveWaitlist(jobId);
      if (res.success) {
        setIsWaitlisted(false);
      } else {
        alert(res.message || 'Failed to leave waitlist');
      }
    } catch (err) {
      console.error('Error leaving waitlist:', err);
      alert('Failed to leave waitlist. Please try again.');
    } finally {
      setIsWaitlistLoading(false);
    }
  };


  if (loading) {
    return null;
  }

  if (error || !job) {
    return (
      <>
        <div className="max-w-sm mx-auto min-h-screen sm:max-w-2xl lg:max-w-4xl xl:max-w-6xl">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="text-center py-8">
              <div className="text-red-500 text-lg font-medium">{error || 'Job not found'}</div>
              <button
                onClick={() => navigate(-1)}
                className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="max-w-sm mx-auto sm:max-w-2xl lg:max-w-4xl xl:max-w-7xl">
        <PageHeader
          title={getJobTitle(job)}
          onBack={() => {
            const savedTab = localStorage.getItem('cleanerActiveTab');
            navigate('/cleaner-jobs', { state: { tab: savedTab || 'live-jobs' }, replace: true });
          }}
          className="px-4 sm:px-6 lg:px-8 py-4"
        />

        <div className="px-4 sm:px-6 lg:px-8 pb-6">
          {/* Job Overview Card */}
          <div className="mb-4">
            <JobOverviewCard
              jobId={job?.jobId || job?.referenceId || job?._id?.slice(-6)}
              // Figma: show Category / ServiceType on top line, and ServiceType as title
              propertyType={job?.categoryId?.name || job?.category || 'Cleaning'}
              serviceTypeId={job?.serviceTypeId}
              title={job?.serviceTypeId?.name || getJobTitle(job)}
              showQuotePill={false}
              serviceType={job?.categoryId?.name || job?.category || ''}
              serviceDetail={job?.serviceTypeId?.name || serviceDetail}
              instructions={
                job?.specialInstructions ||
                job?.instructions ||
                job?.additionalNotes ||
                ''
              }
              scheduledDate={scheduledDateLabel}
              frequency={jobFrequencyLabel}
              location={job?.location?.address || job?.address || job?.locationDescription || 'Location not specified'}
              photos={jobPhotos}
              viewerRole="cleaner"
              metaInfo={jobOverviewMeta}
              roomsNeedCleaning={job?.roomsNeedCleaning}
              bathroomsNeedCleaning={job?.bathroomsNeedCleaning}
            />
          </div>

          {/* Posted By Section (from mockup) */}
          {job.customerId && (
            <div className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img 
                    src={job.customerId.profileImage || `https://ui-avatars.com/api/?name=${job.customerId.firstName}+${job.customerId.lastName}`} 
                    alt="Customer" 
                    className="w-12 h-12 rounded-full border border-gray-200 object-cover" 
                  />
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Posted by</p>
                    <p className="text-md font-medium text-primary-500 capitalize">{job.customerId.firstName} {job.customerId.lastName}</p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleChatWithCustomer}
                    disabled={job.contactedCount >= 3 && !isContacted}
                    className={`flex items-center gap-3 px-4 py-2 rounded-full font-semibold text-sm border transition-colors ${
                      (job.contactedCount >= 3 && !isContacted)
                        ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                        : (!isSubscribed && !isContacted)
                          ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 cursor-pointer'
                          : 'bg-[#F1F6FF] text-primary-600 border-[#E0EAFF] hover:bg-blue-50 cursor-pointer'
                    }`}
                  >
                    <img src={ChatIcon} alt="Chat" className={`w-4 h-4 ${(job.contactedCount >= 3 && !isContacted) ? 'grayscale opacity-50' : ''}`} />
                     {!isSubscribed && !isContacted ? 'Subscribe to Chat' : 'Chat'}
                  </button>
                </div>
              </div>

              {/* Waitlist Section */}
              {job.contactedCount >= 3 && !isContacted && (
                <div className="mt-6 pt-6 border-t border-gray-50">
                   {!isWaitlisted ? (
                    <>
                      <div className="bg-[#F8FAFF] border border-[#E8EFFF] rounded-2xl p-5 mb-4 flex gap-4">
                        <div className="bg-primary-50 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                          <Info className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="text-[15px] font-bold text-gray-900 mb-1">
                            {job.contactedCount} cleaners have already contacted the customer.
                          </p>
                          <p className="text-sm text-gray-500 leading-relaxed">
                            Join the waitlist to be considered if the customer hasn't chosen anyone within 24 hours.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (!isSubscribed) {
                            navigate('/my-subscription');
                            return;
                          }
                          setShowWaitlistModal(true);
                        }}
                        className="w-full py-3.5 bg-primary-500 text-white rounded-xl font-bold text-base hover:bg-primary-600 transition-all shadow-lg shadow-primary-100 cursor-pointer active:scale-[0.98]"
                      >
                        {!isSubscribed ? 'Subscribe to Join Waitlist' : 'Join Waitlist'}
                      </button>
                    </>
                   ) : (
                    <>
                      <div className="bg-[#F8FAFF] border border-[#E8EFFF] rounded-2xl p-5 mb-4 flex gap-4">
                         <div className="bg-primary-50 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="text-[15px] font-bold text-gray-900 mb-1">
                            You're on the waitlist
                          </p>
                          <p className="text-sm text-gray-500">
                            We'll notify you if the customer contacts you.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleLeaveWaitlist}
                        disabled={isWaitlistLoading}
                        className="w-full py-3.5 border border-gray-200 text-gray-600 rounded-xl font-bold text-base hover:bg-gray-50 transition-all cursor-pointer active:scale-[0.98]"
                      >
                        {isWaitlistLoading ? 'Leaving...' : 'Leave Waitlist'}
                      </button>
                    </>
                   )}
                </div>
              )}
            </div>
          )}

          {/* Contact Details - only show if connected */}
          {job.customerId && isConnected && (job.customerId.phone || job.customerId.email) && (
            <div className="mb-4 rounded-xl bg-white overflow-hidden">
              <div className="px-5 py-5">
                <h4 className="text-[13px] font-bold text-gray-700 mb-5 tracking-wide uppercase">
                  Customer Contact Details
                </h4>
                
                <div className="flex flex-col">
                  {job.customerId.phone && (
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-[#F4F3ED] flex items-center justify-center flex-shrink-0">
                        <Phone className="w-5 h-5 text-gray-700" strokeWidth={2} />
                      </div>
                      <div>
                        <div className="text-[12px] text-gray-500 font-medium">Phone</div>
                        <div className="text-[15px] font-medium text-gray-900 mt-0.5">{job.customerId.phone}</div>
                      </div>
                    </div>
                  )}
                  
                  {job.customerId.phone && job.customerId.email && (
                    <div className="h-px bg-gray-200 my-4 w-full"></div>
                  )}
                  
                  {job.customerId.email && (
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-[#F4F3ED] flex items-center justify-center flex-shrink-0">
                        <Mail className="w-5 h-5 text-gray-700" strokeWidth={2} />
                      </div>
                      <div>
                        <div className="text-[12px] text-gray-500 font-medium">Email</div>
                        <div className="text-[15px] font-medium text-gray-900 mt-0.5">{job.customerId.email}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            {/* Show "I'm on the way" button only if assigned to me */}
            {(() => {
              const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
              const currentUserId = currentUser.id || currentUser._id;
              const isAssigned = ['assigned', 'accepted', 'on_the_way', 'started', 'in_progress'].includes(job.status);
              const isAssignedToMe = job.assignedCleanerId === currentUserId || 
                                    job.assignedCleanerId?._id === currentUserId ||
                                    job.cleanerId === currentUserId ||
                                    job.cleanerId?._id === currentUserId;
              
              if (isAssigned && isAssignedToMe) {
                return (
                  <button
                    onClick={async () => {
                      try {
                        const response = await jobsAPI.updateJobStatus(jobId, 'on_the_way');
                        if (response.success) {
                          navigate(`/in-progress-job/${jobId}`);
                        } else {
                          alert(response.message || 'Failed to update status');
                        }
                      } catch (err) {
                        console.error('Error updating status:', err);
                        alert('Failed to update status. Please try again.');
                      }
                    }}
                    className="bg-green-600 text-white cursor-pointer shadow-custom border border-green-100 font-medium py-2 px-4 sm:py-3 sm:px-6 rounded-xl transition-colors duration-200 flex items-center gap-2 hover:bg-green-700"
                  >
                    I'm On The Way
                  </button>
                );
              }
              return null;
            })()}
          </div>
        </div>
      </div>

      {/* Sticky bottom action (Figma) */}
      {canWithdrawBid && (
  <div className="w-full flex justify-center items-center py-10">
    <button
      type="button"
      onClick={() => { setModalError(''); setShowWithdrawModal(true); }}
       className="flex items-center gap-3 px-5 py-2 rounded-full bg-[#FFE4E4B2] text-[#EF4444] font-medium text-md cursor-pointer"
    >
       <Trash2 className="w-5 h-5" strokeWidth={2.2} />
      Withdraw Bid
    </button>
  </div>
)}

      <ConfirmationModal
        isOpen={showWithdrawModal}
        onClose={() => { if (isWithdrawing) return null; setShowWithdrawModal(false); setModalError(''); }}
        title="Withdraw Request?"
        message="Are you sure you want to withdraw your request? You will need to contact the customer again if you change your mind."
        confirmText="Withdraw"
        cancelText="Cancel"

        confirmButtonColor="bg-[#EF4444] hover:bg-red-600"
        errorMessage={modalError}
        autoCloseAfter={3000}
        isLoading={isWithdrawing}
        onConfirm={async () => {
          try {
            setIsWithdrawing(true);
            const res = await jobsAPI.withdrawBid(jobId);
            if (!res?.success) {
              setModalError(res?.message || 'Failed to withdraw bid');
              return;
            }
            setShowWithdrawModal(false);
            navigate('/cleaner-jobs', { state: { tab: 'my-bids' }, replace: true });
          } catch (e) {
            setModalError(e?.message || 'Failed to withdraw bid');
          } finally {
            setIsWithdrawing(false);
          }
        }}
      />

      <ConfirmationModal
        isOpen={showWaitlistModal}
        onClose={() => setShowWaitlistModal(false)}
        onConfirm={handleJoinWaitlist}
        title="Join Waitlist"
        message="You'll be added to the waitlist for this job."
        confirmText="Join Waitlist"
        cancelText="Cancel"
        confirmButtonColor="bg-primary-500 hover:bg-primary-600"
        isLoading={isWaitlistLoading}
        centerTitle={false}
        centerMessage={false}
      >
        <div className="space-y-4 py-2">
          {[
            "The customer can view waitlisted cleaners after 24 hours",
            "If no cleaner is selected, the customer may contact you",
            "You'll be notified if the customer messages you"
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div className="p-0.5 rounded-full border border-gray-300 mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-primary-500" />
              </div>
              <p className="text-sm text-gray-500 leading-tight">{item}</p>
            </div>
          ))}
        </div>
      </ConfirmationModal>
    </>
  );
};

export default JobDetailsPage;

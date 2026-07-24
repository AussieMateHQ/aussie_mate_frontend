import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { UserRound, CalendarDays, Clock3, Mail } from 'lucide-react';
import { Button, Loader, JobOverviewCard } from '../../components';
import MessageIcon from '../../assets/message2.svg';
import CallIcon from '../../assets/phone2.svg';
import CallIcon2 from '../../assets/phone.svg';
import InfoIcon from '../../assets/info.svg';
import JobLiveIcon from '../../assets/joblive.gif';
import { jobsAPI, userAPI } from '../../services/api';
import { useGoogleAds } from '../../hooks/useGoogleAds';

// Helper functions moved outside component
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


const JobBookedSuccessfullyPage = () => {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState(null);
  const [jobData, setJobData] = useState(null);
  const [jobPhotos, setJobPhotos] = useState([]);
  const [cleaner, setCleaner] = useState(null);
  const [error, setError] = useState('');
  const [showSuccessHeader, setShowSuccessHeader] = useState(true);
  const { trackBookingCompleted } = useGoogleAds();
  // Show animation only once per booking (check sessionStorage)
  const [showAnimation, setShowAnimation] = useState(() => {
    const hasSeenAnimation = sessionStorage.getItem(`animation-seen-${jobId}`);
    return !hasSeenAnimation;
  });

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setLoading(true);


        const response = await jobsAPI.getJobById(jobId);

        if (response.success && response.data) {
          const fetchedJobData = response.data;
          setJobData(fetchedJobData);

          // Process job photos
          const resolveImageSrc = (image) => {
            if (!image) return null;
            if (typeof image === 'string') return image;
            if (image.url) return image.url;
            if (image.path) return image.path;
            return null;
          };

          // Only show original job photos, not completion proof photos
          const photos = fetchedJobData.photos || fetchedJobData.images || [];
          const processedPhotos = photos.map(resolveImageSrc).filter(Boolean);
          setJobPhotos(processedPhotos);

          let acceptedQuote = fetchedJobData.quotes?.find(q => q.status === 'accepted');

          // Fallback: If no "accepted" quote, but job is assigned/in_progress, find the assigned cleaner's quote
          if (!acceptedQuote && (fetchedJobData.status === 'assigned' || fetchedJobData.status === 'in_progress')) {
            const assignedId = fetchedJobData.assignedCleanerId?._id || fetchedJobData.assignedCleanerId || fetchedJobData.assignedCleaner?._id || fetchedJobData.assignedCleaner;
            
            if (assignedId) {
              acceptedQuote = fetchedJobData.quotes?.find(q => {
                const qCleanerId = q.cleanerId?._id || q.cleanerId;
                return qCleanerId === assignedId;
              });
            }
          }

          // If still no quote object found, but job is assigned, create a minimal quote object from job data
          if (!acceptedQuote && (fetchedJobData.status === 'assigned' || fetchedJobData.status === 'in_progress')) {
            acceptedQuote = {
              price: fetchedJobData.price || 0,
              basePrice: fetchedJobData.basePrice || 0,
              addOns: fetchedJobData.addOns || 0,
              cleanerId: fetchedJobData.assignedCleanerId || fetchedJobData.assignedCleaner
            };
          }

          if (!acceptedQuote) {
            setError('No accepted quote found');
            setLoading(false);
            return;
          }

          const formatDate = (dateString) => {
            if (!dateString) return 'Date not set';
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'short',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            });
          };


          let cleanerInfo = acceptedQuote.cleanerId || acceptedQuote.cleaner;

          // If cleanerInfo is just an ID string, fetch full cleaner details
          if (typeof cleanerInfo === 'string' || (cleanerInfo && !cleanerInfo.firstName && !cleanerInfo.name)) {
            const cleanerId = typeof cleanerInfo === 'string' 
              ? cleanerInfo 
              : cleanerInfo?._id || cleanerInfo?.id || fetchedJobData.cleanerId;
            
            if (cleanerId) {
              try {
                const cleanerResponse = await userAPI.getUserById(cleanerId);
                if (cleanerResponse.success) {
                  cleanerInfo = cleanerResponse.data.user || cleanerResponse.data || cleanerInfo;
                }
              } catch (cleanerError) {
                console.error('Error fetching cleaner details:', cleanerError);
              }
            }
          }

          // Fallback to job's cleanerId if still not found
          if (!cleanerInfo || (!cleanerInfo.firstName && !cleanerInfo.name)) {
            cleanerInfo = fetchedJobData.cleanerId || fetchedJobData.assignedCleaner || {};
          }

          const cleanerName = cleanerInfo.firstName && cleanerInfo.lastName
            ? `${cleanerInfo.firstName} ${cleanerInfo.lastName}`
            : cleanerInfo.name || 'Cleaner';

          let paymentMethod = 'online';
          let onlineAmount = Math.round((acceptedQuote.price || 0) * 0.1);
          let cashAmount = Math.round((acceptedQuote.price || 0) * 0.9);

          // Set job data for payment summary
          setJob({
            jobId: fetchedJobData.jobId || jobId,
            title: fetchedJobData.title || `${fetchedJobData.serviceType}`,
            scheduledDate: formatDate(fetchedJobData.scheduledDate),
            location: fetchedJobData.location?.address || fetchedJobData.location?.fullAddress || 'Location not specified',
            baseQuote: acceptedQuote.basePrice || acceptedQuote.price || 0,
            addOns: acceptedQuote.addOns || 0,
            total: acceptedQuote.price || 0,
            paymentMethod: paymentMethod,
            onlinePaid: onlineAmount,
            cashAmount: cashAmount,
            status: fetchedJobData.status || 'accepted'
          });

          // 🎯 Google Ads: Cleaning booking completed conversion
          trackBookingCompleted({ value: acceptedQuote.price || 0, currency: 'AUD' });

          // Resolve avatar URL from multiple possible sources
          let avatarUrl = '';
          
          const resolveImageUrl = (image) => {
            if (!image) return '';
            if (typeof image === 'string') return image;
            if (image.url) return image.url;
            if (image.path) return image.path;
            if (image.secureUrl) return image.secureUrl;
            return '';
          };

          if (cleanerInfo.profilePhoto) {
            avatarUrl = resolveImageUrl(cleanerInfo.profilePhoto);
          } else if (cleanerInfo.profilePicture) {
            avatarUrl = resolveImageUrl(cleanerInfo.profilePicture);
          } else if (cleanerInfo.avatar) {
            avatarUrl = resolveImageUrl(cleanerInfo.avatar);
          } else if (cleanerInfo.image) {
            avatarUrl = resolveImageUrl(cleanerInfo.image);
          } else if (cleanerInfo.photo) {
            avatarUrl = resolveImageUrl(cleanerInfo.photo);
          }


          // Extract cleaner ID - try multiple possible field names
          const cleanerId = cleanerInfo._id || 
                           cleanerInfo.id || 
                           cleanerInfo.userId || 
                           acceptedQuote.cleanerId?._id ||
                           (typeof acceptedQuote.cleanerId === 'string' ? acceptedQuote.cleanerId : null);

          setCleaner({
            id: cleanerId,
            name: cleanerName,
            phone: cleanerInfo.phone || cleanerInfo.phoneNumber || cleanerInfo.mobile || 'Not available',
            email: cleanerInfo.email || '',
            avatar: avatarUrl,
            rating: cleanerInfo.averageRating !== undefined ? cleanerInfo.averageRating : (cleanerInfo.rating || 0),
            status: 'Booked'
          });

        } else {
          setError('Failed to load job details');
        }
      } catch (error) {
        console.error('Error fetching job details:', error);
        setError('Failed to load job details');
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchJobDetails();
    }
  }, [jobId]);

  // Hide animation after 3 seconds and mark as seen
  useEffect(() => {
    if (showAnimation) {
      const timer = setTimeout(() => {
        setShowAnimation(false);
        sessionStorage.setItem(`animation-seen-${jobId}`, 'true');
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [showAnimation, jobId]);

  // Hide success header message after 3 seconds of being visible
  useEffect(() => {
    if (!loading && !showAnimation) {
      const timer = setTimeout(() => {
        setShowSuccessHeader(false);
      }, 3000); // Show for 3 seconds
      return () => clearTimeout(timer);
    }
  }, [loading, showAnimation]);

  const handleChatWithCleaner = () => {
    if (cleaner?.id) {
      navigate(`/customer-chat/${jobId}?cleaner=${cleaner.id}`);
    } else {
      navigate(`/customer-chat/${jobId}`);
    }
  };

  const handleCallCleaner = () => {
    if (cleaner?.phone && cleaner.phone !== 'Not available') {
      window.location.href = `tel:${cleaner.phone}`;
    }
  };

  const handleViewBooking = () => {
    navigate('/my-jobs', { replace: true });
  };

  const handleReturnHome = () => {
    navigate('/customer-dashboard', { replace: true });
  };

  if (loading) {
    return <Loader fullscreen message="Loading booking details..." />;
  }

  if (error || !job) {
    return (
      <>
        <div className="max-w-sm mx-auto sm:max-w-2xl lg:max-w-4xl xl:max-w-6xl px-4 py-8">
          <div className="text-center">
            <div className="text-red-500 text-lg font-medium mb-4">{error || 'Job not found'}</div>
            <Button onClick={() => navigate('/my-jobs')} size="md">
              Go to My Jobs
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Full Screen Animation Overlay - Shows once then disappears */}
      {showAnimation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white animate-fadeIn">
          <div className="text-center animate-scaleIn">
            <img 
              src={JobLiveIcon} 
              alt="Success Animation" 
              className="w-64 h-64 sm:w-80 sm:h-80 mx-auto object-contain drop-shadow-2xl" 
            />
            <h1 className="text-2xl sm:text-3xl font-bold text-primary-500 mt-6 animate-pulse">
              Booking Successful! 🎉
            </h1>
          </div>
        </div>
      )}

      <div className="max-w-sm mx-auto sm:max-w-2xl lg:max-w-4xl xl:max-w-6xl px-4 py-6">
        {/* Confirmation Header */}
        {showSuccessHeader && (
          <div className="text-center mb-8 animate-fadeIn">
            <h1 className="text-2xl font-semibold text-primary-500 mb-2">
              Your job is booked successfully with {cleaner?.name}
            </h1>
          </div>
        )}

        {/* Job Details Card */}
        {jobData && (
          <div className="mb-6">
            <JobOverviewCard
              jobId={`#${jobData.jobId || jobId}`}
              title={jobData.title || `${jobData.serviceType}`}
              serviceTypeId={jobData.serviceTypeId}
              serviceType={jobData.serviceType || jobData.category || jobData.service}
              serviceDetail={jobData.selectedServiceDetail || jobData.serviceDetail || jobData.service?.name || ''}
              instructions={jobData.specialInstructions || jobData.instructions || jobData.additionalNotes || ''}
              scheduledDate={job?.scheduledDate || ''}
              frequency={getFrequencyDisplay(jobData)}
              location={jobData.location?.address || jobData.location?.fullAddress || jobData.address || 'Location not specified'}
              photos={jobPhotos}
              viewerRole="customer"
              showQuotePill={false}
              metaInfo={[
                { label: 'Total Amount', value: `$${job?.total || 0}` },
                ...(getPreferredDaysDisplay(jobData?.preferredDays) ? [{
                  label: 'Preferred Days',
                  value: getPreferredDaysDisplay(jobData?.preferredDays),
                  icon: <CalendarDays className="w-4 h-4 text-primary-400" strokeWidth={2.2} />
                }] : []),
                ...(getRepeatWeeksDisplay(jobData?.repeatWeeks) ? [{
                  label: 'Duration',
                  value: getRepeatWeeksDisplay(jobData?.repeatWeeks),
                  icon: <Clock3 className="w-4 h-4 text-primary-400" strokeWidth={2.2} />
                }] : []),
              ]}
            />
          </div>
        )}

        {/* Your Cleaner Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-primary-500 mb-4">Your cleaner</h3>

          {/* Cleaner Card */}
          <div className="bg-white rounded-2xl shadow-custom p-4 sm:p-6">
            <div className="flex items-center gap-4 justify-between flex-col sm:flex-row ">
              <div className="flex items-center gap-4 ">
                {/* Cleaner Avatar */}
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {cleaner?.avatar ? (
                    <img
                      src={cleaner.avatar}
                      alt={cleaner.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserRound className="w-8 h-8 text-gray-400" strokeWidth={2} />
                  )}
                </div>

                {/* Cleaner Details */}
                <div className="flex-2">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-semibold text-primary-500">{cleaner?.name}</h4>
                    <span className="bg-yellow-500 text-yellow-500 text-xs font-medium px-2 py-1 rounded-full border border-yellow-500">
                      {job?.status === 'in_progress' ? 'In Progress' : 'Booked'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {cleaner?.phone && cleaner.phone !== 'Not available' && (
                      <div className="flex items-center gap-2">
                        <img src={CallIcon2} alt="Phone" className="w-4 h-4 text-primary-200" />
                        <span className="text-sm text-primary-500 font-medium">{cleaner.phone}</span>
                      </div>
                    )}

                    {cleaner?.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-primary-200 flex-shrink-0" strokeWidth={2} />
                        <span className="text-sm text-primary-500 font-medium break-all">{cleaner.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                {/* Chat Button */}
                <Button
                  onClick={handleChatWithCleaner}
                  variant="secondary"
                  size="md"
                  icon={MessageIcon}
                >

                </Button>
                
                {/* Call Button */}
                <Button
                  onClick={handleCallCleaner}
                  variant="secondary"
                  size="md"
                  icon={CallIcon}
                  disabled={!cleaner?.phone || cleaner.phone === 'Not available'}
                >

                </Button>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <img src={InfoIcon} alt="Info" className="w-5 h-5 text-primary-200" />
              <p className="text-sm text-primary-200 font-medium">
                Your cleaning job is completed.
              </p>
            </div>
          </div>
        </div>

        {/* Notification */}


        {/* Main Action Buttons */}
        <div className="flex gap-4 flex-col sm:flex-row justify-end">
          <Button
            onClick={handleReturnHome}
            variant="secondary"
            className="flex"
          >
            Return Home
          </Button>
          <Button
            onClick={handleViewBooking}
            className="flex"
          >
            View Booking
          </Button>
        </div>
      </div>
    </>
  );
};

export default JobBookedSuccessfullyPage;

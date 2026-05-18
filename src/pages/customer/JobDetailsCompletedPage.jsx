import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Check, UserRound, X, Phone, MessageSquare, Calendar, MapPin, CalendarDays } from 'lucide-react';
import { Button, PageHeader, Loader } from '../../components';
import RatingIcon from '../../assets/Rating1.svg';
import Rating2Icon from '../../assets/rating3.svg';
//import PdfIcon from '../../assets/pdf.svg';
//import DownloadIcon from '../../assets/download.svg';
import GoldBadgeIcon from '../../assets/goldBadge.svg';
import SilverBadgeIcon from '../../assets/silverBadge.svg';
import BronzeBadgeIcon from '../../assets/bronzeBadge.svg';
import { jobsAPI, jobPhotosAPI, jobDetailsAPI, reviewsAPI } from '../../services/api';
import { handleAPIError } from '../../services/api';

const JobDetailsCompletedPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedRating, setSelectedRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [jobData, setJobData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [invoiceData, setInvoiceData] = useState(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [existingReview, setExistingReview] = useState(null);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [completingJob, setCompletingJob] = useState(false);
  const [occurrences, setOccurrences] = useState([]);
  const [workProgress, setWorkProgress] = useState(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const resolveImageSrc = (image) => {
    if (!image) return '';
    if (typeof image === 'string') return image;
    return image.url || image.path || image.secureUrl || '';
  };

  const overviewPhotos = useMemo(() => {
    if (!jobData) return [];
    // Only show original job photos, not completion proof photos
    const jobPhotos = jobData.photos || [];
    return jobPhotos.map(resolveImageSrc).filter(Boolean);
  }, [jobData]);


  const feedbackTags = [
    'Punctual', 'Professional', 'Quality Work', 'Friendly', 'Good Communication'
  ];

  const handleTagSelect = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // Fetch job details and invoice data
  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setLoading(true);

        // Try to get customer progress data first (for weekly jobs)
        let progressResponse;
        try {
          progressResponse = await jobsAPI.getCustomerProgress(jobId);
          console.log('📊 Customer progress data:', progressResponse);
        } catch (progressError) {
          console.log('⚠️ Could not fetch customer progress, trying regular job details:', progressError);
        }

        let job, photosData;

        if (progressResponse?.success && progressResponse?.data) {
          // Use customer progress data for weekly jobs
          const { job: jobData, cleaner, workProgress, occurrences, paymentSummary } = progressResponse.data;
          job = { ...jobData, cleaner };

          // Set occurrences and work progress state
          setOccurrences(occurrences || []);
          setWorkProgress(workProgress);

          // Mock photos data for now
          photosData = { beforePhotos: [], afterPhotos: [] };

          console.log('📊 Using customer progress data - Job:', job);
          console.log('📊 Occurrences:', occurrences);
          console.log('📊 Work Progress:', workProgress);
        } else {
          // Fallback to regular job details for one-time jobs
          const [jobResponse, photosResponse] = await Promise.all([
            jobsAPI.getJobById(jobId),
            jobPhotosAPI.getJobPhotos(jobId).catch(() => ({ data: { beforePhotos: [], afterPhotos: [] } }))
          ]);

          if (jobResponse.success && jobResponse.data) {
            job = jobResponse.data;
            photosData = photosResponse.data || photosResponse;
          }
        }

        if (job) {


          // Check if this is a weekly job and show completed days
          if (job.weeklyProgress && job.weeklyProgress.weeklyCompletions) {
            const completedDays = Object.entries(job.weeklyProgress.weeklyCompletions)
              .filter(([key, completion]) => completion.status === 'completed')
              .map(([key, completion]) => ({
                day: key.split('-')[1],
                week: key.split('-')[0],
                photos: completion.photos ? completion.photos.length : 0,
                completedAt: completion.completedAt
              }));
            console.log('📸 Completed days:', completedDays);
          }

          // Transform job data to match expected format
          const acceptedQuote = job.quotes?.find(q => q.status === 'accepted');
          // Use completedBy if it's an object, otherwise try acceptedQuote cleanerId
          const cleaner = (job.cleaner && typeof job.cleaner === 'object')
            ? job.cleaner
            : (job.completedBy && typeof job.completedBy === 'object')
              ? job.completedBy
              : (acceptedQuote?.cleanerId && typeof acceptedQuote.cleanerId === 'object')
                ? acceptedQuote.cleanerId
                : null;

          // Get photos from multiple possible sources with better handling
          const beforeImages = photosData.beforePhotos || job.beforePhotos || [];
          const afterImages = photosData.afterPhotos || job.afterPhotos || [];
          // Get original job photos
          const jobPhotos = job.photos || [];

          console.log('📸 Processed beforeImages:', beforeImages);
          console.log('📸 Processed afterImages:', afterImages);
          console.log('📸 Processed jobPhotos:', jobPhotos);

          const transformedData = {
            jobId: job.jobId || job._id,
            title: job.title || job.serviceTypeDisplay || job.serviceType,
            serviceType: job.categoryName || job.serviceTypeDisplay || job.serviceType || job.category || job.service || '',
            serviceDetail: job.serviceTypeDisplay || job.serviceDetail || job.selectedServiceDetail || job.serviceName || job.title || '',
            instructions: job.specialInstructions || job.instructions || job.additionalNotes || '',
            frequency: job.frequency || job.recurringFrequency || job.schedule?.frequency || '',
            status: job.statusDisplay || job.status || 'Completed',
            completedAt: job.completedAt || null, // Store as raw date string
            scheduledDate: job.scheduledDate || null,
            location: job.location?.address || job.location?.fullAddress || 'Location',
            photos: jobPhotos,
            cleaner: {
              id: cleaner?._id || cleaner?.id || 'N/A',
              name: cleaner ? `${cleaner.firstName || ''} ${cleaner.lastName || ''}`.trim() : (cleaner?.name || 'Cleaner'),
              rating: cleaner?.averageRating !== undefined ? cleaner.averageRating : (cleaner?.rating || 0),
              tier: cleaner?.tier || 'none',
              photo: cleaner?.profilePhoto || cleaner?.photo || null
            },
            payment: {
              totalPaid: acceptedQuote?.price || job.estimatedPrice || 0,
              paidOnline: Math.round((acceptedQuote?.price || job.estimatedPrice || 0) * 0.1),
              cashToPay: Math.round((acceptedQuote?.price || job.estimatedPrice || 0) * 0.9),
              mode: job.paymentMethod || 'Cash'
            },
            completionProof: {
              beforeImages: beforeImages,
              afterImages: afterImages
            }
          };

          console.log('📸 Final transformed data:', transformedData);
          setJobData(transformedData);

          // Check if review already exists
          // First check localStorage for recently submitted review
          const recentReviewKey = `review_${jobId}`;
          const recentReview = localStorage.getItem(recentReviewKey);
          if (recentReview) {
            try {
              const reviewData = JSON.parse(recentReview);
              setHasReviewed(true);
              setExistingReview(reviewData);
              setSelectedRating(reviewData.rating || 0);
              setSelectedTags(reviewData.tags || reviewData.likedAspects || []);
              setFeedback(reviewData.feedback || '');
            } catch (e) {
              // Error parsing localStorage review
            }
          }

          try {
            const reviewStatusResponse = await reviewsAPI.checkReviewStatus(jobId);

            if (reviewStatusResponse.success && reviewStatusResponse.data) {
              const reviewData = reviewStatusResponse.data;

              if (reviewData.hasReviewed || reviewData.existingReview || reviewData.review || reviewData.rating || reviewData.likedAspects) {
                // Extract review data from different possible structures
                const actualReview = reviewData.existingReview || reviewData.review || reviewData;

                // Try multiple field names for each data type
                const rating = actualReview.rating || reviewData.rating || actualReview.starRating || reviewData.starRating || 0;
                const tags = actualReview.likedAspects || actualReview.tags || reviewData.tags || reviewData.likedAspects || [];
                const feedbackText = actualReview.feedback || reviewData.feedback || actualReview.comment || reviewData.comment || '';

                // Only set hasReviewed to true if we actually have meaningful data
                if (rating > 0 || tags.length > 0 || feedbackText.trim() !== '') {
                  setHasReviewed(true);
                  setExistingReview(actualReview);
                  setSelectedRating(rating);
                  setSelectedTags(tags);
                  setFeedback(feedbackText);
                } else {
                  setHasReviewed(false);
                }
              } else {
                setHasReviewed(false);
              }
            }
          } catch (reviewError) {
            // Try alternative approach - check if we can get review directly
            try {
              const directReviewResponse = await reviewsAPI.getCustomerReviews();
              if (directReviewResponse.success && directReviewResponse.data) {
                // Find review for this specific job
                const reviewForThisJob = directReviewResponse.data.reviews?.find(r => r.jobId === jobId);
                if (reviewForThisJob) {
                  setHasReviewed(true);
                  setExistingReview(reviewForThisJob);
                  setSelectedRating(reviewForThisJob.rating || 0);
                  setSelectedTags(reviewForThisJob.likedAspects || reviewForThisJob.tags || []);
                  setFeedback(reviewForThisJob.feedback || '');
                }
              }
            } catch (directError) {
              // Direct review fetch failed
            }
          }

          // Fetch invoice data if available
          try {
            const invoiceResponse = await jobDetailsAPI.getStripeInvoice(jobId);
            if (invoiceResponse.success) {
              setInvoiceData(invoiceResponse.data);
            }
          } catch (invoiceError) {
            // Invoice not available
          }
        }
      } catch (error) {
        setError(handleAPIError(error));
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchJobDetails();
    }
  }, [jobId]);

  const handleSubmitReview = async () => {
    if (!selectedRating) {
      setErrorMessage('Please select a rating before submitting');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    try {
      setSubmittingReview(true);
      setErrorMessage(null);

      const response = await reviewsAPI.createReview(
        jobId,
        selectedRating,
        selectedTags,
        feedback
      );

      if (response.success) {
        const reviewData = {
          rating: selectedRating,
          tags: selectedTags,
          feedback: feedback,
          submittedAt: new Date().toISOString()
        };

        setHasReviewed(true);
        setExistingReview(reviewData);

        // Store in localStorage for immediate display
        const recentReviewKey = `review_${jobId}`;
        localStorage.setItem(recentReviewKey, JSON.stringify(reviewData));

        setSuccessMessage('Review submitted successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (error) {
      setErrorMessage(handleAPIError(error));
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleMarkOccurrenceCompleted = async (occurrenceId) => {
    try {
      setCompletingJob(true);
      setErrorMessage(null);

      console.log(`🔄 Marking occurrence ${occurrenceId} as completed`);
      const response = await jobPhotosAPI.updateJobStatus(jobId, 'completed', occurrenceId);

      if (response.success) {
        setSuccessMessage('Occurrence marked as completed successfully!');
        // Refresh the data to update the UI
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      console.error('Error completing occurrence:', error);
      setErrorMessage(handleAPIError(error));
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setCompletingJob(false);
    }
  };

  const handleCompleteJob = async () => {
    try {
      setCompletingJob(true);
      setErrorMessage(null);

      // Update job status to completed
      const response = await jobsAPI.updateJobStatus(jobId, 'completed');

      if (response.success) {
        // Update local job data status
        setJobData(prev => ({
          ...prev,
          status: 'completed'
        }));

        setSuccessMessage('Job marked as completed! You can now review your cleaner.');
        setTimeout(() => setSuccessMessage(null), 3000);

        // Refresh job data to get updated status
        const jobResponse = await jobsAPI.getJobById(jobId);
        if (jobResponse.success && jobResponse.data) {
          const job = jobResponse.data;
          setJobData(prev => ({
            ...prev,
            status: job.status || 'completed',
            completedAt: job.completedAt ? new Date(job.completedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) : new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          }));
        }
      } else {
        setErrorMessage(response.message || 'Failed to complete job. Please try again.');
        setTimeout(() => setErrorMessage(null), 5000);
      }
    } catch (error) {
      setErrorMessage(handleAPIError(error));
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setCompletingJob(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!invoiceData) {
      setErrorMessage('Invoice not available');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    try {
      const blob = await jobDetailsAPI.downloadInvoice(jobId);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice_${jobId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccessMessage('Invoice downloaded successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setErrorMessage(handleAPIError(error));
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  if (loading) {
    return <Loader fullscreen message="Loading job details..." />;
  }

  if (error) {
    return (
      <>
        <div className="max-w-7xl mx-auto min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg text-red-600 mb-4">{error}</div>
            <Button onClick={() => {
              if (location.state?.from === 'dashboard') {
                navigate('/customer-dashboard');
              } else {
                const savedTab = localStorage.getItem('customerActiveTab');
                navigate('/my-jobs', { state: { tab: savedTab || 'all' }, replace: true });
              }
            }}>Go Back</Button>
          </div>
        </div>
      </>
    );
  }

  if (!jobData) {
    return (
      <>
        <div className="max-w-7xl mx-auto min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg text-gray-600">Job not found</div>
            <Button onClick={() => {
              if (location.state?.from === 'dashboard') {
                navigate('/customer-dashboard');
              } else {
                const savedTab = localStorage.getItem('customerActiveTab');
                navigate('/my-jobs', { state: { tab: savedTab || 'all' }, replace: true });
              }
            }}>Go Back</Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <PageHeader
          title={`#${jobData.jobId} - ${jobData.title}`}
          onBack={() => {
            if (location.state?.from === 'dashboard') {
              navigate('/customer-dashboard');
            } else {
              const savedTab = localStorage.getItem('customerActiveTab');
              navigate('/my-jobs', { state: { tab: savedTab || 'all' }, replace: true });
            }
          }}
        />

        {/* Success/Error Alerts */}
        <div className="px-4 space-y-2">
          {successMessage && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-3 flex items-center gap-2 animate-fade-in scale-in">
              <Check className="w-4 h-4 text-green-500" />
              <p className="text-green-700 text-sm font-medium">{successMessage}</p>
            </div>
          )}
          {errorMessage && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-center gap-2 animate-fade-in scale-in">
              <X className="w-4 h-4 text-red-500" />
              <p className="text-red-700 text-sm font-medium">{errorMessage}</p>
            </div>
          )}
        </div>

        {/* Cleaner Info Card - Redesigned */}
        <div className="px-4 mt-4">
          <div className="bg-white rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 relative overflow-hidden group hover:border-blue-100 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                {/* Avatar */}
                <div className="relative mt-1 flex-shrink-0">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 ring-2 ring-white">
                    {resolveImageSrc(jobData.cleaner.photo) && !avatarError ? (
                      <img
                        src={resolveImageSrc(jobData.cleaner.photo)}
                        alt={jobData.cleaner.name}
                        className="w-full h-full object-cover"
                        onError={() => setAvatarError(true)}
                      />
                    ) : (
                      <div className="w-full h-full bg-primary-500 flex items-center justify-center text-white text-2xl font-semibold uppercase">
                        {jobData.cleaner.name ? jobData.cleaner.name.trim().charAt(0).toUpperCase() : 'C'}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <h3 className="text-xl sm:text-[22px] font-semibold text-[#111827] leading-none capitalize">{jobData.cleaner.name || "John Doe"}</h3>

                  {/* Tier Badge */}
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#FFF2DE]">
                      <img src={RatingIcon} alt="Rating" className="w-3.5 h-3.5" />
                      <span className="text-xs sm:text-sm font-semibold">{jobData.cleaner.rating || "4.9"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[linear-gradient(94.49deg,_#FDFDFD_0%,_#E9E9E9_100%)] border border-gray-100">
                      <img
                        src={jobData.cleaner.tier === 'gold' ? GoldBadgeIcon : jobData.cleaner.tier === 'silver' ? SilverBadgeIcon : BronzeBadgeIcon}
                        alt="Badge"
                        className="w-4 h-4 drop-shadow-sm"
                      />
                      <span className="text-xs sm:text-sm font-semibold text-gray-900 capitalize">
                        {jobData.cleaner.tier || 'Silver'} Tier
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Columns (Status Top, Icons Bottom) */}
              <div className="flex sm:flex-col sm:items-end justify-between sm:self-stretch mt-1 sm:mt-0">
                <span className="px-3 py-1.5 rounded-full bg-[#E4FBED] text-[#1EB154] text-xs sm:text-sm font-semibold tracking-tight border border-[#DBF9E7] inline-block self-start sm:self-auto">
                  {jobData.status === 'Completed' || jobData.status?.toLowerCase() === 'completed' ? 'Completed' : 'In Progress'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Job Content Redesign */}
        <div className="px-6 mt-8 space-y-2">
          <div>
            <p className="text-sm font-semibold text-gray-400 tracking-[0.1em] mb-1">
              {jobData.serviceType || "Domestic / General Cleaning"}
            </p>
            <h2 className="text-[28px] font-semibold text-gray-900 leading-tight">
              {jobData.serviceDetail || "Townhouse Cleaning"}
            </h2>
          </div>

          <p className="text-gray-500 text-base leading-snug font-medium">
            {jobData.instructions || "Make sure you come prepared with all the equipment you'll need so we can get everything done smoothly."}
          </p>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2.5 group">
              <div className="w-7 h-7 rounded-lg text-[#6B7280] flex items-center justify-center">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[15px] font-medium text-[#6B7280]">
                  {jobData.scheduledDate ? new Date(jobData.scheduledDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  }) : "Pending Completion"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 group">
              <div className="w-7 h-7 rounded-lg text-[#6B7280] flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <p className="text-base font-medium text-[#6B7280] leading-snug">
                {jobData.location || "12 King Street, Sydney NSW"}
              </p>
            </div>
          </div>

          {/* Photos Grid - Redesigned */}
          {overviewPhotos.length > 0 && (
            <div className="">
              <div className="grid grid-cols-2 gap-2 mb-6 max-w-lg">
                {overviewPhotos.slice(0, 4).map((img, idx) => (
                  <div key={idx} className="relative rounded-2xl overflow-hidden group cursor-pointer border border-gray-100">
                    <img
                      src={img}
                      alt={`Job detail ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    {idx === 3 && overviewPhotos.length > 4 && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center group-hover:bg-black/50 transition-colors">
                        <span className="text-white text-2xl font-bold flex items-center gap-1">
                          +{overviewPhotos.length - 4}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Completion Status Bar or Complete Button */}
        {jobData.status?.toLowerCase() === 'completed' || jobData.status === 'Completed' ? (
          <div className="px-4 inline-block">
            <div className="bg-[#E9FBF0] rounded-xl py-3 px-5 flex items-center gap-3 border border-[#DBF9E7]">
              <div className="w-2.5 h-2.5 rounded-full bg-[#1EB154]" />
              <span className="text-[#1EB154] font-medium text-sm">
                Completed on {jobData.completedAt ? new Date(jobData.completedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                }) : 'Recently'}
              </span>
            </div>
          </div>
        ) : (
          <div className="px-4 mt-8">
            <Button
              onClick={() => setShowCompleteModal(true)}
              variant="primary"
              className="py-4 rounded-2xl font-bold text-lg shadow-lg shadow-blue-100 transition-all hover:shadow-blue-200 active:scale-[0.98]"
              disabled={completingJob}
            >
              {completingJob ? 'Completing...' : 'Mark Job as Completed'}
            </Button>

          </div>
        )}

        {/* Complete Job Confirmation Modal */}
        {showCompleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in"
              onClick={() => setShowCompleteModal(false)}
            ></div>
            <div className="relative bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-500">
                  <Check className="w-8 h-8" strokeWidth={2.5} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Complete Job?</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-8 px-2">
                  Are you sure the cleaner has finished the job? This will finalize the payment and allow you to rate the service.
                </p>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      setShowCompleteModal(false);
                      handleCompleteJob();
                    }}
                    className="w-full py-4 px-6 rounded-2xl bg-primary-500 text-white font-bold text-base hover:bg-blue-600 shadow-lg shadow-blue-100 hover:shadow-blue-200 transition-all cursor-pointer"
                  >
                    Complete Job
                  </button>
                  <button
                    onClick={() => setShowCompleteModal(false)}
                    className="w-full py-4 px-6 rounded-2xl bg-gray-100 text-gray-600 font-bold text-base hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    Not Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rate Your Cleaner / Review Section - Only show if job is completed */}
        {(jobData.status?.toLowerCase() === 'completed' || jobData.status === 'Completed') && (
          <div className="bg-white mx-4 mt-4 p-4 rounded-2xl shadow-sm border border-gray-100 mb-6">
            {hasReviewed ? (
              // Show existing review
              <>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-primary-500">Your Review</h3>
                  <span className="text-xs font-medium px-3 py-1 rounded-full bg-green-50 text-[#1EB154] border border-[#DBF9E7]">
                    Submitted
                  </span>
                </div>

                {/* Star Rating - Display Only */}
                <div className="flex space-x-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <img
                      key={star}
                      src={star <= selectedRating ? RatingIcon : Rating2Icon}
                      alt={`Star ${star}`}
                      className="w-8 h-8"
                    />
                  ))}
                </div>

                {/* Selected Tags - Display Only */}
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">What you liked:</p>
                  {selectedTags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedTags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 rounded-full text-sm font-medium bg-[#EBF2FD] text-primary-600 border border-[#9CC0F6]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No specific aspects selected</p>
                  )}
                </div>

                {/* Feedback - Display Only */}
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Your feedback:</p>
                  {feedback ? (
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 inline-block">
                      <p className="text-sm text-gray-700">{feedback}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No additional feedback provided</p>
                  )}
                </div>

                {/* Go to Dashboard Button */}
                <div className="flex justify-end mt-4">
                  <Button
                    onClick={() => navigate('/customer-dashboard')}
                    variant="primary"
                  >
                    Go to Dashboard
                  </Button>
                </div>
              </>
            ) : (
              // Show review form
              <>
                <h3 className="font-semibold text-primary-500 mb-1">Rate Your Cleaner</h3>

                {/* Star Rating */}
                <div className="flex space-x-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setSelectedRating(star)}
                      className="focus:outline-none cursor-pointer"
                    >
                      <img
                        src={star <= selectedRating ? RatingIcon : Rating2Icon}
                        alt={`Star ${star}`}
                        className="w-8 h-8"
                      />
                    </button>
                  ))}
                </div>

                {/* Feedback Question */}
                <p className="text-gray-700 mb-3">What did you like about your cleaner?</p>

                {/* Feedback Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {feedbackTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleTagSelect(tag)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors cursor-pointer ${selectedTags.includes(tag)
                        ? 'bg-[#EBF2FD] text-primary-600 border border-[#9CC0F6]'
                        : 'bg-[#F9FAFB] text-[#374151] border border-primary-200'
                        }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                {/* Feedback Text Area */}
                <div className="text-primary-500 font-semibold text-sm mb-1"> Anything specific we should know? <span className="text-primary-200 font-medium text-sm">(Optional)</span></div>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Write your feedback here..."
                  className="w-full p-3 border border-primary-200 rounded-xl! resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />

                {/* Submit Button */}
                <div className="flex justify-end mt-4">
                  <Button
                    onClick={handleSubmitReview}
                    disabled={submittingReview || !selectedRating}
                  >
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default JobDetailsCompletedPage;

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Check, X, Calendar, MapPin } from 'lucide-react';
import { Button, PageHeader, Loader } from '../../components';
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
    const jobPhotos = jobData.photos || [];
    return jobPhotos.map(resolveImageSrc).filter(Boolean);
  }, [jobData]);


  const feedbackTags = [
    'Punctual', 'Professional', 'Quality Work', 'Friendly', 'Good Communication'
  ];

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setLoading(true);

        let progressResponse;
        try {
          progressResponse = await jobsAPI.getCustomerProgress(jobId);
        } catch (progressError) {
        }

        let job, photosData;

        if (progressResponse?.success && progressResponse?.data) {
          const { job: jobData, cleaner, workProgress, occurrences, paymentSummary } = progressResponse.data;
          job = { ...jobData, cleaner };

          setOccurrences(occurrences || []);
          setWorkProgress(workProgress);

          photosData = { beforePhotos: [], afterPhotos: [] };

        } else {
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
          if (job.weeklyProgress && job.weeklyProgress.weeklyCompletions) {
            const completedDays = Object.entries(job.weeklyProgress.weeklyCompletions)
              .filter(([key, completion]) => completion.status === 'completed')
              .map(([key, completion]) => ({
                day: key.split('-')[1],
                week: key.split('-')[0],
                photos: completion.photos ? completion.photos.length : 0,
                completedAt: completion.completedAt
              }));
          }
          const acceptedQuote = job.quotes?.find(q => q.status === 'accepted');
          const cleaner = (job.cleaner && typeof job.cleaner === 'object')
            ? job.cleaner
            : (job.completedBy && typeof job.completedBy === 'object')
              ? job.completedBy
              : (acceptedQuote?.cleanerId && typeof acceptedQuote.cleanerId === 'object')
                ? acceptedQuote.cleanerId
                : null;

          const beforeImages = photosData.beforePhotos || job.beforePhotos || [];
          const afterImages = photosData.afterPhotos || job.afterPhotos || [];
          const jobPhotos = job.photos || [];

          const transformedData = {
            jobId: job.jobId || job._id,
            title: job.title || job.serviceTypeDisplay || job.serviceType,
            serviceType: job.categoryName || job.serviceTypeDisplay || job.serviceType || job.category || job.service || '',
            serviceDetail: job.serviceTypeDisplay || job.serviceDetail || job.selectedServiceDetail || job.serviceName || job.title || '',
            instructions: job.specialInstructions || job.instructions || job.additionalNotes || '',
            frequency: job.frequency || job.recurringFrequency || job.schedule?.frequency || '',
            status: job.statusDisplay || job.status || 'Completed',
            completedAt: job.completedAt || null,
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

          setJobData(transformedData);
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
            }
          }

          try {
            const reviewStatusResponse = await reviewsAPI.checkReviewStatus(jobId);

            if (reviewStatusResponse.success && reviewStatusResponse.data) {
              const reviewData = reviewStatusResponse.data;

              if (reviewData.hasReviewed || reviewData.existingReview || reviewData.review || reviewData.rating || reviewData.likedAspects) {
                const actualReview = reviewData.existingReview || reviewData.review || reviewData;
                const rating = actualReview.rating || reviewData.rating || actualReview.starRating || reviewData.starRating || 0;
                const tags = actualReview.likedAspects || actualReview.tags || reviewData.tags || reviewData.likedAspects || [];
                const feedbackText = actualReview.feedback || reviewData.feedback || actualReview.comment || reviewData.comment || '';

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
            try {
              const directReviewResponse = await reviewsAPI.getCustomerReviews();
              if (directReviewResponse.success && directReviewResponse.data) {
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
            }
          }

          try {
            const invoiceResponse = await jobDetailsAPI.getStripeInvoice(jobId);
            if (invoiceResponse.success) {
              setInvoiceData(invoiceResponse.data);
            }
          } catch (invoiceError) {
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

  const handleCompleteJob = async () => {
    try {
      setCompletingJob(true);
      setErrorMessage(null);
      const response = await jobsAPI.updateJobStatus(jobId, 'completed');

      if (response.success) {
        setJobData(prev => ({
          ...prev,
          status: 'completed'
        }));

        setSuccessMessage('Job marked as completed! You can now review your cleaner.');
        setTimeout(() => setSuccessMessage(null), 3000);

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

  const isCompleted = ['completed', 'assigned', 'accepted'].includes(jobData.status?.toLowerCase());

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
              <div className="flex items-center gap-4 flex-1">
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
                </div>
              </div>

              {/* Action Columns (Status Top, Icons Bottom) */}
              <div className="flex sm:flex-col sm:items-end justify-between sm:self-stretch mt-1 sm:mt-0">
                <span className="px-3 py-1.5 rounded-full bg-[#E4FBED] text-[#1EB154] text-xs sm:text-sm font-semibold tracking-tight border border-[#DBF9E7] inline-block self-start sm:self-auto">
                  {isCompleted ? 'Completed' : 'In Progress'}
                </span>
              </div>
            </div>
          </div>
        </div>
          {/* Job Details Card (Figma Style) - Card 2 */}
        <div className="px-4 mt-6">
          <div className="bg-white rounded-3xl p-5 mb-6 border border-[#E9EFFF]">
            <div className="mb-4">
              <span className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                {jobData.serviceType || "COMMERCIAL CLEANING"}
              </span>
              <h2 className="text-[20px] font-semibold text-gray-900 mt-1 leading-tight capitalize">
                {jobData.serviceDetail || jobData.title || "Bar / pub cleaning"}
              </h2>
              {jobData.instructions && (
                <p className="text-gray-500 text-sm leading-relaxed mt-2 font-medium">
                  {jobData.instructions}
                </p>
              )}
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center text-[#6B7280]">
                <Calendar className="w-4 h-4 mr-3 opacity-60 text-black" strokeWidth={2.5} />
                <span className="text-sm font-medium">
                  {jobData.scheduledDate ? new Date(jobData.scheduledDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  }) : "Date not specified"}
                </span>
              </div>
              <div className="flex items-center text-[#6B7280]">
                <MapPin className="w-4 h-4 mr-3 opacity-60 text-black" strokeWidth={2.5} />
                <span className="text-sm font-medium leading-snug">
                  {jobData.location || "3600 Presidential Blvd, Austin, TX 78719"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Job Metadata Grid - Card 3 */}
        <div className="px-4 mb-6">
          <div className="bg-white rounded-xl p-5 border border-[#E9EFFF] shadow-sm grid grid-cols-3 divide-x divide-gray-100 text-center">
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">JOB ID</p>
              <p className="text-[15px] font-bold text-gray-900">#{jobData.jobId}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">TYPE</p>
              <p className="text-[15px] font-bold text-gray-900 capitalize">
                {jobData.serviceType ? jobData.serviceType.replace(' Cleaning', '') : 'Commercial'}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">STATUS</p>
              <p className="text-[15px] font-bold text-green-600">
                {isCompleted ? 'Completed' : 'Active'}
              </p>
            </div>
          </div>
        </div>

        {/* Photos Grid - Redesigned */}
        {overviewPhotos.length > 0 && (
          <div className="px-4 mb-6">
            <div className="grid grid-cols-2 gap-2 max-w-lg">
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

        {isCompleted ? null : (
          <div className="px-4 mt-8 flex justify-end">
            <Button
              onClick={() => setShowCompleteModal(true)}
              variant="primary"
              className="py-4 px-8 rounded-2xl font-bold text-lg shadow-lg shadow-blue-100 transition-all hover:shadow-blue-200 active:scale-[0.98]"
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

        {/* Return to dashboard button at the bottom */}
        <div className="flex justify-center my-8 px-4">
          <Button
            onClick={() => navigate('/customer-dashboard')}
            variant="primary"
            className="w-full max-w-xs py-4 px-6 rounded-2xl font-bold text-base shadow-lg shadow-blue-100 hover:shadow-blue-200 transition-all"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    </>
  );
};

export default JobDetailsCompletedPage;

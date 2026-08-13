import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Check, UserRound, CalendarDays, MapPin, X, Phone, MessageSquare } from 'lucide-react';
import { Button, PageHeader, Loader } from '../../components';
import { jobsAPI, jobPhotosAPI, reviewsAPI } from '../../services/api';
import RatingIcon from '../../assets/Rating1.svg';
import RatingEmptyIcon from '../../assets/rating3.svg';

const resolveImageSrc = (image) => {
  if (!image) return '';
  if (typeof image === 'string') return image;
  return image.url || image.path || image.secureUrl || '';
};

const CleanerJobCompletedPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [jobData, setJobData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [customerReview, setCustomerReview] = useState(null);

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setLoading(true);

        const [jobResponse, photosResponse, reviewResponse] = await Promise.all([
          jobsAPI.getJobById(jobId),
          jobPhotosAPI
            .getJobPhotos(jobId)
            .catch(() => ({ data: { beforePhotos: [], afterPhotos: [] } })),
          reviewsAPI.getMyReviews().catch(() => null),
        ]);

        if (jobResponse.success && jobResponse.data) {
          const job = jobResponse.data;
          const photosData = photosResponse.data || photosResponse;

          // If job is not completed, redirect to in-progress details
          if (!['completed', 'Completed', 'assigned', 'Assigned'].includes(job.status)) {
            navigate(`/job-details/${jobId}`, { replace: true });
            return;
          }

          const customer = job.customerId;
          const beforeImages = photosData.beforePhotos || job.beforePhotos || [];
          const afterImages = photosData.afterPhotos || job.afterPhotos || [];
          const jobPhotos = job.photos || [];

          const transformedData = {
            jobId: job.jobId || job._id,
            title: job.serviceTypeDisplay || job.title || job.serviceType,
            serviceType: job.categoryId?.name || job.category || 'Cleaning Service',
            serviceDetail: job.serviceTypeId?.name || job.serviceDetail || '',
            instructions: job.instructions || '',
            scheduledDate: job.scheduledDate || job.completedAt,
            location: job.location?.address || job.location?.fullAddress || 'Location',
            photos: jobPhotos,
            status: job.status,
            customer: {
              id: customer?._id || customer?.id || 'N/A',
              name: customer ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim() : 'Customer',
              phone: customer?.phone || 'N/A',
              photo: customer?.profilePhoto
            }
          };

          setJobData(transformedData);

          // Get review for this specific job from API data first
          if (job.review) {
            setCustomerReview(job.review);
          } 
          // Fallback to searching in MyReviews
          else if (reviewResponse?.success && reviewResponse?.data) {
            const reviews = reviewResponse.data.reviews || reviewResponse.data;
            const jobReview = Array.isArray(reviews)
              ? reviews.find(r => (r.jobId?._id || r.jobId) === jobId)
              : null;
            if (jobReview) setCustomerReview(jobReview);
          }
        } else {
          setError('Job not found');
        }
      } catch (err) {
        setError('Failed to load job details');
      } finally {
        setLoading(false);
      }
    };

    if (jobId) fetchJobDetails();
  }, [jobId, navigate]);

  const overviewPhotos = useMemo(() => {
    if (!jobData) return [];
    return jobData.photos?.map(resolveImageSrc).filter(Boolean) || [];
  }, [jobData]);

  if (loading) return <Loader fullscreen message="Loading job details..." />;
  if (error || !jobData) {
    return (
      <div className="bg-gray-50 min-h-screen p-4 flex items-center justify-center">
        <div className="text-red-500 font-medium">{error || 'Job details not available'}</div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto min-h-screen px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between py-4">
          <PageHeader
            title={jobData.title || "Job Detail"}
            className="p-0 border-none shadow-none"
            onBack={() => navigate('/cleaner-jobs')}
          />
          <div className="bg-[#E9FBF0] text-[#1EB154] px-3 py-1.5 rounded-full text-xs font-medium border border-[#D1F7E1]">
            Completed
          </div>
        </div>

        <div className="pb-20">
          {/* Left Column: Job Info */}
          <div className="space-y-6">
            {/* Job Summary Card */}
            <div className="bg-[linear-gradient(129.21deg,_#E9EEFC_-1.01%,_#FFFFFF_100.1%)] rounded-2xl p-6 border border-[#D5DEFA]">
              <p className="text-sm font-medium text-gray-400 mb-1 tracking-tight">
                {jobData.serviceType}
              </p>
              <h1 className="text-md font-semibold text-gray-900 mb-2 leading-tight">
                {jobData.title}
              </h1>

              <div className="space-y-4 pt-1">
                <div className="flex items-center gap-2.5 text-[#6B7280]">
                  <CalendarDays className="w-5 h-5 "/>
                  <span className="text-[14px] font-medium">
                    {jobData.scheduledDate ? new Date(jobData.scheduledDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    }) : "N/A"}
                  </span>
                </div>

                <div className="flex items-start gap-2.5 text-[#6B7280]">
                  <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5 "/>
                  <span className="text-[15px] font-medium leading-snug">
                    {jobData.location}
                  </span>
                </div>
              </div>
            </div>

            {/* Assigned By Section */}
            <div className="space-y-3">
              <h3 className="text-[#111827] font-medium text-lg px-1"></h3>
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100">
                    {jobData.customer.photo ? (
                      <img src={resolveImageSrc(jobData.customer.photo)} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <UserRound className="w-7 h-7 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-lg">{jobData.customer.name}</h4>
                    <div className="flex items-center gap-1.5 text-[#374151]">
                      <Phone className="w-3.5 h-3.5" />
                      <span className="text-sm font-medium">{jobData.customer.phone}</span>
                    </div>
                  </div>
                </div>
                {/* <div className="flex gap-2">
                  <button className="w-10 h-10 rounded-xl bg-white border border-blue-100 flex items-center justify-center text-blue-500 transition-colors hover:bg-blue-50 cursor-pointer">
                    <MessageSquare className="w-5 h-5" />
                  </button>
                  <button className="w-10 h-10 rounded-xl bg-white border border-blue-100 flex items-center justify-center text-blue-500 transition-colors hover:bg-blue-50 cursor-pointer">
                    <Phone className="w-5 h-5" />
                  </button>
                </div> */}
              </div>
            </div>
          </div>

          {/* Right Column: Review & Photos */}
          <div className="space-y-6 pt-6">
            {/* Customer Review Section */}
            {customerReview ? (
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
                <div className="flex justify-center gap-1.5 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <img
                      key={star}
                      src={star <= (customerReview.rating || 0) ? RatingIcon : RatingEmptyIcon}
                      alt="star"
                      className="w-8 h-8"
                    />
                  ))}
                </div>
                
                <p className="text-[#111827] font-Medium text-lg leading-snug mb-6">
                  {customerReview.feedback || "The customer didn't leave a written review."}
                </p>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-2xl p-8 border border-dashed border-gray-200 text-center">
                <p className="text-gray-400 font-medium">No review received yet</p>
              </div>
            )}

  
          </div>
        </div>

        {/* Bottom Button */}
        {/* <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md flex justify-center z-10">
          <Button onClick={() => navigate('/cleaner-jobs')} className="w-auto px-10 rounded-2xl py-3 font-bold text-base">
            Back to My Jobs
          </Button>
        </div> */}
      </div>
    </>
  );
};

export default CleanerJobCompletedPage;


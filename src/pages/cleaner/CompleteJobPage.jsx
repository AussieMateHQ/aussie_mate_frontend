import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Loader, PageHeader, JobOverviewCard } from '../../components';
import { Check, X, Clock } from 'lucide-react';
import UploadCloudIcon from '../../assets/upload-cloud.svg';
import UploadIcon from '../../assets/upload.svg';
import { jobPhotosAPI, jobsAPI } from '../../services/api';
import { paymentService } from '../../services/paymentService';
import { handleAPIError } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const CompleteJobPage = () => {
  const { jobId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const occurrenceId = searchParams.get('occurrenceId');
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(300);
  const [needExtraTime, setNeedExtraTime] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [afterPhotos, setAfterPhotos] = useState([]);
  const [selectedAfterFiles, setSelectedAfterFiles] = useState([]);
  const [timerCompleted, setTimerCompleted] = useState(false);
  const [extraTime, setExtraTime] = useState('');
  const [extraAmount, setExtraAmount] = useState('');
  const [extraReason, setExtraReason] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [beforePhotosUploaded, setBeforePhotosUploaded] = useState(false);
  const [afterPhotosUploaded, setAfterPhotosUploaded] = useState(false);
  const [uploadingBefore, setUploadingBefore] = useState(false);
  const [uploadingAfter, setUploadingAfter] = useState(false);
  const [completingJob, setCompletingJob] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch job details from API
        const jobResponse = await jobsAPI.getJobById(jobId);
        const jobData = jobResponse.data || jobResponse;

        // Only redirect if job is completed
        if (jobData.status === 'completed') {
          navigate(`/cleaner-job-completed/${jobId}`, { replace: true });
          return;
        }

        setJob(jobData);

        // Fetch existing photos
        try {
          const photosResponse = await jobPhotosAPI.getJobPhotos(jobId);
          const photosData = photosResponse.data || photosResponse;

          // Set existing photos
          if (photosData.beforePhotos && photosData.beforePhotos.length > 0) {
            setUploadedPhotos(photosData.beforePhotos);
            setBeforePhotosUploaded(true);
          }

          if (photosData.afterPhotos && photosData.afterPhotos.length > 0) {
            setAfterPhotos(photosData.afterPhotos);
            setAfterPhotosUploaded(true);
          }
        } catch (photoError) {
          console.warn('Could not fetch job photos (endpoint might not exist):', photoError);
          // Don't set error state here as it's not critical for the page to load
        }

      } catch (error) {
        console.error('Error fetching job details:', error);
        setError(handleAPIError(error));
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchJobDetails();
    }
  }, [jobId]);

  useEffect(() => {
    // Check if timer was already completed (from localStorage)
    const savedTimerCompleted = localStorage.getItem(`timerCompleted_${jobId}`);
    if (savedTimerCompleted === 'true') {
      setTimerCompleted(true);
      setTimeLeft(0);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimerCompleted(true);
          // Save to localStorage so timer won't show again
          localStorage.setItem(`timerCompleted_${jobId}`, 'true');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [jobId]);

  // Auto-redirect if job status changes
  useEffect(() => {
    if (!job) return;

    // If job gets completed while on this page, redirect to completed page
    if (job.status === 'completed') {
      navigate(`/cleaner-job-completed/${jobId}`, { replace: true });
    }
    // If job goes back to accepted status, redirect to in-progress page
    else if (job.status === 'accepted') {
      navigate(`/cleaner/in-progress-job/${jobId}`, { replace: true });
    }
  }, [job?.status, jobId, navigate]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return 'Recently posted';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Posted just now';
    if (diffInHours === 1) return 'Posted 1h ago';
    return `Posted ${diffInHours}hrs ago`;
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
  };

  const handleAfterFileSelect = (event) => {
    const files = Array.from(event.target.files);
    setSelectedAfterFiles(files);
  };

  const handleUploadPhotos = () => {
    if (selectedFiles.length > 0) {
      // TODO: Upload files to server
      const newPhotos = selectedFiles.map((file, index) => ({
        id: Date.now() + index,
        file,
        url: URL.createObjectURL(file),
        name: file.name,
      }));
      setUploadedPhotos(prev => [...prev, ...newPhotos]);
      setSelectedFiles([]);
    }
  };

  const handleSubmitPhoto = async () => {
    if (selectedFiles.length === 0) {
      setUploadError('Please select at least one photo');
      setTimeout(() => setUploadError(null), 3000);
      return;
    }

    try {
      setUploadingBefore(true);
      setUploadError(null);

      const response = await jobPhotosAPI.uploadBeforePhotos(jobId, selectedFiles, occurrenceId);

      if (response.success) {
        setUploadedPhotos(response.data.beforePhotos || []);
        setBeforePhotosUploaded(true);
        setSelectedFiles([]);
        setSuccessMessage('Before photos uploaded successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (error) {
      console.error('Error uploading before photos:', error);
      setUploadError(handleAPIError(error));
      setTimeout(() => setUploadError(null), 5000);
    } finally {
      setUploadingBefore(false);
    }
  };

  // const handleCompleteJob = async () => {
  //   if (!beforePhotosUploaded || !afterPhotosUploaded) {
  //     setUploadError('Please upload both before and after photos to complete the job');
  //     setTimeout(() => setUploadError(null), 3000);
  //     return;
  //   }

  //   try {
  //     setCompletingJob(true);
  //     setUploadError(null);
  //     console.log("done jobs");

  //     // First, try to capture the payment if job has an authorized payment
  //     try {
  //       console.log(`🔌 Attempting to capture payment for job ${jobId}...`);
  //       const paymentStatusResponse = await paymentService.getPaymentStatus(jobId);
  //       console.log("paymentStatusResponse", paymentStatusResponse);

  //       if (paymentStatusResponse?.success && paymentStatusResponse?.data?.payment?._id) {
  //         const paymentId = paymentStatusResponse.data.payment._id;
  //         const paymentStatus = paymentStatusResponse.data.payment.status;

  //         if (paymentStatus === 'authorized') {
  //           console.log(`💰 Capturing payment ${paymentId}...`);
  //           const captureResponse = await paymentService.capturePayment(paymentId);
  //           if (captureResponse.success) {
  //             console.log(`✅ Payment captured successfully for job ${jobId}`);
  //             setSuccessMessage('Payment captured and job completed successfully!');
  //           }
  //         } else {
  //           console.log(`ℹ️ Payment status is ${paymentStatus}, not capturing. Proceeding with job completion.`);
  //         }
  //       }
  //     } catch (paymentError) {
  //       console.warn('⚠️ Could not capture payment automatically:', paymentError);
  //       // Continue with job completion even if payment capture fails
  //     }

  //     // Update job status to pending_customer_confirmation
  //     const response = await jobPhotosAPI.updateJobStatus(jobId, 'pending_customer_confirmation');

  //     if (response.success) {
  //       if (!successMessage) {
  //         setSuccessMessage('Job completed successfully! Redirecting...');
  //       }
  //       setTimeout(() => {
  //         navigate('/cleaner-dashboard');
  //       }, 1500);
  //     }
  //   } catch (error) {
  //     console.error('Error completing job:', error);
  //     setUploadError(handleAPIError(error));
  //     setTimeout(() => setUploadError(null), 5000);
  //   } finally {
  //     setCompletingJob(false);
  //   }
  // };


    const handleCompleteJob = async () => {
    if (!beforePhotosUploaded || !afterPhotosUploaded) {
      setUploadError('Please upload both before and after photos to complete the job');
      setTimeout(() => setUploadError(null), 3000);
      return;
    }

    try {
      setCompletingJob(true);
      setUploadError(null);
      console.log("done jobs");

      // First, try to capture the payment if job has an authorized payment
      try {
        console.log(`🔌 Attempting to capture payment for job ${jobId}...`);
        const paymentStatusResponse = await paymentService.getPaymentStatus(jobId);
        console.log("paymentStatusResponse", paymentStatusResponse);

        if (paymentStatusResponse?.success && paymentStatusResponse?.data?.payment?._id) {
          const paymentId = paymentStatusResponse.data.payment._id;
          const paymentStatus = paymentStatusResponse.data.payment.status;

          if (paymentStatus === 'authorized') {
            console.log(`💰 Capturing payment ${paymentId}...`);
            const captureResponse = await paymentService.capturePayment(paymentId);
            if (captureResponse.success) {
              console.log(`✅ Payment captured successfully for job ${jobId}`);
              setSuccessMessage('Payment captured and job completed successfully!');
            }
          } else {
            console.log(`ℹ️ Payment status is ${paymentStatus}, not capturing. Proceeding with job completion.`);
          }
        }
      } catch (paymentError) {
        console.warn('⚠️ Could not capture payment automatically:', paymentError);
        // Continue with job completion even if payment capture fails
      }

      // Update job status to pending_customer_confirmation
      console.log('🔄 Updating job status to pending_customer_confirmation...');
      const response = await jobPhotosAPI.updateJobStatus(jobId, 'pending_customer_confirmation', occurrenceId);

      if (response.success) {
        setSuccessMessage('Job completed successfully! Redirecting to completed jobs...');
        setTimeout(() => {
          navigate('/cleaner-jobs', { state: { tab: 'completed' } });
        }, 1500);
      } else {
          throw new Error(response.message || 'Failed to update job status');
      }
    } catch (error) {
      console.error('Error completing job:', error);
      setUploadError(handleAPIError(error));
      setTimeout(() => setUploadError(null), 5000);
    } finally {
      setCompletingJob(false);
    }
  };

  const handleUploadAfterPhotos = () => {
    if (selectedAfterFiles.length > 0) {
      const newPhotos = selectedAfterFiles.map((file, index) => ({
        id: Date.now() + index,
        file,
        url: URL.createObjectURL(file),
        name: file.name,
      }));
      setAfterPhotos(prev => [...prev, ...newPhotos]);
      setSelectedAfterFiles([]);
    }
  };

  const handleSubmitAfterPhoto = async () => {
    if (selectedAfterFiles.length === 0) {
      setUploadError('Please select at least one photo');
      setTimeout(() => setUploadError(null), 3000);
      return;
    }

    try {
      setUploadingAfter(true);
      setUploadError(null);

      const response = await jobPhotosAPI.uploadAfterPhotos(jobId, selectedAfterFiles, occurrenceId);

      if (response.success) {
        setAfterPhotos(response.data.afterPhotos || []);
        setAfterPhotosUploaded(true);
        setSelectedAfterFiles([]);
        setSuccessMessage('After photos uploaded successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (error) {
      console.error('Error uploading after photos:', error);
      setUploadError(handleAPIError(error));
      setTimeout(() => setUploadError(null), 5000);
    } finally {
      setUploadingAfter(false);
    }
  };

  const handleRequestExtraTime = async () => {
    if (!extraTime || !extraAmount || !extraReason.trim()) {
      setUploadError('Please fill all fields');
      setTimeout(() => setUploadError(null), 3000);
      return;
    }

    try {
      setSubmittingRequest(true);
      setUploadError(null);

      await jobsAPI.requestExtraTime(jobId, { time: extraTime, amount: extraAmount, reason: extraReason });

      setSuccessMessage('Extra time request sent to customer successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);

      // Reset form
      setNeedExtraTime(false);
      setExtraTime('');
      setExtraAmount('');
      setExtraReason('');
    } catch (error) {
      console.error('Error requesting extra time:', error);
      setUploadError('Failed to send request. Please try again.');
      setTimeout(() => setUploadError(null), 5000);
    } finally {
      setSubmittingRequest(false);
    }
  };


  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-sm mx-auto sm:max-w-2xl lg:max-w-4xl xl:max-w-6xl p-4">
          <div className="bg- hite rounded-2xl p-6 animate-pulse">
            <Loader message="Loading job details..." />
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-sm mx-auto sm:max-w-2xl lg:max-w-4xl xl:max-w-6xl p-4">
          <div className="bg-white rounded-2xl p-6 text-center">
            {error ? (
              <div>
                <p className="text-red-500 mb-4">{error}</p>
                <Button
                  onClick={() => window.location.reload()}
                  variant="primary"
                  className="mr-2"
                >
                  Retry
                </Button>
                <Button
                  onClick={() => navigate(-1)}
                  variant="secondary"
                >
                  Go Back
                </Button>
              </div>
            ) : (
              <p className="text-red-500">Job not found</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const progressPercentage = ((300 - timeLeft) / 300) * 100;

  return (
    <>
      <div className="max-w-sm mx-auto sm:max-w-2xl lg:max-w-4xl xl:max-w-6xl">
        <PageHeader
          title={job?.title || job?.serviceType || 'Job Details'}
          onBack={() => navigate(-1)}
          className='py-4'
        />

        <div className="px-4 space-y-4">
          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3 text-white" strokeWidth={2} />
              </div>
              <p className="text-green-700 font-medium">{successMessage}</p>
            </div>
          )}

          {/* Error Message */}
          {uploadError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
              <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                <X className="w-3 h-3 text-white" strokeWidth={2} />
              </div>
              <p className="text-red-700 font-medium">{uploadError}</p>
            </div>
          )}

          {/* Job Overview */}
          <JobOverviewCard
            jobId={job?.jobId || job?._id || job?.id}
            serviceTypeId={job?.serviceTypeId}
            title={job?.title}
            serviceType={job?.serviceType}
            serviceDetail={job?.serviceDetail || job?.serviceType}
            instructions={job?.specialInstructions || job?.instructions || job?.additionalNotes}
            scheduledDate={job?.scheduledDate ? new Date(job.scheduledDate).toLocaleDateString('en-AU', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) : ''}
            frequency={job?.frequency}
            location={job?.location?.address || job?.location?.fullAddress || job?.address || job?.locationDescription}
            photos={job?.photos?.map(p => typeof p === 'string' ? p : p.url || p.src) || []}
            viewerRole="cleaner"
          />

          {/* Review Property Section - Hide after 5 minutes */}
          {!timerCompleted && (
            <div className="bg-[linear-gradient(126.14deg,_#E9EEFC_-59.36%,_#FFFFFF_73.02%)] rounded-2xl p-6 shadow-sm border border-[#D5DEFA]">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-primary-500">
                  Have you review property?
                </h3>
                <p className="text-sm text-primary-200 font-medium mb-2">
                  If yes, are you thinking that it will take extra hours
                </p>
              </div>

              <div className="flex items-center mb-4">
                <span className="text-sm font-medium text-primary-500 mr-4">Need extra time?</span>
                <button
                  type="button"
                  onClick={() => setNeedExtraTime(!needExtraTime)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${needExtraTime ? 'bg-[#1F6FEB]' : 'bg-gray-200'
                    }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${needExtraTime ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
              </div>

              {needExtraTime && (
                <div className="space-y-4 pt-4 mb-4">
                  {/* Time Input */}
                  <div className="relative">
                    <input
                      type="time"
                      value={extraTime}
                      onChange={(e) => setExtraTime(e.target.value)}
                      placeholder="Set time"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    />
                  </div>

                  {/* Amount Input */}
                  <input
                    type="number"
                    value={extraAmount}
                    onChange={(e) => setExtraAmount(e.target.value)}
                    placeholder="Enter the amount here..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    min="0"
                    step="0.01"
                  />

                  {/* Reason Textarea */}
                  <textarea
                    value={extraReason}
                    onChange={(e) => setExtraReason(e.target.value)}
                    placeholder="Enter reason"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl! focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none"
                  />

                  {/* Request Button */}
                  <div className="flex justify-end">
                    <Button
                      onClick={handleRequestExtraTime}
                      variant="primary"
                      disabled={submittingRequest || !extraTime || !extraAmount || !extraReason.trim()}
                      className="px-6 py-2"
                    >
                      {submittingRequest ? 'Sending...' : 'Request To Customer'}
                    </Button>
                  </div>
                </div>
              )}

              {timeLeft > 0 && (
                <div className="space-y-1">
                  <p className="text-sm text-primary-200 font-medium">
                    You have 5 mins to take your decision
                  </p>
                  <div className="relative">
                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div
                        className="h-4 rounded-full transition-all duration-1000 ease-out relative"
                        style={{
                          width: `${progressPercentage}%`,
                          background: 'linear-gradient(45deg, #1EB154 25%, #05C34B 25%, #05C34B 50%, #1EB154 50%, #1EB154 75%, #05C34B 75%, #05C34B)',
                          backgroundSize: '20px 20px',
                          animation: 'progress-stripes 1s linear infinite'
                        }}
                      ></div>
                    </div>
                    <div className="absolute right-0 top-0 -mt-6">
                      <span className="text-sm font-semibold text-green-500">
                        {formatTime(timeLeft)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Upload Before Photo Section - Hide after upload */}
          {!beforePhotosUploaded && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-primary-500 mb-2">Upload Before Photo</h3>

              {/* Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-5 text-center bg-gray-50 mx-auto">
                <div className='rounded-full p-3 bg-primary-200 w-fit mx-auto mb-3'>
                  <img src={UploadCloudIcon} alt="Upload" className="w-8 h-8" />
                </div>
                <p className="text-primary-500 mb-4 font-medium">Select photos/videos to upload</p>

                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />

                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium cursor-pointer transition-colors bg-primary-500 text-white hover:bg-blue-700"
                >
                  Select Files
                  <img src={UploadIcon} alt="Upload" className="w-5 h-5" />
                </label>
              </div>

              {/* Selected Files Preview & Upload */}
              {selectedFiles.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
                  </p>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border-2 border-blue-200"
                        />
                        <button
                          onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== index))}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" strokeWidth={2} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSubmitPhoto}
                      disabled={uploadingBefore}
                      loading={uploadingBefore}
                      variant="primary"

                    >
                      {uploadingBefore ? 'Uploading...' : `Upload ${selectedFiles.length} Photo${selectedFiles.length > 1 ? 's' : ''}`}
                    </Button>
                  </div>
                </div>
              )}

              {/* Successfully Uploaded Photos */}
              {beforePhotosUploaded && uploadedPhotos.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm font-semibold text-green-600 mb-3">✓ Before photos uploaded successfully</p>
                  <div className="grid grid-cols-3 gap-2">
                    {uploadedPhotos.map((photo, index) => (
                      <img
                        key={index}
                        src={photo.url || photo}
                        alt={`Before ${index + 1}`}
                        className="w-full h-20 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Upload After Photo Section - Show after before photos uploaded */}
          {beforePhotosUploaded && !afterPhotosUploaded && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-primary-500 mb-2">Upload After Photo</h3>

              {/* Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-5 text-center bg-gray-50 mx-auto">
                <div className='rounded-full p-3 bg-primary-200 w-fit mx-auto mb-3'>
                  <img src={UploadCloudIcon} alt="Upload" className="w-8 h-8" />
                </div>
                <p className="text-primary-500 mb-4 font-medium">Select photos/videos to upload</p>

                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleAfterFileSelect}
                  className="hidden"
                  id="after-file-upload"
                />

                <label
                  htmlFor="after-file-upload"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium cursor-pointer transition-colors bg-primary-500 text-white hover:bg-blue-700"
                >
                  Select Files
                  <img src={UploadIcon} alt="Upload" className="w-5 h-5" />
                </label>
              </div>

              {/* Selected Files Preview & Upload */}
              {selectedAfterFiles.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    {selectedAfterFiles.length} file{selectedAfterFiles.length > 1 ? 's' : ''} selected
                  </p>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {selectedAfterFiles.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border-2 border-blue-200"
                        />
                        <button
                          onClick={() => setSelectedAfterFiles(selectedAfterFiles.filter((_, i) => i !== index))}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" strokeWidth={2} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSubmitAfterPhoto}
                      disabled={uploadingAfter}
                      loading={uploadingAfter}
                      variant="primary"
                      size="lg"
                    >
                      {uploadingAfter ? 'Uploading...' : `Upload ${selectedAfterFiles.length} Photo${selectedAfterFiles.length > 1 ? 's' : ''}`}
                    </Button>
                  </div>
                </div>
              )}

              {/* Successfully Uploaded Photos */}
              {afterPhotosUploaded && afterPhotos.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm font-semibold text-green-600 mb-3">✓ After photos uploaded successfully</p>
                  <div className="grid grid-cols-3 gap-2">
                    {afterPhotos.map((photo, index) => (
                      <img
                        key={index}
                        src={photo.url || photo}
                        alt={`After ${index + 1}`}
                        className="w-full h-20 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bottom Action Button */}
          <div className="flex justify-end pb-6">
            <Button
              onClick={() => setShowCompleteModal(true)}
              variant="secondary"
              className={` rounded-xl font-semibold text-lg transition-colors ${beforePhotosUploaded && afterPhotosUploaded && !completingJob
                ? 'bg-gray-200 text-gray-900 hover:bg-gray-300 cursor-pointer'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              disabled={!beforePhotosUploaded || !afterPhotosUploaded || completingJob}
            >
              {completingJob
                ? 'Completing Job...'
                : beforePhotosUploaded && afterPhotosUploaded
                  ? 'Complete Job'
                  : 'Upload Photos to Complete Job'
              }
            </Button>
          </div>

          {/* Complete Job Confirmation Modal */}
          {showCompleteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
                onClick={() => setShowCompleteModal(false)}
              ></div>
              <div className="relative bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                <div className="p-8 text-center">
                  <h3 className="text-2xl font-semibold text-primary-500 mb-3">Complete Job?</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-8">
                    Check your assigned work along with the before and after photos, and complete the job.
                  </p>
                  
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => {
                        setShowCompleteModal(false);
                        handleCompleteJob();
                      }}
                      className="w-full py-4 px-6 rounded-full bg-primary-500 text-white font-medium text-base hover:bg-blue-700 transition-shadow hover:shadow-lg shadow-blue-200 transition-colors cursor-pointer"
                    >
                      Complete Job
                    </button>
                    <button
                      onClick={() => setShowCompleteModal(false)}
                      className="w-full py-4 px-6 rounded-full bg-gray-100 text-primary-500 font-medium text-base hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                      Not Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CompleteJobPage;

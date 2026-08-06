import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Loader, PageHeader, JobOverviewCard } from '../../components';
import { Check, X, Calendar, DollarSign } from 'lucide-react';
import WeeklyPaymentBreakdown from '../../components/WeeklyPaymentBreakdown';
import { jobsAPI, paymentService } from '../../services/api';
import { generateWeeklySchedule, getNextPayment } from '../../utils/weeklyPaymentHelper';

const WeeklyJobCompletionPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentSchedule, setPaymentSchedule] = useState([]);
  const [totalQuote, setTotalQuote] = useState(0);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setLoading(true);

        // Fetch job details
        const jobResponse = await jobsAPI.getJobById(jobId);
        const jobData = jobResponse.data || jobResponse;
        setJob(jobData);

        // Generate payment schedule for weekly jobs
        if (jobData.frequency === 'Weekly' && jobData.preferredDays && jobData.repeatWeeks) {
          const schedule = generateWeeklySchedule(
            jobData.preferredDays,
            jobData.repeatWeeks,
            jobData.scheduledDate
          );

          // Update schedule with actual payment statuses from backend
          // This would come from your backend API
          const updatedSchedule = await fetchPaymentStatuses(jobId, schedule);
          setPaymentSchedule(updatedSchedule);
        }

        // Get total quote amount (this would come from accepted quote)
        setTotalQuote(jobData.quoteAmount || 30); // Placeholder

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

  const fetchPaymentStatuses = async (jobId, schedule) => {
    // This would be an API call to get payment statuses for each day
    // For now, return mock data
    return schedule.map((day, index) => ({
      ...day,
      status: index === 0 ? 'completed' : 'scheduled' // Mock: first day is completed
    }));
  };

  const handleConfirmPayment = async (day) => {
    try {
      setConfirmingPayment(true);
      setError('');

      // Call API to confirm payment for this specific day
      const response = await paymentService.confirmDailyPayment(jobId, {
        date: day.date,
        amount: day.dailyAmount
      });

      if (response.success) {
        // Update the schedule
        setPaymentSchedule(prev =>
          prev.map(d =>
            d.date === day.date
              ? { ...d, status: 'paid' }
              : d
          )
        );

        setSuccessMessage(`Payment confirmed for ${day.displayDate}`);

        // Redirect after a short delay
        setTimeout(() => {
          navigate('/my-jobs');
        }, 2000);
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      setError('Failed to confirm payment. Please try again.');
    } finally {
      setConfirmingPayment(false);
    }
  };

  const getNextPaymentDay = () => {
    return getNextPayment(paymentSchedule);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Loader message="Loading job details..." />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl p-8 text-center">
          <p className="text-red-500">Job not found</p>
        </div>
      </div>
    );
  }

  const nextPayment = getNextPaymentDay();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <PageHeader
        title="Weekly Job - Payment Confirmation"
        onBack={() => navigate(-1)}
        className="mb-6"
      />

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <Check className="w-5 h-5 text-green-600" />
          <p className="text-green-700 font-medium">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <X className="w-5 h-5 text-red-600" />
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      {/* Job Overview */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-6">
        <JobOverviewCard
          jobId={job.jobId || job._id}
          serviceTypeId={job.serviceTypeId}
          title={job.title}
          serviceType={job.serviceType}
          serviceDetail={job.serviceDetail}
          instructions={job.instructions}
          scheduledDate={job.scheduledDate}
          frequency={job.frequency}
          location={job.location?.address}
          photos={job.photos}
          viewerRole="customer"
          showQuotePill={false}
        />
      </div>

      {/* Next Payment Action */}
      {nextPayment && nextPayment.status === 'completed' && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Confirm Payment for {nextPayment.displayDate}
                </h3>
                <p className="text-gray-600">
                  {nextPayment.dayName} • Week {nextPayment.weekNumber}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary-500">
                ${(totalQuote / paymentSchedule.length).toFixed(2)}
              </p>
              <Button
                onClick={() => handleConfirmPayment(nextPayment)}
                disabled={confirmingPayment}
                loading={confirmingPayment}
                variant="primary"
                className="mt-2"
              >
                {confirmingPayment ? 'Confirming...' : 'Confirm Payment'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Schedule */}
      <WeeklyPaymentBreakdown
        schedule={paymentSchedule}
        totalQuote={totalQuote}
        showStatus={true}
        userType="customer"
        onPaymentAction={handleConfirmPayment}
      />
    </div>
  );
};

export default WeeklyJobCompletionPage;

import React, { useMemo, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  MapPin,
  BriefcaseBusiness,
  Calendar,
  CheckCircle2,
  Plus,
  TrendingUp,
} from "lucide-react";
import { Button, Loader } from "../../components";
import { useAuth } from "../../contexts/AuthContext";
import { jobsAPI, authAPI, subscriptionsAPI } from "../../services/api";

import CleanerBG from "../../assets/cleanerbg.svg";
import CTABG from "../../assets/cta_bg.jpg";
import BoldJobIcon from "../../assets/boldJob.svg";

const CleanerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAvailable, setIsAvailable] = useState(true);
  const swiperRef = useRef(null);
  const [activeJobs, setActiveJobs] = useState([]);
  const [completedJobs, setCompletedJobs] = useState([]);
  const [liveJobs, setLiveJobs] = useState([]);
  const [liveJobsCount, setLiveJobsCount] = useState(0);
  const [stats, setStats] = useState({ weeklyEarnings: 0, completedJobs: 0 });
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [dashboardError, setDashboardError] = useState("");
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [requireVerification, setRequireVerification] = useState(false);

  const formatLabel = (str) =>
    (str || "")
      .toString()
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const formatCurrency = (value) => {
    const amount = Number(value);
    if (Number.isNaN(amount)) return "$0";
    return `$${Math.round(amount).toLocaleString("en-AU")}`;
  };

  const goToPrev = () => {
    if (swiperRef.current) {
      swiperRef.current.swiper.slidePrev();
    }
  };

  const goToNext = () => {
    if (swiperRef.current) {
      swiperRef.current.swiper.slideNext();
    }
  };

  useEffect(() => {
    if (user && typeof user.isAvailable === "boolean") {
      setIsAvailable(user.isAvailable);
    } else if (user && typeof user.isActive === "boolean") {
      setIsAvailable(user.isActive);
    }
  }, [user]);

  const liveJobsLabel = loadingDashboard
    ? "Loading..."
    : `${liveJobsCount || 0} ${liveJobsCount === 1 ? "Job" : "Jobs"} Found`;

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) {
        setActiveJobs([]);
        setCompletedJobs([]);
        setLiveJobsCount(0);
        setStats({ weeklyEarnings: 0, completedJobs: 0 });
        setLoadingDashboard(false);
        return;
      }

      setLoadingDashboard(true);
      setDashboardError("");

      const cleanerId = (user.id || user._id || "").toString();

      const extractJobs = (response) =>
        response?.data?.jobs || response?.data || [];

      // Checks if ANY cleanerId inside job matches logged-in cleaner
      const doesJobBelongToCleaner = (job, cleanerId) => {
        if (!cleanerId) return false;

        const jobString = JSON.stringify(job);
        return jobString.includes(cleanerId);
      };

      const buildJobTitle = (job) =>
        job.serviceTypeId?.name ||
        job.title ||
        job.jobTitle ||
        (job.serviceTypeDisplay
          ? `${job.serviceTypeDisplay}${job.propertyType ? ` – ${formatLabel(job.propertyType)}` : ""}`
          : `${formatLabel(job.serviceType)} – ${formatLabel(job.propertyType)}`) ||
        "Job Detail";

      const getJobIdentifier = (job) =>
        job.jobId || job._id || job.id || job.referenceId || "Unknown Job";

      const getJobPrice = (job) =>
        Number(
          [
            job?.budget?.total,
            job?.paymentDetails?.totalAmount,
            job?.paymentSummary?.total,
            job?.quoteAmount,
            job?.quotedAmount,
            job?.quotedPrice,
            job?.price,
            job?.budget,
          ].find((v) => v !== undefined),
        ) || 0;

      const getJobNote = (job) => {
        if (job.paymentStatus) return formatLabel(job.paymentStatus);
        if (job.payoutStatus) return formatLabel(job.payoutStatus);
        if (job.quoteStatus) return formatLabel(job.quoteStatus);
        if (job.statusNote) return formatLabel(job.statusNote);
        if (job.note) return formatLabel(job.note);
        return "";
      };

      const getJobLocation = (job) => {
        if (job.location?.fullAddress) {
          return job.location.fullAddress;
        }
        if (job.location?.address) {
          return job.location.address;
        }
        if (job.address) {
          return job.address;
        }
        return "Location not specified";
      };

      const getJobDate = (job) => {
        // Prefer scheduledDate, fallback to createdAt
        const dateToUse = job.scheduledDate || job.createdAt || job.updatedAt;
        if (!dateToUse) return "Date not specified";

        try {
          const date = new Date(dateToUse);
          if (Number.isNaN(date.getTime())) return "Date not specified";

          const day = date.getDate().toString().padStart(2, "0");
          const month = date.toLocaleDateString("en-AU", { month: "short" });
          const year = date.getFullYear();

          return `${day} ${month} ${year}`;
        } catch (error) {
          return "Date not specified";
        }
      };

      const getAcceptedQuotePrice = (job, cleanerId) => {
        if (!job.quotes || !Array.isArray(job.quotes) || !cleanerId)
          return null;

        // Find accepted quote for this cleaner
        const acceptedQuote = job.quotes.find((quote) => {
          const quoteCleanerId =
            quote.cleanerId?._id || quote.cleanerId?.id || quote.cleanerId;
          const isMyQuote = quoteCleanerId?.toString() === cleanerId.toString();
          const isAccepted = quote.status === "accepted";
          return isMyQuote && isAccepted;
        });

        if (acceptedQuote) {
          return (
            acceptedQuote.price ||
            acceptedQuote.quoteAmount ||
            acceptedQuote.amount ||
            null
          );
        }

        return null;
      };

      const getStatusRaw = (job) =>
        job.status ||
        job.jobStatus ||
        job.currentStatus ||
        job.state ||
        job.assignmentStatus ||
        "";

      const normalizeStatus = (status) =>
        (status || "").toString().toLowerCase().trim();

      const inProgressStatuses = new Set([
        "in_progress",
        "in progress",
        "in-progress",
        "accepted",
        "pending_customer_confirmation",
      ]);

      const completedStatuses = new Set(["completed"]);

      try {
        // Fetch current user details to get the most accurate completedJobs count
        const profileResponse = await authAPI
          .getCurrentUser()
          .catch(() => null);
        const freshUser =
          profileResponse?.data?.user ||
          profileResponse?.user ||
          (profileResponse?.success ? profileResponse.data : null);

        // Use the new feed API for live jobs (posted jobs)
        const allJobsResponse = await jobsAPI
          .getCleanerJobFeed({ tab: "posted", page: 1, limit: 200 })
          .catch(() => null);
        
        if (allJobsResponse?.requireVerification) {
          setRequireVerification(true);
        } else {
          setRequireVerification(false);
        }

        const allJobs = extractJobs(allJobsResponse);

        const inProgressJobs = allJobs
          .filter((job) => doesJobBelongToCleaner(job, cleanerId))
          .filter((job) =>
            inProgressStatuses.has(normalizeStatus(getStatusRaw(job))),
          )
          .filter(
            (job, index, self) =>
              getJobIdentifier(job) &&
              index ===
                self.findIndex(
                  (other) =>
                    getJobIdentifier(other)?.toString() ===
                    getJobIdentifier(job)?.toString(),
                ),
          )
          .sort(
            (a, b) =>
              new Date(b.updatedAt || b.completedAt || b.createdAt || 0) -
              new Date(a.updatedAt || a.completedAt || a.createdAt || 0),
          );

        const formattedActiveJobs = inProgressJobs.slice(0, 12).map((job) => {
          const statusRaw = getStatusRaw(job);
          const quotePrice = getAcceptedQuotePrice(job, cleanerId);
          const jobLocation = getJobLocation(job);
          const jobDate = getJobDate(job);

          return {
            id: getJobIdentifier(job),
            rawId: job._id || job.id || job.jobId,
            title: buildJobTitle(job),
            status: formatLabel(statusRaw || "In Progress"),
            statusRaw,
            price: getJobPrice(job),
            quotePrice: quotePrice, // Quote price for in-progress jobs
            location: jobLocation,
            date: jobDate,
            note: getJobNote(job),
            category: job.categoryId?.name || "Cleaning",
            distance: job.distance !== undefined ? job.distance : null,
            customer: job.customerId || null,
          };
        });
console.log("formattedActiveJobs =",formattedActiveJobs);

        setActiveJobs(formattedActiveJobs);

        const completedJobEntries = allJobs
          .filter((job) => doesJobBelongToCleaner(job, cleanerId))
          .filter((job) =>
            completedStatuses.has(normalizeStatus(getStatusRaw(job))),
          )
          .filter((job, index, self) => {
            const id = getJobIdentifier(job);
            return (
              id &&
              index ===
                self.findIndex((other) => getJobIdentifier(other) === id)
            );
          })
          .sort(
            (a, b) =>
              new Date(b.completedAt || b.updatedAt || b.createdAt || 0) -
              new Date(a.completedAt || a.updatedAt || a.createdAt || 0),
          );

        const formattedCompletedJobs = completedJobEntries
          .slice(0, 12)
          .map((job) => ({
            id: getJobIdentifier(job),
            rawId: job._id || job.id || job.jobId,
            title: buildJobTitle(job),
            price: getJobPrice(job),
            location: getJobLocation(job),
            date: getJobDate(job),
            completedAt:
              job.completedAt || job.updatedAt || job.createdAt || null,
            note: getJobNote(job),
            status: "Completed",
            statusRaw: "completed",
            category: job.categoryId?.name || "Cleaning",
            distance: job.distance !== undefined ? job.distance : null,
            customer: job.customerId || null,
          }));

        setCompletedJobs(formattedCompletedJobs);

        const liveStatuses = new Set(["posted", "quoted"]);
        const rawLiveJobs = allJobs
          .filter((job) => !doesJobBelongToCleaner(job, cleanerId))
          .filter((job) =>
            liveStatuses.has(normalizeStatus(getStatusRaw(job))),
          );

        const formattedLiveJobs = rawLiveJobs.slice(0, 10).map((job) => {
          const statusRaw = getStatusRaw(job);
          return {
            id: getJobIdentifier(job),
            rawId: job._id || job.id || job.jobId,
            title: buildJobTitle(job),
            status: formatLabel(statusRaw || "Available"),
            statusRaw,
            price: getJobPrice(job),
            location: getJobLocation(job),
            date: getJobDate(job),
            note: getJobNote(job),
            category: job.categoryId?.name || "Cleaning",
            customer: job.customerId || null,
          };
        });

        setLiveJobs(formattedLiveJobs);

        // Use totalAvailable from response if provided, otherwise fallback to local filter length
        setLiveJobsCount(allJobsResponse?.totalAvailable ?? rawLiveJobs.length);

        const recentCompleted = completedJobEntries.filter((job) => {
          const completedAt = new Date(
            job.completedAt || job.updatedAt || job.createdAt || 0,
          );
          if (Number.isNaN(completedAt.getTime())) return false;
          const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
          return completedAt.getTime() >= sevenDaysAgo;
        });

        const fallbackWeeklyEarnings = recentCompleted.reduce(
          (total, job) => total + getJobPrice(job),
          0,
        );

        setStats({
          weeklyEarnings: fallbackWeeklyEarnings,
          completedJobs:
            freshUser?.completedJobs ??
            user?.completedJobs ??
            completedJobEntries.length ??
            0,
        });
      } catch (error) {
        setDashboardError(error.message || "Failed to load dashboard data.");
      } finally {
        setLoadingDashboard(false);
      }
    };

    fetchDashboardData();

    const fetchSubscription = async () => {
      try {
        const res = await subscriptionsAPI
          .getMyStatus()
          .catch(() => ({ success: false }));
        if (res.success && res.data?.subscription?.status === "active") {
          setSubscriptionStatus(res.data);
        }
      } catch (err) {
        console.error("Error fetching subscription status:", err);
      } finally {
        setLoadingSubscription(false);
      }
    };
    fetchSubscription();
  }, [user]);

  const isExpired = useMemo(() => {
    if (!subscriptionStatus?.subscription?.currentPeriodEnd) return false;
    return new Date(subscriptionStatus.subscription.currentPeriodEnd) < new Date();
  }, [subscriptionStatus]);

  const canBuyCredits = useMemo(() => {
    if (!subscriptionStatus) return false;
    // Rule: can buy credits ONLY if NOT expired AND credits are exhausted
    // Exhausted means less than what's needed for a lead (default 1 if missing)
    const creditsPerLead = subscriptionStatus.subscription?.planId?.creditsPerLead || 1;
    return !isExpired && subscriptionStatus.availableCredits < creditsPerLead;
  }, [subscriptionStatus, isExpired]);

  const handleJobClick = (job) => {
    const status = (job.statusRaw || job.status || "").toLowerCase().trim();
    const jobIdentifier = job.rawId || job.id;

    if (!jobIdentifier) {
      navigate("/cleaner-jobs", { state: { tab: "live-jobs" } });
      return;
    }

    if (status === "completed" || status === "assigned") {
      navigate(`/cleaner-job-completed/${jobIdentifier}`);
    } else {
      // Coming from dashboard "Live Jobs" context
      navigate(`/job-details/${jobIdentifier}`, { state: { fromTab: "posted" } });
    }
  };

  const greetingName = useMemo(() => {
    const name = user?.firstName || user?.name || "";
    return name ? formatLabel(name) : "Cleaner";
  }, [user]);

  const swiperJobs = useMemo(() => {
    if (!subscriptionStatus) return liveJobs;
    if (activeJobs.length === 0 && completedJobs.length === 0) return liveJobs;
    return [...activeJobs, ...completedJobs];
  }, [activeJobs, completedJobs, liveJobs, subscriptionStatus]);

  return (
    <div className="pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Greeting + Availability */}
        <div className="flex flex-col mt-5 sm:mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 leading-tight">
            Hi, {greetingName}
          </h2>
          <p className="text-gray-500 font-medium text-sm sm:text-md">
            Welcome to AussieMate
          </p>
          <div className="mt-4">
            <p className="text-gray-900 font-semibold">Start getting cleaning jobs near you.</p>
            <p className="text-gray-500 font-medium">Purchase a plan to unlock customer leads.</p>
          </div>
        </div>

        {/* Subscription / Credits Section */}
        {!loadingSubscription && (
          <div className="mt-4 sm:mt-5 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
            {subscriptionStatus ? (
              <>
                <div className="rounded-2xl p-5 sm:p-6 shadow-sm overflow-hidden relative">
                  {/* Background Image */}
                  <div className="absolute inset-0">
                    <img
                      src={CleanerBG}
                      alt="Cleaner Background"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Decoration */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none" />

                  <div className="relative z-10">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg sm:text-xl font-semibold text-[#111111] flex items-center gap-2">
                        Credits Usage
                      </h3>
                    </div>

                    <div className="mb-4 relative group cursor-pointer">
                      <div className="w-full h-4 bg-[#E5E7EB] rounded-full overflow-hidden  relative">
                        <div
                          className="h-full bg-[#22C55E] rounded-full transition-all duration-1000 relative"
                          style={{ 
                            width: `${Math.min(100, Math.max(0, ((subscriptionStatus.subscription?.planId?.creditsPerMonth - subscriptionStatus.availableCredits) / subscriptionStatus.subscription?.planId?.creditsPerMonth) * 100))}%`,
                            backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)',
                            backgroundSize: '1rem 1rem'
                          }}
                        />
                      </div>

                      {/* Progress Indicator Tooltip */}
                      <div
                        className="absolute left-0 -bottom-2 transform translate-y-full opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none"
                        style={{
                          left: `${Math.min(90, Math.max(0, ((subscriptionStatus.subscription?.planId?.creditsPerMonth - subscriptionStatus.availableCredits) / subscriptionStatus.subscription?.planId?.creditsPerMonth) * 100))}%`,
                        }}
                      >
                        <div className="relative bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm whitespace-nowrap">
                          {/* Triangle decorator */}
                          <div className="absolute -top-1 left-4 w-2 h-2 bg-white border-t border-l border-gray-200 rotate-45" />
                          <p className="text-sm font-bold text-gray-900">
                            {subscriptionStatus.subscription?.planId?.creditsPerMonth - subscriptionStatus.availableCredits} <span className="text-gray-400 font-medium">of</span> {subscriptionStatus.subscription?.planId?.creditsPerMonth} <span className="text-gray-400 font-normal">Credits Used</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mb-4 px-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-500">
                        Remaining Credits:{" "}
                        <span className="text-black font-semibold">
                          {subscriptionStatus.availableCredits}
                        </span>
                      </p>
                      <p className="text-xs sm:text-sm font-medium text-gray-500">
                        Estimated leads:{" "}
                        <span className="text-black font-semibold">
                          {Math.floor(
                            subscriptionStatus.availableCredits /
                              (subscriptionStatus.subscription?.planId
                                ?.creditsPerLead || 1),
                          )}
                        </span>
                      </p>
                    </div>

                    {canBuyCredits && (
                      <button 
                        onClick={() => navigate('/buy-credits')}
                        className="flex items-center gap-2 cursor-pointer text-primary-500 cursor-pointer font-black text-sm hover:translate-x-1 transition-transform cursor-pointer"
                      >
                        <span className="flex items-center justify-center w-4 h-4 bg-[#1F6FEB] rounded-full font-medium ">
                          <Plus className="w-3 h-3 text-white stroke-[3]" />
                        </span>
                        Buy Credits
                      </button>
                    )}
                  </div>
                </div>

                {isExpired && (
                  <div className="mt-4 bg-primary-200 rounded-2xl p-6 border border-primary-200 flex flex-col sm:flex-row items-center gap-4 animate-in fade-in">
                    <div className="w-12 h-12 bg-primary-200 rounded-2xl border border-primary-200 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-6 h-6 text-primary-600" />
                    </div>
                    <div className="text-center sm:text-left flex-1">
                      <p className="text-xl font-medium text-gray-900 mb-2">Subscription Expired</p>
                      <p className="text-gray-500 font-normal max-w-4xl text-xs">Your subscription has ended. Renew now to continue getting new leads.</p>
                    </div>
                    <Button 
                      variant="primary" 
                      size="sm" 
                      className="rounded-xl px-6"
                      onClick={() => navigate('/my-subscription')}
                    >
                      Renew Plan
                    </Button>
                  </div>
                )}
              </>
            ) : (
              /* Start Getting Cleaning Leads (Not Subscribed) */
              <div className="rounded-2xl p-6 sm:p-8 relative overflow-hidden">
                {/* Background Image */}
                <div className="absolute inset-0">
                  <img
                    src={CTABG}
                    alt="Background"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Start Getting Cleaning Leads
                  </h3>
                  <p className="text-gray-500 font-medium mb-6">
                    To respond to customer jobs, you need an active subscription
                    plan. Choose a plan and start receiving leads today.
                  </p>

                  <div className="space-y-3 mb-8">
                    {[
                      "Access verified cleaning jobs",
                      "Chat with customers instantly if you're among the first 3 applicants",
                      "Get up to 15 leads per month",
                    ].map((feat, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-gray-500" />
                        </div>
                        <span className="text-sm font-medium text-gray-600">
                          {feat}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Button
                    variant="primary"
                    className="w-full sm:w-auto rounded-2xl h-14 px-10 font-bold text-lg"
                    onClick={() => navigate("/my-subscription")}
                  >
                    View Subscription Plans
                  </Button>
                </div>
              </div>
            )}
        <div 
          className="mt-6 bg-white rounded-xl border border-gray-100 p-4 sm:p-5 flex justify-between items-center shadow-sm cursor-pointer hover:border-primary-200 hover:shadow-md transition-all group"
          onClick={() => navigate("/cleaner-jobs", { state: { tab: "live-jobs" } })}
        >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center group-hover:scale-105 transition-transform">
                <img
                  src={BoldJobIcon}
                  alt="jobs"
                  className="w-10 h-10"
                />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                Live Jobs near you
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-primary-600 font-semibold text-sm bg-primary-50/50 px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></span>
                {liveJobsLabel}
              </div>
              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-primary-50 transition-colors">
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600" />
              </div>
            </div>
          </div>


        {/* Active Jobs - Only if Subscribed */}
        <div className="mt-6 mb-12">
            <div className="flex items-center justify-between mb-4 bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5">
              <h3 className="text-lg font-semibold text-gray-900">
                {subscriptionStatus ? "Your Assigned Jobs" : "Available Jobs"}
              </h3>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between sm:justify-end space-x-2">
              <Button
                onClick={() =>
                  navigate("/cleaner-jobs", { state: { tab: subscriptionStatus ? "assigned" : "live-jobs" } })
                }
                size="sm"
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium text-xs sm:text-sm rounded-full px-2 flex items-center justify-center space-x-1"
                icon={
                  <BriefcaseBusiness
                    className="w-3 h-3 sm:w-4 sm:h-4 md:w-4 md:h-4"
                    strokeWidth={2}
                  />
                }
              >
                <span className="hidden sm:inline">{subscriptionStatus ? "View Assigned Jobs" : "View Jobs"}</span>
                <span className="sm:hidden">Jobs</span>
              </Button>

              <div className="flex space-x-1 sm:space-x-2">
                <Button
                  onClick={goToPrev}
                  variant="ghost"
                  size="xs"
                  className="rounded-full p-1 sm:p-1.5 md:p-2"
                  icon={
                    <ChevronLeft
                      className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-600"
                      strokeWidth={2}
                    />
                  }
                />

                <Button
                  onClick={goToNext}
                  variant="ghost"
                  size="xs"
                  className="rounded-full p-1 sm:p-1.5 md:p-2"
                  icon={
                    <ChevronRight
                      className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-600"
                      strokeWidth={2}
                    />
                  }
                />
              </div>
            </div>
          </div>

          {dashboardError && (
            <div className="mt-3 text-sm text-red-500 font-medium">
              {dashboardError}
            </div>
          )}

          {loadingDashboard ? (
            <div className="py-8 flex justify-center">
              <Loader message="Loading your jobs..." />
            </div>
          ) : swiperJobs.length > 0 ? (
            <Swiper
              ref={swiperRef}
              modules={[Autoplay]}
              spaceBetween={16}
              slidesPerView={1}
              breakpoints={{
                640: {
                  slidesPerView: 2,
                  spaceBetween: 16,
                },
                1024: {
                  slidesPerView: 3,
                  spaceBetween: 16,
                },
              }}
              autoplay={{
                delay: 3000,
                disableOnInteraction: false,
              }}
              speed={800}
              effect="slide"
              loop={swiperJobs.length > 1}
              className="!pb-4 mt-3"
            >
              {swiperJobs.map((job, index) => (
                <SwiperSlide key={`job-${job.id || index}`}>
                  <div
                    className="bg-white rounded-2xl border border-[#F3F3F3] p-5 sm:p-6 shadow-sm h-[210px] cursor-pointer transition-all duration-300"
                    onClick={() => handleJobClick(job)}
                  >
                      <div className="flex flex-col h-full relative">
                        {/* Red Left Accent Bar */}
                        
                        <div className="flex-1">
                          <div className="flex flex-col gap-1 mb-3">
                            <span className="text-[13px] font-medium text-gray-400">
                              {job.category}
                            </span>
                            <div className="text-[#111827] font-semibold text-[17px] leading-tight capitalize line-clamp-2">
                              {job.title}
                            </div>
                          </div>
 
                          <div className="space-y-2.5">
                            <div className="flex items-center text-gray-500 font-medium text-[14px]">
                              <Calendar
                                className="w-5 h-5 mr-3 flex-shrink-0 text-gray-400"
                                strokeWidth={1.5}
                              />
                              <span>{job.date || "Date not specified"}</span>
                            </div>
                            
                            <div className="flex items-center text-gray-500 font-medium text-[14px]">
                              <MapPin
                                className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5 text-gray-400"
                                strokeWidth={1.5}
                              />
                              <span className="line-clamp-2 leading-tight">
                                {job.location || "Location not specified"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Customer Info */}
                        {job.customer && (
                          <div className="flex items-center gap-2 mt-2 border-t border-gray-50">
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
                              Posted by <span className="font-semibold text-gray-700 capitalize">{job.customer.firstName}</span>
                            </p>
                          </div>
                        )}
                      </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          ) : requireVerification ? (
            <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-gray-200 shadow-sm">
              <div className="max-w-sm mx-auto px-6">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CalendarDays className="w-8 h-8 text-blue-500" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Verification Pending</h4>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Your documents are being reviewed. Jobs will show up here once you are verified by our team.
                </p>
              </div>
            </div>
          ) : !subscriptionStatus ? (
            <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-gray-200 shadow-sm">
              <div className="max-w-sm mx-auto px-6">
                <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-primary-500" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">Plan Required</h4>
                <p className="text-gray-500 text-sm leading-relaxed mb-6">
                  You are verified! Now purchase a plan to unlock customer leads and start earning.
                </p>
                <Button 
                  variant="primary" 
                  size="sm" 
                  className="rounded-xl px-8"
                  onClick={() => navigate('/my-subscription')}
                >
                  Browse Plans
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-gray-200 shadow-sm">
              <div className="max-w-sm mx-auto px-6">
                <p className="text-gray-400 font-medium">No active jobs right now.</p>
                <p className="text-gray-500 text-sm mt-1">Explore live jobs to get started.</p>
              </div>
            </div>
          )}
          
        </div>
      </div>
    )}
  </div>
</div>
);
};

export default CleanerDashboard;

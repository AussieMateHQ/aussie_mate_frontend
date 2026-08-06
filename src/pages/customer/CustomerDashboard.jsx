import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { BriefcaseBusiness, ChevronLeft, ChevronRight } from "lucide-react";
import { Button, Loader } from "../../components";
import { jobsAPI, userAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { getStatusChip } from "../../utils/statusUtils";
import RewardImage from "../../assets/Reward.jpg";
import CalendarIcon from "../../assets/Calendar.svg";
import PersonIcon from "../../assets/user-check.svg";
import SearchIcon from "../../assets/search.svg";
import PlusIcon from "../../assets/plus.svg";
import CleaningImage from "../../assets/Cleaning.png";
import HandymanImage from "../../assets/Handyman.png";
import HousekeepingImage from "../../assets/Housekeeping.png";
import PetSittingImage from "../../assets/Pet Sitting.png";
import NDISSupportImage from "../../assets/NDIS Support.png";
import CommercialCleaningImage from "../../assets/commercialCleaning.svg";
import OtherImg from "../../assets/cleaner/Clean.svg";
import BondImg from "../../assets/cleaner/Cleaner.svg";
import GeneralImg from "../../assets/cleaner/Cleaning.svg";
import CommercialImg from "../../assets/cleaner/House.svg";
import LockImg from "../../assets/cleaner/Lock.svg";
import VerifiedImg from "../../assets/cleaner/Paymentt.svg";
import StarImg from "../../assets/cleaner/Star.svg";
const CustomerDashboard = () => {
  const [ongoingJobs, setOngoingJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);
  const swiperRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();

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

  // Helper functions
  const formatDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    const opts = { day: "2-digit", month: "short" };
    const date = d.toLocaleDateString("en-AU", opts);
    const time = d.toLocaleTimeString("en-AU", {
      hour: "numeric",
      minute: "2-digit",
    });
    return `${date}, ${time}`;
  };

  const getActionText = (status) => {
    const s = (status || "").toString().toLowerCase();
    if (["in_progress", "in progress", "started"].includes(s))
      return "Track Job";
    if (s === "completed") return "Rate & Review";
    return "View Quotes";
  };

  const handleViewJobs = () => {
    navigate("/my-jobs", { state: { tab: "all" } });
  };
  const handleViewRewards = () => {
    navigate("/rewards");
  };

  // Get current user ID
  useEffect(() => {
    const getCurrentUserId = async () => {
      try {
        if (user?.id) {
          setCurrentUserId(user.id);
        } else if (user?._id) {
          setCurrentUserId(user._id);
        } else {
          const userProfile = await userAPI.getProfile();
          const userData =
            userProfile.data?.user || userProfile.data || userProfile;
          setCurrentUserId(userData?._id || userData?.id);
        }
      } catch (error) {
        console.error("Error fetching user ID:", error);
        setError("Failed to load user information");
      }
    };

    getCurrentUserId();
  }, [user]);

  useEffect(() => {
    const fetchJobs = async () => {
      if (!currentUserId) return;

      try {
        setLoading(true);
        const res = await jobsAPI.getMyJobs({
          page: 1,
          limit: 10,
          tab: "all",
        });
        const list = res?.data || res || [];

        const normalized = list.map((j) => {
          const status = (j.status || "").toString();

          // Improved name extraction
          const cleaner =
            j.assignedCleanerId ||
            j.completedBy ||
            j.assignedCleaner ||
            j.cleaner;
          let assignedTo = null;
          if (cleaner) {
            if (cleaner.firstName) {
              assignedTo =
                `${cleaner.firstName} ${cleaner.lastName || ""}`.trim();
            } else {
              assignedTo =
                cleaner.name || cleaner.fullName || j.assignedTo || null;
            }
          }

          const dateLabel = formatDate(j.createdAt);

          const title =
            j.title ||
            j.serviceTypeDisplay ||
            `${(j.serviceType || "").toString().replace(/\b\w/g, (c) => c.toUpperCase())}`.trim();
          const categoryName =
            j.categoryName ||
            (j.serviceTypeDisplay && j.serviceTypeDisplay.split(" ")[0]) ||
            "Other Categories";
          const statusChip = getStatusChip(status);

          return {
            id: j.jobId || j._id || j.reference || j.id,
            rawId: j.id || j._id, // Add raw database ID for navigation if needed
            title,
            categoryName,
            status: statusChip.label,
            rawStatus: status.toLowerCase(),
            date: dateLabel,
            action: getActionText(status),
            assignedTo,
          };
        });

        setOngoingJobs(normalized);
      } catch (e) {
        setError("Failed to load jobs");
        console.error("Error fetching jobs:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [currentUserId]);

  const serviceCategories = [
    {
      id: "cleaning",
      name: "Cleaning",
      image: CleaningImage,
      description: "Professional cleaning services",
    },
    {
      id: "housekeeping",
      name: "Housekeeping",
      image: HousekeepingImage,
      description: "Complete housekeeping solutions",
    },
    {
      id: "supportServices",
      name: "Support Services",
      image: NDISSupportImage,
      description: "Support services",
    },
    {
      id: "commercialCleaning",
      name: "Commercial Cleaning",
      image: CommercialCleaningImage,
      description: "Retail auditing services",
    },
    {
      id: "petsitting",
      name: "Pet Sitting",
      image: PetSittingImage,
      description: "Pet care and sitting",
    },
    {
      id: "handyman",
      name: "Handyman",
      image: HandymanImage,
      description: "Repair and maintenance",
    },
  ];

  return (
    <>
      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto py-1 px-4 sm:px-6 lg:px-8 pb-6">
        {/* Combined Search and Post Job Section */}
        <div className="mt-4 mb-4 sm:mb-6">
          {/* Search Bar */}
          {/* <div className="relative w-full bg-white rounded-full border border-[#E5E7EB]">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center justify-center ">
              <img
                src={SearchIcon}
                alt="Search"
                className="w-4 h-4 sm:w-5 sm:h-5"
              />
            </div>
            <input
              type="text"
              placeholder="Search services, e.g. bond clean..."
              className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 bg-gray-50 rounded-xl text-sm text-primary-200 font-medium focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all"
            />
          </div> */}

          {/* Divider */}
          {/* <div className="h-px bg-gray-100 w-full"></div> */}

          {/* Post Job Layout Section */}
          {/* <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h2 className="text-sm sm:text-xl font-semibold text-[#111827] mb-1">
                Book a cleaner in minutes
              </h2>
              <p className="text-sm sm:text-base text-gray-400 font-medium">
                Post job &rarr; Receive quotes &rarr; Choose &amp; pay securely
              </p>
            </div>
            <Button
              onClick={() => navigate("/post-new-job")}
              variant="primary"
              size="md"
              className="w-full sm:w-auto rounded-full"
            >
              <span className="w-5 h-5 flex items-center justify-center rounded-full bg-white text-primary-600">
                +
              </span>
              Post Job
            </Button>
          </div> */}
        </div>

        {/* MatePoints Section */}
        <div className="my-4 sm:my-6 rounded-2xl shadow-custom">
          <div className="relative rounded-xl p-3 sm:p-4 md:p-6 overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0">
              <img
                src={RewardImage}
                alt="Reward Background"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Content Overlay */}
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-base sm:text-lg md:text-xl font-semibold text-primary-500 mb-1">
                  Book a cleaner in minutes
                </h3>
                <p className="text-xs sm:text-sm md:text-base text-[#374151] mb-3 sm:mb-4">
                  Post job &rarr; Receive quotes &rarr; Choose &amp; pay
                  securely
                </p>
                <Button
                  onClick={() => navigate("/post-new-job")}
                  size="sm"
                  className="bg-[#111827] hover:bg-[#111827] text-white px-3 sm:px-4 py-2 sm:py-3 rounded-[8px] text-xs sm:text-sm font-medium"
                >
                  <span className="w-5 h-5 flex items-center justify-center rounded-full bg-white text-black">
                    +
                  </span>
                  Post Job
                </Button>
              </div>
            </div>
          </div>
        </div>


        {/* Popular Services */}
        <div className="mb-6 sm:mb-8">
          <h3 className="text-[18px] sm:text-xl font-semibold text-[#111827] mb-4">
            Popular Services
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
            <div
              onClick={() => navigate("/post-new-job", { state: { categoryName: "Domestic / General Cleaning" } })}
              className="relative overflow-hidden bg-[#FCFCFF] rounded-[16px] border-1 border-[#E8EEFF] p-4 sm:p-6 flex flex-col items-center justify-center cursor-pointer shadow-sm hover:shadow-md transition-all"
            >
              {/* 🔵 Top-left glow */}
              <div className="absolute -top-10 -left-10 w-[120px] h-[120px] bg-[#FFD6FF] opacity-40 blur-[40px] rounded-full"></div>

              <img
                src={GeneralImg}
                alt="General Cleaning"
                className="w-[60px] h-[60px] sm:w-[80px] sm:h-[80px] object-contain mb-3 relative z-10"
              />

              <span className="text-[13px] sm:text-[15px] font-medium text-[#111827] text-center relative z-10">
                General Cleaning
              </span>
            </div>

            <div
              onClick={() => navigate("/post-new-job", { state: { categoryName: "Commercial Cleaning" } })}
              className="relative overflow-hidden bg-[#FCFCFF] rounded-[16px] border-1 border-[#E8EEFF] p-4 sm:p-6 flex flex-col items-center justify-center cursor-pointer shadow-sm hover:shadow-md transition-all"
            >
              {/* 🔵 Top-left glow */}
              <div className="absolute -top-10 -left-10 w-[120px] h-[120px] bg-[#FFD6FF] opacity-40 blur-[40px] rounded-full"></div>
              <img
                src={CommercialImg}
                alt="Commercial Cleaning"
                className="w-[60px] h-[60px] sm:w-[80px] sm:h-[80px] object-contain mb-3"
              />
              <span className="text-[13px] sm:text-[15px] font-medium text-[#111827] text-center">
                Commercial Cleaning
              </span>
            </div>

            <div
              onClick={() => navigate("/post-new-job", { state: { categoryName: "Bond / End-of-Lease Cleaning" } })}
              className="relative overflow-hidden bg-[#FCFCFF] rounded-[16px] border-1 border-[#E8EEFF] p-4 sm:p-6 flex flex-col items-center justify-center cursor-pointer shadow-sm hover:shadow-md transition-all"
            >
              {/* 🔵 Top-left glow */}
              <div className="absolute -top-10 -right-10 w-[120px] h-[120px] bg-[#FFD6FF] opacity-40 blur-[40px] rounded-full"></div>
              <img
                src={BondImg}
                alt="Bond Cleaning"
                className="w-[60px] h-[60px] sm:w-[80px] sm:h-[80px] object-contain mb-3"
              />
              <span className="text-[13px] sm:text-[15px] font-medium text-[#111827] text-center">
                Bond Cleaning
              </span>
            </div>

            <div
              onClick={() => navigate("/post-new-job", { state: { categoryName: "HOUSEKEEPER" } })}
              className="relative overflow-hidden bg-[#FCFCFF] rounded-[16px] border-1 border-[#E8EEFF] p-4 sm:p-6 flex flex-col items-center justify-center cursor-pointer shadow-sm hover:shadow-md transition-all"
            >
              {/* 🔵 Top-left glow */}
              <div className="absolute -top-10 -right-10 w-[120px] h-[120px] bg-[#D6F5FF] opacity-40 blur-[40px] rounded-full"></div>
              <img
                src={HousekeepingImage}
                alt="Housekeeper"
                className="w-[60px] h-[60px] sm:w-[80px] sm:h-[80px] object-contain mb-3"
              />
              <span className="text-[13px] sm:text-[15px] font-medium text-[#111827] text-center">
                Housekeeper
              </span>
            </div>

            <div
              onClick={() => navigate("/post-new-job", { state: { categoryName: "Pet Sitting" } })}
              className="relative overflow-hidden bg-[#FCFCFF] rounded-[16px] border-1 border-[#E8EEFF] p-4 sm:p-6 flex flex-col items-center justify-center cursor-pointer shadow-sm hover:shadow-md transition-all"
            >
              {/* 🔵 Top-left glow */}
              <div className="absolute -top-10 -right-10 w-[120px] h-[120px] bg-[#FFE4D6] opacity-40 blur-[40px] rounded-full"></div>
              <img
                src={PetSittingImage}
                alt="Pet Sitting"
                className="w-[60px] h-[60px] sm:w-[80px] sm:h-[80px] object-contain mb-3"
              />
              <span className="text-[13px] sm:text-[15px] font-medium text-[#111827] text-center">
                Pet Sitting
              </span>
            </div>

            <div
              onClick={() => navigate("/post-new-job", { state: { categoryName: "Handyman" } })}
              className="relative overflow-hidden bg-[#FCFCFF] rounded-[16px] border-1 border-[#E8EEFF] p-4 sm:p-6 flex flex-col items-center justify-center cursor-pointer shadow-sm hover:shadow-md transition-all"
            >
              {/* 🔵 Top-left glow */}
              <div className="absolute -top-10 -right-10 w-[120px] h-[120px] bg-[#E4FFD6] opacity-40 blur-[40px] rounded-full"></div>
              <img
                src={HandymanImage}
                alt="Handyman"
                className="w-[60px] h-[60px] sm:w-[80px] sm:h-[80px] object-contain mb-3"
              />
              <span className="text-[13px] sm:text-[15px] font-medium text-[#111827] text-center">
                Handyman
              </span>
            </div>
          </div>
        </div>

        {/* Ongoing Jobs Section */}
        <div className="bg-white px-4 sm:px-7 py-4 sm:py-6 rounded-2xl shadow-custom">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3 sm:gap-0">
            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-primary-500">
              My Jobs
            </h3>

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <Button
                onClick={handleViewJobs}
                size="sm"
                className="rounded-full px-3 sm:px-5 py-1.5 sm:py-2 flex items-center gap-2"
              >
                <BriefcaseBusiness className="w-4 h-4" strokeWidth={2} />
                <span>View Jobs</span>
              </Button>

              <div className="flex space-x-2">
                <Button
                  onClick={goToPrev}
                  variant="ghost"
                  size="sm"
                  className="rounded-full p-1.5 sm:p-2 "
                >
                  <ChevronLeft
                    className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600"
                    strokeWidth={2}
                  />
                </Button>

                <Button
                  onClick={goToNext}
                  variant="ghost"
                  size="sm"
                  className="rounded-full p-1.5 sm:p-2"
                >
                  <ChevronRight
                    className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600"
                    strokeWidth={2}
                  />
                </Button>
              </div>
            </div>
          </div>

          {loading && (
            <div className="py-8">
              <Loader message="Loading your jobs..." />
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <div className="text-sm text-red-600">{error}</div>
            </div>
          )}

          {!loading && !error && ongoingJobs.length === 0 && (
            <div className="text-center py-8">
              <div className="text-sm text-gray-500">No jobs found</div>
            </div>
          )}

          {!loading && !error && ongoingJobs.length > 0 && (
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
              loop={ongoingJobs.length > 1}
              className="!pb-4"
            >
              {ongoingJobs.map((job) => (
                <SwiperSlide key={job.id}>
                  <div
                    onClick={() => {
                      if (
                        job.rawStatus === "completed" ||
                        job.rawStatus === "assigned" ||
                        job.rawStatus === "accepted"
                      ) {
                        navigate(`/job-completed/${job.rawId}`, { state: { from: 'dashboard' } });
                      } else {
                        navigate(`/customer-job-details/${job.rawId}`, { state: { from: 'dashboard' } });
                      }
                    }}
                    className="bg-white rounded-2xl p-3 sm:p-4 border border-gray-200 shadow-custom h-44 sm:h-48 cursor-pointer hover:shadow-lg transition-shadow duration-200"
                  >
                    <div className="flex flex-col justify-between h-full">
                      <div>
                        <div className="flex justify-between items-start mb-1">
                          <div className="text-[10px] sm:text-xs text-gray-400 font-medium ">
                            {job.categoryName}
                          </div>
                          {job.status && (
                            <span
                              className={`inline-block font-medium text-[10px] px-2 py-1 rounded-full ${
                                job.rawStatus === "quoted" ||
                                job.rawStatus === "posted"
                                  ? "bg-[#E5F3FF] text-[#0088FF] border border-[#DDEFFF]"
                                  : job.rawStatus === "in_progress" ||
                                      job.rawStatus === "started"
                                    ? "bg-[#FFEBCA] text-[#FF8800] border-[#FFEBCA]"
                                    : job.rawStatus === "completed"
                                      ? "bg-[#DBF9E7] text-green-500 border-green-500"
                                      : "bg-[#E5F3FF] text-[#0088FF] border-[#E5F3FF]"
                              }`}
                            >
                              {job.status}
                            </span>
                          )}
                        </div>
                        <h4 className="font-semibold text-[#111827] mb-2 line-clamp-1 text-sm sm:text-lg capitalize">
                          {job.title}
                        </h4>
                        <div className="space-y-1.5">
                          <div className="flex items-center text-xs font-medium text-gray-500">
                            <img
                              src={CalendarIcon}
                              alt="Calendar"
                              className="w-3.5 h-3.5 mr-2 opacity-60"
                            />
                            {job.date}
                          </div>
                          {job.assignedTo && (
                            <div className="flex items-center text-xs font-medium text-gray-500">
                              <img
                                src={PersonIcon}
                                alt="Person"
                                className="w-3.5 h-3.5 mr-2 opacity-60"
                              />
                              <span className="truncate">
                                Assigned to: {job.assignedTo}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full mt-3 text-xs sm:text-sm font-semibold py-2"
                      >
                        {job.action}
                      </Button>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>

        {/* 3 Features Cards */}
        <div
          className="mt-6 sm:mt-8 p-[2px] rounded-[16px] 
          bg-[linear-gradient(270deg,rgba(244,141,249,0.22),rgba(129,138,247,0.22))]"
        >
          <div className="grid grid-cols-3 bg-[#F9FAFB] rounded-[15px] py-5 px-1 sm:px-4">
            <div className="flex flex-col items-center justify-start gap-2.5 relative">
              <div className="w-[60px] h-[60px] flex items-center justify-center bg-white rounded-full border border-[#F0F6FB] shadow-sm">
                <img
                  src={VerifiedImg}
                  alt="Verified Cleaner"
                  className="w-[30px] h-[30px] object-contain"
                />
              </div>
              <span className="text-[11.5px] sm:text-[15px] text-center font-medium text-[#111827] leading-[1.2]">
                Verified Cleaners
              </span>
              <div className="absolute right-0 top-[10%] w-px h-[80%] bg-[#E8EEFF]"></div>
            </div>

            <div className="flex flex-col items-center justify-start gap-2.5 relative">
              <div className="w-[60px] h-[60px] flex items-center justify-center bg-white rounded-full border border-[#F0F6FB] shadow-sm">
                <img
                  src={LockImg}
                  alt="User's Privacy"
                  className="w-[30px] h-[30px] object-contain"
                />
              </div>
              <span className="text-[11.5px] sm:text-[15px] text-center font-medium text-[#111827] leading-[1.2]">
                User's Privacy
              </span>
              <div className="absolute right-0 top-[10%] w-px h-[80%] bg-[#E8EEFF]"></div>
            </div>

            <div className="flex flex-col items-center justify-start gap-2.5">
              <div className="w-[60px] h-[60px] flex items-center justify-center bg-white rounded-full border border-[#F0F6FB] shadow-sm">
                <img
                  src={StarImg}
                  alt="Rated & Reviewed"
                  className="w-[30px] h-[30px] object-contain"
                />
              </div>
              <span className="text-[11.5px] sm:text-[15px] text-center font-medium text-[#111827] leading-[1.2]">
                Rated & Reviewed
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CustomerDashboard;

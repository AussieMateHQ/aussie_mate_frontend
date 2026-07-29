import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  CheckCircle2,
  History as HistoryIcon,
  Info,
  X,
  Plus,
  Briefcase,
  AlertTriangle,
  Clock,  
  Coins,
} from "lucide-react";
import { subscriptionsAPI, categoriesAPI } from "../../services/api";
import { Button, Loader, PageHeader, ConfirmationModal } from "../../components";
import { useAuth } from "../../contexts/AuthContext";
import BGVector from "../../assets/BG Vectorr.svg";
import GiftIcon from "../../assets/Gift.svg";
import ClockIcon from "../../assets/Clock Circle.svg";
import DollorIcon from "../../assets/Dollarr.svg";
import TrueIcon from '../../assets/true.svg';

const MySubscriptionPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [history, setHistory] = useState([]);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [selectedPlanCategories, setSelectedPlanCategories] = useState([]);
  const [selectedPlanName, setSelectedPlanName] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [error, setError] = useState("");
  const [isExpired, setIsExpired] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingPlan, setPendingPlan] = useState(null);

  const canBuyCredits = useMemo(() => {
    if (!activeSubscription) return false;
    // Rule: can buy credits ONLY if NOT expired AND credits are exhausted
    const creditsPerLead =
      activeSubscription.subscription?.planId?.creditsPerLead || 1;
    return !isExpired && activeSubscription.availableCredits < creditsPerLead;
  }, [activeSubscription, isExpired]);

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    setLoading(true);
    setError("");
    try {
      // Fetch all plans
      const plansRes = await subscriptionsAPI.getPlans();
      if (plansRes.success) {
        setPlans(plansRes.data);
      }

      // Fetch my status
      const statusRes = await subscriptionsAPI
        .getMyStatus()
        .catch(() => ({ success: false }));
      if (statusRes.success && statusRes.data) {
        // Check if expired
        const expiryDate = new Date(
          statusRes.data.subscription?.currentPeriodEnd,
        );
        const now = new Date();
        setIsExpired(expiryDate < now);

        if (statusRes.data.subscription?.status === "active") {
          setActiveSubscription(statusRes.data);

          // Fetch history if active subscription exists
          const historyRes = await subscriptionsAPI
            .getHistory()
            .catch(() => ({ success: false }));
          if (historyRes.success) {
            setHistory(historyRes.data);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching subscription data:", err);
      setError(err.message || "Failed to load subscription data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId) => {
    setLoading(true);
    try {
      const res = await subscriptionsAPI.checkoutPlan(planId);
      if (res.success && res.url) {
        window.location.href = res.url; // Redirect to Stripe
      } else {
        setError(res.message || "Failed to initiate checkout. Please try again.");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setError(err.message || "An error occurred during checkout.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewCategories = async (plan) => {
    const categoryId = plan.includedCategories?.[0]?._id;
    if (!categoryId) return;

    setSelectedPlanName(plan.name);
    setShowCategoriesModal(true);
    setModalLoading(true);
    try {
      const res = await categoriesAPI.getServiceTypes(categoryId);
      if (res.success) {
        setSelectedPlanCategories(res.data);
      }
    } catch (err) {
      console.error("Error fetching service types:", err);
    } finally {
      setModalLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-AU", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading && !plans.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader fullscreen message="Loading subscription details..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <PageHeader
          title={activeSubscription ? "Your Active Plan" : "My Subscription"}
          onBack={() => navigate(-1)}
          className="mb-4 sm:mb-4"
        />

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 flex items-center gap-2">
            <Info className="w-5 h-5" />
            {error}
          </div>
        )}

        {activeSubscription && !isExpired ? (
          /* Active Subscription View */
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Out of Credits Alert - Web optimized centering */}
            {activeSubscription.availableCredits === 0 && (
              <div className="bg-white rounded-2xl p-10 shadow-sm border border-red-100 flex flex-col md:flex-row items-center gap-8 animate-in zoom-in duration-500">
                <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-10 h-10 text-red-500" />
                </div>
                <div className="text-center md:text-left flex-1">
                  <h3 className="text-2xl font-medium text-gray-900 mb-2">
                    You're out of credits!
                  </h3>
                  <p className="text-gray-500 font-medium max-w-xl">
                    You have used all your available credits. Purchase
                    additional credits to continue responding to customer leads
                    and growing your business.
                  </p>
                </div>
                <Button
                  onClick={() => navigate("/buy-credits")}
                  className="rounded-3xl h-14 px-10 font-bold whitespace-nowrap"
                  variant="primary"
                >
                  Buy More Credits
                </Button>
              </div>
            )}

            {/* Main Content - Single Vertical Stack for Full Width */}
            <div className="flex flex-col gap-8 w-full">
              {/* Active Plan Card */}
              <div className="relative bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                {/* SVG Background Layer - Soft, Prominent Glow from Figma */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] pointer-events-none z-0 overflow-visible">
                  {/* SVG Vector */}
                  <div className="absolute top-0 right-0 w-[600px] h-[600px] pointer-events-none z-0">
                    <img
                      src={BGVector}
                      alt="bg"
                      className="absolute top-[-150px] right-[-150px] w-full h-full object-contain opacity-80"
                    />
                  </div>
                </div>

                <div className="p-6 relative z-10 flex flex-col gap-4 text-[#111827]">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="inline-flex items-center px-4 py-1 rounded-full border border-[#DBF9E7] bg-[#EBFBF5] text-[#10B981] text-xs font-medium mb-1">
                        Active
                      </span>
                      <h2 className="text-xl font-medium text-[#111827]">
                        {activeSubscription.subscription?.planId?.name}
                      </h2>
                    </div>
                  </div>

                  {/* Info Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Credits Badge Box - Refined Figma Style */}
                    <div className="bg-white border border-[#F3F3F3] rounded-xl p-4 flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center">
                          <Coins className="w-3.5 h-3.5 text-[#1F6FEB]" />
                        </div>
                        <span className="text-[#1F6FEB] font-medium text-base">
                          Credits
                        </span>
                      </div>
                      <p className="text-xl font-semibold text-[#111827]">
                        {activeSubscription.availableCredits} Credits
                      </p>
                    </div>

                    {/* Bonus Leads Box - Clean White per Figma */}
                    <div className="bg-white border border-[#F3F3F3] rounded-xl p-4 flex items-center gap-4">
                      <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                        <img
                          src={GiftIcon}
                          alt="gift"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <p className="text-lg font-medium text-[#111827]">
                        {activeSubscription?.subscription?.planId?.bonusLeads ??
                          0}{" "}
                        Free Bonus Leads
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-md font-medium text-[#374151]">
                      {formatDate(
                        activeSubscription.subscription?.currentPeriodStart,
                      )}{" "}
                      -{" "}
                      {formatDate(
                        activeSubscription.subscription?.currentPeriodEnd,
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Credit Usage Section - Moved to its own card as requested */}
              <div className="bg-[#F9FAFB] rounded-2xl shadow-sm border border-[#F3F3F3] p-6">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-2xl font-semibold text-[#111827]">
                    Credit Usage
                  </p>
                  <button
                    onClick={() => navigate("/buy-credits")}
                    className="flex items-center gap-2 text-[#1F6FEB] cursor-pointer font-bold text-sm hover:opacity-80 transition-opacity"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#1F6FEB] flex items-center justify-center ">
                      <Plus
                        className="w-3.5 h-3.5 text-white"
                        strokeWidth={3}
                      />
                    </div>
                    Buy Credits
                  </button>
                </div>

                

                <div className="mb-4 relative group cursor-pointer">
                  <div className="w-full h-4 bg-[#E5E7EB] rounded-full overflow-hidden relative">
                    <div
                      className="h-full bg-[#22C55E] rounded-full transition-all duration-1000 relative animate-stripes"
                      style={{
                        backgroundImage:
                          "linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)",
                        backgroundSize: "1rem 1rem",
                        width: `${Math.min(100, Math.max(0, (activeSubscription.availableCredits / (activeSubscription?.subscription?.planId?.creditsPerMonth || activeSubscription?.planCredits || 1)) * 100))}%`,
                      }}
                    />
                  </div>
                  <div
                    className="absolute left-0 -bottom-2 transform translate-y-full opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none"
                    style={{
                      left: `${Math.min(
                        60,
                        Math.max(
                          0,
                          (activeSubscription.availableCredits /
                            (activeSubscription?.subscription?.planId
                              ?.creditsPerMonth ||
                              activeSubscription?.planCredits ||
                              1)) *
                          100,
                        ),
                      )}%`,
                    }}
                  >
                    <div className="relative bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm whitespace-nowrap">
                      {/* Triangle */}
                      <div className="absolute -top-1 left-4 w-2 h-2 bg-white border-t border-l border-gray-200 rotate-45" />

                      <p className="text-sm font-bold text-gray-900">
                        {activeSubscription.availableCredits}{" "}
                        <span className="text-gray-400 font-medium">of</span>{" "}
                        {activeSubscription?.subscription?.planId
                          ?.creditsPerMonth ||
                          activeSubscription?.planCredits ||
                          0}{" "}
                        <span className="text-gray-400 font-normal">
                          Credits Available
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-base font-medium text-[#374151]">
                  Estimated Leads Remaining:{" "}
                  <span className="text-[#111827] ml-1 font-semibold">
                    {Math.floor(
                      activeSubscription.availableCredits /
                      (activeSubscription.subscription?.planId
                        ?.creditsPerLead || 1),
                    )}{" "}
                    leads
                  </span>
                </p>

              </div>

              {/* Lead Usage History */}
              <div className="overflow-hidden">
                <div className="px-6 pb-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <h3 className="text-[20px] font-semibold text-[#111827]">
                        Lead Usage History
                      </h3>
                      <p className="text-sm text-gray-500">
                        Track the credits used when you respond to customer job
                        leads.
                      </p>
                    </div>
                  </div>


                </div>

                <div className="divide-y divide-[#F9FAFB]">
                  {history.length > 0 ? (
                    history.slice(0, 10).map((item, idx) => (
                      <div
                        key={item._id || idx}
                        className="px-6 py-5 hover:bg-[#F9FAFB] transition-colors flex justify-between items-center"
                      >
                        <div className="flex gap-4 items-center">
                          {/* <div className="w-12 h-12 rounded-full border border-[#F3F3F3] flex items-center justify-center bg-white text-gray-400 shadow-sm">
                            <Briefcase className="w-6 h-6" strokeWidth={1.5} />
                          </div> */}
                          <div>
                            <p className="text-[16px] font-semibold text-[#111827] leading-tight mb-1">
                              {item.type === "debit" &&
                                item.jobId?.categoryId?.name &&
                                item.jobId?.serviceTypeId?.name
                                ? `${item.jobId.categoryId.name} - ${item.jobId.serviceTypeId.name}`
                                : item.description}

                              {item.reason === "bonus_lead_usage" && (
                                <span className="ml-2 px-2 py-0.5 text-[10px] font-bold text-[#1F6FEB] bg-blue-50 rounded-full border border-blue-100 uppercase tracking-tight">
                                  Bonus Lead
                                </span>
                              )}
                            </p>
                            <p className="text-[13px] text-gray-400 font-medium">
                              {item.jobId ? (
                                <>
                                  #
                                  {typeof item.jobId === "object"
                                    ? item.jobId?.jobId
                                    : item.jobId}{" "}
                                  •
                                </>
                              ) : null}{" "}
                              {formatDate(item.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <p
                            className={`text-[14px] font-semibold leading-none mb-1 ${item.type === "credit" ? "text-[#10B981]" : "text-[#EF4444]"}`}
                          >
                            {item.type === "credit" ? "+" : "-"}
                            {Math.abs(item.amount)}
                          </p>
                          <p className="text-[10px] font-semibold text-gray-300 uppercase tracking-widest leading-none">
                            CREDITS
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-12 text-center">
                      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-gray-200">
                        <HistoryIcon className="w-8 h-8 text-gray-300" />
                      </div>
                      <p className="text-gray-500 font-bold text-lg">
                        No Lead Activity Yet
                      </p>
                      <p className="text-gray-400 text-sm max-w-xs mx-auto mt-1">
                        Your lead activity will appear here once you start
                        responding to customer jobs.
                      </p>
                    </div>
                  )}
                </div>
                {history.length > 10 && (
                  <div className="p-4 border-t border-gray-50 text-center">
                    <button
                      onClick={() => navigate("/lead-usage-history")}
                      className="text-[#1F6FEB] font-semibold text-sm hover:underline flex items-center gap-1 mx-auto cursor-pointer"
                    >
                      View Full History <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {(!activeSubscription || isExpired) && (
          /* "No Subscription" Plan Selection View */
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-8">
            {isExpired && activeSubscription && (
              <div className="bg-primary-200 rounded-2xl p-4 shadow-sm border border-primary-200 flex flex-col md:flex-row items-center gap-8 animate-in zoom-in duration-500">
                <div className="w-12 h-12 bg-primary-200 rounded-2xl border border-primary-200 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-primary-600" />
                </div>
                <div className="text-center md:text-left flex-1">
                  <h3 className="text-xl font-medium text-gray-900 mb-2">
                    Subscription Expired!
                  </h3>
                  <p className="text-gray-500 font-normal max-w-4xl text-xs">
                    Your subscription for{" "}
                    <b>{activeSubscription.subscription?.planId?.name}</b> ended
                    on{" "}
                    <b>
                      {formatDate(
                        activeSubscription.subscription?.currentPeriodEnd,
                      )}
                    </b>
                    . To continue receiving leads, please renew your
                    subscription or choose a new plan below.
                  </p>
                </div>
              </div>
            )}
            {/* Header section - split layout for desktop */}
            <div className="flex flex-col gap-5">
              <div className="max-w-4xl">
                <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
                  Get Cleaning Leads
                </h2>
                <p className="text-gray-500 font-medium text-lg leading-relaxed">
                  Subscribe to access verified customer jobs in your service
                  categories.
                </p>
              </div>

              <div className="w-full">
                <p className="text-2xl font-semibold text-gray-900 mb-4">
                  Why Subscribe?
                </p>
                <div className="space-y-5">
                  {[
                    "Get direct job leads from customers",
                    "Chat with customers instantly (top 3 applicants)",
                    "Secure verified leads only",
                    "Flexible credit usage for multiple jobs",
                  ].map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-4">
                      <div className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center bg-white shadow-sm">
                        <img src={TrueIcon} alt="Check" className="w-3.5 h-3.5" />
                      </div>
                      <p className="text-base font-medium text-gray-700">
                        {feature}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Plans List - Vertically stacked cards - Full Width */}
            <div className="flex flex-col gap-8 w-full">
              {plans.map((plan) => (
                <div
                  key={plan._id}
                  className="bg-[#F9FAFB] rounded-2xl border border-[#F3F3F3] transition-all duration-300 relative overflow-hidden flex flex-col group"
                >
                  {/* SVG Background Layer - Soft, Prominent Glow from Figma */}
                  <div className="absolute top-0 right-0 w-[600px] h-[600px] pointer-events-none z-0 overflow-visible">
                    {/* SVG Vector */}
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] pointer-events-none z-0">
                      <img
                        src={BGVector}
                        alt="bg"
                        className="absolute top-[-150px] right-[-150px] w-full h-full object-contain opacity-80"
                      />
                    </div>
                  </div>
                  <div className="p-6 relative z-10 flex flex-col text-[#111827]">
                    {/* Row 1: Plan Name & Actions - Spread Out */}
                    <div className="flex flex-wrap justify-between items-center w-full gap-4">
                      <h4 className="text-[18px] font-medium">{plan.name}</h4>
                      <div className="flex items-center gap-6">
                        <button
                          onClick={() => handleViewCategories(plan)}
                          className="text-[#111827] font-medium text-sm hover:text-primary-600 transition-colors cursor-pointer"
                        >
                          View Included Categories
                        </button>
                        <Button
                          variant="primary"
                          className="h-10 rounded-full font-medium text-sm bg-[#1F6FEB]  whitespace-nowrap"
                          onClick={() => {
                            setPendingPlan(plan);
                            setShowConfirmModal(true);
                          }}
                        >
                          Subscribe to {plan.name.split(/[\s/-]/)[0]} Plan
                        </Button>
                      </div>
                    </div>

                    {/* Row 2: Price - Compacted */}
                    <div className="flex items-baseline pb-4">
                      <span className="text-[32px] leading-tight font-semibold tracking-tight">
                        ${plan.pricePerMonth}
                      </span>
                      <span className="text-gray-400 font-medium text-sm">
                        / month
                      </span>
                    </div>

                    {/* Row 3: Info Boxes (50/50) - Balanced */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                      {/* Box 1: Duration & Credits - No Divider, Compact Gap */}
                      <div className="bg-white/80 backdrop-blur-xl border border-gray-100 rounded-xl px-3 py-2 flex items-center gap-12">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1">
                            <img
                              src={ClockIcon}
                              alt="gift"
                              className="w-5 h-5"
                            />
                            <p className="text-[12px] font-medium text-gray-400 leading-tight">
                              Duration Badge
                            </p>
                          </div>
                          <p className="text-[14px] font-semibold whitespace-nowrap">
                            {plan.durationMonths || 6} Month Contract
                          </p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1">
                            <img
                              src={DollorIcon}
                              alt="gift"
                              className="w-5 h-5"
                            />
                            <p className="text-[11px] font-medium text-gray-400 leading-tight">
                              Credits
                            </p>
                          </div>
                          <p className="text-[15px] font-semibold whitespace-nowrap">
                            {plan.creditsPerMonth} Credits
                          </p>
                        </div>
                      </div>

                      {/* Box 2: Bonus Leads */}
                      <div className="bg-white border border-gray-100 rounded-xl px-3 py-2 flex items-center gap-4">
                        <div className="flex items-center justify-center flex-shrink-0 ">
                          <img
                            src={GiftIcon}
                            alt="gift"
                            className="w-10 h-10"
                          />
                        </div>
                        <p className="text-[15px] font-medium">
                          {plan.bonusLeads || 2} Free Bonus Leads
                        </p>
                      </div>
                    </div>

                    {/* Row 4: Usage Details - Vertical Stack as requested */}
                    <div className="pt-2">
                      <p className="text-[16px] font-semibold mb-3">Usage</p>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2 text-gray-500 font-medium text-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                          {plan.creditsPerLead} credits per lead
                        </li>
                        <li className="flex items-center gap-2 text-gray-500 font-medium text-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                          Approx. {plan.approxLeads}
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Categories Modal */}
        {showCategoriesModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-6 flex justify-between items-center">
                <h3 className="text-xl font-semibold text-[#111827]">{selectedPlanName}</h3>
                <button
                  onClick={() => setShowCategoriesModal(false)}
                  className="text-gray-900 hover:opacity-70 transition-opacity cursor-pointer p-1"
                >
                  <X className="w-7 h-7" strokeWidth={1.5} />
                </button>
              </div>

              <div className="px-5 pb-8">
                {modalLoading ? (
                  <div className="py-20 flex justify-center">
                    <Loader message="Loading services..." />
                  </div>
                ) : (
                  <div className="flex flex-col max-h-[60vh] overflow-y-auto">
                    {selectedPlanCategories.map((type, idx) => (
                      <div
                        key={idx}
                        className={`px-5 py-4 rounded-2xl transition-all cursor-default group ${idx === 0 ? 'bg-[#F9FAFB]' : 'hover:bg-[#F9FAFB]'
                          }`}
                      >
                        <span className=" font-medium text-[#111827] group-hover:text-black">
                          {type.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <ConfirmationModal
          isOpen={showConfirmModal}
          onClose={() => {
            setShowConfirmModal(false);
            setPendingPlan(null);
          }}
          onConfirm={() => {
            if (pendingPlan) handleSubscribe(pendingPlan._id);
            setShowConfirmModal(false);
          }}
          title="Confirm Subscription"
          message={`Are you sure you want to subscribe to the ${pendingPlan?.name} plan? You will be redirected to the secure payment page.`}
          confirmText="Confirm & Pay"
          cancelText="Cancel"
          confirmButtonColor="bg-[#1F6FEB] hover:bg-blue-700"
        />
      </div>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes stripes {
            from { background-position: 0 0; }
            to { background-position: 1rem 0; }
          }
          .animate-stripes {
            animation: stripes 1s linear infinite;
          }
        `
      }} />
    </div>
  );
};

export default MySubscriptionPage;

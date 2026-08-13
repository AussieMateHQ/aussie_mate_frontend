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
  Calendar as CalendarIcon,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import dayjs from "dayjs";
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

  // NEW: array of all active subscriptions
  const [activeSubscriptions, setActiveSubscriptions] = useState([]);
  // LEGACY: single active subscription (kept for credit usage section compat)
  const [statusData, setStatusData] = useState(null);

  const [history, setHistory] = useState([]);
  const [hoveredItemId, setHoveredItemId] = useState(null);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [selectedPlanCategories, setSelectedPlanCategories] = useState([]);
  const [selectedPlanName, setSelectedPlanName] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [error, setError] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingPlan, setPendingPlan] = useState(null);

  // Has any active subscription
  const hasAnyActive = activeSubscriptions.length > 0;

  // Is any plan expired check — if all active subs are expired
  const isAllExpired = useMemo(() => {
    if (!hasAnyActive) return false;
    const now = new Date();
    return activeSubscriptions.every(
      (s) => s.currentPeriodEnd && new Date(s.currentPeriodEnd) < now
    );
  }, [activeSubscriptions]);

  const availableCredits = statusData?.availableCredits || 0;

  const canBuyCredits = useMemo(() => {
    if (!hasAnyActive) return false;
    const creditsPerLead = statusData?.subscription?.planId?.creditsPerLead || 1;
    return !isAllExpired && availableCredits < creditsPerLead;
  }, [hasAnyActive, isAllExpired, availableCredits, statusData]);

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    setLoading(true);
    setError("");
    try {
      // Fetch all plans (with isAlreadySubscribed flag from backend)
      const plansRes = await subscriptionsAPI.getPlans();
      if (plansRes.success) {
        setPlans(plansRes.data);
      }

      // Fetch my status
      const statusRes = await subscriptionsAPI
        .getMyStatus()
        .catch(() => ({ success: false }));

      if (statusRes.success && statusRes.data) {
        setStatusData(statusRes.data);

        const now = new Date();

        // NEW multi-plan subscriptions[] — active and not expired
        const multiSubs = (statusRes.data.subscriptions || []).filter(
          (s) => s.status === "active" && new Date(s.currentPeriodEnd) > now
        );

        // LEGACY single subscription — active and not expired
        const legacySub = statusRes.data.subscription;
        const legacyActive =
          legacySub?.status === "active" &&
          legacySub?.currentPeriodEnd &&
          new Date(legacySub.currentPeriodEnd) > now;

        // Merge: start with new subscriptions[], then add legacy if not already present
        const merged = [...multiSubs];
        if (legacyActive) {
          const alreadyIncluded = multiSubs.some(
            (s) =>
              s.stripeSubscriptionId &&
              s.stripeSubscriptionId === legacySub.stripeSubscriptionId
          );
          if (!alreadyIncluded) {
            // Wrap legacy in same shape as new sub entries
            merged.push({
              ...legacySub,
              _isLegacy: true,
            });
          }
        }

        setActiveSubscriptions(merged);

        // Fetch history if any active subscription exists
        if (merged.length > 0) {
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
        window.location.href = res.url;
      } else if (res.error === "PLAN_ALREADY_ACTIVE") {
        setError("You already have an active subscription for this plan.");
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
          title="My Subscription"
          onBack={() => navigate(-1)}
          className="mb-4 sm:mb-4"
        />

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 flex items-center gap-2">
            <Info className="w-5 h-5" />
            {error}
          </div>
        )}

        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* ─── OUT OF CREDITS ALERT ─── */}
          {hasAnyActive && !isAllExpired && availableCredits === 0 && (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-red-100 flex flex-col md:flex-row items-center gap-8 animate-in zoom-in duration-500">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <div className="text-center md:text-left flex-1">
                <h3 className="text-xl font-medium text-gray-900 mb-1">You're out of credits!</h3>
                <p className="text-gray-500 font-medium">
                  Purchase additional credits to continue responding to customer leads.
                </p>
              </div>
              <Button
                onClick={() => navigate("/buy-credits")}
                className="rounded-3xl h-12 px-8 font-bold whitespace-nowrap"
                variant="primary"
              >
                Buy More Credits
              </Button>
            </div>
          )}

          {/* ─── ALL EXPIRED BANNER ─── */}
          {hasAnyActive && isAllExpired && (
            <div className="bg-primary-50 rounded-2xl p-5 shadow-sm border border-primary-100 flex flex-col md:flex-row items-center gap-6">
              <div className="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-primary-600" />
              </div>
              <div className="text-center md:text-left flex-1">
                <h3 className="text-lg font-medium text-gray-900 mb-1">Subscription Expired!</h3>
                <p className="text-gray-500 text-sm">
                  Your active plans have expired. Renew or choose a new plan below to continue receiving leads.
                </p>
              </div>
            </div>
          )}

          {/* ─── ACTIVE PLANS CARDS (one per plan) ─── */}
          {hasAnyActive && !isAllExpired && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Active Plans ({activeSubscriptions.filter(s => new Date(s.currentPeriodEnd) > new Date()).length})
                </h2>
              </div>

              {activeSubscriptions
                .filter(s => new Date(s.currentPeriodEnd) > new Date())
                .map((sub, idx) => {
                  const planInfo = sub.planId || {};
                  const planName = planInfo.name || sub._isLegacy && statusData?.subscription?.planId?.name || "Active Plan";
                  const bonusLeads = sub.bonusLeads || planInfo.bonusLeads || 0;
                  return (
                    <div key={sub._id || idx} className="relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                      {/* BG decoration */}
                      <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none z-0">
                        <img
                          src={BGVector}
                          alt="bg"
                          className="absolute top-[-150px] right-[-150px] w-[600px] h-[600px] object-contain opacity-70"
                        />
                      </div>

                      <div className="p-6 relative z-10 flex flex-col gap-4 text-[#111827]">
                        {/* Plan name + active badge */}
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="inline-flex items-center px-3 py-1 rounded-full border border-[#DBF9E7] bg-[#EBFBF5] text-[#10B981] text-xs font-medium mb-2">
                              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                              Active
                            </span>
                            <h2 className="text-xl font-medium text-[#111827]">{planName}</h2>
                          </div>
                          <div className="text-right text-sm text-gray-400">
                            <p className="font-medium">Valid until</p>
                            <p className="text-gray-700 font-semibold">{formatDate(sub.currentPeriodEnd)}</p>
                          </div>
                        </div>

                        {/* Info Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white border border-[#F3F3F3] rounded-xl p-4 flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center">
                                <Coins className="w-3.5 h-3.5 text-[#1F6FEB]" />
                              </div>
                              <span className="text-[#1F6FEB] font-medium text-sm">Monthly Plan Credits</span>
                            </div>
                            <p className="text-xl font-semibold text-[#111827]">
                              {planInfo.creditsPerMonth || 0} Credits
                            </p>
                          </div>

                          <div className="bg-white border border-[#F3F3F3] rounded-xl p-4 flex items-center gap-4">
                            <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                              <img src={GiftIcon} alt="gift" className="w-full h-full object-contain" />
                            </div>
                            <p className="text-base font-medium text-[#111827]">
                              {bonusLeads} Free Bonus Leads
                            </p>
                          </div>
                        </div>

                        {/* Period */}
                        <p className="text-sm font-medium text-[#374151]">
                          {formatDate(sub.currentPeriodStart)} – {formatDate(sub.currentPeriodEnd)}
                        </p>
                      </div>
                    </div>
                  );
                })}

              {/* Credit Usage Bar */}
              <div className="bg-[#F9FAFB] rounded-2xl shadow-sm border border-[#F3F3F3] p-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="text-2xl font-semibold text-[#111827]">Credit Usage</p>
                    <p className="text-sm text-gray-500 font-medium mt-1">
                      Shared Pool: <span className="text-[#1F6FEB] font-bold">{availableCredits} Credits available</span> across all active plans.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate("/buy-credits")}
                    className="flex items-center gap-2 text-[#1F6FEB] cursor-pointer font-bold text-sm hover:opacity-80 transition-opacity"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#1F6FEB] flex items-center justify-center">
                      <Plus className="w-3.5 h-3.5 text-white" strokeWidth={3} />
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
                        width: `${Math.min(100, Math.max(0, (availableCredits / (statusData?.planCredits || 1)) * 100))}%`,
                      }}
                    />
                  </div>
                </div>

                <p className="text-base font-medium text-[#374151]">
                  Estimated Leads Remaining:{" "}
                  <span className="text-[#111827] ml-1 font-semibold">
                    {Math.floor(
                      availableCredits /
                      (statusData?.subscription?.planId?.creditsPerLead || 1)
                    )}{" "}
                    leads
                  </span>
                </p>
              </div>

              {/* Lead Usage History */}
              <div className="relative">
                <div className="px-2 pb-4 flex justify-between items-center">
                  <div className="flex flex-col">
                    <h3 className="text-[20px] font-semibold text-[#111827]">Lead Usage History</h3>
                    <p className="text-sm text-gray-500">
                      Track the credits used when you respond to customer job leads.
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-[#F9FAFB]">
                  {history.length > 0 ? (
                    history.slice(0, 10).map((item, idx) => (
                      <div
                        key={item._id || idx}
                        className="px-2 py-5 hover:bg-[#F9FAFB] transition-colors flex justify-between items-center"
                      >
                        <div className="flex gap-4 items-center">
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
                            <p className="text-[13px] text-gray-400 font-medium flex items-center gap-1.5 flex-wrap">
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
                              {item.jobId && typeof item.jobId === "object" && (
                                <span className="relative inline-block ml-1">
                                  <Info
                                    className="w-4 h-4 text-[#1F6FEB] hover:text-[#1154c0] cursor-pointer transition-colors"
                                    onMouseEnter={() => setHoveredItemId(item._id)}
                                    onMouseLeave={() => setHoveredItemId(null)}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setHoveredItemId(prev => prev === item._id ? null : item._id);
                                    }}
                                  />
                                  {hoveredItemId === item._id && (
                                    <div className="absolute left-6 bottom-0 w-80 p-5 bg-white/95 backdrop-blur-md border border-gray-200/60 rounded-2xl shadow-2xl z-50 text-left text-gray-800 space-y-3 pointer-events-none">

                                      {/* Header: service name, date, location */}
                                      <div className="border-b border-gray-100 pb-3">
                                        <h4 className="text-sm font-bold text-gray-900 capitalize">
                                          {item.jobId.serviceTypeId?.name || item.jobId.categoryId?.name || "Cleaning Job"}
                                        </h4>
                                        {item.jobId.commercialJobTypeId?.name && (
                                          <p className="text-xs text-gray-500 mt-0.5">{item.jobId.commercialJobTypeId.name}</p>
                                        )}
                                        {item.jobId.scheduledDate && (
                                          <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                                            <CalendarIcon className="w-3.5 h-3.5 opacity-60" />
                                            <span>{dayjs(item.jobId.scheduledDate).format("DD MMMM YYYY, hh:mm a")}</span>
                                          </div>
                                        )}
                                        {(item.jobId.location?.fullAddress || item.jobId.location?.address || item.jobId.location?.city) && (
                                          <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                                            <MapPin className="w-3.5 h-3.5 opacity-60" />
                                            <span className="line-clamp-2">
                                              {item.jobId.location.fullAddress || item.jobId.location.address || item.jobId.location.city}
                                            </span>
                                          </div>
                                        )}
                                      </div>

                                      {/* Rooms & Bathrooms (Domestic/Bond) */}
                                      {(item.jobId.roomsNeedCleaning || item.jobId.bathroomsNeedCleaning || item.jobId.needCleaning) && (
                                        <div className="flex flex-wrap gap-2">
                                          {(item.jobId.roomsNeedCleaning || item.jobId.needCleaning) && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                                              🛏 {item.jobId.roomsNeedCleaning || item.jobId.needCleaning} Room{parseInt(item.jobId.roomsNeedCleaning || item.jobId.needCleaning) > 1 ? "s" : ""}
                                            </span>
                                          )}
                                          {item.jobId.bathroomsNeedCleaning && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                                              🚿 {item.jobId.bathroomsNeedCleaning} Bathroom{parseInt(item.jobId.bathroomsNeedCleaning) > 1 ? "s" : ""}
                                            </span>
                                          )}
                                        </div>
                                      )}

                                      {/* Extra Services */}
                                      {item.jobId.extraServiceItems?.length > 0 && (
                                        <div>
                                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Extra Services</p>
                                          <div className="flex flex-wrap gap-1">
                                            {item.jobId.extraServiceItems.map((srv, si) => (
                                              <span key={si} className="px-2 py-0.5 bg-blue-50 text-[#1F6FEB] text-xs rounded-full font-medium border border-blue-100">
                                                {typeof srv === "object" ? srv.name : srv}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Pet Details */}
                                      {(item.jobId.petType || item.jobId.numberOfPets || item.jobId.petNeeds?.length > 0) && (
                                        <div>
                                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Pet Details</p>
                                          <div className="flex flex-wrap gap-1">
                                            {item.jobId.petType && (
                                              <span className="px-2 py-0.5 bg-orange-50 text-orange-600 text-xs rounded-full font-medium border border-orange-100">
                                                🐾 {item.jobId.petType}
                                              </span>
                                            )}
                                            {item.jobId.numberOfPets && (
                                              <span className="px-2 py-0.5 bg-orange-50 text-orange-600 text-xs rounded-full font-medium border border-orange-100">
                                                x{item.jobId.numberOfPets}
                                              </span>
                                            )}
                                            {item.jobId.petNeeds?.map((n, ni) => (
                                              <span key={ni} className="px-2 py-0.5 bg-orange-50 text-orange-600 text-xs rounded-full font-medium border border-orange-100">{n}</span>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Handyman Items */}
                                      {item.jobId.fixingItems?.length > 0 && (
                                        <div>
                                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Items to Fix</p>
                                          <div className="flex flex-wrap gap-1">
                                            {item.jobId.fixingItems.map((f, fi) => (
                                              <span key={fi} className="px-2 py-0.5 bg-yellow-50 text-yellow-700 text-xs rounded-full font-medium border border-yellow-100">{f}</span>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Commercial: Has Plans, Council Approval, Budget, or Commercial fields */}
                                      {(item.jobId.hasPlans || item.jobId.hasCouncilApproval || item.jobId.budget || item.jobId.propertyType || item.jobId.commercialCleaningType || item.jobId.preferredCleaningTime || (item.jobId.areasNeedCleaning && item.jobId.areasNeedCleaning.length > 0)) && (
                                        <div className="space-y-1">
                                          {((item.jobId.categoryId?.name?.toLowerCase().includes('commercial') || item.jobId.propertyType || item.jobId.commercialCleaningType) ? [
                                            { label: 'Property Type', value: item.jobId.propertyType },
                                            { label: 'Cleaning Service Type', value: item.jobId.commercialCleaningType },
                                            { label: 'Areas to Clean', value: item.jobId.areasNeedCleaning && item.jobId.areasNeedCleaning.length > 0 ? item.jobId.areasNeedCleaning.join(', ') : null },
                                            { label: 'Preferred Time', value: item.jobId.preferredCleaningTime },
                                          ] : [
                                            { label: 'Plans', value: item.jobId.hasPlans },
                                            { label: 'Council Approval', value: item.jobId.hasCouncilApproval },
                                            { label: 'Budget', value: item.jobId.budget },
                                          ]).filter(spec => spec.value).map((spec, idx) => (
                                            <p key={idx} className="text-xs text-gray-600 font-medium">{spec.label}: <span className="font-semibold">{spec.value}</span></p>
                                          ))}
                                        </div>
                                      )}

                                      {/* Job Stage */}
                                      {item.jobId.jobStage && (
                                        <div>
                                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Job Stage</p>
                                          <p className="text-xs font-semibold text-gray-700">{item.jobId.jobStage}</p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <p className={`text-[14px] font-semibold leading-none mb-1 ${item.type === "credit" ? "text-[#10B981]" : "text-[#EF4444]"}`}>
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
                      <p className="text-gray-500 font-bold text-lg">No Lead Activity Yet</p>
                      <p className="text-gray-400 text-sm max-w-xs mx-auto mt-1">
                        Your lead activity will appear here once you start responding to customer jobs.
                      </p>
                    </div>
                  )}
                </div>

                {history.length > 10 && (
                  <div className="px-2 pt-4 flex justify-end">
                    <button
                      onClick={() => navigate("/lead-usage-history")}
                      className="flex items-center gap-1 text-[#1F6FEB] font-bold text-sm hover:opacity-80 transition-opacity cursor-pointer"
                    >
                      View Full History <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── ALL PLANS (always visible) ─── */}
          <div className="flex flex-col gap-5">
            {/* Section header */}
            <div>
              {!hasAnyActive || isAllExpired ? (
                <>
                  <div className="max-w-4xl mb-4">
                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
                      {isAllExpired ? "Renew Your Plan" : "Get Cleaning Leads"}
                    </h2>
                    <p className="text-gray-500 font-medium text-base leading-relaxed">
                      Subscribe to access verified customer jobs in your service categories.
                    </p>
                  </div>

                  {/* Why Subscribe bullets */}
                  <div className="space-y-3 mb-6">
                    {[
                      "Get direct job leads from customers",
                      "Chat with customers instantly (top 3 applicants)",
                      "Secure verified leads only",
                      "Flexible credit usage for multiple jobs",
                    ].map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border border-gray-200 flex items-center justify-center bg-white shadow-sm">
                          <img src={TrueIcon} alt="Check" className="w-3 h-3" />
                        </div>
                        <p className="text-sm font-medium text-gray-700">{feature}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-semibold text-gray-900">All Available Plans</h2>
                  <span className="text-sm text-gray-400 font-medium">Add more plans to expand your categories</span>
                </div>
              )}
            </div>

            {/* Plan Cards */}
            <div className="flex flex-col gap-6 w-full">
              {plans.map((plan) => {
                const isAlreadySubscribed = plan.isAlreadySubscribed;
                return (
                  <div
                    key={plan._id}
                    className={`rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col group ${isAlreadySubscribed
                        ? "bg-[#F0FDF4] border-[#BBF7D0]"
                        : "bg-[#F9FAFB] border-[#F3F3F3]"
                      }`}
                  >
                    {/* BG decoration */}
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] pointer-events-none z-0">
                      <img
                        src={BGVector}
                        alt="bg"
                        className="absolute top-[-150px] right-[-150px] w-full h-full object-contain opacity-70"
                      />
                    </div>

                    <div className="p-6 relative z-10 flex flex-col text-[#111827]">
                      {/* Row 1: Plan Name & Actions */}
                      <div className="flex flex-wrap justify-between items-center w-full gap-4">
                        <div className="flex items-center gap-3">
                          <h4 className="text-[18px] font-medium">{plan.name}</h4>
                          {isAlreadySubscribed && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full border border-[#BBF7D0] bg-[#DCFCE7] text-[#15803D] text-xs font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              Active
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => handleViewCategories(plan)}
                            className="text-[#111827] font-medium text-sm hover:text-primary-600 transition-colors cursor-pointer"
                          >
                            View Included Categories
                          </button>

                          {isAlreadySubscribed ? (
                            <span className="inline-flex items-center gap-2 h-10 px-5 rounded-full font-medium text-sm bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]">
                              <CheckCircle2 className="w-4 h-4" />
                              Subscribed
                            </span>
                          ) : (
                            <Button
                              variant="primary"
                              className="h-10 rounded-full font-medium text-sm bg-[#1F6FEB] whitespace-nowrap"
                              onClick={() => {
                                setPendingPlan(plan);
                                setShowConfirmModal(true);
                              }}
                            >
                              Subscribe to {plan.name.split(/[\s/-]/)[0]} Plan
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Row 2: Price */}
                      <div className="flex items-baseline pb-4">
                        <span className="text-[32px] leading-tight font-semibold tracking-tight">
                          ${plan.pricePerMonth}
                        </span>
                        <span className="text-gray-400 font-medium text-sm">/ month</span>
                      </div>

                      {/* Row 3: Info Boxes */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                        <div className="bg-white/80 backdrop-blur-xl border border-gray-100 rounded-xl px-3 py-2 flex items-center gap-12">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1">
                              <img src={ClockIcon} alt="clock" className="w-5 h-5" />
                              <p className="text-[12px] font-medium text-gray-400 leading-tight">Duration Badge</p>
                            </div>
                            <p className="text-[14px] font-semibold whitespace-nowrap">
                              {plan.durationMonths || 6} Month Contract
                            </p>
                          </div>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1">
                              <img src={DollorIcon} alt="credits" className="w-5 h-5" />
                              <p className="text-[11px] font-medium text-gray-400 leading-tight">Credits</p>
                            </div>
                            <p className="text-[15px] font-semibold whitespace-nowrap">
                              {plan.creditsPerMonth} Credits
                            </p>
                          </div>
                        </div>

                        <div className="bg-white border border-gray-100 rounded-xl px-3 py-2 flex items-center gap-4">
                          <div className="flex items-center justify-center flex-shrink-0">
                            <img src={GiftIcon} alt="gift" className="w-10 h-10" />
                          </div>
                          <p className="text-[15px] font-medium">
                            {plan.bonusLeads || 2} Free Bonus Leads
                          </p>
                        </div>
                      </div>

                      {/* Row 4: Usage */}
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
                );
              })}
            </div>
          </div>
        </div>

        {/* ─── Categories Modal ─── */}
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
                        className={`px-5 py-4 rounded-2xl transition-all cursor-default group ${idx === 0 ? 'bg-[#F9FAFB]' : 'hover:bg-[#F9FAFB]'}`}
                      >
                        <span className="font-medium text-[#111827] group-hover:text-black">
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

        {/* ─── Confirm Subscribe Modal ─── */}
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

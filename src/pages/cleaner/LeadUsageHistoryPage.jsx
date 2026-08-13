import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, History as HistoryIcon, Clock, Info, Calendar as CalendarIcon, MapPin } from "lucide-react";
import { PageHeader, PaginationRanges, Loader, Button, Calendar, CustomSelect, DateRangePicker } from "../../components";
import { subscriptionsAPI } from "../../services/api";
import dayjs from "dayjs";

const LeadUsageHistoryPage = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hoveredItemId, setHoveredItemId] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const limit = 10;

  const fetchHistory = async () => {
    setLoading(true);
    setError("");
    try {
      // Fetch all items (or a large enough limit) to filter locally as requested
      const response = await subscriptionsAPI.getHistory({ 
        limit: 1000, 
      });
      
      if (response.success) {
        setHistory(response.data || []);
      } else {
        setError("Failed to fetch history");
      }
    } catch (err) {
      console.error("Error fetching history:", err);
      setError("An error occurred while fetching history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredHistory = React.useMemo(() => {
    let result = [...history];

    // Filter by Date Range
    if (dateRange?.from || dateRange?.to) {
      result = result.filter(item => {
        const itemDate = dayjs(item.createdAt);
        const fromDate = dateRange.from ? dayjs(dateRange.from).startOf('day') : null;
        const toDate = dateRange.to ? dayjs(dateRange.to).endOf('day') : null;

        if (fromDate && itemDate.isBefore(fromDate)) return false;
        if (toDate && itemDate.isAfter(toDate)) return false;
        return true;
      });
    }

    // Sorting
    result.sort((a, b) => {
      let valA, valB;
      
      if (sortBy === 'createdAt') {
        valA = new Date(a.createdAt).getTime();
        valB = new Date(b.createdAt).getTime();
      } else if (sortBy === 'amount') {
        valA = Math.abs(a.amount);
        valB = Math.abs(b.amount);
      } else if (sortBy === 'type') {
        valA = a.type || '';
        valB = b.type || '';
      }

      if (sortOrder === 'desc') {
        return valA < valB ? 1 : -1;
      } else {
        return valA > valB ? 1 : -1;
      }
    });

    return result;
  }, [history, dateRange, sortBy, sortOrder]);

  // Handle local pagination of filtered results
  const itemsPerPage = limit;
  const totalItems = filteredHistory.length;
  const currentTotalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedHistory = filteredHistory.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-AU", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <PageHeader
          title="Lead Usage History"
          onBack={() => navigate(-1)}
          className="mb-6"
        />

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-50 bg-white">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex flex-col min-w-0">
                <h3 className="text-[20px] font-semibold text-[#111827]">
                  Lead Usage History
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Track the credits used when you respond to customer job leads.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Advanced Date Range Picker */}
                <div className="w-64">
                  <DateRangePicker 
                    range={dateRange}
                    onRangeChange={setDateRange}
                    placeholder="Select Date Range"
                  />
                </div>

                <div className="w-36 h-[46px]">
                  <CustomSelect 
                    value={sortBy}
                    onChange={(val) => {
                      setSortBy(val);
                      setPage(1);
                    }}
                    placeholder="Sort By"
                    options={[
                      { label: 'Date', value: 'createdAt' },
                      { label: 'Amount', value: 'amount' },
                      { label: 'Type', value: 'type' }
                    ]}
                  />
                </div>
                
                <div className="w-36 h-[46px]">
                  <CustomSelect 
                    value={sortOrder}
                    onChange={(val) => {
                      setSortOrder(val);
                      setPage(1);
                    }}
                    placeholder="Order"
                    options={[
                      { label: 'Newest First', value: 'desc' },
                      { label: 'Oldest First', value: 'asc' }
                    ]}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button 
                    variant="primary" 
                    onClick={() => setPage(1)}
                    className="px-5 h-[46px] rounded-xl text-sm"
                  >
                    Apply
                  </Button>
                  {(dateRange?.from || dateRange?.to || sortBy !== 'createdAt' || sortOrder !== 'desc') && (
                    <button 
                      onClick={() => {
                        setDateRange({ from: null, to: null });
                        setSortBy('createdAt');
                        setSortOrder('desc');
                        setPage(1);
                      }}
                      className="w-[46px] h-[46px] cursor-pointer flex items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                      title="Clear Filters"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="min-h-[400px] flex flex-col">
            {loading ? (
              <div className="flex-1 flex items-center justify-center py-10">
                <Loader message="Loading history details..." />
              </div>
            ) : error ? (
              <div className="flex-1 p-12 text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                  <Clock className="w-8 h-8" />
                </div>
                <p className="text-red-600 font-semibold">{error}</p>
                <button
                  onClick={() => fetchHistory()}
                  className="mt-4 text-primary-600 font-bold hover:underline"
                >
                  Try Again
                </button>
              </div>
            ) : paginatedHistory.length > 0 ? (
              <>
                <div className="divide-y divide-[#F9FAFB]">
                  {paginatedHistory.map((item, idx) => (
                    <div
                      key={item._id || idx}
                      className="px-6 py-5 hover:bg-[#F9FAFB] transition-colors flex justify-between items-center"
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
                                    <div className="border-b border-gray-100 pb-2">
                                      <h4 className="text-sm font-bold text-gray-900 capitalize">
                                        {item.jobId.serviceTypeId?.name || item.jobId.categoryId?.name || "Cleaning Job"}
                                      </h4>
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

                                    {/* Instructions */}
                                    {item.jobId.instructions && (
                                      <div className="space-y-0.5">
                                        <div className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Instructions</div>
                                        <div className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2 border border-gray-100/50 max-h-24 overflow-y-auto">
                                          {item.jobId.instructions}
                                        </div>
                                      </div>
                                    )}

                                    {/* Grid details: Plans, Council Approval, Budget, Job Stage, and Commercial Fields */}
                                    {(item.jobId.hasPlans || item.jobId.hasCouncilApproval || item.jobId.budget || item.jobId.jobStage || item.jobId.propertyType || item.jobId.commercialCleaningType || item.jobId.preferredCleaningTime || (item.jobId.areasNeedCleaning && item.jobId.areasNeedCleaning.length > 0)) && (
                                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                                        {((item.jobId.categoryId?.name?.toLowerCase().includes('commercial') || item.jobId.propertyType || item.jobId.commercialCleaningType) ? [
                                          { label: 'Property Type', value: item.jobId.propertyType },
                                          { label: 'Cleaning Service Type', value: item.jobId.commercialCleaningType },
                                          { label: 'Areas to Clean', value: item.jobId.areasNeedCleaning && item.jobId.areasNeedCleaning.length > 0 ? item.jobId.areasNeedCleaning.join(', ') : null },
                                          { label: 'Preferred Time', value: item.jobId.preferredCleaningTime },
                                          { label: 'Job Stage', value: item.jobId.jobStage },
                                        ] : [
                                          { label: 'Plans', value: item.jobId.hasPlans },
                                          { label: 'Council Approval', value: item.jobId.hasCouncilApproval },
                                          { label: 'Budget', value: item.jobId.budget },
                                          { label: 'Job Stage', value: item.jobId.jobStage },
                                        ]).filter(spec => spec.value).map((spec, idx) => (
                                          <div key={idx} className="bg-gray-50/50 p-2 rounded-lg border border-gray-100/30">
                                            <div className="text-[9px] uppercase text-gray-400 font-bold">{spec.label}</div>
                                            <div className="font-semibold text-gray-700">{spec.value}</div>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* Rooms & Bathrooms */}
                                    {(item.jobId.roomsNeedCleaning || item.jobId.bathroomsNeedCleaning) && (
                                      <div className="flex gap-2">
                                        {item.jobId.roomsNeedCleaning && (
                                          <span className="inline-flex items-center gap-1 bg-gray-100 border border-gray-200 px-2 py-1 rounded-full text-[10px] font-semibold text-gray-700">
                                            🛏️ {item.jobId.roomsNeedCleaning} Rooms
                                          </span>
                                        )}
                                        {item.jobId.bathroomsNeedCleaning && (
                                          <span className="inline-flex items-center gap-1 bg-gray-100 border border-gray-200 px-2 py-1 rounded-full text-[10px] font-semibold text-gray-700">
                                            🚿 {item.jobId.bathroomsNeedCleaning} Baths
                                          </span>
                                        )}
                                      </div>
                                    )}

                                    {/* Extra Services */}
                                    {item.jobId.extraServiceItems && item.jobId.extraServiceItems.length > 0 && (
                                      <div className="space-y-1">
                                        <div className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">Extra Services</div>
                                        <div className="flex flex-wrap gap-1">
                                          {item.jobId.extraServiceItems.map((s, sIdx) => (
                                            <span key={s._id || sIdx} className="bg-blue-50/60 border border-blue-100 px-2 py-0.5 rounded-full text-[10px] font-semibold text-blue-600">
                                              {s.name || s}
                                            </span>
                                          ))}
                                        </div>
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
                  ))}
                </div>

                <div className="p-8 border-t border-gray-50 mt-auto bg-gray-50/30">
                  <PaginationRanges
                    count={currentTotalPages}
                    page={page}
                    onChange={(_, value) => setPage(value)}
                    hideIfSinglePage={false}
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 p-20 text-center flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-gray-200">
                  <HistoryIcon className="w-8 h-8 text-gray-300" />
                </div>
                <h4 className="text-gray-500 font-bold text-lg">
                  No Lead Activity Found
                </h4>
                <p className="text-gray-400 text-sm max-w-xs mx-auto mt-1">
                  Your lead activity will appear here once you start responding
                  to customer jobs.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadUsageHistoryPage;

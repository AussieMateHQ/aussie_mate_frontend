import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { PageHeader } from '../../components';
import ExportIcon from '../../assets/export.svg';
import BusinessIcon from '../../assets/business.svg';
import DollarIcon from '../../assets/dollar.svg';
import TimeIcon from '../../assets/time.svg';

const EarningsPage = () => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState('Weekly');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Sample data - replace with actual API data
  const earningsData = {
    thisWeek: 560.00,
    pending: 176.00,
    lifetime: 12450.00,
    payout: {
      amount: 176.00,
      releaseDate: 'Sep 4, 2025',
      method: 'Bank Transfer • 1234'
    },
    weeklyChart: [
      { day: 'Mon', amount: 1200 },
      { day: 'Tue', amount: 1800 },
      { day: 'Wed', amount: 87455 },
      { day: 'Thu', amount: 2200 },
      { day: 'Fri', amount: 1500 },
      { day: 'Sat', amount: 1900 },
      { day: 'Sun', amount: 1100 }
    ],
    monthlyChart: [
      { day: 'W1', amount: 12000 },
      { day: 'W2', amount: 45000 },
      { day: 'W3', amount: 28000 },
      { day: 'W4', amount: 65000 }
    ],
    yearlyChart: [
      { day: 'Jan', amount: 85000 },
      { day: 'Feb', amount: 120000 },
      { day: 'Mar', amount: 95000 },
      { day: 'Apr', amount: 110000 },
      { day: 'May', amount: 140000 },
      { day: 'Jun', amount: 130000 },
      { day: 'Jul', amount: 155000 },
      { day: 'Aug', amount: 180000 },
      { day: 'Sep', amount: 160000 },
      { day: 'Oct', amount: 175000 },
      { day: 'Nov', amount: 190000 },
      { day: 'Dec', amount: 210000 }
    ],
    jobs: [
      {
        id: 1,
        title: 'Bond Cleaning',
        date: 'Sep 1, 2025',
        amount: 176.00,
        status: 'Completed',
        fee: '20%'
      },
      {
        id: 2,
        title: 'Carpet Cleaning',
        date: 'Aug 29, 2025',
        amount: 120.00,
        status: 'Completed',
        fee: '20%'
      },
      {
        id: 3,
        title: 'Retail Audit',
        date: 'Aug 27, 2025',
        amount: 0.00,
        status: 'Completed',
        fee: '20%'
      }
    ]
  };

  const getChartData = () => {
    switch (selectedPeriod) {
      case 'Monthly': return earningsData.monthlyChart;
      case 'Yearly': return earningsData.yearlyChart;
      default: return earningsData.weeklyChart;
    }
  };

  const currentChartData = getChartData();
  const currentMax = Math.max(...currentChartData.map(item => item.amount), 1000);
  // Round up to nearest nice number for Y-axis
  const chartMax = Math.ceil(currentMax / 1000) * 1000 || 100000;

  // Dropdown options
  const periodOptions = ['Weekly', 'Monthly', 'Yearly'];

  const handlePeriodSelect = (period) => {
    setSelectedPeriod(period);
    setIsDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const generateEarningsPDFHTML = (data) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Earnings Statement - Aussie Mate</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
            @page { size: auto; margin: 15mm; }
            body { font-family: 'Outfit', sans-serif; color: #1f2937; margin: 0; padding: 20px; background: white; line-height: 1.4; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 2px solid #f3f4f6; padding-bottom: 15px; }
            .logo { font-size: 24px; font-weight: 700; color: #1e40af; }
            .title-meta { text-align: right; }
            .doc-title { font-size: 28px; font-weight: 700; color: #111827; margin: 0 0 5px 0; }
            .date-meta { color: #6b7280; font-size: 13px; }
            .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
            .summary-card { padding: 15px; border: 1px solid #f3f4f6; border-radius: 12px; background: #f9fafb; }
            .card-label { font-size: 11px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
            .card-value { font-size: 20px; font-weight: 700; color: #1e40af; }
            .payout-section { padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; margin-bottom: 30px; }
            .section-title { font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 15px; }
            .payout-details { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
            .detail-item { font-size: 13px; }
            .detail-label { color: #6b7280; margin-bottom: 4px; }
            .detail-value { font-weight: 600; color: #111827; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { text-align: left; padding: 12px; background: #f9fafb; color: #4b5563; font-weight: 600; font-size: 13px; text-transform: uppercase; border-bottom: 2px solid #f3f4f6; }
            td { padding: 15px 12px; border-bottom: 1px solid #f3f4f6; font-size: 13px; }
            .job-title { font-weight: 600; color: #111827; margin-bottom: 2px; text-transform: capitalize; }
            .job-date { font-size: 12px; color: #6b7280; }
            .status-badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 600; background: #ecfdf5; color: #059669; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #f3f4f6; text-align: center; font-size: 11px; color: #9ca3af; line-height: 1.5; }
        </style>
    </head>
    <body>
        <div class="header">
            <div>
                <div class="logo">Aussie Mate</div>
                <div class="date-meta" style="margin-top: 5px;">Cleaner Partner Statement</div>
            </div>
            <div class="title-meta">
                <h1 class="doc-title">EARNINGS REPORT</h1>
                <div class="date-meta">Generated on ${new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
            </div>
        </div>

        <div class="summary-grid">
            <div class="summary-card">
                <div class="card-label">Weekly Earnings</div>
                <div class="card-value">$${data.thisWeek.toFixed(2)}</div>
            </div>
            <div class="summary-card">
                <div class="card-label">Escrow (Pending)</div>
                <div class="card-value">$${data.pending.toFixed(2)}</div>
            </div>
            <div class="summary-card">
                <div class="card-label">Lifetime Total</div>
                <div class="card-value">$${data.lifetime.toFixed(2)}</div>
            </div>
        </div>

        <div class="payout-section">
            <div class="section-title">Next Scheduled Payout</div>
            <div class="payout-details">
                <div class="detail-item">
                    <div class="detail-label">Amount</div>
                    <div class="detail-value">$${data.payout.amount.toFixed(2)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Release Date</div>
                    <div class="detail-value">${data.payout.releaseDate}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Payment Method</div>
                    <div class="detail-value">${data.payout.method}</div>
                </div>
            </div>
        </div>

        <div class="section-title">Job Breakdown</div>
        <table>
            <thead>
                <tr>
                    <th style="width: 50%">Service Details</th>
                    <th>Status</th>
                    <th style="text-align: right">Partner Share</th>
                </tr>
            </thead>
            <tbody>
                ${data.jobs.map(job => `
                    <tr>
                        <td>
                            <div class="job-title">${job.title}</div>
                            <div class="job-date">${job.date}</div>
                        </td>
                        <td><span class="status-badge">${job.status}</span></td>
                        <td style="text-align: right; font-weight: 600;">$${job.amount.toFixed(2)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="footer">
            This statement is a summary of your earnings through the Aussie Mate platform. <br/>
            All amounts are in AUD. For tax purposes, please refer to individual invoices for service details and ABN information.
        </div>
    </body>
    </html>
    `;
  };

  const handleExportPDF = () => {
    const html = generateEarningsPDFHTML(earningsData);

    // Create a hidden iframe for printing
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    iframe.contentDocument.open();
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();

    iframe.contentWindow.onload = () => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    };
  };

  return (
    <div className='pb-6'>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeader
          title="Earnings Dashboard"
          onBack={() => navigate(-1)}
          className='h-16'
          rightSlot={
            <button
              onClick={handleExportPDF}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl! transition-colors cursor-pointer"
            >
              <img src={ExportIcon} alt="Export" className="w-4 h-4" />
              <span className="text-sm font-medium text-gray-700">Export</span>
            </button>
          }
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-0!">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* This Week's Earnings */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img src={BusinessIcon} alt="Earnings" className="w-12 h-12" />
                <div>
                  <h3 className="text-sm font-medium text-gray-600">This Week's Earnings</h3>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">${earningsData.thisWeek.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pending (Escrow) */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2  rounded-lg">
                  <img src={TimeIcon} alt="Pending" className="w-12 h-12" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-600">Pending (Escrow)</h3>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">${earningsData.pending.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Lifetime Earnings */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200 ">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg">
                  <img src={DollarIcon} alt="Lifetime" className="w-12 h-12" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-600">Lifetime Earnings</h3>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">${earningsData.lifetime.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payout Summary */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200 mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold text-primary-500 mb-4">Payout Summary</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <p className="text-sm font-medium text-primary-200 mb-1">Amount</p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900">${earningsData.payout.amount.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-primary-200 mb-1">Release Date</p>
              <p className="text-lg font-medium text-primary-500">{earningsData.payout.releaseDate}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-primary-200 mb-1">Payout Method</p>
              <p className="text-lg font-medium text-primary-500">{earningsData.payout.method}</p>
            </div>
          </div>
        </div>

        {/* Dynamic Earnings Chart */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 md:mb-6 gap-2 sm:gap-0">
            <div>
              <h2 className="text-base sm:text-lg md:text-xl font-semibold text-primary-500">{selectedPeriod}'s Earnings</h2>
              <p className="text-xs sm:text-sm text-primary-200 font-medium">{currentChartData.length} entries shown</p>
            </div>
            {/* Custom Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white hover:bg-gray-50 focus:outline-none text-primary-200 font-medium"
              >
                <span className="text-primary-200">{selectedPeriod}</span>
                <ChevronDown
                  className={`w-4 h-4 ml-2 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                  strokeWidth={2}
                />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  {periodOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => handlePeriodSelect(option)}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg transition-colors ${selectedPeriod === option ? 'bg-blue-50 text-primary-500' : 'text-primary-200'
                        }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bar Chart */}
          <div className="space-y-2 sm:space-y-4">
            {/* Chart Container with Grid Lines */}
            <div className="relative h-40 sm:h-48 md:h-56 bg-gray-50 rounded-lg p-2 sm:p-4">
              {/* Grid Lines */}
              <div className="absolute inset-2 sm:inset-4 flex flex-col justify-between">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="border-t border-gray-200"></div>
                ))}
              </div>

              {/* Y-axis labels */}
              <div className="absolute left-0 top-2 sm:top-4 bottom-2 sm:bottom-4 flex flex-col justify-between text-xs text-primary-200 font-medium">
                <span className="text-xs">${(chartMax / 1000).toFixed(0)}k</span>
                <span className="text-xs">${(chartMax * 0.8 / 1000).toFixed(0)}k</span>
                <span className="text-xs">${(chartMax * 0.6 / 1000).toFixed(0)}k</span>
                <span className="text-xs">${(chartMax * 0.4 / 1000).toFixed(0)}k</span>
                <span className="text-xs">${(chartMax * 0.2 / 1000).toFixed(0)}k</span>
                <span className="text-xs">$0</span>
              </div>

              {/* Chart Bars */}
              <div className="flex items-end justify-between h-full pl-6 sm:pl-8 pr-2 sm:pr-4">
                {currentChartData.map((item, index) => {
                  // Calculate height based on a dynamic max
                  let height = (item.amount / chartMax) * 100;

                  // Find the highest amount to determine which bar should be highlighted
                  const isHighlighted = item.amount === Math.max(...currentChartData.map(d => d.amount));

                  // Ensure minimum height for visibility and cap at 100%
                  height = Math.max(height, 5); // Minimum 5% height for visibility
                  height = Math.min(height, 100); // Maximum 100% height

                  return (
                    <div key={index} className="flex flex-col items-center flex-1 relative group">
                      <div className="relative w-6 sm:w-8 md:w-10 h-full flex items-end">
                        <div
                          className={`w-full rounded-t-lg transition-all duration-300 ${isHighlighted
                            ? 'bg-[#3354F4] border-2 border-[#1F6FEB] shadow-lg'
                            : 'bg-[#E6EEF5] hover:bg-gray-500'
                            }`}
                          style={{
                            height: `${height}%`,
                            minHeight: isHighlighted ? '50px' : '20px'
                          }}
                        ></div>

                        {/* Tooltip for highlighted bar - always visible */}
                        {isHighlighted && (
                          <div className="absolute -top-12 sm:-top-16 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg px-2 sm:px-3 py-1 sm:py-2 text-xs whitespace-nowrap z-10 opacity-100">
                            <div className="text-gray-600 text-xs">Aug 28</div>
                            <div className="font-bold text-gray-900 text-xs sm:text-sm">${item.amount.toLocaleString()}</div>
                            <div className="text-gray-600 text-xs">Bond Cleaning</div>
                            {/* Arrow pointing down */}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 sm:border-l-4 border-r-2 sm:border-r-4 border-t-2 sm:border-t-4 border-l-transparent border-r-transparent border-t-white"></div>
                          </div>
                        )}
                      </div>

                      {/* Day labels */}
                      <div className="mt-1 sm:mt-2 text-xs font-medium text-primary-500">{item.day}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Job-wise Breakdown */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm">
          <div className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-primary-500">Job-wise Breakdown</h2>
          </div>

          <div className="mx-3">
            {earningsData.jobs.map((job) => (
              <div key={job.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors border-b border-primary-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-primary-500 mb-1 capitalize">{job.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{job.date}</p>
                    <p className="text-sm font-medium text-primary-200">
                      ${job.amount.toFixed(2)} (after {job.fee} fee)
                    </p>
                  </div>
                  <div className="ml-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#DBF9E7] text-green-500">
                      {job.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EarningsPage;

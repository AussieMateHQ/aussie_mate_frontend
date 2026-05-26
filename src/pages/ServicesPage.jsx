import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.svg';
import { useAuth } from '../contexts/AuthContext';
import { CLEANER_ROLES } from '../routeGroups';

const ServicesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const userRole = user.role || user.userType;
      if (userRole === 'Customer') {
        navigate('/customer-dashboard', { replace: true });
      } else if (CLEANER_ROLES.includes(userRole)) {
        navigate('/cleaner-dashboard', { replace: true });
      }
    }
  }, [user, navigate]);

  // Helper icons
  const CheckBadgeIcon = () => (
    <svg className="w-5 h-5 text-[#E58B2E] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      
      {/* 1. Header Navigation */}
      <header className="px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full bg-white relative">
        <div className="flex items-center z-10">
          <Link to="/" className="flex items-center">
            <img src={logo} alt="Aussiemate" className="h-10 sm:h-12 md:h-14 w-auto" />
          </Link>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-8 font-medium text-gray-600 absolute left-1/2 -translate-x-1/2 z-0">
          <Link to="/" className="hover:text-gray-900 transition-colors">Home</Link>
   
          <Link to="/about" className="hover:text-gray-900 transition-colors">About</Link>
          <Link to="/contact" className="hover:text-gray-900 transition-colors">Contact</Link>
        </nav>

        <div className="flex items-center space-x-4 z-10">
          <button 
            onClick={() => navigate('/login')}
            className="px-5 py-2 font-semibold text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors hidden md:block"
          >
            Log in
          </button>
          <button 
            onClick={() => navigate('/login')}
            className="px-5 py-2 font-semibold text-gray-900 border border-gray-900 rounded-lg hover:bg-gray-900 hover:text-white transition-colors"
          >
            Get started
          </button>
        </div>
      </header>

      <main className="flex-grow">
        {/* 2. Hero Section */}
        <section className="bg-[#1B222C] py-20 px-6 text-center text-white">
          <div className="max-w-4xl mx-auto flex flex-col items-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Aussiemate Services
            </h1>
            <p className="text-lg md:text-xl text-[#6A8CA7] max-w-2xl">
              Seven service categories to cover every home and business need.
            </p>
          </div>
        </section>

        <section id="services" className="py-20 px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">WHAT WE OFFER</p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our services</h2>
          <p className="text-lg text-gray-600 mb-12">
            Seven service categories to cover every home and business need.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Card 1 */}
            <div className="bg-white p-8 rounded-[24px] border border-gray-200 hover:shadow-lg transition-all group flex flex-col h-full">
              <div className="w-14 h-14 bg-[#1B222C] rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-[#E58B2E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Domestic cleaning</h3>
              <p className="text-gray-600 mb-6 flex-grow">Professional home cleaning tailored to your schedule and needs.</p>
              <div className="flex flex-wrap gap-2 mb-8">
                <span className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium text-gray-600">Weekly</span>
                <span className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium text-gray-600">Fortnightly</span>
                <span className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium text-gray-600">One-off</span>
              </div>
              <button onClick={() => navigate('/login')} className="inline-flex items-center text-[#1E5D88] font-semibold hover:text-[#144262] transition-colors mt-auto w-fit">
                <span className="mr-2">→</span> Book now
              </button>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-8 rounded-[24px] border border-gray-200 hover:shadow-lg transition-all group flex flex-col h-full">
              <div className="w-14 h-14 bg-[#1B222C] rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-[#E58B2E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Commercial cleaning</h3>
              <p className="text-gray-600 mb-6 flex-grow">Offices, warehouses, and business premises kept spotless.</p>
              <div className="flex flex-wrap gap-2 mb-8">
                <span className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium text-gray-600">Offices</span>
                <span className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium text-gray-600">Retail</span>
                <span className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium text-gray-600">Warehouses</span>
              </div>
              <button onClick={() => navigate('/login')} className="inline-flex items-center text-[#1E5D88] font-semibold hover:text-[#144262] transition-colors mt-auto w-fit">
                <span className="mr-2">→</span> Book now
              </button>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-8 rounded-[24px] border border-gray-200 hover:shadow-lg transition-all group flex flex-col h-full">
              <div className="w-14 h-14 bg-[#1B222C] rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-[#E58B2E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Bond cleaning</h3>
              <p className="text-gray-600 mb-6 flex-grow">End-of-lease deep cleans to help you get your bond back.</p>
              <div className="flex flex-wrap gap-2 mb-8">
                <span className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium text-gray-600">End of lease</span>
                <span className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium text-gray-600">Deep clean</span>
              </div>
              <button onClick={() => navigate('/login')} className="inline-flex items-center text-[#1E5D88] font-semibold hover:text-[#144262] transition-colors mt-auto w-fit">
                <span className="mr-2">→</span> Book now
              </button>
            </div>

            {/* Card 4 */}
            <div className="bg-white p-8 rounded-[24px] border border-gray-200 hover:shadow-lg transition-all group flex flex-col h-full">
              <div className="w-14 h-14 bg-[#1B222C] rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-[#E58B2E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Handyman services</h3>
              <p className="text-gray-600 mb-6 flex-grow">Repairs, installations, flat-pack assembly and general odd jobs.</p>
              <div className="flex flex-wrap gap-2 mb-8">
                <span className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium text-gray-600">Repairs</span>
                <span className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium text-gray-600">Installs</span>
                <span className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium text-gray-600">Assembly</span>
              </div>
              <button onClick={() => navigate('/login')} className="inline-flex items-center text-[#1E5D88] font-semibold hover:text-[#144262] transition-colors mt-auto w-fit">
                <span className="mr-2">→</span> Book now
              </button>
            </div>

            {/* Card 5 */}
            <div className="bg-white p-8 rounded-[24px] border border-gray-200 hover:shadow-lg transition-all group flex flex-col h-full">
              <div className="w-14 h-14 bg-[#1B222C] rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-[#E58B2E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Pet sitting</h3>
              <p className="text-gray-600 mb-6 flex-grow">In-home care and companionship for your pets while you're away.</p>
              <div className="flex flex-wrap gap-2 mb-8">
                <span className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium text-gray-600">Dogs</span>
                <span className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium text-gray-600">Cats</span>
                <span className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium text-gray-600">In-home</span>
              </div>
              <button onClick={() => navigate('/login')} className="inline-flex items-center text-[#1E5D88] font-semibold hover:text-[#144262] transition-colors mt-auto w-fit">
                <span className="mr-2">→</span> Book now
              </button>
            </div>

            {/* Card 6 */}
            <div className="bg-white p-8 rounded-[24px] border border-gray-200 hover:shadow-lg transition-all group flex flex-col h-full">
              <div className="w-14 h-14 bg-[#1B222C] rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-[#E58B2E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Housekeeping</h3>
              <p className="text-gray-600 mb-6 flex-grow">Ongoing household management — laundry, organisation, and more.</p>
              <div className="flex flex-wrap gap-2 mb-8">
                <span className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium text-gray-600">Ongoing</span>
                <span className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium text-gray-600">Laundry</span>
                <span className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium text-gray-600">Organising</span>
              </div>
              <button onClick={() => navigate('/login')} className="inline-flex items-center text-[#1E5D88] font-semibold hover:text-[#144262] transition-colors mt-auto w-fit">
                <span className="mr-2">→</span> Book now
              </button>
            </div>

            {/* Card 7 */}
            <div className="bg-white p-8 rounded-[24px] border border-gray-200 hover:shadow-lg transition-all group flex flex-col h-full lg:col-span-1 md:col-span-2">
              <div className="w-14 h-14 bg-[#1B222C] rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-[#E58B2E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Home & small business</h3>
              <p className="text-gray-600 mb-6 flex-grow">General support services for homes and small business operations.</p>
              <div className="flex flex-wrap gap-2 mb-8">
                <span className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium text-gray-600">General</span>
                <span className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium text-gray-600">Small biz</span>
              </div>
              <button onClick={() => navigate('/login')} className="inline-flex items-center text-[#1E5D88] font-semibold hover:text-[#144262] transition-colors mt-auto w-fit">
                <span className="mr-2">→</span> Book now
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* 6. The Aussiemate Difference */}
      <section className="py-15 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">WHY CHOOSE US</p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-10">The Aussiemate difference</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-[#F6F5F0] p-8 rounded-[24px]">
              <svg className="w-6 h-6 text-[#E58B2E] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Locally operated</h3>
              <p className="text-gray-700">100% Australian owned and operated from Geebung, QLD</p>
            </div>
            
            <div className="bg-[#F6F5F0] p-8 rounded-[24px]">
              <svg className="w-6 h-6 text-[#E58B2E] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Vetted professionals</h3>
              <p className="text-gray-700">Every provider is screened and verified before joining our platform</p>
            </div>

            <div className="bg-[#F6F5F0] p-8 rounded-[24px]">
              <svg className="w-6 h-6 text-[#E58B2E] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Easy scheduling</h3>
              <p className="text-gray-700">Book at a time that suits you — no phone calls required</p>
            </div>

            <div className="bg-[#F6F5F0] p-8 rounded-[24px]">
              <svg className="w-6 h-6 text-[#E58B2E] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Dedicated support</h3>
              <p className="text-gray-700">Our team responds within 2-3 business days for all enquiries</p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Contact Section */}
</main>
      <section className="py-24 px-6 bg-[#1B222C] text-center text-white border-b border-[#2a3441]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to book?</h2>
          <p className="text-xl text-gray-300 mb-10">
            Contact us today and we'll match you with the right professional.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <a 
              href="mailto:support@aussiemate.com.au"
              className="inline-flex items-center px-6 py-3 border border-gray-600 rounded-full text-[#E58B2E] hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              support@aussiemate.com.au
            </a>
            <button 
              onClick={() => navigate('/login')}
              className="px-8 py-3 bg-[#11161d] border border-gray-800 rounded-full font-medium hover:bg-black transition-colors"
            >
              Get in touch
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};

export default ServicesPage;

import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Shield, CheckSquare, Plus, ArrowRight, MoreHorizontal, Home, Building2, Key, Wrench, Dog, Shirt, BriefcaseBusiness, Info } from 'lucide-react';
import logo from '../assets/logo.svg';
import { useAuth } from '../contexts/AuthContext';
import { CLEANER_ROLES } from '../routeGroups';

const HomePage = () => {
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

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      
      {/* 1. Header Navigation */}
      <header className="px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full bg-white border-b border-gray-100 relative">
        <div className="flex items-center z-10">
          <Link to="/home" className="flex items-center">
            <img src={logo} alt="Aussiemate" className="h-10 sm:h-12 md:h-14 w-auto" />
          </Link>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-8 font-medium text-gray-600 absolute left-1/2 -translate-x-1/2">
          <Link to="/home" className="text-gray-900 font-bold transition-colors">Home</Link>
   
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
       
          <button className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 md:hidden">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main>
        {/* 2. Hero Section */}
        <section className="relative pt-24 pb-32 px-6 text-center overflow-hidden bg-white">
          {/* Decorative background shapes */}
          <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-[#F4F7FF] rounded-full -translate-x-1/3 -translate-y-1/3 z-0"></div>
          <div className="absolute bottom-0 right-0 w-[700px] h-[700px] bg-[#FDF7EE] rounded-full translate-x-1/4 translate-y-1/4 z-0"></div>

          <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-transparent border border-blue-200 mb-8 text-blue-600">
              <MapPin className="w-4 h-4 mr-2 text-blue-500" />
              <span className="text-sm font-medium">Proudly Australian · Geebung, QLD</span>
            </div>
            
            <h1 className="text-2xl md:text-6xl font-bold mb-6 leading-tight text-gray-900 tracking-tight">
              Australia's trusted <span className="text-blue-600">home &<br/>business</span> <span className="">services</span> platform
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl">
              Book verified professionals for cleaning, handyman work, pet sitting and more — fast, simple, and reliable. Operated by PATEL HOUSE PTY LTD.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-12">
              <button 
                onClick={() => navigate('/about')}
                className="px-8 py-3.5 bg-white rounded-lg font-bold text-gray-900 transition-colors w-full sm:w-auto flex items-center justify-center shadow-sm"
              >
                <Info className="w-5 h-5 mr-2" />
                Learn More
              </button>
              <button 
                onClick={() => navigate('/services')}
                className="px-8 py-3.5 bg-white rounded-lg font-bold text-gray-900 transition-colors w-full sm:w-auto shadow-sm"
              >
                Browse Services
              </button>
            </div>
            
            <div className="flex flex-wrap items-center justify-center text-sm font-medium text-gray-500 gap-x-4 gap-y-2">
              <div className="flex items-center">
                <Shield className="w-4 h-4 text-green-500 mr-1.5" />
                Verified professionals
              </div>
              <span className="hidden sm:inline">·</span>
              <div className="flex items-center">
                Secure payments
              </div>
              <span className="hidden sm:inline">·</span>
              <div className="flex items-center">
                Australian owned
              </div>
            </div>
          </div>
        </section>

        {/* 3. Popular Services Section */}
        <section className="py-15 px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-[#0a1b3f] mb-8 text-left">Popular Services</h2>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {/* Card 1: General Cleaning */}
              <Link to="/services" className="bg-white p-6 rounded-2xl border border-[#fbf5ff] shadow-[0_4px_20px_rgba(244,235,255,0.6)] hover:shadow-[0_6px_25px_rgba(244,235,255,1)] hover:border-[#f3e5ff] transition-all group flex flex-col items-center text-center">
                <div className="w-28 h-28 mb-4 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-blue-50/50 rounded-full scale-[0.8] group-hover:scale-100 transition-transform"></div>
                  <Home className="w-12 h-12 text-blue-500 relative z-10" strokeWidth={1.5} />
                </div>
                <h3 className="text-[15px] font-medium text-gray-900">General Cleaning</h3>
              </Link>
              
              {/* Card 2: Commercial Cleaning */}
              <Link to="/services" className="bg-white p-6 rounded-2xl border border-[#fbf5ff] shadow-[0_4px_20px_rgba(244,235,255,0.6)] hover:shadow-[0_6px_25px_rgba(244,235,255,1)] hover:border-[#f3e5ff] transition-all group flex flex-col items-center text-center">
                <div className="w-28 h-28 mb-4 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-orange-50/50 rounded-full scale-[0.8] group-hover:scale-100 transition-transform"></div>
                  <Building2 className="w-12 h-12 text-orange-400 relative z-10" strokeWidth={1.5} />
                </div>
                <h3 className="text-[15px] font-medium text-gray-900">Commercial Cleaning</h3>
              </Link>

              {/* Card 3: Bond Cleaning */}
              <Link to="/services" className="bg-white p-6 rounded-2xl border border-[#fbf5ff] shadow-[0_4px_20px_rgba(244,235,255,0.6)] hover:shadow-[0_6px_25px_rgba(244,235,255,1)] hover:border-[#f3e5ff] transition-all group flex flex-col items-center text-center">
                <div className="w-28 h-28 mb-4 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-teal-50/50 rounded-full scale-[0.8] group-hover:scale-100 transition-transform"></div>
                  <Key className="w-12 h-12 text-teal-500 relative z-10" strokeWidth={1.5} />
                </div>
                <h3 className="text-[15px] font-medium text-gray-900">Bond Cleaning</h3>
              </Link>

              {/* Card 4: Other Categories */}
              <Link to="/services" className="bg-white p-6 rounded-2xl border border-[#fbf5ff] shadow-[0_4px_20px_rgba(244,235,255,0.6)] hover:shadow-[0_6px_25px_rgba(244,235,255,1)] hover:border-[#f3e5ff] transition-all group flex flex-col items-center text-center">
                <div className="w-28 h-28 mb-4 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-blue-50/50 rounded-full scale-[0.8] group-hover:scale-100 transition-transform"></div>
                  <MoreHorizontal className="w-12 h-12 text-blue-500 relative z-10" strokeWidth={1.5} />
                </div>
                <h3 className="text-[15px] font-medium text-gray-900">Other Categories</h3>
              </Link>
            </div>
          </div>
        </section>

        {/* 4. How It Works Section */}
        <section className="py-15 px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">HOW IT WORKS</p>
              <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-4">Book in 3 easy steps</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                No calls, no hassle. Post your job and get matched with verified local professionals instantly.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm relative">
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg mb-6">
                  1
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Post your job</h3>
                <p className="text-gray-600 leading-relaxed">
                  Tell us what service you need, your location, and when you want it done.
                </p>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm relative">
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg mb-6">
                  2
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Receive quotes</h3>
                <p className="text-gray-600 leading-relaxed">
                  Verified professionals in your area send you competitive quotes to compare.
                </p>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm relative">
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg mb-6">
                  3
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Book & pay securely</h3>
                <p className="text-gray-600 leading-relaxed">
                  Choose your preferred pro, confirm your booking, and pay safely through our platform.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Why Aussiemate Section */}
        <section className="py-15 px-6 bg-[#FAFBFC]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">WHY AUSSIEMATE</p>
              <h2 className="text-3xl md:text-4xl font-semibold text-gray-900">The Aussiemate difference</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm text-center flex flex-col items-center">
                <div className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center mb-5">
                  <CheckSquare className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Verified pros</h3>
                <p className="text-gray-500 text-sm leading-relaxed">Every provider is vetted before joining</p>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm text-center flex flex-col items-center">
                <div className="w-14 h-14 bg-amber-400 rounded-xl flex items-center justify-center mb-5">
                  <Shield className="w-7 h-7 text-gray-900" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Secure payments</h3>
                <p className="text-gray-500 text-sm leading-relaxed">Pay safely through our platform</p>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm text-center flex flex-col items-center">
                <div className="w-14 h-14 bg-white border-2 border-gray-900 rounded-xl flex items-center justify-center mb-5">
                  <span className="font-bold text-xl text-gray-900">AU</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">100% Australian</h3>
                <p className="text-gray-500 text-sm leading-relaxed">Owned & operated from Geebung, QLD</p>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm text-center flex flex-col items-center">
                <div className="w-14 h-14 bg-white border-2 border-yellow-400 rounded-xl flex items-center justify-center mb-5">
                  <svg className="w-7 h-7 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Fast booking</h3>
                <p className="text-gray-500 text-sm leading-relaxed">Get quotes and book within minutes</p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. About Section */}
        <section className="py-15 px-6 bg-white">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-6 leading-tight">
                About Aussiemate & PATEL HOUSE PTY LTD
              </h2>
              <div className="text-gray-600 space-y-6 text-lg">
                <p>
                  Aussiemate is a digital service marketplace owned and operated by PATEL HOUSE PTY LTD, an Australian company based in Geebung, Queensland.
                </p>
                <p>
                  We connect customers with trusted professionals for cleaning, handyman, pet sitting, and more. Our mission is to make booking services simple, fast, and reliable.
                </p>
                <p>
                  All Aussiemate services and platform operations are managed by PATEL HOUSE PTY LTD.
                </p>
              </div>
            </div>
            
            <div className="bg-blue-50/50 rounded-[32px] p-8 border border-blue-100 relative">
              <div className="flex items-center space-x-3 mb-8">
                <Building2 className="w-6 h-6 text-blue-600" />
                <h3 className="text-sm font-bold text-blue-700 uppercase tracking-wide">PATEL HOUSE PTY LTD</h3>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-start border-b border-blue-100 pb-6">
                  <div className="w-10 flex shrink-0">
                    <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                    </svg>
                  </div>
                  <div>
                    <span className="block text-sm text-blue-400 font-medium mb-1">ABN</span>
                    <span className="block font-medium text-gray-900">86 687 008 591</span>
                  </div>
                </div>
                
                <div className="flex items-start border-b border-blue-100 pb-6">
                  <div className="w-10 flex shrink-0">
                    <MapPin className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <span className="block text-sm text-blue-400 font-medium mb-1">Location</span>
                    <span className="block font-medium text-gray-900">Geebung, QLD, Australia</span>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-10 flex shrink-0">
                    <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <span className="block text-sm text-blue-400 font-medium mb-1">Email</span>
                    <span className="block font-medium text-gray-900"><a href="mailto:support@aussiemate.com.au" className="hover:text-blue-600 transition-colors">support@aussiemate.com.au</a></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
};

export default HomePage;

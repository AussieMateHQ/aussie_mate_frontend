import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Shield, CheckSquare, Plus, ArrowRight, MoreHorizontal, Home, Building2, Key, Wrench, Dog, Shirt, BriefcaseBusiness, Info, Search } from 'lucide-react';
import logo from '../assets/logo.svg';
import { useAuth } from '../contexts/AuthContext';
import { CLEANER_ROLES } from '../routeGroups';

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

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

  // Goes straight to the existing, already-approved job-posting form — no
  // separate landing-page form, no forced login/signup (guests can post a
  // job there and are only asked for name/phone/email at the final step).
  // The typed text is passed through as the category; PostNewJobPage's
  // fuzzy category matcher (matched against the real /categories list from
  // the backend) resolves it, or falls back to manual selection in the form
  // if nothing matches (e.g. a category like "Painting" that doesn't exist
  // in the backend yet).
  const goToJobForm = (categoryName) => {
    navigate('/post-new-job', { state: { categoryName } });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    goToJobForm(searchTerm.trim());
  };

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
              Book verified professionals for cleaning, handyman work, pet sitting and more — fast, simple, and reliable.
            </p>

            {/* Search bar — matches a category (fuzzy, same matching the job form
                already uses) and jumps straight into the existing, approved
                job-posting form with that category pre-selected. No login/signup
                wall: PostNewJobPage already supports posting as a guest. */}
            <form
              onSubmit={handleSearchSubmit}
              className="w-full max-w-2xl mb-8 flex flex-col sm:flex-row items-stretch gap-3 bg-white rounded-2xl sm:rounded-full p-2 shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-gray-100"
            >
              <div className="flex-1 flex items-center px-4">
                <Search className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="What do you need done? e.g. Bond cleaning, handyman…"
                  className="w-full py-3 sm:py-2 text-gray-900 placeholder-gray-400 focus:outline-none bg-transparent"
                />
              </div>
              <button
                type="submit"
                className="px-8 py-3.5 sm:py-3 bg-blue-600 hover:bg-blue-700 rounded-xl sm:rounded-full font-bold text-white transition-colors flex items-center justify-center"
              >
                Get Quotes
              </button>
            </form>

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

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
              {/* Card 1: General Cleaning */}
              <button type="button" onClick={() => goToJobForm('General Cleaning')} className="bg-white p-6 rounded-2xl border border-[#fbf5ff] shadow-[0_4px_20px_rgba(244,235,255,0.6)] hover:shadow-[0_6px_25px_rgba(244,235,255,1)] hover:border-[#f3e5ff] transition-all group flex flex-col items-center text-center">
                <div className="w-24 h-24 mb-4 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-blue-50/50 rounded-full scale-[0.8] group-hover:scale-100 transition-transform"></div>
                  <Home className="w-10 h-10 text-blue-500 relative z-10" strokeWidth={1.5} />
                </div>
                <h3 className="text-[14px] font-semibold text-gray-900">General Cleaning</h3>
              </button>

              {/* Card 2: Commercial Cleaning */}
              <button type="button" onClick={() => goToJobForm('Commercial Cleaning')} className="bg-white p-6 rounded-2xl border border-[#fbf5ff] shadow-[0_4px_20px_rgba(244,235,255,0.6)] hover:shadow-[0_6px_25px_rgba(244,235,255,1)] hover:border-[#f3e5ff] transition-all group flex flex-col items-center text-center">
                <div className="w-24 h-24 mb-4 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-orange-50/50 rounded-full scale-[0.8] group-hover:scale-100 transition-transform"></div>
                  <Building2 className="w-10 h-10 text-orange-400 relative z-10" strokeWidth={1.5} />
                </div>
                <h3 className="text-[14px] font-semibold text-gray-900">Commercial Cleaning</h3>
              </button>

              {/* Card 3: Bond Cleaning */}
              <button type="button" onClick={() => goToJobForm('Bond Cleaning')} className="bg-white p-6 rounded-2xl border border-[#fbf5ff] shadow-[0_4px_20px_rgba(244,235,255,0.6)] hover:shadow-[0_6px_25px_rgba(244,235,255,1)] hover:border-[#f3e5ff] transition-all group flex flex-col items-center text-center">
                <div className="w-24 h-24 mb-4 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-teal-50/50 rounded-full scale-[0.8] group-hover:scale-100 transition-transform"></div>
                  <Key className="w-10 h-10 text-teal-500 relative z-10" strokeWidth={1.5} />
                </div>
                <h3 className="text-[14px] font-semibold text-gray-900">Bond Cleaning</h3>
              </button>

              {/* Card 4: Housekeeper */}
              <button type="button" onClick={() => goToJobForm('Housekeeper')} className="bg-white p-6 rounded-2xl border border-[#fbf5ff] shadow-[0_4px_20px_rgba(244,235,255,0.6)] hover:shadow-[0_6px_25px_rgba(244,235,255,1)] hover:border-[#f3e5ff] transition-all group flex flex-col items-center text-center">
                <div className="w-24 h-24 mb-4 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-purple-50/50 rounded-full scale-[0.8] group-hover:scale-100 transition-transform"></div>
                  <Shirt className="w-10 h-10 text-purple-500 relative z-10" strokeWidth={1.5} />
                </div>
                <h3 className="text-[14px] font-semibold text-gray-900">Housekeeper</h3>
              </button>

              {/* Card 5: Pet Sitting */}
              <button type="button" onClick={() => goToJobForm('Pet Sitting')} className="bg-white p-6 rounded-2xl border border-[#fbf5ff] shadow-[0_4px_20px_rgba(244,235,255,0.6)] hover:shadow-[0_6px_25px_rgba(244,235,255,1)] hover:border-[#f3e5ff] transition-all group flex flex-col items-center text-center">
                <div className="w-24 h-24 mb-4 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-red-50/50 rounded-full scale-[0.8] group-hover:scale-100 transition-transform"></div>
                  <Dog className="w-10 h-10 text-red-400 relative z-10" strokeWidth={1.5} />
                </div>
                <h3 className="text-[14px] font-semibold text-gray-900">Pet Sitting</h3>
              </button>

              {/* Card 6: Handyman */}
              <button type="button" onClick={() => goToJobForm('Handyman')} className="bg-white p-6 rounded-2xl border border-[#fbf5ff] shadow-[0_4px_20px_rgba(244,235,255,0.6)] hover:shadow-[0_6px_25px_rgba(244,235,255,1)] hover:border-[#f3e5ff] transition-all group flex flex-col items-center text-center">
                <div className="w-24 h-24 mb-4 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-green-50/50 rounded-full scale-[0.8] group-hover:scale-100 transition-transform"></div>
                  <Wrench className="w-10 h-10 text-green-500 relative z-10" strokeWidth={1.5} />
                </div>
                <h3 className="text-[14px] font-semibold text-gray-900">Handyman</h3>
              </button>
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

        {/* 6. About Section — kept deliberately free of registered-company
            details (name, ABN, registration address). Those stay in full on
            the /about page for Apple App Store verification and legal
            requirements; this section is just a friendly teaser + link. */}
        <section className="py-15 px-6 bg-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-6 leading-tight">
              About Aussiemate
            </h2>
            <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
              Aussiemate is a digital service marketplace connecting customers with trusted, verified professionals for cleaning, handyman, pet sitting, and more — making booking services simple, fast, and reliable.
            </p>
            <button
              onClick={() => navigate('/about')}
              className="inline-flex items-center px-6 py-3 rounded-full border border-gray-300 font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
            >
              Learn more about us <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </section>

      </main>
    </div>
  );
};

export default HomePage;

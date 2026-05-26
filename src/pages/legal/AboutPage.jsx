import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Building2, MapPin, Globe, Mail, Layout, ArrowRight, Zap, Lock, Home, Key, Wrench, Dog, Star } from 'lucide-react';
import logo from '../../assets/logo.svg';

const AboutPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#fafbfc] font-sans text-gray-900 flex flex-col">
      {/* 1. Header Navigation */}
      <header className="px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full bg-[#fafbfc] relative">
        <div className="flex items-center z-10">
          <Link to="/" className="flex items-center">
            <img src={logo} alt="Aussiemate" className="h-10 sm:h-12 md:h-14 w-auto" />
          </Link>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-8 font-medium text-gray-600 absolute left-1/2 -translate-x-1/2 z-0">
          <Link to="/" className="hover:text-gray-900 transition-colors">Home</Link>
          <Link to="/about" className="text-gray-900 font-bold transition-colors">About</Link>
          <Link to="/contact" className="hover:text-gray-900 transition-colors">Contact</Link>
        </nav>

        <div className="flex items-center space-x-4 z-10">
          <button 
            onClick={() => navigate('/login')}
            className="px-5 py-2 font-semibold text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors hidden md:block bg-white"
          >
            Log in
          </button>
        
        </div>
      </header>

      <main className="flex-grow px-6">
        
        {/* 2. Hero Section */}
        <section className="max-w-6xl mx-auto mt-12 mb-20 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-[40px] p-10 md:p-16 border border-purple-100/50 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-100/50 text-blue-700 text-sm font-semibold mb-6">
              <Shield className="w-4 h-4 mr-2" />
              Verified Australian business
            </div>
            
            <h1 className="text-2xl md:text-4xl font-semibold text-[#111827] leading-tight mb-4">
              About Aussiemate & <br className="hidden md:block"/>
              PATEL HOUSE PTY LTD
            </h1>
            
            <p className="text-lg text-gray-600 mb-8 max-w-xl">
              A trusted Australian platform connecting customers with verified service professionals across Queensland and beyond.
            </p>
            
            <button className="px-6 py-2.5 bg-transparent border border-gray-300 rounded-xl font-medium text-gray-800 hover:bg-white/50 transition-colors flex items-center">
              <span className="mr-2 text-lg">+</span> Learn More
            </button>
          </div>
        </section>

        {/* 3. Company Profile Section */}
        <section className="max-w-6xl mx-auto mb-16">
          <div className="bg-white rounded-[32px] p-10 md:p-14 border border-gray-100 shadow-sm grid md:grid-cols-2 gap-16 items-start">
            
            {/* Left Content */}
            <div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">WHO WE ARE</p>
              <h2 className="text-3xl font-semibold text-gray-900 mb-6 leading-snug">
                Australia's trusted service marketplace
              </h2>
              
              <div className="space-y-5 text-gray-600 leading-relaxed text-base">
                <p>
                  Built for homeowners, renters, and businesses who need reliable help — fast.
                </p>
                <p>
                  Aussiemate is a digital service marketplace created and operated by PATEL HOUSE PTY LTD, an Australian company based in Geebung, Queensland. We connect customers with trusted service providers across multiple categories including domestic cleaning, commercial cleaning, bond cleaning, handyman services, pet sitting, housekeeping, and general home services.
                </p>
                <p>
                  Our goal is to make booking services simple, transparent, and reliable. We provide a secure platform where customers can find verified service providers, compare quotes, and book with confidence.
                </p>
              </div>
            </div>

            {/* Right Card */}
            <div className="bg-blue-50/60 rounded-[24px] border border-blue-100 relative overflow-hidden">
              <div className="p-8">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#0a1b3f]">PATEL HOUSE PTY LTD</h3>
                    <p className="text-gray-500 text-sm">Australian Registered Company</p>
                  </div>
                </div>
                
                <div className="space-y-0 text-[15px]">
                  <div className="flex justify-between items-center py-4 border-b border-blue-100">
                    <span className="text-gray-400 font-medium">ABN</span>
                    <span className="font-medium text-blue-600">86 687 008 591</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-4 border-b border-blue-100">
                    <span className="text-gray-400 font-medium">Location</span>
                    <span className="font-medium text-blue-600">Geebung, QLD</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-4 border-b border-blue-100">
                    <span className="text-gray-400 font-medium">Country</span>
                    <span className="font-medium text-blue-600">Australia</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-4 border-b border-blue-100">
                    <span className="text-gray-400 font-medium">Email</span>
                    <a href="mailto:support@aussiemate.com.au" className="font-medium text-blue-600 hover:underline">
                      support@aussiemate.com.au
                    </a>
                  </div>

                  <div className="flex justify-between items-center py-4">
                    <span className="text-gray-400 font-medium">Platform</span>
                    <span className="font-bold text-gray-900">Aussiemate</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-100/50 px-8 py-4 flex items-center text-sm font-medium text-gray-600">
                <div className="w-2 h-2 rounded-full bg-blue-500 mr-3"></div>
                Fully owned & operated by PATEL HOUSE PTY LTD
              </div>
            </div>
          </div>
        </section>

        {/* 4. Small Mission Banner */}
        <section className="max-w-6xl mx-auto mb-6">
          <div className="bg-[#eff6ff] rounded-2xl p-6 px-8 border border-blue-100 flex items-center justify-between hover:bg-blue-50 transition-colors cursor-pointer group">
            <div>
              <h3 className="text-blue-900 font-bold text-lg mb-1">Simple. Transparent. Reliable.</h3>
              <p className="text-blue-600 text-sm">Our mission — making service booking effortless for every Australian</p>
            </div>
            <ArrowRight className="text-blue-600 w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </section>

        {/* 5. Our Mission Section */}
        <section className="max-w-6xl mx-auto mb-6">
          <div className="bg-white rounded-[32px] p-10 md:p-14 border border-gray-100 shadow-sm text-center">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">OUR MISSION</p>
            <h2 className="text-3xl md:text-4xl font-semibold text-[#0a1b3f] mb-6">
              Simple. Transparent. Reliable.
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-14 leading-relaxed">
              We believe everyone deserves access to quality home and business services without the hassle of searching, calling around, and hoping for the best. Aussiemate brings everything into one trusted platform.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="border border-gray-100 bg-white rounded-2xl p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col items-center">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-5">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">Fast booking</h3>
                <p className="text-gray-500 text-sm leading-relaxed">Find and book a professional in minutes</p>
              </div>

              <div className="border border-gray-100 bg-white rounded-2xl p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col items-center">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-5">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">Verified pros</h3>
                <p className="text-gray-500 text-sm leading-relaxed">Every provider is verified before joining</p>
              </div>

              <div className="border border-gray-100 bg-white rounded-2xl p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col items-center">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-5">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">Secure platform</h3>
                <p className="text-gray-500 text-sm leading-relaxed">Your data is protected at every step</p>
              </div>
            </div>
          </div>
        </section>



      </main>
    </div>
  );
};

export default AboutPage;

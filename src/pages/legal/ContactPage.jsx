import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, MapPin, Globe, Clock, Send, Clipboard } from 'lucide-react';
import logo from '../../assets/logo.svg';
import { enquiriesAPI } from '../../services/api';

const ContactPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    enquiryType: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await enquiriesAPI.createEnquiry(formData);
      setSubmitSuccess(true);
    } catch (err) {
      console.error('Enquiry submission error:', err);
      setSubmitError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      enquiryType: '',
      message: ''
    });
    setSubmitSuccess(false);
    setSubmitError(null);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 flex flex-col">
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
          <Link to="/contact" className="text-gray-900 font-bold transition-colors">Contact</Link>
        </nav>

        <div className="flex items-center space-x-4 z-10">
          <button
            onClick={() => navigate('/login')}
            className="px-5 py-2 font-semibold text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors hidden md:block"
          >
            Log in
          </button>

        </div>
      </header>

      <main className="flex-grow px-6">
        {/* Hero Section */}
        <section className="max-w-6xl mx-auto mt-12 mb-16 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-[40px] p-10 md:p-16 border border-purple-100/50 relative overflow-hidden flex flex-col items-center text-center">
          <div className="relative z-10">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-100/50 text-blue-700 text-sm font-semibold mb-6 gap-2">
              <Mail className="w-4 h-4" /> Get in touch
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-[#111827] leading-tight mb-4">Contact us</h1>
            <p className="text-lg text-gray-600 max-w-xl mx-auto">
              Questions about bookings, services, or our platform? We're here to help.
            </p>
          </div>
        </section>

        {/* Main Content */}
        <section className="max-w-6xl mx-auto mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Dark Card */}
              <div className="rounded-2xl p-8">
                <p className="text-[#6A8CA7] text-sm font-medium mb-1">Platform operated by</p>
                <h2 className="text-2xl font-bold mb-8">PATEL HOUSE PTY LTD</h2>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-[#6A8CA7] text-sm font-medium mb-1">ABN</p>
                    <p className="text-[#E58B2E] font-semibold">86 687 008 591</p>
                  </div>
                  <div>
                    <p className="text-[#6A8CA7] text-sm font-medium mb-1">Location</p>
                    <p className="text-[#E58B2E] font-semibold">Geebung, QLD</p>
                  </div>
                  <div>
                    <p className="text-[#6A8CA7] text-sm font-medium mb-1">Country</p>
                    <p className="text-[#E58B2E] font-semibold">Australia</p>
                  </div>
                </div>
              </div>

              {/* Contact Details Card */}
              <div className="border border-gray-200 rounded-2xl p-6 bg-white">
                <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <span className="text-[#E58B2E]"><Mail className="w-5 h-5" /></span>
                  Contact details
                </h3>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Email</p>
                      <a href="mailto:support@aussiemate.com.au" className="text-blue-600 hover:underline">
                        support@aussiemate.com.au
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Address</p>
                      <p className="text-gray-900 font-medium">Geebung, QLD, Australia</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Clipboard className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500 font-medium">ABN</p>
                      <p className="text-gray-900 font-medium">86 687 008 591</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Globe className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Platform</p>
                      <p className="text-gray-900 font-medium">aussiemate.com.au</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Alert Box */}
              <div className="bg-[#EBF2FD] border border-[#B8D3F9] rounded-xl p-4 flex items-center gap-3">
                <Clock className="w-6 h-6 text-blue-600 flex-shrink-0" />
                <p className="text-blue-800 font-medium text-sm">
                  We aim to respond to all enquiries within 2–3 business days.
                </p>
              </div>
            </div>

            {/* Right Column: Form / Success state */}
            <div className="border border-gray-200 rounded-2xl p-6 lg:p-10 bg-white">
              {submitSuccess ? (
                <div className="flex flex-col items-center text-center py-8">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-6 border border-emerald-100 shadow-sm animate-bounce">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Message sent successfully!</h2>
                  <p className="text-gray-500 mb-6 max-w-sm">
                    Thank you for reaching out, <span className="font-semibold text-gray-950">{formData.firstName}</span>. 
                    Your enquiry has been received and our team will get back to you shortly at <span className="font-semibold text-gray-950">{formData.email}</span>.
                  </p>

                  <div className="w-full bg-gray-50 border border-gray-150 rounded-xl p-5 text-left mb-8 text-sm space-y-3">
                    <p className="text-gray-500"><span className="font-semibold text-gray-700">Enquiry type:</span> {formData.enquiryType}</p>
                    <p className="text-gray-500 line-clamp-3"><span className="font-semibold text-gray-700">Your message:</span> {formData.message}</p>
                  </div>

                  <button
                    onClick={handleReset}
                    className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg transition-colors shadow-sm text-sm"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Send us a message</h2>
                  <p className="text-gray-500 mb-8">Fill in the form below and our team will get back to you shortly.</p>

                  {submitError && (
                    <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl flex gap-3 text-rose-800 text-sm">
                      <svg className="w-5 h-5 flex-shrink-0 text-rose-500 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <div>
                        <p className="font-semibold">Failed to send message</p>
                        <p className="text-rose-600 mt-0.5">{submitError}</p>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">First name</label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          placeholder="John"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                          disabled={isSubmitting}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Last name</label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          placeholder="Smith"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email address</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="you@email.com"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        disabled={isSubmitting}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone number (optional)</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+61 400 000 000"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Enquiry type</label>
                      <select
                        name="enquiryType"
                        value={formData.enquiryType}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        required
                        disabled={isSubmitting}
                      >
                        <option value="" disabled>Select a topic</option>
                        <option value="General Enquiry">General Enquiry</option>
                        <option value="Support">Support</option>
                        <option value="Billing">Billing</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Tell us how we can help..."
                        rows="4"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        required
                        disabled={isSubmitting}
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`w-full border border-gray-300 text-gray-900 font-semibold py-3 rounded-lg flex justify-center items-center gap-2 transition-colors ${
                        isSubmitting ? 'bg-gray-50 cursor-not-allowed opacity-75' : 'hover:bg-gray-50 cursor-pointer'
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Send message
                        </>
                      )}
                    </button>

                    <p className="text-xs text-center text-gray-500">
                      By submitting, you agree to our <Link to="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</Link> and <Link to="/terms-and-conditions" className="text-blue-600 hover:underline">Terms & Conditions</Link>.
                    </p>
                  </form>
                </>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ContactPage;

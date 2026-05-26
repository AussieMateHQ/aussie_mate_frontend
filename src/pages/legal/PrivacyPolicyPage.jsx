import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageLayout } from '../../components/layout';
import logo from '../../assets/logo.svg';

const PrivacyPolicyPage = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      {/* Header Navigation */}
      <header className="px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full bg-gray-50 relative">
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
            className="px-5 py-2 font-semibold text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors hidden md:block bg-white"
          >
            Log in
          </button>
          <button 
            onClick={() => navigate('/login')}
            className="px-5 py-2 font-semibold text-gray-900 border border-gray-900 rounded-lg hover:bg-gray-900 hover:text-white transition-colors bg-white"
          >
            Get started
          </button>
        </div>
      </header>
      <PageLayout className="py-12 px-4 md:px-8">
        <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString('en-AU')}</p>
          
          <div className="text-gray-700 space-y-8 text-lg">
            <p>
              This Privacy Policy explains how PATEL HOUSE PTY LTD (“we”, “us”, “our”) collects, uses, and protects your information when you use the Aussiemate website and related services.
            </p>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">1. Who we are</h2>
              <p className="mb-4">Aussiemate is a digital platform owned and operated by:</p>
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 inline-block w-full sm:w-auto">
                <p className="font-semibold text-gray-900">PATEL HOUSE PTY LTD</p>
                <p>ABN: 86687008591</p>
                <p>Geebung, QLD, Australia</p>
                <p className="mt-2">
                  Email: <a href="mailto:support@aussiemate.com.au" className="text-primary-600 hover:text-primary-700 transition-colors">support@aussiemate.com.au</a>
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">2. Information we collect</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Personal information (name, email, contact details)</li>
                <li>Usage data (pages visited, device info, browser info)</li>
                <li>Transaction information (if purchases are enabled)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">3. How we use your information</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>To operate and improve our website</li>
                <li>To respond to enquiries</li>
                <li>To process transactions</li>
                <li>To send updates or important notices</li>
                <li>To maintain security and prevent misuse</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">4. Cookies</h2>
              <p>We may use cookies to improve your experience.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">5. Sharing your information</h2>
              <p>
                We do not sell your information.<br/>
                We may share data with service providers or authorities when required by law.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">6. Data security</h2>
              <p>We take reasonable steps to protect your information.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">7. International transfers</h2>
              <p>Your data may be processed on servers outside your region.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">8. Your rights</h2>
              <p>You may request access, correction, or deletion of your personal information.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">9. Third-party links</h2>
              <p>We are not responsible for the privacy practices of third-party websites.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">10. Changes to this policy</h2>
              <p>We may update this policy from time to time.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">11. Contact us</h2>
              <p><a href="mailto:support@aussiemate.com.au" className="text-primary-600 hover:text-primary-700 transition-colors">support@aussiemate.com.au</a></p>
            </section>
          </div>
        </div>
      </PageLayout>
    </div>
  );
};

export default PrivacyPolicyPage;

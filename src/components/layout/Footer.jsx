import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin } from 'lucide-react';
import logo from '../../assets/logo.svg';

const Footer = () => {
  return (
    <footer className="bg-white pt-10 pb-10 font-sans text-gray-500">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          
          {/* Column 1: Logo & Info */}
          <div className="md:col-span-5 lg:col-span-4">
            <Link to="/" className="inline-block mb-6">
              <img src={logo} alt="Aussiemate" className="h-10 sm:h-12 md:h-14 w-auto" />
            </Link>
            <p className="mb-8 leading-relaxed">
              Australia's trusted home & business services platform.<br />
              Operated by PATEL HOUSE PTY LTD.
            </p>
            
            <div className="space-y-3 text-sm">
              <p className="flex items-center">
                <Mail className="w-4 h-4 mr-3 text-gray-400" />
                <a href="mailto:support@aussiemate.com.au" className="hover:text-blue-600 transition-colors">
                  support@aussiemate.com.au
                </a>
              </p>
              <p className="flex items-center">
                <MapPin className="w-4 h-4 mr-3 text-gray-400" />
                Geebung, QLD, Australia
              </p>
            </div>
          </div>

          {/* Spacer */}
          <div className="hidden lg:block lg:col-span-2"></div>

          {/* Column 2: Pages */}
          <div className="md:col-span-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Pages</h4>
            <ul className="space-y-4">
              <li><Link to="/" className="hover:text-blue-600 transition-colors">Home</Link></li>
              <li><Link to="/about" className="hover:text-blue-600 transition-colors">About us</Link></li>
              <li><Link to="/contact" className="hover:text-blue-600 transition-colors">Contact</Link></li>
              <li><Link to="/privacy-policy" className="hover:text-blue-600 transition-colors">Privacy policy</Link></li>
              <li><Link to="/terms-and-conditions" className="hover:text-blue-600 transition-colors">Terms & conditions</Link></li>
            </ul>
          </div>

          {/* Column 3: Services */}
          <div className="md:col-span-4 lg:col-span-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Services</h4>
            <ul className="space-y-4">
              <li><Link to="/services" className="hover:text-blue-600 transition-colors">Domestic cleaning</Link></li>
              <li><Link to="/services" className="hover:text-blue-600 transition-colors">Commercial cleaning</Link></li>
              <li><Link to="/services" className="hover:text-blue-600 transition-colors">Bond cleaning</Link></li>
              <li><Link to="/services" className="hover:text-blue-600 transition-colors">Handyman</Link></li>
              <li><Link to="/services" className="hover:text-blue-600 transition-colors">Pet sitting</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-100 flex flex-col space-y-4 text-sm text-gray-400">
          <p>
            Aussiemate is operated by PATEL HOUSE PTY LTD · ABN: 86687008591 · Geebung, QLD · <a href="mailto:support@aussiemate.com.au" className="hover:text-blue-600 transition-colors">support@aussiemate.com.au</a>
          </p>
          <div className="flex space-x-6">
            <Link to="/privacy-policy" className="hover:text-blue-600 transition-colors">Privacy</Link>
            <Link to="/terms-and-conditions" className="hover:text-blue-600 transition-colors">Terms</Link>
            <Link to="/contact" className="hover:text-blue-600 transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

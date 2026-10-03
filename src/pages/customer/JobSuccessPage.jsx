import React, { useState, useEffect }  from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import { Button, PageHeader } from '../../components';
import JobLiveGif from '../../assets/joblive.gif';
import CardBG6 from '../../assets/CardBG6.png';
import CardBG7 from '../../assets/CardBG7.png';

const APP_STORE_URL = 'https://apps.apple.com/au/app/aussie-mate/id6784121946';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.patelhouseaussiemate';

// Sends the visitor straight to whichever store matches the device they're
// on, instead of a generic page they'd have to search from - iOS to the App
// Store, Android to Google Play, anything else (desktop) falls back to the
// App Store listing.
const getAppDownloadLink = () => {
  const ua = navigator.userAgent || navigator.vendor || '';
  if (/android/i.test(ua)) {
    return PLAY_STORE_URL;
  }
  if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
    return APP_STORE_URL;
  }
  return APP_STORE_URL;
};

const JobSuccessPage = () => {
  const navigate = useNavigate();

  const handleViewMyJob = () => {
    navigate('/my-jobs', { replace: true });
  };

  const handleReturnHome = () => {
    navigate('/customer-dashboard', { replace: true });
  };

  const handleDownloadApp = () => {
    window.open(getAppDownloadLink(), '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 py-6">
        <PageHeader
          title="Job Posted Successfully"
          subtitle="Your job request is live"
          onBack={() => navigate(-1)}
          className="mb-4"
          titleClassName="text-lg font-semibold text-primary-500"
          subtitleClassName="text-sm text-primary-200 font-medium"
        />
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-custom mt-5 relative overflow-hidden">
          {/* Background Image - Left Bottom */}
          <div className="absolute bottom-0 left-0 w-60 h-60">
            <img 
              src={CardBG6} 
              alt="Background" 
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Background Image - Top Right */}
          <div className="absolute top-0 right-0 w-60 h-60 ">
            <img 
              src={CardBG7} 
              alt="Background" 
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Main Content */}
          <div className="relative flex flex-col items-center justify-center text-center z-20">
            {/* Success Message - Text behind (z-0) */}
            <div className="absolute inset-0 flex flex-col justify-center text-center z-0">
              <div className="mb-12 w-full">
                <h1 className="text-3xl sm:text-4xl font-bold text-primary-500 mb-4 text-center">
                  Your job request is live!
                </h1>
                <p className="text-sm text-gray-600 text-center">
                  Nearby cleaners will start sending quotes shortly. You'll be notified.
                </p>
              </div>
            </div>

            {/* Success Animation - GIF above text (z-10) */}
            <div className="relative z-10 mb-12">
              <img 
                src={JobLiveGif} 
                alt="Job Live Animation" 
                className="w-80 h-80 mx-auto object-contain"
              />    
            </div>

            {/* Action Buttons */}
            <div className="relative z-10 w-full flex flex-col items-center justify-center space-x-4 mt-8">
              {/* View My Job Button */}
              <Button
                onClick={handleViewMyJob}
                size="xl"
              >
                View My Job
              </Button>

              {/* Download App Button */}
              <Button
                onClick={handleDownloadApp}
                variant="outline"
                size="xl"
                icon={<Download className="w-5 h-5" />}
                className="mt-3!"
              >
                Download the App
              </Button>

              {/* Return Home Link */}
              <Button
                onClick={handleReturnHome}
                variant="link"
                size="2xl"
                icon={<ArrowLeft className="w-5 h-5" />}
                className="text-black! mt-4!"
              >
                Return Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default JobSuccessPage;

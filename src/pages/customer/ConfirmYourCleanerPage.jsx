import React from 'react';
import { PageLayout } from '../../components/layout';
import { useParams, useNavigate } from 'react-router-dom';

const ConfirmYourCleanerPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="bg-gray-50 min-h-screen">
      <PageLayout className="py-12 px-4 md:px-8">
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Confirm Your Cleaner</h1>
          <p className="text-gray-600 mb-8">
            You are about to confirm the cleaner for Job ID: {jobId}.
          </p>
          <div className="flex justify-center space-x-4">
            <button 
              onClick={() => navigate(-1)}
              className="px-6 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Go Back
            </button>
            <button 
              onClick={() => navigate(`/booking-confirmation/${jobId}`)}
              className="px-6 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
            >
              Confirm Booking
            </button>
          </div>
        </div>
      </PageLayout>
    </div>
  );
};

export default ConfirmYourCleanerPage;

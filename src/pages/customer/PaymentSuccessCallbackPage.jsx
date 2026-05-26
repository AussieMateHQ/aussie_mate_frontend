import React from 'react';
import { PageLayout } from '../../components/layout';
import { useNavigate } from 'react-router-dom';

const PaymentSuccessCallbackPage = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-gray-50 min-h-screen">
      <PageLayout className="py-12 px-4 md:px-8">
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
          <p className="text-gray-600 mb-8">
            Thank you for your payment. Your transaction has been completed successfully.
          </p>
          <button 
            onClick={() => navigate('/customer-dashboard')}
            className="px-6 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </PageLayout>
    </div>
  );
};

export default PaymentSuccessCallbackPage;

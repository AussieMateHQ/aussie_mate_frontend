import React from 'react';
import { PageLayout } from '../../components/layout';

const SetCleanerLocationPage = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <PageLayout className="py-12 px-4 md:px-8">
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Set Your Location</h1>
          <p className="text-gray-600 mb-8">
            Please define your service area to find jobs near you.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Area (Postcode or Suburb)</label>
              <input 
                type="text" 
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-primary-500 focus:border-primary-500"
                placeholder="e.g. Geebung, 4034"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Travel Distance (km)</label>
              <input 
                type="number" 
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-primary-500 focus:border-primary-500"
                placeholder="20"
              />
            </div>
            <div className="pt-4">
              <button className="px-6 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors w-full sm:w-auto">
                Save Location
              </button>
            </div>
          </div>
        </div>
      </PageLayout>
    </div>
  );
};

export default SetCleanerLocationPage;

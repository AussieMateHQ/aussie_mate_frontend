import React, { useState, useEffect, useRef } from 'react';
import arrowDownIcon from '../../assets/down2.svg';
import searchIcon from '../../assets/search.svg';
import ServiceCommonSections from './common/ServiceCommonSections';
import { categoriesAPI } from '../../services/api';

const CleaningJobDetailsForm = ({
  formData,
  onInputChange,
  selectedFiles = [],
  dragActive,
  onFileInputChange,
  onRemoveFile,
  isBondCleaning = false,
  onBondCleaningToggle,
  prefilledCategory
}) => {
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isServiceOpen, setIsServiceOpen] = useState(false);
  const [serviceSearch, setServiceSearch] = useState('');
  const [categories, setCategories] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const categoryRef = useRef(null);
  const serviceRef = useRef(null);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoriesAPI.getCategories();
        if (response.success) {
          setCategories(response.data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch service types when category changes
  useEffect(() => {
    const fetchServiceTypes = async () => {
      if (!formData.categoryId) {
        setServiceTypes([]);
        return;
      }
      
      setIsLoading(true);
      try {
        const response = await categoriesAPI.getServiceTypes(formData.categoryId);
        if (response.success) {
          setServiceTypes(response.data);
        }
      } catch (error) {
        console.error('Error fetching service types:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchServiceTypes();
  }, [formData.categoryId]);



  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target)) setIsCategoryOpen(false);
      if (serviceRef.current && !serviceRef.current.contains(event.target)) setIsServiceOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle prefilled category from dashboard
  useEffect(() => {
    if (prefilledCategory && categories.length > 0 && !formData.categoryId) {
      // Normalize strings by removing special characters and extra spaces
      const normalize = (str) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const normPrefill = normalize(prefilledCategory);

      const found = categories.find((c) => {
        const normName = normalize(c.name);
        // Direct include match
        if (normName.includes(normPrefill) || normPrefill.includes(normName)) return true;
        
        // Specific checks for common categories
        if (normPrefill.includes('bond') && normName.includes('bond')) return true;
        if (normPrefill.includes('commercial') && normName.includes('commercial')) return true;
        if (normPrefill.includes('general') && normName.includes('general')) return true;
        
        return false;
      });
      
      if (found) {
        onInputChange('categoryId', found._id);
        onInputChange('propertyType', found.name);
        
        // If it's bond cleaning, ensure the toggle is on
        const isBond = found.name.toLowerCase().includes('bond');
        if (isBond && !isBondCleaning && onBondCleaningToggle) {
          onBondCleaningToggle();
        }
      }
    }
  }, [categories, prefilledCategory, formData.categoryId, onInputChange, isBondCleaning, onBondCleaningToggle]);

  const getCategoryName = () => {
    const category = categories.find(c => c._id === formData.categoryId);
    return category ? category.name : (formData.propertyType || 'Select Type Of Cleaning');
  };

  const getServiceName = () => {
    const service = serviceTypes.find(s => s._id === formData.serviceTypeId);
    return service ? service.name : (formData.serviceDetail || 'Select Type Of Service');
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Property Details Section */}
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h2 className="text-[20px] font-semibold text-[#111827] mb-1">
            Tell us about your property
          </h2>
          <p className="text-sm sm:text-base text-gray-400 font-medium">
            Add property details to ensure the best cleaning plan for you.
          </p>
        </div>

        {/* Cleaning Category Dropdown */}
        <div className="space-y-2">
          <label className="block text-sm sm:text-base font-medium text-[#111827]">
            Cleaning Category
          </label>
          <div className="relative" ref={categoryRef}>
            <div
              onClick={() => setIsCategoryOpen(!isCategoryOpen)}
              className="flex items-center justify-between w-full px-4 sm:px-6 py-3 sm:py-4 border border-gray-200 rounded-full bg-white cursor-pointer hover:border-blue-400 transition-colors"
            >
              <span className={formData.categoryId ? 'text-[#111827] font-medium' : 'text-gray-400'}>
                {getCategoryName()}
              </span>
              <img
                src={arrowDownIcon}
                alt="Dropdown"
                className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`}
              />
            </div>
            {isCategoryOpen && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 max-h-60 overflow-auto">
                {categories.map((category) => (
                  <div
                    key={category._id}
                    className="px-6 py-3 hover:bg-gray-50 cursor-pointer text-[#111827] text-sm sm:text-base font-medium"
                    onClick={() => {
                      onInputChange('categoryId', category._id);
                      onInputChange('propertyType', category.name); // Keep for compatibility if needed
                      onInputChange('serviceTypeId', ''); // Reset service type
                      onInputChange('serviceDetail', '');
                      setIsCategoryOpen(false);
                    }}
                  >
                    {category.name}
                  </div>
                ))}
                {categories.length === 0 && (
                  <div className="px-6 py-3 text-gray-400 text-sm">Loading categories...</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Type of Service Dropdown */}
        <div className="space-y-2">
          <label className="block text-sm sm:text-base font-medium text-[#111827]">
            Type of Service
          </label>
          <div className="relative" ref={serviceRef}>
            <div
              onClick={() => {
                if (!formData.categoryId) return;
                setIsServiceOpen(!isServiceOpen);
                if (!isServiceOpen) setServiceSearch('');
              }}
              className={`flex items-center justify-between w-full px-4 sm:px-6 py-3 sm:py-4 border border-gray-200 rounded-full bg-white cursor-pointer hover:border-blue-400 transition-colors ${!formData.categoryId ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className={formData.serviceTypeId ? 'text-[#111827] font-medium' : 'text-gray-400'}>
                {getServiceName()}
              </span>
              <img
                src={arrowDownIcon}
                alt="Dropdown"
                className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${isServiceOpen ? 'rotate-180' : ''}`}
              />
            </div>
            {isServiceOpen && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 max-h-80 overflow-hidden flex flex-col">
                <div className="px-4 py-2 border-b border-gray-50">
                  <div className="relative">
                    <img 
                      src={searchIcon} 
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40" 
                      alt="search" 
                    />
                    <input
                      type="text"
                      placeholder="Search service types ..."
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent rounded-2xl text-base focus:outline-none focus:bg-white focus:border-blue-100 transition-all font-medium text-[#111827]"
                      value={serviceSearch}
                      onChange={(e) => setServiceSearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                  </div>
                </div>
                <div className="overflow-auto max-h-60">
                  {isLoading ? (
                    <div className="px-6 py-4 text-gray-400 text-center text-sm font-medium">
                      Loading services...
                    </div>
                  ) : serviceTypes.length === 0 ? (
                    <div className="px-6 py-4 text-gray-400 text-center text-sm font-medium">
                      No services available for this category
                    </div>
                  ) : (
                    <>
                      {serviceTypes
                        .filter(option => option.name.toLowerCase().includes(serviceSearch.toLowerCase()))
                        .map((service) => (
                          <div
                            key={service._id}
                            className="px-6 py-3 hover:bg-gray-50 cursor-pointer text-[#111827] text-sm sm:text-base font-medium"
                            onClick={() => {
                              onInputChange('serviceTypeId', service._id);
                              onInputChange('serviceDetail', service.name); // Keep for compatibility
                              setIsServiceOpen(false);
                              setServiceSearch('');
                            }}
                          >
                            {service.name}
                          </div>
                        ))}
                      {serviceTypes.filter(option => option.name.toLowerCase().includes(serviceSearch.toLowerCase())).length === 0 && (
                        <div className="px-6 py-4 text-gray-400 text-center text-sm">
                          No matching services found
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Static fields have been moved to a new step */}
      </div>

      <ServiceCommonSections
        fileUploadProps={{
          fieldName: 'cleaning-photos',
          title: 'Upload Photos',
          description: 'Optional — add reference photos to help the cleaner prepare.',
          placeholder: dragActive ? 'Drop files here' : 'Select photos to upload',
          onFileSelect: (event) => {
            if (event?.target?.files?.length) {
              onFileInputChange(event);
            }
          },
          selectedFile: selectedFiles?.[0],
          accept: 'image/*',
          multiple: true
        }}
        selectedFiles={selectedFiles}
        onRemoveFile={onRemoveFile}
        instructionsTitle="Task Instructions & Special Requirements"
        instructionsValue={formData.instructions || ''}
        onInstructionsChange={(value) => onInputChange('instructions', value)}
        instructionsPlaceholder="Write your instructions here...."
        fileUploadTitle="Upload Photos/Videos"
        fileUploadSubtitle="(Optional)"
      />
    </div>
  );
};

export default CleaningJobDetailsForm;


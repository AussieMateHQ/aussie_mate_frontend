import ServiceCommonSections from './common/ServiceCommonSections';
import { categoriesAPI } from '../../services/api';
import RadioButton from '../form-controls/RadioButton';
import Checkbox from '../form-controls/Checkbox';
import arrowDownIcon from '../../assets/down2.svg';
import { useEffect, useRef, useState } from 'react';
import { SearchIcon } from 'lucide-react';

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
  const [commercialJobTypes, setCommercialJobTypes] = useState([]);
  const [extraServiceItems, setExtraServiceItems] = useState([]);
  const [isCommercialTypeOpen, setIsCommercialTypeOpen] = useState(false);
  
  const categoryRef = useRef(null);
  const serviceRef = useRef(null);
  const commercialTypeRef = useRef(null);

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

  // Fetch commercial job types if commercial category selected
  useEffect(() => {
    const selectedCategory = categories.find((c) => c._id === formData.categoryId);
    const categoryName = (selectedCategory ? selectedCategory.name : '').toLowerCase();
    if (!categoryName.includes('commercial')) return;

    const fetchCommercialJobTypes = async () => {
      try {
        const response = await categoriesAPI.getCommercialJobTypes();
        if (response.success) {
          setCommercialJobTypes(response.data);
        }
      } catch (error) {
        console.error('Error fetching commercial job types:', error);
      }
    };
    fetchCommercialJobTypes();
  }, [formData.categoryId, categories]);

  // Fetch extra service items if domestic/bond/other category selected
  useEffect(() => {
    const selectedCategory = categories.find((c) => c._id === formData.categoryId);
    const categoryName = (selectedCategory ? selectedCategory.name : '').toLowerCase();
    const isDomesticOrRelated = categoryName.includes('domestic') || 
                                categoryName.includes('general') || 
                                categoryName.includes('bond') || 
                                categoryName.includes('lease') || 
                                categoryName.includes('other');

    const fetchExtraServiceItems = async () => {
      if (!isDomesticOrRelated) return;
      try {
        const response = await categoriesAPI.getExtraServiceItems();
        if (response.success) {
          setExtraServiceItems(response.data);
        }
      } catch (error) {
        console.error('Error fetching extra service items:', error);
      }
    };
    fetchExtraServiceItems();
  }, [formData.categoryId, categories]);



  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target)) setIsCategoryOpen(false);
      if (serviceRef.current && !serviceRef.current.contains(event.target)) setIsServiceOpen(false);
      if (commercialTypeRef.current && !commercialTypeRef.current.contains(event.target)) setIsCommercialTypeOpen(false);
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

  const getCommercialTypeName = () => {
    const type = commercialJobTypes.find(t => t._id === formData.commercialJobTypeId);
    return type ? type.name : 'Select Job Type';
  };

  const selectedCategory = categories.find((c) => c._id === formData.categoryId);
  const categoryName = (selectedCategory ? selectedCategory.name : '').toLowerCase();

  const selectedService = serviceTypes.find(s => s._id === formData.serviceTypeId);
  const serviceName = (selectedService ? selectedService.name : (formData.serviceDetail || '')).toLowerCase();

  const isCommercial = categoryName.includes('commercial');
  const isDomesticOrRelated = categoryName.includes('domestic') || 
                              categoryName.includes('general') || 
                              categoryName.includes('bond') || 
                              categoryName.includes('lease') || 
                              categoryName.includes('other');

  const isPetSittingOrHandyman = serviceName.includes('pet') || 
                                 serviceName.includes('handyman');

  const showRoomsAndBathrooms = isDomesticOrRelated && !isPetSittingOrHandyman;

  const handleNeedCleaningChange = (value) => {
    onInputChange('needCleaning', value);
  };

  const handleExtraServiceToggle = (itemId) => {
    const currentItems = formData.extraServiceItems || [];
    const newItems = currentItems.includes(itemId)
      ? currentItems.filter(id => id !== itemId)
      : [...currentItems, itemId];
    onInputChange('extraServiceItems', newItems);
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
                    <SearchIcon 
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

        {/* Commercial Job Type Dropdown (Conditional) */}
        {isCommercial && (
          <div className="space-y-2">
            <label className="block text-sm sm:text-base font-medium text-[#111827]">
             Type Of Job 
            </label>
            <div className="relative" ref={commercialTypeRef}>
              <div
                onClick={() => setIsCommercialTypeOpen(!isCommercialTypeOpen)}
                className="flex items-center justify-between w-full px-4 sm:px-6 py-3 sm:py-4 border border-gray-200 rounded-full bg-white cursor-pointer hover:border-blue-400 transition-colors"
              >
                <span className={formData.commercialJobTypeId ? 'text-[#111827] font-medium' : 'text-gray-400'}>
                  {getCommercialTypeName()}
                </span>
                <img
                  src={arrowDownIcon}
                  alt="Dropdown"
                  className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${isCommercialTypeOpen ? 'rotate-180' : ''}`}
                />
              </div>
              {isCommercialTypeOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 max-h-60 overflow-auto">
                  {commercialJobTypes.map((type) => (
                    <div
                      key={type._id}
                      className="px-6 py-3 hover:bg-gray-50 cursor-pointer text-[#111827] text-sm sm:text-base font-medium"
                      onClick={() => {
                        onInputChange('commercialJobTypeId', type._id);
                        setIsCommercialTypeOpen(false);
                      }}
                    >
                      {type.name}
                    </div>
                  ))}
                  {commercialJobTypes.length === 0 && (
                    <div className="px-6 py-3 text-gray-400 text-sm italic">No job types found</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Need Cleaning Radio Options (Conditional) */}
        {showRoomsAndBathrooms && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-2">
            <div className="space-y-4">
              <div>
                <h2 className="text-sm sm:text-base font-medium text-[#111827] mb-1">
                  How many rooms need cleaning?
                </h2>
                <p className="text-sm sm:text-base text-gray-500">
                  Select one
                </p>
              </div>
              <div className="space-y-3">
                {['1', '2', '3', '4 or more'].map((option) => (
                  <RadioButton
                    key={`rooms-${option}`}
                    name="roomsNeedCleaning"
                    value={option}
                    label={option}
                    checked={formData.roomsNeedCleaning === option}
                    onChange={(e) => onInputChange('roomsNeedCleaning', e.target.value)}
                    labelClassName="text-[15px] sm:text-base font-medium"
                  />
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h2 className="text-sm sm:text-base font-medium text-[#111827] mb-1">
                  How many bathrooms need cleaning?
                </h2>
                <p className="text-sm sm:text-base text-gray-500">
                  Select one
                </p>
              </div>
              <div className="space-y-3">
                {['1', '2', '3', '4 or more'].map((option) => (
                  <RadioButton
                    key={`bathrooms-${option}`}
                    name="bathroomsNeedCleaning"
                    value={option}
                    label={option}
                    checked={formData.bathroomsNeedCleaning === option}
                    onChange={(e) => onInputChange('bathroomsNeedCleaning', e.target.value)}
                    labelClassName="text-[15px] sm:text-base font-medium"
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Extra Service Items (Conditional) */}
        {showRoomsAndBathrooms && extraServiceItems.length > 0 && (
          <div className="space-y-4 pt-4">
            <label className="block text-[20px] font-semibold text-[#111827]">
              What else needs cleaning?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {extraServiceItems.map((item) => {
                const isSelected = (formData.extraServiceItems || []).includes(item._id);
                return (
                  <div
                    key={item._id}
                    onClick={() => handleExtraServiceToggle(item._id)}
                    className={`flex items-center gap-3 px-6 py-4 cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-primary-500 bg-primary-50' 
                        : 'border-gray-100 hover:border-primary-200 bg-white'
                    }`}
                  >
                    <Checkbox
                      name={`extra-${item._id}`}
                      checked={isSelected}
                      onChange={() => {}} // Toggle handled by parent div
                      label={item.name}
                      labelClassName="font-medium text-[15px] text-[#111827]"
                      className="pointer-events-none" // Parent div handles click
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Conditional Additional Fields (Was Step 2) */}
        <div className="space-y-8 pt-4">
          {/* Commercial Specific Fields */}
          {isCommercial && (
            <div className="space-y-8">
              {/* Do you have plans for this job? */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-sm sm:text-base font-medium text-[#111827] mb-1">
                    Do you have plans for this job?
                  </h2>
                  <p className="text-sm sm:text-base text-gray-500">
                    Select one
                  </p>
                </div>
                <div className="space-y-4">
                {['Yes', 'No', 'Not required', 'Not sure whether I need plans'].map((option) => (
                  <RadioButton
                    key={option}
                    name="hasPlans"
                    value={option}
                    label={option}
                    checked={formData.hasPlans === option}
                    onChange={(e) => onInputChange('hasPlans', e.target.value)}
                  />
                ))}
              </div>
              </div>

              {/* Do you have council approval for this job? */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-sm sm:text-base font-medium text-[#111827] mb-1">
                    Do you have council approval for this job?
                  </h2>
                  <p className="text-sm sm:text-base text-gray-500">
                    Select one
                  </p>
                </div>
                <div className="space-y-4">
                {['Yes', 'No', 'Not required', "Not sure whether it's needed"].map((option) => (
                  <RadioButton
                    key={option}
                    name="hasCouncilApproval"
                    value={option}
                    label={option}
                    checked={formData.hasCouncilApproval === option}
                    onChange={(e) => onInputChange('hasCouncilApproval', e.target.value)}
                  />
                ))}
              </div>
              </div>

              {/* Budget */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-sm sm:text-base font-medium text-[#111827] mb-1">
                    Budget
                  </h2>
                  <p className="text-sm sm:text-base text-gray-400">
                    Select one
                  </p>
                </div>
                <div className="space-y-4">
                {['Under $20,000', '$20,000 - $50,000', '$50,000 - $100,000', 'More than $100,000', 'Not sure'].map((option) => (
                  <RadioButton
                    key={option}
                    name="budget"
                    value={option}
                    label={option}
                    checked={formData.budget === option}
                    onChange={(e) => onInputChange('budget', e.target.value)}
                  />
                ))}
              </div>
              </div>
            </div>
          )}

          {/* What stage is your job at? (Shown for all cleaning) */}
          {(isCommercial || isDomesticOrRelated) && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm sm:text-base font-medium text-[#111827] mb-1">
                  What stage is your job at?
                </h2>
              </div>
              <div className="space-y-4">
              {['Ready to hire', 'Planning & Budgeting'].map((option) => (
                <RadioButton
                  key={option}
                  name="jobStage"
                  value={option}
                  label={option}
                  checked={formData.jobStage === option}
                  onChange={(e) => onInputChange('jobStage', e.target.value)}
                />
              ))}
            </div>
            </div>
          )}
        </div>
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
        instructionsSubtitle="(Optional)"
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


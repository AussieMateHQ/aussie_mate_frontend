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
  const [isPetTypeOpen, setIsPetTypeOpen] = useState(false);
  const [isNumPetsOpen, setIsNumPetsOpen] = useState(false);
  const [isHandymanUrgencyOpen, setIsHandymanUrgencyOpen] = useState(false);
  
  // New states for Commercial Cleaning dropdowns
  const [isCleaningServiceOpen, setIsCleaningServiceOpen] = useState(false);
  const [isFrequencyOpen, setIsFrequencyOpen] = useState(false);
  const [isAreasOpen, setIsAreasOpen] = useState(false);
  const [isTimeOpen, setIsTimeOpen] = useState(false);
  const [isStageOpen, setIsStageOpen] = useState(false);

  const [dynamicPetTypes, setDynamicPetTypes] = useState(['Dog', 'Cat', 'Bird', 'Rabbit', 'Guinea Pig', 'Other']);
  const [dynamicPetNeeds, setDynamicPetNeeds] = useState(['Feeding', 'Walking', 'Medication', 'Playtime', 'Litter cleaning', 'Other']);
  const [dynamicFixingItems, setDynamicFixingItems] = useState(['Door', 'Wall', 'Tap', 'Toilet', 'Shower', 'Light', 'Fan', 'Furniture', 'Cabinet', 'Fence', 'Other']);
  const [dynamicHandymanRequirements, setDynamicHandymanRequirements] = useState(['Materials supplied', 'Materials needed', 'Disposal required', 'Other']);

  // Dynamic states for Commercial Cleaning options
  const [dynamicCleaningTypes, setDynamicCleaningTypes] = useState(['Regular Maintenance Cleaning', 'One‑off General Clean', 'Deep Clean / Sanitisation', 'End‑of‑Lease Clean', 'Post‑Construction / Builders Clean', 'Carpet Steam Cleaning', 'Window Cleaning', 'Pressure Cleaning', 'Other']);
  const [dynamicFrequencies, setDynamicFrequencies] = useState(['One‑off', 'Weekly', 'Fortnightly', 'Monthly', 'Other']);
  const [dynamicAreas, setDynamicAreas] = useState(['Offices', 'Workstations', 'Meeting Rooms', 'Kitchens', 'Bathrooms', 'Toilets', 'Common Areas', 'Reception', 'Hallways', 'Carpets', 'Windows', 'Outdoor Areas', 'Other']);
  const [dynamicTimes, setDynamicTimes] = useState(['During business hours', 'After hours', 'Early morning', 'Night shift', 'Other']);
  const [dynamicStages, setDynamicStages] = useState(['Ready to hire', 'Planning & Budgeting']);

  const categoryRef = useRef(null);
  const serviceRef = useRef(null);
  const commercialTypeRef = useRef(null);
  const petTypeRef = useRef(null);
  const numPetsRef = useRef(null);
  const handymanUrgencyRef = useRef(null);

  // New refs for Commercial Cleaning dropdowns
  const cleaningServiceRef = useRef(null);
  const frequencyRef = useRef(null);
  const areasRef = useRef(null);
  const timeRef = useRef(null);
  const stageRef = useRef(null);

  const formatServiceAsProperty = (serviceName) => {
    let name = serviceName;
    name = name.replace(/\s+clean(ing)?$/i, '');
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  const handleCommercialPropertySelect = (service) => {
    const propertyLabel = formatServiceAsProperty(service.name);
    onInputChange('propertyType', propertyLabel);
    onInputChange('serviceTypeId', service._id);
    onInputChange('serviceDetail', service.name);
    setIsServiceOpen(false);
  };

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

  // Fetch pet settings if pet sitting category selected
  useEffect(() => {
    const selectedCategory = categories.find((c) => c._id === formData.categoryId);
    const categoryName = (selectedCategory ? selectedCategory.name : '').toLowerCase();
    if (!categoryName.includes('pet')) return;

    const fetchPetSettings = async () => {
      try {
        const response = await categoriesAPI.getPetSettings();
        if (response.success && response.data) {
          if (response.data.petTypes) setDynamicPetTypes(response.data.petTypes);
          if (response.data.petNeeds) setDynamicPetNeeds(response.data.petNeeds);
        }
      } catch (error) {
        console.error('Error fetching pet settings:', error);
      }
    };
    fetchPetSettings();
  }, [formData.categoryId, categories]);

  // Fetch handyman settings if handyman category selected
  useEffect(() => {
    const selectedCategory = categories.find((c) => c._id === formData.categoryId);
    const categoryName = (selectedCategory ? selectedCategory.name : '').toLowerCase();
    if (!categoryName.includes('handyman')) return;

    const fetchHandymanSettings = async () => {
      try {
        const response = await categoriesAPI.getHandymanSettings();
        if (response.success && response.data) {
          if (response.data.fixingItems) setDynamicFixingItems(response.data.fixingItems);
          if (response.data.handymanRequirements) setDynamicHandymanRequirements(response.data.handymanRequirements);
        }
      } catch (error) {
        console.error('Error fetching handyman settings:', error);
      }
    };
    fetchHandymanSettings();
  }, [formData.categoryId, categories]);

  // Fetch commercial settings if commercial category selected
  useEffect(() => {
    const selectedCategory = categories.find((c) => c._id === formData.categoryId);
    const categoryName = (selectedCategory ? selectedCategory.name : '').toLowerCase();
    if (!categoryName.includes('commercial')) return;

    const fetchCommercialSettings = async () => {
      try {
        const response = await categoriesAPI.getCommercialSettings();
        if (response.success && response.data) {
          if (response.data.cleaningTypes) setDynamicCleaningTypes(response.data.cleaningTypes);
          if (response.data.frequencies) setDynamicFrequencies(response.data.frequencies);
          if (response.data.areas) setDynamicAreas(response.data.areas);
          if (response.data.times) setDynamicTimes(response.data.times);
          if (response.data.stages) setDynamicStages(response.data.stages);
        }
      } catch (error) {
        console.error('Error fetching commercial settings:', error);
      }
    };
    fetchCommercialSettings();
  }, [formData.categoryId, categories]);



  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target)) setIsCategoryOpen(false);
      if (serviceRef.current && !serviceRef.current.contains(event.target)) setIsServiceOpen(false);
      if (commercialTypeRef.current && !commercialTypeRef.current.contains(event.target)) setIsCommercialTypeOpen(false);
      if (petTypeRef.current && !petTypeRef.current.contains(event.target)) setIsPetTypeOpen(false);
      if (numPetsRef.current && !numPetsRef.current.contains(event.target)) setIsNumPetsOpen(false);
      if (handymanUrgencyRef.current && !handymanUrgencyRef.current.contains(event.target)) setIsHandymanUrgencyOpen(false);
      if (cleaningServiceRef.current && !cleaningServiceRef.current.contains(event.target)) setIsCleaningServiceOpen(false);
      if (frequencyRef.current && !frequencyRef.current.contains(event.target)) setIsFrequencyOpen(false);
      if (areasRef.current && !areasRef.current.contains(event.target)) setIsAreasOpen(false);
      if (timeRef.current && !timeRef.current.contains(event.target)) setIsTimeOpen(false);
      if (stageRef.current && !stageRef.current.contains(event.target)) setIsStageOpen(false);
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
        if ((normPrefill.includes('housekeeping') || normPrefill.includes('housekeeper')) &&
            (normName.includes('housekeeping') || normName.includes('housekeeper'))) return true;
        if (normPrefill.includes('pet') && normName.includes('pet')) return true;
        if (normPrefill.includes('handyman') && normName.includes('handyman')) return true;

        return false;
      });

      if (found) {
        onInputChange('categoryId', found._id);
        const isComm = found.name.toLowerCase().includes('commercial');
        onInputChange('propertyType', isComm ? '' : found.name);
        onInputChange('categoryName', found.name);

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
  const isPetSitting = categoryName.includes('pet');
  const isHandyman = categoryName.includes('handyman');
  const isDomesticOrRelated = categoryName.includes('domestic') ||
    categoryName.includes('general') ||
    categoryName.includes('bond') ||
    categoryName.includes('lease') ||
    categoryName.includes('housekeeper') ||
    categoryName.includes('other');

  const showRoomsAndBathrooms = isDomesticOrRelated && !isPetSitting && !isHandyman;

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
            {isPetSitting ? "Tell us about your pet" : isHandyman ? "Tell us about your job" : "Tell us about your property"}
          </h2>
          <p className="text-sm sm:text-base text-gray-400 font-medium">
            {isPetSitting ? "Add details to ensure the best pet care plan for you." : isHandyman ? "Add details to ensure the best handyman plan for you." : "Add property details to ensure the best cleaning plan for you."}
          </p>
        </div>

        {/* Cleaning Category Dropdown */}
        <div className="space-y-2">
          <label className="block text-sm sm:text-base font-medium text-[#111827]">
            Service Category
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
                      const isComm = category.name.toLowerCase().includes('commercial');
                      onInputChange('propertyType', isComm ? '' : category.name);
                      onInputChange('categoryName', category.name);
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
            {isCommercial ? 'What type of property?' : 'Type of Service'}
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
              <span className={(isCommercial ? formData.propertyType : formData.serviceTypeId) ? 'text-[#111827] font-medium' : 'text-gray-400'}>
                {isCommercial ? (formData.propertyType || 'Select property type') : getServiceName()}
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
                      {isCommercial ? (
                        serviceTypes
                          .filter(service => formatServiceAsProperty(service.name).toLowerCase().includes(serviceSearch.toLowerCase()))
                          .map((service) => (
                            <div
                              key={service._id}
                              className="px-6 py-3 hover:bg-gray-50 cursor-pointer text-[#111827] text-sm sm:text-base font-medium"
                              onClick={() => {
                                handleCommercialPropertySelect(service);
                              }}
                            >
                              {formatServiceAsProperty(service.name)}
                            </div>
                          ))
                      ) : (
                        serviceTypes
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
                          ))
                      )}
                      {!isCommercial && serviceTypes.filter(option => option.name.toLowerCase().includes(serviceSearch.toLowerCase())).length === 0 && (
                        <div className="px-6 py-4 text-gray-400 text-center text-sm">
                          No matching services found
                        </div>
                      )}
                      {isCommercial && serviceTypes.filter(service => formatServiceAsProperty(service.name).toLowerCase().includes(serviceSearch.toLowerCase())).length === 0 && (
                        <div className="px-6 py-4 text-gray-400 text-center text-sm">
                          No matching property types found
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pet Sitting Fields (Conditional) */}
        {isPetSitting && (
          <div className="space-y-4 sm:space-y-6">
            {/* What type of pet do you have? */}
            <div className="space-y-2">
              <label className="block text-sm sm:text-base font-medium text-[#111827]">
                What type of pet do you have?
              </label>
              <div className="relative" ref={petTypeRef}>
                <div
                  onClick={() => setIsPetTypeOpen(!isPetTypeOpen)}
                  className="flex items-center justify-between w-full px-4 sm:px-6 py-3 sm:py-4 border border-gray-200 rounded-full bg-white cursor-pointer hover:border-blue-400 transition-colors"
                >
                  <span className={formData.petType ? 'text-[#111827] font-medium' : 'text-gray-400'}>
                    {formData.petType || 'Select pet type'}
                  </span>
                  <img
                    src={arrowDownIcon}
                    alt="Dropdown"
                    className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${isPetTypeOpen ? 'rotate-180' : ''}`}
                  />
                </div>
                {isPetTypeOpen && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 max-h-60 overflow-auto">
                    {dynamicPetTypes.map((type) => {
                      const currentSelected = formData.petType
                        ? formData.petType.split(',').map(s => s.trim()).filter(Boolean)
                        : [];
                      const isSelected = currentSelected.includes(type);
                      return (
                        <div
                          key={type}
                          className="px-6 py-3 hover:bg-gray-50 cursor-pointer text-[#111827] text-sm sm:text-base font-medium flex items-center justify-between"
                          onClick={(e) => {
                            e.stopPropagation();
                            const nextSelected = isSelected
                              ? currentSelected.filter(x => x !== type)
                              : [...currentSelected, type];
                            onInputChange('petType', nextSelected.join(', '));
                          }}
                        >
                          <span>{type}</span>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* How many pets need care? */}
            <div className="space-y-2">
              <label className="block text-sm sm:text-base font-medium text-[#111827]">
                How many pets need care?
              </label>
              <div className="relative" ref={numPetsRef}>
                <div
                  onClick={() => setIsNumPetsOpen(!isNumPetsOpen)}
                  className="flex items-center justify-between w-full px-4 sm:px-6 py-3 sm:py-4 border border-gray-200 rounded-full bg-white cursor-pointer hover:border-blue-400 transition-colors"
                >
                  <span className={formData.numberOfPets ? 'text-[#111827] font-medium' : 'text-gray-400'}>
                    {formData.numberOfPets === '4 or more' ? '4+' : (formData.numberOfPets || 'Select number of pets')}
                  </span>
                  <img
                    src={arrowDownIcon}
                    alt="Dropdown"
                    className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${isNumPetsOpen ? 'rotate-180' : ''}`}
                  />
                </div>
                {isNumPetsOpen && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 max-h-60 overflow-auto">
                    {['1', '2', '3', '4 or more'].map((num) => (
                      <div
                        key={num}
                        className="px-6 py-3 hover:bg-gray-50 cursor-pointer text-[#111827] text-sm sm:text-base font-medium"
                        onClick={() => {
                          onInputChange('numberOfPets', num);
                          setIsNumPetsOpen(false);
                        }}
                      >
                        {num === '4 or more' ? '4+' : num}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* What else does your pet need? */}
            <div className="space-y-4 pt-2">
              <label className="block text-sm sm:text-base font-semibold text-[#111827]">
                What else does your pet need?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {dynamicPetNeeds.map((item) => {
                  const isSelected = (formData.petNeeds || []).includes(item);
                  return (
                    <div
                      key={item}
                      onClick={() => {
                        const current = formData.petNeeds || [];
                        const next = current.includes(item)
                          ? current.filter(x => x !== item)
                          : [...current, item];
                        onInputChange('petNeeds', next);
                      }}
                      className={`flex items-center gap-3 px-6 py-4 cursor-pointer transition-all border rounded-2xl ${isSelected
                          ? 'border-[#1A73E8] bg-[#E8F0FE]'
                          : 'border-gray-100 hover:border-primary-200 bg-white'
                        }`}
                    >
                      <Checkbox
                        name={`petNeeds-${item}`}
                        checked={isSelected}
                        onChange={() => { }} // Handled by parent div
                        label={item}
                        labelClassName="font-medium text-[15px] text-[#111827]"
                        className="pointer-events-none"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Handyman Fields (Conditional) */}
        {isHandyman && (
          <div className="space-y-4 sm:space-y-6">
            {/* What needs fixing or installing? */}
            <div className="space-y-4">
              <label className="block text-sm sm:text-base font-semibold text-[#111827]">
                What needs fixing or installing?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {dynamicFixingItems.map((item) => {
                  const isSelected = (formData.fixingItems || []).includes(item);
                  return (
                    <div
                      key={item}
                      onClick={() => {
                        const current = formData.fixingItems || [];
                        const next = current.includes(item)
                          ? current.filter(x => x !== item)
                          : [...current, item];
                        onInputChange('fixingItems', next);
                      }}
                      className={`flex items-center gap-3 px-6 py-4 cursor-pointer transition-all border rounded-2xl ${isSelected
                          ? 'border-[#1A73E8] bg-[#E8F0FE]'
                          : 'border-gray-100 hover:border-primary-200 bg-white'
                        }`}
                    >
                      <Checkbox
                        name={`fixing-${item}`}
                        checked={isSelected}
                        onChange={() => { }} // Handled by parent div
                        label={item}
                        labelClassName="font-medium text-[15px] text-[#111827]"
                        className="pointer-events-none"
                      />
                    </div>
                  );
                })}
              </div>
            </div>



            {/* What else is required? */}
            <div className="space-y-4 pt-2">
              <label className="block text-sm sm:text-base font-semibold text-[#111827]">
                What else is required?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {dynamicHandymanRequirements.map((item) => {
                  const isSelected = (formData.handymanRequirements || []).includes(item);
                  return (
                    <div
                      key={item}
                      onClick={() => {
                        const current = formData.handymanRequirements || [];
                        const next = current.includes(item)
                          ? current.filter(x => x !== item)
                          : [...current, item];
                        onInputChange('handymanRequirements', next);
                      }}
                      className={`flex items-center gap-3 px-6 py-4 cursor-pointer transition-all border rounded-2xl ${isSelected
                          ? 'border-[#1A73E8] bg-[#E8F0FE]'
                          : 'border-gray-100 hover:border-primary-200 bg-white'
                        }`}
                    >
                      <Checkbox
                        name={`req-${item}`}
                        checked={isSelected}
                        onChange={() => { }} // Handled by parent div
                        label={item}
                        labelClassName="font-medium text-[15px] text-[#111827]"
                        className="pointer-events-none"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

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
                    className={`flex items-center gap-3 px-6 py-4 cursor-pointer transition-all ${isSelected
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-100 hover:border-primary-200 bg-white'
                      }`}
                  >
                    <Checkbox
                      name={`extra-${item._id}`}
                      checked={isSelected}
                      onChange={() => { }} // Toggle handled by parent div
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
            <div className="space-y-6">
              {/* What type of cleaning service? */}
              <div className="space-y-2">
                <label className="block text-sm sm:text-base font-medium text-[#111827]">
                  What type of cleaning service?
                </label>
                <div className="relative" ref={cleaningServiceRef}>
                  <div
                    onClick={() => setIsCleaningServiceOpen(!isCleaningServiceOpen)}
                    className="flex items-center justify-between w-full px-4 sm:px-6 py-3 sm:py-4 border border-gray-200 rounded-full bg-white cursor-pointer hover:border-blue-400 transition-colors"
                  >
                    <span className={formData.commercialCleaningType ? 'text-[#111827] font-medium' : 'text-gray-400'}>
                      {formData.commercialCleaningType || 'Select type of cleaning service'}
                    </span>
                    <img
                      src={arrowDownIcon}
                      alt="Dropdown"
                      className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${isCleaningServiceOpen ? 'rotate-180' : ''}`}
                    />
                  </div>
                  {isCleaningServiceOpen && (
                    <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 max-h-60 overflow-auto">
                      {dynamicCleaningTypes.map((option) => (
                        <div
                          key={option}
                          className="px-6 py-3 hover:bg-gray-50 cursor-pointer text-[#111827] text-sm sm:text-base font-medium"
                          onClick={() => {
                            onInputChange('commercialCleaningType', option);
                            setIsCleaningServiceOpen(false);
                          }}
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* How often do you need cleaning? */}
              <div className="space-y-2">
                <label className="block text-sm sm:text-base font-medium text-[#111827]">
                  How often do you need cleaning?
                </label>
                <div className="relative" ref={frequencyRef}>
                  <div
                    onClick={() => setIsFrequencyOpen(!isFrequencyOpen)}
                    className="flex items-center justify-between w-full px-4 sm:px-6 py-3 sm:py-4 border border-gray-200 rounded-full bg-white cursor-pointer hover:border-blue-400 transition-colors"
                  >
                    <span className={formData.frequency ? 'text-[#111827] font-medium' : 'text-gray-400'}>
                      {formData.frequency || 'Select frequency'}
                    </span>
                    <img
                      src={arrowDownIcon}
                      alt="Dropdown"
                      className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${isFrequencyOpen ? 'rotate-180' : ''}`}
                    />
                  </div>
                  {isFrequencyOpen && (
                    <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 max-h-60 overflow-auto">
                      {dynamicFrequencies.map((option) => (
                        <div
                          key={option}
                          className="px-6 py-3 hover:bg-gray-50 cursor-pointer text-[#111827] text-sm sm:text-base font-medium"
                          onClick={() => {
                            onInputChange('frequency', option);
                            setIsFrequencyOpen(false);
                          }}
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* What areas need cleaning? */}
              <div className="space-y-2">
                <label className="block text-sm sm:text-base font-medium text-[#111827]">
                  What areas need cleaning?
                </label>
                <div className="relative" ref={areasRef}>
                  <div
                    onClick={() => setIsAreasOpen(!isAreasOpen)}
                    className="flex items-center justify-between w-full px-4 sm:px-6 py-3 sm:py-4 border border-gray-200 rounded-full bg-white cursor-pointer hover:border-blue-400 transition-colors"
                  >
                    <span className={(formData.areasNeedCleaning && formData.areasNeedCleaning.length > 0) ? 'text-[#111827] font-medium truncate pr-4' : 'text-gray-400'}>
                      {(formData.areasNeedCleaning && formData.areasNeedCleaning.length > 0)
                        ? formData.areasNeedCleaning.join(', ')
                        : 'Select areas'}
                    </span>
                    <img
                      src={arrowDownIcon}
                      alt="Dropdown"
                      className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${isAreasOpen ? 'rotate-180' : ''}`}
                    />
                  </div>
                  {isAreasOpen && (
                    <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 max-h-60 overflow-auto">
                      {dynamicAreas.map((area) => {
                        const currentSelected = formData.areasNeedCleaning || [];
                        const isSelected = currentSelected.includes(area);
                        return (
                          <div
                            key={area}
                            className="px-6 py-3 hover:bg-gray-50 cursor-pointer text-[#111827] text-sm sm:text-base font-medium flex items-center justify-between"
                            onClick={(e) => {
                              e.stopPropagation();
                              const nextSelected = isSelected
                                ? currentSelected.filter(x => x !== area)
                                : [...currentSelected, area];
                              onInputChange('areasNeedCleaning', nextSelected);
                            }}
                          >
                            <span>{area}</span>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              readOnly
                              className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Preferred cleaning time (optional) */}
              <div className="space-y-2">
                <label className="block text-sm sm:text-base font-medium text-[#111827]">
                  Preferred cleaning time (optional)
                </label>
                <div className="relative" ref={timeRef}>
                  <div
                    onClick={() => setIsTimeOpen(!isTimeOpen)}
                    className="flex items-center justify-between w-full px-4 sm:px-6 py-3 sm:py-4 border border-gray-200 rounded-full bg-white cursor-pointer hover:border-blue-400 transition-colors"
                  >
                    <span className={formData.preferredCleaningTime ? 'text-[#111827] font-medium' : 'text-gray-400'}>
                      {formData.preferredCleaningTime || 'Select preferred cleaning time'}
                    </span>
                    <img
                      src={arrowDownIcon}
                      alt="Dropdown"
                      className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${isTimeOpen ? 'rotate-180' : ''}`}
                    />
                  </div>
                  {isTimeOpen && (
                    <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 max-h-60 overflow-auto">
                      {dynamicTimes.map((option) => (
                        <div
                          key={option}
                          className="px-6 py-3 hover:bg-gray-50 cursor-pointer text-[#111827] text-sm sm:text-base font-medium"
                          onClick={() => {
                            onInputChange('preferredCleaningTime', option);
                            setIsTimeOpen(false);
                          }}
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* What stage is your job at? */}
              <div className="space-y-2">
                <label className="block text-sm sm:text-base font-medium text-[#111827]">
                  What stage is your job at?
                </label>
                <div className="relative" ref={stageRef}>
                  <div
                    onClick={() => setIsStageOpen(!isStageOpen)}
                    className="flex items-center justify-between w-full px-4 sm:px-6 py-3 sm:py-4 border border-gray-200 rounded-full bg-white cursor-pointer hover:border-blue-400 transition-colors"
                  >
                    <span className={formData.jobStage ? 'text-[#111827] font-medium' : 'text-gray-400'}>
                      {formData.jobStage || 'Select stage'}
                    </span>
                    <img
                      src={arrowDownIcon}
                      alt="Dropdown"
                      className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${isStageOpen ? 'rotate-180' : ''}`}
                    />
                  </div>
                  {isStageOpen && (
                    <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 max-h-60 overflow-auto">
                      {dynamicStages.map((option) => (
                        <div
                          key={option}
                          className="px-6 py-3 hover:bg-gray-50 cursor-pointer text-[#111827] text-sm sm:text-base font-medium"
                          onClick={() => {
                            onInputChange('jobStage', option);
                            setIsStageOpen(false);
                          }}
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* What stage is your job at? */}
          {(!isCommercial && (isCommercial || isDomesticOrRelated || isPetSitting || isHandyman)) && (
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


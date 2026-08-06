import React, { useMemo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  X,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  MapPin,
  Info,
  Sparkles,
  PawPrint,
  Wrench,
  HelpingHand,
  Home,
  Droplets,
} from 'lucide-react';

const JobOverviewCard = ({
  jobId,
  title,
  propertyType,
  quoteCount = 0,
  showQuotePill = true,
  serviceType,
  serviceDetail,
  instructions,
  scheduledDate,
  frequency,
  location,
  photos = [],
  onPhotoClick,
  viewerRole = 'customer',
  metaInfo = [],
  roleSections = {},
  serviceTypeId,
  roomsNeedCleaning,
  bathroomsNeedCleaning,
  extraServiceItems = [],
  petType,
  numberOfPets,
  petNeeds = [],
  fixingItems = [],
  handymanUrgency,
  handymanRequirements = [],
}) => {
  const [activePhotoIndex, setActivePhotoIndex] = useState(null);

  const isPhotoModalOpen = activePhotoIndex !== null && photos && photos.length > 0;

  useEffect(() => {
    if (!isPhotoModalOpen) {
      document.body.style.overflow = '';
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow || '';
    };
  }, [isPhotoModalOpen]);

  const openPhotoModal = (index) => {
    setActivePhotoIndex(index);
    if (typeof onPhotoClick === 'function') {
      onPhotoClick(index);
    }
  };

  const closePhotoModal = () => {
    setActivePhotoIndex(null);
  };

  const showPrevPhoto = () => {
    setActivePhotoIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
  };

  const showNextPhoto = () => {
    setActivePhotoIndex((prev) =>
      prev !== null && photos && prev < photos.length - 1 ? prev + 1 : prev
    );
  };
  const serviceTypeIcon = useMemo(() => {
    if (!serviceType) return null;

    const normalized = serviceType.toLowerCase().replace(/\s+/g, '');

    const mapping = {
      cleaning: <Sparkles className="w-3.5 h-3.5 text-primary-300" strokeWidth={2} />,
      residentialcleaning: <Sparkles className="w-3.5 h-3.5 text-primary-300" strokeWidth={2} />,
      commercialcleaning: <Droplets className="w-3.5 h-3.5 text-primary-300" strokeWidth={2} />,
      handyman: <Wrench className="w-3.5 h-3.5 text-primary-300" strokeWidth={2} />,
      housekeeping: <Home className="w-3.5 h-3.5 text-primary-300" strokeWidth={2} />,
      ndissupport: <HelpingHand className="w-3.5 h-3.5 text-primary-300" strokeWidth={2} />,
      ndissupportworker: <HelpingHand className="w-3.5 h-3.5 text-primary-300" strokeWidth={2} />,
      supportservices: <HelpingHand className="w-3.5 h-3.5 text-primary-300" strokeWidth={2} />,
      petsitting: <PawPrint className="w-3.5 h-3.5 text-primary-300" strokeWidth={2} />,
    };

    return mapping[normalized] || <Info className="w-3.5 h-3.5 text-primary-300" strokeWidth={2} />;
  }, [serviceType]);

  const serviceTheme = {
    badgeBg: 'bg-[#F1F6FF]',
    badgeBorder: 'border-[#E0EAFF]',
    badgeText: 'text-primary-500',
    sectionBg: 'bg-[#F8FAFF]',
    sectionBorder: 'border-[#E2E8FF]',
  };

  const roleSection = roleSections?.[viewerRole];

  const { roleItems, roleTitle } = useMemo(() => {
    if (!roleSection) {
      return { roleItems: [], roleTitle: '' };
    }

    if (Array.isArray(roleSection)) {
      return {
        roleItems: roleSection,
        roleTitle: '',
      };
    }

    return {
      roleItems: Array.isArray(roleSection.items) ? roleSection.items : [],
      roleTitle: roleSection.title || '',
    };
  }, [roleSection]);

  const handlePhotoClick = (index = 0) => {
    if (typeof onPhotoClick === 'function') {
      onPhotoClick(index);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-custom p-3 sm:p-4 md:p-6">
      <div className="space-y-5">
        {/* Top Section: Pill and Property Type */}
        <div className="space-y-2">
          {showQuotePill && Number.isFinite(quoteCount) && quoteCount >= 0 && (
            <div className="inline-flex items-center gap-2 bg-[#E0F2FE] text-[#0088FF] px-4 py-1.5 rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-[#0088FF] rounded-full"></span>
              {quoteCount} {quoteCount === 1 ? 'Quote' : 'Quotes'} Received
            </div>
          )}

          {propertyType && (
            <p className="text-sm sm:text-base font-semibold text-[#6B7280] capitalize">
              {propertyType}
            </p>
          )}

          {(serviceTypeId?.name || title) && (
            <h2 className="text-[20px] font-semibold text-[#111827] leading-tight capitalize">
              {serviceTypeId?.name || (title === "Petsitting " ? "Pet Sitting" : title)}
            </h2>
          )}

          {instructions && (
            <p className="text-sm text-[#6B7280] font-medium leading-relaxed">
              {instructions}
            </p>
          )}
        </div>

        {/* Schedule and Location */}
        <div className="space-y-1">
          {scheduledDate && (
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-primary-500 flex-shrink-0" strokeWidth={2.2} />
              <div className="text-base text-primary-200 font-medium">
                {scheduledDate}
              </div>
            </div>
          )}

          {location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary-500 flex-shrink-0" strokeWidth={2.2} />
              <div className="text-base text-primary-200 font-medium leading-snug">
                {location}
              </div>
            </div>
          )}
        </div>

        {(roomsNeedCleaning || bathroomsNeedCleaning || (extraServiceItems && extraServiceItems.length > 0)) && (
          <div className="space-y-3 pt-1">
            {(roomsNeedCleaning || bathroomsNeedCleaning) && (
              <div className="flex flex-wrap gap-2">
                {roomsNeedCleaning && (
                  <div className="inline-flex items-center gap-1.5 bg-[#F3F4F6] border border-[#E5E7EB] px-3 py-1.5 rounded-full text-xs font-semibold text-gray-700">
                    <span className="text-[#1A73E8]">🛏️</span> {roomsNeedCleaning} Room{roomsNeedCleaning !== '1' ? 's' : ''}
                  </div>
                )}
                {bathroomsNeedCleaning && (
                  <div className="inline-flex items-center gap-1.5 bg-[#F3F4F6] border border-[#E5E7EB] px-3 py-1.5 rounded-full text-xs font-semibold text-gray-700">
                    <span className="text-[#1A73E8]">🚿</span> {bathroomsNeedCleaning} Bathroom{bathroomsNeedCleaning !== '1' ? 's' : ''}
                  </div>
                )}
              </div>
            )}

            {extraServiceItems && extraServiceItems.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Extra Services</h4>
                <div className="flex flex-wrap gap-2">
                  {extraServiceItems.map((item, idx) => (
                    <span key={item._id || idx} className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full text-xs font-semibold text-blue-700">
                      ✨ {item.name || item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {(petType || numberOfPets || (petNeeds && petNeeds.length > 0)) && (
          <div className="space-y-3 pt-1">
            {(petType || numberOfPets) && (
              <div className="flex flex-wrap gap-2">
                {petType && (
                  <div className="inline-flex items-center gap-1.5 bg-[#F3F4F6] border border-[#E5E7EB] px-3 py-1.5 rounded-full text-xs font-semibold text-gray-700">
                    <span className="text-[#1A73E8]">🐾</span> Pet: {petType}
                  </div>
                )}
                {numberOfPets && (
                  <div className="inline-flex items-center gap-1.5 bg-[#F3F4F6] border border-[#E5E7EB] px-3 py-1.5 rounded-full text-xs font-semibold text-gray-700">
                    <span className="text-[#1A73E8]">🔢</span> Count: {numberOfPets}
                  </div>
                )}
              </div>
            )}

            {petNeeds && petNeeds.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Pet Needs</h4>
                <div className="flex flex-wrap gap-2">
                  {petNeeds.map((item, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full text-xs font-semibold text-blue-700">
                      ✨ {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {((fixingItems && fixingItems.length > 0) || (handymanRequirements && handymanRequirements.length > 0)) && (
          <div className="space-y-3 pt-1">

            {fixingItems && fixingItems.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Fixing/Installing</h4>
                <div className="flex flex-wrap gap-2">
                  {fixingItems.map((item, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full text-xs font-semibold text-blue-700">
                      🔨 {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {handymanRequirements && handymanRequirements.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Requirements</h4>
                <div className="flex flex-wrap gap-2">
                  {handymanRequirements.map((item, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full text-xs font-semibold text-blue-700">
                      📋 {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {roleItems.length > 0 && (
          <div className="space-y-2">
            {roleTitle && (
              <h4 className="text-xs sm:text-sm text-primary-300 font-semibold uppercase tracking-wide">
                {roleTitle}
              </h4>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              {roleItems.map((item, index) => {
                if (!item || !item.value) return null;
                return (
                  <div
                    key={`${item.label || 'role-info'}-${index}`}
                    className={`p-3 rounded-xl border ${serviceTheme.sectionBg} ${serviceTheme.sectionBorder}`}
                  >
                    {item.label && (
                      <div className="text-[11px] uppercase text-primary-300 font-semibold tracking-wide mb-1">
                        {item.label}
                      </div>
                    )}
                    <div className="text-sm text-primary-500 font-medium">
                      {item.value}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Photos Grid */}
        {photos && photos.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs sm:text-sm text-primary-500 font-semibold">
              Job Photos
            </h4>
            <div className="flex flex-wrap gap-2 sm:gap-3 bg-[#E5E7EB] rounded-xl p-[6px] w-fit">
              {photos.slice(0, 4).map((photo, index) => {
                const isLastTile = index === 3 && photos.length > 4;
                const remaining = photos.length - 4;

                return (
                  <button
                    key={`${photo}-${index}`}
                    type="button"
                    onClick={() => openPhotoModal(index)}
                    className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl! overflow-hidden focus:outline-none hover:scale-[1.03] transition-transform duration-200 cursor-pointer"
                  >
                    <img
                      src={photo}
                      alt={`Job photo ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                    {isLastTile && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white text-sm sm:text-base font-semibold">
                          +{remaining}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}

              {photos.length > 4 && (
                photos.slice(4).map((photo, index) => (
                  <button
                    key={`${photo}-hidden-${index}`}
                    type="button"
                    onClick={() => openPhotoModal(index + 4)}
                    className="hidden"
                    aria-hidden="true"
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {isPhotoModalOpen && photos[activePhotoIndex] && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4">
          <div className="relative w-full max-w-4xl">
            <button
              type="button"
              onClick={closePhotoModal}
              className="absolute -top-10 right-0 text-white hover:text-primary-200 transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" strokeWidth={2.5} />
            </button>
            <div className="relative">
              <img
                src={photos[activePhotoIndex]}
                alt={`Job photo ${activePhotoIndex + 1}`}
                className="w-full max-h-[70vh] object-contain rounded-2xl"
              />
              <button
                type="button"
                onClick={showPrevPhoto}
                disabled={activePhotoIndex === 0}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full p-2 disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
              </button>
              <button
                type="button"
                onClick={showNextPhoto}
                disabled={activePhotoIndex === photos.length - 1}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full p-2 disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </div>
            {photos.length > 1 && (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                {photos.map((photo, idx) => (
                  <button
                    key={`${photo}-thumb-${idx}`}
                    type="button"
                    onClick={() => setActivePhotoIndex(idx)}
                    className={`h-16 w-16 sm:h-20 sm:w-20 rounded-xl overflow-hidden border-2 shrink-0 ${idx === activePhotoIndex ? 'border-primary-500' : 'border-transparent'
                      } cursor-pointer shadow-sm`}
                  >
                    <img
                      src={photo}
                      alt={`Thumbnail ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

JobOverviewCard.propTypes = {
  jobId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  title: PropTypes.string,
  serviceTypeId: PropTypes.shape({
    _id: PropTypes.string,
    name: PropTypes.string,
  }),
  propertyType: PropTypes.string,
  quoteCount: PropTypes.number,
  showQuotePill: PropTypes.bool,
  serviceType: PropTypes.string,
  serviceDetail: PropTypes.string,
  instructions: PropTypes.string,
  scheduledDate: PropTypes.string,
  frequency: PropTypes.string,
  location: PropTypes.string,
  photos: PropTypes.arrayOf(PropTypes.string),
  onPhotoClick: PropTypes.func,
  viewerRole: PropTypes.string,
  metaInfo: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.node]),
      icon: PropTypes.node,
    })
  ),
  roleSections: PropTypes.objectOf(
    PropTypes.oneOfType([
      PropTypes.arrayOf(
        PropTypes.shape({
          label: PropTypes.string,
          value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.node]),
        })
      ),
      PropTypes.shape({
        title: PropTypes.string,
        items: PropTypes.arrayOf(
          PropTypes.shape({
            label: PropTypes.string,
            value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.node]),
          })
        ),
      }),
    ])
  ),
  roomsNeedCleaning: PropTypes.string,
  bathroomsNeedCleaning: PropTypes.string,
  extraServiceItems: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({ _id: PropTypes.string, name: PropTypes.string })
    ])
  ),
};

JobOverviewCard.defaultProps = {
  jobId: '',
  title: '',
  serviceTypeId: null,
  propertyType: '',
  quoteCount: 0,
  showQuotePill: true,
  serviceType: '',
  serviceDetail: '',
  instructions: '',
  scheduledDate: '',
  frequency: '',
  location: '',
  photos: [],
  onPhotoClick: null,
  viewerRole: 'customer',
  metaInfo: [],
  roleSections: {},
  roomsNeedCleaning: null,
  bathroomsNeedCleaning: null,
  extraServiceItems: [],
};

export default JobOverviewCard;


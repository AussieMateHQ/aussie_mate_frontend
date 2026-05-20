import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Info } from 'lucide-react';
import { useNoIndex } from '../../hooks/useNoIndex';
import logo from '../../assets/logo.png';
import customerIcon from '../../assets/customer.svg';
import housekeepingIcon from '../../assets/Cleaning.png';
import { Button, RadioCard } from '../../components';

const RoleSelectionPage = () => {
  useNoIndex();
  const [selectedRole, setSelectedRole] = useState(null);
  const [isNDISParticipant, setIsNDISParticipant] = useState(false);
  const navigate = useNavigate();

  const roleOptions = [
    {
      id: 'Customer',
      title: "I'm Customer",
      subtitle: "Looking for Services",
      icon: customerIcon
    },
    {
      id: 'Service Provider',
      title: "I'm Service Provider",
      subtitle: "Looking for Jobs",
      icon: housekeepingIcon
    }
  ];



  const handleContinue = () => {
    // For Customer, no specific role needed
    if (selectedRole === 'Customer') {
      const params = new URLSearchParams({
        role: 'Customer',
        ndis: isNDISParticipant ? 'true' : 'false'
      });
      navigate(`/signup?${params.toString()}`);
      return;
    }

    // For Service Provider, specific role is no longer required
    if (selectedRole === 'Service Provider') {
      const params = new URLSearchParams({
        role: 'Service Provider',
        ndis: isNDISParticipant ? 'true' : 'false'
      });
      navigate(`/signup?${params.toString()}`);
      return;
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col p-4 sm:p-6">
      {/* Header */}
      <div className="flex justify-center mb-6 sm:mb-8">
        <img src={logo} alt="Aussie Mate" className="h-12 sm:h-16 w-auto" />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center max-w-2xl w-full mx-auto">
        <div className="w-full space-y-6">
          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 text-center mb-8">
            Tell us how you'll use the platform.
          </h1>

          {/* Role Selection Cards */}
          <div className="space-y-4">
            {roleOptions.map((role) => (
              <RadioCard
                key={role.id}
                id={role.id}
                title={role.title}
                subtitle={role.subtitle}
                icon={role.icon}
                selected={selectedRole === role.id}
                onSelect={setSelectedRole}
              />
            ))}
          </div>



          {/* NDIS Participant Toggle - Only show for Customer */}
          {selectedRole === 'Customer' && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl mt-6 shadow-custom">
              <span className="text-gray-900 font-semibold text-base sm:text-lg">
                NDIS Participant
              </span>
              <button
                type="button"
                onClick={() => setIsNDISParticipant(!isNDISParticipant)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none cursor-pointer ${
                  isNDISParticipant ? 'bg-blue-600' : 'bg-gray-300'
                }`}
                role="switch"
                aria-checked={isNDISParticipant}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                    isNDISParticipant ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          )}

          {/* Continue Button */}
          <div className="pt-4 flex justify-end">
            <Button
              onClick={handleContinue}
              disabled={!selectedRole}
              size="lg"
              className={`${!selectedRole ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Continue For Profile Setup
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionPage;


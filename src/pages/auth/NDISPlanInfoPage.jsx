import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNoIndex } from '../../hooks/useNoIndex';
import logo from '../../assets/logo.png';
import { FloatingLabelInput, Button, RadioButtonGroup, Checkbox } from '../../components';
import backIcon from '../../assets/arrow-left.svg';
import { ndisPlanInfoSchema } from '../../utils/validationSchemas';
import { userAPI } from '../../services/api';

const NDISPlanInfoPage = () => {
  useNoIndex();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        ndisNumber: '',
        planManagerName: '',
        planManagerEmail: '',
        phoneNumber: '',
        planType: 'Plan manager',
        agreeToTerms1: false,
        agreeToTerms2: false
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const planTypeOptions = [
        { value: 'Plan manager', label: 'Plan manager' },
        { value: 'Self - managed NDIS', label: 'Self - managed NDIS' }
    ];

    const termsData = [
        {
            name: 'agreeToTerms1',
            text: 'I confirm I am either a self-managed or plan-managed NDIS participant. I understand AussieMate is not an NDIS registered provider and cannot support NDIA-managed plans.'
        },
        {
            name: 'agreeToTerms2',
            text: 'I authorize AussieMate to invoice my plan manager directly for approved services. I understand that I pay upfront for each booking, and my support worker is paid the same day. Once my plan manager reimburses the invoice, the funds will be credited to my AussieMate wallet for future use. Wallet credits are non-withdrawable and can only be applied to future bookings.'
        }
    ];

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Validate using Yup schema
            await ndisPlanInfoSchema.validate(formData, { abortEarly: false });

            const payload = {
                ndisNumber: formData.ndisNumber.trim(),
                planManagerName: formData.planManagerName.trim(),
                planManagerEmail: formData.planManagerEmail.trim(),
                phoneNumber: formData.phoneNumber.trim(),
                planType: formData.planType,
                agreeToTerms1: formData.agreeToTerms1,
                agreeToTerms2: formData.agreeToTerms2,
            };

            await userAPI.saveNdisPlanInfo(payload);

            // Navigate to location page
            navigate('/location');
        } catch (err) {
            if (err.inner) {
                const firstError = err.inner[0];
                setError(firstError.message);
            } else if (err.response && err.response.message) {
                setError(err.response.message);
            } else {
                setError(err.message || 'Failed to save information. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
            <div className="max-w-2xl mx-auto">
                {/* Logo */}
                <div className="flex justify-center mb-6">
                    <img src={logo} alt="Aussie Mate" className="h-12 w-auto" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="cursor-pointer"
                    >
                        <img src={backIcon} alt="Back" className="w-6 h-6" />
                    </button>
                    <button
                        onClick={() => navigate('/location')}
                        className="px-4 py-2 bg-[#F9FAFB] text-primary-500 border border-primary-200 rounded-lg hover:bg-gray-300 font-medium cursor-pointer"
                    >
                        Skip
                    </button>
                </div>

                

                <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-2xl p-6 sm:p-8 shadow-sm">
                    {/* Title Section */}
                <div className="mb-8">
                    <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 mb-2">
                        Plan Manager Information
                    </h1>
                    <p className="text-base text-primary-200 font-medium">
                        As an NDIS participant, please provide all the information requested below.
                    </p>
                </div>

                {/* NDIS Plan Type */}
                <RadioButtonGroup
                        name="planType"
                        title="NDIS Plan Type"
                        options={planTypeOptions}
                        selectedValue={formData.planType}
                        onChange={handleInputChange}
                    />
                    
                    {/* NDIS Number */}
                    <FloatingLabelInput
                        id="ndisNumber"
                        name="ndisNumber"
                        label="NDIS Number"
                        type="text"
                        value={formData.ndisNumber}
                        onChange={(e) => {
                            const value = e.target.value.replace(/[^\d]/g, '').slice(0, 9);
                            setFormData(prev => ({ ...prev, ndisNumber: value }));
                        }}
                        required
                    />

                    {/* Plan Manager Name */}
                    <FloatingLabelInput
                        id="planManagerName"
                        name="planManagerName"
                        label="Plan manager name (optional)"
                        type="text"
                        value={formData.planManagerName}
                        onChange={handleInputChange}
                    />
                    <div className='grid grid-cols-1 gap-6 sm:gap-4 sm:grid-cols-2'>
                        {/* Plan Manager Email */}
                        <FloatingLabelInput
                            id="planManagerEmail"
                            name="planManagerEmail"
                            label="Plan manager email (optional)"
                            type="email"
                            value={formData.planManagerEmail}
                            onChange={handleInputChange}
                        />

                        {/* Phone Number */}
                        <div>
                            <input
                                id="phoneNumber"
                                name="phoneNumber"
                                type="tel"
                                value={formData.phoneNumber}
                                onChange={handleInputChange}
                                placeholder="+61 000 000 0000"
                                className="w-full p-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-1 focus:[#6B7280] focus:border-transparent transition-all duration-200"
                            />
                        </div>
                    </div>
                    

                    {/* Checkboxes */}
                    <div className="space-y-4">
                        {termsData.map((term, index) => (
                            <Checkbox
                                key={index}
                                name={term.name}
                                checked={formData[term.name]}
                                onChange={handleInputChange}
                                label={
                                    <>
                                        {term.text.split('AussieMate').map((part, i) =>
                                            i === 0 ? part : (
                                                <React.Fragment key={i}>
                                                    <span className='text-primary-500 font-semibold'>AussieMate</span>
                                                    {part}
                                                </React.Fragment>
                                            )
                                        )}
                                    </>
                                }
                            />
                        ))}
                    </div>

                    {error && (
                        <div className="text-red-600 font-medium text-sm">
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        loading={isLoading}
                        fullWidth
                        size="lg"
                        className="mt-6"
                    >
                        Continue & Set My Location
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default NDISPlanInfoPage;


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle, Loader2, XCircle, CreditCard, Rocket, Clock, Shield, TrendingUp, Zap } from 'lucide-react';
import { Button, PageHeader } from '../../../components';
import { userAPI } from '../../../services/api';
import { paymentService, handlePaymentError } from '../../../services/paymentService';


const PaymentsPayoutsPage = () => {
    const navigate = useNavigate();
    const [selectedMethod, setSelectedMethod] = useState('bank_transfer');
    const [loading, setLoading] = useState(false);
    const [stripeLoading, setStripeLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [stripeAccountStatus, setStripeAccountStatus] = useState(null);
    const [backendStatus, setBackendStatus] = useState('checking');


    // Check Stripe account status
    const checkStripeStatus = async () => {
        try {
            setBackendStatus('checking');
            const response = await paymentService.getStripeAccountStatus();

            if (response.success) {
                // Handle both response structures: response.data or response.account
                const accountData = response.data || response.account;

                if (accountData) {
                    // Map backend response to frontend format
                    const mappedStatus = {
                        accountId: accountData.id || accountData.accountId,
                        status: accountData.transfers === 'active' || (accountData.charges && accountData.payouts)
                            ? 'active'
                            : accountData.detailsSubmitted
                                ? 'pending'
                                : 'pending',
                        isReady: accountData.charges && accountData.payouts,
                        chargesEnabled: accountData.charges || false,
                        payoutsEnabled: accountData.payouts || false,
                        onboardingUrl: null
                    };

                    setStripeAccountStatus(mappedStatus);
                } else {
                    setStripeAccountStatus(null);
                }
                setBackendStatus('online');
            } else {
                setStripeAccountStatus(null);
                setBackendStatus('online');
            }
        } catch (err) {
            setStripeAccountStatus(null);

            // Check if backend is offline
            if (err.message?.includes('Failed to fetch') || err.message?.includes('Network')) {
                setBackendStatus('offline');
            } else {
                setBackendStatus('online');
            }
        }
    };

    // Check Stripe account status on component mount and when returning from Stripe
    useEffect(() => {
        checkStripeStatus();

        const handleStripeUpdate = () => {
            checkStripeStatus();
        };

        window.addEventListener('stripeAccountUpdated', handleStripeUpdate);

        return () => {
            window.removeEventListener('stripeAccountUpdated', handleStripeUpdate);
        };
    }, []);

    // Handle Stripe Connect account creation and onboarding
    const handleStripeConnect = async () => {
        try {
            setStripeLoading(true);
            setError('');
            setSuccessMessage('');

            // Step 1: Create Stripe Connect Account (and save ID in DB)
            const createResponse = await paymentService.createStripeConnectAccount();

            if (!createResponse.success) {
                throw new Error(createResponse.message || 'Failed to create Stripe Connect account.');
            }

            // Step 2: Get Onboarding Link
            const linkResponse = await paymentService.getStripeOnboardingLink(createResponse.accountId);

            // Support both shapes: { success, data: { onboardingUrl } } and { success, onboardingUrl }
            const onboardingUrl = linkResponse?.data?.onboardingUrl || linkResponse?.onboardingUrl || linkResponse?.url;

            if (linkResponse.success && onboardingUrl) {
                setSuccessMessage('Redirecting to Stripe setup...');
                window.location.href = onboardingUrl;
            } else {
                setError(linkResponse.message || 'Stripe onboarding URL not available. Please try again.');
            }
        } catch (err) {
            setError(handlePaymentError(err));
        } finally {
            setStripeLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            setError('');

            // Update payout method
            await userAPI.updatePayoutMethod({ method: selectedMethod });

            setError('Settings saved successfully!');
            setTimeout(() => setError(''), 3000);
        } catch (error) {
            setError('Failed to save settings. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 py-4 sm:py-6">
                <PageHeader
                    title="Payments & Payouts"
                    onBack={() => navigate(-1)}
                    className="mb-4 sm:mb-6"
                    titleClassName="text-base sm:text-lg md:text-xl font-semibold text-primary-500"
                />

                {/* Error Message */}
                {error && (
                    <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
                        <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0 mt-0.5" strokeWidth={2} />
                        <div className="flex-1">
                            <h4 className="text-xs sm:text-sm font-medium text-red-800">Error</h4>
                            <p className="text-xs sm:text-sm text-red-600 mt-1">{error}</p>
                        </div>
                    </div>
                )}

                {/* Success Message */}
                {successMessage && (
                    <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl bg-green-50 border border-green-200 flex items-start gap-3">
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0 mt-0.5" strokeWidth={2} />
                        <div className="flex-1">
                            <h4 className="text-xs sm:text-sm font-medium text-green-800">Success</h4>
                            <p className="text-xs sm:text-sm text-green-600 mt-1">{successMessage}</p>
                        </div>
                    </div>
                )}

                {/* Backend Status Warning */}
                {backendStatus === 'offline' && (
                    <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl bg-yellow-50 border border-yellow-200 flex items-start gap-3">
                        <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 flex-shrink-0 mt-0.5" strokeWidth={2} />
                        <div className="flex-1">
                            <h4 className="text-xs sm:text-sm font-medium text-yellow-800">Payments Temporarily Unavailable</h4>
                            <p className="text-xs sm:text-sm text-yellow-600 mt-1">
                                We couldn't reach the payments service right now. Please try again in a few minutes, or contact support if this continues.
                            </p>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {backendStatus === 'checking' && (
                    <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-3">
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0 mt-0.5 animate-spin" strokeWidth={2} />
                        <div className="flex-1">
                            <h4 className="text-xs sm:text-sm font-medium text-blue-800">Checking Backend Status</h4>
                            <p className="text-xs sm:text-sm text-blue-600 mt-1">Connecting to payment backend...</p>
                        </div>
                    </div>
                )}

                {/* Stripe Connect Setup Card */}
                <div className="bg-gradient-to-br from-[#635BFF] to-[#0A2540] rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 text-white shadow-custom">
                    <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                        <div className="flex-shrink-0">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 rounded-xl flex items-center justify-center">
                                <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2} />
                            </div>
                        </div>
                        <div className="flex-1 w-full">
                            <div className="flex items-center gap-2 mb-2">
                                {stripeAccountStatus?.accountId && stripeAccountStatus?.status === 'active' ? (
                                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" strokeWidth={2} />
                                ) : stripeAccountStatus?.accountId ? (
                                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" strokeWidth={2} />
                                ) : (
                                    <Rocket className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2} />
                                )}
                                <h2 className="text-base sm:text-lg font-bold">
                                    {stripeAccountStatus?.accountId && stripeAccountStatus?.status === 'active'
                                        ? 'Stripe Account Active'
                                        : stripeAccountStatus?.accountId
                                            ? 'Stripe Account Pending'
                                            : 'Connect Your Stripe Account'}
                                </h2>
                            </div>
                            <p className="text-xs sm:text-sm text-white/90 mb-3 sm:mb-4">
                                {stripeAccountStatus?.accountId && stripeAccountStatus?.status === 'active'
                                    ? 'Your Stripe account is verified and ready to receive payments. Customers can now book and pay for your services!'
                                    : stripeAccountStatus?.accountId
                                        ? 'Your Stripe account is connected but still pending verification. Complete the onboarding process to start receiving payments.'
                                        : 'Set up your Stripe account to receive instant payments from customers. Required to accept online payments for your services.'}
                            </p>

                            {stripeAccountStatus?.accountId && stripeAccountStatus?.status === 'active' ? (
                                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                                    <span className="bg-primary-500 text-white px-2 sm:px-3 py-1 rounded-full flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" strokeWidth={2} />
                                        Charges: {stripeAccountStatus.chargesEnabled ? 'Enabled' : 'Disabled'}
                                    </span>
                                    <span className="bg-white/20 text-white px-2 sm:px-3 py-1 rounded-full flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" strokeWidth={2} />
                                        Payouts: {stripeAccountStatus.payoutsEnabled ? 'Enabled' : 'Disabled'}
                                    </span>
                                </div>
                            ) : stripeAccountStatus?.accountId ? (
                                <Button
                                    onClick={handleStripeConnect}
                                    loading={stripeLoading}
                                    disabled={stripeLoading || backendStatus === 'offline' || backendStatus === 'checking'}
                                    size="sm"
                                    className="text-xs sm:text-sm"
                                >
                                    {stripeLoading ? 'Loading...' : 'Complete Stripe Setup'}
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleStripeConnect}
                                    loading={stripeLoading}
                                    disabled={stripeLoading || backendStatus === 'offline' || backendStatus === 'checking'}
                                    size="sm"
                                    className="text-xs sm:text-sm"
                                >
                                    {stripeLoading ? 'Connecting...' : 'Connect Stripe Account'}
                                </Button>
                            )}
                        </div>
                    </div>

                    {!stripeAccountStatus && (
                        <div className="mt-4 pt-4 border-t border-white/20">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs text-white/80">
                                <div className="flex items-center gap-2">
                                    <Zap className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" strokeWidth={2} />
                                    <span>Instant payment transfers</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Shield className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" strokeWidth={2} />
                                    <span>Secure and PCI compliant</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" strokeWidth={2} />
                                    <span>Auto-deduct 10% admin commission</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" strokeWidth={2} />
                                    <span>Track earnings in real-time</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default PaymentsPayoutsPage;

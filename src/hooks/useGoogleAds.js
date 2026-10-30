/**
 * Google Ads Conversion Tracking — AussieMate
 * Conversion ID: AW-18173666946
 *
 * Usage:
 *   const { trackQuoteSubmitted, trackBookingCompleted } = useGoogleAds();
 */

const GOOGLE_ADS_ID = 'AW-18173666946';

// Conversion labels — create these in Google Ads > Tools > Conversions
// and paste the generated labels here.
const CONVERSION_LABELS = {
  QUOTE_FORM_SUBMITTED: 'LNNZCJTO7K4dEILN8NlD',   // "Aussie Mate - Quote submitted"
  BOOKING_COMPLETED: null,                         // not created in Google Ads yet, so nothing is sent
};

/**
 * Fire a gtag conversion event safely (no-op if gtag is not loaded).
 * @param {string} conversionAction  - e.g. 'AW-18173666946/quote_form_submitted'
 * @param {object} [params]          - optional extra params (value, currency, etc.)
 */
function fireConversion(conversionAction, params = {}) {
  if (typeof window === 'undefined') return;
  if (typeof window.gtag !== 'function') {
    console.warn('[GoogleAds] gtag not available – conversion not fired:', conversionAction);
    return;
  }
  window.gtag('event', 'conversion', {
    send_to: conversionAction,
    ...params,
  });
}

/**
 * Custom hook that exposes named conversion helpers.
 */
export function useGoogleAds() {
  /**
   * Fire "Quote form submitted" conversion.
   * Call this when the customer successfully posts a new job (quote request).
   */
  const trackQuoteSubmitted = (params = {}) => {
    fireConversion(`${GOOGLE_ADS_ID}/${CONVERSION_LABELS.QUOTE_FORM_SUBMITTED}`, params);
  };

  /**
   * Fire "Cleaning booking completed" conversion.
   * Call this when the customer lands on the booking success page.
   */
  const trackBookingCompleted = (params = {}) => {
    if (!CONVERSION_LABELS.BOOKING_COMPLETED) return;
    fireConversion(`${GOOGLE_ADS_ID}/${CONVERSION_LABELS.BOOKING_COMPLETED}`, params);
  };

  return { trackQuoteSubmitted, trackBookingCompleted };
}

export default useGoogleAds;

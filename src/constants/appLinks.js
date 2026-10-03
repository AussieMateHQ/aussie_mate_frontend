// Single source of truth for the mobile app store listings - was previously
// duplicated as local constants inside JobSuccessPage.jsx, which made it easy
// for a future app-download link (like the one on CustomerDashboard) to drift
// out of sync if only one copy got updated.
export const APP_STORE_URL = 'https://apps.apple.com/au/app/aussie-mate/id6784121946';
export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.patelhouseaussiemate';

// Picks the store link matching the visitor's device - iOS visitors go
// straight to the App Store, Android visitors to Google Play, and anyone
// else (desktop, unknown UA) falls back to the App Store listing.
export const getAppDownloadLink = () => {
  const ua = navigator.userAgent || navigator.vendor || '';
  if (/android/i.test(ua)) return PLAY_STORE_URL;
  if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) return APP_STORE_URL;
  return APP_STORE_URL;
};

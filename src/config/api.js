export const API_CONFIG = {
  BASE_URL: (import.meta.env.VITE_BACKEND_URL || '') + '/api',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
};

export default API_CONFIG;
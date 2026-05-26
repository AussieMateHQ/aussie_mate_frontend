import { API_CONFIG } from '../config/api';

// API Configuration
const API_BASE_URL = API_CONFIG.BASE_URL;

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Helper function to get user info
const getUserInfo = () => {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  return user;
};

// Helper function to get stored token
export const getStoredToken = () => {
  return localStorage.getItem('authToken');
};

// Helper function to get stored user
export const getStoredUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

// Helper functions for mock storage
const getMockCards = () => {
  const stored = localStorage.getItem('mock_cards');
  return stored ? JSON.parse(stored) : [];
};

const setMockCards = (cards) => {
  localStorage.setItem('mock_cards', JSON.stringify(cards));
};

const getMockBankAccounts = () => {
  const stored = localStorage.getItem('mock_bank_accounts');
  return stored ? JSON.parse(stored) : [];
};

const setMockBankAccounts = (accounts) => {
  localStorage.setItem('mock_bank_accounts', JSON.stringify(accounts));
};

// Generic API request function
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();

  const headers = {
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  // Only add Content-Type: application/json if there's a body and it's not already set
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // Check if response is HTML (404 page) instead of JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      throw new Error(`API endpoint not found: ${endpoint}. Backend server may not be running.`);
    }

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      const textResponse = await response.json();
      throw new Error(`Invalid JSON response: ${textResponse}`);
    }

    if (!response.ok) {
      const errorMessage = data.message || data.error || `API request failed with status ${response.status}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.response = data;
      throw error;
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// Authentication API
export const authAPI = {
  // Login user
  login: async (email, password, role) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    });

    // Store token and user data
    if (response.success && response.data && response.data.token) {
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response;
  },

  // Register customer
  registerCustomer: async (userData) => {
    try {
      // Log the data being sent for debugging

      const response = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      // Store token and user data if registration includes auto-login
      if (response.success && response.data && response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }

      return response;
    } catch (error) {
      console.error('Registration API error:', error);
      // Log the full error response if available
      if (error.response) {
        console.error('Error response:', error.response);
        if (error.response.errors) {
          console.error('Validation errors:', error.response.errors);
          error.response.errors.forEach((err, index) => {
            console.error(`Error ${index + 1}:`, err);
          });
        }
      }
      throw error;
    }
  },

  // Register cleaner
  registerCleaner: async (userData) => {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    // Store token and user data if registration includes auto-login
    if (response.success && response.token) {
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }

    return response;
  },

  // Get current user
  getCurrentUser: async () => {
    return apiRequest('/auth/me');
  },

  // Logout (clear local storage)
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userLocation');
  },


  // Forgot password
  forgotPassword: async (email) => {
    return apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Reset password
  resetPassword: async (token, password, confirmPassword) => {
    return apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password, confirmPassword }),
    });
  },
};

// Jobs API
export const jobsAPI = {
  // Create new job
  createJob: async (jobData) => {
    return apiRequest('/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
  },

  // Create new job with file uploads
  createJobWithFiles: async (jobData, files = {}) => {
    const user = getUserInfo();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const formData = new FormData();

    // Add job data fields (location should come from jobData, not user)
    const jobPayload = {
      ...jobData,
    };

    Object.entries(jobPayload).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        return;
      }

      if (value instanceof Date) {
        formData.append(key, value.toISOString());
        return;
      }

      if (Array.isArray(value) || typeof value === 'object') {
        formData.append(key, JSON.stringify(value));
        return;
      }

      formData.append(key, value);
    });

    // Add photo files
    if (files.photos && files.photos.length > 0) {
      files.photos.forEach((photo, index) => {
        formData.append(`photos`, photo);
      });
    }

    // Add video files
    if (files.videos && files.videos.length > 0) {
      files.videos.forEach((video, index) => {
        formData.append(`videos`, video);
      });
    }

    const token = getAuthToken();

    try {
      const response = await fetch(`${API_BASE_URL}/jobs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Handle validation errors specifically
        if (response.status === 400 && errorData.errors) {
          // Extract validation error messages
          const validationErrors = errorData.errors.map(err => err.msg || err.message || err).join(', ');
          throw new Error(validationErrors);
        }

        // Handle other error types
        const errorMessage = errorData.message || errorData.error || errorData.details || 'Failed to create job with files';
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating job with files:', error);
      throw error;
    }
  },

  // Upload weekly day photos
  uploadWeeklyDayPhotos: async (jobId, day, weekNumber, files) => {
    const formData = new FormData();
    formData.append('day', day);
    formData.append('weekNumber', weekNumber);

    if (files && files.length > 0) {
      files.forEach((file, index) => {
        formData.append('photos', file);
      });
    }

    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/weekly-day-photos`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to upload weekly photos');
    }

    return await response.json();
  },

  // Confirm weekly day completion
  confirmWeeklyDayCompletion: async (jobId, completedDay) => {
    return apiRequest(`/jobs/${jobId}/confirm-weekly-day-completion`, {
      method: 'POST',
      body: JSON.stringify({ completedDay }),
    });
  },

  // Get weekly job progress
  getWeeklyJobProgress: async (jobId) => {
    return apiRequest(`/jobs/${jobId}/weekly-progress`);
  },

  // Get all job categories
  getCategories: async () => {
    return apiRequest('/categories');
  },
  getMyJobs: async (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'null') {
        query.set(key, value);
      }
    });
    const qs = query.toString();
    return apiRequest(`/jobs/my-jobs${qs ? `?${qs}` : ''}`);
  },

  // Get all jobs (supports backend pagination/filters)
  getAllJobs: async ({ status, serviceType, page = 1, limit = 20, location, search, cleanerId, quotedBy } = {}) => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (serviceType) params.set('serviceType', serviceType);
    if (page) params.set('page', String(page));
    if (limit) params.set('limit', String(limit));
    if (location) params.set('location', location);
    if (search) params.set('search', search.trim());
    if (cleanerId) params.set('cleanerId', cleanerId);
    if (quotedBy) params.set('quotedBy', quotedBy);
    const qs = params.toString();
    return apiRequest(`/jobs${qs ? `?${qs}` : ''}`);
  },

  // Get cleaner job feed with tabs and subfilters
  getCleanerJobFeed: async ({ tab, subFilter, page = 1, limit = 20, categoryId, location, isUrgent } = {}) => {
    const params = new URLSearchParams();
    if (tab) params.set('tab', tab);
    if (subFilter) params.set('subFilter', subFilter);
    if (page) params.set('page', String(page));
    if (limit) params.set('limit', String(limit));
    if (categoryId) params.set('categoryId', categoryId);
    if (location) params.set('location', location);
    if (isUrgent) params.set('isUrgent', 'true');

    const qs = params.toString();
    return apiRequest(`/jobs/feed/cleaner${qs ? `?${qs}` : ''}`);
  },

  // Get job by ID (alias for getJobDetails)
  getJobById: async (jobId) => {
    return apiRequest(`/jobs/${jobId}`);
  },

  // Get cleaner progress data for a job
  getCleanerProgress: async (jobId) => {
    return apiRequest(`/jobs/${jobId}/cleaner-progress`);
  },

  // Get customer progress data for a job
  getCustomerProgress: async (jobId) => {
    return apiRequest(`/jobs/${jobId}/customer-progress`);
  },

  // Update job status
  updateJobStatus: async (jobId, status) => {
    return apiRequest(`/jobs/${jobId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // Cancel job
  cancelJob: async (jobId) => {
    return apiRequest(`/jobs/${jobId}`, {
      method: 'DELETE',
    });
  },

  // Assign cleaner to job
  assignCleaner: async (jobId, cleanerId) => {
    return apiRequest(`/jobs/${jobId}/assign/${cleanerId}`, {
      method: 'POST',
    });
  },

  // Request extra time for a job (Cleaner)
  requestExtraTime: async (jobId, { time, amount, reason }) => {
    return apiRequest(`/jobs/${jobId}/extra-time-request`, {
      method: 'POST',
      body: JSON.stringify({ time, amount, reason }),
    });
  },

  // Accept extra time request (Customer)
  acceptExtraTimeRequest: async (jobId, requestId) => {
    return apiRequest(`/jobs/${jobId}/extra-time-request/${requestId}/accept`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  // Reject extra time request (Customer)
  rejectExtraTimeRequest: async (jobId, requestId) => {
    return apiRequest(`/jobs/${jobId}/extra-time-request/${requestId}/reject`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  // Get extra time requests for a job (Optional)
  getExtraTimeRequests: async (jobId, params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.set(key, value);
      }
    });
    const qs = query.toString();
    return apiRequest(`/jobs/${jobId}/extra-time-requests${qs ? `?${qs}` : ''}`);
  },

  // Connect with a cleaner
  connectCleaner: async (jobId, cleanerId) => {
    return apiRequest(`/jobs/${jobId}/connect/${cleanerId}`, {
      method: 'POST',
    });
  },

  // Assign cleaner to job
  assignCleaner: async (jobId, cleanerId) => {
    return apiRequest(`/jobs/${jobId}/assign/${cleanerId}`, {
      method: 'POST',
    });
  },

  // Initiate contact with a job (Cleaner)
  contactJob: async (jobId, { message }) => {
    try {
      const response = await apiRequest(`/jobs/${jobId}/contact`, {
        method: 'POST',
        body: JSON.stringify({ message }),
      });
      if (response.requireWaitlist || response.status === 'waitlisted' || response.data?.status === 'waitlisted') {
        return {
          ...response,
          success: true,
          status: 'waitlisted',
        };
      }
      return response;
    } catch (error) {
      const response = error.response || {};
      if (response.requireWaitlist || response.status === 'waitlisted' || response.data?.status === 'waitlisted') {
        return {
          ...response,
          success: true,
          status: 'waitlisted',
        };
      }
      throw error;
    }
  },

  // Withdraw bid (Cleaner) - used from Booking Requests flow
  withdrawBid: async (jobId) => {
    return apiRequest(`/jobs/${jobId}/withdraw`, {
      method: 'DELETE',
      body: JSON.stringify({}),
    });
  },

  // Join waitlist for a job (Cleaner)
  joinWaitlist: async (jobId) => {
    return apiRequest(`/jobs/${jobId}/waitlist`, {
      method: 'POST',
    });
  },

  // Leave waitlist for a job (Cleaner)
  leaveWaitlist: async (jobId) => {
    return apiRequest(`/jobs/${jobId}/waitlist`, {
      method: 'DELETE',
    });
  },
};

// Quotes API
export const quotesAPI = {
  // Submit quote for job
  submitQuote: async (jobId, quoteData) => {
    return apiRequest(`/jobs/${jobId}/quotes`, {
      method: 'POST',
      body: JSON.stringify(quoteData),
    });
  },
  // Reject quote
  rejectQuote: async (jobId, quoteId) => {
    return apiRequest(`/jobs/${jobId}/quotes/${quoteId}/reject`, {
      method: 'POST',
    });
  },

  // Accept quote
  acceptQuote: async (jobId, quoteId) => {
    return apiRequest(`/jobs/${jobId}/quotes/${quoteId}/accept`, {
      method: 'POST',
    });
  },

  // Withdraw quote
  withdrawQuote: async (quoteId) => {
    return apiRequest(`/jobs/quotes/${quoteId}`, {
      method: 'DELETE',
    });
  },

  // Get cleaner's quotes
  getCleanerQuotes: async (status = null) => {
    const query = status ? `?status=${status}` : '';
    return apiRequest(`/jobs/quotes/cleaner${query}`);
  },

  // Update quote
  updateQuote: async (quoteId, quoteData) => {
    return apiRequest(`/jobs/quotes/${quoteId}`, {
      method: 'PUT',
      body: JSON.stringify(quoteData),
    });
  },
};

// Location API
export const locationAPI = {
  // Search locations
  searchLocations: async (query) => {
    return apiRequest(`/locations/search?q=${encodeURIComponent(query)}`);
  },

  // Find nearby cleaners
  findNearbyCleaners: async (lat, lng, radius = 10) => {
    return apiRequest(`/cleaners/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
  },
};

// User API
export const userAPI = {
  // Update user profile
  updateProfile: async (userData) => {
    return apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  // Get user profile
  getProfile: async () => {
    return apiRequest('/auth/me');
  },

  // Get user by ID
  getUserById: async (userId) => {
    return apiRequest(`/auth/user/${userId}`);
  },

  // Update user location
  updateLocation: async (locationData) => {
    return apiRequest('/auth/address', {
      method: 'PUT',
      body: JSON.stringify(locationData),
    });
  },

  // Upload profile photo
  uploadProfilePhoto: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile/photo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Upload failed with status ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Profile photo upload error:', error);
      throw error;
    }
  },

  // Delete profile photo
  deleteProfilePhoto: async () => {
    return apiRequest('/auth/profile/photo', {
      method: 'DELETE',
    });
  },

  // Get search radius
  getSearchRadius: async () => {
    return apiRequest('/auth/search-radius');
  },

  // Update search radius
  updateSearchRadius: async (radius) => {
    return apiRequest('/auth/search-radius', {
      method: 'PUT',
      body: JSON.stringify({ searchRadius: radius }),
    });
  },

  saveNdisPlanInfo: async (planData) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const formData = new FormData();
    Object.entries(planData).forEach(([key, value]) => {
      if (value === null || value === undefined) return;
      if (key === 'supportPlan' && value instanceof File) {
        formData.append('supportPlan', value);
      } else if (typeof value === 'boolean') {
        formData.append(key, value ? 'true' : 'false');
      } else {
        formData.append(key, value);
      }
    });

    const response = await fetch(`${API_BASE_URL}/auth/ndis-plan`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.message || data.error || 'Failed to save NDIS plan info';
      const error = new Error(errorMessage);
      error.status = response.status;
      error.response = data;
      throw error;
    }

    return data;
  },

  // Payment Methods API
  // Get wallet balance
  getWalletBalance: async () => {
    try {
      return await apiRequest('/payments/wallet/balance');
    } catch (error) {
      if (error.message.includes('API endpoint not found') || error.message.includes('404')) {
        return {
          success: true,
          data: {
            currentBalance: 45.00,
            currency: 'AUD',
            availableBalance: 45.00,
            pendingTransactions: 0.00
          }
        };
      }
      throw error;
    }
  },

  // Cards API
  getCards: async () => {
    try {
      return await apiRequest('/payments/cards');
    } catch (error) {
      if (error.message.includes('API endpoint not found') || error.message.includes('404')) {
        const cards = getMockCards();
        return {
          success: true,
          data: {
            cards: cards
          }
        };
      }
      throw error;
    }
  },

  addCard: async (cardData) => {
    try {
      return await apiRequest('/payments/cards', {
        method: 'POST',
        body: JSON.stringify(cardData),
      });
    } catch (error) {
      // If the endpoint doesn't exist, return a mock response for development
      if (error.message.includes('API endpoint not found') || error.message.includes('404')) {
        // Extract last four digits from card number (remove spaces)
        const cleanCardNumber = cardData.cardNumber.replace(/\s/g, '');
        const lastFourDigits = cleanCardNumber.slice(-4);

        const newCard = {
          id: `mock_card_${Date.now()}`,
          cardHolderName: cardData.cardHolderName,
          lastFourDigits: lastFourDigits,
          cardType: 'Visa',
          expiryMonth: cardData.expiry.split('/')[0],
          expiryYear: cardData.expiry.split('/')[1],
          isDefault: cardData.setAsDefault,
          addedAt: new Date().toISOString()
        };

        // Add to mock storage
        const cards = getMockCards();
        cards.push(newCard);
        setMockCards(cards);

        return {
          success: true,
          message: 'Card added successfully',
          data: {
            card: newCard
          }
        };
      }
      throw error;
    }
  },

  updateCard: async (cardId, cardData) => {
    return apiRequest(`/payments/cards/${cardId}`, {
      method: 'PUT',
      body: JSON.stringify(cardData),
    });
  },

  deleteCard: async (cardId) => {
    return apiRequest(`/payments/cards/${cardId}`, {
      method: 'DELETE',
    });
  },

  setDefaultCard: async (cardId) => {
    return apiRequest(`/payments/cards/${cardId}`, {
      method: 'PUT',
      body: JSON.stringify({
        setAsDefault: true
      }),
    });
  },

  // Bank Accounts API
  getBankAccounts: async () => {
    try {
      return await apiRequest('/payments/bank-accounts');
    } catch (error) {
      if (error.message.includes('API endpoint not found') || error.message.includes('404')) {
        const accounts = getMockBankAccounts();
        return {
          success: true,
          data: {
            accounts: accounts
          }
        };
      }
      throw error;
    }
  },

  addBankAccount: async (bankData) => {
    try {
      return await apiRequest('/payments/bank-accounts', {
        method: 'POST',
        body: JSON.stringify(bankData),
      });
    } catch (error) {
      if (error.message.includes('API endpoint not found') || error.message.includes('404')) {
        const newAccount = {
          id: `mock_bank_${Date.now()}`,
          accountName: bankData.accountName,
          bsb: bankData.bsb,
          lastFourDigits: bankData.accountNumber.slice(-4),
          accountType: 'Savings',
          isDefault: bankData.setAsDefault,
          isVerified: false,
          addedAt: new Date().toISOString()
        };

        // Add to mock storage
        const accounts = getMockBankAccounts();
        accounts.push(newAccount);
        setMockBankAccounts(accounts);

        return {
          success: true,
          message: 'Bank account added successfully',
          data: {
            account: newAccount
          }
        };
      }
      throw error;
    }
  },

  updateBankAccount: async (bankId, bankData) => {
    return apiRequest(`/payments/bank-accounts/${bankId}`, {
      method: 'PUT',
      body: JSON.stringify(bankData),
    });
  },

  deleteBankAccount: async (bankId) => {
    return apiRequest(`/payments/bank-accounts/${bankId}`, {
      method: 'DELETE',
    });
  },

  setDefaultBankAccount: async (bankId) => {
    return apiRequest(`/payments/bank-accounts/${bankId}`, {
      method: 'PUT',
      body: JSON.stringify({
        setAsDefault: true
      }),
    });
  },

  // Combined Payment Methods
  getPaymentMethods: async () => {
    return apiRequest('/payments/payment-methods');
  },

  setDefaultPaymentMethod: async (methodId) => {
    return apiRequest(`/payments/payment-methods/${methodId}/default`, {
      method: 'PUT',
    });
  },

  removePaymentMethod: async (methodId) => {
    return apiRequest(`/payments/payment-methods/${methodId}`, {
      method: 'DELETE',
    });
  },

  // Availability Management API
  setAvailability: async (availabilityData) => {
    return apiRequest('/auth/availability', {
      method: 'POST',
      body: JSON.stringify(availabilityData),
    });
  },

  getAvailability: async () => {
    return apiRequest('/auth/availability');
  },

  updateAvailability: async (availabilityData) => {
    return apiRequest('/auth/availability', {
      method: 'POST',
      body: JSON.stringify(availabilityData),
    });
  },

  // Search Radius Management API
  getSearchRadius: async () => {
    return apiRequest('/auth/search-radius');
  },

  updateSearchRadius: async (searchRadius) => {
    return apiRequest('/auth/search-radius', {
      method: 'PUT',
      body: JSON.stringify({ searchRadius }),
    });
  },

  // Document Verification API
  uploadDocuments: async (formData) => {
    try {
      // For FormData, we need to use fetch directly instead of apiRequest
      const token = getAuthToken();


      const response = await fetch(`${API_BASE_URL}/auth/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData, // Don't stringify FormData
      });

      // Check if response is HTML (error page) instead of JSON
      const contentType = response.headers.get('content-type');

      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.json();
        throw new Error(`Server returned HTML instead of JSON (Status: ${response.status}). This is a backend error - check server logs.`);
      }

      const data = await response.json();

      if (!response.ok) {
        const error = new Error(data.message || `API request failed with status ${response.status}`);
        error.status = response.status;
        error.response = data;
        throw error;
      }
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Update document verification
  verifyDocuments: async (data) => {
    try {
      const token = getAuthToken();
      const isFormData = data instanceof FormData;

      const headers = {
        'Authorization': `Bearer ${token}`,
      };

      if (!isFormData) {
        headers['Content-Type'] = 'application/json';
      }

      const response = await fetch(`${API_BASE_URL}/auth/documents/verify`, {
        method: 'PUT',
        headers: headers,
        body: isFormData ? data : JSON.stringify(data),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Server returned HTML instead of JSON (Status: ${response.status})`);
      }

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.message || `Verification update failed with status ${response.status}`);
      }
      return json;
    } catch (error) {
      console.error('Verification update error:', error);
      throw error;
    }
  },

  getDocumentStatus: async () => {
    return apiRequest('/auth/documents/status');
  },

  updateDocument: async (documentType, documentData) => {
    return apiRequest(`/auth/documents/${documentType}`, {
      method: 'PUT',
      body: JSON.stringify(documentData),
    });
  },

  // Search & Discovery API
  searchCleaners: async (query, lat, lng, radius, role) => {
    const params = new URLSearchParams();
    if (query) params.set('query', query);
    if (lat) params.set('lat', lat);
    if (lng) params.set('lng', lng);
    if (radius) params.set('radius', radius);
    if (role) params.set('role', role);

    return apiRequest(`/search?${params.toString()}`);
  },

  // Statistics & Analytics API
  getCleanerStatistics: async () => {
    return apiRequest('/statistics');
  },
};

// Mate Points API
export const matePointsAPI = {
  // Get current user's mate points summary
  getPoints: async () => {
    return apiRequest('/mate-points');
  },

  // Redeem mate points (supports only 500 or 1000 based on backend rules)
  redeem: async (pointsToRedeem) => {
    return apiRequest('/mate-points/redeem', {
      method: 'POST',
      body: JSON.stringify({ pointsToRedeem })
    });
  },

  // Get redemption history (paginated)
  getRedemptions: async (page = 1, limit = 10) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    return apiRequest(`/mate-points/redemptions?${params.toString()}`);
  },

  // Get point transactions (earn/redeem/cancellation etc.)
  getTransactions: async (page = 1, limit = 10) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    return apiRequest(`/mate-points/transactions?${params.toString()}`);
  }
};

// Job Photos API
export const jobPhotosAPI = {
  // Upload before photos
  uploadBeforePhotos: async (jobId, files, occurrenceId) => {
    const formData = new FormData();
    files.forEach(file => formData.append('photos', file));

    // Add occurrenceId to formData if provided
    if (occurrenceId) {
      formData.append('occurrenceId', occurrenceId);
    }

    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/before-photos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Upload failed with status ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Error uploading before photos:', error);
      throw error;
    }
  },

  // Upload after photos
  uploadAfterPhotos: async (jobId, files, occurrenceId) => {
    const formData = new FormData();
    files.forEach(file => formData.append('photos', file));

    // Add occurrenceId to formData if provided
    if (occurrenceId) {
      formData.append('occurrenceId', occurrenceId);
    }

    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/after-photos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Upload failed with status ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Error uploading after photos:', error);
      throw error;
    }
  },

  // Get job photos
  getJobPhotos: async (jobId) => {
    return apiRequest(`/jobs/${jobId}/photos`);
  },

  // Update job status (with photo validation)
  updateJobStatus: async (jobId, status, occurrenceId) => {
    const requestBody = { status };

    // Add occurrenceId if provided (for weekly jobs)
    if (occurrenceId) {
      requestBody.occurrenceId = occurrenceId;
    }

    return apiRequest(`/jobs/${jobId}/status`, {
      method: 'PUT',
      body: JSON.stringify(requestBody)
    });
  }
};

// Reviews API
export const reviewsAPI = {
  // Create review
  createReview: async (jobId, rating, likedAspects, feedback) => {
    return apiRequest('/reviews', {
      method: 'POST',
      body: JSON.stringify({
        jobId,
        rating,
        likedAspects,
        feedback
      })
    });
  },

  // Check job review status
  checkReviewStatus: async (jobId) => {
    return apiRequest(`/reviews/job/${jobId}/status`);
  },

  // Get cleaner reviews
  getCleanerReviews: async (cleanerId, page = 1, limit = 10) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    return apiRequest(`/reviews/cleaner/${cleanerId}?${params.toString()}`);
  },

  // Get customer reviews
  getCustomerReviews: async (page = 1, limit = 10) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    return apiRequest(`/reviews/customer?${params.toString()}`);
  },

  // Get my reviews (for logged-in user)
  getMyReviews: async () => {
    return apiRequest('/reviews/my-reviews');
  }
};

// Notifications API
export const notificationsAPI = {
  // Get all notifications
  getNotifications: async () => {
    return apiRequest('/notifications');
  },

  // Mark a notification as read
  markAsRead: async (notificationId) => {
    return apiRequest(`/notifications/${notificationId}/read`, {
      method: 'PUT'
    });
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    return apiRequest('/notifications/read-all', {
      method: 'PUT'
    });
  },

  // Delete a notification
  deleteNotification: async (notificationId) => {
    return apiRequest(`/notifications/${notificationId}`, {
      method: 'DELETE'
    });
  }
};

// FAQs API
export const faqsAPI = {
  // Get all FAQs grouped by category
  getAllFaqs: async (search = '') => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return apiRequest(`/faqs${query}`);
  },

  // Search FAQs globally
  searchFaqs: async (query) => {
    return apiRequest(`/faqs/search?query=${encodeURIComponent(query)}`);
  }
};

// Support Tickets API
export const supportTicketsAPI = {
  // Raise a new support ticket
  raiseTicket: async (ticketData) => {
    // If ticketData is FormData, use fetch directly
    if (ticketData instanceof FormData) {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/support-tickets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: ticketData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to raise ticket with status ${response.status}`);
      }

      return await response.json();
    }

    // Fallback to JSON for backwards compatibility
    return apiRequest('/support-tickets', {
      method: 'POST',
      body: JSON.stringify(ticketData)
    });
  },

  // Get own tickets
  getMyTickets: async (status = '') => {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return apiRequest(`/support-tickets${query}`);
  },

  // Get specific ticket details
  getTicketDetails: async (ticketId) => {
    return apiRequest(`/support-tickets/${ticketId}`);
  }
};

// Enquiries API
export const enquiriesAPI = {
  // Submit an enquiry form (Public API)
  createEnquiry: async (enquiryData) => {
    return apiRequest('/enquiries', {
      method: 'POST',
      body: JSON.stringify(enquiryData),
    });
  }
};

// Subscriptions API
export const subscriptionsAPI = {
  // Get all subscription plans
  getPlans: async () => {
    return apiRequest('/subscriptions/plans', {
      method: 'GET',
      // No body sent to match Postman exactly
    });
  },

  // Checkout a subscription plan
  checkoutPlan: async (planId) => {
    return apiRequest('/subscriptions/checkout-plan', {
      method: 'POST',
      body: JSON.stringify({ planId }),
    });
  },

  // Get current subscription status
  getMyStatus: async (planId) => {
    const options = { method: 'GET' };


    return apiRequest('/subscriptions/my-status', options);
  },

  // Get subscription history
  getHistory: async (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.set(key, value);
      }
    });
    const qs = query.toString();
    return apiRequest(`/subscriptions/history${qs ? `?${qs}` : ''}`);
  },

  // Get credit packages
  getCredits: async () => {
    return apiRequest('/subscriptions/credits', {
      method: 'GET',
    });
  },

  // Checkout credits
  checkoutCredits: async (packageId) => {
    return apiRequest('/subscriptions/checkout-credits', {
      method: 'POST',
      body: JSON.stringify({ packageId }),
    });
  },
};

// Job Details API
export const jobDetailsAPI = {
  // Get completed job details
  getCompletedJobDetails: async (jobId) => {
    return apiRequest(`/jobs/${jobId}/completed`);
  },

  // Get Stripe invoice
  getStripeInvoice: async (jobId) => {
    return apiRequest(`/jobs/${jobId}/stripe-invoice`);
  },

  // Download invoice
  downloadInvoice: async (jobId) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/invoice`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}`);
      }

      // Return blob for file download
      return response.blob();
    } catch (error) {
      console.error('Error downloading invoice:', error);
      throw error;
    }
  }
};

// Categories API
export const categoriesAPI = {
  // Get all categories
  getCategories: async () => {
    return apiRequest('/categories');
  },

  // Get service types for a category
  getServiceTypes: async (categoryId) => {
    return apiRequest(`/categories/${categoryId}/service-types`);
  },

  // Get commercial job types
  getCommercialJobTypes: async () => {
    return apiRequest('/categories/commercial-job-types');
  },

  // Get extra service items
  getExtraServiceItems: async () => {
    return apiRequest('/categories/extra-service-items');
  },
};

// File upload helper (Cloudinary)
export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const token = getAuthToken();

  try {
    const response = await fetch(`${API_BASE_URL}/uploads/single`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Upload failed');
    }

    return data.data.secureUrl || data.data.url;
  } catch (error) {
    console.error('Upload Error:', error);
    throw error;
  }
};

// Cloudinary file upload helper
export const uploadFileToCloudinary = async (file, type = 'files') => {
  const formData = new FormData();
  formData.append(type === 'photos' ? 'photos' : type === 'videos' ? 'videos' : 'files', file);

  const token = getAuthToken();

  try {
    const endpoint = type === 'photos' || type === 'videos'
      ? `${API_BASE_URL}/uploads/job-media`
      : `${API_BASE_URL}/uploads/multiple`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to upload file to Cloudinary');
    }

    const result = await response.json();

    // Return the first file from the response
    if (result.data.files && result.data.files.length > 0) {
      return result.data.files[0];
    }

    return result.data;
  } catch (error) {
    console.error('Error uploading file to Cloudinary:', error);
    throw error;
  }
};

// Upload multiple files to Cloudinary
export const uploadMultipleFilesToCloudinary = async (files, type = 'files') => {
  const formData = new FormData();

  files.forEach(file => {
    formData.append(type === 'photos' ? 'photos' : type === 'videos' ? 'videos' : 'files', file);
  });

  const token = getAuthToken();

  try {
    const endpoint = type === 'photos' || type === 'videos'
      ? `${API_BASE_URL}/uploads/job-media`
      : `${API_BASE_URL}/uploads/multiple`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to upload files to Cloudinary');
    }

    const result = await response.json();
    return result.data.files || [result.data];
  } catch (error) {
    console.error('Error uploading files to Cloudinary:', error);
    throw error;
  }
};

// Error handling helper
export const handleAPIError = (error) => {
  if (error.message.includes('401') || error.message.includes('Unauthorized')) {
    // Token expired or invalid
    authAPI.logout();
    window.location.href = '/login';
    return 'Session expired. Please login again.';
  }

  return error.message || 'Something went wrong. Please try again.';
};

export default {
  authAPI,
  jobsAPI,
  quotesAPI,
  locationAPI,
  userAPI,
  matePointsAPI,
  jobPhotosAPI,
  reviewsAPI,
  jobDetailsAPI,
  categoriesAPI,
  subscriptionsAPI,
  notificationsAPI,
  faqsAPI,
  supportTicketsAPI,
  uploadFile,
  uploadFileToCloudinary,
  uploadMultipleFilesToCloudinary,
  handleAPIError,
};

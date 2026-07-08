/**
 * SelvaTailor API Client
 * Centralized API communication with backend
 * Replace localStorage calls with actual API calls
 */

// Configuration
const API_CONFIG = {
  BASE_URL: process.env.API_BASE_URL || 'http://localhost:5000/api/v1',
  TIMEOUT: 10000
};

// Token management
const TokenManager = {
  setToken: (token) => localStorage.setItem('auth_token', token),
  getToken: () => localStorage.getItem('auth_token'),
  clearToken: () => localStorage.removeItem('auth_token'),
  isAuthenticated: () => !!TokenManager.getToken()
};

// Fetch wrapper with error handling
async function apiCall(endpoint, options = {}) {
  const {
    method = 'GET',
    headers = {},
    body = null,
    requireAuth = false
  } = options;

  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };

  // Add auth token if required
  if (requireAuth) {
    const token = TokenManager.getToken();
    if (!token) {
      throw new Error('Unauthorized: No token found. Please login first.');
    }
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  // Add body if provided
  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await Promise.race([
      fetch(url, config),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), API_CONFIG.TIMEOUT)
      )
    ]);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP Error ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// ============ AUTH API ============
const AuthAPI = {
  register: async (registerData) => {
    return apiCall('/auth/register', {
      method: 'POST',
      body: registerData
    });
  },

  login: async (loginId, password) => {
    const response = await apiCall('/auth/login', {
      method: 'POST',
      body: { loginId, password }
    });
    if (response.token) {
      TokenManager.setToken(response.token);
    }
    return response;
  },

  getCurrentTailor: async () => {
    return apiCall('/auth/me', { requireAuth: true });
  },

  logout: async () => {
    TokenManager.clearToken();
    return apiCall('/auth/logout', { method: 'POST', requireAuth: true });
  }
};

// ============ DESIGNS API ============
const DesignsAPI = {
  getAll: async () => {
    return apiCall('/designs');
  },

  getById: async (id) => {
    return apiCall(`/designs/${id}`);
  },

  getByTailor: async (tailorId) => {
    return apiCall(`/designs/tailor/${tailorId}`);
  },

  create: async (designData) => {
    return apiCall('/designs', {
      method: 'POST',
      body: designData,
      requireAuth: true
    });
  },

  update: async (id, designData) => {
    return apiCall(`/designs/${id}`, {
      method: 'PUT',
      body: designData,
      requireAuth: true
    });
  },

  delete: async (id) => {
    return apiCall(`/designs/${id}`, {
      method: 'DELETE',
      requireAuth: true
    });
  }
};

// ============ BOOKINGS API ============
const BookingsAPI = {
  getAll: async () => {
    return apiCall('/bookings', { requireAuth: true });
  },

  getById: async (id) => {
    return apiCall(`/bookings/${id}`, { requireAuth: true });
  },

  create: async (bookingData) => {
    return apiCall('/bookings', {
      method: 'POST',
      body: bookingData
    });
  },

  updateStatus: async (id, status) => {
    return apiCall(`/bookings/${id}/status`, {
      method: 'PUT',
      body: { status },
      requireAuth: true
    });
  },

  getAnalytics: async (startDate, endDate) => {
    return apiCall(`/bookings/analytics/date-range?startDate=${startDate}&endDate=${endDate}`, {
      requireAuth: true
    });
  }
};

// ============ TAILORS API ============
const TailorsAPI = {
  getAll: async () => {
    return apiCall('/tailors');
  },

  getProfile: async (id) => {
    return apiCall(`/tailors/profile/${id}`);
  },

  updateProfile: async (profileData) => {
    return apiCall('/tailors/profile/update', {
      method: 'PUT',
      body: profileData,
      requireAuth: true
    });
  },

  getDashboardStats: async () => {
    return apiCall('/tailors/stats/dashboard', { requireAuth: true });
  }
};

// Export all APIs
const API = {
  auth: AuthAPI,
  designs: DesignsAPI,
  bookings: BookingsAPI,
  tailors: TailorsAPI,
  tokenManager: TokenManager
};

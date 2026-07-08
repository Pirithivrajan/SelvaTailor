/**
 * API Integration for SelvaTailor Frontend
 * This file should be placed in your frontend project
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

// Store JWT token
const setToken = (token) => {
  localStorage.setItem('token', token);
};

const getToken = () => {
  return localStorage.getItem('token');
};

const clearToken = () => {
  localStorage.removeItem('token');
};

// Auth API calls
const authAPI = {
  register: async (data) => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (json.token) setToken(json.token);
    return json;
  },

  login: async (loginId, password) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId, password })
    });
    const json = await res.json();
    if (json.token) setToken(json.token);
    return json;
  },

  logout: async () => {
    clearToken();
    return { message: 'Logged out' };
  },

  getCurrentTailor: async () => {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    return res.json();
  }
};

// Designs API calls
const designsAPI = {
  getAll: async () => {
    const res = await fetch(`${API_BASE_URL}/designs`);
    return res.json();
  },

  getById: async (id) => {
    const res = await fetch(`${API_BASE_URL}/designs/${id}`);
    return res.json();
  },

  getByTailor: async (tailorId) => {
    const res = await fetch(`${API_BASE_URL}/designs/tailor/${tailorId}`);
    return res.json();
  },

  create: async (data) => {
    const res = await fetch(`${API_BASE_URL}/designs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  update: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/designs/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  delete: async (id) => {
    const res = await fetch(`${API_BASE_URL}/designs/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    return res.json();
  }
};

// Bookings API calls
const bookingsAPI = {
  getAll: async () => {
    const res = await fetch(`${API_BASE_URL}/bookings`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    return res.json();
  },

  getById: async (id) => {
    const res = await fetch(`${API_BASE_URL}/bookings/${id}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    return res.json();
  },

  create: async (data) => {
    const res = await fetch(`${API_BASE_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  updateStatus: async (id, status) => {
    const res = await fetch(`${API_BASE_URL}/bookings/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ status })
    });
    return res.json();
  },

  getAnalytics: async (startDate, endDate) => {
    const res = await fetch(
      `${API_BASE_URL}/bookings/analytics/date-range?startDate=${startDate}&endDate=${endDate}`,
      { headers: { 'Authorization': `Bearer ${getToken()}` } }
    );
    return res.json();
  }
};

// Tailors API calls
const tailorsAPI = {
  getAll: async () => {
    const res = await fetch(`${API_BASE_URL}/tailors`);
    return res.json();
  },

  getProfile: async (id) => {
    const res = await fetch(`${API_BASE_URL}/tailors/profile/${id}`);
    return res.json();
  },

  updateProfile: async (data) => {
    const res = await fetch(`${API_BASE_URL}/tailors/profile/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  getDashboardStats: async () => {
    const res = await fetch(`${API_BASE_URL}/tailors/stats/dashboard`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    return res.json();
  }
};

export { authAPI, designsAPI, bookingsAPI, tailorsAPI, getToken, setToken, clearToken };

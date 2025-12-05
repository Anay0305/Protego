/**
 * API Service for Protego Frontend
 * Handles all HTTP requests to the FastAPI backend
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth tokens (if needed in future)
api.interceptors.request.use(
  (config) => {
    // TODO: Add authentication token if needed
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ==================== User API ====================

export const userAPI = {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise} User object
   */
  register: async (userData) => {
    const response = await api.post('/api/users/register', userData);
    return response.data;
  },

  /**
   * Get user by ID
   * @param {number} userId - User ID
   * @returns {Promise} User object
   */
  getUser: async (userId) => {
    const response = await api.get(`/api/users/${userId}`);
    return response.data;
  },

  /**
   * Update user information
   * @param {number} userId - User ID
   * @param {Object} userData - Updated user data
   * @returns {Promise} Updated user object
   */
  updateUser: async (userId, userData) => {
    const response = await api.put(`/api/users/${userId}`, userData);
    return response.data;
  },

  /**
   * Delete user
   * @param {number} userId - User ID
   * @returns {Promise}
   */
  deleteUser: async (userId) => {
    await api.delete(`/api/users/${userId}`);
  },

  /**
   * List all users
   * @param {Object} params - Query parameters (skip, limit)
   * @returns {Promise} Array of users
   */
  listUsers: async (params = {}) => {
    const response = await api.get('/api/users/', { params });
    return response.data;
  },
};

// ==================== Walk Session API ====================

export const walkAPI = {
  /**
   * Start a new walk session
   * @param {Object} sessionData - Session start data
   * @returns {Promise} Walk session object
   */
  startWalk: async (sessionData) => {
    const response = await api.post('/api/walk/start', sessionData);
    return response.data;
  },

  /**
   * Stop an active walk session
   * @param {number} sessionId - Session ID
   * @returns {Promise} Updated walk session object
   */
  stopWalk: async (sessionId) => {
    const response = await api.post('/api/walk/stop', { session_id: sessionId });
    return response.data;
  },

  /**
   * Get walk session by ID
   * @param {number} sessionId - Session ID
   * @returns {Promise} Walk session object
   */
  getSession: async (sessionId) => {
    const response = await api.get(`/api/walk/${sessionId}`);
    return response.data;
  },

  /**
   * Get all walk sessions for a user
   * @param {number} userId - User ID
   * @param {boolean} activeOnly - If true, only return active sessions
   * @returns {Promise} Array of walk sessions
   */
  getUserSessions: async (userId, activeOnly = false) => {
    const response = await api.get(`/api/walk/user/${userId}`, {
      params: { active_only: activeOnly },
    });
    return response.data;
  },

  /**
   * Get active walk session for a user
   * @param {number} userId - User ID
   * @returns {Promise} Active walk session object
   */
  getActiveSession: async (userId) => {
    const response = await api.get(`/api/walk/user/${userId}/active`);
    return response.data;
  },
};

// ==================== Alert API ====================

export const alertAPI = {
  /**
   * Create a new alert
   * @param {Object} alertData - Alert data
   * @returns {Promise} Created alert object
   */
  createAlert: async (alertData) => {
    const response = await api.post('/api/alerts/', alertData);
    return response.data;
  },

  /**
   * Create an instant emergency alert (triggers immediately without countdown)
   * Used for voice-activated emergencies
   * @param {Object} alertData - Alert data
   * @returns {Promise} Created and triggered alert object
   */
  createInstantAlert: async (alertData) => {
    const response = await api.post('/api/alerts/instant', alertData);
    return response.data;
  },

  /**
   * Cancel a pending alert
   * @param {number} alertId - Alert ID
   * @returns {Promise} Success response
   */
  cancelAlert: async (alertId) => {
    const response = await api.post('/api/alerts/cancel', { alert_id: alertId });
    return response.data;
  },

  /**
   * Get alert by ID
   * @param {number} alertId - Alert ID
   * @returns {Promise} Alert object
   */
  getAlert: async (alertId) => {
    const response = await api.get(`/api/alerts/${alertId}`);
    return response.data;
  },

  /**
   * Get all alerts for a user
   * @param {number} userId - User ID
   * @param {Object} params - Query parameters (skip, limit)
   * @returns {Promise} Array of alerts
   */
  getUserAlerts: async (userId, params = {}) => {
    const response = await api.get(`/api/alerts/user/${userId}`, { params });
    return response.data;
  },

  /**
   * Get all alerts for a session
   * @param {number} sessionId - Session ID
   * @returns {Promise} Array of alerts
   */
  getSessionAlerts: async (sessionId) => {
    const response = await api.get(`/api/alerts/session/${sessionId}`);
    return response.data;
  },

  /**
   * Get list of pending alert IDs
   * @returns {Promise} Array of alert IDs
   */
  getPendingAlerts: async () => {
    const response = await api.get('/api/alerts/pending/list');
    return response.data;
  },
};

// ==================== Admin API ====================

export const adminAPI = {
  /**
   * List all alerts (admin)
   * @param {Object} params - Query parameters (status_filter, skip, limit)
   * @returns {Promise} Array of alerts
   */
  listAlerts: async (params = {}) => {
    const response = await api.get('/api/admin/alerts', { params });
    return response.data;
  },

  /**
   * Get detailed alert information (admin)
   * @param {number} alertId - Alert ID
   * @returns {Promise} Detailed alert information
   */
  getAlertDetails: async (alertId) => {
    const response = await api.get(`/api/admin/alerts/${alertId}/details`);
    return response.data;
  },

  /**
   * Get system statistics (admin)
   * @returns {Promise} System stats object
   */
  getStats: async () => {
    const response = await api.get('/api/admin/stats');
    return response.data;
  },

  /**
   * Get active users (admin)
   * @returns {Promise} Array of active users with sessions
   */
  getActiveUsers: async () => {
    const response = await api.get('/api/admin/users/active');
    return response.data;
  },

  /**
   * Get recent alerts (admin)
   * @param {number} hours - Number of hours to look back
   * @returns {Promise} Recent alerts data
   */
  getRecentAlerts: async (hours = 24) => {
    const response = await api.get('/api/admin/alerts/recent', {
      params: { hours },
    });
    return response.data;
  },
};

// ==================== Health Check ====================

export const healthAPI = {
  /**
   * Check API health
   * @returns {Promise} Health status
   */
  check: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};

export default api;

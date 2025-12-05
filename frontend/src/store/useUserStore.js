/**
 * Zustand Store for Global State Management
 * Manages user data, walk session, and alerts
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUserStore = create(
  persist(
    (set, get) => ({
      // ==================== User State ====================
      user: null,
      isAuthenticated: false,

      /**
       * Set current user
       * @param {Object} user - User object
       */
      setUser: (user) => set({ user, isAuthenticated: !!user }),

      /**
       * Update user data
       * @param {Object} updates - Partial user data to update
       */
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      /**
       * Clear user data (logout)
       */
      clearUser: () => set({ user: null, isAuthenticated: false }),

      // ==================== Walk Session State ====================
      activeSession: null,
      isWalking: false,

      /**
       * Start a walk session
       * @param {Object} session - Walk session object
       */
      startSession: (session) =>
        set({ activeSession: session, isWalking: true }),

      /**
       * Stop the current walk session
       */
      stopSession: () => set({ activeSession: null, isWalking: false }),

      /**
       * Update active session data
       * @param {Object} updates - Partial session data to update
       */
      updateSession: (updates) =>
        set((state) => ({
          activeSession: state.activeSession
            ? { ...state.activeSession, ...updates }
            : null,
        })),

      // ==================== Alert State ====================
      pendingAlert: null,
      countdown: null,

      /**
       * Set pending alert
       * @param {Object} alert - Alert object
       */
      setPendingAlert: (alert) => set({ pendingAlert: alert }),

      /**
       * Clear pending alert
       */
      clearPendingAlert: () => set({ pendingAlert: null, countdown: null }),

      /**
       * Set countdown value
       * @param {number} seconds - Countdown seconds remaining
       */
      setCountdown: (seconds) => set({ countdown: seconds }),

      // ==================== Recent Alerts ====================
      recentAlerts: [],

      /**
       * Add alert to recent alerts
       * @param {Object} alert - Alert object
       */
      addAlert: (alert) =>
        set((state) => ({
          recentAlerts: [alert, ...state.recentAlerts].slice(0, 50), // Keep last 50
        })),

      /**
       * Set recent alerts
       * @param {Array} alerts - Array of alert objects
       */
      setRecentAlerts: (alerts) => set({ recentAlerts: alerts }),

      /**
       * Update a specific alert
       * @param {number} alertId - Alert ID
       * @param {Object} updates - Updates to apply
       */
      updateAlert: (alertId, updates) =>
        set((state) => ({
          recentAlerts: state.recentAlerts.map((alert) =>
            alert.id === alertId ? { ...alert, ...updates } : alert
          ),
        })),

      // ==================== UI State ====================
      loading: false,
      error: null,

      /**
       * Set loading state
       * @param {boolean} isLoading - Loading state
       */
      setLoading: (isLoading) => set({ loading: isLoading }),

      /**
       * Set error
       * @param {string|null} error - Error message
       */
      setError: (error) => set({ error }),

      /**
       * Clear error
       */
      clearError: () => set({ error: null }),
    }),
    {
      name: 'protego-storage', // LocalStorage key
      partialize: (state) => ({
        // Only persist certain fields
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// ==================== Admin Store ====================

export const useAdminStore = create((set) => ({
  stats: null,
  allAlerts: [],
  activeUsers: [],

  /**
   * Set system statistics
   * @param {Object} stats - Stats object
   */
  setStats: (stats) => set({ stats }),

  /**
   * Set all alerts
   * @param {Array} alerts - Array of all alerts
   */
  setAllAlerts: (alerts) => set({ allAlerts: alerts }),

  /**
   * Set active users
   * @param {Array} users - Array of active users
   */
  setActiveUsers: (users) => set({ activeUsers: users }),

  /**
   * Clear admin data
   */
  clearAdminData: () =>
    set({ stats: null, allAlerts: [], activeUsers: [] }),
}));

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  trusted_contacts: string[];
  created_at: string;
}

interface WalkSession {
  id: number;
  user_id: number;
  start_time: string;
  end_time: string | null;
  status: string;
}

interface PendingAlert {
  id: number;
  type: string;
  timestamp: string;
}

interface UserStore {
  user: User | null;
  isAuthenticated: boolean;
  activeSession: WalkSession | null;
  isWalking: boolean;
  pendingAlert: PendingAlert | null;
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;
  clearUser: () => void;
  startSession: (session: WalkSession) => void;
  stopSession: () => void;
  setPendingAlert: (alert: PendingAlert | null) => void;
  clearPendingAlert: () => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      activeSession: null,
      isWalking: false,
      pendingAlert: null,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
      clearUser: () => set({
        user: null,
        isAuthenticated: false,
        activeSession: null,
        isWalking: false,
        pendingAlert: null
      }),

      startSession: (session) =>
        set({ activeSession: session, isWalking: true }),
      stopSession: () => set({ activeSession: null, isWalking: false }),

      setPendingAlert: (alert) => set({ pendingAlert: alert }),
      clearPendingAlert: () => set({ pendingAlert: null }),
    }),
    {
      name: 'protego-store',
    }
  )
);

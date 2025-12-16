import axios, { AxiosResponse } from 'axios';

interface WalkData {
  user_id: number;
  location_lat: number | null;
  location_lng: number | null;
}

interface WalkSession {
  id: number;
  user_id: number;
  start_time: string;
  end_time: string | null;
  status: string;
}

interface AlertData {
  user_id: number;
  session_id: number | null;
  type: string;
  confidence: number;
  location_lat: number | null;
  location_lng: number | null;
}

interface Alert {
  id: number;
  user_id: number;
  session_id: number | null;
  type: string;
  confidence: number;
  location_lat: number | null;
  location_lng: number | null;
  created_at: string;
  status: string;
}

interface UserData {
  email: string;
  password: string;
  name?: string;
  phone?: string;
  trusted_contacts?: string[];
}

interface User {
  id: number;
  email: string;
  name: string;
  phone: string;
  trusted_contacts: string[];
  created_at: string;
}

interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

interface TrustedContact {
  phone: string;
  name?: string;
}

// Use /api proxy in development, full URL in production
const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ||
  (import.meta.env.MODE === 'development' ? '/api' : 'http://localhost:8000');

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('access_token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Walk API
export const walkAPI = {
  startWalk: (data: WalkData): Promise<AxiosResponse<WalkSession>> =>
    api.post('/walk/start', data),
  stopWalk: (sessionId: number): Promise<AxiosResponse<WalkSession>> =>
    api.post('/walk/stop', { session_id: sessionId }),
  getActiveSession: (userId: number): Promise<AxiosResponse<WalkSession>> =>
    api.get(`/walk/active/${userId}`),
};

// Alert API
export const alertAPI = {
  createAlert: (data: AlertData): Promise<AxiosResponse<Alert>> =>
    api.post('/alerts/', data),
  createInstantAlert: (data: AlertData): Promise<AxiosResponse<Alert>> =>
    api.post('/alerts/instant', data),
  getAlert: (alertId: number): Promise<AxiosResponse<Alert>> =>
    api.get(`/alerts/${alertId}`),
  cancelAlert: (alertId: number): Promise<AxiosResponse<Alert>> =>
    api.post(`/alerts/${alertId}/cancel`, {}),
};

// User API
export const userAPI = {
  signup: (userData: UserData): Promise<AxiosResponse<AuthResponse>> =>
    api.post('/users/signup', userData),
  signin: (credentials: { email: string; password: string }): Promise<AxiosResponse<AuthResponse>> =>
    api.post('/users/signin', credentials),
  getProfile: (): Promise<AxiosResponse<User>> =>
    api.get('/users/me'),
  updateProfile: (updates: Partial<User>): Promise<AxiosResponse<User>> =>
    api.put('/users/me', updates),
  getTrustedContacts: (): Promise<AxiosResponse<string[]>> =>
    api.get('/users/me/trusted-contacts'),
  addTrustedContact: (contact: TrustedContact): Promise<AxiosResponse<User>> =>
    api.post('/users/me/trusted-contacts', contact),
  removeTrustedContact: (phone: string): Promise<AxiosResponse<User>> =>
    api.delete('/users/me/trusted-contacts', { data: { phone } }),
};

export type { User, AuthResponse, UserData, TrustedContact };

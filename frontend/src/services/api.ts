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
}

interface User {
  id: number;
  email: string;
  name: string;
  phone: string;
  created_at: string;
}

const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Walk API
export const walkAPI = {
  startWalk: (data: WalkData): Promise<AxiosResponse<WalkSession>> =>
    api.post('/api/walks/start', data),
  stopWalk: (sessionId: number): Promise<AxiosResponse<WalkSession>> =>
    api.post('/api/walks/stop', { session_id: sessionId }),
  getActiveSession: (userId: number): Promise<AxiosResponse<WalkSession>> =>
    api.get(`/api/walks/active/${userId}`),
};

// Alert API
export const alertAPI = {
  createAlert: (data: AlertData): Promise<AxiosResponse<Alert>> =>
    api.post('/api/alerts/', data),
  createInstantAlert: (data: AlertData): Promise<AxiosResponse<Alert>> =>
    api.post('/api/alerts/instant', data),
  getAlert: (alertId: number): Promise<AxiosResponse<Alert>> =>
    api.get(`/api/alerts/${alertId}`),
  cancelAlert: (alertId: number): Promise<AxiosResponse<Alert>> =>
    api.post(`/api/alerts/${alertId}/cancel`, {}),
};

// User API
export const userAPI = {
  register: (userData: UserData): Promise<AxiosResponse<User>> =>
    api.post('/api/users/register', userData),
  login: (credentials: { email: string; password: string }): Promise<AxiosResponse<User>> =>
    api.post('/api/users/login', credentials),
  getProfile: (userId: number): Promise<AxiosResponse<User>> =>
    api.get(`/api/users/${userId}`),
};

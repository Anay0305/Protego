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
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url} (Token: ${token.substring(0, 20)}...)`);
    } else {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url} (No token)`);
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

// AI API Types
interface AudioAnalysisResponse {
  transcription: string;
  distress_detected: boolean;
  distress_type: string;
  confidence: number;
  keywords_found: string[];
  alert_triggered: boolean;
  alert_id: number | null;
}

interface SafetySummaryResponse {
  summary: string;
  risk_level: string;
  recommendations: string[];
  alerts_analysis: string;
  session_duration_minutes: number;
  total_alerts: number;
}

interface ChatResponse {
  response: string;
  timestamp: string;
}

interface QuickAnalysisResponse {
  is_emergency: boolean;
  confidence: number;
  distress_type: string;
  analysis: string;
  recommended_action: string;
}

interface AIStatusResponse {
  whisper_configured: boolean;
  megallm_configured: boolean;
  realtime_configured: boolean;
  test_mode: boolean;
  model: string;
  confidence_threshold: number;
}

interface RealtimeConfigResponse {
  ws_url: string;
  deployment: string;
  instructions: string;
}

interface LocationSafetyResponse {
  safety_score: number;
  status: string; // safe, caution, alert
  risk_level: string; // low, medium, high
  factors: string[];
  recommendations: string[];
  time_context?: {
    hour: number;
    is_night: boolean;
    is_late_night: boolean;
    day_of_week: string;
  };
  analyzed_at: string;
}

// AI API
export const aiAPI = {
  // Analyze audio file for distress
  analyzeAudio: (
    audioBlob: Blob,
    sessionId?: number | null,
    locationLat?: number | null,
    locationLng?: number | null
  ): Promise<AxiosResponse<AudioAnalysisResponse>> => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    if (sessionId) formData.append('session_id', sessionId.toString());
    if (locationLat) formData.append('location_lat', locationLat.toString());
    if (locationLng) formData.append('location_lng', locationLng.toString());

    return api.post('/ai/analyze/audio', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000, // 60 second timeout for audio processing
    });
  },

  // Analyze text for safety concerns
  analyzeText: (
    text: string,
    context?: string
  ): Promise<AxiosResponse<QuickAnalysisResponse>> =>
    api.post('/ai/analyze/text', { text, context }),

  // Get safety summary for a session
  getSessionSummary: (sessionId: number): Promise<AxiosResponse<SafetySummaryResponse>> =>
    api.get(`/ai/summary/session/${sessionId}`),

  // Get latest session summary
  getLatestSummary: (): Promise<AxiosResponse<SafetySummaryResponse>> =>
    api.get('/ai/summary/latest'),

  // Chat with AI safety assistant
  chat: (
    message: string,
    conversationHistory?: Array<{ role: string; content: string }>
  ): Promise<AxiosResponse<ChatResponse>> =>
    api.post('/ai/chat', { message, conversation_history: conversationHistory }),

  // Get safety tips
  getSafetyTips: (): Promise<AxiosResponse<{ tips: string; generated_at: string }>> =>
    api.get('/ai/tips'),

  // Get AI service status
  getStatus: (): Promise<AxiosResponse<AIStatusResponse>> =>
    api.get('/ai/status'),

  // Analyze location safety
  analyzeLocation: (
    latitude: number,
    longitude: number,
    timestamp?: string,
    context?: string
  ): Promise<AxiosResponse<LocationSafetyResponse>> =>
    api.post('/ai/analyze/location', { latitude, longitude, timestamp, context }),

  // Get realtime WebSocket configuration
  getRealtimeConfig: (): Promise<AxiosResponse<RealtimeConfigResponse>> =>
    api.get('/ai/realtime/config'),
};

export type {
  User,
  AuthResponse,
  UserData,
  TrustedContact,
  AudioAnalysisResponse,
  SafetySummaryResponse,
  ChatResponse,
  QuickAnalysisResponse,
  AIStatusResponse,
  LocationSafetyResponse,
  RealtimeConfigResponse,
};

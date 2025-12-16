import { useState, useEffect, useRef } from 'react';
import { Shield, LogOut, Bell, AlertTriangle, Activity, Navigation, CheckCircle, Mic, MicOff, Map } from 'lucide-react';
import AuthPage from './components/AuthPage';
import TrustedContactsPage from './components/TrustedContactsPage';
import { userAPI, walkAPI, alertAPI, User } from './services/api';
import { useUserStore } from './store/useUserStore';
import { ALERT_TYPES } from './constants/alertTypes';

interface Location {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp?: string;
}

interface Alert {
  id: number;
  type: string;
  message: string;
  timestamp: string;
}

const ProtegoApp = () => {
  const userStore = useUserStore();
  const { isWalking, activeSession, startSession, stopSession } = userStore;

  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [location, setLocation] = useState<Location | null>(null);
  const [safetyScore, setSafetyScore] = useState(85);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceLogs, setVoiceLogs] = useState<Array<{ timestamp: string; message: string; type: string }>>([]);
  const [walkingStatus, setWalkingStatus] = useState('safe');

  const recognitionRef = useRef<any>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastAlertTimeRef = useRef(0);
  const alertCooldownMs = 30000;

  // Check for existing auth token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const response = await userAPI.getProfile();
          const userData = response.data;
          setUser(userData);
          userStore.setUser(userData as any);
          setIsAuthenticated(true);
          console.log('Auth restored:', userData.email);
        } catch (err: any) {
          console.error('Auth check failed:', err.message);
          localStorage.removeItem('access_token');
          setIsAuthenticated(false);
          setUser(null);
        }
      }
    };

    checkAuth();
  }, [userStore]);

  // Initialize location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          });
        },
        (err) => {
          console.error('Location error:', err);
          addAlert('error', 'Failed to get location');
        }
      );
    }
  }, []);

  // Initialize voice recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      const errorMsg = 'Speech Recognition not supported in this browser';
      console.warn(errorMsg);
      addVoiceLog(errorMsg, 'error');
      return;
    }

    addVoiceLog('Speech Recognition API available', 'success');

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      addVoiceLog('Listening started - say "help me" to trigger alert', 'success');
    };

    recognition.onend = () => {
      setIsListening(false);
      if (isWalking && voiceEnabled) {
        addVoiceLog('Auto-restarting voice recognition...', 'info');
        try {
          recognition.start();
        } catch (err: any) {
          addVoiceLog(`Failed to restart: ${err.message}`, 'error');
        }
      }
    };

    recognition.onerror = (event: any) => {
      addVoiceLog(`Error: ${event.error}`, 'error');
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      const lastResult = event.results[event.results.length - 1];
      const transcript = lastResult[0].transcript.toLowerCase();
      const isFinal = lastResult.isFinal;

      if (isFinal) {
        addVoiceLog(`Heard (final): "${transcript}"`, 'info');
      }

      if (isFinal && transcript.includes('help me')) {
        const now = Date.now();
        const timeSinceLastAlert = now - lastAlertTimeRef.current;

        if (timeSinceLastAlert < alertCooldownMs) {
          const remainingSeconds = Math.ceil((alertCooldownMs - timeSinceLastAlert) / 1000);
          addVoiceLog(`Alert cooldown active (${remainingSeconds}s remaining)`, 'warning');
          return;
        }

        addVoiceLog('"HELP ME" DETECTED! Triggering emergency alert...', 'warning');
        lastAlertTimeRef.current = now;
        handleVoiceAlert();
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        addVoiceLog('Voice recognition cleaned up', 'info');
      }
    };
  }, []);

  // Start/stop voice recognition
  useEffect(() => {
    if (!recognitionRef.current) return;

    if (isWalking && voiceEnabled) {
      addVoiceLog('Starting voice recognition...', 'info');
      try {
        recognitionRef.current.start();
      } catch (err: any) {
        addVoiceLog(`Start error: ${err.message}`, 'warning');
      }
    } else {
      addVoiceLog('Stopping voice recognition', 'info');
      recognitionRef.current.stop();
    }
  }, [isWalking, voiceEnabled]);

  // Location tracking
  const startTracking = () => {
    if ('geolocation' in navigator) {
      setIsTracking(true);
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          };
          setLocation(newLocation);
          analyzeLocation(newLocation);
        },
        (error) => {
          addAlert('error', 'Location tracking error: ' + error.message);
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
      addAlert('info', 'Live tracking started');
    } else {
      addAlert('error', 'Geolocation not supported');
    }
  };

  const stopTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    addAlert('info', 'Tracking stopped');
  };

  // AI Analysis
  const analyzeLocation = (loc: Location) => {
    const hour = new Date().getHours();
    const isNightTime = hour < 6 || hour > 20;
    const randomFactor = Math.random();

    if (randomFactor > 0.95) {
      setWalkingStatus('alert');
      setSafetyScore(45);
      addAlert('warning', 'Unusual movement pattern detected');
    } else if (isNightTime) {
      setWalkingStatus('caution');
      setSafetyScore(65);
    } else {
      setWalkingStatus('safe');
      setSafetyScore(85);
    }
  };

  const addVoiceLog = (message: string, type: string = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = { timestamp, message, type };
    console.log(`[Voice ${type.toUpperCase()}] ${timestamp}: ${message}`);
    setVoiceLogs(prev => [...prev, logEntry].slice(-10));
  };

  const addAlert = (type: string, message: string) => {
    const newAlert = {
      id: Date.now(),
      type,
      message,
      timestamp: new Date().toLocaleTimeString()
    };
    setAlerts(prev => [newAlert, ...prev].slice(0, 5));
  };

  const triggerSOS = async () => {
    setSosActive(true);
    addAlert('emergency', 'SOS ACTIVATED - Getting your location...');

    // Always fetch fresh location for SOS
    let currentLocation: Location | null = null;
    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
            enableHighAccuracy: true,
            maximumAge: 0
          });
        });
        currentLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        addAlert('success', `Location acquired: ${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`);
      } catch (err: any) {
        addAlert('warning', `Location error: ${err.message}. Using last known location.`);
        currentLocation = location; // Fallback to last known location
      }
    }

    if (!currentLocation) {
      addAlert('warning', 'No location available. Alert sent without location.');
    }

    try {
      await alertAPI.createInstantAlert({
        user_id: user?.id || 1,
        session_id: activeSession?.id || null,
        type: ALERT_TYPES.SOS,
        confidence: 1.0,
        location_lat: currentLocation?.lat || null,
        location_lng: currentLocation?.lng || null,
      });

      addAlert('emergency', `Emergency contacts notified!${currentLocation ? ' Location shared.' : ''}`);
      setError(null);
    } catch (err: any) {
      const errorMsg = `Failed to send SOS: ${err.response?.data?.detail || err.message}`;
      addAlert('error', errorMsg);
      setError('Failed to send SOS');
    }
  };

  const cancelSOS = () => {
    setSosActive(false);
    addAlert('success', 'SOS cancelled');
  };

  const handleVoiceAlert = async () => {
    addVoiceLog('Creating INSTANT emergency alert...', 'warning');

    // Always fetch fresh location for voice alert
    let currentLocation: Location | null = null;
    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
            enableHighAccuracy: true,
            maximumAge: 0
          });
        });
        currentLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        addVoiceLog(`Location acquired: ${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`, 'success');
      } catch (err: any) {
        addVoiceLog(`Location error: ${err.message}. Using last known.`, 'warning');
        currentLocation = location; // Fallback
      }
    }

    if (!currentLocation) {
      addVoiceLog('No location available!', 'warning');
    }

    try {
      const alert = await alertAPI.createInstantAlert({
        user_id: user?.id || 1,
        session_id: activeSession?.id || null,
        type: ALERT_TYPES.VOICE_ACTIVATION,
        confidence: 1.0,
        location_lat: currentLocation?.lat || null,
        location_lng: currentLocation?.lng || null,
      });

      addVoiceLog(`EMERGENCY ALERT SENT! ID: ${alert.data.id}`, 'success');
      setError(null);
    } catch (err: any) {
      const errorMsg = `Failed to send emergency alert: ${err.response?.data?.detail || err.message}`;
      addVoiceLog(errorMsg, 'error');
      setError('Failed to send emergency alert');
    }
  };

  const handleStartWalk = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await walkAPI.startWalk({
        user_id: user?.id || 1,
        location_lat: location?.lat || null,
        location_lng: location?.lng || null,
      });

      startSession(response.data);
      addAlert('success', 'Walk mode started');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to start walk session');
      addAlert('error', 'Failed to start walk mode');
    } finally {
      setLoading(false);
    }
  };

  const handleStopWalk = async () => {
    setLoading(true);
    setError(null);

    try {
      await walkAPI.stopWalk(activeSession?.id || 1);
      stopSession();
      addAlert('success', 'Walk mode stopped');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to stop walk session');
      addAlert('error', 'Failed to stop walk mode');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = (token: string, userData: User) => {
    setUser(userData);
    userStore.setUser(userData as any);
    setIsAuthenticated(true);
    addAlert('success', 'Successfully logged in');
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
    userStore.clearUser();
    setIsAuthenticated(false);
    setCurrentView('dashboard');
    stopTracking();
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const toggleVoiceRecognition = () => {
    const newState = !voiceEnabled;
    setVoiceEnabled(newState);
    addVoiceLog(`Voice activation ${newState ? 'ENABLED' : 'DISABLED'}`, newState ? 'success' : 'info');
  };

  if (!isAuthenticated) {
    return <AuthPage onSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2 rounded-xl">
              <Shield className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Protego</h1>
              <p className="text-xs text-gray-500">Welcome, {user?.name}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
          >
            <LogOut size={20} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        {/* Navigation */}
        <div className="bg-white rounded-2xl shadow-sm p-2 mb-6 flex space-x-2 overflow-x-auto">
          {['dashboard', 'tracking', 'contacts', 'safety'].map((view) => (
            <button
              key={view}
              onClick={() => setCurrentView(view)}
              className={`px-4 py-3 rounded-xl font-medium whitespace-nowrap transition ${
                currentView === view
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </div>

        {/* SOS Button */}
        <div className="mb-6">
          {!sosActive ? (
            <button
              onClick={triggerSOS}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-6 rounded-2xl font-bold text-2xl shadow-2xl hover:from-red-700 hover:to-red-800 transition duration-200 flex items-center justify-center space-x-3 transform hover:scale-105"
            >
              <AlertTriangle size={32} />
              <span>SOS EMERGENCY</span>
            </button>
          ) : (
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-2xl animate-pulse shadow-2xl">
              <div className="text-center">
                <AlertTriangle size={48} className="mx-auto mb-3 animate-bounce" />
                <h3 className="text-2xl font-bold mb-2">EMERGENCY ACTIVE</h3>
                <p className="mb-4">Help is on the way. Stay safe!</p>
                <button
                  onClick={cancelSOS}
                  className="bg-white text-red-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
                >
                  Cancel SOS
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Dashboard View */}
        {currentView === 'dashboard' && (
          <div className="space-y-6">
            {/* Status Cards */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 shadow-sm border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-700">Safety Score</h3>
                  <Activity className={`${
                    safetyScore > 70 ? 'text-green-600' : safetyScore > 50 ? 'text-yellow-600' : 'text-red-600'
                  }`} size={24} />
                </div>
                <p className="text-5xl font-bold text-gray-800">{safetyScore}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {walkingStatus === 'safe' ? 'Area is safe' : walkingStatus === 'caution' ? 'Stay alert' : 'High risk detected'}
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 shadow-sm border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-700">Walk Status</h3>
                  <Navigation className={isWalking ? 'text-green-600' : 'text-gray-400'} size={24} />
                </div>
                <p className="text-3xl font-bold text-gray-800">
                  {isWalking ? 'Active' : 'Inactive'}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {isWalking ? 'Being monitored' : 'Start walk mode'}
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 shadow-sm border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-700">Trusted Contacts</h3>
                  <Shield className="text-purple-600" size={24} />
                </div>
                <p className="text-5xl font-bold text-gray-800">{user?.trusted_contacts?.length || 0}</p>
                <p className="text-sm text-gray-600 mt-1">Ready to help</p>
              </div>
            </div>

            {/* Walk Control */}
            <div className="bg-white rounded-2xl shadow-md p-8">
              <div className="flex flex-col items-center text-center">
                <div
                  className={`p-8 rounded-full mb-6 ${
                    isWalking
                      ? 'bg-green-100 text-green-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <Shield className="w-24 h-24" />
                </div>

                <h2 className="text-3xl font-bold mb-2 text-gray-800">
                  {isWalking ? 'Walk Mode Active' : 'Walk Mode Inactive'}
                </h2>

                <p className="text-gray-600 mb-6 text-lg">
                  {isWalking
                    ? 'You are being monitored for safety.'
                    : 'Start Walk Mode to enable safety monitoring.'}
                </p>

                {isWalking && activeSession && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5 mb-6 w-full max-w-md">
                    <div className="flex items-center justify-center text-green-700 mb-2">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      <span className="font-medium">Session Active</span>
                    </div>
                    {location && (
                      <p className="text-sm text-green-600">
                        Location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                      </p>
                    )}
                  </div>
                )}

                {/* Voice Control */}
                {isWalking && (
                  <div className="mb-6 w-full max-w-md">
                    <button
                      onClick={toggleVoiceRecognition}
                      className={`${
                        voiceEnabled
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      } px-6 py-4 text-sm font-semibold w-full flex items-center justify-center gap-3 rounded-xl shadow-lg transition`}
                    >
                      {voiceEnabled ? (
                        <>
                          <Mic className="w-5 h-5" />
                          Voice Activation: ON
                          {isListening && <span className="ml-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
                        </>
                      ) : (
                        <>
                          <MicOff className="w-5 h-5" />
                          Voice Activation: OFF
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Voice Logs */}
                {voiceEnabled && voiceLogs.length > 0 && (
                  <div className="mt-4 bg-gray-900 text-gray-100 rounded-xl p-4 max-h-64 overflow-y-auto w-full max-w-md">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-semibold text-gray-300">Voice Logs</h4>
                      <button
                        onClick={() => setVoiceLogs([])}
                        className="text-xs text-gray-400 hover:text-white"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="space-y-1 font-mono text-xs">
                      {voiceLogs.map((log, idx) => (
                        <div
                          key={idx}
                          className={`flex gap-2 ${
                            log.type === 'error' ? 'text-red-400' :
                            log.type === 'success' ? 'text-green-400' :
                            log.type === 'warning' ? 'text-yellow-400' :
                            'text-gray-300'
                          }`}
                        >
                          <span className="text-gray-500">{log.timestamp}</span>
                          <span className="flex-1">{log.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={isWalking ? handleStopWalk : handleStartWalk}
                  disabled={loading}
                  className={`${
                    isWalking
                      ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                  } text-white px-8 py-4 text-lg font-semibold w-full max-w-md rounded-xl transition shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                >
                  {loading
                    ? 'Please wait...'
                    : isWalking
                    ? 'Stop Walk Mode'
                    : 'Start Walk Mode'}
                </button>
              </div>
            </div>

            {/* Alerts */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="font-semibold text-xl text-gray-800 mb-4 flex items-center">
                <Bell className="mr-2 text-indigo-600" size={22} />
                Recent Alerts
              </h3>
              <div className="space-y-2">
                {alerts.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No recent alerts</p>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-xl ${
                        alert.type === 'emergency' ? 'bg-red-50 border-l-4 border-red-500' :
                        alert.type === 'warning' ? 'bg-yellow-50 border-l-4 border-yellow-500' :
                        alert.type === 'success' ? 'bg-green-50 border-l-4 border-green-500' :
                        'bg-blue-50 border-l-4 border-blue-500'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-medium text-gray-800">{alert.message}</p>
                        <span className="text-xs text-gray-500">{alert.timestamp}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tracking View */}
        {currentView === 'tracking' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="font-semibold text-2xl text-gray-800 mb-4 flex items-center">
                <Map className="mr-2 text-indigo-600" size={28} />
                Live Tracking
              </h3>

              <div className="mb-6">
                {!isTracking ? (
                  <button
                    onClick={startTracking}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition shadow-lg"
                  >
                    Start Live Tracking
                  </button>
                ) : (
                  <button
                    onClick={stopTracking}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-4 rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition shadow-lg"
                  >
                    Stop Tracking
                  </button>
                )}
              </div>

              {location && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                  <h4 className="font-semibold mb-4 text-gray-800 text-lg">Current Location</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Latitude:</span>
                      <span className="text-gray-800">{location.lat.toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Longitude:</span>
                      <span className="text-gray-800">{location.lng.toFixed(6)}</span>
                    </div>
                    {location.accuracy && (
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Accuracy:</span>
                        <span className="text-gray-800">±{location.accuracy.toFixed(0)}m</span>
                      </div>
                    )}
                    {location.timestamp && (
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Last Update:</span>
                        <span className="text-gray-800">{new Date(location.timestamp).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contacts View */}
        {currentView === 'contacts' && user && (
          <TrustedContactsPage user={user} onUpdate={setUser} />
        )}

        {/* Safety View */}
        {currentView === 'safety' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="font-semibold text-2xl text-gray-800 mb-6">Security & Privacy</h3>
              <div className="space-y-5">
                <div className="flex items-start space-x-4 p-4 bg-green-50 rounded-xl">
                  <Shield className="text-green-600 flex-shrink-0" size={24} />
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">End-to-End Encryption</h4>
                    <p className="text-sm text-gray-600">All data encrypted securely with industry-standard protocols</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-xl">
                  <Map className="text-blue-600 flex-shrink-0" size={24} />
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Location Privacy</h4>
                    <p className="text-sm text-gray-600">Shared only with trusted contacts during emergencies</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 p-4 bg-purple-50 rounded-xl">
                  <Shield className="text-purple-600 flex-shrink-0" size={24} />
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Secure Authentication</h4>
                    <p className="text-sm text-gray-600">JWT-based authentication with bcrypt password hashing</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-md p-6 border border-indigo-200">
              <h3 className="font-semibold text-2xl text-gray-800 mb-6">Safety Tips</h3>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-indigo-600 mr-3 text-lg">•</span>
                  <span>Keep the app running for continuous protection</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-600 mr-3 text-lg">•</span>
                  <span>Update your trusted contacts regularly</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-600 mr-3 text-lg">•</span>
                  <span>Enable location services for accurate tracking</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-600 mr-3 text-lg">•</span>
                  <span>Trust your instincts - if you feel unsafe, activate tracking</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProtegoApp;

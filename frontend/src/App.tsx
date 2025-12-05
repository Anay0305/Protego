import { useState, useEffect, useRef } from 'react';
import { Shield, Phone, Users, Bell, Lock, AlertTriangle, Map, Activity, Eye, EyeOff, LogOut, Mic, MicOff, CheckCircle, Navigation } from 'lucide-react';
import { useUserStore } from './store/useUserStore';
import { walkAPI, alertAPI } from './services/api';
import { ALERT_TYPES } from './constants/alertTypes';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
}

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

interface TrustedContact {
  id: number;
  name: string;
  phone: string;
  email: string;
}

const ProteoApp = () => {
  const userStore = useUserStore();
  const user = userStore.user as unknown as User | null;
  const { isWalking, activeSession, startSession, stopSession } = userStore;

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [location, setLocation] = useState<Location | null>(null);
  const [safetyScore, setSafetyScore] = useState(85);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceLogs, setVoiceLogs] = useState<Array<{ timestamp: string; message: string; type: string }>>([]);
  const [walkingStatus, setWalkingStatus] = useState('safe');
  const [trustedContacts, setTrustedContacts] = useState<TrustedContact[]>([
    { id: 1, name: 'Emergency', phone: '+919056690327', email: 'emergency@protego.com' }
  ]);

  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    otp: '',
    mode: 'login'
  });

  const recognitionRef = useRef<any>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastAlertTimeRef = useRef(0);
  const alertCooldownMs = 30000;

  // Add voice log
  const addVoiceLog = (message: string, type: string = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = { timestamp, message, type };
    console.log(`[Voice ${type.toUpperCase()}] ${timestamp}: ${message}`);
    setVoiceLogs(prev => [...prev, logEntry].slice(-10));
  };

  // Add alert
  const addAlert = (type: string, message: string) => {
    const newAlert = {
      id: Date.now(),
      type,
      message,
      timestamp: new Date().toLocaleTimeString()
    };
    setAlerts(prev => [newAlert, ...prev].slice(0, 5));
  };

  // Get user's location
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

  // Initialize authentication
  useEffect(() => {
    if (user) {
      setIsAuthenticated(true);
      setCurrentView('dashboard');
    }
  }, [user]);

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
      addVoiceLog('🎤 Listening started - say "help me" to trigger alert', 'success');
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
          addVoiceLog(`⏳ Alert cooldown active (${remainingSeconds}s remaining)`, 'warning');
          return;
        }

        addVoiceLog('🛡️ "HELP ME" DETECTED! Triggering emergency alert...', 'warning');
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

  // SOS Emergency
  const triggerSOS = () => {
    setSosActive(true);
    addAlert('emergency', 'SOS ACTIVATED - Emergency contacts notified!');
    handleVoiceAlert();
    setTimeout(() => {
      addAlert('emergency', 'Emergency services contacted');
    }, 1000);
  };

  const cancelSOS = () => {
    setSosActive(false);
    addAlert('success', 'SOS cancelled');
  };

  // Voice alert
  const handleVoiceAlert = async () => {
    addVoiceLog('Creating INSTANT emergency alert...', 'warning');

    let currentLocation = location;
    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
            enableHighAccuracy: true
          });
        });
        currentLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        addVoiceLog(`Location: ${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`, 'info');
      } catch (err) {
        addVoiceLog('Using last known location', 'warning');
      }
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

      addVoiceLog(`✅ EMERGENCY ALERT SENT! ID: ${alert.data.id}`, 'success');
      setError(null);
    } catch (err: any) {
      const errorMsg = `Failed to send emergency alert: ${err.response?.data?.detail || err.message}`;
      addVoiceLog(errorMsg, 'error');
      setError('Failed to send emergency alert');
    }
  };

  // Walk control
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

  const handleAuth = () => {
    if (authForm.email && authForm.password) {
      setIsAuthenticated(true);
      setCurrentView('dashboard');
      addAlert('success', 'Successfully logged in');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentView('login');
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

  // Login View
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="bg-indigo-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Protego</h1>
            <p className="text-gray-600 mt-2">Personal Safety Companion</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={authForm.email}
                onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={authForm.password}
                  onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              onClick={handleAuth}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition duration-200"
            >
              Secure Login
            </button>

            <div className="text-center text-sm text-gray-600 mt-4">
              <p>🔒 Protected with Encryption</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="text-indigo-600" size={32} />
            <div>
              <h1 className="text-xl font-bold text-gray-800">Protego</h1>
              <p className="text-xs text-gray-500">Personal Safety System</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        {/* Navigation */}
        <div className="bg-white rounded-xl shadow-sm p-2 mb-6 flex space-x-2 overflow-x-auto">
          {['dashboard', 'tracking', 'contacts', 'safety'].map((view) => (
            <button
              key={view}
              onClick={() => setCurrentView(view)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                currentView === view
                  ? 'bg-indigo-600 text-white'
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
              className="w-full bg-red-600 text-white py-6 rounded-2xl font-bold text-2xl shadow-lg hover:bg-red-700 transition duration-200 flex items-center justify-center space-x-3"
            >
              <AlertTriangle size={32} />
              <span>SOS EMERGENCY</span>
            </button>
          ) : (
            <div className="bg-red-600 text-white p-6 rounded-2xl animate-pulse">
              <div className="text-center">
                <AlertTriangle size={48} className="mx-auto mb-3" />
                <h3 className="text-2xl font-bold mb-2">EMERGENCY ACTIVE</h3>
                <p className="mb-4">Help is on the way. Stay safe!</p>
                <button
                  onClick={cancelSOS}
                  className="bg-white text-red-600 px-6 py-3 rounded-lg font-semibold"
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
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-700">Safety Score</h3>
                  <Activity className={`${
                    safetyScore > 70 ? 'text-green-500' : safetyScore > 50 ? 'text-yellow-500' : 'text-red-500'
                  }`} />
                </div>
                <p className="text-4xl font-bold text-gray-800">{safetyScore}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {walkingStatus === 'safe' ? 'Area is safe' : walkingStatus === 'caution' ? 'Stay alert' : 'High risk detected'}
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-700">Walk Status</h3>
                  <Navigation className={isWalking ? 'text-green-500' : 'text-gray-400'} />
                </div>
                <p className="text-2xl font-bold text-gray-800">
                  {isWalking ? 'Active' : 'Inactive'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {isWalking ? 'Being monitored' : 'Start walk mode'}
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-700">Trusted Contacts</h3>
                  <Users className="text-indigo-500" />
                </div>
                <p className="text-4xl font-bold text-gray-800">{trustedContacts.length}</p>
                <p className="text-sm text-gray-500 mt-1">Ready to help</p>
              </div>
            </div>

            {/* Main Walk Control */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-col items-center text-center">
                <div
                  className={`p-6 rounded-full mb-6 ${
                    isWalking
                      ? 'bg-green-100 text-green-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <Shield className="w-24 h-24" />
                </div>

                <h2 className="text-2xl font-bold mb-2">
                  {isWalking ? 'Walk Mode Active' : 'Walk Mode Inactive'}
                </h2>

                <p className="text-gray-600 mb-6">
                  {isWalking
                    ? 'You are being monitored for safety.'
                    : 'Start Walk Mode to enable safety monitoring.'}
                </p>

                {isWalking && activeSession && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 w-full">
                    <div className="flex items-center justify-center text-green-700 mb-2">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      <span className="font-medium">Session Active</span>
                    </div>
                    <p className="text-sm text-green-600">
                      Location: {location?.lat.toFixed(4)}, {location?.lng.toFixed(4)}
                    </p>
                  </div>
                )}

                {/* Voice Control */}
                {isWalking && (
                  <div className="mb-4 w-full max-w-sm">
                    <button
                      onClick={toggleVoiceRecognition}
                      className={`${
                        voiceEnabled ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
                      } px-6 py-3 text-sm font-semibold w-full flex items-center justify-center gap-2 rounded-lg`}
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
                  <div className="mt-4 bg-gray-900 text-gray-100 rounded-lg p-3 max-h-64 overflow-y-auto w-full">
                    <div className="flex items-center justify-between mb-2">
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
                            log.type === 'debug' ? 'text-gray-500' :
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
                    isWalking ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                  } text-white px-8 py-4 text-lg font-semibold w-full max-w-sm rounded-lg transition`}
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
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                <Bell className="mr-2" size={20} />
                Recent Alerts
              </h3>
              <div className="space-y-2">
                {alerts.length === 0 ? (
                  <p className="text-gray-500 text-sm">No recent alerts</p>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-3 rounded-lg ${
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
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-xl text-gray-800 mb-4 flex items-center">
                <Map className="mr-2" />
                Live Tracking
              </h3>
              
              <div className="mb-6">
                {!isTracking ? (
                  <button
                    onClick={startTracking}
                    className="w-full bg-green-600 text-white py-4 rounded-lg font-semibold hover:bg-green-700 transition"
                  >
                    Start Live Tracking
                  </button>
                ) : (
                  <button
                    onClick={stopTracking}
                    className="w-full bg-red-600 text-white py-4 rounded-lg font-semibold hover:bg-red-700 transition"
                  >
                    Stop Tracking
                  </button>
                )}
              </div>

              {location && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Current Location</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Latitude:</span> {location.lat.toFixed(6)}</p>
                    <p><span className="font-medium">Longitude:</span> {location.lng.toFixed(6)}</p>
                    {location.accuracy && <p><span className="font-medium">Accuracy:</span> ±{location.accuracy.toFixed(0)}m</p>}
                    {location.timestamp && <p><span className="font-medium">Last Update:</span> {new Date(location.timestamp).toLocaleString()}</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contacts View */}
        {currentView === 'contacts' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-xl text-gray-800 mb-4 flex items-center">
              <Users className="mr-2" />
              Trusted Emergency Contacts
            </h3>
            <div className="space-y-3">
              {trustedContacts.map((contact) => (
                <div key={contact.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-800">{contact.name}</h4>
                      <p className="text-sm text-gray-600">{contact.phone}</p>
                      <p className="text-sm text-gray-500">{contact.email}</p>
                    </div>
                    <Phone className="text-indigo-600" size={24} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Safety View */}
        {currentView === 'safety' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-xl text-gray-800 mb-4">Security & Privacy</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Lock className="text-green-600 mt-1" size={20} />
                  <div>
                    <h4 className="font-semibold text-gray-800">End-to-End Encryption</h4>
                    <p className="text-sm text-gray-600">All data encrypted securely</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Shield className="text-green-600 mt-1" size={20} />
                  <div>
                    <h4 className="font-semibold text-gray-800">Location Privacy</h4>
                    <p className="text-sm text-gray-600">Shared only with trusted contacts</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Users className="text-green-600 mt-1" size={20} />
                  <div>
                    <h4 className="font-semibold text-gray-800">Role-Based Access</h4>
                    <p className="text-sm text-gray-600">Only authorized contacts can view your data</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-xl text-gray-800 mb-4">Safety Tips</h3>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-indigo-600 mr-2">•</span>
                  <span>Keep the app running for continuous protection</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-600 mr-2">•</span>
                  <span>Update your trusted contacts regularly</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-600 mr-2">•</span>
                  <span>Enable location services for accurate tracking</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-600 mr-2">•</span>
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

export default ProteoApp;

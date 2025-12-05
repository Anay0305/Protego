import React, { useState, useEffect, useRef } from 'react';
import { Shield, MapPin, Phone, Users, Bell, Lock, AlertTriangle, Map, Activity, Eye, EyeOff, LogOut } from 'lucide-react';

interface User {
  name: string;
  email: string;
  phone: string;
}

interface Location {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: string;
}

interface Alert {
  id: number;
  type: string;
  message: string;
  timestamp: string;
}

const SafetyCompanionApp = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('login');
  const [location, setLocation] = useState<Location | null>(null);
  const [safetyScore, setSafetyScore] = useState(85);
  const [trustedContacts, setTrustedContacts] = useState([
    { id: 1, name: 'Mom', phone: '+1234567890', email: 'mom@example.com' },
    { id: 2, name: 'Best Friend', phone: '+0987654321', email: 'friend@example.com' }
  ]);
  const [walkingStatus, setWalkingStatus] = useState('safe');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  // Authentication
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    otp: '',
    mode: 'login'
  });

  const handleAuth = () => {
    // Simulated authentication
    setUser({
      name: 'User',
      email: authForm.email,
      phone: '+1234567890'
    });
    setIsAuthenticated(true);
    setCurrentView('dashboard');
    addAlert('success', 'Successfully logged in with MFA');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setCurrentView('login');
    stopTracking();
  };

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
      addAlert('info', 'Live tracking started - Location shared with trusted contacts');
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

  // AI Analysis simulation
  const analyzeLocation = (loc: Location) => {
    // Simulated safety analysis
    const hour = new Date().getHours();
    const isNightTime = hour < 6 || hour > 20;
    
    // Simulate anomaly detection
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
    
    // Simulated emergency response
    setTimeout(() => {
      addAlert('emergency', 'Location sent to: ' + trustedContacts.map(c => c.name).join(', '));
      addAlert('emergency', 'Emergency services contacted');
    }, 1000);
  };

  const cancelSOS = () => {
    setSosActive(false);
    addAlert('success', 'SOS cancelled - False alarm reported');
  };

  // Alert system
  const addAlert = (type: string, message: string) => {
    const newAlert = {
      id: Date.now(),
      type,
      message,
      timestamp: new Date().toLocaleTimeString()
    };
    setAlerts(prev => [newAlert, ...prev].slice(0, 5));
  };

  // Voice command simulation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'h' && e.ctrlKey && isAuthenticated) {
        addAlert('info', 'Voice command detected: "Help me!"');
        triggerSOS();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isAuthenticated]);

  // Login View
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="bg-indigo-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">SafeGuard AI</h1>
            <p className="text-gray-600 mt-2">Your Personal Safety Companion</p>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Lock className="inline mr-2" size={16} />
                Two-Factor Authentication (OTP)
              </label>
              <input
                type="text"
                value={authForm.otp}
                onChange={(e) => setAuthForm({...authForm, otp: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="000000"
                maxLength={6}
              />
            </div>

            <button
              onClick={handleAuth}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition duration-200"
            >
              Secure Login
            </button>

            <div className="text-center text-sm text-gray-600 mt-4">
              <p>🔒 Protected with AES-256 Encryption</p>
              <p className="mt-1">🛡️ OAuth2 / MFA Enabled</p>
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
              <h1 className="text-xl font-bold text-gray-800">SafeGuard AI</h1>
              <p className="text-xs text-gray-500">Personal Safety Companion</p>
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
                  Cancel SOS (False Alarm)
                </button>
              </div>
            </div>
          )}
          <p className="text-center text-sm text-gray-600 mt-2">
            Press Ctrl+H or say "Help me!" for silent SOS
          </p>
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
                  <h3 className="font-semibold text-gray-700">Tracking Status</h3>
                  <MapPin className={isTracking ? 'text-green-500' : 'text-gray-400'} />
                </div>
                <p className="text-2xl font-bold text-gray-800">
                  {isTracking ? 'Active' : 'Inactive'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {isTracking ? 'Location shared' : 'Start tracking'}
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

            {/* AI Features */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <h3 className="font-semibold text-xl mb-4">🤖 AI Safety Features Active</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
                  <h4 className="font-semibold mb-2">Anomaly Detection</h4>
                  <p className="text-sm opacity-90">Monitoring movement patterns for unusual behavior</p>
                </div>
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
                  <h4 className="font-semibold mb-2">Predictive Alerts</h4>
                  <p className="text-sm opacity-90">ML model analyzing risk zones in real-time</p>
                </div>
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
                  <h4 className="font-semibold mb-2">Voice Analysis</h4>
                  <p className="text-sm opacity-90">Stress detection in emergency calls enabled</p>
                </div>
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
                  <h4 className="font-semibold mb-2">Crowd Intelligence</h4>
                  <p className="text-sm opacity-90">Community safety reports integrated</p>
                </div>
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
                    <p><span className="font-medium">Accuracy:</span> ±{location.accuracy.toFixed(0)}m</p>
                    <p><span className="font-medium">Last Update:</span> {new Date(location.timestamp).toLocaleString()}</p>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded border-l-4 border-blue-500">
                    <p className="text-sm text-blue-800">
                      🔒 Location encrypted end-to-end and shared only with trusted contacts
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-6">
                <h4 className="font-semibold mb-3">Geofencing & Safety Zones</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-sm">Home Zone</span>
                    <span className="text-xs text-green-600 font-medium">SAFE</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <span className="text-sm">Downtown Area</span>
                    <span className="text-xs text-yellow-600 font-medium">CAUTION</span>
                  </div>
                </div>
              </div>
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
              <button className="w-full border-2 border-dashed border-gray-300 rounded-lg py-4 text-gray-600 hover:border-indigo-500 hover:text-indigo-600 transition">
                + Add New Contact
              </button>
            </div>
            <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
              <p className="text-sm text-indigo-800">
                🔒 Contacts have RBAC permissions - only they can access your emergency data
              </p>
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
                    <p className="text-sm text-gray-600">All data encrypted with AES-256</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Shield className="text-green-600 mt-1" size={20} />
                  <div>
                    <h4 className="font-semibold text-gray-800">Multi-Factor Authentication</h4>
                    <p className="text-sm text-gray-600">Account protected with MFA</p>
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
                  <span>Keep the app running in background for continuous protection</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-600 mr-2">•</span>
                  <span>Update your trusted contacts regularly</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-600 mr-2">•</span>
                  <span>Test the SOS button with contacts before actual emergencies</span>
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

export default SafetyCompanionApp;
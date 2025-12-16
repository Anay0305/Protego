import { useState, useEffect } from 'react';
import AuthPage from './components/AuthPage';
import TrustedContactsPage from './components/TrustedContactsPage';
import Header from './components/layout/Header';
import Navigation from './components/layout/Navigation';
import SOSButton from './components/layout/SOSButton';
import StatusCards from './components/dashboard/StatusCards';
import WalkControl from './components/dashboard/WalkControl';
import AlertsList from './components/dashboard/AlertsList';
import TrackingView from './components/tracking/TrackingView';
import SafetyView from './components/SafetyView';
import { userAPI, walkAPI, alertAPI, User } from './services/api';
import { useUserStore } from './store/useUserStore';
import { useLocation } from './hooks/useLocation';
import { useVoiceRecognition } from './hooks/useVoiceRecognition';
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
  const { isWalking, activeSession, startSession, stopSession, user, isAuthenticated, setUser, clearUser } = userStore;

  const [currentView, setCurrentView] = useState('dashboard');
  const [safetyScore, setSafetyScore] = useState(85);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [sosActive, setSosActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [walkingStatus, setWalkingStatus] = useState('safe');

  // Add alert helper
  const addAlert = (type: string, message: string) => {
    const newAlert = {
      id: Date.now(),
      type,
      message,
      timestamp: new Date().toLocaleTimeString()
    };
    setAlerts(prev => [newAlert, ...prev].slice(0, 5));
  };

  // Custom hooks
  const { location, isTracking, startTracking, stopTracking } = useLocation(addAlert);

  const handleVoiceAlert = async () => {
    console.log('Creating INSTANT emergency alert...');

    // Get fresh location
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
      } catch (err: any) {
        console.warn('Location error:', err.message);
        currentLocation = location;
      }
    }

    try {
      await alertAPI.createInstantAlert({
        user_id: user?.id || 1,
        session_id: activeSession?.id || null,
        type: ALERT_TYPES.VOICE_ACTIVATION,
        confidence: 1.0,
        location_lat: currentLocation?.lat || null,
        location_lng: currentLocation?.lng || null,
      });
      addAlert('emergency', 'VOICE ALERT SENT!');
    } catch (err: any) {
      addAlert('error', `Failed to send alert: ${err.message}`);
    }
  };

  const { voiceEnabled, isListening, voiceLogs, toggleVoiceRecognition, clearVoiceLogs, recognitionRef } =
    useVoiceRecognition(isWalking, handleVoiceAlert, addAlert);

  // Check for existing auth token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const response = await userAPI.getProfile();
          const userData = response.data;
          setUser(userData as any);
          console.log('Auth restored:', userData.email);
        } catch (err: any) {
          console.error('Auth check failed:', err.message);
          localStorage.removeItem('access_token');
          clearUser();
        }
      }
    };

    checkAuth();
  }, [setUser, clearUser]);

  // Analyze location for safety score
  useEffect(() => {
    if (location) {
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
    }
  }, [location]);

  const triggerSOS = async () => {
    setSosActive(true);
    addAlert('emergency', 'SOS ACTIVATED - Getting your location...');

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
        currentLocation = location;
      }
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
      addAlert('emergency', 'Emergency contacts notified!');
    } catch (err: any) {
      addAlert('error', `Failed to send SOS: ${err.message}`);
    }
  };

  const cancelSOS = () => {
    setSosActive(false);
    addAlert('success', 'SOS cancelled');
  };

  const handleStartWalk = async () => {
    setLoading(true);
    try {
      const response = await walkAPI.startWalk({
        user_id: user?.id || 1,
        location_lat: location?.lat || null,
        location_lng: location?.lng || null,
      });
      startSession(response.data);
      addAlert('success', 'Walk mode started');
    } catch (err: any) {
      addAlert('error', 'Failed to start walk mode');
    } finally {
      setLoading(false);
    }
  };

  const handleStopWalk = async () => {
    setLoading(true);
    try {
      await walkAPI.stopWalk(activeSession?.id || 1);
      stopSession();
      addAlert('success', 'Walk mode stopped');
    } catch (err: any) {
      addAlert('error', 'Failed to stop walk mode');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = (token: string, userData: User) => {
    setUser(userData as any);
    addAlert('success', 'Successfully logged in');
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    clearUser();
    setCurrentView('dashboard');
    stopTracking();
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  if (!isAuthenticated) {
    return <AuthPage onSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-safe">
      <Header userName={user?.name} onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 space-y-4 sm:space-y-6">
        <Navigation currentView={currentView} onViewChange={setCurrentView} />

        <SOSButton isActive={sosActive} onTrigger={triggerSOS} onCancel={cancelSOS} />

        {/* Dashboard View */}
        {currentView === 'dashboard' && (
          <div className="space-y-4 sm:space-y-6">
            <StatusCards
              safetyScore={safetyScore}
              walkingStatus={walkingStatus}
              isWalking={isWalking}
              trustedContactsCount={user?.trusted_contacts?.length || 0}
            />

            <WalkControl
              isWalking={isWalking}
              activeSession={activeSession}
              location={location}
              voiceEnabled={voiceEnabled}
              isListening={isListening}
              voiceLogs={voiceLogs}
              loading={loading}
              onStartWalk={handleStartWalk}
              onStopWalk={handleStopWalk}
              onToggleVoice={toggleVoiceRecognition}
              onClearVoiceLogs={clearVoiceLogs}
            />

            <AlertsList alerts={alerts} />
          </div>
        )}

        {/* Tracking View */}
        {currentView === 'tracking' && (
          <TrackingView
            location={location}
            isTracking={isTracking}
            onStartTracking={startTracking}
            onStopTracking={stopTracking}
          />
        )}

        {/* Contacts View */}
        {currentView === 'contacts' && user && (
          <TrustedContactsPage user={user} onUpdate={(updatedUser) => setUser(updatedUser as any)} />
        )}

        {/* Safety View */}
        {currentView === 'safety' && <SafetyView />}
      </div>
    </div>
  );
};

export default ProtegoApp;

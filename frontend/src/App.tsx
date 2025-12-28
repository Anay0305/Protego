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
import { AIChatAssistant, SafetySummary, AudioMonitor } from './components/ai';
import { userAPI, walkAPI, alertAPI, aiAPI, User } from './services/api';
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

      // If we have a token but no user in store, fetch the profile
      if (token && !user) {
        try {
          console.log('Token found, fetching user profile...');
          const response = await userAPI.getProfile();
          const userData = response.data;
          setUser(userData as any);
          console.log('Auth restored:', userData.email);
        } catch (err: any) {
          console.error('Auth check failed:', err.message);
          localStorage.removeItem('access_token');
          clearUser();
        }
      } else if (!token && user) {
        // Token missing but user in store - clear everything
        console.log('No token found, clearing store...');
        clearUser();
      } else if (token && user) {
        console.log('Auth already loaded from store:', user.email);
      }
    };

    // Small delay to ensure Zustand rehydration completes
    const timer = setTimeout(checkAuth, 100);
    return () => clearTimeout(timer);
  }, []); // Empty deps - only run once on mount

  // Analyze location for safety score using AI
  useEffect(() => {
    if (!location || !isWalking) return;

    const analyzeLocationSafety = async () => {
      try {
        const response = await aiAPI.analyzeLocation(
          location.lat,
          location.lng,
          new Date().toISOString()
        );

        const { safety_score, status, factors } = response.data;

        setSafetyScore(safety_score);
        setWalkingStatus(status);

        // Show alert if status changed to alert or caution with specific factors
        if (status === 'alert' && factors.length > 0) {
          addAlert('warning', factors[0]);
        }
      } catch (err) {
        // Fallback to simple time-based analysis if API fails
        console.error('Location safety analysis failed:', err);
        const hour = new Date().getHours();
        const isNightTime = hour < 6 || hour > 20;

        if (isNightTime) {
          setWalkingStatus('caution');
          setSafetyScore(65);
        } else {
          setWalkingStatus('safe');
          setSafetyScore(85);
        }
      }
    };

    // Analyze immediately and then every 2 minutes
    analyzeLocationSafety();
    const interval = setInterval(analyzeLocationSafety, 120000);

    return () => clearInterval(interval);
  }, [location, isWalking]);

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
    console.log('Auth success - Token saved, setting user:', userData.email);
    // Token is already saved by AuthPage, just set the user
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

            {/* AI Audio Monitor - Shows during active walk */}
            {isWalking && (
              <AudioMonitor
                isWalking={isWalking}
                sessionId={activeSession?.id}
                locationLat={location?.lat}
                locationLng={location?.lng}
                onDistressDetected={(result) => {
                  addAlert('warning', `AI detected: ${result.distress_type} (${Math.round(result.confidence * 100)}%)`);
                }}
              />
            )}

            {/* AI Safety Summary - Shows after walk ends */}
            {!isWalking && activeSession && (
              <SafetySummary sessionId={activeSession.id} compact />
            )}

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

      {/* AI Chat Assistant - Floating button */}
      <AIChatAssistant floating />
    </div>
  );
};

export default ProtegoApp;

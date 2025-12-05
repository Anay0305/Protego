import { useState, useEffect, useRef } from 'react';
import { Shield, Navigation, AlertTriangle, CheckCircle, Mic, MicOff } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';
import { walkAPI, alertAPI } from '../services/api';
import { ALERT_TYPES } from '../constants/alertTypes';
import CountdownAlert from '../components/CountdownAlert';
import QuickStats from '../components/QuickStats';

function Home() {
  const { user, isWalking, activeSession, startSession, stopSession, pendingAlert } =
    useUserStore();

  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceLogs, setVoiceLogs] = useState([]);
  const recognitionRef = useRef(null);
  const lastAlertTimeRef = useRef(0);
  const alertCooldownMs = 30000; // 30 seconds cooldown between alerts

  // Helper function to add voice logs
  const addVoiceLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = { timestamp, message, type };
    console.log(`[Voice ${type.toUpperCase()}] ${timestamp}: ${message}`);
    setVoiceLogs(prev => [...prev, logEntry].slice(-10)); // Keep last 10 logs
  };

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (err) => {
          console.error('Location error:', err);
        }
      );
    }
  }, []);

  // Check for active session on mount
  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        const session = await walkAPI.getActiveSession(user.id);
        startSession(session);
      } catch (err) {
        // No active session, which is fine
        console.log('No active session');
      }
    };

    if (user && !isWalking) {
      checkActiveSession();
    }
  }, [user]);

  // Initialize voice recognition
  useEffect(() => {
    // Check if browser supports Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      const errorMsg = 'Speech Recognition not supported in this browser';
      console.warn(errorMsg);
      addVoiceLog(errorMsg, 'error');
      return;
    }

    addVoiceLog('Speech Recognition API available', 'success');

    // Initialize recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    addVoiceLog('Voice recognition initialized', 'info');

    recognition.onstart = () => {
      setIsListening(true);
      addVoiceLog('🎤 Listening started - say "help me" to trigger alert', 'success');
    };

    recognition.onend = () => {
      setIsListening(false);
      addVoiceLog('Listening stopped', 'info');
      // Restart if walk mode is still active and voice is enabled
      if (isWalking && voiceEnabled) {
        addVoiceLog('Auto-restarting voice recognition...', 'info');
        try {
          recognition.start();
        } catch (err) {
          addVoiceLog(`Failed to restart: ${err.message}`, 'error');
        }
      }
    };

    recognition.onerror = (event) => {
      addVoiceLog(`Error: ${event.error}`, 'error');
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const lastResult = event.results[event.results.length - 1];
      const transcript = lastResult[0].transcript.toLowerCase();
      const isFinal = lastResult.isFinal;

      // Log what was heard
      if (isFinal) {
        addVoiceLog(`Heard (final): "${transcript}"`, 'info');
      } else {
        addVoiceLog(`Heard (interim): "${transcript}"`, 'debug');
      }

      // Check if "help me" was said (only on final results to avoid duplicates)
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

  // Start/stop voice recognition based on walk mode and voice toggle
  useEffect(() => {
    if (!recognitionRef.current) return;

    if (isWalking && voiceEnabled) {
      addVoiceLog('Starting voice recognition...', 'info');
      try {
        recognitionRef.current.start();
      } catch (err) {
        // Recognition might already be running
        addVoiceLog(`Start error (might already be running): ${err.message}`, 'warning');
      }
    } else {
      addVoiceLog('Stopping voice recognition', 'info');
      recognitionRef.current.stop();
    }
  }, [isWalking, voiceEnabled]);

  const handleVoiceAlert = async () => {
    addVoiceLog('Creating INSTANT emergency alert...', 'warning');

    // Get current location for the alert
    let currentLocation = location;
    if (navigator.geolocation) {
      try {
        const position = await new Promise((resolve, reject) => {
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
      // Create instant alert that triggers immediately without countdown
      const alert = await alertAPI.createInstantAlert({
        user_id: user.id,
        session_id: activeSession?.id || null,
        type: ALERT_TYPES.VOICE_ACTIVATION,
        confidence: 1.0,
        location_lat: currentLocation?.lat || null,
        location_lng: currentLocation?.lng || null,
      });

      addVoiceLog(`✅ EMERGENCY ALERT SENT IMMEDIATELY! ID: ${alert.id}`, 'success');

      // Show success notification
      setError(null);
    } catch (err) {
      const errorMsg = `Failed to send emergency alert: ${err.response?.data?.detail || err.message}`;
      addVoiceLog(errorMsg, 'error');
      setError('Failed to send emergency alert');
    }
  };

  const toggleVoiceRecognition = () => {
    const newState = !voiceEnabled;
    setVoiceEnabled(newState);
    addVoiceLog(`Voice activation ${newState ? 'ENABLED' : 'DISABLED'}`, newState ? 'success' : 'info');
  };

  const handleStartWalk = async () => {
    setLoading(true);
    setError(null);

    try {
      const session = await walkAPI.startWalk({
        user_id: user.id,
        location_lat: location?.lat || null,
        location_lng: location?.lng || null,
      });

      startSession(session);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to start walk session');
    } finally {
      setLoading(false);
    }
  };

  const handleStopWalk = async () => {
    setLoading(true);
    setError(null);

    try {
      await walkAPI.stopWalk(activeSession.id);
      stopSession();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to stop walk session');
    } finally {
      setLoading(false);
    }
  };

  // Simulate alert for testing (remove in production)
  const handleTestAlert = async () => {
    try {
      const alert = await alertAPI.createAlert({
        user_id: user.id,
        session_id: activeSession?.id || null,
        type: ALERT_TYPES.SCREAM,
        confidence: 0.85,
        location_lat: location?.lat || null,
        location_lng: location?.lng || null,
      });

      console.log('Test alert created:', alert);
    } catch (err) {
      console.error('Failed to create test alert:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome, {user?.name}!
        </h1>
        <p className="text-gray-600">Your safety is our priority</p>
      </div>

      {/* Countdown Alert (if pending) */}
      {pendingAlert && <CountdownAlert alert={pendingAlert} />}

      {/* Error Message */}
      {error && (
        <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Quick Stats */}
      <QuickStats userId={user?.id} />

      {/* Main Walk Control Card */}
      <div className="card mb-6">
        <div className="flex flex-col items-center text-center">
          <div
            className={`p-6 rounded-full mb-6 ${
              isWalking
                ? 'bg-success-100 text-success-600'
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
              ? 'You are being monitored for safety. Your trusted contacts will be notified if we detect distress.'
              : 'Start Walk Mode to enable safety monitoring during your journey.'}
          </p>

          {isWalking && activeSession && (
            <div className="bg-success-50 border border-success-200 rounded-lg p-4 mb-6 w-full">
              <div className="flex items-center justify-center text-success-700 mb-2">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span className="font-medium">Session Active</span>
              </div>
              <p className="text-sm text-success-600">
                Started:{' '}
                {new Date(activeSession.start_time).toLocaleString()}
              </p>
              {location && (
                <p className="text-sm text-success-600 flex items-center justify-center mt-1">
                  <Navigation className="w-4 h-4 mr-1" />
                  Location tracked
                </p>
              )}
            </div>
          )}

          {/* Voice Recognition Toggle (when walking) */}
          {isWalking && (
            <div className="mb-4 w-full max-w-sm">
              <button
                onClick={toggleVoiceRecognition}
                className={`${
                  voiceEnabled ? 'btn-primary' : 'btn-secondary'
                } px-6 py-3 text-sm font-semibold w-full flex items-center justify-center gap-2`}
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
              {voiceEnabled && (
                <p className="text-xs text-gray-600 mt-2 text-center">
                  Say "help me" to send an immediate emergency alert
                </p>
              )}

              {/* Voice Logs Panel */}
              {voiceEnabled && voiceLogs.length > 0 && (
                <div className="mt-4 bg-gray-900 text-gray-100 rounded-lg p-3 max-h-64 overflow-y-auto">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold text-gray-300">Voice Recognition Logs</h4>
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
            </div>
          )}

          {/* Main Action Button */}
          <button
            onClick={isWalking ? handleStopWalk : handleStartWalk}
            disabled={loading}
            className={`${
              isWalking ? 'btn-danger' : 'btn-success'
            } px-8 py-4 text-lg font-semibold w-full max-w-sm`}
          >
            {loading
              ? 'Please wait...'
              : isWalking
              ? 'Stop Walk Mode'
              : 'Start Walk Mode'}
          </button>

          {/* Test Alert Button (Development Only) */}
          {isWalking && process.env.NODE_ENV === 'development' && (
            <button
              onClick={handleTestAlert}
              className="btn-secondary mt-4 w-full max-w-sm"
            >
              <AlertTriangle className="w-4 h-4 inline mr-2" />
              Test Alert (Dev Only)
            </button>
          )}
        </div>
      </div>

      {/* Information Card */}
      <div className="card bg-primary-50 border border-primary-200">
        <h3 className="text-lg font-semibold text-primary-900 mb-3">
          How Protego Works
        </h3>
        <ul className="space-y-2 text-primary-800">
          <li className="flex items-start">
            <span className="font-bold mr-2">1.</span>
            <span>
              Start Walk Mode when you're walking alone or feel unsafe
            </span>
          </li>
          <li className="flex items-start">
            <span className="font-bold mr-2">2.</span>
            <span>
              Enable Voice Activation and say "help me" to instantly send an emergency alert
            </span>
          </li>
          <li className="flex items-start">
            <span className="font-bold mr-2">3.</span>
            <span>
              Our AI monitors for distress signals (screams, falls, unusual
              movements)
            </span>
          </li>
          <li className="flex items-start">
            <span className="font-bold mr-2">4.</span>
            <span>
              If detected, you'll have 5 seconds to cancel the alert
            </span>
          </li>
          <li className="flex items-start">
            <span className="font-bold mr-2">5.</span>
            <span>
              If not cancelled, your trusted contacts receive an emergency SMS
              with your location
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default Home;

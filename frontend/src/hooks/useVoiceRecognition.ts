import { useState, useEffect, useRef, useCallback } from 'react';

interface VoiceLog {
  timestamp: string;
  message: string;
  type: string;
}

export function useVoiceRecognition(
  isWalking: boolean,
  onVoiceAlert: () => void,
  addVoiceLog: (message: string, type?: string) => void
) {
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceLogs, setVoiceLogs] = useState<VoiceLog[]>([]);
  const recognitionRef = useRef<any>(null);
  const lastAlertTimeRef = useRef(0);
  const alertCooldownMs = 30000;

  // Use refs for callbacks to avoid re-initializing recognition on callback changes
  const onVoiceAlertRef = useRef(onVoiceAlert);
  const isWalkingRef = useRef(isWalking);
  const voiceEnabledRef = useRef(voiceEnabled);

  // Keep refs updated
  useEffect(() => {
    onVoiceAlertRef.current = onVoiceAlert;
  }, [onVoiceAlert]);

  useEffect(() => {
    isWalkingRef.current = isWalking;
  }, [isWalking]);

  useEffect(() => {
    voiceEnabledRef.current = voiceEnabled;
  }, [voiceEnabled]);

  const addLog = (message: string, type: string = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = { timestamp, message, type };
    console.log(`[Voice ${type.toUpperCase()}] ${timestamp}: ${message}`);
    setVoiceLogs(prev => [...prev, logEntry].slice(-10));
  };

  // Initialize voice recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      const errorMsg = 'Speech Recognition not supported in this browser';
      console.warn(errorMsg);
      addLog(errorMsg, 'error');
      return;
    }

    addLog('Speech Recognition API available', 'success');

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      addLog('Listening started - say "help me" to trigger alert', 'success');
    };

    recognition.onend = () => {
      setIsListening(false);
      // Use refs to get current values without causing re-renders
      if (isWalkingRef.current && voiceEnabledRef.current) {
        addLog('Auto-restarting voice recognition...', 'info');
        try {
          recognition.start();
        } catch (err: any) {
          addLog(`Failed to restart: ${err.message}`, 'error');
        }
      }
    };

    recognition.onerror = (event: any) => {
      addLog(`Error: ${event.error}`, 'error');
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      const lastResult = event.results[event.results.length - 1];
      const transcript = lastResult[0].transcript.toLowerCase();
      const isFinal = lastResult.isFinal;

      if (isFinal) {
        addLog(`Heard (final): "${transcript}"`, 'info');
      }

      if (isFinal && transcript.includes('help me')) {
        const now = Date.now();
        const timeSinceLastAlert = now - lastAlertTimeRef.current;

        if (timeSinceLastAlert < alertCooldownMs) {
          const remainingSeconds = Math.ceil((alertCooldownMs - timeSinceLastAlert) / 1000);
          addLog(`Alert cooldown active (${remainingSeconds}s remaining)`, 'warning');
          return;
        }

        addLog('"HELP ME" DETECTED! Triggering emergency alert...', 'warning');
        lastAlertTimeRef.current = now;
        // Use ref to call the current callback
        onVoiceAlertRef.current();
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        addLog('Voice recognition cleaned up', 'info');
      }
    };
  // Only run once on mount - use refs for dynamic values
  }, []);

  // Start/stop voice recognition based on state
  useEffect(() => {
    if (!recognitionRef.current) return;

    if (isWalking && voiceEnabled) {
      addLog('Starting voice recognition...', 'info');
      try {
        recognitionRef.current.start();
      } catch (err: any) {
        addLog(`Start error: ${err.message}`, 'warning');
      }
    } else {
      addLog('Stopping voice recognition', 'info');
      recognitionRef.current.stop();
    }
  }, [isWalking, voiceEnabled]);

  const toggleVoiceRecognition = () => {
    const newState = !voiceEnabled;
    setVoiceEnabled(newState);
    addLog(`Voice activation ${newState ? 'ENABLED' : 'DISABLED'}`, newState ? 'success' : 'info');
  };

  const clearVoiceLogs = () => {
    setVoiceLogs([]);
  };

  return {
    voiceEnabled,
    isListening,
    voiceLogs,
    toggleVoiceRecognition,
    clearVoiceLogs,
    recognitionRef
  };
}

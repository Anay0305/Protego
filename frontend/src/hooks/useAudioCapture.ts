import { useState, useRef, useCallback, useEffect } from 'react';
import { aiAPI } from '../services/api';

interface AudioCaptureLog {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface AudioAnalysisResult {
  transcription: string;
  distress_detected: boolean;
  distress_type: string;
  confidence: number;
  keywords_found: string[];
  alert_triggered: boolean;
  alert_id: number | null;
}

interface UseAudioCaptureOptions {
  onDistressDetected?: (result: AudioAnalysisResult) => void;
  onAnalysisComplete?: (result: AudioAnalysisResult) => void;
  sessionId?: number | null;
  locationLat?: number | null;
  locationLng?: number | null;
  autoAnalyzeInterval?: number; // ms between auto-analysis (0 = disabled)
}

export function useAudioCapture(options: UseAudioCaptureOptions = {}) {
  const {
    onDistressDetected,
    onAnalysisComplete,
    sessionId,
    locationLat,
    locationLng,
    autoAnalyzeInterval = 0,
  } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [lastResult, setLastResult] = useState<AudioAnalysisResult | null>(null);
  const [logs, setLogs] = useState<AudioCaptureLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const autoAnalyzeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRecordingInProgressRef = useRef(false); // Lock to prevent concurrent recordings

  const addLog = useCallback((message: string, type: AudioCaptureLog['type'] = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[Audio ${type.toUpperCase()}] ${timestamp}: ${message}`);
    setLogs(prev => [...prev, { timestamp, message, type }].slice(-20));
  }, []);

  // Initialize microphone access
  const initializeMicrophone = useCallback(async () => {
    try {
      addLog('Requesting microphone access...', 'info');

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      addLog('Microphone access granted', 'success');
      setError(null);
      return true;
    } catch (err: any) {
      const errorMessage = err.name === 'NotAllowedError'
        ? 'Microphone permission denied'
        : `Microphone error: ${err.message}`;
      addLog(errorMessage, 'error');
      setError(errorMessage);
      return false;
    }
  }, [addLog]);

  // Start recording audio
  const startRecording = useCallback(async () => {
    if (isRecording || isRecordingInProgressRef.current) {
      // Only log if not already being handled by the lock
      if (isRecording) {
        addLog('Already recording', 'warning');
      }
      return false;
    }

    // Initialize microphone if not already done
    if (!streamRef.current) {
      const success = await initializeMicrophone();
      if (!success) return false;
    }

    try {
      audioChunksRef.current = [];

      // Determine supported MIME type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(streamRef.current!, {
        mimeType,
        audioBitsPerSecond: 128000,
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        addLog(`Recording stopped. Chunks: ${audioChunksRef.current.length}`, 'info');
      };

      mediaRecorder.onerror = (event: any) => {
        addLog(`Recording error: ${event.error?.message || 'Unknown'}`, 'error');
        setIsRecording(false);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      addLog('Recording started', 'success');
      return true;
    } catch (err: any) {
      addLog(`Failed to start recording: ${err.message}`, 'error');
      return false;
    }
  }, [isRecording, initializeMicrophone, addLog]);

  // Stop recording and return blob
  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || !isRecording) {
        addLog('Not recording', 'warning');
        resolve(null);
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        addLog(`Recording stopped. Size: ${(audioBlob.size / 1024).toFixed(1)}KB`, 'info');
        setIsRecording(false);
        resolve(audioBlob);
      };

      mediaRecorderRef.current.stop();
    });
  }, [isRecording, addLog]);

  // Analyze audio blob using AI
  const analyzeAudio = useCallback(async (audioBlob: Blob): Promise<AudioAnalysisResult | null> => {
    if (audioBlob.size === 0) {
      addLog('Empty audio blob, skipping analysis', 'warning');
      return null;
    }

    setIsAnalyzing(true);
    addLog(`Analyzing audio (${(audioBlob.size / 1024).toFixed(1)}KB)...`, 'info');

    try {
      const response = await aiAPI.analyzeAudio(
        audioBlob,
        sessionId,
        locationLat,
        locationLng
      );

      const result = response.data;
      setLastResult(result);

      if (result.distress_detected) {
        addLog(
          `DISTRESS DETECTED: ${result.distress_type} (${(result.confidence * 100).toFixed(0)}%)`,
          'warning'
        );
        onDistressDetected?.(result);
      } else {
        addLog('No distress detected', 'success');
      }

      if (result.alert_triggered) {
        addLog(`Alert triggered! ID: ${result.alert_id}`, 'warning');
      }

      onAnalysisComplete?.(result);
      return result;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message;
      addLog(`Analysis failed: ${errorMessage}`, 'error');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [sessionId, locationLat, locationLng, onDistressDetected, onAnalysisComplete, addLog]);

  // Record for a specific duration and analyze
  const recordAndAnalyze = useCallback(async (durationMs: number = 5000) => {
    // Prevent concurrent recordings using lock
    if (isRecordingInProgressRef.current) {
      console.log('[Audio] Recording already in progress, skipping');
      return null;
    }

    isRecordingInProgressRef.current = true;

    try {
      addLog(`Recording for ${durationMs / 1000}s...`, 'info');

      const started = await startRecording();
      if (!started) {
        return null;
      }

      // Wait for the specified duration
      await new Promise(resolve => setTimeout(resolve, durationMs));

      const audioBlob = await stopRecording();
      if (!audioBlob) return null;

      return await analyzeAudio(audioBlob);
    } finally {
      isRecordingInProgressRef.current = false;
    }
  }, [startRecording, stopRecording, analyzeAudio, addLog]);

  // Toggle audio capture on/off
  const toggleAudioCapture = useCallback(async () => {
    if (audioEnabled) {
      // Disable
      if (isRecording) {
        await stopRecording();
      }
      if (autoAnalyzeIntervalRef.current) {
        clearInterval(autoAnalyzeIntervalRef.current);
        autoAnalyzeIntervalRef.current = null;
      }
      setAudioEnabled(false);
      addLog('Audio capture DISABLED', 'info');
    } else {
      // Enable
      const success = await initializeMicrophone();
      if (success) {
        setAudioEnabled(true);
        addLog('Audio capture ENABLED', 'success');
      }
    }
  }, [audioEnabled, isRecording, stopRecording, initializeMicrophone, addLog]);

  // Use refs to track state and functions for interval callback to avoid stale closures
  const isAnalyzingRef = useRef(isAnalyzing);
  const isRecordingRef = useRef(isRecording);
  const recordAndAnalyzeRef = useRef(recordAndAnalyze);

  useEffect(() => {
    isAnalyzingRef.current = isAnalyzing;
  }, [isAnalyzing]);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    recordAndAnalyzeRef.current = recordAndAnalyze;
  }, [recordAndAnalyze]);

  // Auto-analyze at intervals when enabled
  useEffect(() => {
    if (!audioEnabled || autoAnalyzeInterval <= 0) {
      return;
    }

    console.log('[Audio] Setting up auto-analyze interval');

    const runAnalysis = async () => {
      // Use refs to avoid stale closure and check lock
      if (!isAnalyzingRef.current && !isRecordingRef.current && !isRecordingInProgressRef.current) {
        await recordAndAnalyzeRef.current(3000); // Record 3 seconds
      }
    };

    // Run once immediately after a short delay
    const initialTimeout = setTimeout(runAnalysis, 500);

    // Then run at intervals
    autoAnalyzeIntervalRef.current = setInterval(runAnalysis, autoAnalyzeInterval);

    return () => {
      clearTimeout(initialTimeout);
      if (autoAnalyzeIntervalRef.current) {
        clearInterval(autoAnalyzeIntervalRef.current);
        autoAnalyzeIntervalRef.current = null;
      }
    };
  }, [audioEnabled, autoAnalyzeInterval]); // Removed recordAndAnalyze and addLog from deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (autoAnalyzeIntervalRef.current) {
        clearInterval(autoAnalyzeIntervalRef.current);
      }
    };
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return {
    // State
    isRecording,
    isAnalyzing,
    audioEnabled,
    lastResult,
    logs,
    error,

    // Actions
    startRecording,
    stopRecording,
    analyzeAudio,
    recordAndAnalyze,
    toggleAudioCapture,
    clearLogs,
    initializeMicrophone,
  };
}

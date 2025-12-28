import { useState, useRef, useCallback, useEffect } from 'react';
import { aiAPI } from '../services/api';

interface RealtimeLog {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'ai';
}

interface DistressAnalysis {
  distress_detected: boolean;
  distress_type: string;
  confidence: number;
  transcript: string;
  keywords: string[];
  action: string;
}

interface UseRealtimeAudioOptions {
  onDistressDetected?: (analysis: DistressAnalysis) => void;
  onTranscript?: (transcript: string) => void;
  sessionId?: number | null;
}

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export function useRealtimeAudio(options: UseRealtimeAudioOptions = {}) {
  const { onDistressDetected, onTranscript, sessionId } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [lastAnalysis, setLastAnalysis] = useState<DistressAnalysis | null>(null);
  const [logs, setLogs] = useState<RealtimeLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const instructionsRef = useRef<string>('');

  const addLog = useCallback((message: string, type: RealtimeLog['type'] = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[Realtime ${type.toUpperCase()}] ${timestamp}: ${message}`);
    setLogs(prev => [...prev, { timestamp, message, type }].slice(-50));
  }, []);

  // Convert Float32Array to base64 PCM16
  const floatTo16BitPCM = useCallback((float32Array: Float32Array): ArrayBuffer => {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return buffer;
  }, []);

  const arrayBufferToBase64 = useCallback((buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }, []);

  // Connect to Azure OpenAI Realtime
  const connect = useCallback(async () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      addLog('Already connected', 'warning');
      return true;
    }

    setConnectionStatus('connecting');
    setError(null);

    try {
      addLog('Fetching realtime config...', 'info');
      const response = await aiAPI.getRealtimeConfig();
      const { ws_url, instructions } = response.data;
      instructionsRef.current = instructions;

      addLog('Connecting to Azure OpenAI Realtime...', 'info');

      const ws = new WebSocket(ws_url);
      wsRef.current = ws;

      ws.onopen = () => {
        addLog('WebSocket connected!', 'success');
        setIsConnected(true);
        setConnectionStatus('connected');

        // Send session configuration
        const sessionConfig = {
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: instructions,
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: {
              model: 'whisper-1'
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 500
            },
            tools: [],
            temperature: 0.7,
            max_response_output_tokens: 500
          }
        };

        ws.send(JSON.stringify(sessionConfig));
        addLog('Session configured for safety monitoring', 'success');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'session.created':
              addLog('Session created', 'success');
              break;

            case 'session.updated':
              addLog('Session updated', 'info');
              break;

            case 'input_audio_buffer.speech_started':
              addLog('Speech detected...', 'info');
              break;

            case 'input_audio_buffer.speech_stopped':
              addLog('Speech ended, analyzing...', 'info');
              break;

            case 'conversation.item.input_audio_transcription.completed':
              const transcript = data.transcript;
              if (transcript) {
                addLog(`Heard: "${transcript}"`, 'ai');
                onTranscript?.(transcript);
              }
              break;

            case 'response.text.delta':
              // AI is responding with analysis
              break;

            case 'response.text.done':
              // Try to parse AI response as JSON
              try {
                const text = data.text;
                // Try to extract JSON from the response
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                  const analysis: DistressAnalysis = JSON.parse(jsonMatch[0]);
                  setLastAnalysis(analysis);

                  if (analysis.distress_detected) {
                    addLog(
                      `DISTRESS: ${analysis.distress_type} (${Math.round(analysis.confidence * 100)}%)`,
                      'warning'
                    );
                    onDistressDetected?.(analysis);
                  } else {
                    addLog('No distress detected', 'success');
                  }
                }
              } catch {
                // Response wasn't JSON, log it anyway
                addLog(`AI: ${data.text?.substring(0, 100)}...`, 'ai');
              }
              break;

            case 'response.done':
              addLog('Analysis complete', 'info');
              break;

            case 'error':
              addLog(`Error: ${data.error?.message || 'Unknown error'}`, 'error');
              setError(data.error?.message || 'WebSocket error');
              break;

            default:
              // Log other events for debugging
              if (data.type && !data.type.includes('delta')) {
                console.log('[Realtime] Event:', data.type);
              }
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (event) => {
        addLog('WebSocket error', 'error');
        console.error('WebSocket error:', event);
        setError('Connection error');
        setConnectionStatus('error');
      };

      ws.onclose = (event) => {
        addLog(`Disconnected (code: ${event.code})`, 'info');
        setIsConnected(false);
        setIsListening(false);
        setConnectionStatus('disconnected');
        wsRef.current = null;
      };

      return true;
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message;
      addLog(`Connection failed: ${errorMsg}`, 'error');
      setError(errorMsg);
      setConnectionStatus('error');
      return false;
    }
  }, [addLog, onDistressDetected, onTranscript]);

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    stopListening();
    setIsConnected(false);
    setConnectionStatus('disconnected');
    addLog('Disconnected', 'info');
  }, [addLog]);

  // Start listening (capture and stream audio)
  const startListening = useCallback(async () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      addLog('Not connected to WebSocket', 'error');
      return false;
    }

    if (isListening) {
      addLog('Already listening', 'warning');
      return true;
    }

    try {
      addLog('Starting microphone...', 'info');

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      mediaStreamRef.current = stream;

      // Create audio context at 24kHz (required by Azure OpenAI Realtime)
      const audioContext = new AudioContext({ sampleRate: 24000 });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          const pcm16 = floatTo16BitPCM(inputData);
          const base64Audio = arrayBufferToBase64(pcm16);

          wsRef.current.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: base64Audio
          }));
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      setIsListening(true);
      addLog('Listening for audio...', 'success');
      return true;
    } catch (err: any) {
      const errorMsg = err.name === 'NotAllowedError'
        ? 'Microphone permission denied'
        : `Microphone error: ${err.message}`;
      addLog(errorMsg, 'error');
      setError(errorMsg);
      return false;
    }
  }, [isListening, addLog, floatTo16BitPCM, arrayBufferToBase64]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    setIsListening(false);
    addLog('Stopped listening', 'info');
  }, [addLog]);

  // Toggle listening on/off
  const toggleListening = useCallback(async () => {
    if (isListening) {
      stopListening();
    } else {
      // Connect first if not connected
      if (!isConnected) {
        const connected = await connect();
        if (!connected) return;
      }
      await startListening();
    }
  }, [isListening, isConnected, connect, startListening, stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return {
    // State
    isConnected,
    isListening,
    connectionStatus,
    lastAnalysis,
    logs,
    error,

    // Actions
    connect,
    disconnect,
    startListening,
    stopListening,
    toggleListening,
    clearLogs,
  };
}

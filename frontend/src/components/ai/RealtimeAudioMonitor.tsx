import { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Activity,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Wifi,
  WifiOff,
  Brain,
  Waves,
  Zap
} from 'lucide-react';
import { useRealtimeAudio } from '../../hooks/useRealtimeAudio';

interface RealtimeAudioMonitorProps {
  isWalking: boolean;
  sessionId?: number | null;
  onDistressDetected?: (analysis: any) => void;
}

export default function RealtimeAudioMonitor({
  isWalking,
  sessionId,
  onDistressDetected
}: RealtimeAudioMonitorProps) {
  const [showLogs, setShowLogs] = useState(false);
  const [transcripts, setTranscripts] = useState<string[]>([]);

  const {
    isConnected,
    isListening,
    connectionStatus,
    lastAnalysis,
    logs,
    error,
    connect,
    disconnect,
    toggleListening,
    clearLogs,
  } = useRealtimeAudio({
    sessionId,
    onDistressDetected: (analysis) => {
      onDistressDetected?.(analysis);
    },
    onTranscript: (transcript) => {
      setTranscripts(prev => [...prev, transcript].slice(-5));
    },
  });

  // Auto-disconnect when not walking
  useEffect(() => {
    if (!isWalking && isConnected) {
      disconnect();
      setTranscripts([]);
    }
  }, [isWalking, isConnected, disconnect]);

  if (!isWalking) {
    return null;
  }

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600';
      case 'connecting': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <Wifi className="w-4 h-4" />;
      case 'connecting': return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'error': return <WifiOff className="w-4 h-4" />;
      default: return <WifiOff className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isListening ? 'bg-purple-100' : 'bg-gray-100'}`}>
              <Zap className={`w-5 h-5 ${isListening ? 'text-purple-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                Real-time AI Monitor
                <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                  LIVE
                </span>
              </h3>
              <p className="text-xs text-gray-500">
                {isListening ? 'Streaming audio to AI' : 'Real-time voice analysis'}
              </p>
            </div>
          </div>

          {/* Connection Status */}
          <div className={`flex items-center gap-2 ${getStatusColor()}`}>
            {getStatusIcon()}
            <span className="text-xs font-medium capitalize">{connectionStatus}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Connection Button */}
        {!isConnected && (
          <button
            onClick={connect}
            disabled={connectionStatus === 'connecting'}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 hover:from-purple-700 hover:to-indigo-700 transition"
          >
            {connectionStatus === 'connecting' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <Brain className="w-5 h-5" />
                <span>Connect to AI</span>
              </>
            )}
          </button>
        )}

        {/* Connected State */}
        {isConnected && (
          <>
            {/* Live Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isListening ? (
                  <div className="flex items-center gap-2 text-red-600">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium">Streaming...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-green-600">
                    <Activity className="w-4 h-4" />
                    <span className="text-sm font-medium">Connected</span>
                  </div>
                )}
              </div>
            </div>

            {/* Audio Visualization */}
            <div className="flex items-center justify-center gap-1 h-16 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg">
              {isListening ? (
                // Animated waveform when listening
                <div className="flex items-center gap-1">
                  {[...Array(24)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-gradient-to-t from-purple-500 to-indigo-500 rounded-full"
                      style={{
                        height: `${Math.random() * 40 + 8}px`,
                        animation: `pulse ${0.5 + Math.random() * 0.5}s ease-in-out infinite`,
                        animationDelay: `${i * 30}ms`,
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-400">
                  <Waves className="w-5 h-5" />
                  <span className="text-sm">Ready to stream</span>
                </div>
              )}
            </div>

            {/* Recent Transcripts */}
            {transcripts.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="text-xs font-semibold text-gray-500 mb-2">Recent Speech</h4>
                <div className="space-y-1">
                  {transcripts.map((t, i) => (
                    <p key={i} className="text-sm text-gray-700 truncate">
                      "{t}"
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Last Analysis Result */}
            {lastAnalysis && (
              <div
                className={`p-3 rounded-lg ${
                  lastAnalysis.distress_detected
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-green-50 border border-green-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {lastAnalysis.distress_detected ? (
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-sm font-medium ${
                          lastAnalysis.distress_detected ? 'text-red-700' : 'text-green-700'
                        }`}
                      >
                        {lastAnalysis.distress_detected
                          ? `Distress: ${lastAnalysis.distress_type}`
                          : 'No Distress Detected'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {Math.round(lastAnalysis.confidence * 100)}% confidence
                      </span>
                    </div>
                    {lastAnalysis.transcript && (
                      <p className="text-xs text-gray-600 truncate">
                        "{lastAnalysis.transcript}"
                      </p>
                    )}
                    {lastAnalysis.keywords && lastAnalysis.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {lastAnalysis.keywords.map((kw: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Control Buttons */}
            <div className="flex gap-2">
              <button
                onClick={toggleListening}
                className={`flex-1 py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition ${
                  isListening
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-4 h-4" />
                    <span>Stop Listening</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    <span>Start Listening</span>
                  </>
                )}
              </button>
              <button
                onClick={disconnect}
                className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-lg font-medium text-sm hover:bg-gray-200 transition"
              >
                Disconnect
              </button>
            </div>
          </>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Logs Toggle */}
        <button
          onClick={() => setShowLogs(!showLogs)}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          {showLogs ? 'Hide logs' : 'Show logs'}
        </button>

        {/* Logs */}
        {showLogs && logs.length > 0 && (
          <div className="bg-gray-900 text-gray-100 rounded-lg p-3 max-h-48 overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-gray-400">Real-time Logs</h4>
              <button onClick={clearLogs} className="text-xs text-gray-500 hover:text-white">
                Clear
              </button>
            </div>
            <div className="space-y-1 font-mono text-xs">
              {logs.map((log, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2 ${
                    log.type === 'error'
                      ? 'text-red-400'
                      : log.type === 'success'
                      ? 'text-green-400'
                      : log.type === 'warning'
                      ? 'text-yellow-400'
                      : log.type === 'ai'
                      ? 'text-purple-400'
                      : 'text-gray-300'
                  }`}
                >
                  <span className="text-gray-500 shrink-0">{log.timestamp}</span>
                  <span className="flex-1">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scaleY(0.3); }
          50% { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}

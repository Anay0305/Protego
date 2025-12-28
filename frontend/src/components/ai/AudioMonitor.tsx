import { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Activity,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Volume2,
  Brain,
  Waves
} from 'lucide-react';
import { useAudioCapture } from '../../hooks/useAudioCapture';

interface AudioMonitorProps {
  isWalking: boolean;
  sessionId?: number | null;
  locationLat?: number | null;
  locationLng?: number | null;
  onDistressDetected?: (result: any) => void;
}

export default function AudioMonitor({
  isWalking,
  sessionId,
  locationLat,
  locationLng,
  onDistressDetected
}: AudioMonitorProps) {
  const [showLogs, setShowLogs] = useState(false);
  const [analysisCount, setAnalysisCount] = useState(0);

  const {
    isRecording,
    isAnalyzing,
    audioEnabled,
    lastResult,
    logs,
    error,
    toggleAudioCapture,
    recordAndAnalyze,
    clearLogs,
  } = useAudioCapture({
    sessionId,
    locationLat,
    locationLng,
    onDistressDetected: (result) => {
      onDistressDetected?.(result);
    },
    onAnalysisComplete: () => {
      setAnalysisCount(prev => prev + 1);
    },
    // Auto-analyze every 10 seconds when enabled
    autoAnalyzeInterval: 10000,
  });

  // Disable audio when not walking
  useEffect(() => {
    if (!isWalking && audioEnabled) {
      toggleAudioCapture();
    }
  }, [isWalking, audioEnabled, toggleAudioCapture]);

  if (!isWalking) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${audioEnabled ? 'bg-purple-100' : 'bg-gray-100'}`}>
              <Brain className={`w-5 h-5 ${audioEnabled ? 'text-purple-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">AI Audio Monitor</h3>
              <p className="text-xs text-gray-500">
                {audioEnabled ? 'Listening for distress signals' : 'Audio analysis disabled'}
              </p>
            </div>
          </div>
          <button
            onClick={toggleAudioCapture}
            className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition ${
              audioEnabled
                ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {audioEnabled ? (
              <>
                <Mic className="w-4 h-4" />
                <span>Enabled</span>
              </>
            ) : (
              <>
                <MicOff className="w-4 h-4" />
                <span>Disabled</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status */}
      {audioEnabled && (
        <div className="p-4 space-y-4">
          {/* Live Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isRecording ? (
                <div className="flex items-center gap-2 text-red-600">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium">Recording...</span>
                </div>
              ) : isAnalyzing ? (
                <div className="flex items-center gap-2 text-purple-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-medium">Analyzing...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-green-600">
                  <Activity className="w-4 h-4" />
                  <span className="text-sm font-medium">Monitoring</span>
                </div>
              )}
            </div>
            <span className="text-xs text-gray-400">{analysisCount} analyses</span>
          </div>

          {/* Audio Visualization */}
          <div className="flex items-center justify-center gap-1 h-12 bg-gray-50 rounded-lg">
            {isRecording ? (
              // Animated bars when recording
              [...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-purple-500 rounded-full animate-pulse"
                  style={{
                    height: `${Math.random() * 30 + 10}px`,
                    animationDelay: `${i * 50}ms`,
                  }}
                />
              ))
            ) : (
              <div className="flex items-center gap-2 text-gray-400">
                <Waves className="w-5 h-5" />
                <span className="text-sm">Waiting for next analysis...</span>
              </div>
            )}
          </div>

          {/* Last Result */}
          {lastResult && (
            <div
              className={`p-3 rounded-lg ${
                lastResult.distress_detected
                  ? 'bg-red-50 border border-red-200'
                  : 'bg-green-50 border border-green-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {lastResult.distress_detected ? (
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-sm font-medium ${
                        lastResult.distress_detected ? 'text-red-700' : 'text-green-700'
                      }`}
                    >
                      {lastResult.distress_detected
                        ? `Distress Detected: ${lastResult.distress_type}`
                        : 'No Distress Detected'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {Math.round(lastResult.confidence * 100)}% confidence
                    </span>
                  </div>
                  {lastResult.transcription && (
                    <p className="text-xs text-gray-600 truncate">
                      "{lastResult.transcription}"
                    </p>
                  )}
                  {lastResult.keywords_found.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {lastResult.keywords_found.map((kw, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                  {lastResult.alert_triggered && (
                    <div className="mt-2 px-2 py-1 bg-red-100 rounded text-xs text-red-700 font-medium">
                      Alert #{lastResult.alert_id} triggered!
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Manual Analyze Button */}
          <button
            onClick={() => recordAndAnalyze(3000)}
            disabled={isRecording || isAnalyzing}
            className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-700 hover:to-indigo-700 transition"
          >
            {isRecording || isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4" />
                <span>Analyze Now</span>
              </>
            )}
          </button>

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
            <div className="bg-gray-900 text-gray-100 rounded-lg p-3 max-h-40 overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-gray-400">Audio Logs</h4>
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
      )}
    </div>
  );
}

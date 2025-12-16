import { Shield, CheckCircle, Mic, MicOff } from 'lucide-react';

interface Location {
  lat: number;
  lng: number;
  accuracy?: number;
}

interface WalkSession {
  id: number;
}

interface VoiceLog {
  timestamp: string;
  message: string;
  type: string;
}

interface WalkControlProps {
  isWalking: boolean;
  activeSession: WalkSession | null;
  location: Location | null;
  voiceEnabled: boolean;
  isListening: boolean;
  voiceLogs: VoiceLog[];
  loading: boolean;
  onStartWalk: () => void;
  onStopWalk: () => void;
  onToggleVoice: () => void;
  onClearVoiceLogs: () => void;
}

export default function WalkControl({
  isWalking,
  activeSession,
  location,
  voiceEnabled,
  isListening,
  voiceLogs,
  loading,
  onStartWalk,
  onStopWalk,
  onToggleVoice,
  onClearVoiceLogs
}: WalkControlProps) {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-5 sm:p-8">
      <div className="flex flex-col items-center text-center">
        {/* Status Icon */}
        <div
          className={`p-6 sm:p-8 rounded-full mb-4 sm:mb-6 ${
            isWalking ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
          }`}
        >
          <Shield className="w-16 h-16 sm:w-24 sm:h-24" />
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-800">
          {isWalking ? 'Walk Mode Active' : 'Walk Mode Inactive'}
        </h2>

        {/* Description */}
        <p className="text-gray-600 mb-4 sm:mb-6 text-base sm:text-lg">
          {isWalking
            ? 'You are being monitored for safety.'
            : 'Start Walk Mode to enable safety monitoring.'}
        </p>

        {/* Active Session Info */}
        {isWalking && activeSession && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg sm:rounded-xl p-3 sm:p-5 mb-4 sm:mb-6 w-full max-w-md">
            <div className="flex items-center justify-center text-green-700 mb-1 sm:mb-2">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              <span className="font-medium text-sm sm:text-base">Session Active</span>
            </div>
            {location && (
              <p className="text-xs sm:text-sm text-green-600 text-center">
                Location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </p>
            )}
          </div>
        )}

        {/* Voice Control */}
        {isWalking && (
          <div className="mb-4 sm:mb-6 w-full max-w-md">
            <button
              onClick={onToggleVoice}
              className={`${
                voiceEnabled
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              } px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold w-full flex items-center justify-center gap-2 sm:gap-3 rounded-lg sm:rounded-xl shadow-md active:scale-95 transition`}
            >
              {voiceEnabled ? (
                <>
                  <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Voice Activation: ON</span>
                  {isListening && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
                </>
              ) : (
                <>
                  <MicOff className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Voice Activation: OFF</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Voice Logs */}
        {voiceEnabled && voiceLogs.length > 0 && (
          <div className="mt-3 sm:mt-4 bg-gray-900 text-gray-100 rounded-lg sm:rounded-xl p-3 sm:p-4 max-h-48 sm:max-h-64 overflow-y-auto w-full max-w-md">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h4 className="text-xs font-semibold text-gray-300">Voice Logs</h4>
              <button
                onClick={onClearVoiceLogs}
                className="text-xs text-gray-400 hover:text-white active:scale-95 transition"
              >
                Clear
              </button>
            </div>
            <div className="space-y-1 font-mono text-xs">
              {voiceLogs.map((log, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2 text-[10px] sm:text-xs ${
                    log.type === 'error' ? 'text-red-400' :
                    log.type === 'success' ? 'text-green-400' :
                    log.type === 'warning' ? 'text-yellow-400' :
                    'text-gray-300'
                  }`}
                >
                  <span className="text-gray-500 shrink-0">{log.timestamp}</span>
                  <span className="flex-1 break-words">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Start/Stop Button */}
        <button
          onClick={isWalking ? onStopWalk : onStartWalk}
          disabled={loading}
          className={`${
            isWalking
              ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
              : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
          } text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold w-full max-w-md rounded-lg sm:rounded-xl transition shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100`}
        >
          {loading ? 'Please wait...' : isWalking ? 'Stop Walk Mode' : 'Start Walk Mode'}
        </button>
      </div>
    </div>
  );
}

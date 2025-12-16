import { Map } from 'lucide-react';

interface Location {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp?: string;
}

interface TrackingViewProps {
  location: Location | null;
  isTracking: boolean;
  onStartTracking: () => void;
  onStopTracking: () => void;
}

export default function TrackingView({
  location,
  isTracking,
  onStartTracking,
  onStopTracking
}: TrackingViewProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6">
        <h3 className="font-semibold text-xl sm:text-2xl text-gray-800 mb-4 flex items-center">
          <Map className="mr-2 text-indigo-600" size={24} />
          Live Tracking
        </h3>

        <div className="mb-4 sm:mb-6">
          {!isTracking ? (
            <button
              onClick={onStartTracking}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 active:scale-95 transition shadow-md text-sm sm:text-base"
            >
              Start Live Tracking
            </button>
          ) : (
            <button
              onClick={onStopTracking}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold hover:from-red-700 hover:to-red-800 active:scale-95 transition shadow-md text-sm sm:text-base"
            >
              Stop Tracking
            </button>
          )}
        </div>

        {location && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-blue-200">
            <h4 className="font-semibold mb-3 sm:mb-4 text-gray-800 text-base sm:text-lg">Current Location</h4>
            <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Latitude:</span>
                <span className="text-gray-800">{location.lat.toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Longitude:</span>
                <span className="text-gray-800">{location.lng.toFixed(6)}</span>
              </div>
              {location.accuracy && (
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Accuracy:</span>
                  <span className="text-gray-800">±{location.accuracy.toFixed(0)}m</span>
                </div>
              )}
              {location.timestamp && (
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Last Update:</span>
                  <span className="text-gray-800">{new Date(location.timestamp).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

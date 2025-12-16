import { Activity, Navigation, Shield } from 'lucide-react';

interface StatusCardsProps {
  safetyScore: number;
  walkingStatus: string;
  isWalking: boolean;
  trustedContactsCount: number;
}

export default function StatusCards({
  safetyScore,
  walkingStatus,
  isWalking,
  trustedContactsCount
}: StatusCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
      {/* Safety Score Card */}
      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-green-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm sm:text-base text-gray-700">Safety Score</h3>
          <Activity
            className={`${
              safetyScore > 70 ? 'text-green-600' :
              safetyScore > 50 ? 'text-yellow-600' :
              'text-red-600'
            }`}
            size={20}
          />
        </div>
        <p className="text-4xl sm:text-5xl font-bold text-gray-800">{safetyScore}</p>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">
          {walkingStatus === 'safe' ? 'Area is safe' :
           walkingStatus === 'caution' ? 'Stay alert' :
           'High risk detected'}
        </p>
      </div>

      {/* Walk Status Card */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-blue-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm sm:text-base text-gray-700">Walk Status</h3>
          <Navigation className={isWalking ? 'text-green-600' : 'text-gray-400'} size={20} />
        </div>
        <p className="text-2xl sm:text-3xl font-bold text-gray-800">
          {isWalking ? 'Active' : 'Inactive'}
        </p>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">
          {isWalking ? 'Being monitored' : 'Start walk mode'}
        </p>
      </div>

      {/* Trusted Contacts Card */}
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-purple-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm sm:text-base text-gray-700">Trusted Contacts</h3>
          <Shield className="text-purple-600" size={20} />
        </div>
        <p className="text-4xl sm:text-5xl font-bold text-gray-800">{trustedContactsCount}</p>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">Ready to help</p>
      </div>
    </div>
  );
}

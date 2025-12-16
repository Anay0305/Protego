import { Shield, Map } from 'lucide-react';

export default function SafetyView() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6">
        <h3 className="font-semibold text-xl sm:text-2xl text-gray-800 mb-4 sm:mb-6">Security & Privacy</h3>
        <div className="space-y-4 sm:space-y-5">
          <div className="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 bg-green-50 rounded-lg sm:rounded-xl">
            <Shield className="text-green-600 flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6" />
            <div>
              <h4 className="font-semibold text-gray-800 mb-1 text-sm sm:text-base">End-to-End Encryption</h4>
              <p className="text-xs sm:text-sm text-gray-600">All data encrypted securely with industry-standard protocols</p>
            </div>
          </div>
          <div className="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 bg-blue-50 rounded-lg sm:rounded-xl">
            <Map className="text-blue-600 flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6" />
            <div>
              <h4 className="font-semibold text-gray-800 mb-1 text-sm sm:text-base">Location Privacy</h4>
              <p className="text-xs sm:text-sm text-gray-600">Shared only with trusted contacts during emergencies</p>
            </div>
          </div>
          <div className="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 bg-purple-50 rounded-lg sm:rounded-xl">
            <Shield className="text-purple-600 flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6" />
            <div>
              <h4 className="font-semibold text-gray-800 mb-1 text-sm sm:text-base">Secure Authentication</h4>
              <p className="text-xs sm:text-sm text-gray-600">JWT-based authentication with bcrypt password hashing</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 border border-indigo-200">
        <h3 className="font-semibold text-xl sm:text-2xl text-gray-800 mb-4 sm:mb-6">Safety Tips</h3>
        <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-700">
          <li className="flex items-start">
            <span className="text-indigo-600 mr-2 sm:mr-3 text-base sm:text-lg">•</span>
            <span>Keep the app running for continuous protection</span>
          </li>
          <li className="flex items-start">
            <span className="text-indigo-600 mr-2 sm:mr-3 text-base sm:text-lg">•</span>
            <span>Update your trusted contacts regularly</span>
          </li>
          <li className="flex items-start">
            <span className="text-indigo-600 mr-2 sm:mr-3 text-base sm:text-lg">•</span>
            <span>Enable location services for accurate tracking</span>
          </li>
          <li className="flex items-start">
            <span className="text-indigo-600 mr-2 sm:mr-3 text-base sm:text-lg">•</span>
            <span>Trust your instincts - if you feel unsafe, activate tracking</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

import { AlertTriangle } from 'lucide-react';

interface SOSButtonProps {
  isActive: boolean;
  onTrigger: () => void;
  onCancel: () => void;
}

export default function SOSButton({ isActive, onTrigger, onCancel }: SOSButtonProps) {
  if (isActive) {
    return (
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl animate-pulse shadow-lg">
        <div className="text-center">
          <AlertTriangle size={40} className="sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 animate-bounce" />
          <h3 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">EMERGENCY ACTIVE</h3>
          <p className="text-sm sm:text-base mb-3 sm:mb-4">Help is on the way. Stay safe!</p>
          <button
            onClick={onCancel}
            className="bg-white text-red-600 px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-gray-100 active:scale-95 transition text-sm sm:text-base"
          >
            Cancel SOS
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={onTrigger}
      className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-4 sm:py-6 rounded-xl sm:rounded-2xl font-bold text-lg sm:text-2xl shadow-lg hover:shadow-xl active:scale-95 transition flex items-center justify-center space-x-2 sm:space-x-3"
    >
      <AlertTriangle size={28} className="sm:w-8 sm:h-8" />
      <span>SOS EMERGENCY</span>
    </button>
  );
}

import { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';
import { alertAPI } from '../services/api';

function CountdownAlert({ alert }) {
  const { clearPendingAlert, setCountdown, countdown } = useUserStore();
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    // Start countdown from 5 seconds
    let timeLeft = 5;
    setCountdown(timeLeft);

    const timer = setInterval(() => {
      timeLeft -= 1;
      setCountdown(timeLeft);

      if (timeLeft <= 0) {
        clearInterval(timer);
        clearPendingAlert();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [alert.id]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await alertAPI.cancelAlert(alert.id);
      clearPendingAlert();
    } catch (err) {
      console.error('Failed to cancel alert:', err);
      setCancelling(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 animate-pulse-slow">
        {/* Alert Icon */}
        <div className="flex justify-center mb-4">
          <div className="bg-danger-100 p-4 rounded-full">
            <AlertTriangle className="w-16 h-16 text-danger-600" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
          Potential Distress Detected!
        </h2>

        {/* Countdown */}
        <div className="text-center mb-6">
          <p className="text-gray-600 mb-4">
            Emergency contacts will be notified in
          </p>
          <div className="flex justify-center mb-4">
            <div className="bg-danger-600 text-white rounded-full w-24 h-24 flex items-center justify-center">
              <span className="text-5xl font-bold">{countdown}</span>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Alert Type: <span className="font-medium">{alert.type.toUpperCase()}</span>
          </p>
          <p className="text-sm text-gray-600">
            Confidence: <span className="font-medium">{(alert.confidence * 100).toFixed(0)}%</span>
          </p>
        </div>

        {/* Cancel Button */}
        <button
          onClick={handleCancel}
          disabled={cancelling || countdown <= 0}
          className="btn-success w-full py-4 text-lg font-semibold flex items-center justify-center gap-2"
        >
          <X className="w-6 h-6" />
          {cancelling ? 'Cancelling...' : "I'm Safe - Cancel Alert"}
        </button>

        <p className="text-xs text-gray-500 text-center mt-4">
          If you don't cancel, your trusted contacts will receive an emergency SMS
          with your location
        </p>
      </div>
    </div>
  );
}

export default CountdownAlert;

import { Bell } from 'lucide-react';

interface Alert {
  id: number;
  type: string;
  message: string;
  timestamp: string;
}

interface AlertsListProps {
  alerts: Alert[];
}

export default function AlertsList({ alerts }: AlertsListProps) {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6">
      <h3 className="font-semibold text-lg sm:text-xl text-gray-800 mb-3 sm:mb-4 flex items-center">
        <Bell className="mr-2 text-indigo-600" size={20} />
        Recent Alerts
      </h3>
      <div className="space-y-2">
        {alerts.length === 0 ? (
          <p className="text-gray-500 text-center py-3 sm:py-4 text-sm">No recent alerts</p>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3 sm:p-4 rounded-lg sm:rounded-xl ${
                alert.type === 'emergency' ? 'bg-red-50 border-l-4 border-red-500' :
                alert.type === 'warning' ? 'bg-yellow-50 border-l-4 border-yellow-500' :
                alert.type === 'success' ? 'bg-green-50 border-l-4 border-green-500' :
                'bg-blue-50 border-l-4 border-blue-500'
              }`}
            >
              <div className="flex justify-between items-start gap-2">
                <p className="text-xs sm:text-sm font-medium text-gray-800 flex-1">{alert.message}</p>
                <span className="text-[10px] sm:text-xs text-gray-500 shrink-0">{alert.timestamp}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

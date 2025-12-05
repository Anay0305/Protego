import { useState, useEffect } from 'react';
import { AlertTriangle, Filter } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';
import { alertAPI } from '../services/api';
import AlertCard from '../components/AlertCard';

function Alerts() {
  const { user } = useUserStore();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, triggered, cancelled

  useEffect(() => {
    fetchAlerts();
  }, [user]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const data = await alertAPI.getUserAlerts(user.id);
      setAlerts(data);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === 'all') return true;
    return alert.status === filter;
  });

  const getStatusCount = (status) => {
    return alerts.filter((a) => a.status === status).length;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Alert History</h1>
        <p className="text-gray-600">
          View all safety alerts and their current status
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-700">Filter by Status:</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({alerts.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-yellow-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending ({getStatusCount('pending')})
          </button>
          <button
            onClick={() => setFilter('triggered')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'triggered'
                ? 'bg-danger-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Triggered ({getStatusCount('triggered')})
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'cancelled'
                ? 'bg-gray-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Cancelled ({getStatusCount('cancelled')})
          </button>
          <button
            onClick={() => setFilter('safe')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'safe'
                ? 'bg-success-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Safe ({getStatusCount('safe')})
          </button>
        </div>
      </div>

      {/* Alerts List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading alerts...</p>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="card text-center py-12">
          <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No Alerts Found
          </h3>
          <p className="text-gray-600">
            {filter === 'all'
              ? 'You have no safety alerts yet. Start Walk Mode to enable monitoring.'
              : `No ${filter} alerts found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Alerts;

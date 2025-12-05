import { useState, useEffect } from 'react';
import { TrendingUp, AlertTriangle, Shield, Clock } from 'lucide-react';
import { alertAPI, walkAPI } from '../services/api';

function QuickStats({ userId }) {
  const [stats, setStats] = useState({
    totalAlerts: 0,
    triggeredAlerts: 0,
    cancelledAlerts: 0,
    totalSessions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [userId]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [alerts, sessions] = await Promise.all([
        alertAPI.getUserAlerts(userId),
        walkAPI.getUserSessions(userId),
      ]);

      const triggered = alerts.filter((a) => a.status === 'triggered').length;
      const cancelled = alerts.filter((a) => a.status === 'cancelled').length;

      setStats({
        totalAlerts: alerts.length,
        triggeredAlerts: triggered,
        cancelledAlerts: cancelled,
        totalSessions: sessions.length,
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {/* Total Sessions */}
      <div className="card bg-primary-50 border border-primary-200">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-primary-900">Walk Sessions</p>
          <Shield className="w-5 h-5 text-primary-600" />
        </div>
        <p className="text-3xl font-bold text-primary-900">{stats.totalSessions}</p>
      </div>

      {/* Total Alerts */}
      <div className="card bg-yellow-50 border border-yellow-200">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-yellow-900">Total Alerts</p>
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
        </div>
        <p className="text-3xl font-bold text-yellow-900">{stats.totalAlerts}</p>
      </div>

      {/* Triggered Alerts */}
      <div className="card bg-danger-50 border border-danger-200">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-danger-900">Triggered</p>
          <TrendingUp className="w-5 h-5 text-danger-600" />
        </div>
        <p className="text-3xl font-bold text-danger-900">{stats.triggeredAlerts}</p>
      </div>

      {/* Cancelled Alerts */}
      <div className="card bg-success-50 border border-success-200">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-success-900">Cancelled</p>
          <Clock className="w-5 h-5 text-success-600" />
        </div>
        <p className="text-3xl font-bold text-success-900">{stats.cancelledAlerts}</p>
      </div>
    </div>
  );
}

export default QuickStats;

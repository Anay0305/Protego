import { useState, useEffect } from 'react';
import { BarChart3, Users, AlertTriangle, Activity, RefreshCw } from 'lucide-react';
import { adminAPI } from '../services/api';
import { useAdminStore } from '../store/useUserStore';
import AlertCard from '../components/AlertCard';

function Admin() {
  const { stats, setStats, allAlerts, setAllAlerts, activeUsers, setActiveUsers } =
    useAdminStore();

  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('stats'); // stats, alerts, users
  const [statusFilter, setStatusFilter] = useState(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsData, alertsData, usersData] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.listAlerts({ limit: 100 }),
        adminAPI.getActiveUsers(),
      ]);

      setStats(statsData);
      setAllAlerts(alertsData);
      setActiveUsers(usersData);
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAlerts = statusFilter
    ? allAlerts.filter((alert) => alert.status === statusFilter)
    : allAlerts;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">Monitor system-wide safety alerts and activity</p>
        </div>
        <button
          onClick={fetchAdminData}
          className="btn-secondary flex items-center"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setSelectedTab('stats')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              selectedTab === 'stats'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Statistics
          </button>
          <button
            onClick={() => setSelectedTab('alerts')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              selectedTab === 'alerts'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <AlertTriangle className="w-4 h-4 inline mr-2" />
            All Alerts ({allAlerts.length})
          </button>
          <button
            onClick={() => setSelectedTab('users')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              selectedTab === 'users'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Active Users ({activeUsers.length})
          </button>
        </div>
      </div>

      {/* Statistics Tab */}
      {selectedTab === 'stats' && stats && (
        <div>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card bg-primary-50 border border-primary-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-primary-900">Total Users</h3>
                <Users className="w-5 h-5 text-primary-600" />
              </div>
              <p className="text-3xl font-bold text-primary-900">{stats.total_users}</p>
            </div>

            <div className="card bg-success-50 border border-success-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-success-900">Active Sessions</h3>
                <Activity className="w-5 h-5 text-success-600" />
              </div>
              <p className="text-3xl font-bold text-success-900">
                {stats.active_walk_sessions}
              </p>
            </div>

            <div className="card bg-yellow-50 border border-yellow-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-yellow-900">Total Alerts</h3>
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
              <p className="text-3xl font-bold text-yellow-900">{stats.total_alerts}</p>
            </div>

            <div className="card bg-danger-50 border border-danger-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-danger-900">Triggered (24h)</h3>
                <AlertTriangle className="w-5 h-5 text-danger-600" />
              </div>
              <p className="text-3xl font-bold text-danger-900">
                {stats.triggered_last_24h}
              </p>
            </div>
          </div>

          {/* Alert Breakdown */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Alert Status Breakdown
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(stats.alert_breakdown || {}).map(([status, count]) => (
                <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                  <p className="text-sm text-gray-600 capitalize">{status}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Alerts Tab */}
      {selectedTab === 'alerts' && (
        <div>
          {/* Filter */}
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => setStatusFilter(null)}
              className={`px-4 py-2 rounded-lg ${
                statusFilter === null
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              All
            </button>
            {['pending', 'triggered', 'cancelled', 'safe'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg capitalize ${
                  statusFilter === status
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Alerts List */}
          <div className="space-y-4">
            {filteredAlerts.length === 0 ? (
              <div className="card text-center py-12">
                <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No alerts found</p>
              </div>
            ) : (
              filteredAlerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))
            )}
          </div>
        </div>
      )}

      {/* Active Users Tab */}
      {selectedTab === 'users' && (
        <div>
          {activeUsers.length === 0 ? (
            <div className="card text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No active walk sessions</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeUsers.map((userSession) => (
                <div key={userSession.user_id} className="card">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {userSession.user_name}
                      </h3>
                      <p className="text-sm text-gray-600">{userSession.user_phone}</p>
                    </div>
                    <span className="badge-success">Active</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p className="mb-1">
                      <span className="font-medium">Session ID:</span>{' '}
                      {userSession.session_id}
                    </p>
                    <p className="mb-1">
                      <span className="font-medium">Started:</span>{' '}
                      {new Date(userSession.start_time).toLocaleString()}
                    </p>
                    {userSession.location_lat && userSession.location_lng && (
                      <p>
                        <span className="font-medium">Location:</span>{' '}
                        <a
                          href={`https://maps.google.com/?q=${userSession.location_lat},${userSession.location_lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:underline"
                        >
                          View on Map
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Admin;

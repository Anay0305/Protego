import { AlertTriangle, CheckCircle, XCircle, Clock, MapPin } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

function AlertCard({ alert }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-50 border-yellow-200';
      case 'triggered':
        return 'bg-danger-50 border-danger-200';
      case 'cancelled':
        return 'bg-gray-50 border-gray-200';
      case 'safe':
        return 'bg-success-50 border-success-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="badge-warning">Pending</span>;
      case 'triggered':
        return <span className="badge-danger">Triggered</span>;
      case 'cancelled':
        return <span className="badge bg-gray-100 text-gray-800">Cancelled</span>;
      case 'safe':
        return <span className="badge-success">Safe</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'triggered':
        return <AlertTriangle className="w-5 h-5 text-danger-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-gray-500" />;
      case 'safe':
        return <CheckCircle className="w-5 h-5 text-success-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTypeLabel = (type) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className={`card border-2 ${getStatusColor(alert.status)}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          {getStatusIcon(alert.status)}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {getTypeLabel(alert.type)}
            </h3>
            <p className="text-sm text-gray-600">
              {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
        {getStatusBadge(alert.status)}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Confidence
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  alert.confidence >= 0.8
                    ? 'bg-danger-500'
                    : alert.confidence >= 0.6
                    ? 'bg-yellow-500'
                    : 'bg-success-500'
                }`}
                style={{ width: `${alert.confidence * 100}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium text-gray-900">
              {(alert.confidence * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Alert ID
          </p>
          <p className="text-sm font-mono text-gray-900">#{alert.id}</p>
        </div>
      </div>

      {/* Location */}
      {alert.location_lat && alert.location_lng && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            <a
              href={`https://maps.google.com/?q=${alert.location_lat},${alert.location_lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary-600 hover:underline"
            >
              View Location on Map
            </a>
          </div>
        </div>
      )}

      {/* Timestamps */}
      <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="font-medium">Created:</span>{' '}
            {new Date(alert.created_at).toLocaleString()}
          </div>
          {alert.triggered_at && (
            <div>
              <span className="font-medium">Triggered:</span>{' '}
              {new Date(alert.triggered_at).toLocaleString()}
            </div>
          )}
          {alert.cancelled_at && (
            <div>
              <span className="font-medium">Cancelled:</span>{' '}
              {new Date(alert.cancelled_at).toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AlertCard;

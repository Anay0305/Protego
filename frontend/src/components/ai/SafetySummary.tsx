import { useState, useEffect } from 'react';
import {
  Sparkles,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Lightbulb,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { aiAPI, SafetySummaryResponse } from '../../services/api';

interface SafetySummaryProps {
  sessionId?: number;
  showLatest?: boolean;
  compact?: boolean;
}

export default function SafetySummary({
  sessionId,
  showLatest = false,
  compact = false
}: SafetySummaryProps) {
  const [summary, setSummary] = useState<SafetySummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(!compact);

  const fetchSummary = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = sessionId
        ? await aiAPI.getSessionSummary(sessionId)
        : await aiAPI.getLatestSummary();

      setSummary(response.data);
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Failed to load summary';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (sessionId || showLatest) {
      fetchSummary();
    }
  }, [sessionId, showLatest]);

  const getRiskLevelStyles = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-700',
          icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
          badge: 'bg-red-100 text-red-700',
        };
      case 'medium':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-700',
          icon: <Shield className="w-5 h-5 text-yellow-500" />,
          badge: 'bg-yellow-100 text-yellow-700',
        };
      default:
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-700',
          icon: <CheckCircle className="w-5 h-5 text-green-500" />,
          badge: 'bg-green-100 text-green-700',
        };
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-center gap-3 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Generating AI summary...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="text-center">
          <p className="text-gray-500 mb-3">{error}</p>
          <button
            onClick={fetchSummary}
            className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  const riskStyles = getRiskLevelStyles(summary.risk_level);

  // Compact version
  if (compact && !expanded) {
    return (
      <div
        className={`${riskStyles.bg} ${riskStyles.border} border rounded-xl p-4 cursor-pointer hover:shadow-sm transition`}
        onClick={() => setExpanded(true)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/80 rounded-full">
              <Sparkles className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-800">AI Safety Summary</h4>
              <p className="text-sm text-gray-600">{summary.session_duration_minutes} min session</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${riskStyles.badge}`}>
              {summary.risk_level.toUpperCase()} RISK
            </span>
            <ChevronDown className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${riskStyles.bg} ${riskStyles.border} border rounded-xl overflow-hidden`}>
      {/* Header */}
      <div className="p-4 bg-white/50 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">AI Safety Summary</h3>
              <p className="text-xs text-gray-500">Powered by Protego AI</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${riskStyles.badge}`}>
              {summary.risk_level.toUpperCase()} RISK
            </span>
            {compact && (
              <button onClick={() => setExpanded(false)} className="p-1 hover:bg-white/50 rounded">
                <ChevronUp className="w-5 h-5 text-gray-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/60 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium">Duration</span>
            </div>
            <p className="text-lg font-bold text-gray-800">{summary.session_duration_minutes} min</p>
          </div>
          <div className="bg-white/60 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-medium">Alerts</span>
            </div>
            <p className="text-lg font-bold text-gray-800">{summary.total_alerts}</p>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white/60 rounded-lg p-4">
          <div className="flex items-start gap-3">
            {riskStyles.icon}
            <div>
              <h4 className="font-medium text-gray-800 mb-1">Summary</h4>
              <p className="text-sm text-gray-600">{summary.summary}</p>
            </div>
          </div>
        </div>

        {/* Alerts Analysis */}
        {summary.alerts_analysis && (
          <div className="bg-white/60 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <div>
                <h4 className="font-medium text-gray-800 mb-1">Alerts Analysis</h4>
                <p className="text-sm text-gray-600">{summary.alerts_analysis}</p>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {summary.recommendations.length > 0 && (
          <div className="bg-white/60 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              <h4 className="font-medium text-gray-800">AI Recommendations</h4>
            </div>
            <ul className="space-y-2">
              {summary.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-medium shrink-0">
                    {idx + 1}
                  </span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-white/30 border-t border-gray-100">
        <button
          onClick={fetchSummary}
          className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh summary
        </button>
      </div>
    </div>
  );
}

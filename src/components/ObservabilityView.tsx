import React, { useState } from 'react';
import {
  Activity,
  Search,
  Maximize2
} from 'lucide-react';
import { TelemetryMetric, ObservabilityLog, NavViewId } from '../types';
import { MetricDetailModal, ConfirmationModal } from './Modals';
import { useTheme } from '../context/ThemeContext';

interface ObservabilityViewProps {
  metrics: TelemetryMetric[];
  logs: ObservabilityLog[];
  onNavigateToView?: (view: NavViewId) => void;
}

export const ObservabilityView: React.FC<ObservabilityViewProps> = ({
  metrics,
  logs,
  onNavigateToView
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [logFilter, setLogFilter] = useState<'ALL' | 'INFO' | 'WARN' | 'ERROR'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMetricModal, setActiveMetricModal] = useState<'latency' | 'errorRate' | 'cpu' | 'memory' | 'requests' | null>(null);
  const [selectedLogTrace, setSelectedLogTrace] = useState<ObservabilityLog | null>(null);

  const filteredLogs = (logs || []).filter((log) => {
    const matchesLevel = logFilter === 'ALL' || log?.level === logFilter;
    const msgStr = (log?.message || '').toLowerCase();
    const srvStr = (log?.service || '').toLowerCase();
    const query = (searchQuery || '').toLowerCase();
    const matchesQuery = msgStr.includes(query) || srvStr.includes(query);
    return matchesLevel && matchesQuery;
  });

  return (
    <div
      id="observability-view"
      className={`flex-1 p-6 space-y-6 overflow-y-auto font-mono transition-colors ${
        isDark ? 'bg-[#0A0B0D] text-[#E0E0E0]' : 'bg-[#F6F8FA] text-[#111827]'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
            <h1 className={`text-sm font-bold tracking-tight uppercase ${isDark ? 'text-white' : 'text-gray-900'}`}>
              TELEMETRY & DISTRIBUTED OBSERVABILITY
            </h1>
          </div>
          <p className={`text-xs mt-1 font-sans ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Real-time APM metrics, latency percentiles, error rate spikes, and structured log tracing.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border ${
              isDark ? 'bg-[#1A1D23] border-[#2D3748] text-gray-400' : 'bg-white border-gray-300 text-gray-700 shadow-xs'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>OPENTELEMETRY STREAM: <strong className={isDark ? 'text-emerald-400' : 'text-emerald-700'}>ACTIVE</strong></span>
          </span>
        </div>
      </div>

      {/* Real-time Metric Graphs (SVG Visualization & Clickable) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Metric 1: P95 Latency Chart */}
        <div
          onClick={() => setActiveMetricModal('latency')}
          className={`p-4 rounded-lg border transition cursor-pointer space-y-3 group ${
            isDark
              ? 'bg-[#1A1D23] border-[#2D3748] hover:border-emerald-500/50'
              : 'bg-white border-[#D0D7DE] hover:border-emerald-600 shadow-xs'
          }`}
          title="Click to view detailed timeseries curve"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className={`text-xs uppercase transition ${isDark ? 'text-gray-400 group-hover:text-emerald-400' : 'text-gray-500 group-hover:text-emerald-700'}`}>
                P95 API Response Latency
              </span>
              <div className={`text-xl font-bold mt-0.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {metrics[metrics.length - 1]?.p95LatencyMs || 38} ms
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2 py-0.5 rounded border ${
                  isDark
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                    : 'text-emerald-700 bg-emerald-50 border-emerald-200 font-bold'
                }`}
              >
                TARGET &lt; 50ms
              </span>
              <Maximize2 className={`w-3.5 h-3.5 transition ${isDark ? 'text-gray-500 group-hover:text-white' : 'text-gray-400 group-hover:text-gray-900'}`} />
            </div>
          </div>

          {/* SVG Latency Sparkline */}
          <div
            className={`h-32 w-full rounded border p-2 flex items-end ${
              isDark ? 'bg-[#0A0B0D] border-[#2D3748]' : 'bg-[#0A0B0D] border-gray-800'
            }`}
          >
            <svg className="w-full h-full overflow-visible" viewBox="0 0 400 100">
              <path
                d="M 0 85 L 60 82 L 120 80 L 180 15 L 240 20 L 300 85 L 360 88 L 400 90"
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
              />
              {/* Anomaly Highlight */}
              <circle cx="180" cy="15" r="4" fill="#f43f5e" />
              <text x="185" y="15" fill="#f43f5e" fontSize="10" fontFamily="monospace">
                314ms Spike (v2.4.1)
              </text>
              <circle cx="360" cy="88" r="4" fill="#10b981" />
              <text x="310" y="80" fill="#10b981" fontSize="10" fontFamily="monospace">
                38ms Normalized
              </text>
            </svg>
          </div>
        </div>

        {/* Metric 2: Error Rate Chart */}
        <div
          onClick={() => setActiveMetricModal('errorRate')}
          className={`p-4 rounded-lg border transition cursor-pointer space-y-3 group ${
            isDark
              ? 'bg-[#1A1D23] border-[#2D3748] hover:border-rose-500/50'
              : 'bg-white border-[#D0D7DE] hover:border-rose-500 shadow-xs'
          }`}
          title="Click to inspect error spikes"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className={`text-xs uppercase transition ${isDark ? 'text-gray-400 group-hover:text-rose-400' : 'text-gray-500 group-hover:text-rose-600'}`}>
                HTTP 5xx Error Rate (%)
              </span>
              <div className={`text-xl font-bold mt-0.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {metrics[metrics.length - 1]?.errorRatePercent || 0.02} %
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2 py-0.5 rounded border ${
                  isDark
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                    : 'text-emerald-700 bg-emerald-50 border-emerald-200 font-bold'
                }`}
              >
                SLA 99.9%
              </span>
              <Maximize2 className={`w-3.5 h-3.5 transition ${isDark ? 'text-gray-500 group-hover:text-white' : 'text-gray-400 group-hover:text-gray-900'}`} />
            </div>
          </div>

          {/* SVG Error Rate Sparkline */}
          <div
            className={`h-32 w-full rounded border p-2 flex items-end ${
              isDark ? 'bg-[#0A0B0D] border-[#2D3748]' : 'bg-[#0A0B0D] border-gray-800'
            }`}
          >
            <svg className="w-full h-full overflow-visible" viewBox="0 0 400 100">
              <path
                d="M 0 95 L 60 94 L 120 95 L 180 20 L 240 30 L 300 95 L 360 96 L 400 98"
                fill="none"
                stroke="#f43f5e"
                strokeWidth="2"
              />
              <circle cx="180" cy="20" r="4" fill="#f43f5e" />
              <text x="190" y="25" fill="#f43f5e" fontSize="10" fontFamily="monospace">
                28.6% 500 Spike
              </text>
            </svg>
          </div>
        </div>
      </div>

      {/* Structured Log Explorer */}
      <div
        className={`p-5 rounded-lg border space-y-4 ${
          isDark ? 'bg-[#1A1D23] border-[#2D3748]' : 'bg-white border-[#D0D7DE] shadow-xs'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            STRUCTURED LOG STREAM EXPLORER ({filteredLogs.length})
          </span>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-500" />
              <input
                type="text"
                placeholder="Search log messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-8 pr-3 py-1 rounded text-xs border focus:outline-hidden ${
                  isDark
                    ? 'bg-[#0A0B0D] text-gray-200 border-[#2D3748] focus:border-emerald-500'
                    : 'bg-[#F6F8FA] text-gray-900 border-gray-300 focus:border-emerald-600 shadow-xs'
                }`}
              />
            </div>

            <div
              className={`flex items-center rounded p-0.5 border text-xs ${
                isDark ? 'bg-[#0A0B0D] border-[#2D3748]' : 'bg-gray-100 border-gray-300'
              }`}
            >
              {(['ALL', 'INFO', 'WARN', 'ERROR'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setLogFilter(lvl)}
                  className={`px-2 py-0.5 rounded uppercase font-bold transition cursor-pointer text-[10px] ${
                    logFilter === lvl
                      ? isDark
                        ? 'bg-[#2D3748] text-white'
                        : 'bg-emerald-600 text-white'
                      : isDark
                      ? 'text-gray-500 hover:text-gray-300'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Log Entries */}
        <div className="space-y-1.5 text-xs max-h-72 overflow-y-auto font-mono">
          {filteredLogs.map((log) => {
            let levelBadge = isDark
              ? 'text-gray-400 bg-[#0F1115] border border-[#2D3748]'
              : 'text-gray-700 bg-gray-100 border border-gray-300';
            if (log.level === 'ERROR') {
              levelBadge = isDark
                ? 'text-rose-400 bg-rose-500/20 border border-rose-500/30 font-bold'
                : 'text-rose-700 bg-rose-50 border border-rose-200 font-bold';
            }
            if (log.level === 'WARN') {
              levelBadge = isDark
                ? 'text-amber-300 bg-amber-500/20 border border-amber-500/30 font-bold'
                : 'text-amber-800 bg-amber-50 border border-amber-200 font-bold';
            }
            if (log.level === 'INFO') {
              levelBadge = isDark
                ? 'text-emerald-400 bg-emerald-500/20 border border-emerald-500/30 font-bold'
                : 'text-emerald-800 bg-emerald-50 border border-emerald-200 font-bold';
            }

            return (
              <div
                key={log.id}
                onClick={() => setSelectedLogTrace(log)}
                className={`p-2 rounded border flex items-start gap-2.5 leading-relaxed cursor-pointer transition ${
                  isDark
                    ? 'bg-[#0A0B0D] border-[#2D3748] hover:border-gray-500'
                    : 'bg-[#F6F8FA] border-[#D0D7DE] hover:border-gray-400'
                }`}
              >
                <span className="text-gray-500 text-[10px] shrink-0 mt-0.5">{log.timestamp}</span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] shrink-0 ${levelBadge}`}>
                  {log.level}
                </span>
                <span className={`text-[11px] shrink-0 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>[{log.service}]</span>
                <span className={`flex-1 font-sans text-xs ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{log.message}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Metric Detail Modal */}
      {activeMetricModal && (
        <MetricDetailModal
          isOpen={true}
          onClose={() => setActiveMetricModal(null)}
          metricType={activeMetricModal}
          currentValue={activeMetricModal === 'latency' ? '38 ms' : '0.02 %'}
          onNavigateToView={onNavigateToView}
        />
      )}

      {/* Structured JSON Trace Modal */}
      {selectedLogTrace && (
        <ConfirmationModal
          isOpen={true}
          onClose={() => setSelectedLogTrace(null)}
          onConfirm={() => setSelectedLogTrace(null)}
          title={`OPENTELEMETRY TRACE: ${selectedLogTrace.id}`}
          description={`Log record emitted by service ${selectedLogTrace.service} at ${selectedLogTrace.timestamp}.`}
          confirmLabel="CLOSE TRACE"
          cancelLabel="DISMISS"
          details={[
            { label: 'Trace ID', value: selectedLogTrace.id },
            { label: 'Service', value: selectedLogTrace.service },
            { label: 'Log Level', value: selectedLogTrace.level },
            { label: 'Timestamp', value: `${selectedLogTrace.timestamp} UTC` },
            { label: 'Message Payload', value: selectedLogTrace.message }
          ]}
        />
      )}
    </div>
  );
};

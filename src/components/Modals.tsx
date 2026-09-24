import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Rocket,
  Shield,
  Activity,
  Server,
  Bot,
  Terminal,
  Clock,
  ExternalLink,
  Layers,
  Lock
} from 'lucide-react';
import { RbacRole, RiskLevel } from '../types';

/* =========================================================================
   1. GENERIC CONFIRMATION MODAL
   ========================================================================= */
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary' | 'success';
  riskLevel?: RiskLevel;
  details?: { label: string; value: string }[];
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'CONFIRM ACTION',
  cancelLabel = 'CANCEL',
  variant = 'primary',
  riskLevel,
  details,
  isLoading = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-mono overflow-y-auto">
      <div className="w-full max-w-lg my-auto rounded-xl bg-[#1A1D23] border border-[#2D3748] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 bg-[#0F1115] border-b border-[#2D3748] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {variant === 'danger' && <AlertTriangle className="w-4 h-4 text-rose-500" />}
            {variant === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
            {variant === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {variant === 'primary' && <Shield className="w-4 h-4 text-emerald-400" />}
            <h3 className="text-sm font-bold text-white tracking-tight uppercase">{title}</h3>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[#2D3748] text-gray-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <p className="text-xs text-gray-300 font-sans leading-relaxed">{description}</p>

          {riskLevel && (
            <div className="flex items-center justify-between p-2.5 rounded bg-[#0A0B0D] border border-[#2D3748] text-xs">
              <span className="text-gray-400">OPERATION RISK LEVEL:</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                  riskLevel === 'CRITICAL'
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                    : riskLevel === 'HIGH'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                }`}
              >
                {riskLevel}
              </span>
            </div>
          )}

          {details && details.length > 0 && (
            <div className="p-3 rounded bg-[#0A0B0D] border border-[#2D3748] space-y-1.5 text-xs">
              {details.map((d, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-gray-500">{d.label}:</span>
                  <span className="text-white font-medium">{d.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#0F1115] border-t border-[#2D3748] flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-3 py-1.5 rounded bg-[#1F2937] hover:bg-[#2D3748] text-gray-300 hover:text-white text-xs font-bold border border-[#374151] transition cursor-pointer"
          >
            {cancelLabel}
          </button>

          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-1.5 rounded text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              variant === 'danger'
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                : variant === 'warning'
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
            }`}
          >
            {isLoading && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   2. OBSERVABILITY METRIC DETAIL MODAL
   ========================================================================= */
interface MetricDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  metricType: 'latency' | 'errorRate' | 'cpu' | 'memory' | 'requests';
  currentValue: string;
  onNavigateToView?: (view: any) => void;
}

export const MetricDetailModal: React.FC<MetricDetailModalProps> = ({
  isOpen,
  onClose,
  metricType,
  currentValue,
  onNavigateToView
}) => {
  const [timeRange, setTimeRange] = useState<'15m' | '1h' | '6h' | '24h'>('1h');

  if (!isOpen) return null;

  const titles: Record<string, { name: string; target: string; desc: string }> = {
    latency: {
      name: 'P95 API Response Latency',
      target: '< 50ms Target SLA',
      desc: '95th percentile response latency sampled across all gateway ingress routes.'
    },
    errorRate: {
      name: 'HTTP 5xx Server Error Rate',
      target: '< 0.05% SLA Limit',
      desc: 'Proportion of unhandled 500/502/503 responses returned to clients.'
    },
    cpu: {
      name: 'Cluster CPU Utilization',
      target: '< 75% Capacity Limit',
      desc: 'Aggregated compute utilization across node pools in region us-central1-a.'
    },
    memory: {
      name: 'Cluster Memory Utilization',
      target: '< 80% Buffer Limit',
      desc: 'RAM allocation vs resident set size across all managed Kubernetes pods.'
    },
    requests: {
      name: 'Total Request Throughput',
      target: 'Capacity 10,000 req/sec',
      desc: 'Live ingress transaction rate processed by envoy edge proxy.'
    }
  };

  const meta = titles[metricType] || titles.latency;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-mono overflow-y-auto">
      <div className="w-full max-w-2xl my-auto rounded-xl bg-[#1A1D23] border border-[#2D3748] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-[#0F1115] border-b border-[#2D3748] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white tracking-tight uppercase">{meta.name}</h3>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-[#0A0B0D] rounded p-0.5 border border-[#2D3748] text-[10px]">
              {(['15m', '1h', '6h', '24h'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-2 py-0.5 rounded uppercase font-bold cursor-pointer ${
                    timeRange === r ? 'bg-[#2D3748] text-white' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-[#2D3748] text-gray-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded bg-[#0A0B0D] border border-[#2D3748]">
              <span className="text-[10px] text-gray-500 block">CURRENT VALUE</span>
              <span className="text-lg font-bold text-white mt-0.5 block">{currentValue}</span>
            </div>
            <div className="p-3 rounded bg-[#0A0B0D] border border-[#2D3748]">
              <span className="text-[10px] text-gray-500 block">TARGET BENCHMARK</span>
              <span className="text-xs font-bold text-emerald-400 mt-1 block">{meta.target}</span>
            </div>
            <div className="p-3 rounded bg-[#0A0B0D] border border-[#2D3748]">
              <span className="text-[10px] text-gray-500 block">ANOMALY STATUS</span>
              <span className="text-xs font-bold text-rose-400 mt-1 block">1 Correlated Spike</span>
            </div>
          </div>

          {/* SVG Detailed Telemetry Curve */}
          <div className="p-4 rounded bg-[#0A0B0D] border border-[#2D3748] space-y-2">
            <div className="flex items-center justify-between text-[10px] text-gray-500">
              <span>TIMESERIES STREAM ({timeRange.toUpperCase()})</span>
              <span className="text-emerald-400">PROMETHEUS HIGH-RES</span>
            </div>

            <div className="h-44 w-full flex items-end">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 500 120">
                <line x1="0" y1="90" x2="500" y2="90" stroke="#2D3748" strokeDasharray="4 4" />
                <text x="10" y="85" fill="#4B5563" fontSize="9">Baseline SLA (50ms)</text>

                <path
                  d="M 0 95 L 80 92 L 160 90 L 220 20 L 280 28 L 340 92 L 420 94 L 500 95"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                />

                {/* Critical spike marker */}
                <circle cx="220" cy="20" r="5" fill="#f43f5e" />
                <line x1="220" y1="20" x2="220" y2="110" stroke="#f43f5e" strokeDasharray="2 2" />
                <text x="228" y="25" fill="#f43f5e" fontSize="10" fontWeight="bold">
                  Spike 314ms [Deploy v2.4.1]
                </text>
              </svg>
            </div>
          </div>

          {/* Correlation Links */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
              CORRELATED TELEMETRY EVENTS
            </span>
            <div className="space-y-1.5 text-xs">
              <div className="p-2.5 rounded bg-[#0A0B0D] border border-[#2D3748] flex items-center justify-between">
                <div>
                  <span className="text-rose-400 font-bold">INCIDENT INC-2026-0819-01:</span>
                  <span className="text-gray-300 ml-2">Auth race condition & tokenVersion mismatch</span>
                </div>
                {onNavigateToView && (
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToView('incidents');
                    }}
                    className="text-emerald-400 hover:text-emerald-300 text-[11px] underline cursor-pointer"
                  >
                    VIEW INCIDENT →
                  </button>
                )}
              </div>

              <div className="p-2.5 rounded bg-[#0A0B0D] border border-[#2D3748] flex items-center justify-between">
                <div>
                  <span className="text-amber-400 font-bold">DEPLOYMENT v2.4.1:</span>
                  <span className="text-gray-300 ml-2">Commit 84c21a9 released to production at 09:14:00</span>
                </div>
                {onNavigateToView && (
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToView('deployments');
                    }}
                    className="text-emerald-400 hover:text-emerald-300 text-[11px] underline cursor-pointer"
                  >
                    VIEW RELEASE →
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0F1115] border-t border-[#2D3748] flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-[#1F2937] hover:bg-[#2D3748] text-white text-xs font-bold border border-[#374151] transition cursor-pointer"
          >
            CLOSE INSPECTOR
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   3. AUDIT EVENT DETAIL MODAL
   ========================================================================= */
interface AuditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: any;
}

export const AuditEventModal: React.FC<AuditEventModalProps> = ({
  isOpen,
  onClose,
  record
}) => {
  if (!isOpen || !record) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-mono overflow-y-auto">
      <div className="w-full max-w-xl my-auto rounded-xl bg-[#1A1D23] border border-[#2D3748] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-[#0F1115] border-b border-[#2D3748] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white tracking-tight uppercase">
              CRYPTOGRAPHIC AUDIT EVENT #{record.id}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[#2D3748] text-gray-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded bg-[#0A0B0D] border border-[#2D3748]">
              <span className="text-[10px] text-gray-500 block">ACTOR</span>
              <span className="font-bold text-white mt-0.5 block">{record.actor}</span>
            </div>
            <div className="p-3 rounded bg-[#0A0B0D] border border-[#2D3748]">
              <span className="text-[10px] text-gray-500 block">ACTION</span>
              <span className="font-bold text-emerald-400 mt-0.5 block">{record.action}</span>
            </div>
            <div className="p-3 rounded bg-[#0A0B0D] border border-[#2D3748]">
              <span className="text-[10px] text-gray-500 block">TARGET RESOURCE</span>
              <span className="font-bold text-gray-300 mt-0.5 block">{record.target}</span>
            </div>
            <div className="p-3 rounded bg-[#0A0B0D] border border-[#2D3748]">
              <span className="text-[10px] text-gray-500 block">TIMESTAMP</span>
              <span className="font-bold text-gray-300 mt-0.5 block">{record.timestamp} UTC</span>
            </div>
          </div>

          <div className="p-3 rounded bg-[#0A0B0D] border border-[#2D3748] space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">RISK LEVEL:</span>
              <span className="text-amber-400 font-bold">{record.riskLevel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">RBAC POLICY RESULT:</span>
              <span className="text-emerald-400 font-bold">{record.permissionResult}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">ROLLBACK CHECKPOINT:</span>
              <span className="text-white font-bold">{record.rollbackId || 'IMMUTABLE_HASH_7819'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">EXECUTION SANDBOX:</span>
              <span className="text-emerald-400 font-bold">gVisor Isolated Micro-Container</span>
            </div>
          </div>

          <div className="p-3 rounded bg-[#0A0B0D] border border-[#2D3748]">
            <span className="text-[10px] text-gray-500 block mb-1">SHA-256 SIGNATURE HASH</span>
            <code className="text-[10px] text-gray-400 break-all">
              e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
            </code>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0F1115] border-t border-[#2D3748] flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-[#1F2937] hover:bg-[#2D3748] text-white text-xs font-bold border border-[#374151] transition cursor-pointer"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   4. POD DETAIL INSPECTOR MODAL
   ========================================================================= */
interface PodDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  pod: any;
  onRestart?: () => void;
}

export const PodDetailModal: React.FC<PodDetailModalProps> = ({
  isOpen,
  onClose,
  pod,
  onRestart
}) => {
  if (!isOpen || !pod) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-mono overflow-y-auto">
      <div className="w-full max-w-2xl my-auto rounded-xl bg-[#1A1D23] border border-[#2D3748] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-[#0F1115] border-b border-[#2D3748] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white tracking-tight uppercase">
              KUBERNETES POD: {pod.name}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[#2D3748] text-gray-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded bg-[#0A0B0D] border border-[#2D3748]">
              <span className="text-[10px] text-gray-500 block">STATUS</span>
              <span
                className={`font-bold mt-0.5 block ${
                  pod.status === 'Running' ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {pod.status}
              </span>
            </div>
            <div className="p-3 rounded bg-[#0A0B0D] border border-[#2D3748]">
              <span className="text-[10px] text-gray-500 block">NAMESPACE</span>
              <span className="font-bold text-white mt-0.5 block">{pod.namespace || 'production'}</span>
            </div>
            <div className="p-3 rounded bg-[#0A0B0D] border border-[#2D3748]">
              <span className="text-[10px] text-gray-500 block">NODE ASSIGNMENT</span>
              <span className="font-bold text-gray-300 mt-0.5 block">gke-node-pool-01</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded bg-[#0A0B0D] border border-[#2D3748]">
              <span className="text-[10px] text-gray-500 block">CPU CONSUMPTION</span>
              <span className="font-bold text-white mt-0.5 block">{pod.cpuUsage}</span>
            </div>
            <div className="p-3 rounded bg-[#0A0B0D] border border-[#2D3748]">
              <span className="text-[10px] text-gray-500 block">MEMORY (RSS)</span>
              <span className="font-bold text-white mt-0.5 block">{pod.memoryUsage}</span>
            </div>
            <div className="p-3 rounded bg-[#0A0B0D] border border-[#2D3748]">
              <span className="text-[10px] text-gray-500 block">CRASH RESTARTS</span>
              <span
                className={`font-bold mt-0.5 block ${
                  pod.restarts > 0 ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {pod.restarts} Restarts
              </span>
            </div>
          </div>

          {/* Pod Logs Stream */}
          <div className="p-3 rounded bg-[#0A0B0D] border border-[#2D3748] space-y-2">
            <div className="flex items-center justify-between text-[10px] text-gray-500">
              <span>CONTAINER STDOUT / STDERR</span>
              <span>BUFFER 100 LINES</span>
            </div>
            <div className="h-36 overflow-y-auto font-mono text-[11px] space-y-1 text-gray-300 bg-[#060709] p-2.5 rounded border border-[#1F2937]">
              {pod.logs && pod.logs.length > 0 ? (
                pod.logs.map((log: string, i: number) => {
                  const raw = log || '';
                  return (
                    <div
                      key={i}
                      className={
                        raw.includes('ERROR') || raw.includes('FATAL')
                          ? 'text-rose-400 font-bold'
                          : raw.includes('WARN')
                          ? 'text-amber-300'
                          : 'text-gray-300'
                      }
                    >
                      {raw}
                    </div>
                  );
                })
              ) : (
                <div className="text-gray-600">No logs recorded.</div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0F1115] border-t border-[#2D3748] flex items-center justify-between shrink-0">
          {onRestart ? (
            <button
              onClick={() => {
                onRestart();
                onClose();
              }}
              className="px-3 py-1.5 rounded bg-[#1F2937] hover:bg-[#2D3748] text-amber-400 hover:text-amber-300 text-xs font-bold border border-[#374151] transition cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RESTART THIS POD</span>
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-[#1F2937] hover:bg-[#2D3748] text-white text-xs font-bold border border-[#374151] transition cursor-pointer"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   5. EDIT PERMISSION MODAL (RBAC)
   ========================================================================= */
interface EditPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  permissionName: string;
  description?: string;
  roles?: {
    admin: boolean;
    techLead: boolean;
    developer: boolean;
    devops: boolean;
    viewer: boolean;
  };
  currentRole?: RbacRole;
  isAllowed?: boolean;
  onSave: (rolesOrAllowed: any) => void;
}

export const EditPermissionModal: React.FC<EditPermissionModalProps> = ({
  isOpen,
  onClose,
  permissionName,
  description,
  roles,
  currentRole,
  isAllowed,
  onSave
}) => {
  const [rolePermissions, setRolePermissions] = useState(
    roles || {
      admin: true,
      techLead: true,
      developer: false,
      devops: false,
      viewer: false
    }
  );
  const [allowed, setAllowed] = useState(isAllowed ?? false);

  if (!isOpen) return null;

  const toggleRole = (roleKey: keyof typeof rolePermissions) => {
    setRolePermissions(prev => ({
      ...prev,
      [roleKey]: !prev[roleKey]
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-mono overflow-y-auto">
      <div className="w-full max-w-md my-auto rounded-xl bg-[#1A1D23] border border-[#2D3748] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-[#0F1115] border-b border-[#2D3748] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white tracking-tight uppercase">
              EDIT RBAC PERMISSION
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[#2D3748] text-gray-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
          <div>
            <span className="text-[10px] text-gray-500 block mb-1">CAPABILITY</span>
            <div className="font-bold text-white text-sm font-sans">{permissionName}</div>
            {description && (
              <p className="text-gray-400 text-xs font-sans mt-1">{description}</p>
            )}
          </div>

          {roles ? (
            <div className="space-y-2">
              <span className="text-[10px] text-gray-500 block">ROLE ACCESS MATRIX</span>
              {(
                [
                  { key: 'admin', label: 'Admin (Security Lead)' },
                  { key: 'techLead', label: 'Tech Lead / Staff Eng' },
                  { key: 'developer', label: 'Software Developer' },
                  { key: 'devops', label: 'DevOps / SRE' },
                  { key: 'viewer', label: 'Read-Only Viewer' }
                ] as const
              ).map(item => (
                <div
                  key={item.key}
                  className="p-2.5 rounded bg-[#0A0B0D] border border-[#2D3748] flex items-center justify-between"
                >
                  <span className="text-gray-300 font-sans">{item.label}</span>
                  <button
                    onClick={() => toggleRole(item.key)}
                    className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer border ${
                      rolePermissions[item.key]
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                        : 'bg-[#1F2937] text-gray-400 border-[#374151]'
                    }`}
                  >
                    {rolePermissions[item.key] ? 'GRANTED (✓)' : 'DENIED (✕)'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded bg-[#0A0B0D] border border-[#2D3748] flex items-center justify-between">
              <div>
                <span className="text-gray-400 block">
                  ROLE: <strong className="text-white">{currentRole || 'User'}</strong>
                </span>
                <span className="text-[11px] text-gray-500 font-sans">
                  {allowed ? 'Currently granted permission' : 'Currently denied'}
                </span>
              </div>

              <button
                onClick={() => setAllowed(!allowed)}
                className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer border ${
                  allowed
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                    : 'bg-[#1F2937] text-gray-400 border-[#374151]'
                }`}
              >
                {allowed ? 'GRANTED (✓)' : 'DENIED (✕)'}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0F1115] border-t border-[#2D3748] flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded bg-[#1F2937] hover:bg-[#2D3748] text-gray-300 hover:text-white text-xs font-bold border border-[#374151] transition cursor-pointer"
          >
            CANCEL
          </button>
          <button
            onClick={() => {
              if (roles) {
                onSave(rolePermissions);
              } else {
                onSave(allowed);
              }
              onClose();
            }}
            className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.3)]"
          >
            SAVE POLICY
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   6. CREATE AGENT TASK MODAL
   ========================================================================= */
interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (prompt: string, title: string) => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPrompt, setTaskPrompt] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-mono overflow-y-auto">
      <div className="w-full max-w-lg my-auto rounded-xl bg-[#1A1D23] border border-[#2D3748] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-[#0F1115] border-b border-[#2D3748] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white tracking-tight uppercase">
              DISPATCH NEW AI AGENT TASK
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[#2D3748] text-gray-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
          <div>
            <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">
              Task Title
            </label>
            <input
              type="text"
              placeholder="e.g., Fix session timeout leak in auth-service"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="w-full bg-[#0A0B0D] p-2 rounded border border-[#2D3748] text-white focus:outline-hidden focus:border-emerald-500 font-sans"
            />
          </div>

          <div>
            <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">
              Engineering Prompt / Instructions
            </label>
            <textarea
              rows={4}
              placeholder="Provide exact error logs, target file paths, expected test behavior, or architectural requirements..."
              value={taskPrompt}
              onChange={(e) => setTaskPrompt(e.target.value)}
              className="w-full bg-[#0A0B0D] p-2 rounded border border-[#2D3748] text-white focus:outline-hidden focus:border-emerald-500 font-sans"
            />
          </div>

          <div className="p-3 rounded bg-[#0A0B0D] border border-[#2D3748] space-y-1 text-[11px] text-gray-400 font-sans">
            <p>• The agent will construct a step-by-step investigation and verification plan.</p>
            <p>• Unit tests will execute inside isolated gVisor micro-containers.</p>
            <p>• Code changes will require human approval before merging or deploying.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0F1115] border-t border-[#2D3748] flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded bg-[#1F2937] hover:bg-[#2D3748] text-gray-300 hover:text-white text-xs font-bold border border-[#374151] transition cursor-pointer"
          >
            CANCEL
          </button>
          <button
            disabled={!taskPrompt.trim()}
            onClick={() => {
              onSubmit(taskPrompt, taskTitle || 'Custom Engineering Task');
              onClose();
            }}
            className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.3)]"
          >
            LAUNCH AGENT
          </button>
        </div>
      </div>
    </div>
  );
};

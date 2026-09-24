import React, { useState } from 'react';
import {
  Server,
  RotateCcw,
  Terminal,
  Search,
  Copy,
  Check,
  Maximize2
} from 'lucide-react';
import { KubernetesResource } from '../types';
import { PodDetailModal, ConfirmationModal } from './Modals';
import { useTheme } from '../context/ThemeContext';
import confetti from 'canvas-confetti';

interface InfrastructureViewProps {
  resources: KubernetesResource[];
  onRestartDeployment?: () => void;
}

export const InfrastructureView: React.FC<InfrastructureViewProps> = ({
  resources,
  onRestartDeployment
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [selectedPodId, setSelectedPodId] = useState<string>(resources[0]?.id || '');
  const [isRestarting, setIsRestarting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'k8s' | 'terraform'>('k8s');
  const [logSearch, setLogSearch] = useState<string>('');
  const [logLevelFilter, setLogLevelFilter] = useState<'ALL' | 'INFO' | 'WARN' | 'ERROR'>('ALL');
  const [isCopiedTerraform, setIsCopiedTerraform] = useState<boolean>(false);
  const [isPodDetailModalOpen, setIsPodDetailModalOpen] = useState<boolean>(false);
  const [isRestartConfirmOpen, setIsRestartConfirmOpen] = useState<boolean>(false);

  const fallbackPod: KubernetesResource = {
    id: 'k8s_pod_fallback',
    name: 'nexus-auth-service-pod-01',
    kind: 'Pod',
    namespace: 'production',
    status: 'Running',
    restarts: 0,
    cpuUsage: '14%',
    memoryUsage: '38%',
    age: '2d',
    node: 'gke-node-pool-1',
    logs: [
      '[INFO] Initializing server on port 3000...',
      '[INFO] Database connection pool established.',
      '[INFO] Health check probe returned HTTP 200 OK.'
    ]
  };

  const selectedPod = (resources || []).find((r) => r.id === selectedPodId) || (resources || [])[0] || fallbackPod;

  const handleRestart = () => {
    setIsRestartConfirmOpen(false);
    setIsRestarting(true);
    setTimeout(() => {
      if (onRestartDeployment) {
        onRestartDeployment();
      }
      setIsRestarting(false);
      try {
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      } catch {}
    }, 1500);
  };

  const terraformStateSnippet = `# terraform/main.tf
resource "google_container_cluster" "primary" {
  name               = "nexus-prod-cluster-us"
  location           = "us-central1-a"
  initial_node_count = 3
  
  ip_allocation_policy {
    cluster_ipv4_cidr_block  = "10.0.0.0/14"
    services_ipv4_cidr_block = "10.4.0.0/20"
  }
}

resource "google_container_node_pool" "primary_nodes" {
  cluster    = google_container_cluster.primary.name
  node_count = 4
  node_config {
    machine_type = "e2-standard-4"
    oauth_scopes = ["https://www.googleapis.com/auth/cloud-platform"]
    metadata = {
      disable-legacy-endpoints = "true"
    }
  }
}`;

  const filteredLogs = (selectedPod?.logs || []).filter((log) => {
    const logStr = (log || '').toLowerCase();
    const matchesSearch = logStr.includes((logSearch || '').toLowerCase());
    if (!matchesSearch) return false;
    const rawLog = log || '';
    if (logLevelFilter === 'ERROR') return rawLog.includes('ERROR') || rawLog.includes('FATAL') || rawLog.includes('Exception');
    if (logLevelFilter === 'WARN') return rawLog.includes('WARN');
    if (logLevelFilter === 'INFO') return !rawLog.includes('ERROR') && !rawLog.includes('WARN');
    return true;
  });

  return (
    <div
      id="infrastructure-view"
      className={`flex-1 p-6 space-y-6 overflow-y-auto font-mono transition-colors ${
        isDark ? 'bg-[#0A0B0D] text-[#E0E0E0]' : 'bg-[#F6F8FA] text-[#111827]'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Server className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
            <h1 className={`text-sm font-bold tracking-tight uppercase ${isDark ? 'text-white' : 'text-gray-900'}`}>
              INFRASTRUCTURE & KUBERNETES TOPOLOGY
            </h1>
          </div>
          <p className={`text-xs mt-1 font-sans ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Cluster nodes, Pod health, CPU/Memory telemetry, and Terraform IaC configuration.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`flex items-center rounded p-0.5 border text-xs ${
              isDark ? 'bg-[#1A1D23] border-[#2D3748]' : 'bg-white border-gray-300 shadow-xs'
            }`}
          >
            <button
              onClick={() => setActiveTab('k8s')}
              className={`px-3 py-1 rounded font-bold uppercase transition cursor-pointer text-[10px] ${
                activeTab === 'k8s'
                  ? isDark
                    ? 'bg-[#2D3748] text-white shadow-xs'
                    : 'bg-gray-200 text-gray-900 shadow-xs'
                  : isDark
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Kubernetes Topology
            </button>
            <button
              onClick={() => setActiveTab('terraform')}
              className={`px-3 py-1 rounded font-bold uppercase transition cursor-pointer text-[10px] ${
                activeTab === 'terraform'
                  ? isDark
                    ? 'bg-[#2D3748] text-white shadow-xs'
                    : 'bg-gray-200 text-gray-900 shadow-xs'
                  : isDark
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Terraform IaC
            </button>
          </div>

          <button
            id="roll-restart-btn"
            onClick={() => setIsRestartConfirmOpen(true)}
            disabled={isRestarting}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold border transition cursor-pointer shadow-xs ${
              isDark
                ? 'bg-[#1F2937] hover:bg-[#2D3748] text-white border-[#374151]'
                : 'bg-white hover:bg-gray-100 text-gray-800 border-gray-300'
            }`}
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRestarting ? 'animate-spin text-amber-500' : 'text-emerald-500'}`} />
            <span>{isRestarting ? 'RESTARTING...' : 'ROLL RESTART PODS'}</span>
          </button>
        </div>
      </div>

      {activeTab === 'k8s' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Pods Grid */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                ACTIVE PODS ({resources.length})
              </span>
              <span className="text-[10px] text-gray-500">REGION: us-central1-a</span>
            </div>

            <div className="space-y-2.5">
              {resources.map((pod) => {
                const isSelected = pod.id === selectedPodId;
                const isHealthy = pod.status === 'Running';

                return (
                  <div
                    key={pod.id}
                    onClick={() => setSelectedPodId(pod.id)}
                    className={`w-full text-left p-3.5 rounded-lg border transition cursor-pointer ${
                      isSelected
                        ? isDark
                          ? 'bg-[#1A1D23] border-emerald-500/50 shadow-md text-white'
                          : 'bg-white border-emerald-600 ring-2 ring-emerald-500/20 shadow-md text-gray-900'
                        : isDark
                        ? 'bg-[#0A0B0D] border-[#2D3748] hover:bg-[#1A1D23] text-gray-400'
                        : 'bg-white border-[#D0D7DE] hover:bg-gray-50 text-gray-600 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`font-bold text-xs truncate pr-2 ${isSelected ? (isDark ? 'text-white' : 'text-gray-900') : (isDark ? 'text-gray-200' : 'text-gray-800')}`}>
                        {pod.name}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 border ${
                          isHealthy
                            ? isDark
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : isDark
                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {pod.status}
                      </span>
                    </div>

                    <div
                      className={`grid grid-cols-3 gap-2 mt-2 pt-2 border-t text-[11px] ${
                        isDark ? 'border-[#2D3748] text-gray-400' : 'border-gray-200 text-gray-600'
                      }`}
                    >
                      <div>
                        <span className="text-gray-500 text-[10px] block">CPU</span>
                        <span className={isDark ? 'text-gray-200' : 'text-gray-800 font-semibold'}>{pod.cpuUsage}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 text-[10px] block">MEM</span>
                        <span className={isDark ? 'text-gray-200' : 'text-gray-800 font-semibold'}>{pod.memoryUsage}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 text-[10px] block">RESTARTS</span>
                        <span className={pod.restarts > 0 ? 'text-amber-500 font-bold' : isDark ? 'text-gray-300' : 'text-gray-700'}>
                          {pod.restarts}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pod Log Inspector & Actions */}
          <div
            className={`lg:col-span-6 flex flex-col rounded-lg border overflow-hidden min-h-[420px] ${
              isDark ? 'bg-[#1A1D23] border-[#2D3748]' : 'bg-white border-[#D0D7DE] shadow-xs'
            }`}
          >
            <div
              className={`p-3 border-b flex flex-wrap items-center justify-between gap-2 text-xs ${
                isDark ? 'bg-[#0F1115] border-[#2D3748] text-gray-400' : 'bg-gray-50 border-[#D0D7DE] text-gray-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <Terminal className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                <span className={`font-semibold truncate max-w-[200px] ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedPod?.name}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPodDetailModalOpen(true)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] border cursor-pointer ${
                    isDark
                      ? 'bg-[#1A1D23] hover:bg-[#2D3748] text-gray-300 border-[#374151]'
                      : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-300 shadow-xs'
                  }`}
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>INSPECT</span>
                </button>
              </div>
            </div>

            {/* Filter bar */}
            <div
              className={`p-2.5 border-b flex items-center justify-between gap-2 text-xs ${
                isDark ? 'bg-[#0A0B0D] border-[#2D3748]' : 'bg-[#F6F8FA] border-[#D0D7DE]'
              }`}
            >
              <div className="flex items-center gap-1.5 flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Filter logs..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className={`bg-transparent text-xs placeholder-gray-500 focus:outline-hidden w-full font-mono ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}
                />
              </div>

              <div className="flex items-center gap-1 text-[10px]">
                {(['ALL', 'INFO', 'WARN', 'ERROR'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setLogLevelFilter(lvl)}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${
                      logLevelFilter === lvl
                        ? isDark
                          ? 'bg-[#2D3748] text-white font-bold'
                          : 'bg-emerald-600 text-white font-bold'
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

            {/* Logs Area */}
            <div
              className={`p-4 flex-1 overflow-y-auto text-xs space-y-1.5 font-mono ${
                isDark ? 'bg-[#0A0B0D]' : 'bg-gray-900 text-gray-200'
              }`}
            >
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log, i) => (
                  <div
                    key={i}
                    className={`leading-relaxed ${
                      (log || '').includes('ERROR') || (log || '').includes('FATAL')
                        ? 'text-rose-400 font-semibold'
                        : (log || '').includes('WARN')
                        ? 'text-amber-300'
                        : 'text-gray-300'
                    }`}
                  >
                    {log}
                  </div>
                ))
              ) : (
                <div className="text-gray-500 italic">No log entries matching criteria.</div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`p-5 rounded-lg border text-xs space-y-3 ${
            isDark ? 'bg-[#1A1D23] border-[#2D3748]' : 'bg-white border-[#D0D7DE] shadow-xs'
          }`}
        >
          <div
            className={`flex items-center justify-between pb-2 border-b ${
              isDark ? 'border-[#2D3748] text-gray-400' : 'border-gray-200 text-gray-600'
            }`}
          >
            <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>TERRAFORM CLUSTER SPECIFICATION (GKE MANAGED)</span>
            <div className="flex items-center gap-3">
              <span className={`text-[10px] font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>SYNCED WITH STATEFILE</span>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(terraformStateSnippet);
                  setIsCopiedTerraform(true);
                  setTimeout(() => setIsCopiedTerraform(false), 2000);
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] border transition cursor-pointer ${
                  isDark
                    ? 'bg-[#0A0B0D] hover:bg-[#2D3748] text-gray-300 border-[#2D3748]'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'
                }`}
              >
                {isCopiedTerraform ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{isCopiedTerraform ? 'COPIED' : 'COPY HCL'}</span>
              </button>
            </div>
          </div>
          <pre
            className={`p-4 rounded overflow-x-auto leading-relaxed border font-mono ${
              isDark ? 'bg-[#0A0B0D] text-gray-300 border-[#2D3748]' : 'bg-gray-900 text-gray-200 border-gray-800'
            }`}
          >
            {terraformStateSnippet}
          </pre>
        </div>
      )}

      {/* Pod Detail Inspector Modal */}
      {isPodDetailModalOpen && (
        <PodDetailModal
          isOpen={true}
          onClose={() => setIsPodDetailModalOpen(false)}
          pod={selectedPod}
          onRestart={handleRestart}
        />
      )}

      {/* Restart Pods Confirmation Modal */}
      {isRestartConfirmOpen && (
        <ConfirmationModal
          isOpen={true}
          onClose={() => setIsRestartConfirmOpen(false)}
          onConfirm={handleRestart}
          title="TRIGGER KUBERNETES ROLL RESTART"
          description="Are you sure you want to trigger a zero-downtime rolling restart across all auth-service deployment pods in namespace 'production'?"
          confirmLabel="EXECUTE ROLL RESTART"
          variant="warning"
          riskLevel="MEDIUM"
          details={[
            { label: 'Cluster', value: 'nexus-prod-cluster-us' },
            { label: 'Target Namespace', value: 'production' },
            { label: 'Pods Affected', value: '4 Replicas' },
            { label: 'Strategy', value: 'Rolling (maxUnavailable: 0)' }
          ]}
        />
      )}
    </div>
  );
};

import React, { useState } from 'react';
import {
  Rocket,
  RotateCcw,
  Plus,
  Lock
} from 'lucide-react';
import { DeploymentRecord, EnvironmentName, RbacRole } from '../types';
import { ConfirmationModal } from './Modals';
import { can } from '../lib/permissions';
import { useTheme } from '../context/ThemeContext';
import confetti from 'canvas-confetti';

interface DeploymentsViewProps {
  deployments: DeploymentRecord[];
  currentRole: RbacRole;
  onRollback?: (deploymentId: string) => void;
  onTriggerDeploy?: (env: EnvironmentName, version: string) => void;
}

export const DeploymentsView: React.FC<DeploymentsViewProps> = ({
  deployments,
  currentRole,
  onRollback,
  onTriggerDeploy
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [selectedEnv, setSelectedEnv] = useState<EnvironmentName>('production');
  const [isRollingBack, setIsRollingBack] = useState<boolean>(false);
  const [rollbackCandidate, setRollbackCandidate] = useState<DeploymentRecord | null>(null);
  const [selectedReleaseDetails, setSelectedReleaseDetails] = useState<DeploymentRecord | null>(null);
  const [isNewDeployModalOpen, setIsNewDeployModalOpen] = useState<boolean>(false);
  const [deployingNewVersion] = useState<string>('v2.4.3');

  const envs: EnvironmentName[] = ['production', 'staging', 'development'];

  // RBAC checks for deployment actions
  const canDeploySelectedEnv =
    selectedEnv === 'production'
      ? can(currentRole, 'deployProduction')
      : can(currentRole, 'deployStaging');

  const canRollbackSelectedEnv =
    selectedEnv === 'production'
      ? can(currentRole, 'rollbackProduction')
      : true;

  const handleConfirmRollback = () => {
    if (!rollbackCandidate || !canRollbackSelectedEnv) return;
    setIsRollingBack(true);
    setTimeout(() => {
      if (onRollback) {
        onRollback(rollbackCandidate.id);
      }
      setIsRollingBack(false);
      setRollbackCandidate(null);
      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      } catch {}
    }, 1400);
  };

  const handleExecuteNewDeploy = () => {
    if (!canDeploySelectedEnv) return;
    if (onTriggerDeploy) {
      onTriggerDeploy(selectedEnv, deployingNewVersion);
    }
    setIsNewDeployModalOpen(false);
    try {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    } catch {}
  };

  return (
    <div
      id="deployments-view"
      className={`flex-1 p-6 space-y-6 overflow-y-auto font-mono transition-colors ${
        isDark ? 'bg-[#0A0B0D] text-[#E0E0E0]' : 'bg-[#F6F8FA] text-[#111827]'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Rocket className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
            <h1 className={`text-sm font-bold tracking-tight uppercase ${isDark ? 'text-white' : 'text-gray-900'}`}>
              DEPLOYMENTS & ENVIRONMENTS
            </h1>
          </div>
          <p className={`text-xs mt-1 font-sans ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Canary releases, rolling updates, traffic routing, and immutable rollback checkpoints.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`flex items-center rounded p-0.5 border text-xs ${
              isDark ? 'bg-[#1A1D23] border-[#2D3748]' : 'bg-white border-gray-300 shadow-xs'
            }`}
          >
            {envs.map((env) => (
              <button
                key={env}
                onClick={() => setSelectedEnv(env)}
                className={`px-3 py-1 rounded uppercase font-bold transition cursor-pointer text-[10px] ${
                  selectedEnv === env
                    ? isDark
                      ? 'bg-[#2D3748] text-white shadow-xs'
                      : 'bg-gray-200 text-gray-900 shadow-xs'
                    : isDark
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {env}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              if (canDeploySelectedEnv) {
                setIsNewDeployModalOpen(true);
              }
            }}
            disabled={!canDeploySelectedEnv}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-bold text-xs transition ${
              canDeploySelectedEnv
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)] cursor-pointer'
                : isDark
                ? 'bg-[#1F2937] text-gray-500 border border-[#374151] cursor-not-allowed opacity-60'
                : 'bg-gray-100 text-gray-400 border border-gray-300 cursor-not-allowed opacity-60'
            }`}
            title={canDeploySelectedEnv ? 'Trigger new deployment' : `Role '${currentRole}' is not authorized to deploy to ${selectedEnv}`}
          >
            {canDeploySelectedEnv ? <Plus className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            <span>TRIGGER DEPLOY</span>
          </button>
        </div>
      </div>

      {/* Environment Health Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {envs.map((env) => {
          const envDeps = (deployments || []).filter((d) => d.environment === env);
          const latest = envDeps[0] || (deployments || [])[0] || {
            id: `mock-${env}`,
            environment: env,
            version: 'v2.4.0',
            commitHash: '7a192c',
            commitMessage: 'Active production baseline',
            deployedBy: 'Platform Admin',
            deployedAt: '2 hours ago',
            status: 'HEALTHY' as const,
            trafficPercent: 100,
            replicas: 4,
            healthyReplicas: 4,
            rollbackAvailable: true,
            rollbackVersion: 'v2.3.9'
          };
          const isHealthy = latest.status === 'HEALTHY';

          return (
            <div
              key={env}
              onClick={() => setSelectedEnv(env)}
              className={`p-4 rounded-lg border transition cursor-pointer ${
                selectedEnv === env
                  ? isDark
                    ? 'ring-1 ring-emerald-500/50'
                    : 'ring-2 ring-emerald-500'
                  : ''
              } ${
                env === 'production' && !isHealthy
                  ? isDark
                    ? 'bg-[#1A1D23] border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.1)]'
                    : 'bg-rose-50/50 border-rose-300 shadow-sm'
                  : isDark
                  ? 'bg-[#1A1D23] border-[#2D3748] hover:border-gray-500'
                  : 'bg-white border-[#D0D7DE] hover:border-gray-400 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {env}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    isHealthy
                      ? isDark
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : isDark
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {latest.status}
                </span>
              </div>

              <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{latest.version}</div>
              <p className={`text-xs mt-1 line-clamp-1 font-sans ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{latest.commitMessage}</p>

              <div
                className={`mt-3 pt-3 border-t flex items-center justify-between text-[11px] ${
                  isDark ? 'border-[#2D3748] text-gray-500' : 'border-gray-200 text-gray-500'
                }`}
              >
                <span>
                  REPLICAS: <strong className={isDark ? 'text-gray-300' : 'text-gray-800'}>{latest.healthyReplicas}/{latest.replicas}</strong>
                </span>
                <span>
                  TRAFFIC: <strong className={isDark ? 'text-emerald-400' : 'text-emerald-600 font-bold'}>{latest.trafficPercent}%</strong>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deployment History Table */}
      <div
        className={`p-5 rounded-lg border ${
          isDark ? 'bg-[#1A1D23] border-[#2D3748]' : 'bg-white border-[#D0D7DE] shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            RELEASE STREAM HISTORY ({selectedEnv.toUpperCase()})
          </span>
          <span className="text-[11px] text-gray-500">AUTO-ROLLBACK CHECKPOINTS IMMUTABLE</span>
        </div>

        <div className="space-y-3">
          {deployments
            .filter((d) => d.environment === selectedEnv)
            .map((dep) => (
              <div
                key={dep.id}
                className={`p-4 rounded border flex flex-col md:flex-row md:items-center justify-between gap-3 transition ${
                  isDark
                    ? 'bg-[#0A0B0D] border-[#2D3748] hover:border-gray-500'
                    : 'bg-[#F6F8FA] border-[#D0D7DE] hover:border-gray-400'
                }`}
              >
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => setSelectedReleaseDetails(dep)}
                >
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-xs ${isDark ? 'text-white' : 'text-gray-900'}`}>{dep.version}</span>
                    <span className={`text-xs font-mono ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>({dep.commitHash})</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                        dep.status === 'HEALTHY'
                          ? isDark
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : isDark
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {dep.status}
                    </span>
                  </div>
                  <p className={`text-xs mt-1 font-sans ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{dep.commitMessage}</p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-500">
                    <span>DEPLOYED BY: <strong className={isDark ? 'text-gray-200' : 'text-gray-800'}>{dep.deployedBy}</strong></span>
                    <span>TIMESTAMP: {dep.deployedAt}</span>
                    <span>CANARY TRAFFIC: {dep.trafficPercent}%</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setSelectedReleaseDetails(dep)}
                    className={`px-2.5 py-1.5 rounded text-xs border transition cursor-pointer ${
                      isDark
                        ? 'bg-[#1F2937] hover:bg-[#2D3748] text-gray-300 hover:text-white border-[#374151]'
                        : 'bg-white hover:bg-gray-100 text-gray-700 hover:text-gray-900 border-gray-300 shadow-xs'
                    }`}
                  >
                    DETAILS
                  </button>

                  {dep.rollbackAvailable && dep.rollbackVersion && (
                    <button
                      onClick={() => {
                        if (canRollbackSelectedEnv) {
                          setRollbackCandidate(dep);
                        }
                      }}
                      disabled={!canRollbackSelectedEnv || isRollingBack}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition ${
                        canRollbackSelectedEnv
                          ? isDark
                            ? 'bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 hover:text-white border border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.2)] cursor-pointer'
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 shadow-xs cursor-pointer'
                          : isDark
                          ? 'bg-[#1F2937] text-gray-500 border border-[#374151] cursor-not-allowed opacity-50'
                          : 'bg-gray-100 text-gray-400 border border-gray-300 cursor-not-allowed opacity-50'
                      }`}
                      title={canRollbackSelectedEnv ? 'Trigger Rollback' : `Role '${currentRole}' is not authorized to rollback production`}
                    >
                      {canRollbackSelectedEnv ? <RotateCcw className="w-3.5 h-3.5 text-rose-500" /> : <Lock className="w-3.5 h-3.5 text-gray-400" />}
                      <span>ROLLBACK TO {dep.rollbackVersion}</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Rollback Confirmation Modal */}
      {rollbackCandidate && (
        <ConfirmationModal
          isOpen={true}
          onClose={() => setRollbackCandidate(null)}
          onConfirm={handleConfirmRollback}
          title={`TRIGGER INSTANT ROLLBACK`}
          description={`Are you sure you want to rollback ${selectedEnv} from ${rollbackCandidate.version} to ${rollbackCandidate.rollbackVersion}? This will safely shift 100% of traffic to the last known healthy deployment checkpoint.`}
          confirmLabel={isRollingBack ? 'EXECUTING ROLLBACK...' : `ROLLBACK TO ${rollbackCandidate.rollbackVersion}`}
          variant="danger"
          riskLevel="HIGH"
          isLoading={isRollingBack}
          details={[
            { label: 'Target Environment', value: selectedEnv.toUpperCase() },
            { label: 'Current Release', value: rollbackCandidate.version },
            { label: 'Rollback Release Target', value: rollbackCandidate.rollbackVersion || 'v2.4.0' },
            { label: 'Approval Required', value: `Authorized by ${currentRole}` }
          ]}
        />
      )}

      {/* Release Details Modal */}
      {selectedReleaseDetails && (
        <ConfirmationModal
          isOpen={true}
          onClose={() => setSelectedReleaseDetails(null)}
          onConfirm={() => setSelectedReleaseDetails(null)}
          title={`RELEASE DETAILS: ${selectedReleaseDetails.version}`}
          description={`Deployment record for ${selectedReleaseDetails.version} on ${selectedReleaseDetails.environment} cluster.`}
          confirmLabel="CLOSE"
          cancelLabel="DISMISS"
          details={[
            { label: 'Version', value: selectedReleaseDetails.version },
            { label: 'Environment', value: selectedReleaseDetails.environment },
            { label: 'Commit Hash', value: selectedReleaseDetails.commitHash },
            { label: 'Commit Message', value: selectedReleaseDetails.commitMessage },
            { label: 'Deployed By', value: selectedReleaseDetails.deployedBy },
            { label: 'Timestamp', value: selectedReleaseDetails.deployedAt },
            { label: 'Healthy Replicas', value: `${selectedReleaseDetails.healthyReplicas} / ${selectedReleaseDetails.replicas}` },
            { label: 'Traffic Weight', value: `${selectedReleaseDetails.trafficPercent}%` }
          ]}
        />
      )}

      {/* Trigger New Deploy Modal */}
      {isNewDeployModalOpen && (
        <ConfirmationModal
          isOpen={true}
          onClose={() => setIsNewDeployModalOpen(false)}
          onConfirm={handleExecuteNewDeploy}
          title={`TRIGGER CANARY DEPLOYMENT`}
          description={`Initiate rolling canary release for auth-service to ${selectedEnv.toUpperCase()} cluster.`}
          confirmLabel="START DEPLOYMENT"
          variant="primary"
          riskLevel="MEDIUM"
          details={[
            { label: 'Target Environment', value: selectedEnv.toUpperCase() },
            { label: 'Release Version', value: deployingNewVersion },
            { label: 'Strategy', value: 'Rolling Canary (25% -> 50% -> 100%)' },
            { label: 'Health Check Grace Period', value: '60 seconds' }
          ]}
        />
      )}
    </div>
  );
};

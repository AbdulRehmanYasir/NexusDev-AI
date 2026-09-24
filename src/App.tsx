import React, { useState, useEffect } from 'react';
import {
  Header
} from './components/Header';
import {
  Sidebar
} from './components/Sidebar';
import {
  DashboardView
} from './components/DashboardView';
import {
  AgentCommandCenter
} from './components/AgentCommandCenter';
import {
  CodeWorkspaceView
} from './components/CodeWorkspaceView';
import {
  IssuesView
} from './components/IssuesView';
import {
  PullRequestsView
} from './components/PullRequestsView';
import {
  PipelinesView
} from './components/PipelinesView';
import {
  DeploymentsView
} from './components/DeploymentsView';
import {
  InfrastructureView
} from './components/InfrastructureView';
import {
  IncidentsView
} from './components/IncidentsView';
import {
  ObservabilityView
} from './components/ObservabilityView';
import {
  AuditLogView
} from './components/AuditLogView';
import {
  SettingsView
} from './components/SettingsView';
import {
  GovernanceView
} from './components/GovernanceView';
import {
  AccessDeniedView
} from './components/AccessDeniedView';
import {
  CommandPalette
} from './components/CommandPalette';
import {
  LoginView
} from './components/LoginView';
import {
  ErrorBoundary
} from './components/ErrorBoundary';
import {
  AuthProvider,
  useAuth
} from './context/AuthContext';
import {
  ThemeProvider,
  useTheme
} from './context/ThemeContext';
import {
  WorkspaceState,
  NavViewId,
  RbacRole,
  EnvironmentName,
  IssueTicket
} from './types';
import {
  initialWorkspace
} from './data/mockWorkspace';
import { can, canAccessView } from './lib/permissions';

function NexusDevWorkspaceApp() {
  const { isAuthenticated, currentUser, updateUserRole } = useAuth();
  const { theme, isDark } = useTheme();

  const [workspace, setWorkspace] = useState<WorkspaceState>(initialWorkspace);
  const [currentView, setCurrentView] = useState<NavViewId>('dashboard');
  const [viewHistory, setViewHistory] = useState<NavViewId[]>(['dashboard']);
  const [currentRole, setCurrentRole] = useState<RbacRole>(currentUser?.role || 'Admin');
  const [currentEnv, setCurrentEnv] = useState<EnvironmentName>('production');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [agentInitialPrompt, setAgentInitialPrompt] = useState<string | undefined>(undefined);
  const [agentSelectedScenarioId, setAgentSelectedScenarioId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sync role with current user if user changes
  useEffect(() => {
    if (currentUser?.role) {
      setCurrentRole(currentUser.role);
    }
  }, [currentUser?.role]);

  // Sync workspace from backend on mount
  useEffect(() => {
    fetch('/api/workspace')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.repositories) {
          setWorkspace(data);
        }
      })
      .catch((err) => {
        console.warn('Backend sync note: using initial workspace state', err);
      });
  }, []);

  // Protected routing and URL hash synchronization
  useEffect(() => {
    const handleHashRouting = () => {
      const rawHash = window.location.hash.replace('#/', '').replace('#', '');

      // 1. If unauthenticated, all protected routes must redirect to #/login
      if (!isAuthenticated) {
        if (rawHash !== 'login') {
          window.location.hash = '#/login';
        }
        return;
      }

      // 2. If authenticated and user navigates to #/login or empty, redirect to #/dashboard
      if (rawHash === 'login' || rawHash === '') {
        window.location.hash = '#/dashboard';
        setCurrentView('dashboard');
        return;
      }

      // 3. Map valid protected view IDs
      const validViews: Record<string, NavViewId> = {
        'dashboard': 'dashboard',
        'agent': 'ai-agent',
        'ai-agent': 'ai-agent',
        'repositories': 'code-workspace',
        'code-workspace': 'code-workspace',
        'issues': 'issues',
        'pull-requests': 'pull-requests',
        'pipelines': 'pipelines',
        'deployments': 'deployments',
        'infrastructure': 'infrastructure',
        'incidents': 'incidents',
        'observability': 'observability',
        'audit': 'audit-log',
        'audit-log': 'audit-log',
        'governance': 'governance',
        'settings': 'settings',
        'iam': 'governance',
        'iam-identity': 'governance',
        'profile-iam': 'settings',
        'identity': 'settings'
      };

      if (validViews[rawHash]) {
        setCurrentView(validViews[rawHash]);
      } else {
        // Unknown hash fallback
        window.location.hash = '#/dashboard';
        setCurrentView('dashboard');
      }
    };

    handleHashRouting();
    window.addEventListener('hashchange', handleHashRouting);
    window.addEventListener('popstate', handleHashRouting);
    return () => {
      window.removeEventListener('hashchange', handleHashRouting);
      window.removeEventListener('popstate', handleHashRouting);
    };
  }, [isAuthenticated]);

  // Navigation handler with history tracking and hash update
  const handleNavigate = (view: NavViewId) => {
    setIsMobileSidebarOpen(false);
    if (view !== currentView) {
      setViewHistory((prev) => [...prev, view]);
      setCurrentView(view);
      try {
        window.location.hash = `#/${view}`;
      } catch {}
    }
  };

  const handleBack = () => {
    if (viewHistory.length > 1) {
      const newHistory = [...viewHistory];
      newHistory.pop();
      const previousView = newHistory[newHistory.length - 1];
      setViewHistory(newHistory);
      setCurrentView(previousView);
      try {
        window.location.hash = `#/${previousView}`;
      } catch {}
    }
  };

  const handleRoleChange = (newRole: RbacRole) => {
    setCurrentRole(newRole);
    updateUserRole(newRole);
  };

  // Dispatch issue directly into AI agent
  const handleDispatchIssue = (issue: IssueTicket) => {
    setAgentInitialPrompt(
      `Investigate and resolve Issue #${issue.number}: ${issue.title}\n\nDescription: ${issue.description}\nRelated File: ${issue.relatedFile || 'N/A'}`
    );
    handleNavigate('ai-agent');
  };

  // Dispatch incident hero directly into AI agent
  const handleDispatchIncidentHero = (promptText?: string, scenarioId?: string) => {
    setAgentInitialPrompt(
      promptText ||
      `Investigate high P95 latency spike (+380%) and HTTP 500 error cascade in production auth-service (INC-2026-0819-01). Analyze recent commits, generate safe patch, verify in gVisor sandbox, and prepare canary deployment.`
    );
    if (scenarioId) {
      setAgentSelectedScenarioId(scenarioId);
    }
    handleNavigate('ai-agent');
  };

  // Save modified code in repository
  const handleSaveFile = async (filePath: string, newContent: string) => {
    if (!can(currentRole, 'modifyCode')) {
      console.warn(`Role ${currentRole} is not authorized to edit code`);
      return;
    }

    setWorkspace((prev) => {
      const updatedFiles = (prev.files || []).map((f) =>
        f.path === filePath ? { ...f, content: newContent } : f
      );
      return { ...prev, files: updatedFiles };
    });

    try {
      await fetch('/api/tools/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolName: 'repository.write',
          params: { path: filePath, content: newContent }
        })
      });
    } catch {
      // safe fallback
    }
  };

  // Autonomous Incident Remediation
  const handleRemediateIncident = async (incidentId: string) => {
    if (!can(currentRole, 'remediateIncidents')) {
      console.warn(`Role ${currentRole} is not authorized to remediate incidents`);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/incidents/remediate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incidentId })
      });
      const data = await res.json();
      if (data.workspace) {
        setWorkspace(data.workspace);
      } else {
        setWorkspace((prev) => ({
          ...prev,
          incidents: (prev.incidents || []).map((inc) =>
            inc.id === incidentId ? { ...inc, status: 'RESOLVED' } : inc
          ),
          telemetry: (prev.telemetry || []).map((t) => ({
            ...t,
            p95LatencyMs: 38,
            errorRatePercent: 0.02
          }))
        }));
      }
    } catch {
      // update locally
      setWorkspace((prev) => ({
        ...prev,
        incidents: (prev.incidents || []).map((inc) =>
          inc.id === incidentId ? { ...inc, status: 'RESOLVED' } : inc
        ),
        telemetry: (prev.telemetry || []).map((t) => ({
          ...t,
          p95LatencyMs: 38,
          errorRatePercent: 0.02
        }))
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-Fix pipeline
  const handleAutoFixPipeline = async (pipelineId: string) => {
    if (!can(currentRole, 'triggerPipelines')) {
      console.warn(`Role ${currentRole} is not authorized to repair pipelines`);
      return;
    }

    setWorkspace((prev) => ({
      ...prev,
      pipelines: (prev.pipelines || []).map((p) =>
        p.id === pipelineId
          ? {
              ...p,
              status: 'SUCCESS',
              stages: (p.stages || []).map((s) => ({ ...s, status: 'SUCCESS' }))
            }
          : p
      ),
      auditRecords: [
        {
          id: `aud_${Date.now()}`,
          timestamp: new Date().toISOString().substring(11, 19),
          actor: 'NexusDev AI (Autonomous Agent)',
          action: 'ci_pipeline.auto_repair',
          target: `Pipeline ${pipelineId}`,
          riskLevel: 'LOW',
          permissionResult: 'ALLOWED',
          rollbackId: 'rbk_9918'
        },
        ...(prev.auditRecords || [])
      ]
    }));
  };

  // Rollback deployment
  const handleRollbackDeployment = async (deploymentId: string) => {
    if (!can(currentRole, 'rollbackProduction')) {
      console.warn(`Role ${currentRole} is not authorized to rollback deployments`);
      return;
    }

    setWorkspace((prev) => {
      const targetDep = (prev.deployments || []).find((d) => d.id === deploymentId);
      const rollbackVer = targetDep?.rollbackVersion || 'v2.4.0';

      return {
        ...prev,
        deployments: (prev.deployments || []).map((d) =>
          d.id === deploymentId
            ? {
                ...d,
                version: rollbackVer,
                status: 'HEALTHY',
                commitMessage: `Rollback to ${rollbackVer} (Safe Recovery Checkpoint)`
              }
            : d
        ),
        auditRecords: [
          {
            id: `aud_${Date.now()}`,
            timestamp: new Date().toISOString().substring(11, 19),
            actor: `${currentRole} User (${currentUser?.name || 'Engineer'})`,
            action: 'deployment.rollback',
            target: `Deployment ${deploymentId} -> ${rollbackVer}`,
            riskLevel: 'HIGH',
            permissionResult: 'ALLOWED',
            rollbackId: `rbk_${Date.now().toString().slice(-4)}`
          },
          ...prev.auditRecords
        ]
      };
    });
  };

  // Trigger New Deployment
  const handleTriggerDeploy = (env: EnvironmentName, version: string) => {
    const isProd = env === 'production';
    if (isProd && !can(currentRole, 'deployProduction')) {
      console.warn(`Role ${currentRole} is not authorized to deploy to production`);
      return;
    }
    if (!isProd && !can(currentRole, 'deployStaging')) {
      console.warn(`Role ${currentRole} is not authorized to deploy to staging`);
      return;
    }

    setWorkspace((prev) => ({
      ...prev,
      deployments: [
        {
          id: `dep_${Date.now()}`,
          environment: env,
          version: version,
          commitHash: '9cf112a',
          commitMessage: `Deploy ${version} with verified cognitive security test suite`,
          deployedBy: `${currentRole} (${currentUser?.name || 'Engineer'})`,
          deployedAt: 'Just now',
          status: 'HEALTHY',
          trafficPercent: 100,
          replicas: 4,
          healthyReplicas: 4,
          rollbackAvailable: true,
          rollbackVersion: 'v2.4.2'
        },
        ...prev.deployments
      ],
      auditRecords: [
        {
          id: `aud_${Date.now()}`,
          timestamp: new Date().toISOString().substring(11, 19),
          actor: `${currentRole} (${currentUser?.name || 'Engineer'})`,
          action: 'deployment.trigger_release',
          target: `${env} cluster -> ${version}`,
          riskLevel: 'MEDIUM',
          permissionResult: 'ALLOWED',
          rollbackId: `rbk_${Date.now().toString().slice(-4)}`
        },
        ...prev.auditRecords
      ]
    }));
  };

  // Merge PR
  const handleMergePr = (prId: string) => {
    if (!can(currentRole, 'approvePR')) {
      console.warn(`Role ${currentRole} is not authorized to merge pull requests`);
      return;
    }

    setWorkspace((prev) => ({
      ...prev,
      pullRequests: (prev.pullRequests || []).map((pr) =>
        pr.id === prId ? { ...pr, status: 'MERGED' } : pr
      ),
      auditRecords: [
        {
          id: `aud_${Date.now()}`,
          timestamp: new Date().toISOString().substring(11, 19),
          actor: `${currentRole} (${currentUser?.name || 'Engineer'})`,
          action: 'pull_request.squash_and_merge',
          target: `PR ${prId}`,
          riskLevel: 'MEDIUM',
          permissionResult: 'ALLOWED',
          rollbackId: 'rbk_merge_01'
        },
        ...(prev.auditRecords || [])
      ]
    }));
  };

  // Restart K8s deployment
  const handleRestartK8s = async () => {
    if (!can(currentRole, 'restartPods')) {
      console.warn(`Role ${currentRole} is not authorized to restart pods`);
      return;
    }

    setWorkspace((prev) => ({
      ...prev,
      infrastructure: (prev.infrastructure || []).map((pod) => ({
        ...pod,
        status: 'Running',
        restarts: 0,
        logs: [
          ...(pod.logs || []),
          '>> [09:28:00] Deployment rollout complete: Pod restarted successfully with fresh DB connection pool.'
        ]
      })),
      auditRecords: [
        {
          id: `aud_${Date.now()}`,
          timestamp: new Date().toISOString().substring(11, 19),
          actor: `${currentRole} (${currentUser?.name || 'Engineer'})`,
          action: 'kubernetes.roll_restart',
          target: 'Deployment nexus-auth-service',
          riskLevel: 'HIGH',
          permissionResult: 'ALLOWED',
          rollbackId: 'rbk_k8s_01'
        },
        ...(prev.auditRecords || [])
      ]
    }));
  };

  // If not authenticated, render LoginView with full screen canvas
  if (!isAuthenticated) {
    return (
      <LoginView
        onLoginSuccess={() => {
          setCurrentView('dashboard');
          window.location.hash = '#/dashboard';
        }}
      />
    );
  }

  const activeIncidentCount = workspace.incidents.filter((i) => i.status !== 'RESOLVED').length;
  const failingPipelineCount = workspace.pipelines.filter((p) => p.status === 'FAILED').length;

  // View Level RBAC Verification
  const isViewAuthorized = canAccessView(currentRole, currentView);

  return (
    <div
      id="nexus-platform-root"
      className={`flex flex-col h-screen w-screen font-mono overflow-hidden transition-colors duration-150 ${
        isDark ? 'bg-[#0A0B0D] text-[#E0E0E0]' : 'bg-[#F6F8FA] text-[#0F172A]'
      }`}
    >
      {/* Top Global Header Bar with Integrated User Account */}
      <Header
        currentView={currentView}
        activeProject={workspace.projects[0]?.name || 'nexus-auth-service'}
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        currentEnv={currentEnv}
        onEnvChange={setCurrentEnv}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        activeIncidentsCount={activeIncidentCount}
        incidents={workspace.incidents}
        onNavigate={handleNavigate}
        onDispatchIncidentHero={handleDispatchIncidentHero}
        onRemediateIncident={handleRemediateIncident}
        onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />

      {/* Main Body: Left Sidebar + Central Work Area */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activeView={currentView}
          onSelectView={handleNavigate}
          currentRole={currentRole}
          openIssuesCount={workspace.issues.filter((i) => i.status === 'OPEN').length}
          activeIncidentsCount={activeIncidentCount}
          failingPipelinesCount={failingPipelineCount}
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
        />

        {/* Dynamic View Router with Streamlined Layout */}
        <main
          className={`flex-1 flex flex-col overflow-hidden transition-colors duration-150 ${
            isDark ? 'bg-[#0A0B0D]' : 'bg-[#F6F8FA]'
          }`}
        >
          {!isViewAuthorized ? (
            <AccessDeniedView
              userRole={currentRole}
              attemptedView={currentView}
              onNavigateHome={() => handleNavigate('dashboard')}
            />
          ) : (
            <ErrorBoundary moduleName={currentView.toUpperCase()}>
              {currentView === 'dashboard' && (
                <DashboardView
                  onNavigate={handleNavigate}
                  incidents={workspace.incidents}
                  pipelines={workspace.pipelines}
                  deployments={workspace.deployments}
                  issues={workspace.issues}
                  currentRole={currentRole}
                  onDispatchAgentHero={handleDispatchIncidentHero}
                />
              )}

              {currentView === 'ai-agent' && (
                <AgentCommandCenter
                  currentRole={currentRole}
                  onNavigateView={handleNavigate}
                  onCompleteHeroFlow={() => {
                    handleRemediateIncident('inc_01');
                    handleNavigate('dashboard');
                  }}
                  initialTaskPrompt={agentInitialPrompt}
                  selectedScenarioId={agentSelectedScenarioId}
                />
              )}

              {currentView === 'code-workspace' && (
                <CodeWorkspaceView
                  files={workspace.files}
                  branches={workspace.branches}
                  onSaveFile={handleSaveFile}
                />
              )}

              {currentView === 'issues' && (
                <IssuesView
                  issues={workspace.issues}
                  onDispatchToAgent={handleDispatchIssue}
                />
              )}

              {currentView === 'pull-requests' && (
                <PullRequestsView
                  pullRequests={workspace.pullRequests}
                  currentRole={currentRole}
                  onNavigateToAgent={() => handleNavigate('ai-agent')}
                  onMergePr={handleMergePr}
                />
              )}

              {currentView === 'pipelines' && (
                <PipelinesView
                  pipelines={workspace.pipelines}
                  onAutoFixPipeline={handleAutoFixPipeline}
                  onTriggerPipeline={(name) => {
                    // simulated re-trigger
                  }}
                  onNavigateToAgent={(prompt, scenarioId) => {
                    handleDispatchIncidentHero(prompt, scenarioId);
                  }}
                />
              )}

              {currentView === 'deployments' && (
                <DeploymentsView
                  deployments={workspace.deployments}
                  currentRole={currentRole}
                  onRollback={handleRollbackDeployment}
                  onTriggerDeploy={handleTriggerDeploy}
                />
              )}

              {currentView === 'infrastructure' && (
                <InfrastructureView
                  resources={workspace.infrastructure}
                  onRestartDeployment={handleRestartK8s}
                />
              )}

              {currentView === 'incidents' && (
                <IncidentsView
                  incidents={workspace.incidents}
                  onRemediateIncident={handleRemediateIncident}
                  onNavigateToAgent={handleDispatchIncidentHero}
                />
              )}

              {currentView === 'observability' && (
                <ObservabilityView
                  metrics={workspace.telemetry}
                  logs={workspace.observabilityLogs}
                  onNavigateToView={handleNavigate}
                />
              )}

              {currentView === 'audit-log' && (
                <AuditLogView
                  auditRecords={workspace.auditRecords}
                />
              )}

              {currentView === 'governance' && (
                <GovernanceView
                  currentRole={currentRole}
                  onNavigate={handleNavigate}
                />
              )}

              {currentView === 'settings' && (
                <SettingsView
                  currentRole={currentRole}
                  onRoleChange={handleRoleChange}
                  onNavigate={handleNavigate}
                />
              )}
            </ErrorBoundary>
          )}
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        currentRole={currentRole}
        onNavigate={(viewId) => {
          handleNavigate(viewId);
          setIsCommandPaletteOpen(false);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NexusDevWorkspaceApp />
      </AuthProvider>
    </ThemeProvider>
  );
}


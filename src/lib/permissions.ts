import { RbacRole, NavViewId } from '../types';

export type PermissionKey =
  | 'viewDashboard'
  | 'viewAgent'
  | 'viewRepositories'
  | 'modifyCode'
  | 'viewIssues'
  | 'modifyIssues'
  | 'viewPullRequests'
  | 'approvePR'
  | 'viewPipelines'
  | 'triggerPipelines'
  | 'viewDeployments'
  | 'deployStaging'
  | 'deployProduction'
  | 'rollbackProduction'
  | 'viewInfrastructure'
  | 'restartPods'
  | 'viewIncidents'
  | 'investigateIncidents'
  | 'remediateIncidents'
  | 'viewObservability'
  | 'viewAudit'
  | 'viewLoginAudit'
  | 'exportAudit'
  | 'viewGovernance'
  | 'manageGovernance'
  | 'manageUsers'
  | 'editRBAC'
  | 'manageAutonomy';

export const ROLE_PERMISSIONS: Record<RbacRole, Record<PermissionKey, boolean>> = {
  Admin: {
    viewDashboard: true,
    viewAgent: true,
    viewRepositories: true,
    modifyCode: true,
    viewIssues: true,
    modifyIssues: true,
    viewPullRequests: true,
    approvePR: true,
    viewPipelines: true,
    triggerPipelines: true,
    viewDeployments: true,
    deployStaging: true,
    deployProduction: true,
    rollbackProduction: true,
    viewInfrastructure: true,
    restartPods: true,
    viewIncidents: true,
    investigateIncidents: true,
    remediateIncidents: true,
    viewObservability: true,
    viewAudit: true,
    viewLoginAudit: true,
    exportAudit: true,
    viewGovernance: true,
    manageGovernance: true,
    manageUsers: true,
    editRBAC: true,
    manageAutonomy: true
  },
  TechLead: {
    viewDashboard: true,
    viewAgent: true,
    viewRepositories: true,
    modifyCode: true,
    viewIssues: true,
    modifyIssues: true,
    viewPullRequests: true,
    approvePR: true,
    viewPipelines: true,
    triggerPipelines: true,
    viewDeployments: true,
    deployStaging: true,
    deployProduction: false,
    rollbackProduction: false,
    viewInfrastructure: true,
    restartPods: false,
    viewIncidents: true,
    investigateIncidents: true,
    remediateIncidents: true,
    viewObservability: true,
    viewAudit: true,
    viewLoginAudit: false,
    exportAudit: true,
    viewGovernance: false,
    manageGovernance: false,
    manageUsers: false,
    editRBAC: false,
    manageAutonomy: false
  },
  DevOps: {
    viewDashboard: true,
    viewAgent: false,
    viewRepositories: false,
    modifyCode: false,
    viewIssues: false,
    modifyIssues: false,
    viewPullRequests: false,
    approvePR: false,
    viewPipelines: true,
    triggerPipelines: true,
    viewDeployments: true,
    deployStaging: true,
    deployProduction: true,
    rollbackProduction: true,
    viewInfrastructure: true,
    restartPods: true,
    viewIncidents: true,
    investigateIncidents: true,
    remediateIncidents: true,
    viewObservability: true,
    viewAudit: true,
    viewLoginAudit: false,
    exportAudit: true,
    viewGovernance: false,
    manageGovernance: false,
    manageUsers: false,
    editRBAC: false,
    manageAutonomy: false
  },
  Developer: {
    viewDashboard: true,
    viewAgent: true,
    viewRepositories: true,
    modifyCode: true,
    viewIssues: true,
    modifyIssues: true,
    viewPullRequests: true,
    approvePR: false,
    viewPipelines: true,
    triggerPipelines: true,
    viewDeployments: false,
    deployStaging: true,
    deployProduction: false,
    rollbackProduction: false,
    viewInfrastructure: false,
    restartPods: false,
    viewIncidents: false,
    investigateIncidents: false,
    remediateIncidents: false,
    viewObservability: true,
    viewAudit: true,
    viewLoginAudit: false,
    exportAudit: true,
    viewGovernance: false,
    manageGovernance: false,
    manageUsers: false,
    editRBAC: false,
    manageAutonomy: false
  },
  Viewer: {
    viewDashboard: true,
    viewAgent: false,
    viewRepositories: true,
    modifyCode: false,
    viewIssues: true,
    modifyIssues: false,
    viewPullRequests: true,
    approvePR: false,
    viewPipelines: true,
    triggerPipelines: false,
    viewDeployments: true,
    deployStaging: false,
    deployProduction: false,
    rollbackProduction: false,
    viewInfrastructure: true,
    restartPods: false,
    viewIncidents: true,
    investigateIncidents: false,
    remediateIncidents: false,
    viewObservability: true,
    viewAudit: true,
    viewLoginAudit: false,
    exportAudit: false,
    viewGovernance: false,
    manageGovernance: false,
    manageUsers: false,
    editRBAC: false,
    manageAutonomy: false
  }
};

export const ROLE_VIEW_ACCESS: Record<RbacRole, NavViewId[]> = {
  Admin: [
    'dashboard',
    'ai-agent',
    'code-workspace',
    'issues',
    'pull-requests',
    'pipelines',
    'deployments',
    'infrastructure',
    'incidents',
    'observability',
    'audit-log',
    'governance',
    'settings'
  ],
  TechLead: [
    'dashboard',
    'ai-agent',
    'code-workspace',
    'issues',
    'pull-requests',
    'pipelines',
    'deployments',
    'infrastructure',
    'incidents',
    'observability',
    'audit-log',
    'settings'
  ],
  DevOps: [
    'dashboard',
    'ai-agent',
    'code-workspace',
    'issues',
    'pull-requests',
    'pipelines',
    'deployments',
    'infrastructure',
    'incidents',
    'observability',
    'audit-log',
    'settings'
  ],
  Developer: [
    'dashboard',
    'ai-agent',
    'code-workspace',
    'issues',
    'pull-requests',
    'pipelines',
    'deployments',
    'infrastructure',
    'incidents',
    'observability',
    'audit-log',
    'settings'
  ],
  Viewer: [
    'dashboard',
    'code-workspace',
    'issues',
    'pull-requests',
    'pipelines',
    'deployments',
    'infrastructure',
    'incidents',
    'observability',
    'audit-log',
    'settings'
  ]
};

export function can(role: RbacRole, permission: PermissionKey): boolean {
  if (!role || !ROLE_PERMISSIONS[role]) return false;
  return !!ROLE_PERMISSIONS[role][permission];
}

export function canAccessView(role: RbacRole, viewId: NavViewId): boolean {
  if (!role || !ROLE_VIEW_ACCESS[role]) return false;
  return ROLE_VIEW_ACCESS[role].includes(viewId);
}

export function getRoleDescription(role: RbacRole): string {
  switch (role) {
    case 'Admin':
      return 'Full administrative access. Governs user accounts, security roles, login audits, system policies, and production deployments.';
    case 'TechLead':
      return 'Senior engineering authority. Approves pull requests, investigates critical incidents, deploys to staging, and executes AI remediation.';
    case 'DevOps':
      return 'Infrastructure and release management. Operates CI/CD pipelines, Kubernetes clusters, canary deployments, and production rollbacks.';
    case 'Developer':
      return 'Core application development. Authors code, creates issues, opens pull requests, triggers staging test pipelines, and monitors APM telemetry.';
    case 'Viewer':
      return 'Auditor and observer. Read-only visibility across dashboards, metrics, and non-sensitive audit logs without mutation rights.';
    default:
      return '';
  }
}

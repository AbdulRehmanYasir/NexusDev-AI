export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type PermissionType = 'READ' | 'WRITE' | 'EXECUTE' | 'DEPLOY';
export type EnvironmentName = 'development' | 'staging' | 'production';
export type RbacRole = 'Admin' | 'TechLead' | 'Developer' | 'DevOps' | 'Viewer';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: RbacRole;
  avatar: string;
}

export interface FileItem {
  path: string;
  name: string;
  isDirectory: boolean;
  content?: string;
  language?: string;
  size?: string;
  lastModified?: string;
  children?: FileItem[];
}

export interface GitCommit {
  id: string;
  hash: string;
  message: string;
  author: string;
  timestamp: string;
  branch: string;
  filesChanged: number;
  insertions: number;
  deletions: number;
}

export interface GitBranch {
  name: string;
  isDefault: boolean;
  lastCommitHash: string;
  lastCommitMessage: string;
  author: string;
  updatedAt: string;
}

export interface IssueTicket {
  id: string;
  number: number;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  labels: string[];
  assignee?: string;
  createdAt: string;
  updatedAt: string;
  relatedFile?: string;
}

export interface PullRequest {
  id: string;
  number: number;
  title: string;
  description: string;
  sourceBranch: string;
  targetBranch: string;
  author: string;
  status: 'OPEN' | 'MERGED' | 'CLOSED';
  createdAt: string;
  reviewScore: number;
  aiReview: {
    verdict: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENT';
    securityRating: 'SECURE' | 'WARNING' | 'CRITICAL';
    summary: string;
    suggestions: string[];
  };
  changedFiles: {
    filename: string;
    additions: number;
    deletions: number;
    patch: string;
  }[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  category: 'repository' | 'git' | 'sandbox' | 'docker' | 'kubernetes' | 'terraform' | 'telemetry' | 'deployment' | 'incident';
  permission: PermissionType;
  riskLevel: RiskLevel;
  timeoutMs: number;
}

export interface ToolCallExecution {
  id: string;
  toolName: string;
  category: string;
  riskLevel: RiskLevel;
  permission: PermissionType;
  status: 'PENDING_APPROVAL' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'REJECTED';
  input: Record<string, any>;
  output?: any;
  durationMs?: number;
  timestamp: string;
  error?: string;
}

export interface AgentPlanStep {
  id: string;
  title: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
  toolUsed?: string;
  riskLevel: RiskLevel;
  requiresApproval: boolean;
  approvalStatus?: 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED';
  outputSnippet?: string;
}

export interface AgentTaskRun {
  id: string;
  prompt: string;
  taskTitle: string;
  status: 'PLANNING' | 'AWAITING_APPROVAL' | 'EXECUTING' | 'VALIDATING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  currentStepIndex: number;
  riskLevel: RiskLevel;
  plan: AgentPlanStep[];
  toolCalls: ToolCallExecution[];
  reasoningLog: {
    timestamp: string;
    type: 'THOUGHT' | 'FACT' | 'HYPOTHESIS' | 'ACTION' | 'VERIFICATION';
    content: string;
  }[];
  proposedDiff?: {
    filePath: string;
    originalContent: string;
    modifiedContent: string;
    diffSnippet: string;
    explanation: string;
  };
  sandboxResult?: {
    testsRun: number;
    testsPassed: number;
    testsFailed: number;
    output: string;
    durationMs: number;
  };
  createdBranch?: string;
  createdPRNumber?: number;
  deployedEnvironment?: EnvironmentName;
  startedAt: string;
  completedAt?: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  status: 'SUCCESS' | 'RUNNING' | 'FAILED' | 'QUEUED' | 'SKIPPED';
  duration: string;
  logs: string[];
  errorMessage?: string;
}

export interface PipelineRun {
  id: string;
  pipelineName: string;
  commitHash: string;
  commitMessage: string;
  branch: string;
  author: string;
  status: 'SUCCESS' | 'RUNNING' | 'FAILED';
  startedAt: string;
  duration: string;
  stages: PipelineStage[];
  aiAnalysis?: {
    failedStage: string;
    rootCause: string;
    affectedFiles: string[];
    suggestedFix: string;
    confidencePercent: number;
  };
}

export interface DeploymentRecord {
  id: string;
  environment: EnvironmentName;
  version: string;
  commitHash: string;
  commitMessage: string;
  deployedBy: string;
  deployedAt: string;
  status: 'HEALTHY' | 'DEPLOYING' | 'DEGRADED' | 'FAILED' | 'ROLLED_BACK';
  trafficPercent: number;
  replicas: number;
  healthyReplicas: number;
  rollbackAvailable: boolean;
  rollbackVersion?: string;
}

export interface KubernetesResource {
  id: string;
  name: string;
  kind: 'Pod' | 'Deployment' | 'Service' | 'Ingress' | 'ConfigMap';
  namespace: string;
  status: 'Running' | 'CrashLoopBackOff' | 'Pending' | 'Completed' | 'Degraded';
  restarts: number;
  age: string;
  cpuUsage: string;
  memoryUsage: string;
  node: string;
  logs?: string[];
}

export interface TelemetryDataPoint {
  timestamp: string;
  timeLabel: string;
  p95LatencyMs: number;
  errorRatePercent: number;
  requestsPerSec: number;
  cpuPercent: number;
  memoryPercent: number;
  dbPoolUtilization: number;
}

export interface IncidentRecord {
  id: string;
  incidentNumber: string;
  title: string;
  severity: 'P1' | 'P2' | 'P3' | 'P4';
  status: 'INVESTIGATING' | 'IDENTIFIED' | 'MITIGATING' | 'RESOLVED';
  affectedService: string;
  environment: EnvironmentName;
  startedAt: string;
  resolvedAt?: string;
  observedFacts: string[];
  aiHypotheses: {
    hypothesis: string;
    likelihood: number;
    evidence: string;
  }[];
  recommendedActions: string[];
  correlatedDeploymentId?: string;
  correlatedCommitHash?: string;
}

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: RbacRole;
  status: 'ACTIVE' | 'DISABLED';
  avatar?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export type LoginEventType = 'USER_LOGIN' | 'USER_LOGOUT' | 'LOGIN_FAILED' | 'SESSION_EXPIRED';
export type LoginStatusType = 'SUCCESS' | 'FAILED' | 'EXPIRED';

export interface LoginAuditRecord {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  email: string;
  role: RbacRole;
  event: LoginEventType;
  status: LoginStatusType;
  sourceIp: string;
  sessionId: string;
  requestId: string;
  failureReason?: string;
  environment?: string;
}

export interface AuditRecord {
  id: string;
  timestamp: string;
  actorType: 'HUMAN' | 'AI_AGENT' | 'SYSTEM';
  actorName: string;
  action: string;
  category: 'CODE' | 'CONFIG' | 'TEST' | 'DEPLOYMENT' | 'SECURITY' | 'INFRASTRUCTURE';
  permissionUsed: PermissionType;
  riskLevel: RiskLevel;
  details: string;
  status: 'APPROVED' | 'AUTO_APPROVED' | 'EXECUTED' | 'REJECTED' | 'FAILED';
  targetResource: string;
  rollbackId?: string;
  environment?: string;
  sourceIp?: string;
  requestId?: string;
  previousState?: string;
  newState?: string;
  hash?: string;
  sha256?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export type NavViewId =
  | 'dashboard'
  | 'ai-agent'
  | 'code-workspace'
  | 'issues'
  | 'pull-requests'
  | 'pipelines'
  | 'deployments'
  | 'infrastructure'
  | 'incidents'
  | 'observability'
  | 'audit-log'
  | 'governance'
  | 'settings';

export interface TelemetryMetric {
  timestamp: string;
  p95LatencyMs: number;
  errorRatePercent: number;
  requestsPerSec: number;
  cpuPercent: number;
  memoryPercent: number;
}

export interface ObservabilityLog {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  service: string;
  message: string;
}

export interface ProjectInfo {
  id: string;
  name: string;
  slug: string;
  description: string;
  activeBranch: string;
}

export interface AutonomyPolicy {
  autoApproveLowRisk: boolean;
  autoApproveMediumRisk: boolean;
  requireApprovalForExecute: boolean;
  requireApprovalForDeployStaging: boolean;
  requireApprovalForDeployProduction: boolean;
  sandboxEnforcement: boolean;
  secretMaskingEnabled: boolean;
  maxAutonomousStepLimit: number;
}

export interface WorkspaceState {
  projects: ProjectInfo[];
  files: FileItem[];
  branches: GitBranch[];
  commits: GitCommit[];
  issues: IssueTicket[];
  pullRequests: PullRequest[];
  pipelines: PipelineRun[];
  deployments: DeploymentRecord[];
  infrastructure: KubernetesResource[];
  incidents: IncidentRecord[];
  telemetry: TelemetryMetric[];
  observabilityLogs: ObservabilityLog[];
  auditRecords: any[];
}

export type ThemeMode = 'dark' | 'light';

export * from '../data/engineeringScenarios';

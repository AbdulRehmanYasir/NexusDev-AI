import {
  FileItem,
  GitCommit,
  GitBranch,
  IssueTicket,
  PullRequest,
  PipelineRun,
  DeploymentRecord,
  KubernetesResource,
  TelemetryDataPoint,
  IncidentRecord,
  AuditRecord,
  ToolDefinition,
  AutonomyPolicy,
  UserProfile,
  WorkspaceState
} from '../types';

export const currentUser: UserProfile = {
  id: 'usr_admin_01',
  name: 'Abdul Rehman Yasir',
  email: 'admin@nexusdev.ai',
  role: 'Admin',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120'
};

export const defaultPolicy: AutonomyPolicy = {
  autoApproveLowRisk: true,
  autoApproveMediumRisk: false,
  requireApprovalForExecute: true,
  requireApprovalForDeployStaging: false,
  requireApprovalForDeployProduction: true,
  sandboxEnforcement: true,
  secretMaskingEnabled: true,
  maxAutonomousStepLimit: 15
};

export const availableTools: ToolDefinition[] = [
  { name: 'repository.search', description: 'Semantic and regex search across the entire code tree', category: 'repository', permission: 'READ', riskLevel: 'LOW', timeoutMs: 5000 },
  { name: 'repository.read', description: 'Read file contents, symbols, and dependencies', category: 'repository', permission: 'READ', riskLevel: 'LOW', timeoutMs: 5000 },
  { name: 'repository.write', description: 'Stage modifications to repository files with diff tracking', category: 'repository', permission: 'WRITE', riskLevel: 'MEDIUM', timeoutMs: 10000 },
  { name: 'git.diff', description: 'Generate structural git diff of workspace changes against branch base', category: 'git', permission: 'READ', riskLevel: 'LOW', timeoutMs: 5000 },
  { name: 'git.branch', description: 'Create and checkout a new isolated feature/fix branch', category: 'git', permission: 'WRITE', riskLevel: 'MEDIUM', timeoutMs: 5000 },
  { name: 'git.commit', description: 'Create signed atomic git commit with semantic message', category: 'git', permission: 'WRITE', riskLevel: 'MEDIUM', timeoutMs: 8000 },
  { name: 'git.pull_request', description: 'Open Pull Request on remote git with changelog and test report', category: 'git', permission: 'WRITE', riskLevel: 'MEDIUM', timeoutMs: 10000 },
  { name: 'sandbox.exec', description: 'Run sandboxed ephemeral bash command in isolated container', category: 'sandbox', permission: 'EXECUTE', riskLevel: 'HIGH', timeoutMs: 30000 },
  { name: 'test.run', description: 'Execute unit and integration test suite with coverage report', category: 'sandbox', permission: 'EXECUTE', riskLevel: 'HIGH', timeoutMs: 25000 },
  { name: 'build.run', description: 'Execute TypeScript compiler & asset bundling validation', category: 'sandbox', permission: 'EXECUTE', riskLevel: 'HIGH', timeoutMs: 30000 },
  { name: 'docker.build', description: 'Build multi-stage OCI container image and scan layers', category: 'docker', permission: 'EXECUTE', riskLevel: 'HIGH', timeoutMs: 45000 },
  { name: 'kubernetes.get', description: 'Query Kubernetes cluster resources, pods, services, and endpoints', category: 'kubernetes', permission: 'READ', riskLevel: 'LOW', timeoutMs: 5000 },
  { name: 'kubernetes.logs', description: 'Stream container and pod logs with timestamp filtering', category: 'kubernetes', permission: 'READ', riskLevel: 'LOW', timeoutMs: 8000 },
  { name: 'kubernetes.restart', description: 'Gracefully roll restart Kubernetes deployment pods', category: 'kubernetes', permission: 'DEPLOY', riskLevel: 'HIGH', timeoutMs: 20000 },
  { name: 'terraform.plan', description: 'Generate declarative infrastructure execution plan', category: 'terraform', permission: 'READ', riskLevel: 'LOW', timeoutMs: 15000 },
  { name: 'terraform.apply', description: 'Provision or update cloud infrastructure resources', category: 'terraform', permission: 'DEPLOY', riskLevel: 'CRITICAL', timeoutMs: 60000 },
  { name: 'logs.search', description: 'Query distributed telemetry log aggregation system', category: 'telemetry', permission: 'READ', riskLevel: 'LOW', timeoutMs: 6000 },
  { name: 'metrics.query', description: 'Evaluate Prometheus/Datadog telemetry time-series metrics', category: 'telemetry', permission: 'READ', riskLevel: 'LOW', timeoutMs: 5000 },
  { name: 'deployment.deploy', description: 'Trigger canary or rolling deployment to targeted environment', category: 'deployment', permission: 'DEPLOY', riskLevel: 'CRITICAL', timeoutMs: 60000 },
  { name: 'incident.diagnose', description: 'Correlate telemetry, commits, and logs for automated root cause analysis', category: 'incident', permission: 'READ', riskLevel: 'LOW', timeoutMs: 12000 }
];

export const initialRepositoryFiles: FileItem[] = [
  {
    path: 'src/auth/session.ts',
    name: 'session.ts',
    isDirectory: false,
    language: 'typescript',
    size: '2.4 KB',
    lastModified: '14 mins ago',
    content: `import { verifyJwtToken } from './jwt';
import { db } from '../db/client';
import { Logger } from '../utils/logger';

export interface SessionUser {
  id: string;
  email: string;
  role: 'admin' | 'developer' | 'viewer';
  organizationId: string;
  tokenVersion: number;
}

export interface SessionValidationResult {
  valid: boolean;
  user?: SessionUser;
  reason?: string;
}

/**
 * Validates active session token from incoming Authorization header
 * BUG: In recent commit 84c21a, session payload changed to serialize organizationId as orgId,
 * causing tokenVersion validation to fail silently and throw 500 error when refreshing tokens.
 */
export async function validateSessionToken(rawToken: string): Promise<SessionValidationResult> {
  if (!rawToken || !rawToken.startsWith('Bearer ')) {
    return { valid: false, reason: 'Missing or malformed Authorization header' };
  }

  const token = rawToken.replace('Bearer ', '').trim();

  try {
    const payload = await verifyJwtToken(token);
    if (!payload || !payload.sub) {
      return { valid: false, reason: 'Invalid token signature or expired claims' };
    }

    // CRITICAL BUG HERE: Checking payload.organizationId instead of handling both orgId & organizationId
    // AND missing null check on tokenVersion mismatch which throws unhandled exception
    const userRecord = await db.users.findUnique({
      where: { id: payload.sub }
    });

    if (!userRecord) {
      return { valid: false, reason: 'User record no longer exists' };
    }

    // Buggy comparison that breaks during token refresh:
    if (payload.tokenVersion !== userRecord.tokenVersion) {
      Logger.warn(\`Token version mismatch for user \${payload.sub}: expected \${userRecord.tokenVersion}, got \${payload.tokenVersion}\`);
      return { valid: false, reason: 'Session revoked due to token version bump' };
    }

    return {
      valid: true,
      user: {
        id: userRecord.id,
        email: userRecord.email,
        role: userRecord.role,
        organizationId: userRecord.organizationId || payload.orgId,
        tokenVersion: userRecord.tokenVersion
      }
    };
  } catch (error: any) {
    Logger.error('Session validation unexpected runtime exception', { error: error.message });
    throw error; // Uncaught 500 error in production
  }
}
`
  },
  {
    path: 'src/auth/jwt.ts',
    name: 'jwt.ts',
    isDirectory: false,
    language: 'typescript',
    size: '1.8 KB',
    lastModified: '2 days ago',
    content: `import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SIGNING_KEY || 'default-insecure-dev-secret';

export interface JwtPayload {
  sub: string;
  email: string;
  role: 'admin' | 'developer' | 'viewer';
  orgId?: string;
  organizationId?: string;
  tokenVersion: number;
  iat: number;
  exp: number;
}

export async function verifyJwtToken(token: string): Promise<JwtPayload | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const [headerB64, payloadB64, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(\`\${headerB64}.\${payloadB64}\`)
      .digest('base64url');

    if (signature !== expectedSignature) {
      return null;
    }

    const payload: JwtPayload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
    if (Date.now() >= payload.exp * 1000) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
`
  },
  {
    path: 'tests/auth.test.ts',
    name: 'auth.test.ts',
    isDirectory: false,
    language: 'typescript',
    size: '3.1 KB',
    lastModified: '3 days ago',
    content: `import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateSessionToken } from '../src/auth/session';
import { db } from '../src/db/client';

describe('Authentication & Session Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should reject requests without Bearer prefix', async () => {
    const res = await validateSessionToken('InvalidHeader123');
    expect(res.valid).toBe(false);
    expect(res.reason).toContain('Missing or malformed');
  });

  it('should validate active sessions with correct claims', async () => {
    // Standard mock token with orgId payload
    const mockBearer = 'Bearer valid.payload.sig';
    const result = await validateSessionToken(mockBearer);
    expect(result.valid).toBe(true);
    expect(result.user?.email).toBe('alex.vance@company.internal');
  });

  it('should gracefully handle token version deserialization without throwing 500', async () => {
    const mockRefreshedBearer = 'Bearer refreshed.legacyTokenVersion.sig';
    // This test currently FAILS in commit 84c21a because of unhandled tokenVersion exception
    const result = await validateSessionToken(mockRefreshedBearer);
    expect(result.valid).toBeDefined();
  });
});
`
  },
  {
    path: 'src/services/payment.ts',
    name: 'payment.ts',
    isDirectory: false,
    language: 'typescript',
    size: '3.8 KB',
    lastModified: '1 day ago',
    content: `import { Logger } from '../utils/logger';
import { validateSessionToken } from '../auth/session';

export interface PaymentIntentRequest {
  amountCents: number;
  currency: 'USD' | 'EUR' | 'GBP';
  customerId: string;
  idempotencyKey: string;
}

export async function createPaymentIntent(authHeader: string, request: PaymentIntentRequest) {
  const session = await validateSessionToken(authHeader);
  if (!session.valid || !session.user) {
    throw new Error('Unauthorized: Valid active session required to charge customer');
  }

  Logger.info(\`Processing payment \${request.amountCents} \${request.currency} for org \${session.user.organizationId}\`);

  // Payment processing logic with resilience & circuit breaker
  return {
    status: 'succeeded',
    transactionId: \`tx_\${Date.now()}_\${Math.random().toString(36).substring(7)}\`,
    amount: request.amountCents / 100,
    currency: request.currency,
    timestamp: new Date().toISOString()
  };
}
`
  },
  {
    path: 'k8s/deployment.yaml',
    name: 'deployment.yaml',
    isDirectory: false,
    language: 'yaml',
    size: '1.5 KB',
    lastModified: '5 days ago',
    content: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: nexus-auth-service
  namespace: production
  labels:
    app.kubernetes.io/name: nexus-auth-service
    app.kubernetes.io/part-of: nexusdev-platform
spec:
  replicas: 4
  selector:
    matchLabels:
      app: nexus-auth-service
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: nexus-auth-service
    spec:
      containers:
      - name: auth-service
        image: gcr.io/nexusdev-prod/auth-service:v2.4.1
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: connection_string
        resources:
          limits:
            cpu: "1000m"
            memory: "1024Mi"
          requests:
            cpu: "250m"
            memory: "512Mi"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 15
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
`
  },
  {
    path: 'terraform/main.tf',
    name: 'main.tf',
    isDirectory: false,
    language: 'hcl',
    size: '2.1 KB',
    lastModified: '2 weeks ago',
    content: `terraform {
  required_version = ">= 1.5.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.gcp_project_id
  region  = "us-central1"
}

resource "google_container_cluster" "primary" {
  name     = "nexus-prod-cluster-us"
  location = "us-central1-a"

  initial_node_count       = 3
  remove_default_node_pool = true
}

resource "google_container_node_pool" "primary_nodes" {
  name       = "primary-node-pool"
  location   = "us-central1-a"
  cluster    = google_container_cluster.primary.name
  node_count = 4

  node_config {
    preemptible  = false
    machine_type = "e2-standard-4"
    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]
  }
}
`
  },
  {
    path: '.github/workflows/ci.yml',
    name: 'ci.yml',
    isDirectory: false,
    language: 'yaml',
    size: '1.2 KB',
    lastModified: '1 week ago',
    content: `name: NexusDev Autonomous CI/CD

on:
  push:
    branches: [ main, staging ]
  pull_request:
    branches: [ main ]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - name: Typecheck
        run: npm run lint
      - name: Run Test Suite in Sandbox
        run: npm run test:coverage
      - name: Build OCI Artifacts
        run: docker build -t gcr.io/nexusdev/auth-service:\${{ github.sha }} .
`
  },
  {
    path: 'Dockerfile',
    name: 'Dockerfile',
    isDirectory: false,
    language: 'dockerfile',
    size: '850 B',
    lastModified: '3 weeks ago',
    content: `FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 3000
USER node
CMD ["node", "dist/server.cjs"]
`
  }
];

export const initialBranches: GitBranch[] = [
  {
    name: 'main',
    isDefault: true,
    lastCommitHash: '84c21a9',
    lastCommitMessage: 'feat(auth): optimize session cache & token deserialization format',
    author: 'Devin Cole',
    updatedAt: '25 mins ago'
  },
  {
    name: 'staging',
    isDefault: false,
    lastCommitHash: 'f491c0e',
    lastCommitMessage: 'chore(deps): update crypto dependencies',
    author: 'Alex Vance',
    updatedAt: '2 hours ago'
  },
  {
    name: 'fix/auth-session-500-patch',
    isDefault: false,
    lastCommitHash: 'e92bc10',
    lastCommitMessage: 'fix(session): handle orgId fallback and tokenVersion deserialization safely',
    author: 'NexusDev AI Agent',
    updatedAt: 'Just now'
  }
];

export const initialCommits: GitCommit[] = [
  {
    id: 'cmt_1',
    hash: '84c21a9',
    message: 'feat(auth): optimize session cache & token deserialization format',
    author: 'Devin Cole <devin@company.internal>',
    timestamp: '25 mins ago',
    branch: 'main',
    filesChanged: 3,
    insertions: 42,
    deletions: 18
  },
  {
    id: 'cmt_2',
    hash: 'f491c0e',
    message: 'chore(deps): update crypto dependencies and express security headers',
    author: 'Alex Vance <alex.vance@company.internal>',
    timestamp: '2 hours ago',
    branch: 'main',
    filesChanged: 2,
    insertions: 12,
    deletions: 8
  },
  {
    id: 'cmt_3',
    hash: '3d90b41',
    message: 'refactor(payment): add circuit breaker and idempotency token storage',
    author: 'Sarah Lin <sarah.l@company.internal>',
    timestamp: '1 day ago',
    branch: 'main',
    filesChanged: 4,
    insertions: 88,
    deletions: 22
  },
  {
    id: 'cmt_4',
    hash: '1a77e99',
    message: 'ci: add container vulnerability scanner and SBOM generator',
    author: 'DevOps Bot',
    timestamp: '3 days ago',
    branch: 'main',
    filesChanged: 1,
    insertions: 29,
    deletions: 4
  }
];

export const initialIssues: IssueTicket[] = [
  {
    id: 'iss_412',
    number: 412,
    title: 'Production auth token deserialization causes intermittent 500s on refresh',
    description: 'Since deployment v2.4.1 (commit 84c21a9), users with active sessions attempting token refresh receive HTTP 500 Uncaught Exception in session.ts validateSessionToken.',
    status: 'IN_PROGRESS',
    priority: 'URGENT',
    labels: ['bug', 'auth', 'production-incident', 'p1-critical'],
    assignee: 'NexusDev AI Agent',
    createdAt: '22 mins ago',
    updatedAt: 'Just now',
    relatedFile: 'src/auth/session.ts'
  },
  {
    id: 'iss_413',
    number: 413,
    title: 'Implement OAuth2 PKCE Provider for mobile & single-page client auth',
    description: 'Add support for Google and GitHub OAuth 2.0 PKCE flow with authorization code exchange and secure cookie state handling.',
    status: 'OPEN',
    priority: 'HIGH',
    labels: ['feature', 'security', 'auth'],
    createdAt: '1 day ago',
    updatedAt: '4 hours ago',
    relatedFile: 'src/auth/oauth.ts'
  },
  {
    id: 'iss_414',
    number: 414,
    title: 'Kubernetes auth-service pod memory leak under sustained P99 peak load',
    description: 'Memory footprint grows monotonically from 420MB to 980MB over 48 hours until OOMKilled by cgroup controller.',
    status: 'OPEN',
    priority: 'MEDIUM',
    labels: ['devops', 'kubernetes', 'performance'],
    createdAt: '2 days ago',
    updatedAt: '1 day ago',
    relatedFile: 'k8s/deployment.yaml'
  }
];

export const initialPullRequests: PullRequest[] = [
  {
    id: 'pr_89',
    number: 89,
    title: 'fix(auth): resilient token validation and backwards-compatible orgId mapping',
    description: 'Resolves #412: Adds backwards-compatible deserialization for legacy orgId fields, prevents unhandled runtime exceptions on tokenVersion mismatch, and adds unit test coverage.',
    sourceBranch: 'fix/auth-session-500-patch',
    targetBranch: 'main',
    author: 'nexusdev-agent[bot]',
    status: 'OPEN',
    createdAt: '8 mins ago',
    reviewScore: 98,
    aiReview: {
      verdict: 'APPROVED',
      securityRating: 'SECURE',
      summary: 'Patch safely catches token deserialization edge cases without altering security constraints. 100% of auth test suite passing in sandbox.',
      suggestions: [
        'Verified null-coalescing on organizationId preserves multi-tenant isolation.',
        'Token version mismatch now logs a structured warning and returns a 401 instead of crashing with a 500.'
      ]
    },
    changedFiles: [
      {
        filename: 'src/auth/session.ts',
        additions: 14,
        deletions: 5,
        patch: `@@ -31,9 +31,16 @@ export async function validateSessionToken(rawToken: string) {
-    const userRecord = await db.users.findUnique({ where: { id: payload.sub } });
-    if (payload.tokenVersion !== userRecord.tokenVersion) {
-      Logger.warn(\`Token version mismatch\`);
-      return { valid: false, reason: 'Session revoked' };
-    }
+    const userRecord = await db.users.findUnique({ where: { id: payload.sub } });
+    if (!userRecord) {
+      return { valid: false, reason: 'User record no longer exists' };
+    }
+    const incomingVersion = payload.tokenVersion ?? 0;
+    if (incomingVersion !== userRecord.tokenVersion) {
+      Logger.warn(\`Token version mismatch for user \${payload.sub}\`);
+      return { valid: false, reason: 'Session expired or refreshed' };
+    }`
      }
    ]
  }
];

export const initialPipelines: PipelineRun[] = [
  {
    id: 'pipe_1042',
    pipelineName: 'Production Deploy Workflow',
    commitHash: '84c21a9',
    commitMessage: 'feat(auth): optimize session cache & token deserialization format',
    branch: 'main',
    author: 'Devin Cole',
    status: 'FAILED',
    startedAt: '24 mins ago',
    duration: '3m 14s',
    stages: [
      { id: 'stg_1', name: 'Lint & Static Analysis', status: 'SUCCESS', duration: '22s', logs: ['Running ESLint...', 'Found 0 errors and 0 warnings.', 'TypeScript typecheck passed.'] },
      { id: 'stg_2', name: 'Unit & Integration Tests', status: 'FAILED', duration: '48s', logs: ['vitest run tests/auth.test.ts', 'FAIL tests/auth.test.ts > should gracefully handle token version deserialization', 'Error: validateSessionToken threw unhandled TypeError at session.ts:42'], errorMessage: 'TypeError: Cannot read properties of undefined (reading tokenVersion) at validateSessionToken' },
      { id: 'stg_3', name: 'Container Build', status: 'SKIPPED', duration: '0s', logs: ['Stage skipped due to previous failure.'] },
      { id: 'stg_4', name: 'Canary Deployment (Production)', status: 'SKIPPED', duration: '0s', logs: ['Stage skipped.'] }
    ],
    aiAnalysis: {
      failedStage: 'Unit & Integration Tests',
      rootCause: 'Uncaught TypeError in session.ts:42 when validating payload without explicit tokenVersion property.',
      affectedFiles: ['src/auth/session.ts', 'tests/auth.test.ts'],
      suggestedFix: 'Add null-coalescing on payload.tokenVersion and wrap db query with defensive try/catch.',
      confidencePercent: 96
    }
  },
  {
    id: 'pipe_1043',
    pipelineName: 'Feature Verification & Sandbox',
    commitHash: 'e92bc10',
    commitMessage: 'fix(session): handle orgId fallback and tokenVersion deserialization safely',
    branch: 'fix/auth-session-500-patch',
    author: 'NexusDev AI Agent',
    status: 'SUCCESS',
    startedAt: '6 mins ago',
    duration: '2m 04s',
    stages: [
      { id: 'stg_1', name: 'Lint & Static Analysis', status: 'SUCCESS', duration: '18s', logs: ['ESLint passed cleanly. 0 issues detected.'] },
      { id: 'stg_2', name: 'Unit & Integration Tests', status: 'SUCCESS', duration: '32s', logs: ['3 tests passed (100% coverage on session.ts)'] },
      { id: 'stg_3', name: 'Container Build & OCI Scan', status: 'SUCCESS', duration: '44s', logs: ['Built image gcr.io/nexusdev/auth-service:fix-patch-e92bc10', 'Trivy vulnerability scan: 0 critical, 0 high.'] },
      { id: 'stg_4', name: 'Ephemeral Staging Deploy', status: 'SUCCESS', duration: '30s', logs: ['Deployed to preview environment: https://pr89-auth.staging.company.internal'] }
    ]
  }
];

export const initialDeployments: DeploymentRecord[] = [
  {
    id: 'dep_prod_99',
    environment: 'production',
    version: 'v2.4.1',
    commitHash: '84c21a9',
    commitMessage: 'feat(auth): optimize session cache & token deserialization format',
    deployedBy: 'CI/CD Automated Deploy',
    deployedAt: '24 mins ago',
    status: 'DEGRADED',
    trafficPercent: 100,
    replicas: 4,
    healthyReplicas: 3,
    rollbackAvailable: true,
    rollbackVersion: 'v2.4.0'
  },
  {
    id: 'dep_stg_104',
    environment: 'staging',
    version: 'v2.4.2-rc1',
    commitHash: 'e92bc10',
    commitMessage: 'fix(session): handle orgId fallback and tokenVersion deserialization safely',
    deployedBy: 'NexusDev AI Agent',
    deployedAt: '5 mins ago',
    status: 'HEALTHY',
    trafficPercent: 100,
    replicas: 2,
    healthyReplicas: 2,
    rollbackAvailable: true,
    rollbackVersion: 'v2.4.0'
  },
  {
    id: 'dep_dev_221',
    environment: 'development',
    version: 'v2.5.0-nightly',
    commitHash: 'f491c0e',
    commitMessage: 'chore(deps): update crypto dependencies',
    deployedBy: 'Alex Vance',
    deployedAt: '2 hours ago',
    status: 'HEALTHY',
    trafficPercent: 100,
    replicas: 1,
    healthyReplicas: 1,
    rollbackAvailable: false
  }
];

export const initialKubernetesResources: KubernetesResource[] = [
  {
    id: 'pod_auth_1',
    name: 'nexus-auth-service-78dfb9-4k2ln',
    kind: 'Pod',
    namespace: 'production',
    status: 'Running',
    restarts: 1,
    age: '24m',
    cpuUsage: '340m (34%)',
    memoryUsage: '612Mi (60%)',
    node: 'gke-node-pool-1-a8x9',
    logs: [
      '2026-08-19T09:05:12Z [INFO] Server started on port 3000',
      '2026-08-19T09:12:44Z [ERROR] Session validation unexpected runtime exception: TypeError tokenVersion',
      '2026-08-19T09:18:02Z [WARN] High error rate detected on /api/auth/session endpoint: 32.4% 5xx'
    ]
  },
  {
    id: 'pod_auth_2',
    name: 'nexus-auth-service-78dfb9-9z7tp',
    kind: 'Pod',
    namespace: 'production',
    status: 'Running',
    restarts: 0,
    age: '24m',
    cpuUsage: '290m (29%)',
    memoryUsage: '580Mi (56%)',
    node: 'gke-node-pool-1-b2m1',
    logs: [
      '2026-08-19T09:05:15Z [INFO] Auth worker ready',
      '2026-08-19T09:15:30Z [ERROR] Session validation unexpected runtime exception'
    ]
  },
  {
    id: 'pod_auth_3',
    name: 'nexus-auth-service-78dfb9-mm91p',
    kind: 'Pod',
    namespace: 'production',
    status: 'CrashLoopBackOff',
    restarts: 4,
    age: '12m',
    cpuUsage: '12m (1%)',
    memoryUsage: '94Mi (9%)',
    node: 'gke-node-pool-1-c4n3',
    logs: [
      '2026-08-19T09:16:00Z [INFO] Starting container auth-service',
      '2026-08-19T09:16:04Z [FATAL] Database connection pool timeout after 10000ms: max pool size 50 reached',
      '2026-08-19T09:16:05Z [FATAL] Process exiting with code 1'
    ]
  },
  {
    id: 'pod_payment_1',
    name: 'nexus-payment-engine-6bf8c-w81kx',
    kind: 'Pod',
    namespace: 'production',
    status: 'Running',
    restarts: 0,
    age: '3d',
    cpuUsage: '180m (18%)',
    memoryUsage: '420Mi (41%)',
    node: 'gke-node-pool-1-a8x9',
    logs: [
      '2026-08-19T09:00:00Z [INFO] Payment gateway healthy: 0 failed transactions'
    ]
  }
];

export const initialTelemetryPoints: TelemetryDataPoint[] = [
  { timestamp: '09:00', timeLabel: '09:00', p95LatencyMs: 42, errorRatePercent: 0.04, requestsPerSec: 1420, cpuPercent: 32, memoryPercent: 48, dbPoolUtilization: 24 },
  { timestamp: '09:05', timeLabel: '09:05', p95LatencyMs: 45, errorRatePercent: 0.05, requestsPerSec: 1480, cpuPercent: 34, memoryPercent: 50, dbPoolUtilization: 28 },
  { timestamp: '09:10', timeLabel: '09:10 (Deploy v2.4.1)', p95LatencyMs: 68, errorRatePercent: 2.1, requestsPerSec: 1510, cpuPercent: 44, memoryPercent: 55, dbPoolUtilization: 38 },
  { timestamp: '09:15', timeLabel: '09:15', p95LatencyMs: 240, errorRatePercent: 14.8, requestsPerSec: 1390, cpuPercent: 68, memoryPercent: 64, dbPoolUtilization: 72 },
  { timestamp: '09:18', timeLabel: '09:18 (P1 Alert)', p95LatencyMs: 410, errorRatePercent: 28.6, requestsPerSec: 1220, cpuPercent: 82, memoryPercent: 78, dbPoolUtilization: 94 },
  { timestamp: '09:20', timeLabel: '09:20', p95LatencyMs: 380, errorRatePercent: 26.2, requestsPerSec: 1280, cpuPercent: 79, memoryPercent: 74, dbPoolUtilization: 88 }
];

export const initialIncidents: IncidentRecord[] = [
  {
    id: 'inc_891',
    incidentNumber: 'INC-2026-0819-01',
    title: 'Production API Latency Spiked 380% with Elevated 500 Error Rate (28.6%)',
    severity: 'P1',
    status: 'INVESTIGATING',
    affectedService: 'nexus-auth-service',
    environment: 'production',
    startedAt: '18 mins ago',
    correlatedDeploymentId: 'dep_prod_99',
    correlatedCommitHash: '84c21a9',
    observedFacts: [
      'P95 latency surged from 42ms to 410ms at 09:10 UTC immediately after deployment v2.4.1.',
      'HTTP 500 Internal Server Errors surged to 28.6% on endpoint POST /api/auth/session/refresh.',
      'Application logs demonstrate recurring TypeError: Cannot read properties of undefined (reading tokenVersion).',
      'Database connection pool utilization spiked from 24% to 94% due to hung connection handles on unhandled exceptions.'
    ],
    aiHypotheses: [
      {
        hypothesis: 'Commit 84c21a9 altered JWT claims payload structure without maintaining fallback compatibility for legacy active tokens.',
        likelihood: 0.94,
        evidence: 'Git diff in session.ts shows removal of orgId fallback and strict direct property access on tokenVersion.'
      },
      {
        hypothesis: 'Database connection exhaustion caused secondary pod restarts in Kubernetes cluster.',
        likelihood: 0.78,
        evidence: 'Pod nexus-auth-service-78dfb9-mm91p transitioned to CrashLoopBackOff with DB pool timeout.'
      }
    ],
    recommendedActions: [
      'Apply AI patch fix/auth-session-500-patch with defensive tokenVersion check.',
      'Run complete auth test suite in sandbox container to verify 100% pass rate.',
      'Deploy patch to staging environment and verify telemetry stabilization.',
      'Promote release to production via canary rollout or initiate 1-click rollback to v2.4.0 if emergency mitigation is prioritized.'
    ]
  }
];

export const initialAuditRecords: AuditRecord[] = [
  {
    id: 'aud_101',
    timestamp: '2 mins ago',
    actorType: 'AI_AGENT',
    actorName: 'NexusDev AI Agent',
    action: 'SANDBOX_TEST_EXECUTION',
    category: 'TEST',
    permissionUsed: 'EXECUTE',
    riskLevel: 'HIGH',
    details: 'Executed sandboxed vitest test suite on branch fix/auth-session-500-patch. 3/3 tests passed in 1.4s. Verified defensive tokenVersion check and handled undefined claims without runtime exception.',
    status: 'EXECUTED',
    targetResource: 'tests/auth.test.ts',
    environment: 'SANDBOX_CONTAINER',
    sourceIp: 'sandbox://worker-nebula-01',
    requestId: 'req_101_sandbox_vitest_exec',
    previousState: 'FAILING_TEST_SESSION_NULL_TOKEN_VERSION',
    newState: 'PASSED_TEST_SUITE_3_OF_3_GREEN',
    hash: 'sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
    description: 'Autonomous execution of comprehensive isolation test suite validating JWT token claim defensive extraction.'
  },
  {
    id: 'aud_102',
    timestamp: '6 mins ago',
    actorType: 'HUMAN',
    actorName: 'Alex Vance',
    action: 'APPROVE_AGENT_PATCH',
    category: 'CODE',
    permissionUsed: 'WRITE',
    riskLevel: 'MEDIUM',
    details: 'Approved autonomous patch for Issue #412: Safe tokenVersion deserialization in session.ts with fallback to empty payload object and strict type coercion.',
    status: 'APPROVED',
    targetResource: 'src/auth/session.ts',
    environment: 'NEBULA_STAGING',
    sourceIp: '192.168.1.104',
    requestId: 'req_102_patch_approval_human_lead',
    previousState: 'PAYLOAD_UNCHECKED_DEREFERENCE',
    newState: 'GUARDED_PAYLOAD_SAFE_DESTRUCTURE',
    hash: 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    description: 'Human peer review and signature-less authorization for automated PR branch fast-forward merge.'
  },
  {
    id: 'aud_103',
    timestamp: '24 mins ago',
    actorType: 'SYSTEM',
    actorName: 'GitHub Actions Runner',
    action: 'DEPLOY_CANARY_PRODUCTION',
    category: 'DEPLOYMENT',
    permissionUsed: 'DEPLOY',
    riskLevel: 'CRITICAL',
    details: 'Initiated rolling deployment v2.4.1 to namespace production with 25% traffic weighting and real-time error-rate circuit breaker monitoring.',
    status: 'EXECUTED',
    targetResource: 'k8s/deployment.yaml',
    rollbackId: 'dep_prod_99',
    environment: 'NEBULA_PROD',
    sourceIp: 'runner://gha-prod-cluster-us-east',
    requestId: 'req_103_canary_rollout_k8s',
    previousState: 'RELEASE_V2_4_0_ACTIVE',
    newState: 'RELEASE_V2_4_1_CANARY_25_PERCENT',
    hash: 'sha256:4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
    description: 'Automated CI/CD progressive canary deployment triggered following verified branch build status.'
  },
  {
    id: 'aud_104',
    timestamp: '45 mins ago',
    actorType: 'AI_AGENT',
    actorName: 'NexusDev AI Agent',
    action: 'AUTONOMOUS_ROOT_CAUSE_ANALYSIS',
    category: 'SECURITY',
    permissionUsed: 'READ',
    riskLevel: 'LOW',
    details: 'Isolated root cause for 500 error spike: observed tokenVersion mismatch, affected file src/auth/session.ts where comparison logic failed because tokenVersion was compared against stale session metadata, resulting in invalid session rejection.',
    status: 'EXECUTED',
    targetResource: 'src/auth/session.ts',
    environment: 'NEBULA_PROD',
    sourceIp: 'agent://diagnostics-engine-04',
    requestId: 'req_104_rca_telemetry_trace',
    previousState: 'INCIDENT_ACTIVE_ALERT_P1',
    newState: 'DIAGNOSTIC_HYPOTHESIS_CONFIRMED',
    hash: 'sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    description: 'Multi-modal diagnostic correlation mapping 500 status telemetry spikes to undefined tokenVersion property lookup.'
  },
  {
    id: 'aud_105',
    timestamp: '1 hour ago',
    actorType: 'SYSTEM',
    actorName: 'Nexus Policy Engine',
    action: 'POLICY_ENFORCEMENT_CHECK',
    category: 'SECURITY',
    permissionUsed: 'READ',
    riskLevel: 'LOW',
    details: 'Evaluated zero-trust cryptographic role-based authorization policy. Confirmed SHA-256 Merkle tree continuous validation without ledger drift.',
    status: 'EXECUTED',
    targetResource: 'security/governance-policy.json',
    environment: 'NEBULA_PROD',
    sourceIp: 'enforcer://rbac-daemon-01',
    requestId: 'req_105_rbac_merkle_sweep',
    previousState: 'MERKLE_TREE_ROOT_VALIDATED',
    newState: 'MERKLE_TREE_ROOT_CONFIRMED_GREEN',
    hash: 'sha256:6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b',
    description: 'Scheduled periodic cryptographic integrity audit validating SHA-256 block chain state.'
  }
];

export const initialWorkspace: WorkspaceState = {
  projects: [
    {
      id: 'proj_auth',
      name: 'Nexus Core Auth & Microservices',
      slug: 'nexus-auth-service',
      description: 'Zero-trust authentication, token lifecycle, and session management',
      activeBranch: 'main'
    }
  ],
  files: initialRepositoryFiles,
  branches: initialBranches,
  commits: initialCommits,
  issues: initialIssues,
  pullRequests: initialPullRequests,
  pipelines: initialPipelines,
  deployments: initialDeployments,
  infrastructure: initialKubernetesResources,
  incidents: initialIncidents,
  telemetry: initialTelemetryPoints,
  observabilityLogs: [
    { id: 'log_1', timestamp: '09:18:22', level: 'ERROR', service: 'nexus-auth-service', message: 'TypeError: Cannot read properties of undefined (reading tokenVersion) at validateSessionToken (session.ts:42)' },
    { id: 'log_2', timestamp: '09:18:21', level: 'WARN', service: 'nexus-auth-service', message: 'DB connection pool nearing capacity: 47/50 active handles' },
    { id: 'log_3', timestamp: '09:18:15', level: 'INFO', service: 'nexus-auth-service', message: 'HTTP POST /api/auth/session/refresh from client-applet/2.4' },
    { id: 'log_4', timestamp: '09:18:10', level: 'INFO', service: 'nexus-payment-engine', message: 'Payment gateway status OK, 0 errors' },
    { id: 'log_5', timestamp: '09:18:02', level: 'WARN', service: 'ingress-controller', message: 'Upstream connection latency exceeded 300ms SLA for route /api/auth' }
  ],
  auditRecords: initialAuditRecords
};

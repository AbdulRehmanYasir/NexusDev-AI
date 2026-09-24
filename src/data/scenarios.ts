import { RiskLevel, RbacRole, EnvironmentName } from '../types';

export type IncidentCategory =
  | 'RACE_CONDITION'
  | 'CONFIGURATION_DRIFT'
  | 'DATABASE_MIGRATION'
  | 'PERFORMANCE_REGRESSION'
  | 'SECURITY_REGRESSION'
  | 'UNCONFIRMED_RCA'
  | 'FLAKY_TEST'
  | 'MEMORY_LEAK'
  | 'DEPENDENCY_CONFLICT'
  | 'CANARY_FAILURE';

export type PipelineStageStatus =
  | 'QUEUED'
  | 'RUNNING'
  | 'PASSED'
  | 'FAILED'
  | 'BLOCKED'
  | 'CANCELLED'
  | 'TIMED_OUT'
  | 'FLAKY'
  | 'RETRYING'
  | 'DEGRADED';

export interface Hypothesis {
  id: string;
  name: string;
  confidencePercent: number;
  status: 'SUPPORTED' | 'ELIMINATED' | 'UNDER_INVESTIGATION' | 'UNCONFIRMED';
  evidenceFor: string[];
  evidenceAgainst: string[];
  eliminationReason?: string;
}

export interface TelemetrySignal {
  metric: string;
  value: string;
  status: 'NORMAL' | 'ELEVATED' | 'ANOMALOUS' | 'DEGRADED';
  relevance: 'HIGH' | 'MISLEADING' | 'SECONDARY' | 'CRITICAL';
  detail: string;
}

export interface RealisticScenarioPipelineStage {
  id: string;
  name: string;
  tool: string;
  status: PipelineStageStatus;
  duration: string;
  prerequisiteId?: string;
  blockedReason?: string;
  retryCount?: number;
  outputSnippet?: string;
}

export interface ProposedFixAnalysis {
  files: string[];
  riskLevel: RiskLevel;
  securityRating: 'PASSED' | 'WARNING' | 'CRITICAL_REJECTED';
  regressionRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  performanceImpact: 'POSITIVE' | 'NEUTRAL' | 'DEGRADED' | 'UNKNOWN';
  aiSelfReviewVerdict: 'APPROVE' | 'REJECT' | 'NEEDS_HUMAN_DECISION' | 'COLLECT_MORE_TELEMETRY';
  reviewSummary: string;
  originalCode: string;
  proposedCode: string;
  diffExplanation: string;
}

export interface RealisticEngineeringScenario {
  id: string;
  scenarioNumber: number;
  category: IncidentCategory;
  title: string;
  summary: string;
  environment: EnvironmentName;
  service: string;
  severity: 'P1' | 'P2' | 'P3' | 'P4';
  commitHash: string;
  commitMessage: string;
  branch: string;
  author: string;
  trigger: string;
  observedFacts: string[];
  telemetrySignals: TelemetrySignal[];
  hypotheses: Hypothesis[];
  primaryHypothesisId: string;
  rootCauseStatus: 'CONFIRMED' | 'UNCONFIRMED' | 'MULTI_FACTOR';
  rootCauseConclusion: string;
  proposedFix: ProposedFixAnalysis;
  pipelineStages: RealisticScenarioPipelineStage[];
  testMetrics: {
    total: number;
    passed: number;
    failed: number;
    flaky: number;
    duration: string;
    details: string;
  };
  finalDecisionOutcome:
    | 'SUCCESS_MERGED'
    | 'AI_FIX_REJECTED'
    | 'BLOCKED_BY_DEPENDENCY'
    | 'ROOT_CAUSE_UNCONFIRMED'
    | 'PERF_REGRESSION_DETECTED'
    | 'FLAKY_TEST_FLAGGED'
    | 'ROLLBACK_TRIGGERED'
    | 'HUMAN_REVIEW_REQUIRED';
  decisionExplanation: string;
  requiredRoleForApproval: RbacRole;
  isSimulated: boolean;
}

export const REALISTIC_SCENARIOS: RealisticEngineeringScenario[] = [
  {
    id: 'scen-01-race-condition',
    scenarioNumber: 1,
    category: 'RACE_CONDITION',
    title: 'Intermittent 500s Under Concurrency (Race Condition)',
    summary: 'Single isolated requests succeed 100%, but 2-4% of concurrent requests fail with session state corruption.',
    environment: 'production',
    service: 'auth-service',
    severity: 'P1',
    commitHash: '84c21a9',
    commitMessage: 'refactor(session): optimize in-memory token cache serialization',
    branch: 'main',
    author: 'dev-team-alpha',
    trigger: 'Webhook Dispatch (High Traffic Event)',
    observedFacts: [
      'Single requests pass 100% of integration test suites (184/184).',
      'Under concurrent load (500 req/sec), 2.8% of requests fail with TypeError: Cannot read properties of undefined.',
      'Only token refresh and mutation requests are affected; read-only requests succeed.',
      'Non-atomic read-modify-write observed in Redis session cache store during concurrent token version checks.',
      'Database connection pool remains at 18% capacity (not a pool exhaustion issue).'
    ],
    telemetrySignals: [
      { metric: 'CPU Utilization', value: '24%', status: 'NORMAL', relevance: 'MISLEADING', detail: 'Low CPU might mislead into thinking load is benign.' },
      { metric: 'P95 Latency', value: '410ms (+290%)', status: 'ANOMALOUS', relevance: 'HIGH', detail: 'Spikes during concurrent lock contention.' },
      { metric: 'Redis Mutex Collisions', value: '142 / min', status: 'DEGRADED', relevance: 'CRITICAL', detail: 'Direct indicator of uncoordinated write race.' },
      { metric: 'PostgreSQL DB Health', value: 'HEALTHY (18ms)', status: 'NORMAL', relevance: 'MISLEADING', detail: 'Database shows no errors, isolating fault to cache layer.' }
    ],
    hypotheses: [
      {
        id: 'h1',
        name: 'Redis Cache Non-Atomic Mutation Race',
        confidencePercent: 88,
        status: 'SUPPORTED',
        evidenceFor: ['Mutex collisions spiked to 142/min', 'Only concurrent mutation endpoints fail', 'Single-threaded tests never fail'],
        evidenceAgainst: []
      },
      {
        id: 'h2',
        name: 'JWT Token Expiration Clock Skew',
        confidencePercent: 19,
        status: 'ELIMINATED',
        evidenceFor: ['Token refresh endpoint impacted'],
        evidenceAgainst: ['All cluster nodes synchronized with chrony NTP (<2ms offset)', 'Errors are TypeErrors, not ExpiredSignature'],
        eliminationReason: 'NTP telemetry confirms sub-millisecond clock sync across all nodes.'
      },
      {
        id: 'h3',
        name: 'Postgres Connection Pool Exhaustion',
        confidencePercent: 12,
        status: 'ELIMINATED',
        evidenceFor: ['High concurrency scenario'],
        evidenceAgainst: ['DB pool usage is only 18/100 connections', 'Postgres logs show 0 connection timeout warnings'],
        eliminationReason: 'DB connection metrics confirm 82% idle pool capacity.'
      }
    ],
    primaryHypothesisId: 'h1',
    rootCauseStatus: 'CONFIRMED',
    rootCauseConclusion: 'Non-atomic tokenVersion validation and cache update in session.ts creates a race condition when concurrent requests arrive for the same user session.',
    proposedFix: {
      files: ['src/auth/session.ts', 'tests/concurrency.test.ts'],
      riskLevel: 'MEDIUM',
      securityRating: 'PASSED',
      regressionRisk: 'LOW',
      performanceImpact: 'POSITIVE',
      aiSelfReviewVerdict: 'APPROVE',
      reviewSummary: 'Replaces raw cache read-modify-write with atomic Redis Lua script evaluation and adds a distributed mutex lock with 250ms TTL.',
      originalCode: `// Buggy non-atomic check:
const currentSession = await redis.get(\`session:\${userId}\`);
if (currentSession && currentSession.tokenVersion === incomingVersion) {
  currentSession.lastActive = Date.now();
  await redis.set(\`session:\${userId}\`, currentSession);
}`,
      proposedCode: `// Atomic compare-and-swap via Lua:
const script = \`
  local val = redis.call('get', KEYS[1])
  if not val then return -1 end
  local data = cjson.decode(val)
  if data.tokenVersion == tonumber(ARGV[1]) then
    data.lastActive = tonumber(ARGV[2])
    redis.call('set', KEYS[1], cjson.encode(data), 'EX', 86400)
    return 1
  end
  return 0
\`;
const result = await redis.eval(script, 1, \`session:\${userId}\`, incomingVersion, Date.now());`,
      diffExplanation: 'Replaces unsafe async read-modify-write with atomic Redis EVAL script to eliminate thread interleaving.'
    },
    pipelineStages: [
      { id: 'stg_1', name: 'SAST Security Lint', tool: 'Semgrep / ESLint', status: 'PASSED', duration: '14s' },
      { id: 'stg_2', name: 'Unit Tests', tool: 'Vitest Unit Suite', status: 'PASSED', duration: '28s', outputSnippet: '184 passed, 0 failed' },
      { id: 'stg_3', name: 'Concurrent Load Tests', tool: 'k6 Concurrency Harness', status: 'FAILED', duration: '45s', outputSnippet: '2.8% errors under 500 VUs' },
      { id: 'stg_4', name: 'Container Build', tool: 'Docker BuildKit', status: 'BLOCKED', duration: '0s', prerequisiteId: 'stg_3', blockedReason: 'Blocked by failed prerequisite: Concurrent Load Tests' },
      { id: 'stg_5', name: 'Staging Deploy', tool: 'K8s Canary', status: 'QUEUED', duration: '0s', prerequisiteId: 'stg_4' }
    ],
    testMetrics: {
      total: 184,
      passed: 184,
      failed: 0,
      flaky: 0,
      duration: '1m 27s',
      details: 'Unit tests passed 184/184, but concurrent benchmark failed with 2.8% race collisions.'
    },
    finalDecisionOutcome: 'HUMAN_REVIEW_REQUIRED',
    decisionExplanation: 'Atomic patch generated and passes local concurrency tests; awaiting TechLead/Admin sign-off to merge PR #89.',
    requiredRoleForApproval: 'TechLead',
    isSimulated: true
  },
  {
    id: 'scen-02-config-drift',
    scenarioNumber: 2,
    category: 'CONFIGURATION_DRIFT',
    title: 'Configuration Drift (Staging Passes, Production Fails)',
    summary: 'Identical Git commit passes 100% in Development and Staging, but immediately crashes on Production initialization.',
    environment: 'production',
    service: 'payment-gateway',
    severity: 'P1',
    commitHash: '3f9901d',
    commitMessage: 'feat(payments): enable Stripe webhook signature verification v2',
    branch: 'release/2026.08',
    author: 'marcus.brody@nexusdev.ai',
    trigger: 'Production Release Tag v2.14.0',
    observedFacts: [
      'Development environment: PASS (all tests pass).',
      'Staging environment: PASS (canary healthy, 0 errors).',
      'Production environment: Immediate crash on boot with MissingRequiredConfig: STRIPE_WEBHOOK_SECRET_V2.',
      'Comparison of env maps reveals STRIPE_WEBHOOK_SECRET_V2 was added to Staging Vault but missing in Production Vault.',
      'No code defect exists in the application repository; the failure is pure infrastructure configuration drift.'
    ],
    telemetrySignals: [
      { metric: 'Staging Pod Status', value: '4/4 Running', status: 'NORMAL', relevance: 'MISLEADING', detail: 'Staging success masks missing production secret.' },
      { metric: 'Prod CrashLoop Count', value: '18 restarts', status: 'DEGRADED', relevance: 'CRITICAL', detail: 'Pods crash immediately during environment validation.' },
      { metric: 'ConfigMap Sync Status', value: 'DRIFT DETECTED', status: 'ANOMALOUS', relevance: 'CRITICAL', detail: 'Production SecretStore checksum mismatch vs Terraform spec.' }
    ],
    hypotheses: [
      {
        id: 'h1',
        name: 'Production Vault Secret Missing (Config Drift)',
        confidencePercent: 96,
        status: 'SUPPORTED',
        evidenceFor: ['Explicit error MissingRequiredConfig in container logs', 'Staging Vault contains key, Production Vault does not', 'Code commit is identical across both envs'],
        evidenceAgainst: []
      },
      {
        id: 'h2',
        name: 'Stripe SDK Version Incompatibility',
        confidencePercent: 14,
        status: 'ELIMINATED',
        evidenceFor: ['New feature uses Stripe v2 webhooks'],
        evidenceAgainst: ['Staging runs identical Docker image digest and works flawlessly'],
        eliminationReason: 'Docker digest parity rules out library version differences.'
      }
    ],
    primaryHypothesisId: 'h1',
    rootCauseStatus: 'CONFIRMED',
    rootCauseConclusion: 'Production environment variable STRIPE_WEBHOOK_SECRET_V2 is absent in production SecretStore, causing graceful config validation to halt container startup.',
    proposedFix: {
      files: ['terraform/environments/production/secrets.tf', 'helm/payment-gateway/values-prod.yaml'],
      riskLevel: 'LOW',
      securityRating: 'PASSED',
      regressionRisk: 'LOW',
      performanceImpact: 'NEUTRAL',
      aiSelfReviewVerdict: 'APPROVE',
      reviewSummary: 'Proposes syncing the missing secret key mapping into production Terraform manifest rather than altering application code.',
      originalCode: `# Missing production binding in secrets.tf
resource "kubernetes_secret" "payments" {
  data = {
    STRIPE_API_KEY = var.stripe_api_key
  }
}`,
      proposedCode: `# Synchronized production binding:
resource "kubernetes_secret" "payments" {
  data = {
    STRIPE_API_KEY            = var.stripe_api_key
    STRIPE_WEBHOOK_SECRET_V2  = var.stripe_webhook_secret_v2
  }
}`,
      diffExplanation: 'Syncs Terraform Kubernetes secret manifest to include the missing v2 webhook signing secret.'
    },
    pipelineStages: [
      { id: 'stg_1', name: 'Lint & Build', tool: 'Vite & TSC', status: 'PASSED', duration: '20s' },
      { id: 'stg_2', name: 'Staging Smoke Tests', tool: 'Playwright E2E', status: 'PASSED', duration: '50s' },
      { id: 'stg_3', name: 'Production Vault Config Audit', tool: 'Tfsec / Vault Sync', status: 'FAILED', duration: '12s', outputSnippet: 'Missing key STRIPE_WEBHOOK_SECRET_V2' },
      { id: 'stg_4', name: 'Production Deploy', tool: 'ArgoCD Sync', status: 'BLOCKED', duration: '0s', prerequisiteId: 'stg_3', blockedReason: 'Blocked by failed prerequisite: Production Vault Config Audit' }
    ],
    testMetrics: {
      total: 184,
      passed: 184,
      failed: 0,
      flaky: 0,
      duration: '1m 22s',
      details: 'All application unit tests passed. Production infrastructure secret validation failed.'
    },
    finalDecisionOutcome: 'HUMAN_REVIEW_REQUIRED',
    decisionExplanation: 'AI identified configuration drift between Staging and Production Vault. Requires DevOps/Admin authorization to inject production secret.',
    requiredRoleForApproval: 'DevOps',
    isSimulated: true
  },
  {
    id: 'scen-03-db-migration',
    scenarioNumber: 3,
    category: 'DATABASE_MIGRATION',
    title: 'Database Migration Sequence Mismatch',
    summary: 'Container image rollout completed before Drizzle/Postgres schema migration executed, causing 500 errors on column queries.',
    environment: 'production',
    service: 'user-service',
    severity: 'P1',
    commitHash: '91d84b2',
    commitMessage: 'feat(users): add user_mfa_settings and backup_codes column',
    branch: 'main',
    author: 'elena.rostova@nexusdev.ai',
    trigger: 'Automated CI/CD CD Pipeline',
    observedFacts: [
      'Application deployment succeeded and initial Kubernetes liveness probes reported HTTP 200.',
      '30 seconds later, user profile queries started failing with Postgres error: column "backup_codes" does not exist in table "users".',
      'Database migration job was queued behind a long-running batch index build.',
      'Application code is completely valid, but running against schema version v3 instead of v4.'
    ],
    telemetrySignals: [
      { metric: 'K8s Deployment Status', value: '4/4 Ready', status: 'NORMAL', relevance: 'MISLEADING', detail: 'Pods are up, but application queries fail.' },
      { metric: 'PostgreSQL Error Log', value: '42703 (Undefined Column)', status: 'DEGRADED', relevance: 'CRITICAL', detail: 'Explicit PostgreSQL error code confirming missing column.' },
      { metric: 'Migration Job Status', value: 'PENDING (Lock wait)', status: 'ANOMALOUS', relevance: 'CRITICAL', detail: 'Migration job waiting on DDL table lock.' }
    ],
    hypotheses: [
      {
        id: 'h1',
        name: 'Deployment Rolled Out Before Database Migration Finished',
        confidencePercent: 95,
        status: 'SUPPORTED',
        evidenceFor: ['PostgreSQL error 42703 (Undefined Column)', 'Migration lock wait in DB telemetry', 'App code references newly defined model fields'],
        evidenceAgainst: []
      },
      {
        id: 'h2',
        name: 'Application ORM Mapping Typo',
        confidencePercent: 18,
        status: 'ELIMINATED',
        evidenceFor: ['Missing column error'],
        evidenceAgainst: ['TypeScript types match migration file definitions exactly'],
        eliminationReason: 'Schema definition matches ORM model perfectly.'
      }
    ],
    primaryHypothesisId: 'h1',
    rootCauseStatus: 'CONFIRMED',
    rootCauseConclusion: 'Premature container cutover: Deployment controller did not enforce pre-deploy migration barrier, causing app v4 to query database schema v3.',
    proposedFix: {
      files: ['k8s/user-service/pre-install-migration-job.yaml', 'scripts/release.sh'],
      riskLevel: 'HIGH',
      securityRating: 'PASSED',
      regressionRisk: 'LOW',
      performanceImpact: 'NEUTRAL',
      aiSelfReviewVerdict: 'APPROVE',
      reviewSummary: 'Creates a Kubernetes Helm pre-upgrade migration hook with blocking barrier before pod rollouts.',
      originalCode: `# Async background migration:
kubectl apply -f k8s/migration.yaml &
kubectl rollout restart deployment/user-service`,
      proposedCode: `# Synchronous pre-deploy migration barrier:
kubectl apply -f k8s/pre-migration-job.yaml
kubectl wait --for=condition=complete --timeout=120s job/db-migrate-v4
if [ $? -eq 0 ]; then
  kubectl rollout restart deployment/user-service
fi`,
      diffExplanation: 'Adds a strict blocking barrier ensuring DB migration job is 100% complete prior to starting application pod rollout.'
    },
    pipelineStages: [
      { id: 'stg_1', name: 'Unit Tests', tool: 'Vitest', status: 'PASSED', duration: '22s' },
      { id: 'stg_2', name: 'Schema Migration Dry-run', tool: 'Drizzle ORM', status: 'FAILED', duration: '41s', outputSnippet: 'Migration lock acquisition timeout (120s)' },
      { id: 'stg_3', name: 'Canary Deployment', tool: 'Kubernetes Rolling', status: 'BLOCKED', duration: '0s', prerequisiteId: 'stg_2', blockedReason: 'Blocked by failed prerequisite: Schema Migration Dry-run' }
    ],
    testMetrics: {
      total: 184,
      passed: 184,
      failed: 0,
      flaky: 0,
      duration: '1m 03s',
      details: 'All tests pass; migration lock prevented live execution.'
    },
    finalDecisionOutcome: 'BLOCKED_BY_DEPENDENCY',
    decisionExplanation: 'Pipeline stage Canary Deployment blocked due to unmet database migration prerequisite.',
    requiredRoleForApproval: 'Admin',
    isSimulated: true
  },
  {
    id: 'scen-04-perf-regression',
    scenarioNumber: 4,
    category: 'PERFORMANCE_REGRESSION',
    title: 'Silent Performance Regression (N+1 Query Loop)',
    summary: '100% of unit tests pass, but production P95 latency jumped from 42ms to 780ms and database queries spiked by 430%.',
    environment: 'production',
    service: 'project-dashboard',
    severity: 'P2',
    commitHash: 'a718c99',
    commitMessage: 'refactor(projects): display assigned member avatars in project list view',
    branch: 'main',
    author: 'sarah.chen@nexusdev.ai',
    trigger: 'Merge Request #412',
    observedFacts: [
      'Unit tests: 184/184 PASSED (0 test failures).',
      'Integration tests: PASSED.',
      'Deployment health status: HEALTHY (HTTP 200 on all endpoints).',
      'However, Telemetry reveals P95 latency degraded from 42ms to 780ms (+1757%).',
      'Database query count per request jumped from 2 to 43 queries (classic N+1 query regression inside Array.map).',
      'A naive CI system would mark this SUCCESS, but NexusDev AI detects an intolerable performance regression.'
    ],
    telemetrySignals: [
      { metric: 'Unit Test Results', value: '184/184 PASS', status: 'NORMAL', relevance: 'MISLEADING', detail: 'Unit test mock data conceals latency degradation.' },
      { metric: 'P95 Latency', value: '780 ms (+1757%)', status: 'DEGRADED', relevance: 'CRITICAL', detail: 'Direct violation of <100ms SLO target.' },
      { metric: 'Database Query Rate', value: '43 queries / req (+430%)', status: 'DEGRADED', relevance: 'CRITICAL', detail: 'N+1 query loop fetching users in a loop.' },
      { metric: 'CPU Utilization', value: '38%', status: 'NORMAL', relevance: 'SECONDARY', detail: 'CPU is moderate as threads spend time waiting on I/O.' }
    ],
    hypotheses: [
      {
        id: 'h1',
        name: 'N+1 Query Loop inside Project List Serializer',
        confidencePercent: 94,
        status: 'SUPPORTED',
        evidenceFor: ['Query count scales linearly with project count', 'P95 latency degradation (+1757%)', 'Recent commit added member avatar loop in serialization'],
        evidenceAgainst: []
      },
      {
        id: 'h2',
        name: 'Database Index Drop',
        confidencePercent: 21,
        status: 'ELIMINATED',
        evidenceFor: ['Query latency high'],
        evidenceAgainst: ['Individual query execution time is fast (1.2ms), issue is query volume (43 queries per request)'],
        eliminationReason: 'EXPLAIN ANALYZE shows index scans are active; volume of queries is the issue.'
      }
    ],
    primaryHypothesisId: 'h1',
    rootCauseStatus: 'CONFIRMED',
    rootCauseConclusion: 'Array.map iteration over projects issues an unbatched await db.users.findMany(...) query per project, causing N+1 database roundtrips.',
    proposedFix: {
      files: ['src/services/projectService.ts', 'tests/performance.test.ts'],
      riskLevel: 'LOW',
      securityRating: 'PASSED',
      regressionRisk: 'LOW',
      performanceImpact: 'POSITIVE',
      aiSelfReviewVerdict: 'APPROVE',
      reviewSummary: 'Refactors project serializer to fetch all member details in a single batched IN (...) SQL query with DataLoader pattern.',
      originalCode: `// Buggy N+1 query loop:
const projects = await db.projects.findMany();
const enriched = await Promise.all(projects.map(async (p) => {
  const members = await db.users.findMany({ where: { projectId: p.id } }); // N queries!
  return { ...p, members };
}));`,
      proposedCode: `// Batched single-query join:
const projects = await db.projects.findMany({
  include: {
    members: {
      select: { id: true, name: true, avatar: true }
    }
  }
});`,
      diffExplanation: 'Replaces serial N+1 queries with a single optimized relational JOIN query.'
    },
    pipelineStages: [
      { id: 'stg_1', name: 'Unit Tests (184)', tool: 'Vitest', status: 'PASSED', duration: '24s' },
      { id: 'stg_2', name: 'Synthetic Performance Benchmark', tool: 'k6 Benchmark', status: 'FAILED', duration: '35s', outputSnippet: 'P95 780ms exceeds budget (100ms)' },
      { id: 'stg_3', name: 'Staging Promotion', tool: 'ArgoCD', status: 'BLOCKED', duration: '0s', prerequisiteId: 'stg_2', blockedReason: 'Blocked by failed prerequisite: Synthetic Performance Benchmark' }
    ],
    testMetrics: {
      total: 184,
      passed: 184,
      failed: 0,
      flaky: 0,
      duration: '59s',
      details: '184 passed, 0 failed, but Performance Regression detected in benchmark suite.'
    },
    finalDecisionOutcome: 'PERF_REGRESSION_DETECTED',
    decisionExplanation: 'All unit tests passed, but automated benchmark rejected the build due to a 780ms P95 latency violation.',
    requiredRoleForApproval: 'TechLead',
    isSimulated: true
  },
  {
    id: 'scen-05-security-regression',
    scenarioNumber: 5,
    category: 'SECURITY_REGRESSION',
    title: 'Security Regression: AI Self-Rejects Insecure Patch',
    summary: 'An initial AI fix resolved the TypeError but accidentally bypassed tokenVersion revocation checks. The AI Security Gate detects the flaw and REJECTS its own patch.',
    environment: 'production',
    service: 'auth-service',
    severity: 'P1',
    commitHash: '5e4a810',
    commitMessage: 'fix(auth): handle undefined tokenVersion during session refresh',
    branch: 'patch/auth-null-fix',
    author: 'nexus-ai-agent',
    trigger: 'Automated AI Remediation Job',
    observedFacts: [
      'Initial AI generated patch used loose fallback: if (!payload.tokenVersion || payload.tokenVersion === user.tokenVersion).',
      'This made unit tests pass (184/184) and stopped the 500 error.',
      'However, the AI Security Policy Review step evaluated the change against CWE-287 (Improper Authentication).',
      'The loose check allows any legacy or malicious token omitting tokenVersion to bypass revoked session invalidation.',
      'The AI Agent autonomously marked the fix as CRITICAL_SECURITY_RISK and REJECTED its own proposed patch.'
    ],
    telemetrySignals: [
      { metric: 'Unit Test Results', value: '184/184 PASS', status: 'NORMAL', relevance: 'MISLEADING', detail: 'Tests pass because tests were updated with bad assumptions.' },
      { metric: 'SAST Security Audit', value: 'CWE-287 VULNERABILITY', status: 'DEGRADED', relevance: 'CRITICAL', detail: 'Security scanner flagged authorization bypass.' },
      { metric: 'Auth Bypass Exploitability', value: 'HIGH', status: 'DEGRADED', relevance: 'CRITICAL', detail: 'Missing tokenVersion allows replay of revoked credentials.' }
    ],
    hypotheses: [
      {
        id: 'h1',
        name: 'Naive Null Fallback Weakens Session Revocation Security',
        confidencePercent: 99,
        status: 'SUPPORTED',
        evidenceFor: ['Allowing undefined tokenVersion bypasses global logout', 'Violates OWASP ASVS Session Management section 3.4', 'Flagged by internal security policy gate'],
        evidenceAgainst: []
      }
    ],
    primaryHypothesisId: 'h1',
    rootCauseStatus: 'CONFIRMED',
    rootCauseConclusion: 'The candidate patch fixes the runtime exception by weakening the security contract, rendering revoked sessions valid.',
    proposedFix: {
      files: ['src/auth/session.ts'],
      riskLevel: 'CRITICAL',
      securityRating: 'CRITICAL_REJECTED',
      regressionRisk: 'HIGH',
      performanceImpact: 'NEUTRAL',
      aiSelfReviewVerdict: 'REJECT',
      reviewSummary: 'AI Agent rejected candidate patch: introduces CWE-287 authorization bypass vulnerability.',
      originalCode: `// Insecure AI candidate patch:
if (!payload.tokenVersion || payload.tokenVersion === userRecord.tokenVersion) {
  return { valid: true, user: userRecord }; // DANGEROUS: Allows bypass if tokenVersion is omitted!
}`,
      proposedCode: `// Secure hardened patch:
if (typeof payload.tokenVersion !== 'number') {
  Logger.warn('Rejected legacy token missing mandatory tokenVersion claim');
  return { valid: false, reason: 'Malformed token: tokenVersion required' };
}
if (payload.tokenVersion !== userRecord.tokenVersion) {
  return { valid: false, reason: 'Session revoked' };
}`,
      diffExplanation: 'Rejects the insecure fallback and enforces strict type and value verification for tokenVersion.'
    },
    pipelineStages: [
      { id: 'stg_1', name: 'Unit Tests', tool: 'Vitest', status: 'PASSED', duration: '18s' },
      { id: 'stg_2', name: 'AI Security Policy Gate', tool: 'NexusDev Security Engine', status: 'FAILED', duration: '8s', outputSnippet: 'REJECTED: CWE-287 detected in candidate patch' },
      { id: 'stg_3', name: 'Pull Request Creation', tool: 'GitHub Integration', status: 'BLOCKED', duration: '0s', prerequisiteId: 'stg_2', blockedReason: 'Blocked by failed prerequisite: AI Security Policy Gate' }
    ],
    testMetrics: {
      total: 184,
      passed: 184,
      failed: 0,
      flaky: 0,
      duration: '26s',
      details: 'Tests passed, but candidate patch REJECTED due to security policy violation.'
    },
    finalDecisionOutcome: 'AI_FIX_REJECTED',
    decisionExplanation: 'AI Agent rejected its own candidate patch after security scan identified an authentication bypass vulnerability.',
    requiredRoleForApproval: 'Admin',
    isSimulated: true
  },
  {
    id: 'scen-06-unconfirmed-rca',
    scenarioNumber: 6,
    category: 'UNCONFIRMED_RCA',
    title: 'Observability Gap: Root Cause Unconfirmed',
    summary: 'Intermittent 502 Bad Gateway observed on API edge, but logs and traces lack correlation IDs. The AI refuses to hallucinate a fix and requests additional telemetry.',
    environment: 'production',
    service: 'api-gateway',
    severity: 'P2',
    commitHash: 'b4920aa',
    commitMessage: 'chore: bump ingress controller to v1.10.1',
    branch: 'main',
    author: 'devops-infra',
    trigger: 'Production Ingress Spike Alert',
    observedFacts: [
      '502 Bad Gateway errors occur on 0.4% of requests at edge ingress.',
      'Upstream service logs show no corresponding 5xx responses (all 200 OK).',
      'Ingress access logs do not log upstream_response_time or upstream_status.',
      'Network traces are inconclusive between cloud load balancer and ingress controller.',
      'Rather than claiming 99% confidence on a guess, AI outputs Confidence: 54% (UNCONFIRMED).'
    ],
    telemetrySignals: [
      { metric: 'Edge 502 Error Rate', value: '0.42%', status: 'ANOMALOUS', relevance: 'HIGH', detail: 'Occurs intermittently across all routes.' },
      { metric: 'Upstream Service Health', value: '100% OK', status: 'NORMAL', relevance: 'MISLEADING', detail: 'Upstream services report no errors.' },
      { metric: 'Ingress Detailed Logs', value: 'MISSING CORRELATION ID', status: 'DEGRADED', relevance: 'CRITICAL', detail: 'Observability gap prevents definitive attribution.' }
    ],
    hypotheses: [
      {
        id: 'h1',
        name: 'Ingress Keep-Alive Timeout Mismatch with Upstream',
        confidencePercent: 54,
        status: 'UNCONFIRMED',
        evidenceFor: ['Occurs on connection reuse', 'Upstream shows 0 errors'],
        evidenceAgainst: ['Cannot verify without upstream_connect_time telemetry']
      },
      {
        id: 'h2',
        name: 'Cloud Load Balancer Health Probe Failure',
        confidencePercent: 46,
        status: 'UNCONFIRMED',
        evidenceFor: ['Edge 502 errors'],
        evidenceAgainst: ['LB health check target group shows 4/4 healthy']
      }
    ],
    primaryHypothesisId: 'h1',
    rootCauseStatus: 'UNCONFIRMED',
    rootCauseConclusion: 'ROOT CAUSE: UNCONFIRMED (Confidence: 54%). Telemetry is insufficient to safely determine whether root cause is keep-alive race or proxy buffer overflow.',
    proposedFix: {
      files: ['k8s/ingress/logging-configmap.yaml'],
      riskLevel: 'LOW',
      securityRating: 'PASSED',
      regressionRisk: 'LOW',
      performanceImpact: 'NEUTRAL',
      aiSelfReviewVerdict: 'COLLECT_MORE_TELEMETRY',
      reviewSummary: 'Recommends deploying enhanced ingress telemetry and correlation headers before applying infrastructure changes.',
      originalCode: `# Standard logging format:
log_format combined '$remote_addr - $remote_user [$time_local] "$request" $status';`,
      proposedCode: `# Enhanced observability logging format:
log_format enhanced '$remote_addr - $request_id [$time_local] "$request" $status '
                    'rt=$request_time uct="$upstream_connect_time" uht="$upstream_header_time" '
                    'urt="$upstream_response_time" us="$upstream_status"';`,
      diffExplanation: 'Adds upstream timing metrics and correlation IDs to isolate root cause.'
    },
    pipelineStages: [
      { id: 'stg_1', name: 'Telemetry Correlation Check', tool: 'Datadog Trace Audit', status: 'DEGRADED', duration: '15s', outputSnippet: 'Observability gap: missing upstream headers' },
      { id: 'stg_2', name: 'Automated Remediation', tool: 'NexusDev AI', status: 'CANCELLED', duration: '0s', blockedReason: 'Cancelled: Root cause unconfirmed (Confidence < 75%)' }
    ],
    testMetrics: {
      total: 184,
      passed: 184,
      failed: 0,
      flaky: 0,
      duration: '15s',
      details: 'Automated remediation paused: Telemetry insufficient to confirm root cause.'
    },
    finalDecisionOutcome: 'ROOT_CAUSE_UNCONFIRMED',
    decisionExplanation: 'AI refused to generate an unverified fix. Recommended action: Enable enhanced telemetry and collect upstream connect metrics.',
    requiredRoleForApproval: 'TechLead',
    isSimulated: true
  },
  {
    id: 'scen-07-flaky-test',
    scenarioNumber: 7,
    category: 'FLAKY_TEST',
    title: 'Flaky Integration Test (Async Port Binding Collision)',
    summary: 'Test suite fails on Attempt 1, then passes on Attempt 2 retry. NexusDev AI flags "FLAKY TEST DETECTED" instead of a false positive green.',
    environment: 'development',
    service: 'notification-service',
    severity: 'P3',
    commitHash: 'c88190d',
    commitMessage: 'test: add multi-tenant email webhook integration tests',
    branch: 'feat/webhook-retries',
    author: 'marcus.brody@nexusdev.ai',
    trigger: 'Pull Request #389',
    observedFacts: [
      'Attempt 1: FAILED with EADDRINUSE: address already in use :::4000.',
      'Attempt 2 (Automated Retry): PASSED (184/184).',
      'Standard CI systems report a green checkmark after retry.',
      'NexusDev AI rejects the false green, classifying the test as FLAKY TEST DETECTED.',
      'Root cause: Integration test helper does not randomize ephemeral mock server port or wait for socket teardown.'
    ],
    telemetrySignals: [
      { metric: 'Attempt 1 Status', value: 'FAILED (EADDRINUSE)', status: 'DEGRADED', relevance: 'CRITICAL', detail: 'Port 4000 collision during teardown.' },
      { metric: 'Attempt 2 Status', value: 'PASSED (0 errors)', status: 'NORMAL', relevance: 'MISLEADING', detail: 'Passing on retry masks race condition in test suite.' },
      { metric: 'Test Reliability Score', value: '64% (FLAKY)', status: 'ANOMALOUS', relevance: 'CRITICAL', detail: 'Intermittent failure without code change.' }
    ],
    hypotheses: [
      {
        id: 'h1',
        name: 'Hardcoded Mock Server Port Collision in Test Suite',
        confidencePercent: 97,
        status: 'SUPPORTED',
        evidenceFor: ['EADDRINUSE 4000 error in log', 'Passes when executed in isolation', 'Fails when parallel test suites run together'],
        evidenceAgainst: []
      }
    ],
    primaryHypothesisId: 'h1',
    rootCauseStatus: 'CONFIRMED',
    rootCauseConclusion: 'Test helper uses hardcoded port 4000 rather than dynamically allocating port 0 from OS ephemeral pool.',
    proposedFix: {
      files: ['tests/helpers/mockServer.ts'],
      riskLevel: 'LOW',
      securityRating: 'PASSED',
      regressionRisk: 'LOW',
      performanceImpact: 'POSITIVE',
      aiSelfReviewVerdict: 'APPROVE',
      reviewSummary: 'Replaces hardcoded port 4000 with dynamic port allocation (port 0) and adds explicit afterAll server.close() socket cleanup.',
      originalCode: `// Flaky test helper with hardcoded port:
export function startMockServer() {
  const app = express();
  return app.listen(4000); // Port collision!
}`,
      proposedCode: `// Reliable test helper with dynamic ephemeral port:
export function startMockServer(): Promise<{ server: http.Server; port: number }> {
  return new Promise((resolve) => {
    const app = express();
    const server = app.listen(0, () => {
      const addr = server.address() as net.AddressInfo;
      resolve({ server, port: addr.port });
    });
  });
}`,
      diffExplanation: 'Allocates an available dynamic port from OS network stack to eliminate parallel test collisions.'
    },
    pipelineStages: [
      { id: 'stg_1', name: 'Unit Tests', tool: 'Vitest', status: 'PASSED', duration: '20s' },
      { id: 'stg_2', name: 'Integration Tests', tool: 'Vitest Integration', status: 'FLAKY', duration: '52s', retryCount: 2, outputSnippet: 'Attempt 1: FAILED -> Attempt 2: PASSED' },
      { id: 'stg_3', name: 'Quality Gate', tool: 'NexusDev Reliability Gate', status: 'FAILED', duration: '5s', outputSnippet: 'Build rejected: 1 flaky test flagged' }
    ],
    testMetrics: {
      total: 184,
      passed: 183,
      failed: 0,
      flaky: 1,
      duration: '1m 17s',
      details: '184 passed on retry, but 1 test classified as FLAKY (EADDRINUSE collision).'
    },
    finalDecisionOutcome: 'FLAKY_TEST_FLAGGED',
    decisionExplanation: 'Build flagged by Reliability Gate. Automatic retry passed, but test quarantined until dynamic port patch is applied.',
    requiredRoleForApproval: 'Developer',
    isSimulated: true
  },
  {
    id: 'scen-08-memory-leak',
    scenarioNumber: 8,
    category: 'MEMORY_LEAK',
    title: 'Memory Leak & Kubernetes OOMKilled CrashLoop',
    summary: 'Container memory climbs monotonically over 3 hours until Kubernetes kernel issues SIGKILL (OOMKilled exit code 137).',
    environment: 'production',
    service: 'event-streamer',
    severity: 'P1',
    commitHash: 'd9914bf',
    commitMessage: 'feat(events): add in-memory audit event replay buffer',
    branch: 'main',
    author: 'alex.vance@nexusdev.ai',
    trigger: 'Prometheus Alert: KubePodOOMKilled',
    observedFacts: [
      'Pod memory usage increases at 4.2 MB/minute without stabilizing.',
      'Every 180 minutes, Pod reaches 1024MB limit and is terminated by kernel OOM killer.',
      'Node heap dump reveals unpruned EventEmitter listener array holding references to WebSocket socket contexts.',
      'Garbage collector is unable to reclaim memory because closures retain references.'
    ],
    telemetrySignals: [
      { metric: 'Pod Restart Count', value: '7 restarts / 24h', status: 'DEGRADED', relevance: 'CRITICAL', detail: 'Pods crashing with exit code 137 (OOMKilled).' },
      { metric: 'Heap Growth Rate', value: '+4.2 MB / min', status: 'DEGRADED', relevance: 'CRITICAL', detail: 'Monotonic linear slope indicating uncollected references.' },
      { metric: 'CPU Utilization', value: '14%', status: 'NORMAL', relevance: 'MISLEADING', detail: 'CPU is low, masking the progressive memory leak.' }
    ],
    hypotheses: [
      {
        id: 'h1',
        name: 'EventEmitter Listener Leak on Disconnected WebSockets',
        confidencePercent: 96,
        status: 'SUPPORTED',
        evidenceFor: ['Heap dump shows 84,000 dangling listener functions', 'Memory scales with number of disconnected clients', 'Missing removeListener in disconnect handler'],
        evidenceAgainst: []
      }
    ],
    primaryHypothesisId: 'h1',
    rootCauseStatus: 'CONFIRMED',
    rootCauseConclusion: 'WebSocket disconnect handler fails to unsubscribe event listener callbacks, causing V8 heap to retain socket objects indefinitely.',
    proposedFix: {
      files: ['src/events/streamer.ts'],
      riskLevel: 'MEDIUM',
      securityRating: 'PASSED',
      regressionRisk: 'LOW',
      performanceImpact: 'POSITIVE',
      aiSelfReviewVerdict: 'APPROVE',
      reviewSummary: 'Adds explicit event listener cleanup in client close handler and bounds in-memory replay buffer to 100 entries max.',
      originalCode: `// Leaky listener registration without cleanup:
ws.on('open', () => {
  emitter.on('audit-event', (event) => ws.send(JSON.stringify(event)));
});`,
      proposedCode: `// Clean listener with lifecycle unsubscribe:
ws.on('open', () => {
  const onEvent = (event: AuditEvent) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(event));
  };
  emitter.on('audit-event', onEvent);
  ws.once('close', () => emitter.removeListener('audit-event', onEvent));
});`,
      diffExplanation: 'Registers a dedicated teardown handler to remove listener when WebSocket disconnects.'
    },
    pipelineStages: [
      { id: 'stg_1', name: 'Unit Tests', tool: 'Vitest', status: 'PASSED', duration: '20s' },
      { id: 'stg_2', name: 'Memory Leak Stress Test', tool: 'Node Clinic / Heap Profiler', status: 'FAILED', duration: '60s', outputSnippet: 'Heap grew from 84MB to 310MB in 60s' },
      { id: 'stg_3', name: 'Production Rollout', tool: 'Kubernetes Rolling', status: 'BLOCKED', duration: '0s', prerequisiteId: 'stg_2', blockedReason: 'Blocked by failed prerequisite: Memory Leak Stress Test' }
    ],
    testMetrics: {
      total: 184,
      passed: 184,
      failed: 0,
      flaky: 0,
      duration: '1m 20s',
      details: 'Tests passed, but Memory Leak Stress Test detected monotonic heap expansion.'
    },
    finalDecisionOutcome: 'BLOCKED_BY_DEPENDENCY',
    decisionExplanation: 'Production rollout blocked due to Memory Leak Stress Test failure. Memory teardown patch ready for review.',
    requiredRoleForApproval: 'TechLead',
    isSimulated: true
  },
  {
    id: 'scen-09-dependency-conflict',
    scenarioNumber: 9,
    category: 'DEPENDENCY_CONFLICT',
    title: 'Dependency Conflict & ESM/CJS Module Crash',
    summary: 'Automated Dependabot bump to jsonwebtoken v9.0.2 introduced an incompatible dual-package ESM import runtime exception.',
    environment: 'staging',
    service: 'auth-service',
    severity: 'P2',
    commitHash: 'e0192ca',
    commitMessage: 'chore(deps): bump jsonwebtoken from 8.5.1 to 9.0.2',
    branch: 'dependabot/npm_and_yarn/jsonwebtoken-9.0.2',
    author: 'dependabot[bot]',
    trigger: 'Automated Dependency Upgrade Pull Request',
    observedFacts: [
      'Build succeeds in TypeScript compiler step.',
      'At runtime in Node.js 20 environment, app crashes with: Named export "verify" not found in module "jsonwebtoken".',
      'The package updated its export map to require default import syntax or namespace import.',
      'Pure dependency version mismatch without application code migration.'
    ],
    telemetrySignals: [
      { metric: 'Build Status', value: 'SUCCESS', status: 'NORMAL', relevance: 'MISLEADING', detail: 'TypeScript compilation passes due to outdated @types/jsonwebtoken.' },
      { metric: 'Container Runtime', value: 'CRASH ON STARTUP', status: 'DEGRADED', relevance: 'CRITICAL', detail: 'SyntaxError / Named export error in Node.js ESM loader.' }
    ],
    hypotheses: [
      {
        id: 'h1',
        name: 'ESM / CommonJS Export Map Incompatibility in Upgraded Package',
        confidencePercent: 98,
        status: 'SUPPORTED',
        evidenceFor: ['Explicit Named export not found runtime error', 'jsonwebtoken 9.0 breaking export change', 'TypeScript types out of sync with runtime exports'],
        evidenceAgainst: []
      }
    ],
    primaryHypothesisId: 'h1',
    rootCauseStatus: 'CONFIRMED',
    rootCauseConclusion: 'Upgraded dependency removed named exports in ESM loader; application requires updated import syntax and synchronized @types definition.',
    proposedFix: {
      files: ['src/auth/jwt.ts', 'package.json'],
      riskLevel: 'LOW',
      securityRating: 'PASSED',
      regressionRisk: 'LOW',
      performanceImpact: 'NEUTRAL',
      aiSelfReviewVerdict: 'APPROVE',
      reviewSummary: 'Updates import syntax to standard default import and pins synchronized @types/jsonwebtoken version.',
      originalCode: `// Incompatible named import with v9.x:
import { verify, sign } from 'jsonwebtoken';`,
      proposedCode: `// Universal CJS/ESM interop import:
import jwt from 'jsonwebtoken';
const { verify, sign } = jwt;`,
      diffExplanation: 'Updates module import syntax to support ESM interop across Node runtime environments.'
    },
    pipelineStages: [
      { id: 'stg_1', name: 'TS Compilation', tool: 'tsc --noEmit', status: 'PASSED', duration: '12s' },
      { id: 'stg_2', name: 'Node.js Runtime Smoke Test', tool: 'Node ESM Loader Test', status: 'FAILED', duration: '18s', outputSnippet: 'SyntaxError: Named export "verify" not found' },
      { id: 'stg_3', name: 'Docker Image Publish', tool: 'Registry Push', status: 'BLOCKED', duration: '0s', prerequisiteId: 'stg_2', blockedReason: 'Blocked by failed prerequisite: Node.js Runtime Smoke Test' }
    ],
    testMetrics: {
      total: 184,
      passed: 182,
      failed: 2,
      flaky: 0,
      duration: '30s',
      details: '2 runtime smoke tests failed due to ESM module export mismatch.'
    },
    finalDecisionOutcome: 'BLOCKED_BY_DEPENDENCY',
    decisionExplanation: 'Docker Image Publish blocked due to runtime smoke test failure.',
    requiredRoleForApproval: 'Developer',
    isSimulated: true
  },
  {
    id: 'scen-10-canary-failure',
    scenarioNumber: 10,
    category: 'CANARY_FAILURE',
    title: 'Canary Deployment 5xx Spike & Automated Rollback',
    summary: 'Canary receives 10% production traffic; 5xx error rate spikes to 14.8%. AI initiates automated rollback checkpoint to restore stable baseline.',
    environment: 'production',
    service: 'checkout-api',
    severity: 'P1',
    commitHash: 'f41982c',
    commitMessage: 'feat(checkout): enable instantaneous currency conversion API',
    branch: 'release/v3.8.0',
    author: 'alex.vance@nexusdev.ai',
    trigger: 'Canary Deployment Trigger (10% Traffic)',
    observedFacts: [
      'Baseline version v3.7.2: 0.02% error rate, 45ms latency (HEALTHY).',
      'Canary version v3.8.0 (10% traffic): 14.8% error rate, upstream rate limit timeout from 3rd party forex provider.',
      'Automated Canary Analysis (ACA) breached the 1% error budget threshold within 90 seconds.',
      'NexusDev AI triggers automated rollback to baseline version v3.7.2 and drains canary traffic to 0%.'
    ],
    telemetrySignals: [
      { metric: 'Baseline Error Rate (90% Traffic)', value: '0.02%', status: 'NORMAL', relevance: 'HIGH', detail: 'Stable version v3.7.2 running without issues.' },
      { metric: 'Canary Error Rate (10% Traffic)', value: '14.8%', status: 'DEGRADED', relevance: 'CRITICAL', detail: 'Foreign exchange upstream API throwing HTTP 429 Too Many Requests.' },
      { metric: 'Canary P95 Latency', value: '1240 ms', status: 'DEGRADED', relevance: 'HIGH', detail: 'Threads blocked waiting on third-party forex rate timeout.' }
    ],
    hypotheses: [
      {
        id: 'h1',
        name: 'Third-party Forex API Rate Limit Exhaustion in Canary',
        confidencePercent: 97,
        status: 'SUPPORTED',
        evidenceFor: ['Canary receives HTTP 429 from forex provider', 'Baseline has currency cache enabled, Canary missed cache key configuration', 'Breached 1% error budget threshold'],
        evidenceAgainst: []
      }
    ],
    primaryHypothesisId: 'h1',
    rootCauseStatus: 'CONFIRMED',
    rootCauseConclusion: 'Canary release attempted unmemoized live calls to third-party forex provider, exceeding tier rate limit of 50 req/sec.',
    proposedFix: {
      files: ['src/services/forexClient.ts', 'k8s/canary-traffic-split.yaml'],
      riskLevel: 'HIGH',
      securityRating: 'PASSED',
      regressionRisk: 'LOW',
      performanceImpact: 'POSITIVE',
      aiSelfReviewVerdict: 'APPROVE',
      reviewSummary: 'Executes automated rollback to stable v3.7.2, and prepares patch introducing fallback cached currency exchange rates.',
      originalCode: `# Live unmemoized forex query:
const rate = await axios.get(\`https://api.forex.io/convert?from=\${from}&to=\${to}\`);`,
      proposedCode: `# Resilient query with Redis caching and fallback:
const cachedRate = await redis.get(\`forex:\${from}:\${to}\`);
if (cachedRate) return Number(cachedRate);
try {
  const rate = await forexClient.fetchWithRateLimit(from, to);
  await redis.set(\`forex:\${from}:\${to}\`, rate, 'EX', 300);
  return rate;
} catch (err) {
  Logger.warn('Forex rate limit exceeded; falling back to ECB daily rate');
  return getFallbackRate(from, to);
}`,
      diffExplanation: 'Introduces 5-minute Redis caching and static fallback rate table to handle third-party 429 responses.'
    },
    pipelineStages: [
      { id: 'stg_1', name: 'Unit & Integration Tests', tool: 'Vitest', status: 'PASSED', duration: '30s' },
      { id: 'stg_2', name: 'Canary 10% Rollout', tool: 'Flagger / Istio', status: 'DEGRADED', duration: '90s', outputSnippet: 'Error rate 14.8% exceeded 1.0% threshold' },
      { id: 'stg_3', name: 'Automated Rollback Checkpoint', tool: 'NexusDev AI Rollback Engine', status: 'PASSED', duration: '12s', outputSnippet: 'Traffic drained to 0%; baseline v3.7.2 restored' }
    ],
    testMetrics: {
      total: 184,
      passed: 184,
      failed: 0,
      flaky: 0,
      duration: '2m 12s',
      details: 'Tests passed, but live Canary 10% traffic failed SLO. Automated rollback executed.'
    },
    finalDecisionOutcome: 'ROLLBACK_TRIGGERED',
    decisionExplanation: 'Canary 10% traffic breached error budget. AI Rollback Engine drained canary pods and restored baseline v3.7.2.',
    requiredRoleForApproval: 'DevOps',
    isSimulated: true
  }
];

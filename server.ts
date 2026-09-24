import express from 'express';
import path from 'path';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { createServer as createViteServer } from 'vite';

import {
  initialRepositoryFiles,
  initialBranches,
  initialCommits,
  initialIssues,
  initialPullRequests,
  initialPipelines,
  initialDeployments,
  initialKubernetesResources,
  initialTelemetryPoints,
  initialIncidents,
  initialAuditRecords,
  availableTools,
  defaultPolicy,
  currentUser
} from './src/data/mockWorkspace';

import { initialManagedUsers, initialLoginAuditRecords } from './src/data/initialAuthData';

const app = express();
app.use(express.json());

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const scrypt = promisify(scryptCallback);
const SESSION_TTL_MS = 30 * 86400000;
const PERMANENT_ADMIN_EMAIL = 'admin@nexusdev.ai';

const VALID_ROLES = new Set([
  'Admin',
  'TechLead',
  'DevOps',
  'Developer',
  'Viewer'
]);

// Mutable in-memory workspace store
let workspace = {
  files: [...initialRepositoryFiles],
  branches: [...initialBranches],
  commits: [...initialCommits],
  issues: [...initialIssues],
  pullRequests: [...initialPullRequests],
  pipelines: [...initialPipelines],
  deployments: [...initialDeployments],
  kubernetesResources: [...initialKubernetesResources],
  telemetry: [...initialTelemetryPoints],
  incidents: [...initialIncidents],
  auditRecords: [...initialAuditRecords],
  policy: { ...defaultPolicy },
  user: { ...currentUser }
};

// Server-side Authentication & Managed User Data Stores
let managedUsers = [...initialManagedUsers];
let loginAuditRecords = [...initialLoginAuditRecords];

const passwordHashes = new Map<string, string>();

export interface ServerSessionUser {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'TechLead' | 'DevOps' | 'Developer' | 'Viewer';
  avatar?: string;
}

// Server-side In-Memory Session Registry
const activeSessions: Map<
  string,
  {
    user: ServerSessionUser;
    createdAt: string;
    expiresAt: string;
  }
> = new Map();

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derived = (await scrypt(password, salt, 64)) as Buffer;

  return `${salt}:${derived.toString('hex')}`;
}

async function verifyPassword(
  password: string,
  stored?: string
): Promise<boolean> {
  if (!stored) return false;

  const [salt, expected] = stored.split(':');

  if (!salt || !expected) return false;

  const derived = (await scrypt(password, salt, 64)) as Buffer;

  return timingSafeEqual(
    derived,
    Buffer.from(expected, 'hex')
  );
}

async function initializeAdmin(): Promise<void> {
  const initialPassword = process.env.ADMIN_INITIAL_PASSWORD;

  if (initialPassword && initialPassword.length >= 12) {
    passwordHashes.set(
      PERMANENT_ADMIN_EMAIL,
      await hashPassword(initialPassword)
    );
  } else {
    console.warn(
      'Admin sign-in is disabled until ADMIN_INITIAL_PASSWORD (12+ characters) is configured.'
    );
  }
}

// Helper to resolve session from token
function resolveSessionUser(
  token?: string
): ServerSessionUser | null {
  if (!token) return null;

  const cleanToken = token
    .replace('Bearer ', '')
    .trim();

  if (!cleanToken) return null;

  const sessionEntry = activeSessions.get(cleanToken);

  if (
    !sessionEntry ||
    new Date(sessionEntry.expiresAt) <= new Date()
  ) {
    activeSessions.delete(cleanToken);
    return null;
  }

  return sessionEntry.user;
}

// Extract authenticated session from request
function getRequestUser(
  req: express.Request
): ServerSessionUser | null {
  const authHeader = req.headers.authorization;
  const customHeader = req.headers['x-auth-token'] as string;
  const sessionHeader = req.headers['x-session-token'] as string;
  const queryToken = req.query.token as string;
  const bodyToken = req.body?.token as string;

  const rawToken =
    authHeader ||
    customHeader ||
    sessionHeader ||
    queryToken ||
    bodyToken;

  return resolveSessionUser(rawToken);
}

// ----------------------------------------------------
// RBAC PERMISSION MATRIX
// ----------------------------------------------------

const SERVER_ROLE_PERMISSIONS: Record<string, string[]> = {
  Admin: [
    'ADMIN_ACCESS',
    'VIEW_USER_LOGIN_AUDIT',
    'MANAGE_USERS',
    'MANAGE_RBAC',
    'MANAGE_SECURITY_POLICY',
    'APPROVE_PRODUCTION',
    'DEPLOY_PRODUCTION',
    'ROLLBACK_PRODUCTION',
    'RESTART_PODS',
    'APPROVE_PR',
    'MODIFY_CODE',
    'MODIFY_ISSUES',
    'DEPLOY_STAGING',
    'TRIGGER_PIPELINES',
    'INVESTIGATE_INCIDENTS',
    'REMEDIATE_INCIDENTS',
    'VIEW_AUDIT_GENERAL',
    'EXPORT_USER_AUDIT',
    'EXPORT_AUDIT_GENERAL',
    'VIEW_DASHBOARD',
    'VIEW_OBSERVABILITY'
  ],

  TechLead: [
    'APPROVE_PR',
    'MODIFY_CODE',
    'MODIFY_ISSUES',
    'DEPLOY_STAGING',
    'TRIGGER_PIPELINES',
    'INVESTIGATE_INCIDENTS',
    'REMEDIATE_INCIDENTS',
    'VIEW_AUDIT_GENERAL',
    'EXPORT_AUDIT_GENERAL',
    'VIEW_DASHBOARD',
    'VIEW_OBSERVABILITY'
  ],

  DevOps: [
    'DEPLOY_PRODUCTION',
    'ROLLBACK_PRODUCTION',
    'RESTART_PODS',
    'DEPLOY_STAGING',
    'TRIGGER_PIPELINES',
    'INVESTIGATE_INCIDENTS',
    'REMEDIATE_INCIDENTS',
    'VIEW_AUDIT_GENERAL',
    'EXPORT_AUDIT_GENERAL',
    'VIEW_DASHBOARD',
    'VIEW_OBSERVABILITY'
  ],

  Developer: [
    'MODIFY_CODE',
    'MODIFY_ISSUES',
    'DEPLOY_STAGING',
    'TRIGGER_PIPELINES',
    'VIEW_AUDIT_GENERAL',
    'EXPORT_AUDIT_GENERAL',
    'VIEW_DASHBOARD',
    'VIEW_OBSERVABILITY'
  ],

  Viewer: [
    'VIEW_AUDIT_GENERAL',
    'VIEW_DASHBOARD',
    'VIEW_OBSERVABILITY'
  ]
};

function checkPermission(
  role: string,
  permission: string
): boolean {
  if (!role) return false;

  const normalizedRole =
    role.charAt(0).toUpperCase() +
    role.slice(1).toLowerCase();

  const validRole =
    normalizedRole === 'Techlead'
      ? 'TechLead'
      : normalizedRole === 'Devops'
        ? 'DevOps'
        : normalizedRole;

  const permissions =
    SERVER_ROLE_PERMISSIONS[validRole] || [];

  return permissions.includes(permission);
}

// ----------------------------------------------------
// AUTHORIZATION MIDDLEWARES
// ----------------------------------------------------

function requireAuth(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const user = getRequestUser(req);

  if (!user) {
    return res.status(401).json({
      success: false,
      error:
        'Unauthorized: Valid authentication session token is required',
      statusCode: 401
    });
  }

  (req as any).user = user;
  next();
}

function requireRole(...allowedRoles: string[]) {
  return (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const user = getRequestUser(req);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Authentication required',
        statusCode: 401
      });
    }

    const normalizedUserRole = user.role.toLowerCase();

    const isAllowed = allowedRoles.some(
      role => role.toLowerCase() === normalizedUserRole
    );

    if (!isAllowed) {
      const violationId =
        `aud_sec_viol_${Date.now()}`;

      workspace.auditRecords.unshift({
        id: violationId,
        timestamp: 'Just now',
        actorType: 'HUMAN',
        actorName: user.name || user.email,
        action:
          'UNAUTHORIZED_ACCESS_ATTEMPT_BLOCKED',
        category: 'SECURITY',
        permissionUsed: 'EXECUTE',
        riskLevel: 'HIGH',
        details:
          `Access Denied: User '${user.email}' (Role: ${user.role}) attempted unauthorized operation at '${req.originalUrl}'. Required role: ${allowedRoles.join(' or ')}.`,
        status: 'REJECTED',
        targetResource: req.originalUrl
      });

      return res.status(403).json({
        success: false,
        error:
          `Forbidden: Access Denied. Role '${user.role}' lacks required permissions for this administrative resource.`,
        requiredRoles: allowedRoles,
        userRole: user.role,
        statusCode: 403
      });
    }

    (req as any).user = user;
    next();
  };
}

function requirePermission(permission: string) {
  return (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const user = getRequestUser(req);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Authentication required',
        statusCode: 401
      });
    }

    if (!checkPermission(user.role, permission)) {
      workspace.auditRecords.unshift({
        id: `aud_sec_perm_${Date.now()}`,
        timestamp: 'Just now',
        actorType: 'HUMAN',
        actorName: user.name || user.email,
        action:
          'UNAUTHORIZED_PERMISSION_BLOCKED',
        category: 'SECURITY',
        permissionUsed: 'EXECUTE',
        riskLevel: 'HIGH',
        details:
          `Access Denied: Role '${user.role}' lacks required permission '${permission}' for route '${req.originalUrl}'.`,
        status: 'REJECTED',
        targetResource: req.originalUrl
      });

      return res.status(403).json({
        success: false,
        error:
          `Forbidden: Access Denied. Role '${user.role}' lacks required permission '${permission}'.`,
        requiredPermission: permission,
        userRole: user.role,
        statusCode: 403
      });
    }

    (req as any).user = user;
    next();
  };
}

// ----------------------------------------------------
// AUDIT HELPERS
// ----------------------------------------------------

function auditAdminAction(
  adminUser: ServerSessionUser,
  action: string,
  details: string,
  target?: string
) {
  workspace.auditRecords.unshift({
    id:
      `aud_admin_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 6)}`,
    timestamp: 'Just now',
    actorType: 'HUMAN',
    actorName:
      adminUser.name || 'System Administrator',
    action,
    category: 'SECURITY',
    permissionUsed: 'EXECUTE',
    riskLevel: 'HIGH',
    details,
    status: 'EXECUTED',
    targetResource:
      target || 'PLATFORM_GOVERNANCE'
  });
}

// ----------------------------------------------------
// REST API ENDPOINTS
// ----------------------------------------------------

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    platform:
      'NexusDev AI Autonomous DevOps Engine'
  });
});

// ----------------------------------------------------
// AUTHENTICATION ENDPOINTS
// ----------------------------------------------------

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  const trimmedEmail =
    (email || '').trim().toLowerCase();

  const trimmedPass =
    (password || '').trim();

  if (!trimmedEmail || !trimmedPass) {
    return res.status(400).json({
      success: false,
      error: 'Email and password are required'
    });
  }

  const existing = managedUsers.find(
    user =>
      user.email.toLowerCase() ===
      trimmedEmail
  );

  if (
    !existing ||
    existing.status === 'DISABLED' ||
    !(await verifyPassword(
      trimmedPass,
      passwordHashes.get(trimmedEmail)
    ))
  ) {
    loginAuditRecords.unshift({
      id: `log_auth_${Date.now()}`,
      timestamp: new Date()
        .toISOString()
        .replace('T', ' ')
        .substring(0, 16),
      userId: 'usr_unauthenticated',
      userName: 'Unidentified User',
      email: trimmedEmail,
      role: 'Viewer',
      event: 'LOGIN_FAILED',
      status: 'FAILED',
      sourceIp:
        req.ip || '192.168.1.104',
      sessionId:
        `req_fail_${Date.now()}`,
      requestId:
        `req_auth_${Date.now()}`,
      failureReason:
        'Invalid credential check',
      environment: 'NEBULA_PROD'
    });

    return res.status(401).json({
      success: false,
      error: 'Invalid email or password'
    });
  }

  const user: ServerSessionUser = {
    id: existing.id,
    name: existing.name,
    email: trimmedEmail,
    role: existing.role,
    avatar:
      existing?.avatar ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120'
  };

  const token =
    randomBytes(32).toString('base64url');

  const session = {
    token,
    createdAt:
      new Date().toISOString(),
    expiresAt:
      new Date(
        Date.now() + SESSION_TTL_MS
      ).toISOString()
  };

  activeSessions.set(token, {
    user,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt
  });

  loginAuditRecords.unshift({
    id: `log_auth_${Date.now()}`,
    timestamp: new Date()
      .toISOString()
      .replace('T', ' ')
      .substring(0, 16),
    userId: user.id,
    userName: user.name,
    email: user.email,
    role: user.role,
    event: 'USER_LOGIN',
    status: 'SUCCESS',
    sourceIp:
      req.ip || '192.168.1.104',
    sessionId: token,
    requestId:
      `req_auth_${Date.now()}`,
    environment: 'NEBULA_PROD'
  });

  res.json({
    success: true,
    user,
    session
  });
});

app.post('/api/auth/register', async (req, res) => {
  const {
    name,
    email,
    password
  } = req.body || {};

  const normalizedEmail =
    String(email || '')
      .trim()
      .toLowerCase();

  const normalizedName =
    String(name || '').trim();

  if (
    !normalizedName ||
    !/^\S+@\S+\.\S+$/.test(
      normalizedEmail
    ) ||
    typeof password !== 'string' ||
    password.length < 12
  ) {
    return res.status(400).json({
      success: false,
      error:
        'Name, valid email, and a 12-character password are required.'
    });
  }

  if (
    normalizedEmail ===
      PERMANENT_ADMIN_EMAIL ||
    managedUsers.some(
      user =>
        user.email.toLowerCase() ===
        normalizedEmail
    )
  ) {
    return res.status(409).json({
      success: false,
      error:
        'An account with this email already exists.'
    });
  }

  const user: ServerSessionUser = {
    id:
      `usr_${randomBytes(8).toString('hex')}`,
    name: normalizedName,
    email: normalizedEmail,
    role: 'Developer'
  };

  managedUsers.unshift({
    ...user,
    status: 'ACTIVE',
    createdAt:
      new Date().toISOString(),
    lastLoginAt:
      new Date().toISOString()
  });

  passwordHashes.set(
    normalizedEmail,
    await hashPassword(password)
  );

  res.status(201).json({
    success: true,
    user
  });
});

app.post('/api/auth/logout', (req, res) => {
  const user = getRequestUser(req);

  if (user) {
    const rawToken =
      req.headers.authorization
        ?.replace('Bearer ', '')
        .trim();

    if (rawToken) {
      activeSessions.delete(rawToken);
    }

    loginAuditRecords.unshift({
      id: `log_auth_${Date.now()}`,
      timestamp: new Date()
        .toISOString()
        .replace('T', ' ')
        .substring(0, 16),
      userId: user.id,
      userName: user.name,
      email: user.email,
      role: user.role,
      event: 'USER_LOGOUT',
      status: 'SUCCESS',
      sourceIp:
        req.ip || '192.168.1.104',
      sessionId:
        `nxt_jwt_logout_${Date.now()}`,
      requestId:
        `req_auth_${Date.now()}`,
      environment: 'NEBULA_PROD'
    });
  }

  res.json({
    success: true,
    message: 'Logged out'
  });
});

// Current authenticated session
app.get('/api/auth/session', (req, res) => {
  const user = getRequestUser(req);

  if (!user) {
    return res.status(401).json({
      success: false,
      error:
        'No active authenticated session'
    });
  }

  res.json({
    success: true,
    user
  });
});

// ----------------------------------------------------
// ADMINISTRATIVE & GOVERNANCE ENDPOINTS
// ----------------------------------------------------

// Administrative User Login / Activity Audit
const handleAdminAuditGet = (
  req: express.Request,
  res: express.Response
) => {
  const adminUser =
    (req as any).user as ServerSessionUser;

  auditAdminAction(
    adminUser,
    'ADMIN_ACCESSED_USER_LOGIN_AUDIT',
    `Administrator '${adminUser.name}' accessed sensitive user login activity audit logs.`
  );

  res.json({
    success: true,
    recordsCount:
      loginAuditRecords.length,
    records: loginAuditRecords,
    auditedAt:
      new Date().toISOString()
  });
};

app.get(
  '/api/admin/audit',
  requireRole('Admin'),
  handleAdminAuditGet
);

app.get(
  '/admin/audit',
  requireRole('Admin'),
  handleAdminAuditGet
);

app.get(
  '/api/admin/login-audit',
  requireRole('Admin'),
  handleAdminAuditGet
);

app.get(
  '/admin/login-audit',
  requireRole('Admin'),
  handleAdminAuditGet
);

// Administrative User Management
const handleAdminUsersGet = (
  req: express.Request,
  res: express.Response
) => {
  res.json({
    success: true,
    usersCount: managedUsers.length,
    users: managedUsers
  });
};

app.get(
  '/api/admin/users',
  requireRole('Admin'),
  handleAdminUsersGet
);

app.get(
  '/admin/users',
  requireRole('Admin'),
  handleAdminUsersGet
);

// Administrative User Role Modification
const handleAdminRoleUpdate = (
  req: express.Request,
  res: express.Response
) => {
  const adminUser =
    (req as any).user as ServerSessionUser;

  const {
    targetUserId,
    newRole
  } = req.body;

  if (!targetUserId || !newRole) {
    return res.status(400).json({
      success: false,
      error:
        'targetUserId and newRole are required'
    });
  }

  if (!VALID_ROLES.has(newRole)) {
    return res.status(400).json({
      success: false,
      error:
        'Invalid role. Allowed roles: Admin, TechLead, DevOps, Developer, Viewer.'
    });
  }

  const target =
    managedUsers.find(
      user => user.id === targetUserId
    );

  if (target) {
    if (
      target.email.toLowerCase() ===
        PERMANENT_ADMIN_EMAIL ||
      target.id === 'usr_admin_01'
    ) {
      return res.status(403).json({
        success: false,
        error:
          'Permanent Administrator account (admin@nexusdev.ai) cannot be demoted, modified, or reassigned.'
      });
    }

    const oldRole = target.role;

    target.role = newRole as ServerSessionUser['role'];

    auditAdminAction(
      adminUser,
      'ADMIN_MODIFIED_USER_ROLE',
      `Administrator '${adminUser.name}' updated role for user '${target.email}' from '${oldRole}' to '${newRole}'.`,
      target.email
    );

    return res.json({
      success: true,
      message:
        `User role updated to ${newRole}`,
      user: target
    });
  }

  res.status(404).json({
    success: false,
    error: 'Target user not found'
  });
};

app.post(
  '/api/admin/roles',
  requireRole('Admin'),
  handleAdminRoleUpdate
);

app.post(
  '/admin/roles',
  requireRole('Admin'),
  handleAdminRoleUpdate
);

// Administrative Toggle User Status
app.post(
  [
    '/api/admin/users/toggle-status',
    '/admin/users/toggle-status'
  ],
  requireRole('Admin'),
  (req, res) => {
    const adminUser =
      (req as any).user as ServerSessionUser;

    const { targetUserId } =
      req.body;

    const target =
      managedUsers.find(
        user => user.id === targetUserId
      );

    if (!target) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (
      target.email.toLowerCase() ===
        PERMANENT_ADMIN_EMAIL ||
      target.id === 'usr_admin_01'
    ) {
      return res.status(403).json({
        success: false,
        error:
          'Permanent Administrator account (admin@nexusdev.ai) cannot be disabled.'
      });
    }

    target.status =
      target.status === 'ACTIVE'
        ? 'DISABLED'
        : 'ACTIVE';

    auditAdminAction(
      adminUser,
      'ADMIN_TOGGLED_USER_STATUS',
      `Administrator '${adminUser.name}' changed status for '${target.email}' to '${target.status}'.`,
      target.email
    );

    res.json({
      success: true,
      newStatus: target.status,
      user: target
    });
  }
);

// Administrative Governance Overview
const handleAdminGovernanceGet = (
  req: express.Request,
  res: express.Response
) => {
  const adminUser =
    (req as any).user as ServerSessionUser;

  auditAdminAction(
    adminUser,
    'ADMIN_ACCESSED_GOVERNANCE_MODULE',
    `Administrator '${adminUser.name}' accessed platform governance & security control center.`
  );

  res.json({
    success: true,
    platform:
      'NexusDev AI Zero-Trust Governance Engine',

    permanentAdmin: {
      name: 'Abdul Rehman Yasir',
      email: 'admin@nexusdev.ai',
      role: 'ADMIN',
      status: 'PERMANENT'
    },

    policy: workspace.policy,

    totalManagedUsers:
      managedUsers.length,

    users: managedUsers,

    zeroTrustEnforced: true,

    governanceTimestamp:
      new Date().toISOString()
  });
};

app.get(
  '/api/admin/governance',
  requireRole('Admin'),
  handleAdminGovernanceGet
);

app.get(
  '/admin/governance',
  requireRole('Admin'),
  handleAdminGovernanceGet
);

// Administrative Security Governance Policy
const handleAdminSecurityGet = (
  req: express.Request,
  res: express.Response
) => {
  res.json({
    success: true,
    policy: workspace.policy,
    enforcementMode:
      'STRICT_ZERO_TRUST',
    mfaEnforced: true,
    sessionTtlSeconds: 2592000
  });
};

const handleAdminSecurityPolicyPost = (
  req: express.Request,
  res: express.Response
) => {
  const adminUser =
    (req as any).user as ServerSessionUser;

  workspace.policy = {
    ...workspace.policy,
    ...req.body
  };

  auditAdminAction(
    adminUser,
    'ADMIN_UPDATED_SECURITY_POLICY',
    `Administrator '${adminUser.name}' modified system security & autonomy policy gates.`
  );

  res.json({
    success: true,
    policy: workspace.policy
  });
};

app.get(
  '/api/admin/security',
  requireRole('Admin'),
  handleAdminSecurityGet
);

app.get(
  '/admin/security',
  requireRole('Admin'),
  handleAdminSecurityGet
);

app.post(
  '/api/admin/security-policy',
  requireRole('Admin'),
  handleAdminSecurityPolicyPost
);

app.post(
  '/admin/security-policy',
  requireRole('Admin'),
  handleAdminSecurityPolicyPost
);

// Administrative Production Deployment Authorization
const handleAdminProductionApprove = (
  req: express.Request,
  res: express.Response
) => {
  const adminUser =
    (req as any).user as ServerSessionUser;

  const {
    deploymentId,
    version,
    releaseNotes
  } = req.body;

  auditAdminAction(
    adminUser,
    'ADMIN_PRODUCTION_DEPLOYMENT_AUTHORIZED',
    `Administrator '${adminUser.name}' authorized production release '${version || 'latest'}' (ID: ${deploymentId || 'dep_prod'}). Release notes: ${releaseNotes || 'None'}.`,
    'PRODUCTION_ENVIRONMENT'
  );

  res.json({
    success: true,
    authorized: true,
    authorizedBy: adminUser.email,
    timestamp:
      new Date().toISOString()
  });
};

app.post(
  '/api/admin/production-approve',
  requireRole('Admin'),
  handleAdminProductionApprove
);

app.post(
  '/admin/production-approve',
  requireRole('Admin'),
  handleAdminProductionApprove
);

// Administrative Export of Login & User Activity
const handleAdminExport = (
  req: express.Request,
  res: express.Response
) => {
  const adminUser =
    (req as any).user as ServerSessionUser;

  const format =
    req.body?.format || 'JSON';

  auditAdminAction(
    adminUser,
    'ADMIN_EXPORTED_USER_LOGIN_AUDIT',
    `Administrator '${adminUser.name}' exported ${loginAuditRecords.length} user login audit records in format: ${format}.`
  );

  res.json({
    success: true,
    format,
    recordCount:
      loginAuditRecords.length,
    records: loginAuditRecords,
    exportedAt:
      new Date().toISOString()
  });
};

app.post(
  '/api/admin/export',
  requireRole('Admin'),
  handleAdminExport
);

app.post(
  '/admin/export',
  requireRole('Admin'),
  handleAdminExport
);

// ----------------------------------------------------
// GENERAL SYSTEM AUDIT LEDGER
// ----------------------------------------------------

app.get('/api/audit', (req, res) => {
  const user = getRequestUser(req);

  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  res.json({
    success: true,
    records: workspace.auditRecords
  });
});

app.get('/api/workspace', (req, res) => {
  res.json(workspace);
});

// Update Policy
app.post(
  '/api/policy',
  requireRole('Admin'),
  (req, res) => {
    workspace.policy = {
      ...workspace.policy,
      ...req.body
    };

    res.json(workspace.policy);
  }
);

// ----------------------------------------------------
// OPERATIONS & ENGINEERING ENDPOINTS
// ----------------------------------------------------

// Deployments Trigger Endpoint
app.post(
  '/api/deployments/deploy',
  (req, res) => {
    const user = getRequestUser(req);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const {
      environment,
      version
    } = req.body;

    const targetEnv =
      (environment || 'staging')
        .toLowerCase();

    // Production deployment
    if (targetEnv === 'production') {
      if (
        !checkPermission(
          user.role,
          'DEPLOY_PRODUCTION'
        )
      ) {
        workspace.auditRecords.unshift({
          id:
            `aud_sec_dep_${Date.now()}`,
          timestamp: 'Just now',
          actorType: 'HUMAN',
          actorName:
            user.name || user.email,
          action:
            'UNAUTHORIZED_PRODUCTION_DEPLOY_BLOCKED',
          category: 'SECURITY',
          permissionUsed: 'DEPLOY',
          riskLevel: 'CRITICAL',
          details:
            `Access Denied: Role '${user.role}' attempted unauthorized deployment to PRODUCTION environment.`,
          status: 'REJECTED',
          targetResource:
            'PRODUCTION_DEPLOYMENT'
        });

        return res.status(403).json({
          success: false,
          error:
            `Forbidden: Role '${user.role}' is not authorized to deploy to production. Requires Admin or DevOps role.`,
          statusCode: 403
        });
      }
    } else {
      if (
        !checkPermission(
          user.role,
          'DEPLOY_STAGING'
        )
      ) {
        return res.status(403).json({
          success: false,
          error:
            `Forbidden: Role '${user.role}' has read-only access and cannot trigger deployments.`,
          statusCode: 403
        });
      }
    }

    const newDeployment = {
      id: `dep_${Date.now()}`,
      environment: targetEnv,
      version: version || 'v2.4.3',
      commitHash: 'e92bc10',
      commitMessage:
        'feat(core): release updates verified by RBAC pipeline',
      deployedBy:
        user.name || user.email,
      deployedAt: 'Just now',
      status: 'HEALTHY' as const,
      trafficPercent: 100,
      replicas:
        targetEnv === 'production'
          ? 4
          : 2,
      healthyReplicas:
        targetEnv === 'production'
          ? 4
          : 2,
      rollbackAvailable: true,
      rollbackVersion: 'v2.4.2'
    };

    workspace.deployments = [
      newDeployment,
      ...workspace.deployments
    ];

    workspace.auditRecords.unshift({
      id: `aud_dep_${Date.now()}`,
      timestamp: 'Just now',
      actorType: 'HUMAN',
      actorName:
        user.name || user.email,
      action:
        `DEPLOY_${targetEnv.toUpperCase()}`,
      category: 'DEPLOYMENT',
      permissionUsed: 'DEPLOY',
      riskLevel:
        targetEnv === 'production'
          ? 'HIGH'
          : 'MEDIUM',
      details:
        `Triggered deployment of version ${newDeployment.version} to ${targetEnv} by ${user.name} (${user.role}).`,
      status: 'EXECUTED',
      targetResource: targetEnv
    });

    res.json({
      success: true,
      deployment: newDeployment
    });
  }
);

// Production Rollback Endpoint
app.post(
  '/api/deployments/rollback',
  (req, res) => {
    const user = getRequestUser(req);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (
      !checkPermission(
        user.role,
        'ROLLBACK_PRODUCTION'
      )
    ) {
      return res.status(403).json({
        success: false,
        error:
          `Forbidden: Role '${user.role}' lacks permission to execute production rollbacks (Requires Admin or DevOps).`,
        statusCode: 403
      });
    }

    workspace.auditRecords.unshift({
      id: `aud_roll_${Date.now()}`,
      timestamp: 'Just now',
      actorType: 'HUMAN',
      actorName:
        user.name || user.email,
      action:
        'ROLLBACK_PRODUCTION',
      category: 'DEPLOYMENT',
      permissionUsed: 'DEPLOY',
      riskLevel: 'CRITICAL',
      details:
        `Executed production rollback to checkpoint v2.4.1 by ${user.name} (${user.role}).`,
      status: 'EXECUTED',
      targetResource:
        'PRODUCTION_CLUSTER'
    });

    res.json({
      success: true,
      message:
        'Rollback initiated successfully'
    });
  }
);

// PR Merge / Approval Endpoint
app.post(
  [
    '/api/pull-requests/merge',
    '/api/pull-requests/approve'
  ],
  (req, res) => {
    const user = getRequestUser(req);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (
      !checkPermission(
        user.role,
        'APPROVE_PR'
      )
    ) {
      return res.status(403).json({
        success: false,
        error:
          `Forbidden: Role '${user.role}' is not authorized to approve or merge pull requests (Requires TechLead or Admin).`,
        statusCode: 403
      });
    }

    const { prId } = req.body;

    const pr =
      workspace.pullRequests.find(
        p => p.id === prId
      ) ||
      workspace.pullRequests[0];

    if (pr) {
      pr.status = 'MERGED';
    }

    workspace.auditRecords.unshift({
      id:
        `aud_pr_merge_${Date.now()}`,
      timestamp: 'Just now',
      actorType: 'HUMAN',
      actorName:
        user.name || user.email,
      action:
        'MERGE_PULL_REQUEST',
      category: 'CODE',
      permissionUsed: 'WRITE',
      riskLevel: 'MEDIUM',
      details:
        `Approved and merged PR #${pr?.number || '89'} into branch 'main' by ${user.name} (${user.role}).`,
      status: 'EXECUTED',
      targetResource:
        `PR #${pr?.number || '89'}`
    });

    res.json({
      success: true,
      pr
    });
  }
);

// ----------------------------------------------------
// CODEBASE SEARCH & FILE READER
// ----------------------------------------------------

app.post(
  '/api/tools/repository-search',
  (req, res) => {
    const { query } = req.body;

    const normalizedQuery =
      String(query || '').toLowerCase();

    const matches =
      workspace.files.filter(
        file =>
          file.name
            .toLowerCase()
            .includes(normalizedQuery) ||
          (
            file.content &&
            file.content
              .toLowerCase()
              .includes(normalizedQuery)
          )
      );

    res.json({
      count: matches.length,
      files: matches.map(match => ({
        path: match.path,
        name: match.name,
        size: match.size
      }))
    });
  }
);

// ----------------------------------------------------
// EXECUTE TOOL ENDPOINT
// ----------------------------------------------------

app.post(
  '/api/tools/execute',
  requireAuth,
  async (req, res) => {
    const user = getRequestUser(req);

    const {
      toolName,
      input: suppliedInput,
      params
    } = req.body;

    const input =
      suppliedInput || params || {};

    const tool =
      availableTools.find(
        item => item.name === toolName
      );

    if (!tool) {
      return res.status(404).json({
        error:
          `Tool ${toolName} not found`
      });
    }

    // Authorization check
    if (user) {
      if (user.role === 'Viewer') {
        if (
          [
            'repository.write',
            'kubernetes.restart',
            'deployment.deploy',
            'docker.build'
          ].includes(toolName)
        ) {
          return res.status(403).json({
            success: false,
            error:
              `Forbidden: Role 'Viewer' is read-only and not authorized to execute mutating tool '${toolName}'.`,
            statusCode: 403
          });
        }
      } else if (
        user.role === 'Developer'
      ) {
        if (
          toolName ===
          'kubernetes.restart'
        ) {
          return res.status(403).json({
            success: false,
            error:
              `Forbidden: Role 'Developer' cannot restart cluster pods. Requires DevOps or Admin.`,
            statusCode: 403
          });
        }

        if (
          toolName ===
            'deployment.deploy' &&
          input?.environment ===
            'production'
        ) {
          return res.status(403).json({
            success: false,
            error:
              `Forbidden: Role 'Developer' cannot deploy to production. Requires DevOps or Admin.`,
            statusCode: 403
          });
        }
      } else if (
        user.role === 'TechLead'
      ) {
        if (
          toolName ===
            'deployment.deploy' &&
          input?.environment ===
            'production'
        ) {
          return res.status(403).json({
            success: false,
            error:
              `Forbidden: Role 'TechLead' cannot directly deploy to production without DevOps release authorization.`,
            statusCode: 403
          });
        }
      }
    }

    // Record Audit
    const auditId =
      `aud_${Date.now()}`;

    const auditEntry = {
      id: auditId,
      timestamp: 'Just now',
      actorType:
        (user
          ? 'HUMAN'
          : 'AI_AGENT') as any,
      actorName:
        user?.name ||
        'NexusDev AI Agent',
      action:
        `EXECUTE_${toolName
          .toUpperCase()
          .replace('.', '_')}`,
      category:
        (
          tool.category ===
            'repository' ||
          tool.category === 'git'
            ? 'CODE'
            : tool.category ===
                'deployment'
              ? 'DEPLOYMENT'
              : 'INFRASTRUCTURE'
        ) as any,
      permissionUsed:
        tool.permission,
      riskLevel:
        tool.riskLevel,
      details:
        `Executed ${toolName} with parameters: ${JSON.stringify(input)}`,
      status: 'EXECUTED' as const,
      targetResource:
        input.filePath ||
        input.resourceName ||
        tool.category
    };

    workspace.auditRecords = [
      auditEntry,
      ...workspace.auditRecords
    ];

    let output: any = {
      success: true
    };

    switch (toolName) {
      case 'repository.read': {
        const file =
          workspace.files.find(
            f =>
              f.path === input.filePath
          );

        output = file
          ? {
              found: true,
              path: file.path,
              content: file.content,
              language: file.language
            }
          : {
              found: false,
              error: 'File not found'
            };

        break;
      }

      case 'repository.write': {
        const existing =
          workspace.files.find(
            f =>
              f.path ===
              input.filePath
          );

        if (existing) {
          existing.content =
            input.content;
          existing.lastModified =
            'Just now';
        } else {
          workspace.files.push({
            path: input.filePath,
            name:
              input.filePath
                .split('/')
                .pop() || 'file',
            isDirectory: false,
            content: input.content,
            language:
              input.language ||
              'typescript',
            size:
              `${(
                input.content.length /
                1024
              ).toFixed(1)} KB`,
            lastModified:
              'Just now'
          });
        }

        output = {
          written: true,
          path: input.filePath,
          sizeBytes:
            input.content.length
        };

        break;
      }

      case 'git.diff': {
        output = {
          changedFiles: [
            'src/auth/session.ts'
          ],
          insertions: 14,
          deletions: 5,
          diff: `@@ -31,9 +31,16 @@
-    if (payload.tokenVersion !== userRecord.tokenVersion) {
-      Logger.warn(\`Token version mismatch\`);
+    const incomingVersion = payload.tokenVersion ?? 0;
+    if (incomingVersion !== userRecord.tokenVersion) {
+      Logger.warn(\`Token version mismatch for user \${payload.sub}\`);
+      return { valid: false, reason: 'Session expired or refreshed' };
+    }`
        };

        break;
      }

      case 'test.run': {
        output = {
          suite:
            'Authentication & Session Test Suite',
          totalTests: 3,
          passed: 3,
          failed: 0,
          coverage: {
            statements: 100,
            branches: 95,
            functions: 100,
            lines: 100
          },
          durationMs: 1420,
          logs: [
            ' PASS  tests/auth.test.ts',
            '  ✓ should reject requests without Bearer prefix (12ms)',
            '  ✓ should validate active sessions with correct claims (45ms)',
            '  ✓ should gracefully handle token version deserialization without throwing 500 (88ms)'
          ]
        };

        break;
      }

      case 'docker.build': {
        output = {
          imageTag:
            'gcr.io/nexusdev/auth-service:v2.4.2-patch',
          digest:
            'sha256:7f3b891a0c4e91823901bca00192e84172810a9182',
          sizeMb: 142.4,
          vulnerabilities: {
            critical: 0,
            high: 0,
            medium: 1,
            low: 3
          }
        };

        break;
      }

      case 'kubernetes.get': {
        output = {
          resources:
            workspace.kubernetesResources
        };

        break;
      }

      case 'kubernetes.restart': {
        workspace.kubernetesResources =
          workspace.kubernetesResources.map(
            pod => {
              if (
                pod.name.includes(
                  'auth-service'
                )
              ) {
                return {
                  ...pod,
                  status: 'Running',
                  restarts: 0,
                  age: '1m',
                  cpuUsage:
                    '140m (14%)',
                  memoryUsage:
                    '380Mi (37%)'
                };
              }

              return pod;
            }
          );

        output = {
          restarted: true,
          message:
            'Deployment rolled out successfully'
        };

        break;
      }

      case 'deployment.deploy': {
        const newDeployment = {
          id:
            `dep_${Date.now()}`,
          environment:
            input.environment ||
            'staging',
          version:
            input.version ||
            'v2.4.2-patch',
          commitHash:
            input.commitHash ||
            'e92bc10',
          commitMessage:
            'fix(auth): resilient token validation and backwards-compatible orgId mapping',
          deployedBy:
            user?.name ||
            'NexusDev AI Agent',
          deployedAt:
            'Just now',
          status:
            'HEALTHY' as const,
          trafficPercent: 100,
          replicas:
            input.environment ===
            'production'
              ? 4
              : 2,
          healthyReplicas:
            input.environment ===
            'production'
              ? 4
              : 2,
          rollbackAvailable:
            true,
          rollbackVersion:
            'v2.4.1'
        };

        workspace.deployments = [
          newDeployment,
          ...workspace.deployments
        ];

        output = {
          deployed: true,
          deployment:
            newDeployment
        };

        break;
      }

      default:
        output = {
          executed: true,
          tool: toolName,
          input
        };
    }

    res.json({
      tool: toolName,
      result: output
    });
  }
);

// ----------------------------------------------------
// LOCAL ENGINEERING ASSISTANT
// No external AI provider or API required.
// ----------------------------------------------------

app.post(
  '/api/agent/ask',
  (req, res) => {
    const {
      prompt = '',
      contextFilePath,
      issueTitle
    } = req.body || {};

    const normalizedPrompt =
      String(prompt)
        .trim()
        .toLowerCase();

    const activeFile =
      contextFilePath
        ? workspace.files.find(
            file =>
              file.path ===
              contextFilePath
          )
        : null;

    let focus =
      'general engineering review';

    if (
      normalizedPrompt.includes(
        'oauth'
      ) ||
      normalizedPrompt.includes(
        'authentication'
      ) ||
      normalizedPrompt.includes(
        'login'
      ) ||
      normalizedPrompt.includes(
        'session'
      )
    ) {
      focus =
        'authentication and session security';
    } else if (
      normalizedPrompt.includes(
        'deploy'
      ) ||
      normalizedPrompt.includes(
        'deployment'
      ) ||
      normalizedPrompt.includes(
        'release'
      )
    ) {
      focus =
        'deployment and release safety';
    } else if (
      normalizedPrompt.includes(
        'incident'
      ) ||
      normalizedPrompt.includes(
        'error'
      ) ||
      normalizedPrompt.includes(
        '500'
      ) ||
      normalizedPrompt.includes(
        'failure'
      )
    ) {
      focus =
        'incident diagnosis and error handling';
    } else if (
      normalizedPrompt.includes(
        'test'
      ) ||
      normalizedPrompt.includes(
        'testing'
      )
    ) {
      focus =
        'testing and verification';
    } else if (
      normalizedPrompt.includes(
        'performance'
      ) ||
      normalizedPrompt.includes(
        'latency'
      ) ||
      normalizedPrompt.includes(
        'slow'
      )
    ) {
      focus =
        'performance and observability';
    } else if (
      normalizedPrompt.includes(
        'security'
      ) ||
      normalizedPrompt.includes(
        'vulnerability'
      )
    ) {
      focus =
        'security and risk analysis';
    } else if (
      normalizedPrompt.includes(
        'database'
      ) ||
      normalizedPrompt.includes(
        'sql'
      )
    ) {
      focus =
        'data access and persistence';
    }

    const answer = [
      '### Engineering Analysis',
      '',
      `**Focus:** ${focus}`,
      `**Context:** ${
        activeFile
          ? activeFile.path
          : 'No specific file'
      }`,
      issueTitle
        ? `**Issue:** ${issueTitle}`
        : '',
      '',
      '### Key Findings',
      `- The request has been classified as a ${focus}.`,
      activeFile
        ? `- Active file: \`${activeFile.path}\`. Review its control flow, inputs, outputs, error paths, and side effects before making changes.`
        : '- No specific file was supplied, so the analysis is based on the request alone.',
      '',
      '### Proposed Action',
      '- Reproduce the reported behavior locally.',
      '- Inspect the smallest relevant module first.',
      '- Trace inputs, state changes, and error handling.',
      '- Apply the smallest safe change that addresses the root cause.',
      '- Validate the change before committing.',
      '',
      '### Risk Analysis',
      '- Avoid unrelated refactors while fixing the issue.',
      '- Preserve existing authentication and authorization boundaries.',
      '- Verify failure paths as well as the successful path.',
      '',
      '### Verification',
      '- Run `npm run lint`.',
      '- Run `npm run build`.',
      '- Review the resulting behavior before deployment.'
    ]
      .filter(Boolean)
      .join('\n');

    res.json({
      answer
    });
  }
);

// ----------------------------------------------------
// LOCAL MULTI-STEP ENGINEERING WORKFLOW
// ----------------------------------------------------

app.post(
  '/api/agent/run-step',
  (req, res) => {
    const {
      taskPrompt = '',
      stepIndex = 0
    } = req.body || {};

    const steps = [
      'Inspect the repository structure and recent changes.',
      'Identify the likely root cause in the affected module.',
      'Define the smallest safe patch.',
      'Run local validation and tests.',
      'Prepare the change for review.',
      'Verify the deployment state and record the result.'
    ];

    const numericIndex =
      Number(stepIndex);

    const safeIndex =
      Number.isFinite(numericIndex)
        ? Math.max(
            0,
            Math.min(
              Math.floor(
                numericIndex
              ),
              steps.length - 1
            )
          )
        : 0;

    const action =
      steps[safeIndex];

    const task =
      String(taskPrompt || '')
        .trim();

    const summary =
      `Local workflow step ${safeIndex + 1}/${steps.length}: ${action}` +
      (task
        ? ` Task: ${task}`
        : '');

    res.json({
      stepIndex: safeIndex,
      success: true,
      reasoning: summary,
      timestamp:
        new Date().toISOString()
    });
  }
);

// ----------------------------------------------------
// AUTONOMOUS INCIDENT REMEDIATION
// ----------------------------------------------------

app.post(
  '/api/incidents/remediate',
  requireAuth,
  (req, res) => {
    const user =
      getRequestUser(req);

    if (
      user &&
      !checkPermission(
        user.role,
        'REMEDIATE_INCIDENTS'
      )
    ) {
      return res.status(403).json({
        success: false,
        error:
          `Forbidden: Role '${user.role}' lacks permission to execute incident remediation (Requires TechLead, DevOps, or Admin).`,
        statusCode: 403
      });
    }

    const { incidentId } =
      req.body;

    const incident =
      workspace.incidents.find(
        i => i.id === incidentId
      );

    if (incident) {
      incident.status =
        'RESOLVED';

      incident.resolvedAt =
        'Just now';

      const stabilizedPoint = {
        timestamp: '09:25',
        timeLabel:
          '09:25 (Remediated)',
        p95LatencyMs: 38,
        errorRatePercent: 0.02,
        requestsPerSec: 1540,
        cpuPercent: 28,
        memoryPercent: 44,
        dbPoolUtilization: 22
      };

      workspace.telemetry.push(
        stabilizedPoint
      );

      workspace.kubernetesResources =
        workspace.kubernetesResources.map(
          pod => ({
            ...pod,
            status: 'Running',
            restarts:
              pod.name.includes(
                'mm91p'
              )
                ? 0
                : pod.restarts,
            cpuUsage:
              '120m (12%)',
            memoryUsage:
              '340Mi (33%)'
          })
        );

      workspace.auditRecords.unshift({
        id:
          `aud_${Date.now()}`,
        timestamp:
          'Just now',
        actorType:
          (user
            ? 'HUMAN'
            : 'AI_AGENT') as any,
        actorName:
          user?.name ||
          'NexusDev Autonomous Incident Responder',
        action:
          'INCIDENT_REMEDIATION_APPLIED',
        category:
          'DEPLOYMENT',
        permissionUsed:
          'DEPLOY',
        riskLevel:
          'HIGH',
        details:
          `Resolved ${incident.incidentNumber}: Applied patch e92bc10, rolled pods, normalized p95 latency to 38ms by ${user?.name || 'Local Responder'}.`,
        status:
          'EXECUTED',
        targetResource:
          incident.affectedService
      });
    }

    res.json({
      success: true,
      incident
    });
  }
);

// ----------------------------------------------------
// PIPELINE RETRY & AUTO-FIX
// ----------------------------------------------------

app.post(
  '/api/pipelines/fix',
  requireAuth,
  (req, res) => {
    const user =
      getRequestUser(req);

    if (
      user &&
      !checkPermission(
        user.role,
        'TRIGGER_PIPELINES'
      )
    ) {
      return res.status(403).json({
        success: false,
        error:
          `Forbidden: Role '${user.role}' is not authorized to trigger or fix CI/CD pipelines.`,
        statusCode: 403
      });
    }

    const { pipelineId } =
      req.body;

    const pipeline =
      workspace.pipelines.find(
        p => p.id === pipelineId
      );

    if (pipeline) {
      pipeline.status =
        'SUCCESS';

      pipeline.stages =
        pipeline.stages.map(
          stage => ({
            ...stage,
            status: 'SUCCESS',
            errorMessage:
              undefined,
            duration:
              stage.status ===
              'FAILED'
                ? '32s'
                : stage.duration,
            logs: [
              ...stage.logs,
              '✓ Applied patch fix/auth-session-500-patch.',
              '✓ All sandbox tests verified passed.'
            ]
          })
        );

      workspace.auditRecords.unshift({
        id:
          `aud_pipe_${Date.now()}`,
        timestamp:
          'Just now',
        actorType:
          (user
            ? 'HUMAN'
            : 'AI_AGENT') as any,
        actorName:
          user?.name ||
          'NexusDev Pipeline Operator',
        action:
          'PIPELINE_RETRY_AND_FIX',
        category:
          'DEPLOYMENT',
        permissionUsed:
          'EXECUTE',
        riskLevel:
          'MEDIUM',
        details:
          `Retried and auto-fixed pipeline '${pipeline.branch}' (${pipeline.pipelineName}) by ${user?.name || 'CI Operator'}.`,
        status:
          'EXECUTED',
        targetResource:
          pipeline.pipelineName
      });
    }

    res.json({
      success: true,
      pipeline
    });
  }
);

// ----------------------------------------------------
// VITE MIDDLEWARE & SERVER STARTUP
// ----------------------------------------------------

async function startServer() {
  await initializeAdmin();

  if (
    process.env.NODE_ENV !==
    'production'
  ) {
    const vite =
      await createViteServer({
        server: {
          middlewareMode: true
        },
        appType: 'spa'
      });

    app.use(vite.middlewares);
  } else {
    const distPath =
      path.join(
        process.cwd(),
        'dist'
      );

    app.use(
      express.static(distPath)
    );

    app.get(
      '*',
      (req, res) => {
        res.sendFile(
          path.join(
            distPath,
            'index.html'
          )
        );
      }
    );
  }

  app.listen(
    PORT,
    '0.0.0.0',
    () => {
      console.log(
        `NexusDev Platform running at http://localhost:${PORT}`
      );
    }
  );
}

startServer();
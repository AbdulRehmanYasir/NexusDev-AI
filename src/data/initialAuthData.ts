import { LoginAuditRecord, ManagedUser } from '../types';

export const initialManagedUsers: ManagedUser[] = [
  {
    id: 'usr_demo_01',
    name: 'NexusDev Demo',
    email: 'demo@nexusdev.ai',
    role: 'Developer',
    status: 'ACTIVE',
    createdAt: '2026-09-24T00:00:00Z',
    lastLoginAt: null,
    avatar: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=120'
  },
  {
    id: 'usr_admin_01',
    name: 'Abdul Rehman Yasir',
    email: 'admin@nexusdev.ai',
    role: 'Admin',
    status: 'ACTIVE',
    createdAt: '2026-01-10T08:00:00Z',
    lastLoginAt: '2026-08-21T23:42:00Z',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120'
  },
  {
    id: 'usr_lead_01',
    name: 'Alex Vance',
    email: 'alex.vance@company.internal',
    role: 'TechLead',
    status: 'ACTIVE',
    createdAt: '2026-02-14T09:30:00Z',
    lastLoginAt: '2026-08-21T22:15:00Z',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120'
  },
  {
    id: 'usr_dev_01',
    name: 'Sarah Chen',
    email: 'sarah.chen@nexusdev.ai',
    role: 'Developer',
    status: 'ACTIVE',
    createdAt: '2026-03-01T10:15:00Z',
    lastLoginAt: '2026-08-21T20:30:00Z',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120'
  },
  {
    id: 'usr_devops_01',
    name: 'Marcus Brody',
    email: 'marcus.brody@nexusdev.ai',
    role: 'DevOps',
    status: 'ACTIVE',
    createdAt: '2026-03-15T11:00:00Z',
    lastLoginAt: '2026-08-21T19:30:00Z',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120'
  },
  {
    id: 'usr_view_01',
    name: 'Elena Rostova',
    email: 'elena.rostova@nexusdev.ai',
    role: 'Viewer',
    status: 'ACTIVE',
    createdAt: '2026-04-05T14:20:00Z',
    lastLoginAt: '2026-08-21T18:00:00Z',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=120'
  }
];

export const initialLoginAuditRecords: LoginAuditRecord[] = [
  {
    id: 'log_auth_101',
    timestamp: '2026-08-21 23:42',
    userId: 'usr_admin_01',
    userName: 'Abdul Rehman Yasir',
    email: 'admin@nexusdev.ai',
    role: 'Admin',
    event: 'USER_LOGIN',
    status: 'SUCCESS',
    sourceIp: '192.168.1.104',
    sessionId: 'nxt_jwt_8912_f7a9',
    requestId: 'req_auth_99120',
    environment: 'NEBULA_PROD'
  },
  {
    id: 'log_auth_102',
    timestamp: '2026-08-21 22:15',
    userId: 'usr_lead_01',
    userName: 'Alex Vance',
    email: 'alex.vance@company.internal',
    role: 'TechLead',
    event: 'USER_LOGIN',
    status: 'SUCCESS',
    sourceIp: '10.240.0.18',
    sessionId: 'nxt_jwt_7721_c3b1',
    requestId: 'req_auth_99119',
    environment: 'NEBULA_PROD'
  },
  {
    id: 'log_auth_103',
    timestamp: '2026-08-21 21:04',
    userId: 'usr_anon_09',
    userName: 'Unidentified User',
    email: 'intruder@unknown.corp',
    role: 'Viewer',
    event: 'LOGIN_FAILED',
    status: 'FAILED',
    sourceIp: '198.51.100.44',
    sessionId: 'req_fail_091_d4e8',
    requestId: 'req_auth_99118',
    failureReason: 'Invalid password credential check',
    environment: 'NEBULA_PROD'
  },
  {
    id: 'log_auth_104',
    timestamp: '2026-08-21 19:30',
    userId: 'usr_devops_01',
    userName: 'Marcus Brody',
    email: 'marcus.brody@nexusdev.ai',
    role: 'DevOps',
    event: 'USER_LOGOUT',
    status: 'SUCCESS',
    sourceIp: '172.16.4.12',
    sessionId: 'nxt_jwt_5510_e2a5',
    requestId: 'req_auth_99117',
    environment: 'NEBULA_PROD'
  },
  {
    id: 'log_auth_105',
    timestamp: '2026-08-21 18:00',
    userId: 'usr_view_01',
    userName: 'Elena Rostova',
    email: 'elena.rostova@nexusdev.ai',
    role: 'Viewer',
    event: 'SESSION_EXPIRED',
    status: 'EXPIRED',
    sourceIp: '10.240.0.42',
    sessionId: 'nxt_jwt_4102_a1c9',
    requestId: 'req_auth_99116',
    failureReason: 'JWT TTL 3600s timeout expired',
    environment: 'NEBULA_PROD'
  },
  {
    id: 'log_auth_106',
    timestamp: '2026-08-21 16:45',
    userId: 'usr_admin_01',
    userName: 'Abdul Rehman Yasir',
    email: 'admin@nexusdev.ai',
    role: 'Admin',
    event: 'USER_LOGIN',
    status: 'SUCCESS',
    sourceIp: '192.168.1.104',
    sessionId: 'nxt_jwt_3291_b8e2',
    requestId: 'req_auth_99115',
    environment: 'NEBULA_PROD'
  },
  {
    id: 'log_auth_107',
    timestamp: '2026-08-21 14:12',
    userId: 'usr_dev_test',
    userName: 'Dev Tester',
    email: 'test.dev@nexusdev.ai',
    role: 'Developer',
    event: 'LOGIN_FAILED',
    status: 'FAILED',
    sourceIp: '192.168.1.150',
    sessionId: 'req_fail_034_c7f1',
    requestId: 'req_auth_99114',
    failureReason: 'Account locked: 3 consecutive invalid attempts',
    environment: 'NEBULA_PROD'
  }
];



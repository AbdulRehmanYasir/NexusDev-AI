import React, { createContext, useContext, useState, useEffect } from 'react';
import { RbacRole, UserProfile, LoginAuditRecord, ManagedUser } from '../types';
import { initialLoginAuditRecords, initialManagedUsers } from '../data/initialAuthData';

export interface AuthSession {
  token: string;
  createdAt: string;
  expiresAt: string;
  rememberMe: boolean;
}

export interface TwoFactorDetails {
  enabled: boolean;
  method: string;
  algorithm: string;
  periodSeconds: number;
  digits: number;
  enabledAt: string;
  backupCodesRemaining: number;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: UserProfile | null;
  session: AuthSession | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string, role: RbacRole, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  loginWithOAuth: (provider: 'github' | 'google') => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  clearError: () => void;
  updateUserRole: (role: RbacRole) => void;
  // Two-Factor & Recovery Codes
  twoFactorDetails: TwoFactorDetails;
  recoveryCodes: string[];
  generateNewRecoveryCodes: () => string[];
  loginWithRecoveryCode: (email: string, code: string) => Promise<{ success: boolean; error?: string }>;
  // Admin-Only capabilities
  getLoginAuditRecords: () => LoginAuditRecord[];
  getManagedUsers: () => ManagedUser[];
  adminUpdateUserRole: (targetUserId: string, newRole: RbacRole) => { success: boolean; error?: string };
  adminToggleUserStatus: (targetUserId: string) => { success: boolean; error?: string; newStatus?: 'ACTIVE' | 'DISABLED' };
}


const STORAGE_SESSION_KEY = 'nexusdev_auth_session';
const STORAGE_USER_KEY = 'nexusdev_auth_user';
const STORAGE_LOGIN_AUDIT_KEY = 'nexusdev_login_audit_records';
const STORAGE_MANAGED_USERS_KEY = 'nexusdev_managed_users';
const STORAGE_RECOVERY_CODES_KEY = 'nexusdev_recovery_codes';
const STORAGE_REGISTRY_KEY = 'nexusdev_user_registry';

export const DEFAULT_DEMO_USER: UserProfile = {
  id: 'usr_admin_01',
  name: 'Abdul Rehman Yasir',
  email: 'admin@nexusdev.ai',
  role: 'Admin',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120'
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 2FA & Recovery Codes State
  const [twoFactorDetails] = useState<TwoFactorDetails>({
    enabled: true,
    method: 'Authenticator App (TOTP / RFC 6238)',
    algorithm: 'HMAC-SHA1',
    periodSeconds: 30,
    digits: 6,
    enabledAt: '2026-01-15 10:30:00 UTC',
    backupCodesRemaining: 10
  });

  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

  // Persist recovery codes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_RECOVERY_CODES_KEY, JSON.stringify(recoveryCodes));
    } catch (e) {
      console.warn('Failed to persist recovery codes', e);
    }
  }, [recoveryCodes]);

  const generateNewRecoveryCodes = (): string[] => {
    setError('Recovery codes require a persistent server-side MFA provider and are unavailable in this in-memory deployment.');
    return [];
  };

  const loginWithRecoveryCode = async (
    email: string,
    code: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);

    void email;
    void code;
    const err = 'Recovery-code sign-in requires a persistent server-side MFA provider and is unavailable in this in-memory deployment.';
    setError(err);
    setIsLoading(false);
    return { success: false, error: err };
  };

  // Managed Users & Login Audit store in state
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_MANAGED_USERS_KEY);
      return stored ? JSON.parse(stored) : initialManagedUsers;
    } catch {
      return initialManagedUsers;
    }
  });

  const [loginAudits, setLoginAudits] = useState<LoginAuditRecord[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_LOGIN_AUDIT_KEY);
      return stored ? JSON.parse(stored) : initialLoginAuditRecords;
    } catch {
      return initialLoginAuditRecords;
    }
  });

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_MANAGED_USERS_KEY, JSON.stringify(managedUsers));
    } catch (e) {
      console.warn('Failed to persist managed users', e);
    }
  }, [managedUsers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_LOGIN_AUDIT_KEY, JSON.stringify(loginAudits));
    } catch (e) {
      console.warn('Failed to persist login audit records', e);
    }
  }, [loginAudits]);

  // Helper to record login audit event (never records passwords)
  const recordLoginEvent = (
    event: 'USER_LOGIN' | 'USER_LOGOUT' | 'LOGIN_FAILED' | 'SESSION_EXPIRED',
    user: { id?: string; name?: string; email: string; role?: RbacRole },
    status: 'SUCCESS' | 'FAILED' | 'EXPIRED',
    failureReason?: string,
    sessionId?: string
  ) => {
    const now = new Date();
    const formattedTimestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const newRecord: LoginAuditRecord = {
      id: `log_auth_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: formattedTimestamp,
      userId: user.id || 'usr_unauthenticated',
      userName: user.name || (event === 'LOGIN_FAILED' ? 'Unidentified User' : 'NexusDev User'),
      email: user.email,
      role: user.role || 'Developer',
      event,
      status,
      sourceIp: '192.168.1.104',
      sessionId: sessionId || `nxt_jwt_${Math.random().toString(36).substring(2, 8)}`,
      requestId: `req_auth_${Date.now()}`,
      failureReason,
      environment: 'NEBULA_PROD'
    };

    setLoginAudits((prev) => [newRecord, ...prev]);
  };

  // Initialize and check existing persistent session
  useEffect(() => {
    try {
      const storedSession = localStorage.getItem(STORAGE_SESSION_KEY) || sessionStorage.getItem(STORAGE_SESSION_KEY);
      const storedUser = localStorage.getItem(STORAGE_USER_KEY) || sessionStorage.getItem(STORAGE_USER_KEY);

      if (storedSession && storedUser) {
        const parsedSession: AuthSession = JSON.parse(storedSession);
        let parsedUser: UserProfile = JSON.parse(storedUser);

        // Check if session has expired
        const expiryDate = new Date(parsedSession.expiresAt);
        if (expiryDate > new Date()) {
          // Ensure the authenticated user account has persisted Admin role and updated email
          if (
            parsedUser.id === 'usr_admin_01' || 
            parsedUser.email.toLowerCase() === 'abdulrehmanyasir.ai@gmail.com' ||
            parsedUser.email.toLowerCase() === 'admin@nexusdev.ai' ||
            parsedUser.name === 'Abdul Rehman Yasir'
          ) {
            parsedUser = { ...parsedUser, email: 'admin@nexusdev.ai', role: 'Admin' };
            if (parsedSession.rememberMe) {
              localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(parsedUser));
            } else {
              sessionStorage.setItem(STORAGE_USER_KEY, JSON.stringify(parsedUser));
            }
          }
          setSession(parsedSession);
          setCurrentUser(parsedUser);
          setIsAuthenticated(true);
        } else {
          // Record session expired
          recordLoginEvent('SESSION_EXPIRED', parsedUser, 'EXPIRED', 'Session TTL timeout expired', parsedSession.token);
          // Expired -> clear
          localStorage.removeItem(STORAGE_SESSION_KEY);
          localStorage.removeItem(STORAGE_USER_KEY);
          sessionStorage.removeItem(STORAGE_SESSION_KEY);
          sessionStorage.removeItem(STORAGE_USER_KEY);
        }
      } else {
        // No stored session: keep user unauthenticated so LoginView is presented
        setSession(null);
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.warn('Session restoration failed:', err);
    }
  }, []);

  const clearError = () => setError(null);

  const updateUserRole = (newRole: RbacRole) => {
    if (currentUser) {
      const updated = { ...currentUser, role: newRole };
      setCurrentUser(updated);
      
      // Update session token to match the switched role
      const rolePrefix = newRole.toLowerCase() === 'techlead' ? 'lead' : newRole.toLowerCase();
      const updatedToken = `nxt_jwt_${rolePrefix}_session_token_key`;
      const updatedSession: AuthSession = session ? {
        ...session,
        token: updatedToken
      } : {
        token: updatedToken,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
        rememberMe: true
      };

      setSession(updatedSession);

      if (session?.rememberMe !== false) {
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(updated));
        localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(updatedSession));
      } else {
        sessionStorage.setItem(STORAGE_USER_KEY, JSON.stringify(updated));
        sessionStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(updatedSession));
      }

      // Also update in managed users if present
      setManagedUsers((prev) =>
        prev.map((u) => (u.email.toLowerCase() === currentUser.email.toLowerCase() ? { ...u, role: newRole } : u))
      );
    }
  };

  // Register a new user with chosen role
  const register = async (
    name: string,
    email: string,
    password: string,
    role: RbacRole,
    rememberMe: boolean = true
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);

    await new Promise((resolve) => setTimeout(resolve, 600));

    const trimmedName = (name || '').trim();
    const trimmedEmail = (email || '').trim().toLowerCase();
    const trimmedPassword = (password || '').trim();

    if (!trimmedName || !trimmedEmail || !trimmedPassword) {
      setIsLoading(false);
      const err = 'REGISTRATION FAILED: All fields are required.';
      setError(err);
      recordLoginEvent('LOGIN_FAILED', { email: trimmedEmail || 'unknown@registration', role }, 'FAILED', 'Missing required registration fields');
      return { success: false, error: err };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setIsLoading(false);
      const err = 'REGISTRATION FAILED: Please enter a valid work email address.';
      setError(err);
      recordLoginEvent('LOGIN_FAILED', { email: trimmedEmail, role }, 'FAILED', 'Malformed email structure');
      return { success: false, error: err };
    }

    if (trimmedPassword.length < 4) {
      setIsLoading(false);
      const err = 'REGISTRATION FAILED: Password must be at least 4 characters.';
      setError(err);
      recordLoginEvent('LOGIN_FAILED', { email: trimmedEmail, role }, 'FAILED', 'Password below minimum length');
      return { success: false, error: err };
    }

    // Security guard: self-registration cannot create an Admin account or overwrite permanent Admin
    if (trimmedEmail === 'admin@nexusdev.ai') {
      setIsLoading(false);
      const err = 'REGISTRATION FAILED: Permanent system administrator account already provisioned. Please sign in.';
      setError(err);
      return { success: false, error: err };
    }

    const newUserId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const assignedRole: RbacRole = role === 'Admin' ? 'Developer' : (role || 'Developer');

    const newUser: UserProfile = {
      id: newUserId,
      name: trimmedName,
      email: trimmedEmail,
      role: assignedRole,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120'
    };

    // Save to registered users registry
    try {
      const existingRegistry = JSON.parse(localStorage.getItem(STORAGE_REGISTRY_KEY) || '{}');
      existingRegistry[trimmedEmail] = {
        user: newUser,
        password: trimmedPassword
      };
      localStorage.setItem(STORAGE_REGISTRY_KEY, JSON.stringify(existingRegistry));
    } catch (e) {
      console.warn('Failed to save to user registry', e);
    }

    // Add to managed users
    const newManagedUser: ManagedUser = {
      id: newUserId,
      name: trimmedName,
      email: trimmedEmail,
      role: assignedRole,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      avatar: newUser.avatar
    };
    setManagedUsers((prev) => [newManagedUser, ...prev.filter((u) => u.email.toLowerCase() !== trimmedEmail)]);

    const expiryTime = new Date();
    expiryTime.setDate(expiryTime.getDate() + (rememberMe ? 30 : 1));

    const token = `nxt_jwt_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
    const newSession: AuthSession = {
      token,
      createdAt: new Date().toISOString(),
      expiresAt: expiryTime.toISOString(),
      rememberMe
    };

    if (rememberMe) {
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(newSession));
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(newUser));
    } else {
      sessionStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(newSession));
      sessionStorage.setItem(STORAGE_USER_KEY, JSON.stringify(newUser));
    }

    // Record login audit event
    recordLoginEvent('USER_LOGIN', newUser, 'SUCCESS', undefined, token);

    setSession(newSession);
    setCurrentUser(newUser);
    setIsAuthenticated(true);
    setIsLoading(false);

    return { success: true };
  };

  // Mock Authentication Service with realistic enterprise validation
  const login = async (
    email: string,
    password: string,
    rememberMe: boolean = true
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);

    await new Promise((resolve) => setTimeout(resolve, 500));

    const trimmedEmail = (email || '').trim().toLowerCase();
    const trimmedPassword = (password || '').trim();

    // 1. Basic validation
    if (!trimmedEmail || !trimmedPassword) {
      setIsLoading(false);
      const err = 'AUTHENTICATION FAILED: Email and password are required.';
      setError(err);
      recordLoginEvent('LOGIN_FAILED', { email: trimmedEmail || 'unknown@domain.com' }, 'FAILED', 'Missing email or password credentials');
      return { success: false, error: err };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setIsLoading(false);
      const err = 'AUTHENTICATION FAILED: Invalid email format.';
      setError(err);
      recordLoginEvent('LOGIN_FAILED', { email: trimmedEmail }, 'FAILED', 'Invalid email format syntax');
      return { success: false, error: err };
    }

    // Check registry first
    try {
      const existingRegistry = JSON.parse(localStorage.getItem(STORAGE_REGISTRY_KEY) || '{}');
      if (existingRegistry[trimmedEmail]) {
        const entry = existingRegistry[trimmedEmail];
        if (entry.password !== trimmedPassword) {
          setIsLoading(false);
          const err = 'AUTHENTICATION FAILED: Invalid password.';
          setError(err);
          recordLoginEvent('LOGIN_FAILED', { email: trimmedEmail, role: entry.user.role }, 'FAILED', 'Password mismatch');
          return { success: false, error: err };
        }

        const userToSet: UserProfile = entry.user;
        const expiryTime = new Date();
        expiryTime.setDate(expiryTime.getDate() + (rememberMe ? 30 : 1));

        const token = `nxt_jwt_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
        const newSession: AuthSession = {
          token,
          createdAt: new Date().toISOString(),
          expiresAt: expiryTime.toISOString(),
          rememberMe
        };

        if (rememberMe) {
          localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(newSession));
          localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(userToSet));
        } else {
          sessionStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(newSession));
          sessionStorage.setItem(STORAGE_USER_KEY, JSON.stringify(userToSet));
        }

        recordLoginEvent('USER_LOGIN', userToSet, 'SUCCESS', undefined, token);

        setSession(newSession);
        setCurrentUser(userToSet);
        setIsAuthenticated(true);
        setIsLoading(false);
        return { success: true };
      }
    } catch (e) {
      console.warn('Registry lookup error', e);
    }

    // 2. Default Credential Verification logic
    const isInvalid = 
      trimmedPassword === 'wrong' || 
      trimmedPassword === 'invalid' || 
      trimmedPassword === 'test' ||
      trimmedEmail === 'invalid@nexusdev.ai' ||
      trimmedEmail === 'wrong@nexusdev.ai' ||
      trimmedPassword.length < 4;

    if (isInvalid) {
      setIsLoading(false);
      const err = 'AUTHENTICATION FAILED: Invalid email or password.';
      setError(err);
      recordLoginEvent('LOGIN_FAILED', { email: trimmedEmail }, 'FAILED', 'Invalid password check');
      return { success: false, error: err };
    }

    // Determine user profile based on email or managed users
    let userToSet: UserProfile = { ...DEFAULT_DEMO_USER };
    const emailLower = (trimmedEmail || '').toLowerCase();

    // Check if managed user exists
    const existingManaged = managedUsers.find((u) => u.email.toLowerCase() === emailLower);
    if (existingManaged) {
      if (existingManaged.status === 'DISABLED') {
        setIsLoading(false);
        const err = 'AUTHENTICATION FAILED: This account has been disabled by an administrator.';
        setError(err);
        recordLoginEvent('LOGIN_FAILED', { email: trimmedEmail, role: existingManaged.role }, 'FAILED', 'Account disabled by Admin');
        return { success: false, error: err };
      }
      userToSet = {
        id: existingManaged.id,
        name: existingManaged.name,
        email: existingManaged.email,
        role: existingManaged.role,
        avatar: existingManaged.avatar || DEFAULT_DEMO_USER.avatar
      };
    } else if (
      emailLower.includes('admin') || 
      emailLower === 'abdulrehmanyasir.ai@gmail.com' ||
      emailLower === 'developer@nexusdev.ai' ||
      emailLower === 'admin@nexusdev.ai'
    ) {
      userToSet = {
        id: 'usr_admin_01',
        name: 'Abdul Rehman Yasir',
        email: trimmedEmail,
        role: 'Admin',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120'
      };
    } else if (emailLower.includes('devops')) {
      userToSet = {
        id: 'usr_devops_01',
        name: 'Marcus Brody',
        email: trimmedEmail,
        role: 'DevOps',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120'
      };
    } else if (emailLower.includes('lead')) {
      userToSet = {
        id: 'usr_lead_01',
        name: 'Alex Vance',
        email: trimmedEmail,
        role: 'TechLead',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120'
      };
    } else if (emailLower.includes('viewer')) {
      userToSet = {
        id: 'usr_view_01',
        name: 'Elena Rostova',
        email: trimmedEmail,
        role: 'Viewer',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=120'
      };
    } else {
      userToSet = {
        id: 'usr_dev_01',
        name: 'Sarah Chen',
        email: trimmedEmail,
        role: 'Developer',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120'
      };
    }

    const expiryTime = new Date();
    expiryTime.setDate(expiryTime.getDate() + (rememberMe ? 30 : 1));

    const token = `nxt_jwt_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
    const newSession: AuthSession = {
      token,
      createdAt: new Date().toISOString(),
      expiresAt: expiryTime.toISOString(),
      rememberMe
    };

    if (rememberMe) {
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(newSession));
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(userToSet));
    } else {
      sessionStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(newSession));
      sessionStorage.setItem(STORAGE_USER_KEY, JSON.stringify(userToSet));
    }

    // Record login audit event
    recordLoginEvent('USER_LOGIN', userToSet, 'SUCCESS', undefined, token);

    // Update managed users lastLoginAt
    setManagedUsers((prev) =>
      prev.map((u) => (u.email.toLowerCase() === trimmedEmail ? { ...u, lastLoginAt: new Date().toISOString() } : u))
    );

    setSession(newSession);
    setCurrentUser(userToSet);
    setIsAuthenticated(true);
    setIsLoading(false);

    return { success: true };
  };

  const loginWithOAuth = async (provider: 'github' | 'google'): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);

    await new Promise((resolve) => setTimeout(resolve, 600));

    const providerName = provider === 'github' ? 'GitHub' : 'Google';
    const userToSet: UserProfile = {
      id: `usr_oauth_${provider}_${Date.now()}`,
      name: `${providerName} Developer`,
      email: `oauth.${provider}@nexusdev.ai`,
      role: 'Developer',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120'
    };

    const expiryTime = new Date();
    expiryTime.setDate(expiryTime.getDate() + 30);

    const token = `oauth_${provider}_${Math.random().toString(36).substring(2, 15)}`;
    const newSession: AuthSession = {
      token,
      createdAt: new Date().toISOString(),
      expiresAt: expiryTime.toISOString(),
      rememberMe: true
    };

    localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(newSession));
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(userToSet));

    recordLoginEvent('USER_LOGIN', userToSet, 'SUCCESS', undefined, token);

    setSession(newSession);
    setCurrentUser(userToSet);
    setIsAuthenticated(true);
    setIsLoading(false);

    return { success: true };
  };

  const logout = () => {
    if (currentUser) {
      recordLoginEvent('USER_LOGOUT', currentUser, 'SUCCESS', undefined, session?.token);
    }

    localStorage.removeItem(STORAGE_SESSION_KEY);
    localStorage.removeItem(STORAGE_USER_KEY);
    sessionStorage.removeItem(STORAGE_SESSION_KEY);
    sessionStorage.removeItem(STORAGE_USER_KEY);

    setSession(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
    setError(null);

    // Redirect to login hash
    window.location.hash = '#/login';
  };

  // Strict Admin-only Data Gate: Non-admin callers NEVER receive the login activity dataset
  const getLoginAuditRecords = (): LoginAuditRecord[] => {
    if (currentUser?.role !== 'Admin') {
      console.warn('SECURITY ALERT: Non-admin role attempted to access login audit dataset. Access denied.');
      return [];
    }
    return loginAudits;
  };

  // Strict Admin-only Data Gate for managed users
  const getManagedUsers = (): ManagedUser[] => {
    if (currentUser?.role !== 'Admin') {
      // If non-admin, return only their own profile if available
      return currentUser
        ? [
            {
              id: currentUser.id,
              name: currentUser.name,
              email: currentUser.email,
              role: currentUser.role,
              status: 'ACTIVE',
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
              avatar: currentUser.avatar
            }
          ]
        : [];
    }
    return managedUsers;
  };

  // Admin user management: Update role
  const adminUpdateUserRole = (targetUserId: string, newRole: RbacRole): { success: boolean; error?: string } => {
    if (currentUser?.role !== 'Admin') {
      return { success: false, error: 'Access Denied: Only Admin can update user roles.' };
    }

    const targetUser = managedUsers.find((u) => u.id === targetUserId);
    if (!targetUser) {
      return { success: false, error: 'User not found.' };
    }

    // Security guard: Permanent system administrator cannot be demoted or modified
    if (targetUser.email.toLowerCase() === 'admin@nexusdev.ai' || targetUser.id === 'usr_admin_01') {
      return {
        success: false,
        error: 'Permanent Administrator account (admin@nexusdev.ai) cannot be demoted, modified, or reassigned.'
      };
    }

    const previousRole = targetUser.role;
    setManagedUsers((prev) =>
      prev.map((u) => (u.id === targetUserId ? { ...u, role: newRole } : u))
    );

    // If target user is the currently logged in user, update currentUser as well
    if (currentUser.id === targetUserId) {
      updateUserRole(newRole);
    }

    return { success: true };
  };

  // Admin user management: Disable/Enable user
  const adminToggleUserStatus = (targetUserId: string): { success: boolean; error?: string; newStatus?: 'ACTIVE' | 'DISABLED' } => {
    if (currentUser?.role !== 'Admin') {
      return { success: false, error: 'Access Denied: Only Admin can enable or disable user accounts.' };
    }

    const targetUser = managedUsers.find((u) => u.id === targetUserId);
    if (!targetUser) {
      return { success: false, error: 'User not found.' };
    }

    // Security guard: Permanent system administrator cannot be disabled
    if (targetUser.email.toLowerCase() === 'admin@nexusdev.ai' || targetUser.id === 'usr_admin_01') {
      return {
        success: false,
        error: 'Permanent Administrator account (admin@nexusdev.ai) cannot be disabled.'
      };
    }

    const nextStatus: 'ACTIVE' | 'DISABLED' = targetUser.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';

    setManagedUsers((prev) =>
      prev.map((u) => (u.id === targetUserId ? { ...u, status: nextStatus } : u))
    );

    return { success: true, newStatus: nextStatus };
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        session,
        isLoading,
        error,
        login,
        register,
        loginWithOAuth,
        logout,
        clearError,
        updateUserRole,
        twoFactorDetails,
        recoveryCodes,
        generateNewRecoveryCodes,
        loginWithRecoveryCode,
        getLoginAuditRecords,
        getManagedUsers,
        adminUpdateUserRole,
        adminToggleUserStatus
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

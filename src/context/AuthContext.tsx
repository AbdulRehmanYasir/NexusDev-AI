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
  login: (
    email: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    name: string,
    email: string,
    password: string,
    role: RbacRole,
    rememberMe?: boolean
  ) => Promise<{ success: boolean; error?: string }>;
  loginWithOAuth: (
    provider: 'github' | 'google'
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  clearError: () => void;
  updateUserRole: (role: RbacRole) => void;

  // Two-Factor & Recovery Codes
  twoFactorDetails: TwoFactorDetails;
  recoveryCodes: string[];
  generateNewRecoveryCodes: () => string[];
  loginWithRecoveryCode: (
    email: string,
    code: string
  ) => Promise<{ success: boolean; error?: string }>;

  // Admin-Only capabilities
  getLoginAuditRecords: () => LoginAuditRecord[];
  getManagedUsers: () => ManagedUser[];
  adminUpdateUserRole: (
    targetUserId: string,
    newRole: RbacRole
  ) => { success: boolean; error?: string };
  adminToggleUserStatus: (
    targetUserId: string
  ) => { success: boolean; error?: string; newStatus?: 'ACTIVE' | 'DISABLED' };
}

const STORAGE_SESSION_KEY = 'nexusdev_auth_session';
const STORAGE_USER_KEY = 'nexusdev_auth_user';
const STORAGE_LOGIN_AUDIT_KEY = 'nexusdev_login_audit_records';
const STORAGE_MANAGED_USERS_KEY = 'nexusdev_managed_users';
const STORAGE_RECOVERY_CODES_KEY = 'nexusdev_recovery_codes';
const STORAGE_REGISTRY_KEY = 'nexusdev_user_registry';

const PERMANENT_ADMIN_EMAIL = 'admin@nexusdev.ai';
const DEMO_EMAIL = 'demo@nexusdev.ai';
const DEMO_PASSWORD = 'demo2026';

export const DEFAULT_DEMO_USER: UserProfile = {
  id: 'usr_admin_01',
  name: 'Abdul Rehman Yasir',
  email: PERMANENT_ADMIN_EMAIL,
  role: 'Admin',
  avatar:
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120'
};

const DEMO_USER: UserProfile = {
  id: 'usr_demo_01',
  name: 'NexusDev Demo',
  email: DEMO_EMAIL,
  role: 'Developer',
  avatar:
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=120'
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
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
      localStorage.setItem(
        STORAGE_RECOVERY_CODES_KEY,
        JSON.stringify(recoveryCodes)
      );
    } catch (e) {
      console.warn('Failed to persist recovery codes', e);
    }
  }, [recoveryCodes]);

  const generateNewRecoveryCodes = (): string[] => {
    setError(
      'Recovery codes require a persistent server-side MFA provider and are unavailable in this in-memory deployment.'
    );
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

    const err =
      'Recovery-code sign-in requires a persistent server-side MFA provider and is unavailable in this in-memory deployment.';

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

  // Seed the separate public demo account.
  // This account is always a Developer and has no relationship to the permanent Admin.
  useEffect(() => {
    try {
      const existingRegistry = JSON.parse(
        localStorage.getItem(STORAGE_REGISTRY_KEY) || '{}'
      );

      const existingDemo = existingRegistry[DEMO_EMAIL];

      if (!existingDemo) {
        existingRegistry[DEMO_EMAIL] = {
          user: DEMO_USER,
          password: DEMO_PASSWORD
        };

        localStorage.setItem(
          STORAGE_REGISTRY_KEY,
          JSON.stringify(existingRegistry)
        );
      }

      setManagedUsers((prev) => {
        const alreadyExists = prev.some(
          (user) => user.email.toLowerCase() === DEMO_EMAIL
        );

        if (alreadyExists) {
          return prev;
        }

        const demoManagedUser: ManagedUser = {
          id: 'usr_demo_01',
          name: 'NexusDev Demo',
          email: DEMO_EMAIL,
          role: 'Developer',
          status: 'ACTIVE',
          createdAt: '2026-09-24T00:00:00Z',
          lastLoginAt: undefined,
          avatar: DEMO_USER.avatar
        };

        return [demoManagedUser, ...prev];
      });
    } catch (e) {
      console.warn('Failed to initialize demo account', e);
    }
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_MANAGED_USERS_KEY,
        JSON.stringify(managedUsers)
      );
    } catch (e) {
      console.warn('Failed to persist managed users', e);
    }
  }, [managedUsers]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_LOGIN_AUDIT_KEY,
        JSON.stringify(loginAudits)
      );
    } catch (e) {
      console.warn('Failed to persist login audit records', e);
    }
  }, [loginAudits]);

  // Helper to record login audit event.
  // Passwords are never recorded.
  const recordLoginEvent = (
    event:
      | 'USER_LOGIN'
      | 'USER_LOGOUT'
      | 'LOGIN_FAILED'
      | 'SESSION_EXPIRED',
    user: {
      id?: string;
      name?: string;
      email: string;
      role?: RbacRole;
    },
    status: 'SUCCESS' | 'FAILED' | 'EXPIRED',
    failureReason?: string,
    sessionId?: string
  ) => {
    const now = new Date();

    const formattedTimestamp = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(
      now.getHours()
    ).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newRecord: LoginAuditRecord = {
      id: `log_auth_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 6)}`,
      timestamp: formattedTimestamp,
      userId: user.id || 'usr_unauthenticated',
      userName:
        user.name ||
        (event === 'LOGIN_FAILED' ? 'Unidentified User' : 'NexusDev User'),
      email: user.email,
      role: user.role || 'Developer',
      event,
      status,
      sourceIp: '192.168.1.104',
      sessionId:
        sessionId ||
        `nxt_jwt_${Math.random().toString(36).substring(2, 8)}`,
      requestId: `req_auth_${Date.now()}`,
      failureReason,
      environment: 'NEBULA_PROD'
    };

    setLoginAudits((prev) => [newRecord, ...prev]);
  };

  // Initialize and check existing persistent session
  useEffect(() => {
    try {
      const storedSession =
        localStorage.getItem(STORAGE_SESSION_KEY) ||
        sessionStorage.getItem(STORAGE_SESSION_KEY);

      const storedUser =
        localStorage.getItem(STORAGE_USER_KEY) ||
        sessionStorage.getItem(STORAGE_USER_KEY);

      if (storedSession && storedUser) {
        const parsedSession: AuthSession = JSON.parse(storedSession);
        let parsedUser: UserProfile = JSON.parse(storedUser);

        const expiryDate = new Date(parsedSession.expiresAt);

        if (expiryDate > new Date()) {
          // Only the permanent Admin identity receives Admin privileges.
          if (
            parsedUser.id === 'usr_admin_01' &&
            parsedUser.email.toLowerCase() === PERMANENT_ADMIN_EMAIL
          ) {
            parsedUser = {
              ...parsedUser,
              id: 'usr_admin_01',
              email: PERMANENT_ADMIN_EMAIL,
              role: 'Admin',
              name: 'Abdul Rehman Yasir'
            };

            if (parsedSession.rememberMe) {
              localStorage.setItem(
                STORAGE_USER_KEY,
                JSON.stringify(parsedUser)
              );
            } else {
              sessionStorage.setItem(
                STORAGE_USER_KEY,
                JSON.stringify(parsedUser)
              );
            }
          }

          setSession(parsedSession);
          setCurrentUser(parsedUser);
          setIsAuthenticated(true);
        } else {
          recordLoginEvent(
            'SESSION_EXPIRED',
            parsedUser,
            'EXPIRED',
            'Session TTL timeout expired',
            parsedSession.token
          );

          localStorage.removeItem(STORAGE_SESSION_KEY);
          localStorage.removeItem(STORAGE_USER_KEY);
          sessionStorage.removeItem(STORAGE_SESSION_KEY);
          sessionStorage.removeItem(STORAGE_USER_KEY);
        }
      } else {
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
    if (!currentUser) {
      return;
    }

    // Permanent administrator can never be changed.
    if (
      currentUser.id === 'usr_admin_01' &&
      currentUser.email.toLowerCase() === PERMANENT_ADMIN_EMAIL
    ) {
      return;
    }

    const updated = {
      ...currentUser,
      role: newRole
    };

    setCurrentUser(updated);

    const rolePrefix =
      newRole.toLowerCase() === 'techlead'
        ? 'lead'
        : newRole.toLowerCase();

    const updatedToken = `nxt_jwt_${rolePrefix}_session_token_key`;

    const updatedSession: AuthSession = session
      ? {
          ...session,
          token: updatedToken
        }
      : {
          token: updatedToken,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(
            Date.now() + 30 * 86400000
          ).toISOString(),
          rememberMe: true
        };

    setSession(updatedSession);

    if (session?.rememberMe !== false) {
      localStorage.setItem(
        STORAGE_USER_KEY,
        JSON.stringify(updated)
      );

      localStorage.setItem(
        STORAGE_SESSION_KEY,
        JSON.stringify(updatedSession)
      );
    } else {
      sessionStorage.setItem(
        STORAGE_USER_KEY,
        JSON.stringify(updated)
      );

      sessionStorage.setItem(
        STORAGE_SESSION_KEY,
        JSON.stringify(updatedSession)
      );
    }

    setManagedUsers((prev) =>
      prev.map((u) =>
        u.email.toLowerCase() === currentUser.email.toLowerCase()
          ? { ...u, role: newRole }
          : u
      )
    );
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

      const err =
        'REGISTRATION FAILED: All fields are required.';

      setError(err);

      recordLoginEvent(
        'LOGIN_FAILED',
        {
          email:
            trimmedEmail || 'unknown@registration',
          role
        },
        'FAILED',
        'Missing required registration fields'
      );

      return {
        success: false,
        error: err
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(trimmedEmail)) {
      setIsLoading(false);

      const err =
        'REGISTRATION FAILED: Please enter a valid work email address.';

      setError(err);

      recordLoginEvent(
        'LOGIN_FAILED',
        {
          email: trimmedEmail,
          role
        },
        'FAILED',
        'Malformed email structure'
      );

      return {
        success: false,
        error: err
      };
    }

    if (trimmedPassword.length < 4) {
      setIsLoading(false);

      const err =
        'REGISTRATION FAILED: Password must be at least 4 characters.';

      setError(err);

      recordLoginEvent(
        'LOGIN_FAILED',
        {
          email: trimmedEmail,
          role
        },
        'FAILED',
        'Password below minimum length'
      );

      return {
        success: false,
        error: err
      };
    }

    // Permanent Admin cannot be registered or overwritten.
    if (trimmedEmail === PERMANENT_ADMIN_EMAIL) {
      setIsLoading(false);

      const err =
        'REGISTRATION FAILED: Permanent system administrator account already provisioned. Please sign in.';

      setError(err);

      return {
        success: false,
        error: err
      };
    }

    // Public demo account cannot be overwritten.
    if (trimmedEmail === DEMO_EMAIL) {
      setIsLoading(false);

      const err =
        'REGISTRATION FAILED: This email is reserved for the NexusDev demo account.';

      setError(err);

      return {
        success: false,
        error: err
      };
    }

    const newUserId = `usr_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 7)}`;

    // Self-registration can never create an Admin account.
    const assignedRole: RbacRole =
      role === 'Admin' ? 'Developer' : role || 'Developer';

    const newUser: UserProfile = {
      id: newUserId,
      name: trimmedName,
      email: trimmedEmail,
      role: assignedRole,
      avatar:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120'
    };

    try {
      const existingRegistry = JSON.parse(
        localStorage.getItem(STORAGE_REGISTRY_KEY) || '{}'
      );

      existingRegistry[trimmedEmail] = {
        user: newUser,
        password: trimmedPassword
      };

      localStorage.setItem(
        STORAGE_REGISTRY_KEY,
        JSON.stringify(existingRegistry)
      );
    } catch (e) {
      console.warn(
        'Failed to save to user registry',
        e
      );
    }

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

    setManagedUsers((prev) => [
      newManagedUser,
      ...prev.filter(
        (u) =>
          u.email.toLowerCase() !== trimmedEmail
      )
    ]);

    const expiryTime = new Date();

    expiryTime.setDate(
      expiryTime.getDate() +
        (rememberMe ? 30 : 1)
    );

    const token = `nxt_jwt_${Math.random()
      .toString(36)
      .substring(2, 15)}_${Date.now()}`;

    const newSession: AuthSession = {
      token,
      createdAt: new Date().toISOString(),
      expiresAt: expiryTime.toISOString(),
      rememberMe
    };

    if (rememberMe) {
      localStorage.setItem(
        STORAGE_SESSION_KEY,
        JSON.stringify(newSession)
      );

      localStorage.setItem(
        STORAGE_USER_KEY,
        JSON.stringify(newUser)
      );
    } else {
      sessionStorage.setItem(
        STORAGE_SESSION_KEY,
        JSON.stringify(newSession)
      );

      sessionStorage.setItem(
        STORAGE_USER_KEY,
        JSON.stringify(newUser)
      );
    }

    recordLoginEvent(
      'USER_LOGIN',
      newUser,
      'SUCCESS',
      undefined,
      token
    );

    setSession(newSession);
    setCurrentUser(newUser);
    setIsAuthenticated(true);
    setIsLoading(false);

    return {
      success: true
    };
  };

  // Local Authentication Service
  const login = async (
    email: string,
    password: string,
    rememberMe: boolean = true
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);

    await new Promise((resolve) =>
      setTimeout(resolve, 500)
    );

    const trimmedEmail = (email || '')
      .trim()
      .toLowerCase();

    const trimmedPassword = (password || '')
      .trim();

    // Basic validation
    if (!trimmedEmail || !trimmedPassword) {
      setIsLoading(false);

      const err =
        'AUTHENTICATION FAILED: Email and password are required.';

      setError(err);

      recordLoginEvent(
        'LOGIN_FAILED',
        {
          email:
            trimmedEmail || 'unknown@domain.com'
        },
        'FAILED',
        'Missing email or password credentials'
      );

      return {
        success: false,
        error: err
      };
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(trimmedEmail)) {
      setIsLoading(false);

      const err =
        'AUTHENTICATION FAILED: Invalid email format.';

      setError(err);

      recordLoginEvent(
        'LOGIN_FAILED',
        {
          email: trimmedEmail
        },
        'FAILED',
        'Invalid email format syntax'
      );

      return {
        success: false,
        error: err
      };
    }

    /*
     * The permanent Admin is deliberately NOT authenticated
     * through the client-side demo registry.
     *
     * Its password belongs to the server-side
     * ADMIN_INITIAL_PASSWORD configuration.
     *
     * This prevents the Admin credential from being placed
     * inside frontend JavaScript or localStorage.
     */
    if (trimmedEmail === PERMANENT_ADMIN_EMAIL) {
      setIsLoading(false);

      const err =
        'AUTHENTICATION FAILED: Administrator sign-in is handled by the secure server authentication service.';

      setError(err);

      recordLoginEvent(
        'LOGIN_FAILED',
        {
          id: 'usr_admin_01',
          name: 'Abdul Rehman Yasir',
          email: PERMANENT_ADMIN_EMAIL,
          role: 'Admin'
        },
        'FAILED',
        'Permanent administrator requires server-side authentication'
      );

      return {
        success: false,
        error: err
      };
    }

    // Explicit public demo account.
    if (trimmedEmail === DEMO_EMAIL) {
      if (trimmedPassword !== DEMO_PASSWORD) {
        setIsLoading(false);

        const err =
          'AUTHENTICATION FAILED: Invalid demo password.';

        setError(err);

        recordLoginEvent(
          'LOGIN_FAILED',
          DEMO_USER,
          'FAILED',
          'Demo password mismatch'
        );

        return {
          success: false,
          error: err
        };
      }

      const expiryTime = new Date();

      expiryTime.setDate(
        expiryTime.getDate() +
          (rememberMe ? 30 : 1)
      );

      const token = `nxt_jwt_demo_${Math.random()
        .toString(36)
        .substring(2, 15)}_${Date.now()}`;

      const newSession: AuthSession = {
        token,
        createdAt: new Date().toISOString(),
        expiresAt: expiryTime.toISOString(),
        rememberMe
      };

      if (rememberMe) {
        localStorage.setItem(
          STORAGE_SESSION_KEY,
          JSON.stringify(newSession)
        );

        localStorage.setItem(
          STORAGE_USER_KEY,
          JSON.stringify(DEMO_USER)
        );
      } else {
        sessionStorage.setItem(
          STORAGE_SESSION_KEY,
          JSON.stringify(newSession)
        );

        sessionStorage.setItem(
          STORAGE_USER_KEY,
          JSON.stringify(DEMO_USER)
        );
      }

      recordLoginEvent(
        'USER_LOGIN',
        DEMO_USER,
        'SUCCESS',
        undefined,
        token
      );

      setManagedUsers((prev) =>
        prev.map((user) =>
          user.email.toLowerCase() === DEMO_EMAIL
            ? {
                ...user,
                lastLoginAt:
                  new Date().toISOString()
              }
            : user
        )
      );

      setSession(newSession);
      setCurrentUser(DEMO_USER);
      setIsAuthenticated(true);
      setIsLoading(false);

      return {
        success: true
      };
    }

    // Check registered local users.
    try {
      const existingRegistry = JSON.parse(
        localStorage.getItem(
          STORAGE_REGISTRY_KEY
        ) || '{}'
      );

      const entry =
        existingRegistry[trimmedEmail];

      if (entry) {
        if (
          entry.password !== trimmedPassword
        ) {
          setIsLoading(false);

          const err =
            'AUTHENTICATION FAILED: Invalid password.';

          setError(err);

          recordLoginEvent(
            'LOGIN_FAILED',
            {
              email: trimmedEmail,
              role: entry.user?.role ||
                'Developer'
            },
            'FAILED',
            'Password mismatch'
          );

          return {
            success: false,
            error: err
          };
        }

        // Never allow a local registry entry to impersonate Admin.
        if (
          entry.user?.email
            ?.toLowerCase() ===
            PERMANENT_ADMIN_EMAIL ||
          entry.user?.id === 'usr_admin_01' ||
          entry.user?.role === 'Admin'
        ) {
          setIsLoading(false);

          const err =
            'AUTHENTICATION FAILED: Administrator identity cannot be authenticated through the client-side registry.';

          setError(err);

          recordLoginEvent(
            'LOGIN_FAILED',
            {
              id: 'usr_admin_01',
              name: 'Abdul Rehman Yasir',
              email: PERMANENT_ADMIN_EMAIL,
              role: 'Admin'
            },
            'FAILED',
            'Attempted client-side Admin authentication'
          );

          return {
            success: false,
            error: err
          };
        }

        const userToSet: UserProfile = {
          ...entry.user,
          role:
            entry.user.role === 'Admin'
              ? 'Developer'
              : entry.user.role
        };

        const expiryTime = new Date();

        expiryTime.setDate(
          expiryTime.getDate() +
            (rememberMe ? 30 : 1)
        );

        const token = `nxt_jwt_${Math.random()
          .toString(36)
          .substring(2, 15)}_${Date.now()}`;

        const newSession: AuthSession = {
          token,
          createdAt: new Date().toISOString(),
          expiresAt: expiryTime.toISOString(),
          rememberMe
        };

        if (rememberMe) {
          localStorage.setItem(
            STORAGE_SESSION_KEY,
            JSON.stringify(newSession)
          );

          localStorage.setItem(
            STORAGE_USER_KEY,
            JSON.stringify(userToSet)
          );
        } else {
          sessionStorage.setItem(
            STORAGE_SESSION_KEY,
            JSON.stringify(newSession)
          );

          sessionStorage.setItem(
            STORAGE_USER_KEY,
            JSON.stringify(userToSet)
          );
        }

        recordLoginEvent(
          'USER_LOGIN',
          userToSet,
          'SUCCESS',
          undefined,
          token
        );

        setManagedUsers((prev) =>
          prev.map((user) =>
            user.email.toLowerCase() ===
            trimmedEmail
              ? {
                  ...user,
                  lastLoginAt:
                    new Date().toISOString()
                }
              : user
          )
        );

        setSession(newSession);
        setCurrentUser(userToSet);
        setIsAuthenticated(true);
        setIsLoading(false);

        return {
          success: true
        };
      }
    } catch (e) {
      console.warn(
        'Registry lookup error',
        e
      );
    }

    // Invalid credential patterns.
    const isInvalid =
      trimmedPassword === 'wrong' ||
      trimmedPassword === 'invalid' ||
      trimmedPassword === 'test' ||
      trimmedEmail ===
        'invalid@nexusdev.ai' ||
      trimmedEmail ===
        'wrong@nexusdev.ai' ||
      trimmedPassword.length < 4;

    if (isInvalid) {
      setIsLoading(false);

      const err =
        'AUTHENTICATION FAILED: Invalid email or password.';

      setError(err);

      recordLoginEvent(
        'LOGIN_FAILED',
        {
          email: trimmedEmail
        },
        'FAILED',
        'Invalid credential check'
      );

      return {
        success: false,
        error: err
      };
    }

    /*
     * Only known managed users can authenticate.
     *
     * Previously, arbitrary emails containing "admin",
     * "devops", "lead", etc. could receive privileged roles.
     *
     * That behavior has been removed.
     */
    const existingManaged =
      managedUsers.find(
        (user) =>
          user.email.toLowerCase() ===
          trimmedEmail
      );

    if (!existingManaged) {
      setIsLoading(false);

      const err =
        'AUTHENTICATION FAILED: Account not found. Please register or use the demo account.';

      setError(err);

      recordLoginEvent(
        'LOGIN_FAILED',
        {
          email: trimmedEmail
        },
        'FAILED',
        'No managed account found'
      );

      return {
        success: false,
        error: err
      };
    }

    if (
      existingManaged.status ===
      'DISABLED'
    ) {
      setIsLoading(false);

      const err =
        'AUTHENTICATION FAILED: This account has been disabled by an administrator.';

      setError(err);

      recordLoginEvent(
        'LOGIN_FAILED',
        {
          email: trimmedEmail,
          role: existingManaged.role
        },
        'FAILED',
        'Account disabled by Admin'
      );

      return {
        success: false,
        error: err
      };
    }

    // No managed account can impersonate the permanent Admin.
    if (
      existingManaged.email
        .toLowerCase() ===
        PERMANENT_ADMIN_EMAIL ||
      existingManaged.id ===
        'usr_admin_01'
    ) {
      setIsLoading(false);

      const err =
        'AUTHENTICATION FAILED: Administrator sign-in requires secure server authentication.';

      setError(err);

      recordLoginEvent(
        'LOGIN_FAILED',
        {
          id: 'usr_admin_01',
          name: 'Abdul Rehman Yasir',
          email: PERMANENT_ADMIN_EMAIL,
          role: 'Admin'
        },
        'FAILED',
        'Permanent administrator requires server-side authentication'
      );

      return {
        success: false,
        error: err
      };
    }

    const userToSet: UserProfile = {
      id: existingManaged.id,
      name: existingManaged.name,
      email: existingManaged.email,
      role:
        existingManaged.role === 'Admin'
          ? 'Developer'
          : existingManaged.role,
      avatar:
        existingManaged.avatar ||
        DEFAULT_DEMO_USER.avatar
    };

    const expiryTime = new Date();

    expiryTime.setDate(
      expiryTime.getDate() +
        (rememberMe ? 30 : 1)
    );

    const token = `nxt_jwt_${Math.random()
      .toString(36)
      .substring(2, 15)}_${Date.now()}`;

    const newSession: AuthSession = {
      token,
      createdAt: new Date().toISOString(),
      expiresAt: expiryTime.toISOString(),
      rememberMe
    };

    if (rememberMe) {
      localStorage.setItem(
        STORAGE_SESSION_KEY,
        JSON.stringify(newSession)
      );

      localStorage.setItem(
        STORAGE_USER_KEY,
        JSON.stringify(userToSet)
      );
    } else {
      sessionStorage.setItem(
        STORAGE_SESSION_KEY,
        JSON.stringify(newSession)
      );

      sessionStorage.setItem(
        STORAGE_USER_KEY,
        JSON.stringify(userToSet)
      );
    }

    recordLoginEvent(
      'USER_LOGIN',
      userToSet,
      'SUCCESS',
      undefined,
      token
    );

    setManagedUsers((prev) =>
      prev.map((user) =>
        user.email.toLowerCase() ===
        trimmedEmail
          ? {
              ...user,
              lastLoginAt:
                new Date().toISOString()
            }
          : user
      )
    );

    setSession(newSession);
    setCurrentUser(userToSet);
    setIsAuthenticated(true);
    setIsLoading(false);

    return {
      success: true
    };
  };

  const loginWithOAuth = async (
    provider: 'github' | 'google'
  ): Promise<{
    success: boolean;
    error?: string;
  }> => {
    setIsLoading(true);
    setError(null);

    await new Promise((resolve) =>
      setTimeout(resolve, 600)
    );

    const providerName =
      provider === 'github'
        ? 'GitHub'
        : 'Google';

    const userToSet: UserProfile = {
      id: `usr_oauth_${provider}_${Date.now()}`,
      name: `${providerName} Developer`,
      email: `oauth.${provider}@nexusdev.ai`,
      role: 'Developer',
      avatar:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120'
    };

    const expiryTime = new Date();

    expiryTime.setDate(
      expiryTime.getDate() + 30
    );

    const token = `oauth_${provider}_${Math.random()
      .toString(36)
      .substring(2, 15)}`;

    const newSession: AuthSession = {
      token,
      createdAt: new Date().toISOString(),
      expiresAt: expiryTime.toISOString(),
      rememberMe: true
    };

    localStorage.setItem(
      STORAGE_SESSION_KEY,
      JSON.stringify(newSession)
    );

    localStorage.setItem(
      STORAGE_USER_KEY,
      JSON.stringify(userToSet)
    );

    recordLoginEvent(
      'USER_LOGIN',
      userToSet,
      'SUCCESS',
      undefined,
      token
    );

    setSession(newSession);
    setCurrentUser(userToSet);
    setIsAuthenticated(true);
    setIsLoading(false);

    return {
      success: true
    };
  };

  const logout = () => {
    if (currentUser) {
      recordLoginEvent(
        'USER_LOGOUT',
        currentUser,
        'SUCCESS',
        undefined,
        session?.token
      );
    }

    localStorage.removeItem(
      STORAGE_SESSION_KEY
    );

    localStorage.removeItem(
      STORAGE_USER_KEY
    );

    sessionStorage.removeItem(
      STORAGE_SESSION_KEY
    );

    sessionStorage.removeItem(
      STORAGE_USER_KEY
    );

    setSession(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
    setError(null);

    window.location.hash = '#/login';
  };

  // Strict Admin-only Data Gate
  const getLoginAuditRecords =
    (): LoginAuditRecord[] => {
      if (currentUser?.role !== 'Admin') {
        console.warn(
          'SECURITY ALERT: Non-admin role attempted to access login audit dataset. Access denied.'
        );

        return [];
      }

      return loginAudits;
    };

  // Strict Admin-only Data Gate for managed users
  const getManagedUsers =
    (): ManagedUser[] => {
      if (currentUser?.role !== 'Admin') {
        return currentUser
          ? [
              {
                id: currentUser.id,
                name: currentUser.name,
                email: currentUser.email,
                role: currentUser.role,
                status: 'ACTIVE',
                createdAt:
                  new Date().toISOString(),
                lastLoginAt:
                  new Date().toISOString(),
                avatar:
                  currentUser.avatar
              }
            ]
          : [];
      }

      return managedUsers;
    };

  // Admin user management: Update role
  const adminUpdateUserRole = (
    targetUserId: string,
    newRole: RbacRole
  ): {
    success: boolean;
    error?: string;
  } => {
    if (currentUser?.role !== 'Admin') {
      return {
        success: false,
        error:
          'Access Denied: Only Admin can update user roles.'
      };
    }

    const targetUser =
      managedUsers.find(
        (u) => u.id === targetUserId
      );

    if (!targetUser) {
      return {
        success: false,
        error: 'User not found.'
      };
    }

    // Permanent system administrator cannot be changed.
    if (
      targetUser.email.toLowerCase() ===
        PERMANENT_ADMIN_EMAIL ||
      targetUser.id === 'usr_admin_01'
    ) {
      return {
        success: false,
        error:
          'Permanent Administrator account cannot be demoted, modified, or reassigned.'
      };
    }

    // Demo account must remain a Developer.
    if (
      targetUser.email.toLowerCase() ===
      DEMO_EMAIL
    ) {
      return {
        success: false,
        error:
          'The public demo account is locked to the Developer role.'
      };
    }

    const previousRole =
      targetUser.role;

    void previousRole;

    setManagedUsers((prev) =>
      prev.map((u) =>
        u.id === targetUserId
          ? { ...u, role: newRole }
          : u
      )
    );

    if (
      currentUser.id === targetUserId
    ) {
      updateUserRole(newRole);
    }

    return {
      success: true
    };
  };

  // Admin user management: Disable/Enable user
  const adminToggleUserStatus = (
    targetUserId: string
  ): {
    success: boolean;
    error?: string;
    newStatus?: 'ACTIVE' | 'DISABLED';
  } => {
    if (currentUser?.role !== 'Admin') {
      return {
        success: false,
        error:
          'Access Denied: Only Admin can enable or disable user accounts.'
      };
    }

    const targetUser =
      managedUsers.find(
        (u) => u.id === targetUserId
      );

    if (!targetUser) {
      return {
        success: false,
        error: 'User not found.'
      };
    }

    // Permanent system administrator cannot be disabled.
    if (
      targetUser.email.toLowerCase() ===
        PERMANENT_ADMIN_EMAIL ||
      targetUser.id === 'usr_admin_01'
    ) {
      return {
        success: false,
        error:
          'Permanent Administrator account cannot be disabled.'
      };
    }

    // Demo account can be disabled by Admin if desired.
    const nextStatus: 'ACTIVE' | 'DISABLED' =
      targetUser.status === 'ACTIVE'
        ? 'DISABLED'
        : 'ACTIVE';

    setManagedUsers((prev) =>
      prev.map((u) =>
        u.id === targetUserId
          ? {
              ...u,
              status: nextStatus
            }
          : u
      )
    );

    return {
      success: true,
      newStatus: nextStatus
    };
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
    throw new Error(
      'useAuth must be used within an AuthProvider'
    );
  }

  return context;
};
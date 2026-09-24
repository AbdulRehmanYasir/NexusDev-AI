import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Terminal,
  Activity,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Cpu,
  Key,
  X,
  User,
  Check,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { RbacRole } from '../types';

interface LoginViewProps {
  onLoginSuccess?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const { login, register, loginWithOAuth, loginWithRecoveryCode, isLoading, error, clearError } = useAuth();

  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');

  // Sign in state
  const [email, setEmail] = useState<string>('admin@nexusdev.ai');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  // Register state
  const [regName, setRegName] = useState<string>('Abdul Rehman Yasir');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');
  const [regRole, setRegRole] = useState<RbacRole>('Developer');
  const [showRegPassword, setShowRegPassword] = useState<boolean>(false);

  // Field validation errors
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    name?: string;
    confirmPassword?: string;
    recoveryCode?: string;
  }>({});
  const [oauthLoading, setOauthLoading] = useState<'github' | 'google' | null>(null);

  // Recovery & Forgot password modal state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState<boolean>(false);
  const [recoveryTab, setRecoveryTab] = useState<'code' | 'email'>('code');
  const [recoveryCodeInput, setRecoveryCodeInput] = useState<string>('NEX-8F92-4A1B');
  const [forgotEmail, setForgotEmail] = useState<string>('admin@nexusdev.ai');
  const [forgotStatus, setForgotStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [recoveryError, setRecoveryError] = useState<string | null>(null);

  // Real client-side form validation
  const validateSignInForm = (): boolean => {
    const errors: { email?: string; password?: string } = {};
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail) {
      errors.email = 'Email address is required.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        errors.email = 'Please enter a valid work email address.';
      }
    }

    if (!trimmedPassword) {
      errors.password = 'Password is required.';
    } else if (trimmedPassword.length < 4) {
      errors.password = 'Password must be at least 4 characters.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateRegisterForm = (): boolean => {
    const errors: { name?: string; email?: string; password?: string; confirmPassword?: string } = {};
    const trimmedName = regName.trim();
    const trimmedEmail = regEmail.trim();
    const trimmedPassword = regPassword.trim();
    const trimmedConfirm = regConfirmPassword.trim();

    if (!trimmedName) {
      errors.name = 'Full name is required.';
    }

    if (!trimmedEmail) {
      errors.email = 'Work email is required.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        errors.email = 'Please enter a valid email address.';
      }
    }

    if (!trimmedPassword) {
      errors.password = 'Password is required.';
    } else if (trimmedPassword.length < 4) {
      errors.password = 'Password must be at least 4 characters.';
    }

    if (trimmedPassword !== trimmedConfirm) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateSignInForm()) {
      return;
    }

    const res = await login(email, password, rememberMe);
    if (res.success) {
      if (onLoginSuccess) {
        onLoginSuccess();
      } else {
        window.location.hash = '#/dashboard';
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateRegisterForm()) {
      return;
    }

    const res = await register(regName, regEmail, regPassword, regRole, true);
    if (res.success) {
      if (onLoginSuccess) {
        onLoginSuccess();
      } else {
        window.location.hash = '#/dashboard';
      }
    }
  };

  const handleOAuthLogin = async (provider: 'github' | 'google') => {
    clearError();
    setOauthLoading(provider);
    try {
      const res = await loginWithOAuth(provider);
      if (res.success) {
        if (onLoginSuccess) {
          onLoginSuccess();
        } else {
          window.location.hash = '#/dashboard';
        }
      }
    } finally {
      setOauthLoading(null);
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setFieldErrors({});
    clearError();
  };

  const handleRecoveryCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);
    if (!forgotEmail.trim() || !recoveryCodeInput.trim()) {
      setRecoveryError('Email and recovery code are required.');
      return;
    }
    const res = await loginWithRecoveryCode(forgotEmail, recoveryCodeInput);
    if (res.success) {
      setIsForgotModalOpen(false);
      if (onLoginSuccess) {
        onLoginSuccess();
      } else {
        window.location.hash = '#/dashboard';
      }
    } else {
      setRecoveryError(res.error || 'Invalid recovery code.');
    }
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotStatus('sending');
    setTimeout(() => {
      setForgotStatus('sent');
    }, 800);
  };

  const roleOptions: { role: RbacRole; label: string; desc: string }[] = [
    { role: 'Developer', label: 'Developer', desc: 'Code workspace, test execution, branch creation' },
    { role: 'TechLead', label: 'Tech Lead', desc: 'PR approval, architecture & pipeline lead' },
    { role: 'DevOps', label: 'DevOps', desc: 'Infrastructure, cluster deployment & incidents' },
    { role: 'Viewer', label: 'Viewer', desc: 'Read-only telemetry, audit logs & metrics' }
  ];

  return (
    <div
      id="nexus-login-canvas"
      className="min-h-screen h-[100dvh] w-screen bg-[#0A0B0D] text-[#E0E0E0] font-mono flex flex-col justify-between relative overflow-x-hidden overflow-y-auto selection:bg-emerald-500/30 selection:text-emerald-200"
    >
      {/* Background Matrix/Grid Technical Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#1A1D23_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[280px] bg-emerald-500/5 blur-[120px] pointer-events-none" />

      {/* Top Bar Status */}
      <header className="relative z-10 w-full px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between border-b border-[#1F2937]/60 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
            <Terminal className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold tracking-wider text-white">NEXUSDEV AI</span>
            <span className="text-[#374151]">/</span>
            <span className="text-gray-400 text-[10px] sm:text-[11px]">CONTROL_PLANE_GATEWAY</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[10px] sm:text-[11px]">
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#1A1D23] border border-[#2D3748] text-gray-400">
            <Cpu className="w-3 h-3 text-emerald-400" />
            <span>gVisor Sandbox Isolation: Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-medium text-[10px]">ALL SYSTEMS OPERATIONAL</span>
          </div>
        </div>
      </header>

      {/* Center Auth Panel */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-3 sm:py-5">
        <div
          id="login-auth-panel"
          className="w-full max-w-[440px] bg-[#1A1D23] border border-[#2D3748] rounded-xl shadow-2xl p-4 sm:p-6 relative my-auto"
        >
          {/* Subtle Technical Corner Accents */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-emerald-500/60 rounded-tl-sm pointer-events-none" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-emerald-500/60 rounded-tr-sm pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-emerald-500/60 rounded-bl-sm pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-emerald-500/60 rounded-br-sm pointer-events-none" />

          {/* Panel Header */}
          <div className="text-center mb-3 sm:mb-4">
            <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#0A0B0D] border border-[#2D3748] mb-2 text-emerald-400 shadow-inner">
              <Shield className="w-4.5 h-4.5" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white font-mono">
              NEXUSDEV AI
            </h1>
            <p className="text-[10px] sm:text-[11px] text-gray-400 tracking-wider mt-0.5 uppercase">
              AI ENGINEERING CONTROL PLANE
            </p>
          </div>

          {/* Mode Switcher Tabs: SIGN IN vs CREATE ACCOUNT */}
          <div className="flex rounded-lg bg-[#0A0B0D] p-1 border border-[#2D3748] mb-3">
            <button
              type="button"
              id="tab-signin"
              onClick={() => {
                setAuthMode('signin');
                clearError();
                setFieldErrors({});
              }}
              className={`flex-1 py-1.5 text-center text-xs font-bold rounded-md transition cursor-pointer ${
                authMode === 'signin'
                  ? 'bg-[#1A1D23] text-emerald-400 border border-[#374151] shadow-xs'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              SIGN IN
            </button>
            <button
              type="button"
              id="tab-register"
              onClick={() => {
                setAuthMode('register');
                clearError();
                setFieldErrors({});
              }}
              className={`flex-1 py-1.5 text-center text-xs font-bold rounded-md transition cursor-pointer ${
                authMode === 'register'
                  ? 'bg-[#1A1D23] text-emerald-400 border border-[#374151] shadow-xs'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              CREATE ACCOUNT
            </button>
          </div>

          {/* Global Error Banner */}
          {error && (
            <div
              id="login-error-banner"
              className="mb-3 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2 animate-in fade-in duration-200"
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400 mt-0.5" />
              <div className="flex-1">
                <div className="font-bold tracking-wide uppercase text-[10px]">AUTHENTICATION FAILED</div>
                <div className="text-[10px] text-rose-300/90 mt-0.5">
                  {typeof error === 'string' && (error.includes('AUTHENTICATION FAILED:') || error.includes('REGISTRATION FAILED:'))
                    ? error.replace(/^(AUTHENTICATION|REGISTRATION) FAILED:\s*/, '')
                    : String(error || '')}
                </div>
              </div>
              <button
                type="button"
                onClick={clearError}
                className="text-rose-400 hover:text-rose-200 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {authMode === 'signin' ? (
            <>
              {/* Quick Demo Credentials Autofill Pill */}
              <div className="mb-3 p-2 rounded-lg bg-[#0A0B0D] border border-[#2D3748] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-gray-400 text-[10px] sm:text-[11px] truncate">
                  <Key className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <div className="truncate">
                    <div className="text-gray-300 font-semibold leading-tight">Demo Account</div>
                    <div className="text-[9px] sm:text-[10px] text-gray-500 truncate">demo@nexusdev.ai / demo2026</div>
                  </div>
                </div>
                <button
                  type="button"
                  id="autofill-demo-btn"
                  onClick={() => handleQuickFill('demo@nexusdev.ai', 'demo2026')}
                  className="px-2 py-1 rounded bg-[#1A1D23] hover:bg-[#2D3748] border border-[#374151] text-[9px] sm:text-[10px] text-emerald-400 font-semibold transition cursor-pointer hover:text-emerald-300 shrink-0 ml-2"
                >
                  AUTO-FILL
                </button>
              </div>

              {/* Sign In Form */}
              <form onSubmit={handleSignIn} className="space-y-2.5 sm:space-y-3">
                {/* Email Field */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="login-email-input"
                      className="text-[11px] font-medium text-gray-300 tracking-wide flex items-center gap-1.5"
                    >
                      <Mail className="w-3 h-3 text-gray-500" />
                      Email
                    </label>
                    {fieldErrors.email && (
                      <span className="text-[9px] text-rose-400 font-mono">{fieldErrors.email}</span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      id="login-email-input"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (fieldErrors.email) {
                          setFieldErrors((prev) => ({ ...prev, email: undefined }));
                        }
                        if (error) clearError();
                      }}
                      disabled={isLoading}
                      placeholder="developer@nexusdev.ai"
                      className={`w-full px-3 py-1.5 sm:py-2 bg-[#0A0B0D] border rounded-lg text-xs text-white placeholder-gray-600 focus:outline-hidden transition font-mono ${
                        fieldErrors.email
                          ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                          : 'border-[#2D3748] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                      }`}
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="login-password-input"
                      className="text-[11px] font-medium text-gray-300 tracking-wide flex items-center gap-1.5"
                    >
                      <Lock className="w-3 h-3 text-gray-500" />
                      Password
                    </label>
                    {fieldErrors.password && (
                      <span className="text-[9px] text-rose-400 font-mono">{fieldErrors.password}</span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      id="login-password-input"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (fieldErrors.password) {
                          setFieldErrors((prev) => ({ ...prev, password: undefined }));
                        }
                        if (error) clearError();
                      }}
                      disabled={isLoading}
                      placeholder="••••••••••••"
                      className={`w-full px-3 py-1.5 sm:py-2 pr-9 bg-[#0A0B0D] border rounded-lg text-xs text-white placeholder-gray-600 focus:outline-hidden transition font-mono ${
                        fieldErrors.password
                          ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                          : 'border-[#2D3748] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                      }`}
                      required
                    />
                    <button
                      type="button"
                      id="toggle-password-visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition cursor-pointer p-0.5"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between pt-0.5 text-xs">
                  <label
                    htmlFor="login-remember-me"
                    className="flex items-center gap-1.5 text-gray-400 hover:text-gray-300 cursor-pointer select-none text-[11px]"
                  >
                    <input
                      id="login-remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      disabled={isLoading}
                      className="w-3.5 h-3.5 rounded bg-[#0A0B0D] border-[#2D3748] text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 focus:ring-offset-transparent cursor-pointer"
                    />
                    <span>Remember me</span>
                  </label>

                  <button
                    type="button"
                    id="forgot-password-link"
                    onClick={() => {
                      setForgotEmail(email);
                      setForgotStatus('idle');
                      setIsForgotModalOpen(true);
                    }}
                    className="text-gray-400 hover:text-emerald-400 transition text-[10px] sm:text-[11px] underline underline-offset-2 cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* SIGN IN Button */}
                <div className="pt-1">
                  <button
                    type="submit"
                    id="login-submit-button"
                    disabled={isLoading || oauthLoading !== null}
                    className="w-full py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-black font-bold text-xs tracking-wider transition uppercase flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_12px_rgba(16,185,129,0.25)] hover:shadow-[0_0_16px_rgba(16,185,129,0.4)]"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        <span>AUTHENTICATING...</span>
                      </>
                    ) : (
                      <>
                        <span>SIGN IN</span>
                        <ArrowRight className="w-3 h-3" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Divider: OR */}
              <div className="relative my-3 sm:my-3.5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#2D3748]" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-[#1A1D23] text-gray-500 text-[9px] font-mono uppercase tracking-widest">
                    OR
                  </span>
                </div>
              </div>

              {/* OAuth Buttons */}
              <div className="space-y-2">
                <button
                  type="button"
                  id="oauth-github-button"
                  onClick={() => handleOAuthLogin('github')}
                  disabled={isLoading || oauthLoading !== null}
                  className="w-full py-1.5 sm:py-2 px-3 rounded-lg bg-[#0A0B0D] hover:bg-[#20252E] border border-[#2D3748] hover:border-[#3E4A5E] text-white text-[11px] font-medium transition flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                >
                  {oauthLoading === 'github' ? (
                    <>
                      <div className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                      <span className="text-gray-300 text-[10px]">AUTHENTICATING WITH GITHUB...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5 fill-current text-white" viewBox="0 0 24 24">
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                        />
                      </svg>
                      <span>Continue with GitHub</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  id="oauth-google-button"
                  onClick={() => handleOAuthLogin('google')}
                  disabled={isLoading || oauthLoading !== null}
                  className="w-full py-1.5 sm:py-2 px-3 rounded-lg bg-[#0A0B0D] hover:bg-[#20252E] border border-[#2D3748] hover:border-[#3E4A5E] text-white text-[11px] font-medium transition flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                >
                  {oauthLoading === 'google' ? (
                    <>
                      <div className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                      <span className="text-gray-300 text-[10px]">AUTHENTICATING WITH GOOGLE...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>Continue with Google</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            /* Registration Form with Role Selection */
            <form onSubmit={handleRegister} className="space-y-2.5">
              {/* Full Name */}
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <label className="text-[11px] font-medium text-gray-300 tracking-wide flex items-center gap-1.5">
                    <User className="w-3 h-3 text-gray-500" />
                    Full Name
                  </label>
                  {fieldErrors.name && (
                    <span className="text-[9px] text-rose-400 font-mono">{fieldErrors.name}</span>
                  )}
                </div>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => {
                    setRegName(e.target.value);
                    if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: undefined }));
                    if (error) clearError();
                  }}
                  disabled={isLoading}
                  placeholder="Abdul Rehman Yasir"
                  className="w-full px-3 py-1.5 bg-[#0A0B0D] border border-[#2D3748] focus:border-emerald-500 rounded-lg text-xs text-white placeholder-gray-600 focus:outline-hidden font-mono"
                  required
                />
              </div>

              {/* Work Email */}
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <label className="text-[11px] font-medium text-gray-300 tracking-wide flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-gray-500" />
                    Work Email
                  </label>
                  {fieldErrors.email && (
                    <span className="text-[9px] text-rose-400 font-mono">{fieldErrors.email}</span>
                  )}
                </div>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => {
                    setRegEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
                    if (error) clearError();
                  }}
                  disabled={isLoading}
                  placeholder="developer@nexusdev.ai"
                  className="w-full px-3 py-1.5 bg-[#0A0B0D] border border-[#2D3748] focus:border-emerald-500 rounded-lg text-xs text-white placeholder-gray-600 focus:outline-hidden font-mono"
                  required
                />
              </div>

              {/* Password & Confirm Password in 2 columns */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-gray-300 tracking-wide block mb-0.5">
                    Password
                  </label>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => {
                      setRegPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
                      if (error) clearError();
                    }}
                    disabled={isLoading}
                    placeholder="••••••••"
                    className="w-full px-2.5 py-1.5 bg-[#0A0B0D] border border-[#2D3748] focus:border-emerald-500 rounded-lg text-xs text-white placeholder-gray-600 focus:outline-hidden font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-gray-300 tracking-wide block mb-0.5">
                    Confirm Password
                  </label>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    value={regConfirmPassword}
                    onChange={(e) => {
                      setRegConfirmPassword(e.target.value);
                      if (fieldErrors.confirmPassword) setFieldErrors((p) => ({ ...p, confirmPassword: undefined }));
                      if (error) clearError();
                    }}
                    disabled={isLoading}
                    placeholder="••••••••"
                    className="w-full px-2.5 py-1.5 bg-[#0A0B0D] border border-[#2D3748] focus:border-emerald-500 rounded-lg text-xs text-white placeholder-gray-600 focus:outline-hidden font-mono"
                    required
                  />
                </div>
              </div>
              {(fieldErrors.password || fieldErrors.confirmPassword) && (
                <div className="text-[9px] text-rose-400 font-mono">
                  {fieldErrors.password || fieldErrors.confirmPassword}
                </div>
              )}

              {/* Role Selection Dropdown / Selector */}
              <div>
                <label className="text-[11px] font-medium text-gray-300 tracking-wide block mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Shield className="w-3 h-3 text-emerald-400" />
                    Select Account Role (RBAC)
                  </span>
                  <span className="text-[9px] text-emerald-400 font-mono">Selected: {regRole}</span>
                </label>
                <div className="grid grid-cols-1 gap-1 max-h-36 overflow-y-auto pr-1">
                  {roleOptions.map((opt) => {
                    const isSelected = regRole === opt.role;
                    return (
                      <button
                        type="button"
                        key={opt.role}
                        onClick={() => setRegRole(opt.role)}
                        className={`w-full p-1.5 rounded-md border text-left transition cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#0A0B0D] border-emerald-500/60 shadow-xs'
                            : 'bg-[#0F1115] border-[#2D3748] hover:border-[#3E4A5E]'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[11px] font-bold font-mono ${
                                isSelected ? 'text-emerald-400' : 'text-gray-300'
                              }`}
                            >
                              {opt.label}
                            </span>
                          </div>
                          <p className="text-[9px] text-gray-500 truncate leading-tight mt-0.5 font-sans">
                            {opt.desc}
                          </p>
                        </div>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Create Account Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  id="register-submit-button"
                  disabled={isLoading}
                  className="w-full py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-black font-bold text-xs tracking-wider transition uppercase flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                >
                  {isLoading ? (
                    <>
                      <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>PROVISIONING ACCOUNT...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>CREATE ACCOUNT & LAUNCH</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Dedicated Branding at Bottom of Login Panel */}
          <div className="mt-4 pt-3 border-t border-[#2D3748] text-center">
            <p className="text-[11px] font-mono text-gray-400 tracking-tight">
              Developed by <span className="text-gray-200 font-bold">Abdul Rehman Yasir</span>
            </p>
          </div>
        </div>
      </main>

      {/* Footer Metadata & Branding */}
      <footer className="relative z-10 w-full px-4 sm:px-6 py-2 border-t border-[#1F2937]/60 flex flex-col sm:flex-row items-center justify-between gap-1 text-[10px] text-gray-500 font-mono shrink-0">
        <div>
          <span>NEXUSDEV AI CONTROL PLANE</span>
          <span className="mx-2 text-[#374151]">|</span>
          <span>ENTERPRISE AIR-GAPPED READY</span>
        </div>
        <div className="text-gray-400">
          Developed by <span className="text-gray-300 font-semibold">Abdul Rehman Yasir</span>
        </div>
        <div className="flex items-center gap-3">
          <span>REGION: US-EAST-1</span>
          <span>CLUSTER: NEBULA_PROD</span>
        </div>
      </footer>

      {/* Recovery & Reset Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs font-mono">
          <div className="w-full max-w-md max-h-[min(90vh,600px)] flex flex-col bg-[#1A1D23] border border-[#2D3748] rounded-xl shadow-2xl overflow-hidden relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#2D3748] shrink-0 bg-[#14171C]">
              <div className="flex items-center gap-2 text-emerald-400">
                <Key className="w-4 h-4" />
                <span className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">Account Recovery & Reset</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsForgotModalOpen(false);
                  setRecoveryError(null);
                  setForgotStatus('idle');
                }}
                className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-500/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Recovery Mode Selector Tabs */}
            <div className="flex border-b border-[#2D3748] bg-[#0A0B0D] shrink-0">
              <button
                type="button"
                onClick={() => setRecoveryTab('code')}
                className={`flex-1 py-2 text-[11px] font-bold text-center border-b-2 transition cursor-pointer ${
                  recoveryTab === 'code'
                    ? 'border-emerald-500 text-emerald-400 bg-[#1A1D23]'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                2FA RECOVERY CODE
              </button>
              <button
                type="button"
                onClick={() => setRecoveryTab('email')}
                className={`flex-1 py-2 text-[11px] font-bold text-center border-b-2 transition cursor-pointer ${
                  recoveryTab === 'email'
                    ? 'border-emerald-500 text-emerald-400 bg-[#1A1D23]'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                EMAIL MAGIC LINK
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
              {recoveryTab === 'code' ? (
                <form onSubmit={handleRecoveryCodeSubmit} className="space-y-3.5">
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Lost access to your 2FA authenticator app? Enter your account email and one of your 10 single-use emergency backup recovery codes.
                  </p>

                  {recoveryError && (
                    <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[11px] font-mono flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{recoveryError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-medium text-gray-300 mb-1">Account Work Email</label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      className="w-full px-3 py-1.5 sm:py-2 bg-[#0A0B0D] border border-[#2D3748] rounded text-xs text-white focus:outline-hidden focus:border-emerald-500 font-mono"
                      placeholder="admin@nexusdev.ai"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-medium text-gray-300">One-Time Recovery Code</label>
                      <span className="text-[10px] text-gray-500 font-mono">Format: NEX-XXXX-XXXX</span>
                    </div>
                    <input
                      type="text"
                      value={recoveryCodeInput}
                      onChange={(e) => setRecoveryCodeInput(e.target.value.toUpperCase())}
                      required
                      className="w-full px-3 py-1.5 sm:py-2 bg-[#0A0B0D] border border-[#2D3748] rounded text-xs text-emerald-400 font-mono font-bold focus:outline-hidden focus:border-emerald-500 uppercase tracking-wider"
                      placeholder="NEX-8F92-4A1B"
                    />
                  </div>

                  <div className="p-2.5 rounded bg-[#0A0B0D] border border-[#2D3748] text-[10px] text-gray-400 space-y-1">
                    <div className="text-gray-300 font-semibold">Security Policy:</div>
                    <div>• The used recovery code is permanently burned and invalidated immediately.</div>
                    <div>• Once signed in, check your Security settings to view your remaining codes.</div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#2D3748]">
                    <button
                      type="button"
                      onClick={() => setIsForgotModalOpen(false)}
                      className="px-3 py-1.5 rounded bg-[#0A0B0D] hover:bg-[#20252E] text-gray-400 text-xs border border-[#2D3748] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-4 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? 'VERIFYING...' : 'AUTHENTICATE VIA RECOVERY CODE'}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  {forgotStatus === 'sent' ? (
                    <div className="text-center py-4 space-y-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h3 className="text-sm font-bold text-white">RECOVERY DISPATCHED</h3>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        A cryptographic password reset token and verification magic link have been sent to{' '}
                        <span className="text-emerald-400 font-bold">{forgotEmail}</span>.
                      </p>
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => setIsForgotModalOpen(false)}
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded transition cursor-pointer"
                        >
                          RETURN TO SIGN IN
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Enter your registered enterprise email address. The authentication service will generate a secure one-time passcode (OTP).
                      </p>
                      <div>
                        <label className="block text-xs text-gray-300 mb-1">Work Email</label>
                        <input
                          type="email"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          required
                          className="w-full px-3 py-2 bg-[#0A0B0D] border border-[#2D3748] rounded text-xs text-white focus:outline-hidden focus:border-emerald-500 font-mono"
                          placeholder="admin@nexusdev.ai"
                        />
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#2D3748]">
                        <button
                          type="button"
                          onClick={() => setIsForgotModalOpen(false)}
                          className="px-3 py-1.5 rounded bg-[#0A0B0D] hover:bg-[#20252E] text-gray-400 text-xs border border-[#2D3748] cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={forgotStatus === 'sending'}
                          className="px-4 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition cursor-pointer disabled:opacity-50"
                        >
                          {forgotStatus === 'sending' ? 'DISPATCHING...' : 'DISPATCH RESET LINK'}
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


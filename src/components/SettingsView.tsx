import React, { useState } from 'react';
import {
  User,
  Shield,
  KeyRound,
  Bell,
  Sliders,
  Palette,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  Laptop,
  Globe,
  Trash2,
  Save,
  ShieldCheck,
  ArrowRight,
  Sun,
  Moon,
  Eye,
  EyeOff,
  Copy,
  Check
} from 'lucide-react';
import { RbacRole } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import confetti from 'canvas-confetti';

interface SettingsViewProps {
  currentRole: RbacRole;
  onRoleChange?: (role: RbacRole) => void;
  onNavigate?: (view: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentRole,
  onNavigate
}) => {
  const { theme, toggleTheme, isDark } = useTheme();
  const {
    currentUser,
    session,
    twoFactorDetails,
    recoveryCodes,
    generateNewRecoveryCodes
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'appearance' | 'notifications' | 'preferences'>('profile');

  // Profile Form State
  const [name, setName] = useState(currentUser?.name || 'Abdul Rehman Yasir');
  const [email] = useState(currentUser?.email || 'admin@nexusdev.ai');
  const [department, setDepartment] = useState('Core Engineering & Platform');
  const [bio, setBio] = useState('Autonomous DevOps and SRE Infrastructure engineer.');

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(twoFactorDetails?.enabled ?? true);
  const [copiedCodes, setCopiedCodes] = useState(false);

  // Appearance & Editor State
  const [editorFont, setEditorFont] = useState('JetBrains Mono');
  const [editorFontSize, setEditorFontSize] = useState('13px');
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [compactSidebar, setCompactSidebar] = useState(false);

  // Notification Preferences State
  const [notifyIncidents, setNotifyIncidents] = useState(true);
  const [notifyPRs, setNotifyPRs] = useState(true);
  const [notifyPipelines, setNotifyPipelines] = useState(true);
  const [notifySecurity, setNotifySecurity] = useState(true);
  const [soundEffects, setSoundEffects] = useState(false);

  // Workspace Preferences State
  const [defaultBranch, setDefaultBranch] = useState('main');
  const [autoSaveInterval, setAutoSaveInterval] = useState('30s');
  const [diffViewMode, setDiffViewMode] = useState<'split' | 'unified'>('split');

  // Feedback notifications
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccessMsg('Personal profile settings updated successfully.');
    setTimeout(() => setSaveSuccessMsg(null), 3500);
    try {
      confetti({ particleCount: 30, spread: 40, origin: { y: 0.7 } });
    } catch {}
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!currentPassword) {
      setErrorMsg('Please enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMsg('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match.');
      return;
    }

    setSaveSuccessMsg('Password updated successfully. Active sessions refreshed.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  const handleCopyRecoveryCodes = () => {
    const text = recoveryCodes.join('\n');
    navigator.clipboard.writeText(text);
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  return (
    <div
      id="user-settings-view"
      className={`flex-1 w-full h-full overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 font-mono transition-colors duration-150 ${
        isDark ? 'bg-[#0A0B0D] text-[#E0E0E0]' : 'bg-[#F8FAFC] text-[#0F172A]'
      }`}
    >
      {/* Admin Gateway Notice (If Admin) */}
      {currentRole === 'Admin' && (
        <div
          className={`mb-6 p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs ${
            isDark
              ? 'bg-purple-950/20 border-purple-500/30 text-purple-200'
              : 'bg-purple-50 border-purple-200 text-purple-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs">ADMINISTRATIVE ACCESS DETECTED</div>
              <div className="text-[11px] font-sans text-purple-400">
                You are authenticated as the permanent System Administrator. Administrative governance and RBAC matrix controls are separated into Governance.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('governance')}
            className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs"
          >
            <span>Open Governance</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              PERSONAL SETTINGS
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-500/20 text-gray-400 border border-gray-500/30">
              ROLE: {currentRole.toUpperCase()}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight mt-1 flex items-center gap-2.5">
            <Sliders className="w-6 h-6 text-emerald-500" />
            User Account & Preferences
          </h1>
          <p className={`text-xs mt-1 font-sans ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage your personal profile, security credentials, active sessions, theme, and workspace preferences.
          </p>
        </div>
      </div>

      {/* Feedback Messages */}
      {saveSuccessMsg && (
        <div className="mt-4 p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="mt-4 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-800/80 mt-6 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'profile'
              ? 'bg-emerald-600 text-white shadow-xs'
              : isDark
              ? 'text-gray-400 hover:text-white hover:bg-[#13161C]'
              : 'text-gray-600 hover:text-black hover:bg-gray-200'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          Profile & Identity
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'security'
              ? 'bg-emerald-600 text-white shadow-xs'
              : isDark
              ? 'text-gray-400 hover:text-white hover:bg-[#13161C]'
              : 'text-gray-600 hover:text-black hover:bg-gray-200'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          Password & 2FA
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('appearance')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'appearance'
              ? 'bg-emerald-600 text-white shadow-xs'
              : isDark
              ? 'text-gray-400 hover:text-white hover:bg-[#13161C]'
              : 'text-gray-600 hover:text-black hover:bg-gray-200'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          Appearance & Editor
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'notifications'
              ? 'bg-emerald-600 text-white shadow-xs'
              : isDark
              ? 'text-gray-400 hover:text-white hover:bg-[#13161C]'
              : 'text-gray-600 hover:text-black hover:bg-gray-200'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          Notifications
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('preferences')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'preferences'
              ? 'bg-emerald-600 text-white shadow-xs'
              : isDark
              ? 'text-gray-400 hover:text-white hover:bg-[#13161C]'
              : 'text-gray-600 hover:text-black hover:bg-gray-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          Workspace Preferences
        </button>
      </div>

      {/* TAB 1: PROFILE & IDENTITY */}
      {activeTab === 'profile' && (
        <div className="mt-6 max-w-3xl space-y-6">
          <form onSubmit={handleSaveProfile} className={`p-5 rounded-xl border shadow-sm ${
            isDark ? 'bg-[#0F1115] border-[#1F242F]' : 'bg-white border-gray-200'
          }`}>
            <h3 className="text-sm font-bold flex items-center gap-2 text-emerald-400">
              <User className="w-4 h-4" />
              Personal Profile Information
            </h3>
            <p className={`text-xs mt-1 font-sans ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Your public engineering identity across repositories, PR reviews, and incident tickets.
            </p>

            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-xs font-mono focus:outline-hidden ${
                      isDark
                        ? 'bg-[#161920] border-[#2A2E39] text-white focus:border-emerald-500'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-emerald-500'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className={`w-full px-3 py-2 rounded-lg border text-xs font-mono opacity-80 cursor-not-allowed ${
                      isDark ? 'bg-[#13161C] border-[#222733] text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-500'
                    }`}
                  />
                  <span className="text-[10px] text-gray-500 mt-1 block">Email is bound to enterprise SSO identity.</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5">Assigned Role</label>
                  <div className={`px-3 py-2 rounded-lg border flex items-center justify-between ${
                    isDark ? 'bg-[#13161C] border-[#222733]' : 'bg-gray-100 border-gray-300'
                  }`}>
                    <span className="text-xs font-bold text-emerald-400">ROLE: {currentRole.toUpperCase()}</span>
                    <span className="text-[10px] text-gray-500 font-sans">Read-only (Enterprise Managed)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5">Department / Pod</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-xs font-mono focus:outline-hidden ${
                      isDark
                        ? 'bg-[#161920] border-[#2A2E39] text-white focus:border-emerald-500'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-emerald-500'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5">Engineering Bio</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-xs font-mono focus:outline-hidden ${
                    isDark
                      ? 'bg-[#161920] border-[#2A2E39] text-white focus:border-emerald-500'
                      : 'bg-white border-gray-300 text-gray-900 focus:border-emerald-500'
                  }`}
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer flex items-center gap-2 shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Profile Changes
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: PASSWORD & 2FA */}
      {activeTab === 'security' && (
        <div className="mt-6 max-w-3xl space-y-6">
          {/* Password Form */}
          <form onSubmit={handleUpdatePassword} className={`p-5 rounded-xl border shadow-sm ${
            isDark ? 'bg-[#0F1115] border-[#1F242F]' : 'bg-white border-gray-200'
          }`}>
            <h3 className="text-sm font-bold flex items-center gap-2 text-emerald-400">
              <KeyRound className="w-4 h-4" />
              Update Account Password
            </h3>
            <p className={`text-xs mt-1 font-sans ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Ensure your password has at least 8 characters including letters, numbers, and symbols.
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1.5">Current Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password..."
                    className={`w-full px-3 py-2 pr-10 rounded-lg border text-xs font-mono focus:outline-hidden ${
                      isDark
                        ? 'bg-[#161920] border-[#2A2E39] text-white focus:border-emerald-500'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-emerald-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5">New Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters..."
                    className={`w-full px-3 py-2 rounded-lg border text-xs font-mono focus:outline-hidden ${
                      isDark
                        ? 'bg-[#161920] border-[#2A2E39] text-white focus:border-emerald-500'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-emerald-500'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5">Confirm New Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password..."
                    className={`w-full px-3 py-2 rounded-lg border text-xs font-mono focus:outline-hidden ${
                      isDark
                        ? 'bg-[#161920] border-[#2A2E39] text-white focus:border-emerald-500'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-emerald-500'
                    }`}
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer flex items-center gap-2 shadow-xs"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  Update Password
                </button>
              </div>
            </div>
          </form>

          {/* 2FA Section */}
          <div className={`p-5 rounded-xl border shadow-sm ${
            isDark ? 'bg-[#0F1115] border-[#1F242F]' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2 text-emerald-400">
                  <Smartphone className="w-4 h-4" />
                  Two-Factor Authentication (TOTP)
                </h3>
                <p className={`text-xs mt-1 font-sans ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Secure your account using an authenticator app (Google Authenticator, 1Password, Authy).
                </p>
              </div>

              <span className="px-2.5 py-1 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                ACTIVE
              </span>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-800/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold">Emergency Recovery Codes</span>
                <button
                  type="button"
                  onClick={handleCopyRecoveryCodes}
                  className="text-xs text-emerald-500 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                >
                  {copiedCodes ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedCodes ? 'Copied to Clipboard' : 'Copy All Codes'}
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {recoveryCodes.slice(0, 4).map((code, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded border text-center font-mono text-[11px] font-bold ${
                      isDark ? 'bg-[#161920] border-[#2A2E39] text-gray-300' : 'bg-gray-100 border-gray-300 text-gray-800'
                    }`}
                  >
                    {code}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Active Personal Sessions */}
          <div className={`p-5 rounded-xl border shadow-sm ${
            isDark ? 'bg-[#0F1115] border-[#1F242F]' : 'bg-white border-gray-200'
          }`}>
            <h3 className="text-sm font-bold flex items-center gap-2 text-emerald-400">
              <Laptop className="w-4 h-4" />
              Active Personal Sessions
            </h3>
            <p className={`text-xs mt-1 font-sans ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Devices and browsers currently authenticated with your account credentials.
            </p>

            <div className="mt-4 space-y-3">
              <div className={`p-3 rounded-lg border flex items-center justify-between ${
                isDark ? 'bg-[#13161C] border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
              }`}>
                <div className="flex items-center gap-3">
                  <Laptop className="w-4 h-4 text-emerald-500" />
                  <div>
                    <div className="text-xs font-bold flex items-center gap-2">
                      <span>MacBook Pro — Chrome 128 (Current Session)</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-400 font-bold">
                        THIS DEVICE
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-500 font-sans mt-0.5">
                      IP: 192.168.1.104 • San Francisco, CA • Authenticated with JWT
                    </div>
                  </div>
                </div>
              </div>

              <div className={`p-3 rounded-lg border flex items-center justify-between ${
                isDark ? 'bg-[#13161C] border-[#1F242F]' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center gap-3">
                  <Smartphone className="w-4 h-4 text-gray-500" />
                  <div>
                    <div className="text-xs font-bold">iPhone 15 Pro — Safari iOS</div>
                    <div className="text-[10px] text-gray-500 font-sans mt-0.5">
                      IP: 74.125.21.34 • Last active 2 hours ago
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSaveSuccessMsg('Secondary session terminated.');
                    setTimeout(() => setSaveSuccessMsg(null), 3000);
                  }}
                  className="px-2.5 py-1 rounded text-xs text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 cursor-pointer font-bold"
                >
                  Revoke
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: APPEARANCE & EDITOR */}
      {activeTab === 'appearance' && (
        <div className="mt-6 max-w-3xl space-y-6">
          <div className={`p-5 rounded-xl border shadow-sm ${
            isDark ? 'bg-[#0F1115] border-[#1F242F]' : 'bg-white border-gray-200'
          }`}>
            <h3 className="text-sm font-bold flex items-center gap-2 text-emerald-400">
              <Palette className="w-4 h-4" />
              Theme & Interface Mode
            </h3>
            <p className={`text-xs mt-1 font-sans ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Choose between dark mode for focused night engineering or crisp light mode.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div
                onClick={() => { if (!isDark) toggleTheme(); }}
                className={`p-3.5 rounded-lg border cursor-pointer transition flex items-center justify-between ${
                  isDark
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                    : 'bg-gray-100 border-gray-300 text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Moon className="w-4 h-4 text-emerald-500" />
                  <span className="font-bold text-xs">Dark Mode (Default)</span>
                </div>
                {isDark && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              </div>

              <div
                onClick={() => { if (isDark) toggleTheme(); }}
                className={`p-3.5 rounded-lg border cursor-pointer transition flex items-center justify-between ${
                  !isDark
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-800'
                    : 'bg-[#13161C] border-[#1F242F] text-gray-400'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span className="font-bold text-xs">Light Mode</span>
                </div>
                {!isDark && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              </div>
            </div>
          </div>

          <div className={`p-5 rounded-xl border shadow-sm ${
            isDark ? 'bg-[#0F1115] border-[#1F242F]' : 'bg-white border-gray-200'
          }`}>
            <h3 className="text-sm font-bold flex items-center gap-2 text-emerald-400">
              <Sliders className="w-4 h-4" />
              Code Editor Preferences
            </h3>
            <p className={`text-xs mt-1 font-sans ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Customize typography and display options in the code workspace and diff viewers.
            </p>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1.5">Editor Font Family</label>
                <select
                  value={editorFont}
                  onChange={(e) => setEditorFont(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-xs font-mono focus:outline-hidden ${
                    isDark ? 'bg-[#161920] border-[#2A2E39] text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="JetBrains Mono">JetBrains Mono (Ligatures)</option>
                  <option value="Fira Code">Fira Code</option>
                  <option value="Source Code Pro">Source Code Pro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5">Font Size</label>
                <select
                  value={editorFontSize}
                  onChange={(e) => setEditorFontSize(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-xs font-mono focus:outline-hidden ${
                    isDark ? 'bg-[#161920] border-[#2A2E39] text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="12px">12px (Dense)</option>
                  <option value="13px">13px (Default)</option>
                  <option value="14px">14px (Spacious)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <div className="mt-6 max-w-3xl space-y-6">
          <div className={`p-5 rounded-xl border shadow-sm ${
            isDark ? 'bg-[#0F1115] border-[#1F242F]' : 'bg-white border-gray-200'
          }`}>
            <h3 className="text-sm font-bold flex items-center gap-2 text-emerald-400">
              <Bell className="w-4 h-4" />
              Event Notification Channels
            </h3>
            <p className={`text-xs mt-1 font-sans ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Select which engineering and platform events trigger instant in-app and email alerts.
            </p>

            <div className="mt-4 space-y-3">
              {[
                { label: 'Critical Incident Alerts (P0 / P1 Outages)', state: notifyIncidents, setter: setNotifyIncidents, desc: 'Real-time alert when production latency spikes or pod crash loops occur.' },
                { label: 'Pull Request Review Requests', state: notifyPRs, setter: setNotifyPRs, desc: 'Notify when a teammate requests your review or AI finishes auto-patching.' },
                { label: 'CI/CD Pipeline Build Failures', state: notifyPipelines, setter: setNotifyPipelines, desc: 'Instant notification on test failure or Docker image build failure.' },
                { label: 'Security Vulnerability Alerts', state: notifySecurity, setter: setNotifySecurity, desc: 'Notices for CVE alerts detected in npm packages or base images.' }
              ].map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => item.setter(!item.state)}
                  className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition ${
                    item.state
                      ? isDark ? 'bg-[#13161C] border-emerald-500/30' : 'bg-emerald-50/50 border-emerald-200'
                      : isDark ? 'bg-[#0F1115] border-[#1F242F]' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">{item.label}</div>
                    <div className="text-[11px] text-gray-500 font-sans mt-0.5">{item.desc}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={item.state}
                    onChange={() => {}}
                    className="w-4 h-4 accent-emerald-500"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: WORKSPACE PREFERENCES */}
      {activeTab === 'preferences' && (
        <div className="mt-6 max-w-3xl space-y-6">
          <div className={`p-5 rounded-xl border shadow-sm ${
            isDark ? 'bg-[#0F1115] border-[#1F242F]' : 'bg-white border-gray-200'
          }`}>
            <h3 className="text-sm font-bold flex items-center gap-2 text-emerald-400">
              <Sliders className="w-4 h-4" />
              Developer Workspace Preferences
            </h3>
            <p className={`text-xs mt-1 font-sans ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Default repository parameters and diff inspection formats.
            </p>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1.5">Default Git Branch</label>
                <input
                  type="text"
                  value={defaultBranch}
                  onChange={(e) => setDefaultBranch(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-xs font-mono focus:outline-hidden ${
                    isDark ? 'bg-[#161920] border-[#2A2E39] text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5">Auto-Save Buffer Interval</label>
                <select
                  value={autoSaveInterval}
                  onChange={(e) => setAutoSaveInterval(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-xs font-mono focus:outline-hidden ${
                    isDark ? 'bg-[#161920] border-[#2A2E39] text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="10s">Every 10 seconds</option>
                  <option value="30s">Every 30 seconds</option>
                  <option value="60s">Every 1 minute</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

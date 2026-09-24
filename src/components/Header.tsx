import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal,
  Search,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  User,
  Shield,
  ShieldCheck,
  LogOut,
  X,
  Menu,
  Sliders,
  Cpu,
  Activity,
  Sun,
  Moon
} from 'lucide-react';
import { RbacRole, EnvironmentName, IncidentRecord, NavViewId } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  currentView?: NavViewId;
  activeProject?: string;
  currentRole: RbacRole;
  onRoleChange?: (role: RbacRole) => void;
  currentEnv?: EnvironmentName;
  onEnvChange?: (env: EnvironmentName) => void;
  onOpenCommandPalette: () => void;
  activeIncidentsCount?: number;
  incidents?: IncidentRecord[];
  onNavigate?: (view: NavViewId) => void;
  onDispatchIncidentHero?: (promptText?: string) => void;
  onRemediateIncident?: (incidentId: string) => void;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onOpenCommandPalette,
  activeIncidentsCount = 0,
  incidents = [],
  onNavigate,
  onDispatchIncidentHero,
  onToggleSidebar
}) => {
  const { currentUser, session, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

  // Dropdown & Modal states
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState<boolean>(false);
  const [isIncidentMenuOpen, setIsIncidentMenuOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState<boolean>(false);

  const accountMenuRef = useRef<HTMLDivElement>(null);
  const incidentMenuRef = useRef<HTMLDivElement>(null);

  const userName = currentUser?.name || 'Abdul Rehman Yasir';
  const userRole = currentRole || currentUser?.role || 'Admin';
  const userEmail = currentUser?.email || 'admin@nexusdev.ai';

  // 2FA & Recovery Codes Context
  const { twoFactorDetails, recoveryCodes, generateNewRecoveryCodes } = useAuth();
  const [is2FADetailsOpen, setIs2FADetailsOpen] = useState<boolean>(false);
  const [isRecoveryCodesOpen, setIsRecoveryCodesOpen] = useState<boolean>(false);
  const [copiedCodesSuccess, setCopiedCodesSuccess] = useState<boolean>(false);
  const [generateConfirmOpen, setGenerateConfirmOpen] = useState<boolean>(false);

  // Primary active incident
  const safeIncidents = incidents || [];
  const activeIncident = safeIncidents.find((i) => i.status !== 'RESOLVED') || safeIncidents[0];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (accountMenuRef.current && !accountMenuRef.current.contains(target)) {
        setIsAccountMenuOpen(false);
      }
      if (incidentMenuRef.current && !incidentMenuRef.current.contains(target)) {
        setIsIncidentMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsAccountMenuOpen(false);
    logout();
  };

  const handleLaunchRemediation = () => {
    setIsIncidentMenuOpen(false);
    if (onDispatchIncidentHero) {
      onDispatchIncidentHero(
        `Investigate and resolve critical incident (${activeIncident?.incidentNumber || 'INC-2026-0819-01'}): ${activeIncident?.title || 'Production API Latency Spiked 380% with Elevated 500 Error Rate'}.`
      );
    } else if (onNavigate) {
      onNavigate('ai-agent');
    }
  };

  return (
    <>
      <header
        id="platform-header"
        className={`w-full h-12 border-b flex items-center justify-between px-3 sm:px-4 sticky top-0 z-40 select-none gap-2 transition-colors duration-150 ${
          isDark
            ? 'bg-[#0A0B0D] border-[#1A1D23] text-[#E0E0E0]'
            : 'bg-white border-[#D0D7DE] text-[#0F172A] shadow-xs'
        }`}
      >
        {/* LEFT: Hamburger Menu & NexusDev Brand */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0">
          <button
            type="button"
            onClick={onToggleSidebar}
            className={`lg:hidden p-1.5 -ml-1 rounded-md border transition cursor-pointer flex items-center justify-center ${
              isDark
                ? 'bg-[#161920] hover:bg-[#20242E] border-[#2D3748] text-gray-300 hover:text-white'
                : 'bg-[#F1F5F9] hover:bg-[#E2E8F0] border-[#CBD5E1] text-gray-700 hover:text-black'
            }`}
            aria-label="Toggle Navigation Menu"
            title="Toggle Navigation Menu"
          >
            <Menu className="w-4 h-4 text-emerald-500" />
          </button>

          <button
            type="button"
            onClick={() => onNavigate && onNavigate('dashboard')}
            className="flex items-center gap-2.5 hover:opacity-90 transition cursor-pointer text-left shrink-0"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.2)] shrink-0">
              <Terminal className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col text-left leading-none">
              <div className="flex items-center gap-1.5">
                <span className={`font-bold text-xs tracking-wider font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  NexusDev AI
                </span>
              </div>
              <span className={`text-[9.5px] font-sans tracking-tight font-medium mt-0.5 whitespace-nowrap ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Engineering Workspace
              </span>
            </div>
          </button>
        </div>

        {/* CENTER: Prominent, High-Visibility Search & Command Palette */}
        <div className="flex-1 max-w-lg mx-2 sm:mx-4 hidden md:block">
          <button
            id="cmd-palette-button"
            type="button"
            onClick={onOpenCommandPalette}
            className={`h-8 w-full flex items-center justify-between px-3 rounded-lg text-xs transition-all border cursor-pointer shadow-inner group ${
              isDark
                ? 'bg-[#11141D] hover:bg-[#161B27] text-gray-300 hover:text-white border-[#2B3545] hover:border-emerald-500/60'
                : 'bg-[#F6F8FA] hover:bg-[#EDF2F7] text-gray-700 hover:text-gray-900 border-[#D0D7DE] hover:border-emerald-500/60 shadow-xs'
            }`}
            title="Quick open command palette & search (Cmd+K / Ctrl+K)"
          >
            <div className="flex items-center gap-2.5 truncate">
              <Search className="w-3.5 h-3.5 text-emerald-500 group-hover:text-emerald-400 transition-colors shrink-0" />
              <span className={`text-xs font-sans truncate font-medium ${isDark ? 'text-gray-300 group-hover:text-white' : 'text-gray-600 group-hover:text-gray-900'}`}>
                Search repositories, logs, commands, incidents...
              </span>
            </div>
            <kbd className={`px-1.5 py-0.5 rounded text-[10px] font-mono border shrink-0 shadow-xs ${
              isDark
                ? 'bg-[#1C2230] text-gray-300 border-[#374151] group-hover:border-emerald-500/40 group-hover:text-emerald-400'
                : 'bg-[#E2E8F0] text-gray-700 border-[#CBD5E1] group-hover:border-emerald-500/40 group-hover:text-emerald-600'
            }`}>
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Mobile / Tablet Compact Search Button */}
        <div className="md:hidden flex items-center">
          <button
            id="cmd-palette-button-mobile"
            type="button"
            onClick={onOpenCommandPalette}
            className={`h-7.5 px-2.5 flex items-center gap-1.5 rounded-md text-xs border cursor-pointer ${
              isDark
                ? 'bg-[#11141D] hover:bg-[#161B27] text-gray-300 hover:text-white border-[#2B3545]'
                : 'bg-[#F1F5F9] hover:bg-[#E2E8F0] text-gray-700 hover:text-gray-900 border-[#CBD5E1]'
            }`}
            title="Search (Cmd+K)"
          >
            <Search className="w-3.5 h-3.5 text-emerald-500" />
            <span className={`text-[10px] font-sans hidden sm:inline ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Search...</span>
            <kbd className={`px-1 py-0.2 rounded text-[9px] font-mono border ${
              isDark ? 'bg-[#1C2230] text-gray-400 border-[#374151]' : 'bg-[#E2E8F0] text-gray-600 border-[#CBD5E1]'
            }`}>
              ⌘K
            </kbd>
          </button>
        </div>

        {/* RIGHT: Theme Toggle, Incident Alerts, Telemetry & User Account */}
        <div className="flex items-center gap-2 shrink-0">
          {/* THEME TOGGLE (🌙 Dark / ☀️ Light) */}
          <button
            id="theme-toggle-button"
            type="button"
            onClick={toggleTheme}
            className={`h-7 sm:h-7.5 px-2.5 flex items-center gap-1.5 rounded-lg border transition-all cursor-pointer font-mono text-[10px] ${
              isDark
                ? 'bg-[#07080A] hover:bg-[#13161C] border-[#1F2937] text-gray-300 hover:text-white'
                : 'bg-[#F1F5F9] hover:bg-[#E2E8F0] border-[#D0D7DE] text-gray-700 hover:text-gray-900 shadow-xs'
            }`}
            title={isDark ? 'Switch to Light Theme (☀️)' : 'Switch to Dark Theme (🌙)'}
          >
            {isDark ? (
              <>
                <Moon className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline font-semibold text-gray-300">Dark</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline font-semibold text-gray-800">Light</span>
              </>
            )}
          </button>

          {/* Active Incident Warning Pill (if incidents exist) */}
          {activeIncidentsCount > 0 && (
            <div className="relative" ref={incidentMenuRef}>
              <button
                type="button"
                id="header-incident-indicator-btn"
                onClick={() => {
                  setIsIncidentMenuOpen(!isIncidentMenuOpen);
                  setIsAccountMenuOpen(false);
                }}
                className="h-7 px-2 rounded-md bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/40 text-rose-500 flex items-center gap-1.5 text-[10px] font-mono font-bold transition cursor-pointer shadow-[0_0_8px_rgba(244,63,94,0.15)]"
                title={`${activeIncidentsCount} active incident(s)`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                <span className="hidden xs:inline">INCIDENTS:</span>
                <span>{activeIncidentsCount}</span>
              </button>

              {/* Incident Dropdown */}
              {isIncidentMenuOpen && (
                <div
                  id="header-incident-dropdown"
                  className={`absolute right-0 top-full mt-1.5 w-72 max-w-[calc(100vw-1.5rem)] rounded-xl border shadow-2xl p-3 z-50 font-mono text-xs animate-in fade-in zoom-in-95 duration-100 ${
                    isDark
                      ? 'bg-[#1A1D23] border-[#2D3748] text-white'
                      : 'bg-white border-[#D0D7DE] text-gray-900 shadow-xl'
                  }`}
                >
                  <div className={`flex items-center justify-between pb-2 border-b ${isDark ? 'border-[#2D3748]' : 'border-[#E2E8F0]'}`}>
                    <div className="flex items-center gap-1.5 text-rose-500 font-bold text-[11px]">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>ACTIVE PRODUCTION ALERTS</span>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-600 dark:text-rose-300 font-bold">
                      {activeIncidentsCount} ACTIVE
                    </span>
                  </div>

                  {activeIncident && (
                    <div className={`mt-2.5 p-2 rounded border ${isDark ? 'bg-[#0A0B0D] border-rose-500/30' : 'bg-rose-50/60 border-rose-200'}`}>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-rose-500 font-mono">#{activeIncident.incidentNumber}</span>
                        <span className="px-1 py-0.2 rounded bg-rose-500/20 text-rose-600 dark:text-rose-300 font-bold text-[9px]">
                          {activeIncident.severity}
                        </span>
                      </div>
                      <p className={`text-[11px] font-medium mt-1 line-clamp-2 font-sans ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {activeIncident.title}
                      </p>
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleLaunchRemediation}
                      className="flex-1 py-1.5 px-2 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] text-center transition cursor-pointer shadow-xs"
                    >
                      AI AUTO-REMEDIATE
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsIncidentMenuOpen(false);
                        if (onNavigate) onNavigate('incidents');
                      }}
                      className={`px-2.5 py-1.5 rounded text-[10px] border transition cursor-pointer ${
                        isDark
                          ? 'bg-[#0A0B0D] hover:bg-[#20252E] text-gray-300 border-[#2D3748]'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300'
                      }`}
                    >
                      VIEW ALL
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Compact Telemetry: CPU 42% */}
          <div
            id="telemetry-cpu-pill"
            className={`flex items-center gap-1.5 px-2 py-1 rounded border text-[10px] font-mono shrink-0 ${
              isDark
                ? 'bg-[#07080A] border-[#1F2937] text-gray-300'
                : 'bg-[#F1F5F9] border-[#D0D7DE] text-gray-700'
            }`}
            title="Sandbox CPU Usage"
          >
            <Cpu className="w-3 h-3 text-emerald-500 shrink-0" />
            <span className={`font-semibold hidden md:inline ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>CPU</span>
            <span className="text-emerald-500 font-bold">42%</span>
          </div>

          {/* Compact Telemetry: RAM 68% */}
          <div
            id="telemetry-ram-pill"
            className={`flex items-center gap-1.5 px-2 py-1 rounded border text-[10px] font-mono shrink-0 ${
              isDark
                ? 'bg-[#07080A] border-[#1F2937] text-gray-300'
                : 'bg-[#F1F5F9] border-[#D0D7DE] text-gray-700'
            }`}
            title="Sandbox Memory Usage"
          >
            <Activity className="w-3 h-3 text-teal-500 shrink-0" />
            <span className={`font-semibold hidden md:inline ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>RAM</span>
            <span className="text-teal-500 font-bold">68%</span>
          </div>

          {/* FAR RIGHT: User Profile Button with Name & Subordinate Role */}
          <div className="relative shrink-0" ref={accountMenuRef}>
            <button
              id="user-account-menu-button"
              type="button"
              onClick={() => {
                setIsAccountMenuOpen(!isAccountMenuOpen);
                setIsIncidentMenuOpen(false);
              }}
              className={`h-7.5 sm:h-8 flex items-center gap-2 px-2 rounded-md border transition cursor-pointer ${
                isDark
                  ? 'bg-[#07080A] hover:bg-[#13161C] border-[#1F2937] hover:border-[#2D3748]'
                  : 'bg-[#F1F5F9] hover:bg-[#E2E8F0] border-[#D0D7DE] hover:border-gray-400 shadow-xs'
              }`}
            >
              {/* User Avatar Initial */}
              <div className="w-5 h-5 rounded bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-[9px] font-mono shadow-[0_0_8px_rgba(16,185,129,0.3)] shrink-0">
                {userRole.slice(0, 2).toUpperCase()}
              </div>

              {/* User Name & Role Display */}
              <div className="flex flex-col text-left leading-none">
                <span className={`text-[11px] font-bold font-mono tracking-tight whitespace-nowrap truncate max-w-[100px] sm:max-w-[130px] ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {userName}
                </span>
                <span className="text-[8.5px] text-emerald-500 font-mono tracking-wider font-semibold mt-0.5 whitespace-nowrap">
                  ROLE: {userRole.toUpperCase()}
                </span>
              </div>

              <ChevronDown
                className={`w-3 h-3 transition-transform shrink-0 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                } ${isAccountMenuOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Account Menu Dropdown — Fixed & Viewport Bound */}
            {isAccountMenuOpen && (
              <div
                id="user-account-dropdown"
                className={`absolute right-0 top-full mt-1.5 w-64 max-w-[calc(100vw-1.5rem)] max-h-[calc(100vh-4rem)] overflow-y-auto rounded-xl border shadow-2xl py-2 z-50 font-mono text-xs animate-in fade-in zoom-in-95 duration-100 ${
                  isDark
                    ? 'bg-[#1A1D23] border-[#2D3748] text-white'
                    : 'bg-white border-[#D0D7DE] text-gray-900 shadow-2xl'
                }`}
              >
                {/* Account Details Header */}
                <div className={`px-4 py-2 border-b ${isDark ? 'border-[#2D3748]' : 'border-[#E2E8F0]'}`}>
                  <div className={`text-[11px] font-bold tracking-wide truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{userName}</div>
                  <div className={`text-[10px] truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{userEmail}</div>
                  <div className="mt-1 flex items-center gap-1.5 text-[9px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-emerald-500 font-bold tracking-wide">ACTIVE SESSION (gVisor)</span>
                  </div>
                </div>

                {/* Account Menu Items: Profile, Role, Settings, Security */}
                <div className="py-1">
                  {/* 1. Profile */}
                  <button
                    type="button"
                    id="account-menu-profile"
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      setIsProfileModalOpen(true);
                    }}
                    className={`w-full px-4 py-2 text-left flex items-center gap-2.5 transition cursor-pointer ${
                      isDark
                        ? 'text-gray-300 hover:text-white hover:bg-[#0A0B0D]'
                        : 'text-gray-700 hover:text-black hover:bg-gray-100'
                    }`}
                  >
                    <User className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Profile & Account</span>
                  </button>

                  {/* 2. Role Info Row */}
                  <div className={`px-4 py-1.5 flex items-center justify-between my-0.5 ${
                    isDark ? 'bg-[#13161C]/60 text-gray-300' : 'bg-gray-50 text-gray-700'
                  }`}>
                    <div className="flex items-center gap-2.5 text-gray-400">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>Role</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold">
                      ROLE: {userRole.toUpperCase()}
                    </span>
                  </div>

                  {/* 3. Governance (ADMIN ONLY) */}
                  {userRole === 'Admin' && (
                    <button
                      type="button"
                      id="account-menu-governance"
                      onClick={() => {
                        setIsAccountMenuOpen(false);
                        if (onNavigate) onNavigate('governance');
                      }}
                      className={`w-full px-4 py-2 text-left flex items-center gap-2.5 transition cursor-pointer ${
                        isDark
                          ? 'text-gray-300 hover:text-white hover:bg-[#0A0B0D]'
                          : 'text-gray-700 hover:text-black hover:bg-gray-100'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>Platform Governance</span>
                    </button>
                  )}

                  {/* 4. Settings (Personal Settings for all users) */}
                  <button
                    type="button"
                    id="account-menu-settings"
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      if (onNavigate) onNavigate('settings');
                    }}
                    className={`w-full px-4 py-2 text-left flex items-center gap-2.5 transition cursor-pointer ${
                      isDark
                        ? 'text-gray-300 hover:text-white hover:bg-[#0A0B0D]'
                        : 'text-gray-700 hover:text-black hover:bg-gray-100'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Settings</span>
                  </button>

                  {/* 5. Security */}
                  <button
                    type="button"
                    id="account-menu-security"
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      setIsSecurityModalOpen(true);
                    }}
                    className={`w-full px-4 py-2 text-left flex items-center gap-2.5 transition cursor-pointer ${
                      isDark
                        ? 'text-gray-300 hover:text-white hover:bg-[#0A0B0D]'
                        : 'text-gray-700 hover:text-black hover:bg-gray-100'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Security Attestation</span>
                  </button>
                </div>

                <div className={`border-t my-1 ${isDark ? 'border-[#2D3748]' : 'border-[#E2E8F0]'}`} />

                {/* 5. Log Out */}
                <div className="px-1.5 py-0.5">
                  <button
                    type="button"
                    id="account-menu-logout"
                    onClick={handleLogout}
                    className="w-full px-3 py-1.5 text-left text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg flex items-center gap-2.5 font-bold transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 shrink-0" />
                    <span>LOG OUT</span>
                  </button>
                </div>

                <div className={`border-t my-1 ${isDark ? 'border-[#2D3748]' : 'border-[#E2E8F0]'}`} />

                {/* Platform & Cluster Details in Account Dropdown */}
                <div className={`px-3 py-2 text-center rounded-b-xl border-t space-y-1 ${
                  isDark ? 'bg-[#0F1115] border-[#232936]' : 'bg-gray-50 border-gray-200'
                }`}>
                  <p className={`text-[10px] font-mono tracking-tight ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Developed by <span className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>Abdul Rehman Yasir</span>
                  </p>
                  <div className="flex items-center justify-center gap-1.5 text-[9.5px] font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Cluster: <strong className="text-emerald-500 font-bold">NEBULA_PROD</strong></span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* User Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs font-mono">
          <div className={`w-full max-w-lg max-h-[min(90vh,680px)] flex flex-col rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 border ${
            isDark ? 'bg-[#1A1D23] border-[#2D3748] text-white' : 'bg-white border-[#D0D7DE] text-gray-900'
          }`}>
            {/* Sticky Header */}
            <div className={`flex items-center justify-between p-4 border-b shrink-0 ${isDark ? 'border-[#2D3748] bg-[#14171C]' : 'border-[#E2E8F0] bg-[#F8FAFC]'}`}>
              <div className="flex items-center gap-2 text-emerald-500">
                <User className="w-4 h-4" />
                <span className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-900'}`}>User Profile & Account</span>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded hover:bg-gray-500/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
              <div className={`flex items-center gap-4 p-3.5 rounded-lg border ${
                isDark ? 'bg-[#0A0B0D] border-[#2D3748]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
              }`}>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-lg font-mono shadow-sm shrink-0">
                  {userRole.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className={`font-bold text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{userName}</h3>
                  <p className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{userEmail}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-500 rounded text-[10px] font-bold">
                      ROLE: {userRole.toUpperCase()}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                      isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-600'
                    }`}>
                      ID: {currentUser?.id || 'usr_admin_01'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className={`p-3 rounded-lg border ${isDark ? 'bg-[#0A0B0D] border-[#2D3748]' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
                  <span className={`text-[10px] block font-semibold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>ORGANIZATION</span>
                  <span className={`font-semibold text-xs mt-0.5 block ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>NexusDev Enterprise</span>
                </div>
                <div className={`p-3 rounded-lg border ${isDark ? 'bg-[#0A0B0D] border-[#2D3748]' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
                  <span className={`text-[10px] block font-semibold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>CLUSTER ACCESS</span>
                  <span className="text-emerald-500 font-semibold text-xs mt-0.5 block">NEBULA_PROD (Cluster Admin)</span>
                </div>
                <div className={`p-3 rounded-lg border ${isDark ? 'bg-[#0A0B0D] border-[#2D3748]' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
                  <span className={`text-[10px] block font-semibold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>SESSION ISSUED</span>
                  <span className={`text-xs mt-0.5 block ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {session?.createdAt ? new Date(session.createdAt).toLocaleTimeString() : 'Current Session'}
                  </span>
                </div>
                <div className={`p-3 rounded-lg border ${isDark ? 'bg-[#0A0B0D] border-[#2D3748]' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
                  <span className={`text-[10px] block font-semibold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>TOKEN EXPIRATION</span>
                  <span className={`text-xs mt-0.5 block ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {session?.expiresAt ? new Date(session.expiresAt).toLocaleDateString() : '30 Days (Persistent)'}
                  </span>
                </div>
              </div>

              <div className={`p-3.5 rounded-lg border ${isDark ? 'bg-[#0A0B0D] border-[#2D3748]' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
                <span className={`text-[10px] font-bold block mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>CURRENT RBAC PERMISSIONS</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'FULL_DASHBOARD_ACCESS',
                    'USER_ACCOUNT_MANAGEMENT',
                    'RBAC_PERMISSION_GOVERNANCE',
                    'ADMIN_LOGIN_AUDIT_VISIBILITY',
                    'PRODUCTION_DEPLOY_AUTHORIZATION',
                    'ROLLBACK_AND_K8S_CONTROLS',
                    'AI_AGENT_POLICY_APPROVAL'
                  ].map((perm) => (
                    <span
                      key={perm}
                      className={`px-2 py-0.5 border text-[10px] rounded font-mono ${
                        isDark ? 'bg-[#1A1D23] border-[#2D3748] text-gray-300' : 'bg-white border-[#D0D7DE] text-gray-700'
                      }`}
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className={`p-4 border-t flex justify-end shrink-0 ${isDark ? 'border-[#2D3748] bg-[#14171C]' : 'border-[#E2E8F0] bg-[#F8FAFC]'}`}>
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className={`px-4 py-1.5 border text-xs font-semibold rounded transition cursor-pointer ${
                  isDark
                    ? 'bg-[#0A0B0D] hover:bg-[#20252E] border-[#2D3748] text-gray-300'
                    : 'bg-white hover:bg-gray-100 border-[#D0D7DE] text-gray-800'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security & Access Modal */}
      {isSecurityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs font-mono">
          <div className={`w-full max-w-xl max-h-[min(90vh,680px)] flex flex-col rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 border ${
            isDark ? 'bg-[#1A1D23] border-[#2D3748] text-white' : 'bg-white border-[#D0D7DE] text-gray-900'
          }`}>
            {/* Sticky Header */}
            <div className={`flex items-center justify-between p-4 border-b shrink-0 ${isDark ? 'border-[#2D3748] bg-[#14171C]' : 'border-[#E2E8F0] bg-[#F8FAFC]'}`}>
              <div className="flex items-center gap-2 text-emerald-500">
                <Shield className="w-4 h-4" />
                <span className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-900'}`}>Security & Session Attestation</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsSecurityModalOpen(false);
                  setIs2FADetailsOpen(false);
                  setIsRecoveryCodesOpen(false);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded hover:bg-gray-500/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
              <div className={`p-3.5 rounded-lg border flex items-start gap-3 ${
                isDark ? 'bg-[#0A0B0D] border-emerald-500/30' : 'bg-emerald-50/60 border-emerald-200'
              }`}>
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <div className={`font-bold text-xs ${isDark ? 'text-white' : 'text-gray-900'}`}>Cryptographic Session Verified</div>
                  <p className={`text-[11px] mt-0.5 font-sans ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Active session is cryptographically signed with ECDSA-P256 token and protected by gVisor container kernel boundaries.
                  </p>
                </div>
              </div>

              {/* 2FA Section */}
              <div className={`p-4 rounded-lg border space-y-2.5 ${
                isDark ? 'bg-[#0A0B0D] border-[#2D3748]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs">TWO-FACTOR AUTHENTICATION</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-500 text-[10px] font-bold">
                      ● ENABLED
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIs2FADetailsOpen(!is2FADetailsOpen)}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 rounded transition cursor-pointer"
                  >
                    {is2FADetailsOpen ? 'Hide 2FA Details' : 'View 2FA Details'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div>
                    <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>Method: </span>
                    <span className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{twoFactorDetails.method}</span>
                  </div>
                  <div>
                    <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>Enabled: </span>
                    <span className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{twoFactorDetails.enabledAt}</span>
                  </div>
                </div>

                <p className={`text-[11px] font-sans leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Two-factor authentication adds a second verification step after your password. When enabled, signing in requires:
                </p>
                <div className={`p-2 rounded font-sans text-[11px] space-y-1 ${
                  isDark ? 'bg-[#14171C] text-gray-300' : 'bg-white text-gray-700 border border-[#E2E8F0]'
                }`}>
                  <div>1. Account password</div>
                  <div>2. Time-based verification code from the authenticator app</div>
                </div>

                {/* Expanded 2FA Details */}
                {is2FADetailsOpen && (
                  <div className={`mt-2 p-3 rounded-lg border space-y-2 animate-in fade-in duration-150 ${
                    isDark ? 'bg-[#14171C] border-[#2D3748]' : 'bg-white border-[#D0D7DE]'
                  }`}>
                    <div className="font-bold text-[11px] text-emerald-500 uppercase tracking-wider">
                      2FA Configuration & Cryptographic Details
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <span className="text-gray-500">Algorithm: </span>
                        <span className="font-mono font-semibold">{twoFactorDetails.algorithm}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Time Step: </span>
                        <span className="font-mono font-semibold">{twoFactorDetails.periodSeconds} seconds</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Code Length: </span>
                        <span className="font-mono font-semibold">{twoFactorDetails.digits} digits</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Standard: </span>
                        <span className="font-mono font-semibold">RFC 6238 TOTP</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-500 font-sans mt-1">
                      Security Assurance: TOTP seed keys and private parameters are strictly shielded in the secure hardware enclave and are never exposed over client logs.
                    </p>
                  </div>
                )}
              </div>

              {/* Recovery Codes Section */}
              <div className={`p-4 rounded-lg border space-y-3 ${
                isDark ? 'bg-[#0A0B0D] border-[#2D3748]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs">RECOVERY CODES</div>
                    <div className="text-[11px] text-emerald-500 font-semibold mt-0.5">
                      {recoveryCodes.length} recovery codes available
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsRecoveryCodesOpen(!isRecoveryCodesOpen)}
                      className={`px-2.5 py-1 text-[11px] font-semibold border rounded transition cursor-pointer ${
                        isDark
                          ? 'bg-[#1A1D23] hover:bg-[#20252E] border-[#2D3748] text-gray-200'
                          : 'bg-white hover:bg-gray-100 border-[#D0D7DE] text-gray-800'
                      }`}
                    >
                      {isRecoveryCodesOpen ? 'Hide Codes' : 'View Codes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setGenerateConfirmOpen(true)}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded transition cursor-pointer"
                    >
                      Generate New Codes
                    </button>
                  </div>
                </div>

                <p className={`text-[11px] font-sans ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Each recovery code can be used only once. Generating a new set invalidates your previous codes. Store them securely in a password manager or offline vault.
                </p>

                {/* Generate Confirm Modal / Alert */}
                {generateConfirmOpen && (
                  <div className={`p-3 rounded-lg border space-y-2 border-amber-500/30 ${
                    isDark ? 'bg-amber-950/20' : 'bg-amber-50'
                  }`}>
                    <div className="font-bold text-[11px] text-amber-500">
                      Are you sure you want to generate new recovery codes?
                    </div>
                    <p className={`text-[10px] font-sans ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Your existing {recoveryCodes.length} recovery codes will be immediately invalidated and cannot be used again.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          generateNewRecoveryCodes();
                          setGenerateConfirmOpen(false);
                          setIsRecoveryCodesOpen(true);
                        }}
                        className="px-2.5 py-1 text-[10px] font-bold bg-amber-500 text-black rounded hover:bg-amber-400 transition cursor-pointer"
                      >
                        Yes, Generate 10 New Codes
                      </button>
                      <button
                        type="button"
                        onClick={() => setGenerateConfirmOpen(false)}
                        className={`px-2.5 py-1 text-[10px] border rounded ${
                          isDark ? 'border-[#2D3748] text-gray-300' : 'border-[#D0D7DE] text-gray-700 bg-white'
                        }`}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Active Recovery Codes Drawer */}
                {isRecoveryCodesOpen && (
                  <div className={`p-3 rounded-lg border space-y-2 animate-in fade-in duration-150 ${
                    isDark ? 'bg-[#14171C] border-[#2D3748]' : 'bg-white border-[#D0D7DE]'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        Active Unused Recovery Codes ({recoveryCodes.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(recoveryCodes.join('\n'));
                          setCopiedCodesSuccess(true);
                          setTimeout(() => setCopiedCodesSuccess(false), 2000);
                        }}
                        className="text-[10px] font-semibold text-emerald-500 hover:text-emerald-400 cursor-pointer"
                      >
                        {copiedCodesSuccess ? '✓ Copied to Clipboard' : 'Copy All Codes'}
                      </button>
                    </div>

                    {recoveryCodes.length === 0 ? (
                      <div className="text-[11px] text-rose-500 font-bold py-2 text-center">
                        All recovery codes have been used. Please generate a new set immediately.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
                        {recoveryCodes.map((c, idx) => (
                          <div
                            key={c + idx}
                            className={`p-1.5 rounded border text-center font-bold select-all ${
                              isDark ? 'bg-[#0A0B0D] border-[#2D3748] text-emerald-400' : 'bg-gray-50 border-gray-200 text-emerald-700'
                            }`}
                          >
                            {c}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Ingress & Session Token */}
              <div className={`p-3 rounded-lg border ${isDark ? 'bg-[#0A0B0D] border-[#2D3748]' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
                <div className="text-[10px] text-gray-500 uppercase">Active Session Token Hash</div>
                <div className={`font-mono text-[11px] mt-1 break-all p-2 rounded border ${
                  isDark ? 'bg-[#1A1D23] border-[#2D3748] text-gray-300' : 'bg-gray-100 border-[#D0D7DE] text-gray-800'
                }`}>
                  {session?.token || 'nxt_jwt_prod_signed_token_889210'}
                </div>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className={`p-4 border-t flex items-center justify-between shrink-0 ${isDark ? 'border-[#2D3748] bg-[#14171C]' : 'border-[#E2E8F0] bg-[#F8FAFC]'}`}>
              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-500 text-xs font-bold rounded flex items-center gap-1.5 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>TERMINATE & LOG OUT</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsSecurityModalOpen(false);
                  setIs2FADetailsOpen(false);
                  setIsRecoveryCodesOpen(false);
                }}
                className={`px-4 py-1.5 border text-xs font-semibold rounded transition cursor-pointer ${
                  isDark
                    ? 'bg-[#0A0B0D] hover:bg-[#20252E] border-[#2D3748] text-gray-300'
                    : 'bg-white hover:bg-gray-100 border-[#D0D7DE] text-gray-800'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

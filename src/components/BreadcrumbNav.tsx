import React from 'react';
import {
  ChevronRight,
  ArrowLeft,
  Home,
  Bot,
  Flame,
  Workflow,
  Rocket,
  Server,
  Activity,
  ShieldCheck,
  GitPullRequest,
  Code,
  Sliders,
  FileCode
} from 'lucide-react';
import { NavViewId } from '../types';
import { useTheme } from '../context/ThemeContext';

interface BreadcrumbNavProps {
  currentView: NavViewId;
  onNavigate: (view: NavViewId) => void;
  subItemTitle?: string;
  onBack?: () => void;
  canGoBack?: boolean;
  environment?: string;
  role?: string;
  sandboxStatus?: string;
}

const VIEW_METADATA: Record<
  NavViewId,
  { label: string; parent?: { id: NavViewId; label: string }; icon: React.ReactNode }
> = {
  dashboard: { label: 'Dashboard', icon: <Home className="w-3.5 h-3.5 text-emerald-500" /> },
  'ai-agent': { label: 'AI Agent Workspace', parent: { id: 'dashboard', label: 'Dashboard' }, icon: <Bot className="w-3.5 h-3.5 text-amber-500" /> },
  'code-workspace': { label: 'Repositories & Code', parent: { id: 'dashboard', label: 'Dashboard' }, icon: <Code className="w-3.5 h-3.5 text-gray-500" /> },
  issues: { label: 'Issues & Tasks', parent: { id: 'dashboard', label: 'Dashboard' }, icon: <FileCode className="w-3.5 h-3.5 text-gray-500" /> },
  'pull-requests': { label: 'Pull Requests', parent: { id: 'dashboard', label: 'Dashboard' }, icon: <GitPullRequest className="w-3.5 h-3.5 text-gray-500" /> },
  pipelines: { label: 'CI/CD Pipelines', parent: { id: 'dashboard', label: 'Dashboard' }, icon: <Workflow className="w-3.5 h-3.5 text-amber-500" /> },
  deployments: { label: 'Deployments & Environments', parent: { id: 'dashboard', label: 'Dashboard' }, icon: <Rocket className="w-3.5 h-3.5 text-emerald-500" /> },
  infrastructure: { label: 'Infrastructure & Kubernetes', parent: { id: 'dashboard', label: 'Dashboard' }, icon: <Server className="w-3.5 h-3.5 text-emerald-500" /> },
  incidents: { label: 'Incidents & Autonomous RCA', parent: { id: 'dashboard', label: 'Dashboard' }, icon: <Flame className="w-3.5 h-3.5 text-rose-500" /> },
  observability: { label: 'Telemetry & Observability', parent: { id: 'dashboard', label: 'Dashboard' }, icon: <Activity className="w-3.5 h-3.5 text-emerald-500" /> },
  'audit-log': { label: 'Security & Audit Ledger', parent: { id: 'dashboard', label: 'Dashboard' }, icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> },
  governance: { label: 'Platform Governance & Security', parent: { id: 'dashboard', label: 'Dashboard' }, icon: <ShieldCheck className="w-3.5 h-3.5 text-purple-500" /> },
  settings: { label: 'Personal Settings & Preferences', parent: { id: 'dashboard', label: 'Dashboard' }, icon: <Sliders className="w-3.5 h-3.5 text-emerald-500" /> }
};

export const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({
  currentView,
  onNavigate,
  subItemTitle,
  onBack,
  canGoBack = false,
  environment,
  sandboxStatus = 'gVisor Isolated (Active)'
}) => {
  const { isDark } = useTheme();
  const currentMeta = VIEW_METADATA[currentView] || VIEW_METADATA.dashboard;

  return (
    <div
      id="nexus-breadcrumb-nav"
      className={`h-8 px-3.5 border-b flex items-center justify-between font-mono text-xs shrink-0 select-none transition-colors ${
        isDark
          ? 'bg-[#090A0D] border-[#1A202C] text-gray-400'
          : 'bg-gray-100 border-[#D0D7DE] text-gray-600'
      }`}
    >
      {/* Left: Interactive Navigation Trail */}
      <div className="flex items-center gap-2 min-w-0">
        {(canGoBack || currentView !== 'dashboard') && (
          <button
            onClick={onBack || (() => onNavigate('dashboard'))}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded border transition cursor-pointer text-[10px] font-bold ${
              isDark
                ? 'bg-[#13161C] hover:bg-[#1E232B] text-gray-300 hover:text-white border-[#232936]'
                : 'bg-white hover:bg-gray-200 text-gray-700 hover:text-black border-gray-300 shadow-xs'
            }`}
            title="Navigate Back"
          >
            <ArrowLeft className="w-2.5 h-2.5" />
            <span>BACK</span>
          </button>
        )}

        <div className="flex items-center gap-1.5 text-[11px] truncate">
          <button
            onClick={() => onNavigate('dashboard')}
            className={`transition cursor-pointer flex items-center gap-1 ${
              isDark ? 'hover:text-emerald-400 text-gray-400' : 'hover:text-emerald-600 text-gray-600'
            }`}
          >
            <Home className={`w-3 h-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            <span className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>NEXUS</span>
          </button>

          <ChevronRight className={`w-2.5 h-2.5 ${isDark ? 'text-gray-600' : 'text-gray-400'} shrink-0`} />

          {currentMeta.parent && (
            <>
              <button
                onClick={() => onNavigate(currentMeta.parent!.id)}
                className={`transition cursor-pointer truncate ${
                  isDark ? 'hover:text-white text-gray-400' : 'hover:text-black text-gray-600'
                }`}
              >
                {currentMeta.parent.label}
              </button>
              <ChevronRight className={`w-2.5 h-2.5 ${isDark ? 'text-gray-600' : 'text-gray-400'} shrink-0`} />
            </>
          )}

          <div className={`flex items-center gap-1 font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {currentMeta.icon}
            <span className="truncate">{currentMeta.label}</span>
          </div>

          {subItemTitle && (
            <>
              <ChevronRight className={`w-2.5 h-2.5 ${isDark ? 'text-gray-600' : 'text-gray-400'} shrink-0`} />
              <span className={`px-1.5 py-0.2 rounded font-bold border truncate max-w-xs text-[10px] ${
                isDark
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-300'
              }`}>
                {subItemTitle}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Right: Technical Telemetry & Cluster Context */}
      <div className={`flex items-center gap-2.5 text-[10px] shrink-0 pl-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        {environment && (
          <div className={`hidden md:flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-bold ${
            isDark
              ? 'bg-[#13161C] border-[#232936] text-gray-300'
              : 'bg-white border-gray-300 text-gray-700 shadow-xs'
          }`}>
            <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>ENV:</span>
            <span className="text-emerald-500 uppercase">{environment}</span>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="hidden sm:inline">SANDBOX:</span>
          <span className={`font-bold truncate max-w-[120px] sm:max-w-none ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>{sandboxStatus}</span>
        </div>
      </div>
    </div>
  );
};


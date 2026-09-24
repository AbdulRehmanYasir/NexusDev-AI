import React from 'react';
import { X, Boxes, GitBranch } from 'lucide-react';
import { NavViewId, RbacRole } from '../types';
import { canAccessView } from '../lib/permissions';
import { useTheme } from '../context/ThemeContext';

interface SidebarProps {
  activeView: NavViewId;
  onSelectView: (view: NavViewId) => void;
  currentRole: RbacRole;
  openIssuesCount?: number;
  activeIncidentsCount?: number;
  failingPipelinesCount?: number;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  currentRole,
  openIssuesCount = 2,
  activeIncidentsCount = 1,
  failingPipelinesCount = 1,
  isOpen = false,
  onClose
}) => {
  const { isDark } = useTheme();

  const allNavItems: {
    id: NavViewId;
    label: string;
    symbol: string;
    badge?: string;
    badgeStyle?: string;
  }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      symbol: '◈'
    },
    {
      id: 'ai-agent',
      label: 'AI Agent',
      symbol: '⚡',
      badge: 'ACTIVE',
      badgeStyle: isDark
        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
        : 'bg-amber-100 text-amber-700 border-amber-300'
    },
    {
      id: 'code-workspace',
      label: 'Repositories',
      symbol: '⌥'
    },
    {
      id: 'issues',
      label: 'Issues & Tasks',
      symbol: '▣',
      badge: openIssuesCount > 0 ? `${openIssuesCount}` : undefined,
      badgeStyle: isDark
        ? 'bg-gray-700/40 text-gray-300 border-gray-600/40'
        : 'bg-gray-200 text-gray-700 border-gray-300'
    },
    {
      id: 'pull-requests',
      label: 'Pull Requests',
      symbol: '⑂'
    },
    {
      id: 'pipelines',
      label: 'Pipelines',
      symbol: '⑂',
      badge: failingPipelinesCount > 0 ? `${failingPipelinesCount}` : undefined,
      badgeStyle: isDark
        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
        : 'bg-amber-100 text-amber-700 border-amber-300'
    },
    {
      id: 'deployments',
      label: 'Deployments',
      symbol: '▲'
    },
    {
      id: 'infrastructure',
      label: 'Infrastructure',
      symbol: '⎔'
    },
    {
      id: 'incidents',
      label: 'Incidents',
      symbol: '☄',
      badge: activeIncidentsCount > 0 ? `${activeIncidentsCount}` : undefined,
      badgeStyle: isDark
        ? 'bg-rose-500/20 text-rose-400 border-rose-500/20'
        : 'bg-rose-100 text-rose-700 border-rose-300'
    },
    {
      id: 'observability',
      label: 'Observability',
      symbol: '∿'
    },
    {
      id: 'audit-log',
      label: 'Audit Ledger',
      symbol: '⚖'
    },
    {
      id: 'governance',
      label: 'Governance',
      symbol: '🏛'
    },
    {
      id: 'settings',
      label: 'Settings',
      symbol: '⚙'
    }
  ];

  // Role-Aware Navigation: only render items permitted for current role
  const visibleNavItems = allNavItems.filter((item) => canAccessView(currentRole, item.id));

  return (
    <>
      {/* Mobile / Tablet Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-50 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onClose}
          aria-label="Close navigation menu overlay"
        />
      )}

      <aside
        id="main-sidebar"
        className={`fixed inset-y-0 left-0 z-50 w-72 border-r flex flex-col shrink-0 select-none overflow-hidden transform transition-all duration-200 ease-in-out lg:translate-x-0 lg:relative lg:w-60 lg:z-auto ${
          isDark
            ? 'bg-[#0F1115] border-[#1F2937] text-[#E0E0E0]'
            : 'bg-white border-[#D0D7DE] text-[#0F172A] shadow-sm'
        } ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Active Project & Workspace Header */}
        <div className={`p-3.5 border-b flex items-center justify-between transition-colors ${
          isDark ? 'border-[#1F2937] bg-[#0A0B0D]/50' : 'border-[#E2E8F0] bg-[#F8FAFC]'
        }`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
              <Boxes className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex flex-col">
              <div className="flex items-center gap-1.5 leading-none">
                <span className={`font-semibold text-xs truncate font-sans ${isDark ? 'text-white' : 'text-gray-900'}`}>Nexus Workspace</span>
              </div>
              <div className={`flex items-center gap-1.5 mt-1 text-[10px] font-mono ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <GitBranch className="w-3 h-3 text-emerald-500 shrink-0" />
                <span className={`truncate ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>auth-service</span>
                <span className="text-gray-400">•</span>
                <span className="text-emerald-500 text-[9px] font-semibold">main</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold border ${
              isDark
                ? 'bg-[#1A1D23] border-[#2D3748] text-emerald-400'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}>
              {currentRole}
            </span>
            {isOpen && onClose && (
              <button
                onClick={onClose}
                className={`lg:hidden p-1.5 rounded-lg transition cursor-pointer border ${
                  isDark
                    ? 'bg-[#1A1D23] hover:bg-[#2D3748] border-transparent text-gray-300 hover:text-white'
                    : 'bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-700 hover:text-black'
                }`}
                aria-label="Close navigation sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                id={`nav-btn-${item.id}`}
                onClick={() => {
                  onSelectView(item.id);
                  if (onClose) onClose();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs transition-colors cursor-pointer text-left font-mono ${
                  isActive
                    ? isDark
                      ? 'bg-[#1F2937] text-white font-medium border border-[#374151]'
                      : 'bg-emerald-50/80 text-emerald-900 font-semibold border border-emerald-200 shadow-xs'
                    : isDark
                      ? 'text-gray-400 hover:text-white hover:bg-[#1A1D23] border border-transparent'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-[#F1F5F9] border border-transparent'
                }`}
              >
                <span className={`w-4 text-center ${
                  isActive
                    ? 'text-emerald-500 opacity-100 font-bold'
                    : isDark ? 'opacity-50' : 'opacity-70 text-gray-500'
                }`}>
                  {item.symbol}
                </span>
                <span className="font-sans text-xs">{item.label}</span>

                {item.badge && (
                  <span
                    className={`ml-auto px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                      item.badgeStyle || (isDark ? 'bg-gray-800 text-gray-400 border-gray-700' : 'bg-gray-200 text-gray-700 border-gray-300')
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
};


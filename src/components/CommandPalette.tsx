import React, { useState, useEffect } from 'react';
import {
  Search,
  Bot,
  FileCode,
  GitPullRequest,
  Workflow,
  Rocket,
  Server,
  Flame,
  Activity,
  ShieldCheck,
  Sliders,
  Sparkles
} from 'lucide-react';
import { NavViewId, RbacRole } from '../types';
import { canAccessView } from '../lib/permissions';
import { useTheme } from '../context/ThemeContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (viewId: NavViewId) => void;
  currentRole?: RbacRole;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  currentRole = 'Developer'
}) => {
  const { isDark } = useTheme();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const allQuickActions: { id: NavViewId; label: string; icon: React.ReactNode; category: string }[] = [
    { id: 'ai-agent', label: 'Fix session authentication 500 error with AI', icon: <Sparkles className="w-4 h-4 text-emerald-500" />, category: 'AI Tasks' },
    { id: 'ai-agent', label: 'Launch Autonomous Engineering Agent Console', icon: <Bot className="w-4 h-4 text-emerald-500" />, category: 'AI Tasks' },
    { id: 'incidents', label: 'Investigate Active Incident INC-2026-0819-01', icon: <Flame className="w-4 h-4 text-rose-500" />, category: 'Operations' },
    { id: 'code-workspace', label: 'Inspect src/auth/session.ts in Code Workspace', icon: <FileCode className="w-4 h-4 text-emerald-500" />, category: 'Repository' },
    { id: 'pipelines', label: 'Inspect Failing CI/CD Pipeline & Auto-Fix', icon: <Workflow className="w-4 h-4 text-amber-500" />, category: 'Delivery' },
    { id: 'deployments', label: 'View Staging & Production Deployments', icon: <Rocket className="w-4 h-4 text-emerald-500" />, category: 'Delivery' },
    { id: 'pull-requests', label: 'Review PR #89 (fix/auth-session-500-patch)', icon: <GitPullRequest className="w-4 h-4 text-sky-500" />, category: 'Engineering' },
    { id: 'infrastructure', label: 'Kubernetes Cluster & Pod Diagnostics', icon: <Server className="w-4 h-4 text-gray-500" />, category: 'Operations' },
    { id: 'observability', label: 'Real-time Latency & Error Rate Telemetry', icon: <Activity className="w-4 h-4 text-emerald-500" />, category: 'Operations' },
    { id: 'audit-log', label: 'Security & Governance Audit Ledger', icon: <ShieldCheck className="w-4 h-4 text-purple-500" />, category: 'System Audit' },
    { id: 'governance', label: 'RBAC Matrix & Platform Governance Policies', icon: <Sliders className="w-4 h-4 text-gray-500" />, category: 'Admin' },
    { id: 'settings', label: 'Personal Account Profile & Security Settings', icon: <Sliders className="w-4 h-4 text-emerald-500" />, category: 'Preferences' }
  ];

  // Filter actions based on role permission
  const permittedActions = allQuickActions.filter(action => canAccessView(currentRole, action.id));

  const filtered = (permittedActions || []).filter(
    (a) =>
      (a?.label || '').toLowerCase().includes((query || '').toLowerCase()) ||
      (a?.category || '').toLowerCase().includes((query || '').toLowerCase())
  );

  return (
    <div className={`fixed inset-0 z-50 backdrop-blur-xs flex items-start justify-center pt-24 p-4 ${
      isDark ? 'bg-[#0A0B0D]/80' : 'bg-black/40'
    }`}>
      <div className={`w-full max-w-xl rounded-lg shadow-2xl overflow-hidden flex flex-col border ${
        isDark ? 'bg-[#1A1D23] border-[#2D3748]' : 'bg-white border-[#D0D7DE]'
      }`}>
        {/* Search input */}
        <div className={`p-3.5 border-b flex items-center gap-3 ${
          isDark ? 'border-[#2D3748] bg-[#0F1115]' : 'border-[#E2E8F0] bg-gray-50'
        }`}>
          <Search className={`w-4 h-4 shrink-0 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
          <input
            type="text"
            placeholder="Type a command, search code, or jump to view..."
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`w-full bg-transparent text-sm font-mono focus:outline-hidden ${
              isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
            }`}
          />
          <kbd className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
            isDark ? 'bg-[#1F2937] text-gray-400 border-[#374151]' : 'bg-gray-200 text-gray-700 border-gray-300'
          }`}>
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                onNavigate(item.id);
                onClose();
              }}
              className={`w-full flex items-center justify-between p-2.5 rounded text-left transition cursor-pointer text-xs font-mono ${
                isDark ? 'hover:bg-[#2D3748]' : 'hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {item.icon}
                <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{item.label}</span>
              </div>
              <span className={`text-[10px] font-mono uppercase ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{item.category}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};


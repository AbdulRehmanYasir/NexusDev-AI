import React, { useState } from 'react';
import {
  Bot,
  Search,
  ArrowRight
} from 'lucide-react';
import { IssueTicket } from '../types';
import { useTheme } from '../context/ThemeContext';

interface IssuesViewProps {
  issues: IssueTicket[];
  onDispatchToAgent: (issue: IssueTicket) => void;
}

export const IssuesView: React.FC<IssuesViewProps> = ({ issues, onDispatchToAgent }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');

  const filteredIssues = (issues || []).filter((issue) => {
    const titleStr = issue?.title || '';
    const descStr = issue?.description || '';
    const numStr = String(issue?.number ?? '');
    const query = (search || '').toLowerCase();
    const matchesSearch =
      titleStr.toLowerCase().includes(query) ||
      descStr.toLowerCase().includes(query) ||
      numStr.includes(search || '');
    const matchesStatus = statusFilter === 'ALL' || issue?.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div
      id="issues-view"
      className={`flex-1 p-6 space-y-6 overflow-y-auto transition-colors ${
        isDark ? 'bg-[#0A0B0D] text-[#E0E0E0]' : 'bg-[#F6F8FA] text-[#111827]'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className={`text-xl font-semibold tracking-tight font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>
              ENGINEERING ISSUES & TASKS
            </h1>
            <span
              className={`px-2 py-0.5 rounded text-xs font-mono border ${
                isDark ? 'bg-[#1A1D23] text-gray-400 border-[#2D3748]' : 'bg-white text-gray-700 border-gray-300 shadow-xs'
              }`}
            >
              {(issues || []).length} TOTAL
            </span>
          </div>
          <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Dispatch any issue to the autonomous AI engineering agent with permission-gated execution.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className={`w-3.5 h-3.5 absolute left-2.5 top-2.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Search issues..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`pl-8 pr-3 py-1.5 rounded text-xs border focus:outline-hidden font-mono ${
                isDark
                  ? 'bg-[#1A1D23] text-gray-200 border-[#2D3748] placeholder-gray-500'
                  : 'bg-white text-gray-900 border-gray-300 placeholder-gray-400 shadow-xs'
              }`}
            />
          </div>

          <div
            className={`flex items-center rounded p-0.5 border text-xs font-mono ${
              isDark ? 'bg-[#1A1D23] border-[#2D3748]' : 'bg-white border-gray-300 shadow-xs'
            }`}
          >
            {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded uppercase font-bold transition cursor-pointer text-[10px] ${
                  statusFilter === st
                    ? isDark
                      ? 'bg-[#2D3748] text-white'
                      : 'bg-gray-200 text-gray-900 shadow-xs'
                    : isDark
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Issue Cards List */}
      <div className="space-y-3">
        {filteredIssues.map((issue) => (
          <div
            key={issue.id}
            className={`p-4 rounded-lg border transition flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
              isDark
                ? 'bg-[#1A1D23] border-[#2D3748] hover:border-[#374151]'
                : 'bg-white border-[#D0D7DE] hover:border-gray-400 shadow-xs'
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 font-mono">
                <span className={`text-xs font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  #{issue.number}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                    issue.priority === 'URGENT'
                      ? isDark
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                      : issue.priority === 'HIGH'
                      ? isDark
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                      : isDark
                      ? 'bg-gray-700/40 text-gray-300 border-gray-600/40'
                      : 'bg-gray-100 text-gray-700 border-gray-300'
                  }`}
                >
                  {issue.priority}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                    issue.status === 'IN_PROGRESS'
                      ? isDark
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : isDark
                      ? 'bg-[#0F1115] text-gray-400 border-[#2D3748]'
                      : 'bg-gray-100 text-gray-600 border-gray-200'
                  }`}
                >
                  {issue.status.replace('_', ' ')}
                </span>
              </div>

              <h3 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{issue.title}</h3>
              <p className={`text-xs mt-1 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{issue.description}</p>

              <div className="flex items-center gap-3 mt-3 text-[11px] font-mono">
                {issue.relatedFile && (
                  <span
                    className={`px-2 py-0.5 rounded border ${
                      isDark ? 'text-gray-300 bg-[#0A0B0D] border-[#2D3748]' : 'text-gray-800 bg-gray-100 border-gray-300'
                    }`}
                  >
                    {issue.relatedFile}
                  </span>
                )}
                <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>Created {issue.createdAt}</span>
                {issue.assignee && (
                  <span className={`flex items-center gap-1 font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                    <Bot className="w-3 h-3" /> {issue.assignee}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                id={`dispatch-issue-${issue.number}`}
                onClick={() => onDispatchToAgent(issue)}
                className="flex items-center gap-1.5 px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold font-mono text-xs shadow-[0_0_10px_rgba(16,185,129,0.3)] transition cursor-pointer"
              >
                <Bot className="w-3.5 h-3.5 fill-current" />
                <span>DISPATCH TO AGENT</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

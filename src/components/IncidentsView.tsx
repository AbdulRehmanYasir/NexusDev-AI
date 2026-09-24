import React, { useState } from 'react';
import {
  Flame,
  Bot,
  CheckCircle2,
  Shield,
  Search,
  Filter,
  AlertTriangle,
  ArrowRight,
  Layers,
  Activity,
  Check,
  X,
  Play,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import {
  REALISTIC_ENGINEERING_SCENARIOS,
  EngineeringScenario
} from '../types';
import { useTheme } from '../context/ThemeContext';
import confetti from 'canvas-confetti';

interface IncidentsViewProps {
  incidents?: any[];
  onRemediateIncident: (incidentId: string) => void;
  onNavigateToAgent?: (prompt?: string, scenarioId?: string) => void;
}

export const IncidentsView: React.FC<IncidentsViewProps> = ({
  onRemediateIncident,
  onNavigateToAgent
}) => {
  const { isDark } = useTheme();
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(
    REALISTIC_ENGINEERING_SCENARIOS[0].id
  );
  const [isRemediating, setIsRemediating] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const selectedScenario: EngineeringScenario =
    REALISTIC_ENGINEERING_SCENARIOS.find((s) => s.id === selectedScenarioId) ||
    REALISTIC_ENGINEERING_SCENARIOS[0];

  const filteredScenarios = REALISTIC_ENGINEERING_SCENARIOS.filter((sc) => {
    if (categoryFilter !== 'ALL' && sc.category !== categoryFilter) return false;
    return true;
  });

  const handleRemediate = () => {
    setIsRemediating(true);
    setTimeout(() => {
      onRemediateIncident(selectedScenario.id);
      setIsRemediating(false);
      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      } catch {}
    }, 1200);
  };

  return (
    <div
      id="incidents-view"
      className={`flex-1 p-4 lg:p-6 space-y-5 overflow-y-auto font-mono transition-colors ${
        isDark ? 'bg-[#0A0B0D] text-[#E0E0E0]' : 'bg-[#F6F8FA] text-[#111827]'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-500 animate-pulse" />
            <h1 className={`text-sm font-bold tracking-tight uppercase ${isDark ? 'text-white' : 'text-gray-900'}`}>
              AUTONOMOUS INCIDENT RESPONSE &amp; MULTI-SIGNAL RCA
            </h1>
          </div>
          <p className={`text-xs mt-1 font-sans ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Correlate telemetry anomalies, isolate commit root causes, and execute verified remediations.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div
            className={`flex items-center rounded p-0.5 border text-[10px] ${
              isDark ? 'bg-[#1A1D23] border-[#2D3748]' : 'bg-white border-gray-300 shadow-xs'
            }`}
          >
            {(['ALL', 'ACTIVE', 'RESOLVED'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-2.5 py-1 rounded font-bold cursor-pointer transition ${
                  statusFilter === tab
                    ? isDark
                      ? 'bg-[#2D3748] text-white'
                      : 'bg-gray-200 text-gray-900 shadow-xs'
                    : isDark
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <span
            className={`px-2.5 py-1 rounded font-bold text-[10px] border ${
              isDark
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            {REALISTIC_ENGINEERING_SCENARIOS.length} SCENARIOS LOADED
          </span>
        </div>
      </div>

      {/* Grid: Incidents List (4 cols) + Incident Deep RCA Detail (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Incidents List */}
        <div className="lg:col-span-5 space-y-3">
          {filteredScenarios.map((sc) => {
            const isSelected = sc.id === selectedScenarioId;
            return (
              <div
                key={sc.id}
                onClick={() => setSelectedScenarioId(sc.id)}
                className={`p-4 rounded-lg border transition cursor-pointer space-y-2.5 ${
                  isSelected
                    ? isDark
                      ? 'bg-[#1A1D23] border-emerald-500/60 ring-1 ring-emerald-500/30'
                      : 'bg-white border-emerald-600 ring-2 ring-emerald-500/20 shadow-md'
                    : isDark
                    ? 'bg-[#0F1115] border-[#2D3748] hover:border-gray-600'
                    : 'bg-white border-gray-200 hover:border-gray-400 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        sc.severity === 'P1'
                          ? isDark ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-rose-100 text-rose-800 border-rose-300'
                          : isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}
                    >
                      {sc.severity}
                    </span>
                    <span className="text-xs font-bold text-sky-400">
                      {sc.incidentRef || sc.scenarioCode}
                    </span>
                  </div>

                  <span className="text-[10px] text-gray-500 font-mono">
                    {sc.environment.toUpperCase()}
                  </span>
                </div>

                <h3 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {sc.title}
                </h3>

                <p className={`text-[11px] font-sans line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {sc.problemPrompt}
                </p>

                <div className="flex items-center justify-between text-[10px] text-gray-500 pt-2 border-t border-gray-700/30">
                  <span>Service: <strong className="text-emerald-400">{sc.service}</strong></span>
                  <span>Commit: {sc.commitHash}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Incident Deep RCA Detail */}
        <div className="lg:col-span-7 space-y-4">
          <div
            className={`p-5 rounded-lg border space-y-5 ${
              isDark ? 'bg-[#0F1115] border-[#2D3748]' : 'bg-white border-[#D0D7DE] shadow-xs'
            }`}
          >
            {/* Header with Launch Button */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b pb-4 border-[#2D3748]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-400">
                    [{selectedScenario.scenarioCode}]
                  </span>
                  <span className="text-xs text-gray-400">
                    Target: <strong>{selectedScenario.service}</strong> ({selectedScenario.environment})
                  </span>
                </div>
                <h2 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {selectedScenario.title}
                </h2>
              </div>

              <button
                onClick={() => {
                  if (onNavigateToAgent) {
                    onNavigateToAgent(selectedScenario.problemPrompt, selectedScenario.id);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition cursor-pointer whitespace-nowrap"
              >
                <Bot className="w-4 h-4" />
                <span>LAUNCH AI REMEDIATION</span>
              </button>
            </div>

            {/* Observed Facts */}
            <div className="space-y-2">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold block">
                OBSERVED TELEMETRY &amp; ENVIRONMENT FACTS
              </span>
              <ul className="space-y-1.5 text-xs">
                {(selectedScenario?.observedFacts || []).map((fact, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-sky-400 font-bold">[{idx + 1}]</span>
                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{fact}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Multi-Hypothesis Evaluation */}
            <div className="space-y-3 pt-3 border-t border-[#2D3748]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold block">
                  AI CANDIDATE HYPOTHESES ({(selectedScenario?.hypotheses || []).length})
                </span>
                <span className="text-xs font-bold text-emerald-400">
                  RCA Confidence: {selectedScenario?.rcaConfidence || 0}%
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {(selectedScenario?.hypotheses || []).map((hyp) => (
                  <div
                    key={hyp.id}
                    className={`p-3 rounded border space-y-1.5 ${
                      hyp.status === 'SUPPORTED'
                        ? isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-300'
                        : hyp.status === 'ELIMINATED' || hyp.status === 'DISPROVEN'
                        ? isDark ? 'bg-gray-800/40 border-gray-700 text-gray-500 line-through' : 'bg-gray-100 border-gray-300 text-gray-500 line-through'
                        : isDark ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sky-400">[{hyp.id.toUpperCase()}] {hyp.name}</span>
                      <span className="font-bold">{hyp.status} ({hyp.finalConfidence}%)</span>
                    </div>
                    <p className={`text-[11px] font-sans ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {hyp.description}
                    </p>
                    {hyp.eliminationReason && (
                      <p className="text-[10px] text-rose-400 font-sans">
                        ✗ Eliminated: {hyp.eliminationReason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* AI Decision & Suggested Fix */}
            {selectedScenario?.proposedPatch && (
              <div className="p-4 rounded-lg bg-[#1A1D23] border border-[#2D3748] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400">PROPOSED AI REMEDIATION PLAN</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    POLICY: {selectedScenario.aiVerdict || 'MANUAL_APPROVAL_REQUIRED'}
                  </span>
                </div>
                <p className="text-gray-300 font-sans">
                  {selectedScenario.proposedPatch.patchExplanation}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

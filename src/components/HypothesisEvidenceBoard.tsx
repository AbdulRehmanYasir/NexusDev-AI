import React, { useState } from 'react';
import {
  Brain,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Search,
  Filter,
  Check,
  X,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  Sparkles,
  ChevronRight,
  Maximize2,
  FileSearch,
  SlidersHorizontal,
  Table,
  LayoutGrid,
  GitBranch,
  ShieldCheck,
  Ban
} from 'lucide-react';
import { HypothesisItem, EngineeringScenario } from '../types';
import { useTheme } from '../context/ThemeContext';

interface HypothesisEvidenceBoardProps {
  scenario: EngineeringScenario;
  selectedHypothesisId: string;
  onSelectHypothesis: (id: string) => void;
  executionPhase?: string;
  onRunSandboxTests?: () => void;
}

type ViewMode = 'cards' | 'matrix' | 'timeline';
type FilterStatus = 'ALL' | 'SUPPORTED' | 'PLAUSIBLE' | 'ELIMINATED' | 'DISPROVEN';

export const HypothesisEvidenceBoard: React.FC<HypothesisEvidenceBoardProps> = ({
  scenario,
  selectedHypothesisId,
  onSelectHypothesis,
  executionPhase = 'READY',
  onRunSandboxTests
}) => {
  const { isDark } = useTheme();
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTabDetailed, setActiveTabDetailed] = useState<'evidence' | 'timeline' | 'counter'>('evidence');

  // Filter hypotheses
  const filteredHypotheses = scenario.hypotheses.filter((hyp) => {
    const matchesFilter = filterStatus === 'ALL' || hyp.status === filterStatus;
    const matchesSearch =
      searchQuery === '' ||
      hyp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hyp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hyp.evidenceFor.some((e) => e.toLowerCase().includes(searchQuery.toLowerCase())) ||
      hyp.evidenceAgainst.some((e) => e.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const selectedHypothesis =
    scenario.hypotheses.find((h) => h.id === selectedHypothesisId) ||
    scenario.hypotheses[0] ||
    null;

  const supportedCount = scenario.hypotheses.filter((h) => h.status === 'SUPPORTED').length;
  const eliminatedCount = scenario.hypotheses.filter(
    (h) => h.status === 'ELIMINATED' || h.status === 'DISPROVEN'
  ).length;
  const plausibleCount = scenario.hypotheses.filter(
    (h) => h.status === 'PLAUSIBLE' || h.status === 'UNCONFIRMED'
  ).length;

  return (
    <div
      id="hypothesis-evidence-board"
      className={`rounded-xl border overflow-hidden transition-all shadow-sm ${
        isDark ? 'bg-[#0E1117] border-[#222938]' : 'bg-white border-[#D0D7DE]'
      }`}
    >
      {/* 1. Header with Title, Metrics, and View Switcher */}
      <div
        className={`p-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-3 ${
          isDark ? 'bg-[#131722]/80 border-[#222938]' : 'bg-gray-50/80 border-[#E2E8F0]'
        }`}
      >
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0 shadow-[0_0_12px_rgba(56,189,248,0.2)]">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-sm font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Hypothesis &amp; Evidence Elimination Board
              </h3>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                  scenario.isConfidenceSufficient
                    ? isDark
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : isDark
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}
              >
                {scenario.rcaConfidence}% RCA CONFIDENCE
              </span>
            </div>
            <p className={`text-xs font-sans mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Dynamic evaluation of candidate failure modes, contradictory telemetry signals, and false-positive pruning.
            </p>
          </div>
        </div>

        {/* View Mode Controls & Quick Stats */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Stat Badges */}
          <div className="flex items-center gap-1.5 text-[11px] font-mono mr-1">
            <span
              className={`px-2 py-0.5 rounded border ${
                isDark ? 'bg-[#181D2A] text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
              title="Supported Root Cause Candidate"
            >
              {supportedCount} Supported
            </span>
            <span
              className={`px-2 py-0.5 rounded border ${
                isDark ? 'bg-[#181D2A] text-rose-400 border-rose-500/30' : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
              title="Eliminated False Positives"
            >
              {eliminatedCount} Eliminated
            </span>
            {plausibleCount > 0 && (
              <span
                className={`px-2 py-0.5 rounded border ${
                  isDark ? 'bg-[#181D2A] text-amber-400 border-amber-500/30' : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {plausibleCount} Ambiguous
              </span>
            )}
          </div>

          {/* View Mode Switcher */}
          <div
            className={`p-0.5 rounded-lg border flex items-center ${
              isDark ? 'bg-[#0B0D13] border-[#222938]' : 'bg-gray-200/80 border-gray-300'
            }`}
          >
            <button
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1 rounded text-xs font-sans font-medium flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'cards'
                  ? isDark
                    ? 'bg-[#1F2737] text-white shadow-xs'
                    : 'bg-white text-gray-900 shadow-xs'
                  : isDark
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-600 hover:text-black'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>

            <button
              onClick={() => setViewMode('matrix')}
              className={`px-2.5 py-1 rounded text-xs font-sans font-medium flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'matrix'
                  ? isDark
                    ? 'bg-[#1F2737] text-white shadow-xs'
                    : 'bg-white text-gray-900 shadow-xs'
                  : isDark
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-600 hover:text-black'
              }`}
              title="Evidence Comparison Matrix"
            >
              <Table className="w-3.5 h-3.5" />
              <span>Matrix</span>
            </button>

            <button
              onClick={() => setViewMode('timeline')}
              className={`px-2.5 py-1 rounded text-xs font-sans font-medium flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'timeline'
                  ? isDark
                    ? 'bg-[#1F2737] text-white shadow-xs'
                    : 'bg-white text-gray-900 shadow-xs'
                  : isDark
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-600 hover:text-black'
              }`}
              title="Reasoning Path &amp; Elimination Sequence"
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Reasoning Path</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Filter & Search Toolbar */}
      <div
        className={`px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-2.5 text-xs ${
          isDark ? 'bg-[#0B0D13]/60 border-[#222938]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
        }`}
      >
        {/* Status Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`text-[11px] font-mono mr-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Filter:</span>
          {(['ALL', 'SUPPORTED', 'PLAUSIBLE', 'ELIMINATED', 'DISPROVEN'] as FilterStatus[]).map((status) => {
            const isActive = filterStatus === status;
            return (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-2.5 py-1 rounded text-[11px] font-mono transition cursor-pointer border ${
                  isActive
                    ? isDark
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 font-bold'
                      : 'bg-sky-100 text-sky-900 border-sky-300 font-bold shadow-xs'
                    : isDark
                    ? 'bg-[#141824] hover:bg-[#1C2233] text-gray-400 border-[#222938]'
                    : 'bg-white hover:bg-gray-100 text-gray-600 border-gray-300'
                }`}
              >
                {status === 'ALL' ? `ALL (${scenario.hypotheses.length})` : status}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[200px] max-w-xs">
          <Search className={`w-3.5 h-3.5 absolute left-2.5 top-2.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search evidence &amp; hypotheses..."
            className={`w-full pl-8 pr-3 py-1 text-xs rounded border transition focus:outline-none ${
              isDark
                ? 'bg-[#141824] border-[#222938] text-white placeholder-gray-500 focus:border-sky-500/60'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-sky-500'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-2 text-gray-400 hover:text-gray-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Main Content Views */}
      <div className="p-4">
        {/* VIEW 1: Interactive Cards View */}
        {viewMode === 'cards' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredHypotheses.map((hyp) => {
                const isSelected = selectedHypothesisId === hyp.id;
                const isSupported = hyp.status === 'SUPPORTED';
                const isEliminated = hyp.status === 'ELIMINATED' || hyp.status === 'DISPROVEN';
                const confidenceDelta = hyp.finalConfidence - hyp.initialConfidence;

                return (
                  <div
                    key={hyp.id}
                    onClick={() => onSelectHypothesis(hyp.id)}
                    className={`rounded-xl border p-4 transition-all cursor-pointer flex flex-col justify-between gap-3 relative ${
                      isSelected
                        ? isDark
                          ? 'bg-[#151A26] border-sky-500/70 ring-2 ring-sky-500/20 shadow-lg'
                          : 'bg-white border-sky-500 ring-2 ring-sky-500/20 shadow-md'
                        : isDark
                        ? 'bg-[#10141E] border-[#202738] hover:border-gray-600 hover:bg-[#141824]'
                        : 'bg-white border-gray-200 hover:border-gray-400 shadow-xs'
                    }`}
                  >
                    {/* Top Status & Confidence Header */}
                    <div>
                      <div className="flex items-center justify-between gap-2 pb-2 border-b border-current/10">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isSupported
                                ? 'bg-emerald-400 animate-pulse'
                                : isEliminated
                                ? 'bg-rose-500'
                                : 'bg-amber-400'
                            }`}
                          />
                          <span className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-wider">
                            HYPOTHESIS #{hyp.id.toUpperCase()}
                          </span>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border flex items-center gap-1 ${
                            isSupported
                              ? isDark
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : isEliminated
                              ? isDark
                                ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                              : isDark
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}
                        >
                          {isSupported && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                          {isEliminated && <Ban className="w-3 h-3 text-rose-400" />}
                          <span>{hyp.status}</span>
                        </span>
                      </div>

                      {/* Hypothesis Title & Description */}
                      <h4 className={`text-xs font-bold mt-2.5 leading-snug ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {hyp.name}
                      </h4>

                      <p className={`text-[11.5px] font-sans mt-1.5 line-clamp-3 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {hyp.description}
                      </p>
                    </div>

                    {/* Pros & Cons Quick Evidence Badges */}
                    <div className="space-y-2 pt-2 border-t border-current/10 text-xs">
                      {/* Evidence Supporting Count (Pros) */}
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-emerald-500 flex items-center gap-1 font-semibold">
                          <Check className="w-3.5 h-3.5 shrink-0" />
                          <span>Supporting Evidence (Pros):</span>
                        </span>
                        <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                          {hyp.evidenceFor.length} signals
                        </span>
                      </div>

                      {/* Evidence Against Count (Cons) */}
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-rose-500 flex items-center gap-1 font-semibold">
                          <X className="w-3.5 h-3.5 shrink-0" />
                          <span>Contradicting Evidence (Cons):</span>
                        </span>
                        <span className="font-mono font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.2 rounded">
                          {hyp.evidenceAgainst.length} signals
                        </span>
                      </div>

                      {/* Elimination reason callout if eliminated */}
                      {hyp.eliminationReason && (
                        <div
                          className={`p-2 rounded text-[10.5px] font-sans border leading-relaxed ${
                            isDark
                              ? 'bg-rose-500/10 border-rose-500/25 text-rose-300'
                              : 'bg-rose-50 border-rose-200 text-rose-800'
                          }`}
                        >
                          <strong className="font-bold">Falsification:</strong> {hyp.eliminationReason}
                        </div>
                      )}
                    </div>

                    {/* Confidence Meter Bar & Trajectory */}
                    <div className="space-y-1.5 pt-2 border-t border-current/10">
                      <div className="flex items-center justify-between text-[10.5px] font-mono">
                        <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Confidence Evolution:</span>
                        <div className="flex items-center gap-1">
                          <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>{hyp.initialConfidence}%</span>
                          <ArrowRight className="w-3 h-3 text-gray-500" />
                          <span
                            className={`font-bold ${
                              isSupported
                                ? 'text-emerald-400'
                                : isEliminated
                                ? 'text-rose-400'
                                : 'text-amber-400'
                            }`}
                          >
                            {hyp.finalConfidence}%
                          </span>
                          {confidenceDelta > 0 ? (
                            <span className="text-[9px] text-emerald-400 flex items-center">
                              <TrendingUp className="w-3 h-3" />+{confidenceDelta}%
                            </span>
                          ) : confidenceDelta < 0 ? (
                            <span className="text-[9px] text-rose-400 flex items-center">
                              <TrendingDown className="w-3 h-3" />
                              {confidenceDelta}%
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
                        <div
                          className={`h-full transition-all duration-500 ${
                            isSupported
                              ? 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                              : isEliminated
                              ? 'bg-gray-600'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${hyp.finalConfidence}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Hypothesis Deep Evidence Breakdown Drawer */}
            {selectedHypothesis && (
              <div
                className={`rounded-xl border p-4 sm:p-5 space-y-4 transition-colors ${
                  isDark ? 'bg-[#121622] border-[#222938]' : 'bg-gray-50 border-[#CBD5E1]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-current/10">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                        selectedHypothesis.status === 'SUPPORTED'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {selectedHypothesis.id.toUpperCase()}
                    </div>
                    <div>
                      <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Diagnostic Evidence Dossier: {selectedHypothesis.name}
                      </h4>
                      <span className={`text-[11px] font-sans ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        AI Reasoning Path &amp; Comparative Evidence Ledger
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded text-xs font-mono font-bold border ${
                        selectedHypothesis.status === 'SUPPORTED'
                          ? isDark
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : isDark
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-rose-100 text-rose-800 border-rose-300'
                      }`}
                    >
                      FINAL VERDICT: {selectedHypothesis.status} ({selectedHypothesis.finalConfidence}% CONFIDENCE)
                    </span>
                  </div>
                </div>

                {/* Pros & Cons Two-Column Evidence Analysis */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* PROS: Corroborating Signals */}
                  <div
                    className={`rounded-lg border p-4 space-y-3 ${
                      isDark ? 'bg-[#0B0E16] border-emerald-500/30' : 'bg-white border-emerald-300 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wide">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Evidence Supporting (Pros / Corroborations)</span>
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold">
                        {(selectedHypothesis?.evidenceFor || []).length} VERIFIED
                      </span>
                    </div>

                    <ul className="space-y-2.5">
                      {(selectedHypothesis?.evidenceFor || []).map((item, idx) => (
                        <li
                          key={idx}
                          className={`p-2.5 rounded border text-xs font-sans leading-relaxed flex items-start gap-2.5 ${
                            isDark
                              ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-200'
                              : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                          }`}
                        >
                          <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CONS: Contradicting Signals / Elimination */}
                  <div
                    className={`rounded-lg border p-4 space-y-3 ${
                      isDark ? 'bg-[#0B0E16] border-rose-500/30' : 'bg-white border-rose-300 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-rose-500/20">
                      <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5 uppercase tracking-wide">
                        <XCircle className="w-4 h-4 text-rose-400" />
                        <span>Evidence Against (Cons / Contradictions)</span>
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400 font-bold">
                        {(selectedHypothesis?.evidenceAgainst || []).length} CONTRADICTIONS
                      </span>
                    </div>

                    {(selectedHypothesis?.evidenceAgainst || []).length > 0 ? (
                      <ul className="space-y-2.5">
                        {(selectedHypothesis?.evidenceAgainst || []).map((item, idx) => (
                          <li
                            key={idx}
                            className={`p-2.5 rounded border text-xs font-sans leading-relaxed flex items-start gap-2.5 ${
                              isDark
                                ? 'bg-rose-500/5 border-rose-500/20 text-rose-200'
                                : 'bg-rose-50/70 border-rose-200 text-rose-900'
                            }`}
                          >
                            <span className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-400 font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className={`p-4 rounded border text-center text-xs ${isDark ? 'bg-gray-900/40 border-gray-800 text-gray-500' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                        No contradictory telemetry observed. All observed metrics corroborate this hypothesis.
                      </div>
                    )}

                    {/* Elimination Reason Highlight */}
                    {selectedHypothesis.eliminationReason && (
                      <div
                        className={`p-3 rounded-lg border text-xs leading-relaxed ${
                          isDark
                            ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                            : 'bg-rose-100 border-rose-300 text-rose-900'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold mb-1">
                          <Ban className="w-3.5 h-3.5 text-rose-400" />
                          <span>DEFINITIVE FALSIFICATION CONDITION</span>
                        </div>
                        <p className="font-sans text-[11.5px]">{selectedHypothesis.eliminationReason}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: Comparison Matrix View */}
        {viewMode === 'matrix' && (
          <div
            className={`rounded-lg border overflow-x-auto ${
              isDark ? 'bg-[#0B0D13] border-[#222938]' : 'bg-white border-[#E2E8F0]'
            }`}
          >
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={`border-b ${isDark ? 'bg-[#141824] border-[#222938] text-gray-300' : 'bg-gray-100 border-gray-300 text-gray-700'}`}>
                  <th className="p-3 font-mono">ID &amp; Hypothesis</th>
                  <th className="p-3 font-mono">Status</th>
                  <th className="p-3 font-mono text-center">Confidence</th>
                  <th className="p-3 font-mono">Supporting (Pros)</th>
                  <th className="p-3 font-mono">Contradicting (Cons)</th>
                  <th className="p-3 font-mono">Elimination Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-current/10">
                {filteredHypotheses.map((hyp) => {
                  const isSupported = hyp.status === 'SUPPORTED';
                  const isEliminated = hyp.status === 'ELIMINATED' || hyp.status === 'DISPROVEN';
                  const isSelected = selectedHypothesisId === hyp.id;

                  return (
                    <tr
                      key={hyp.id}
                      onClick={() => onSelectHypothesis(hyp.id)}
                      className={`transition cursor-pointer ${
                        isSelected
                          ? isDark ? 'bg-[#1A2233]' : 'bg-sky-50'
                          : isDark ? 'hover:bg-[#121622]' : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="p-3">
                        <div className="font-bold text-sky-400 font-mono text-[11px]">
                          #{hyp.id.toUpperCase()}
                        </div>
                        <div className={`font-semibold mt-0.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {hyp.name}
                        </div>
                        <div className={`text-[11px] font-sans line-clamp-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {hyp.description}
                        </div>
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                            isSupported
                              ? isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : isEliminated
                              ? isDark ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-rose-100 text-rose-800 border-rose-300'
                              : isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}
                        >
                          {hyp.status}
                        </span>
                      </td>

                      <td className="p-3 text-center whitespace-nowrap">
                        <div className="font-bold text-sm font-mono">{hyp.finalConfidence}%</div>
                        <div className="text-[10px] text-gray-500">was {hyp.initialConfidence}%</div>
                      </td>

                      <td className="p-3">
                        <span className="text-emerald-400 font-bold font-mono text-xs">
                          {(hyp.evidenceFor || []).length} items
                        </span>
                        <ul className="text-[11px] font-sans list-disc list-inside mt-1 space-y-0.5">
                          {(hyp.evidenceFor || []).slice(0, 2).map((item, i) => (
                            <li key={i} className="truncate max-w-xs">{item}</li>
                          ))}
                        </ul>
                      </td>

                      <td className="p-3">
                        <span className="text-rose-400 font-bold font-mono text-xs">
                          {(hyp.evidenceAgainst || []).length} items
                        </span>
                        <ul className="text-[11px] font-sans list-disc list-inside mt-1 space-y-0.5">
                          {(hyp.evidenceAgainst || []).slice(0, 2).map((item, i) => (
                            <li key={i} className="truncate max-w-xs">{item}</li>
                          ))}
                        </ul>
                      </td>

                      <td className="p-3 max-w-xs">
                        {hyp.eliminationReason ? (
                          <span className="text-rose-400 text-[11px] font-sans leading-tight">
                            {hyp.eliminationReason}
                          </span>
                        ) : (
                          <span className="text-emerald-400 text-[11px] font-sans">
                            ✓ Uneliminated (Primary candidate)
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* VIEW 3: Step-by-Step Reasoning Path Visualizer */}
        {viewMode === 'timeline' && (
          <div
            className={`rounded-xl border p-5 space-y-4 ${
              isDark ? 'bg-[#0B0D13] border-[#222938]' : 'bg-white border-[#E2E8F0]'
            }`}
          >
            <div className="border-b pb-3 border-current/10">
              <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Deductive Reasoning Flow: From Raw Telemetry to Concluded Fix
              </h4>
              <p className={`text-[11.5px] font-sans mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Visualizing how the autonomous agent avoided misleading signals, tested competing theories, and verified safety before modifying production systems.
              </p>
            </div>

            <div className="space-y-4 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-sky-500/30">
              {/* Step 1: Telemetry Ingestion */}
              <div className="flex items-start gap-4 relative pl-2">
                <div className="w-5 h-5 rounded-full bg-sky-500 text-white font-mono font-bold text-[10px] flex items-center justify-center shrink-0 ring-4 ring-[#0B0D13]">
                  1
                </div>
                <div className={`flex-1 p-3.5 rounded-lg border ${isDark ? 'bg-[#121622] border-[#202738]' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-sky-400 font-mono">PHASE 1: MULTI-SIGNAL TELEMETRY CORRELATION</span>
                    <span className="text-[10px] text-gray-500">100% Signal Ingestion</span>
                  </div>
                  <p className={`text-xs font-sans mt-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Ingested {(scenario.contradictorySignals || []).length} contradictory metrics and {(scenario.observedFacts || []).length} verified facts across distributed services.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(scenario.contradictorySignals || []).map((sig, i) => (
                      <span
                        key={i}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                          sig.status === 'CRITICAL'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {sig.metric}: {sig.value}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step 2: Formulating Candidate Hypotheses */}
              <div className="flex items-start gap-4 relative pl-2">
                <div className="w-5 h-5 rounded-full bg-purple-500 text-white font-mono font-bold text-[10px] flex items-center justify-center shrink-0 ring-4 ring-[#0B0D13]">
                  2
                </div>
                <div className={`flex-1 p-3.5 rounded-lg border ${isDark ? 'bg-[#121622] border-[#202738]' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-purple-400 font-mono">PHASE 2: HYPOTHESIS GENERATION &amp; TEST CREATION</span>
                    <span className="text-[10px] text-gray-500">{(scenario.hypotheses || []).length} Hypotheses Formulated</span>
                  </div>
                  <p className={`text-xs font-sans mt-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Formulated independent test vectors to distinguish between surface symptoms and actual mechanistic root causes.
                  </p>
                </div>
              </div>

              {/* Step 3: Falsification & Elimination */}
              <div className="flex items-start gap-4 relative pl-2">
                <div className="w-5 h-5 rounded-full bg-rose-500 text-white font-mono font-bold text-[10px] flex items-center justify-center shrink-0 ring-4 ring-[#0B0D13]">
                  3
                </div>
                <div className={`flex-1 p-3.5 rounded-lg border ${isDark ? 'bg-[#121622] border-[#202738]' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-rose-400 font-mono">PHASE 3: FALSE-POSITIVE PRUNING &amp; FALSIFICATION</span>
                    <span className="text-[10px] text-rose-400 font-bold">{eliminatedCount} Ruled Out</span>
                  </div>
                  <p className={`text-xs font-sans mt-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Eliminated misleading superficial explanations based on contradictory log assertions.
                  </p>
                  <div className="mt-2 space-y-1.5">
                    {(scenario.hypotheses || []).filter(h => h.status === 'ELIMINATED' || h.status === 'DISPROVEN').map(h => (
                      <div key={h.id} className="text-[11px] font-sans p-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300">
                        <strong>Ruled out {h.name}:</strong> {h.eliminationReason}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step 4: Verification & Decision Synthesis */}
              <div className="flex items-start gap-4 relative pl-2">
                <div className="w-5 h-5 rounded-full bg-emerald-500 text-white font-mono font-bold text-[10px] flex items-center justify-center shrink-0 ring-4 ring-[#0B0D13]">
                  4
                </div>
                <div className={`flex-1 p-3.5 rounded-lg border ${isDark ? 'bg-[#121622] border-emerald-500/40' : 'bg-emerald-50 border-emerald-300'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-emerald-400 font-mono">PHASE 4: ROOT CAUSE SYNTHESIS &amp; POLICY VERDICT</span>
                    <span className="text-[10px] text-emerald-400 font-bold">VERDICT: {scenario.aiVerdict}</span>
                  </div>
                  <p className={`text-xs font-sans mt-1 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {scenario.rcaSummary}
                  </p>
                  <p className={`text-[11px] font-sans mt-1.5 opacity-90 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {scenario.verdictReason}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RCA Summary Callout at Bottom of Board */}
        <div
          className={`mt-4 p-3.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
            scenario.isConfidenceSufficient
              ? isDark ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-300 text-amber-900'
          }`}
        >
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>DEDUCTION SYNTHESIS</span>
            </div>
            <p className="font-sans text-[11.5px]">{scenario.rcaSummary}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="font-mono text-[11px]">Alternative Paths Checked: <strong>{scenario.hypotheses.length - 1}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};

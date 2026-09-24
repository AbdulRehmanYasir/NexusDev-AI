import React, { useState, useEffect } from 'react';
import {
  Workflow,
  CheckCircle2,
  AlertCircle,
  Clock,
  Bot,
  Play,
  RotateCcw,
  AlertTriangle,
  Layers,
  Shield,
  FileCode,
  Search,
  ExternalLink,
  ChevronRight,
  TrendingDown,
  Info,
  Check,
  X,
  Sparkles,
  Terminal as TerminalIcon,
  Filter,
  Gauge,
  Copy,
  Download,
  Maximize2,
  Minimize2,
  Calendar,
  Cpu
} from 'lucide-react';
import {
  REALISTIC_ENGINEERING_SCENARIOS,
  EngineeringScenario,
  PipelineStageExecution
} from '../types';
import { useTheme } from '../context/ThemeContext';
import { DiffViewer } from './DiffViewer';
import { ErrorBoundary } from './ErrorBoundary';
import confetti from 'canvas-confetti';

interface PipelinesViewProps {
  pipelines?: any[];
  onAutoFixPipeline?: (pipelineId: string) => void;
  onTriggerPipeline?: (name: string) => void;
  onNavigateToAgent?: (prompt?: string, scenarioId?: string) => void;
}

export const PipelinesView: React.FC<PipelinesViewProps> = ({
  onAutoFixPipeline,
  onTriggerPipeline,
  onNavigateToAgent
}) => {
  const { isDark } = useTheme();
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(
    REALISTIC_ENGINEERING_SCENARIOS[0]?.id || 'sc_race_condition'
  );
  const [activeStageIndex, setActiveStageIndex] = useState<number>(0);
  const [showDiffModal, setShowDiffModal] = useState<boolean>(false);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [isReRunningPipeline, setIsReRunningPipeline] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [logFilterQuery, setLogFilterQuery] = useState<string>('');
  const [isLogsCopied, setIsLogsCopied] = useState<boolean>(false);
  const [isLogsExpanded, setIsLogsExpanded] = useState<boolean>(false);

  const scenario: EngineeringScenario =
    REALISTIC_ENGINEERING_SCENARIOS.find((s) => s.id === selectedScenarioId) ||
    REALISTIC_ENGINEERING_SCENARIOS[0];

  const stages = scenario?.pipelineStages || [];
  
  // Safe bounded stage index
  const safeStageIndex = stages.length > 0 
    ? Math.min(Math.max(0, activeStageIndex), stages.length - 1)
    : 0;

  const activeStage: PipelineStageExecution | undefined = stages[safeStageIndex];

  // Auto-clamp when scenario changes
  useEffect(() => {
    if (activeStageIndex >= stages.length) {
      setActiveStageIndex(0);
    }
  }, [selectedScenarioId, stages.length]);

  const filteredScenarios = REALISTIC_ENGINEERING_SCENARIOS.filter((sc) => {
    const matchesCategory = categoryFilter === 'ALL' || sc.category === categoryFilter;
    const q = searchFilter.toLowerCase();
    const matchesSearch =
      !q ||
      sc.title.toLowerCase().includes(q) ||
      sc.scenarioCode.toLowerCase().includes(q) ||
      sc.service.toLowerCase().includes(q) ||
      sc.commitHash.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const handleRetryStage = () => {
    setIsRetrying(true);
    setTimeout(() => {
      setIsRetrying(false);
      try {
        confetti({ particleCount: 40, spread: 45, origin: { y: 0.6 } });
      } catch {}
    }, 1200);
  };

  const handleReRunFullPipeline = () => {
    setIsReRunningPipeline(true);
    if (onTriggerPipeline) {
      onTriggerPipeline(scenario.service);
    }
    setTimeout(() => {
      setIsReRunningPipeline(false);
      try {
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      } catch {}
    }, 1800);
  };

  const handleCopyLogs = () => {
    const logText = (activeStage?.logs || []).join('\n');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(logText);
      setIsLogsCopied(true);
      setTimeout(() => setIsLogsCopied(false), 2000);
    }
  };

  const handleDownloadLogs = () => {
    const logText = (activeStage?.logs || []).join('\n');
    const blob = new Blob([logText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pipeline-${scenario.scenarioCode}-stage-${safeStageIndex + 1}-logs.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStageStatusBadge = (status: string) => {
    switch (status) {
      case 'PASSED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            PASSED
          </span>
        );
      case 'FAILED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
            FAILED
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            BLOCKED
          </span>
        );
      case 'FLAKY':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
            FLAKY (RETRY)
          </span>
        );
      case 'DEGRADED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30">
            DEGRADED
          </span>
        );
      case 'RUNNING':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse">
            RUNNING
          </span>
        );
      case 'QUEUED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-500/20 text-gray-400 border border-gray-500/30">
            QUEUED
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-800 text-gray-400 border border-gray-700">
            {status}
          </span>
        );
    }
  };

  const filteredLogs = (activeStage?.logs || []).filter((line) =>
    !logFilterQuery || line.toLowerCase().includes(logFilterQuery.toLowerCase())
  );

  return (
    <ErrorBoundary moduleName="CI/CD Pipelines">
      <div
        id="pipelines-view"
        className={`flex-1 flex flex-col h-full overflow-hidden font-mono transition-colors ${
          isDark ? 'bg-[#0A0B0D] text-[#E0E0E0]' : 'bg-[#F6F8FA] text-[#111827]'
        }`}
      >
        {/* Top Banner */}
        <div
          className={`p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 ${
            isDark ? 'bg-[#0F1115] border-[#1F2937]' : 'bg-white border-[#D0D7DE]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Workflow className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
            <div>
              <div className="flex items-center gap-2">
                <h1 className={`text-xs font-bold tracking-tight uppercase ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  CI/CD INTELLIGENCE &amp; PIPELINE DAG DIAGNOSTICS
                </h1>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  SANDBOX SIMULATION
                </span>
              </div>
              <p className={`text-xs font-sans ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Multi-hypothesis RCA, stage dependency barriers, and non-linear failure diagnostics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>RUNNER:</span>
              <span className={`font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                GVISOR-SANDBOX #4928
              </span>
            </div>

            <button
              onClick={handleReRunFullPipeline}
              disabled={isReRunningPipeline}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition cursor-pointer"
            >
              {isReRunningPipeline ? (
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              <span>{isReRunningPipeline ? 'DISPATCHING...' : 'DISPATCH RUN'}</span>
            </button>
          </div>
        </div>

        {/* Grid: Left Column (Pipeline Runs List) + Right Column (Pipeline DAG & Diagnostics) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left Column: Pipeline Runs / Scenarios */}
          <div
            className={`lg:col-span-4 border-r p-3 space-y-2 overflow-y-auto ${
              isDark ? 'bg-[#0F1115] border-[#1F2937]' : 'bg-[#F6F8FA] border-[#D0D7DE]'
            }`}
          >
            {/* Filter Bar */}
            <div className="space-y-2 mb-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search pipelines, commits, services..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className={`w-full text-xs pl-8 pr-3 py-1.5 rounded border focus:outline-hidden ${
                    isDark
                      ? 'bg-[#1A1D23] border-[#2D3748] text-white focus:border-emerald-500'
                      : 'bg-white border-gray-300 text-gray-900 focus:border-emerald-600 shadow-xs'
                  }`}
                />
              </div>

              {/* Category selection */}
              <div className="flex flex-wrap gap-1">
                {[
                  { id: 'ALL', label: 'ALL' },
                  { id: 'RACE_CONDITION', label: 'RACE' },
                  { id: 'CONFIGURATION_DRIFT', label: 'CONFIG' },
                  { id: 'DATABASE_MIGRATION', label: 'DB' },
                  { id: 'PERFORMANCE_REGRESSION', label: 'PERF' },
                  { id: 'SECURITY_REGRESSION', label: 'SEC' },
                  { id: 'FLAKY_TEST', label: 'FLAKY' }
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCategoryFilter(c.id)}
                    className={`px-2 py-0.5 rounded text-[9px] font-bold border transition cursor-pointer ${
                      categoryFilter === c.id
                        ? isDark
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-400'
                        : isDark
                        ? 'bg-[#1A1D23] text-gray-400 border-[#2D3748]'
                        : 'bg-white text-gray-600 border-gray-300'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scenarios List */}
            <div className="space-y-2">
              {filteredScenarios.map((sc) => {
                const isSelected = selectedScenarioId === sc.id;
                const hasFailure = (sc.pipelineStages || []).some((s) => s.status === 'FAILED');
                const hasFlaky = (sc.pipelineStages || []).some((s) => s.status === 'FLAKY');

                return (
                  <div
                    key={sc.id}
                    onClick={() => {
                      setSelectedScenarioId(sc.id);
                      setActiveStageIndex(0);
                    }}
                    className={`p-3 rounded-lg border transition cursor-pointer space-y-2 ${
                      isSelected
                        ? isDark
                          ? 'bg-[#1A1D23] border-emerald-500/60 ring-1 ring-emerald-500/30'
                          : 'bg-white border-emerald-600 ring-1 ring-emerald-600/20 shadow-md'
                        : isDark
                        ? 'bg-[#12161E] border-[#2D3748] hover:border-gray-600'
                        : 'bg-white border-gray-200 hover:border-gray-400 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-emerald-400">{sc.scenarioCode}</span>
                        <span className={`text-[10px] font-sans text-gray-400`}>({sc.service})</span>
                      </div>

                      <div className="flex items-center gap-1">
                        {hasFailure ? (
                          <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            FAILED
                          </span>
                        ) : hasFlaky ? (
                          <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            FLAKY
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            PASSED
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className={`text-xs font-bold line-clamp-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {sc.title}
                    </h3>

                    <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono pt-1 border-t border-gray-700/30">
                      <span>Commit: {sc.commitHash}</span>
                      <span>{sc.environment.toUpperCase()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Pipeline Stage DAG, Hypothesis Diagnostics & Log Stream */}
          <div className="lg:col-span-8 p-4 space-y-4 overflow-y-auto">
            {/* Active Pipeline Header */}
            <div
              className={`p-4 rounded-lg border space-y-3 ${
                isDark ? 'bg-[#0F1115] border-[#1F2937]' : 'bg-white border-[#D0D7DE] shadow-xs'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-400">[{scenario.scenarioCode}]</span>
                    <h2 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {scenario.title}
                    </h2>
                  </div>
                  <p className={`text-xs font-sans mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {scenario.problemPrompt}
                  </p>
                </div>

                {/* Action: Dispatch directly to Agent */}
                <button
                  onClick={() => {
                    if (onNavigateToAgent) {
                      onNavigateToAgent(scenario.problemPrompt, scenario.id);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer shadow-xs whitespace-nowrap"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>INVESTIGATE IN AGENT</span>
                </button>
              </div>
            </div>

            {/* DAG Pipeline Stages Visualizer */}
            <div
              className={`p-4 rounded-lg border space-y-3 ${
                isDark ? 'bg-[#0F1115] border-[#1F2937]' : 'bg-white border-[#D0D7DE] shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between border-b pb-2 border-[#2D3748]">
                <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  PIPELINE EXECUTION STAGES &amp; DEPENDENCY BARRIERS ({stages.length} TOTAL)
                </span>
                <span className="text-[10px] text-gray-500">
                  Click any stage (Stage 1 to Stage {stages.length}) to inspect logs &amp; failure state
                </span>
              </div>

              {/* Stages horizontal list - 5 column responsive grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
                {stages.map((stg, idx) => {
                  const isActive = safeStageIndex === idx;
                  return (
                    <button
                      key={stg.id || idx}
                      type="button"
                      onClick={() => setActiveStageIndex(idx)}
                      className={`text-left p-3 rounded-lg border transition cursor-pointer space-y-1.5 ${
                        isActive
                          ? isDark
                            ? 'bg-[#1A1D23] border-emerald-500 ring-2 ring-emerald-500/40 shadow-lg'
                            : 'bg-white border-emerald-600 ring-2 ring-emerald-600/40 shadow-md'
                          : isDark
                          ? 'bg-[#12161E] border-[#2D3748] hover:border-gray-500'
                          : 'bg-gray-50 border-gray-200 hover:border-gray-400 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-400 font-bold">STAGE {idx + 1}</span>
                        {getStageStatusBadge(stg.status)}
                      </div>

                      <h4 className={`text-xs font-bold line-clamp-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {stg.name}
                      </h4>

                      <span className="text-[10px] text-gray-500 block truncate">{stg.tool}</span>

                      <div className="text-[10px] text-gray-400 pt-1 border-t border-gray-700/30 flex items-center justify-between">
                        <span>Duration:</span>
                        <strong className="text-emerald-400">{stg.duration || '0s'}</strong>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STAGE INSPECTOR: Comprehensive Stage Details & Logs */}
            <ErrorBoundary moduleName="Stage Inspector">
              {!activeStage ? (
                <div
                  className={`p-6 rounded-lg border text-center space-y-3 ${
                    isDark ? 'bg-[#0F1115] border-[#1F2937]' : 'bg-white border-[#D0D7DE]'
                  }`}
                >
                  <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
                  <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    STAGE DETAILS
                  </h3>
                  <p className="text-xs text-gray-400 font-sans">
                    No execution details are currently available for the selected stage.
                  </p>
                  <button
                    onClick={() => setActiveStageIndex(0)}
                    className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer"
                  >
                    Reset to Stage 1
                  </button>
                </div>
              ) : (
                <div
                  className={`p-4 rounded-lg border space-y-4 ${
                    isDark ? 'bg-[#0F1115] border-[#1F2937]' : 'bg-white border-[#D0D7DE] shadow-xs'
                  }`}
                >
                  {/* Stage Inspector Top Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-[#2D3748]">
                    <div className="flex items-center gap-2.5">
                      <TerminalIcon className="w-4 h-4 text-sky-400" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-400">
                            STAGE {safeStageIndex + 1} OF {stages.length}:
                          </span>
                          <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {activeStage.name}
                          </span>
                          {getStageStatusBadge(activeStage.status)}
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-gray-400 mt-0.5">
                          <span>Tool: <strong className="text-gray-300">{activeStage.tool}</strong></span>
                          <span>Duration: <strong className="text-emerald-400">{activeStage.duration}</strong></span>
                          {activeStage.startTime && <span>Start: <strong className="text-gray-300">{activeStage.startTime}</strong></span>}
                          {activeStage.endTime && <span>End: <strong className="text-gray-300">{activeStage.endTime}</strong></span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={handleRetryStage}
                        disabled={isRetrying}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-200 text-[10px] font-bold transition cursor-pointer border border-gray-700"
                      >
                        <RotateCcw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
                        <span>{isRetrying ? 'RETRYING...' : 'RETRY STAGE'}</span>
                      </button>

                      <button
                        onClick={() => {
                          if (onNavigateToAgent) {
                            onNavigateToAgent(
                              `Investigate CI/CD failure in stage ${activeStage.name} (${activeStage.status}): ${activeStage.errorMessage || activeStage.blockedReason || 'Investigate logs'}`,
                              scenario.id
                            );
                          }
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold transition cursor-pointer"
                      >
                        <Bot className="w-3 h-3" />
                        <span>AGENT RCA</span>
                      </button>
                    </div>
                  </div>

                  {/* Stage Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className={`p-2.5 rounded border ${isDark ? 'bg-[#12161E] border-[#2D3748]' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="text-[10px] text-gray-400 uppercase">STATUS</div>
                      <div className="font-bold mt-0.5">{activeStage.status}</div>
                    </div>
                    <div className={`p-2.5 rounded border ${isDark ? 'bg-[#12161E] border-[#2D3748]' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="text-[10px] text-gray-400 uppercase">DURATION</div>
                      <div className="font-bold text-emerald-400 mt-0.5">{activeStage.duration}</div>
                    </div>
                    <div className={`p-2.5 rounded border ${isDark ? 'bg-[#12161E] border-[#2D3748]' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="text-[10px] text-gray-400 uppercase">START TIME</div>
                      <div className="font-bold text-gray-300 mt-0.5">{activeStage.startTime || '10:14:00 UTC'}</div>
                    </div>
                    <div className={`p-2.5 rounded border ${isDark ? 'bg-[#12161E] border-[#2D3748]' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="text-[10px] text-gray-400 uppercase">END TIME</div>
                      <div className="font-bold text-gray-300 mt-0.5">{activeStage.endTime || '10:14:44 UTC'}</div>
                    </div>
                  </div>

                  {/* Result & Diagnosis Note */}
                  {activeStage.result && (
                    <div className={`p-2.5 rounded border text-xs flex items-center gap-2 ${
                      activeStage.status === 'PASSED'
                        ? isDark ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : isDark ? 'bg-sky-500/10 border-sky-500/30 text-sky-300' : 'bg-sky-50 border-sky-200 text-sky-900'
                    }`}>
                      <Info className="w-4 h-4 shrink-0" />
                      <div>
                        <strong>RESULT:</strong> {activeStage.result}
                      </div>
                    </div>
                  )}

                  {/* Blocked or Error Banner */}
                  {activeStage.blockedReason && (
                    <div className="p-3 rounded bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                      <div>
                        <strong>DEPENDENCY BARRIER:</strong> {activeStage.blockedReason}
                      </div>
                    </div>
                  )}

                  {activeStage.errorMessage && (
                    <div className="p-3 rounded bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                      <div>
                        <strong>FAILURE REASON:</strong> {activeStage.errorMessage}
                      </div>
                    </div>
                  )}

                  {/* Logs Section with Search, Copy, Download */}
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                          EXECUTION LOGS ({(activeStage.logs || []).length} LINES)
                        </span>
                        {logFilterQuery && (
                          <span className="text-[10px] text-sky-400">
                            ({filteredLogs.length} matching)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Search className="w-3 h-3 absolute left-2 top-2 text-gray-500" />
                          <input
                            type="text"
                            placeholder="Filter logs..."
                            value={logFilterQuery}
                            onChange={(e) => setLogFilterQuery(e.target.value)}
                            className={`text-[10px] pl-6 pr-2 py-1 rounded border focus:outline-hidden ${
                              isDark
                                ? 'bg-[#0A0B0D] border-[#2D3748] text-white focus:border-emerald-500'
                                : 'bg-white border-gray-300 text-gray-900 focus:border-emerald-600'
                            }`}
                          />
                        </div>

                        <button
                          onClick={handleCopyLogs}
                          className="flex items-center gap-1 px-2 py-1 rounded bg-[#1A1D23] hover:bg-[#252A34] text-gray-300 border border-gray-700 text-[10px] font-bold transition cursor-pointer"
                          title="Copy logs"
                        >
                          {isLogsCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{isLogsCopied ? 'COPIED' : 'COPY'}</span>
                        </button>

                        <button
                          onClick={handleDownloadLogs}
                          className="flex items-center gap-1 px-2 py-1 rounded bg-[#1A1D23] hover:bg-[#252A34] text-gray-300 border border-gray-700 text-[10px] font-bold transition cursor-pointer"
                          title="Download logs"
                        >
                          <Download className="w-3 h-3" />
                          <span>EXPORT</span>
                        </button>

                        <button
                          onClick={() => setIsLogsExpanded(!isLogsExpanded)}
                          className="flex items-center gap-1 px-2 py-1 rounded bg-[#1A1D23] hover:bg-[#252A34] text-gray-300 border border-gray-700 text-[10px] font-bold transition cursor-pointer"
                          title="Toggle height"
                        >
                          {isLogsExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    {/* Terminal log output */}
                    <div
                      className={`p-3.5 rounded bg-[#07080A] border border-[#2D3748] space-y-1 text-xs font-mono text-gray-300 overflow-y-auto transition-all ${
                        isLogsExpanded ? 'max-h-96' : 'max-h-56'
                      }`}
                    >
                      {filteredLogs.length === 0 ? (
                        <div className="py-4 text-center text-gray-500 text-xs">
                          {logFilterQuery ? 'No log lines matched the search filter.' : 'No output logs recorded for this stage.'}
                        </div>
                      ) : (
                        filteredLogs.map((line, i) => (
                          <div
                            key={i}
                            className={`leading-relaxed ${
                              line.startsWith('$') || line.startsWith('[GATED]') || line.startsWith('[SAFETY')
                                ? 'text-amber-400 font-bold'
                                : line.includes('FAIL') || line.includes('Error') || line.includes('✗') || line.includes('CRITICAL')
                                ? 'text-rose-400 font-semibold'
                                : line.includes('PASS') || line.includes('✓') || line.includes('Clean')
                                ? 'text-emerald-400'
                                : line.includes('WARN') || line.includes('Warning') || line.includes('⚠️')
                                ? 'text-amber-300'
                                : 'text-gray-300'
                            }`}
                          >
                            {line}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </ErrorBoundary>

            {/* AI RCA & Hypothesis Preview */}
            <div
              className={`p-4 rounded-lg border space-y-3 ${
                isDark ? 'bg-[#0F1115] border-[#1F2937]' : 'bg-white border-[#D0D7DE] shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  AI ROOT CAUSE DIAGNOSIS ({(scenario.hypotheses || []).length} HYPOTHESES EVALUATED)
                </span>
                <span className="text-xs font-bold text-emerald-400">
                  Confidence: {scenario.rcaConfidence}% {scenario.isConfidenceSufficient ? '(CONFIRMED)' : '(UNCONFIRMED)'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                {(scenario.hypotheses || []).map((h) => (
                  <div
                    key={h.id}
                    className={`p-2.5 rounded border ${
                      h.status === 'SUPPORTED'
                        ? isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-300'
                        : h.status === 'ELIMINATED' || h.status === 'DISPROVEN'
                        ? isDark ? 'bg-gray-800/40 border-gray-700 text-gray-500 line-through' : 'bg-gray-100 border-gray-300 text-gray-500 line-through'
                        : isDark ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-sky-400">[{h.id}]</span>
                      <span className="text-[10px] font-bold">{h.status} ({h.finalConfidence}%)</span>
                    </div>
                    <h4 className="font-bold text-xs mt-1">{h.name}</h4>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300">
                <strong>CONCLUSION:</strong> {scenario.rcaSummary}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

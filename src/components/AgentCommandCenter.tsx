import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Terminal as TerminalIcon,
  GitPullRequest,
  Activity,
  Check,
  ChevronDown,
  X,
  Rocket,
  Shield,
  Layers,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  HelpCircle,
  Plus,
  Flame,
  Search,
  Filter,
  CheckCheck,
  Ban,
  Clock,
  Gauge,
  Lock
} from 'lucide-react';
import {
  RbacRole,
  RiskLevel,
  EngineeringScenario,
  REALISTIC_ENGINEERING_SCENARIOS,
  HypothesisItem
} from '../types';
import { DiffViewer } from './DiffViewer';
import { HypothesisEvidenceBoard } from './HypothesisEvidenceBoard';
import { ConfirmationModal, CreateTaskModal } from './Modals';
import { can } from '../lib/permissions';
import { useTheme } from '../context/ThemeContext';
import confetti from 'canvas-confetti';

interface AgentCommandCenterProps {
  currentRole: RbacRole;
  onNavigateView?: (view: string) => void;
  onCompleteHeroFlow?: () => void;
  initialTaskPrompt?: string;
  selectedScenarioId?: string;
}

export type ExecutionPhase =
  | 'READY'
  | 'ANALYZING_TELEMETRY'
  | 'RCA_HYPOTHESIS_EVAL'
  | 'PATCH_STAGED'
  | 'SANDBOX_STRESS_RUN'
  | 'DECISION_GATE'
  | 'ACTION_COMPLETED';

export const AgentCommandCenter: React.FC<AgentCommandCenterProps> = ({
  currentRole,
  onNavigateView,
  onCompleteHeroFlow,
  initialTaskPrompt,
  selectedScenarioId
}) => {
  const { isDark } = useTheme();

  // Find active scenario or default to Race Condition / Hero
  const [activeScenarioId, setActiveScenarioId] = useState<string>(
    selectedScenarioId || REALISTIC_ENGINEERING_SCENARIOS[0].id
  );

  const scenario: EngineeringScenario =
    REALISTIC_ENGINEERING_SCENARIOS.find((s) => s.id === activeScenarioId) ||
    REALISTIC_ENGINEERING_SCENARIOS[0];

  const [activeTab, setActiveTab] = useState<
    'rca' | 'diff' | 'sandbox' | 'pipeline' | 'telemetry' | 'terminal'
  >('rca');
  const [executionPhase, setExecutionPhase] = useState<ExecutionPhase>('READY');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [selectedHypothesisId, setSelectedHypothesisId] = useState<string>(
    scenario.concludedHypothesisId || scenario.hypotheses[0]?.id || 'h1'
  );

  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    desc: string;
    onConfirm: () => void;
  } | null>(null);

  // Terminal Logs
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    `$ agent-core init --session=8942 --policy=isolated_gvisor --scenario=${scenario.scenarioCode}`,
    `NexusDev AI Autonomous Engineering Engine initialized in GVisor Sandbox.`,
    `Target Service: ${scenario.service} | Environment: ${scenario.environment.toUpperCase()} | Severity: ${scenario.severity}`,
    `Problem: ${scenario.problemPrompt}`,
    `Ready for automated investigation & multi-signal diagnostic trace.`
  ]);

  // Timers
  const timerRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Scenario dropdown open state & outside click ref
  const [isScenarioDropdownOpen, setIsScenarioDropdownOpen] = useState(false);
  const scenarioDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        scenarioDropdownRef.current &&
        !scenarioDropdownRef.current.contains(event.target as Node)
      ) {
        setIsScenarioDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const clearActiveTimers = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearActiveTimers();
    };
  }, []);

  // When scenario changes, reset state
  useEffect(() => {
    clearActiveTimers();
    setExecutionPhase('READY');
    setActiveTab('rca');
    setSelectedHypothesisId(scenario.concludedHypothesisId || scenario.hypotheses?.[0]?.id || 'h1');
    setTerminalLogs([
      `$ agent-core switch-context --scenario=${scenario.scenarioCode}`,
      `Target: ${scenario.service} (${scenario.environment}) | Commit: ${scenario.commitHash}`,
      `Incident: ${scenario.incidentRef || 'PROACTIVE_VERIFICATION'}`,
      `Problem Statement: ${scenario.problemPrompt}`,
      `Ready to initiate multi-signal investigation and hypothesis testing.`
    ]);
  }, [activeScenarioId]);

  const canApprovePR = can(currentRole, 'approvePR');
  const canDeployProd = can(currentRole, 'deployProduction');

  // STEP 1: Start Investigation (Analyze Telemetry & Correlate Contradictory Signals)
  const handleStartInvestigation = () => {
    if (executionPhase !== 'READY') return;
    clearActiveTimers();
    setExecutionPhase('ANALYZING_TELEMETRY');
    setActiveTab('rca');
    setTerminalLogs((prev) => [
      ...prev,
      `$ telemetry.correlate --service=${scenario.service} --commit=${scenario.commitHash}`,
      `>> Correlating ${(scenario.contradictorySignals || []).length} telemetry streams...`,
      ...(scenario.observedFacts || []).map((f) => `>> [FACT] ${f}`),
      `$ logs.search --filter="severity>=WARN" --timeframe="1h"`,
      `>> Evaluating candidate root causes against observed facts...`
    ]);

    timerRef.current = window.setTimeout(() => {
      setExecutionPhase('RCA_HYPOTHESIS_EVAL');
      setTerminalLogs((prev) => [
        ...prev,
        `$ rca.evaluate-hypotheses --count=${(scenario.hypotheses || []).length}`,
        ...(scenario.hypotheses || []).map(
          (h) => `>> Hypothesis [${h.name}]: Confidence ${h.finalConfidence}% -> Status: ${h.status}`
        ),
        `✓ Diagnostic synthesis complete. RCA Confidence: ${scenario.rcaConfidence}%`
      ]);
      timerRef.current = null;
    }, 1800);
  };

  // STEP 2: Generate Remediation Patch / Plan
  const handleGeneratePatch = () => {
    if (executionPhase !== 'RCA_HYPOTHESIS_EVAL') return;
    clearActiveTimers();
    setExecutionPhase('PATCH_STAGED');
    setActiveTab('diff');
    setTerminalLogs((prev) => [
      ...prev,
      `$ patch.generate --target=${scenario.proposedPatch.filePath} --risk=${scenario.proposedPatch.riskLevel}`,
      `>> Generated patch for ${scenario.proposedPatch.filePath}`,
      `>> Security Impact: ${scenario.proposedPatch.securityImpact} | Regression Risk: ${scenario.proposedPatch.regressionRisk}`,
      `>> Performance Impact: ${scenario.proposedPatch.performanceImpact}`
    ]);
  };

  // STEP 3: Run Sandbox & Concurrency Stress Verification
  const handleRunSandboxTests = () => {
    if (executionPhase !== 'PATCH_STAGED') return;
    clearActiveTimers();
    setExecutionPhase('SANDBOX_STRESS_RUN');
    setActiveTab('sandbox');
    setTerminalLogs((prev) => [
      ...prev,
      `$ sandbox.exec --suite="${scenario.sandboxResults.suiteName}" --concurrency=100`,
      `>> Booting isolated gVisor runner...`,
      ...(scenario.sandboxResults?.logs || [])
    ]);

    timerRef.current = window.setTimeout(() => {
      setExecutionPhase('DECISION_GATE');
      setTerminalLogs((prev) => [
        ...prev,
        `✓ Sandbox execution finished in ${(scenario.sandboxResults.durationMs / 1000).toFixed(2)}s.`,
        `>> AI Policy Engine Verdict: ${scenario.aiVerdict}`,
        `>> Reason: ${scenario.verdictReason}`
      ]);
      timerRef.current = null;
    }, 2000);
  };

  // STEP 4: Execute Action Decision based on scenario verdict
  const handleExecuteDecision = () => {
    if (executionPhase !== 'DECISION_GATE') return;
    clearActiveTimers();
    setExecutionPhase('ACTION_COMPLETED');
    setActiveTab('pipeline');

    let actionLog = '';
    if (scenario.aiVerdict === 'APPROVE_FIX') {
      actionLog = `>> [ACTION EXECUTED] Approved and merged PR with verified safe patch. Promoted to staging canary.`;
      try {
        confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
      } catch {}
    } else if (scenario.aiVerdict === 'REJECT_BAD_FIX') {
      actionLog = `>> [SECURITY POLICY ENFORCED] Insecure patch rejected. Hardened zero-trust revocation patch applied and verified.`;
    } else if (scenario.aiVerdict === 'BLOCK_PERF_REGRESSION') {
      actionLog = `>> [PERFORMANCE GATE ENFORCED] Blocked promotion due to P95 SLA regression. Batch query optimization applied.`;
    } else if (scenario.aiVerdict === 'REQUIRE_SCHEMA_MIGRATION') {
      actionLog = `>> [ORCHESTRATION CORRECTED] Database DDL schema migration executed before application rollout. Zero-downtime restored.`;
    } else if (scenario.aiVerdict === 'TRIGGER_ROLLBACK') {
      actionLog = `>> [AUTOMATED ROLLBACK EXECUTED] Halted canary rollout. Reverted 100% traffic to stable release v2.4.0.`;
    } else if (scenario.aiVerdict === 'FLAG_FLAKY_QUARANTINE') {
      actionLog = `>> [FLAKY TEST QUARANTINED] Isolated non-deterministic test and applied async condition polling patch.`;
    } else if (scenario.aiVerdict === 'UNCONFIRMED_COLLECT_MORE') {
      actionLog = `>> [DIAGNOSTIC PROBE INJECTED] High-resolution OpenTelemetry spans active. Refused to modify code without sufficient telemetry.`;
    }

    setTerminalLogs((prev) => [
      ...prev,
      actionLog,
      `>> Incident status updated: RESOLVED / MITIGATED.`,
      `>> Audit ledger signature recorded.`
    ]);

    if (onCompleteHeroFlow) {
      onCompleteHeroFlow();
    }
  };

  const handleReset = () => {
    clearActiveTimers();
    setExecutionPhase('READY');
    setActiveTab('rca');
    setTerminalLogs([
      `$ agent-core init --session=8942 --scenario=${scenario.scenarioCode}`,
      `NexusDev AI Autonomous Engineering Engine ready.`,
      `Ready for task prompt dispatch and investigation.`
    ]);
  };

  const filteredScenarios = REALISTIC_ENGINEERING_SCENARIOS.filter((s) => {
    if (categoryFilter === 'ALL') return true;
    return s.category === categoryFilter;
  });

  const categories = [
    { id: 'ALL', label: 'All Scenarios' },
    { id: 'RACE_CONDITION', label: 'Race Conditions' },
    { id: 'CONFIGURATION_DRIFT', label: 'Config Drift' },
    { id: 'DATABASE_MIGRATION', label: 'DB Migration' },
    { id: 'PERFORMANCE_REGRESSION', label: 'Perf Regressions' },
    { id: 'SECURITY_REGRESSION', label: 'Security Gates' },
    { id: 'FLAKY_TEST', label: 'Flaky Tests' },
    { id: 'MEMORY_LEAK', label: 'Memory / K8s' },
    { id: 'DEPLOYMENT_FAILURE', label: 'Canary Failures' },
    { id: 'AMBIGUOUS_TELEMETRY', label: 'Ambiguous Telemetry' },
    { id: 'DEPENDENCY_CONFLICT', label: 'Dep Conflicts' }
  ];

  return (
    <div
      id="agent-command-center"
      className={`flex-1 flex flex-col lg:flex-row overflow-hidden font-mono transition-colors ${
        isDark ? 'bg-[#0A0B0D] text-[#E0E0E0]' : 'bg-[#F6F8FA] text-gray-900'
      }`}
    >
      {/* Main Section */}
      <section className="flex-1 p-4 lg:p-6 space-y-4 overflow-y-auto">
        {/* Simulation Notice Banner */}
        <div
          className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
            isDark
              ? 'bg-[#12161E] border-sky-500/30 text-sky-200'
              : 'bg-sky-50 border-sky-300 text-sky-900 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse shrink-0" />
            <span className="font-bold tracking-wider uppercase">
              SANDBOX SIMULATION ENVIRONMENT
            </span>
            <span className="hidden md:inline text-[11px] opacity-80 font-sans">
              — Isolated GVisor runner with multi-hypothesis root cause analysis & safety policy gates
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="opacity-75">RUNNER:</span>
            <span className="font-bold">GVISOR #4928-EVAL</span>
          </div>
        </div>

        {/* Scenario Switcher & Category Filter */}
        <div
          className={`p-4 rounded-lg border space-y-3 ${
            isDark ? 'bg-[#1A1D23] border-[#2D3748]' : 'bg-white border-[#D0D7DE] shadow-xs'
          }`}
        >
          {/* Line 1: Section Title & Reset Action */}
          <div className="flex items-center justify-between gap-3 min-w-0">
            <div className="flex items-center gap-2 shrink-0">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-900'}`}>
                SELECT ENGINEERING SCENARIO ({REALISTIC_ENGINEERING_SCENARIOS.length} REALISTIC CHALLENGES)
              </span>
            </div>

            <button
              id="reset-scenario-btn"
              onClick={handleReset}
              title="Reset scenario execution"
              className={`p-1.5 rounded border transition cursor-pointer shrink-0 ${
                isDark
                  ? 'bg-[#0A0B0D] hover:bg-[#2D3748] text-gray-400 hover:text-white border-[#2D3748]'
                  : 'bg-white hover:bg-gray-100 text-gray-600 hover:text-black border-gray-300'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Line 2: Scenario Selector Dropdown (1 line below, full width & responsive) */}
          <div className="w-full min-w-0" ref={scenarioDropdownRef}>
            <div className="relative w-full">
              <button
                type="button"
                id="scenario-selector-btn"
                onClick={() => setIsScenarioDropdownOpen((prev) => !prev)}
                className={`w-full flex items-center justify-between gap-2 text-xs px-3.5 py-2 rounded-lg border font-mono font-bold transition-colors cursor-pointer text-left ${
                  isDark
                    ? 'bg-[#0A0B0D] border-emerald-500/50 text-emerald-400 hover:border-emerald-400'
                    : 'bg-white border-emerald-600 text-emerald-900 shadow-xs hover:border-emerald-700'
                }`}
                aria-expanded={isScenarioDropdownOpen}
                aria-haspopup="listbox"
                title={`[${scenario.scenarioCode}] ${scenario.title}`}
              >
                <span className="truncate min-w-0 block">
                  [{scenario.scenarioCode}] {scenario.title}
                </span>
                <ChevronDown
                  className={`w-4 h-4 shrink-0 transition-transform duration-150 ${
                    isScenarioDropdownOpen ? 'rotate-180 text-emerald-300' : 'text-emerald-500/70'
                  }`}
                />
              </button>

              {/* Bounded Dropdown Menu */}
              {isScenarioDropdownOpen && (
                <div
                  className={`absolute left-0 right-0 top-full mt-1.5 w-full rounded-lg border shadow-2xl z-50 overflow-hidden backdrop-blur-md transition-all ${
                    isDark
                      ? 'bg-[#0D1117] border-[#30363D] text-gray-200 shadow-black/80'
                      : 'bg-white border-gray-300 text-gray-800 shadow-xl'
                  }`}
                  role="listbox"
                >
                  <div
                    className={`p-2.5 border-b text-[10px] font-mono flex items-center justify-between ${
                      isDark ? 'border-[#21262D] bg-[#161B22] text-gray-400' : 'border-gray-200 bg-gray-50 text-gray-500'
                    }`}
                  >
                    <span className="uppercase font-bold tracking-wider">AVAILABLE SCENARIOS</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                      {filteredScenarios.length} CHALLENGES
                    </span>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-gray-800/40 p-1">
                    {filteredScenarios.map((sc) => {
                      const isSelected = sc.id === activeScenarioId;
                      return (
                        <button
                          key={sc.id}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => {
                            setActiveScenarioId(sc.id);
                            setIsScenarioDropdownOpen(false);
                          }}
                          className={`w-full text-left p-2.5 rounded-md text-xs font-mono transition-colors flex items-start gap-2.5 cursor-pointer ${
                            isSelected
                              ? isDark
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                : 'bg-emerald-50 text-emerald-950 border border-emerald-300'
                              : isDark
                              ? 'hover:bg-[#1C2128] text-gray-300 hover:text-white'
                              : 'hover:bg-gray-100 text-gray-700 hover:text-black'
                          }`}
                        >
                          <span
                            className={`mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 border ${
                              isSelected
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                : isDark
                                ? 'bg-gray-800 text-gray-400 border-gray-700'
                                : 'bg-gray-200 text-gray-700 border-gray-300'
                            }`}
                          >
                            {sc.scenarioCode}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold break-words leading-snug whitespace-normal">
                              {sc.title}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[10px] opacity-75">
                              <span className="truncate">{sc.service}</span>
                              <span>•</span>
                              <span
                                className={
                                  sc.severity === 'P1'
                                    ? 'text-rose-400 font-bold'
                                    : sc.severity === 'P2'
                                    ? 'text-amber-400 font-bold'
                                    : 'text-sky-400 font-bold'
                                }
                              >
                                {sc.severity}
                              </span>
                            </div>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-2.5 py-1 rounded text-[10px] font-mono transition cursor-pointer border ${
                  categoryFilter === cat.id
                    ? isDark
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold'
                      : 'bg-emerald-50 text-emerald-900 border-emerald-400 font-bold shadow-xs'
                    : isDark
                    ? 'bg-[#0F1115] text-gray-400 hover:text-white border-[#2D3748]'
                    : 'bg-gray-100 text-gray-600 hover:text-black border-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Active Scenario Card Header */}
        <div
          className={`border rounded-lg flex flex-col min-h-[620px] transition-colors shadow-xs ${
            isDark ? 'bg-[#1A1D23] border-[#2D3748]' : 'bg-white border-[#D0D7DE]'
          }`}
        >
          {/* Scenario Meta Top Bar */}
          <div
            className={`p-4 border-b flex flex-wrap items-center justify-between gap-3 ${
              isDark ? 'bg-[#0F1115] border-[#2D3748]' : 'bg-gray-50 border-[#D0D7DE]'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    scenario.severity === 'P1'
                      ? isDark
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : 'bg-rose-100 text-rose-800 border-rose-300'
                      : isDark
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}
                >
                  {scenario.severity} CRITICAL
                </span>

                <span className="text-xs font-bold text-emerald-400">
                  {scenario.scenarioCode}
                </span>

                <span className={`text-xs font-sans text-gray-400`}>
                  service: <strong className={isDark ? 'text-white' : 'text-gray-900'}>{scenario.service}</strong>
                </span>

                <span className={`text-xs font-sans text-gray-400`}>
                  env: <strong className="text-amber-400 uppercase">{scenario.environment}</strong>
                </span>
              </div>

              <h2 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {scenario.title}
              </h2>
            </div>

            {/* Primary Action Button based on execution phase */}
            <div className="flex items-center gap-2">
              {executionPhase === 'READY' && (
                <button
                  onClick={handleStartInvestigation}
                  className="flex items-center gap-2 px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(16,185,129,0.4)] transition cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>START INVESTIGATION</span>
                </button>
              )}

              {executionPhase === 'ANALYZING_TELEMETRY' && (
                <div className="flex items-center gap-2 px-4 py-2 rounded bg-sky-600/30 border border-sky-500/50 text-sky-300 text-xs font-bold animate-pulse">
                  <Activity className="w-3.5 h-3.5 animate-spin" />
                  <span>ANALYZING MULTI-SIGNAL TELEMETRY...</span>
                </div>
              )}

              {executionPhase === 'RCA_HYPOTHESIS_EVAL' && (
                <button
                  onClick={handleGeneratePatch}
                  className="flex items-center gap-2 px-4 py-2 rounded bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(168,85,247,0.4)] transition cursor-pointer"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>GENERATE PROPOSED FIX</span>
                </button>
              )}

              {executionPhase === 'PATCH_STAGED' && (
                <button
                  onClick={handleRunSandboxTests}
                  className="flex items-center gap-2 px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(16,185,129,0.4)] transition cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>RUN SANDBOX & CONCURRENCY STRESS</span>
                </button>
              )}

              {executionPhase === 'SANDBOX_STRESS_RUN' && (
                <div className="flex items-center gap-2 px-4 py-2 rounded bg-amber-600/30 border border-amber-500/50 text-amber-300 text-xs font-bold animate-pulse">
                  <TerminalIcon className="w-3.5 h-3.5 animate-bounce" />
                  <span>RUNNING GVISOR TEST MATRIX...</span>
                </div>
              )}

              {executionPhase === 'DECISION_GATE' && (
                <button
                  onClick={handleExecuteDecision}
                  className={`flex items-center gap-2 px-4 py-2 rounded text-white font-bold text-xs transition cursor-pointer shadow-md ${
                    scenario.aiVerdict === 'APPROVE_FIX'
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/30'
                      : scenario.aiVerdict === 'REJECT_BAD_FIX'
                      ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/30'
                      : scenario.aiVerdict === 'BLOCK_PERF_REGRESSION'
                      ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/30'
                      : scenario.aiVerdict === 'TRIGGER_ROLLBACK'
                      ? 'bg-rose-700 hover:bg-rose-600 shadow-rose-700/30'
                      : 'bg-sky-600 hover:bg-sky-500 shadow-sky-500/30'
                  }`}
                >
                  {scenario.aiVerdict === 'APPROVE_FIX' && <CheckCircle2 className="w-3.5 h-3.5" />}
                  {scenario.aiVerdict === 'REJECT_BAD_FIX' && <Ban className="w-3.5 h-3.5" />}
                  {scenario.aiVerdict === 'BLOCK_PERF_REGRESSION' && <AlertTriangle className="w-3.5 h-3.5" />}
                  {scenario.aiVerdict === 'TRIGGER_ROLLBACK' && <RotateCcw className="w-3.5 h-3.5" />}
                  {scenario.aiVerdict === 'REQUIRE_SCHEMA_MIGRATION' && <Layers className="w-3.5 h-3.5" />}
                  {scenario.aiVerdict === 'FLAG_FLAKY_QUARANTINE' && <AlertCircle className="w-3.5 h-3.5" />}
                  {scenario.aiVerdict === 'UNCONFIRMED_COLLECT_MORE' && <Search className="w-3.5 h-3.5" />}
                  <span>
                    {scenario.aiVerdict === 'APPROVE_FIX'
                      ? 'APPROVE PR & DEPLOY'
                      : scenario.aiVerdict === 'REJECT_BAD_FIX'
                      ? 'REJECT INSECURE FIX (SECURITY GATE)'
                      : scenario.aiVerdict === 'BLOCK_PERF_REGRESSION'
                      ? 'BLOCK PROMOTION (PERF SLA)'
                      : scenario.aiVerdict === 'TRIGGER_ROLLBACK'
                      ? 'EXECUTE CANARY ROLLBACK'
                      : scenario.aiVerdict === 'REQUIRE_SCHEMA_MIGRATION'
                      ? 'RUN DDL MIGRATION & DEPLOY'
                      : scenario.aiVerdict === 'FLAG_FLAKY_QUARANTINE'
                      ? 'QUARANTINE FLAKY TEST & PATCH'
                      : 'INJECT DIAGNOSTIC PROBE'}
                  </span>
                </button>
              )}

              {executionPhase === 'ACTION_COMPLETED' && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                  <CheckCheck className="w-4 h-4 text-emerald-400" />
                  <span>ACTION EXECUTED &amp; VERIFIED</span>
                </div>
              )}
            </div>
          </div>

          {/* Workflow Stepper Status Bar */}
          <div
            className={`px-4 py-2 border-b overflow-x-auto flex items-center gap-2 text-[11px] ${
              isDark ? 'bg-[#0A0B0D] border-[#2D3748]' : 'bg-gray-100 border-[#D0D7DE]'
            }`}
          >
            {[
              { id: 'READY', label: '1. Problem Staged' },
              { id: 'ANALYZING_TELEMETRY', label: '2. Multi-Signal Correlate' },
              { id: 'RCA_HYPOTHESIS_EVAL', label: '3. Multi-Hypothesis RCA' },
              { id: 'PATCH_STAGED', label: '4. Patch & Risk Review' },
              { id: 'SANDBOX_STRESS_RUN', label: '5. Concurrency / Stress' },
              { id: 'DECISION_GATE', label: '6. Policy Decision Gate' },
              { id: 'ACTION_COMPLETED', label: '7. Execution Complete' }
            ].map((step, idx) => {
              const isCurrent = executionPhase === step.id;
              const isPassed =
                ['READY', 'ANALYZING_TELEMETRY', 'RCA_HYPOTHESIS_EVAL', 'PATCH_STAGED', 'SANDBOX_STRESS_RUN', 'DECISION_GATE', 'ACTION_COMPLETED'].indexOf(executionPhase) > idx;

              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded whitespace-nowrap border ${
                    isCurrent
                      ? isDark
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 font-bold shadow-xs'
                        : 'bg-emerald-100 text-emerald-900 border-emerald-500 font-bold shadow-xs'
                      : isPassed
                      ? isDark
                        ? 'bg-gray-800/80 text-gray-300 border-gray-700'
                        : 'bg-gray-200 text-gray-700 border-gray-300'
                      : isDark
                      ? 'text-gray-600 border-transparent'
                      : 'text-gray-400 border-transparent'
                  }`}
                >
                  {isPassed && <Check className="w-3 h-3 text-emerald-400" />}
                  <span>{step.label}</span>
                </div>
              );
            })}
          </div>

          {/* Main Inspection Tabs */}
          <div className="p-4 flex-1 flex flex-col space-y-4">
            {/* Tab Navigation */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 border-[#2D3748]">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setActiveTab('rca')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition cursor-pointer border ${
                    activeTab === 'rca'
                      ? isDark
                        ? 'bg-[#2D3748] text-white border-[#374151] font-bold shadow-xs'
                        : 'bg-gray-200 text-gray-900 border-gray-300 font-bold shadow-xs'
                      : isDark
                      ? 'bg-[#0A0B0D] hover:bg-[#1A1D23] text-gray-400 hover:text-white border-[#2D3748]'
                      : 'bg-white hover:bg-gray-100 text-gray-600 hover:text-black border-gray-200'
                  }`}
                >
                  <Search className="w-3.5 h-3.5 text-sky-400" />
                  <span>Investigation &amp; RCA ({scenario.hypotheses.length} Hypotheses)</span>
                </button>

                <button
                  onClick={() => setActiveTab('diff')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition cursor-pointer border ${
                    activeTab === 'diff'
                      ? isDark
                        ? 'bg-[#2D3748] text-white border-[#374151] font-bold shadow-xs'
                        : 'bg-gray-200 text-gray-900 border-gray-300 font-bold shadow-xs'
                      : isDark
                      ? 'bg-[#0A0B0D] hover:bg-[#1A1D23] text-gray-400 hover:text-white border-[#2D3748]'
                      : 'bg-white hover:bg-gray-100 text-gray-600 hover:text-black border-gray-200'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Git Diff &amp; Safety Review</span>
                </button>

                <button
                  onClick={() => setActiveTab('sandbox')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition cursor-pointer border ${
                    activeTab === 'sandbox'
                      ? isDark
                        ? 'bg-[#2D3748] text-white border-[#374151] font-bold shadow-xs'
                        : 'bg-gray-200 text-gray-900 border-gray-300 font-bold shadow-xs'
                      : isDark
                      ? 'bg-[#0A0B0D] hover:bg-[#1A1D23] text-gray-400 hover:text-white border-[#2D3748]'
                      : 'bg-white hover:bg-gray-100 text-gray-600 hover:text-black border-gray-200'
                  }`}
                >
                  <Gauge className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sandbox &amp; Stress Matrix</span>
                </button>

                <button
                  onClick={() => setActiveTab('pipeline')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition cursor-pointer border ${
                    activeTab === 'pipeline'
                      ? isDark
                        ? 'bg-[#2D3748] text-white border-[#374151] font-bold shadow-xs'
                        : 'bg-gray-200 text-gray-900 border-gray-300 font-bold shadow-xs'
                      : isDark
                      ? 'bg-[#0A0B0D] hover:bg-[#1A1D23] text-gray-400 hover:text-white border-[#2D3748]'
                      : 'bg-white hover:bg-gray-100 text-gray-600 hover:text-black border-gray-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  <span>Workflow DAG Stages</span>
                </button>

                <button
                  onClick={() => setActiveTab('telemetry')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition cursor-pointer border ${
                    activeTab === 'telemetry'
                      ? isDark
                        ? 'bg-[#2D3748] text-white border-[#374151] font-bold shadow-xs'
                        : 'bg-gray-200 text-gray-900 border-gray-300 font-bold shadow-xs'
                      : isDark
                      ? 'bg-[#0A0B0D] hover:bg-[#1A1D23] text-gray-400 hover:text-white border-[#2D3748]'
                      : 'bg-white hover:bg-gray-100 text-gray-600 hover:text-black border-gray-200'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5 text-rose-400" />
                  <span>Contradictory Telemetry HUD</span>
                </button>

                <button
                  onClick={() => setActiveTab('terminal')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition cursor-pointer border ${
                    activeTab === 'terminal'
                      ? isDark
                        ? 'bg-[#2D3748] text-white border-[#374151] font-bold shadow-xs'
                        : 'bg-gray-200 text-gray-900 border-gray-300 font-bold shadow-xs'
                      : isDark
                      ? 'bg-[#0A0B0D] hover:bg-[#1A1D23] text-gray-400 hover:text-white border-[#2D3748]'
                      : 'bg-white hover:bg-gray-100 text-gray-600 hover:text-black border-gray-200'
                  }`}
                >
                  <TerminalIcon className="w-3.5 h-3.5 text-sky-400" />
                  <span>Sandbox Terminal</span>
                </button>
              </div>
            </div>

            {/* TAB 1: MULTI-HYPOTHESIS INVESTIGATION & RCA */}
            {activeTab === 'rca' && (
              <div className="space-y-4">
                {/* Observed Facts vs Contradictory Signals */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Observed Facts */}
                  <div
                    className={`p-4 rounded-lg border space-y-2.5 ${
                      isDark ? 'bg-[#0F1115] border-[#2D3748]' : 'bg-gray-50 border-[#D0D7DE]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        OBSERVED FACTS ({(scenario.observedFacts || []).length})
                      </span>
                      <span className="text-[10px] text-emerald-400 font-bold">REAL TELEMETRY SIGNALS</span>
                    </div>

                    <ul className="space-y-2 text-xs">
                      {(scenario.observedFacts || []).map((fact, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-sky-400 font-bold">[{i + 1}]</span>
                          <span className={isDark ? 'text-gray-300' : 'text-gray-800'}>{fact}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Contradictory Telemetry Signals Matrix */}
                  <div
                    className={`p-4 rounded-lg border space-y-2.5 ${
                      isDark ? 'bg-[#0F1115] border-[#2D3748]' : 'bg-gray-50 border-[#D0D7DE]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        CONTRADICTORY TELEMETRY SIGNALS
                      </span>
                      <span className="text-[10px] text-amber-400 font-bold">CONFLICT DETECTION</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      {(scenario.contradictorySignals || []).map((sig, i) => (
                        <div
                          key={i}
                          className={`p-2.5 rounded border flex flex-col gap-1 ${
                            sig.status === 'CRITICAL'
                              ? isDark ? 'bg-rose-500/10 border-rose-500/30' : 'bg-rose-50 border-rose-200'
                              : sig.status === 'CONFLICTING'
                              ? isDark ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200'
                              : isDark ? 'bg-[#1A1D23] border-[#2D3748]' : 'bg-white border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sky-400">{sig.metric}</span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                sig.status === 'HEALTHY'
                                  ? 'text-emerald-400'
                                  : sig.status === 'CRITICAL'
                                  ? 'text-rose-400'
                                  : 'text-amber-400'
                              }`}
                            >
                              {sig.value} ({sig.status})
                            </span>
                          </div>
                          <p className={`text-[11px] font-sans ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {sig.interpretation}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Multi-Hypothesis Evidence Board */}
                <HypothesisEvidenceBoard
                  scenario={scenario}
                  selectedHypothesisId={selectedHypothesisId}
                  onSelectHypothesis={(id) => setSelectedHypothesisId(id)}
                  executionPhase={executionPhase}
                  onRunSandboxTests={handleRunSandboxTests}
                />
              </div>
            )}

            {/* TAB 2: GIT DIFF & SAFETY REVIEW */}
            {activeTab === 'diff' && (
              <div className="space-y-4">
                {/* Risk & Safety Impact Badges */}
                <div
                  className={`p-3 rounded-lg border grid grid-cols-2 md:grid-cols-4 gap-3 text-xs ${
                    isDark ? 'bg-[#0F1115] border-[#2D3748]' : 'bg-gray-50 border-[#D0D7DE]'
                  }`}
                >
                  <div>
                    <span className="text-[10px] text-gray-500 block uppercase">Risk Level</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[11px] border inline-block mt-0.5 ${
                        scenario.proposedPatch.riskLevel === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : scenario.proposedPatch.riskLevel === 'HIGH'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      {scenario.proposedPatch.riskLevel}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-500 block uppercase">Security Impact</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[11px] border inline-block mt-0.5 ${
                        scenario.proposedPatch.securityImpact === 'HIGH_RISK_BYPASS'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : scenario.proposedPatch.securityImpact === 'STRENGTHENED'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-gray-800 text-gray-300 border-gray-700'
                      }`}
                    >
                      {scenario.proposedPatch.securityImpact}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-500 block uppercase">Regression Risk</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[11px] border inline-block mt-0.5 ${
                        scenario.proposedPatch.regressionRisk === 'CRITICAL' || scenario.proposedPatch.regressionRisk === 'HIGH'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      {scenario.proposedPatch.regressionRisk}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-500 block uppercase">Performance Impact</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[11px] border inline-block mt-0.5 ${
                        scenario.proposedPatch.performanceImpact === 'REGRESSION_DETECTED'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      {scenario.proposedPatch.performanceImpact}
                    </span>
                  </div>
                </div>

                {/* Diff Viewer */}
                <DiffViewer
                  filePath={scenario.proposedPatch.filePath}
                  originalCode={scenario.proposedPatch.originalCode}
                  modifiedCode={scenario.proposedPatch.modifiedCode}
                  patchExplanation={scenario.proposedPatch.patchExplanation}
                  insertions={12}
                  deletions={4}
                />
              </div>
            )}

            {/* TAB 3: SANDBOX & CONCURRENCY STRESS MATRIX */}
            {activeTab === 'sandbox' && (
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-lg border space-y-4 ${
                    isDark ? 'bg-[#0F1115] border-[#2D3748]' : 'bg-gray-50 border-[#D0D7DE]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        SANDBOX ISOLATION SUITE: {scenario.sandboxResults.suiteName}
                      </h3>
                      <p className={`text-[11px] font-sans text-gray-400 mt-0.5`}>
                        GVisor Container #4928 | Test Duration: {(scenario.sandboxResults.durationMs / 1000).toFixed(2)}s | Coverage: {scenario.sandboxResults.coveragePercent}%
                      </p>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded text-xs font-bold border ${
                        scenario.sandboxResults.failed === 0
                          ? isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : isDark ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-rose-100 text-rose-800 border-rose-300'
                      }`}
                    >
                      {scenario.sandboxResults.failed === 0 ? 'ALL ASSERTIONS GREEN' : 'ANOMALY DETECTED'}
                    </span>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className={`p-3 rounded border ${isDark ? 'bg-[#1A1D23] border-[#2D3748]' : 'bg-white border-gray-200'}`}>
                      <span className="text-[10px] text-gray-500 uppercase">Total Tests</span>
                      <div className="text-xl font-bold">{scenario.sandboxResults.totalTests}</div>
                      <span className="text-[10px] text-emerald-400">Pass Rate: 100%</span>
                    </div>

                    {scenario.concurrencyTest && (
                      <div className={`p-3 rounded border ${isDark ? 'bg-[#1A1D23] border-[#2D3748]' : 'bg-white border-gray-200'}`}>
                        <span className="text-[10px] text-gray-500 uppercase">Concurrency (100 workers)</span>
                        <div className="text-xl font-bold text-sky-400">{scenario.concurrencyTest.concurrencyFailureRate}</div>
                        <span className="text-[10px] text-emerald-400">CAS Collisions: 0</span>
                      </div>
                    )}

                    <div className={`p-3 rounded border ${isDark ? 'bg-[#1A1D23] border-[#2D3748]' : 'bg-white border-gray-200'}`}>
                      <span className="text-[10px] text-gray-500 uppercase">Coverage</span>
                      <div className="text-xl font-bold text-emerald-400">{scenario.sandboxResults.coveragePercent}%</div>
                      <span className="text-[10px] text-gray-400">Branch &amp; Statements</span>
                    </div>

                    <div className={`p-3 rounded border ${isDark ? 'bg-[#1A1D23] border-[#2D3748]' : 'bg-white border-gray-200'}`}>
                      <span className="text-[10px] text-gray-500 uppercase">AI Policy Verdict</span>
                      <div className={`text-sm font-bold mt-1 ${
                        scenario.aiVerdict === 'APPROVE_FIX' ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {scenario.aiVerdict}
                      </div>
                    </div>
                  </div>

                  {/* Anomaly Alerts if any */}
                  {scenario.sandboxResults.performanceAnomaly && (
                    <div className="p-3 rounded bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                      <div>
                        <strong>PERFORMANCE ANOMALY AUDIT:</strong> {scenario.sandboxResults.performanceAnomaly}
                      </div>
                    </div>
                  )}

                  {scenario.sandboxResults.securityViolation && (
                    <div className="p-3 rounded bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2">
                      <Shield className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                      <div>
                        <strong>SECURITY REGRESSION AUDIT:</strong> {scenario.sandboxResults.securityViolation}
                      </div>
                    </div>
                  )}

                  {/* Sandbox Run Logs */}
                  <div className="p-3 rounded bg-[#0A0B0D] border border-[#2D3748] space-y-1 text-xs text-gray-300 font-mono">
                    <span className="text-[10px] text-gray-500 uppercase block mb-1">EXECUTION TRACE</span>
                    {(scenario.sandboxResults?.logs || []).map((log, i) => (
                      <div key={i} className="text-emerald-400 font-mono">
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: WORKFLOW DAG STAGES */}
            {activeTab === 'pipeline' && (
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-lg border space-y-4 ${
                    isDark ? 'bg-[#0F1115] border-[#2D3748]' : 'bg-gray-50 border-[#D0D7DE]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        PIPELINE EXECUTION DAG &amp; DEPENDENCY GRAPH
                      </h3>
                      <p className={`text-[11px] font-sans text-gray-400 mt-0.5`}>
                        Pipeline stages enforce prerequisite checks, blocking downstream stages upon failure.
                      </p>
                    </div>

                    <span className="text-[10px] font-mono text-emerald-400">
                      TARGET: {scenario.environment.toUpperCase()}
                    </span>
                  </div>

                  {/* DAG Stages */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {(scenario.pipelineStages || []).map((stage, idx) => (
                      <div
                        key={stage.id}
                        className={`p-3.5 rounded-lg border flex flex-col justify-between gap-3 text-xs ${
                          stage.status === 'PASSED'
                            ? isDark ? 'bg-[#1A1D23] border-emerald-500/40' : 'bg-white border-emerald-300 shadow-xs'
                            : stage.status === 'FAILED'
                            ? isDark ? 'bg-rose-500/10 border-rose-500/50' : 'bg-rose-50 border-rose-300 shadow-xs'
                            : stage.status === 'BLOCKED'
                            ? isDark ? 'bg-[#12161E] border-gray-700 opacity-70' : 'bg-gray-100 border-gray-300 opacity-80'
                            : isDark ? 'bg-amber-500/10 border-amber-500/40' : 'bg-amber-50 border-amber-300 shadow-xs'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-gray-500 font-mono">STAGE {idx + 1}</span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                stage.status === 'PASSED'
                                  ? isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : stage.status === 'FAILED'
                                  ? isDark ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-rose-100 text-rose-800 border-rose-300'
                                  : stage.status === 'BLOCKED'
                                  ? isDark ? 'bg-gray-800 text-gray-400 border-gray-700' : 'bg-gray-200 text-gray-700 border-gray-400'
                                  : isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-amber-100 text-amber-800 border-amber-300'
                              }`}
                            >
                              {stage.status}
                            </span>
                          </div>

                          <h4 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stage.name}</h4>
                          <span className="text-[10px] text-gray-500 block">{stage.tool}</span>

                          {stage.blockedReason && (
                            <p className="text-[10px] text-amber-400/90 font-sans mt-1">
                              ⚠️ {stage.blockedReason}
                            </p>
                          )}

                          {stage.errorMessage && (
                            <p className="text-[10px] text-rose-400 font-sans mt-1">
                              ✗ {stage.errorMessage}
                            </p>
                          )}
                        </div>

                        <div className="text-[10px] text-gray-500 pt-2 border-t border-[#2D3748]">
                          Duration: <strong className="text-emerald-400">{stage.duration}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: TELEMETRY HUD */}
            {activeTab === 'telemetry' && (
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-lg border grid grid-cols-2 md:grid-cols-4 gap-3 ${
                    isDark ? 'bg-[#0F1115] border-[#2D3748]' : 'bg-gray-50 border-[#D0D7DE]'
                  }`}
                >
                  <div className={`p-3 border rounded ${isDark ? 'bg-[#1A1D23] border-[#2D3748]' : 'bg-white border-gray-200'}`}>
                    <span className="text-[10px] text-gray-500 uppercase">P95 Latency</span>
                    <div className="text-xl font-bold text-emerald-400">38 ms</div>
                    <span className="text-[10px] text-emerald-600 font-sans">SLA Target &lt; 50ms</span>
                  </div>

                  <div className={`p-3 border rounded ${isDark ? 'bg-[#1A1D23] border-[#2D3748]' : 'bg-white border-gray-200'}`}>
                    <span className="text-[10px] text-gray-500 uppercase">500 Errors</span>
                    <div className="text-xl font-bold text-emerald-400">0.01 %</div>
                    <span className="text-[10px] text-emerald-600 font-sans">Healthy baseline</span>
                  </div>

                  <div className={`p-3 border rounded ${isDark ? 'bg-[#1A1D23] border-[#2D3748]' : 'bg-white border-gray-200'}`}>
                    <span className="text-[10px] text-gray-500 uppercase">Active Pods</span>
                    <div className="text-xl font-bold text-white">4 / 4</div>
                    <span className="text-[10px] text-emerald-600 font-sans">100% Ready</span>
                  </div>

                  <div className={`p-3 border rounded ${isDark ? 'bg-[#1A1D23] border-[#2D3748]' : 'bg-white border-gray-200'}`}>
                    <span className="text-[10px] text-gray-500 uppercase">DB Pool Capacity</span>
                    <div className="text-xl font-bold text-white">22 %</div>
                    <span className="text-[10px] text-emerald-600 font-sans">Optimal headroom</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: SANDBOX TERMINAL */}
            {activeTab === 'terminal' && (
              <div
                className={`p-4 rounded-lg border h-72 overflow-y-auto space-y-1 text-xs font-mono ${
                  isDark ? 'bg-[#0A0B0D] border-[#2D3748]' : 'bg-gray-900 border-[#D0D7DE]'
                }`}
              >
                {(terminalLogs || []).map((log, index) => {
                  const isCommand = log.startsWith('$');
                  const isSuccess = log.includes('✓') || log.includes('passed') || log.includes('Healthy');
                  const isError = log.includes('FAIL') || log.includes('Error') || log.includes('CRITICAL');
                  const isWarn = log.includes('WARN') || log.includes('>>') || log.includes('Hypothesis');

                  return (
                    <div
                      key={index}
                      className={
                        isCommand
                          ? 'text-gray-400 font-bold'
                          : isSuccess
                          ? 'text-emerald-400 font-medium'
                          : isError
                          ? 'text-rose-400 font-semibold'
                          : isWarn
                          ? 'text-sky-300'
                          : 'text-gray-300'
                      }
                    >
                      {log}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        onSubmit={(prompt, title) => {
          handleReset();
        }}
      />

      {/* Confirmation Modal */}
      {confirmAction && (
        <ConfirmationModal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          onConfirm={() => {
            confirmAction.onConfirm();
            setIsConfirmModalOpen(false);
          }}
          title={confirmAction.title}
          description={confirmAction.desc}
        />
      )}
    </div>
  );
};

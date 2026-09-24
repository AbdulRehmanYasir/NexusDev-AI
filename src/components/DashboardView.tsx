import React, { useState } from 'react';
import {
  Activity,
  Bot,
  Flame,
  Workflow,
  Rocket,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Server,
  Layers,
  FileCode,
  CheckCircle2,
  Terminal,
  ExternalLink,
  ChevronRight,
  Clock,
  Cpu,
  GitCommit,
  GitBranch,
  Shield
} from 'lucide-react';
import {
  IncidentRecord,
  PipelineRun,
  DeploymentRecord,
  IssueTicket,
  RbacRole,
  NavViewId
} from '../types';
import { MetricDetailModal, ConfirmationModal } from './Modals';
import { useTheme } from '../context/ThemeContext';

interface DashboardViewProps {
  onNavigate: (view: NavViewId, subItemId?: string) => void;
  incidents: IncidentRecord[];
  pipelines: PipelineRun[];
  deployments: DeploymentRecord[];
  issues: IssueTicket[];
  currentRole: RbacRole;
  onDispatchAgentHero?: (promptText?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  incidents = [],
  pipelines = [],
  deployments = [],
  issues = [],
  currentRole,
  onDispatchAgentHero
}) => {
  const { isDark } = useTheme();
  const safeIncidents = incidents || [];
  const safePipelines = pipelines || [];
  const safeDeployments = deployments || [];
  const safeIssues = issues || [];

  const activeIncident = safeIncidents.find((i) => i.status !== 'RESOLVED');
  const failingPipeline = safePipelines.find((p) => p.status === 'FAILED');

  const [activeMetricModal, setActiveMetricModal] = useState<'latency' | 'errorRate' | 'cpu' | 'memory' | 'requests' | null>(null);
  const [selectedDeployment, setSelectedDeployment] = useState<DeploymentRecord | null>(null);

  const handleIncidentClick = (incidentId: string) => {
    onNavigate('incidents', incidentId);
  };

  const handlePipelineClick = (pipelineId: string) => {
    onNavigate('pipelines', pipelineId);
  };

  const handleDeploymentClick = (deploymentId: string) => {
    onNavigate('deployments', deploymentId);
  };

  const handleIssueClick = (issueId: string) => {
    onNavigate('issues', issueId);
  };

  return (
    <div
      id="dashboard-view"
      className={`flex-1 p-6 space-y-6 overflow-y-auto font-mono transition-colors ${
        isDark ? 'bg-[#0A0B0D] text-[#E0E0E0]' : 'bg-[#F6F8FA] text-[#0F172A]'
      }`}
    >
      {/* Top Engineering Health Console Header */}
      <div
        className={`p-5 rounded-lg border shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 transition-colors ${
          isDark
            ? 'bg-[#1A1D23] border-[#2D3748]'
            : 'bg-white border-[#D0D7DE]'
        }`}
      >
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                isDark
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                  : 'text-emerald-700 bg-emerald-50 border-emerald-300'
              }`}
            >
              Agent Core v2.4 Operating Console
            </span>
            <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>RBAC: {currentRole}</span>
          </div>
          <h1 className={`text-xl font-semibold tracking-tight font-sans ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Engineering Health & Autonomous Workspace
          </h1>
          <p className={`text-xs mt-1 max-w-2xl font-sans ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Autonomous engineering agent monitoring repositories, CI/CD pipelines, Kubernetes clusters, and production incidents with safe permission-gated execution.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="dash-hero-agent-btn"
            onClick={() => {
              if (onDispatchAgentHero) {
                onDispatchAgentHero();
              } else {
                onNavigate('ai-agent');
              }
            }}
            className="flex items-center gap-2 px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_22px_rgba(16,185,129,0.5)] transition-all duration-150 ease-out cursor-pointer select-none"
          >
            <Bot className="w-4 h-4 fill-current" />
            <span>OPEN AI AGENT CONSOLE</span>
          </button>

          <button
            onClick={() => onNavigate('settings')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs border transition-all duration-150 ease-out cursor-pointer select-none active:scale-95 ${
              isDark
                ? 'bg-[#0F1115] hover:bg-[#2D3748] hover:border-gray-500 text-gray-300 hover:text-white border-[#2D3748]'
                : 'bg-white hover:bg-gray-100 text-gray-700 hover:text-black border-gray-300 shadow-xs'
            }`}
          >
            <Shield className={`w-3.5 h-3.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <span>RBAC GATES</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid (Compact & Sleek Metric Boxes) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Production Latency */}
        <div
          id="kpi-widget-latency"
          onClick={() => setActiveMetricModal('latency')}
          className={`px-3.5 py-2.5 rounded-lg border hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] active:brightness-95 transition-all duration-150 ease-out cursor-pointer select-none group ${
            isDark
              ? 'bg-[#1A1D23] border-[#2D3748] hover:border-emerald-500/60 hover:bg-[#1E232B] hover:shadow-[0_4px_16px_rgba(16,185,129,0.12)]'
              : 'bg-white border-[#D0D7DE] hover:border-emerald-500 hover:bg-emerald-50/30 hover:shadow-md'
          }`}
          title="Click to view detailed telemetry curve"
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-[10px] uppercase font-bold transition-colors ${
              isDark ? 'text-gray-500 group-hover:text-emerald-400' : 'text-gray-600 group-hover:text-emerald-600'
            }`}>
              Production Latency
            </span>
            <Activity className="w-3.5 h-3.5 text-emerald-500 group-hover:scale-110 transition-transform duration-150" />
          </div>
          <div className={`text-xl font-bold transition-colors ${
            isDark ? 'text-white group-hover:text-emerald-300' : 'text-gray-900 group-hover:text-emerald-600'
          }`}>
            {activeIncident ? '314 ms' : '38 ms'}
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <span className={`text-[10px] ${
              activeIncident
                ? isDark ? 'text-rose-400 font-bold' : 'text-rose-600 font-bold'
                : isDark ? 'text-emerald-400' : 'text-emerald-600 font-semibold'
            }`}>
              {activeIncident ? '▲ Spiked +380%' : '▼ Healthy (<40ms)'}
            </span>
            <span className={`text-[9px] transition-colors flex items-center gap-0.5 font-bold ${
              isDark ? 'text-gray-500 group-hover:text-white' : 'text-gray-600 group-hover:text-gray-900'
            }`}>
              INSPECT <ChevronRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>

        {/* Metric 2: Open Incidents */}
        <div
          id="kpi-widget-incidents"
          onClick={() => onNavigate('incidents')}
          className={`px-3.5 py-2.5 rounded-lg border hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] active:brightness-95 transition-all duration-150 ease-out cursor-pointer select-none group ${
            isDark
              ? 'bg-[#1A1D23] border-[#2D3748] hover:border-rose-500/60 hover:bg-[#1E232B] hover:shadow-[0_4px_16px_rgba(244,63,94,0.15)]'
              : 'bg-white border-[#D0D7DE] hover:border-rose-400 hover:bg-rose-50/30 hover:shadow-md'
          }`}
          title="Click to view active incidents"
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-[10px] uppercase font-bold transition-colors ${
              isDark ? 'text-gray-500 group-hover:text-rose-400' : 'text-gray-600 group-hover:text-rose-600'
            }`}>
              Active Incidents
            </span>
            <Flame className="w-3.5 h-3.5 text-rose-500 animate-pulse group-hover:scale-110 transition-transform duration-150" />
          </div>
          <div className="text-xl font-bold text-rose-500 group-hover:text-rose-400 transition-colors">
            {incidents.filter((i) => i.status !== 'RESOLVED').length}
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <span className={`text-[10px] truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {activeIncident ? `${activeIncident.incidentNumber}` : '0 Active'}
            </span>
            <span className={`text-[9px] transition-colors flex items-center gap-0.5 font-bold ${
              isDark ? 'text-gray-500 group-hover:text-white' : 'text-gray-600 group-hover:text-gray-900'
            }`}>
              CONSOLE <ChevronRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>

        {/* Metric 3: CI/CD Pipeline Health */}
        <div
          id="kpi-widget-pipelines"
          onClick={() => onNavigate('pipelines')}
          className={`px-3.5 py-2.5 rounded-lg border hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] active:brightness-95 transition-all duration-150 ease-out cursor-pointer select-none group ${
            isDark
              ? 'bg-[#1A1D23] border-[#2D3748] hover:border-amber-500/60 hover:bg-[#1E232B] hover:shadow-[0_4px_16px_rgba(245,158,11,0.15)]'
              : 'bg-white border-[#D0D7DE] hover:border-amber-400 hover:bg-amber-50/30 hover:shadow-md'
          }`}
          title="Click to view CI/CD Pipelines"
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-[10px] uppercase font-bold transition-colors ${
              isDark ? 'text-gray-500 group-hover:text-amber-400' : 'text-gray-600 group-hover:text-amber-600'
            }`}>
              CI/CD Workflows
            </span>
            <Workflow className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform duration-150" />
          </div>
          <div className={`text-xl font-bold transition-colors ${
            isDark ? 'text-white group-hover:text-amber-300' : 'text-gray-900 group-hover:text-amber-600'
          }`}>
            {pipelines.filter((p) => p.status === 'SUCCESS').length} / {pipelines.length}
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <span className={`text-[10px] ${
              failingPipeline
                ? isDark ? 'text-amber-400 font-bold' : 'text-amber-600 font-bold'
                : isDark ? 'text-emerald-400' : 'text-emerald-600 font-semibold'
            }`}>
              {failingPipeline ? '1 Failed' : 'All Passing'}
            </span>
            <span className={`text-[9px] transition-colors flex items-center gap-0.5 font-bold ${
              isDark ? 'text-gray-500 group-hover:text-white' : 'text-gray-600 group-hover:text-gray-900'
            }`}>
              PIPELINES <ChevronRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>

        {/* Metric 4: Infrastructure Clusters */}
        <div
          id="kpi-widget-infrastructure"
          onClick={() => onNavigate('infrastructure')}
          className={`px-3.5 py-2.5 rounded-lg border hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] active:brightness-95 transition-all duration-150 ease-out cursor-pointer select-none group ${
            isDark
              ? 'bg-[#1A1D23] border-[#2D3748] hover:border-emerald-500/60 hover:bg-[#1E232B] hover:shadow-[0_4px_16px_rgba(16,185,129,0.12)]'
              : 'bg-white border-[#D0D7DE] hover:border-emerald-500 hover:bg-emerald-50/30 hover:shadow-md'
          }`}
          title="Click to view Infrastructure & Kubernetes"
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-[10px] uppercase font-bold transition-colors ${
              isDark ? 'text-gray-500 group-hover:text-emerald-400' : 'text-gray-600 group-hover:text-emerald-600'
            }`}>
              Kubernetes Cluster
            </span>
            <Server className="w-3.5 h-3.5 text-emerald-500 group-hover:scale-110 transition-transform duration-150" />
          </div>
          <div className={`text-xl font-bold transition-colors ${
            isDark ? 'text-white group-hover:text-emerald-300' : 'text-gray-900 group-hover:text-emerald-600'
          }`}>
            4 Pods
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <span className={`text-[10px] ${isDark ? 'text-emerald-400' : 'text-emerald-600 font-semibold'}`}>
              gVisor Isolated
            </span>
            <span className={`text-[9px] transition-colors flex items-center gap-0.5 font-bold ${
              isDark ? 'text-gray-500 group-hover:text-white' : 'text-gray-600 group-hover:text-gray-900'
            }`}>
              TOPOLOGY <ChevronRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>
      </div>

      {/* Hero Action Callouts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Active Incident Hero Widget */}
        {activeIncident ? (
          <div
            id="active-incident-widget"
            className={`p-5 rounded-lg border transition-all duration-150 ease-out flex flex-col justify-between group ${
              isDark
                ? 'bg-[#1A1D23] border-rose-500/40 hover:border-rose-500/80 hover:bg-[#1E222A] hover:shadow-[0_6px_25px_rgba(244,63,94,0.18)]'
                : 'bg-white border-rose-300 hover:border-rose-500 hover:bg-rose-50/20 hover:shadow-md'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => handleIncidentClick(activeIncident.id)}
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border active:scale-95 transition-all duration-150 cursor-pointer select-none ${
                    isDark
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/30 hover:bg-rose-500/30'
                      : 'bg-rose-100 text-rose-700 border-rose-300 hover:bg-rose-200'
                  }`}
                >
                  <Flame className="w-3 h-3 text-rose-500 animate-pulse" />
                  {activeIncident.severity} INCIDENT IN PROGRESS
                </button>
                <button
                  onClick={() => handleIncidentClick(activeIncident.id)}
                  className={`text-xs hover:underline active:scale-95 transition-all duration-150 font-mono cursor-pointer select-none ${
                    isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {activeIncident.incidentNumber}
                </button>
              </div>

              <div
                onClick={() => handleIncidentClick(activeIncident.id)}
                className="cursor-pointer select-none active:brightness-95 transition-all"
              >
                <h3 className={`font-semibold text-sm font-sans transition-colors ${
                  isDark ? 'text-white hover:text-rose-300' : 'text-gray-900 hover:text-rose-600'
                }`}>
                  {activeIncident.title}
                </h3>
                <p className={`text-xs mt-1 font-sans ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Root cause isolated to commit <code className={`px-1 py-0.5 rounded ${
                    isDark ? 'bg-[#0F1115] text-rose-400' : 'bg-gray-100 text-rose-600 font-semibold'
                  }`}>84c21a9</code> in <code className={isDark ? 'text-gray-300' : 'text-gray-800'}>src/auth/session.ts</code>.
                </p>
              </div>
            </div>

            <div className={`mt-4 pt-3 border-t flex flex-wrap items-center justify-between gap-2 ${
              isDark ? 'border-[#2D3748]' : 'border-gray-200'
            }`}>
              <button
                onClick={() => handleIncidentClick(activeIncident.id)}
                className={`text-[11px] active:scale-95 transition-all duration-150 flex items-center gap-1 cursor-pointer select-none ${
                  isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Clock className={`w-3 h-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                <span>Triggered {activeIncident.startedAt}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleIncidentClick(activeIncident.id)}
                  className={`px-2.5 py-1.5 rounded text-xs border transition-all duration-150 ease-out cursor-pointer select-none font-bold active:scale-95 ${
                    isDark
                      ? 'bg-[#0F1115] hover:bg-[#2D3748] hover:border-gray-500 text-gray-300 hover:text-white border-[#2D3748]'
                      : 'bg-white hover:bg-gray-100 text-gray-700 hover:text-black border-gray-300 shadow-xs'
                  }`}
                >
                  VIEW DETAILS
                </button>

                <button
                  id="dash-dispatch-incident-btn"
                  onClick={() => {
                    if (onDispatchAgentHero) {
                      onDispatchAgentHero();
                    } else {
                      onNavigate('ai-agent');
                    }
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-500 active:bg-rose-700 active:scale-95 text-white font-bold text-xs transition-all duration-150 ease-out cursor-pointer select-none shadow-[0_0_10px_rgba(244,63,94,0.3)] hover:shadow-[0_0_18px_rgba(244,63,94,0.5)]"
                >
                  <Bot className="w-3.5 h-3.5 fill-current" />
                  <span>DISPATCH AI REMEDIATION</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            id="all-systems-operational-widget"
            onClick={() => onNavigate('observability')}
            className={`p-5 rounded-lg border hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] active:brightness-95 transition-all duration-150 ease-out flex flex-col justify-between cursor-pointer select-none group ${
              isDark
                ? 'bg-[#1A1D23] border-emerald-500/30 hover:border-emerald-500/70 hover:bg-[#1E232B] hover:shadow-[0_6px_25px_rgba(16,185,129,0.15)]'
                : 'bg-white border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50/30 hover:shadow-md'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform duration-150" />
              <h3 className={`font-semibold text-sm font-sans transition-colors ${
                isDark ? 'text-white group-hover:text-emerald-300' : 'text-gray-900 group-hover:text-emerald-700'
              }`}>
                All Systems Operational
              </h3>
            </div>
            <p className={`text-xs mt-1 font-sans ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Zero active production incidents. Autonomous telemetry monitoring active across all cloud regions.
            </p>
            <div className={`mt-4 pt-3 border-t flex justify-end ${isDark ? 'border-[#2D3748]' : 'border-gray-200'}`}>
              <span className={`text-xs underline flex items-center gap-1 font-semibold ${
                isDark ? 'text-emerald-400 group-hover:text-emerald-300' : 'text-emerald-700 group-hover:text-emerald-800'
              }`}>
                VIEW LIVE TELEMETRY <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>
        )}

        {/* Failing Pipeline Hero Widget */}
        {failingPipeline ? (
          <div
            id="failing-pipeline-widget"
            className={`p-5 rounded-lg border transition-all duration-150 ease-out flex flex-col justify-between group ${
              isDark
                ? 'bg-[#1A1D23] border-amber-500/40 hover:border-amber-500/80 hover:bg-[#1E222A] hover:shadow-[0_6px_25px_rgba(245,158,11,0.18)]'
                : 'bg-white border-amber-300 hover:border-amber-500 hover:bg-amber-50/20 hover:shadow-md'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => handlePipelineClick(failingPipeline.id)}
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border active:scale-95 transition-all duration-150 cursor-pointer select-none ${
                    isDark
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30'
                      : 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                  CI/CD BUILD FAILURE
                </button>
                <button
                  onClick={() => handlePipelineClick(failingPipeline.id)}
                  className={`text-xs hover:underline active:scale-95 transition-all duration-150 font-mono cursor-pointer select-none ${
                    isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {failingPipeline.commitHash}
                </button>
              </div>

              <div
                onClick={() => handlePipelineClick(failingPipeline.id)}
                className="cursor-pointer select-none active:brightness-95 transition-all"
              >
                <h3 className={`font-semibold text-sm font-sans transition-colors ${
                  isDark ? 'text-white hover:text-amber-300' : 'text-gray-900 hover:text-amber-700'
                }`}>
                  {failingPipeline.pipelineName}
                </h3>
                <p className={`text-xs mt-1 font-sans ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Failed stage: <span className={`font-bold ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>{failingPipeline.aiAnalysis?.failedStage}</span>. {failingPipeline.aiAnalysis?.rootCause}
                </p>
              </div>
            </div>

            <div className={`mt-4 pt-3 border-t flex flex-wrap items-center justify-between gap-2 ${
              isDark ? 'border-[#2D3748]' : 'border-gray-200'
            }`}>
              <span className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                AI Confidence: <strong className={isDark ? 'text-amber-300' : 'text-amber-700'}>{failingPipeline.aiAnalysis?.confidencePercent}%</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePipelineClick(failingPipeline.id)}
                  className={`px-2.5 py-1.5 rounded text-xs border transition-all duration-150 ease-out cursor-pointer select-none font-bold active:scale-95 ${
                    isDark
                      ? 'bg-[#0F1115] hover:bg-[#2D3748] hover:border-gray-500 text-gray-300 hover:text-white border-[#2D3748]'
                      : 'bg-white hover:bg-gray-100 text-gray-700 hover:text-black border-gray-300 shadow-xs'
                  }`}
                >
                  DAG STAGES
                </button>

                <button
                  id="dash-fix-pipeline-btn"
                  onClick={() => handlePipelineClick(failingPipeline.id)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 active:bg-amber-700 active:scale-95 text-white font-bold text-xs transition-all duration-150 ease-out cursor-pointer select-none shadow-[0_0_10px_rgba(245,158,11,0.3)] hover:shadow-[0_0_18px_rgba(245,158,11,0.5)]"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>INSPECT & AUTO-FIX</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            id="all-pipelines-passing-widget"
            onClick={() => onNavigate('pipelines')}
            className={`p-5 rounded-lg border hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] active:brightness-95 transition-all duration-150 ease-out flex flex-col justify-between cursor-pointer select-none group ${
              isDark
                ? 'bg-[#1A1D23] border-emerald-500/30 hover:border-emerald-500/70 hover:bg-[#1E232B] hover:shadow-[0_6px_25px_rgba(16,185,129,0.15)]'
                : 'bg-white border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50/30 hover:shadow-md'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform duration-150" />
              <h3 className={`font-semibold text-sm font-sans transition-colors ${
                isDark ? 'text-white group-hover:text-emerald-300' : 'text-gray-900 group-hover:text-emerald-700'
              }`}>
                CI/CD Pipelines Healthy
              </h3>
            </div>
            <p className={`text-xs mt-1 font-sans ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              All automated tests and security gates passing across active branches.
            </p>
            <div className={`mt-4 pt-3 border-t flex justify-end ${isDark ? 'border-[#2D3748]' : 'border-gray-200'}`}>
              <span className={`text-xs underline flex items-center gap-1 font-semibold ${
                isDark ? 'text-emerald-400 group-hover:text-emerald-300' : 'text-emerald-700 group-hover:text-emerald-800'
              }`}>
                VIEW CI/CD WORKFLOWS <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Recent Deployments & Open Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Deployments Stream Widget */}
        <div
          id="active-deployments-widget"
          className={`p-5 rounded-lg border shadow-xs transition-colors ${
            isDark ? 'bg-[#1A1D23] border-[#2D3748]' : 'bg-white border-[#D0D7DE]'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Rocket className="w-4 h-4 text-emerald-500" />
              <h2 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>ACTIVE DEPLOYMENTS</h2>
            </div>
            <button
              onClick={() => onNavigate('deployments')}
              className={`text-xs hover:underline active:scale-95 cursor-pointer select-none flex items-center gap-1 transition-all duration-150 ${
                isDark ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-700 hover:text-emerald-800 font-semibold'
              }`}
            >
              <span>VIEW ALL DEPLOYMENTS</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {deployments.map((dep) => (
              <div
                key={dep.id}
                onClick={() => handleDeploymentClick(dep.id)}
                className={`p-3 rounded border hover:translate-x-1 active:scale-[0.985] active:brightness-95 flex items-center justify-between cursor-pointer select-none transition-all duration-150 ease-out group ${
                  isDark
                    ? 'bg-[#0F1115] border-[#2D3748] hover:border-emerald-500/60 hover:bg-[#1E232B]'
                    : 'bg-gray-50 border-gray-200 hover:border-emerald-400 hover:bg-emerald-50/30'
                }`}
                title="Click to view deployment details & release controls"
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold text-xs transition-colors ${
                      isDark ? 'text-white group-hover:text-emerald-300' : 'text-gray-900 group-hover:text-emerald-700'
                    }`}>
                      {dep.version}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold border ${
                        dep.environment === 'production'
                          ? isDark ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-rose-100 text-rose-700 border-rose-300'
                          : dep.environment === 'staging'
                          ? isDark ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-emerald-100 text-emerald-700 border-emerald-300'
                          : isDark ? 'bg-gray-500/20 text-gray-300 border-gray-500/30' : 'bg-gray-200 text-gray-700 border-gray-300'
                      }`}
                    >
                      {dep.environment}
                    </span>
                  </div>
                  <p className={`text-[11px] mt-0.5 line-clamp-1 font-sans ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{dep.commitMessage}</p>
                </div>

                <div className="text-right text-[11px] shrink-0">
                  <span
                    className={`font-semibold ${
                      dep.status === 'HEALTHY'
                        ? isDark ? 'text-emerald-400' : 'text-emerald-700'
                        : isDark ? 'text-rose-400' : 'text-rose-600'
                    }`}
                  >
                    {dep.status}
                  </span>
                  <div className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{dep.deployedAt}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Engineering Issues Widget */}
        <div
          id="priority-issues-widget"
          className={`p-5 rounded-lg border shadow-xs transition-colors ${
            isDark ? 'bg-[#1A1D23] border-[#2D3748]' : 'bg-white border-[#D0D7DE]'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <h2 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>PRIORITY ISSUES & AI DISPATCH</h2>
            </div>
            <button
              onClick={() => onNavigate('issues')}
              className={`text-xs hover:underline active:scale-95 cursor-pointer select-none flex items-center gap-1 transition-all duration-150 ${
                isDark ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-700 hover:text-emerald-800 font-semibold'
              }`}
            >
              <span>VIEW ISSUE BACKLOG</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {issues.slice(0, 3).map((issue) => (
              <div
                key={issue.id}
                className={`p-3 rounded border flex items-center justify-between transition-all duration-150 ease-out ${
                  isDark
                    ? 'bg-[#0F1115] border-[#2D3748] hover:border-gray-500 hover:bg-[#1E232B]'
                    : 'bg-gray-50 border-gray-200 hover:border-gray-400 hover:bg-gray-100/80'
                }`}
              >
                <div
                  onClick={() => handleIssueClick(issue.id)}
                  className="flex-1 pr-3 cursor-pointer select-none group active:brightness-95"
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-mono ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>#{issue.number}</span>
                    <span className={`font-medium text-xs line-clamp-1 font-sans transition-colors ${
                      isDark ? 'text-white group-hover:text-emerald-300' : 'text-gray-900 group-hover:text-emerald-700'
                    }`}>
                      {issue.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                        issue.priority === 'URGENT'
                          ? isDark ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-rose-100 text-rose-700 border-rose-300'
                          : issue.priority === 'HIGH'
                          ? isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-amber-100 text-amber-800 border-amber-300'
                          : isDark ? 'bg-gray-700/40 text-gray-300 border-gray-600/40' : 'bg-gray-200 text-gray-700 border-gray-300'
                      }`}
                    >
                      {issue.priority}
                    </span>
                    <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{issue.relatedFile}</span>
                  </div>
                </div>

                <button
                  id={`fix-issue-ai-btn-${issue.number}`}
                  onClick={() => {
                    if (onDispatchAgentHero) {
                      onDispatchAgentHero(
                        `Investigate and resolve Issue #${issue.number}: ${issue.title}\n\nDescription: ${issue.description}\nRelated File: ${issue.relatedFile || 'N/A'}`
                      );
                    } else {
                      onNavigate('ai-agent', issue.id);
                    }
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs border transition-all duration-150 ease-out cursor-pointer select-none shrink-0 font-bold active:scale-95 ${
                    isDark
                      ? 'bg-[#1F2937] hover:bg-[#2D3748] hover:border-emerald-500/40 active:bg-emerald-700 text-white border-[#374151]'
                      : 'bg-white hover:bg-emerald-50 text-gray-800 hover:text-emerald-800 border-gray-300 hover:border-emerald-400 shadow-xs'
                  }`}
                >
                  <Bot className="w-3 h-3 text-emerald-500" />
                  <span>FIX WITH AI</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Metric Detail Modal */}
      {activeMetricModal && (
        <MetricDetailModal
          isOpen={true}
          onClose={() => setActiveMetricModal(null)}
          metricType={activeMetricModal}
          currentValue={activeIncident ? '314 ms' : '38 ms'}
          onNavigateToView={onNavigate}
        />
      )}

      {/* Deployment Details Modal */}
      {selectedDeployment && (
        <ConfirmationModal
          isOpen={true}
          onClose={() => setSelectedDeployment(null)}
          onConfirm={() => {
            setSelectedDeployment(null);
            onNavigate('deployments', selectedDeployment.id);
          }}
          title={`RELEASE DETAILS: ${selectedDeployment.version}`}
          description={`Commit: ${selectedDeployment.commitMessage}. Deployed by ${selectedDeployment.deployedBy} to ${selectedDeployment.environment}.`}
          confirmLabel="VIEW IN DEPLOYMENTS"
          cancelLabel="CLOSE"
          details={[
            { label: 'Environment', value: selectedDeployment.environment },
            { label: 'Health Status', value: selectedDeployment.status },
            { label: 'Deployed At', value: selectedDeployment.deployedAt },
            { label: 'Commit Hash', value: selectedDeployment.commitHash }
          ]}
        />
      )}
    </div>
  );
};


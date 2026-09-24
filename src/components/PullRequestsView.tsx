import React, { useState } from 'react';
import {
  GitPullRequest,
  CheckCircle2,
  Sparkles,
  GitBranch,
  GitMerge,
  Lock
} from 'lucide-react';
import { PullRequest, RbacRole } from '../types';
import { ConfirmationModal } from './Modals';
import { can } from '../lib/permissions';
import { useTheme } from '../context/ThemeContext';
import confetti from 'canvas-confetti';

interface PullRequestsViewProps {
  pullRequests: PullRequest[];
  currentRole?: RbacRole;
  onNavigateToAgent?: () => void;
  onMergePr?: (prId: string) => void;
}

export const PullRequestsView: React.FC<PullRequestsViewProps> = ({
  pullRequests,
  currentRole = 'Developer' as RbacRole,
  onMergePr
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const prList = pullRequests || [];
  const [selectedPrId, setSelectedPrId] = useState<string>(prList[0]?.id || '');
  const [isMergeModalOpen, setIsMergeModalOpen] = useState<boolean>(false);
  const [isMerging, setIsMerging] = useState<boolean>(false);
  const [mergedPrs, setMergedPrs] = useState<string[]>([]);

  const selectedPr = prList.find((p) => p.id === selectedPrId) || prList[0];
  const isMerged = Boolean(selectedPr?.id && (mergedPrs || []).includes(selectedPr.id)) || selectedPr?.status === 'MERGED';

  const canApprove = can((currentRole || 'Developer') as RbacRole, 'approvePR');

  const handleConfirmMerge = () => {
    if (!selectedPr?.id || !canApprove) return;
    setIsMerging(true);
    setTimeout(() => {
      setIsMerging(false);
      setIsMergeModalOpen(false);
      setMergedPrs((prev) => [...(prev || []), selectedPr.id]);
      if (onMergePr) onMergePr(selectedPr.id);
      try {
        confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });
      } catch {}
    }, 1200);
  };

  return (
    <div
      id="pull-requests-view"
      className={`flex-1 flex flex-col h-full overflow-hidden font-mono transition-colors ${
        isDark ? 'bg-[#0A0B0D] text-[#E0E0E0]' : 'bg-[#F6F8FA] text-[#111827]'
      }`}
    >
      {/* Header */}
      <div
        className={`p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 ${
          isDark ? 'bg-[#0F1115] border-[#1F2937]' : 'bg-white border-[#D0D7DE]'
        }`}
      >
        <div className="flex items-center gap-2">
          <GitPullRequest className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
          <div>
            <h1 className={`text-sm font-bold tracking-tight uppercase ${isDark ? 'text-white' : 'text-gray-900'}`}>
              PULL REQUESTS & CODE REVIEW
            </h1>
            <p className={`text-xs font-sans ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Automated safety verification, vulnerability audits, and diff analysis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-1 rounded text-xs border font-bold ${
              isDark
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            ENGINEERING COGNITIVE SCORECARD
          </span>
        </div>
      </div>

      {/* Main Grid: PR List + PR Inspector */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left column: PR List */}
        <div
          className={`lg:col-span-4 border-r overflow-y-auto p-3 space-y-2 ${
            isDark ? 'bg-[#0F1115] border-[#1F2937]' : 'bg-[#F6F8FA] border-[#D0D7DE]'
          }`}
        >
          {prList.map((pr) => {
            const isSelected = pr.id === selectedPr?.id;
            const prMerged = Boolean(pr.id && (mergedPrs || []).includes(pr.id)) || pr.status === 'MERGED';
            return (
              <button
                key={pr.id}
                onClick={() => setSelectedPrId(pr.id)}
                className={`w-full text-left p-3 rounded-lg border transition cursor-pointer ${
                  isSelected
                    ? isDark
                      ? 'bg-[#1A1D23] border-emerald-500/50 shadow-md text-white'
                      : 'bg-white border-emerald-600 ring-2 ring-emerald-500/20 shadow-md text-gray-900'
                    : isDark
                    ? 'bg-[#0A0B0D] border-[#2D3748] hover:bg-[#1A1D23] text-gray-400'
                    : 'bg-white border-[#D0D7DE] hover:bg-gray-50 text-gray-600 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>#{pr.number}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                      prMerged
                        ? isDark
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                          : 'bg-purple-50 text-purple-700 border-purple-200'
                        : isDark
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {prMerged ? 'MERGED' : `SCORE ${pr.reviewScore}/100`}
                  </span>
                </div>
                <h3 className={`font-semibold text-xs line-clamp-1 font-sans ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                  {pr.title}
                </h3>
                <div className={`flex items-center gap-2 mt-2 text-[11px] ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  <span>by {pr.author}</span>
                  <span>•</span>
                  <span>{pr.changedFiles?.length || 0} files</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right column: PR Details & Code Inspector */}
        <div className={`lg:col-span-8 overflow-y-auto p-4 sm:p-6 space-y-5 ${isDark ? 'bg-[#0A0B0D]' : 'bg-white'}`}>
          {selectedPr ? (
            <>
              {/* PR Header Info */}
              <div
                className={`p-4 rounded-lg border ${
                  isDark ? 'bg-[#1A1D23] border-[#2D3748]' : 'bg-[#F6F8FA] border-[#D0D7DE]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                        #{selectedPr.number}
                      </span>
                      <h2 className={`text-base font-bold font-sans ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {selectedPr.title}
                      </h2>
                    </div>
                  </div>

                  {isMerged ? (
                    <span
                      className={`px-2.5 py-1 rounded text-xs font-bold border flex items-center gap-1 ${
                        isDark
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                          : 'bg-purple-50 text-purple-700 border-purple-200'
                      }`}
                    >
                      <GitMerge className="w-3.5 h-3.5" /> MERGED TO MAIN
                    </span>
                  ) : (
                    <button
                      id="merge-pr-btn"
                      onClick={() => {
                        if (canApprove) {
                          setIsMergeModalOpen(true);
                        }
                      }}
                      disabled={!canApprove}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-bold text-xs transition ${
                        canApprove
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)] cursor-pointer'
                          : isDark
                          ? 'bg-[#1F2937] text-gray-500 border border-[#374151] cursor-not-allowed opacity-60'
                          : 'bg-gray-100 text-gray-400 border border-gray-300 cursor-not-allowed opacity-60'
                      }`}
                      title={
                        canApprove
                          ? 'Approve and Squash & Merge'
                          : `Role '${currentRole}' is not authorized to approve PRs (Requires TechLead or Admin)`
                      }
                    >
                      {canApprove ? <GitMerge className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                      <span>{canApprove ? 'APPROVE & MERGE' : 'APPROVE & MERGE (LOCKED)'}</span>
                    </button>
                  )}
                </div>

                <p className={`text-xs mt-2 font-sans ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {selectedPr.description}
                </p>

                <div
                  className={`flex flex-wrap items-center gap-3 mt-3 pt-3 border-t text-xs ${
                    isDark ? 'border-[#2D3748] text-gray-400' : 'border-gray-200 text-gray-600'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <GitBranch className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                    {selectedPr.sourceBranch} into {selectedPr.targetBranch}
                  </span>
                  <span>
                    AUTHOR: <strong className={isDark ? 'text-white' : 'text-gray-900'}>{selectedPr.author}</strong>
                  </span>
                  <span>CREATED: {selectedPr.createdAt}</span>
                </div>
              </div>

              {/* AI Code Review Scorecard */}
              {selectedPr?.aiReview && (
                <div
                  className={`p-4 rounded-lg border ${
                    isDark
                      ? 'bg-[#1A1D23] border-emerald-500/30'
                      : 'bg-emerald-50/40 border-emerald-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                      <h3
                        className={`font-bold text-xs uppercase tracking-wider ${
                          isDark ? 'text-emerald-400' : 'text-emerald-800'
                        }`}
                      >
                        AI Security & Quality Scorecard
                      </h3>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                        isDark
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}
                    >
                      RATING: {selectedPr.aiReview.securityRating || 'A+'}
                    </span>
                  </div>

                  <p className={`text-xs font-sans leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {selectedPr.aiReview.summary}
                  </p>

                  <div
                    className={`mt-3 pt-3 border-t space-y-2 ${
                      isDark ? 'border-[#2D3748]' : 'border-emerald-200'
                    }`}
                  >
                    <span className={`text-[10px] font-bold uppercase tracking-wider block ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Automated Verification Steps Passed:
                    </span>
                    {(selectedPr.aiReview.suggestions || []).map((sug, i) => (
                      <div key={i} className={`flex items-start gap-2 text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                        <span className="font-sans">{sug}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Code Changes Diff */}
              <div>
                <span className={`text-xs font-bold uppercase tracking-wider block mb-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  Changed Files ({(selectedPr.changedFiles || []).length})
                </span>
                {(selectedPr.changedFiles || []).map((file, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border text-xs ${
                      isDark ? 'bg-[#1A1D23] border-[#2D3748]' : 'bg-[#F6F8FA] border-[#D0D7DE]'
                    }`}
                  >
                    <div
                      className={`flex items-center justify-between pb-2 border-b mb-2 ${
                        isDark ? 'border-[#2D3748]' : 'border-gray-200'
                      }`}
                    >
                      <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{file.filename}</span>
                      <span className={isDark ? 'text-emerald-400' : 'text-emerald-600 font-bold'}>
                        +{file.additions} / -{file.deletions}
                      </span>
                    </div>
                    <pre
                      className={`overflow-x-auto text-[11px] leading-relaxed font-mono ${
                        isDark ? 'text-gray-300' : 'text-gray-800'
                      }`}
                    >
                      {file.patch}
                    </pre>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Select a pull request to inspect.</div>
          )}
        </div>
      </div>

      {/* Merge Confirmation Modal */}
      {isMergeModalOpen && selectedPr && (
        <ConfirmationModal
          isOpen={true}
          onClose={() => setIsMergeModalOpen(false)}
          onConfirm={handleConfirmMerge}
          title={`MERGE PR #${selectedPr.number} TO MAIN`}
          description={`Are you sure you want to merge '${selectedPr.title}' into branch '${selectedPr.targetBranch}'? All CI tests and security scans have passed with a score of ${selectedPr.reviewScore}/100.`}
          confirmLabel={isMerging ? 'MERGING BRANCH...' : 'CONFIRM SQUASH & MERGE'}
          variant="primary"
          riskLevel="MEDIUM"
          isLoading={isMerging}
          details={[
            { label: 'PR Number', value: `#${selectedPr.number}` },
            { label: 'Source Branch', value: selectedPr.sourceBranch },
            { label: 'Target Branch', value: selectedPr.targetBranch },
            { label: 'Security Rating', value: selectedPr.aiReview?.securityRating || 'A+' },
            { label: 'Authorized By', value: `${currentRole} Role` }
          ]}
        />
      )}
    </div>
  );
};


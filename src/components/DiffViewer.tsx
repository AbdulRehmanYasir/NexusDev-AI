import React from 'react';
import { FileCode, Check, Copy } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface DiffViewerProps {
  filePath?: string;
  fileName?: string;
  originalCode: string;
  modifiedCode: string;
  patchExplanation?: string;
  insertions?: number;
  deletions?: number;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  filePath,
  fileName,
  originalCode,
  modifiedCode,
  patchExplanation,
  insertions = 14,
  deletions = 5
}) => {
  const displayPath = filePath || fileName || 'remediation.ts';
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(modifiedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const origLines = originalCode.split('\n');
  const modLines = modifiedCode.split('\n');

  return (
    <div
      id="diff-viewer-container"
      className={`rounded-lg border overflow-hidden font-mono text-xs shadow-lg transition-colors ${
        isDark ? 'bg-[#0F1115] border-[#2D3748]' : 'bg-white border-[#D0D7DE]'
      }`}
    >
      {/* Header bar */}
      <div
        className={`flex items-center justify-between px-4 py-2.5 border-b ${
          isDark ? 'bg-[#1A1D23] border-[#2D3748]' : 'bg-[#F6F8FA] border-[#D0D7DE]'
        }`}
      >
        <div className="flex items-center gap-2">
          <FileCode className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
          <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{displayPath}</span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
              isDark
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            +{insertions}
          </span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
              isDark
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            -{deletions}
          </span>
        </div>

        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-mono transition cursor-pointer ${
            isDark
              ? 'bg-[#1F2937] hover:bg-[#2D3748] text-gray-300 hover:text-white border-[#374151]'
              : 'bg-white hover:bg-gray-100 text-gray-700 hover:text-gray-900 border-gray-300 shadow-xs'
          }`}
        >
          {copied ? (
            <Check className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
          <span>{copied ? 'COPIED' : 'COPY PATCH'}</span>
        </button>
      </div>

      {patchExplanation && (
        <div
          className={`px-4 py-2 border-b text-[11px] font-mono ${
            isDark
              ? 'bg-[#0A0B0D] border-[#2D3748] text-gray-300'
              : 'bg-amber-50/50 border-[#D0D7DE] text-gray-700'
          }`}
        >
          <span className={`font-bold mr-1.5 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
            AI PATCH RATIONALE:
          </span>
          {patchExplanation}
        </div>
      )}

      {/* Code comparison grid */}
      <div
        className={`grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x max-h-96 overflow-y-auto ${
          isDark
            ? 'divide-[#2D3748] bg-[#0A0B0D]'
            : 'divide-[#D0D7DE] bg-white'
        }`}
      >
        {/* Original */}
        <div className={isDark ? 'bg-rose-500/5' : 'bg-rose-50/40'}>
          <div
            className={`px-3 py-1.5 text-[10px] font-bold uppercase font-mono border-b ${
              isDark
                ? 'bg-[#0F1115] text-rose-400 border-[#2D3748]'
                : 'bg-rose-100/70 text-rose-800 border-[#D0D7DE]'
            }`}
          >
            ORIGINAL (BASE BRANCH: MAIN)
          </div>
          <div className="py-2 overflow-x-auto">
            {origLines.map((line, idx) => {
              const text = line || '';
              const isBuggy =
                text.includes('payload.tokenVersion') ||
                text.includes('payload.organizationId') ||
                text.includes('findUnique');
              return (
                <div
                  key={idx}
                  className={`flex items-start px-2 py-0.5 leading-relaxed ${
                    isBuggy
                      ? isDark
                        ? 'bg-rose-500/20 text-rose-200 border-l-2 border-rose-500'
                        : 'bg-rose-200/60 text-rose-900 border-l-2 border-rose-600 font-medium'
                      : isDark
                      ? 'text-gray-400'
                      : 'text-gray-600'
                  }`}
                >
                  <span className={`w-8 text-right select-none mr-3 text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                    {idx + 1}
                  </span>
                  <span className="whitespace-pre flex-1">{line || ' '}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modified */}
        <div className={isDark ? 'bg-emerald-500/5' : 'bg-emerald-50/40'}>
          <div
            className={`px-3 py-1.5 text-[10px] font-bold uppercase font-mono border-b ${
              isDark
                ? 'bg-[#0F1115] text-emerald-400 border-[#2D3748]'
                : 'bg-emerald-100/70 text-emerald-800 border-[#D0D7DE]'
            }`}
          >
            AUTONOMOUS PATCH (FIX/AUTH-SESSION-500-PATCH)
          </div>
          <div className="py-2 overflow-x-auto">
            {modLines.map((line, idx) => {
              const text = line || '';
              const isFixed =
                text.includes('incomingVersion') ||
                text.includes('payload.orgId') ||
                text.includes('userRecord.organizationId') ||
                text.includes('!userRecord');
              return (
                <div
                  key={idx}
                  className={`flex items-start px-2 py-0.5 leading-relaxed ${
                    isFixed
                      ? isDark
                        ? 'bg-emerald-500/20 text-emerald-200 font-medium border-l-2 border-emerald-400'
                        : 'bg-emerald-200/60 text-emerald-950 font-medium border-l-2 border-emerald-600'
                      : isDark
                      ? 'text-gray-300'
                      : 'text-gray-700'
                  }`}
                >
                  <span className={`w-8 text-right select-none mr-3 text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                    {idx + 1}
                  </span>
                  <span className="whitespace-pre flex-1">{line || ' '}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

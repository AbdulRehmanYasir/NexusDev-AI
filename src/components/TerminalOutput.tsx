import React from 'react';
import { Terminal, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

interface TerminalOutputProps {
  title?: string;
  logs: string[];
  isRunning?: boolean;
  status?: 'IDLE' | 'RUNNING' | 'SUCCESS' | 'FAILED';
  duration?: string;
  exitCode?: number;
}

export const TerminalOutput: React.FC<TerminalOutputProps> = ({
  title = 'Sandbox Container Execution Terminal',
  logs,
  isRunning = false,
  status = 'IDLE',
  duration,
  exitCode = 0
}) => {
  const terminalRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div id="terminal-runner" className="rounded-lg bg-[#0A0B0D] border border-[#2D3748] overflow-hidden font-mono text-xs shadow-xl flex flex-col h-full min-h-[260px]">
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#1A1D23] border-b border-[#2D3748]">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <Terminal className="w-3.5 h-3.5 text-gray-400" />
          <span className="font-semibold text-gray-300 text-[11px] font-mono">{title}</span>
        </div>

        <div className="flex items-center gap-2">
          {isRunning && (
            <span className="flex items-center gap-1.5 text-[10px] text-amber-400 font-mono font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              RUNNING...
            </span>
          )}
          {status === 'SUCCESS' && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3" /> EXIT 0
            </span>
          )}
          {status === 'FAILED' && (
            <span className="flex items-center gap-1 text-[10px] text-rose-400 font-mono font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
              <AlertCircle className="w-3 h-3" /> EXIT {exitCode || 1}
            </span>
          )}
          {duration && (
            <span className="text-[10px] text-gray-500 font-mono">({duration})</span>
          )}
        </div>
      </div>

      {/* Terminal Body */}
      <div
        ref={terminalRef}
        className="p-3 bg-[#0A0B0D] flex-1 overflow-y-auto space-y-1 text-[11px] leading-relaxed select-text"
      >
        <div className="text-gray-500 flex items-center gap-1.5 pb-1 border-b border-[#1F2937] mb-2 font-mono text-[10px]">
          <Sparkles className="w-3 h-3 text-emerald-400" />
          <span>nexus-sandbox://isolated-container-instance:linux-arm64</span>
        </div>

        {(!logs || logs.length === 0) ? (
          <div className="text-gray-600 italic py-4 text-center font-mono">
            Awaiting command execution in sandbox...
          </div>
        ) : (
          (logs || []).map((log, index) => {
            const raw = log || '';
            let textColor = 'text-gray-300';
            if (raw.includes('FAIL') || raw.includes('Error') || raw.includes('FATAL') || raw.includes('Exception')) {
              textColor = 'text-rose-400 font-semibold';
            } else if (raw.includes('PASS') || raw.includes('SUCCESS') || raw.includes('✓') || raw.includes('healthy')) {
              textColor = 'text-emerald-400 font-medium';
            } else if (raw.includes('WARN') || raw.includes('mismatch')) {
              textColor = 'text-amber-300';
            } else if (raw.startsWith('$') || raw.startsWith('>')) {
              textColor = 'text-gray-500 font-bold';
            }

            return (
              <div key={index} className={`font-mono ${textColor} flex items-start`}>
                <span className="whitespace-pre-wrap">{raw}</span>
              </div>
            );
          })
        )}

        {isRunning && (
          <div className="flex items-center gap-1 text-emerald-400 animate-pulse pt-1">
            <span>▋</span>
          </div>
        )}
      </div>
    </div>
  );
};

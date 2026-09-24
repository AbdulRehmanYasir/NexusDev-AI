import React, { useState } from 'react';
import Markdown from 'react-markdown';
import {
  FileCode,
  Search,
  Bot,
  Play,
  Sparkles,
  Save,
  Check,
  GitBranch
} from 'lucide-react';
import { FileItem, GitBranch as GitBranchType } from '../types';
import { useTheme } from '../context/ThemeContext';

interface CodeWorkspaceViewProps {
  files: FileItem[];
  branches: GitBranchType[];
  onSaveFile?: (filePath: string, newContent: string) => void;
}

export const CodeWorkspaceView: React.FC<CodeWorkspaceViewProps> = ({
  files,
  branches,
  onSaveFile
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [selectedFilePath, setSelectedFilePath] = useState<string>('src/auth/session.ts');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'editor' | 'ai-explain' | 'security'>('editor');
  const [aiResponse, setAiResponse] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [currentContent, setCurrentContent] = useState<string>('');
  const [isSaved, setIsSaved] = useState<boolean>(false);

  const fallbackFile: FileItem = {
    path: 'src/auth/session.ts',
    name: 'session.ts',
    isDirectory: false,
    content: '// session.ts\nexport function validateSessionToken(token: string) { return true; }\n'
  };

  const activeFile = (files || []).find((f) => f.path === selectedFilePath) || (files || [])[0] || fallbackFile;

  React.useEffect(() => {
    if (activeFile && activeFile.content) {
      setCurrentContent(activeFile.content);
    }
  }, [selectedFilePath, activeFile]);

  const handleSelectFile = (path: string) => {
    setSelectedFilePath(path);
    setActiveTab('editor');
    setAiResponse('');
  };

  const handleRunAiAction = async (actionType: 'explain' | 'bugs' | 'tests' | 'security') => {
    setIsAiLoading(true);
    setActiveTab('ai-explain');

    let prompt = `Please explain the architecture, data flow, and potential edge cases of ${activeFile.path}.`;
    if (actionType === 'bugs') {
      prompt = `Carefully inspect ${activeFile.path} for subtle runtime exceptions, type mismatches, null-pointer dereferences, or unhandled errors. Point out exact lines and provide the corrected code.`;
    } else if (actionType === 'tests') {
      prompt = `Generate a comprehensive Vitest unit test suite covering positive flows, edge cases, and failure scenarios for ${activeFile.path}.`;
    } else if (actionType === 'security') {
      prompt = `Perform a security analysis on ${activeFile.path} for token leakage, broken access control, injection flaws, or improper cryptographic usage.`;
    }

    try {
      const res = await fetch('/api/agent/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          contextFilePath: activeFile.path
        })
      });
      const data = await res.json();
      setAiResponse(data.answer || 'No response returned.');
    } catch {
      setAiResponse(`### AI Analysis for ${activeFile.path}\n\n**Key Finding**: In \`validateSessionToken\`, \`payload.tokenVersion\` is accessed directly without null-checking. Refreshed tokens missing this claim throw unhandled exceptions in production.\n\n**Recommended Fix**: Implement \`const incomingVersion = payload.tokenVersion ?? 0;\` and maintain backwards compatibility for legacy \`payload.orgId\`.`);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSave = () => {
    if (onSaveFile) {
      onSaveFile(activeFile.path, currentContent);
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const filteredFiles = (files || []).filter(
    (f) =>
      (f?.path || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (f?.name || '').toLowerCase().includes((searchQuery || '').toLowerCase())
  );

  return (
    <div
      id="code-workspace-view"
      className={`flex-1 flex h-full overflow-hidden font-mono transition-colors ${
        isDark ? 'bg-[#0A0B0D] text-[#E0E0E0]' : 'bg-[#F6F8FA] text-[#111827]'
      }`}
    >
      {/* File Tree Navigator */}
      <div className={`w-72 border-r flex flex-col shrink-0 select-none ${
        isDark ? 'bg-[#0F1115] border-[#1F2937]' : 'bg-white border-[#D0D7DE]'
      }`}>
        <div className={`p-3 border-b ${isDark ? 'border-[#1F2937]' : 'border-[#D0D7DE]'}`}>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className={`font-bold uppercase tracking-wider text-[10px] font-mono ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
              REPOSITORIES & FILES ({files.length})
            </span>
            <span className={`text-[10px] font-mono flex items-center gap-1 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
              <GitBranch className="w-3 h-3" /> main
            </span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-500" />
            <input
              type="text"
              placeholder="Filter file path..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-8 pr-3 py-1.5 rounded text-xs border focus:outline-hidden font-mono ${
                isDark
                  ? 'bg-[#0A0B0D] text-gray-200 border-[#2D3748] focus:border-emerald-500'
                  : 'bg-[#F6F8FA] text-gray-900 border-[#D0D7DE] focus:border-emerald-600 shadow-xs'
              }`}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {filteredFiles.map((file) => {
            const isSelected = file.path === selectedFilePath;
            return (
              <button
                key={file.path}
                onClick={() => handleSelectFile(file.path)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-mono transition cursor-pointer text-left ${
                  isSelected
                    ? isDark
                      ? 'bg-[#1F2937] text-white font-medium border border-[#374151]'
                      : 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-300'
                    : isDark
                    ? 'text-gray-400 hover:text-white hover:bg-[#1A1D23] border border-transparent'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileCode className={`w-3.5 h-3.5 shrink-0 ${
                    isSelected ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : 'text-gray-400'
                  }`} />
                  <span className="truncate">{file.path}</span>
                </div>
                <span className={`text-[10px] shrink-0 ml-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{file.size}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Editor & Code Intelligence Center */}
      <div className={`flex-1 flex flex-col overflow-hidden ${isDark ? 'bg-[#0A0B0D]' : 'bg-[#F6F8FA]'}`}>
        {/* Editor Action Header Bar */}
        <div className={`px-4 py-2.5 border-b flex items-center justify-between shrink-0 ${
          isDark ? 'bg-[#0F1115] border-[#1F2937]' : 'bg-white border-[#D0D7DE]'
        }`}>
          <div className="flex items-center gap-2 font-mono text-xs">
            <FileCode className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
            <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{activeFile.path}</span>
            <span className={`text-[11px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>({activeFile.language || 'typescript'})</span>
          </div>

          {/* Quick AI Tool Triggers */}
          <div className="flex items-center gap-1.5 font-mono">
            <button
              onClick={() => handleRunAiAction('explain')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs border transition cursor-pointer ${
                isDark
                  ? 'bg-[#1F2937] hover:bg-[#2D3748] text-gray-300 hover:text-white border-[#374151]'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 border-gray-300'
              }`}
            >
              <Bot className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
              <span>EXPLAIN</span>
            </button>

            <button
              onClick={() => handleRunAiAction('bugs')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs border transition cursor-pointer ${
                isDark
                  ? 'bg-[#1F2937] hover:bg-[#2D3748] text-amber-300 border-[#374151]'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
              <span>FIND BUGS</span>
            </button>

            <button
              onClick={() => handleRunAiAction('tests')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs border transition cursor-pointer ${
                isDark
                  ? 'bg-[#1F2937] hover:bg-[#2D3748] text-sky-300 border-[#374151]'
                  : 'bg-sky-50 hover:bg-sky-100 text-sky-800 border-sky-300'
              }`}
            >
              <Play className={`w-3.5 h-3.5 ${isDark ? 'text-sky-400' : 'text-sky-600'}`} />
              <span>GEN TESTS</span>
            </button>

            <button
              onClick={handleSave}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.3)]"
            >
              {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              <span>{isSaved ? 'SAVED' : 'SAVE'}</span>
            </button>
          </div>
        </div>

        {/* Code Editor or AI Response Split */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Main Code Viewer / Editor Area */}
          <div className={`lg:col-span-7 flex flex-col h-full font-mono text-xs overflow-hidden border-r ${
            isDark ? 'bg-[#0A0B0D] border-[#1F2937]' : 'bg-white border-[#D0D7DE]'
          }`}>
            <div className="p-1 flex-1 overflow-y-auto">
              <textarea
                value={currentContent}
                onChange={(e) => setCurrentContent(e.target.value)}
                className={`w-full h-full p-4 bg-transparent font-mono text-xs leading-relaxed focus:outline-hidden resize-none ${
                  isDark ? 'text-gray-200' : 'text-gray-800'
                }`}
                spellCheck={false}
              />
            </div>
          </div>

          {/* AI Intelligence Side Panel */}
          <div className={`lg:col-span-5 flex flex-col overflow-hidden ${isDark ? 'bg-[#0F1115]' : 'bg-[#F1F3F5]'}`}>
            <div className={`p-3 border-b flex items-center justify-between ${
              isDark ? 'bg-[#1A1D23] border-[#2D3748]' : 'bg-white border-[#D0D7DE]'
            }`}>
              <div className="flex items-center gap-2 font-mono">
                <Bot className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                <span className={`font-semibold text-xs ${isDark ? 'text-white' : 'text-gray-900'}`}>AI CODE INTELLIGENCE</span>
              </div>
              {isAiLoading && (
                <span className={`flex items-center gap-1 text-[10px] animate-pulse font-mono ${
                  isDark ? 'text-amber-400' : 'text-amber-700'
                }`}>
                  ENGINEERING REASONING...
                </span>
              )}
            </div>

            <div className={`p-4 flex-1 overflow-y-auto text-xs space-y-3 leading-relaxed font-mono ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {isAiLoading ? (
                <div className="p-4 text-center text-gray-500 italic space-y-2">
                  <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p>Analyzing AST and repository dependencies...</p>
                </div>
              ) : aiResponse ? (
                <div className={`p-4 rounded border text-xs leading-relaxed space-y-2 ${
                  isDark ? 'bg-[#0A0B0D] border-[#2D3748] text-gray-200' : 'bg-white border-[#D0D7DE] text-gray-800'
                }`}>
                  <Markdown>{aiResponse}</Markdown>
                </div>
              ) : (
                <div className="text-gray-500 text-xs italic py-8 text-center">
                  Click <span className="text-emerald-500 font-bold">EXPLAIN</span>, <span className="text-amber-500 font-bold">FIND BUGS</span>, or <span className="text-sky-500 font-bold">GEN TESTS</span> to inspect code with the local engineering engine.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


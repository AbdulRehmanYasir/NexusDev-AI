import React from 'react';
import { ShieldAlert, Lock, ArrowLeft } from 'lucide-react';
import { RbacRole, NavViewId } from '../types';
import { useTheme } from '../context/ThemeContext';

interface AccessDeniedViewProps {
  requiredRole?: string;
  userRole: RbacRole;
  attemptedView?: string;
  onNavigateHome: () => void;
}

export const AccessDeniedView: React.FC<AccessDeniedViewProps> = ({
  requiredRole = 'Admin',
  userRole,
  attemptedView = 'Administrative Module',
  onNavigateHome
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div
      id="access-denied-container"
      className={`flex-1 p-6 flex items-center justify-center font-mono transition-colors ${
        isDark ? 'bg-[#0A0B0D] text-[#E0E0E0]' : 'bg-[#F6F8FA] text-[#111827]'
      }`}
    >
      <div
        className={`max-w-md w-full border rounded-xl shadow-2xl p-6 text-center space-y-4 ${
          isDark
            ? 'bg-[#12141A] border-rose-500/30'
            : 'bg-white border-rose-300 shadow-lg'
        }`}
      >
        <div
          className={`w-12 h-12 mx-auto rounded-full border flex items-center justify-center ${
            isDark
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              : 'bg-rose-50 border-rose-200 text-rose-600'
          }`}
        >
          <ShieldAlert className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <div
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
              isDark
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                : 'bg-rose-100 text-rose-800 border-rose-300'
            }`}
          >
            <Lock className="w-3 h-3" />
            403 ACCESS FORBIDDEN
          </div>
          <h2 className={`text-sm font-bold uppercase tracking-wide ${isDark ? 'text-white' : 'text-gray-900'}`}>
            AUTHORIZATION REQUIRED
          </h2>
        </div>

        <p className={`text-xs font-sans leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Your current session role (<span className={`font-mono font-bold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>{userRole}</span>) does not have sufficient permissions to access the requested resource (<span className={`font-mono ${isDark ? 'text-gray-200' : 'text-gray-900 font-semibold'}`}>{attemptedView}</span>).
        </p>

        <div
          className={`p-3 rounded-lg border text-[11px] text-left space-y-1.5 ${
            isDark ? 'bg-[#0A0B0D] border-[#2D3748]' : 'bg-[#F6F8FA] border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between text-gray-500">
            <span>Required Role:</span>
            <span className={`font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>{requiredRole}</span>
          </div>
          <div className="flex items-center justify-between text-gray-500">
            <span>Current Role:</span>
            <span className={`font-bold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>{userRole}</span>
          </div>
          <div className="flex items-center justify-between text-gray-500">
            <span>Security Policy:</span>
            <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Zero-Trust RBAC Gate</span>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onNavigateHome}
            className={`w-full py-2 px-4 rounded text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer border ${
              isDark
                ? 'bg-[#1F2937] hover:bg-[#2D3748] text-white border-[#374151]'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent shadow-xs'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            RETURN TO DASHBOARD
          </button>
        </div>
      </div>
    </div>
  );
};

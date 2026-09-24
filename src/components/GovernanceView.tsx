import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  Edit2,
  CheckCircle2,
  Cpu,
  Lock,
  Layers,
  Sparkles,
  Server,
  Users,
  UserCheck,
  UserX,
  AlertTriangle,
  RefreshCw,
  Search,
  KeyRound,
  FileCheck,
  Sliders,
  ExternalLink,
  Flame,
  ArrowRight
} from 'lucide-react';
import { RbacRole, ManagedUser } from '../types';
import { EditPermissionModal } from './Modals';
import { AccessDeniedView } from './AccessDeniedView';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import confetti from 'canvas-confetti';

interface GovernanceViewProps {
  currentRole: RbacRole;
  onNavigate?: (view: string) => void;
}

export const GovernanceView: React.FC<GovernanceViewProps> = ({
  currentRole,
  onNavigate
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { currentUser, getManagedUsers, adminUpdateUserRole, adminToggleUserStatus } = useAuth();

  // If user is not Admin, strictly block and render Access Denied barrier
  if (currentRole !== 'Admin') {
    return (
      <AccessDeniedView
        userRole={currentRole}
        requiredRole="Admin"
        attemptedView="Platform Governance & Security Center"
        onNavigateHome={() => {
          window.location.hash = '#/dashboard';
        }}
      />
    );
  }

  const [activeTab, setActiveTab] = useState<'users' | 'rbac' | 'policies' | 'zerotrust' | 'system'>('users');
  const [autonomyTier, setAutonomyTier] = useState<'SUPERVISED' | 'SEMI_AUTONOMOUS' | 'AUTONOMOUS'>('SEMI_AUTONOMOUS');
  const [sandboxRuntime, setSandboxRuntime] = useState<'gVisor' | 'Firecracker' | 'Docker'>('gVisor');
  const [userSearch, setUserSearch] = useState<string>('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('ALL');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  const [editingPermission, setEditingPermission] = useState<{
    name: string;
    description: string;
    roles: { admin: boolean; techLead: boolean; developer: boolean; devops: boolean; viewer: boolean };
  } | null>(null);

  const [permissionsMatrix, setPermissionsMatrix] = useState([
    { permission: 'Read Repositories & Code Search', admin: true, techLead: true, developer: true, devops: true, viewer: true },
    { permission: 'Execute gVisor Sandbox Unit Tests', admin: true, techLead: true, developer: true, devops: true, viewer: false },
    { permission: 'Create Git Branches & Pull Requests', admin: true, techLead: true, developer: true, devops: true, viewer: false },
    { permission: 'Approve AI Autonomous Code Patches', admin: true, techLead: true, developer: false, devops: false, viewer: false },
    { permission: 'Deploy to Staging Environment', admin: true, techLead: true, developer: true, devops: true, viewer: false },
    { permission: 'Deploy to Production & Traffic Shift', admin: true, techLead: true, developer: false, devops: true, viewer: false },
    { permission: 'Execute K8s Pod Restart / Rollback', admin: true, techLead: false, developer: false, devops: true, viewer: false },
    { permission: 'Modify RBAC & Safety Policy Gates', admin: true, techLead: false, developer: false, devops: false, viewer: false }
  ]);

  const managedUsers = getManagedUsers();

  const handleSavePermission = (updatedRoles: {
    admin: boolean;
    techLead: boolean;
    developer: boolean;
    devops: boolean;
    viewer: boolean;
  }) => {
    if (!editingPermission) return;
    setPermissionsMatrix((prev) =>
      prev.map((row) =>
        row.permission === editingPermission.name ? { ...row, ...updatedRoles } : row
      )
    );
    setEditingPermission(null);
    try {
      confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 } });
    } catch {}
    setActionSuccessMsg(`Updated permission matrix for: ${editingPermission.name}`);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  const handleAdminRoleChange = (userId: string, targetRole: RbacRole) => {
    setActionErrorMsg(null);
    const res = adminUpdateUserRole(userId, targetRole);
    if (res.success) {
      setActionSuccessMsg(`User role updated to ${targetRole} and audited.`);
      setTimeout(() => setActionSuccessMsg(null), 3500);
      try {
        confetti({ particleCount: 30, spread: 40, origin: { y: 0.7 } });
      } catch {}
    } else {
      setActionErrorMsg(res.error || 'Failed to update user role.');
      setTimeout(() => setActionErrorMsg(null), 4000);
    }
  };

  const handleToggleStatus = (userId: string) => {
    setActionErrorMsg(null);
    const res = adminToggleUserStatus(userId);
    if (res.success) {
      setActionSuccessMsg(`User account status toggled to ${res.newStatus}.`);
      setTimeout(() => setActionSuccessMsg(null), 3500);
    } else {
      setActionErrorMsg(res.error || 'Failed to change user account status.');
      setTimeout(() => setActionErrorMsg(null), 4000);
    }
  };

  const filteredUsers = managedUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.id.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div
      id="admin-governance-view"
      className={`flex-1 w-full h-full overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 font-mono transition-colors duration-150 ${
        isDark ? 'bg-[#0A0B0D] text-[#E0E0E0]' : 'bg-[#F8FAFC] text-[#0F172A]'
      }`}
    >
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
              ADMINISTRATIVE EXCLUSIVE
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              ZERO-TRUST ACTIVE
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight mt-1 flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-purple-500" />
            Platform Governance & RBAC Control
          </h1>
          <p className={`text-xs mt-1 font-sans ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Authorized administrator: <span className="font-mono font-bold text-emerald-500">Abdul Rehman Yasir</span> (admin@nexusdev.ai). Enforce identity controls, user roles, and autonomy policies.
          </p>
        </div>

        {/* Action / Audit quick links */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('audit-log')}
            className={`px-3 py-2 rounded-lg border text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              isDark
                ? 'bg-[#13161C] hover:bg-[#1A1D24] text-purple-400 border-purple-500/30'
                : 'bg-white hover:bg-purple-50 text-purple-700 border-purple-200 shadow-xs'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-purple-500" />
            Audit Ledger
          </button>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccessMsg && (
        <div className="mt-4 p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}
      {actionErrorMsg && (
        <div className="mt-4 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{actionErrorMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-800/80 mt-6 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'users'
              ? 'bg-purple-600 text-white shadow-xs'
              : isDark
              ? 'text-gray-400 hover:text-white hover:bg-[#13161C]'
              : 'text-gray-600 hover:text-black hover:bg-gray-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          User Management ({managedUsers.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rbac')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'rbac'
              ? 'bg-purple-600 text-white shadow-xs'
              : isDark
              ? 'text-gray-400 hover:text-white hover:bg-[#13161C]'
              : 'text-gray-600 hover:text-black hover:bg-gray-200'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          RBAC & Permission Matrix
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('policies')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'policies'
              ? 'bg-purple-600 text-white shadow-xs'
              : isDark
              ? 'text-gray-400 hover:text-white hover:bg-[#13161C]'
              : 'text-gray-600 hover:text-black hover:bg-gray-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          AI Autonomy & Safety Policies
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('zerotrust')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'zerotrust'
              ? 'bg-purple-600 text-white shadow-xs'
              : isDark
              ? 'text-gray-400 hover:text-white hover:bg-[#13161C]'
              : 'text-gray-600 hover:text-black hover:bg-gray-200'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          Zero-Trust Security Gates
        </button>
      </div>

      {/* TAB CONTENT: 1. USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-500" />
              <input
                type="text"
                placeholder="Search user by name, email or ID..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 rounded-lg border text-xs font-mono focus:outline-hidden ${
                  isDark
                    ? 'bg-[#13161C] border-[#2A2E39] text-white focus:border-purple-500'
                    : 'bg-white border-gray-300 text-gray-900 focus:border-purple-500'
                }`}
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <label className="text-xs text-gray-400">Filter Role:</label>
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className={`px-3 py-2 rounded-lg border text-xs font-mono focus:outline-hidden ${
                  isDark ? 'bg-[#13161C] border-[#2A2E39] text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="ALL">All Roles</option>
                <option value="Admin">Admin</option>
                <option value="TechLead">TechLead</option>
                <option value="DevOps">DevOps</option>
                <option value="Developer">Developer</option>
                <option value="Viewer">Viewer</option>
              </select>
            </div>
          </div>

          <div
            className={`rounded-xl border overflow-hidden shadow-sm ${
              isDark ? 'bg-[#0F1115] border-[#1F242F]' : 'bg-white border-gray-200'
            }`}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead
                  className={`border-b ${
                    isDark ? 'bg-[#161920] border-[#1F242F] text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-600'
                  }`}
                >
                  <tr>
                    <th className="p-3.5 font-bold">User Identity</th>
                    <th className="p-3.5 font-bold">Assigned Role</th>
                    <th className="p-3.5 font-bold">Account Status</th>
                    <th className="p-3.5 font-bold">Created Date</th>
                    <th className="p-3.5 font-bold">Role Assignment Action</th>
                    <th className="p-3.5 font-bold text-right">Access Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40">
                  {filteredUsers.map((user) => {
                    const isPermanentAdmin = user.email.toLowerCase() === 'admin@nexusdev.ai' || user.id === 'usr_admin_01';
                    return (
                      <tr
                        key={user.id}
                        className={`transition ${
                          isDark ? 'hover:bg-[#13161C]' : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white font-bold text-[11px]">
                              {user.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold flex items-center gap-1.5">
                                <span>{user.name}</span>
                                {isPermanentAdmin && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-purple-500/20 text-purple-400 font-bold border border-purple-500/30">
                                    PERMANENT OWNER
                                  </span>
                                )}
                              </div>
                              <div className={`text-[11px] font-sans ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              user.role === 'Admin'
                                ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                                : user.role === 'TechLead'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : user.role === 'DevOps'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : user.role === 'Developer'
                                ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                                : 'bg-gray-500/10 text-gray-400 border-gray-500/30'
                            }`}
                          >
                            {user.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1.5 ${
                              user.status === 'ACTIVE'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-rose-500/10 text-rose-400'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                user.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                              }`}
                            />
                            {user.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-[11px] text-gray-400 font-sans">
                          {user.createdAt ? user.createdAt.split('T')[0] : '2026-08-01'}
                        </td>
                        <td className="p-3.5">
                          {isPermanentAdmin ? (
                            <span className="text-[11px] text-gray-500 italic">Permanent Admin (Protected)</span>
                          ) : (
                            <select
                              value={user.role}
                              onChange={(e) => handleAdminRoleChange(user.id, e.target.value as RbacRole)}
                              className={`px-2.5 py-1 rounded border text-xs font-mono focus:outline-hidden ${
                                isDark ? 'bg-[#161920] border-[#2A2E39] text-white' : 'bg-gray-100 border-gray-300 text-gray-900'
                              }`}
                            >
                              <option value="Admin">Admin</option>
                              <option value="TechLead">TechLead</option>
                              <option value="DevOps">DevOps</option>
                              <option value="Developer">Developer</option>
                              <option value="Viewer">Viewer</option>
                            </select>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          {isPermanentAdmin ? (
                            <span className="text-[11px] text-emerald-500 font-bold">SYSTEM IMMUTABLE</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(user.id)}
                              className={`px-3 py-1 rounded text-xs font-bold border transition cursor-pointer ${
                                user.status === 'ACTIVE'
                                  ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              }`}
                            >
                              {user.status === 'ACTIVE' ? 'Disable User' : 'Enable User'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. RBAC MATRIX */}
      {activeTab === 'rbac' && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-purple-500" />
              Role Permission Capabilities Matrix
            </h2>
            <span className="text-xs text-gray-400">Click &quot;Edit&quot; on any permission rule to adjust role grants.</span>
          </div>

          <div
            className={`rounded-xl border overflow-hidden shadow-sm ${
              isDark ? 'bg-[#0F1115] border-[#1F242F]' : 'bg-white border-gray-200'
            }`}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead
                  className={`border-b ${
                    isDark ? 'bg-[#161920] border-[#1F242F] text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-600'
                  }`}
                >
                  <tr>
                    <th className="p-3.5 font-bold">Engineering Capability</th>
                    <th className="p-3.5 font-bold text-center">Admin</th>
                    <th className="p-3.5 font-bold text-center">TechLead</th>
                    <th className="p-3.5 font-bold text-center">DevOps</th>
                    <th className="p-3.5 font-bold text-center">Developer</th>
                    <th className="p-3.5 font-bold text-center">Viewer</th>
                    <th className="p-3.5 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40">
                  {permissionsMatrix.map((row, idx) => (
                    <tr
                      key={idx}
                      className={`transition ${isDark ? 'hover:bg-[#13161C]' : 'hover:bg-gray-50'}`}
                    >
                      <td className="p-3.5 font-medium">{row.permission}</td>
                      <td className="p-3.5 text-center">
                        {row.admin ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        {row.techLead ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        {row.devops ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        {row.developer ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        {row.viewer ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setEditingPermission({
                              name: row.permission,
                              description: `Role grant settings for: ${row.permission}`,
                              roles: {
                                admin: row.admin,
                                techLead: row.techLead,
                                developer: row.developer,
                                devops: row.devops,
                                viewer: row.viewer
                              }
                            })
                          }
                          className={`p-1.5 rounded transition cursor-pointer ${
                            isDark
                              ? 'hover:bg-gray-800 text-gray-400 hover:text-white'
                              : 'hover:bg-gray-200 text-gray-600 hover:text-black'
                          }`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 3. POLICIES & AUTONOMY */}
      {activeTab === 'policies' && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            className={`p-5 rounded-xl border ${
              isDark ? 'bg-[#0F1115] border-[#1F242F]' : 'bg-white border-gray-200'
            }`}
          >
            <h3 className="text-sm font-bold flex items-center gap-2 text-emerald-400">
              <Sparkles className="w-4 h-4" />
              Autonomous Agent Execution Tiers
            </h3>
            <p className={`text-xs mt-1 font-sans ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Define agent autonomy bounds for generating code, executing tests, and opening PRs.
            </p>

            <div className="mt-4 space-y-2">
              {[
                { id: 'SUPERVISED', label: 'Tier 1: Fully Supervised', desc: 'Agent requires human confirmation for all terminal commands and code patches.' },
                { id: 'SEMI_AUTONOMOUS', label: 'Tier 2: Semi-Autonomous (Recommended)', desc: 'Agent can autonomously fix test failures and open PRs. Deployment requires human sign-off.' },
                { id: 'AUTONOMOUS', label: 'Tier 3: Autonomous CI/CD Self-Healing', desc: 'Agent can auto-merge and deploy fixes to staging without explicit manual intervention.' }
              ].map((tier) => (
                <div
                  key={tier.id}
                  onClick={() => setAutonomyTier(tier.id as any)}
                  className={`p-3 rounded-lg border cursor-pointer transition ${
                    autonomyTier === tier.id
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                      : isDark
                      ? 'bg-[#13161C] border-[#1F242F] text-gray-400 hover:border-gray-700'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">{tier.label}</span>
                    {autonomyTier === tier.id && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  </div>
                  <p className="text-[11px] font-sans mt-1 text-gray-400">{tier.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div
            className={`p-5 rounded-xl border ${
              isDark ? 'bg-[#0F1115] border-[#1F242F]' : 'bg-white border-gray-200'
            }`}
          >
            <h3 className="text-sm font-bold flex items-center gap-2 text-purple-400">
              <Cpu className="w-4 h-4" />
              Sandbox Runtime Isolation Engine
            </h3>
            <p className={`text-xs mt-1 font-sans ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Select the container virtualization technology used to execute AI-generated commands safely.
            </p>

            <div className="mt-4 space-y-2">
              {[
                { id: 'gVisor', name: 'Google gVisor (runsc)', desc: 'User-space kernel delivering strict syscall interception and zero host kernel leakage.' },
                { id: 'Firecracker', name: 'AWS Firecracker MicroVM', desc: 'Ultra-lightweight microVMs with sub-second launch times and hardware-level isolation.' },
                { id: 'Docker', name: 'Standard Rootless Docker', desc: 'Standard Linux cgroups and seccomp container containment.' }
              ].map((rt) => (
                <div
                  key={rt.id}
                  onClick={() => setSandboxRuntime(rt.id as any)}
                  className={`p-3 rounded-lg border cursor-pointer transition ${
                    sandboxRuntime === rt.id
                      ? 'bg-purple-500/10 border-purple-500/40 text-white'
                      : isDark
                      ? 'bg-[#13161C] border-[#1F242F] text-gray-400 hover:border-gray-700'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">{rt.name}</span>
                    {sandboxRuntime === rt.id && <CheckCircle2 className="w-4 h-4 text-purple-500" />}
                  </div>
                  <p className="text-[11px] font-sans mt-1 text-gray-400">{rt.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 4. ZERO-TRUST SECURITY */}
      {activeTab === 'zerotrust' && (
        <div className="mt-6 space-y-4">
          <div
            className={`p-5 rounded-xl border ${
              isDark ? 'bg-[#0F1115] border-[#1F242F]' : 'bg-white border-gray-200'
            }`}
          >
            <h3 className="text-sm font-bold flex items-center gap-2 text-purple-400">
              <ShieldCheck className="w-4 h-4" />
              Platform-Wide Zero-Trust Enforcement Gates
            </h3>
            <p className={`text-xs mt-1 font-sans ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Mandatory cryptographic policies enforced across all incoming API requests, autonomous workloads, and engineering deployments.
            </p>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-emerald-400">Mutual TLS 1.3 Strict Auth</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">All microservice mesh traffic encrypted end-to-end.</div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-emerald-400">Automated Secret Masking</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">High-entropy tokens, API keys, and certificates masked from all logs.</div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-emerald-400">Append-Only Audit Ledger</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">SHA-256 chained audit records preventing post-incident tampering.</div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-emerald-400">Hardware FIDO2 MFA Required</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">WebAuthn / Yubikey enforcement for all production deployment approvals.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permission Edit Modal */}
      {editingPermission && (
        <EditPermissionModal
          isOpen={true}
          permissionName={editingPermission.name}
          description={editingPermission.description}
          roles={editingPermission.roles}
          onClose={() => setEditingPermission(null)}
          onSave={handleSavePermission}
        />
      )}
    </div>
  );
};

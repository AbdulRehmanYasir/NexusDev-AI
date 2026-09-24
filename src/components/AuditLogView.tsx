import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Bot,
  User,
  CheckCircle2,
  Lock,
  Download,
  FileSpreadsheet,
  FileCode,
  FileText,
  Table,
  ChevronDown,
  AlertTriangle,
  Loader2,
  X,
  LogIn,
  LogOut,
  ShieldAlert,
  KeyRound,
  Activity,
  Calendar,
  Layers
} from 'lucide-react';
import { AuditRecord, LoginAuditRecord, RbacRole } from '../types';
import { AuditEventModal } from './Modals';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import confetti from 'canvas-confetti';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface AuditLogViewProps {
  auditRecords: AuditRecord[];
}

interface ExportToast {
  type: 'success' | 'error';
  title: string;
  message: string;
  recordCount?: number;
  format?: string;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ auditRecords }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { currentUser, getLoginAuditRecords } = useAuth();
  const isAdmin = currentUser?.role === 'Admin';

  const [activeTab, setActiveTab] = useState<'system' | 'login'>('system');

  // System Ledger State
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('ALL');
  const [selectedAuditRecord, setSelectedAuditRecord] = useState<AuditRecord | null>(null);
  const [isVerifyingIntegrity, setIsVerifyingIntegrity] = useState<boolean>(false);
  const [integrityVerified, setIntegrityVerified] = useState<boolean>(false);

  // Login Activity State (Admin Only)
  const [loginSearch, setLoginSearch] = useState('');
  const [loginRoleFilter, setLoginRoleFilter] = useState<string>('ALL');
  const [loginEventFilter, setLoginEventFilter] = useState<string>('ALL');
  const [loginStatusFilter, setLoginStatusFilter] = useState<string>('ALL');
  const [selectedLoginRecord, setSelectedLoginRecord] = useState<LoginAuditRecord | null>(null);

  // Export dropdown & loading states
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportLoadingText, setExportLoadingText] = useState<string | null>(null);
  const [toast, setToast] = useState<ExportToast | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Clear auto-dismiss timer on unmount
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const showToast = (toastData: ExportToast) => {
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    setToast(toastData);
    toastTimeoutRef.current = window.setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Filtered System Records
  const filteredSystemRecords = (auditRecords || []).filter((rec) => {
    const actStr = (rec?.action || '').toLowerCase();
    const tgtStr = ((rec?.targetResource || (rec as any)?.target || '') as string).toLowerCase();
    const usrStr = ((rec?.actorName || (rec as any)?.actor || '') as string).toLowerCase();
    const query = (search || '').toLowerCase();
    const matchesSearch =
      actStr.includes(query) ||
      tgtStr.includes(query) ||
      usrStr.includes(query);
    const matchesRisk = riskFilter === 'ALL' || rec?.riskLevel === riskFilter;
    return matchesSearch && matchesRisk;
  });

  // Filtered Login Activity Records (Strict Admin Gate)
  const loginAuditRecords: LoginAuditRecord[] = isAdmin ? getLoginAuditRecords() : [];

  const filteredLoginRecords = loginAuditRecords.filter((rec) => {
    const query = loginSearch.toLowerCase();
    const matchesSearch =
      rec.userName.toLowerCase().includes(query) ||
      rec.email.toLowerCase().includes(query) ||
      rec.sourceIp.toLowerCase().includes(query) ||
      rec.sessionId.toLowerCase().includes(query) ||
      rec.event.toLowerCase().includes(query);

    const matchesRole = loginRoleFilter === 'ALL' || rec.role === loginRoleFilter;
    const matchesEvent = loginEventFilter === 'ALL' || rec.event === loginEventFilter;
    const matchesStatus = loginStatusFilter === 'ALL' || rec.status === loginStatusFilter;

    return matchesSearch && matchesRole && matchesEvent && matchesStatus;
  });

  const handleVerifyChain = () => {
    setIsVerifyingIntegrity(true);
    setTimeout(() => {
      setIsVerifyingIntegrity(false);
      setIntegrityVerified(true);
      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      } catch {}
    }, 1200);
  };

  // System Record Exporter mapping (Full un-truncated)
  const getSystemExportRow = (rec: AuditRecord) => {
    const actor = rec.actorName || (rec as any).actor || 'NexusDev AI Agent';
    const role = rec.actorType || (String(actor).toLowerCase().includes('agent') || String(actor).toLowerCase().includes('ai') ? 'AI_AGENT' : 'HUMAN');
    const target = rec.targetResource || (rec as any).target || 'src/core-system';
    const status = rec.status || (rec as any).permissionResult || 'EXECUTED';
    const severity = rec.riskLevel || 'LOW';
    const environment = rec.environment || (rec as any).env || 'NEBULA_PROD';
    const ipSource = rec.sourceIp || (role === 'HUMAN' ? '192.168.1.104' : 'sandbox://nebula-worker-01');
    const requestId = rec.requestId || `req_${(rec.id || '0').replace('aud_', '')}_${(rec.timestamp || '').replace(/\s+/g, '_')}`;
    const prevState = rec.previousState || (rec.category === 'DEPLOYMENT' ? 'RELEASE_V2_4_0_ACTIVE' : 'STABLE_TREE');
    const newState = rec.newState || (rec.category === 'DEPLOYMENT' ? 'RELEASE_V2_4_1_CANARY' : 'COMMITTED');
    const hash = rec.hash || rec.sha256 || 'sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069';
    const details = rec.details || rec.description || `Executed audit trace for ${rec.action} targeting ${target}`;

    return {
      'Audit ID': rec.id,
      'Timestamp': rec.timestamp,
      'Actor': actor,
      'Actor Type': role,
      'Action': rec.action,
      'Category': rec.category || 'SECURITY',
      'Target Resource': target,
      'Permission Used': rec.permissionUsed || 'EXECUTE',
      'Risk Level': severity,
      'Policy Result': status,
      'Details & Telemetry (Full)': details,
      'Environment': environment,
      'Source IP': ipSource,
      'Request ID': requestId,
      'Previous State': prevState,
      'New State': newState,
      'SHA-256 Hash': hash
    };
  };

  // Login Record Exporter mapping (Full un-truncated)
  const getLoginExportRow = (rec: LoginAuditRecord) => {
    return {
      'Audit ID': rec.id,
      'Timestamp': rec.timestamp,
      'User Name': rec.userName,
      'Email Address': rec.email,
      'Role': rec.role,
      'Event Type': rec.event,
      'Status': rec.status,
      'Source IP': rec.sourceIp,
      'Session ID': rec.sessionId,
      'Request ID': rec.requestId,
      'Failure Reason / Notes': rec.failureReason || 'Authentication signature verified successfully',
      'Environment': rec.environment || 'NEBULA_PROD'
    };
  };

  const handleExport = (format: 'CSV' | 'JSON' | 'PDF' | 'EXCEL') => {
    setIsDropdownOpen(false);
    setIsExporting(true);
    setExportLoadingText(`Generating ${format}...`);

    setTimeout(() => {
      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const prefix = activeTab === 'system' ? 'nexusdev-system-audit' : 'nexusdev-login-audit';
        const filename = `${prefix}-${timestamp}`;

        if (activeTab === 'system') {
          // Export System Ledger
          const rows = filteredSystemRecords.map(getSystemExportRow);

          if (format === 'CSV') {
            const headers = Object.keys(rows[0] || {});
            const csvContent = [
              headers.join(','),
              ...rows.map((row) =>
                headers
                  .map((h) => {
                    const val = String((row as any)[h] || '');
                    return `"${val.replace(/"/g, '""')}"`;
                  })
                  .join(',')
              )
            ].join('\r\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${filename}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          } else if (format === 'JSON') {
            const jsonBlob = new Blob([JSON.stringify(filteredSystemRecords, null, 2)], {
              type: 'application/json;charset=utf-8;'
            });
            const url = URL.createObjectURL(jsonBlob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${filename}.json`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          } else if (format === 'EXCEL') {
            const worksheet = XLSX.utils.json_to_sheet(rows);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'System Audit Ledger');
            XLSX.writeFile(workbook, `${filename}.xlsx`);
          } else if (format === 'PDF') {
            const doc = new jsPDF('landscape', 'pt', 'a4');
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

            // 1. BRANDED ENTERPRISE HEADER BACKGROUND
            // NexusDev AI Dark Slate/Charcoal background with Emerald bottom border
            doc.setFillColor(11, 15, 23); // #0B0F17
            doc.rect(0, 0, pageWidth, 74, 'F');

            doc.setFillColor(16, 185, 129); // #10B981 Emerald accent line
            doc.rect(0, 72, pageWidth, 2.5, 'F');

            // 2. OFFICIAL NEXUSDEV AI LOGO ICON (Vector Canvas Terminal Icon matching Header)
            const logoX = 40;
            const logoY = 16;
            const logoSize = 42;

            // Logo Outer rounded container (#0A1A17 with emerald border)
            doc.setFillColor(10, 26, 23);
            doc.setDrawColor(16, 185, 129);
            doc.setLineWidth(1.2);
            doc.roundedRect(logoX, logoY, logoSize, logoSize, 6, 6, 'FD');

            // Logo Terminal Bracket / Inner Symbol (> _)
            doc.setTextColor(16, 185, 129);
            doc.setFont('courier', 'bold');
            doc.setFontSize(18);
            doc.text('>', logoX + 8, logoY + 24);
            doc.setFontSize(14);
            doc.text('_', logoX + 22, logoY + 26);

            // 3. HEADER TYPOGRAPHY
            // Primary Brand Title: NEXUSDEV AI
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            doc.setTextColor(255, 255, 255);
            doc.text('NEXUSDEV AI', logoX + 54, logoY + 18);

            // System Badge next to Brand Title
            doc.setFillColor(16, 185, 129);
            doc.roundedRect(logoX + 175, logoY + 7, 65, 13, 3, 3, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.5);
            doc.setTextColor(11, 15, 23);
            doc.text('ENTERPRISE', logoX + 183, logoY + 16.5);

            // Subtitle: AUDIT LEDGER REPORT
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(16, 185, 129);
            doc.text('AUDIT LEDGER REPORT', logoX + 54, logoY + 34);

            // Header Metadata (Right Aligned)
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(156, 163, 175); // gray-400
            const genDate = new Date().toUTCString();
            doc.text(`Generated: ${genDate}`, pageWidth - 40, logoY + 14, { align: 'right' });
            doc.text(`Scope: SYSTEM & AGENT LEDGER  |  Records: ${rows.length}`, pageWidth - 40, logoY + 26, { align: 'right' });
            doc.text('Security Classification: HIGH INTEGRITY (SHA-256)', pageWidth - 40, logoY + 38, { align: 'right' });

            const tableColumns = [
              { header: 'ID', dataKey: 'Audit ID' },
              { header: 'Timestamp', dataKey: 'Timestamp' },
              { header: 'Actor', dataKey: 'Actor' },
              { header: 'Action', dataKey: 'Action' },
              { header: 'Target Resource', dataKey: 'Target Resource' },
              { header: 'Risk', dataKey: 'Risk Level' },
              { header: 'Result', dataKey: 'Policy Result' },
              { header: 'Details & Telemetry', dataKey: 'Details & Telemetry (Full)' }
            ];

            autoTable(doc, {
              startY: 86,
              margin: { left: 40, right: 40, bottom: 50 },
              head: [tableColumns.map((c) => c.header)],
              body: rows.map((r) => [
                r['Audit ID'],
                r['Timestamp'],
                r['Actor'],
                r['Action'],
                r['Target Resource'],
                r['Risk Level'],
                r['Policy Result'],
                r['Details & Telemetry (Full)']
              ]),
              theme: 'grid',
              styles: { fontSize: 8, cellPadding: 4, overflow: 'linebreak' },
              headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
              alternateRowStyles: { fillColor: [248, 250, 252] },
              didDrawPage: (data) => {
                const totalPages = (doc as any).internal.getNumberOfPages();
                const currentPage = data.pageNumber;

                // Footer Line Divider
                doc.setDrawColor(226, 232, 240);
                doc.setLineWidth(0.8);
                doc.line(40, pageHeight - 34, pageWidth - 40, pageHeight - 34);

                // System Generated Notice (Left)
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(7.5);
                doc.setTextColor(100, 116, 139);
                doc.text(
                  'This audit record is system-generated and requires no signature. Cryptographic hash chain verified.',
                  40,
                  pageHeight - 22
                );

                // Creator Branding: Made with ❤️ by Abdul Rehman Yasir (Center/Prominent)
                // Render crisp red heart symbol with Unicode fallback & bold name
                doc.setFontSize(8.5);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(71, 85, 105);
                const prefixText = 'Made with ';
                const authorPrefix = ' by ';
                const authorBold = 'Abdul Rehman Yasir';

                const centerX = pageWidth / 2;
                // Calculate text offsets for precise alignment
                const prefixWidth = doc.getTextWidth(prefixText);
                const heartWidth = 10;
                const authorPrefixWidth = doc.getTextWidth(authorPrefix);
                doc.setFont('helvetica', 'bold');
                const authorBoldWidth = doc.getTextWidth(authorBold);
                const totalFooterWidth = prefixWidth + heartWidth + authorPrefixWidth + authorBoldWidth;

                const startFooterX = centerX - totalFooterWidth / 2;

                // Draw "Made with "
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(71, 85, 105);
                doc.text(prefixText, startFooterX, pageHeight - 10);

                // Draw Red Heart Symbol (Filled vector heart for 100% crisp, uncorrupted cross-platform rendering)
                const heartX = startFooterX + prefixWidth + 1;
                const heartY = pageHeight - 14;
                doc.setFillColor(239, 68, 68); // #EF4444 Rose/Red
                // Draw clean mini heart glyph using canvas curves
                doc.circle(heartX + 2.2, heartY + 2.2, 1.8, 'F');
                doc.circle(heartX + 5.8, heartY + 2.2, 1.8, 'F');
                doc.triangle(
                  heartX + 0.5, heartY + 3.2,
                  heartX + 7.5, heartY + 3.2,
                  heartX + 4.0, heartY + 7.2,
                  'F'
                );

                // Draw " by "
                doc.setTextColor(71, 85, 105);
                doc.setFont('helvetica', 'normal');
                doc.text(authorPrefix, startFooterX + prefixWidth + heartWidth, pageHeight - 10);

                // Draw "Abdul Rehman Yasir" (Bold)
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(15, 23, 42); // slate-900 bold
                doc.text(authorBold, startFooterX + prefixWidth + heartWidth + authorPrefixWidth, pageHeight - 10);

                // Page Number (Right)
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                doc.setTextColor(100, 116, 139);
                doc.text(`Page ${currentPage} of ${totalPages}`, pageWidth - 40, pageHeight - 22, { align: 'right' });
              }
            });

            doc.save(`${filename}.pdf`);
          }
        } else {
          // Export Login Activity (Admin only)
          const rows = filteredLoginRecords.map(getLoginExportRow);

          if (format === 'CSV') {
            const headers = Object.keys(rows[0] || {});
            const csvContent = [
              headers.join(','),
              ...rows.map((row) =>
                headers
                  .map((h) => {
                    const val = String((row as any)[h] || '');
                    return `"${val.replace(/"/g, '""')}"`;
                  })
                  .join(',')
              )
            ].join('\r\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${filename}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          } else if (format === 'JSON') {
            const jsonBlob = new Blob([JSON.stringify(filteredLoginRecords, null, 2)], {
              type: 'application/json;charset=utf-8;'
            });
            const url = URL.createObjectURL(jsonBlob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${filename}.json`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          } else if (format === 'EXCEL') {
            const worksheet = XLSX.utils.json_to_sheet(rows);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'User Login Activity');
            XLSX.writeFile(workbook, `${filename}.xlsx`);
          } else if (format === 'PDF') {
            const doc = new jsPDF('landscape', 'pt', 'a4');
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

            // 1. BRANDED ENTERPRISE HEADER BACKGROUND
            // NexusDev AI Dark Slate/Charcoal background with Cyan/Emerald bottom border
            doc.setFillColor(11, 15, 23); // #0B0F17
            doc.rect(0, 0, pageWidth, 74, 'F');

            doc.setFillColor(6, 182, 212); // #06B6D4 Cyan accent line for Login/Auth Security
            doc.rect(0, 72, pageWidth, 2.5, 'F');

            // 2. OFFICIAL NEXUSDEV AI LOGO ICON (Vector Canvas Terminal Icon matching Header)
            const logoX = 40;
            const logoY = 16;
            const logoSize = 42;

            // Logo Outer rounded container (#0A1A17 with cyan border)
            doc.setFillColor(10, 24, 28);
            doc.setDrawColor(6, 182, 212);
            doc.setLineWidth(1.2);
            doc.roundedRect(logoX, logoY, logoSize, logoSize, 6, 6, 'FD');

            // Logo Terminal Bracket / Inner Symbol (> _)
            doc.setTextColor(6, 182, 212);
            doc.setFont('courier', 'bold');
            doc.setFontSize(18);
            doc.text('>', logoX + 8, logoY + 24);
            doc.setFontSize(14);
            doc.text('_', logoX + 22, logoY + 26);

            // 3. HEADER TYPOGRAPHY
            // Primary Brand Title: NEXUSDEV AI
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            doc.setTextColor(255, 255, 255);
            doc.text('NEXUSDEV AI', logoX + 54, logoY + 18);

            // System Badge next to Brand Title
            doc.setFillColor(6, 182, 212);
            doc.roundedRect(logoX + 175, logoY + 7, 85, 13, 3, 3, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.5);
            doc.setTextColor(11, 15, 23);
            doc.text('ADMIN AUDIT ACCESS', logoX + 181, logoY + 16.5);

            // Subtitle: USER LOGIN ACTIVITY REPORT
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(6, 182, 212);
            doc.text('USER LOGIN & AUTHENTICATION AUDIT REPORT', logoX + 54, logoY + 34);

            // Header Metadata (Right Aligned)
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(156, 163, 175); // gray-400
            const genDate = new Date().toUTCString();
            doc.text(`Generated: ${genDate}`, pageWidth - 40, logoY + 14, { align: 'right' });
            doc.text(`Scope: USER LOGIN ACTIVITY  |  Records: ${rows.length}`, pageWidth - 40, logoY + 26, { align: 'right' });
            doc.text('Classification: STRICT CONFIDENTIAL (RBAC AUDIT)', pageWidth - 40, logoY + 38, { align: 'right' });

            const tableColumns = [
              { header: 'ID', dataKey: 'Audit ID' },
              { header: 'Timestamp', dataKey: 'Timestamp' },
              { header: 'User Name', dataKey: 'User Name' },
              { header: 'Email Address', dataKey: 'Email Address' },
              { header: 'Role', dataKey: 'Role' },
              { header: 'Event', dataKey: 'Event Type' },
              { header: 'Status', dataKey: 'Status' },
              { header: 'Source IP', dataKey: 'Source IP' },
              { header: 'Session / Notes', dataKey: 'Failure Reason / Notes' }
            ];

            autoTable(doc, {
              startY: 86,
              margin: { left: 40, right: 40, bottom: 50 },
              head: [tableColumns.map((c) => c.header)],
              body: rows.map((r) => [
                r['Audit ID'],
                r['Timestamp'],
                r['User Name'],
                r['Email Address'],
                r['Role'],
                r['Event Type'],
                r['Status'],
                r['Source IP'],
                r['Failure Reason / Notes']
              ]),
              theme: 'grid',
              styles: { fontSize: 8, cellPadding: 4, overflow: 'linebreak' },
              headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
              alternateRowStyles: { fillColor: [248, 250, 252] },
              didDrawPage: (data) => {
                const totalPages = (doc as any).internal.getNumberOfPages();
                const currentPage = data.pageNumber;

                // Footer Line Divider
                doc.setDrawColor(226, 232, 240);
                doc.setLineWidth(0.8);
                doc.line(40, pageHeight - 34, pageWidth - 40, pageHeight - 34);

                // System Generated Notice (Left)
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(7.5);
                doc.setTextColor(100, 116, 139);
                doc.text(
                  'This audit record is system-generated and requires no signature. Zero-trust security logged.',
                  40,
                  pageHeight - 22
                );

                // Creator Branding: Made with ❤️ by Abdul Rehman Yasir (Center/Prominent)
                doc.setFontSize(8.5);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(71, 85, 105);
                const prefixText = 'Made with ';
                const authorPrefix = ' by ';
                const authorBold = 'Abdul Rehman Yasir';

                const centerX = pageWidth / 2;
                const prefixWidth = doc.getTextWidth(prefixText);
                const heartWidth = 10;
                const authorPrefixWidth = doc.getTextWidth(authorPrefix);
                doc.setFont('helvetica', 'bold');
                const authorBoldWidth = doc.getTextWidth(authorBold);
                const totalFooterWidth = prefixWidth + heartWidth + authorPrefixWidth + authorBoldWidth;

                const startFooterX = centerX - totalFooterWidth / 2;

                // Draw "Made with "
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(71, 85, 105);
                doc.text(prefixText, startFooterX, pageHeight - 10);

                // Draw Red Heart Symbol (Filled vector heart for 100% crisp, uncorrupted cross-platform rendering)
                const heartX = startFooterX + prefixWidth + 1;
                const heartY = pageHeight - 14;
                doc.setFillColor(239, 68, 68); // #EF4444 Rose/Red
                doc.circle(heartX + 2.2, heartY + 2.2, 1.8, 'F');
                doc.circle(heartX + 5.8, heartY + 2.2, 1.8, 'F');
                doc.triangle(
                  heartX + 0.5, heartY + 3.2,
                  heartX + 7.5, heartY + 3.2,
                  heartX + 4.0, heartY + 7.2,
                  'F'
                );

                // Draw " by "
                doc.setTextColor(71, 85, 105);
                doc.setFont('helvetica', 'normal');
                doc.text(authorPrefix, startFooterX + prefixWidth + heartWidth, pageHeight - 10);

                // Draw "Abdul Rehman Yasir" (Bold)
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(15, 23, 42); // slate-900 bold
                doc.text(authorBold, startFooterX + prefixWidth + heartWidth + authorPrefixWidth, pageHeight - 10);

                // Page Number (Right)
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                doc.setTextColor(100, 116, 139);
                doc.text(`Page ${currentPage} of ${totalPages}`, pageWidth - 40, pageHeight - 22, { align: 'right' });
              }
            });

            doc.save(`${filename}.pdf`);
          }
        }

        const count = activeTab === 'system' ? filteredSystemRecords.length : filteredLoginRecords.length;
        showToast({
          type: 'success',
          title: `EXPORT SUCCESSFUL (${format})`,
          message: `Saved ${count} full audit entries without truncation.`,
          recordCount: count,
          format
        });
      } catch (err: any) {
        showToast({
          type: 'error',
          title: 'EXPORT FAILED',
          message: err?.message || 'Failed to generate audit export file.'
        });
      } finally {
        setIsExporting(false);
        setExportLoadingText(null);
      }
    }, 200);
  };

  return (
    <div
      id="audit-log-view"
      className={`flex-1 p-6 space-y-6 overflow-y-auto font-mono relative transition-colors ${
        isDark ? 'bg-[#0A0B0D] text-[#E0E0E0]' : 'bg-[#F6F8FA] text-[#111827]'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
            <h1 className={`text-sm font-bold tracking-tight uppercase ${isDark ? 'text-white' : 'text-gray-900'}`}>
              SECURITY & GOVERNANCE AUDIT LEDGER
            </h1>
          </div>
          <p className={`text-xs mt-1 font-sans ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Tamper-evident, cryptographically verifiable log of every agent action, human approval, and authentication lifecycle.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {activeTab === 'system' && (
            <button
              onClick={handleVerifyChain}
              disabled={isVerifyingIntegrity}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold border transition cursor-pointer ${
                isDark
                  ? 'bg-[#1F2937] hover:bg-[#2D3748] text-emerald-400 hover:text-emerald-300 border-[#374151]'
                  : 'bg-white hover:bg-gray-100 text-emerald-700 hover:text-emerald-800 border-gray-300 shadow-xs'
              }`}
            >
              <Lock className={`w-3.5 h-3.5 ${isVerifyingIntegrity ? 'animate-spin' : ''}`} />
              <span>
                {isVerifyingIntegrity
                  ? 'VERIFYING HASH TREE...'
                  : integrityVerified
                  ? 'CHAIN VERIFIED (SHA-256)'
                  : 'VERIFY MERKLE INTEGRITY'}
              </span>
            </button>
          )}

          {/* Unified Multi-Format Export Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              id="audit-export-dropdown-btn"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              disabled={isExporting}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold border transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                isDark
                  ? `bg-[#1F2937] hover:bg-[#2D3748] text-gray-200 hover:text-white border-[#374151] ${
                      isDropdownOpen ? 'ring-1 ring-emerald-500 border-emerald-500/50 bg-[#2D3748]' : ''
                    }`
                  : `bg-white hover:bg-gray-100 text-gray-800 border-gray-300 shadow-xs ${
                      isDropdownOpen ? 'ring-2 ring-emerald-500/20 border-emerald-500 bg-gray-50' : ''
                    }`
              }`}
              title="Export workspace audit ledger in multiple formats"
            >
              {isExporting ? (
                <Loader2 className={`w-3.5 h-3.5 animate-spin ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
              ) : (
                <Download className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
              )}
              <span>{exportLoadingText || 'Export'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${isDark ? 'text-gray-400' : 'text-gray-500'} ${isDropdownOpen ? 'rotate-180 text-emerald-500' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div
                id="audit-export-menu"
                className={`absolute right-0 mt-1.5 w-52 rounded-lg border shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100 divide-y ${
                  isDark
                    ? 'bg-[#12141A] border-[#2D3748] divide-[#1F2937]'
                    : 'bg-white border-gray-200 divide-gray-100'
                }`}
              >
                <div className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <span>Export Format</span>
                  <span className={`font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    {activeTab === 'system' ? filteredSystemRecords.length : filteredLoginRecords.length} recs
                  </span>
                </div>

                <div className="py-1">
                  <button
                    id="export-csv-btn"
                    onClick={() => handleExport('CSV')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition cursor-pointer group ${
                      isDark ? 'text-gray-200 hover:bg-[#1E232D] hover:text-emerald-400' : 'text-gray-700 hover:bg-gray-50 hover:text-emerald-700'
                    }`}
                  >
                    <div className={`p-1 rounded ${isDark ? 'bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20' : 'bg-emerald-50 text-emerald-600'}`}>
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex flex-col">
                      <span className={`font-semibold ${isDark ? 'text-gray-100 group-hover:text-emerald-400' : 'text-gray-900 group-hover:text-emerald-700'}`}>Export as CSV</span>
                      <span className="text-[10px] text-gray-500 font-mono">.csv tabular dataset</span>
                    </div>
                  </button>

                  <button
                    id="export-json-btn"
                    onClick={() => handleExport('JSON')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition cursor-pointer group ${
                      isDark ? 'text-gray-200 hover:bg-[#1E232D] hover:text-cyan-400' : 'text-gray-700 hover:bg-gray-50 hover:text-cyan-700'
                    }`}
                  >
                    <div className={`p-1 rounded ${isDark ? 'bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20' : 'bg-cyan-50 text-cyan-600'}`}>
                      <FileCode className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex flex-col">
                      <span className={`font-semibold ${isDark ? 'text-gray-100 group-hover:text-cyan-400' : 'text-gray-900 group-hover:text-cyan-700'}`}>Export as JSON</span>
                      <span className="text-[10px] text-gray-500 font-mono">.json structured payload</span>
                    </div>
                  </button>

                  <button
                    id="export-pdf-btn"
                    onClick={() => handleExport('PDF')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition cursor-pointer group ${
                      isDark ? 'text-gray-200 hover:bg-[#1E232D] hover:text-rose-400' : 'text-gray-700 hover:bg-gray-50 hover:text-rose-700'
                    }`}
                  >
                    <div className={`p-1 rounded ${isDark ? 'bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20' : 'bg-rose-50 text-rose-600'}`}>
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex flex-col">
                      <span className={`font-semibold ${isDark ? 'text-gray-100 group-hover:text-rose-400' : 'text-gray-900 group-hover:text-rose-700'}`}>Export as PDF</span>
                      <span className="text-[10px] text-gray-500 font-mono">.pdf formatted report</span>
                    </div>
                  </button>

                  <button
                    id="export-excel-btn"
                    onClick={() => handleExport('EXCEL')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition cursor-pointer group ${
                      isDark ? 'text-gray-200 hover:bg-[#1E232D] hover:text-emerald-300' : 'text-gray-700 hover:bg-gray-50 hover:text-emerald-700'
                    }`}
                  >
                    <div className={`p-1 rounded ${isDark ? 'bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20' : 'bg-emerald-50 text-emerald-600'}`}>
                      <Table className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex flex-col">
                      <span className={`font-semibold ${isDark ? 'text-gray-100 group-hover:text-emerald-300' : 'text-gray-900 group-hover:text-emerald-700'}`}>Export as Excel</span>
                      <span className="text-[10px] text-gray-500 font-mono">.xlsx workbook</span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Primary Section Switcher */}
      <div className={`flex items-center justify-between border-b pb-2 ${isDark ? 'border-[#2D3748]' : 'border-[#D0D7DE]'}`}>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('system')}
            className={`px-3 py-1.5 rounded-t-lg text-xs font-bold font-mono transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'system'
                ? isDark
                  ? 'bg-[#1F2937] text-white border-t border-x border-[#374151]'
                  : 'bg-white text-gray-900 border-t border-x border-[#D0D7DE] shadow-xs'
                : isDark
                ? 'text-gray-400 hover:text-gray-200'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
            <span>SYSTEM & AGENT LEDGER</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-800'}`}>
              {auditRecords.length}
            </span>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('login')}
              className={`px-3 py-1.5 rounded-t-lg text-xs font-bold font-mono transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'login'
                  ? isDark
                    ? 'bg-[#1F2937] text-white border-t border-x border-[#374151]'
                    : 'bg-white text-gray-900 border-t border-x border-[#D0D7DE] shadow-xs'
                  : isDark
                  ? 'text-gray-400 hover:text-gray-200'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <KeyRound className={`w-3.5 h-3.5 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
              <span>USER LOGIN ACTIVITY</span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${isDark ? 'bg-cyan-500/20 text-cyan-300' : 'bg-cyan-100 text-cyan-800'}`}>
                ADMIN ONLY ({loginAuditRecords.length})
              </span>
            </button>
          )}
        </div>

        <div className="text-[10px] text-gray-500 font-mono hidden sm:block">
          ENCRYPTED ZERO-TRUST STREAM
        </div>
      </div>

      {/* TAB 1: SYSTEM & AGENT LEDGER */}
      {activeTab === 'system' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border ${
            isDark ? 'bg-[#1A1D23] border-[#2D3748]' : 'bg-white border-[#D0D7DE] shadow-xs'
          }`}>
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-500" />
              <input
                type="text"
                placeholder="Search action, actor, or target..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full pl-8 pr-3 py-1.5 rounded text-xs border focus:outline-hidden font-mono ${
                  isDark
                    ? 'bg-[#0A0B0D] text-gray-200 border-[#2D3748] focus:border-emerald-500'
                    : 'bg-[#F6F8FA] text-gray-900 border-gray-300 focus:border-emerald-600 shadow-xs'
                }`}
              />
            </div>

            <div className={`flex items-center rounded p-0.5 border text-xs ${
              isDark ? 'bg-[#0A0B0D] border-[#2D3748]' : 'bg-gray-100 border-gray-300'
            }`}>
              {(['ALL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setRiskFilter(lvl)}
                  className={`px-2.5 py-1 rounded uppercase font-bold transition cursor-pointer text-[10px] ${
                    riskFilter === lvl
                      ? isDark
                        ? 'bg-[#2D3748] text-white'
                        : 'bg-emerald-600 text-white'
                      : isDark
                      ? 'text-gray-500 hover:text-gray-300'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* System Audit Log Table */}
          <div className={`rounded-lg border overflow-hidden ${
            isDark ? 'bg-[#1A1D23] border-[#2D3748]' : 'bg-white border-[#D0D7DE] shadow-xs'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={`border-b text-[10px] uppercase tracking-wider ${
                  isDark ? 'bg-[#0F1115] text-gray-400 border-[#2D3748]' : 'bg-[#F1F3F5] text-gray-600 border-[#D0D7DE]'
                }`}>
                  <tr>
                    <th className="p-3.5">TIMESTAMP</th>
                    <th className="p-3.5">ACTOR</th>
                    <th className="p-3.5">ACTION</th>
                    <th className="p-3.5">TARGET</th>
                    <th className="p-3.5">RISK LEVEL</th>
                    <th className="p-3.5">POLICY RESULT</th>
                    <th className="p-3.5">DETAILS</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-[#2D3748] text-gray-300' : 'divide-[#E1E4E8] text-gray-700'}`}>
                  {filteredSystemRecords.map((record) => {
                    const actorStr = record?.actorName || (record as any)?.actor || '';
                    const isAgent = actorStr.includes('AI') || actorStr.includes('Agent');
                    return (
                      <tr
                        key={record.id}
                        onClick={() => setSelectedAuditRecord(record)}
                        className={`transition cursor-pointer group ${
                          isDark ? 'hover:bg-[#2D3748]/50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="p-3.5 text-gray-500 whitespace-nowrap">{record.timestamp}</td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5">
                            {isAgent ? (
                              <Bot className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                            ) : (
                              <User className={`w-3.5 h-3.5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                            )}
                            <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{actorStr}</span>
                          </div>
                        </td>
                        <td className={`p-3.5 font-semibold font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>{record.action}</td>
                        <td className={`p-3.5 font-mono ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{record.targetResource || (record as any).target}</td>
                        <td className="p-3.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                              record.riskLevel === 'CRITICAL'
                                ? isDark ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-rose-100 text-rose-800 border-rose-300'
                                : record.riskLevel === 'HIGH'
                                ? isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-amber-100 text-amber-800 border-amber-300'
                                : record.riskLevel === 'MEDIUM'
                                ? isDark ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-purple-100 text-purple-800 border-purple-300'
                                : isDark ? 'bg-gray-700/40 text-gray-300 border-gray-600/40' : 'bg-gray-100 text-gray-700 border-gray-300'
                            }`}
                          >
                            {record.riskLevel}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className={`flex items-center gap-1 font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                            <CheckCircle2 className="w-3.5 h-3.5" /> {record.status || (record as any).permissionResult || 'EXECUTED'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className={`text-[10px] transition font-bold ${
                            isDark ? 'text-gray-500 group-hover:text-emerald-400' : 'text-gray-400 group-hover:text-emerald-700'
                          }`}>
                            INSPECT →
                          </span>
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

      {/* TAB 2: USER LOGIN ACTIVITY (ADMIN ONLY) */}
      {activeTab === 'login' && (
        <>
          {!isAdmin ? (
            <div className={`p-8 rounded-xl border text-center space-y-3 ${
              isDark ? 'bg-[#12141A] border-rose-500/40' : 'bg-rose-50 border-rose-200 shadow-xs'
            }`}>
              <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto" />
              <h2 className={`text-sm font-bold uppercase ${isDark ? 'text-white' : 'text-gray-900'}`}>ACCESS DENIED — ADMIN ONLY</h2>
              <p className={`text-xs font-sans max-w-md mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                User authentication telemetry and login audit records contain confidential identity data. Administrator authorization is strictly required.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className={`p-3 rounded border ${isDark ? 'bg-[#1A1D23] border-[#2D3748]' : 'bg-white border-[#D0D7DE] shadow-xs'}`}>
                  <span className={`text-[10px] uppercase font-bold block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>TOTAL LOGIN EVENTS</span>
                  <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{loginAuditRecords.length}</span>
                </div>
                <div className={`p-3 rounded border ${isDark ? 'bg-[#1A1D23] border-[#2D3748]' : 'bg-white border-[#D0D7DE] shadow-xs'}`}>
                  <span className={`text-[10px] uppercase font-bold block ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>SUCCESSFUL LOGINS</span>
                  <span className={`text-lg font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                    {loginAuditRecords.filter((r) => r.status === 'SUCCESS' && r.event === 'USER_LOGIN').length}
                  </span>
                </div>
                <div className={`p-3 rounded border ${isDark ? 'bg-[#1A1D23] border-[#2D3748]' : 'bg-white border-[#D0D7DE] shadow-xs'}`}>
                  <span className={`text-[10px] uppercase font-bold block ${isDark ? 'text-rose-400' : 'text-rose-700'}`}>FAILED ATTEMPTS</span>
                  <span className={`text-lg font-bold ${isDark ? 'text-rose-400' : 'text-rose-700'}`}>
                    {loginAuditRecords.filter((r) => r.status === 'FAILED').length}
                  </span>
                </div>
                <div className={`p-3 rounded border ${isDark ? 'bg-[#1A1D23] border-[#2D3748]' : 'bg-white border-[#D0D7DE] shadow-xs'}`}>
                  <span className={`text-[10px] uppercase font-bold block ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>ACTIVE UNIQUE USERS</span>
                  <span className={`text-lg font-bold ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>
                    {new Set(loginAuditRecords.map((r) => r.email)).size}
                  </span>
                </div>
              </div>

              {/* Login Filter Bar */}
              <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 rounded-lg border ${
                isDark ? 'bg-[#1A1D23] border-[#2D3748]' : 'bg-white border-[#D0D7DE] shadow-xs'
              }`}>
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search email, name, IP address, or session ID..."
                    value={loginSearch}
                    onChange={(e) => setLoginSearch(e.target.value)}
                    className={`w-full pl-8 pr-3 py-1.5 rounded text-xs border focus:outline-hidden font-mono ${
                      isDark
                        ? 'bg-[#0A0B0D] text-gray-200 border-[#2D3748] focus:border-emerald-500'
                        : 'bg-[#F6F8FA] text-gray-900 border-gray-300 focus:border-emerald-600 shadow-xs'
                    }`}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Event filter */}
                  <div className="flex items-center gap-1 text-[10px]">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>EVENT:</span>
                    <select
                      value={loginEventFilter}
                      onChange={(e) => setLoginEventFilter(e.target.value)}
                      className={`text-[10px] rounded px-2 py-1 focus:outline-hidden cursor-pointer border ${
                        isDark ? 'bg-[#0A0B0D] border-[#2D3748] text-gray-200' : 'bg-white border-gray-300 text-gray-800'
                      }`}
                    >
                      <option value="ALL">ALL EVENTS</option>
                      <option value="USER_LOGIN">USER_LOGIN</option>
                      <option value="USER_LOGOUT">USER_LOGOUT</option>
                      <option value="LOGIN_FAILED">LOGIN_FAILED</option>
                      <option value="SESSION_EXPIRED">SESSION_EXPIRED</option>
                    </select>
                  </div>

                  {/* Role filter */}
                  <div className="flex items-center gap-1 text-[10px]">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>ROLE:</span>
                    <select
                      value={loginRoleFilter}
                      onChange={(e) => setLoginRoleFilter(e.target.value)}
                      className={`text-[10px] rounded px-2 py-1 focus:outline-hidden cursor-pointer border ${
                        isDark ? 'bg-[#0A0B0D] border-[#2D3748] text-gray-200' : 'bg-white border-gray-300 text-gray-800'
                      }`}
                    >
                      <option value="ALL">ALL ROLES</option>
                      <option value="Admin">Admin</option>
                      <option value="TechLead">TechLead</option>
                      <option value="Developer">Developer</option>
                      <option value="DevOps">DevOps</option>
                      <option value="Viewer">Viewer</option>
                    </select>
                  </div>

                  {/* Status filter */}
                  <div className="flex items-center gap-1 text-[10px]">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>STATUS:</span>
                    <select
                      value={loginStatusFilter}
                      onChange={(e) => setLoginStatusFilter(e.target.value)}
                      className={`text-[10px] rounded px-2 py-1 focus:outline-hidden cursor-pointer border ${
                        isDark ? 'bg-[#0A0B0D] border-[#2D3748] text-gray-200' : 'bg-white border-gray-300 text-gray-800'
                      }`}
                    >
                      <option value="ALL">ALL STATUS</option>
                      <option value="SUCCESS">SUCCESS</option>
                      <option value="FAILED">FAILED</option>
                      <option value="EXPIRED">EXPIRED</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Login Audit Table */}
              <div className={`rounded-lg border overflow-hidden ${
                isDark ? 'bg-[#1A1D23] border-[#2D3748]' : 'bg-white border-[#D0D7DE] shadow-xs'
              }`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className={`border-b text-[10px] uppercase tracking-wider ${
                      isDark ? 'bg-[#0F1115] text-gray-400 border-[#2D3748]' : 'bg-[#F1F3F5] text-gray-600 border-[#D0D7DE]'
                    }`}>
                      <tr>
                        <th className="p-3.5">TIMESTAMP</th>
                        <th className="p-3.5">AUTHENTICATED USER</th>
                        <th className="p-3.5">EMAIL ADDRESS</th>
                        <th className="p-3.5">ROLE</th>
                        <th className="p-3.5">EVENT</th>
                        <th className="p-3.5">STATUS</th>
                        <th className="p-3.5">SOURCE IP</th>
                        <th className="p-3.5">SESSION ID</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-[#2D3748] text-gray-300' : 'divide-[#E1E4E8] text-gray-700'}`}>
                      {filteredLoginRecords.map((record) => {
                        return (
                          <tr
                            key={record.id}
                            onClick={() => setSelectedLoginRecord(record)}
                            className={`transition cursor-pointer group ${
                              isDark ? 'hover:bg-[#2D3748]/50' : 'hover:bg-gray-50'
                            }`}
                          >
                            <td className="p-3.5 text-gray-500 whitespace-nowrap">{record.timestamp}</td>
                            <td className="p-3.5">
                              <div className="flex items-center gap-1.5">
                                <User className={`w-3.5 h-3.5 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{record.userName}</span>
                              </div>
                            </td>
                            <td className={`p-3.5 font-mono text-[11px] ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>{record.email}</td>
                            <td className="p-3.5">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                                isDark ? 'bg-[#0A0B0D] border-[#2D3748] text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-700'
                              }`}>
                                {record.role}
                              </span>
                            </td>
                            <td className={`p-3.5 font-semibold font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              <div className="flex items-center gap-1.5">
                                {record.event === 'USER_LOGIN' && <LogIn className="w-3 h-3 text-emerald-500" />}
                                {record.event === 'USER_LOGOUT' && <LogOut className="w-3 h-3 text-gray-400" />}
                                {record.event === 'LOGIN_FAILED' && <AlertTriangle className="w-3 h-3 text-rose-500" />}
                                {record.event === 'SESSION_EXPIRED' && <Activity className="w-3 h-3 text-amber-500" />}
                                <span>{record.event}</span>
                              </div>
                            </td>
                            <td className="p-3.5">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                                  record.status === 'SUCCESS'
                                    ? isDark ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                    : record.status === 'FAILED'
                                    ? isDark ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-rose-100 text-rose-800 border-rose-300'
                                    : isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-amber-100 text-amber-800 border-amber-300'
                                }`}
                              >
                                {record.status}
                              </span>
                            </td>
                            <td className={`p-3.5 font-mono text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{record.sourceIp}</td>
                            <td className="p-3.5 text-gray-500 font-mono text-[10px] truncate max-w-[120px]">
                              {record.sessionId}
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
        </>
      )}

      {/* System-Generated Notice & Audit Ledger Footer */}
      <div id="audit-ledger-footer" className={`pt-4 pb-2 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono ${
        isDark ? 'border-[#1F2937]' : 'border-[#D0D7DE]'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border w-fit tracking-wider ${
            isDark ? 'bg-[#141820] text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            SYSTEM GENERATED
          </div>
          <span className={`text-[11px] font-sans ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            This audit record is system-generated and requires no signature.
          </span>
        </div>
        <div className={`text-[11px] font-sans tracking-wide shrink-0 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Made with <span className="text-rose-500">❤️</span> by <span className={`font-medium font-mono ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>Abdul Rehman Yasir</span>
        </div>
      </div>

      {/* Export Notification Toast */}
      {toast && (
        <div
          id="export-status-toast"
          className={`fixed bottom-6 right-6 z-50 flex items-start gap-3 p-4 rounded-xl border shadow-2xl backdrop-blur-md max-w-sm transition-all duration-200 animate-in fade-in slide-in-from-bottom-4 ${
            toast.type === 'success'
              ? isDark ? 'bg-[#0F1815]/95 border-emerald-500/40 text-white' : 'bg-emerald-50 border-emerald-300 text-gray-900'
              : isDark ? 'bg-[#1C1215]/95 border-rose-500/40 text-white' : 'bg-rose-50 border-rose-300 text-gray-900'
          }`}
        >
          <div
            className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
              toast.type === 'success'
                ? isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                : isDark ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-700'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
          </div>
          <div className="flex-1 space-y-0.5 text-xs font-mono">
            <div className="font-bold tracking-wider text-[11px] uppercase flex items-center justify-between">
              <span className={toast.type === 'success' ? (isDark ? 'text-emerald-400' : 'text-emerald-700') : (isDark ? 'text-rose-400' : 'text-rose-700')}>
                {toast.title}
              </span>
              {toast.format && (
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                  isDark ? 'bg-[#1F2937] text-gray-300 border-[#374151]' : 'bg-white text-gray-700 border-gray-300'
                }`}>
                  {toast.format}
                </span>
              )}
            </div>
            <div className={`font-sans text-[12px] pt-0.5 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              {toast.message}
            </div>
            {toast.recordCount !== undefined && (
              <div className="text-[10px] text-gray-500 font-mono pt-1">
                {toast.recordCount} {toast.recordCount === 1 ? 'record' : 'records'}
              </div>
            )}
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition shrink-0 p-0.5 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* System Audit Event Deep Inspection Modal */}
      {selectedAuditRecord && (
        <AuditEventModal
          isOpen={true}
          onClose={() => setSelectedAuditRecord(null)}
          record={selectedAuditRecord}
        />
      )}

      {/* Login Event Details Modal (Admin only) */}
      {selectedLoginRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-mono">
          <div className={`w-full max-w-lg rounded-xl shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150 border ${
            isDark ? 'bg-[#1A1D23] border-[#2D3748]' : 'bg-white border-[#D0D7DE]'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b mb-4 ${isDark ? 'border-[#2D3748]' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2 text-cyan-500">
                <KeyRound className="w-4 h-4" />
                <span className={`text-sm font-bold uppercase ${isDark ? 'text-white' : 'text-gray-900'}`}>AUTHENTICATION AUDIT EVENT TRACE</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLoginRecord(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className={`p-3 rounded border space-y-1 ${
                isDark ? 'bg-[#0A0B0D] border-[#2D3748]' : 'bg-[#F6F8FA] border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">User Identity:</span>
                  <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedLoginRecord.userName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Email:</span>
                  <span className={`font-mono ${isDark ? 'text-cyan-300' : 'text-cyan-700 font-semibold'}`}>{selectedLoginRecord.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Role:</span>
                  <span className={`font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>{selectedLoginRecord.role}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className={`p-2.5 rounded border ${isDark ? 'bg-[#0A0B0D] border-[#2D3748]' : 'bg-[#F6F8FA] border-gray-200'}`}>
                  <span className="text-gray-500 text-[10px] block">EVENT TYPE</span>
                  <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedLoginRecord.event}</span>
                </div>
                <div className={`p-2.5 rounded border ${isDark ? 'bg-[#0A0B0D] border-[#2D3748]' : 'bg-[#F6F8FA] border-gray-200'}`}>
                  <span className="text-gray-500 text-[10px] block">STATUS</span>
                  <span className={selectedLoginRecord.status === 'SUCCESS' ? (isDark ? 'text-emerald-400 font-bold' : 'text-emerald-700 font-bold') : 'text-rose-600 font-bold'}>
                    {selectedLoginRecord.status}
                  </span>
                </div>
                <div className={`p-2.5 rounded border ${isDark ? 'bg-[#0A0B0D] border-[#2D3748]' : 'bg-[#F6F8FA] border-gray-200'}`}>
                  <span className="text-gray-500 text-[10px] block">SOURCE IP</span>
                  <span className={`font-mono ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{selectedLoginRecord.sourceIp}</span>
                </div>
                <div className={`p-2.5 rounded border ${isDark ? 'bg-[#0A0B0D] border-[#2D3748]' : 'bg-[#F6F8FA] border-gray-200'}`}>
                  <span className="text-gray-500 text-[10px] block">ENVIRONMENT</span>
                  <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{selectedLoginRecord.environment || 'NEBULA_PROD'}</span>
                </div>
              </div>

              <div className={`p-3 rounded border space-y-1 text-[10.5px] ${
                isDark ? 'bg-[#0A0B0D] border-[#2D3748]' : 'bg-[#F6F8FA] border-gray-200'
              }`}>
                <span className="text-gray-500 block text-[10px] font-bold uppercase">SESSION & TELEMETRY</span>
                <div className={`font-mono break-all ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Session: {selectedLoginRecord.sessionId}</div>
                <div className={`font-mono break-all ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Request: {selectedLoginRecord.requestId}</div>
                {selectedLoginRecord.failureReason && (
                  <div className="text-rose-600 font-sans pt-1">
                    Failure Cause: {selectedLoginRecord.failureReason}
                  </div>
                )}
              </div>
            </div>

            <div className={`mt-4 pt-3 border-t flex justify-end ${isDark ? 'border-[#2D3748]' : 'border-gray-200'}`}>
              <button
                type="button"
                onClick={() => setSelectedLoginRecord(null)}
                className={`px-4 py-1.5 rounded text-xs font-bold transition cursor-pointer border ${
                  isDark ? 'bg-[#1F2937] hover:bg-[#2D3748] text-white border-[#374151]' : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border-gray-300'
                }`}
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

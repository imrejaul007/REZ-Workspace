'use client';

import { useState } from 'react';
import {
  Shield,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Eye,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { Card, Badge, Button, Select, Tabs, Pagination } from '@/components/ui';
import { auditLogs } from '@/lib/mock-data';
import { formatDateTime, formatRelativeTime, cn } from '@/lib/utils';
import type { AuditLog, AuditAction, Module } from '@/types';

const actionOptions = [
  { value: '', label: 'All Actions' },
  { value: 'create', label: 'Create' },
  { value: 'read', label: 'Read' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'login', label: 'Login' },
  { value: 'logout', label: 'Logout' },
  { value: 'export', label: 'Export' },
  { value: 'approve', label: 'Approve' },
  { value: 'reject', label: 'Reject' },
];

const moduleOptions = [
  { value: '', label: 'All Modules' },
  { value: 'employees', label: 'Employees' },
  { value: 'attendance', label: 'Attendance' },
  { value: 'leave', label: 'Leave' },
  { value: 'payroll', label: 'Payroll' },
  { value: 'performance', label: 'Performance' },
  { value: 'training', label: 'Training' },
  { value: 'documents', label: 'Documents' },
  { value: 'settings', label: 'Settings' },
  { value: 'auth', label: 'Authentication' },
];

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'success', label: 'Success' },
  { value: 'failure', label: 'Failure' },
  { value: 'warning', label: 'Warning' },
];

export default function AuditPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState('7d');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter logs
  const filteredLogs = auditLogs.filter((log) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        log.details.toLowerCase().includes(query) ||
        log.user.toLowerCase().includes(query) ||
        log.resource.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }
    if (actionFilter && log.action !== actionFilter) return false;
    if (moduleFilter && log.module !== moduleFilter) return false;
    if (statusFilter && log.status !== statusFilter) return false;
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Stats
  const totalLogs = filteredLogs.length;
  const successCount = filteredLogs.filter((l) => l.status === 'success').length;
  const failureCount = filteredLogs.filter((l) => l.status === 'failure').length;
  const warningCount = filteredLogs.filter((l) => l.status === 'warning').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Audit Logs</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track all system activities and user actions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw className="h-4 w-4" />}
          >
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<Download className="h-4 w-4" />}
          >
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
              <FileText className="h-5 w-5 text-primary-500" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{totalLogs}</p>
              <p className="text-xs text-gray-500">Total Events</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-50">
              <CheckCircle2 className="h-5 w-5 text-success-500" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{successCount}</p>
              <p className="text-xs text-gray-500">Successful</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-danger-50">
              <XCircle className="h-5 w-5 text-danger-500" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{failureCount}</p>
              <p className="text-xs text-gray-500">Failed</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning-50">
              <AlertTriangle className="h-5 w-5 text-warning-500" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{warningCount}</p>
              <p className="text-xs text-gray-500">Warnings</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="!p-0">
        <div className="space-y-4 p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by user, action, or resource..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm placeholder:text-gray-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <Select
                options={actionOptions}
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-36"
              />
              <Select
                options={moduleOptions}
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                className="w-36"
              />
              <Select
                options={statusOptions}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-36"
              />
              <Select
                options={[
                  { value: '1d', label: 'Last 24 hours' },
                  { value: '7d', label: 'Last 7 days' },
                  { value: '30d', label: 'Last 30 days' },
                  { value: '90d', label: 'Last 90 days' },
                ]}
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-40"
              />
            </div>
          </div>

          {/* Active Filters */}
          {(actionFilter || moduleFilter || statusFilter) && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Active filters:</span>
              {actionFilter && (
                <Badge
                  variant="primary"
                  size="sm"
                  className="cursor-pointer"
                  onClick={() => setActionFilter('')}
                >
                  {actionFilter} &times;
                </Badge>
              )}
              {moduleFilter && (
                <Badge
                  variant="primary"
                  size="sm"
                  className="cursor-pointer"
                  onClick={() => setModuleFilter('')}
                >
                  {moduleFilter} &times;
                </Badge>
              )}
              {statusFilter && (
                <Badge
                  variant="primary"
                  size="sm"
                  className="cursor-pointer"
                  onClick={() => setStatusFilter('')}
                >
                  {statusFilter} &times;
                </Badge>
              )}
              <button
                onClick={() => {
                  setActionFilter('');
                  setModuleFilter('');
                  setStatusFilter('');
                }}
                className="text-xs text-primary-600 hover:text-primary-700"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Log List */}
        <div className="divide-y divide-gray-100">
          {paginatedLogs.length === 0 ? (
            <div className="p-8 text-center">
              <Activity className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-sm text-gray-500">No audit logs found</p>
            </div>
          ) : (
            paginatedLogs.map((log) => (
              <AuditLogItem
                key={log.id}
                log={log}
                expanded={expandedLog === log.id}
                onToggle={() =>
                  setExpandedLog(expandedLog === log.id ? null : log.id)
                }
              />
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-gray-100 p-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </Card>
    </div>
  );
}

// Audit Log Item Component
function AuditLogItem({
  log,
  expanded,
  onToggle,
}: {
  log: AuditLog;
  expanded: boolean;
  onToggle: () => void;
}) {
  const actionIcons: Record<AuditAction, React.ReactNode> = {
    create: <CheckCircle2 className="h-4 w-4 text-success-500" />,
    read: <Eye className="h-4 w-4 text-primary-500" />,
    update: <Activity className="h-4 w-4 text-primary-500" />,
    delete: <XCircle className="h-4 w-4 text-danger-500" />,
    login: <User className="h-4 w-4 text-gray-500" />,
    logout: <User className="h-4 w-4 text-gray-500" />,
    export: <Download className="h-4 w-4 text-warning-500" />,
    import: <Download className="h-4 w-4 text-primary-500" />,
    approve: <CheckCircle2 className="h-4 w-4 text-success-500" />,
    reject: <XCircle className="h-4 w-4 text-danger-500" />,
    submit: <CheckCircle2 className="h-4 w-4 text-primary-500" />,
  };

  const actionColors: Record<AuditAction, string> = {
    create: 'bg-success-50 text-success-700 border-success-200',
    read: 'bg-primary-50 text-primary-700 border-primary-200',
    update: 'bg-primary-50 text-primary-700 border-primary-200',
    delete: 'bg-danger-50 text-danger-700 border-danger-200',
    login: 'bg-gray-50 text-gray-700 border-gray-200',
    logout: 'bg-gray-50 text-gray-700 border-gray-200',
    export: 'bg-warning-50 text-warning-700 border-warning-200',
    import: 'bg-primary-50 text-primary-700 border-primary-200',
    approve: 'bg-success-50 text-success-700 border-success-200',
    reject: 'bg-danger-50 text-danger-700 border-danger-200',
    submit: 'bg-primary-50 text-primary-700 border-primary-200',
  };

  const statusIcons = {
    success: <CheckCircle2 className="h-4 w-4 text-success-500" />,
    failure: <XCircle className="h-4 w-4 text-danger-500" />,
    warning: <AlertTriangle className="h-4 w-4 text-warning-500" />,
  };

  const moduleColors: Record<string, string> = {
    employees: 'bg-blue-100 text-blue-700',
    attendance: 'bg-green-100 text-green-700',
    leave: 'bg-yellow-100 text-yellow-700',
    payroll: 'bg-purple-100 text-purple-700',
    performance: 'bg-pink-100 text-pink-700',
    training: 'bg-indigo-100 text-indigo-700',
    documents: 'bg-orange-100 text-orange-700',
    settings: 'bg-gray-100 text-gray-700',
    auth: 'bg-red-100 text-red-700',
  };

  return (
    <div className="transition-colors hover:bg-gray-50">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <div className="flex items-start gap-4">
          {/* Action Badge */}
          <div
            className={cn(
              'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium capitalize',
              actionColors[log.action]
            )}
          >
            {actionIcons[log.action]}
            {log.action}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">{log.details}</p>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {log.user}
              </span>
              <span className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                {log.module}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatRelativeTime(log.timestamp)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Status */}
          <div className="flex items-center gap-2">
            {statusIcons[log.status]}
            <Badge
              variant={
                log.status === 'success'
                  ? 'success'
                  : log.status === 'failure'
                    ? 'danger'
                    : 'warning'
              }
              size="sm"
            >
              {log.status}
            </Badge>
          </div>

          {/* Expand Icon */}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 p-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <p className="text-xs font-medium text-gray-500">Timestamp</p>
              <p className="mt-0.5 text-sm text-gray-900">
                {formatDateTime(log.timestamp)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">User ID</p>
              <p className="mt-0.5 text-sm text-gray-900">{log.userId}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Resource</p>
              <p className="mt-0.5 text-sm text-gray-900">
                {log.resource}
                {log.resourceId && ` (${log.resourceId})`}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">IP Address</p>
              <p className="mt-0.5 text-sm text-gray-900">
                {log.ipAddress || 'N/A'}
              </p>
            </div>
          </div>
          {log.userAgent && (
            <div className="mt-4">
              <p className="text-xs font-medium text-gray-500">User Agent</p>
              <p className="mt-0.5 text-sm text-gray-900">{log.userAgent}</p>
            </div>
          )}
          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-gray-500">Metadata</p>
              <pre className="mt-1 overflow-x-auto rounded-lg bg-white p-3 text-xs">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

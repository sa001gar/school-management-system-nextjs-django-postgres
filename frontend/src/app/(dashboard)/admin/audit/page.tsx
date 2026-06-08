'use client';

import { useState, useMemo } from 'react';
import { useAuditLogs } from '@/hooks/use-audit-logs';
import type { AuditLog } from '@/hooks/use-audit-logs';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { EmptyState } from '@/components/ui/empty-state';
import { Shield, Download, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

const AUDIT_ACTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'login', label: 'Login' },
  { value: 'logout', label: 'Logout' },
  { value: 'view', label: 'View' },
  { value: 'export', label: 'Export' },
  { value: 'import', label: 'Import' },
  { value: 'approve', label: 'Approve' },
  { value: 'reject', label: 'Reject' },
  { value: 'archive', label: 'Archive' },
  { value: 'restore', label: 'Restore' },
  { value: 'publish', label: 'Publish' },
  { value: 'unpublish', label: 'Unpublish' },
  { value: 'assign', label: 'Assign' },
  { value: 'unassign', label: 'Unassign' },
  { value: 'bulk_create', label: 'Bulk Create' },
  { value: 'bulk_update', label: 'Bulk Update' },
  { value: 'bulk_delete', label: 'Bulk Delete' },
  { value: 'change_password', label: 'Change Password' },
  { value: 'reset_password', label: 'Reset Password' },
  { value: 'generate_report', label: 'Generate Report' },
];

const ENTITY_TYPES = [
  { value: '', label: 'All Entities' },
  { value: 'student', label: 'Student' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'class', label: 'Class' },
  { value: 'session', label: 'Session' },
  { value: 'subject', label: 'Subject' },
  { value: 'assessment', label: 'Assessment' },
  { value: 'grade', label: 'Grade' },
  { value: 'enrollment', label: 'Enrollment' },
  { value: 'publication', label: 'Publication' },
  { value: 'assignment', label: 'Assignment' },
];

const ACTION_BADGE_VARIANT: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'danger' | 'info'> = {
  create: 'success',
  update: 'info',
  delete: 'danger',
  login: 'default',
  logout: 'secondary',
  view: 'secondary',
  export: 'info',
  import: 'info',
  approve: 'success',
  reject: 'danger',
  archive: 'warning',
  restore: 'success',
  publish: 'success',
  unpublish: 'warning',
  assign: 'default',
  unassign: 'warning',
  bulk_create: 'success',
  bulk_update: 'info',
  bulk_delete: 'danger',
  change_password: 'warning',
  reset_password: 'warning',
  generate_report: 'default',
};

function formatActionBadge(action: string) {
  const variant = ACTION_BADGE_VARIANT[action] || 'secondary';
  return <Badge variant={variant}>{action.replace(/_/g, ' ')}</Badge>;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function truncate(str: string, len = 60) {
  return str.length > len ? str.slice(0, len) + '...' : str;
}

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown>>({});
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const filters = useMemo(
    () => ({
      ...appliedFilters,
      page,
    }),
    [appliedFilters, page]
  );

  const { data, isLoading } = useAuditLogs(filters);

  const results = data?.results || [];
  const totalCount = data?.count || 0;
  const pageSize = 20;
  const totalPages = Math.ceil(totalCount / pageSize);

  const handleApplyFilters = () => {
    setPage(1);
    const f: Record<string, unknown> = {};
    if (actionFilter) f.action = actionFilter;
    if (entityFilter) f.model_name = entityFilter;
    if (dateFrom) f.timestamp_after = dateFrom;
    if (dateTo) f.timestamp_before = dateTo;
    if (searchUser) f.user = searchUser;
    setAppliedFilters(f);
  };

  const handleExport = () => {
    const headers = ['Timestamp', 'User', 'Action', 'Entity Type', 'Entity ID', 'Details', 'IP Address'];
    const rows = results.map((log) => [
      formatDate(log.timestamp),
      log.user,
      log.action,
      log.model_name,
      log.object_id,
      JSON.stringify(log.changes || {}),
      log.ip_address || '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getDetailJson = (log: AuditLog) => {
    const obj: Record<string, unknown> = {
      id: log.id,
      user: log.user,
      action: log.action,
      entity_type: log.model_name,
      entity_id: log.object_id,
    };
    if (log.changes) obj.changes = log.changes;
    if (log.ip_address) obj.ip_address = log.ip_address;
    if (log.timestamp) obj.timestamp = log.timestamp;
    return obj;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Track all system activity and changes"
        actions={
          <Button variant="outline" onClick={handleExport} disabled={results.length === 0}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        }
      />

      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <Select
            label="Action"
            options={AUDIT_ACTIONS}
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-44"
          />
          <Select
            label="Entity Type"
            options={ENTITY_TYPES}
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="w-44"
          />
          <Input
            label="From"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-44"
          />
          <Input
            label="To"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-44"
          />
          <Input
            label="Search User"
            placeholder="Email or name..."
            value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)}
            className="w-52"
          />
          <Button onClick={handleApplyFilters}>Apply Filters</Button>
        </div>
      </div>

      {isLoading ? (
        <Loading message="Loading audit logs..." />
      ) : results.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="No audit logs found"
          description={Object.keys(appliedFilters).length > 0 ? 'Try adjusting your filters' : 'No activity recorded yet'}
        />
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48">Timestamp</TableHead>
                  <TableHead className="w-44">User</TableHead>
                  <TableHead className="w-32">Action</TableHead>
                  <TableHead className="w-32">Entity Type</TableHead>
                  <TableHead className="w-32">Entity ID</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((log) => (
                  <TableRow
                    key={log.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedLog(log)}
                  >
                    <TableCell className="text-sm text-gray-600">{formatDate(log.timestamp)}</TableCell>
                    <TableCell className="text-sm font-medium">{log.user}</TableCell>
                    <TableCell>{formatActionBadge(log.action)}</TableCell>
                    <TableCell className="text-sm">{log.model_name}</TableCell>
                    <TableCell className="text-sm font-mono text-gray-500">{log.object_id}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {log.changes ? truncate(JSON.stringify(log.changes)) : '-'}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon-sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, totalCount)} of {totalCount}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Audit Log Details"
        size="lg"
      >
        {selectedLog && (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(selectedLog.timestamp as string)}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">User</label>
                <p className="mt-1 text-sm text-gray-900">{selectedLog.user as string}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Action</label>
                <div className="mt-1">{formatActionBadge(selectedLog.action as string)}</div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Entity</label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedLog.model_name as string}
                  <span className="ml-2 font-mono text-gray-500">#{selectedLog.object_id as string}</span>
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</label>
                <p className="mt-1 text-sm text-gray-900 font-mono">{(selectedLog.ip_address as string) || 'N/A'}</p>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Full Details</label>
              <pre className="mt-2 p-4 bg-gray-50 rounded-lg text-xs text-gray-800 overflow-auto max-h-64 font-mono whitespace-pre-wrap">
                {JSON.stringify(getDetailJson(selectedLog), null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

import { useQuery } from '@tanstack/react-query';
import { auditLogsApi } from '@/lib/api/audit-logs';
import type { AuditLog } from '@/types/audit';

export type { AuditLog };

export const auditLogKeys = {
  all: ['auditLogs'] as const,
  lists: () => [...auditLogKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...auditLogKeys.lists(), filters] as const,
};

export function useAuditLogs(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: auditLogKeys.list(filters),
    queryFn: () => auditLogsApi.getAll(filters),
    staleTime: 30 * 1000,
  });
}

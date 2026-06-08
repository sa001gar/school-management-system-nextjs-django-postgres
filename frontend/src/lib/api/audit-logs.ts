import api from './client';
import type { PaginatedResponse } from '@/types';

interface AuditLog {
  id: string;
  user: string;
  action: string;
  model_name: string;
  object_id: string;
  changes?: Record<string, unknown>;
  ip_address?: string;
  timestamp: string;
}

export const auditLogsApi = {
  getAll: async (filters?: Record<string, unknown>): Promise<PaginatedResponse<AuditLog>> => {
    return api.get<PaginatedResponse<AuditLog>>('/audit-logs/', filters);
  },
};

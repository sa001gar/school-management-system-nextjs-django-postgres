export interface AuditLog {
  id: string;
  user: string;
  action: string;
  model_name: string;
  object_id: string;
  changes?: Record<string, unknown>;
  ip_address?: string;
  timestamp: string;
}

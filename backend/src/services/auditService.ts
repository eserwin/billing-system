import AuditLog from '../models/AuditLog';
import { PaginationParams, PaginatedResult } from '../types/common';
import { buildPaginatedResult, getOffset } from '../utils/pagination';

export interface CreateAuditLogDTO {
  user_id?: string | null;
  action: string;
  target_type: string;
  target_id?: string | null;
  previous_values?: object | null;
  new_values?: object | null;
  ip_address?: string | null;
}

export async function recordAuditLog(data: CreateAuditLogDTO): Promise<AuditLog> {
  return AuditLog.create({
    user_id: data.user_id ?? null,
    action: data.action,
    target_type: data.target_type,
    target_id: data.target_id ?? null,
    previous_values: data.previous_values ?? null,
    new_values: data.new_values ?? null,
    ip_address: data.ip_address ?? null,
  });
}

export async function getActivityLogs(
  userId: string,
  pagination: PaginationParams
): Promise<PaginatedResult<AuditLog>> {
  const offset = getOffset(pagination);

  const { rows, count } = await AuditLog.findAndCountAll({
    where: { user_id: userId },
    order: [[pagination.sort_by || 'created_at', pagination.sort_order || 'DESC']],
    limit: pagination.limit,
    offset,
  });

  return buildPaginatedResult(rows, count, pagination);
}

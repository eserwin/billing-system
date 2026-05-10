import { PaginationParams, PaginatedResult } from '../types/common';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export function parsePaginationParams(query: Record<string, string | undefined>): PaginationParams {
  const page = Math.max(1, parseInt(query.page || '', 10) || DEFAULT_PAGE);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit || '', 10) || DEFAULT_LIMIT));
  const sort_by = query.sort_by || 'created_at';
  const sort_order = query.sort_order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  return { page, limit, sort_by, sort_order };
}

export function buildPaginatedResult<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResult<T> {
  return {
    data,
    meta: {
      total,
      page: params.page,
      limit: params.limit,
      total_pages: Math.ceil(total / params.limit),
    },
  };
}

export function getOffset(params: PaginationParams): number {
  return (params.page - 1) * params.limit;
}

import { Op, WhereOptions } from 'sequelize';
import InternetPlan from '../models/InternetPlan';
import { PaginationParams, PaginatedResult } from '../types/common';
import { buildPaginatedResult, getOffset } from '../utils/pagination';
import { CreatePlanDTO, UpdatePlanDTO } from '../validators/planSchema';
import { NotFoundError } from '../middlewares/errorHandler';

export interface PlanFilters {
  is_active?: string;
  search?: string;
}

export async function createPlan(data: CreatePlanDTO): Promise<InternetPlan> {
  const plan = await InternetPlan.create({
    name: data.name,
    speed: data.speed,
    monthly_fee: data.monthly_fee,
    installation_fee: data.installation_fee ?? 0,
  });

  return plan;
}

export async function updatePlan(id: string, data: UpdatePlanDTO): Promise<InternetPlan> {
  const plan = await InternetPlan.findByPk(id);

  if (!plan) {
    throw new NotFoundError('Internet plan not found');
  }

  await plan.update(data);

  return plan.reload();
}

export async function togglePlanStatus(id: string, isActive: boolean): Promise<InternetPlan> {
  const plan = await InternetPlan.findByPk(id);

  if (!plan) {
    throw new NotFoundError('Internet plan not found');
  }

  await plan.update({ is_active: isActive });

  return plan.reload();
}

export async function findPlanById(id: string): Promise<InternetPlan> {
  const plan = await InternetPlan.findByPk(id);

  if (!plan) {
    throw new NotFoundError('Internet plan not found');
  }

  return plan;
}

export async function listPlans(
  filters: PlanFilters,
  pagination: PaginationParams
): Promise<PaginatedResult<InternetPlan>> {
  const where: WhereOptions = {};

  if (filters.is_active !== undefined) {
    (where as any).is_active = filters.is_active === 'true';
  }

  if (filters.search) {
    (where as any)[Op.or] = [
      { name: { [Op.iLike]: `%${filters.search}%` } },
      { speed: { [Op.iLike]: `%${filters.search}%` } },
    ];
  }

  const offset = getOffset(pagination);

  const { rows, count } = await InternetPlan.findAndCountAll({
    where,
    order: [[pagination.sort_by || 'created_at', pagination.sort_order || 'DESC']],
    limit: pagination.limit,
    offset,
  });

  return buildPaginatedResult(rows, count, pagination);
}

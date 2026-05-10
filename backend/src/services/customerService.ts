import { Op, WhereOptions } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import Customer from '../models/Customer';
import InternetPlan from '../models/InternetPlan';
import { PaginationParams, PaginatedResult, CustomerStatusEnum } from '../types/common';
import { buildPaginatedResult, getOffset } from '../utils/pagination';
import { CreateCustomerDTO, UpdateCustomerDTO } from '../validators/customerSchema';
import { NotFoundError } from '../middlewares/errorHandler';

export interface CustomerFilters {
  status?: string;
  service_area?: string;
  plan_id?: string;
  search?: string;
}

function generateAccountNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = uuidv4().replace(/-/g, '').slice(0, 6).toUpperCase();
  return `ISP-${timestamp}-${random}`;
}

export async function createCustomer(data: CreateCustomerDTO): Promise<Customer> {
  const account_number = generateAccountNumber();

  const customer = await Customer.create({
    account_number,
    full_name: data.full_name,
    address: data.address,
    mobile_number: data.mobile_number,
    email: data.email ?? null,
    installation_address: data.installation_address,
    service_area: data.service_area,
    plan_id: data.plan_id,
    installation_date: data.installation_date,
    status: CustomerStatusEnum.ACTIVE,
  });

  return customer.reload({ include: [{ model: InternetPlan, as: 'plan' }] });
}

export async function updateCustomer(id: string, data: UpdateCustomerDTO): Promise<Customer> {
  const customer = await Customer.findByPk(id);

  if (!customer) {
    throw new NotFoundError('Customer not found');
  }

  await customer.update(data);

  return customer.reload({ include: [{ model: InternetPlan, as: 'plan' }] });
}

export async function archiveCustomer(id: string): Promise<void> {
  const customer = await Customer.findByPk(id);

  if (!customer) {
    throw new NotFoundError('Customer not found');
  }

  await customer.destroy();
}

export async function restoreCustomer(id: string): Promise<Customer> {
  const customer = await Customer.findByPk(id, { paranoid: false });

  if (!customer) {
    throw new NotFoundError('Customer not found');
  }

  if (!customer.deleted_at) {
    throw new NotFoundError('Customer is not archived');
  }

  await customer.restore();

  return customer.reload({ include: [{ model: InternetPlan, as: 'plan' }] });
}

export async function findCustomerById(id: string): Promise<Customer> {
  const customer = await Customer.findByPk(id, {
    include: [{ model: InternetPlan, as: 'plan' }],
  });

  if (!customer) {
    throw new NotFoundError('Customer not found');
  }

  return customer;
}

export async function listCustomers(
  filters: CustomerFilters,
  pagination: PaginationParams
): Promise<PaginatedResult<Customer>> {
  const where: WhereOptions = {};

  if (filters.status) {
    (where as any).status = filters.status;
  }

  if (filters.service_area) {
    (where as any).service_area = filters.service_area;
  }

  if (filters.plan_id) {
    (where as any).plan_id = filters.plan_id;
  }

  if (filters.search) {
    (where as any)[Op.or] = [
      { full_name: { [Op.iLike]: `%${filters.search}%` } },
      { account_number: { [Op.iLike]: `%${filters.search}%` } },
      { mobile_number: { [Op.iLike]: `%${filters.search}%` } },
      { email: { [Op.iLike]: `%${filters.search}%` } },
    ];
  }

  const offset = getOffset(pagination);

  const { rows, count } = await Customer.findAndCountAll({
    where,
    include: [{ model: InternetPlan, as: 'plan' }],
    order: [[pagination.sort_by || 'created_at', pagination.sort_order || 'DESC']],
    limit: pagination.limit,
    offset,
  });

  return buildPaginatedResult(rows, count, pagination);
}

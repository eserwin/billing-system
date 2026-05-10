import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand,
  AdminUpdateUserAttributesCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import User from '../models/User';
import { PaginationParams, PaginatedResult, UserRole } from '../types/common';
import { buildPaginatedResult, getOffset } from '../utils/pagination';
import { NotFoundError, ConflictError } from '../middlewares/errorHandler';
import { recordAuditLog } from './auditService';

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.COGNITO_REGION || 'ap-southeast-1',
});

function getUserPoolId(): string {
  const poolId = process.env.COGNITO_USER_POOL_ID;
  if (!poolId) {
    throw new Error('COGNITO_USER_POOL_ID environment variable is not set');
  }
  return poolId;
}

export interface CreateUserDTO {
  email: string;
  full_name: string;
  role: UserRole;
}

export interface UpdateUserDTO {
  full_name?: string;
  role?: UserRole;
}

export async function createUser(data: CreateUserDTO, actorId?: string): Promise<User> {
  const existingUser = await User.findOne({ where: { email: data.email } });
  if (existingUser) {
    throw new ConflictError('A user with this email already exists');
  }

  const userPoolId = getUserPoolId();

  // Create user in Cognito
  const createCommand = new AdminCreateUserCommand({
    UserPoolId: userPoolId,
    Username: data.email,
    UserAttributes: [
      { Name: 'email', Value: data.email },
      { Name: 'email_verified', Value: 'true' },
      { Name: 'name', Value: data.full_name },
    ],
    DesiredDeliveryMediums: ['EMAIL'],
  });

  const cognitoResponse = await cognitoClient.send(createCommand);
  const cognitoSub = cognitoResponse.User?.Attributes?.find(
    (attr) => attr.Name === 'sub'
  )?.Value;

  if (!cognitoSub) {
    throw new Error('Failed to retrieve Cognito sub from created user');
  }

  // Add user to role group
  const addToGroupCommand = new AdminAddUserToGroupCommand({
    UserPoolId: userPoolId,
    Username: data.email,
    GroupName: data.role,
  });
  await cognitoClient.send(addToGroupCommand);

  // Create user record in database
  const user = await User.create({
    email: data.email,
    full_name: data.full_name,
    cognito_sub: cognitoSub,
    role: data.role,
  });

  // Record audit log
  await recordAuditLog({
    user_id: actorId ?? null,
    action: 'user.create',
    target_type: 'User',
    target_id: user.id,
    new_values: { email: data.email, full_name: data.full_name, role: data.role },
  });

  return user;
}

export async function updateUser(
  id: string,
  data: UpdateUserDTO,
  actorId?: string
): Promise<User> {
  const user = await User.findByPk(id);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  const previousValues: Record<string, unknown> = {};
  const newValues: Record<string, unknown> = {};
  const userPoolId = getUserPoolId();

  // Update full_name in Cognito if changed
  if (data.full_name && data.full_name !== user.full_name) {
    previousValues.full_name = user.full_name;
    newValues.full_name = data.full_name;

    const updateCommand = new AdminUpdateUserAttributesCommand({
      UserPoolId: userPoolId,
      Username: user.email,
      UserAttributes: [{ Name: 'name', Value: data.full_name }],
    });
    await cognitoClient.send(updateCommand);
  }

  // Update role in Cognito if changed
  if (data.role && data.role !== user.role) {
    previousValues.role = user.role;
    newValues.role = data.role;

    // Remove from old group
    const removeCommand = new AdminRemoveUserFromGroupCommand({
      UserPoolId: userPoolId,
      Username: user.email,
      GroupName: user.role,
    });
    await cognitoClient.send(removeCommand);

    // Add to new group
    const addCommand = new AdminAddUserToGroupCommand({
      UserPoolId: userPoolId,
      Username: user.email,
      GroupName: data.role,
    });
    await cognitoClient.send(addCommand);
  }

  // Update local database record
  await user.update(data);

  // Record audit log
  if (Object.keys(newValues).length > 0) {
    await recordAuditLog({
      user_id: actorId ?? null,
      action: 'user.update',
      target_type: 'User',
      target_id: user.id,
      previous_values: previousValues,
      new_values: newValues,
    });
  }

  return user.reload();
}

export async function listUsers(pagination: PaginationParams): Promise<PaginatedResult<User>> {
  const offset = getOffset(pagination);

  const { rows, count } = await User.findAndCountAll({
    order: [[pagination.sort_by || 'created_at', pagination.sort_order || 'DESC']],
    limit: pagination.limit,
    offset,
  });

  return buildPaginatedResult(rows, count, pagination);
}

export async function findUserById(id: string): Promise<User> {
  const user = await User.findByPk(id);
  if (!user) {
    throw new NotFoundError('User not found');
  }
  return user;
}

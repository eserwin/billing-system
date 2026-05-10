import SystemSetting from '../models/SystemSetting';
import MikrotikLog from '../models/MikrotikLog';
import Customer from '../models/Customer';
import AuditLog from '../models/AuditLog';
import { MikrotikAction, CustomerStatusEnum } from '../types/common';
import {
  getMikrotikConfig,
  MIKROTIK_ENABLED_KEY,
  MIKROTIK_OVERDUE_THRESHOLD_KEY,
  DEFAULT_OVERDUE_THRESHOLD_DAYS,
} from '../config/mikrotik';
import { updateStatus } from './customerStatusService';

export interface MikrotikResult {
  success: boolean;
  message: string;
  device_info?: string;
}

export interface SyncResult {
  synced: number;
  errors: string[];
}

export interface MikrotikSession {
  id: string;
  name: string;
  address: string;
  uptime: string;
  caller_id: string;
}

export interface MikrotikSettings {
  enabled: boolean;
  overdue_threshold_days: number;
  host: string;
  port: number;
}

/**
 * Check if MikroTik integration is enabled via system settings.
 */
export async function isEnabled(): Promise<boolean> {
  const setting = await SystemSetting.findOne({
    where: { key: MIKROTIK_ENABLED_KEY },
  });

  if (!setting) {
    return false;
  }

  return setting.value === 'true';
}

/**
 * Enable or disable MikroTik integration.
 * Persists the setting to the database immediately.
 */
export async function setEnabled(enabled: boolean, updatedBy?: string): Promise<void> {
  const [setting] = await SystemSetting.findOrCreate({
    where: { key: MIKROTIK_ENABLED_KEY },
    defaults: {
      key: MIKROTIK_ENABLED_KEY,
      value: String(enabled),
      description: 'Enable or disable MikroTik router integration for automated disconnect/reconnect',
      updated_by: updatedBy || null,
    },
  });

  if (setting.value !== String(enabled)) {
    await setting.update({
      value: String(enabled),
      updated_by: updatedBy || null,
    });
  }

  // Log the change
  await AuditLog.create({
    user_id: updatedBy || null,
    action: enabled ? 'MIKROTIK_ENABLED' : 'MIKROTIK_DISABLED',
    target_type: 'SystemSetting',
    target_id: setting.id,
    previous_values: { enabled: !enabled },
    new_values: { enabled },
  });
}

/**
 * Get the overdue threshold days setting.
 */
export async function getOverdueThresholdDays(): Promise<number> {
  const setting = await SystemSetting.findOne({
    where: { key: MIKROTIK_OVERDUE_THRESHOLD_KEY },
  });

  if (!setting) {
    return DEFAULT_OVERDUE_THRESHOLD_DAYS;
  }

  const parsed = parseInt(setting.value, 10);
  return isNaN(parsed) ? DEFAULT_OVERDUE_THRESHOLD_DAYS : parsed;
}

/**
 * Set the overdue threshold days setting.
 */
export async function setOverdueThresholdDays(days: number, updatedBy?: string): Promise<void> {
  await SystemSetting.findOrCreate({
    where: { key: MIKROTIK_OVERDUE_THRESHOLD_KEY },
    defaults: {
      key: MIKROTIK_OVERDUE_THRESHOLD_KEY,
      value: String(days),
      description: 'Number of overdue days before automatic MikroTik disconnect',
      updated_by: updatedBy || null,
    },
  });

  await SystemSetting.update(
    { value: String(days), updated_by: updatedBy || null },
    { where: { key: MIKROTIK_OVERDUE_THRESHOLD_KEY } }
  );
}

/**
 * Disconnect a customer from the MikroTik router.
 * Checks if MikroTik integration is enabled before executing.
 */
export async function disconnect(
  customerId: string,
  reason: string,
  triggeredBy?: string
): Promise<MikrotikResult> {
  const enabled = await isEnabled();

  if (!enabled) {
    return {
      success: false,
      message: 'MikroTik integration is disabled. Operation skipped.',
    };
  }

  const customer = await Customer.findByPk(customerId);
  if (!customer) {
    return { success: false, message: `Customer not found: ${customerId}` };
  }

  const config = getMikrotikConfig();
  const deviceInfo = `${config.host}:${config.port}`;

  try {
    // Execute RouterOS disconnect command
    await executeRouterOsDisconnect(customer.account_number, config);

    // Log the successful operation
    await MikrotikLog.create({
      customer_id: customerId,
      action: MikrotikAction.DISCONNECT,
      device_info: deviceInfo,
      success: true,
      error_message: null,
      triggered_by: triggeredBy || null,
    });

    // Update customer status to disconnected
    await updateStatus(customerId, CustomerStatusEnum.DISCONNECTED, reason, triggeredBy);

    return {
      success: true,
      message: `Customer ${customer.account_number} disconnected successfully`,
      device_info: deviceInfo,
    };
  } catch (error: any) {
    const errorMessage = error.message || 'Unknown MikroTik error';

    // Log the failed operation
    await MikrotikLog.create({
      customer_id: customerId,
      action: MikrotikAction.DISCONNECT,
      device_info: deviceInfo,
      success: false,
      error_message: errorMessage,
      triggered_by: triggeredBy || null,
    });

    return {
      success: false,
      message: `Disconnect failed: ${errorMessage}`,
      device_info: deviceInfo,
    };
  }
}

/**
 * Reconnect a customer to the MikroTik router.
 * Checks if MikroTik integration is enabled before executing.
 */
export async function reconnect(
  customerId: string,
  reason: string,
  triggeredBy?: string
): Promise<MikrotikResult> {
  const enabled = await isEnabled();

  if (!enabled) {
    return {
      success: false,
      message: 'MikroTik integration is disabled. Operation skipped.',
    };
  }

  const customer = await Customer.findByPk(customerId);
  if (!customer) {
    return { success: false, message: `Customer not found: ${customerId}` };
  }

  const config = getMikrotikConfig();
  const deviceInfo = `${config.host}:${config.port}`;

  try {
    // Execute RouterOS reconnect command
    await executeRouterOsReconnect(customer.account_number, config);

    // Log the successful operation
    await MikrotikLog.create({
      customer_id: customerId,
      action: MikrotikAction.RECONNECT,
      device_info: deviceInfo,
      success: true,
      error_message: null,
      triggered_by: triggeredBy || null,
    });

    // Update customer status to reconnected
    await updateStatus(customerId, CustomerStatusEnum.RECONNECTED, reason, triggeredBy);

    return {
      success: true,
      message: `Customer ${customer.account_number} reconnected successfully`,
      device_info: deviceInfo,
    };
  } catch (error: any) {
    const errorMessage = error.message || 'Unknown MikroTik error';

    // Log the failed operation
    await MikrotikLog.create({
      customer_id: customerId,
      action: MikrotikAction.RECONNECT,
      device_info: deviceInfo,
      success: false,
      error_message: errorMessage,
      triggered_by: triggeredBy || null,
    });

    return {
      success: false,
      message: `Reconnect failed: ${errorMessage}`,
      device_info: deviceInfo,
    };
  }
}

/**
 * Sync customer connection statuses with the MikroTik router.
 * Queries active sessions and updates customer records to reflect actual network state.
 */
export async function syncStatus(triggeredBy?: string): Promise<SyncResult> {
  const enabled = await isEnabled();

  if (!enabled) {
    return { synced: 0, errors: ['MikroTik integration is disabled'] };
  }

  const config = getMikrotikConfig();
  const deviceInfo = `${config.host}:${config.port}`;
  const errors: string[] = [];
  let synced = 0;

  try {
    const activeSessions = await executeRouterOsGetSessions(config);
    const activeAccountNumbers = new Set(activeSessions.map((s) => s.name));

    // Find all customers that should be checked (not archived)
    const customers = await Customer.findAll({
      where: {
        status: [
          CustomerStatusEnum.ACTIVE,
          CustomerStatusEnum.DISCONNECTED,
          CustomerStatusEnum.RECONNECTED,
        ],
      },
    });

    for (const customer of customers) {
      const isConnected = activeAccountNumbers.has(customer.account_number);

      if (isConnected && customer.status === CustomerStatusEnum.DISCONNECTED) {
        // Customer is connected but marked as disconnected - update to reconnected
        await updateStatus(
          customer.id,
          CustomerStatusEnum.RECONNECTED,
          'Sync: detected active session on router',
          triggeredBy
        );
        synced++;
      } else if (!isConnected && customer.status === CustomerStatusEnum.ACTIVE) {
        // Customer is not connected but marked as active - could be normal (offline)
        // Only flag if they were expected to be connected; skip for now
      }
    }

    // Log the sync operation (use first customer or a placeholder)
    if (customers.length > 0) {
      await MikrotikLog.create({
        customer_id: customers[0].id,
        action: MikrotikAction.SYNC,
        device_info: deviceInfo,
        success: true,
        error_message: null,
        triggered_by: triggeredBy || null,
      });
    }
  } catch (error: any) {
    errors.push(`Sync failed: ${error.message}`);
  }

  return { synced, errors };
}

/**
 * Get active sessions from the MikroTik router.
 */
export async function getActiveSessions(): Promise<MikrotikSession[]> {
  const enabled = await isEnabled();

  if (!enabled) {
    return [];
  }

  const config = getMikrotikConfig();

  try {
    return await executeRouterOsGetSessions(config);
  } catch (error: any) {
    console.error('Failed to get active sessions:', error.message);
    return [];
  }
}

/**
 * Get current MikroTik settings for the admin UI.
 */
export async function getSettings(): Promise<MikrotikSettings> {
  const enabled = await isEnabled();
  const thresholdDays = await getOverdueThresholdDays();
  const config = getMikrotikConfig();

  return {
    enabled,
    overdue_threshold_days: thresholdDays,
    host: config.host,
    port: config.port,
  };
}

/**
 * Update MikroTik settings.
 */
export async function updateSettings(
  settings: { enabled?: boolean; overdue_threshold_days?: number },
  updatedBy?: string
): Promise<MikrotikSettings> {
  if (settings.enabled !== undefined) {
    await setEnabled(settings.enabled, updatedBy);
  }

  if (settings.overdue_threshold_days !== undefined) {
    await setOverdueThresholdDays(settings.overdue_threshold_days, updatedBy);
  }

  return getSettings();
}

// ─── RouterOS Communication Layer ────────────────────────────────────────────
// These functions encapsulate the actual MikroTik RouterOS API calls.
// They use the routeros-client library when available, with a fallback
// that throws an error if the library is not installed.

import type { MikrotikConfig } from '../config/mikrotik';

/**
 * Execute a disconnect command on the MikroTik router.
 * Disables the PPPoE/Hotspot user or adds a firewall rule to block traffic.
 */
async function executeRouterOsDisconnect(
  accountNumber: string,
  config: MikrotikConfig
): Promise<void> {
  const RouterOSAPI = await loadRouterOsClient();
  const api = new RouterOSAPI({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    timeout: config.timeout,
  });

  try {
    await api.connect();

    // Find the PPPoE secret by name (account number)
    const secrets = await api.write('/ppp/secret/print', [
      '=.proplist=.id,name',
      `?name=${accountNumber}`,
    ]);

    if (secrets.length > 0) {
      const secretId = (secrets[0] as any)['.id'];
      // Disable the PPPoE secret
      await api.write('/ppp/secret/set', [`=.id=${secretId}`, '=disabled=yes']);

      // Also remove any active connection
      const activeConnections = await api.write('/ppp/active/print', [
        '=.proplist=.id,name',
        `?name=${accountNumber}`,
      ]);

      for (const conn of activeConnections) {
        await api.write('/ppp/active/remove', [`=.id=${(conn as any)['.id']}`]);
      }
    } else {
      throw new Error(`PPPoE secret not found for account: ${accountNumber}`);
    }
  } finally {
    await api.close();
  }
}

/**
 * Execute a reconnect command on the MikroTik router.
 * Re-enables the PPPoE/Hotspot user.
 */
async function executeRouterOsReconnect(
  accountNumber: string,
  config: MikrotikConfig
): Promise<void> {
  const RouterOSAPI = await loadRouterOsClient();
  const api = new RouterOSAPI({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    timeout: config.timeout,
  });

  try {
    await api.connect();

    // Find the PPPoE secret by name (account number)
    const secrets = await api.write('/ppp/secret/print', [
      '=.proplist=.id,name',
      `?name=${accountNumber}`,
    ]);

    if (secrets.length > 0) {
      const secretId = (secrets[0] as any)['.id'];
      // Re-enable the PPPoE secret
      await api.write('/ppp/secret/set', [`=.id=${secretId}`, '=disabled=no']);
    } else {
      throw new Error(`PPPoE secret not found for account: ${accountNumber}`);
    }
  } finally {
    await api.close();
  }
}

/**
 * Get active PPPoE/Hotspot sessions from the MikroTik router.
 */
async function executeRouterOsGetSessions(
  config: MikrotikConfig
): Promise<MikrotikSession[]> {
  const RouterOSAPI = await loadRouterOsClient();
  const api = new RouterOSAPI({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    timeout: config.timeout,
  });

  try {
    await api.connect();

    const sessions = await api.write('/ppp/active/print', [
      '=.proplist=.id,name,address,uptime,caller-id',
    ]);

    return sessions.map((session: any) => ({
      id: session['.id'] || '',
      name: session.name || '',
      address: session.address || '',
      uptime: session.uptime || '',
      caller_id: session['caller-id'] || '',
    }));
  } finally {
    await api.close();
  }
}

/**
 * Dynamically load the routeros library.
 * This allows the service to be imported even if the library is not installed,
 * failing only when an actual RouterOS operation is attempted.
 */
async function loadRouterOsClient(): Promise<typeof import('routeros').RouterOSAPI> {
  try {
    const { RouterOSAPI } = await import('routeros');
    return RouterOSAPI;
  } catch {
    throw new Error(
      'routeros library is not installed. Run: npm install routeros'
    );
  }
}

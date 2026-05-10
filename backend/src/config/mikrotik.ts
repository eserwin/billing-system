/**
 * MikroTik RouterOS connection configuration.
 * Credentials are loaded from environment variables (stored in AWS Secrets Manager in production).
 */

export interface MikrotikConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  timeout: number;
}

export function getMikrotikConfig(): MikrotikConfig {
  return {
    host: process.env.MIKROTIK_HOST || '192.168.88.1',
    port: parseInt(process.env.MIKROTIK_PORT || '8728', 10),
    user: process.env.MIKROTIK_USER || 'admin',
    password: process.env.MIKROTIK_PASSWORD || '',
    timeout: parseInt(process.env.MIKROTIK_TIMEOUT || '10000', 10),
  };
}

/** System setting key used to store the MikroTik enabled/disabled flag */
export const MIKROTIK_ENABLED_KEY = 'mikrotik_enabled';

/** System setting key for overdue threshold days before auto-disconnect */
export const MIKROTIK_OVERDUE_THRESHOLD_KEY = 'mikrotik_overdue_threshold_days';

/** Default overdue threshold in days */
export const DEFAULT_OVERDUE_THRESHOLD_DAYS = 7;

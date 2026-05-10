/**
 * Currency utilities for the ISP Billing System.
 * All monetary values are stored as integers in centavos (1 PHP = 100 centavos).
 */

/**
 * Convert pesos to centavos.
 * Example: 1000.50 PHP → 100050 centavos
 */
export function pesosToCentavos(pesos: number): number {
  return Math.round(pesos * 100);
}

/**
 * Convert centavos to pesos.
 * Example: 100050 centavos → 1000.50 PHP
 */
export function centavosToPesos(centavos: number): number {
  return centavos / 100;
}

/**
 * Format centavos as a Philippine Peso string.
 * Example: 100050 → "₱1,000.50"
 */
export function formatCurrency(centavos: number): string {
  const pesos = centavosToPesos(centavos);
  return `₱${pesos.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Validate that a value is a non-negative integer (valid centavo amount).
 */
export function isValidCentavoAmount(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

/**
 * Calculate prorated billing amount.
 *
 * Formula:
 *   daily_rate = Math.round(monthly_fee / 30)
 *   prorated_amount = daily_rate * (30 - disconnected_days)
 *
 * All amounts are in centavos (integers).
 *
 * @param monthlyFee - The full monthly fee in centavos (non-negative integer)
 * @param disconnectedDays - Number of days the customer was disconnected (0-30)
 * @returns The prorated amount in centavos
 */
export function calculateProratedAmount(monthlyFee: number, disconnectedDays: number): number {
  if (disconnectedDays <= 0) return monthlyFee;
  if (disconnectedDays >= 30) return 0;
  const dailyRate = Math.round(monthlyFee / 30);
  return dailyRate * (30 - disconnectedDays);
}

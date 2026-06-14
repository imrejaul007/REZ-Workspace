/**
 * Payroll Integration
 * Tally, Zoho, QuickBooks
 */

export async function syncPayroll(provider: string) {
  return { provider, connected: false, lastSync: null };
}

export async function generatePayslip(employeeId: string, month: string) {
  return {
    employeeId,
    month,
    basic: 50000,
    hra: 25000,
    deductions: 5000,
    net: 70000
  };
}

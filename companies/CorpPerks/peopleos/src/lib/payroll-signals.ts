/**
 * Payroll Signals to REZ Intelligence
 * Every payroll action sends data to REZ Intelligence for analytics
 */

const REZ_INTELLIGENCE = process.env.REZ_INSIGHTS_API || 'https://insights.rezapp.com/api';
const REZ_PREDICTIVE = process.env.REZ_PREDICTIVE_API || 'https://predictive.rezapp.com/api';

// Request timeout in milliseconds
const REQUEST_TIMEOUT = 10000;

// ─── Utility: Fetch with Timeout ─────────────────────────────────────────────────

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${REQUEST_TIMEOUT}ms for ${url}`);
    }
    throw error;
  }
}

// ─── Send Payroll Data to REZ Intelligence ────────────────────────────

export async function sendPayrollSignals(companyId: string, payrollData: any) {
  try {
    const response = await fetchWithTimeout(`${REZ_INTELLIGENCE}/payroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId, ...payrollData, timestamp: new Date().toISOString() }),
    });
    if (!response.ok) {
      logger.error(`[Payroll] sendPayrollSignals failed: HTTP ${response.status}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('[Payroll] sendPayrollSignals failed:', message);
  }
}

// ─── Send Compensation Data ────────────────────────────────────

export async function sendCompensationSignals(employeeId: string, data: {
  salary: number;
  increments: number[];
  bonus: number;
  stocks: number;
  benefits: string[];
}) {
  try {
    const response = await fetchWithTimeout(`${REZ_PREDICTIVE}/compensation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId, ...data }),
    });
    if (!response.ok) {
      logger.error(`[Payroll] sendCompensationSignals failed: HTTP ${response.status}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('[Payroll] sendCompensationSignals failed:', message);
  }
}

// ─── Full Employee Lifecycle Signal ────────────────────────────────

export async function sendEmployeeLifecycleSignal(employeeId: string, event: {
  type: 'hired' | 'promoted' | 'transferred' | 'exit';
  salary?: number;
  department?: string;
  role?: string;
  companyId: string;
}) {
  try {
    const [lifecycleRes, patternsRes] = await Promise.all([
      fetchWithTimeout(`${REZ_INTELLIGENCE}/employee-lifecycle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          ...event,
          timestamp: new Date().toISOString()
        }),
      }),
      fetchWithTimeout(`${REZ_PREDICTIVE}/lifecycle-patterns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, ...event }),
      }),
    ]);

    if (!lifecycleRes.ok) {
      logger.error(`[Payroll] Employee lifecycle signal failed: HTTP ${lifecycleRes.status}`);
    }
    if (!patternsRes.ok) {
      logger.error(`[Payroll] Lifecycle patterns signal failed: HTTP ${patternsRes.status}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('[Payroll] sendEmployeeLifecycleSignal failed:', message);
  }
}

// ─── Aggregate Company Analytics ──────────────────────────────

export async function syncCompanyAnalytics(companyId: string, employees: any[], payrolls: any[]) {
  const analytics = {
    companyId,
    headcount: employees.length,
    avgSalary: employees.length > 0
      ? employees.reduce((a: number, e: any) => a + (e.salary || 0), 0) / employees.length
      : 0,
    departments: Array.from(new Set(employees.map((e: any) => e.department))).filter(Boolean),
    payrollCycle: payrolls[0]?.month || null,
    lastUpdated: new Date().toISOString(),
  };

  try {
    const response = await fetchWithTimeout(`${REZ_INTELLIGENCE}/company/${companyId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(analytics),
    });
    if (!response.ok) {
      logger.error(`[Payroll] syncCompanyAnalytics failed: HTTP ${response.status}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('[Payroll] syncCompanyAnalytics failed:', message);
  }
}

// ─── Workforce Cost Analysis ────────────────────────────────

export async function getWorkforceCostAnalysis(companyId: string) {
  try {
    const response = await fetchWithTimeout(`${REZ_INTELLIGENCE}/workforce-cost/${companyId}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      logger.error(`[Payroll] getWorkforceCostAnalysis failed: HTTP ${response.status}`);
      return { error: `HTTP ${response.status}` };
    }
    return response.json();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('[Payroll] getWorkforceCostAnalysis failed:', message);
    return { error: message };
  }
}

// ─── Compensation Benchmark ────────────────────────────────

export async function getSalaryBenchmarks(role: string, location: string) {
  try {
    const response = await fetchWithTimeout(`${REZ_PREDICTIVE}/salary-benchmark?role=${role}&location=${location}`);
    if (!response.ok) {
      logger.error(`[Payroll] getSalaryBenchmarks failed: HTTP ${response.status}`);
      return { error: `HTTP ${response.status}` };
    }
    return response.json();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('[Payroll] getSalaryBenchmarks failed:', message);
    return { error: message };
  }
}

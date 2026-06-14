/**
 * REZ Merchant Integration
 * Connect PeopleOS to REZ Merchant for workforce management
 */

const MERCHANT_API = process.env.MERCHANT_API || 'https://rez-merchant-api.rezapp.com';

// Request timeout in milliseconds
const REQUEST_TIMEOUT = 10000;

export interface MerchantEmployee {
  merchantId: string;
  storeId: string;
  employees: Employee[];
}

export interface Employee {
  employeeId: string;
  name: string;
  phone: string;
  role: string;
  storeId: string;
  status: 'active' | 'inactive';
}

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

// ─── Merchant Integration ──────────────────────────────────────────

export async function getMerchantEmployees(merchantId: string): Promise<Employee[]> {
  try {
    const response = await fetchWithTimeout(`${MERCHANT_API}/merchants/${merchantId}/employees`, {
      headers: {
        'Authorization': `Bearer ${process.env.MERCHANT_TOKEN}`,
      },
    });

    if (!response.ok) {
      logger.error(`[Merchant] getMerchantEmployees failed: HTTP ${response.status}`);
      return [];
    }
    const data = await response.json();
    return data.employees || [];
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Merchant] getMerchantEmployees failed:', message);
    return [];
  }
}

export async function syncEmployee(merchantId: string, employee: Employee): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(`${MERCHANT_API}/merchants/${merchantId}/employees/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(employee),
    });
    if (!response.ok) {
      logger.error(`[Merchant] syncEmployee failed: HTTP ${response.status}`);
      return false;
    }
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Merchant] syncEmployee failed:', message);
    return false;
  }
}

export async function deactivateEmployee(merchantId: string, employeeId: string): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(
      `${MERCHANT_API}/merchants/${merchantId}/employees/${employeeId}`,
      { method: 'DELETE' }
    );
    if (!response.ok) {
      logger.error(`[Merchant] deactivateEmployee failed: HTTP ${response.status}`);
      return false;
    }
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Merchant] deactivateEmployee failed:', message);
    return false;
  }
}

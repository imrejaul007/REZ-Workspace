export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
}

export function calculateACOS(spend: number, revenue: number): number {
  if (revenue === 0) return 0;
  return (spend / revenue) * 100;
}

export function calculateCTR(clicks: number, impressions: number): number {
  if (impressions === 0) return 0;
  return (clicks / impressions) * 100;
}

export function calculateConversionRate(
  orders: number,
  clicks: number
): number {
  if (clicks === 0) return 0;
  return (orders / clicks) * 100;
}

export function paginateArray<T>(
  array: T[],
  page: number,
  limit: number
): {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
} {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const items = array.slice(startIndex, endIndex);

  return {
    items,
    total: array.length,
    page,
    limit,
    totalPages: Math.ceil(array.length / limit),
  };
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isValidObjectId(id: string): boolean {
  return /^[a-f\d]{24}$/i.test(id);
}

export function sanitizeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
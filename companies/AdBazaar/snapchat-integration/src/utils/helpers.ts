export function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}_${timestamp}_${random}`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function formatDate(date: Date): string {
  return date.toISOString();
}

export function parseDate(dateStr: string): Date {
  return new Date(dateStr);
}

export function sanitizeObject<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const sanitized: Partial<T> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null && value !== '') {
      (sanitized as Record<string, unknown>)[key] = value;
    }
  }
  return sanitized;
}

export function paginate<T>(
  items: T[],
  page: number,
  limit: number
): { items: T[]; total: number; page: number; limit: number; totalPages: number } {
  const total = items.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const end = start + limit;

  return {
    items: items.slice(start, end),
    total,
    page,
    limit,
    totalPages,
  };
}

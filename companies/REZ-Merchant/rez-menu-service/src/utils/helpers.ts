export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const generateId = (): string => {
  return crypto.randomUUID();
};

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100 * 100) / 100;
};

export const getTimeOfDay = (): 'breakfast' | 'lunch' | 'dinner' | 'late-night' => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 15) return 'lunch';
  if (hour >= 15 && hour < 22) return 'dinner';
  return 'late-night';
};

export const parseQueryInt = (value: string | string[] | undefined, defaultValue: number): number => {
  if (!value) return defaultValue;
  const parsed = parseInt(Array.isArray(value) ? value[0] : value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

export const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>]/g, '');
};

export const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

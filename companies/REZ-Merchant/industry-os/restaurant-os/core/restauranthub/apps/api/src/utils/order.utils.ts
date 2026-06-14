import crypto from 'crypto';

export async function generateOrderNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  // Generate a random 6-digit number using crypto
  const randomNumber = crypto.randomInt(100000, 999999);

  return `ORD-${year}${month}${day}-${randomNumber}`;
}
/**
 * Utility function for conditionally joining classNames
 * Simple implementation for the merchant app
 */

type ClassValue = string | number | boolean | undefined | null | ClassValue[] | Record<string, boolean | undefined | null>;

export function cn(...inputs: ClassValue[]): string {
  let result = '';

  for (const input of inputs) {
    if (!input) continue;

    if (typeof input === 'string' || typeof input === 'number') {
      result += (result ? ' ' : '') + input;
    } else if (Array.isArray(input)) {
      const joined = cn(...input);
      if (joined) {
        result += (result ? ' ' : '') + joined;
      }
    } else if (typeof input === 'object') {
      for (const [key, value] of Object.entries(input)) {
        if (value) {
          result += (result ? ' ' : '') + key;
        }
      }
    }
  }

  return result;
}

export default cn;

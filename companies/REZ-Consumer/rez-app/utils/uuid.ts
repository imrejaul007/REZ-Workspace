/**
 * UUID utility - cross-platform compatible
 * Uses crypto.getRandomValues for cryptographically secure random UUIDs
 */

// Fallback for environments without crypto
function getRandomValues(length: number): Uint8Array {
  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.getRandomValues) {
    return globalThis.crypto.getRandomValues(new Uint8Array(length));
  }
  // Fallback for older browsers/Node
  const array = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    array[i] = Math.floor(Math.random() * 256);
  }
  return array;
}

// Generate a UUID v4 using crypto.getRandomValues
export function generateUUID(): string {
  const hex = '0123456789abcdef';
  const uuid = new Array(36);

  const bytes = getRandomValues(16);

  // Set reserved bits
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10

  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      uuid[i] = '-';
    } else if (i === 14) {
      uuid[i] = '4'; // Version 4
    } else if (i === 19) {
      uuid[i] = hex[(bytes[3] >> 2) & 0x1f];
    } else {
      uuid[i] = hex[bytes[i > 19 ? i - 20 : i] & 0x0f];
    }
  }

  return uuid.join('');
}

// Alias for compatibility
export const uuidv4 = generateUUID;
export default generateUUID;

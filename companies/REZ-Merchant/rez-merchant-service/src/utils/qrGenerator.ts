import crypto from 'crypto';

/**
 * Generates HMAC-signed, base64-encoded QR payloads for karma event check-in and check-out.
 * The QR content is a signed JSON object that the karma service can verify
 * by decoding base64 and checking the HMAC signature.
 *
 * @param eventId  - The merchant event ID
 * @returns        - { checkIn, checkOut } base64-encoded QR strings
 */
function generateEventQRCodes(eventId: string): { checkIn: string; checkOut: string } {
  // QR_SECRET is required by env.ts validation (min 32 chars).
  // No fallback — if undefined, the process fails at startup before reaching here.
  const secret = process.env.QR_SECRET!;

  const checkInPayload: Record<string, unknown> = {
    eventId,
    type: 'check_in',
    ts: Date.now(),
  };
  const checkOutPayload: Record<string, unknown> = {
    eventId,
    type: 'check_out',
    ts: Date.now(),
  };

  // C7 FIX: Use full 256-bit HMAC instead of truncated 64-bit.
  // Only 16 hex chars (64 bits) were used before — far too weak for fraud-critical
  // karma event check-in/check-out which anyone with a QR code can trigger.
  const checkInSig = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(checkInPayload))
    .digest('hex');
  const checkOutSig = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(checkOutPayload))
    .digest('hex');

  checkInPayload['sig'] = checkInSig;
  checkOutPayload['sig'] = checkOutSig;

  return {
    checkIn: Buffer.from(JSON.stringify(checkInPayload)).toString('base64'),
    checkOut: Buffer.from(JSON.stringify(checkOutPayload)).toString('base64'),
  };
}

export { generateEventQRCodes };

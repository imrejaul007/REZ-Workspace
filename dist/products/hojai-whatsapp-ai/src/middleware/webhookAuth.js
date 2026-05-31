import crypto from 'crypto';
/**
 * WhatsApp webhook HMAC signature verification
 *
 * WhatsApp sends requests with X-Hub-Signature-256 header
 * Format: sha256=<signature>
 */
export function verifyWhatsAppSignature(payload, signature, secret) {
    if (!signature) {
        console.error('[Webhook Auth] No signature provided');
        return false;
    }
    const expectedSignature = 'sha256=' + crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
    // Use timing-safe comparison to prevent timing attacks
    try {
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    }
    catch {
        return false;
    }
}
/**
 * Verify webhook request
 */
export function verifyWebhookRequest(body, signature, secret) {
    const payload = JSON.stringify(body);
    return verifyWhatsAppSignature(payload, signature, secret);
}
/**
 * Generate webhook verification challenge
 */
export function verifyWebhookChallenge(mode, token, challenge, verifyToken) {
    if (mode === 'subscribe' && token === verifyToken) {
        console.log('[Webhook] Verification successful');
        return { verified: true, challenge };
    }
    console.error('[Webhook] Verification failed:', { mode, token: token ? '***' : 'missing' });
    return { verified: false };
}
/**
 * Rate limiting for webhook endpoints
 */
const webhookCalls = new Map();
export function checkWebhookRateLimit(phoneNumberId, maxCalls = 100, windowMs = 60000) {
    const now = Date.now();
    const record = webhookCalls.get(phoneNumberId);
    if (!record || now > record.resetAt) {
        webhookCalls.set(phoneNumberId, { count: 1, resetAt: now + windowMs });
        return true;
    }
    if (record.count >= maxCalls) {
        console.warn(`[Webhook] Rate limit exceeded for ${phoneNumberId}`);
        return false;
    }
    record.count++;
    return true;
}
/**
 * IP allowlist for webhook endpoints
 */
const ALLOWED_IPS = new Set([
    '悸acebook.com', // Facebook/WhatsApp IPs
    '157.240.1.53',
    '157.240.27.53',
    '157.240.16.53',
    '157.240.23.53'
]);
export function isAllowedWhatsAppIP(ip) {
    // WhatsApp uses various IPs, check if it's a known Facebook IP
    return ip.includes('facebook') || ip.includes('fb') || ALLOWED_IPS.has(ip);
}
//# sourceMappingURL=webhookAuth.js.map
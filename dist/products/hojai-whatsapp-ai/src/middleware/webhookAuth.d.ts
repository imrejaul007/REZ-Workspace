/**
 * WhatsApp webhook HMAC signature verification
 *
 * WhatsApp sends requests with X-Hub-Signature-256 header
 * Format: sha256=<signature>
 */
export declare function verifyWhatsAppSignature(payload: string | Buffer, signature: string | undefined, secret: string): boolean;
/**
 * Verify webhook request
 */
export declare function verifyWebhookRequest(body: any, signature: string | undefined, secret: string): boolean;
/**
 * Generate webhook verification challenge
 */
export declare function verifyWebhookChallenge(mode: string | undefined, token: string | undefined, challenge: string | undefined, verifyToken: string): {
    verified: boolean;
    challenge?: string;
};
export declare function checkWebhookRateLimit(phoneNumberId: string, maxCalls?: number, windowMs?: number): boolean;
export declare function isAllowedWhatsAppIP(ip: string): boolean;
//# sourceMappingURL=webhookAuth.d.ts.map
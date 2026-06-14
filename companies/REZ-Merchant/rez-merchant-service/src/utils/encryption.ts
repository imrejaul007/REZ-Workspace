import crypto from 'crypto';
import { logger } from '../config/logger';

/**
 * Field Encryption Utility
 * Encrypts sensitive fields like bank account numbers, SSN, etc.
 * Uses AES-256-GCM for authenticated encryption
 */

// Get encryption key from environment — REQUIRED, no fallback allowed.
// Validation is deferred to the first encrypt/decrypt call rather than
// throwing at module load time (which crashes the server during require()
// before any error handlers can run or log the real cause).
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY) {
    // Log loudly but do not throw — validateEnv() will hard-exit in production
    // if the key is missing; at module load time, the logger/process handlers
    // are not yet registered so a throw here produces zero log output on Render.
    logger.warn(
        '[WARN] ENCRYPTION_KEY is not set. Encrypt/decrypt calls will throw at runtime. ' +
        "Generate with: node -e \"logger.debug(require('crypto').randomBytes(32).toString('hex'))\" " +
        'and add it to your environment.',
    );
}

// Lazily derived KEY — only resolved when encrypt/decrypt are actually called
// MEDIUM FIX: Use PBKDF2 for proper key derivation from passphrase instead of direct SHA-256 hash.
// SHA-256 of a passphrase has reduced effective entropy. PBKDF2 with a salt
// provides cryptographic strength even when the input is a passphrase.
function getKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
        throw new Error(
            '[FATAL] ENCRYPTION_KEY environment variable is not set. ' +
            'This key protects sensitive PII (bank accounts, PANs). ' +
            "Generate with: node -e \"require('crypto').randomBytes(32).toString('hex')\" " +
            'and set it in your environment.',
        );
    }
    // If the key is already 64 hex chars (256 bits), treat it as raw and skip KDF.
    if (/^[a-f0-9]{64}$/i.test(key)) {
        return Buffer.from(key, 'hex');
    }
    // For passphrase-based keys, derive a proper 256-bit key using PBKDF2-SHA256.
    const salt = 'rez-merchant-encryption-v1'; // Static salt is acceptable here since the key itself is secret
    return crypto.pbkdf2Sync(key, salt, 100000, 32, 'sha256');
}

interface EncryptedData {
    encrypted: string;
    iv: string;
    authTag: string;
}

/**
 * Encrypt sensitive data
 * @param text - Plain text to encrypt
 * @returns Encrypted data with IV and auth tag
 */
export function encrypt(text: string): string {
    if (!text) return '';

    try {
        // Generate random initialization vector
        const iv = crypto.randomBytes(16);

        // Create cipher with AES-256-GCM
        const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);

        // Encrypt the data
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        // Get auth tag for authenticated encryption
        const authTag = cipher.getAuthTag();

        // Return encrypted data with IV and auth tag
        const encryptedData: EncryptedData = {
            encrypted,
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex'),
        };

        return JSON.stringify(encryptedData);
    } catch (error) {
        logger.error('Encryption error:', { error: error instanceof Error ? error.message : String(error) });
        throw new Error('Failed to encrypt data');
    }
}

/**
 * Decrypt sensitive data
 * @param encryptedString - Encrypted data string
 * @returns Decrypted plain text
 */
export function decrypt(encryptedString: string): string {
    if (!encryptedString) return '';

    try {
        // Parse encrypted data
        const encryptedData: EncryptedData = JSON.parse(encryptedString);

        // Convert hex strings back to buffers
        const iv = Buffer.from(encryptedData.iv, 'hex');
        const authTag = Buffer.from(encryptedData.authTag, 'hex');
        const encrypted = encryptedData.encrypted;

        // Create decipher
        const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), iv);
        decipher.setAuthTag(authTag);

        // Decrypt the data
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        logger.error('Decryption error:', { error: error instanceof Error ? error.message : String(error) });
        throw new Error('Failed to decrypt data');
    }
}

/**
 * Hash sensitive data (one-way)
 * Used for data that doesn't need to be retrieved (like verification codes)
 * @param text - Text to hash
 * @returns Hashed string
 */
export function hash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Generate secure random token
 * @param length - Length of token in bytes (default 32)
 * @returns Random token in hex format
 */
export function generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
}

/**
 * Mask sensitive data for logging/display
 * Shows only first and last few characters
 * @param text - Text to mask
 * @param visibleChars - Number of visible characters at start/end (default 4)
 * @returns Masked string
 */
export function maskSensitiveData(text: string, visibleChars: number = 4): string {
    if (!text || text.length <= visibleChars * 2) {
        return '***';
    }

    const start = text.substring(0, visibleChars);
    const end = text.substring(text.length - visibleChars);
    const maskedLength = text.length - visibleChars * 2;
    const mask = '*'.repeat(Math.min(maskedLength, 10));

    return `${start}${mask}${end}`;
}

/**
 * Encrypt bank account number
 * Special handling for bank account numbers
 */
export function encryptBankAccount(accountNumber: string): string {
    // Remove any spaces or dashes
    const cleaned = accountNumber.replace(/[\s-]/g, '');
    return encrypt(cleaned);
}

/**
 * Decrypt bank account number
 */
export function decryptBankAccount(encryptedAccount: string): string {
    return decrypt(encryptedAccount);
}

/**
 * Encrypt PAN/Tax ID
 */
export function encryptTaxId(taxId: string): string {
    const cleaned = taxId.replace(/[\s-]/g, '').toUpperCase();
    return encrypt(cleaned);
}

/**
 * Decrypt PAN/Tax ID
 */
export function decryptTaxId(encryptedTaxId: string): string {
    return decrypt(encryptedTaxId);
}

/**
 * Compare encrypted value with plain text
 * @param plainText - Plain text to compare
 * @param encryptedString - Encrypted string
 * @returns True if values match
 */
export function compareEncrypted(plainText: string, encryptedString: string): boolean {
    try {
        const decrypted = decrypt(encryptedString);
        return plainText === decrypted;
    } catch (_error) {
        return false;
    }
}

/**
 * Encrypt object fields
 * Encrypts specified fields in an object
 * @param obj - Object to encrypt
 * @param fieldsToEncrypt - Array of field names to encrypt
 * @returns Object with encrypted fields
 * SECURITY FIX (MA-BACK-AUDIT-007): Replaced `unknown` with proper generic type.
 */
export function encryptObjectFields<T extends Record<string, unknown>>(
    obj: T,
    fieldsToEncrypt: string[]
): T {
    const encrypted = { ...obj };

    fieldsToEncrypt.forEach((field) => {
        if (field in encrypted && encrypted[field] && typeof encrypted[field] === 'string') {
            (encrypted as Record<string, unknown>)[field] = encrypt(encrypted[field] as string);
        }
    });

    return encrypted;
}

/**
 * Decrypt object fields
 * Decrypts specified fields in an object
 * @param obj - Object to decrypt
 * @param fieldsToDecrypt - Array of field names to decrypt
 * @returns Object with decrypted fields
 * SECURITY FIX (MA-BACK-AUDIT-007): Replaced `unknown` with proper generic type.
 */
export function decryptObjectFields<T extends Record<string, unknown>>(
    obj: T,
    fieldsToDecrypt: string[]
): T {
    const decrypted = { ...obj };

    fieldsToDecrypt.forEach((field) => {
        if (field in decrypted && decrypted[field] && typeof decrypted[field] === 'string') {
            try {
                (decrypted as Record<string, unknown>)[field] = decrypt(decrypted[field] as string);
            } catch (_error) {
                // If decryption fails, field might not be encrypted
                logger.warn(`Failed to decrypt field: ${field}`);
            }
        }
    });

    return decrypted;
}

export default {
    encrypt,
    decrypt,
    hash,
    generateSecureToken,
    maskSensitiveData,
    encryptBankAccount,
    decryptBankAccount,
    encryptTaxId,
    decryptTaxId,
    compareEncrypted,
    encryptObjectFields,
    decryptObjectFields,
};

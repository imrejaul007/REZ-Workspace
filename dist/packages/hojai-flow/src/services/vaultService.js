/**
 * Hojai Flow - Vault Service
 *
 * Personal encrypted storage for user data:
 * - AES-256 encryption
 * - Biometric unlock
 * - Per-user keys
 * - Client-side encryption
 */
import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';
const DEFAULT_CONFIG = {
    algorithm: 'aes-256-gcm',
    keyDerivation: 'sha256',
    iterations: 100000,
    biometricEnabled: true,
    passphraseEnabled: true,
};
export class VaultService {
    config;
    vaults;
    keys;
    constructor(config) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.vaults = new Map();
        this.keys = new Map();
    }
    /**
     * Create a new vault for a user
     */
    async createVault(userId, passphrase) {
        const salt = randomBytes(32);
        const masterKey = this.deriveKey(passphrase, salt);
        const vault = {
            userId,
            masterKeyHash: this.hashKey(masterKey),
            encryptedMasterKey: undefined,
            items: new Map(),
            createdAt: new Date(),
            lastAccessed: new Date(),
        };
        this.vaults.set(userId, vault);
        this.keys.set(userId, masterKey);
        return { vaultId: userId, salt: salt.toString('hex') };
    }
    /**
     * Unlock vault with passphrase
     */
    async unlockVault(userId, passphrase) {
        const vault = this.vaults.get(userId);
        if (!vault)
            return false;
        const salt = randomBytes(32); // In production, retrieve stored salt
        const masterKey = this.deriveKey(passphrase, salt);
        const keyHash = this.hashKey(masterKey);
        if (keyHash === vault.masterKeyHash) {
            this.keys.set(userId, masterKey);
            vault.lastAccessed = new Date();
            return true;
        }
        return false;
    }
    /**
     * Unlock vault with biometric
     */
    async unlockWithBiometric(userId, biometricData) {
        const vault = this.vaults.get(userId);
        if (!vault)
            return false;
        // In production, verify biometric against stored template
        // Simplified: just check if vault exists
        if (vault) {
            // Retrieve stored master key encrypted with biometric
            const masterKey = randomBytes(32); // Would be decrypted
            this.keys.set(userId, masterKey);
            vault.lastAccessed = new Date();
            return true;
        }
        return false;
    }
    /**
     * Lock vault (clear keys from memory)
     */
    lockVault(userId) {
        this.keys.delete(userId);
        const vault = this.vaults.get(userId);
        if (vault) {
            vault.lastAccessed = new Date();
        }
    }
    /**
     * Store encrypted data
     */
    async store(userId, type, data, options = {}) {
        const vault = this.vaults.get(userId);
        if (!vault)
            throw new Error('Vault not found');
        const key = this.keys.get(userId);
        if (!key)
            throw new Error('Vault is locked');
        const iv = randomBytes(16);
        const cipher = createCipheriv(this.config.algorithm, key, iv);
        const encrypted = Buffer.concat([
            cipher.update(JSON.stringify(data), 'utf8'),
            cipher.final(),
        ]);
        const authTag = cipher.getAuthTag();
        const item = {
            id: options.id || randomBytes(16).toString('hex'),
            type,
            encryptedData: Buffer.concat([encrypted, authTag]).toString('base64'),
            iv: iv.toString('hex'),
            tags: options.tags || [],
            createdAt: new Date(),
            updatedAt: new Date(),
            accessCount: 0,
        };
        vault.items.set(item.id, item);
        return item;
    }
    /**
     * Retrieve and decrypt data
     */
    async retrieve(userId, itemId) {
        const vault = this.vaults.get(userId);
        if (!vault)
            throw new Error('Vault not found');
        const key = this.keys.get(userId);
        if (!key)
            throw new Error('Vault is locked');
        const item = vault.items.get(itemId);
        if (!item)
            return null;
        const iv = Buffer.from(item.iv, 'hex');
        const encryptedBuffer = Buffer.from(item.encryptedData, 'base64');
        // Split auth tag from encrypted data
        const authTag = encryptedBuffer.slice(-16);
        const encrypted = encryptedBuffer.slice(0, -16);
        const decipher = createDecipheriv(this.config.algorithm, key, iv);
        decipher.setAuthTag(authTag);
        const decrypted = Buffer.concat([
            decipher.update(encrypted),
            decipher.final(),
        ]).toString('utf8');
        // Update access stats
        item.accessCount++;
        item.lastAccessed = new Date();
        return JSON.parse(decrypted);
    }
    /**
     * List vault items (metadata only, not encrypted data)
     */
    listItems(userId, filter) {
        const vault = this.vaults.get(userId);
        if (!vault)
            return [];
        let items = Array.from(vault.items.values());
        if (filter?.type) {
            items = items.filter((item) => item.type === filter.type);
        }
        if (filter?.tags) {
            items = items.filter((item) => filter.tags.some((tag) => item.tags.includes(tag)));
        }
        return items;
    }
    /**
     * Delete item from vault
     */
    async delete(userId, itemId) {
        const vault = this.vaults.get(userId);
        if (!vault)
            return false;
        return vault.items.delete(itemId);
    }
    /**
     * Update item in vault
     */
    async update(userId, itemId, data, options) {
        await this.delete(userId, itemId);
        return this.store(userId, this.vaults.get(userId)?.items.get(itemId)?.type || 'unknown', data, {
            id: itemId,
            tags: options?.tags,
        });
    }
    /**
     * Search vault items by tags
     */
    search(userId, query) {
        const vault = this.vaults.get(userId);
        if (!vault)
            return [];
        const lowerQuery = query.toLowerCase();
        return Array.from(vault.items.values()).filter((item) => item.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
            item.type.toLowerCase().includes(lowerQuery));
    }
    /**
     * Export vault (encrypted backup)
     */
    async export(userId) {
        const vault = this.vaults.get(userId);
        if (!vault)
            throw new Error('Vault not found');
        const key = this.keys.get(userId);
        if (!key)
            throw new Error('Vault is locked');
        const iv = randomBytes(16);
        const cipher = createCipheriv(this.config.algorithm, key, iv);
        const vaultData = {
            userId: vault.userId,
            items: Array.from(vault.items.entries()),
            createdAt: vault.createdAt,
        };
        const encrypted = Buffer.concat([
            cipher.update(JSON.stringify(vaultData), 'utf8'),
            cipher.final(),
        ]);
        const authTag = cipher.getAuthTag();
        return JSON.stringify({
            version: 1,
            iv: iv.toString('hex'),
            data: Buffer.concat([encrypted, authTag]).toString('base64'),
        });
    }
    /**
     * Import vault from backup
     */
    async import(userId, backup, passphrase) {
        const backupData = JSON.parse(backup);
        const salt = randomBytes(32); // In production, derive from passphrase
        const key = this.deriveKey(passphrase, salt);
        const iv = Buffer.from(backupData.iv, 'hex');
        const encryptedBuffer = Buffer.from(backupData.data, 'base64');
        const authTag = encryptedBuffer.slice(-16);
        const encrypted = encryptedBuffer.slice(0, -16);
        const decipher = createDecipheriv(this.config.algorithm, key, iv);
        decipher.setAuthTag(authTag);
        const decrypted = JSON.parse(Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8'));
        const vault = {
            userId: decrypted.userId,
            masterKeyHash: this.hashKey(key),
            items: new Map(decrypted.items),
            createdAt: new Date(decrypted.createdAt),
            lastAccessed: new Date(),
        };
        this.vaults.set(userId, vault);
        this.keys.set(userId, key);
    }
    /**
     * Derive encryption key from passphrase
     */
    deriveKey(passphrase, salt) {
        const hash = createHash(this.config.keyDerivation);
        for (let i = 0; i < this.config.iterations; i++) {
            hash.update(i === 0 ? passphrase : '');
            hash.update(salt);
        }
        return hash.digest();
    }
    /**
     * Hash key for verification
     */
    hashKey(key) {
        return createHash('sha256').update(key).digest('hex');
    }
    /**
     * Get vault statistics
     */
    getStats(userId) {
        const vault = this.vaults.get(userId);
        if (!vault)
            return null;
        const types = {};
        let totalAccesses = 0;
        for (const item of vault.items.values()) {
            types[item.type] = (types[item.type] || 0) + 1;
            totalAccesses += item.accessCount;
        }
        return {
            itemCount: vault.items.size,
            totalAccesses,
            lastAccessed: vault.lastAccessed,
            types,
        };
    }
}
// Singleton export
export const vaultService = new VaultService();
export default vaultService;
//# sourceMappingURL=vaultService.js.map
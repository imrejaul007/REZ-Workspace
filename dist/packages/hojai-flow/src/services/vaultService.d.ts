/**
 * Hojai Flow - Vault Service
 *
 * Personal encrypted storage for user data:
 * - AES-256 encryption
 * - Biometric unlock
 * - Per-user keys
 * - Client-side encryption
 */
export interface VaultItem {
    id: string;
    type: string;
    encryptedData: string;
    iv: string;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    accessCount: number;
    lastAccessed?: Date;
}
export interface VaultConfig {
    algorithm: string;
    keyDerivation: string;
    iterations: number;
    biometricEnabled: boolean;
    passphraseEnabled: boolean;
}
export interface UserVault {
    userId: string;
    masterKeyHash: string;
    encryptedMasterKey?: string;
    publicKey?: string;
    items: Map<string, VaultItem>;
    createdAt: Date;
    lastAccessed: Date;
}
export declare class VaultService {
    private config;
    private vaults;
    private keys;
    constructor(config?: Partial<VaultConfig>);
    /**
     * Create a new vault for a user
     */
    createVault(userId: string, passphrase: string): Promise<{
        vaultId: string;
        salt: string;
    }>;
    /**
     * Unlock vault with passphrase
     */
    unlockVault(userId: string, passphrase: string): Promise<boolean>;
    /**
     * Unlock vault with biometric
     */
    unlockWithBiometric(userId: string, biometricData: Buffer): Promise<boolean>;
    /**
     * Lock vault (clear keys from memory)
     */
    lockVault(userId: string): void;
    /**
     * Store encrypted data
     */
    store(userId: string, type: string, data: unknown, options?: {
        tags?: string[];
        id?: string;
    }): Promise<VaultItem>;
    /**
     * Retrieve and decrypt data
     */
    retrieve<T = unknown>(userId: string, itemId: string): Promise<T | null>;
    /**
     * List vault items (metadata only, not encrypted data)
     */
    listItems(userId: string, filter?: {
        type?: string;
        tags?: string[];
    }): VaultItem[];
    /**
     * Delete item from vault
     */
    delete(userId: string, itemId: string): Promise<boolean>;
    /**
     * Update item in vault
     */
    update(userId: string, itemId: string, data: unknown, options?: {
        tags?: string[];
    }): Promise<VaultItem | null>;
    /**
     * Search vault items by tags
     */
    search(userId: string, query: string): VaultItem[];
    /**
     * Export vault (encrypted backup)
     */
    export(userId: string): Promise<string>;
    /**
     * Import vault from backup
     */
    import(userId: string, backup: string, passphrase: string): Promise<void>;
    /**
     * Derive encryption key from passphrase
     */
    private deriveKey;
    /**
     * Hash key for verification
     */
    private hashKey;
    /**
     * Get vault statistics
     */
    getStats(userId: string): {
        itemCount: number;
        totalAccesses: number;
        lastAccessed: Date | null;
        types: Record<string, number>;
    } | null;
}
export declare const vaultService: VaultService;
export default vaultService;
//# sourceMappingURL=vaultService.d.ts.map
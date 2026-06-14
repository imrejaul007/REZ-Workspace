import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

export interface SecretMetadata {
  id: string;
  name: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  tags: Record<string, string>;
  encrypted: boolean;
}

export interface SecretEntry {
  metadata: SecretMetadata;
  encryptedValue: string;
  keyVersion: number;
  checksum: string;
}

export interface VaultConfig {
  masterKey: Buffer;
  storageAdapter: StorageAdapter;
  keyRotationDays: number;
  maxVersions: number;
}

export interface StorageAdapter {
  save(key: string, value: string): Promise<void>;
  load(key: string): Promise<string | null>;
  delete(key: string): Promise<void>;
  list(prefix: string): Promise<string[]>;
}

export class SecretVault {
  private readonly ALGORITHM = 'aes-256-gcm';
  private readonly IV_LENGTH = 16;
  private readonly AUTH_TAG_LENGTH = 16;
  private readonly SALT_LENGTH = 32;

  private config: VaultConfig;
  private keyDerivationCache: Map<number, Buffer> = new Map();

  constructor(config: VaultConfig) {
    this.config = config;
  }

  async storeSecret(
    name: string,
    value: string,
    options: {
      tags?: Record<string, string>;
      expiresAt?: Date;
    } = {}
  ): Promise<SecretMetadata> {
    const existingEntry = await this.config.storageAdapter.load(`secret:${name}`);
    const currentVersion = existingEntry
      ? this.getEntryMetadata(existingEntry).version + 1
      : 1;

    const { encryptedValue, keyVersion, checksum } = await this.encryptSecret(
      value,
      currentVersion
    );

    const entry: SecretEntry = {
      metadata: {
        id: uuidv4(),
        name,
        version: currentVersion,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: options.expiresAt,
        tags: options.tags || {},
        encrypted: true,
      },
      encryptedValue,
      keyVersion,
      checksum,
    };

    await this.config.storageAdapter.save(
      `secret:${name}`,
      JSON.stringify(entry)
    );

    await this.config.storageAdapter.save(
      `secret:${name}:v${currentVersion}`,
      JSON.stringify(entry)
    );

    await this.pruneOldVersions(name);

    return entry.metadata;
  }

  async retrieveSecret(
    name: string,
    version?: number
  ): Promise<{ metadata: SecretMetadata; value: string } | null> {
    const key = version
      ? `secret:${name}:v${version}`
      : `secret:${name}`;

    const rawEntry = await this.config.storageAdapter.load(key);
    if (!rawEntry) return null;

    const entry: SecretEntry = JSON.parse(rawEntry);

    if (entry.metadata.expiresAt && new Date(entry.metadata.expiresAt) < new Date()) {
      await this.config.storageAdapter.delete(key);
      return null;
    }

    const decryptedValue = await this.decryptSecret(
      entry.encryptedValue,
      entry.keyVersion,
      entry.checksum
    );

    return {
      metadata: entry.metadata,
      value: decryptedValue,
    };
  }

  async deleteSecret(name: string, soft = true): Promise<boolean> {
    if (soft) {
      const entry = await this.config.storageAdapter.load(`secret:${name}`);
      if (entry) {
        const parsed: SecretEntry = JSON.parse(entry);
        parsed.metadata.expiresAt = new Date();
        await this.config.storageAdapter.save(
          `secret:${name}`,
          JSON.stringify(parsed)
        );
        return true;
      }
      return false;
    }

    const keys = await this.config.storageAdapter.list(`secret:${name}`);
    await Promise.all(keys.map((k) => this.config.storageAdapter.delete(k)));
    return keys.length > 0;
  }

  async listSecrets(filter?: {
    tags?: Record<string, string>;
    prefix?: string;
  }): Promise<SecretMetadata[]> {
    const allKeys = await this.config.storageAdapter.list('secret:');
    const metadataList: SecretMetadata[] = [];

    for (const key of allKeys) {
      if (key.includes(':v')) continue;

      const raw = await this.config.storageAdapter.load(key);
      if (!raw) continue;

      const entry: SecretEntry = JSON.parse(raw);
      const meta = entry.metadata;

      if (filter?.prefix && !meta.name.startsWith(filter.prefix)) continue;

      if (filter?.tags) {
        const hasAllTags = Object.entries(filter.tags).every(
          ([k, v]) => meta.tags[k] === v
        );
        if (!hasAllTags) continue;
      }

      if (meta.expiresAt && new Date(meta.expiresAt) < new Date()) continue;

      metadataList.push(meta);
    }

    return metadataList;
  }

  private async encryptSecret(
    value: string,
    version: number
  ): Promise<{ encryptedValue: string; keyVersion: number; checksum: string }> {
    const derivedKey = await this.deriveKey(version);
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipheriv(this.ALGORITHM, derivedKey, iv);

    const encrypted = Buffer.concat([
      cipher.update(value, 'utf8'),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    const checksum = crypto
      .createHash('sha256')
      .update(value)
      .digest('hex');

    const payload = Buffer.concat([iv, authTag, encrypted]);

    return {
      encryptedValue: payload.toString('base64'),
      keyVersion: version,
      checksum,
    };
  }

  private async decryptSecret(
    encryptedValue: string,
    keyVersion: number,
    expectedChecksum: string
  ): Promise<string> {
    const derivedKey = await this.deriveKey(keyVersion);
    const payload = Buffer.from(encryptedValue, 'base64');

    const iv = payload.subarray(0, this.IV_LENGTH);
    const authTag = payload.subarray(
      this.IV_LENGTH,
      this.IV_LENGTH + this.AUTH_TAG_LENGTH
    );
    const encrypted = payload.subarray(this.IV_LENGTH + this.AUTH_TAG_LENGTH);

    const decipher = crypto.createDecipheriv(this.ALGORITHM, derivedKey, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString('utf8');

    const checksum = crypto
      .createHash('sha256')
      .update(decrypted)
      .digest('hex');

    if (checksum !== expectedChecksum) {
      throw new Error('Secret integrity check failed');
    }

    return decrypted;
  }

  private async deriveKey(version: number): Promise<Buffer> {
    if (this.keyDerivationCache.has(version)) {
      return this.keyDerivationCache.get(version)!;
    }

    const salt = crypto
      .createHash('sha256')
      .update(`vault-key-v${version}`)
      .digest();

    const derivedKey = crypto.pbkdf2Sync(
      this.config.masterKey,
      salt,
      100000,
      32,
      'sha512'
    );

    this.keyDerivationCache.set(version, derivedKey);
    return derivedKey;
  }

  private getEntryMetadata(raw: string): SecretMetadata {
    return JSON.parse(raw).metadata;
  }

  private async pruneOldVersions(name: string): Promise<void> {
    const allKeys = await this.config.storageAdapter.list(`secret:${name}:v`);

    if (allKeys.length <= this.config.maxVersions) return;

    const versions = allKeys
      .map((k) => {
        const match = k.match(/v(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .sort((a, b) => b - a);

    const toDelete = versions.slice(this.config.maxVersions);

    await Promise.all(
      toDelete.map((v) =>
        this.config.storageAdapter.delete(`secret:${name}:v${v}`)
      )
    );
  }

  async rotateKeys(): Promise<number> {
    this.keyDerivationCache.clear();
    return Date.now();
  }
}

export class InMemoryStorageAdapter implements StorageAdapter {
  private store: Map<string, string> = new Map();

  async save(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async load(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async list(prefix: string): Promise<string[]> {
    return Array.from(this.store.keys()).filter((k) => k.startsWith(prefix));
  }
}

import logger from './utils/logger';

import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { KeyManager } from '../keys/key-management';
import { SecretVault, SecretMetadata, InMemoryStorageAdapter } from '../vault/vault';

export interface SecretData {
  id: string;
  name: string;
  value: string;
  metadata: SecretMetadata;
  accessControl: AccessControl;
  encryptedValue?: string;
}

export interface AccessControl {
  allowedPrincipals: string[];
  denyPrincipals: string[];
  requiredPermissions: Permission[];
  ipWhitelist?: string[];
  timeRestrictions?: TimeWindow[];
}

export type Permission = 'read' | 'write' | 'delete' | 'admin' | 'rotate';

export interface TimeWindow {
  startHour: number;
  endHour: number;
  daysOfWeek: number[];
  timezone: string;
}

export interface SecretVersion {
  version: number;
  createdAt: Date;
  createdBy: string;
  checksum: string;
  value: string;
}

export interface StorageBackend {
  save(key: string, value: string): Promise<void>;
  load(key: string): Promise<string | null>;
  delete(key: string): Promise<void>;
  list(prefix: string): Promise<string[]>;
}

export interface SecretStoreConfig {
  keyManager: KeyManager;
  storageBackend: StorageBackend;
  maxVersions: number;
  defaultTTL?: number;
  enableCompression: boolean;
}

export class SecretStorage {
  private vault: SecretVault;
  private config: SecretStoreConfig;
  private accessLog: Map<string, AccessLogEntry> = new Map();

  constructor(config: SecretStoreConfig) {
    const masterKey = crypto.randomBytes(32);
    this.config = config;

    this.vault = new SecretVault({
      masterKey,
      storageAdapter: config.storageBackend as StorageBackend,
      keyRotationDays: 90,
      maxVersions: config.maxVersions,
    });
  }

  async createSecret(
    name: string,
    value: string,
    options: {
      tags?: Record<string, string>;
      expiresAt?: Date;
      accessControl?: Partial<AccessControl>;
      createdBy?: string;
    } = {}
  ): Promise<SecretData> {
    const id = uuidv4();

    const { encryptedValue, keyVersion } = await this.encryptSecret(value);

    const accessControl: AccessControl = {
      allowedPrincipals: options.accessControl?.allowedPrincipals || [],
      denyPrincipals: options.accessControl?.denyPrincipals || [],
      requiredPermissions: options.accessControl?.requiredPermissions || ['read'],
      ipWhitelist: options.accessControl?.ipWhitelist,
      timeRestrictions: options.accessControl?.timeRestrictions,
    };

    const metadata = await this.vault.storeSecret(name, value, {
      tags: { ...options.tags, id, createdBy: options.createdBy || 'system' },
      expiresAt: options.expiresAt,
    });

    const secretData: SecretData = {
      id,
      name,
      value,
      metadata,
      accessControl,
      encryptedValue,
    };

    await this.config.storageBackend.save(
      `secret-data:${id}`,
      JSON.stringify(secretData)
    );

    return secretData;
  }

  async getSecret(
    name: string,
    requester: {
      principal: string;
      permissions: Permission[];
      ip?: string;
      timestamp?: Date;
    },
    version?: number
  ): Promise<string | null> {
    const result = await this.vault.retrieveSecret(name, version);
    if (!result) return null;

    const secretKey = `secret:${name}`;
    const rawData = await this.config.storageBackend.load(`secret-data:${result.metadata.tags.id}`);

    if (rawData) {
      const secretData: SecretData = JSON.parse(rawData);
      this.checkAccess(secretData.accessControl, requester);
    }

    this.logAccess(result.metadata.id, requester.principal, 'read');

    return result.value;
  }

  async updateSecret(
    name: string,
    newValue: string,
    updater: {
      principal: string;
      permissions: Permission[];
      ip?: string;
    }
  ): Promise<SecretMetadata> {
    const existing = await this.vault.retrieveSecret(name);
    if (!existing) {
      throw new Error(`Secret ${name} not found`);
    }

    const rawData = await this.config.storageBackend.load(
      `secret-data:${existing.metadata.tags.id}`
    );

    if (rawData) {
      const secretData: SecretData = JSON.parse(rawData);
      this.checkAccess(secretData.accessControl, updater);
    }

    const metadata = await this.vault.storeSecret(name, newValue, {
      tags: { ...existing.metadata.tags, updatedBy: updater.principal },
    });

    this.logAccess(existing.metadata.tags.id, updater.principal, 'write');

    return metadata;
  }

  async deleteSecret(
    name: string,
    deleter: {
      principal: string;
      permissions: Permission[];
    }
  ): Promise<boolean> {
    const existing = await this.vault.retrieveSecret(name);
    if (!existing) return false;

    const rawData = await this.config.storageBackend.load(
      `secret-data:${existing.metadata.tags.id}`
    );

    if (rawData) {
      const secretData: SecretData = JSON.parse(rawData);
      this.checkAccess(secretData.accessControl, deleter);
    }

    const result = await this.vault.deleteSecret(name, false);

    if (result) {
      await this.config.storageBackend.delete(
        `secret-data:${existing.metadata.tags.id}`
      );
      this.logAccess(existing.metadata.tags.id, deleter.principal, 'delete');
    }

    return result;
  }

  async listSecrets(filter?: {
    tags?: Record<string, string>;
    prefix?: string;
    principal?: string;
  }): Promise<SecretMetadata[]> {
    return this.vault.listSecrets(filter);
  }

  async getVersions(name: string): Promise<SecretVersion[]> {
    const versions: SecretVersion[] = [];
    const keys = await this.config.storageBackend.list(`secret:${name}:v`);

    for (const key of keys) {
      const raw = await this.config.storageBackend.load(key);
      if (raw) {
        const entry = JSON.parse(raw);
        versions.push({
          version: entry.metadata.version,
          createdAt: new Date(entry.metadata.createdAt),
          createdBy: entry.metadata.tags.createdBy || 'unknown',
          checksum: entry.checksum,
          value: '',
        });
      }
    }

    return versions.sort((a, b) => b.version - a.version);
  }

  async restoreVersion(
    name: string,
    version: number,
    restorer: {
      principal: string;
      permissions: Permission[];
    }
  ): Promise<SecretMetadata> {
    const result = await this.vault.retrieveSecret(name, version);
    if (!result) {
      throw new Error(`Version ${version} of secret ${name} not found`);
    }

    return this.updateSecret(name, result.value, restorer);
  }

  async updateAccessControl(
    name: string,
    newAccessControl: AccessControl,
    updater: {
      principal: string;
      permissions: Permission[];
    }
  ): Promise<void> {
    const existing = await this.vault.retrieveSecret(name);
    if (!existing) {
      throw new Error(`Secret ${name} not found`);
    }

    if (!updater.permissions.includes('admin')) {
      throw new Error('Admin permission required to update access control');
    }

    const rawData = await this.config.storageBackend.load(
      `secret-data:${existing.metadata.tags.id}`
    );

    if (rawData) {
      const secretData: SecretData = JSON.parse(rawData);
      secretData.accessControl = newAccessControl;
      await this.config.storageBackend.save(
        `secret-data:${secretData.id}`,
        JSON.stringify(secretData)
      );
    }
  }

  async checkSecretHealth(): Promise<{
    totalSecrets: number;
    healthySecrets: number;
    expiredSecrets: number;
    accessIssues: number;
  }> {
    const secrets = await this.vault.listSecrets();
    let expiredCount = 0;
    let accessIssueCount = 0;

    const now = new Date();

    for (const secret of secrets) {
      if (secret.expiresAt && new Date(secret.expiresAt) < now) {
        expiredCount++;
      }

      const rawData = await this.config.storageBackend.load(
        `secret-data:${secret.tags.id}`
      );

      if (rawData) {
        const secretData: SecretData = JSON.parse(rawData);
        if (
          secretData.accessControl.allowedPrincipals.length === 0 &&
          secretData.accessControl.denyPrincipals.length === 0
        ) {
          accessIssueCount++;
        }
      }
    }

    return {
      totalSecrets: secrets.length,
      healthySecrets: secrets.length - expiredCount,
      expiredSecrets: expiredCount,
      accessIssues: accessIssueCount,
    };
  }

  private async encryptSecret(value: string): Promise<{
    encryptedValue: string;
    keyVersion: number;
  }> {
    const keyManager = this.config.keyManager;
    const result = await keyManager.encrypt(value);
    return {
      encryptedValue: JSON.stringify(result),
      keyVersion: 1,
    };
  }

  private checkAccess(
    accessControl: AccessControl,
    requester: { principal: string; permissions: Permission[]; ip?: string; timestamp?: Date }
  ): void {
    if (accessControl.denyPrincipals.includes(requester.principal)) {
      throw new Error(`Access denied for principal ${requester.principal}`);
    }

    if (
      accessControl.allowedPrincipals.length > 0 &&
      !accessControl.allowedPrincipals.includes(requester.principal)
    ) {
      throw new Error(`Principal ${requester.principal} not authorized`);
    }

    if (requester.ip && accessControl.ipWhitelist?.length) {
      if (!accessControl.ipWhitelist.includes(requester.ip)) {
        throw new Error(`IP ${requester.ip} not in whitelist`);
      }
    }

    if (requester.timestamp && accessControl.timeRestrictions?.length) {
      const hour = requester.timestamp.getHours();
      const day = requester.timestamp.getDay();

      for (const window of accessControl.timeRestrictions) {
        if (
          window.daysOfWeek.includes(day) &&
          hour >= window.startHour &&
          hour < window.endHour
        ) {
          return;
        }
      }
      throw new Error('Access outside allowed time window');
    }
  }

  private logAccess(
    secretId: string,
    principal: string,
    action: string
  ): void {
    const entry: AccessLogEntry = {
      secretId,
      principal,
      action,
      timestamp: new Date(),
    };
    this.accessLog.set(`${secretId}:${Date.now()}`, entry);
  }
}

interface AccessLogEntry {
  secretId: string;
  principal: string;
  action: string;
  timestamp: Date;
}

export class RedisStorageAdapter implements StorageBackend {
  private client;
  private prefix: string;

  constructor(redisUrl: string, prefix = 'rez:secrets:') {
    this.prefix = prefix;
  }

  async connect(): Promise<void> {
    try {
      const Redis = (await import('ioredis')).default;
      this.client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    } catch (error) {
      logger.error('Redis connection failed, using in-memory fallback');
      this.client = null;
    }
  }

  async save(key: string, value: string): Promise<void> {
    if (this.client) {
      await this.client.set(`${this.prefix}${key}`, value);
    } else {
      InMemoryStorageAdapter.prototype.store?.set(key, value);
    }
  }

  async load(key: string): Promise<string | null> {
    if (this.client) {
      return this.client.get(`${this.prefix}${key}`);
    }
    return InMemoryStorageAdapter.prototype.store?.get(key) ?? null;
  }

  async delete(key: string): Promise<void> {
    if (this.client) {
      await this.client.del(`${this.prefix}${key}`);
    } else {
      InMemoryStorageAdapter.prototype.store?.delete(key);
    }
  }

  async list(prefix: string): Promise<string[]> {
    if (this.client) {
      const keys = await this.client.keys(`${this.prefix}${prefix}*`);
      return keys.map((k: string) => k.replace(this.prefix, ''));
    }
    return Array.from(
      InMemoryStorageAdapter.prototype.store?.keys() || []
    ).filter((k: string) => k.startsWith(prefix));
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
    }
  }
}

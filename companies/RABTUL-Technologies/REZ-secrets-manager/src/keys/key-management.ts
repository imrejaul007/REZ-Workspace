import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

export interface KeyInfo {
  id: string;
  version: number;
  algorithm: string;
  createdAt: Date;
  status: 'active' | 'rotated' | 'compromised' | 'retired';
  publicKey?: string;
  encryptedPrivateKey?: string;
  keyMaterial?: Buffer;
  rotatedAt?: Date;
}

export interface KeyRotationPolicy {
  maxAgeDays: number;
  maxUsageCount: number;
  autoRotate: boolean;
  rotationWindowHours: number;
}

export interface KeyMetadata {
  keys: Map<string, KeyInfo>;
  currentVersion: number;
  masterKeyHash: string;
}

export class KeyManager {
  private readonly ALGORITHM = 'aes-256-gcm';
  private readonly RSA_ALGORITHM = 'rsa4096';
  private readonly KEY_SIZE = 4096;

  private metadata: KeyMetadata;
  private masterPassword: string;
  private readonly policy: KeyRotationPolicy;
  private usageCounts: Map<number, number> = new Map();

  constructor(masterPassword: string, policy?: Partial<KeyRotationPolicy>) {
    this.masterPassword = masterPassword;
    this.policy = {
      maxAgeDays: 90,
      maxUsageCount: 1000000,
      autoRotate: true,
      rotationWindowHours: 24,
      ...policy,
    };

    this.metadata = this.initializeMetadata();
  }

  private initializeMetadata(): KeyMetadata {
    const masterKeyHash = crypto
      .createHash('sha256')
      .update(this.masterPassword)
      .digest('hex');

    return {
      keys: new Map(),
      currentVersion: 0,
      masterKeyHash,
    };
  }

  async generateKey(options: {
    type: 'symmetric' | 'asymmetric';
    purpose?: 'encryption' | 'signing';
  }): Promise<KeyInfo> {
    const keyId = uuidv4();
    const version = ++this.metadata.currentVersion;

    let keyInfo: KeyInfo;

    if (options.type === 'symmetric') {
      const keyMaterial = crypto.randomBytes(32);
      const { encrypted, iv, authTag } = await this.encryptWithMasterKey(
        keyMaterial
      );

      keyInfo = {
        id: keyId,
        version,
        algorithm: this.ALGORITHM,
        createdAt: new Date(),
        status: 'active',
        keyMaterial: Buffer.concat([iv, authTag, encrypted]),
      };
    } else {
      const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: this.KEY_SIZE,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem',
          cipher: this.ALGORITHM,
          passphrase: this.masterPassword,
        },
      });

      keyInfo = {
        id: keyId,
        version,
        algorithm: this.RSA_ALGORITHM,
        createdAt: new Date(),
        status: 'active',
        publicKey,
        encryptedPrivateKey: privateKey,
      };
    }

    this.metadata.keys.set(keyId, keyInfo);
    return keyInfo;
  }

  async getActiveKey(type: 'symmetric' | 'asymmetric'): Promise<KeyInfo | null> {
    const now = new Date();
    const maxAge = this.policy.maxAgeDays * 24 * 60 * 60 * 1000;

    for (const [id, key] of this.metadata.keys) {
      if (key.status !== 'active') continue;

      const age = now.getTime() - new Date(key.createdAt).getTime();
      if (age > maxAge && this.policy.autoRotate) {
        await this.rotateKey(id);
        continue;
      }

      const usageCount = this.usageCounts.get(key.version) || 0;
      if (usageCount >= this.policy.maxUsageCount) {
        await this.rotateKey(id);
        continue;
      }

      return key;
    }

    return this.generateKey({ type, purpose: 'encryption' });
  }

  async rotateKey(keyId: string): Promise<KeyInfo> {
    const existingKey = this.metadata.keys.get(keyId);
    if (!existingKey) {
      throw new Error(`Key ${keyId} not found`);
    }

    existingKey.status = 'rotated';
    existingKey.rotatedAt = new Date();
    this.metadata.keys.set(keyId, existingKey);

    return this.generateKey({
      type: existingKey.publicKey ? 'asymmetric' : 'symmetric',
      purpose: existingKey.algorithm.includes('signing') ? 'signing' : 'encryption',
    });
  }

  async markKeyCompromised(keyId: string): Promise<void> {
    const key = this.metadata.keys.get(keyId);
    if (key) {
      key.status = 'compromised';
      this.metadata.keys.set(keyId, key);
    }
  }

  async retireKey(keyId: string): Promise<void> {
    const key = this.metadata.keys.get(keyId);
    if (key) {
      key.status = 'retired';
      this.metadata.keys.set(keyId, key);
    }
  }

  async encrypt(plaintext: string, keyId?: string): Promise<{
    ciphertext: string;
    keyId: string;
    iv: string;
    authTag: string;
  }> {
    const key = keyId
      ? this.metadata.keys.get(keyId)
      : await this.getActiveKey('symmetric');

    if (!key || !key.keyMaterial) {
      throw new Error('No suitable encryption key found');
    }

    const keyMaterial = this.extractKeyMaterial(key.keyMaterial);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.ALGORITHM, keyMaterial, iv);

    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    this.usageCounts.set(key.version, (this.usageCounts.get(key.version) || 0) + 1);

    return {
      ciphertext: encrypted.toString('base64'),
      keyId: key.id,
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
    };
  }

  async decrypt(
    ciphertext: string,
    keyId: string,
    iv: string,
    authTag: string
  ): Promise<string> {
    const key = this.metadata.keys.get(keyId);
    if (!key || !key.keyMaterial) {
      throw new Error(`Key ${keyId} not found or invalid`);
    }

    if (key.status !== 'active' && key.status !== 'rotated') {
      throw new Error(`Key ${keyId} is not available for decryption`);
    }

    const keyMaterial = this.extractKeyMaterial(key.keyMaterial);
    const decipher = crypto.createDecipheriv(
      this.ALGORITHM,
      keyMaterial,
      Buffer.from(iv, 'base64')
    );
    decipher.setAuthTag(Buffer.from(authTag, 'base64'));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(ciphertext, 'base64')),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }

  async sign(data: string, keyId?: string): Promise<{
    signature: string;
    keyId: string;
    algorithm: string;
  }> {
    const key = keyId
      ? this.metadata.keys.get(keyId)
      : await this.getActiveKey('asymmetric');

    if (!key || !key.encryptedPrivateKey) {
      throw new Error('No suitable signing key found');
    }

    const sign = crypto.createSign('SHA256');
    sign.update(data);
    sign.end();

    const signature = sign.sign(
      {
        key: key.encryptedPrivateKey,
        passphrase: this.masterPassword,
      },
      'base64'
    );

    this.usageCounts.set(key.version, (this.usageCounts.get(key.version) || 0) + 1);

    return {
      signature,
      keyId: key.id,
      algorithm: 'RSA-SHA256',
    };
  }

  async verify(
    data: string,
    signature: string,
    keyId: string
  ): Promise<boolean> {
    const key = this.metadata.keys.get(keyId);
    if (!key || !key.publicKey) {
      return false;
    }

    const verify = crypto.createVerify('SHA256');
    verify.update(data);
    verify.end();

    return verify.verify(key.publicKey, signature, 'base64');
  }

  listKeys(filter?: {
    status?: KeyInfo['status'];
    algorithm?: string;
  }): KeyInfo[] {
    let keys = Array.from(this.metadata.keys.values());

    if (filter?.status) {
      keys = keys.filter((k) => k.status === filter.status);
    }
    if (filter?.algorithm) {
      keys = keys.filter((k) => k.algorithm === filter.algorithm);
    }

    return keys.sort((a, b) => b.version - a.version);
  }

  getKeyInfo(keyId: string): KeyInfo | undefined {
    return this.metadata.keys.get(keyId);
  }

  getKeyUsageCount(keyId: string): number {
    const key = this.metadata.keys.get(keyId);
    return key ? this.usageCounts.get(key.version) || 0 : 0;
  }

  getRotationStatus(): {
    needsRotation: boolean;
    keysNeedingRotation: string[];
    oldestKey: Date | null;
    averageKeyAge: number;
  } {
    const now = new Date();
    const maxAge = this.policy.maxAgeDays * 24 * 60 * 60 * 1000;
    const keysNeedingRotation: string[] = [];
    let oldestKey: Date | null = null;
    let totalAge = 0;

    for (const [id, key] of this.metadata.keys) {
      if (key.status !== 'active') continue;

      const age = now.getTime() - new Date(key.createdAt).getTime();
      totalAge += age;

      if (age > maxAge) {
        keysNeedingRotation.push(id);
      }

      if (!oldestKey || new Date(key.createdAt) < oldestKey) {
        oldestKey = new Date(key.createdAt);
      }
    }

    return {
      needsRotation: keysNeedingRotation.length > 0,
      keysNeedingRotation,
      oldestKey,
      averageKeyAge:
        this.metadata.keys.size > 0 ? totalAge / this.metadata.keys.size : 0,
    };
  }

  exportMetadata(): string {
    return JSON.stringify({
      currentVersion: this.metadata.currentVersion,
      keyCount: this.metadata.keys.size,
      masterKeyHash: this.metadata.masterKeyHash,
      policy: this.policy,
    });
  }

  private async encryptWithMasterKey(data: Buffer): Promise<{
    encrypted: Buffer;
    iv: Buffer;
    authTag: Buffer;
  }> {
    const derivedKey = crypto.pbkdf2Sync(
      this.masterPassword,
      'salt',
      100000,
      32,
      'sha512'
    );

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.ALGORITHM, derivedKey, iv);

    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return { encrypted, iv, authTag };
  }

  private extractKeyMaterial(keyMaterial: Buffer): Buffer {
    if (keyMaterial.length === 64) {
      return keyMaterial;
    }

    const iv = keyMaterial.subarray(0, 16);
    const authTag = keyMaterial.subarray(16, 32);
    const encrypted = keyMaterial.subarray(32);

    const derivedKey = crypto.pbkdf2Sync(
      this.masterPassword,
      'salt',
      100000,
      32,
      'sha512'
    );

    const decipher = crypto.createDecipheriv(this.ALGORITHM, derivedKey, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
  }
}

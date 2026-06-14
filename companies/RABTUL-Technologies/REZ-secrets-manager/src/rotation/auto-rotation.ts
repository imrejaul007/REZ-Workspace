import logger from './utils/logger';

import * as crypto from 'crypto';
import { KeyManager, KeyInfo } from '../keys/key-management';
import { SecretVault } from '../vault/vault';
import { SecretStorage } from '../secrets/secret-storage';

export interface RotationConfig {
  enabled: boolean;
  schedule: string;
  maxKeyAgeDays: number;
  maxKeyUsage: number;
  notifyOnRotation: boolean;
  preRotationSteps: PreRotationStep[];
  postRotationSteps: PostRotationStep[];
  gracePeriodHours: number;
  maxParallelRotations: number;
}

export type PreRotationStep =
  | 'validate-key-health'
  | 'check-dependent-services'
  | 'backup-current-key'
  | 'notify-stakeholders';

export type PostRotationStep =
  | 'update-key-metadata'
  | 'verify-decryption'
  | 'propagate-to-replicas'
  | 'notify-stakeholders'
  | 'invalidate-caches';

export interface RotationEvent {
  id: string;
  secretName: string;
  keyId: string;
  previousKeyVersion: number;
  newKeyVersion: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'rolled_back';
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  steps: RotationStep[];
}

export interface RotationStep {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  output?: string;
}

export interface RotationPolicy {
  name: string;
  secrets: string[];
  schedule: string;
  maxAgeDays: number;
  maxUsage: number;
  enabled: boolean;
}

export class AutoRotation {
  private config: RotationConfig;
  private keyManager: KeyManager;
  private secretStorage: SecretStorage;
  private rotationQueue: RotationEvent[] = [];
  private rotationHistory: RotationEvent[] = [];
  private activeRotations: Map<string, RotationEvent> = new Map();
  private policies: Map<string, RotationPolicy> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    config: Partial<RotationConfig>,
    keyManager: KeyManager,
    secretStorage: SecretStorage
  ) {
    this.config = {
      enabled: true,
      schedule: '0 2 * * *',
      maxKeyAgeDays: 90,
      maxKeyUsage: 1000000,
      notifyOnRotation: true,
      preRotationSteps: ['validate-key-health', 'backup-current-key'],
      postRotationSteps: ['verify-decryption', 'update-key-metadata'],
      gracePeriodHours: 24,
      maxParallelRotations: 5,
      ...config,
    };
    this.keyManager = keyManager;
    this.secretStorage = secretStorage;
  }

  async startScheduler(): Promise<void> {
    if (!this.config.enabled) {
      logger.info('Auto-rotation is disabled');
      return;
    }

    await this.checkAndQueueRotations();

    const intervalMs = 60 * 60 * 1000;
    const interval = setInterval(() => {
      this.checkAndQueueRotations();
    }, intervalMs);

    this.timers.set('rotation-scheduler', interval);
    logger.info('Auto-rotation scheduler started');
  }

  stopScheduler(): void {
    for (const [name, timer] of this.timers) {
      clearInterval(timer);
      this.timers.delete(name);
    }
    logger.info('Auto-rotation scheduler stopped');
  }

  createPolicy(policy: RotationPolicy): void {
    this.policies.set(policy.name, policy);
    logger.info(`Rotation policy '${policy.name}' created`);
  }

  deletePolicy(name: string): boolean {
    return this.policies.delete(name);
  }

  getPolicies(): RotationPolicy[] {
    return Array.from(this.policies.values());
  }

  async rotateKey(keyId: string, options?: {
    force?: boolean;
    reason?: string;
  }): Promise<RotationEvent> {
    const eventId = crypto.randomUUID();
    const keyInfo = this.keyManager.getKeyInfo(keyId);

    if (!keyInfo) {
      throw new Error(`Key ${keyId} not found`);
    }

    const event: RotationEvent = {
      id: eventId,
      secretName: keyInfo.id,
      keyId,
      previousKeyVersion: keyInfo.version,
      newKeyVersion: keyInfo.version + 1,
      status: 'pending',
      startedAt: new Date(),
      steps: this.buildRotationSteps(),
    };

    this.activeRotations.set(eventId, event);
    this.rotationQueue.push(event);

    try {
      await this.executeRotation(event, options?.force);
    } catch (error) {
      event.status = 'failed';
      event.error = error instanceof Error ? error.message : 'Unknown error';
      event.completedAt = new Date();
    }

    this.rotationHistory.push(event);
    return event;
  }

  async rotateSecret(name: string, options?: {
    force?: boolean;
    reason?: string;
  }): Promise<RotationEvent[]> {
    const events: RotationEvent[] = [];

    const secrets = await this.secretStorage.listSecrets({ prefix: name });
    const secret = secrets.find((s) => s.name === name);

    if (secret) {
      const keyId = secret.tags?.keyId;
      if (keyId) {
        const event = await this.rotateKey(keyId, options);
        events.push(event);
      }
    }

    return events;
  }

  async rotateAll(options?: {
    filter?: (key: KeyInfo) => boolean;
    dryRun?: boolean;
  }): Promise<RotationEvent[]> {
    const keys = this.keyManager.listKeys({ status: 'active' });
    const filteredKeys = options?.filter ? keys.filter(options.filter) : keys;

    const events: RotationEvent[] = [];

    for (const key of filteredKeys) {
      if (this.activeRotations.size >= this.config.maxParallelRotations) {
        break;
      }

      if (this.shouldRotateKey(key)) {
        const event = await this.rotateKey(key.id, options);
        events.push(event);
      }
    }

    return events;
  }

  async rollbackRotation(eventId: string): Promise<boolean> {
    const event = this.rotationHistory.find((e) => e.id === eventId);

    if (!event) {
      throw new Error(`Rotation event ${eventId} not found`);
    }

    if (event.status !== 'failed') {
      throw new Error('Can only rollback failed rotations');
    }

    event.status = 'rolled_back';
    event.completedAt = new Date();

    await this.executePostRotationSteps(event, true);

    return true;
  }

  getRotationStatus(): {
    activeRotations: number;
    pendingRotations: number;
    completedToday: number;
    failedToday: number;
    keysNeedingRotation: number;
  } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const completedToday = this.rotationHistory.filter(
      (e) =>
        e.status === 'completed' &&
        e.completedAt &&
        new Date(e.completedAt) >= today
    ).length;

    const failedToday = this.rotationHistory.filter(
      (e) =>
        e.status === 'failed' &&
        e.completedAt &&
        new Date(e.completedAt) >= today
    ).length;

    const rotationStatus = this.keyManager.getRotationStatus();

    return {
      activeRotations: this.activeRotations.size,
      pendingRotations: this.rotationQueue.length,
      completedToday,
      failedToday,
      keysNeedingRotation: rotationStatus.keysNeedingRotation.length,
    };
  }

  getRotationHistory(filter?: {
    status?: RotationEvent['status'];
    keyId?: string;
    since?: Date;
    limit?: number;
  }): RotationEvent[] {
    let history = [...this.rotationHistory];

    if (filter?.status) {
      history = history.filter((e) => e.status === filter.status);
    }
    if (filter?.keyId) {
      history = history.filter((e) => e.keyId === filter.keyId);
    }
    if (filter?.since) {
      history = history.filter((e) => new Date(e.startedAt) >= filter.since!);
    }

    history.sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );

    if (filter?.limit) {
      history = history.slice(0, filter.limit);
    }

    return history;
  }

  private async checkAndQueueRotations(): Promise<void> {
    const keys = this.keyManager.listKeys({ status: 'active' });

    for (const key of keys) {
      if (this.shouldRotateKey(key)) {
        const existingQueue = this.rotationQueue.find(
          (e) => e.keyId === key.id && e.status === 'pending'
        );
        if (!existingQueue) {
          await this.rotateKey(key.id);
        }
      }
    }
  }

  private shouldRotateKey(key: KeyInfo): boolean {
    const now = new Date();
    const keyAge = now.getTime() - new Date(key.createdAt).getTime();
    const maxAgeMs = this.config.maxKeyAgeDays * 24 * 60 * 60 * 1000;

    if (keyAge > maxAgeMs) return true;

    const usage = this.keyManager.getKeyUsageCount(key.id);
    if (usage >= this.config.maxKeyUsage) return true;

    return false;
  }

  private buildRotationSteps(): RotationStep[] {
    const steps: RotationStep[] = [];

    for (const step of this.config.preRotationSteps) {
      steps.push({ name: `pre:${step}`, status: 'pending' });
    }

    steps.push({ name: 'rotate-key', status: 'pending' });

    for (const step of this.config.postRotationSteps) {
      steps.push({ name: `post:${step}`, status: 'pending' });
    }

    return steps;
  }

  private async executeRotation(event: RotationEvent, force?: boolean): Promise<void> {
    event.status = 'in_progress';
    event.startedAt = new Date();

    for (const step of event.steps) {
      if (step.name === 'rotate-key') {
        step.status = 'running';
        step.startedAt = new Date();

        try {
          await this.keyManager.rotateKey(event.keyId);
          step.status = 'completed';
          step.completedAt = new Date();
        } catch (error) {
          step.status = 'failed';
          step.error = error instanceof Error ? error.message : 'Unknown error';
          throw error;
        }
      }
    }

    await this.executePostRotationSteps(event);

    event.status = 'completed';
    event.completedAt = new Date();
    this.activeRotations.delete(event.id);
  }

  private async executePostRotationSteps(event: RotationEvent, isRollback?: boolean): Promise<void> {
    for (const step of event.steps) {
      if (step.name.startsWith('post:')) {
        step.status = 'running';
        step.startedAt = new Date();

        try {
          await this.executePostStep(step.name.replace('post:', ''), event, isRollback);
          step.status = 'completed';
        } catch (error) {
          step.status = 'failed';
          step.error = error instanceof Error ? error.message : 'Unknown error';
        }
        step.completedAt = new Date();
      }
    }
  }

  private async executePostStep(
    step: string,
    event: RotationEvent,
    isRollback?: boolean
  ): Promise<void> {
    switch (step) {
      case 'verify-decryption':
        await this.verifyDecryption(event);
        break;
      case 'update-key-metadata':
        break;
      case 'notify-stakeholders':
        await this.notifyStakeholders(event, isRollback);
        break;
      case 'invalidate-caches':
        break;
    }
  }

  private async verifyDecryption(event: RotationEvent): Promise<void> {
    const newKey = this.keyManager.getKeyInfo(event.keyId);
    if (!newKey || newKey.status !== 'active') {
      throw new Error('New key not properly activated');
    }
  }

  private async notifyStakeholders(event: RotationEvent, isRollback?: boolean): Promise<void> {
    if (!this.config.notifyOnRotation) return;

    console.log(
      `Rotation notification: ${isRollback ? 'Rollback' : 'Completed'} rotation for key ${event.keyId}`
    );
  }
}

export class ScheduledRotation {
  private rotation: AutoRotation;
  private cronSchedule: string;

  constructor(rotation: AutoRotation, cronSchedule: string) {
    this.rotation = rotation;
    this.cronSchedule = cronSchedule;
  }

  async execute(): Promise<void> {
    const status = this.rotation.getRotationStatus();

    logger.info(`Scheduled rotation check: ${status.keysNeedingRotation} keys need rotation`);

    if (status.keysNeedingRotation > 0) {
      await this.rotation.rotateAll();
    }
  }
}

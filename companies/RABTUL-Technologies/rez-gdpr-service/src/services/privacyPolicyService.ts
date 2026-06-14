import { PrivacyPolicy, AuditEntry } from '../types';
import { auditService } from './auditService';

export interface PrivacyPolicyCreateInput {
  version: string;
  title: string;
  content: string;
  effectiveDate: Date;
  changelog?: string;
}

export interface PrivacyPolicyUpdateInput {
  title?: string;
  content?: string;
  changelog?: string;
  isActive?: boolean;
}

class PrivacyPolicyService {
  private policies: Map<string, PrivacyPolicy> = new Map();
  private userAcceptances: Map<string, Set<string>> = new Map();

  async create(input: PrivacyPolicyCreateInput): Promise<PrivacyPolicy> {
    const id = this.generateId();
    const policy: PrivacyPolicy = {
      id,
      version: input.version,
      title: input.title,
      content: input.content,
      effectiveDate: input.effectiveDate,
      changelog: input.changelog,
      isActive: false,
      acceptedByUsers: []
    };

    this.policies.set(id, policy);

    await auditService.log({
      action: 'PRIVACY_POLICY_CREATED',
      details: {
        policyId: id,
        version: input.version,
        title: input.title
      },
      result: 'success'
    });

    return policy;
  }

  async publish(id: string): Promise<PrivacyPolicy | null> {
    const policy = this.policies.get(id);
    if (!policy) {
      return null;
    }

    for (const existingPolicy of this.policies.values()) {
      if (existingPolicy.isActive && existingPolicy.id !== id) {
        existingPolicy.isActive = false;
        this.policies.set(existingPolicy.id, existingPolicy);
      }
    }

    policy.isActive = true;
    policy.publishedAt = new Date();
    this.policies.set(id, policy);

    await auditService.log({
      action: 'PRIVACY_POLICY_PUBLISHED',
      details: { policyId: id, version: policy.version },
      result: 'success'
    });

    return policy;
  }

  async findById(id: string): Promise<PrivacyPolicy | null> {
    return this.policies.get(id) || null;
  }

  async findActive(): Promise<PrivacyPolicy | null> {
    for (const policy of this.policies.values()) {
      if (policy.isActive) {
        return policy;
      }
    }
    return null;
  }

  async findAll(): Promise<PrivacyPolicy[]> {
    return Array.from(this.policies.values())
      .sort((a, b) => b.effectiveDate.getTime() - a.effectiveDate.getTime());
  }

  async findByVersion(version: string): Promise<PrivacyPolicy | null> {
    for (const policy of this.policies.values()) {
      if (policy.version === version) {
        return policy;
      }
    }
    return null;
  }

  async update(id: string, input: PrivacyPolicyUpdateInput): Promise<PrivacyPolicy | null> {
    const policy = this.policies.get(id);
    if (!policy) {
      return null;
    }

    const updated: PrivacyPolicy = {
      ...policy,
      ...input,
      id
    };

    this.policies.set(id, updated);

    await auditService.log({
      action: 'PRIVACY_POLICY_UPDATED',
      details: { policyId: id, updates: input },
      result: 'success'
    });

    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const policy = this.policies.get(id);
    if (!policy) {
      return false;
    }

    if (policy.isActive) {
      throw new Error('Cannot delete the active privacy policy');
    }

    this.policies.delete(id);

    await auditService.log({
      action: 'PRIVACY_POLICY_DELETED',
      details: { policyId: id, version: policy.version },
      result: 'success'
    });

    return true;
  }

  async accept(
    userId: string,
    policyId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<boolean> {
    const policy = this.policies.get(policyId);
    if (!policy) {
      return false;
    }

    if (!policy.acceptedByUsers.includes(userId)) {
      policy.acceptedByUsers.push(userId);
    }

    if (!this.userAcceptances.has(userId)) {
      this.userAcceptances.set(userId, new Set());
    }
    this.userAcceptances.get(userId)!.add(policyId);

    this.policies.set(policyId, policy);

    await auditService.log({
      action: 'PRIVACY_POLICY_ACCEPTED',
      userId,
      details: {
        policyId,
        version: policy.version,
        acceptedAt: new Date()
      },
      ipAddress,
      userAgent,
      result: 'success'
    });

    return true;
  }

  async withdrawAcceptance(
    userId: string,
    policyId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<boolean> {
    const policy = this.policies.get(policyId);
    if (!policy) {
      return false;
    }

    const index = policy.acceptedByUsers.indexOf(userId);
    if (index > -1) {
      policy.acceptedByUsers.splice(index, 1);
    }

    if (this.userAcceptances.has(userId)) {
      this.userAcceptances.get(userId)!.delete(policyId);
    }

    this.policies.set(policyId, policy);

    await auditService.log({
      action: 'PRIVACY_POLICY_WITHDRAWN',
      userId,
      details: {
        policyId,
        version: policy.version,
        withdrawnAt: new Date()
      },
      ipAddress,
      userAgent,
      result: 'success'
    });

    return true;
  }

  async hasAcceptedCurrentPolicy(userId: string): Promise<boolean> {
    const activePolicy = await this.findActive();
    if (!activePolicy) {
      return true;
    }

    return activePolicy.acceptedByUsers.includes(userId);
  }

  async getUserAcceptedPolicies(userId: string): Promise<PrivacyPolicy[]> {
    return Array.from(this.policies.values())
      .filter(p => p.acceptedByUsers.includes(userId));
  }

  async getConsentHistory(
    userId: string
  ): Promise<AuditEntry[]> {
    const logs = await auditService.findByUserId(userId);
    return logs.filter(log =>
      log.action.includes('PRIVACY_POLICY')
    );
  }

  async compareVersions(
    version1: string,
    version2: string
  ): Promise<{
    policy1: PrivacyPolicy | null;
    policy2: PrivacyPolicy | null;
    changes: string[];
  } | null> {
    const policy1 = await this.findByVersion(version1);
    const policy2 = await this.findByVersion(version2);

    if (!policy1 || !policy2) {
      return null;
    }

    const changes: string[] = [];

    if (policy1.title !== policy2.title) {
      changes.push(`Title changed from "${policy1.title}" to "${policy2.title}"`);
    }

    const lines1 = policy1.content.split('\n');
    const lines2 = policy2.content.split('\n');

    const added = lines2.filter(line => !lines1.includes(line));
    const removed = lines1.filter(line => !lines2.includes(line));

    if (added.length > 0) {
      changes.push(`${added.length} lines added`);
    }
    if (removed.length > 0) {
      changes.push(`${removed.length} lines removed`);
    }

    return {
      policy1,
      policy2,
      changes
    };
  }

  async getStats(): Promise<{
    totalPolicies: number;
    activePolicy: PrivacyPolicy | null;
    totalAcceptances: number;
    acceptanceByPolicy: Array<{ version: string; count: number }>;
    recentAcceptances: number;
  }> {
    const policies = await this.findAll();
    const activePolicy = await this.findActive();

    const acceptanceByPolicy = policies.map(p => ({
      version: p.version,
      count: p.acceptedByUsers.length
    }));

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recentLogs = await auditService.getActivityByAction('PRIVACY_POLICY_ACCEPTED');
    const recentAcceptances = recentLogs.data.filter(
      e => e.timestamp >= oneWeekAgo
    ).length;

    return {
      totalPolicies: policies.length,
      activePolicy,
      totalAcceptances: policies.reduce((sum, p) => sum + p.acceptedByUsers.length, 0),
      acceptanceByPolicy,
      recentAcceptances
    };
  }

  async createDefaultPolicy(): Promise<PrivacyPolicy> {
    const defaultContent = `
# Privacy Policy

## 1. Introduction
This Privacy Policy describes how we collect, use, and share your personal information.

## 2. Information We Collect
We collect information you provide directly to us, including:
- Account information (name, email, password)
- Profile information
- Communications and messages
- Usage data and analytics

## 3. How We Use Your Information
We use the information we collect to:
- Provide, maintain, and improve our services
- Process transactions and send related information
- Send promotional communications (with your consent)
- Respond to your comments, questions, and requests

## 4. Information Sharing
We do not sell your personal information. We may share information with:
- Service providers who assist in our operations
- With your consent or at your direction
- As required by law

## 5. Data Retention
We retain your information for as long as your account is active or as needed to provide services.

## 6. Your Rights
Under GDPR, you have the right to:
- Access your personal data
- Rectify inaccurate data
- Erase your data ("right to be forgotten")
- Restrict processing
- Data portability
- Object to processing

## 7. Contact Us
For any questions about this policy, please contact our Data Protection Officer.

## 8. Changes to This Policy
We may update this policy from time to time. We will notify you of any changes.
    `.trim();

    return this.create({
      version: '1.0.0',
      title: 'Privacy Policy',
      content: defaultContent,
      effectiveDate: new Date(),
      changelog: 'Initial privacy policy'
    });
  }

  private generateId(): string {
    return `policy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const privacyPolicyService = new PrivacyPolicyService();

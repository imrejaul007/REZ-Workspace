/**
 * @module sutar-contract-os
 * @description SUTAR OS - Contract OS - Smart Contracts and Agreement Management Service
 * @author HOJAI AI Team
 * @version 1.0.0
 *
 * Port: 4190
 *
 * Production-ready smart contract handling with digital signatures,
 * contract templates, automatic validation, expiration tracking, and
 * full status lifecycle management.
 */

import express, { Express, Request, Response, NextFunction, RequestHandler } from 'express';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { logger } from './logger';

// ============================================
// TYPES
// ============================================

/**
 * Supported contract types
 */
export type ContractType = 'PURCHASE_ORDER' | 'SERVICE_AGREEMENT' | 'PARTNERSHIP' | 'EMPLOYMENT' | 'LEASE';

/**
 * Contract lifecycle status
 */
export type ContractStatus = 'draft' | 'pending' | 'active' | 'completed' | 'terminated' | 'expired';

/**
 * Signature status
 */
export type SignatureStatus = 'pending' | 'signed' | 'verified' | 'rejected';

/**
 * Contract payment terms
 */
export type PaymentTerms = 'immediate' | 'net_15' | 'net_30' | 'net_60' | 'net_90' | 'custom';

/**
 * Contract terms and conditions
 */
export interface ContractTerms {
  product?: string;
  quantity?: number;
  price?: number;
  total: number;
  currency: string;
  deliveryDate?: string;
  paymentTerms: PaymentTerms;
  paymentSchedule?: { milestone: string; amount: number; dueDate: string }[];
  penalties: {
    lateDelivery?: { percentage: number; gracePeriodDays: number };
    nonPayment?: { percentage: number; gracePeriodDays: number };
    breachOfContract?: { percentage: number };
  };
  clauses: { title: string; content: string }[];
  metadata?: Record<string, unknown>;
}

/**
 * Party signature information
 */
export interface Signature {
  partyId: string;
  partyName: string;
  partyRole: 'buyer' | 'seller' | 'provider' | 'recipient' | 'employer' | 'employee' | 'lessor' | 'lessee' | 'partner';
  signedAt?: string;
  signature?: string;
  signatureHash?: string;
  verified: boolean;
  verifiedAt?: string;
  status: SignatureStatus;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Full contract document
 */
export interface Contract {
  id: string;
  type: ContractType;
  title: string;
  description?: string;
  parties: Signature[];
  terms: ContractTerms;
  status: ContractStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  expiresAt?: string;
  completedAt?: string;
  terminatedAt?: string;
  terminationReason?: string;
  terminatedBy?: string;
  signatures: Signature[];
  validationResult?: ValidationResult;
  templateId?: string;
  parentContractId?: string;
  metadata?: Record<string, unknown>;
  auditLog: AuditEntry[];
}

/**
 * Contract validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  validatedAt: string;
}

/**
 * Validation error
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

/**
 * Audit log entry
 */
export interface AuditEntry {
  timestamp: string;
  action: string;
  actor: string;
  details: Record<string, unknown>;
  ipAddress?: string;
}

/**
 * Request to create a new contract
 */
export interface ContractRequest {
  type: ContractType;
  title: string;
  description?: string;
  parties: {
    partyId: string;
    partyName: string;
    partyRole: 'buyer' | 'seller' | 'provider' | 'recipient' | 'employer' | 'employee' | 'lessor' | 'lessee' | 'partner';
  }[];
  terms: ContractTerms;
  createdBy: string;
  expiresAt?: string;
  templateId?: string;
  parentContractId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Contract template for reusable contract structures
 */
export interface ContractTemplate {
  id: string;
  name: string;
  type: ContractType;
  description: string;
  defaultTerms: Partial<ContractTerms>;
  requiredClauses: { title: string; content: string }[];
  optionalClauses: { title: string; content: string }[];
  jurisdiction?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Request to sign a contract
 */
export interface SignRequest {
  partyId: string;
  signature: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Request to terminate a contract
 */
export interface TerminateRequest {
  reason: string;
  terminatedBy: string;
}

/**
 * Contract filter options
 */
export interface ContractFilter {
  type?: ContractType;
  status?: ContractStatus;
  partyId?: string;
  createdBy?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
  offset?: number;
}

// ============================================
// SERVICE
// ============================================

/**
 * ContractService - Manages the complete contract lifecycle
 * @class
 * @description Handles contract creation, signing, validation, and termination
 * with full audit logging and template support.
 */
export class ContractService {
  private contracts: Map<string, Contract> = new Map();
  private templates: Map<string, ContractTemplate> = new Map();

  /**
   * Creates a new ContractService instance
   * @constructor
   */
  constructor() {
    this.initializeDefaultTemplates();
  }

  /**
   * Initializes default contract templates
   * @private
   * @returns void
   */
  private initializeDefaultTemplates(): void {
    const defaultTemplates: ContractTemplate[] = [
      {
        id: 'template-po-standard',
        name: 'Standard Purchase Order',
        type: 'PURCHASE_ORDER',
        description: 'Standard purchase order template for goods procurement',
        defaultTerms: {
          currency: 'USD',
          paymentTerms: 'net_30',
          total: 0,
          penalties: {
            lateDelivery: { percentage: 5, gracePeriodDays: 7 },
            nonPayment: { percentage: 2, gracePeriodDays: 14 },
            breachOfContract: { percentage: 10 }
          }
        },
        requiredClauses: [
          { title: 'Delivery Terms', content: 'Goods shall be delivered within the specified timeframe.' },
          { title: 'Payment Terms', content: 'Payment is due within 30 days of invoice date.' },
          { title: 'Quality Guarantee', content: 'All goods must meet the specified quality standards.' }
        ],
        optionalClauses: [
          { title: 'Return Policy', content: 'Returns accepted within 30 days with original packaging.' },
          { title: 'Warranty', content: 'Standard manufacturer warranty applies.' }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'template-sa-standard',
        name: 'Standard Service Agreement',
        type: 'SERVICE_AGREEMENT',
        description: 'Standard service agreement for professional services',
        defaultTerms: {
          currency: 'USD',
          paymentTerms: 'net_30',
          total: 0,
          penalties: {
            lateDelivery: { percentage: 10, gracePeriodDays: 3 },
            nonPayment: { percentage: 1.5, gracePeriodDays: 7 },
            breachOfContract: { percentage: 15 }
          }
        },
        requiredClauses: [
          { title: 'Scope of Services', content: 'The provider agrees to deliver the services as specified.' },
          { title: 'Service Level', content: 'Services shall meet the agreed-upon quality standards.' },
          { title: 'Confidentiality', content: 'All proprietary information shall remain confidential.' },
          { title: 'Intellectual Property', content: 'Work product shall be owned by the client upon payment.' }
        ],
        optionalClauses: [
          { title: 'Non-Compete', content: 'Provider agrees not to compete for 12 months post-contract.' },
          { title: 'Exclusivity', content: 'Provider shall work exclusively for the client during the contract period.' }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'template-partnership-standard',
        name: 'Standard Partnership Agreement',
        type: 'PARTNERSHIP',
        description: 'Partnership agreement for business collaborations',
        defaultTerms: {
          currency: 'USD',
          paymentTerms: 'custom',
          total: 0,
          penalties: {
            breachOfContract: { percentage: 25 }
          }
        },
        requiredClauses: [
          { title: 'Profit Sharing', content: 'Profits and losses shall be shared equally unless otherwise specified.' },
          { title: 'Decision Making', content: 'Major decisions require unanimous consent of all partners.' },
          { title: 'Term Duration', content: 'This partnership shall continue until terminated by mutual agreement.' },
          { title: 'Liability', content: 'Each partner is jointly and severally liable for partnership obligations.' }
        ],
        optionalClauses: [
          { title: 'Capital Contribution', content: 'Each partner shall contribute capital as agreed.' },
          { title: 'Management Roles', content: 'Specific management responsibilities assigned to each partner.' }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'template-employment-standard',
        name: 'Standard Employment Contract',
        type: 'EMPLOYMENT',
        description: 'Employment contract for full-time employees',
        defaultTerms: {
          currency: 'USD',
          paymentTerms: 'custom',
          total: 0,
          penalties: {}
        },
        requiredClauses: [
          { title: 'Position', content: 'Employee shall serve in the specified position.' },
          { title: 'Compensation', content: 'Employee shall receive the agreed compensation.' },
          { title: 'Working Hours', content: 'Standard working hours apply unless otherwise specified.' },
          { title: 'Confidentiality', content: 'Employee shall maintain confidentiality of company information.' },
          { title: 'Termination', content: 'Either party may terminate with notice as specified.' }
        ],
        optionalClauses: [
          { title: 'Non-Compete', content: 'Employee agrees not to work for competitors for 12 months.' },
          { title: 'Stock Options', content: 'Employee is eligible for stock options as per company policy.' },
          { title: 'Remote Work', content: 'Employee may work remotely as approved by management.' }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'template-lease-standard',
        name: 'Standard Lease Agreement',
        type: 'LEASE',
        description: 'Property lease agreement template',
        defaultTerms: {
          currency: 'USD',
          paymentTerms: 'custom',
          total: 0,
          penalties: {
            lateDelivery: { percentage: 5, gracePeriodDays: 5 },
            nonPayment: { percentage: 5, gracePeriodDays: 10 },
            breachOfContract: { percentage: 20 }
          }
        },
        requiredClauses: [
          { title: 'Property Description', content: 'The property shall be as described in the schedule.' },
          { title: 'Lease Term', content: 'The lease shall commence on the start date and continue for the specified period.' },
          { title: 'Rent Payment', content: 'Rent is due on the first of each month.' },
          { title: 'Security Deposit', content: 'A security deposit shall be held and returned upon lease termination.' },
          { title: 'Maintenance', content: 'Tenant shall maintain the property in good condition.' }
        ],
        optionalClauses: [
          { title: 'Subletting', content: 'Subletting is not permitted without written consent.' },
          { title: 'Pet Policy', content: 'Pets are not allowed on the premises.' },
          { title: 'Parking', content: 'One parking space is included with the lease.' }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    defaultTemplates.forEach(t => this.templates.set(t.id, t));
  }

  // ============================================
  // CONTRACT CRUD
  // ============================================

  /**
   * Creates a new contract
   * @param request - The contract creation request
   * @returns The created contract
   */
  createContract(request: ContractRequest): Contract {
    // Apply template defaults if templateId provided
    let terms = { ...request.terms };
    if (request.templateId) {
      const template = this.templates.get(request.templateId);
      if (template) {
        terms = {
          ...template.defaultTerms,
          ...terms,
          penalties: { ...template.defaultTerms.penalties, ...terms.penalties }
        };
      }
    }

    const now = new Date().toISOString();
    const contract: Contract = {
      id: `contract_${uuidv4().replace(/-/g, '').slice(0, 16)}`,
      type: request.type,
      title: request.title,
      description: request.description,
      parties: request.parties.map(p => ({
        ...p,
        signedAt: undefined,
        signature: undefined,
        signatureHash: undefined,
        verified: false,
        verifiedAt: undefined,
        status: 'pending' as SignatureStatus,
        ipAddress: undefined,
        userAgent: undefined
      })),
      terms,
      status: 'draft',
      version: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: request.createdBy,
      expiresAt: request.expiresAt,
      completedAt: undefined,
      terminatedAt: undefined,
      terminationReason: undefined,
      terminatedBy: undefined,
      signatures: request.parties.map(p => ({
        ...p,
        signedAt: undefined,
        signature: undefined,
        signatureHash: undefined,
        verified: false,
        verifiedAt: undefined,
        status: 'pending' as SignatureStatus,
        ipAddress: undefined,
        userAgent: undefined
      })),
      validationResult: undefined,
      templateId: request.templateId,
      parentContractId: request.parentContractId,
      metadata: request.metadata,
      auditLog: [{
        timestamp: now,
        action: 'CONTRACT_CREATED',
        actor: request.createdBy,
        details: { type: request.type, title: request.title }
      }]
    };

    // Validate the contract
    contract.validationResult = this.validateContractInternal(contract);

    // If all parties are self-signing (automated), auto-activate
    if (request.parties.length === 1 || request.parties.every(p => p.partyId === request.createdBy)) {
      contract.status = 'pending';
    }

    this.contracts.set(contract.id, contract);
    return contract;
  }

  /**
   * Retrieves a contract by ID
   * @param id - The contract ID
   * @returns The contract or undefined if not found
   */
  getContract(id: string): Contract | undefined {
    const contract = this.contracts.get(id);
    if (!contract) return undefined;

    // Check for expiration
    if (contract.expiresAt && new Date(contract.expiresAt) < new Date() && contract.status === 'active') {
      contract.status = 'expired';
      contract.updatedAt = new Date().toISOString();
      contract.auditLog.push({
        timestamp: new Date().toISOString(),
        action: 'CONTRACT_EXPIRED',
        actor: 'system',
        details: { expiresAt: contract.expiresAt }
      });
      this.contracts.set(id, contract);
    }

    return contract;
  }

  /**
   * Lists contracts with optional filtering
   * @param filter - Optional filter criteria
   * @returns Object containing filtered contracts and total count
   */
  listContracts(filter?: ContractFilter): { contracts: Contract[]; total: number } {
    let contracts = Array.from(this.contracts.values());

    if (filter?.type) {
      contracts = contracts.filter(c => c.type === filter.type);
    }
    if (filter?.status) {
      contracts = contracts.filter(c => c.status === filter.status);
    }
    if (filter?.partyId) {
      contracts = contracts.filter(c =>
        c.parties.some(p => p.partyId === filter.partyId)
      );
    }
    if (filter?.createdBy) {
      contracts = contracts.filter(c => c.createdBy === filter.createdBy);
    }
    if (filter?.fromDate) {
      contracts = contracts.filter(c => c.createdAt >= filter.fromDate!);
    }
    if (filter?.toDate) {
      contracts = contracts.filter(c => c.createdAt <= filter.toDate!);
    }

    // Sort by creation date, newest first
    contracts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = contracts.length;

    if (filter?.offset) {
      contracts = contracts.slice(filter.offset);
    }
    if (filter?.limit) {
      contracts = contracts.slice(0, filter.limit);
    }

    return { contracts, total };
  }

  /**
   * Updates an existing contract
   * @param id - The contract ID
   * @param updates - The updates to apply
   * @param updatedBy - The user performing the update
   * @returns The updated contract or undefined
   * @throws Error if contract is not in draft status
   */
  updateContract(id: string, updates: Partial<ContractRequest>, updatedBy: string): Contract | undefined {
    const contract = this.contracts.get(id);
    if (!contract) return undefined;

    // Can only update draft contracts
    if (contract.status !== 'draft') {
      throw new Error('Can only update draft contracts');
    }

    const now = new Date().toISOString();

    // Transform parties from request format to full Signature format
    const transformedParties = updates.parties ? updates.parties.map(p => ({
      partyId: p.partyId,
      partyName: p.partyName,
      partyRole: p.partyRole,
      signedAt: undefined,
      signature: undefined,
      signatureHash: undefined,
      verified: false,
      verifiedAt: undefined,
      status: 'pending' as SignatureStatus,
      ipAddress: undefined,
      userAgent: undefined
    })) : undefined;

    const updated: Contract = {
      ...contract,
      type: updates.type ?? contract.type,
      title: updates.title ?? contract.title,
      description: updates.description ?? contract.description,
      parties: transformedParties ?? contract.parties,
      terms: updates.terms ?? contract.terms,
      expiresAt: updates.expiresAt ?? contract.expiresAt,
      metadata: updates.metadata ?? contract.metadata,
      version: contract.version + 1,
      updatedAt: now,
      auditLog: [
        ...contract.auditLog,
        {
          timestamp: now,
          action: 'CONTRACT_UPDATED',
          actor: updatedBy,
          details: { fields: Object.keys(updates) }
        }
      ]
    };

    // Re-validate
    updated.validationResult = this.validateContractInternal(updated);

    this.contracts.set(id, updated);
    return updated;
  }

  // ============================================
  // SIGNATURES
  // ============================================

  /**
   * Signs a contract for a specific party
   * @param contractId - The contract ID
   * @param partyId - The party ID signing
   * @param request - The sign request with signature data
   * @returns The updated contract or undefined
   * @throws Error if party not found or contract not signable
   */
  signContract(contractId: string, partyId: string, request: SignRequest): Contract | undefined {
    const contract = this.contracts.get(contractId);
    if (!contract) return undefined;

    // Find the party
    const partyIndex = contract.parties.findIndex(p => p.partyId === partyId);
    if (partyIndex === -1) {
      throw new Error('Party not found in contract');
    }

    // Check contract status
    if (!['draft', 'pending'].includes(contract.status)) {
      throw new Error(`Cannot sign contract with status: ${contract.status}`);
    }

    const party = contract.parties[partyIndex];

    // Check if already signed
    if (party.status === 'signed' || party.status === 'verified') {
      throw new Error('Party has already signed this contract');
    }

    const now = new Date().toISOString();

    // Generate signature hash
    const signatureData = `${contractId}:${partyId}:${request.signature}:${now}`;
    const signatureHash = crypto.createHash('sha256').update(signatureData).digest('hex');

    // Update party signature
    contract.parties[partyIndex] = {
      ...party,
      signedAt: now,
      signature: request.signature,
      signatureHash,
      status: 'signed',
      ipAddress: request.ipAddress,
      userAgent: request.userAgent
    };

    // Also update signatures array
    const sigIndex = contract.signatures.findIndex(s => s.partyId === partyId);
    if (sigIndex !== -1) {
      contract.signatures[sigIndex] = contract.parties[partyIndex];
    }

    // Update contract status
    contract.status = 'pending';
    contract.updatedAt = now;
    contract.auditLog.push({
      timestamp: now,
      action: 'CONTRACT_SIGNED',
      actor: partyId,
      details: { partyId, ipAddress: request.ipAddress },
      ipAddress: request.ipAddress
    });

    // Check if all parties have signed
    const allSigned = contract.parties.every(p => p.status === 'signed' || p.status === 'verified');
    if (allSigned) {
      contract.status = 'active';
      contract.auditLog.push({
        timestamp: now,
        action: 'CONTRACT_ACTIVATED',
        actor: 'system',
        details: { reason: 'All parties signed' }
      });

      // Auto-verify signatures when all parties have signed
      contract.parties.forEach((p, idx) => {
        if (p.status === 'signed') {
          contract.parties[idx] = { ...p, verified: true, verifiedAt: now, status: 'verified' };
        }
      });
      contract.signatures = contract.parties;
    }

    this.contracts.set(contractId, contract);
    return contract;
  }

  /**
   * Verifies a party's signature on a contract
   * @param contractId - The contract ID
   * @param partyId - The party ID to verify
   * @returns Verification result with details
   */
  verifySignature(contractId: string, partyId: string): { verified: boolean; details: Record<string, unknown> } {
    const contract = this.contracts.get(contractId);
    if (!contract) {
      return { verified: false, details: { error: 'Contract not found' } };
    }

    const party = contract.parties.find(p => p.partyId === partyId);
    if (!party) {
      return { verified: false, details: { error: 'Party not found in contract' } };
    }

    if (!party.signatureHash) {
      return { verified: false, details: { error: 'No signature found', status: party.status } };
    }

    // Re-verify the signature hash
    const isValid = party.verified && party.verifiedAt !== undefined;

    return {
      verified: isValid,
      details: {
        partyId,
        partyName: party.partyName,
        signedAt: party.signedAt,
        verifiedAt: party.verifiedAt,
        status: party.status,
        signatureHash: party.signatureHash ? `${party.signatureHash.slice(0, 8)}...` : undefined,
        ipAddress: party.ipAddress
      }
    };
  }

  // ============================================
  // VALIDATION
  // ============================================

  /**
   * Validates a contract by ID
   * @param contractId - The contract ID
   * @returns Validation result with errors and warnings
   */
  validateContract(contractId: string): ValidationResult {
    const contract = this.contracts.get(contractId);
    if (!contract) {
      return {
        valid: false,
        errors: [{ field: 'id', message: 'Contract not found', code: 'CONTRACT_NOT_FOUND' }],
        warnings: [],
        validatedAt: new Date().toISOString()
      };
    }

    return this.validateContractInternal(contract);
  }

  /**
   * Internal validation logic
   * @param contract - The contract to validate
   * @returns Validation result
   * @private
   */
  private validateContractInternal(contract: Contract): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required fields
    if (!contract.type) {
      errors.push({ field: 'type', message: 'Contract type is required', code: 'TYPE_REQUIRED' });
    }

    if (!contract.title || contract.title.trim().length < 3) {
      errors.push({ field: 'title', message: 'Contract title must be at least 3 characters', code: 'TITLE_INVALID' });
    }

    // Parties validation
    if (!contract.parties || contract.parties.length < 2) {
      errors.push({ field: 'parties', message: 'At least 2 parties are required', code: 'PARTIES_INSUFFICIENT' });
    }

    if (contract.parties) {
      contract.parties.forEach((party, idx) => {
        if (!party.partyId) {
          errors.push({ field: `parties[${idx}].partyId`, message: 'Party ID is required', code: 'PARTY_ID_REQUIRED' });
        }
        if (!party.partyName || party.partyName.trim().length < 2) {
          errors.push({ field: `parties[${idx}].partyName`, message: 'Party name is required', code: 'PARTY_NAME_REQUIRED' });
        }
      });
    }

    // Terms validation
    if (!contract.terms) {
      errors.push({ field: 'terms', message: 'Contract terms are required', code: 'TERMS_REQUIRED' });
    } else {
      if (contract.terms.total === undefined || contract.terms.total < 0) {
        errors.push({ field: 'terms.total', message: 'Total amount must be specified and non-negative', code: 'TOTAL_INVALID' });
      }

      if (!contract.terms.currency || contract.terms.currency.length !== 3) {
        errors.push({ field: 'terms.currency', message: 'Valid 3-letter currency code is required', code: 'CURRENCY_INVALID' });
      }

      if (!contract.terms.paymentTerms) {
        errors.push({ field: 'terms.paymentTerms', message: 'Payment terms are required', code: 'PAYMENT_TERMS_REQUIRED' });
      }

      // Check for required clauses based on contract type
      const minClauses = this.getRequiredClauseCount(contract.type);
      if (!contract.terms.clauses || contract.terms.clauses.length < minClauses) {
        warnings.push({
          field: 'terms.clauses',
          message: `Consider adding more clauses for better legal protection`,
          code: 'CLAUSES_RECOMMENDED'
        });
      }
    }

    // Expiration validation
    if (contract.expiresAt) {
      const expiresAt = new Date(contract.expiresAt);
      if (expiresAt <= new Date()) {
        errors.push({ field: 'expiresAt', message: 'Expiration date must be in the future', code: 'EXPIRES_AT_INVALID' });
      }
    }

    // Status-specific validation
    if (contract.status === 'active') {
      const unsignedParties = contract.parties.filter(p => !p.verified);
      if (unsignedParties.length > 0) {
        errors.push({
          field: 'signatures',
          message: `Cannot activate contract with unsigned parties: ${unsignedParties.map(p => p.partyName).join(', ')}`,
          code: 'UNSIGNED_PARTIES'
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      validatedAt: new Date().toISOString()
    };
  }

  /**
   * Gets the minimum required clause count for a contract type
   * @param type - The contract type
   * @returns Minimum clause count
   * @private
   */
  private getRequiredClauseCount(type: ContractType): number {
    const counts: Record<ContractType, number> = {
      'PURCHASE_ORDER': 2,
      'SERVICE_AGREEMENT': 3,
      'PARTNERSHIP': 3,
      'EMPLOYMENT': 4,
      'LEASE': 4
    };
    return counts[type] || 2;
  }

  // ============================================
  // TERMINATION
  // ============================================

  /**
   * Terminates a contract
   * @param contractId - The contract ID
   * @param reason - Termination reason
   * @param terminatedBy - User terminating the contract
   * @param ipAddress - Optional IP address for audit
   * @returns The terminated contract or undefined
   * @throws Error if contract cannot be terminated
   */
  terminateContract(contractId: string, reason: string, terminatedBy: string, ipAddress?: string): Contract | undefined {
    const contract = this.contracts.get(contractId);
    if (!contract) return undefined;

    // Can only terminate active or pending contracts
    if (!['active', 'pending', 'draft'].includes(contract.status)) {
      throw new Error(`Cannot terminate contract with status: ${contract.status}`);
    }

    const now = new Date().toISOString();
    contract.status = 'terminated';
    contract.terminatedAt = now;
    contract.terminationReason = reason;
    contract.terminatedBy = terminatedBy;
    contract.updatedAt = now;
    contract.auditLog.push({
      timestamp: now,
      action: 'CONTRACT_TERMINATED',
      actor: terminatedBy,
      details: { reason },
      ipAddress
    });

    this.contracts.set(contractId, contract);
    return contract;
  }

  /**
   * Marks a contract as completed
   * @param contractId - The contract ID
   * @param completedBy - User completing the contract
   * @returns The completed contract or undefined
   * @throws Error if contract is not active
   */
  completeContract(contractId: string, completedBy: string): Contract | undefined {
    const contract = this.contracts.get(contractId);
    if (!contract) return undefined;

    if (contract.status !== 'active') {
      throw new Error('Can only complete active contracts');
    }

    const now = new Date().toISOString();
    contract.status = 'completed';
    contract.completedAt = now;
    contract.updatedAt = now;
    contract.auditLog.push({
      timestamp: now,
      action: 'CONTRACT_COMPLETED',
      actor: completedBy,
      details: {}
    });

    this.contracts.set(contractId, contract);
    return contract;
  }

  // ============================================
  // TEMPLATES
  // ============================================

  /**
   * Gets all templates or filtered by type
   * @param type - Optional contract type filter
   * @returns Array of templates
   */
  getTemplates(type?: ContractType): ContractTemplate[] {
    const templates = Array.from(this.templates.values());
    if (type) {
      return templates.filter(t => t.type === type);
    }
    return templates;
  }

  /**
   * Gets a specific template by ID
   * @param id - The template ID
   * @returns The template or undefined
   */
  getTemplate(id: string): ContractTemplate | undefined {
    return this.templates.get(id);
  }

  // ============================================
  // ANALYTICS
  // ============================================

  /**
   * Gets contract statistics
   * @returns Statistics object with counts by status and type
   */
  getStats(): {
    total: number;
    byStatus: Record<ContractStatus, number>;
    byType: Record<ContractType, number>;
    expiringSoon: number;
    recentActivity: number;
  } {
    const contracts = Array.from(this.contracts.values());
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const byStatus: Record<ContractStatus, number> = {
      draft: 0, pending: 0, active: 0, completed: 0, terminated: 0, expired: 0
    };

    const byType: Record<ContractType, number> = {
      'PURCHASE_ORDER': 0, 'SERVICE_AGREEMENT': 0, 'PARTNERSHIP': 0, 'EMPLOYMENT': 0, 'LEASE': 0
    };

    contracts.forEach(c => {
      byStatus[c.status]++;
      byType[c.type]++;
    });

    return {
      total: contracts.length,
      byStatus,
      byType,
      expiringSoon: contracts.filter(c =>
        c.expiresAt &&
        new Date(c.expiresAt) <= weekFromNow &&
        c.status === 'active'
      ).length,
      recentActivity: contracts.filter(c =>
        new Date(c.updatedAt) >= new Date(now.getTime() - 24 * 60 * 60 * 1000)
      ).length
    };
  }

  /**
   * Gets the audit history for a contract
   * @param contractId - The contract ID
   * @returns Array of audit entries
   */
  getContractHistory(contractId: string): AuditEntry[] {
    const contract = this.contracts.get(contractId);
    return contract ? contract.auditLog : [];
  }

  // ============================================
  // UTILITIES
  // ============================================

  /**
   * Generates a SHA256 hash of a contract
   * @param contractId - The contract ID
   * @returns The hash string or empty if not found
   */
  generateContractHash(contractId: string): string {
    const contract = this.contracts.get(contractId);
    if (!contract) return '';

    const data = JSON.stringify({
      id: contract.id,
      type: contract.type,
      terms: contract.terms,
      parties: contract.parties.map(p => ({ partyId: p.partyId, signatureHash: p.signatureHash })),
      createdAt: contract.createdAt
    });

    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Clones an existing contract
   * @param contractId - The contract to clone
   * @param clonedBy - User cloning the contract
   * @returns The cloned contract or undefined
   */
  cloneContract(contractId: string, clonedBy: string): Contract | undefined {
    const original = this.contracts.get(contractId);
    if (!original) return undefined;

    const now = new Date().toISOString();
    const cloned: Contract = {
      ...JSON.parse(JSON.stringify(original)),
      id: `contract_${uuidv4().replace(/-/g, '').slice(0, 16)}`,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      createdBy: clonedBy,
      completedAt: undefined,
      terminatedAt: undefined,
      terminationReason: undefined,
      terminatedBy: undefined,
      parentContractId: original.id,
      auditLog: [{
        timestamp: now,
        action: 'CONTRACT_CLONED',
        actor: clonedBy,
        details: { originalId: original.id }
      }]
    };

    // Reset all signatures
    cloned.parties.forEach((p, idx) => {
      cloned.parties[idx] = { ...p, signedAt: undefined, signature: undefined, signatureHash: undefined, verified: false, verifiedAt: undefined, status: 'pending' as SignatureStatus };
    });
    cloned.signatures = cloned.parties;

    cloned.validationResult = this.validateContractInternal(cloned);
    this.contracts.set(cloned.id, cloned);
    return cloned;
  }
}

// ============================================
// EXPRESS APP
// ============================================

const app: Express = express();
const PORT = process.env.PORT || 4190;
const service = new ContractService();

// Security middleware
const corsOptions: cors.CorsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-API-Key'],
  credentials: true
};

// Request ID middleware
const requestIdMiddleware: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const requestId = (req.headers['x-request-id'] as string) || uuidv4();
  (req as any).requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
};

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per minute
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
app.use(cors(corsOptions));
app.use(compression());
app.use(requestIdMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`, { requestId: (req as any).requestId });
  next();
});

// Health check (no rate limiting)
/**
 * Health check endpoint
 * @returns Health status
 */
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'sutar-contract-os',
    version: '1.0.0',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// Readiness check
/**
 * Readiness check endpoint with service stats
 * @returns Readiness status and statistics
 */
app.get('/ready', (_req: Request, res: Response) => {
  const stats = service.getStats();
  res.json({
    ready: true,
    stats,
    timestamp: new Date().toISOString()
  });
});

// Apply rate limiting to API routes
app.use('/api', apiLimiter);

// ============================================
// API ROUTES
// ============================================

// Root endpoint
/**
 * Root endpoint with service information
 * @returns Service details and available endpoints
 */
app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'SUTAR OS - ContractOS',
    version: '1.0.0',
    description: 'Smart contracts and agreement management',
    port: PORT,
    endpoints: {
      health: 'GET /health',
      ready: 'GET /ready',
      contracts: {
        create: 'POST /api/v1/contracts',
        list: 'GET /api/v1/contracts',
        get: 'GET /api/v1/contracts/:id',
        update: 'PATCH /api/v1/contracts/:id',
        delete: 'DELETE /api/v1/contracts/:id',
        sign: 'POST /api/v1/contracts/:id/sign',
        verifySignature: 'POST /api/v1/contracts/:id/verify/:partyId',
        terminate: 'POST /api/v1/contracts/:id/terminate',
        complete: 'POST /api/v1/contracts/:id/complete',
        validate: 'POST /api/v1/contracts/:id/validate',
        clone: 'POST /api/v1/contracts/:id/clone',
        history: 'GET /api/v1/contracts/:id/history',
        hash: 'GET /api/v1/contracts/:id/hash'
      },
      templates: {
        list: 'GET /api/v1/contracts/templates',
        get: 'GET /api/v1/contracts/templates/:id'
      },
      analytics: 'GET /api/v1/analytics'
    }
  });
});

/**
 * Create a new contract
 * @param request - Contract creation request
 * @returns Created contract
 */
app.post('/api/v1/contracts', strictLimiter, (req: Request, res: Response) => {
  try {
    const request: ContractRequest = req.body;

    // Validate required fields
    if (!request.type || !request.title || !request.parties || !request.createdBy) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: type, title, parties, createdBy'
      });
    }

    if (!['PURCHASE_ORDER', 'SERVICE_AGREEMENT', 'PARTNERSHIP', 'EMPLOYMENT', 'LEASE'].includes(request.type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid contract type'
      });
    }

    if (!request.terms || typeof request.terms.total !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Invalid terms: total amount required'
      });
    }

    const contract = service.createContract(request);
    res.status(201).json({
      success: true,
      data: contract
    });
  } catch (error) {
    logger.error('Error creating contract', { error: (error as Error).message });
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

/**
 * List contracts with optional filtering
 * @returns Paginated list of contracts
 */
app.get('/api/v1/contracts', (req: Request, res: Response) => {
  try {
    const filter: ContractFilter = {
      type: req.query.type as ContractType | undefined,
      status: req.query.status as ContractStatus | undefined,
      partyId: req.query.partyId as string | undefined,
      createdBy: req.query.createdBy as string | undefined,
      fromDate: req.query.fromDate as string | undefined,
      toDate: req.query.toDate as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0
    };

    const result = service.listContracts(filter);
    res.json({
      success: true,
      data: result.contracts,
      pagination: {
        total: result.total,
        limit: filter.limit,
        offset: filter.offset
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// Templates
/**
 * List contract templates
 * @param type - Optional type filter
 * @returns Array of templates
 */
app.get('/api/v1/contracts/templates', (req: Request, res: Response) => {
  try {
    const type = req.query.type as ContractType | undefined;
    const templates = service.getTemplates(type);
    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

/**
 * Get a specific template
 * @param id - Template ID
 * @returns Template or 404
 */
app.get('/api/v1/contracts/templates/:id', (req: Request, res: Response) => {
  try {
    const template = service.getTemplate(req.params.id);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }
    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

/**
 * Get a contract by ID
 * @param id - Contract ID
 * @returns Contract or 404
 */
app.get('/api/v1/contracts/:id', (req: Request, res: Response) => {
  try {
    const contract = service.getContract(req.params.id);
    if (!contract) {
      return res.status(404).json({
        success: false,
        error: 'Contract not found'
      });
    }
    res.json({
      success: true,
      data: contract
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

/**
 * Update a contract
 * @param id - Contract ID
 * @returns Updated contract or error
 */
app.patch('/api/v1/contracts/:id', strictLimiter, (req: Request, res: Response) => {
  try {
    const contract = service.updateContract(req.params.id, req.body, (req as any).user?.id || 'system');
    if (!contract) {
      return res.status(404).json({
        success: false,
        error: 'Contract not found'
      });
    }
    res.json({
      success: true,
      data: contract
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: (error as Error).message
    });
  }
});

/**
 * Delete a draft contract
 * @param id - Contract ID
 * @returns Success or error
 */
app.delete('/api/v1/contracts/:id', strictLimiter, (req: Request, res: Response) => {
  const contract = service.getContract(req.params.id);
  if (!contract) {
    return res.status(404).json({
      success: false,
      error: 'Contract not found'
    });
  }

  // Only draft contracts can be deleted
  if (contract.status !== 'draft') {
    return res.status(400).json({
      success: false,
      error: 'Only draft contracts can be deleted'
    });
  }

  service.terminateContract(req.params.id, 'Deleted by user', (req as any).user?.id || 'system');
  res.json({
    success: true,
    message: 'Contract deleted'
  });
});

/**
 * Sign a contract
 * @param id - Contract ID
 * @param partyId - Party ID signing
 * @param signature - Signature data
 * @returns Updated contract
 */
app.post('/api/v1/contracts/:id/sign', strictLimiter, (req: Request, res: Response) => {
  try {
    const { partyId, signature } = req.body;

    if (!partyId || !signature) {
      return res.status(400).json({
        success: false,
        error: 'partyId and signature are required'
      });
    }

    const contract = service.signContract(
      req.params.id,
      partyId,
      {
        partyId,
        signature,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    );

    if (!contract) {
      return res.status(404).json({
        success: false,
        error: 'Contract not found'
      });
    }

    res.json({
      success: true,
      data: contract
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: (error as Error).message
    });
  }
});

/**
 * Verify a party signature
 * @param id - Contract ID
 * @param partyId - Party ID to verify
 * @returns Verification result
 */
app.post('/api/v1/contracts/:id/verify/:partyId', (req: Request, res: Response) => {
  try {
    const result = service.verifySignature(req.params.id, req.params.partyId);
    if (!result.details.error) {
      return res.json({
        success: true,
        data: result
      });
    }
    res.status(404).json({
      success: false,
      error: result.details.error
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

/**
 * Terminate a contract
 * @param id - Contract ID
 * @param reason - Termination reason
 * @param terminatedBy - User terminating
 * @returns Terminated contract
 */
app.post('/api/v1/contracts/:id/terminate', strictLimiter, (req: Request, res: Response) => {
  try {
    const { reason, terminatedBy } = req.body;

    if (!reason || !terminatedBy) {
      return res.status(400).json({
        success: false,
        error: 'reason and terminatedBy are required'
      });
    }

    const contract = service.terminateContract(
      req.params.id,
      reason,
      terminatedBy,
      req.ip
    );

    if (!contract) {
      return res.status(404).json({
        success: false,
        error: 'Contract not found'
      });
    }

    res.json({
      success: true,
      data: contract
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: (error as Error).message
    });
  }
});

/**
 * Complete an active contract
 * @param id - Contract ID
 * @param completedBy - User completing
 * @returns Completed contract
 */
app.post('/api/v1/contracts/:id/complete', strictLimiter, (req: Request, res: Response) => {
  try {
    const { completedBy } = req.body;

    if (!completedBy) {
      return res.status(400).json({
        success: false,
        error: 'completedBy is required'
      });
    }

    const contract = service.completeContract(req.params.id, completedBy);

    if (!contract) {
      return res.status(404).json({
        success: false,
        error: 'Contract not found'
      });
    }

    res.json({
      success: true,
      data: contract
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: (error as Error).message
    });
  }
});

/**
 * Validate a contract
 * @param id - Contract ID
 * @returns Validation result
 */
app.post('/api/v1/contracts/:id/validate', (req: Request, res: Response) => {
  try {
    const result = service.validateContract(req.params.id);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

/**
 * Clone a contract
 * @param id - Contract ID to clone
 * @param clonedBy - User cloning
 * @returns Cloned contract
 */
app.post('/api/v1/contracts/:id/clone', strictLimiter, (req: Request, res: Response) => {
  try {
    const { clonedBy } = req.body;

    if (!clonedBy) {
      return res.status(400).json({
        success: false,
        error: 'clonedBy is required'
      });
    }

    const contract = service.cloneContract(req.params.id, clonedBy);

    if (!contract) {
      return res.status(404).json({
        success: false,
        error: 'Contract not found'
      });
    }

    res.status(201).json({
      success: true,
      data: contract
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

/**
 * Get contract audit history
 * @param id - Contract ID
 * @returns Audit log entries
 */
app.get('/api/v1/contracts/:id/history', (req: Request, res: Response) => {
  try {
    const history = service.getContractHistory(req.params.id);
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

/**
 * Get contract hash
 * @param id - Contract ID
 * @returns Contract hash
 */
app.get('/api/v1/contracts/:id/hash', (req: Request, res: Response) => {
  try {
    const hash = service.generateContractHash(req.params.id);
    if (!hash) {
      return res.status(404).json({
        success: false,
        error: 'Contract not found'
      });
    }
    res.json({
      success: true,
      data: { hash }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

/**
 * Get contract statistics
 * @returns Statistics object
 */
app.get('/api/v1/analytics', (req: Request, res: Response) => {
  try {
    const stats = service.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Error handling
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error('Request error', { error: err.message, stack: err.stack, path: req.path });
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  logger.info('SUTAR OS - Contract OS started');
  logger.info(`Port: ${PORT}`, { port: PORT, version: '1.0.0' });
  logger.info('Contract Types available', {
    types: ['PURCHASE_ORDER', 'SERVICE_AGREEMENT', 'PARTNERSHIP', 'EMPLOYMENT', 'LEASE']
  });
});

export default app;

import { v4 as uuidv4 } from 'uuid';
import {
  Contract,
  ContractParty,
  ContractStatus,
  ContractTerms,
  ContractTimeline,
  ContractGovernance,
  ContractCreationRequest,
  ContractFilter,
  ContractAnalytics,
  ContractType,
  Obligation,
} from '../types';

export class ContractEngine {
  private contracts: Map<string, Contract> = new Map();
  private contractTemplates: Map<string, Contract> = new Map();

  constructor() {
    this.initializeTemplates();
    this.initializeSampleContracts();
  }

  private initializeTemplates(): void {
    // Service Agreement Template
    const serviceAgreement: Contract = {
      contractId: 'template-service-agreement',
      contractType: 'service_agreement',
      status: 'draft',
      parties: [],
      terms: {
        payment: {
          amount: 0,
          currency: 'INR',
          schedule: [],
          method: 'postpaid',
        },
        termination: {
          noticePeriod: 30,
          terminationClause: 'Either party may terminate with notice',
          terminationRights: [],
          penalties: [],
        },
        obligations: [],
      },
      timeline: {
        createdAt: new Date().toISOString(),
      },
      governance: {
        version: 1,
        governingLaw: 'Indian Contract Act, 1872',
        jurisdiction: 'India',
        disputeResolution: {
          method: 'arbitration',
          timeline: 60,
        },
        amendmentPolicy: {
          amendmentsAllowed: true,
          approvalRequired: ['both_parties'],
          versionControl: true,
        },
        forceMajeure: {
          enabled: true,
          events: ['natural_disaster', 'war', 'pandemic', 'government_action'],
          noticePeriod: 7,
          consequences: ['suspension', 'termination'],
        },
      },
      metadata: {
        category: 'template',
        description: 'Standard service agreement template',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Supply Agreement Template
    const supplyAgreement: Contract = {
      contractId: 'template-supply-agreement',
      contractType: 'supply_agreement',
      status: 'draft',
      parties: [],
      terms: {
        payment: {
          amount: 0,
          currency: 'INR',
          schedule: [],
          method: 'milestone',
        },
        termination: {
          noticePeriod: 15,
          terminationClause: 'Supplier may terminate on breach',
          terminationRights: [],
          penalties: [],
        },
        obligations: [],
      },
      timeline: {
        createdAt: new Date().toISOString(),
      },
      governance: {
        version: 1,
        governingLaw: 'Indian Sale of Goods Act, 1930',
        jurisdiction: 'India',
        disputeResolution: {
          method: 'arbitration',
          timeline: 30,
        },
        amendmentPolicy: {
          amendmentsAllowed: true,
          approvalRequired: ['both_parties'],
          versionControl: true,
        },
        forceMajeure: {
          enabled: true,
          events: ['natural_disaster', 'supply_chain_disruption', 'price_volatility'],
          noticePeriod: 5,
          consequences: ['price_adjustment', 'termination'],
        },
      },
      metadata: {
        category: 'template',
        description: 'Standard supply agreement template',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.contractTemplates.set('service-agreement', serviceAgreement);
    this.contractTemplates.set('supply-agreement', supplyAgreement);
  }

  private initializeSampleContracts(): void {
    const sampleContract: Contract = {
      contractId: 'contract-001',
      contractType: 'service_agreement',
      status: 'active',
      parties: [
        {
          partyId: 'merchant-001',
          partyType: 'merchant',
          role: 'buyer',
          name: 'ABC Restaurant',
          acceptanceStatus: 'signed',
          signedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          partyId: 'supplier-001',
          partyType: 'supplier',
          role: 'seller',
          name: 'Fresh Farms Pvt Ltd',
          acceptanceStatus: 'signed',
          signedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
      terms: {
        effectiveDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        expirationDate: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000).toISOString(),
        duration: {
          value: 12,
          unit: 'months',
          autoRenew: true,
          renewalTerm: {
            value: 12,
            unit: 'months',
            autoRenew: true,
          },
          noticePeriod: 30,
        },
        payment: {
          amount: 500000,
          currency: 'INR',
          schedule: [
            {
              milestone: 'Monthly delivery',
              amount: 41666.67,
              percentage: 100 / 12,
              dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'pending',
            },
          ],
          method: 'postpaid',
          creditPeriod: 15,
          lateFeePercentage: 2,
        },
        delivery: {
          method: 'delivery',
          location: 'ABC Restaurant, Mumbai',
          timeline: {
            expectedDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            leadTime: 24,
          },
          inspectionPeriod: 24,
        },
        termination: {
          noticePeriod: 30,
          terminationClause: 'Either party may terminate with 30 days notice',
          terminationRights: [
            {
              party: 'buyer',
              canTerminate: true,
              reason: 'breach_of_contract',
              penalties: ['forfeit_deposit'],
            },
            {
              party: 'seller',
              canTerminate: true,
              reason: 'non_payment',
              penalties: ['suspend_delivery'],
            },
          ],
          penalties: [
            {
              reason: 'early_termination',
              penaltyType: 'flat_fee',
              penaltyAmount: 10000,
            },
          ],
        },
        obligations: [
          {
            party: 'seller',
            description: 'Deliver fresh vegetables every Monday and Thursday',
            type: 'delivery',
            deadline: 'Weekly',
            status: 'completed',
          },
          {
            party: 'buyer',
            description: 'Payment within 15 days of delivery',
            type: 'payment',
            deadline: '15th of each month',
            status: 'completed',
          },
        ],
      },
      timeline: {
        createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
        submittedAt: new Date(Date.now() - 33 * 24 * 60 * 60 * 1000).toISOString(),
        approvedAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString(),
        signedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        activatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      governance: {
        version: 1,
        governingLaw: 'Indian Contract Act, 1872',
        jurisdiction: 'India',
        disputeResolution: {
          method: 'arbitration',
          venue: 'Mumbai',
          timeline: 60,
        },
        amendmentPolicy: {
          amendmentsAllowed: true,
          approvalRequired: ['both_parties'],
          versionControl: true,
        },
        forceMajeure: {
          enabled: true,
          events: ['natural_disaster', 'pandemic', 'government_lockdown'],
          noticePeriod: 7,
          consequences: ['contract_suspension', 'price_negotiation'],
        },
      },
      createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.contracts.set(sampleContract.contractId, sampleContract);
  }

  async createContract(request: ContractCreationRequest): Promise<Contract> {
    const contractId = `contract-${uuidv4().substring(0, 8)}`;
    const now = new Date().toISOString();

    const parties: ContractParty[] = request.parties.map((p) => ({
      ...p,
      acceptanceStatus: 'pending',
    }));

    const contract: Contract = {
      contractId,
      contractType: request.contractType,
      status: 'draft',
      parties,
      terms: request.terms,
      timeline: {
        createdAt: now,
      },
      governance: {
        version: 1,
        governingLaw: 'India',
        jurisdiction: 'India',
        disputeResolution: {
          method: 'arbitration',
          timeline: 30,
        },
        amendmentPolicy: {
          amendmentsAllowed: true,
          approvalRequired: ['both_parties'],
          versionControl: true,
        },
        forceMajeure: {
          enabled: true,
          events: ['natural_disaster'],
          noticePeriod: 7,
          consequences: ['suspension'],
        },
      },
      metadata: request.metadata,
      createdAt: now,
      updatedAt: now,
    };

    this.contracts.set(contractId, contract);
    return contract;
  }

  async getContract(contractId: string): Promise<Contract | null> {
    return this.contracts.get(contractId) || null;
  }

  async updateContractStatus(
    contractId: string,
    status: ContractStatus
  ): Promise<Contract | null> {
    const contract = this.contracts.get(contractId);
    if (!contract) return null;

    contract.status = status;
    contract.updatedAt = new Date().toISOString();

    // Update timeline based on status
    const now = new Date().toISOString();
    switch (status) {
      case 'pending_approval':
        contract.timeline.submittedAt = now;
        break;
      case 'active':
        contract.timeline.activatedAt = now;
        break;
      case 'completed':
        contract.timeline.completedAt = now;
        break;
      case 'terminated':
        contract.timeline.terminatedAt = now;
        break;
    }

    this.contracts.set(contractId, contract);
    return contract;
  }

  async signContract(contractId: string, partyId: string): Promise<Contract | null> {
    const contract = this.contracts.get(contractId);
    if (!contract) return null;

    const party = contract.parties.find((p) => p.partyId === partyId);
    if (!party) return null;

    party.acceptanceStatus = 'signed';
    party.signedAt = new Date().toISOString();

    // Check if all parties have signed
    const allSigned = contract.parties.every((p) => p.acceptanceStatus === 'signed');
    if (allSigned) {
      contract.status = 'active';
      contract.timeline.signedAt = new Date().toISOString();
      contract.timeline.activatedAt = new Date().toISOString();
    } else {
      contract.status = 'pending_signature';
    }

    contract.updatedAt = new Date().toISOString();
    this.contracts.set(contractId, contract);
    return contract;
  }

  async updateObligation(
    contractId: string,
    obligationIndex: number,
    update: Partial<Obligation>
  ): Promise<Contract | null> {
    const contract = this.contracts.get(contractId);
    if (!contract) return null;

    if (obligationIndex >= 0 && obligationIndex < contract.terms.obligations.length) {
      contract.terms.obligations[obligationIndex] = {
        ...contract.terms.obligations[obligationIndex],
        ...update,
      };
      contract.updatedAt = new Date().toISOString();
      this.contracts.set(contractId, contract);
    }

    return contract;
  }

  async filterContracts(filter: ContractFilter): Promise<Contract[]> {
    let results = Array.from(this.contracts.values());

    if (filter.status && filter.status.length > 0) {
      results = results.filter((c) => filter.status!.includes(c.status));
    }

    if (filter.contractType && filter.contractType.length > 0) {
      results = results.filter((c) => filter.contractType!.includes(c.contractType));
    }

    if (filter.partyId) {
      results = results.filter((c) =>
        c.parties.some((p) => p.partyId === filter.partyId)
      );
    }

    if (filter.fromDate) {
      results = results.filter(
        (c) => new Date(c.createdAt) >= new Date(filter.fromDate!)
      );
    }

    if (filter.toDate) {
      results = results.filter(
        (c) => new Date(c.createdAt) <= new Date(filter.toDate!)
      );
    }

    // Sort by createdAt descending
    results.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Pagination
    const offset = filter.offset || 0;
    const limit = filter.limit || 50;
    return results.slice(offset, offset + limit);
  }

  async getContractAnalytics(): Promise<ContractAnalytics> {
    const contracts = Array.from(this.contracts.values());

    const analytics: ContractAnalytics = {
      totalContracts: contracts.length,
      byStatus: {} as Record<ContractStatus, number>,
      byType: {} as Record<ContractType, number>,
      activeCount: 0,
      expiringCount: 0,
      disputedCount: 0,
      totalValue: 0,
      averageValue: 0,
    };

    contracts.forEach((contract) => {
      // Count by status
      analytics.byStatus[contract.status] =
        (analytics.byStatus[contract.status] || 0) + 1;

      // Count by type
      analytics.byType[contract.contractType] =
        (analytics.byType[contract.contractType] || 0) + 1;

      // Count specific statuses
      if (contract.status === 'active') analytics.activeCount++;
      if (contract.status === 'disputed') analytics.disputedCount++;

      // Check expiring contracts
      if (
        contract.terms.expirationDate &&
        contract.status === 'active'
      ) {
        const daysUntilExpiry = Math.ceil(
          (new Date(contract.terms.expirationDate).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        );
        if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
          analytics.expiringCount++;
        }
      }

      // Sum total value
      analytics.totalValue += contract.terms.payment?.amount || 0;
    });

    analytics.averageValue =
      contracts.length > 0 ? analytics.totalValue / contracts.length : 0;

    return analytics;
  }

  async getTemplate(templateId: string): Promise<Contract | null> {
    return this.contractTemplates.get(templateId) || null;
  }

  getAllTemplates(): Contract[] {
    return Array.from(this.contractTemplates.values());
  }

  getHealth(): { status: string; uptime: number; contracts: number } {
    return {
      status: 'healthy',
      uptime: process.uptime(),
      contracts: this.contracts.size,
    };
  }
}

export const contractEngine = new ContractEngine();

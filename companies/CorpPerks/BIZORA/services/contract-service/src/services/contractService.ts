import { Contract, IContract, IContractParty } from '../models/Contract.js';

export interface CreateContractDTO {
  title: string;
  type: IContract['type'];
  parties: IContractParty[];
  clauses?: IContract['clauses'];
  startDate?: Date;
  endDate?: Date;
  value?: number;
  currency?: string;
  terms?: string;
  attachments?: string[];
  metadata?: Record<string, unknown>;
  createdBy: string;
}

export interface UpdateContractDTO {
  title?: string;
  type?: IContract['type'];
  parties?: IContractParty[];
  clauses?: IContract['clauses'];
  startDate?: Date;
  endDate?: Date;
  value?: number;
  currency?: string;
  terms?: string;
  attachments?: string[];
  status?: IContract['status'];
  updatedBy?: string;
  metadata?: Record<string, unknown>;
}

export interface SignContractDTO {
  partyEmail: string;
  signature: string;
  signedAt?: Date;
}

export interface ContractFilters {
  status?: IContract['status'];
  type?: IContract['type'];
  createdBy?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

export class ContractService {
  /**
   * Generate a unique contract number
   */
  private generateContractNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `CTR-${timestamp}-${random}`;
  }

  /**
   * List contracts with pagination and filters
   */
  async listContracts(
    filters: ContractFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ contracts: IContract[]; total: number; page: number; totalPages: number }> {
    const query: Record<string, unknown> = {};

    if (filters.status) query.status = filters.status;
    if (filters.type) query.type = filters.type;
    if (filters.createdBy) query.createdBy = filters.createdBy;
    if (filters.startDate) query.startDate = { $gte: filters.startDate };
    if (filters.endDate) query.endDate = { $lte: filters.endDate };
    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { contractNumber: { $regex: filters.search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const [contracts, total] = await Promise.all([
      Contract.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Contract.countDocuments(query)
    ]);

    return {
      contracts: contracts as IContract[],
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get contract by ID
   */
  async getContract(id: string): Promise<IContract | null> {
    return Contract.findById(id).lean() as Promise<IContract | null>;
  }

  /**
   * Get contract by contract number
   */
  async getContractByNumber(contractNumber: string): Promise<IContract | null> {
    return Contract.findOne({ contractNumber }).lean() as Promise<IContract | null>;
  }

  /**
   * Create a new contract
   */
  async createContract(data: CreateContractDTO): Promise<IContract> {
    const contract = new Contract({
      ...data,
      contractNumber: this.generateContractNumber(),
      status: 'draft'
    });

    await contract.save();
    return contract;
  }

  /**
   * Update contract
   */
  async updateContract(id: string, data: UpdateContractDTO): Promise<IContract | null> {
    const contract = await Contract.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );
    return contract;
  }

  /**
   * Delete contract (soft delete by setting status)
   */
  async deleteContract(id: string): Promise<IContract | null> {
    const contract = await Contract.findByIdAndUpdate(
      id,
      { $set: { status: 'terminated' } },
      { new: true }
    );
    return contract;
  }

  /**
   * Sign contract by party
   */
  async signContract(id: string, signData: SignContractDTO): Promise<IContract | null> {
    const contract = await Contract.findById(id);
    if (!contract) return null;

    const partyIndex = contract.parties.findIndex(p => p.email === signData.partyEmail);
    if (partyIndex === -1) {
      throw new Error('Party not found in contract');
    }

    // Update party signature
    contract.parties[partyIndex].signature = signData.signature;
    contract.parties[partyIndex].signedAt = signData.signedAt || new Date();

    // Check if all parties have signed
    const allSigned = contract.parties.every(p => p.signature);
    if (allSigned) {
      contract.status = 'active';
    } else {
      contract.status = 'pending_signature';
    }

    await contract.save();
    return contract;
  }

  /**
   * Get contracts expiring soon
   */
  async getExpiringContracts(days: number = 30): Promise<IContract[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return Contract.find({
      endDate: { $lte: futureDate, $gte: new Date() },
      status: 'active'
    }).lean() as Promise<IContract[]>;
  }

  /**
   * Get contract statistics
   */
  async getContractStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    totalValue: number;
  }> {
    const [contracts, statusAgg, typeAgg, valueAgg] = await Promise.all([
      Contract.countDocuments(),
      Contract.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Contract.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      Contract.aggregate([
        { $match: { value: { $exists: true } } },
        { $group: { _id: null, total: { $sum: '$value' } } }
      ])
    ]);

    const byStatus: Record<string, number> = {};
    statusAgg.forEach(s => { byStatus[s._id] = s.count; });

    const byType: Record<string, number> = {};
    typeAgg.forEach(t => { byType[t._id] = t.count; });

    return {
      total: contracts,
      byStatus,
      byType,
      totalValue: valueAgg[0]?.total || 0
    };
  }
}

export const contractService = new ContractService();

import { Contract, IContract } from '../models/Contract';
import { Signature } from '../models/Signature';
import { ContractDocument } from '../models/Document';
import { logger } from '../utils/logger';
import { contractsCreated, contractsSigned } from '../utils/metrics';

export class ContractService {
  /**
   * Create a new contract
   */
  async createContract(data: Partial<IContract>): Promise<IContract> {
    try {
      const contract = new Contract(data);
      await contract.save();
      contractsCreated.inc();
      logger.info('Contract created', { contractId: contract._id });
      return contract;
    } catch (error) {
      logger.error('Failed to create contract', { error, data });
      throw error;
    }
  }

  /**
   * Get contract by ID
   */
  async getContractById(id: string): Promise<IContract | null> {
    return Contract.findById(id).exec();
  }

  /**
   * Get contracts by influencer
   */
  async getContractsByInfluencer(influencerId: string): Promise<IContract[]> {
    return Contract.find({ influencerId })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Get contracts by brand
   */
  async getContractsByBrand(brandId: string): Promise<IContract[]> {
    return Contract.find({ brandId })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Get contracts by campaign
   */
  async getContractsByCampaign(campaignId: string): Promise<IContract[]> {
    return Contract.find({ campaignId })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Update contract
   */
  async updateContract(id: string, data: Partial<IContract>): Promise<IContract | null> {
    return Contract.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  /**
   * Send contract for signature
   */
  async sendContract(id: string): Promise<IContract | null> {
    return Contract.findByIdAndUpdate(
      id,
      {
        status: 'sent',
        sentAt: new Date()
      },
      { new: true }
    ).exec();
  }

  /**
   * Sign contract
   */
  async signContract(
    contractId: string,
    signerData: {
      signerId: string;
      signerName: string;
      signerEmail: string;
      signerRole: 'brand' | 'influencer' | 'witness';
      signatureData?: string;
      signatureType?: 'typed' | 'drawn' | 'uploaded' | 'digital';
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<{ contract: IContract; signature: any }> {
    try {
      const contract = await Contract.findById(contractId).exec();
      if (!contract) throw new Error('Contract not found');

      // Create signature record
      const signature = new Signature({
        ...signerData,
        signedAt: new Date(),
        verificationStatus: 'verified'
      });
      await signature.save();

      // Update contract with signature
      const signatures = [...(contract.signatures || []), {
        signerId: signerData.signerId,
        signerName: signerData.signerName,
        signerEmail: signerData.signerEmail,
        signerRole: signerData.signerRole,
        signedAt: new Date(),
        ipAddress: signerData.ipAddress,
        userAgent: signerData.userAgent
      }];

      // Check if all required parties have signed
      const hasInfluencerSigned = signatures.some(s => s.signerRole === 'influencer');
      const hasBrandSigned = signatures.some(s => s.signerRole === 'brand');

      let status = 'negotiating';
      if (hasInfluencerSigned && hasBrandSigned) {
        status = 'signed';
        contractsSigned.inc();
      } else if (hasInfluencerSigned || hasBrandSigned) {
        status = 'viewed';
      }

      const updatedContract = await Contract.findByIdAndUpdate(
        contractId,
        {
          signatures,
          status,
          signedAt: status === 'signed' ? new Date() : undefined
        },
        { new: true }
      ).exec();

      logger.info('Contract signed', { contractId, signerId: signerData.signerId });

      return { contract: updatedContract!, signature };
    } catch (error) {
      logger.error('Failed to sign contract', { error, contractId });
      throw error;
    }
  }

  /**
   * Get contract status
   */
  async getContractStatus(id: string): Promise<any> {
    const contract = await Contract.findById(id).exec();
    if (!contract) throw new Error('Contract not found');

    const signatures = contract.signatures || [];
    return {
      contractId: contract._id,
      status: contract.status,
      title: contract.title,
      type: contract.type,
      validFrom: contract.validFrom,
      validUntil: contract.validUntil,
      signatures: signatures.map(s => ({
        signerRole: s.signerRole,
        signerName: s.signerName,
        signed: !!s.signedAt,
        signedAt: s.signedAt
      })),
      pendingSignatures: signatures.filter(s => !s.signedAt).map(s => s.signerRole),
      isFullySigned: signatures.length >= 2 &&
        signatures.every(s => s.signedAt)
    };
  }

  /**
   * Add document to contract
   */
  async addDocument(
    contractId: string,
    documentData: {
      name: string;
      type: 'contract' | 'nda' | 'amendment' | 'addendum' | 'attachment' | 'other';
      mimeType: string;
      size: number;
      url: string;
      uploadedBy: string;
      checksum?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<any> {
    const document = new ContractDocument({
      ...documentData,
      contractId,
      uploadedAt: new Date()
    });
    await document.save();

    // Update contract with document reference
    await Contract.findByIdAndUpdate(contractId, {
      $push: {
        documents: {
          name: documentData.name,
          type: documentData.type,
          url: documentData.url,
          uploadedAt: new Date()
        }
      }
    });

    logger.info('Document added to contract', { contractId, documentId: document._id });
    return document;
  }

  /**
   * Get contract documents
   */
  async getContractDocuments(contractId: string): Promise<any[]> {
    return ContractDocument.find({ contractId })
      .sort({ uploadedAt: -1 })
      .exec();
  }

  /**
   * Request contract changes
   */
  async requestChanges(
    contractId: string,
    changedBy: string,
    changes: string
  ): Promise<IContract | null> {
    return Contract.findByIdAndUpdate(
      contractId,
      {
        status: 'negotiating',
        $push: {
          negotiationHistory: {
            changedBy,
            changedAt: new Date(),
            changes
          }
        }
      },
      { new: true }
    ).exec();
  }

  /**
   * Terminate contract
   */
  async terminateContract(id: string, reason?: string): Promise<IContract | null> {
    return Contract.findByIdAndUpdate(
      id,
      {
        status: 'terminated',
        expiresAt: new Date()
      },
      { new: true }
    ).exec();
  }

  /**
   * Delete contract
   */
  async deleteContract(id: string): Promise<boolean> {
    const result = await Contract.findByIdAndDelete(id).exec();
    if (result) {
      await Promise.all([
        Signature.deleteMany({ contractId: id }).exec(),
        ContractDocument.deleteMany({ contractId: id }).exec()
      ]);
    }
    return !!result;
  }
}

export const contractService = new ContractService();

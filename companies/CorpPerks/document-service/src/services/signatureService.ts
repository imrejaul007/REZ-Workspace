import { v4 as uuidv4 } from 'uuid';
import { ESignatureModel, GeneratedDocumentModel } from '../models';
import { documentService } from './documentService';
import {
  RequestSignatureInput,
  SignDocumentInput,
  RejectSignatureInput,
  SignatureQueryInput,
} from '../validators';
import { PaginatedResponse, ESignature, SignatureStatus, DocumentStatus } from '../types';

export class SignatureService {
  /**
   * Request signature on a document
   */
  async requestSignature(
    input: RequestSignatureInput,
    userId: string,
    userName: string,
    companyId: string
  ): Promise<ESignature> {
    // Verify document exists
    const document = await documentService.getById(input.documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    // Check if already has pending signature
    const existing = await ESignatureModel.findOne({
      documentId: input.documentId,
      status: SignatureStatus.PENDING,
    });
    if (existing) {
      throw new Error('Document already has pending signature request');
    }

    // Create signature request
    const signatureId = `sig_${uuidv4()}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (input.expiresInDays || 7));

    // Sort signers by order
    const signers = [...input.signers].sort((a, b) => (a.order || 0) - (b.order || 0));

    const signature = new ESignatureModel({
      signatureId,
      documentId: input.documentId,
      documentTitle: document.title,
      companyId,
      signers: signers.map((s) => ({
        signerId: `signer_${uuidv4()}`,
        userId: s.userId,
        name: s.name,
        email: s.email,
        role: s.role,
        order: s.order || 1,
        status: SignatureStatus.PENDING,
      })),
      status: SignatureStatus.PENDING,
      currentSignerOrder: 1,
      expiresAt,
      reminderCount: 0,
      createdById: userId,
      createdByName: userName,
    });

    await signature.save();

    // Update document status
    await documentService.updateStatus(
      input.documentId,
      DocumentStatus.PENDING_SIGNATURE
    );

    return signature.toObject() as unknown as ESignature;
  }

  /**
   * Sign a document
   */
  async sign(
    input: SignDocumentInput,
    ipAddress?: string,
    userAgent?: string
  ): Promise<ESignature> {
    const signature = await ESignatureModel.sign(
      input.signatureId,
      input.userId,
      input.signatureImageUrl,
      ipAddress,
      userAgent
    );

    if (!signature) {
      throw new Error('Signature request not found');
    }

    // Update document status if fully signed
    if (signature.status === SignatureStatus.SIGNED) {
      await documentService.updateStatus(signature.documentId, DocumentStatus.SIGNED, {
        signedAt: signature.signedAt,
        signedById: input.userId,
      });
    } else if (signature.status === SignatureStatus.PENDING) {
      await documentService.updateStatus(signature.documentId, DocumentStatus.PARTIALLY_SIGNED);
    }

    return signature.toObject() as unknown as ESignature;
  }

  /**
   * Reject a signature request
   */
  async reject(
    input: RejectSignatureInput,
    ipAddress?: string,
    userAgent?: string
  ): Promise<ESignature> {
    const signature = await ESignatureModel.reject(
      input.signatureId,
      input.userId,
      input.reason,
      ipAddress,
      userAgent
    );

    if (!signature) {
      throw new Error('Signature request not found');
    }

    // Update document status
    await documentService.updateStatus(
      signature.documentId,
      DocumentStatus.REJECTED
    );

    return signature.toObject() as unknown as ESignature;
  }

  /**
   * Get signature by ID
   */
  async getById(signatureId: string): Promise<ESignature | null> {
    const signature = await ESignatureModel.findOne({ signatureId });
    return signature?.toObject() as unknown as ESignature || null;
  }

  /**
   * Get signature by document ID
   */
  async getByDocument(documentId: string): Promise<ESignature[]> {
    const signatures = await ESignatureModel.findByDocument(documentId);
    return signatures.map((s) => s.toObject() as unknown as ESignature);
  }

  /**
   * Get pending signatures for user
   */
  async getPendingForUser(userId: string): Promise<ESignature[]> {
    const signatures = await ESignatureModel.findPendingForUser(userId);
    return signatures.map((s) => s.toObject() as unknown as ESignature);
  }

  /**
   * List signatures with filters
   */
  async list(query: SignatureQueryInput): Promise<PaginatedResponse<ESignature>> {
    const filter: Record<string, unknown> = {};

    if (query.companyId) filter.companyId = query.companyId;
    if (query.documentId) filter.documentId = query.documentId;
    if (query.status) filter.status = query.status;

    if (query.userId) {
      filter['signers.userId'] = query.userId;
    }

    if (query.fromDate || query.toDate) {
      filter.createdAt = {};
      if (query.fromDate) (filter.createdAt as Record<string, Date>).$gte = new Date(query.fromDate);
      if (query.toDate) (filter.createdAt as Record<string, Date>).$lte = new Date(query.toDate);
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [signatures, total] = await Promise.all([
      ESignatureModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ESignatureModel.countDocuments(filter),
    ]);

    return {
      data: signatures.map((s) => s.toObject() as unknown as ESignature),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + signatures.length < total,
      },
    };
  }

  /**
   * Send reminder for signature
   */
  async sendReminder(signatureId: string): Promise<ESignature | null> {
    const signature = await ESignatureModel.incrementReminder(signatureId);
    return signature?.toObject() as unknown as ESignature || null;
  }

  /**
   * Cancel signature request
   */
  async cancel(signatureId: string): Promise<ESignature | null> {
    const signature = await ESignatureModel.findOneAndUpdate(
      { signatureId, status: SignatureStatus.PENDING },
      { status: 'revoked' as any },
      { new: true }
    );

    if (signature) {
      await documentService.updateStatus(
        signature.documentId,
        DocumentStatus.DRAFT
      );
    }

    return signature?.toObject() as unknown as ESignature || null;
  }

  /**
   * Expire old signatures (cleanup job)
   */
  async expireOldSignatures(): Promise<number> {
    const expiredCount = await ESignatureModel.expireOldSignatures();

    // Update documents for expired signatures
    const expiredSignatures = await ESignatureModel.find({
      status: SignatureStatus.EXPIRED,
    });

    for (const sig of expiredSignatures) {
      await documentService.updateStatus(sig.documentId, DocumentStatus.EXPIRED);
    }

    return expiredCount;
  }

  /**
   * Get signature statistics
   */
  async getStats(companyId: string): Promise<{
    total: number;
    pending: number;
    signed: number;
    rejected: number;
    expired: number;
    avgSignTime: number;
  }> {
    const result = await ESignatureModel.aggregate([
      { $match: { companyId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', SignatureStatus.PENDING] }, 1, 0] },
          },
          signed: {
            $sum: { $cond: [{ $eq: ['$status', SignatureStatus.SIGNED] }, 1, 0] },
          },
          rejected: {
            $sum: { $cond: [{ $eq: ['$status', SignatureStatus.REJECTED] }, 1, 0] },
          },
          expired: {
            $sum: { $cond: [{ $eq: ['$status', SignatureStatus.EXPIRED] }, 1, 0] },
          },
          totalTime: {
            $sum: {
              $cond: [
                { $and: ['$signedAt', '$createdAt'] },
                { $subtract: ['$signedAt', '$createdAt'] },
                0,
              ],
            },
          },
          signedCount: {
            $sum: { $cond: [{ $eq: ['$status', SignatureStatus.SIGNED] }, 1, 0] },
          },
        },
      },
    ]);

    if (result.length === 0) {
      return { total: 0, pending: 0, signed: 0, rejected: 0, expired: 0, avgSignTime: 0 };
    }

    const r = result[0];
    return {
      total: r.total,
      pending: r.pending,
      signed: r.signed,
      rejected: r.rejected,
      expired: r.expired,
      avgSignTime: r.signedCount > 0 ? (r.totalTime / r.signedCount / (1000 * 60 * 60)) : 0,
    };
  }
}

export const signatureService = new SignatureService();

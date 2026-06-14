import { v4 as uuidv4 } from 'uuid';
import { DocumentModel, IDocument, DocumentType, DocumentStatus } from '../models/Document';
import logger from 'utils/logger.js';

export interface UploadDocumentInput {
  partnerId: string;
  type: DocumentType;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  metadata?: Record<string, unknown>;
}

class DocumentService {
  /**
   * Upload a document
   */
  async uploadDocument(input: UploadDocumentInput): Promise<IDocument> {
    const documentId = `doc-${uuidv4().slice(0, 12)}`;

    // Check if document of same type already exists
    const existing = await DocumentModel.findOne({
      partnerId: input.partnerId,
      type: input.type,
      status: { $ne: 'rejected' },
    });

    if (existing) {
      // Update existing document
      existing.fileName = input.fileName;
      existing.fileUrl = input.fileUrl;
      existing.fileSize = input.fileSize;
      existing.mimeType = input.mimeType;
      existing.status = 'uploaded';
      existing.uploadedAt = new Date();
      existing.metadata = input.metadata;
      await existing.save();

      logger.info('Document updated', { documentId: existing.documentId, type: input.type });
      return existing;
    }

    const document = new DocumentModel({
      documentId,
      partnerId: input.partnerId,
      type: input.type,
      status: 'uploaded',
      fileName: input.fileName,
      fileUrl: input.fileUrl,
      fileSize: input.fileSize,
      mimeType: input.mimeType,
      uploadedAt: new Date(),
      metadata: input.metadata,
    });

    await document.save();
    logger.info('Document uploaded', { documentId, partnerId: input.partnerId, type: input.type });

    return document;
  }

  /**
   * Get document by ID
   */
  async getDocument(documentId: string): Promise<IDocument | null> {
    return DocumentModel.findOne({ documentId });
  }

  /**
   * Get documents by partner
   */
  async getDocumentsByPartner(
    partnerId: string,
    options: { type?: DocumentType; status?: DocumentStatus } = {}
  ): Promise<IDocument[]> {
    const query: Record<string, unknown> = { partnerId };
    if (options.type) query.type = options.type;
    if (options.status) query.status = options.status;

    return DocumentModel.find(query).sort({ uploadedAt: -1 });
  }

  /**
   * Verify document
   */
  async verifyDocument(
    documentId: string,
    verifiedBy: string
  ): Promise<IDocument | null> {
    const document = await DocumentModel.findOneAndUpdate(
      { documentId },
      {
        $set: {
          status: 'verified',
          verifiedAt: new Date(),
          verifiedBy,
        },
      },
      { new: true }
    );

    if (document) {
      logger.info('Document verified', { documentId, verifiedBy });
    }

    return document;
  }

  /**
   * Reject document
   */
  async rejectDocument(
    documentId: string,
    reason: string,
    rejectedBy: string
  ): Promise<IDocument | null> {
    const document = await DocumentModel.findOneAndUpdate(
      { documentId },
      {
        $set: {
          status: 'rejected',
          rejectionReason: reason,
          verifiedBy: rejectedBy,
        },
      },
      { new: true }
    );

    if (document) {
      logger.info('Document rejected', { documentId, reason, rejectedBy });
    }

    return document;
  }

  /**
   * Delete document
   */
  async deleteDocument(documentId: string): Promise<boolean> {
    const result = await DocumentModel.deleteOne({ documentId });
    return result.deletedCount > 0;
  }

  /**
   * Get document types summary for partner
   */
  async getDocumentTypesSummary(partnerId: string): Promise<{
    total: number;
    verified: number;
    pending: number;
    rejected: number;
    types: Array<{
      type: DocumentType;
      status: DocumentStatus;
      documentId: string;
    }>;
  }> {
    const documents = await DocumentModel.find({ partnerId });

    const summary = {
      total: documents.length,
      verified: 0,
      pending: 0,
      rejected: 0,
      types: [] as Array<{ type: DocumentType; status: DocumentStatus; documentId: string }>,
    };

    for (const doc of documents) {
      if (doc.status === 'verified') summary.verified++;
      else if (doc.status === 'pending' || doc.status === 'uploaded') summary.pending++;
      else if (doc.status === 'rejected') summary.rejected++;

      summary.types.push({
        type: doc.type,
        status: doc.status,
        documentId: doc.documentId,
      });
    }

    return summary;
  }

  /**
   * Check if partner has all required documents
   */
  async checkRequiredDocuments(
    partnerId: string,
    requiredTypes: DocumentType[]
  ): Promise<{
    complete: boolean;
    missing: DocumentType[];
    uploaded: DocumentType[];
  }> {
    const documents = await DocumentModel.find({
      partnerId,
      status: { $in: ['uploaded', 'verified'] },
    });

    const uploadedTypes = documents.map((d) => d.type);
    const missing = requiredTypes.filter((t) => !uploadedTypes.includes(t));

    return {
      complete: missing.length === 0,
      missing,
      uploaded: uploadedTypes as DocumentType[],
    };
  }
}

export const documentService = new DocumentService();
export default documentService;
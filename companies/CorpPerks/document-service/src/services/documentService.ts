import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { GeneratedDocumentModel } from '../models';
import { ESignatureModel } from '../models';
import { templateService } from './templateService';
import { renderTemplate, validateTemplateData, generatePDF, saveFile } from '../utils';
import { GenerateDocumentInput, DocumentQueryInput } from '../validators';
import {
  PaginatedResponse,
  GeneratedDocument,
  DocumentStatus,
  SignatureStatus,
} from '../types';

export class DocumentService {
  /**
   * Generate a document from a template
   */
  async generate(
    input: GenerateDocumentInput,
    userId: string,
    userName: string,
    companyId: string
  ): Promise<GeneratedDocument> {
    // Get template
    const template = await templateService.getById(input.templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Validate data against template variables
    const validation = validateTemplateData(template.variables, input.data);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Render template
    const content = renderTemplate(template.content, input.data as Record<string, unknown>);

    // Generate document
    const documentId = `doc_${uuidv4()}`;
    const title = input.title || `${template.name} - ${input.employeeName}`;

    // Parse joining date if present for metadata
    const metadata: Record<string, unknown> = {};
    if (input.data.joiningDate) {
      metadata.joiningDate = input.data.joiningDate;
    }
    if (input.data.department) {
      metadata.department = input.data.department;
    }
    if (input.data.designation) {
      metadata.designation = input.data.designation;
    }
    if (input.data.salary) {
      metadata.salary = input.data.salary;
    }
    if (input.data.managerName) {
      metadata.managerName = input.data.managerName;
    }

    const document = new GeneratedDocumentModel({
      documentId,
      templateId: template.templateId,
      templateName: template.name,
      templateType: template.type,
      employeeId: input.employeeId,
      employeeName: input.employeeName,
      companyId,
      title,
      data: input.data as any,
      content,
      status: input.sendForSignature ? DocumentStatus.PENDING_SIGNATURE : DocumentStatus.DRAFT,
      metadata,
      createdById: userId,
      createdByName: userName,
    });

    await document.save();

    // If signature requested, create signature record
    if (input.sendForSignature && input.signers && input.signers.length > 0) {
      const signatureId = `sig_${uuidv4()}`;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Default 7 days

      const signature = new ESignatureModel({
        signatureId,
        documentId,
        documentTitle: title,
        companyId,
        signers: input.signers.map((s, idx) => ({
          signerId: `signer_${uuidv4()}`,
          userId: s.userId,
          name: s.name,
          email: s.email,
          role: s.role,
          order: s.order || idx + 1,
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
    }

    return document.toObject() as unknown as GeneratedDocument;
  }

  /**
   * Get document by ID
   */
  async getById(documentId: string): Promise<GeneratedDocument | null> {
    const document = await GeneratedDocumentModel.findOne({ documentId });
    return document?.toObject() as unknown as GeneratedDocument || null;
  }

  /**
   * List documents with filters
   */
  async list(query: DocumentQueryInput): Promise<PaginatedResponse<GeneratedDocument>> {
    const filter: Record<string, unknown> = {};

    if (query.companyId) filter.companyId = query.companyId;
    if (query.templateId) filter.templateId = query.templateId;
    if (query.employeeId) filter.employeeId = query.employeeId;
    if (query.status) filter.status = query.status;
    if (query.type) filter.templateType = query.type;

    if (query.fromDate || query.toDate) {
      filter.createdAt = {};
      if (query.fromDate) (filter.createdAt as Record<string, Date>).$gte = new Date(query.fromDate);
      if (query.toDate) (filter.createdAt as Record<string, Date>).$lte = new Date(query.toDate);
    }

    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { employeeName: { $regex: query.search, $options: 'i' } },
      ];
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

    const [documents, total] = await Promise.all([
      GeneratedDocumentModel.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit),
      GeneratedDocumentModel.countDocuments(filter),
    ]);

    return {
      data: documents.map((d) => d.toObject() as unknown as GeneratedDocument),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + documents.length < total,
      },
    };
  }

  /**
   * Get documents by employee
   */
  async getByEmployee(
    employeeId: string,
    options?: {
      status?: DocumentStatus;
      page?: number;
      limit?: number;
    }
  ): Promise<PaginatedResponse<GeneratedDocument>> {
    const result = await GeneratedDocumentModel.findByEmployee(employeeId, {
      status: options?.status,
      page: options?.page,
      limit: options?.limit,
    });

    const page = options?.page || 1;
    const limit = options?.limit || 20;

    return {
      data: result.documents.map((d) => d.toObject() as unknown as GeneratedDocument),
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
        hasMore: (page - 1) * limit + result.documents.length < result.total,
      },
    };
  }

  /**
   * Generate PDF for document
   */
  async generatePDF(documentId: string): Promise<string> {
    const document = await GeneratedDocumentModel.findOne({ documentId });
    if (!document) {
      throw new Error('Document not found');
    }

    const pdfBuffer = await generatePDF(document.content, document.title);
    const storagePath = process.env.STORAGE_PATH || './uploads';
    const filename = `${documentId}.pdf`;
    await saveFile(pdfBuffer, filename, path.join(storagePath, 'documents'));

    // Update document with PDF URL
    const pdfUrl = `/documents/${filename}`;
    await GeneratedDocumentModel.updateStatus(documentId, document.status as DocumentStatus, { pdfUrl });

    return pdfUrl;
  }

  /**
   * Update document status
   */
  async updateStatus(
    documentId: string,
    status: DocumentStatus,
    additionalFields?: Partial<GeneratedDocument>
  ): Promise<GeneratedDocument | null> {
    const additionalDbFields = additionalFields ? {
      ...additionalFields,
      _id: undefined,
    } : undefined;
    const document = await GeneratedDocumentModel.updateStatus(documentId, status, additionalDbFields as any);
    return document?.toObject() as unknown as GeneratedDocument || null;
  }

  /**
   * Delete document
   */
  async delete(documentId: string): Promise<boolean> {
    const result = await GeneratedDocumentModel.deleteOne({ documentId });
    return result.deletedCount > 0;
  }

  /**
   * Get document statistics
   */
  async getStats(companyId: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
  }> {
    const [total, byStatusResult, byTypeResult] = await Promise.all([
      GeneratedDocumentModel.countDocuments({ companyId }),
      GeneratedDocumentModel.aggregate([
        { $match: { companyId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      GeneratedDocumentModel.aggregate([
        { $match: { companyId } },
        { $group: { _id: '$templateType', count: { $sum: 1 } } },
      ]),
    ]);

    const byStatus: Record<string, number> = {};
    byStatusResult.forEach((r: { _id: string; count: number }) => {
      byStatus[r._id] = r.count;
    });

    const byType: Record<string, number> = {};
    byTypeResult.forEach((r: { _id: string; count: number }) => {
      byType[r._id] = r.count;
    });

    return { total, byStatus, byType };
  }
}

export const documentService = new DocumentService();

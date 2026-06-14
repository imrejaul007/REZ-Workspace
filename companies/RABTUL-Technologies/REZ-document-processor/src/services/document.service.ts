import { v4 as uuid } from 'uuid';
import { Document, DocumentMetadata, DocumentSection, ExtractedEntity, ProcessingJob, ProcessedResult, TableData } from '../models/document';
import logger from '../utils/logger';

// In-memory storage
const documents: Map<string, Document> = new Map();
const jobs: Map<string, ProcessingJob> = new Map();

// MIME type to extension mapping
const mimeToExt: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'doc',
  'text/plain': 'txt',
  'text/html': 'html',
};

export const createDocument = (
  filename: string,
  mimeType: string,
  size: number,
  content?: Buffer
): Document => {
  const id = `doc_${uuid()}`;
  const now = new Date().toISOString();

  const doc: Document = {
    id,
    filename,
    mimeType,
    size,
    status: 'pending',
    metadata: {
      language: 'en',
    },
    sections: [],
    entities: [],
    createdAt: now,
  };

  documents.set(id, doc);
  logger.info(`Document created: ${id} (${filename})`);

  return doc;
};

export const getDocument = (id: string): Document | undefined => {
  return documents.get(id);
};

export const processDocument = async (
  id: string,
  operations: ('extract_text' | 'extract_tables' | 'extract_entities' | 'summarize')[] = ['extract_text']
): Promise<ProcessedResult | null> => {
  const doc = documents.get(id);
  if (!doc) {
    logger.error(`Document not found: ${id}`);
    return null;
  }

  doc.status = 'processing';
  const jobId = `job_${uuid()}`;

  const job: ProcessingJob = {
    id: jobId,
    documentId: id,
    status: 'queued',
    operations: operations.map(op => ({ type: op, status: 'pending' as const })),
  };
  jobs.set(jobId, job);

  logger.info(`Processing document ${id} with operations: ${operations.join(', ')}`);

  // Simulate processing
  job.status = 'processing';
  job.startedAt = new Date().toISOString();
  doc.status = 'processing';

  const results: ProcessedResult = {
    document: doc,
    text: '',
    tables: [],
    entities: [],
  };

  for (const op of operations) {
    const jobOp = job.operations.find(o => o.type === op);
    if (jobOp) {
      jobOp.status = 'processing';
      try {
        // Simulate different extraction types
        switch (op) {
          case 'extract_text':
            results.text = await simulateTextExtraction(doc);
            doc.extractedText = results.text;
            break;
          case 'extract_tables':
            results.tables = await simulateTableExtraction(doc);
            break;
          case 'extract_entities':
            results.entities = await simulateEntityExtraction(doc, results.text);
            doc.entities = results.entities;
            break;
          case 'summarize':
            results.summary = await simulateSummarization(doc, results.text);
            doc.summary = results.summary;
            break;
        }
        jobOp.status = 'completed';
      } catch (error: any) {
        jobOp.status = 'failed';
        jobOp.error = error.message;
        logger.error(`Operation ${op} failed for ${id}:`, error);
      }
    }
  }

  job.status = 'completed';
  job.completedAt = new Date().toISOString();
  doc.status = 'completed';
  doc.completedAt = new Date().toISOString();

  // Extract sections from text
  doc.sections = extractSections(results.text);

  logger.info(`Document ${id} processing completed`);
  return results;
};

// Simulated extraction functions (replace with actual libraries in production)
async function simulateTextExtraction(doc: Document): Promise<string> {
  // In production, use pdf-parse, mammoth, etc.
  return `[Extracted text from ${doc.filename}]\n\nThis is sample extracted content. In production, this would contain the actual text extracted from ${doc.mimeType} files using proper parsing libraries.`;
}

async function simulateTableExtraction(doc: Document): Promise<TableData[]> {
  // In production, use pdf-table-extract, tabula-java, etc.
  return [
    {
      headers: ['Column 1', 'Column 2', 'Column 3'],
      rows: [
        ['Row 1 Col 1', 'Row 1 Col 2', 'Row 1 Col 3'],
        ['Row 2 Col 1', 'Row 2 Col 2', 'Row 2 Col 3'],
      ],
    },
  ];
}

async function simulateEntityExtraction(doc: Document, text: string): Promise<ExtractedEntity[]> {
  // In production, use NLP libraries like spaCy, Stanford NER, or cloud APIs
  const entities: ExtractedEntity[] = [
    {
      type: 'date',
      value: 'June 15, 2026',
      confidence: 0.95,
      startIndex: 0,
      endIndex: 14,
    },
    {
      type: 'money',
      value: '$10,000',
      confidence: 0.92,
      startIndex: 20,
      endIndex: 28,
    },
    {
      type: 'organization',
      value: 'ACME Corp',
      confidence: 0.88,
      startIndex: 40,
      endIndex: 49,
    },
  ];
  return entities;
}

async function simulateSummarization(doc: Document, text: string): Promise<string> {
  // In production, use summarization models like BERT, GPT, or cloud APIs
  return 'This document contains important information about the subject matter. Key points include dates, monetary values, and organizational references. Full analysis requires complete text extraction and human review.';
}

function extractSections(text: string): DocumentSection[] {
  const sections: DocumentSection[] = [
    {
      id: `sec_${uuid()}`,
      title: 'Document Content',
      content: text.substring(0, 500) + (text.length > 500 ? '...' : ''),
      type: 'paragraph',
    },
  ];
  return sections;
}

export const getDocumentSections = (id: string): DocumentSection[] | undefined => {
  const doc = documents.get(id);
  return doc?.sections;
};

export const getDocumentEntities = (id: string): ExtractedEntity[] | undefined => {
  const doc = documents.get(id);
  return doc?.entities;
};

export const searchDocuments = (query: string): Document[] => {
  const q = query.toLowerCase();
  return Array.from(documents.values()).filter(
    doc =>
      doc.filename.toLowerCase().includes(q) ||
      doc.extractedText?.toLowerCase().includes(q) ||
      doc.summary?.toLowerCase().includes(q)
  );
};

export const getJob = (jobId: string): ProcessingJob | undefined => {
  return jobs.get(jobId);
};

export const getDocumentStats = () => {
  const docs = Array.from(documents.values());
  return {
    total: docs.length,
    pending: docs.filter(d => d.status === 'pending').length,
    processing: docs.filter(d => d.status === 'processing').length,
    completed: docs.filter(d => d.status === 'completed').length,
    failed: docs.filter(d => d.status === 'failed').length,
    totalSize: docs.reduce((sum, d) => sum + d.size, 0),
  };
};

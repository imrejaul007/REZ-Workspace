export interface Document {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  extractedText?: string;
  metadata: DocumentMetadata;
  sections: DocumentSection[];
  entities: ExtractedEntity[];
  summary?: string;
  createdAt: string;
  completedAt?: string;
  error?: string;
}

export interface DocumentMetadata {
  title?: string;
  author?: string;
  createdDate?: string;
  modifiedDate?: string;
  pageCount?: number;
  wordCount?: number;
  language?: string;
  fileHash?: string;
}

export interface DocumentSection {
  id: string;
  title?: string;
  content: string;
  pageNumber?: number;
  level?: number;
  type: 'heading' | 'paragraph' | 'table' | 'list' | 'image' | 'other';
  children?: DocumentSection[];
}

export interface ExtractedEntity {
  type: 'person' | 'organization' | 'date' | 'money' | 'location' | 'email' | 'phone' | 'url' | 'custom';
  value: string;
  confidence: number;
  startIndex: number;
  endIndex: number;
  metadata?: Record<string, any>;
}

export interface ProcessingJob {
  id: string;
  documentId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  operations: ProcessingOperation[];
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export interface ProcessingOperation {
  type: 'extract_text' | 'extract_tables' | 'extract_entities' | 'summarize' | 'classify' | 'translate';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

export interface ProcessedResult {
  document: Document;
  text: string;
  tables: TableData[];
  entities: ExtractedEntity[];
  summary?: string;
  keywords?: string[];
  sentiment?: { score: number; label: string };
}

export interface TableData {
  headers: string[];
  rows: string[][];
  pageNumber?: number;
}

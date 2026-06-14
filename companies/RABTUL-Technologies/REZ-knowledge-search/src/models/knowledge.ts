export interface KnowledgeDocument {
  id: string;
  content: string;
  metadata: DocumentMetadata;
  embedding?: number[];
  createdAt: string;
  updatedAt: string;
}

export interface DocumentMetadata {
  source: string;
  title?: string;
  type: 'text' | 'pdf' | 'web' | 'api' | 'document';
  tags: string[];
  category?: string;
  author?: string;
  language?: string;
  url?: string;
  userId?: string;
  companyId?: string;
}

export interface SearchResult {
  id: string;
  content: string;
  score: number;
  metadata: DocumentMetadata;
  highlights?: string[];
}

export interface SearchQuery {
  query: string;
  filters?: {
    source?: string;
    type?: string;
    tags?: string[];
    category?: string;
    userId?: string;
    companyId?: string;
    dateFrom?: string;
    dateTo?: string;
  };
  limit?: number;
  offset?: number;
  hybrid?: boolean;
  rerank?: boolean;
}

export interface KnowledgeIndex {
  id: string;
  name: string;
  description?: string;
  documentCount: number;
  dimension: number;
  createdAt: string;
  updatedAt: string;
}

export interface IndexStats {
  totalDocuments: number;
  totalChunks: number;
  indexSize: number;
  lastUpdated: string;
}

export interface RerankResult {
  id: string;
  score: number;
  reason?: string;
}

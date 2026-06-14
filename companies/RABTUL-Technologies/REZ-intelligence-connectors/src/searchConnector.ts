/**
 * Search Service - Event Connector
 *
 * Hook into search service to emit events
 */

import { eventConnector } from './eventConnectors';

export interface SearchConnector {
  /**
   * Hook: Search performed
   */
  onSearchPerformed(search: {
    userId?: string;
    query: string;
    resultsCount: number;
    filters?: Record<string, unknown>;
    sortBy?: string;
    searchType: 'text' | 'voice' | 'image' | 'barcode';
    sessionId?: string;
  }): void;

  /**
   * Hook: Search no results
   */
  onSearchNoResults(search: {
    userId?: string;
    query: string;
    searchType: string;
  }): void;

  /**
   * Hook: Search refined
   */
  onSearchRefined(search: {
    userId?: string;
    originalQuery: string;
    refinedQuery: string;
    resultsCount: number;
    sessionId: string;
  }): void;

  /**
   * Hook: Autocomplete used
   */
  onAutocompleteUsed(search: {
    userId?: string;
    query: string;
    suggestion: string;
    selected: boolean;
    sessionId?: string;
  }): void;

  /**
   * Hook: Voice search used
   */
  onVoiceSearchUsed(search: {
    userId?: string;
    transcript: string;
    confidence: number;
    resultsCount: number;
  }): void;

  /**
   * Hook: Filter applied
   */
  onFilterApplied(search: {
    userId?: string;
    query: string;
    filters: Record<string, unknown>;
    resultsBefore: number;
    resultsAfter: number;
    sessionId: string;
  }): void;

  /**
   * Hook: Sort applied
   */
  onSortApplied(search: {
    userId?: string;
    query: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    sessionId: string;
  }): void;
}

export function createSearchConnector(): SearchConnector {
  return {
    onSearchPerformed: (search) => {
      eventConnector.emit('search.performed', {
        query: search.query,
        resultsCount: search.resultsCount,
        filters: search.filters,
        sortBy: search.sortBy,
        searchType: search.searchType,
        sessionId: search.sessionId,
        searchedAt: new Date().toISOString()
      }, {
        userId: search.userId,
        correlationId: search.sessionId
      });
    },

    onSearchNoResults: (search) => {
      eventConnector.emit('search.no_results', {
        query: search.query,
        searchType: search.searchType,
        occurredAt: new Date().toISOString()
      }, {
        userId: search.userId
      });
    },

    onSearchRefined: (search) => {
      eventConnector.emit('search.refined', {
        originalQuery: search.originalQuery,
        refinedQuery: search.refinedQuery,
        resultsCount: search.resultsCount,
        sessionId: search.sessionId,
        refinedAt: new Date().toISOString()
      }, {
        userId: search.userId,
        correlationId: search.sessionId
      });
    },

    onAutocompleteUsed: (search) => {
      eventConnector.emit('search.autocomplete.used', {
        query: search.query,
        suggestion: search.suggestion,
        selected: search.selected,
        sessionId: search.sessionId,
        usedAt: new Date().toISOString()
      }, {
        userId: search.userId,
        correlationId: search.sessionId
      });
    },

    onVoiceSearchUsed: (search) => {
      eventConnector.emit('search.voice.used', {
        transcript: search.transcript,
        confidence: search.confidence,
        resultsCount: search.resultsCount,
        usedAt: new Date().toISOString()
      }, {
        userId: search.userId
      });
    },

    onFilterApplied: (search) => {
      eventConnector.emit('search.filter.applied', {
        query: search.query,
        filters: search.filters,
        resultsBefore: search.resultsBefore,
        resultsAfter: search.resultsAfter,
        sessionId: search.sessionId,
        appliedAt: new Date().toISOString()
      }, {
        userId: search.userId,
        correlationId: search.sessionId
      });
    },

    onSortApplied: (search) => {
      eventConnector.emit('search.sort.applied', {
        query: search.query,
        sortBy: search.sortBy,
        sortOrder: search.sortOrder,
        sessionId: search.sessionId,
        appliedAt: new Date().toISOString()
      }, {
        userId: search.userId,
        correlationId: search.sessionId
      });
    }
  };
}

export const searchConnector = createSearchConnector();
export default searchConnector;

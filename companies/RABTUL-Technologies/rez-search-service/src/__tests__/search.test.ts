/**
 * Search Service Tests
 * Tests for full-text search, autocomplete, and relevance scoring
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Types
interface SearchableItem {
  id: string;
  type: string;
  title: string;
  description: string;
  tags: string[];
  score?: number;
}

// Tokenization
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 0);
}

// TF-IDF scoring (simplified)
function calculateScore(
  queryTokens: string[],
  textTokens: string[],
  documentFrequency: Map<string, number>,
  totalDocuments: number
): number {
  if (queryTokens.length === 0 || textTokens.length === 0) return 0;

  let score = 0;
  const textTokenSet = new Set(textTokens);

  for (const queryToken of queryTokens) {
    if (textTokenSet.has(queryToken)) {
      const tf = textTokens.filter(t => t === queryToken).length / textTokens.length;
      const df = documentFrequency.get(queryToken) || 1;
      const idf = Math.log(totalDocuments / df);
      score += tf * idf;
    }
  }

  return score;
}

// Fuzzy matching
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

function fuzzyMatch(query: string, text: string, maxDistance: number = 2): boolean {
  const queryTokens = tokenize(query);
  const textTokens = tokenize(text);

  for (const qt of queryTokens) {
    for (const tt of textTokens) {
      if (qt === tt) return true;
      if (levenshteinDistance(qt, tt) <= maxDistance) return true;
    }
  }

  return false;
}

// Autocomplete with trie (simplified)
class TrieNode {
  children: Map<string, TrieNode> = new Map();
  isEndOfWord: boolean = false;
  suggestions: string[] = [];
}

class AutocompleteTrie {
  root = new TrieNode();

  insert(word: string): void {
    let node = this.root;
    const lowerWord = word.toLowerCase();

    for (const char of lowerWord) {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode());
      }
      node = node.children.get(char)!;
    }

    node.isEndOfWord = true;
    node.suggestions.push(word);
  }

  search(prefix: string): string[] {
    let node = this.root;
    const lowerPrefix = prefix.toLowerCase();

    for (const char of lowerPrefix) {
      if (!node.children.has(char)) {
        return [];
      }
      node = node.children.get(char)!;
    }

    return this.collectSuggestions(node);
  }

  private collectSuggestions(node: TrieNode): string[] {
    const suggestions: string[] = [];

    if (node.isEndOfWord) {
      suggestions.push(...node.suggestions);
    }

    for (const child of node.children.values()) {
      suggestions.push(...this.collectSuggestions(child));
    }

    return suggestions;
  }
}

describe('Tokenization', () => {
  it('should lowercase all tokens', () => {
    const tokens = tokenize('Hello World');
    expect(tokens).toEqual(['hello', 'world']);
  });

  it('should remove special characters', () => {
    const tokens = tokenize('Hello, World! How are you?');
    expect(tokens).toEqual(['hello', 'world', 'how', 'are', 'you']);
  });

  it('should handle multiple spaces', () => {
    const tokens = tokenize('Hello    World');
    expect(tokens).toEqual(['hello', 'world']);
  });

  it('should handle empty string', () => {
    const tokens = tokenize('');
    expect(tokens).toEqual([]);
  });

  it('should handle single word', () => {
    const tokens = tokenize('Hello');
    expect(tokens).toEqual(['hello']);
  });
});

describe('TF-IDF Scoring', () => {
  const documentFrequency = new Map<string, number>([
    ['hello', 10],
    ['world', 5],
    ['search', 2],
  ]);
  const totalDocuments = 100;

  it('should calculate score for matching tokens', () => {
    const queryTokens = ['hello', 'world'];
    const textTokens = ['hello', 'world', 'search'];

    const score = calculateScore(queryTokens, textTokens, documentFrequency, totalDocuments);
    expect(score).toBeGreaterThan(0);
  });

  it('should return 0 for no matching tokens', () => {
    const queryTokens = ['xyz'];
    const textTokens = ['hello', 'world'];

    const score = calculateScore(queryTokens, textTokens, documentFrequency, totalDocuments);
    expect(score).toBe(0);
  });

  it('should return 0 for empty query', () => {
    const queryTokens: string[] = [];
    const textTokens = ['hello', 'world'];

    const score = calculateScore(queryTokens, textTokens, documentFrequency, totalDocuments);
    expect(score).toBe(0);
  });

  it('should return 0 for empty text', () => {
    const queryTokens = ['hello'];
    const textTokens: string[] = [];

    const score = calculateScore(queryTokens, textTokens, documentFrequency, totalDocuments);
    expect(score).toBe(0);
  });
});

describe('Fuzzy Matching', () => {
  it('should match exact word', () => {
    expect(fuzzyMatch('hello', 'hello')).toBe(true);
  });

  it('should match with typo (1 char difference)', () => {
    expect(fuzzyMatch('hello', 'hallo')).toBe(true);
  });

  it('should match with 2 char difference', () => {
    expect(fuzzyMatch('hello', 'hxllo')).toBe(true);
  });

  it('should not match with 3+ char difference', () => {
    expect(fuzzyMatch('hello', 'world')).toBe(false);
  });

  it('should match in phrase', () => {
    expect(fuzzyMatch('phone', 'I have a phone')).toBe(true);
  });

  it('should be case insensitive', () => {
    expect(fuzzyMatch('Hello', 'hello world')).toBe(true);
  });
});

describe('Levenshtein Distance', () => {
  it('should return 0 for identical strings', () => {
    expect(levenshteinDistance('hello', 'hello')).toBe(0);
  });

  it('should return 1 for single character change', () => {
    expect(levenshteinDistance('hello', 'hallo')).toBe(1);
  });

  it('should return 1 for single character insertion', () => {
    expect(levenshteinDistance('hello', 'helloo')).toBe(1);
  });

  it('should return 1 for single character deletion', () => {
    expect(levenshteinDistance('hello', 'hell')).toBe(1);
  });

  it('should return length difference for empty strings', () => {
    expect(levenshteinDistance('', 'hello')).toBe(5);
    expect(levenshteinDistance('hello', '')).toBe(5);
  });
});

describe('Autocomplete Trie', () => {
  let trie: AutocompleteTrie;

  beforeEach(() => {
    trie = new AutocompleteTrie();
    trie.insert('apple');
    trie.insert('application');
    trie.insert('banana');
    trie.insert('band');
    trie.insert('bandana');
  });

  it('should find suggestions for prefix', () => {
    const suggestions = trie.search('app');
    expect(suggestions).toContain('apple');
    expect(suggestions).toContain('application');
  });

  it('should return empty for unknown prefix', () => {
    const suggestions = trie.search('xyz');
    expect(suggestions).toEqual([]);
  });

  it('should find exact match', () => {
    const suggestions = trie.search('banana');
    expect(suggestions).toContain('banana');
  });

  it('should be case insensitive', () => {
    const suggestions = trie.search('APP');
    expect(suggestions.length).toBeGreaterThan(0);
  });

  it('should return multiple suggestions', () => {
    const suggestions = trie.search('ban');
    expect(suggestions).toContain('banana');
    expect(suggestions).toContain('band');
    expect(suggestions).toContain('bandana');
  });
});

describe('Search Relevance', () => {
  function rankResults(items: SearchableItem[]): SearchableItem[] {
    return items.sort((a, b) => (b.score || 0) - (a.score || 0));
  }

  it('should rank by score descending', () => {
    const items: SearchableItem[] = [
      { id: '1', type: 'product', title: 'Item A', description: '', tags: [], score: 10 },
      { id: '2', type: 'product', title: 'Item B', description: '', tags: [], score: 50 },
      { id: '3', type: 'product', title: 'Item C', description: '', tags: [], score: 30 },
    ];

    const ranked = rankResults(items);
    expect(ranked[0].id).toBe('2');
    expect(ranked[1].id).toBe('3');
    expect(ranked[2].id).toBe('1');
  });

  it('should handle items without score', () => {
    const items: SearchableItem[] = [
      { id: '1', type: 'product', title: 'Item A', description: '', tags: [] },
      { id: '2', type: 'product', title: 'Item B', description: '', tags: [], score: 50 },
    ];

    const ranked = rankResults(items);
    expect(ranked[0].id).toBe('2');
  });
});

describe('Search Highlighting', () => {
  function highlightMatches(text: string, query: string): string {
    const tokens = tokenize(query);
    let result = text;

    for (const token of tokens) {
      const regex = new RegExp(`(${token})`, 'gi');
      result = result.replace(regex, '<mark>$1</mark>');
    }

    return result;
  }

  it('should highlight matching tokens', () => {
    const result = highlightMatches('Hello World', 'hello');
    expect(result).toBe('<mark>Hello</mark> World');
  });

  it('should highlight all matching tokens', () => {
    const result = highlightMatches('Hello World Hello', 'hello');
    expect(result).toContain('<mark>Hello</mark>');
  });

  it('should be case insensitive', () => {
    const result = highlightMatches('Hello World', 'HELLO');
    expect(result).toContain('<mark>Hello</mark>');
  });

  it('should not modify non-matching text', () => {
    const result = highlightMatches('Hello World', 'xyz');
    expect(result).toBe('Hello World');
  });
});

describe('Pagination', () => {
  interface PaginatedResult<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }

  function paginate<T>(items: T[], page: number, pageSize: number): PaginatedResult<T> {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return {
      items: items.slice(start, end),
      total: items.length,
      page,
      pageSize,
      totalPages: Math.ceil(items.length / pageSize),
    };
  }

  it('should return correct page', () => {
    const items = Array.from({ length: 100 }, (_, i) => ({ id: i + 1 }));
    const result = paginate(items, 2, 10);

    expect(result.items).toHaveLength(10);
    expect(result.items[0].id).toBe(11);
    expect(result.total).toBe(100);
    expect(result.page).toBe(2);
    expect(result.totalPages).toBe(10);
  });

  it('should handle last page', () => {
    const items = Array.from({ length: 25 }, (_, i) => ({ id: i + 1 }));
    const result = paginate(items, 3, 10);

    expect(result.items).toHaveLength(5);
    expect(result.totalPages).toBe(3);
  });

  it('should handle page beyond available', () => {
    const items = Array.from({ length: 10 }, (_, i) => ({ id: i + 1 }));
    const result = paginate(items, 5, 10);

    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(10);
  });
});

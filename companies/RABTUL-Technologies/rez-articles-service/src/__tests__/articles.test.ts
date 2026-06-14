/**
 * Articles Service Tests
 * Tests for article management, publishing, and content
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Types
interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  authorId: string;
  status: 'draft' | 'published' | 'archived';
  tags: string[];
  category: string;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface Comment {
  id: string;
  articleId: string;
  userId: string;
  content: string;
  parentId?: string;
  createdAt: Date;
}

// Slug generation
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Article validation
function validateArticle(article: Partial<Article>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!article.title || article.title.trim().length < 5) {
    errors.push('title must be at least 5 characters');
  }

  if (article.title && article.title.length > 200) {
    errors.push('title must be less than 200 characters');
  }

  if (!article.content || article.content.trim().length < 100) {
    errors.push('content must be at least 100 characters');
  }

  if (!article.authorId) {
    errors.push('authorId is required');
  }

  return { valid: errors.length === 0, errors };
}

// Publishing
function canPublish(article: Article): { canPublish: boolean; reason?: string } {
  if (article.status === 'published') {
    return { canPublish: false, reason: 'Article is already published' };
  }

  if (article.content.trim().length < 100) {
    return { canPublish: false, reason: 'Content is too short' };
  }

  if (!article.title || article.title.trim().length < 5) {
    return { canPublish: false, reason: 'Title is too short' };
  }

  return { canPublish: true };
}

// Reading time calculation
function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

// Search
function searchArticles(articles: Article[], query: string): Article[] {
  const q = query.toLowerCase();
  return articles.filter(a =>
    a.title.toLowerCase().includes(q) ||
    a.content.toLowerCase().includes(q) ||
    a.tags.some(t => t.toLowerCase().includes(q)) ||
    a.category.toLowerCase().includes(q)
  );
}

// Comment validation
function validateComment(comment: Partial<Comment>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!comment.articleId) {
    errors.push('articleId is required');
  }

  if (!comment.userId) {
    errors.push('userId is required');
  }

  if (!comment.content || comment.content.trim().length < 1) {
    errors.push('content is required');
  }

  if (comment.content && comment.content.length > 2000) {
    errors.push('content must be less than 2000 characters');
  }

  return { valid: errors.length === 0, errors };
}

// Thread comments
interface CommentThread {
  comment: Comment;
  replies: CommentThread[];
}

function buildCommentTree(comments: Comment[]): CommentThread[] {
  const rootComments: CommentThread[] = [];
  const commentMap = new Map<string, CommentThread>();

  // First pass: create all threads
  for (const comment of comments) {
    commentMap.set(comment.id, { comment, replies: [] });
  }

  // Second pass: build tree
  for (const comment of comments) {
    const thread = commentMap.get(comment.id)!;

    if (comment.parentId) {
      const parent = commentMap.get(comment.parentId);
      if (parent) {
        parent.replies.push(thread);
      }
    } else {
      rootComments.push(thread);
    }
  }

  return rootComments;
}

describe('Slug Generation', () => {
  it('should convert title to lowercase', () => {
    expect(generateSlug('Hello World')).toBe('hello-world');
  });

  it('should remove special characters', () => {
    expect(generateSlug('Hello! @World# 123')).toBe('hello-world-123');
  });

  it('should replace spaces with hyphens', () => {
    expect(generateSlug('hello world test')).toBe('hello-world-test');
  });

  it('should handle multiple spaces', () => {
    expect(generateSlug('hello    world')).toBe('hello-world');
  });

  it('should trim leading/trailing hyphens', () => {
    expect(generateSlug('  hello world  ')).toBe('hello-world');
  });
});

describe('Article Validation', () => {
  it('should validate complete article', () => {
    const article: Partial<Article> = {
      title: 'This is a valid article title',
      content: 'This is the article content with more than 100 characters to pass validation. '.repeat(5),
      authorId: 'author_123'
    };

    const result = validateArticle(article);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject short title', () => {
    const article: Partial<Article> = {
      title: 'Hi',
      content: 'This is the article content with more than 100 characters to pass validation. '.repeat(5),
      authorId: 'author_123'
    };

    const result = validateArticle(article);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('title must be at least 5 characters');
  });

  it('should reject short content', () => {
    const article: Partial<Article> = {
      title: 'This is a valid title',
      content: 'Too short',
      authorId: 'author_123'
    };

    const result = validateArticle(article);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('content must be at least 100 characters');
  });

  it('should reject missing authorId', () => {
    const article: Partial<Article> = {
      title: 'Valid Title Here',
      content: 'This is the article content with more than 100 characters to pass validation. '.repeat(5),
      authorId: ''
    };

    const result = validateArticle(article);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('authorId is required');
  });
});

describe('Publishing', () => {
  const validArticle: Article = {
    id: '1',
    title: 'Valid Article Title',
    slug: 'valid-article-title',
    content: 'This is the article content with more than 100 characters to pass validation. '.repeat(5),
    authorId: 'author_1',
    status: 'draft',
    tags: ['tech'],
    category: 'Technology',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  it('should allow publishing valid article', () => {
    const result = canPublish(validArticle);
    expect(result.canPublish).toBe(true);
  });

  it('should reject already published article', () => {
    const published = { ...validArticle, status: 'published' as const };
    const result = canPublish(published);
    expect(result.canPublish).toBe(false);
    expect(result.reason).toContain('already published');
  });

  it('should reject article with short content', () => {
    const shortContent = { ...validArticle, content: 'Too short' };
    const result = canPublish(shortContent);
    expect(result.canPublish).toBe(false);
    expect(result.reason).toContain('too short');
  });
});

describe('Reading Time', () => {
  it('should calculate for short content', () => {
    const content = 'This is a short article. '.repeat(50); // ~600 words
    expect(calculateReadingTime(content)).toBe(3); // ~3 minutes
  });

  it('should calculate for long content', () => {
    const content = 'Word '.repeat(1000); // 1000 words
    expect(calculateReadingTime(content)).toBe(5); // 5 minutes
  });

  it('should round up', () => {
    const content = 'Word '.repeat(50); // 50 words = 0.25 minutes
    expect(calculateReadingTime(content)).toBe(1); // 1 minute minimum
  });
});

describe('Search', () => {
  const articles: Article[] = [
    { id: '1', title: 'React Tutorial', slug: 'react-tutorial', content: 'Learn React basics', authorId: 'a1', status: 'published', tags: ['react', 'javascript'], category: 'Programming', createdAt: new Date(), updatedAt: new Date() },
    { id: '2', title: 'Vue Guide', slug: 'vue-guide', content: 'Vue.js fundamentals', authorId: 'a1', status: 'published', tags: ['vue', 'javascript'], category: 'Programming', createdAt: new Date(), updatedAt: new Date() },
    { id: '3', title: 'Cooking Tips', slug: 'cooking-tips', content: 'Delicious recipes', authorId: 'a2', status: 'published', tags: ['food'], category: 'Lifestyle', createdAt: new Date(), updatedAt: new Date() },
  ];

  it('should search by title', () => {
    const results = searchArticles(articles, 'react');
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('React Tutorial');
  });

  it('should search by content', () => {
    const results = searchArticles(articles, 'fundamentals');
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Vue Guide');
  });

  it('should search by tag', () => {
    const results = searchArticles(articles, 'javascript');
    expect(results).toHaveLength(2);
  });

  it('should search by category', () => {
    const results = searchArticles(articles, 'Programming');
    expect(results).toHaveLength(2);
  });

  it('should be case insensitive', () => {
    const results = searchArticles(articles, 'REACT');
    expect(results).toHaveLength(1);
  });
});

describe('Comment Validation', () => {
  it('should validate complete comment', () => {
    const comment: Partial<Comment> = {
      articleId: 'article_1',
      userId: 'user_1',
      content: 'Great article!'
    };

    const result = validateComment(comment);
    expect(result.valid).toBe(true);
  });

  it('should reject missing articleId', () => {
    const comment: Partial<Comment> = {
      userId: 'user_1',
      content: 'Great article!'
    };

    const result = validateComment(comment);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('articleId is required');
  });

  it('should reject content over 2000 characters', () => {
    const comment: Partial<Comment> = {
      articleId: 'article_1',
      userId: 'user_1',
      content: 'a'.repeat(2001)
    };

    const result = validateComment(comment);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('content must be less than 2000 characters');
  });
});

describe('Comment Tree', () => {
  const comments: Comment[] = [
    { id: 'c1', articleId: 'a1', userId: 'u1', content: 'Root comment', createdAt: new Date() },
    { id: 'c2', articleId: 'a1', userId: 'u2', content: 'Reply to c1', parentId: 'c1', createdAt: new Date() },
    { id: 'c3', articleId: 'a1', userId: 'u3', content: 'Another root', createdAt: new Date() },
    { id: 'c4', articleId: 'a1', userId: 'u1', content: 'Reply to c2', parentId: 'c2', createdAt: new Date() },
  ];

  it('should build correct tree structure', () => {
    const tree = buildCommentTree(comments);

    expect(tree).toHaveLength(2); // 2 root comments
    expect(tree[0].replies).toHaveLength(1); // c1 has 1 reply
    expect(tree[0].replies[0].replies).toHaveLength(1); // c2 has 1 reply
    expect(tree[1].replies).toHaveLength(0); // c3 has no replies
  });
});

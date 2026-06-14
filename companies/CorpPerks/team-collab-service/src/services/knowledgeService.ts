import { KnowledgeArticle, IKnowledgeArticle } from '../models/KnowledgeArticle.js';
import { KnowledgeCategory, IKnowledgeCategory } from '../models/KnowledgeCategory.js';
import { generateId } from '../types/index.js';
import { NotFoundError } from '../middleware/errorHandler.js';

export class KnowledgeService {
  // ============= ARTICLES =============

  /**
   * Create a new knowledge article
   */
  async createArticle(data: {
    companyId: string;
    authorId: string;
    authorName: string;
    title: string;
    content: string;
    summary: string;
    categoryId: string;
    tags?: string[];
    isPublished?: boolean;
    attachments?: Array<{
      id: string;
      filename: string;
      url: string;
      mimeType: string;
      size: number;
    }>;
  }): Promise<IKnowledgeArticle> {
    const { content } = data;

    // Calculate read time (average 200 words per minute)
    const wordCount = content.split(/\s+/).length;
    const readTime = Math.ceil(wordCount / 200);

    const article = new KnowledgeArticle({
      articleId: generateId('KA'),
      ...data,
      tags: data.tags || [],
      attachments: data.attachments || [],
      viewCount: 0,
      likeCount: 0,
      commentCount: 0,
      isPublished: data.isPublished || false,
      isFeatured: false,
      metadata: {
        readTime,
        relatedArticles: [],
      },
      publishedAt: data.isPublished ? new Date() : undefined,
    });

    await article.save();

    // Update category article count
    await KnowledgeCategory.findOneAndUpdate(
      { categoryId: data.categoryId },
      { $inc: { articleCount: 1 } }
    );

    return article;
  }

  /**
   * Get articles with filters
   */
  async getArticles(
    companyId: string,
    options: {
      categoryId?: string;
      tags?: string[];
      authorId?: string;
      isPublished?: boolean;
      search?: string;
      limit?: number;
      page?: number;
    } = {}
  ): Promise<{ articles: IKnowledgeArticle[]; total: number }> {
    const { categoryId, tags, authorId, isPublished = true, search, limit = 20, page = 1 } = options;

    const filter: Record<string, unknown> = { companyId };

    if (categoryId) filter.categoryId = categoryId;
    if (authorId) filter.authorId = authorId;
    if (typeof isPublished === 'boolean') filter.isPublished = isPublished;
    if (tags && tags.length > 0) filter.tags = { $in: tags };

    if (search) {
      filter.$text = { $search: search };
    }

    const [articles, total] = await Promise.all([
      KnowledgeArticle.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      KnowledgeArticle.countDocuments(filter),
    ]);

    return { articles: articles as IKnowledgeArticle[], total };
  }

  /**
   * Get article by ID
   */
  async getArticleById(articleId: string): Promise<IKnowledgeArticle> {
    const article = await KnowledgeArticle.findOne({ articleId }).lean();
    if (!article) throw new NotFoundError('Article', articleId);
    return article as IKnowledgeArticle;
  }

  /**
   * Update article
   */
  async updateArticle(
    articleId: string,
    updates: Partial<{
      title: string;
      content: string;
      summary: string;
      categoryId: string;
      tags: string[];
      isPublished: boolean;
      isFeatured: boolean;
      attachments: Array<{
        id: string;
        filename: string;
        url: string;
        mimeType: string;
        size: number;
      }>;
    }>
  ): Promise<IKnowledgeArticle> {
    const article = await KnowledgeArticle.findOne({ articleId });
    if (!article) throw new NotFoundError('Article', articleId);

    // If publishing for first time
    if (updates.isPublished === true && !article.isPublished) {
      (updates as Record<string, unknown>).publishedAt = new Date();
    }

    Object.assign(article, updates);
    await article.save();

    return article;
  }

  /**
   * Delete article
   */
  async deleteArticle(articleId: string): Promise<void> {
    const article = await KnowledgeArticle.findOne({ articleId });
    if (!article) throw new NotFoundError('Article', articleId);

    await article.deleteOne();

    // Update category count
    await KnowledgeCategory.findOneAndUpdate(
      { categoryId: article.categoryId },
      { $inc: { articleCount: -1 } }
    );
  }

  /**
   * Track article view
   */
  async trackView(articleId: string): Promise<void> {
    await KnowledgeArticle.findOneAndUpdate({ articleId }, { $inc: { viewCount: 1 } });
  }

  /**
   * Get featured articles
   */
  async getFeaturedArticles(companyId: string, limit: number = 10): Promise<IKnowledgeArticle[]> {
    return KnowledgeArticle.find({
      companyId,
      isPublished: true,
      isFeatured: true,
    })
      .sort({ viewCount: -1 })
      .limit(limit)
      .lean() as Promise<IKnowledgeArticle[]>;
  }

  // ============= CATEGORIES =============

  /**
   * Create category
   */
  async createCategory(data: {
    companyId: string;
    name: string;
    description: string;
    icon?: string;
    color?: string;
    parentId?: string;
    order?: number;
  }): Promise<IKnowledgeCategory> {
    const category = new KnowledgeCategory({
      categoryId: generateId('KC'),
      ...data,
      articleCount: 0,
      isActive: true,
    });

    await category.save();
    return category;
  }

  /**
   * Get categories
   */
  async getCategories(companyId: string): Promise<IKnowledgeCategory[]> {
    return KnowledgeCategory.find({ companyId, isActive: true })
      .sort({ order: 1, name: 1 })
      .lean() as Promise<IKnowledgeCategory[]>;
  }

  /**
   * Get category by ID
   */
  async getCategoryById(categoryId: string): Promise<IKnowledgeCategory> {
    const category = await KnowledgeCategory.findOne({ categoryId }).lean();
    if (!category) throw new NotFoundError('Category', categoryId);
    return category as IKnowledgeCategory;
  }

  /**
   * Update category
   */
  async updateCategory(
    categoryId: string,
    updates: Partial<{
      name: string;
      description: string;
      icon: string;
      color: string;
      parentId: string;
      order: number;
    }>
  ): Promise<IKnowledgeCategory> {
    const category = await KnowledgeCategory.findOne({ categoryId });
    if (!category) throw new NotFoundError('Category', categoryId);

    Object.assign(category, updates);
    await category.save();

    return category;
  }

  /**
   * Delete category
   */
  async deleteCategory(categoryId: string): Promise<void> {
    const category = await KnowledgeCategory.findOne({ categoryId });
    if (!category) throw new NotFoundError('Category', categoryId);

    // Check if category has articles
    const articleCount = await KnowledgeArticle.countDocuments({ categoryId, isPublished: true });
    if (articleCount > 0) {
      // Soft delete - just mark as inactive
      category.isActive = false;
      await category.save();
    } else {
      await category.deleteOne();
    }
  }

  /**
   * Get article count by category
   */
  async getCategoryStats(companyId: string): Promise<Array<{
    category: IKnowledgeCategory;
    articleCount: number;
    recentArticles: IKnowledgeArticle[];
  }>> {
    const categories = await this.getCategories(companyId);
    const stats = [];

    for (const category of categories) {
      const articles = await KnowledgeArticle.find({
        categoryId: category.categoryId,
        isPublished: true,
      })
        .sort({ createdAt: -1 })
        .limit(3)
        .lean();

      stats.push({
        category,
        articleCount: category.articleCount,
        recentArticles: articles as IKnowledgeArticle[],
      });
    }

    return stats;
  }
}

export const knowledgeService = new KnowledgeService();

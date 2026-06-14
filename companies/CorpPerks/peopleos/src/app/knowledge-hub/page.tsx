'use client';

import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Plus, ChevronRight, Clock, Eye, Star, Folder } from 'lucide-react';

interface Article {
  articleId: string;
  title: string;
  summary: string;
  categoryName: string;
  authorName: string;
  viewCount: number;
  readTime: number;
  isFeatured: boolean;
  createdAt: string;
}

interface Category {
  categoryId: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  articleCount: number;
}

export default function KnowledgeHubPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKnowledge();
  }, []);

  const fetchKnowledge = async () => {
    setLoading(true);
    // Simulated data - in production, fetch from team-collab-service
    setCategories([
      { categoryId: '1', name: 'Getting Started', description: 'Onboarding guides', icon: 'rocket', color: '#10B981', articleCount: 12 },
      { categoryId: '2', name: 'Policies', description: 'Company policies', icon: 'file-text', color: '#6366F1', articleCount: 8 },
      { categoryId: '3', name: 'Benefits', description: 'HR benefits info', icon: 'heart', color: '#EC4899', articleCount: 15 },
      { categoryId: '4', name: 'Tools & Tech', description: 'Software guides', icon: 'tool', color: '#F59E0B', articleCount: 20 },
      { categoryId: '5', name: 'Culture', description: 'Company culture', icon: 'users', color: '#8B5CF6', articleCount: 6 },
    ]);

    setArticles([
      {
        articleId: '1',
        title: 'Welcome to the Company - Complete Onboarding Guide',
        summary: 'Everything you need to know to get started with your new role.',
        categoryName: 'Getting Started',
        authorName: 'HR Team',
        viewCount: 1250,
        readTime: 8,
        isFeatured: true,
        createdAt: '2024-01-15',
      },
      {
        articleId: '2',
        title: 'Health Insurance Benefits Overview',
        summary: 'Understanding your health coverage options and enrollment.',
        categoryName: 'Benefits',
        authorName: 'Benefits Team',
        viewCount: 890,
        readTime: 5,
        isFeatured: true,
        createdAt: '2024-01-20',
      },
      {
        articleId: '3',
        title: 'Remote Work Policy',
        summary: 'Guidelines for working remotely and hybrid arrangements.',
        categoryName: 'Policies',
        authorName: 'HR Team',
        viewCount: 650,
        readTime: 4,
        isFeatured: false,
        createdAt: '2024-02-01',
      },
      {
        articleId: '4',
        title: 'Using Slack Effectively',
        summary: 'Best practices for team communication on Slack.',
        categoryName: 'Tools & Tech',
        authorName: 'IT Team',
        viewCount: 420,
        readTime: 3,
        isFeatured: false,
        createdAt: '2024-02-10',
      },
    ]);
    setLoading(false);
  };

  const filteredArticles = articles.filter((article) => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || article.categoryName === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredArticles = articles.filter((a) => a.isFeatured);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-indigo-600 text-white px-6 py-8">
        <h1 className="text-2xl font-bold mb-2">Knowledge Hub</h1>
        <p className="text-indigo-100 mb-4">Find answers, policies, and guides</p>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            {/* Featured Articles */}
            {featuredArticles.length > 0 && !selectedCategory && (
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <h2 className="text-lg font-semibold text-gray-900">Featured</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {featuredArticles.map((article) => (
                    <FeaturedArticleCard key={article.articleId} article={article} />
                  ))}
                </div>
              </section>
            )}

            {/* Categories */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Categories</h2>
              <div className="flex gap-3 overflow-x-auto pb-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    !selectedCategory
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  All
                </button>
                {categories.map((category) => (
                  <button
                    key={category.categoryId}
                    onClick={() => setSelectedCategory(category.name)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                      selectedCategory === category.name
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    {category.name}
                    <span className="text-xs opacity-75">({category.articleCount})</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Articles List */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {selectedCategory || 'All Articles'}
              </h2>
              <div className="space-y-4">
                {filteredArticles.map((article) => (
                  <ArticleCard key={article.articleId} article={article} />
                ))}
                {filteredArticles.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No articles found</p>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>

      {/* Floating Action Button */}
      <button className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-indigo-700 transition-colors">
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}

function FeaturedArticleCard({ article }: { article: Article }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start justify-between mb-4">
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
          <Star className="w-3 h-3" />
          Featured
        </span>
        <span className="text-sm text-gray-500">{article.categoryName}</span>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{article.title}</h3>
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{article.summary}</p>
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {article.readTime} min read
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {article.viewCount}
          </span>
        </div>
        <ChevronRight className="w-5 h-5" />
      </div>
    </div>
  );
}

function ArticleCard({ article }: { article: Article }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow cursor-pointer flex items-center gap-4">
      <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
        <BookOpen className="w-6 h-6 text-indigo-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-indigo-600 font-medium">{article.categoryName}</span>
          <span className="text-gray-300">•</span>
          <span className="text-xs text-gray-500">{article.authorName}</span>
        </div>
        <h3 className="font-medium text-gray-900 truncate">{article.title}</h3>
        <p className="text-sm text-gray-500 truncate">{article.summary}</p>
        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {article.readTime} min
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {article.viewCount} views
          </span>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
    </div>
  );
}

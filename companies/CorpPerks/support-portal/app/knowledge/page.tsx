'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  BookOpen,
  FileText,
  HelpCircle,
  Compass,
  GraduationCap,
  Plus,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Clock,
  ChevronRight,
  Filter,
  Tag,
} from 'lucide-react';
import { Card, Badge, Button, Avatar } from '@/components/ui';
import { knowledgeArticles, cannedResponses } from '@/lib/mock-data';
import { formatRelativeTime, formatDate, cn } from '@/lib/utils';
import { KnowledgeArticle, KnowledgeBaseCategory } from '@/types';

const categoryConfig: Record<KnowledgeBaseCategory, { label: string; icon: React.ReactNode; description: string; color: string }> = {
  policies: {
    label: 'Policies',
    icon: <FileText className="w-5 h-5" />,
    description: 'Company policies and guidelines',
    color: 'bg-blue-100 text-blue-600',
  },
  procedures: {
    label: 'Procedures',
    icon: <Compass className="w-5 h-5" />,
    description: 'Step-by-step procedures',
    color: 'bg-green-100 text-green-600',
  },
  faq: {
    label: 'FAQ',
    icon: <HelpCircle className="w-5 h-5" />,
    description: 'Frequently asked questions',
    color: 'bg-purple-100 text-purple-600',
  },
  guides: {
    label: 'Guides',
    icon: <GraduationCap className="w-5 h-5" />,
    description: 'How-to guides and tutorials',
    color: 'bg-amber-100 text-amber-600',
  },
  training: {
    label: 'Training',
    icon: <BookOpen className="w-5 h-5" />,
    description: 'Training materials and resources',
    color: 'bg-pink-100 text-pink-600',
  },
};

export default function KnowledgeBasePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<KnowledgeBaseCategory | 'all'>('all');
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 'helpful' | 'not_helpful'>>({});

  const categories = Object.entries(categoryConfig) as [KnowledgeBaseCategory, typeof categoryConfig[KnowledgeBaseCategory]][];

  const filteredArticles = useMemo(() => {
    return knowledgeArticles.filter((article) => {
      const matchesSearch =
        searchQuery === '' ||
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const handleFeedback = (articleId: string, isHelpful: boolean) => {
    setFeedbackGiven((prev) => ({ ...prev, [articleId]: isHelpful ? 'helpful' : 'not_helpful' }));
  };

  const articleContent = selectedArticle?.content || '';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
          <p className="text-gray-500 mt-1">
            Search articles and resources to help with common questions
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Article
        </Button>
      </div>

      {/* Search */}
      <Card>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search articles by title, content, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 text-base bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <div className="lg:col-span-1">
          <Card padding="none">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Categories
              </h3>
            </div>
            <div className="p-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                  selectedCategory === 'all' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                )}
              >
                <div className="p-1.5 bg-gray-100 rounded">
                  <BookOpen className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">All Articles</p>
                  <p className="text-xs text-gray-500">{knowledgeArticles.length} articles</p>
                </div>
              </button>

              {categories.map(([key, config]) => {
                const count = knowledgeArticles.filter((a) => a.category === key).length;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedCategory(key)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                      selectedCategory === key ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                    )}
                  >
                    <div className={cn('p-1.5 rounded', config.color.split(' ')[0])}>
                      <span className={cn('w-4 h-4 flex items-center justify-center', config.color.split(' ')[1])}>
                        {config.icon}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{config.label}</p>
                      <p className="text-xs text-gray-500">{count} articles</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Popular Tags */}
          <Card className="mt-6">
            <h3 className="font-semibold text-gray-900 mb-3">Popular Tags</h3>
            <div className="flex flex-wrap gap-2">
              {['leave', 'payroll', 'remote-work', 'benefits', 'expense', 'policy'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSearchQuery(tag)}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors capitalize"
                >
                  {tag.replace('-', ' ')}
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Articles List */}
        <div className="lg:col-span-2">
          <Card padding="none">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                {selectedCategory === 'all' ? 'All Articles' : categoryConfig[selectedCategory].label}
              </h3>
              <Badge>{filteredArticles.length} articles</Badge>
            </div>

            <div className="divide-y divide-gray-100">
              {filteredArticles.map((article) => (
                <ArticleListItem
                  key={article.id}
                  article={article}
                  isSelected={selectedArticle?.id === article.id}
                  onClick={() => setSelectedArticle(article)}
                />
              ))}
            </div>

            {filteredArticles.length === 0 && (
              <div className="p-12 text-center">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No articles found</h3>
                <p className="text-gray-500">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Article Preview */}
        <div className="lg:col-span-1">
          {selectedArticle ? (
            <Card padding="none" className="sticky top-6">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={cn(
                    categoryConfig[selectedArticle.category].color
                  )}>
                    {categoryConfig[selectedArticle.category].label}
                  </Badge>
                </div>
                <h2 className="text-xl font-bold text-gray-900">{selectedArticle.title}</h2>
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {selectedArticle.views} views
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatRelativeTime(selectedArticle.updatedAt)}
                  </span>
                </div>
              </div>

              <div className="p-4 max-h-96 overflow-y-auto scrollbar-thin">
                <div className="prose prose-sm max-w-none">
                  <ArticleContent content={articleContent} />
                </div>
              </div>

              {/* Tags */}
              <div className="p-4 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-700 mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {selectedArticle.tags.map((tag) => (
                    <Badge key={tag} variant="default" size="sm">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Feedback */}
              <div className="p-4 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-700 mb-2">Was this article helpful?</p>
                <div className="flex items-center gap-2">
                  <Button
                    variant={feedbackGiven[selectedArticle.id] === 'helpful' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => handleFeedback(selectedArticle.id, true)}
                  >
                    <ThumbsUp className="w-4 h-4 mr-1" />
                    Yes ({selectedArticle.helpful})
                  </Button>
                  <Button
                    variant={feedbackGiven[selectedArticle.id] === 'not_helpful' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => handleFeedback(selectedArticle.id, false)}
                  >
                    <ThumbsDown className="w-4 h-4 mr-1" />
                    No ({selectedArticle.notHelpful})
                  </Button>
                </div>
              </div>

              {/* Author */}
              <div className="p-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">Last updated by</p>
                <div className="flex items-center gap-3 mt-2">
                  <Avatar name={selectedArticle.author.name} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{selectedArticle.author.name}</p>
                    <p className="text-xs text-gray-500">{formatDate(selectedArticle.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="sticky top-6">
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">Select an article</h3>
                <p className="text-gray-500 text-sm">
                  Click on an article from the list to preview its content
                </p>
              </div>

              {/* Quick Links */}
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-3">Quick Links</h4>
                <div className="space-y-2">
                  {cannedResponses.slice(0, 4).map((canned) => (
                    <div key={canned.id} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900">{canned.title}</p>
                      <p className="text-xs text-gray-500 font-mono mt-1">{canned.shortcut}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function ArticleListItem({
  article,
  isSelected,
  onClick,
}: {
  article: KnowledgeArticle;
  isSelected: boolean;
  onClick: () => void;
}) {
  const config = categoryConfig[article.category];

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-4 text-left hover:bg-gray-50 transition-colors',
        isSelected && 'bg-blue-50'
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn('p-2 rounded-lg', config.color.split(' ')[0])}>
          <span className={cn('w-5 h-5 flex items-center justify-center', config.color.split(' ')[1])}>
            {config.icon}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">{article.title}</h4>
            <ChevronRight className={cn('w-4 h-4 text-gray-400', isSelected && 'text-blue-500')} />
          </div>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
            {article.content.replace(/[#*`]/g, '').substring(0, 100)}...
          </p>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {article.views}
            </span>
            <span className="flex items-center gap-1">
              <ThumbsUp className="w-3 h-3" />
              {article.helpful}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

function ArticleContent({ content }: { content: string }) {
  const lines = content.split('\n');

  return (
    <div className="space-y-3">
      {lines.map((line, i) => {
        if (line.startsWith('## ')) {
          return <h2 key={i} className="text-lg font-bold text-gray-900 mt-6 mb-2">{line.replace('## ', '')}</h2>;
        }
        if (line.startsWith('### ')) {
          return <h3 key={i} className="text-base font-semibold text-gray-900 mt-4 mb-2">{line.replace('### ', '')}</h3>;
        }
        if (line.startsWith('- ')) {
          return <li key={i} className="text-gray-700 ml-4">{line.replace('- ', '')}</li>;
        }
        if (line.match(/^\d+\./)) {
          return <li key={i} className="text-gray-700 ml-4 list-decimal">{line.replace(/^\d+\.\s*/, '')}</li>;
        }
        if (line.trim() === '') {
          return <div key={i} className="h-2" />;
        }
        // Bold text
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <p key={i} className="text-gray-700">
            {parts.map((part, j) =>
              j % 2 === 1 ? <strong key={j}>{part}</strong> : part
            )}
          </p>
        );
      })}
    </div>
  );
}

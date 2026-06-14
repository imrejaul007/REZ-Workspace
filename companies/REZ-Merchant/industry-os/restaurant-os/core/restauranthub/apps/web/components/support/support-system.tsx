'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  HelpCircle,
  MessageCircle,
  Phone,
  Mail,
  Search,
  ChevronRight,
  ChevronDown,
  ThumbsUp,
  ThumbsDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  Star,
  Send,
  Paperclip,
  Download,
  ExternalLink,
  BookOpen,
  Video,
  FileText,
  Headphones,
  Zap,
  Shield,
  CreditCard,
  Settings,
  Users,
  BarChart3,
  Plus,
  Filter,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: 'account' | 'billing' | 'orders' | 'technical' | 'general';
  views: number;
  helpfulVotes: number;
  unhelpfulVotes: number;
  lastUpdated: string;
  isExpanded?: boolean;
  tags: string[];
  relatedArticles?: string[];
}

interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  subject: string;
  description: string;
  category: 'technical' | 'billing' | 'account' | 'general' | 'bug_report' | 'feature_request';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';
  assignedTo?: string;
  assignedToName?: string;
  attachments: {
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
  }[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  responses: SupportResponse[];
  rating?: number;
  feedback?: string;
  tags: string[];
}

interface SupportResponse {
  id: string;
  ticketId: string;
  responderId: string;
  responderName: string;
  responderType: 'agent' | 'customer' | 'system';
  message: string;
  attachments?: {
    id: string;
    name: string;
    url: string;
  }[];
  isInternal: boolean;
  createdAt: string;
  isEdited: boolean;
}

interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  summary: string;
  category: 'getting_started' | 'features' | 'troubleshooting' | 'billing' | 'advanced';
  type: 'article' | 'video' | 'tutorial' | 'guide';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedReadTime: number; // in minutes
  views: number;
  rating: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
  author: string;
  tags: string[];
  relatedArticles: string[];
  isPublished: boolean;
}

interface SupportSystemProps {
  faqs: FAQ[];
  tickets: SupportTicket[];
  articles: KnowledgeArticle[];
  userRole: 'admin' | 'restaurant' | 'customer' | 'agent';
  currentUserId?: string;
  onCreateTicket?: (ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'responses'>) => void;
  onRespondToTicket?: (ticketId: string, response: Omit<SupportResponse, 'id' | 'createdAt'>) => void;
  onUpdateTicketStatus?: (ticketId: string, status: SupportTicket['status']) => void;
  onRateSupport?: (ticketId: string, rating: number, feedback?: string) => void;
  onVoteFAQ?: (faqId: string, isHelpful: boolean) => void;
  onRateArticle?: (articleId: string, rating: number) => void;
}

export default function SupportSystem({
  faqs,
  tickets,
  articles,
  userRole,
  currentUserId,
  onCreateTicket,
  onRespondToTicket,
  onUpdateTicketStatus,
  onRateSupport,
  onVoteFAQ,
  onRateArticle
}: SupportSystemProps) {
  const [selectedTab, setSelectedTab] = useState('help');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQs, setExpandedFAQs] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [newTicketResponse, setNewTicketResponse] = useState('');

  // New ticket form state
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    category: 'general' as const,
    priority: 'medium' as const
  });

  const categories = [
    { value: 'account', label: 'Account & Profile', icon: Users, color: 'text-blue-600' },
    { value: 'billing', label: 'Billing & Payments', icon: CreditCard, color: 'text-green-600' },
    { value: 'orders', label: 'Orders & Delivery', icon: Zap, color: 'text-purple-600' },
    { value: 'technical', label: 'Technical Issues', icon: Settings, color: 'text-red-600' },
    { value: 'general', label: 'General Inquiry', icon: HelpCircle, color: 'text-gray-600' }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' },
    { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' }
  ];

  const statuses = [
    { value: 'open', label: 'Open', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
    { value: 'waiting_customer', label: 'Waiting for Customer', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
    { value: 'resolved', label: 'Resolved', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
    { value: 'closed', label: 'Closed', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' }
  ];

  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.icon : HelpCircle;
  };

  const getCategoryColor = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.color : 'text-gray-600';
  };

  const getPriorityColor = (priority: string) => {
    const p = priorities.find(p => p.value === priority);
    return p ? p.color : 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const s = statuses.find(s => s.value === status);
    return s ? s.color : 'bg-gray-100 text-gray-800';
  };

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || faq.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const filteredTickets = tickets.filter(ticket => {
    if (userRole === 'customer') {
      return ticket.userId === currentUserId;
    }
    return true; // Admin and agents see all tickets
  });

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesSearch && article.isPublished;
  });

  const toggleFAQ = (faqId: string) => {
    const newExpanded = new Set(expandedFAQs);
    if (newExpanded.has(faqId)) {
      newExpanded.delete(faqId);
    } else {
      newExpanded.add(faqId);
    }
    setExpandedFAQs(newExpanded);
  };

  const renderFAQSection = () => (
    <div className="space-y-4">
      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search frequently asked questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* FAQ List */}
      <div className="space-y-3">
        {filteredFAQs.map((faq) => {
          const CategoryIcon = getCategoryIcon(faq.category);
          const isExpanded = expandedFAQs.has(faq.id);
          
          return (
            <Card key={faq.id} className="overflow-hidden">
              <Collapsible open={isExpanded} onOpenChange={() => toggleFAQ(faq.id)}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg bg-gray-50 dark:bg-gray-800 ${getCategoryColor(faq.category)}`}>
                          <CategoryIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-left">{faq.question}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {categories.find(c => c.value === faq.category)?.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {faq.views} views
                            </span>
                          </div>
                        </div>
                      </div>
                      {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <p className="text-muted-foreground mb-4">{faq.answer}</p>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-muted-foreground">Was this helpful?</span>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            
                            onClick={() => onVoteFAQ?.(faq.id, true)}
                          >
                            <ThumbsUp className="h-4 w-4 mr-1" />
                            {faq.helpfulVotes}
                          </Button>
                          <Button 
                            variant="ghost" 
                            
                            onClick={() => onVoteFAQ?.(faq.id, false)}
                          >
                            <ThumbsDown className="h-4 w-4 mr-1" />
                            {faq.unhelpfulVotes}
                          </Button>
                        </div>
                      </div>
                      
                      <span className="text-xs text-muted-foreground">
                        Updated {new Date(faq.lastUpdated).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>

      {filteredFAQs.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No FAQs found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search terms or browse different categories.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderTicketCard = (ticket: SupportTicket) => (
    <Card key={ticket.id} className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => setSelectedTicket(ticket)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={ticket.userAvatar} />
              <AvatarFallback>
                {ticket.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{ticket.subject}</CardTitle>
              <p className="text-sm text-muted-foreground">
                by {ticket.userName} • {new Date(ticket.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge className={getPriorityColor(ticket.priority)}>
              {priorities.find(p => p.value === ticket.priority)?.label}
            </Badge>
            <Badge className={getStatusColor(ticket.status)}>
              {statuses.find(s => s.value === ticket.status)?.label}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-muted-foreground line-clamp-2 mb-3">{ticket.description}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span className="flex items-center">
              <MessageCircle className="h-4 w-4 mr-1" />
              {ticket.responses.length} responses
            </span>
            {ticket.assignedToName && (
              <span className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                Assigned to {ticket.assignedToName}
              </span>
            )}
          </div>
          
          {ticket.rating && (
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star 
                  key={i} 
                  className={`h-4 w-4 ${i < ticket.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderKnowledgeBase = () => (
    <div className="space-y-6">
      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search knowledge base..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredArticles.map((article) => (
          <Card key={article.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Badge variant="outline" className="w-fit">
                    {article.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                  <CardTitle className="text-lg leading-tight">{article.title}</CardTitle>
                </div>
                <div className="flex items-center space-x-1">
                  {article.type === 'video' && <Video className="h-4 w-4 text-blue-600" />}
                  {article.type === 'article' && <FileText className="h-4 w-4 text-green-600" />}
                  {article.type === 'tutorial' && <BookOpen className="h-4 w-4 text-purple-600" />}
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4 line-clamp-3">{article.summary}</p>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{article.estimatedReadTime} min read</span>
                  <Badge variant="outline" className="text-xs">
                    {article.difficulty}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-3 w-3 ${i < article.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">({article.ratingCount})</span>
                  </div>
                  
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Eye className="h-3 w-3 mr-1" />
                    {article.views}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderContactOptions = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer">
        <CardContent className="p-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
            <MessageCircle className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Live Chat</h3>
          <p className="text-muted-foreground mb-4">
            Get instant help from our support team
          </p>
          <Button className="w-full">Start Chat</Button>
          <p className="text-xs text-muted-foreground mt-2">
            Available 24/7
          </p>
        </CardContent>
      </Card>

      <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer">
        <CardContent className="p-8">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
            <Phone className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Phone Support</h3>
          <p className="text-muted-foreground mb-4">
            Speak directly with our experts
          </p>
          <Button size="sm" variant="outline" className="w-full" onClick={() => window.open('tel:+1-800-SUPPORT', '_self')}>Call Now</Button>
          <p className="text-xs text-muted-foreground mt-2">
            Mon-Fri, 9 AM - 6 PM
          </p>
        </CardContent>
      </Card>

      <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer">
        <CardContent className="p-8">
          <div className="mx-auto w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mb-4">
            <Mail className="h-8 w-8 text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Email Support</h3>
          <p className="text-muted-foreground mb-4">
            Send us a detailed message
          </p>
          <Button variant="outline" className="w-full" onClick={() => setShowCreateTicket(true)}>
            Create Ticket
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Response within 24 hours
          </p>
        </CardContent>
      </Card>
    </div>
  );

  const renderCreateTicketModal = () => (
    <Dialog open={showCreateTicket} onOpenChange={setShowCreateTicket}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Support Ticket</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Subject</label>
            <Input
              value={newTicket.subject}
              onChange={(e) => setNewTicket(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Brief description of your issue"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <Select value={newTicket.category} onValueChange={(value) => setNewTicket(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Priority</label>
              <Select value={newTicket.priority} onValueChange={(value) => setNewTicket(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map(priority => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <Textarea
              value={newTicket.description}
              onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Please provide detailed information about your issue..."
              rows={6}
            />
          </div>

          <div className="flex space-x-4 pt-4">
            <Button 
              onClick={() => {
                if (onCreateTicket) {
                  onCreateTicket({
                    ...newTicket,
                    userId: currentUserId || '',
                    userName: 'Current User', // This would come from auth context
                    userEmail: 'user@example.com',
                    attachments: [],
                    status: 'open',
                    tags: []
                  });
                  setShowCreateTicket(false);
                  setNewTicket({
                    subject: '',
                    description: '',
                    category: 'general',
                    priority: 'medium'
                  });
                }
              }}
              className="flex-1"
            >
              Create Ticket
            </Button>
            <Button variant="outline" onClick={() => setShowCreateTicket(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center">
            <Headphones className="h-8 w-8 mr-3 text-blue-600" />
            Help & Support Center
          </h1>
          <p className="text-muted-foreground mt-1">
            Find answers, get help, and contact support
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HelpCircle className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">FAQs</p>
                <p className="text-2xl font-bold">{faqs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MessageCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Open Tickets</p>
                <p className="text-2xl font-bold">
                  {tickets.filter(t => ['open', 'in_progress'].includes(t.status)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Knowledge Base</p>
                <p className="text-2xl font-bold">{articles.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Avg Response</p>
                <p className="text-2xl font-bold">2.4h</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="help">Help Center</TabsTrigger>
          <TabsTrigger value="tickets">Support Tickets</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
          <TabsTrigger value="contact">Contact Us</TabsTrigger>
        </TabsList>

        <TabsContent value="help" className="space-y-6">
          <div className="text-center py-8">
            <h2 className="text-3xl font-bold mb-4">How can we help you?</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Search our frequently asked questions or browse by category to find the answers you need.
            </p>
          </div>
          {renderFAQSection()}
        </TabsContent>

        <TabsContent value="tickets" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Your Support Tickets</h2>
            <Button onClick={() => setShowCreateTicket(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          </div>
          
          <div className="space-y-4">
            {filteredTickets.map(renderTicketCard)}
            
            {filteredTickets.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No tickets found</h3>
                  <p className="text-muted-foreground mb-4">
                    You haven't created unknown support tickets yet.
                  </p>
                  <Button onClick={() => setShowCreateTicket(true)}>
                    Create Your First Ticket
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="knowledge" className="space-y-6">
          <div className="text-center py-8">
            <h2 className="text-3xl font-bold mb-4">Knowledge Base</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Explore our comprehensive guides, tutorials, and documentation to get the most out of our platform.
            </p>
          </div>
          {renderKnowledgeBase()}
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <div className="text-center py-8">
            <h2 className="text-3xl font-bold mb-4">Contact Our Support Team</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Choose the best way to reach us. Our team is here to help you succeed.
            </p>
          </div>
          {renderContactOptions()}
        </TabsContent>
      </Tabs>

      {/* Create Ticket Modal */}
      {renderCreateTicketModal()}
    </div>
  );
}
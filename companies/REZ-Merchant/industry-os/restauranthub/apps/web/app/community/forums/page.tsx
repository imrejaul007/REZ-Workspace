'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Filter,
  Users,
  ThumbsUp,
  MessageCircle,
  Clock,
  Pin,
  Star,
  TrendingUp,
  Eye,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ClickableTag } from '@/components/ui/clickable-tag';
import { MentionRenderer, MentionSummary } from '@/components/ui/mention-renderer';

export default function CommunityForums() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  
  const [posts, setPosts] = useState([
    {
      id: 1,
      title: 'Best practices for managing kitchen inventory',
      category: 'Restaurant Management',
      author: 'Sarah Chen',
      authorRole: 'Restaurant Owner',
      avatar: '👩‍🍳',
      content: 'What are your go-to strategies for keeping track of ingredients and reducing waste? I\'ve been working with @Restaurant Supply Wholesale and they have great bulk ordering options. Also loving the #Premium Olive Oil for consistent quality!',
      likes: 24,
      replies: 12,
      views: 156,
      createdAt: '2024-02-15T10:30:00',
      isPinned: true,
      tags: ['inventory', 'management', 'tips']
    },
    {
      id: 2,
      title: 'How to handle difficult customers - Share your experiences',
      category: 'Customer Service',
      author: 'Mike Johnson',
      authorRole: 'Server',
      avatar: '👨‍💼',
      content: 'Looking for advice on de-escalating situations and maintaining professionalism.',
      likes: 18,
      replies: 8,
      views: 89,
      createdAt: '2024-02-15T09:15:00',
      isPinned: false,
      tags: ['customer-service', 'tips', 'experience']
    },
    {
      id: 3,
      title: 'New food trends to watch in 2024',
      category: 'Food & Trends',
      author: 'Emma Rodriguez',
      authorRole: 'Chef',
      avatar: '👩‍🍳',
      content: 'What food trends are you seeing emerge? Plant-based options are huge right now! I recommend checking out #Organic Tomatoes from @Restaurant Supply Wholesale - they have amazing quality and the $FreshLinen Laundry Services help keep our sustainability image clean!',
      likes: 31,
      replies: 15,
      views: 203,
      createdAt: '2024-02-14T16:45:00',
      isPinned: false,
      tags: ['trends', 'food', '2024']
    },
    {
      id: 4,
      title: 'Staff scheduling software recommendations?',
      category: 'Technology',
      author: 'David Kim',
      authorRole: 'Manager',
      avatar: '👨‍💻',
      content: 'Our current system is outdated. What tools do you use for employee scheduling? I\'ve heard great things about @Digital Marketing Hub for their integrated solutions, and @TaxPro Business Services has some scheduling features too.',
      likes: 15,
      replies: 22,
      views: 134,
      createdAt: '2024-02-14T14:20:00',
      isPinned: false,
      tags: ['software', 'scheduling', 'recommendations']
    },
    {
      id: 5,
      title: 'Seasonal menu planning strategies',
      category: 'Menu Planning',
      author: 'Lisa Park',
      authorRole: 'Chef',
      avatar: '👩‍🍳',
      content: 'How do you plan seasonal menus while keeping costs under control? I source most ingredients from @Restaurant Supply Wholesale and use #Commercial Grade Sanitizer to maintain quality. The @Kitchen Equipment Pro team also helps with seasonal equipment needs!',
      likes: 12,
      replies: 6,
      views: 78,
      createdAt: '2024-02-14T11:00:00',
      isPinned: false,
      tags: ['menu-planning', 'seasonal', 'cost-control']
    }
  ]);

  const categories = [
    'Restaurant Management',
    'Customer Service',
    'Food & Trends',
    'Technology',
    'Menu Planning',
    'Marketing',
    'Finance',
    'General Discussion'
  ];

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    totalPosts: posts.length,
    totalViews: posts.reduce((sum, post) => sum + post.views, 0),
    totalReplies: posts.reduce((sum, post) => sum + post.replies, 0),
    activeUsers: 156
  };

  const trendingTags = ['inventory', 'customer-service', 'trends', 'menu-planning', 'technology'];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Community Forums</h1>
            <p className="text-muted-foreground">Connect with restaurant professionals and share knowledge</p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Discussion
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Start New Discussion</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" placeholder="What's your topic?" />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="content">Content</Label>
                  <Textarea id="content" rows={6} placeholder="Share your thoughts, questions, or experiences..." />
                </div>
                <div>
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input id="tags" placeholder="inventory, tips, management" />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setShowCreateDialog(false)}>
                    Post Discussion
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Posts</p>
                    <h3 className="text-2xl font-bold mt-2">{stats.totalPosts}</h3>
                  </div>
                  <MessageSquare className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Views</p>
                    <h3 className="text-2xl font-bold mt-2 text-green-600">{stats.totalViews}</h3>
                  </div>
                  <Eye className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Replies</p>
                    <h3 className="text-2xl font-bold mt-2 text-purple-600">{stats.totalReplies}</h3>
                  </div>
                  <MessageCircle className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Users</p>
                    <h3 className="text-2xl font-bold mt-2 text-orange-600">{stats.activeUsers}</h3>
                  </div>
                  <Users className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Search discussions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-48">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Posts List */}
            <div className="space-y-4">
              {filteredPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="text-2xl">{post.avatar}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                {post.isPinned && (
                                  <Pin className="h-4 w-4 text-orange-500" />
                                )}
                                <h3 className="font-semibold text-lg hover:text-blue-600 cursor-pointer">
                                  {post.title}
                                </h3>
                              </div>
                              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                                <span className="font-medium">{post.author}</span>
                                <span>•</span>
                                <span>{post.authorRole}</span>
                                <span>•</span>
                                <Badge variant="outline">{post.category}</Badge>
                              </div>
                              <div className="text-gray-700 mb-3">
                                <MentionRenderer content={post.content} />
                              </div>
                              <MentionSummary content={post.content} />
                              <div className="flex items-center space-x-1 mb-3">
                                {post.tags.map(tag => (
                                  <ClickableTag
                                    key={tag}
                                    tag={tag}
                                    variant="secondary"
                                    
                                    showExternalIcon={true}
                                  />
                                ))}
                              </div>
                              <div className="flex items-center space-x-6 text-sm text-gray-500">
                                <div className="flex items-center space-x-1">
                                  <ThumbsUp className="h-4 w-4" />
                                  <span>{post.likes}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <MessageCircle className="h-4 w-4" />
                                  <span>{post.replies}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Eye className="h-4 w-4" />
                                  <span>{post.views}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-4 w-4" />
                                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trending Topics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Trending Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {trendingTags.map(tag => (
                    <ClickableTag
                      key={tag}
                      tag={tag}
                      variant="outline"
                      
                      showExternalIcon={true}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Contributors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="h-5 w-5 mr-2" />
                  Top Contributors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'Sarah Chen', role: 'Restaurant Owner', posts: 24, avatar: '👩‍🍳' },
                    { name: 'Mike Johnson', role: 'Server', posts: 18, avatar: '👨‍💼' },
                    { name: 'Emma Rodriguez', role: 'Chef', posts: 15, avatar: '👩‍🍳' }
                  ].map((contributor, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="text-lg">{contributor.avatar}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{contributor.name}</p>
                        <p className="text-xs text-gray-600">{contributor.role}</p>
                      </div>
                      <Badge variant="secondary">{contributor.posts}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {categories.map(category => (
                    <div
                      key={category}
                      className="flex items-center justify-between text-sm py-1 px-2 hover:bg-gray-50 rounded cursor-pointer"
                      onClick={() => setSelectedCategory(category)}
                    >
                      <span>{category}</span>
                      <Badge variant="outline" className="text-xs">
                        {posts.filter(p => p.category === category).length}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
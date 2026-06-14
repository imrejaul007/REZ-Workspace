'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  MessageSquare, 
  Flag,
  Filter,
  Search,
  ChevronDown,
  MoreHorizontal,
  TrendingUp,
  Users,
  Award,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Image as ImageIcon,
  Video,
  Calendar,
  MapPin,
  Utensils,
  Heart,
  Share2,
  Reply,
  Edit,
  Trash2,
  Eye,
  BarChart3
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface Review {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar?: string;
  reviewerLevel: 'bronze' | 'silver' | 'gold' | 'platinum';
  targetType: 'restaurant' | 'vendor' | 'product' | 'service';
  targetId: string;
  targetName: string;
  rating: number; // 1-5
  title: string;
  content: string;
  pros: string[];
  cons: string[];
  images?: string[];
  videos?: string[];
  categories: {
    food: number;
    service: number;
    ambiance: number;
    value: number;
    cleanliness: number;
  };
  isVerified: boolean;
  visitDate?: string;
  orderValue?: number;
  orderType?: 'dine_in' | 'takeaway' | 'delivery';
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'flagged' | 'hidden' | 'deleted';
  likes: number;
  dislikes: number;
  replies: ReviewReply[];
  helpfulVotes: number;
  reportCount: number;
  isEdited: boolean;
  tags: string[];
}

interface ReviewReply {
  id: string;
  reviewId: string;
  replierType: 'owner' | 'customer' | 'admin';
  replierId: string;
  replierName: string;
  content: string;
  createdAt: string;
  isEdited: boolean;
}

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  categoryAverages: {
    food: number;
    service: number;
    ambiance: number;
    value: number;
    cleanliness: number;
  };
  verifiedReviews: number;
  responseRate: number;
  averageResponseTime: number; // in hours
  recentTrend: 'up' | 'down' | 'stable';
  topTags: { tag: string; count: number }[];
}

interface ReviewSystemProps {
  reviews: Review[];
  stats: ReviewStats;
  userRole: 'admin' | 'restaurant' | 'customer' | 'vendor';
  currentUserId?: string;
  targetInfo?: {
    id: string;
    name: string;
    type: 'restaurant' | 'vendor' | 'product' | 'service';
    image?: string;
  };
  onSubmitReview?: (review: Omit<Review, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'dislikes' | 'replies' | 'helpfulVotes' | 'reportCount'>) => void;
  onReplyToReview?: (reviewId: string, reply: Omit<ReviewReply, 'id' | 'createdAt'>) => void;
  onLikeReview?: (reviewId: string, isLike: boolean) => void;
  onReportReview?: (reviewId: string, reason: string) => void;
  onModerateReview?: (reviewId: string, action: 'approve' | 'hide' | 'delete', reason?: string) => void;
  onMarkHelpful?: (reviewId: string) => void;
}

export default function ReviewSystem({
  reviews,
  stats,
  userRole,
  currentUserId,
  targetInfo,
  onSubmitReview,
  onReplyToReview,
  onLikeReview,
  onReportReview,
  onModerateReview,
  onMarkHelpful
}: ReviewSystemProps) {
  const [selectedTab, setSelectedTab] = useState('reviews');
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  // New review form state
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: '',
    content: '',
    pros: [''],
    cons: [''],
    categories: {
      food: 5,
      service: 5,
      ambiance: 5,
      value: 5,
      cleanliness: 5
    },
    visitDate: '',
    orderType: 'dine_in' as const,
    orderValue: 0
  });

  const getRatingStars = (rating: number, size = 'w-4 h-4') => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star 
        key={i} 
        className={`${size} ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
      />
    ));
  };

  const getReviewerLevelColor = (level: string) => {
    switch (level) {
      case 'bronze': return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20';
      case 'silver': return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
      case 'gold': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'platinum': return 'text-purple-600 bg-purple-50 dark:bg-purple-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         review.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         review.reviewerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRating = ratingFilter === 'all' || review.rating === parseInt(ratingFilter);
    const matchesVerified = !showVerifiedOnly || review.isVerified;
    const matchesStatus = review.status === 'active' || (userRole === 'admin' && review.status !== 'deleted');
    
    return matchesSearch && matchesRating && matchesVerified && matchesStatus;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'newest': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'highest': return b.rating - a.rating;
      case 'lowest': return a.rating - b.rating;
      case 'helpful': return b.helpfulVotes - a.helpfulVotes;
      default: return 0;
    }
  });

  const renderRatingBreakdown = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
          Rating Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-4xl font-bold text-foreground">{stats.averageRating.toFixed(1)}</div>
          <div className="flex justify-center my-2">
            {getRatingStars(stats.averageRating, 'w-6 h-6')}
          </div>
          <p className="text-muted-foreground">{stats.totalReviews} reviews</p>
        </div>

        <Separator />

        <div className="space-y-3">
          {[5, 4, 3, 2, 1].map(rating => {
            const count = stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution];
            const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
            
            return (
              <div key={rating} className="flex items-center space-x-2">
                <span className="w-8 text-sm">{rating}</span>
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <Progress value={percentage} className="flex-1" />
                <span className="w-10 text-sm text-muted-foreground text-right">{count}</span>
              </div>
            );
          })}
        </div>

        <Separator />

        <div>
          <h4 className="font-semibold mb-3">Category Ratings</h4>
          <div className="space-y-2">
            {Object.entries(stats.categoryAverages).map(([category, average]) => (
              <div key={category} className="flex items-center justify-between">
                <span className="text-sm capitalize">{category}</span>
                <div className="flex items-center space-x-2">
                  <div className="flex">
                    {getRatingStars(average)}
                  </div>
                  <span className="text-sm text-muted-foreground">{average.toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderReviewCard = (review: Review) => (
    <Card key={review.id} className={`mb-4 ${review.status === 'flagged' ? 'border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-900/10' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={review.reviewerAvatar} />
              <AvatarFallback>
                {review.reviewerName.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold">{review.reviewerName}</span>
                {review.isVerified && (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                )}
                <Badge variant="outline" className={`text-xs ${getReviewerLevelColor(review.reviewerLevel)}`}>
                  {review.reviewerLevel}
                </Badge>
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <div className="flex">
                  {getRatingStars(review.rating)}
                </div>
                <span className="text-sm text-muted-foreground">
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
                {review.visitDate && (
                  <span className="text-xs text-muted-foreground">
                    • Visited {new Date(review.visitDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {review.status === 'flagged' && (
              <Badge variant="destructive" className="text-xs">
                Flagged
              </Badge>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSelectedReview(review)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                {userRole === 'admin' && (
                  <>
                    <DropdownMenuItem onClick={() => onModerateReview?.(review.id, 'hide')}>
                      <XCircle className="h-4 w-4 mr-2" />
                      Hide Review
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onModerateReview?.(review.id, 'delete')}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Review
                    </DropdownMenuItem>
                  </>
                )}
                {currentUserId !== review.reviewerId && (
                  <DropdownMenuItem onClick={() => onReportReview?.(review.id, 'inappropriate')}>
                    <Flag className="h-4 w-4 mr-2" />
                    Report Review
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg mb-2">{review.title}</h3>
          <p className="text-muted-foreground">{review.content}</p>
        </div>

        {(review.pros.length > 0 || review.cons.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {review.pros.length > 0 && (
              <div>
                <h4 className="font-medium text-green-600 mb-2 flex items-center">
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  Pros
                </h4>
                <ul className="space-y-1">
                  {review.pros.map((pro, index) => (
                    <li key={index} className="text-sm flex items-start">
                      <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {review.cons.length > 0 && (
              <div>
                <h4 className="font-medium text-red-600 mb-2 flex items-center">
                  <ThumbsDown className="h-4 w-4 mr-1" />
                  Cons
                </h4>
                <ul className="space-y-1">
                  {review.cons.map((con, index) => (
                    <li key={index} className="text-sm flex items-start">
                      <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      {con}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Category Ratings */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-3 bg-muted/30 rounded-lg">
          {Object.entries(review.categories).map(([category, rating]) => (
            <div key={category} className="text-center">
              <p className="text-xs text-muted-foreground capitalize">{category}</p>
              <div className="flex justify-center">
                {getRatingStars(rating)}
              </div>
            </div>
          ))}
        </div>

        {/* Media */}
        {(review.images && review.images.length > 0) && (
          <div className="flex space-x-2">
            {review.images.map((image, index) => (
              <div key={index} className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onLikeReview?.(review.id, true)}
              className="flex items-center space-x-1"
            >
              <ThumbsUp className="h-4 w-4" />
              <span>{review.likes}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onLikeReview?.(review.id, false)}
              className="flex items-center space-x-1"
            >
              <ThumbsDown className="h-4 w-4" />
              <span>{review.dislikes}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMarkHelpful?.(review.id)}
              className="flex items-center space-x-1"
            >
              <Heart className="h-4 w-4" />
              <span>Helpful ({review.helpfulVotes})</span>
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            {review.orderValue && (
              <Badge variant="outline" className="text-xs">
                ₹{review.orderValue}
              </Badge>
            )}
            {review.orderType && (
              <Badge variant="outline" className="text-xs">
                {review.orderType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            )}
            <Button variant="outline" size="sm">
              <Reply className="h-4 w-4 mr-1" />
              Reply
            </Button>
          </div>
        </div>

        {/* Replies */}
        {review.replies && review.replies.length > 0 && (
          <div className="space-y-3 pl-4 border-l-2 border-muted">
            {review.replies.map((reply) => (
              <div key={reply.id} className="bg-muted/30 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-sm">{reply.replierName}</span>
                    <Badge variant="outline" className="text-xs">
                      {reply.replierType === 'owner' ? 'Owner' : reply.replierType}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(reply.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm">{reply.content}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderWriteReviewForm = () => (
    <Dialog open={showWriteReview} onOpenChange={setShowWriteReview}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Write a Review</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Overall Rating */}
          <div>
            <label className="block text-sm font-medium mb-2">Overall Rating</label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map(rating => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setNewReview(prev => ({ ...prev, rating }))}
                  className="focus:outline-none"
                >
                  <Star 
                    className={`w-8 h-8 ${rating <= newReview.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-muted-foreground">({newReview.rating}/5)</span>
            </div>
          </div>

          {/* Category Ratings */}
          <div>
            <label className="block text-sm font-medium mb-3">Category Ratings</label>
            <div className="space-y-3">
              {Object.entries(newReview.categories).map(([category, rating]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{category}</span>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setNewReview(prev => ({
                          ...prev,
                          categories: { ...prev.categories, [category]: r }
                        }))}
                        className="focus:outline-none"
                      >
                        <Star 
                          className={`w-4 h-4 ${r <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Title and Content */}
          <div>
            <label className="block text-sm font-medium mb-2">Review Title</label>
            <Input
              value={newReview.title}
              onChange={(e) => setNewReview(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Summarize your experience in one line"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Your Review</label>
            <Textarea
              value={newReview.content}
              onChange={(e) => setNewReview(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Share your detailed experience..."
              rows={4}
            />
          </div>

          {/* Pros and Cons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">What did you like?</label>
              <div className="space-y-2">
                {newReview.pros.map((pro, index) => (
                  <Input
                    key={index}
                    value={pro}
                    onChange={(e) => {
                      const newPros = [...newReview.pros];
                      newPros[index] = e.target.value;
                      setNewReview(prev => ({ ...prev, pros: newPros }));
                    }}
                    placeholder={`Pro #${index + 1}`}
                  />
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setNewReview(prev => ({ ...prev, pros: [...prev.pros, ''] }))}
                >
                  Add Another Pro
                </Button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">What could be better?</label>
              <div className="space-y-2">
                {newReview.cons.map((con, index) => (
                  <Input
                    key={index}
                    value={con}
                    onChange={(e) => {
                      const newCons = [...newReview.cons];
                      newCons[index] = e.target.value;
                      setNewReview(prev => ({ ...prev, cons: newCons }));
                    }}
                    placeholder={`Con #${index + 1}`}
                  />
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setNewReview(prev => ({ ...prev, cons: [...prev.cons, ''] }))}
                >
                  Add Another Con
                </Button>
              </div>
            </div>
          </div>

          <div className="flex space-x-4 pt-4">
            <Button 
              onClick={() => {
                if (onSubmitReview && targetInfo) {
                  onSubmitReview({
                    ...newReview,
                    reviewerId: currentUserId || '',
                    reviewerName: 'Current User', // This would come from auth context
                    reviewerLevel: 'bronze' as const,
                    targetType: targetInfo.type,
                    targetId: targetInfo.id,
                    targetName: targetInfo.name,
                    isVerified: false,
                    pros: newReview.pros.filter(p => p.trim() !== ''),
                    cons: newReview.cons.filter(c => c.trim() !== ''),
                    status: 'active' as const,
                    isEdited: false,
                    tags: []
                  });
                  setShowWriteReview(false);
                  // Reset form
                  setNewReview({
                    rating: 5,
                    title: '',
                    content: '',
                    pros: [''],
                    cons: [''],
                    categories: {
                      food: 5,
                      service: 5,
                      ambiance: 5,
                      value: 5,
                      cleanliness: 5
                    },
                    visitDate: '',
                    orderType: 'dine_in',
                    orderValue: 0
                  });
                }
              }}
              className="flex-1"
            >
              Submit Review
            </Button>
            <Button variant="outline" onClick={() => setShowWriteReview(false)}>
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
            <MessageSquare className="h-8 w-8 mr-3 text-blue-600" />
            Reviews & Ratings
            {targetInfo && (
              <span className="ml-2 text-muted-foreground">for {targetInfo.name}</span>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">
            Customer feedback and rating management system
          </p>
        </div>
        {userRole === 'customer' && (
          <Button onClick={() => setShowWriteReview(true)}>
            <Star className="h-4 w-4 mr-2" />
            Write Review
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Reviews</p>
                <p className="text-2xl font-bold">{stats.totalReviews}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Average Rating</p>
                <p className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Verified Reviews</p>
                <p className="text-2xl font-bold">{stats.verifiedReviews}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Response Rate</p>
                <p className="text-2xl font-bold">{stats.responseRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Rating Breakdown */}
        <div className="lg:col-span-1">
          {renderRatingBreakdown()}
        </div>

        {/* Main Reviews Area */}
        <div className="lg:col-span-3">
          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search reviews..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={ratingFilter} onValueChange={setRatingFilter}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ratings</SelectItem>
                    <SelectItem value="5">5 Stars</SelectItem>
                    <SelectItem value="4">4 Stars</SelectItem>
                    <SelectItem value="3">3 Stars</SelectItem>
                    <SelectItem value="2">2 Stars</SelectItem>
                    <SelectItem value="1">1 Star</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                    <SelectItem value="highest">Highest Rated</SelectItem>
                    <SelectItem value="lowest">Lowest Rated</SelectItem>
                    <SelectItem value="helpful">Most Helpful</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant={showVerifiedOnly ? "default" : "outline"}
                  onClick={() => setShowVerifiedOnly(!showVerifiedOnly)}
                  className="whitespace-nowrap"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Verified Only
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Reviews List */}
          <div>
            {filteredReviews.map(renderReviewCard)}
            
            {filteredReviews.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No reviews found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery || ratingFilter !== 'all' || showVerifiedOnly
                      ? 'Try adjusting your filters to see more reviews.'
                      : 'Be the first to write a review!'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Write Review Modal */}
      {renderWriteReviewForm()}
    </div>
  );
}
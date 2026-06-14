'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Heart,
  Reply,
  MoreHorizontal,
  Edit,
  Trash2,
  Flag,
  ChevronDown,
  ChevronUp,
  Send,
  Pin,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatDistanceToNow, cn } from '@/lib/utils';
import Image from 'next/image';

interface Comment {
  id: string;
  content: string;
  authorId: string;
  author: {
    id: string;
    name: string;
    role: 'restaurant' | 'employee' | 'vendor' | 'admin';
    avatar?: string;
    verified: boolean;
  };
  createdAt: string;
  updatedAt: string;
  likes: number;
  isLiked: boolean;
  isPinned: boolean;
  replies?: Comment[];
  parentId?: string;
}

interface CommentsSectionProps {
  postId: string;
  comments: Comment[];
  totalComments: number;
  currentUserId: string;
  currentUserRole: 'restaurant' | 'employee' | 'vendor' | 'admin';
  onAddComment: (postId: string, content: string, parentId?: string) => Promise<void>;
  onUpdateComment: (commentId: string, content: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  onLikeComment: (commentId: string) => void;
  onReportComment: (commentId: string, reason: string) => void;
  onPinComment: (commentId: string) => void;
  isPostAuthor: boolean;
}

export default function CommentsSection({
  postId,
  comments,
  totalComments,
  currentUserId,
  currentUserRole,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  onLikeComment,
  onReportComment,
  onPinComment,
  isPostAuthor
}: CommentsSectionProps) {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [showAllComments, setShowAllComments] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddComment(postId, newComment.trim());
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddComment(postId, replyContent.trim(), parentId);
      setReplyingTo(null);
      setReplyContent('');
    } catch (error) {
      console.error('Error adding reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      await onUpdateComment(commentId, editContent.trim());
      setEditingComment(null);
      setEditContent('');
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  const handleStartEdit = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  };

  const toggleReplies = (commentId: string) => {
    const newExpanded = new Set(expandedComments);
    if (expandedComments.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedComments(newExpanded);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-red-600';
      case 'restaurant': return 'text-blue-600';
      case 'vendor': return 'text-green-600';
      case 'employee': return 'text-purple-600';
      default: return 'text-muted-foreground';
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return { label: 'Admin', variant: 'destructive' as const };
      case 'restaurant': return { label: 'Restaurant', variant: 'default' as const };
      case 'vendor': return { label: 'Vendor', variant: 'secondary' as const };
      case 'employee': return { label: 'Employee', variant: 'outline' as const };
      default: return null;
    }
  };

  const CommentComponent = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => {
    const isAuthor = comment.authorId === currentUserId;
    const canEdit = isAuthor;
    const canDelete = isAuthor || currentUserRole === 'admin' || isPostAuthor;
    const canPin = isPostAuthor && !isReply;
    const roleBadge = getRoleBadge(comment.author.role);

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'space-y-3',
          isReply && 'ml-8 pl-4 border-l-2 border-border',
          comment.isPinned && 'bg-accent/30 p-3 rounded-lg'
        )}
      >
        <div className="flex items-start space-x-3">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            {comment.author.avatar ? (
              <Image
                src={comment.author.avatar}
                alt={comment.author.name}
                width={32}
                height={32}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-sm font-medium text-muted-foreground">
                {comment.author.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Author Info */}
            <div className="flex items-center space-x-2 mb-1">
              {comment.isPinned && (
                <Pin className="h-3 w-3 text-primary" />
              )}
              <span className="font-medium text-sm text-foreground">
                {comment.author.name}
              </span>
              {comment.author.verified && (
                <CheckCircle className="h-3 w-3 text-success-500" />
              )}
              {roleBadge && (
                <Badge variant={roleBadge.variant} className="text-xs">
                  {roleBadge.label}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(comment.createdAt)} ago
              </span>
              {comment.updatedAt !== comment.createdAt && (
                <span className="text-xs text-muted-foreground">• edited</span>
              )}
            </div>

            {/* Comment Content */}
            {editingComment === comment.id ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    onClick={() => handleUpdateComment(comment.id)}
                    disabled={!editContent.trim()}
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingComment(null);
                      setEditContent('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-foreground leading-relaxed">
                {comment.content}
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center space-x-4 mt-2">
              <button
                onClick={() => onLikeComment(comment.id)}
                className={cn(
                  'flex items-center space-x-1 text-xs transition-colors',
                  comment.isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'
                )}
              >
                <Heart className={cn('h-3 w-3', comment.isLiked && 'fill-current')} />
                <span>{comment.likes}</span>
              </button>

              {!isReply && (
                <button
                  onClick={() => {
                    setReplyingTo(replyingTo === comment.id ? null : comment.id);
                    setReplyContent('');
                  }}
                  className="flex items-center space-x-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Reply className="h-3 w-3" />
                  <span>Reply</span>
                </button>
              )}

              {comment.replies && comment.replies.length > 0 && (
                <button
                  onClick={() => toggleReplies(comment.id)}
                  className="flex items-center space-x-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {expandedComments.has(comment.id) ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                  <span>{comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}</span>
                </button>
              )}

              {/* More Actions */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="default"
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
                
                {/* Dropdown would go here */}
              </div>
            </div>

            {/* Reply Form */}
            {replyingTo === comment.id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 space-y-2"
              >
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder={`Replying to ${comment.author.name}...`}
                  rows={2}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    onClick={() => handleSubmitReply(comment.id)}
                    disabled={!replyContent.trim() || isSubmitting}
                  >
                    {isSubmitting ? 'Replying...' : 'Reply'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyContent('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Replies */}
            {comment.replies && expandedComments.has(comment.id) && (
              <div className="mt-4 space-y-4">
                {comment.replies.map((reply) => (
                  <CommentComponent key={reply.id} comment={reply} isReply={true} />
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const displayComments = showAllComments ? comments : comments.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Comments Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center space-x-2">
          <MessageSquare className="h-4 w-4" />
          <span>{totalComments} {totalComments === 1 ? 'Comment' : 'Comments'}</span>
        </h3>
      </div>

      {/* New Comment Form */}
      <div className="space-y-3">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium text-muted-foreground">
              {currentUserRole.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {newComment.length}/500 characters
          </span>
          <Button
            onClick={handleSubmitComment}
            disabled={!newComment.trim() || isSubmitting}
            className="flex items-center space-x-2"
            size="default"
            variant="default"
          >
            <Send className="h-4 w-4" />
            <span>{isSubmitting ? 'Posting...' : 'Post Comment'}</span>
          </Button>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-6">
        {displayComments.map((comment) => (
          <CommentComponent key={comment.id} comment={comment} />
        ))}
      </div>

      {/* Load More Comments */}
      {comments.length > 5 && !showAllComments && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => setShowAllComments(true)}
          >
            Show all {totalComments} comments
          </Button>
        </div>
      )}
    </div>
  );
}
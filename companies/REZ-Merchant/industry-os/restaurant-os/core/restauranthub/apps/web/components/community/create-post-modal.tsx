'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Image as ImageIcon,
  FileText,
  Hash,
  MapPin,
  Calendar,
  Users,
  Globe,
  Lock,
  ChefHat,
  Briefcase,
  Star,
  MessageSquare,
  Upload,
  Lightbulb,
  Building2,
  UserCheck,
  Package,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClickableTag } from '@/components/ui/clickable-tag';
import { MentionAutocomplete } from '@/components/ui/mention-autocomplete';
import { MentionValidation } from '@/components/ui/mention-renderer';
import { extractMentionsAsTags, MentionItem } from '@/lib/mention-system';
import { cn } from '@/lib/utils';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePost: (post: {
    content: string;
    category: string;
    visibility: 'public' | 'private' | 'followers';
    roleVisibility?: string;
    images?: string[];
    tags?: string[];
    location?: string;
  }) => void;
  userRole: 'restaurant' | 'employee' | 'vendor' | 'admin';
}

const postCategories = [
  { id: 'discussion', label: 'Discussion', icon: MessageSquare, color: 'bg-blue-500' },
  { id: 'tip', label: 'Tip & Advice', icon: Star, color: 'bg-yellow-500' },
  { id: 'recipe', label: 'Recipe', icon: ChefHat, color: 'bg-green-500' },
  { id: 'job', label: 'Job Opportunity', icon: Briefcase, color: 'bg-purple-500' },
  { id: 'news', label: 'Industry News', icon: FileText, color: 'bg-red-500' },
  { id: 'review', label: 'Review', icon: Star, color: 'bg-orange-500' },
  { id: 'suggestion', label: 'Suggestion', icon: Lightbulb, color: 'bg-cyan-500' }
];

const visibilityOptions = [
  { id: 'public', label: 'Public', icon: Globe, description: 'Everyone can see this post' },
  { id: 'followers', label: 'Followers', icon: Users, description: 'Only your followers can see this' },
  { id: 'private', label: 'Private', icon: Lock, description: 'Only you can see this post' }
];

const roleBasedVisibilityOptions = [
  { id: 'restaurants', label: 'Restaurants Only', icon: Building2, description: 'Only restaurant owners can see this' },
  { id: 'employees', label: 'Employees Only', icon: UserCheck, description: 'Only restaurant employees can see this' },
  { id: 'vendors', label: 'Vendors Only', icon: Package, description: 'Only vendors can see this' },
  { id: 'admins', label: 'Admins Only', icon: Shield, description: 'Only admins can see this' },
  { id: 'restaurants-employees', label: 'Restaurants & Employees', icon: Building2, description: 'Only restaurants and employees can see this' },
  { id: 'restaurants-vendors', label: 'Restaurants & Vendors', icon: Building2, description: 'Only restaurants and vendors can see this' },
  { id: 'employees-vendors', label: 'Employees & Vendors', icon: UserCheck, description: 'Only employees and vendors can see this' }
];

export default function CreatePostModal({
  isOpen,
  onClose,
  onCreatePost,
  userRole
}: CreatePostModalProps) {
  const [content, setContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('discussion');
  const [selectedVisibility, setSelectedVisibility] = useState<'public' | 'private' | 'followers'>('public');
  const [selectedRoleVisibility, setSelectedRoleVisibility] = useState('');
  const [showAdvancedVisibility, setShowAdvancedVisibility] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [location, setLocation] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mentionValidationErrors, setMentionValidationErrors] = useState<string[]>([]);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleAddTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim()) && tags.length < 5) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleMentionSelect = (mention: MentionItem, symbol: string) => {
    // Automatically add mentioned items as tags if not already present
    const mentionTag = mention.name.toLowerCase().replace(/\s+/g, '-');
    if (!tags.includes(mentionTag)) {
      setTags(prev => [...prev, mentionTag]);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    if (mentionValidationErrors.length > 0) {
      // Don't submit if there are invalid mentions
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Extract mentions as additional tags
      const mentionTags = extractMentionsAsTags(content);
      const allTags = [...new Set([...tags, ...mentionTags])]; // Remove duplicates
      
      await onCreatePost({
        content: content.trim(),
        category: selectedCategory,
        visibility: selectedVisibility,
        roleVisibility: selectedRoleVisibility || undefined,
        images,
        tags: allTags.length > 0 ? allTags : undefined,
        location: location.trim() || undefined
      });
      
      // Reset form
      setContent('');
      setSelectedCategory('discussion');
      setSelectedVisibility('public');
      setSelectedRoleVisibility('');
      setShowAdvancedVisibility(false);
      setTags([]);
      setCurrentTag('');
      setLocation('');
      setImages([]);
      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-2xl max-h-[90vh] overflow-hidden"
          >
            <Card>
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-xl font-semibold text-foreground">Create Post</h2>
                <Button variant="ghost" onClick={onClose} size="default">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Content */}
              <CardContent className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Post Content */}
                <div className="relative">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    What's on your mind?
                  </label>
                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Share your thoughts, experiences, or questions with the ${userRole === 'restaurant' ? 'restaurant' : userRole} community...`}
                    rows={4}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  />
                  
                  {/* Mention Autocomplete */}
                  <MentionAutocomplete
                    textareaRef={textareaRef}
                    onMentionSelect={handleMentionSelect}
                  />
                  
                  <div className="mt-2 space-y-2">
                    <p className="text-xs text-muted-foreground">
                      {content.length}/1000 characters • Press Cmd/Ctrl + Enter to post
                    </p>
                    <p className="text-xs text-muted-foreground">
                      💡 Type <strong>@VendorName</strong>, <strong>#ProductName</strong>, or <strong>$ServiceName</strong> to mention marketplace items
                    </p>
                  </div>
                  
                  {/* Mention Validation */}
                  <MentionValidation
                    content={content}
                    onValidationChange={(isValid, errors) => setMentionValidationErrors(errors)}
                  />
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">
                    Category
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {postCategories.map((category) => {
                      const Icon = category.icon;
                      return (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategory(category.id)}
                          className={cn(
                            'flex items-center space-x-2 p-3 rounded-lg border transition-all',
                            selectedCategory === category.id
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border hover:border-primary/50 hover:bg-accent'
                          )}
                        >
                          <div className={cn('w-2 h-2 rounded-full', category.color)} />
                          <Icon className="h-4 w-4" />
                          <span className="text-sm font-medium">{category.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Visibility */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">
                    Who can see this?
                  </label>
                  <div className="space-y-2">
                    {visibilityOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.id}
                          onClick={() => {
                            setSelectedVisibility(option.id as unknown);
                            setSelectedRoleVisibility('');
                            setShowAdvancedVisibility(false);
                          }}
                          className={cn(
                            'w-full flex items-start space-x-3 p-3 rounded-lg border transition-all text-left',
                            selectedVisibility === option.id
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50 hover:bg-accent'
                          )}
                        >
                          <Icon className={cn(
                            'h-4 w-4 mt-1 flex-shrink-0',
                            selectedVisibility === option.id ? 'text-primary' : 'text-muted-foreground'
                          )} />
                          <div>
                            <p className={cn(
                              'font-medium',
                              selectedVisibility === option.id ? 'text-primary' : 'text-foreground'
                            )}>
                              {option.label}
                            </p>
                            <p className="text-xs text-muted-foreground">{option.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Advanced Visibility Toggle */}
                  <div className="pt-4 border-t border-border">
                    <button
                      type="button"
                      onClick={() => setShowAdvancedVisibility(!showAdvancedVisibility)}
                      className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showAdvancedVisibility ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      <span>{showAdvancedVisibility ? 'Hide' : 'Show'} Role-Based Options</span>
                    </button>
                  </div>
                  
                  {/* Advanced Role-Based Visibility Options */}
                  {showAdvancedVisibility && (
                    <div className="space-y-2 pt-2">
                      <p className="text-sm font-medium text-foreground mb-2">Role-Based Visibility</p>
                      {roleBasedVisibilityOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.id}
                            onClick={() => {
                              setSelectedRoleVisibility(option.id);
                              setSelectedVisibility('public'); // Reset to public for backend compatibility
                            }}
                            className={cn(
                              'w-full flex items-start space-x-3 p-3 rounded-lg border transition-all text-left',
                              selectedRoleVisibility === option.id
                                ? 'border-primary bg-primary/10'
                                : 'border-border hover:border-primary/50 hover:bg-accent'
                            )}
                          >
                            <Icon className={cn(
                              'h-4 w-4 mt-1 flex-shrink-0',
                              selectedRoleVisibility === option.id ? 'text-primary' : 'text-muted-foreground'
                            )} />
                            <div>
                              <p className={cn(
                                'font-medium',
                                selectedRoleVisibility === option.id ? 'text-primary' : 'text-foreground'
                              )}>
                                {option.label}
                              </p>
                              <p className="text-xs text-muted-foreground">{option.description}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Tags (Optional)
                  </label>
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="relative flex-1">
                      <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={currentTag}
                        onChange={(e) => setCurrentTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                        placeholder="Add a tag..."
                        className="w-full pl-10 pr-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <Button
                      type="button"
                      size="default"
                      variant="default"
                      onClick={handleAddTag}
                      disabled={!currentTag.trim() || tags.length >= 5}
                    >
                      Add
                    </Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag, index) => (
                        <ClickableTag
                          key={index}
                          tag={tag}
                          variant="secondary"
                          showRemove={true}
                          showExternalIcon={false}
                          onRemove={() => handleRemoveTag(tag)}
                        />
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {tags.length}/5 tags • Click tags to remove them
                  </p>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Location (Optional)
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Where are you posting from?"
                      className="w-full pl-10 pr-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Images (Optional)
                  </label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer">
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload images or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG, GIF up to 5MB each (max 4 images)
                    </p>
                  </div>
                </div>
              </CardContent>

              {/* Footer */}
              <div className="flex items-center justify-between p-6 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  Posting as <span className="font-medium capitalize">{userRole}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Button variant="outline" onClick={onClose} size="default">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!content.trim() || isSubmitting || mentionValidationErrors.length > 0}
                    size="default"
                    variant="default"
                    className={mentionValidationErrors.length > 0 ? 'opacity-50 cursor-not-allowed' : ''}
                    title={mentionValidationErrors.length > 0 ? 'Please fix invalid mentions before posting' : ''}
                  >
                    {isSubmitting ? 'Posting...' : 'Post'}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
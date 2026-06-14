'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  Clock,
  DollarSign,
  Building2,
  Users,
  Calendar,
  BookmarkPlus,
  Bookmark,
  Share2,
  ExternalLink,
  Briefcase,
  Star,
  CheckCircle,
  AlertCircle,
  Eye,
  Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { formatDate, formatDistanceToNow, cn } from '@/lib/utils';

interface Job {
  id: string;
  title: string;
  company: {
    id: string;
    name: string;
    logo?: string;
    verified: boolean;
    rating?: number;
    location: string;
  };
  description: string;
  requirements: string[];
  responsibilities?: string[];
  benefits?: string[];
  location: {
    city: string;
    state: string;
    remote: boolean;
    hybrid: boolean;
  };
  employment: {
    type: 'full-time' | 'part-time' | 'contract' | 'temporary' | 'internship';
    experience: string;
    department: string;
  };
  salary: {
    min?: number;
    max?: number;
    currency: string;
    period: 'hourly' | 'monthly' | 'yearly';
    negotiable: boolean;
  };
  application: {
    deadline?: string;
    method: 'internal' | 'external' | 'email';
    externalUrl?: string;
    email?: string;
    status: 'open' | 'closed' | 'filled';
  };
  stats: {
    views: number;
    applications: number;
    likes: number;
  };
  tags: string[];
  featured: boolean;
  urgent: boolean;
  createdAt: string;
  updatedAt: string;
}

interface JobCardProps {
  job: Job;
  onApply?: (jobId: string) => void;
  onBookmark?: (jobId: string) => void;
  onShare?: (jobId: string) => void;
  onView?: (jobId: string) => void;
  isBookmarked?: boolean;
  isLiked?: boolean;
  currentUserRole?: string;
  variant?: 'default' | 'compact' | 'detailed';
  showCompanyInfo?: boolean;
}

export default function JobCard({
  job,
  onApply,
  onBookmark,
  onShare,
  onView,
  isBookmarked = false,
  isLiked = false,
  currentUserRole = 'employee',
  variant = 'default',
  showCompanyInfo = true
}: JobCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getEmploymentTypeColor = (type: string) => {
    switch (type) {
      case 'full-time': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'part-time': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'contract': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'temporary': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'internship': return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatSalary = () => {
    const { min, max, currency, period, negotiable } = job.salary;
    
    if (negotiable && !min && !max) {
      return 'Negotiable';
    }
    
    const formatAmount = (amount: number) => {
      if (amount >= 100000) {
        return `${(amount / 100000).toFixed(1)}L`;
      }
      if (amount >= 1000) {
        return `${(amount / 1000).toFixed(0)}K`;
      }
      return amount.toString();
    };
    
    const currencySymbol = currency === 'INR' ? '₹' : '$';
    const periodText = period === 'monthly' ? '/month' : period === 'yearly' ? '/year' : '/hour';
    
    if (min && max) {
      return `${currencySymbol}${formatAmount(min)} - ${formatAmount(max)}${periodText}`;
    }
    if (min) {
      return `${currencySymbol}${formatAmount(min)}+ ${periodText}`;
    }
    if (max) {
      return `Up to ${currencySymbol}${formatAmount(max)}${periodText}`;
    }
    
    return 'Salary not specified';
  };

  const isApplicationDeadlineSoon = () => {
    if (!job.application.deadline) return false;
    const deadline = new Date(job.application.deadline);
    const now = new Date();
    const diffInDays = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diffInDays <= 3 && diffInDays > 0;
  };

  const isApplicationOverdue = () => {
    if (!job.application.deadline) return false;
    const deadline = new Date(job.application.deadline);
    const now = new Date();
    return deadline < now;
  };

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-background border border-border rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer"
        onClick={() => onView?.(job.id)}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="font-semibold text-foreground line-clamp-1">{job.title}</h3>
              {job.featured && (
                <Badge className="bg-primary text-primary-foreground text-xs">
                  Featured
                </Badge>
              )}
              {job.urgent && (
                <Badge className="bg-red-500 text-white text-xs">
                  Urgent
                </Badge>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
              {job.company.name} • {job.location.city}, {job.location.state}
            </p>
            
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span className={cn('px-2 py-1 rounded text-xs', getEmploymentTypeColor(job.employment.type))}>
                {job.employment.type}
              </span>
              <span>{formatSalary()}</span>
              <span>{formatDistanceToNow(job.createdAt)}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-1 ml-4">
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onBookmark?.(job.id); }}>
              {isBookmarked ? (
                <Bookmark className="h-4 w-4 fill-yellow-500 text-yellow-500" />
              ) : (
                <BookmarkPlus className="h-4 w-4" />
              )}
            </Button>
            <Button 
              size="sm" 
              onClick={(e) => { e.stopPropagation(); onApply?.(job.id); }}
              disabled={job.application.status === 'closed' || isApplicationOverdue()}
            >
              Apply
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card className={cn(
        'hover:shadow-lg transition-all duration-300 cursor-pointer',
        job.featured && 'ring-2 ring-primary/20',
        job.urgent && 'ring-2 ring-red-500/20'
      )}>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4 flex-1">
              {/* Company Logo */}
              {showCompanyInfo && (
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                  {job.company.logo ? (
                    <img 
                      src={job.company.logo} 
                      alt={job.company.name}
                      className="w-full h-full rounded-lg object-cover"
                    />
                  ) : (
                    <Building2 className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="text-lg font-semibold text-foreground line-clamp-1">
                    {job.title}
                  </h3>
                  {job.featured && (
                    <Badge className="bg-primary text-primary-foreground">
                      <Star className="h-3 w-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                  {job.urgent && (
                    <Badge className="bg-red-500 text-white">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Urgent
                    </Badge>
                  )}
                </div>
                
                {showCompanyInfo && (
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-medium text-foreground">{job.company.name}</span>
                    {job.company.verified && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {job.company.rating && (
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-muted-foreground">{job.company.rating}</span>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>{job.location.city}, {job.location.state}</span>
                    {job.location.remote && (
                      <Badge variant="outline" className="text-xs ml-1">Remote</Badge>
                    )}
                    {job.location.hybrid && (
                      <Badge variant="outline" className="text-xs ml-1">Hybrid</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Briefcase className="h-4 w-4" />
                    <span>{job.employment.experience}</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{formatDistanceToNow(job.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onShare?.(job.id);
                }}
              >
                <Share2 className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onBookmark?.(job.id);
                }}
              >
                {isBookmarked ? (
                  <Bookmark className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                ) : (
                  <BookmarkPlus className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent 
          className="space-y-4"
          onClick={() => onView?.(job.id)}
        >
          {/* Job Description */}
          <p className="text-foreground leading-relaxed line-clamp-3">
            {job.description}
          </p>

          {/* Key Requirements */}
          {job.requirements.length > 0 && (
            <div>
              <h4 className="font-medium text-foreground mb-2">Key Requirements:</h4>
              <div className="flex flex-wrap gap-2">
                {job.requirements.slice(0, 5).map((requirement, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {requirement}
                  </Badge>
                ))}
                {job.requirements.length > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{job.requirements.length - 5} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          {job.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {job.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Job Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Employment Type</p>
              <span className={cn('px-2 py-1 rounded text-xs font-medium', getEmploymentTypeColor(job.employment.type))}>
                {job.employment.type}
              </span>
            </div>
            
            <div>
              <p className="text-xs text-muted-foreground mb-1">Salary</p>
              <p className="font-medium text-foreground">{formatSalary()}</p>
            </div>
            
            <div>
              <p className="text-xs text-muted-foreground mb-1">Department</p>
              <p className="font-medium text-foreground">{job.employment.department}</p>
            </div>
            
            <div>
              <p className="text-xs text-muted-foreground mb-1">Applications</p>
              <div className="flex items-center space-x-2">
                <Users className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium text-foreground">{job.stats.applications}</span>
              </div>
            </div>
          </div>

          {/* Application Deadline Warning */}
          {isApplicationDeadlineSoon() && (
            <div className="flex items-center space-x-2 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Application deadline: {formatDate(job.application.deadline!)}
              </p>
            </div>
          )}

          {isApplicationOverdue() && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-950 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <p className="text-sm text-red-800 dark:text-red-200">
                Application deadline has passed
              </p>
            </div>
          )}

          {/* Engagement Stats */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Eye className="h-4 w-4" />
                <span>{job.stats.views}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>{job.stats.applications} applied</span>
              </div>
              <div className="flex items-center space-x-1">
                <Heart className="h-4 w-4" />
                <span>{job.stats.likes}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onView?.(job.id);
                }}
              >
                View Details
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
              
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  onApply?.(job.id);
                }}
                disabled={job.application.status === 'closed' || isApplicationOverdue()}
                className="min-w-[100px]"
              >
                {job.application.status === 'closed' ? 'Closed' :
                 isApplicationOverdue() ? 'Expired' :
                 'Apply Now'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
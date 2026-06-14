'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from '@/lib/toast';
import {
  ArrowLeft,
  MapPin,
  DollarSign,
  Clock,
  Calendar,
  Users,
  Briefcase,
  Building2,
  Star,
  CheckCircle,
  AlertCircle,
  Heart,
  Share2,
  BookmarkPlus,
  Bookmark,
  Send,
  Eye,
  Globe,
  Phone,
  Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useAuth } from '@/lib/auth/auth-provider';
import JobApplicationForm from '@/components/jobs/job-application-form';
import { formatDate, formatDistanceToNow, cn } from '@/lib/utils';

interface JobDetail {
  id: string;
  title: string;
  company: {
    id: string;
    name: string;
    logo?: string;
    verified: boolean;
    rating: number;
    location: string;
    website?: string;
    phone?: string;
    email?: string;
    description?: string;
    size?: string;
  };
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
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

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '/api';

/** Normalise a raw API job into the local JobDetail shape. */
function normalizeJobDetail(raw): JobDetail {
  return {
    id: raw.id,
    title: raw.title,
    company: {
      id: raw.restaurant?.id ?? raw.restaurantId ?? '',
      name: raw.restaurant?.name ?? 'Unknown',
      verified: false,
      rating: raw.restaurant?.rating ?? 0,
      location: raw.location ?? '',
      website: raw.restaurant?.website,
      phone: raw.restaurant?.phone,
      email: raw.restaurant?.email,
      description: raw.restaurant?.description,
      size: raw.restaurant?.size,
    },
    description: raw.description ?? '',
    requirements: raw.requirements ?? [],
    responsibilities: raw.responsibilities ?? [],
    benefits: raw.benefits ?? [],
    location: {
      city: raw.location ?? '',
      state: '',
      remote: raw.isRemote ?? false,
      hybrid: false,
    },
    employment: {
      type: (raw.jobType ?? raw.employmentType ?? 'FULL_TIME')
        .toLowerCase()
        .replace('_', '-') as JobDetail['employment']['type'],
      experience: raw.experience ?? '',
      department: raw.department ?? '',
    },
    salary: {
      min: raw.salaryMin ?? undefined,
      max: raw.salaryMax ?? undefined,
      currency: raw.currency ?? 'INR',
      period: 'monthly',
      negotiable: false,
    },
    application: {
      deadline: raw.validTill ?? raw.applicationDeadline,
      method: 'internal',
      status: raw.status === 'OPEN' ? 'open' : raw.status === 'FILLED' ? 'filled' : 'closed',
    },
    stats: {
      views: raw.viewCount ?? 0,
      applications: raw.applicationCount ?? 0,
      likes: 0,
    },
    tags: raw.skills ?? [],
    featured: false,
    urgent: false,
    createdAt: raw.createdAt ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  };
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        const jobId = params.id as string;
        const res = await fetch(`${API_BASE}/jobs/${jobId}`, {
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        if (res.status === 404) {
          toast.error('Job not found', 'The job you are looking for does not exist.');
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const raw = await res.json();
        setJob(normalizeJobDetail(raw));
      } catch (error) {
        toast.error('Error loading job', 'Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [params.id]);

  const formatSalary = () => {
    if (!job) return '';
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

  const isApplicationDeadlineSoon = () => {
    if (!job?.application.deadline) return false;
    const deadline = new Date(job.application.deadline);
    const now = new Date();
    const diffInDays = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diffInDays <= 3 && diffInDays > 0;
  };

  const isApplicationOverdue = () => {
    if (!job?.application.deadline) return false;
    const deadline = new Date(job.application.deadline);
    const now = new Date();
    return deadline < now;
  };

  const handleApply = () => {
    if (!user) {
      toast.error('Login required', 'Please login to apply for jobs.');
      router.push('/auth/login');
      return;
    }
    setShowApplicationForm(true);
  };

  const handleSaveJob = () => {
    if (!user) {
      toast.error('Login required', 'Please login to save jobs.');
      return;
    }
    setIsSaved(!isSaved);
    toast.success(
      isSaved ? 'Job removed from saved jobs' : 'Job saved successfully',
      isSaved ? 'You can find it in your saved jobs.' : 'Removed from your saved jobs.'
    );
  };

  const handleLikeJob = () => {
    if (!user) {
      toast.error('Login required', 'Please login to like jobs.');
      return;
    }
    setIsLiked(!isLiked);
    if (job) {
      job.stats.likes += isLiked ? -1 : 1;
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied', 'Job link copied to clipboard.');
    } catch (error) {
      toast.error('Failed to copy link', 'Please try again.');
    }
  };

  const handleApplicationSubmit = async (applicationData) => {
    const loadingToast = toast.loading('Submitting application...');

    try {
      const formData = new FormData();
      if (applicationData.coverLetter) formData.append('coverLetter', applicationData.coverLetter);
      if (applicationData.resume instanceof File) formData.append('resume', applicationData.resume);

      const res = await fetch(`${API_BASE}/jobs/${job!.id}/apply`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message ?? `HTTP ${res.status}`);
      }

      toast.dismiss(loadingToast);
      toast.success('Application submitted successfully!', 'The employer will review your application and contact you soon.');
      setShowApplicationForm(false);
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Failed to submit application', error?.message ?? 'Please try again later.');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading job details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!job) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Job Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The job you are looking for does not exist or has been removed.
          </p>
          <Button onClick={() => router.push('/jobs')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Jobs
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline"  onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline"  onClick={handleSaveJob}>
              {isSaved ? (
                <>
                  <Bookmark className="h-4 w-4 mr-2 fill-current" />
                  Saved
                </>
              ) : (
                <>
                  <BookmarkPlus className="h-4 w-4 mr-2" />
                  Save
                </>
              )}
            </Button>
            <Button variant="outline"  onClick={handleLikeJob}>
              <Heart className={cn(
                "h-4 w-4 mr-2",
                isLiked ? "fill-red-500 text-red-500" : ""
              )} />
              {job.stats.likes}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                        {job.company.logo ? (
                          <img 
                            src={job.company.logo} 
                            alt={job.company.name}
                            className="w-full h-full rounded-lg object-cover"
                          />
                        ) : (
                          <Building2 className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h1 className="text-2xl font-bold text-foreground">{job.title}</h1>
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
                        
                        <div className="flex items-center space-x-2 mb-3">
                          <span className="font-semibold text-foreground">{job.company.name}</span>
                          {job.company.verified && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm text-muted-foreground">{job.company.rating}</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
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
                            <span>Posted {formatDistanceToNow(job.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Employment Type</p>
                      <span className={cn('px-2 py-1 rounded text-xs font-medium', getEmploymentTypeColor(job.employment.type))}>
                        {job.employment.type}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Salary</p>
                      <p className="font-semibold text-foreground">{formatSalary()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Department</p>
                      <p className="font-semibold text-foreground">{job.employment.department}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Applications</p>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold text-foreground">{job.stats.applications}</span>
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
                </CardHeader>
              </Card>
            </motion.div>

            {/* Job Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Job Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground leading-relaxed whitespace-pre-line">
                    {job.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Requirements */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {job.requirements.map((requirement, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-foreground">{requirement}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Responsibilities */}
            {job.responsibilities.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Responsibilities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {job.responsibilities.map((responsibility, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-foreground">{responsibility}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Benefits */}
            {job.benefits.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Benefits & Perks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {job.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span className="text-foreground">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Tags */}
            {job.tags.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Tags</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {job.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Apply Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="sticky top-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Apply for this job</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    className="w-full"
                    size="lg"
                    onClick={handleApply}
                    disabled={job.application.status === 'closed' || isApplicationOverdue()}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {job.application.status === 'closed' ? 'Position Closed' :
                     isApplicationOverdue() ? 'Deadline Passed' :
                     'Apply Now'}
                  </Button>
                  
                  {job.application.deadline && (
                    <div className="text-center text-sm text-muted-foreground">
                      Deadline: {formatDate(job.application.deadline)}
                    </div>
                  )}

                  <div className="pt-4 border-t space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Views:</span>
                      <span className="font-medium">{job.stats.views}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Applications:</span>
                      <span className="font-medium">{job.stats.applications}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Company Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">About {job.company.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {job.company.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {job.company.description}
                    </p>
                  )}
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{job.company.location}</span>
                    </div>
                    
                    {job.company.size && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{job.company.size}</span>
                      </div>
                    )}
                    
                    {job.company.website && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <a 
                          href={job.company.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Visit Website
                        </a>
                      </div>
                    )}
                    
                    {job.company.phone && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a 
                          href={`tel:${job.company.phone}`}
                          className="text-primary hover:underline"
                        >
                          {job.company.phone}
                        </a>
                      </div>
                    )}
                    
                    {job.company.email && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a 
                          href={`mailto:${job.company.email}`}
                          className="text-primary hover:underline"
                        >
                          {job.company.email}
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Job Application Form */}
        {showApplicationForm && job && (
          <JobApplicationForm
            job={{
              id: job.id,
              title: job.title,
              company: job.company.name,
              location: `${job.location.city}, ${job.location.state}`,
              type: job.employment.type,
              salary: formatSalary(),
              requirements: job.requirements,
              description: job.description
            }}
            isOpen={showApplicationForm}
            onClose={() => setShowApplicationForm(false)}
            onSubmit={handleApplicationSubmit}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
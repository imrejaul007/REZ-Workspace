'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from '@/lib/toast';
import {
  Search,
  Filter,
  MapPin,
  Briefcase,
  DollarSign,
  Calendar,
  Users,
  Bookmark,
  Heart,
  TrendingUp,
  Clock,
  Building2,
  Plus,
  SlidersHorizontal,
  X,
  Trash2,
  Eye,
  ArrowUpDown,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useAuth } from '@/lib/auth/auth-provider';
import JobCard from '@/components/jobs/job-card';
import JobApplicationForm from '@/components/jobs/job-application-form';
import { cn, formatDate, formatDistanceToNow } from '@/lib/utils';

interface SavedJob {
  id: string;
  jobId: string;
  savedAt: string;
  notes?: string;
  job: {
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
  };
}

// No saved-jobs endpoint exists on the backend yet — always show empty state.
export default function SavedJobsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState('saved-date');
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [selectedJob, setSelectedJob] = useState<SavedJob | null>(null);

  // Redirect if user is not logged in
  useEffect(() => {
    if (!user) {
      toast.error('Login required', 'Please login to view your saved jobs.');
      router.push('/auth/login');
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  const filteredJobs = savedJobs.filter(savedJob => 
    savedJob.job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    savedJob.job.company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    savedJob.job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (savedJob.notes && savedJob.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    switch (sortBy) {
      case 'saved-date':
        return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
      case 'job-date':
        return new Date(b.job.createdAt).getTime() - new Date(a.job.createdAt).getTime();
      case 'salary':
        const aSalary = a.job.salary.max || a.job.salary.min || 0;
        const bSalary = b.job.salary.max || b.job.salary.min || 0;
        return bSalary - aSalary;
      case 'applications':
        return a.job.stats.applications - b.job.stats.applications;
      case 'company':
        return a.job.company.name.localeCompare(b.job.company.name);
      default:
        return 0;
    }
  });

  const handleRemoveSavedJob = (savedJobId: string) => {
    setSavedJobs(prev => prev.filter(job => job.id !== savedJobId));
    toast.success('Job removed', 'Job removed from your saved jobs.');
  };

  const handleBulkRemove = () => {
    setSavedJobs(prev => prev.filter(job => !selectedJobs.has(job.id)));
    setSelectedJobs(new Set());
    toast.success('Jobs removed', `${selectedJobs.size} jobs removed from saved jobs.`);
  };

  const handleJobApply = (jobId: string) => {
    const savedJob = savedJobs.find(sj => sj.job.id === jobId);
    if (savedJob) {
      setSelectedJob(savedJob);
      setShowApplicationForm(true);
    }
  };

  const handleJobView = (jobId: string) => {
    window.open(`/jobs/${jobId}`, '_blank');
  };

  const handleJobShare = (jobId: string) => {
    const url = `${window.location.origin}/jobs/${jobId}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied', 'Job link copied to clipboard.');
  };

  const handleApplicationSubmit = async (applicationData) => {
    const loadingToast = toast.loading('Submitting application...');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.dismiss(loadingToast);
      toast.success('Application submitted successfully!', 'You will be notified when the employer reviews your application.');
      setShowApplicationForm(false);
      setSelectedJob(null);
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Failed to submit application', 'Please try again later.');
    }
  };

  const toggleJobSelection = (jobId: string) => {
    const newSelected = new Set(selectedJobs);
    if (newSelected.has(jobId)) {
      newSelected.delete(jobId);
    } else {
      newSelected.add(jobId);
    }
    setSelectedJobs(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedJobs.size === sortedJobs.length) {
      setSelectedJobs(new Set());
    } else {
      setSelectedJobs(new Set(sortedJobs.map(job => job.id)));
    }
  };

  const stats = {
    total: savedJobs.length,
    active: savedJobs.filter(job => job.job.application.status === 'open').length,
    urgent: savedJobs.filter(job => job.job.urgent).length,
    deadlineSoon: savedJobs.filter(job => {
      if (!job.job.application.deadline) return false;
      const deadline = new Date(job.job.application.deadline);
      const now = new Date();
      const diffInDays = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diffInDays <= 3 && diffInDays > 0;
    }).length
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Saved Jobs</h1>
            <p className="text-muted-foreground mt-1">
              Manage your bookmarked job opportunities
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={() => router.push('/jobs')}>
              <Plus className="h-4 w-4 mr-2" />
              Browse More Jobs
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Saved</p>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                </div>
                <Bookmark className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Jobs</p>
                  <p className="text-2xl font-bold text-foreground">{stats.active}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Urgent Jobs</p>
                  <p className="text-2xl font-bold text-foreground">{stats.urgent}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Deadline Soon</p>
                  <p className="text-2xl font-bold text-foreground">{stats.deadlineSoon}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search saved jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                >
                  <option value="saved-date">Recently Saved</option>
                  <option value="job-date">Latest Jobs</option>
                  <option value="salary">Highest Salary</option>
                  <option value="applications">Fewest Applications</option>
                  <option value="company">Company A-Z</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedJobs.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-primary/10 border border-primary/20 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">
                {selectedJobs.size} job{selectedJobs.size > 1 ? 's' : ''} selected
              </p>
              <div className="flex items-center space-x-2">
                <Button  variant="outline" onClick={handleBulkRemove} size="default">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove Selected
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Jobs List */}
        <div className="space-y-4">
          {/* Header Row */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedJobs.size === sortedJobs.length && sortedJobs.length > 0}
                onChange={() => toggleSelectAll()}
                className="rounded border-border"
              />
              <span className="text-sm font-medium">Select All</span>
            </label>
            <p className="text-sm text-muted-foreground">
              {sortedJobs.length} job{sortedJobs.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Job Cards */}
          {sortedJobs.map((savedJob) => (
            <motion.div
              key={savedJob.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "relative",
                selectedJobs.has(savedJob.id) && "ring-2 ring-primary/20"
              )}
            >
              <Card className="hover:shadow-md transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedJobs.has(savedJob.id)}
                      onChange={() => toggleJobSelection(savedJob.id)}
                      className="rounded border-border mt-1"
                    />
                    
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-foreground">
                              {savedJob.job.title}
                            </h3>
                            {savedJob.job.featured && (
                              <Badge className="bg-primary text-primary-foreground">Featured</Badge>
                            )}
                            {savedJob.job.urgent && (
                              <Badge className="bg-red-500 text-white">Urgent</Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-medium text-foreground">{savedJob.job.company.name}</span>
                            {savedJob.job.company.verified && (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                            {savedJob.job.company.rating && (
                              <div className="flex items-center space-x-1">
                                <Heart className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm text-muted-foreground">{savedJob.job.company.rating}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-4 w-4" />
                              <span>{savedJob.job.location.city}, {savedJob.job.location.state}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Briefcase className="h-4 w-4" />
                              <span>{savedJob.job.employment.type}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{savedJob.job.employment.experience}</span>
                            </div>
                          </div>

                          {savedJob.notes && (
                            <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                              <p className="text-sm text-blue-800 dark:text-blue-200">
                                <strong>Your notes:</strong> {savedJob.notes}
                              </p>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between pt-3 border-t">
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <span>Saved {formatDistanceToNow(savedJob.savedAt)}</span>
                              <span>Posted {formatDistanceToNow(savedJob.job.createdAt)}</span>
                              {savedJob.job.application.deadline && (
                                <span className={cn(
                                  "font-medium",
                                  new Date(savedJob.job.application.deadline) < new Date() 
                                    ? "text-red-600" 
                                    : "text-orange-600"
                                )}>
                                  Deadline: {formatDate(savedJob.job.application.deadline)}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                
                                onClick={() => handleJobView(savedJob.job.id)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              <Button
                                variant="ghost"
                                
                                onClick={() => handleRemoveSavedJob(savedJob.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Remove
                              </Button>
                              <Button
                                
                                onClick={() => handleJobApply(savedJob.job.id)}
                                disabled={savedJob.job.application.status === 'closed'}
                              >
                                Apply Now
                              </Button>
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

          {/* Empty State */}
          {sortedJobs.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Bookmark className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {searchTerm ? 'No matching jobs found' : 'No saved jobs yet'}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {searchTerm 
                    ? 'Try adjusting your search terms'
                    : 'Start browsing jobs and save the ones that interest you'
                  }
                </p>
                <Button onClick={() => router.push('/jobs')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Browse Jobs
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Job Application Form */}
        {selectedJob && (
          <JobApplicationForm
            job={{
              id: selectedJob.job.id,
              title: selectedJob.job.title,
              company: selectedJob.job.company.name,
              location: `${selectedJob.job.location.city}, ${selectedJob.job.location.state}`,
              type: selectedJob.job.employment.type,
              salary: `${selectedJob.job.salary.min ? '₹' + selectedJob.job.salary.min.toLocaleString() : ''}${selectedJob.job.salary.max ? ' - ₹' + selectedJob.job.salary.max.toLocaleString() : ''} ${selectedJob.job.salary.period}`,
              requirements: selectedJob.job.requirements,
              description: selectedJob.job.description
            }}
            isOpen={showApplicationForm}
            onClose={() => {
              setShowApplicationForm(false);
              setSelectedJob(null);
            }}
            onSubmit={handleApplicationSubmit}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
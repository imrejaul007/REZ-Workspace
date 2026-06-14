'use client';

import React, { useState } from 'react';
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
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useAuth } from '@/lib/auth/auth-provider';
import JobCard from '@/components/jobs/job-card';
import JobApplicationForm from '@/components/jobs/job-application-form';
import { cn } from '@/lib/utils';

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

const mockJobs: Job[] = [
  {
    id: '1',
    title: 'Executive Chef - Fine Dining',
    company: {
      id: 'comp-1',
      name: 'Taj Hotels',
      verified: true,
      rating: 4.8,
      location: 'Mumbai'
    },
    description: 'We are looking for an experienced Executive Chef to lead our fine dining restaurant kitchen. The ideal candidate will have extensive experience in high-end cuisine, team management, and menu development.',
    requirements: [
      '10+ years culinary experience',
      'Fine dining background',
      'Team leadership skills',
      'Menu development',
      'Cost management'
    ],
    responsibilities: [
      'Lead kitchen operations',
      'Develop seasonal menus',
      'Manage food costs',
      'Train junior staff'
    ],
    benefits: [
      'Health insurance',
      'Performance bonus',
      'Career growth',
      'Staff meals'
    ],
    location: {
      city: 'Mumbai',
      state: 'Maharashtra',
      remote: false,
      hybrid: false
    },
    employment: {
      type: 'full-time',
      experience: '10+ years',
      department: 'Kitchen'
    },
    salary: {
      min: 80000,
      max: 120000,
      currency: 'INR',
      period: 'monthly',
      negotiable: true
    },
    application: {
      deadline: '2024-02-15T23:59:59Z',
      method: 'internal',
      status: 'open'
    },
    stats: {
      views: 245,
      applications: 23,
      likes: 15
    },
    tags: ['executive-chef', 'fine-dining', 'leadership', 'mumbai'],
    featured: true,
    urgent: false,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    title: 'Sous Chef - Italian Cuisine',
    company: {
      id: 'comp-2',
      name: 'La Piazza Restaurant',
      verified: true,
      rating: 4.5,
      location: 'Delhi'
    },
    description: 'Join our authentic Italian restaurant as a Sous Chef. We are looking for someone passionate about Italian cuisine with strong technical skills and creativity.',
    requirements: [
      '5+ years experience',
      'Italian cuisine expertise',
      'Pasta making skills',
      'Kitchen coordination',
      'Quality control'
    ],
    location: {
      city: 'New Delhi',
      state: 'Delhi',
      remote: false,
      hybrid: false
    },
    employment: {
      type: 'full-time',
      experience: '5-8 years',
      department: 'Kitchen'
    },
    salary: {
      min: 45000,
      max: 65000,
      currency: 'INR',
      period: 'monthly',
      negotiable: false
    },
    application: {
      method: 'internal',
      status: 'open'
    },
    stats: {
      views: 189,
      applications: 31,
      likes: 22
    },
    tags: ['sous-chef', 'italian-cuisine', 'pasta', 'delhi'],
    featured: false,
    urgent: true,
    createdAt: '2024-01-12T14:30:00Z',
    updatedAt: '2024-01-12T14:30:00Z'
  },
  {
    id: '3',
    title: 'Restaurant Manager',
    company: {
      id: 'comp-3',
      name: 'Cafe Mocha Chain',
      verified: true,
      rating: 4.2,
      location: 'Bangalore'
    },
    description: 'Seeking an experienced Restaurant Manager to oversee daily operations, manage staff, and ensure excellent customer service at our busy cafe location.',
    requirements: [
      '3+ years management experience',
      'Customer service focus',
      'Staff training skills',
      'P&L management',
      'Inventory management'
    ],
    location: {
      city: 'Bangalore',
      state: 'Karnataka',
      remote: false,
      hybrid: true
    },
    employment: {
      type: 'full-time',
      experience: '3-5 years',
      department: 'Operations'
    },
    salary: {
      min: 35000,
      max: 50000,
      currency: 'INR',
      period: 'monthly',
      negotiable: true
    },
    application: {
      method: 'internal',
      status: 'open'
    },
    stats: {
      views: 156,
      applications: 45,
      likes: 18
    },
    tags: ['manager', 'operations', 'customer-service', 'bangalore'],
    featured: false,
    urgent: false,
    createdAt: '2024-01-10T09:15:00Z',
    updatedAt: '2024-01-10T09:15:00Z'
  },
  {
    id: '4',
    title: 'Pastry Chef',
    company: {
      id: 'comp-4',
      name: 'Sweet Dreams Bakery',
      verified: false,
      location: 'Chennai'
    },
    description: 'Creative Pastry Chef wanted for our expanding bakery. Must have expertise in French pastries, cakes, and dessert presentation.',
    requirements: [
      '4+ years pastry experience',
      'French pastry techniques',
      'Cake decoration',
      'Recipe development',
      'Team collaboration'
    ],
    location: {
      city: 'Chennai',
      state: 'Tamil Nadu',
      remote: false,
      hybrid: false
    },
    employment: {
      type: 'full-time',
      experience: '4-6 years',
      department: 'Pastry'
    },
    salary: {
      min: 30000,
      max: 45000,
      currency: 'INR',
      period: 'monthly',
      negotiable: false
    },
    application: {
      method: 'internal',
      status: 'open'
    },
    stats: {
      views: 98,
      applications: 19,
      likes: 12
    },
    tags: ['pastry-chef', 'french-pastry', 'cakes', 'chennai'],
    featured: false,
    urgent: false,
    createdAt: '2024-01-08T16:45:00Z',
    updatedAt: '2024-01-08T16:45:00Z'
  },
  {
    id: '5',
    title: 'Food & Beverage Coordinator',
    company: {
      id: 'comp-5',
      name: 'Grand Hotel & Resort',
      verified: true,
      rating: 4.6,
      location: 'Goa'
    },
    description: 'Join our luxury resort as F&B Coordinator. Responsible for coordinating between kitchen, service staff, and guests to ensure seamless dining experiences.',
    requirements: [
      '2+ years F&B experience',
      'Event coordination',
      'Guest relations',
      'Multi-tasking ability',
      'Communication skills'
    ],
    location: {
      city: 'Panaji',
      state: 'Goa',
      remote: false,
      hybrid: false
    },
    employment: {
      type: 'full-time',
      experience: '2-4 years',
      department: 'F&B'
    },
    salary: {
      min: 25000,
      max: 35000,
      currency: 'INR',
      period: 'monthly',
      negotiable: true
    },
    application: {
      deadline: '2024-02-10T23:59:59Z',
      method: 'internal',
      status: 'open'
    },
    stats: {
      views: 134,
      applications: 27,
      likes: 9
    },
    tags: ['coordinator', 'f&b', 'hospitality', 'goa'],
    featured: true,
    urgent: false,
    createdAt: '2024-01-05T11:20:00Z',
    updatedAt: '2024-01-05T11:20:00Z'
  }
];

export default function JobsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>(mockJobs);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [experienceFilter, setExperienceFilter] = useState('all');
  const [salaryFilter, setSalaryFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [bookmarkedJobs, setBookmarkedJobs] = useState<Set<string>>(new Set());
  const [likedJobs, setLikedJobs] = useState<Set<string>>(new Set());
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = !searchTerm || 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.requirements.some(req => req.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesLocation = !locationFilter || 
      job.location.city.toLowerCase().includes(locationFilter.toLowerCase()) ||
      job.location.state.toLowerCase().includes(locationFilter.toLowerCase());
    
    const matchesType = typeFilter === 'all' || job.employment.type === typeFilter;
    
    const matchesExperience = experienceFilter === 'all' || 
      (experienceFilter === 'entry' && job.employment.experience.includes('0-2')) ||
      (experienceFilter === 'mid' && (job.employment.experience.includes('2-5') || job.employment.experience.includes('3-5'))) ||
      (experienceFilter === 'senior' && (job.employment.experience.includes('5+') || job.employment.experience.includes('8+')));
    
    const matchesSalary = salaryFilter === 'all' || 
      (salaryFilter === 'under-30k' && job.salary.max && job.salary.max <= 30000) ||
      (salaryFilter === '30k-50k' && job.salary.min && job.salary.min >= 30000 && job.salary.max && job.salary.max <= 50000) ||
      (salaryFilter === '50k-80k' && job.salary.min && job.salary.min >= 50000 && job.salary.max && job.salary.max <= 80000) ||
      (salaryFilter === 'above-80k' && job.salary.min && job.salary.min >= 80000);
    
    return matchesSearch && matchesLocation && matchesType && matchesExperience && matchesSalary;
  });

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'salary':
        const aSalary = a.salary.max || a.salary.min || 0;
        const bSalary = b.salary.max || b.salary.min || 0;
        return bSalary - aSalary;
      case 'applications':
        return a.stats.applications - b.stats.applications;
      case 'relevance':
      default:
        return (b.featured ? 1000 : 0) + (b.urgent ? 500 : 0) - ((a.featured ? 1000 : 0) + (a.urgent ? 500 : 0));
    }
  });

  const handleJobApply = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      setSelectedJob(job);
      setShowApplicationForm(true);
    }
  };

  const handleJobBookmark = (jobId: string) => {
    setBookmarkedJobs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  const handleJobShare = (jobId: string) => {
    // Copy job URL to clipboard
    const url = `${window.location.origin}/jobs/${jobId}`;
    navigator.clipboard.writeText(url);
    // Show toast notification
  };

  const handleJobView = (jobId: string) => {
    // Navigate to job detail page
    window.open(`/jobs/${jobId}`, '_blank');
  };

  const handleApplicationSubmit = async (applicationData: any) => {
    const loadingToast = toast.loading('Submitting application...');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock API submission
      const submissionData = {
        ...applicationData,
        jobId: selectedJob?.id,
        submittedAt: new Date().toISOString()
      };
      
      toast.dismiss(loadingToast);
      toast.success('Application submitted successfully!', 'You will be notified when the employer reviews your application.');
      setShowApplicationForm(false);
      setSelectedJob(null);
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Failed to submit application', 'Please try again later.');
    }
  };

  const jobTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'full-time', label: 'Full-time' },
    { value: 'part-time', label: 'Part-time' },
    { value: 'contract', label: 'Contract' },
    { value: 'temporary', label: 'Temporary' },
    { value: 'internship', label: 'Internship' }
  ];

  const experienceOptions = [
    { value: 'all', label: 'All Experience' },
    { value: 'entry', label: 'Entry Level (0-2 years)' },
    { value: 'mid', label: 'Mid Level (2-5 years)' },
    { value: 'senior', label: 'Senior Level (5+ years)' }
  ];

  const salaryOptions = [
    { value: 'all', label: 'All Salaries' },
    { value: 'under-30k', label: 'Under ₹30,000' },
    { value: '30k-50k', label: '₹30,000 - ₹50,000' },
    { value: '50k-80k', label: '₹50,000 - ₹80,000' },
    { value: 'above-80k', label: 'Above ₹80,000' }
  ];

  const sortOptions = [
    { value: 'relevance', label: 'Most Relevant' },
    { value: 'date', label: 'Latest' },
    { value: 'salary', label: 'Highest Salary' },
    { value: 'applications', label: 'Fewest Applications' }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Find Your Dream Job</h1>
            <p className="text-muted-foreground mt-1">
              Discover opportunities in the restaurant and hospitality industry
            </p>
          </div>
          
          {user?.role === 'restaurant' && (
            <Button onClick={() => router.push('/restaurant/jobs/create')}>
              <Plus className="h-4 w-4 mr-2" />
              Post a Job
            </Button>
          )}
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search jobs, companies, or keywords..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Location"
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className="pl-10 pr-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-48"
                    />
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="px-4 py-3"
                  >
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </div>
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border"
                >
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Job Type</label>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {jobTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Experience</label>
                    <select
                      value={experienceFilter}
                      onChange={(e) => setExperienceFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {experienceOptions.map(exp => (
                        <option key={exp.value} value={exp.value}>{exp.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Salary Range</label>
                    <select
                      value={salaryFilter}
                      onChange={(e) => setSalaryFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {salaryOptions.map(salary => (
                        <option key={salary.value} value={salary.value}>{salary.label}</option>
                      ))}
                    </select>
                  </div>
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <p className="text-muted-foreground">
              {sortedJobs.length} job{sortedJobs.length !== 1 ? 's' : ''} found
            </p>
            
            {/* Active Filters */}
            <div className="flex items-center space-x-2">
              {searchTerm && (
                <Badge variant="outline" className="cursor-pointer" onClick={() => setSearchTerm('')}>
                  "{searchTerm}"
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              )}
              {locationFilter && (
                <Badge variant="outline" className="cursor-pointer" onClick={() => setLocationFilter('')}>
                  <MapPin className="h-3 w-3 mr-1" />
                  {locationFilter}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              )}
              {typeFilter !== 'all' && (
                <Badge variant="outline" className="cursor-pointer" onClick={() => setTypeFilter('all')}>
                  {jobTypes.find(t => t.value === typeFilter)?.label}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Jobs List */}
        <div className="space-y-4">
          {sortedJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onApply={handleJobApply}
              onBookmark={handleJobBookmark}
              onShare={handleJobShare}
              onView={handleJobView}
              isBookmarked={bookmarkedJobs.has(job.id)}
              isLiked={likedJobs.has(job.id)}
              currentUserRole={user?.role}
            />
          ))}
        </div>

        {/* Empty State */}
        {sortedJobs.length === 0 && (
          <div className="text-center py-12">
            <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No jobs found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search criteria or filters
            </p>
            <Button 
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setLocationFilter('');
                setTypeFilter('all');
                setExperienceFilter('all');
                setSalaryFilter('all');
              }}
            >
              Clear all filters
            </Button>
          </div>
        )}
      </div>

      {/* Job Application Form */}
      {selectedJob && (
        <JobApplicationForm
          job={{
            id: selectedJob.id,
            title: selectedJob.title,
            company: selectedJob.company.name,
            location: `${selectedJob.location.city}, ${selectedJob.location.state}`,
            type: selectedJob.employment.type,
            salary: `${selectedJob.salary.min ? '₹' + selectedJob.salary.min.toLocaleString() : ''}${selectedJob.salary.max ? ' - ₹' + selectedJob.salary.max.toLocaleString() : ''} ${selectedJob.salary.period}`,
            requirements: selectedJob.requirements,
            description: selectedJob.description
          }}
          isOpen={showApplicationForm}
          onClose={() => {
            setShowApplicationForm(false);
            setSelectedJob(null);
          }}
          onSubmit={handleApplicationSubmit}
        />
      )}
    </DashboardLayout>
  );
}
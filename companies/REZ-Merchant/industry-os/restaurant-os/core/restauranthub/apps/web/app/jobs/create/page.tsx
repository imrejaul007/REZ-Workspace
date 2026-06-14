'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import {
  MapPin,
  DollarSign,
  Clock,
  Users,
  Plus,
  X,
  AlertCircle,
  Loader2,
  Save,
  Eye,
  ChefHat,
  Briefcase,
  Calendar,
  Building,
  Tag,
  Clipboard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useAuth } from '@/lib/auth/auth-provider';
import { UserRole } from '@/types/auth';
import { cn } from '@/lib/utils';
import { jobsApi } from '@/lib/api/jobs';
import { toast } from 'react-hot-toast';

const jobSchema = z.object({
  title: z.string().min(3, 'Job title must be at least 3 characters'),
  department: z.string().min(1, 'Department is required'),
  location: z.object({
    type: z.enum(['on-site', 'remote', 'hybrid']),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    address: z.string().optional()
  }),
  employment: z.object({
    type: z.enum(['full-time', 'part-time', 'contract', 'temporary', 'internship']),
    schedule: z.enum(['morning', 'afternoon', 'evening', 'night', 'flexible', 'rotating']),
    hoursPerWeek: z.number().min(1).max(60)
  }),
  salary: z.object({
    type: z.enum(['hourly', 'monthly', 'yearly']),
    min: z.number().min(0),
    max: z.number().min(0),
    currency: z.string().default('INR'),
    negotiable: z.boolean().default(false)
  }).refine(data => data.max >= data.min, {
    message: 'Maximum salary must be greater than or equal to minimum salary',
    path: ['max']
  }),
  description: z.string().min(50, 'Job description must be at least 50 characters'),
  requirements: z.array(z.string().min(1)).min(1, 'At least one requirement is needed'),
  responsibilities: z.array(z.string().min(1)).min(1, 'At least one responsibility is needed'),
  benefits: z.array(z.string().min(1)).optional(),
  skills: z.array(z.string().min(1)).min(1, 'At least one skill is required'),
  experience: z.object({
    min: z.number().min(0),
    max: z.number().min(0),
    required: z.boolean().default(false)
  }).refine(data => data.max >= data.min, {
    message: 'Maximum experience must be greater than or equal to minimum experience',
    path: ['max']
  }),
  applicationDeadline: z.string().min(1, 'Application deadline is required'),
  startDate: z.string().min(1, 'Start date is required'),
  isUrgent: z.boolean().default(false),
  contactInfo: z.object({
    email: z.string().email('Valid email is required'),
    phone: z.string().optional(),
    contactPerson: z.string().min(1, 'Contact person is required')
  })
});

type JobForm = z.infer<typeof jobSchema>;

const departments = [
  'Kitchen',
  'Service',
  'Management',
  'Administration',
  'Maintenance',
  'Security',
  'Marketing',
  'Finance',
  'Other'
];

const commonSkills = [
  'Food Preparation',
  'Customer Service',
  'Team Leadership',
  'Cash Handling',
  'Food Safety',
  'Inventory Management',
  'POS Systems',
  'Communication',
  'Time Management',
  'Problem Solving',
  'Multitasking',
  'Menu Knowledge',
  'Cooking Techniques',
  'Hygiene Standards',
  'Conflict Resolution'
];

export default function CreateJobPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [customSkillInput, setCustomSkillInput] = useState('');

  const form = useForm<JobForm>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: '',
      department: '',
      location: {
        type: 'on-site',
        city: '',
        state: '',
        address: ''
      },
      employment: {
        type: 'full-time',
        schedule: 'flexible',
        hoursPerWeek: 40
      },
      salary: {
        type: 'monthly',
        min: 20000,
        max: 30000,
        currency: 'INR',
        negotiable: false
      },
      description: '',
      requirements: [''],
      responsibilities: [''],
      benefits: [''],
      skills: [],
      experience: {
        min: 0,
        max: 5,
        required: false
      },
      applicationDeadline: '',
      startDate: '',
      isUrgent: false,
      contactInfo: {
        email: user?.email || '',
        phone: '',
        contactPerson: ''
      }
    }
  });

  // Verify user is restaurant owner
  if (user?.role !== UserRole.RESTAURANT) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Access Denied
          </h2>
          <p className="text-muted-foreground">
            Only restaurant owners can post jobs. Please contact support if you need access.
          </p>
          <Button onClick={() => router.push('/dashboard')} className="mt-4">
            Go to Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const onSubmit = async (data: JobForm) => {
    setLoading(true);

    try {
      // Transform form data to API format
      const jobData = {
        title: data.title,
        description: data.description,
        requirements: data.requirements.filter(req => req.trim() !== ''),
        responsibilities: data.responsibilities.filter(resp => resp.trim() !== ''),
        benefits: data.benefits?.filter(benefit => benefit.trim() !== '') || [],
        employmentType: mapEmploymentType(data.employment.type),
        experience: mapExperience(data.experience.min, data.experience.max),
        salaryMin: data.salary.min,
        salaryMax: data.salary.max,
        currency: data.salary.currency,
        location: `${data.location.city}, ${data.location.state}`,
        isRemote: data.location.type === 'remote',
        skills: data.skills,
        category: data.department,
        applicationDeadline: data.applicationDeadline,
        startDate: data.startDate
      };

      // Use the jobs API to create the job
      const response = await jobsApi.createJob(jobData);

      console.log('Job posted successfully:', response.data);
      toast.success('Job posted successfully!');

      router.push('/restaurant/jobs?posted=true');
    } catch (error) {
      console.error('Failed to post job:', error);
      toast.error('Failed to post job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions to map form data to API format
  const mapEmploymentType = (type: string) => {
    const mapping: Record<string, string> = {
      'full-time': 'FULL_TIME',
      'part-time': 'PART_TIME',
      'contract': 'CONTRACT',
      'temporary': 'CONTRACT',
      'internship': 'INTERNSHIP'
    };
    return mapping[type] || 'FULL_TIME';
  };

  const mapExperience = (min: number, max: number) => {
    if (max <= 2) return 'ENTRY_LEVEL';
    if (max <= 5) return 'MID_LEVEL';
    return 'SENIOR_LEVEL';
  };

  const addArrayField = (fieldName: keyof Pick<JobForm, 'requirements' | 'responsibilities' | 'benefits'>) => {
    const currentValues = form.getValues(fieldName) as string[];
    form.setValue(fieldName, [...currentValues, ''] as unknown);
  };

  const removeArrayField = (fieldName: keyof Pick<JobForm, 'requirements' | 'responsibilities' | 'benefits'>, index: number) => {
    const currentValues = form.getValues(fieldName) as string[];
    form.setValue(fieldName, currentValues.filter((_, i) => i !== index) as unknown);
  };

  const addSkill = (skill: string) => {
    const currentSkills = form.getValues('skills');
    if (!currentSkills.includes(skill)) {
      form.setValue('skills', [...currentSkills, skill]);
    }
  };

  const removeSkill = (skill: string) => {
    const currentSkills = form.getValues('skills');
    form.setValue('skills', currentSkills.filter(s => s !== skill));
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Post New Job</h1>
            <p className="text-muted-foreground">
              Create a job posting to attract qualified candidates
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => setPreviewMode(!previewMode)}
            >
              <Eye className="h-4 w-4 mr-2" />
              {previewMode ? 'Edit' : 'Preview'}
            </Button>
            <Button
              onClick={() => router.back()}
              variant="ghost"
            >
              Cancel
            </Button>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Job Details
              </CardTitle>
              <CardDescription>
                Basic information about the position
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Job Title */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Job Title *
                </label>
                <input
                  {...form.register('title')}
                  placeholder="e.g. Head Chef, Restaurant Manager, Waiter"
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-destructive flex items-center space-x-1">
                    <AlertCircle className="h-4 w-4" />
                    <span>{form.formState.errors.title.message}</span>
                  </p>
                )}
              </div>

              {/* Department */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Department *
                </label>
                <Controller
                  name="department"
                  control={form.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map(dept => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.department && (
                  <p className="text-sm text-destructive flex items-center space-x-1">
                    <AlertCircle className="h-4 w-4" />
                    <span>{form.formState.errors.department.message}</span>
                  </p>
                )}
              </div>

              {/* Employment Type and Schedule */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Employment Type *
                  </label>
                  <Controller
                    name="employment.type"
                    control={form.control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select employment type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full-time">Full-time</SelectItem>
                          <SelectItem value="part-time">Part-time</SelectItem>
                          <SelectItem value="contract">Contract</SelectItem>
                          <SelectItem value="temporary">Temporary</SelectItem>
                          <SelectItem value="internship">Internship</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Schedule
                  </label>
                  <Controller
                    name="employment.schedule"
                    control={form.control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select schedule" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="morning">Morning</SelectItem>
                          <SelectItem value="afternoon">Afternoon</SelectItem>
                          <SelectItem value="evening">Evening</SelectItem>
                          <SelectItem value="night">Night</SelectItem>
                          <SelectItem value="flexible">Flexible</SelectItem>
                          <SelectItem value="rotating">Rotating</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Hours/Week
                  </label>
                  <input
                    {...form.register('employment.hoursPerWeek', { valueAsNumber: true })}
                    type="number"
                    min="1"
                    max="60"
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Work Type *
                  </label>
                  <Controller
                    name="location.type"
                    control={form.control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select location type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="on-site">On-site</SelectItem>
                          <SelectItem value="remote">Remote</SelectItem>
                          <SelectItem value="hybrid">Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    City *
                  </label>
                  <input
                    {...form.register('location.city')}
                    placeholder="e.g. Mumbai"
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    State *
                  </label>
                  <input
                    {...form.register('location.state')}
                    placeholder="e.g. Maharashtra"
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Full Address (Optional)
                </label>
                <input
                  {...form.register('location.address')}
                  placeholder="Complete address of the workplace"
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </CardContent>
          </Card>

          {/* Salary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Compensation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Salary Type *
                  </label>
                  <Controller
                    name="salary.type"
                    control={form.control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select salary period" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Per Hour</SelectItem>
                          <SelectItem value="monthly">Per Month</SelectItem>
                          <SelectItem value="yearly">Per Year</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Minimum Salary *
                  </label>
                  <input
                    {...form.register('salary.min', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    placeholder="20000"
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Maximum Salary *
                  </label>
                  <input
                    {...form.register('salary.max', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    placeholder="30000"
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Currency
                  </label>
                  <Controller
                    name="salary.currency"
                    control={form.control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INR">INR (₹)</SelectItem>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              <label className="flex items-center space-x-2">
                <input
                  {...form.register('salary.negotiable')}
                  type="checkbox"
                  className="rounded border-border"
                />
                <span className="text-sm text-foreground">Salary is negotiable</span>
              </label>
            </CardContent>
          </Card>

          {/* Job Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Job Description
              </CardTitle>
              <CardDescription>
                Detailed description of the role and what makes it unique
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Description *
                </label>
                <textarea
                  {...form.register('description')}
                  rows={6}
                  placeholder="Describe the role, work environment, team culture, and what makes this position attractive to candidates..."
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-y"
                />
                {form.formState.errors.description && (
                  <p className="text-sm text-destructive flex items-center space-x-1">
                    <AlertCircle className="h-4 w-4" />
                    <span>{form.formState.errors.description.message}</span>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clipboard className="h-5 w-5" />
                Requirements
              </CardTitle>
              <CardDescription>
                Essential qualifications and requirements for this role
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {form.watch('requirements').map((requirement, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      {...form.register(`requirements.${index}`)}
                      placeholder="e.g. High school diploma or equivalent"
                      className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    {form.watch('requirements').length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        
                        onClick={() => removeArrayField('requirements', index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  
                  onClick={() => addArrayField('requirements')}
                  className="flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Requirement</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Responsibilities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Responsibilities
              </CardTitle>
              <CardDescription>
                Key duties and responsibilities for this position
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {form.watch('responsibilities').map((responsibility, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      {...form.register(`responsibilities.${index}`)}
                      placeholder="e.g. Prepare and cook menu items according to recipes"
                      className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    {form.watch('responsibilities').length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        
                        onClick={() => removeArrayField('responsibilities', index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  
                  onClick={() => addArrayField('responsibilities')}
                  className="flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Responsibility</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="h-5 w-5" />
                Required Skills
              </CardTitle>
              <CardDescription>
                Select relevant skills or add custom ones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Selected Skills */}
              {form.watch('skills').length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Selected Skills
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {form.watch('skills').map((skill) => (
                      <div key={skill} className="flex items-center space-x-1 px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Common Skills */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Common Skills (click to add)
                </label>
                <div className="flex flex-wrap gap-2">
                  {commonSkills
                    .filter(skill => !form.watch('skills').includes(skill))
                    .map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => addSkill(skill)}
                        className="px-3 py-1 text-sm border border-border rounded-full hover:bg-muted transition-colors"
                      >
                        {skill}
                      </button>
                    ))}
                </div>
              </div>

              {/* Custom Skill Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Add Custom Skill
                </label>
                <div className="flex space-x-2">
                  <input
                    value={customSkillInput}
                    onChange={(e) => setCustomSkillInput(e.target.value)}
                    placeholder="Type a custom skill..."
                    className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const value = customSkillInput.trim();
                        if (value && !form.watch('skills').includes(value)) {
                          addSkill(value);
                          setCustomSkillInput('');
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const value = customSkillInput.trim();
                      if (value && !form.watch('skills').includes(value)) {
                        addSkill(value);
                        setCustomSkillInput('');
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {form.formState.errors.skills && (
                <p className="text-sm text-destructive flex items-center space-x-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{form.formState.errors.skills.message}</span>
                </p>
              )}
            </CardContent>
          </Card>

          {/* Experience & Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Experience & Timeline
              </CardTitle>
              <CardDescription>
                Experience requirements and important dates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Experience */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Minimum Experience (years)
                  </label>
                  <input
                    {...form.register('experience.min', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    max="20"
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Maximum Experience (years)
                  </label>
                  <input
                    {...form.register('experience.max', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    max="30"
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-8">
                  <input
                    {...form.register('experience.required')}
                    type="checkbox"
                    className="rounded border-border"
                  />
                  <label className="text-sm text-foreground">
                    Experience Required
                  </label>
                </div>
              </div>

              {/* Timeline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Application Deadline *
                  </label>
                  <input
                    {...form.register('applicationDeadline')}
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  {form.formState.errors.applicationDeadline && (
                    <p className="text-sm text-destructive flex items-center space-x-1">
                      <AlertCircle className="h-4 w-4" />
                      <span>{form.formState.errors.applicationDeadline.message}</span>
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Expected Start Date *
                  </label>
                  <input
                    {...form.register('startDate')}
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  {form.formState.errors.startDate && (
                    <p className="text-sm text-destructive flex items-center space-x-1">
                      <AlertCircle className="h-4 w-4" />
                      <span>{form.formState.errors.startDate.message}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Urgent Flag */}
              <label className="flex items-center space-x-2">
                <input
                  {...form.register('isUrgent')}
                  type="checkbox"
                  className="rounded border-border"
                />
                <span className="text-sm text-foreground">This is an urgent hiring need</span>
              </label>
            </CardContent>
          </Card>

          {/* Benefits (Optional) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Benefits & Perks (Optional)
              </CardTitle>
              <CardDescription>
                Additional benefits and perks offered with this position
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {form.watch('benefits')?.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      {...form.register(`benefits.${index}`)}
                      placeholder="e.g. Health insurance, Free meals, Flexible timing"
                      className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      
                      onClick={() => removeArrayField('benefits', index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )) || []}
                <Button
                  type="button"
                  variant="outline"
                  
                  onClick={() => addArrayField('benefits')}
                  className="flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Benefit</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Contact Information
              </CardTitle>
              <CardDescription>
                How candidates should contact regarding this position
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Contact Email *
                  </label>
                  <input
                    {...form.register('contactInfo.email')}
                    type="email"
                    placeholder="hr@restaurant.com"
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  {form.formState.errors.contactInfo?.email && (
                    <p className="text-sm text-destructive flex items-center space-x-1">
                      <AlertCircle className="h-4 w-4" />
                      <span>{form.formState.errors.contactInfo.email.message}</span>
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Contact Phone (Optional)
                  </label>
                  <input
                    {...form.register('contactInfo.phone')}
                    type="tel"
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Contact Person *
                </label>
                <input
                  {...form.register('contactInfo.contactPerson')}
                  placeholder="HR Manager / Restaurant Manager"
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                {form.formState.errors.contactInfo?.contactPerson && (
                  <p className="text-sm text-destructive flex items-center space-x-1">
                    <AlertCircle className="h-4 w-4" />
                    <span>{form.formState.errors.contactInfo.contactPerson.message}</span>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <div className="flex items-center space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
              >
                Clear Form
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="px-6"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Posting...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Save className="h-4 w-4" />
                    <span>Post Job</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import {
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  Users,
  Calendar,
  FileText,
  Plus,
  X,
  Save,
  ArrowLeft,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { toast } from '@/lib/toast';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

interface JobFormData {
  title: string;
  department: string;
  location: string;
  jobType: string;
  experience: string;
  salaryMin: string;
  salaryMax: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  skills: string[];
  workingHours: string;
  workingDays: string[];
  urgentHiring: boolean;
  remoteFriendly: boolean;
  status: string;
}

// Raw shape returned by the API
interface JobApiResponse {
  id: string;
  title: string;
  department?: string;
  location?: string;
  jobType?: string;
  experienceMin?: number;
  experienceMax?: number;
  salaryMin?: number;
  salaryMax?: number;
  description?: string;
  requirements?: string[];
  benefits?: string[];
  skills?: string[];
  workingHours?: string;
  workingDays?: string[];
  isUrgent?: boolean;
  isRemote?: boolean;
  status?: string;
  applicationCount?: number;
}

const departments = [
  'Kitchen', 'Service', 'Management', 'Bar', 'Cleaning', 'Security', 'Delivery'
];

const jobTypes = [
  { label: 'Full-time', value: 'FULL_TIME' },
  { label: 'Part-time', value: 'PART_TIME' },
  { label: 'Contract', value: 'CONTRACT' },
  { label: 'Temporary', value: 'TEMPORARY' },
  { label: 'Internship', value: 'INTERNSHIP' },
];

const experienceLevels = [
  'Entry Level (0-1 years)',
  'Mid Level (2-4 years)',
  'Senior Level (5+ years)',
  'Expert Level (10+ years)'
];

const workingDayOptions = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

const EMPTY_FORM: JobFormData = {
  title: '',
  department: '',
  location: '',
  jobType: '',
  experience: '',
  salaryMin: '',
  salaryMax: '',
  description: '',
  responsibilities: [''],
  requirements: [''],
  benefits: [''],
  skills: [''],
  workingHours: '',
  workingDays: [],
  urgentHiring: false,
  remoteFriendly: false,
  status: 'ACTIVE',
};

function mapApiToForm(api: JobApiResponse): JobFormData {
  return {
    title: api.title ?? '',
    department: api.department ?? '',
    location: api.location ?? '',
    jobType: api.jobType ?? '',
    experience: api.experienceMin != null
      ? `${api.experienceMin}${api.experienceMax != null ? `-${api.experienceMax}` : '+'} years`
      : '',
    salaryMin: api.salaryMin != null ? String(api.salaryMin) : '',
    salaryMax: api.salaryMax != null ? String(api.salaryMax) : '',
    description: api.description ?? '',
    responsibilities: api.skills?.length ? api.skills : [''],
    requirements: api.requirements?.length ? api.requirements : [''],
    benefits: api.benefits?.length ? api.benefits : [''],
    skills: api.skills?.length ? api.skills : [''],
    workingHours: api.workingHours ?? '',
    workingDays: api.workingDays ?? [],
    urgentHiring: api.isUrgent ?? false,
    remoteFriendly: api.isRemote ?? false,
    status: api.status ?? 'ACTIVE',
  };
}

export default function EditJobPage() {
  const router = useRouter();
  const params = useParams();
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<JobFormData>(EMPTY_FORM);
  const [hasApplications, setHasApplications] = useState(false);

  const jobId = Array.isArray(params.id) ? params.id[0] : params.id;

  const fetchJob = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    setLoadError(null);
    try {
      const api = await apiFetch<JobApiResponse>(`/jobs/${jobId}`);
      setFormData(mapApiToForm(api));
      setHasApplications((api.applicationCount ?? 0) > 0);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load job details';
      setLoadError(msg);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobId) return;
    setSaving(true);

    // Build the payload — only send fields the API understands
    const payload: Record<string, unknown> = {
      title: formData.title,
      department: formData.department,
      location: formData.location,
      jobType: formData.jobType,
      description: formData.description,
      requirements: formData.requirements.filter(Boolean),
      benefits: formData.benefits.filter(Boolean),
      skills: formData.skills.filter(Boolean),
      status: formData.status,
      isUrgent: formData.urgentHiring,
      isRemote: formData.remoteFriendly,
      workingHours: formData.workingHours || undefined,
      workingDays: formData.workingDays.length ? formData.workingDays : undefined,
    };

    if (formData.salaryMin !== '') {
      payload.salaryMin = parseInt(formData.salaryMin, 10);
    }
    if (formData.salaryMax !== '') {
      payload.salaryMax = parseInt(formData.salaryMax, 10);
    }

    try {
      await apiFetch(`/jobs/${jobId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      toast.success('Job updated successfully');
      router.push(`/restaurant/jobs/${jobId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update job posting';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  type ArrayField = 'responsibilities' | 'requirements' | 'benefits' | 'skills';

  const addArrayField = (field: ArrayField) => {
    setFormData(prev => ({ ...prev, [field]: [...prev[field], ''] }));
  };

  const removeArrayField = (field: ArrayField, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const updateArrayField = (field: ArrayField, index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? value : item)),
    }));
  };

  const toggleWorkingDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter(d => d !== day)
        : [...prev.workingDays, day],
    }));
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-muted-foreground">Loading job details...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (loadError) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <p className="text-destructive font-medium">{loadError}</p>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={fetchJob}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
            <Button variant="outline" onClick={() => router.back()}>
              Go Back
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Edit Job Posting</h1>
              <p className="text-muted-foreground">Update the job details and requirements</p>
            </div>
          </div>
        </div>

        {/* Warning Alert for jobs with applications */}
        {hasApplications && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Caution</AlertTitle>
            <AlertDescription>
              This job has existing applications. Major changes to requirements or job details may
              affect candidate matching and should be made carefully.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Briefcase className="h-5 w-5 mr-2" />
                      Basic Information
                    </CardTitle>
                    <CardDescription>Update the essential details about the position</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Job Title *</Label>
                        <Input
                          id="title"
                          placeholder="e.g., Head Chef, Waiter, Manager"
                          value={formData.title}
                          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="department">Department *</Label>
                        <Select
                          value={formData.department}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map((dept) => (
                              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="location">Location *</Label>
                        <Input
                          id="location"
                          placeholder="e.g., Mumbai, Delhi, Bangalore"
                          value={formData.location}
                          onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="job-type">Job Type *</Label>
                        <Select
                          value={formData.jobType}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, jobType: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {jobTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="experience">Experience Level</Label>
                      <Select
                        value={formData.experience}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, experience: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select experience level" />
                        </SelectTrigger>
                        <SelectContent>
                          {experienceLevels.map((level) => (
                            <SelectItem key={level} value={level}>{level}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Salary Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <DollarSign className="h-5 w-5 mr-2" />
                      Salary Information
                    </CardTitle>
                    <CardDescription>Update the compensation range for this position</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="salary-min">Minimum Salary (per month)</Label>
                        <Input
                          id="salary-min"
                          type="number"
                          placeholder="25000"
                          value={formData.salaryMin}
                          onChange={(e) =>
                            setFormData(prev => ({ ...prev, salaryMin: e.target.value }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="salary-max">Maximum Salary (per month)</Label>
                        <Input
                          id="salary-max"
                          type="number"
                          placeholder="35000"
                          value={formData.salaryMax}
                          onChange={(e) =>
                            setFormData(prev => ({ ...prev, salaryMax: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Job Description */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      Job Description
                    </CardTitle>
                    <CardDescription>Update detailed information about the role</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="description">Job Description *</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe the role, company culture, and what makes this position unique..."
                        rows={4}
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        required
                      />
                    </div>

                    {/* Requirements */}
                    <div className="space-y-2">
                      <Label>Requirements</Label>
                      {formData.requirements.map((requirement, index) => (
                        <div key={index} className="flex space-x-2">
                          <Input
                            placeholder="Enter a requirement..."
                            value={requirement}
                            onChange={(e) => updateArrayField('requirements', index, e.target.value)}
                          />
                          {formData.requirements.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
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
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Requirement
                      </Button>
                    </div>

                    {/* Benefits */}
                    <div className="space-y-2">
                      <Label>Benefits &amp; Perks</Label>
                      {formData.benefits.map((benefit, index) => (
                        <div key={index} className="flex space-x-2">
                          <Input
                            placeholder="Enter a benefit or perk..."
                            value={benefit}
                            onChange={(e) => updateArrayField('benefits', index, e.target.value)}
                          />
                          {formData.benefits.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => removeArrayField('benefits', index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => addArrayField('benefits')}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Benefit
                      </Button>
                    </div>

                    {/* Skills */}
                    <div className="space-y-2">
                      <Label>Required Skills</Label>
                      {formData.skills.map((skill, index) => (
                        <div key={index} className="flex space-x-2">
                          <Input
                            placeholder="Enter a required skill..."
                            value={skill}
                            onChange={(e) => updateArrayField('skills', index, e.target.value)}
                          />
                          {formData.skills.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => removeArrayField('skills', index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => addArrayField('skills')}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Skill
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Work Schedule */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Clock className="h-5 w-5 mr-2" />
                      Work Schedule
                    </CardTitle>
                    <CardDescription>Update the working hours and days for this position</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="working-hours">Working Hours</Label>
                      <Input
                        id="working-hours"
                        placeholder="e.g., 9:00 AM - 6:00 PM, Split shifts, Flexible"
                        value={formData.workingHours}
                        onChange={(e) => setFormData(prev => ({ ...prev, workingHours: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Working Days</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {workingDayOptions.map((day) => (
                          <div key={day} className="flex items-center space-x-2">
                            <Checkbox
                              id={day}
                              checked={formData.workingDays.includes(day)}
                              onCheckedChange={() => toggleWorkingDay(day)}
                            />
                            <Label htmlFor={day} className="text-sm">{day}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Job Status */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Job Status</CardTitle>
                    <CardDescription>Control the visibility of this job posting</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="PAUSED">Paused</SelectItem>
                        <SelectItem value="CLOSED">Closed</SelectItem>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Additional Options */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Options</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="urgent-hiring"
                        checked={formData.urgentHiring}
                        onCheckedChange={(checked) =>
                          setFormData(prev => ({ ...prev, urgentHiring: !!checked }))
                        }
                      />
                      <Label htmlFor="urgent-hiring">Urgent Hiring</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remote-friendly"
                        checked={formData.remoteFriendly}
                        onCheckedChange={(checked) =>
                          setFormData(prev => ({ ...prev, remoteFriendly: !!checked }))
                        }
                      />
                      <Label htmlFor="remote-friendly">Remote Friendly</Label>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Preview */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Job Preview</CardTitle>
                    <CardDescription>How this job will appear to candidates</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <h4 className="font-semibold text-sm">{formData.title || 'Job Title'}</h4>
                      <p className="text-xs text-muted-foreground">{formData.department || 'Department'}</p>
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3 mr-1" />
                        {formData.location || 'Location'}
                      </div>
                      {formData.salaryMin && formData.salaryMax && (
                        <div className="flex items-center text-xs text-success-600 mt-1">
                          <DollarSign className="h-3 w-3 mr-1" />
                          ₹{formData.salaryMin} - ₹{formData.salaryMax} / month
                        </div>
                      )}
                      <div className="flex space-x-1 mt-2">
                        {formData.urgentHiring && (
                          <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                            Urgent Hiring
                          </span>
                        )}
                        {formData.remoteFriendly && (
                          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            Remote Friendly
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <Card>
                  <CardContent className="pt-6 space-y-2">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={saving || !formData.title || !formData.department || !formData.location}
                    >
                      {saving ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Updating Job...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Update Job Posting
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => router.back()}
                    >
                      Cancel
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

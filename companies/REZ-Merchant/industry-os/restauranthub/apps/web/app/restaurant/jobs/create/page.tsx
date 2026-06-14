'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
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
  ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { toast } from '@/lib/toast';

interface JobFormData {
  title: string;
  department: string;
  location: string;
  employmentType: string;
  experience: string;
  salary: {
    min: string;
    max: string;
    type: string;
  };
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  skills: string[];
  workingHours: string;
  workingDays: string[];
  urgentHiring: boolean;
  remoteFriendly: boolean;
}

const departments = [
  'Kitchen',
  'Service',
  'Management',
  'Bar',
  'Cleaning',
  'Security',
  'Delivery'
];

const employmentTypes = [
  'Full-time',
  'Part-time',
  'Contract',
  'Temporary',
  'Internship'
];

const experienceLevels = [
  'Entry Level (0-1 years)',
  'Mid Level (2-4 years)',
  'Senior Level (5+ years)',
  'Expert Level (10+ years)'
];

const salaryTypes = [
  'Per Month',
  'Per Hour',
  'Per Day',
  'Per Year'
];

const workingDays = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

export default function CreateJobPage() {
  const router = useRouter();
  // const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    department: '',
    location: '',
    employmentType: '',
    experience: '',
    salary: {
      min: '',
      max: '',
      type: 'Per Month'
    },
    description: '',
    responsibilities: [''],
    requirements: [''],
    benefits: [''],
    skills: [''],
    workingHours: '',
    workingDays: [],
    urgentHiring: false,
    remoteFriendly: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('Job Posted Successfully');
      router.push('/restaurant/jobs');
    } catch (error) {
      console.error('Failed to create job posting:', error);
    } finally {
      setLoading(false);
    }
  };

  const addArrayField = (field: keyof Pick<JobFormData, 'responsibilities' | 'requirements' | 'benefits' | 'skills'>) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayField = (field: keyof Pick<JobFormData, 'responsibilities' | 'requirements' | 'benefits' | 'skills'>, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const updateArrayField = (field: keyof Pick<JobFormData, 'responsibilities' | 'requirements' | 'benefits' | 'skills'>, index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const toggleWorkingDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter(d => d !== day)
        : [...prev.workingDays, day]
    }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Create Job Posting</h1>
              <p className="text-muted-foreground">Fill in the details to post a new job opening</p>
            </div>
          </div>
        </div>

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
                    <CardDescription>
                      Provide the essential details about the position
                    </CardDescription>
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
                        <Label htmlFor="employment-type">Employment Type *</Label>
                        <Select 
                          value={formData.employmentType} 
                          onValueChange={(value) => setFormData(prev => ({ ...prev, employmentType: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {employmentTypes.map((type) => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="experience">Experience Level *</Label>
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
                    <CardDescription>
                      Set the compensation range for this position
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="salary-min">Minimum Salary *</Label>
                        <Input
                          id="salary-min"
                          type="number"
                          placeholder="25000"
                          value={formData.salary.min}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            salary: { ...prev.salary, min: e.target.value }
                          }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="salary-max">Maximum Salary *</Label>
                        <Input
                          id="salary-max"
                          type="number"
                          placeholder="35000"
                          value={formData.salary.max}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            salary: { ...prev.salary, max: e.target.value }
                          }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="salary-type">Salary Type *</Label>
                        <Select 
                          value={formData.salary.type} 
                          onValueChange={(value) => setFormData(prev => ({
                            ...prev,
                            salary: { ...prev.salary, type: value }
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {salaryTypes.map((type) => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                    <CardDescription>
                      Provide detailed information about the role
                    </CardDescription>
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

                    {/* Responsibilities */}
                    <div className="space-y-2">
                      <Label>Key Responsibilities</Label>
                      {formData.responsibilities.map((responsibility, index) => (
                        <div key={index} className="flex space-x-2">
                          <Input
                            placeholder="Enter a key responsibility..."
                            value={responsibility}
                            onChange={(e) => updateArrayField('responsibilities', index, e.target.value)}
                          />
                          {formData.responsibilities.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
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
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Responsibility
                      </Button>
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
                      <Label>Benefits & Perks</Label>
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
                    <CardDescription>
                      Define the working hours and days for this position
                    </CardDescription>
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
                        {workingDays.map((day) => (
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
              {/* Additional Options */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
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
                        onChange={(e) => setFormData(prev => ({ ...prev, urgentHiring: (e.target as HTMLInputElement).checked }))}
                      />
                      <Label htmlFor="urgent-hiring">Urgent Hiring</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remote-friendly"
                        checked={formData.remoteFriendly}
                        onChange={(e) => setFormData(prev => ({ ...prev, remoteFriendly: (e.target as HTMLInputElement).checked }))}
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
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Job Preview</CardTitle>
                    <CardDescription>
                      How this job will appear to candidates
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <h4 className="font-semibold text-sm">{formData.title || 'Job Title'}</h4>
                      <p className="text-xs text-muted-foreground">{formData.department || 'Department'}</p>
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3 mr-1" />
                        {formData.location || 'Location'}
                      </div>
                      {formData.salary.min && formData.salary.max && (
                        <div className="flex items-center text-xs text-success-600 mt-1">
                          <DollarSign className="h-3 w-3 mr-1" />
                          ₹{formData.salary.min} - ₹{formData.salary.max} {formData.salary.type}
                        </div>
                      )}
                      {formData.urgentHiring && (
                        <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full mt-2">
                          Urgent Hiring
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <Card>
                  <CardContent className="pt-6 space-y-2">
                    <Button 
                      type="submit" 
                      className="w-full" 
                      loading={loading}
                      disabled={!formData.title || !formData.department || !formData.location}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? 'Creating Job...' : 'Create Job Posting'}
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
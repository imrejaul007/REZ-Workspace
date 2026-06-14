'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Upload,
  FileText,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  GraduationCap,
  Award,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Clock,
  Send,
  Shield,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VerificationBadge } from '@/components/verification/verification-badge';
import { verificationService } from '@/lib/api/verification';
import { cn } from '@/lib/utils';

interface JobApplicationFormProps {
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    type: string;
    salary: string;
    requirements: string[];
    description: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (applicationData: ApplicationData) => Promise<void>;
}

interface ApplicationData {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    currentLocation: string;
    preferredLocation?: string;
    availability: string;
  };
  experience: {
    totalYears: number;
    currentRole?: string;
    currentCompany?: string;
    relevantExperience: string;
    previousRoles: {
      title: string;
      company: string;
      duration: string;
      description: string;
    }[];
  };
  education: {
    degree: string;
    institution: string;
    year: string;
    certifications: {
      name: string;
      issuer: string;
      year: string;
    }[];
  };
  skills: {
    technical: string[];
    languages: string[];
    specializations: string[];
  };
  documents: {
    resume?: File;
    coverLetter?: File;
    portfolio?: File;
    certificates?: File[];
  };
  additional: {
    coverLetterText: string;
    whyInterested: string;
    expectedSalary?: string;
    noticePeriod?: string;
    references: {
      name: string;
      position: string;
      company: string;
      contact: string;
    }[];
  };
}

const initialFormData: ApplicationData = {
  personalInfo: {
    fullName: '',
    email: '',
    phone: '',
    currentLocation: '',
    preferredLocation: '',
    availability: 'immediate'
  },
  experience: {
    totalYears: 0,
    currentRole: '',
    currentCompany: '',
    relevantExperience: '',
    previousRoles: []
  },
  education: {
    degree: '',
    institution: '',
    year: '',
    certifications: []
  },
  skills: {
    technical: [],
    languages: [],
    specializations: []
  },
  documents: {},
  additional: {
    coverLetterText: '',
    whyInterested: '',
    expectedSalary: '',
    noticePeriod: '',
    references: []
  }
};

export default function JobApplicationForm({
  job,
  isOpen,
  onClose,
  onSubmit
}: JobApplicationFormProps) {
  const [currentStep, setCurrentStep] = useState(0); // Start with verification check
  const [formData, setFormData] = useState<ApplicationData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [verificationStatus, setVerificationStatus] = useState<unknown>(null);
  const [isLoadingVerification, setIsLoadingVerification] = useState(true);

  const totalSteps = 6; // Added verification step

  const steps = [
    { id: 0, title: 'Verification', icon: Shield },
    { id: 1, title: 'Personal Info', icon: User },
    { id: 2, title: 'Experience', icon: Briefcase },
    { id: 3, title: 'Education & Skills', icon: GraduationCap },
    { id: 4, title: 'Documents', icon: FileText },
    { id: 5, title: 'Final Details', icon: Send }
  ];

  // Load verification status when form opens
  React.useEffect(() => {
    if (isOpen) {
      loadVerificationStatus();
    }
  }, [isOpen]);

  const loadVerificationStatus = async () => {
    try {
      setIsLoadingVerification(true);
      // Mock employee ID - in real app this would come from auth context
      const employeeId = 'emp_123';
      const status = await verificationService.checkVerificationStatus(employeeId);
      setVerificationStatus(status);
    } catch (error) {
      console.error('Failed to load verification status:', error);
    } finally {
      setIsLoadingVerification(false);
    }
  };

  const updateFormData = (section: keyof ApplicationData, data) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], ...data }
    }));
  };

  const addArrayItem = (section: keyof ApplicationData, key: string, item) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: [...(prev[section] as unknown)[key], item]
      }
    }));
  };

  const removeArrayItem = (section: keyof ApplicationData, key: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: (prev[section] as unknown)[key].filter((_, i: number) => i !== index)
      }
    }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.personalInfo.fullName) newErrors.fullName = 'Full name is required';
        if (!formData.personalInfo.email) newErrors.email = 'Email is required';
        if (!formData.personalInfo.phone) newErrors.phone = 'Phone is required';
        if (!formData.personalInfo.currentLocation) newErrors.currentLocation = 'Current location is required';
        break;

      case 2:
        if (formData.experience.totalYears < 0) newErrors.totalYears = 'Experience cannot be negative';
        if (!formData.experience.relevantExperience) newErrors.relevantExperience = 'Relevant experience description is required';
        break;

      case 3:
        if (!formData.education.degree) newErrors.degree = 'Education degree is required';
        if (!formData.education.institution) newErrors.institution = 'Institution is required';
        break;

      case 5:
        if (!formData.additional.whyInterested) newErrors.whyInterested = 'Please explain why you are interested in this role';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    // Special handling for verification step
    if (currentStep === 0) {
      if (!verificationStatus?.canApplyForJobs) {
        // Don't allow proceeding without verification
        return;
      }
    }

    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps - 1));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
      setFormData(initialFormData);
      setCurrentStep(1);
    } catch (error) {
      console.error('Error submitting application:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold mb-4">Verification Status</h3>

            {isLoadingVerification ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : verificationStatus ? (
              <div className="space-y-4">
                {/* Verification Status Overview */}
                <Card className={cn(
                  'border-2',
                  verificationStatus.canApplyForJobs
                    ? 'border-green-200 bg-green-50'
                    : 'border-orange-200 bg-orange-50'
                )}>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-4">
                      {verificationStatus.canApplyForJobs ? (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      ) : (
                        <AlertCircle className="h-6 w-6 text-orange-600" />
                      )}
                      <div>
                        <h4 className={cn(
                          'font-semibold',
                          verificationStatus.canApplyForJobs ? 'text-green-800' : 'text-orange-800'
                        )}>
                          {verificationStatus.canApplyForJobs
                            ? 'Profile Verified - Ready to Apply'
                            : 'Verification Required'
                          }
                        </h4>
                        <p className={cn(
                          'text-sm',
                          verificationStatus.canApplyForJobs ? 'text-green-600' : 'text-orange-600'
                        )}>
                          {verificationStatus.canApplyForJobs
                            ? 'Your profile is fully verified. You can proceed with your job application.'
                            : 'Please complete your profile verification before applying for jobs.'
                          }
                        </p>
                      </div>
                    </div>

                    {/* Verification Score */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="font-medium">Verification Score</span>
                        <span className="font-bold">{verificationStatus.verificationScore}%</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full transition-all duration-300',
                            verificationStatus.verificationScore >= 80 ? 'bg-green-500' :
                            verificationStatus.verificationScore >= 60 ? 'bg-yellow-500' :
                            verificationStatus.verificationScore >= 40 ? 'bg-orange-500' : 'bg-red-500'
                          )}
                          style={{ width: `${Math.min(verificationStatus.verificationScore, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Missing Requirements */}
                    {verificationStatus.missingRequirements.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-orange-800 mb-2">
                          Complete these requirements to unlock job applications:
                        </p>
                        <ul className="space-y-1">
                          {verificationStatus.missingRequirements.map((requirement: string, index: number) => (
                            <li key={index} className="flex items-center gap-2 text-sm text-orange-700">
                              <div className="h-1.5 w-1.5 bg-orange-500 rounded-full"></div>
                              {requirement}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                {!verificationStatus.canApplyForJobs && (
                  <Card>
                    <CardContent className="pt-6">
                      <h4 className="font-medium mb-3">Complete Your Verification</h4>
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => {
                            // Navigate to profile verification page
                            window.open('/employee/profile', '_blank');
                          }}
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          Go to Profile Verification
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          Complete your Aadhaar verification and upload required documents to proceed.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Job Requirements Notice */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Why Verification is Required</p>
                        <p>
                          We require profile verification to ensure the safety and authenticity of all
                          job applications. This helps restaurants trust that applicants are genuine
                          and qualified candidates.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 font-medium mb-2">Unable to Load Verification Status</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Please try again or contact support if the problem persists.
                </p>
                <Button onClick={loadVerificationStatus} variant="outline">
                  Retry
                </Button>
              </div>
            )}
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  value={formData.personalInfo.fullName}
                  onChange={(e) => updateFormData('personalInfo', { fullName: e.target.value })}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg bg-background',
                    errors.fullName ? 'border-red-500' : 'border-border'
                  )}
                  placeholder="Enter your full name"
                />
                {errors.fullName && (
                  <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.personalInfo.email}
                  onChange={(e) => updateFormData('personalInfo', { email: e.target.value })}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg bg-background',
                    errors.email ? 'border-red-500' : 'border-border'
                  )}
                  placeholder="your.email@example.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Phone *</label>
                <input
                  type="tel"
                  value={formData.personalInfo.phone}
                  onChange={(e) => updateFormData('personalInfo', { phone: e.target.value })}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg bg-background',
                    errors.phone ? 'border-red-500' : 'border-border'
                  )}
                  placeholder="+91 98765 43210"
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Current Location *</label>
                <input
                  type="text"
                  value={formData.personalInfo.currentLocation}
                  onChange={(e) => updateFormData('personalInfo', { currentLocation: e.target.value })}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg bg-background',
                    errors.currentLocation ? 'border-red-500' : 'border-border'
                  )}
                  placeholder="Mumbai, Maharashtra"
                />
                {errors.currentLocation && (
                  <p className="text-red-500 text-xs mt-1">{errors.currentLocation}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Preferred Work Location</label>
                <input
                  type="text"
                  value={formData.personalInfo.preferredLocation}
                  onChange={(e) => updateFormData('personalInfo', { preferredLocation: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                  placeholder="Delhi, Mumbai (optional)"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Availability</label>
                <select
                  value={formData.personalInfo.availability}
                  onChange={(e) => updateFormData('personalInfo', { availability: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                >
                  <option value="immediate">Immediate</option>
                  <option value="2weeks">2 weeks notice</option>
                  <option value="1month">1 month notice</option>
                  <option value="2months">2 months notice</option>
                  <option value="3months">3+ months notice</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Work Experience</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Total Experience (Years) *</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={formData.experience.totalYears}
                  onChange={(e) => updateFormData('experience', { totalYears: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Current Role</label>
                <input
                  type="text"
                  value={formData.experience.currentRole}
                  onChange={(e) => updateFormData('experience', { currentRole: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                  placeholder="Senior Chef"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Current Company</label>
                <input
                  type="text"
                  value={formData.experience.currentCompany}
                  onChange={(e) => updateFormData('experience', { currentCompany: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                  placeholder="Restaurant Name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Relevant Experience *</label>
              <textarea
                rows={4}
                value={formData.experience.relevantExperience}
                onChange={(e) => updateFormData('experience', { relevantExperience: e.target.value })}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg bg-background',
                  errors.relevantExperience ? 'border-red-500' : 'border-border'
                )}
                placeholder="Describe your relevant experience for this role..."
              />
              {errors.relevantExperience && (
                <p className="text-red-500 text-xs mt-1">{errors.relevantExperience}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">Previous Roles</label>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => addArrayItem('experience', 'previousRoles', {
                    title: '',
                    company: '',
                    duration: '',
                    description: ''
                  })}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Role
                </Button>
              </div>
              
              {formData.experience.previousRoles.map((role, index) => (
                <Card key={index} className="p-4 mb-2">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium">Role #{index + 1}</h4>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeArrayItem('experience', 'previousRoles', index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Job Title"
                      value={role.title}
                      onChange={(e) => {
                        const newRoles = [...formData.experience.previousRoles];
                        newRoles[index] = { ...newRoles[index], title: e.target.value };
                        updateFormData('experience', { previousRoles: newRoles });
                      }}
                      className="px-3 py-2 border border-border rounded-lg bg-background"
                    />
                    
                    <input
                      type="text"
                      placeholder="Company"
                      value={role.company}
                      onChange={(e) => {
                        const newRoles = [...formData.experience.previousRoles];
                        newRoles[index] = { ...newRoles[index], company: e.target.value };
                        updateFormData('experience', { previousRoles: newRoles });
                      }}
                      className="px-3 py-2 border border-border rounded-lg bg-background"
                    />
                  </div>
                  
                  <input
                    type="text"
                    placeholder="Duration (e.g., Jan 2020 - Dec 2022)"
                    value={role.duration}
                    onChange={(e) => {
                      const newRoles = [...formData.experience.previousRoles];
                      newRoles[index] = { ...newRoles[index], duration: e.target.value };
                      updateFormData('experience', { previousRoles: newRoles });
                    }}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background mb-2"
                  />
                  
                  <textarea
                    rows={2}
                    placeholder="Role description and achievements..."
                    value={role.description}
                    onChange={(e) => {
                      const newRoles = [...formData.experience.previousRoles];
                      newRoles[index] = { ...newRoles[index], description: e.target.value };
                      updateFormData('experience', { previousRoles: newRoles });
                    }}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                  />
                </Card>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Education & Skills</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-1">Highest Degree *</label>
                <input
                  type="text"
                  value={formData.education.degree}
                  onChange={(e) => updateFormData('education', { degree: e.target.value })}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg bg-background',
                    errors.degree ? 'border-red-500' : 'border-border'
                  )}
                  placeholder="Bachelor's in Hotel Management"
                />
                {errors.degree && (
                  <p className="text-red-500 text-xs mt-1">{errors.degree}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Institution *</label>
                <input
                  type="text"
                  value={formData.education.institution}
                  onChange={(e) => updateFormData('education', { institution: e.target.value })}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg bg-background',
                    errors.institution ? 'border-red-500' : 'border-border'
                  )}
                  placeholder="Institute of Hotel Management"
                />
                {errors.institution && (
                  <p className="text-red-500 text-xs mt-1">{errors.institution}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Graduation Year</label>
                <input
                  type="text"
                  value={formData.education.year}
                  onChange={(e) => updateFormData('education', { year: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                  placeholder="2020"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Technical Skills</label>
                <input
                  type="text"
                  placeholder="Add skills separated by commas (e.g., French Cuisine, Pastry Making, Kitchen Management)"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      const skills = e.currentTarget.value.split(',').map(s => s.trim()).filter(Boolean);
                      updateFormData('skills', { 
                        technical: [...formData.skills.technical, ...skills].filter((v, i, a) => a.indexOf(v) === i) 
                      });
                      e.currentTarget.value = '';
                    }
                  }}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.skills.technical.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer" 
                           onClick={() => removeArrayItem('skills', 'technical', index)}>
                      {skill}
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Languages</label>
                <input
                  type="text"
                  placeholder="Add languages separated by commas (e.g., English, Hindi, French)"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      const languages = e.currentTarget.value.split(',').map(s => s.trim()).filter(Boolean);
                      updateFormData('skills', { 
                        languages: [...formData.skills.languages, ...languages].filter((v, i, a) => a.indexOf(v) === i) 
                      });
                      e.currentTarget.value = '';
                    }
                  }}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.skills.languages.map((language, index) => (
                    <Badge key={index} variant="outline" className="cursor-pointer" 
                           onClick={() => removeArrayItem('skills', 'languages', index)}>
                      {language}
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Documents & Portfolio</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Resume/CV *</label>
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload resume or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, DOC, DOCX up to 5MB
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Cover Letter</label>
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Upload cover letter (optional)
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, DOC, DOCX up to 5MB
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Portfolio/Work Samples</label>
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Upload portfolio (optional)
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, ZIP up to 10MB
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Certificates</label>
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <Award className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Upload certificates (optional)
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, JPG, PNG up to 5MB each
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Final Details</h3>
            
            <div>
              <label className="block text-sm font-medium mb-1">Why are you interested in this role? *</label>
              <textarea
                rows={4}
                value={formData.additional.whyInterested}
                onChange={(e) => updateFormData('additional', { whyInterested: e.target.value })}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg bg-background',
                  errors.whyInterested ? 'border-red-500' : 'border-border'
                )}
                placeholder="Explain what interests you about this position and how you can contribute..."
              />
              {errors.whyInterested && (
                <p className="text-red-500 text-xs mt-1">{errors.whyInterested}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Cover Letter</label>
              <textarea
                rows={6}
                value={formData.additional.coverLetterText}
                onChange={(e) => updateFormData('additional', { coverLetterText: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                placeholder="Write a personalized cover letter for this application..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Expected Salary</label>
                <input
                  type="text"
                  value={formData.additional.expectedSalary}
                  onChange={(e) => updateFormData('additional', { expectedSalary: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                  placeholder="₹50,000 - ₹80,000 per month"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notice Period</label>
                <select
                  value={formData.additional.noticePeriod}
                  onChange={(e) => updateFormData('additional', { noticePeriod: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                >
                  <option value="">Select notice period</option>
                  <option value="immediate">Immediate</option>
                  <option value="2weeks">2 weeks</option>
                  <option value="1month">1 month</option>
                  <option value="2months">2 months</option>
                  <option value="3months">3+ months</option>
                </select>
              </div>
            </div>
          </div>
        );

      default:
        return null;
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
            className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-background rounded-xl shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Apply for {job.title}</h2>
                <p className="text-sm text-muted-foreground">{job.company} • {job.location}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Progress Steps */}
            <div className="px-6 py-4 border-b border-border">
              <div className="flex items-center justify-between">
                {steps.map((step) => {
                  const Icon = step.icon;
                  const isActive = currentStep === step.id;
                  const isCompleted = currentStep > step.id;
                  
                  return (
                    <div key={step.id} className="flex items-center">
                      <div className={cn(
                        'flex items-center justify-center w-10 h-10 rounded-full transition-colors',
                        isCompleted ? 'bg-primary text-primary-foreground' :
                        isActive ? 'bg-primary/10 text-primary border-2 border-primary' :
                        'bg-muted text-muted-foreground'
                      )}>
                        {isCompleted ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <Icon className="h-5 w-5" />
                        )}
                      </div>
                      
                      <div className="ml-2 hidden sm:block">
                        <p className={cn(
                          'text-sm font-medium',
                          isActive ? 'text-primary' : 'text-muted-foreground'
                        )}>
                          {step.title}
                        </p>
                      </div>
                      
                      {step.id < totalSteps && (
                        <div className={cn(
                          'h-0.5 w-8 sm:w-16 mx-2',
                          isCompleted ? 'bg-primary' : 'bg-border'
                        )} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 max-h-[60vh]">
              {renderStepContent()}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-border">
              <div className="text-sm text-muted-foreground">
                Step {currentStep + 1} of {totalSteps}
              </div>

              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                >
                  Previous
                </Button>

                {currentStep < totalSteps - 1 ? (
                  <Button
                    onClick={handleNext}
                    disabled={currentStep === 0 && !verificationStatus?.canApplyForJobs}
                  >
                    {currentStep === 0 && !verificationStatus?.canApplyForJobs ? (
                      'Complete Verification First'
                    ) : (
                      'Next'
                    )}
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="min-w-[120px]"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Application
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
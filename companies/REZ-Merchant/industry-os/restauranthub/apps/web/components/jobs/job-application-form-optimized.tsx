'use client';

import React, { useState, useMemo, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ArrowLeft,
  ArrowRight,
  Check,
  Shield,
  User,
  Briefcase,
  GraduationCap,
  FileText,
  Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { verificationService } from '@/lib/api/verification';
import { cn } from '@/lib/utils';

// Dynamic imports for step components to reduce initial bundle size
const VerificationStep = dynamic(() => import('./steps/VerificationStep'), {
  loading: () => <div className="animate-pulse h-32 bg-muted rounded-md" />,
  ssr: false
});

const PersonalInfoStep = dynamic(() => import('./steps/PersonalInfoStep'), {
  loading: () => <div className="animate-pulse h-32 bg-muted rounded-md" />,
  ssr: false
});

const ExperienceStep = dynamic(() => import('./steps/ExperienceStep'), {
  loading: () => <div className="animate-pulse h-32 bg-muted rounded-md" />,
  ssr: false
});

const EducationSkillsStep = dynamic(() => import('./steps/EducationSkillsStep'), {
  loading: () => <div className="animate-pulse h-32 bg-muted rounded-md" />,
  ssr: false
});

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

const JobApplicationFormOptimized = React.memo(({
  job,
  isOpen,
  onClose,
  onSubmit
}: JobApplicationFormProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<ApplicationData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [verificationStatus, setVerificationStatus] = useState<unknown>(null);
  const [isLoadingVerification, setIsLoadingVerification] = useState(true);

  const steps = useMemo(() => [
    { id: 0, title: 'Verification', icon: Shield },
    { id: 1, title: 'Personal Info', icon: User },
    { id: 2, title: 'Experience', icon: Briefcase },
    { id: 3, title: 'Education & Skills', icon: GraduationCap },
    { id: 4, title: 'Documents', icon: FileText },
    { id: 5, title: 'Final Details', icon: Send }
  ], []);

  // Load verification status when form opens
  React.useEffect(() => {
    if (isOpen) {
      loadVerificationStatus();
    }
  }, [isOpen]);

  const loadVerificationStatus = React.useCallback(async () => {
    try {
      setIsLoadingVerification(true);
      const employeeId = 'emp_123'; // Mock ID
      const status = await verificationService.checkVerificationStatus(employeeId);
      setVerificationStatus(status);
    } catch (error) {
      console.error('Failed to load verification status:', error);
    } finally {
      setIsLoadingVerification(false);
    }
  }, []);

  const updateFormData = React.useCallback((section: keyof ApplicationData, data) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], ...data }
    }));
  }, []);

  const addArrayItem = React.useCallback((section: keyof ApplicationData, key: string, item) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: [...(prev[section] as unknown)[key], item]
      }
    }));
  }, []);

  const removeArrayItem = React.useCallback((section: keyof ApplicationData, key: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: (prev[section] as unknown)[key].filter((_, i: number) => i !== index)
      }
    }));
  }, []);

  const updateArrayItem = React.useCallback((section: keyof ApplicationData, key: string, index: number, data) => {
    setFormData(prev => {
      const sectionData = prev[section] as unknown;
      const newArray = [...sectionData[key]];
      newArray[index] = { ...newArray[index], ...data };
      return {
        ...prev,
        [section]: {
          ...sectionData,
          [key]: newArray
        }
      };
    });
  }, []);

  const validateStep = React.useCallback((step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1: // Personal Info
        if (!formData.personalInfo.fullName.trim()) {
          newErrors.fullName = 'Full name is required';
        }
        if (!formData.personalInfo.email.trim()) {
          newErrors.email = 'Email is required';
        }
        if (!formData.personalInfo.phone.trim()) {
          newErrors.phone = 'Phone number is required';
        }
        if (!formData.personalInfo.currentLocation.trim()) {
          newErrors.currentLocation = 'Current location is required';
        }
        break;

      case 2: // Experience
        if (!formData.experience.relevantExperience.trim()) {
          newErrors.relevantExperience = 'Please describe your relevant experience';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleNext = React.useCallback(() => {
    if (currentStep === 0 && verificationStatus && !verificationStatus.canApplyForJobs) {
      return; // Don't allow progression if verification is incomplete
    }

    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  }, [currentStep, steps.length, validateStep, verificationStatus]);

  const handlePrevious = React.useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  const handleSubmit = React.useCallback(async () => {
    if (!validateStep(currentStep)) return;

    try {
      setIsSubmitting(true);
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Failed to submit application:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [currentStep, formData, onSubmit, onClose, validateStep]);

  const renderStepContent = React.useMemo(() => {
    switch (currentStep) {
      case 0:
        return (
          <Suspense fallback={<div className="animate-pulse h-32 bg-muted rounded-md" />}>
            <VerificationStep
              verificationStatus={verificationStatus}
              isLoadingVerification={isLoadingVerification}
            />
          </Suspense>
        );

      case 1:
        return (
          <Suspense fallback={<div className="animate-pulse h-32 bg-muted rounded-md" />}>
            <PersonalInfoStep
              formData={formData.personalInfo}
              updateFormData={(data) => updateFormData('personalInfo', data)}
              errors={errors}
            />
          </Suspense>
        );

      case 2:
        return (
          <Suspense fallback={<div className="animate-pulse h-32 bg-muted rounded-md" />}>
            <ExperienceStep
              formData={formData.experience}
              updateFormData={(data) => updateFormData('experience', data)}
              addArrayItem={(key, item) => addArrayItem('experience', key, item)}
              removeArrayItem={(key, index) => removeArrayItem('experience', key, index)}
              updateArrayItem={(key, index, data) => updateArrayItem('experience', key, index, data)}
              errors={errors}
            />
          </Suspense>
        );

      case 3:
        return (
          <Suspense fallback={<div className="animate-pulse h-32 bg-muted rounded-md" />}>
            <EducationSkillsStep
              formData={{ education: formData.education, skills: formData.skills }}
              updateFormData={updateFormData}
              addArrayItem={addArrayItem}
              removeArrayItem={removeArrayItem}
              errors={errors}
            />
          </Suspense>
        );

      default:
        return <div className="p-8 text-center">Step content coming soon...</div>;
    }
  }, [currentStep, formData, errors, verificationStatus, isLoadingVerification, updateFormData, addArrayItem, removeArrayItem, updateArrayItem]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-background rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-muted/30">
            <div>
              <h2 className="text-2xl font-bold">Apply for {job.title}</h2>
              <p className="text-muted-foreground">{job.company} • {job.location}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress Steps */}
          <div className="px-6 py-4 border-b bg-muted/10">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                const isDisabled = index === 0 && verificationStatus && !verificationStatus.canApplyForJobs && index > 0;

                return (
                  <div
                    key={step.id}
                    className={cn(
                      'flex items-center gap-2',
                      index < steps.length - 1 && 'flex-1'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors',
                          isActive && 'border-primary bg-primary text-primary-foreground',
                          isCompleted && 'border-green-500 bg-green-500 text-white',
                          !isActive && !isCompleted && 'border-muted-foreground/30 bg-background',
                          isDisabled && 'opacity-50'
                        )}
                      >
                        {isCompleted ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Icon className="h-4 w-4" />
                        )}
                      </div>
                      <span
                        className={cn(
                          'text-sm font-medium',
                          isActive && 'text-primary',
                          isCompleted && 'text-green-600',
                          !isActive && !isCompleted && 'text-muted-foreground',
                          isDisabled && 'opacity-50'
                        )}
                      >
                        {step.title}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={cn(
                          'flex-1 h-px ml-4',
                          isCompleted ? 'bg-green-500' : 'bg-muted-foreground/20'
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step Content */}
          <div className="flex-1 overflow-y-auto max-h-[calc(90vh-240px)]">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6"
            >
              {renderStepContent}
            </motion.div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t bg-muted/10">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Step {currentStep + 1} of {steps.length}
              </span>
            </div>

            {currentStep === steps.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
                <Send className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={currentStep === 0 && verificationStatus && !verificationStatus.canApplyForJobs}
                className="flex items-center gap-2"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
});

JobApplicationFormOptimized.displayName = 'JobApplicationFormOptimized';

export default JobApplicationFormOptimized;
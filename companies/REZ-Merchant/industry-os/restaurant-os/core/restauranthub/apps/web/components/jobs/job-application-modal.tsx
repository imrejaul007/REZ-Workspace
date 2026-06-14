'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Upload,
  FileText,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Star,
  Calendar,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUpload } from '@/components/ui/file-upload';
import { useAuth } from '@/lib/auth/auth-provider';
import { cn } from '@/lib/utils';

const applicationSchema = z.object({
  coverLetter: z.string().min(100, 'Cover letter must be at least 100 characters'),
  experience: z.object({
    totalYears: z.number().min(0, 'Experience cannot be negative'),
    relevantYears: z.number().min(0, 'Relevant experience cannot be negative'),
    previousRoles: z.array(z.object({
      title: z.string().min(1, 'Job title is required'),
      company: z.string().min(1, 'Company name is required'),
      duration: z.string().min(1, 'Duration is required'),
      description: z.string().optional()
    })).optional()
  }),
  skills: z.array(z.string()).min(1, 'At least one skill is required'),
  availability: z.object({
    startDate: z.string().min(1, 'Start date is required'),
    noticePeriod: z.string().min(1, 'Notice period is required'),
    workingHours: z.enum(['full-time', 'part-time', 'flexible']),
    shifts: z.array(z.string()).optional()
  }),
  expectedSalary: z.object({
    amount: z.number().min(0, 'Expected salary must be positive'),
    negotiable: z.boolean().default(true)
  }),
  documents: z.object({
    resume: z.array(z.instanceof(File)).min(1, 'Resume is required'),
    coverLetterFile: z.array(z.instanceof(File)).optional(),
    portfolio: z.array(z.instanceof(File)).optional(),
    certificates: z.array(z.instanceof(File)).optional()
  }),
  references: z.array(z.object({
    name: z.string().min(1, 'Reference name is required'),
    designation: z.string().min(1, 'Designation is required'),
    company: z.string().min(1, 'Company is required'),
    phone: z.string().min(10, 'Valid phone number is required'),
    email: z.string().email('Valid email is required')
  })).optional(),
  additionalInfo: z.string().optional(),
  consent: z.object({
    dataProcessing: z.boolean().refine(val => val === true, 'You must consent to data processing'),
    backgroundCheck: z.boolean().default(false),
    drugTest: z.boolean().default(false)
  })
});

type ApplicationForm = z.infer<typeof applicationSchema>;

interface Job {
  id: string;
  title: string;
  company: {
    name: string;
    logo?: string;
  };
  location: {
    city: string;
    state: string;
  };
  salary: {
    min: number;
    max: number;
    type: string;
  };
  requirements: string[];
  skills: string[];
}

interface JobApplicationModalProps {
  job: Job;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (application: ApplicationForm) => Promise<void>;
}

export function JobApplicationModal({ job, isOpen, onClose, onSubmit }: JobApplicationModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const form = useForm<ApplicationForm>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      coverLetter: '',
      experience: {
        totalYears: 0,
        relevantYears: 0,
        previousRoles: []
      },
      skills: [],
      availability: {
        startDate: '',
        noticePeriod: '2-weeks',
        workingHours: 'full-time',
        shifts: []
      },
      expectedSalary: {
        amount: job.salary.min,
        negotiable: true
      },
      documents: {
        resume: [],
        coverLetterFile: [],
        portfolio: [],
        certificates: []
      },
      references: [],
      additionalInfo: '',
      consent: {
        dataProcessing: false,
        backgroundCheck: false,
        drugTest: false
      }
    }
  });

  const handleSubmit = async (data: ApplicationForm) => {
    setLoading(true);
    try {
      await onSubmit(data);
      onClose();
    } catch (error) {
      console.error('Application submission failed:', error);
    } finally {
      setLoading(false);
    }
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

  const addReference = () => {
    const currentReferences = form.getValues('references') || [];
    form.setValue('references', [...currentReferences, {
      name: '',
      designation: '',
      company: '',
      phone: '',
      email: ''
    }]);
  };

  const removeReference = (index: number) => {
    const currentReferences = form.getValues('references') || [];
    form.setValue('references', currentReferences.filter((_, i) => i !== index));
  };

  const nextStep = () => {
    if (step < 5) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4"
        >
          <Card className="shadow-2xl border-0">
            {/* Header */}
            <CardHeader className="sticky top-0 bg-background border-b z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Briefcase className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Apply for {job.title}</CardTitle>
                    <CardDescription>
                      {job.company.name} • {job.location.city}, {job.location.state}
                    </CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Progress Indicator */}
              <div className="flex items-center space-x-2 mt-4">
                {[1, 2, 3, 4, 5].map((stepNum) => (
                  <div key={stepNum} className="flex items-center">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                        step >= stepNum
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {stepNum}
                    </div>
                    {stepNum < 5 && (
                      <div
                        className={cn(
                          'w-8 h-1 mx-2 rounded',
                          step > stepNum ? 'bg-primary' : 'bg-muted'
                        )}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="text-sm text-muted-foreground mt-2">
                Step {step} of 5: {
                  step === 1 ? 'Basic Information' :
                  step === 2 ? 'Experience & Skills' :
                  step === 3 ? 'Availability & Preferences' :
                  step === 4 ? 'Documents & Resume' :
                  'Review & Submit'
                }
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {/* Step 1: Basic Information */}
                {step === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <h3 className="text-lg font-semibold">Tell us about yourself</h3>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Cover Letter *
                      </label>
                      <textarea
                        {...form.register('coverLetter')}
                        rows={6}
                        placeholder="Write a compelling cover letter explaining why you're the perfect fit for this role..."
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                      />
                      <div className="text-xs text-muted-foreground">
                        {form.watch('coverLetter')?.length || 0} characters (minimum 100 required)
                      </div>
                      {form.formState.errors.coverLetter && (
                        <p className="text-sm text-destructive flex items-center space-x-1">
                          <AlertCircle className="h-4 w-4" />
                          <span>{form.formState.errors.coverLetter.message}</span>
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Total Experience (Years) *
                        </label>
                        <input
                          {...form.register('experience.totalYears', { valueAsNumber: true })}
                          type="number"
                          min="0"
                          step="0.5"
                          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Relevant Experience (Years) *
                        </label>
                        <input
                          {...form.register('experience.relevantYears', { valueAsNumber: true })}
                          type="number"
                          min="0"
                          step="0.5"
                          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Skills & Experience */}
                {step === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <h3 className="text-lg font-semibold">Skills & Experience</h3>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Skills *
                      </label>
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {job.skills.map((skill) => (
                            <button
                              key={skill}
                              type="button"
                              onClick={() => addSkill(skill)}
                              className={cn(
                                'px-3 py-1 text-sm rounded-full border transition-colors',
                                form.watch('skills').includes(skill)
                                  ? 'bg-primary text-primary-foreground border-primary'
                                  : 'bg-background text-foreground border-border hover:bg-accent'
                              )}
                            >
                              {skill}
                            </button>
                          ))}
                        </div>
                        
                        {form.watch('skills').length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-foreground">Selected Skills:</p>
                            <div className="flex flex-wrap gap-2">
                              {form.watch('skills').map((skill) => (
                                <div
                                  key={skill}
                                  className="flex items-center space-x-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                                >
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
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Availability */}
                {step === 3 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <h3 className="text-lg font-semibold">Availability & Preferences</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Earliest Start Date *
                        </label>
                        <input
                          {...form.register('availability.startDate')}
                          type="date"
                          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Notice Period *
                        </label>
                        <select
                          {...form.register('availability.noticePeriod')}
                          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                          <option value="immediate">Immediate</option>
                          <option value="1-week">1 Week</option>
                          <option value="2-weeks">2 Weeks</option>
                          <option value="1-month">1 Month</option>
                          <option value="2-months">2 Months</option>
                          <option value="3-months">3 Months</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Expected Salary (₹{job.salary.type}) *
                      </label>
                      <div className="flex items-center space-x-4">
                        <input
                          {...form.register('expectedSalary.amount', { valueAsNumber: true })}
                          type="number"
                          min={job.salary.min}
                          max={job.salary.max * 1.5}
                          className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                        <label className="flex items-center space-x-2">
                          <input
                            {...form.register('expectedSalary.negotiable')}
                            type="checkbox"
                            className="rounded border-border"
                          />
                          <span className="text-sm text-foreground">Negotiable</span>
                        </label>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Salary range for this position: ₹{job.salary.min.toLocaleString()} - ₹{job.salary.max.toLocaleString()}
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Step 4: Documents */}
                {step === 4 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <h3 className="text-lg font-semibold">Documents & Resume</h3>
                    
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-foreground">
                          Resume/CV *
                        </label>
                        <FileUpload
                          accept=".pdf,.doc,.docx"
                          maxSize={10}
                          maxFiles={1}
                          placeholder="Upload your resume or CV (PDF, DOC, DOCX)"
                          allowedTypes={['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']}
                          onFilesChange={(files) => {
                            form.setValue('documents.resume', files);
                          }}
                          value={form.watch('documents.resume')}
                        />
                        {form.formState.errors.documents?.resume && (
                          <p className="text-sm text-destructive flex items-center space-x-1">
                            <AlertCircle className="h-4 w-4" />
                            <span>{form.formState.errors.documents.resume.message}</span>
                          </p>
                        )}
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-medium text-foreground">
                          Cover Letter File (Optional)
                        </label>
                        <FileUpload
                          accept=".pdf,.doc,.docx,.txt"
                          maxSize={5}
                          maxFiles={1}
                          placeholder="Upload a cover letter file if you prefer (PDF, DOC, DOCX, TXT)"
                          allowedTypes={['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']}
                          onFilesChange={(files) => {
                            form.setValue('documents.coverLetterFile', files);
                          }}
                          value={form.watch('documents.coverLetterFile')}
                        />
                        <p className="text-xs text-muted-foreground">
                          This is optional since you've already written a cover letter in Step 1
                        </p>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-medium text-foreground">
                          Portfolio/Work Samples (Optional)
                        </label>
                        <FileUpload
                          accept=".pdf,.jpg,.jpeg,.png,.zip"
                          maxSize={20}
                          maxFiles={3}
                          multiple
                          placeholder="Upload portfolio, work samples, or certificates (PDF, Images, ZIP)"
                          allowedTypes={['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/zip']}
                          onFilesChange={(files) => {
                            form.setValue('documents.portfolio', files);
                          }}
                          value={form.watch('documents.portfolio')}
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-medium text-foreground">
                          Certificates (Optional)
                        </label>
                        <FileUpload
                          accept=".pdf,.jpg,.jpeg,.png"
                          maxSize={10}
                          maxFiles={5}
                          multiple
                          placeholder="Upload relevant certificates and qualifications (PDF, Images)"
                          allowedTypes={['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']}
                          onFilesChange={(files) => {
                            form.setValue('documents.certificates', files);
                          }}
                          value={form.watch('documents.certificates')}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 5: Review */}
                {step === 5 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <h3 className="text-lg font-semibold">Review & Submit</h3>
                    
                    <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                      <h4 className="font-medium">Application Summary</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Total Experience</p>
                          <p className="font-medium">{form.watch('experience.totalYears')} years</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Relevant Experience</p>
                          <p className="font-medium">{form.watch('experience.relevantYears')} years</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Start Date</p>
                          <p className="font-medium">{form.watch('availability.startDate')}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Expected Salary</p>
                          <p className="font-medium">
                            ₹{form.watch('expectedSalary.amount')?.toLocaleString()} 
                            {form.watch('expectedSalary.negotiable') && ' (Negotiable)'}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-sm">Skills</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {form.watch('skills').map((skill) => (
                            <span key={skill} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium">Consent & Agreements</h4>
                      
                      <label className="flex items-start space-x-3">
                        <input
                          {...form.register('consent.dataProcessing')}
                          type="checkbox"
                          className="rounded border-border mt-0.5"
                        />
                        <div className="text-sm">
                          <p className="font-medium text-foreground">Data Processing Consent *</p>
                          <p className="text-muted-foreground">
                            I consent to the processing of my personal data for the purpose of this job application and recruitment process.
                          </p>
                        </div>
                      </label>

                      {form.formState.errors.consent?.dataProcessing && (
                        <p className="text-sm text-destructive flex items-center space-x-1">
                          <AlertCircle className="h-4 w-4" />
                          <span>{form.formState.errors.consent.dataProcessing.message}</span>
                        </p>
                      )}

                      <label className="flex items-start space-x-3">
                        <input
                          {...form.register('consent.backgroundCheck')}
                          type="checkbox"
                          className="rounded border-border mt-0.5"
                        />
                        <div className="text-sm">
                          <p className="font-medium text-foreground">Background Check</p>
                          <p className="text-muted-foreground">
                            I consent to background verification if selected for this position.
                          </p>
                        </div>
                      </label>
                    </div>
                  </motion.div>
                )}

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-6 border-t">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={step === 1 ? onClose : prevStep}
                   size="default">
                    {step === 1 ? 'Cancel' : 'Previous'}
                  </Button>
                  
                  <div className="flex items-center space-x-3">
                    {step < 5 ? (
                      <Button
                        type="button"
                        onClick={nextStep}
                        disabled={
                          (step === 1 && (!form.watch('coverLetter') || form.watch('coverLetter').length < 100)) ||
                          (step === 2 && form.watch('skills').length === 0) ||
                          (step === 4 && form.watch('documents.resume').length === 0)
                        }
                       size="default" variant="default">
                        Next
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        disabled={loading || !form.watch('consent.dataProcessing')}
                        className="px-6"
                       size="default" variant="default">
                        {loading ? (
                          <div className="flex items-center space-x-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Submitting...</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Send className="h-4 w-4" />
                            <span>Submit Application</span>
                          </div>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
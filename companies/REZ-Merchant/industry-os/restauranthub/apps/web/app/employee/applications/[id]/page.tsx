'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Clock, 
  Building2,
  FileText,
  Phone,
  Mail,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  MessageCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

interface Application {
  id: string;
  jobTitle: string;
  company: string;
  status: 'pending' | 'under_review' | 'interview_scheduled' | 'accepted' | 'rejected';
  appliedDate: string;
  lastUpdate: string;
  jobDetails: {
    location: string;
    salary: string;
    type: string;
    description: string;
    requirements: string[];
  };
  applicationData: {
    coverLetter: string;
    experience: string;
    resume: string;
    additionalInfo: string;
  };
  timeline: Array<{
    date: string;
    status: string;
    description: string;
    icon;
  }>;
  nextSteps?: string;
  interviewDetails?: {
    date: string;
    time: string;
    location: string;
    interviewer: string;
    type: 'phone' | 'video' | 'in-person';
  };
}

export default function ApplicationDetails() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id as string;

  const [application] = useState<Application>({
    id: applicationId,
    jobTitle: 'Head Chef',
    company: 'Bella Vista Restaurant',
    status: 'interview_scheduled',
    appliedDate: '2024-01-15',
    lastUpdate: '2024-01-18',
    jobDetails: {
      location: 'Downtown, NY',
      salary: '$55,000 - $65,000',
      type: 'Full-time',
      description: 'We are seeking an experienced Head Chef to lead our kitchen team and maintain our high culinary standards.',
      requirements: [
        'Culinary degree or equivalent experience',
        '5+ years of head chef experience',
        'Strong leadership skills',
        'Knowledge of food safety regulations'
      ]
    },
    applicationData: {
      coverLetter: 'I am excited to apply for the Head Chef position at Bella Vista Restaurant. With over 7 years of culinary experience...',
      experience: '7 years',
      resume: 'chef-resume.pdf',
      additionalInfo: 'Available to start immediately. Flexible with schedule.'
    },
    timeline: [
      {
        date: '2024-01-15',
        status: 'Application Submitted',
        description: 'Your application has been successfully submitted',
        icon: FileText
      },
      {
        date: '2024-01-16',
        status: 'Under Review',
        description: 'HR team is reviewing your application',
        icon: AlertCircle
      },
      {
        date: '2024-01-18',
        status: 'Interview Scheduled',
        description: 'Interview scheduled for January 22nd',
        icon: Calendar
      }
    ],
    nextSteps: 'Please prepare for your interview on January 22nd. Review our menu and be ready to discuss your culinary philosophy.',
    interviewDetails: {
      date: '2024-01-22',
      time: '2:00 PM',
      location: 'Bella Vista Restaurant - 456 Main St',
      interviewer: 'Chef Marco Rossi',
      type: 'in-person'
    }
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-500', text: 'Pending' },
      under_review: { color: 'bg-blue-500', text: 'Under Review' },
      interview_scheduled: { color: 'bg-purple-500', text: 'Interview Scheduled' },
      accepted: { color: 'bg-green-500', text: 'Accepted' },
      rejected: { color: 'bg-red-500', text: 'Rejected' }
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <Badge className={`${config.color} text-white`}>
        {config.text}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
    }
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
              Back to Applications
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{application.jobTitle}</h1>
              <p className="text-muted-foreground">{application.company}</p>
            </div>
          </div>
          {getStatusBadge(application.status)}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Application Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    {getStatusIcon(application.status)}
                    <span className="ml-2">Application Status</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>Applied Date</span>
                    <span>{new Date(application.appliedDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Last Update</span>
                    <span>{new Date(application.lastUpdate).toLocaleDateString()}</span>
                  </div>
                  {application.nextSteps && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-1">Next Steps</h4>
                      <p className="text-sm text-blue-800">{application.nextSteps}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Interview Details */}
            {application.interviewDetails && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      Interview Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Date & Time</Label>
                        <p className="font-semibold">
                          {new Date(application.interviewDetails.date).toLocaleDateString()} at {application.interviewDetails.time}
                        </p>
                      </div>
                      <div>
                        <Label>Type</Label>
                        <p className="font-semibold capitalize">{application.interviewDetails.type.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <div>
                      <Label>Location</Label>
                      <p className="font-semibold">{application.interviewDetails.location}</p>
                    </div>
                    <div>
                      <Label>Interviewer</Label>
                      <p className="font-semibold">{application.interviewDetails.interviewer}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button >
                        <Calendar className="h-4 w-4 mr-2" />
                        Add to Calendar
                      </Button>
                      <Button  variant="outline">
                        <MapPin className="h-4 w-4 mr-2" />
                        Get Directions
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Application Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {application.timeline.map((event, index) => {
                      const Icon = event.icon;
                      return (
                        <div key={index} className="flex items-start space-x-4">
                          <div className="flex items-center justify-center w-10 h-10 bg-blue-500 text-white rounded-full">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold">{event.status}</h4>
                              <span className="text-sm text-muted-foreground">
                                {new Date(event.date).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {event.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Job Details */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Job Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{application.jobDetails.location}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{application.jobDetails.salary}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{application.jobDetails.type}</span>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-2">Requirements</h4>
                    <ul className="space-y-1">
                      {application.jobDetails.requirements.map((req, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start">
                          <span className="mr-2">•</span>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Your Application */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Your Application</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Experience</Label>
                    <p className="text-sm">{application.applicationData.experience}</p>
                  </div>
                  <div>
                    <Label>Resume</Label>
                    <Button variant="outline"  className="w-full mt-1">
                      <Download className="h-4 w-4 mr-2" />
                      {application.applicationData.resume}
                    </Button>
                  </div>
                  <div>
                    <Label>Cover Letter</Label>
                    <p className="text-sm text-muted-foreground">
                      {application.applicationData.coverLetter.substring(0, 100)}...
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <Button variant="outline" className="w-full">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Message Employer
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Phone className="h-4 w-4 mr-2" />
                    Contact Support
                  </Button>
                  <Button variant="destructive" className="w-full">
                    <XCircle className="h-4 w-4 mr-2" />
                    Withdraw Application
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-sm font-medium text-gray-700">{children}</label>;
}
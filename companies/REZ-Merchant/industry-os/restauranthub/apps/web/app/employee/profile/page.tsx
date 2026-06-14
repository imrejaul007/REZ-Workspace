'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Shield,
  FileText,
  Briefcase,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Award,
  AlertCircle,
  CheckCircle,
  Settings,
  Edit3,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VerificationBadge, VerificationStatus } from '@/components/verification/verification-badge';
import { DocumentUpload } from '@/components/verification/document-upload';
import { AadhaarVerification } from '@/components/verification/aadhaar-verification';
import { verificationService } from '@/lib/api/verification';
import { apiClient } from '@/lib/api/client';
import { cn } from '@/lib/utils';

interface EmployeeProfile {
  id: string;
  employeeCode: string;
  designation: string;
  department?: string;
  joiningDate: string;
  isActive: boolean;
  user: {
    id: string;
    email: string;
    profile?: {
      firstName: string;
      lastName: string;
      phone?: string;
      avatar?: string;
      dateOfBirth?: string;
      address?: string;
    };
  };
  restaurant: {
    id: string;
    name: string;
    location: string;
  };
}

// Maps a raw /users/profile response to the page's EmployeeProfile shape.
// The API returns: { id, email, role, profile: { firstName, lastName, ... }, employee: { ... } }
function mapApiResponseToProfile(raw): EmployeeProfile | null {
  if (!raw) return null;

  const apiProfile = raw.profile ?? {};
  const employee = raw.employee ?? {};
  const restaurant = employee.restaurant ?? {};

  return {
    id: employee.id ?? raw.id ?? '',
    employeeCode: employee.employeeCode ?? '',
    designation: employee.designation ?? '',
    department: employee.department ?? undefined,
    joiningDate: employee.joiningDate ?? employee.createdAt ?? new Date().toISOString(),
    isActive: employee.isActive ?? raw.isActive ?? true,
    user: {
      id: raw.id ?? '',
      email: raw.email ?? '',
      profile: apiProfile.firstName
        ? {
            firstName: apiProfile.firstName,
            lastName: apiProfile.lastName ?? '',
            phone: raw.phone ?? apiProfile.phone ?? undefined,
            avatar: apiProfile.avatar ?? undefined,
            dateOfBirth: apiProfile.dateOfBirth ?? undefined,
            address: [apiProfile.address, apiProfile.city, apiProfile.state]
              .filter(Boolean)
              .join(', ') || undefined,
          }
        : undefined,
    },
    restaurant: {
      id: restaurant.id ?? '',
      name: restaurant.name ?? '',
      location: [restaurant.city, restaurant.state].filter(Boolean).join(', ') || '',
    },
  };
}

export default function EmployeeProfilePage() {
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<unknown>(null);
  const [aadhaarStatus, setAadhaarStatus] = useState<unknown>(null);
  const [documents, setDocuments] = useState<unknown[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<unknown>('/users/profile');
      const mapped = mapApiResponseToProfile(res?.data ?? res);
      setProfile(mapped);

      if (mapped?.id) {
        await loadVerificationData(mapped.id);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const loadVerificationData = async (employeeId: string) => {
    try {
      const [verStatus, aadhaarStat, docs] = await Promise.all([
        verificationService.getEmployeeVerificationStatus(employeeId),
        verificationService.getAadhaarVerificationStatus(),
        verificationService.getEmployeeDocuments(employeeId),
      ]);

      setVerificationStatus(verStatus);
      setAadhaarStatus(aadhaarStat);
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to load verification data:', error);
    }
  };

  const handleDocumentUpload = async (file: File, documentType: string) => {
    if (!profile) return;
    try {
      setIsUploading(true);
      const fileUrl = await verificationService.uploadFile(file, documentType);
      await verificationService.uploadDocument({
        type: documentType,
        name: file.name,
        url: fileUrl,
        employeeId: profile.id,
      });
      await loadVerificationData(profile.id);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!profile) return;
    try {
      await verificationService.deleteDocument(documentId);
      await loadVerificationData(profile.id);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleAadhaarVerification = async (data) => {
    if (!profile) return;
    try {
      await verificationService.initiateAadhaarVerification(data);
      await loadVerificationData(profile.id);
    } catch (error) {
      console.error('Aadhaar verification failed:', error);
    }
  };

  const getVerificationAlert = () => {
    if (!verificationStatus) return null;

    if (verificationStatus.isFullyVerified) {
      return (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">Profile Fully Verified</p>
                <p className="text-sm text-green-600">
                  You can now apply for jobs and access all platform features.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-orange-800">Verification Required</p>
              <p className="text-sm text-orange-600 mb-2">
                Complete your profile verification to unlock job applications.
              </p>
              <div className="text-xs text-orange-600">
                <p>Missing requirements:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  {!verificationStatus.aadharVerified && (
                    <li>Aadhaar verification</li>
                  )}
                  {verificationStatus.requiredDocuments
                    .filter((docType: string) =>
                      !verificationStatus.verifiedDocuments.some((doc) => doc.type === docType)
                    )
                    .map((docType: string) => (
                      <li key={docType}>
                        {docType.charAt(0).toUpperCase() + docType.slice(1).replace('_', ' ')} document
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="h-96 bg-muted rounded-lg"></div>
              <div className="lg:col-span-2 h-96 bg-muted rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <User className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Complete your profile</h2>
            <p className="text-muted-foreground mb-6">
              No profile data found. Add your details to get started.
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Profile Details
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Employee Profile</h1>
            <p className="text-muted-foreground">
              Manage your profile and verification status
            </p>
          </div>
          <Button variant="outline">
            <Edit3 className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </div>

        {/* Verification Alert */}
        {getVerificationAlert()}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Profile Overview */}
          <div className="space-y-6">
            {/* Basic Info Card */}
            <Card>
              <CardHeader className="text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-12 w-12 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {profile.user.profile
                        ? `${profile.user.profile.firstName} ${profile.user.profile.lastName}`.trim()
                        : profile.user.email}
                    </h3>
                    {profile.designation ? (
                      <p className="text-sm text-muted-foreground">{profile.designation}</p>
                    ) : null}
                    {profile.employeeCode ? (
                      <Badge variant="secondary" className="mt-2">
                        {profile.employeeCode}
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{profile.user.email}</span>
                </div>
                {profile.user.profile?.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{profile.user.profile.phone}</span>
                  </div>
                )}
                {profile.restaurant.name && (
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{profile.restaurant.name}</span>
                  </div>
                )}
                {profile.restaurant.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{profile.restaurant.location}</span>
                  </div>
                )}
                {profile.joiningDate && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Joined {new Date(profile.joiningDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Verification Status Card */}
            {verificationStatus && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Verification Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <VerificationStatus
                    verificationScore={verificationStatus.verificationScore}
                    aadharVerified={verificationStatus.aadharVerified}
                    aadhaarStatus={verificationStatus.aadhaarStatus}
                    requiredDocuments={verificationStatus.requiredDocuments}
                    verifiedDocuments={verificationStatus.verifiedDocuments}
                    isFullyVerified={verificationStatus.isFullyVerified}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="verification" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="verification">Verification</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="verification" className="space-y-6">
                {/* Aadhaar Verification */}
                <AadhaarVerification
                  currentStatus={aadhaarStatus}
                  onInitiateVerification={handleAadhaarVerification}
                  isLoading={isUploading}
                />

                {/* Document Upload */}
                <DocumentUpload
                  documents={documents}
                  onUpload={handleDocumentUpload}
                  onDelete={handleDeleteDocument}
                  isUploading={isUploading}
                />
              </TabsContent>

              <TabsContent value="documents" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>All Documents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {documents.length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No documents uploaded yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-3 border border-border rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{doc.name}</p>
                                <p className="text-xs text-muted-foreground capitalize">
                                  {doc.type.replace('_', ' ')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <VerificationBadge status={doc.verificationStatus} size="sm" />
                              <Button variant="ghost" size="sm">
                                View
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Profile Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Profile settings will be available here.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from '@/lib/toast';
import { useAuth } from '@/lib/auth/auth-provider';
import {
  Building,
  MapPin,
  Phone,
  Mail,
  Globe,
  Upload,
  FileText,
  Award,
  Edit,
  Save,
  CheckCircle,
  AlertCircle,
  Download,
  Eye,
  X,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { formatDate, cn } from '@/lib/utils';

const vendorProfileSchema = z.object({
  // Company Information
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  businessType: z.enum(['manufacturer', 'distributor', 'wholesaler', 'supplier']),
  establishedYear: z.number().min(1900, 'Invalid year').max(new Date().getFullYear(), 'Invalid year'),
  description: z.string().max(1000, 'Description must be less than 1000 characters'),
  
  // Contact Information
  email: z.string().email('Please enter a valid email'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  website: z.string().url('Please enter a valid website URL').optional().or(z.literal('')),
  
  // Address
  address: z.object({
    street: z.string().min(5, 'Street address must be at least 5 characters'),
    city: z.string().min(2, 'City must be at least 2 characters'),
    state: z.string().min(2, 'State must be at least 2 characters'),
    pincode: z.string().min(6, 'Pincode must be 6 digits').max(6, 'Pincode must be 6 digits'),
    country: z.string().min(2, 'Country is required')
  }),
  
  // Business Details
  gstNumber: z.string().min(15, 'GST number must be 15 characters').max(15, 'GST number must be 15 characters').optional().or(z.literal('')),
  panNumber: z.string().min(10, 'PAN number must be 10 characters').max(10, 'PAN number must be 10 characters').optional().or(z.literal('')),
  
  // Service Areas
  serviceAreas: z.array(z.string()).min(1, 'Select at least one service area'),
  deliveryRadius: z.number().min(1, 'Delivery radius must be at least 1 km'),
  
  // Banking Information
  bankDetails: z.object({
    accountHolderName: z.string().min(2, 'Account holder name is required'),
    accountNumber: z.string().min(9, 'Account number must be at least 9 digits'),
    ifscCode: z.string().min(11, 'IFSC code must be 11 characters').max(11, 'IFSC code must be 11 characters'),
    bankName: z.string().min(2, 'Bank name is required'),
    branchName: z.string().min(2, 'Branch name is required')
  })
});

type VendorProfileForm = z.infer<typeof vendorProfileSchema>;

interface Document {
  id: string;
  type: 'gst' | 'pan' | 'license' | 'registration' | 'bank' | 'insurance' | 'quality-cert';
  name: string;
  uploadedAt: string;
  verified: boolean;
  size: string;
  expiryDate?: string;
}

interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  verified: boolean;
  certificateNumber: string;
}

const mockDocuments: Document[] = [
  { 
    id: '1', 
    type: 'gst', 
    name: 'GST_Certificate.pdf', 
    uploadedAt: '2024-01-01T00:00:00Z', 
    verified: true, 
    size: '245 KB' 
  },
  { 
    id: '2', 
    type: 'pan', 
    name: 'PAN_Card.pdf', 
    uploadedAt: '2023-12-15T00:00:00Z', 
    verified: true, 
    size: '180 KB' 
  },
  { 
    id: '3', 
    type: 'license', 
    name: 'Food_License.pdf', 
    uploadedAt: '2023-12-10T00:00:00Z', 
    verified: false, 
    size: '320 KB',
    expiryDate: '2025-12-10T00:00:00Z'
  },
  { 
    id: '4', 
    type: 'registration', 
    name: 'Business_Registration.pdf', 
    uploadedAt: '2023-11-20T00:00:00Z', 
    verified: true, 
    size: '285 KB' 
  },
  { 
    id: '5', 
    type: 'quality-cert', 
    name: 'ISO_9001_Certificate.pdf', 
    uploadedAt: '2023-10-15T00:00:00Z', 
    verified: true, 
    size: '412 KB',
    expiryDate: '2026-10-15T00:00:00Z'
  }
];

const mockCertifications: Certification[] = [
  {
    id: '1',
    name: 'HACCP Food Safety',
    issuer: 'Food Safety and Standards Authority of India',
    issueDate: '2023-06-15T00:00:00Z',
    expiryDate: '2026-06-15T00:00:00Z',
    verified: true,
    certificateNumber: 'HACCP-2023-001234'
  },
  {
    id: '2',
    name: 'ISO 9001:2015 Quality Management',
    issuer: 'Bureau of Indian Standards',
    issueDate: '2023-03-20T00:00:00Z',
    expiryDate: '2026-03-20T00:00:00Z',
    verified: true,
    certificateNumber: 'ISO-9001-2023-5678'
  },
  {
    id: '3',
    name: 'Organic Certification',
    issuer: 'Agricultural and Processed Food Products Export Development Authority',
    issueDate: '2023-01-10T00:00:00Z',
    expiryDate: '2025-01-10T00:00:00Z',
    verified: false,
    certificateNumber: 'APEDA-ORG-2023-9876'
  }
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export default function VendorProfile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('company');
  const [isEditing, setIsEditing] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [hasVendorProfile, setHasVendorProfile] = useState(true);

  const form = useForm<VendorProfileForm>({
    resolver: zodResolver(vendorProfileSchema),
    defaultValues: {
      companyName: '',
      businessType: 'supplier',
      establishedYear: new Date().getFullYear(),
      description: '',
      email: '',
      phone: '',
      website: '',
      address: { street: '', city: '', state: '', pincode: '', country: 'India' },
      gstNumber: '',
      panNumber: '',
      serviceAreas: [],
      deliveryRadius: 50,
      bankDetails: {
        accountHolderName: '',
        accountNumber: '',
        ifscCode: '',
        bankName: '',
        branchName: '',
      },
    },
  });

  useEffect(() => {
    const vendorId = user?.vendor?.id;
    if (!vendorId) {
      setHasVendorProfile(false);
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    setProfileError(null);

    fetch(`${API_BASE}/marketplace/suppliers/${vendorId}`, {
      credentials: 'include',
      headers: getAuthHeaders(),
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.message || `Failed to load profile: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        // Map API response fields into form values; fall back gracefully if keys differ
        form.reset({
          companyName: data.companyName ?? data.name ?? '',
          businessType: data.businessType ?? 'supplier',
          establishedYear: data.establishedYear ?? new Date().getFullYear(),
          description: data.description ?? '',
          email: data.email ?? user?.email ?? '',
          phone: data.phone ?? '',
          website: data.website ?? '',
          address: {
            street: data.address?.street ?? data.address ?? '',
            city: data.address?.city ?? data.city ?? '',
            state: data.address?.state ?? data.state ?? '',
            pincode: data.address?.pincode ?? data.zipCode ?? '',
            country: data.address?.country ?? data.country ?? 'India',
          },
          gstNumber: data.gstNumber ?? '',
          panNumber: data.panNumber ?? '',
          serviceAreas: data.serviceAreas ?? data.deliveryAreas ?? [],
          deliveryRadius: data.deliveryRadius ?? 50,
          bankDetails: {
            accountHolderName: data.bankDetails?.accountHolderName ?? data.companyName ?? '',
            accountNumber: data.bankDetails?.accountNumber ?? data.bankAccountNumber ?? '',
            ifscCode: data.bankDetails?.ifscCode ?? data.ifscCode ?? '',
            bankName: data.bankDetails?.bankName ?? data.bankName ?? '',
            branchName: data.bankDetails?.branchName ?? '',
          },
        });
      })
      .catch((err) => {
        setProfileError(err instanceof Error ? err.message : 'Failed to load vendor profile');
      })
      .finally(() => setProfileLoading(false));
  }, [user?.vendor?.id]);

  const tabs = [
    { id: 'company', label: 'Company Info', icon: Building },
    { id: 'address', label: 'Address & Service', icon: MapPin },
    { id: 'banking', label: 'Banking', icon: FileText },
    { id: 'documents', label: 'Documents', icon: Upload },
    { id: 'certifications', label: 'Certifications', icon: Award },
  ];

  const onSubmit = async (data: VendorProfileForm) => {
    const vendorId = user?.vendor?.id;
    const loadingToast = toast.loading('Saving vendor profile...');

    try {
      const res = await fetch(
        `${API_BASE}/marketplace/suppliers/${vendorId}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: getAuthHeaders(),
          body: JSON.stringify(data),
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || `Save failed: ${res.status}`);
      }

      toast.dismiss(loadingToast);
      toast.success('Vendor profile updated successfully!', 'Your business information has been saved.');
      setIsEditing(false);
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(
        'Failed to update vendor profile',
        error instanceof Error ? error.message : 'Please try again later.'
      );
    }
  };

  const getDocumentTypeLabel = (type: Document['type']) => {
    switch (type) {
      case 'gst':
        return 'GST Certificate';
      case 'pan':
        return 'PAN Card';
      case 'license':
        return 'Food License';
      case 'registration':
        return 'Business Registration';
      case 'bank':
        return 'Bank Statement';
      case 'insurance':
        return 'Insurance Policy';
      case 'quality-cert':
        return 'Quality Certificate';
      default:
        return 'Document';
    }
  };

  const getDocumentTypeIcon = (type: Document['type']) => {
    switch (type) {
      case 'gst':
      case 'pan':
        return <FileText className="h-5 w-5" />;
      case 'license':
      case 'quality-cert':
        return <Award className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  // Profile completion is calculated client-side based on filled fields
  const profileCompletion = (() => {
    const values = form.getValues();
    let filled = 0;
    const checks = [
      values.companyName,
      values.email,
      values.phone,
      values.address?.city,
      values.address?.street,
      values.gstNumber,
      values.bankDetails?.accountNumber,
      values.bankDetails?.ifscCode,
      values.serviceAreas?.length > 0,
    ];
    checks.forEach((v) => { if (v) filled++; });
    return Math.round((filled / checks.length) * 100);
  })();

  if (profileLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!hasVendorProfile) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
          <Building className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-2xl font-bold">Complete your vendor profile</h2>
          <p className="text-muted-foreground max-w-md">
            You don't have a vendor profile yet. Please contact support or complete your
            onboarding to activate your vendor account.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (profileError) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h2 className="text-xl font-semibold">Failed to load profile</h2>
          <p className="text-muted-foreground">{profileError}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Vendor Profile</h1>
            <p className="text-muted-foreground mt-1">
              Manage your business information and verification documents
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <div className="text-sm">
              <span className="text-muted-foreground">Profile Completion: </span>
              <span className="font-medium text-primary">{profileCompletion}%</span>
            </div>
            {isEditing ? (
              <div className="flex items-center space-x-2">
                <Button variant="outline"  onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button  onClick={form.handleSubmit(onSubmit)}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            ) : (
              <Button  onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        {/* Profile Completion Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground">Profile Verification Status</h3>
                <span className="text-sm text-muted-foreground">{profileCompletion}% Complete</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 mb-3">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${profileCompletion}%` }}
                />
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200 px-2 py-1 rounded-full">
                  ✓ Company Info
                </span>
                <span className="bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200 px-2 py-1 rounded-full">
                  ✓ GST Verified
                </span>
                <span className="bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200 px-2 py-1 rounded-full">
                  ✓ Banking Details
                </span>
                <span className="bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-200 px-2 py-1 rounded-full">
                  ! Food License Pending
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-0">
              <div className="flex flex-wrap border-b">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-colors hover:text-primary',
                        activeTab === tab.id
                          ? 'border-b-2 border-primary text-primary bg-primary/5'
                          : 'text-muted-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'company' && (
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>
                  Update your business details and description
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Company Name</label>
                      <input
                        {...form.register('companyName')}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      {form.formState.errors.companyName && (
                        <p className="text-sm text-destructive">{form.formState.errors.companyName.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Business Type</label>
                      <select
                        {...form.register('businessType')}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="manufacturer">Manufacturer</option>
                        <option value="distributor">Distributor</option>
                        <option value="wholesaler">Wholesaler</option>
                        <option value="supplier">Supplier</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Established Year</label>
                      <input
                        {...form.register('establishedYear', { valueAsNumber: true })}
                        disabled={!isEditing}
                        type="number"
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Website</label>
                      <input
                        {...form.register('website')}
                        disabled={!isEditing}
                        type="url"
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Email</label>
                      <input
                        {...form.register('email')}
                        disabled={!isEditing}
                        type="email"
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Phone</label>
                      <input
                        {...form.register('phone')}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">GST Number</label>
                      <input
                        {...form.register('gstNumber')}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="27AAACF1234A1Z5"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">PAN Number</label>
                      <input
                        {...form.register('panNumber')}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="AAACF1234A"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Company Description</label>
                    <textarea
                      {...form.register('description')}
                      disabled={!isEditing}
                      rows={4}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                      placeholder="Describe your business, products, and services..."
                    />
                    <p className="text-xs text-muted-foreground">Maximum 1000 characters</p>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {activeTab === 'documents' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Business Documents</CardTitle>
                  <CardDescription>
                    Upload and manage your business verification documents
                  </CardDescription>
                </div>
                <Button >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockDocuments.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          {getDocumentTypeIcon(doc.type)}
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground text-sm">{getDocumentTypeLabel(doc.type)}</h4>
                          <p className="text-xs text-muted-foreground">{doc.name}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-muted-foreground">{doc.size}</span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(doc.uploadedAt, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            {doc.expiryDate && (
                              <>
                                <span className="text-xs text-muted-foreground">•</span>
                                <span className="text-xs text-muted-foreground">
                                  Expires: {formatDate(doc.expiryDate, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              </>
                            )}
                            <div className={`text-xs px-2 py-1 rounded-full ${
                              doc.verified 
                                ? 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            }`}>
                              {doc.verified ? 'Verified' : 'Pending'}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button variant="ghost" >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                        <Button variant="ghost"  className="text-destructive hover:text-destructive">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'certifications' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Certifications & Awards</CardTitle>
                  <CardDescription>
                    Manage your quality certifications and industry awards
                  </CardDescription>
                </div>
                <Button >
                  <Award className="h-4 w-4 mr-2" />
                  Add Certification
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockCertifications.map((cert) => (
                    <div key={cert.id} className="p-4 border border-border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start space-x-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Award className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-semibold text-foreground">{cert.name}</h4>
                              {cert.verified && (
                                <CheckCircle className="h-4 w-4 text-success-500" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">{cert.issuer}</p>
                            <p className="text-xs text-muted-foreground">
                              Certificate No: {cert.certificateNumber}
                            </p>
                          </div>
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          cert.verified 
                            ? 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          {cert.verified ? 'Verified' : 'Pending'}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Issue Date: </span>
                          <span className="font-medium">
                            {formatDate(cert.issueDate, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        {cert.expiryDate && (
                          <div>
                            <span className="text-muted-foreground">Expiry Date: </span>
                            <span className="font-medium">
                              {formatDate(cert.expiryDate, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
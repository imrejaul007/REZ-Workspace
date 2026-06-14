'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import VendorVerification from '@/components/verification/vendor-verification';
import { useAuth } from '@/lib/auth/auth-provider';
import { UserRole } from '@/types/auth';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

interface NormalizedVendorApplication {
  id: string;
  vendorId: string;
  requestDate: string;
  status: string;
  priority: 'low' | 'medium' | 'high';
  vendorInfo: {
    businessName: string;
    contactPerson: string;
    email: string;
    phone: string;
    businessType: string;
    gstNumber: string;
    panNumber: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    yearsInBusiness: number;
    employeeCount: number;
    annualRevenue: number;
    description: string;
  };
  documents: unknown[];
  verificationChecks: Record<string, { status: string; score: number; details: string }>;
  riskAssessment: {
    overallScore: number;
    riskLevel: string;
    factors: unknown[];
  };
  timeline: Array<{
    id: string;
    action: string;
    timestamp: string;
    performedBy: string;
    details: string;
  }>;
  assignedTo: string;
  estimatedCompletion: string;
  internalNotes: unknown[];
}

interface VendorApplicationRaw {
  id: string;
  businessName: string;
  category: string;
  cities: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

function normaliseApplications(raw: VendorApplicationRaw[]) {
  return raw.map((app) => {
    let cities: string[] = [];
    try {
      cities = JSON.parse(app.cities);
    } catch {
      cities = [app.cities];
    }

    return {
      id: app.id,
      vendorId: app.id,
      requestDate: app.createdAt,
      status: app.status.toLowerCase(),
      priority: 'medium' as const,
      vendorInfo: {
        businessName: app.businessName,
        contactPerson: app.contactName,
        email: app.contactEmail,
        phone: app.contactPhone ?? '',
        businessType: app.category,
        gstNumber: '',
        panNumber: '',
        address: {
          street: '',
          city: cities[0] ?? '',
          state: '',
          zipCode: '',
          country: 'India',
        },
        yearsInBusiness: 0,
        employeeCount: 0,
        annualRevenue: 0,
        description: `Supplier in ${cities.join(', ')} — ${app.category}`,
      },
      documents: [],
      verificationChecks: {
        businessRegistration: { status: 'pending', score: 0, details: '' },
        gstVerification: { status: 'pending', score: 0, details: '' },
        bankVerification: { status: 'pending', score: 0, details: '' },
        addressVerification: { status: 'pending', score: 0, details: '' },
        phoneVerification: { status: 'pending', score: 0, details: '' },
        emailVerification: { status: 'pending', score: 0, details: '' },
        creditCheck: { status: 'pending', score: 0, details: '' },
        backgroundCheck: { status: 'pending', score: 0, details: '' },
      },
      riskAssessment: {
        overallScore: 0,
        riskLevel: 'medium' as const,
        factors: [],
      },
      timeline: [
        {
          id: '1',
          action: 'Application Submitted',
          timestamp: app.createdAt,
          performedBy: app.id,
          details: 'Vendor submitted registration',
        },
      ],
      assignedTo: '',
      estimatedCompletion: '',
      internalNotes: [],
    };
  });
}

export default function VendorVerificationPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<NormalizedVendorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.role === UserRole.ADMIN;

  const fetchApplications = useCallback(async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ data: VendorApplicationRaw[]; total: number }>(
        '/marketplace/vendor-applications',
      );
      setRequests(normaliseApplications(res.data ?? []));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load vendor applications');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleApprove = async (requestId: string, notes?: string) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'approved',
              timeline: [
                ...r.timeline,
                {
                  id: Date.now().toString(),
                  action: 'Application Approved',
                  timestamp: new Date().toISOString(),
                  performedBy: user?.id ?? 'admin',
                  details: notes ?? 'Vendor approved',
                },
              ],
            }
          : r,
      ),
    );
  };

  const handleReject = async (requestId: string, reason: string) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'rejected',
              timeline: [
                ...r.timeline,
                {
                  id: Date.now().toString(),
                  action: 'Application Rejected',
                  timestamp: new Date().toISOString(),
                  performedBy: user?.id ?? 'admin',
                  details: `Rejected: ${reason}`,
                },
              ],
            }
          : r,
      ),
    );
  };

  const handleRequestMoreInfo = async (requestId: string, requirements: string[]) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'incomplete',
              timeline: [
                ...r.timeline,
                {
                  id: Date.now().toString(),
                  action: 'More Information Requested',
                  timestamp: new Date().toISOString(),
                  performedBy: user?.id ?? 'admin',
                  details: `Additional requirements: ${requirements.join(', ')}`,
                },
              ],
            }
          : r,
      ),
    );
  };

  const handleAssignReviewer = async (requestId: string, reviewerId: string) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              assignedTo: reviewerId,
              timeline: [
                ...r.timeline,
                {
                  id: Date.now().toString(),
                  action: 'Reviewer Assigned',
                  timestamp: new Date().toISOString(),
                  performedBy: user?.id ?? 'admin',
                  details: `Assigned to: ${reviewerId}`,
                },
              ],
            }
          : r,
      ),
    );
  };

  const handleViewDocument = (document) => {
    if (document?.fileUrl) {
      window.open(document.fileUrl, '_blank');
    }
  };

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-64 text-center space-y-3">
          <ShieldAlert className="h-10 w-10 text-muted-foreground" />
          <h2 className="text-xl font-semibold text-foreground">Vendor Verification</h2>
          <p className="text-muted-foreground text-sm">
            This feature is only available for administrators.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-64 text-center space-y-3">
          <p className="text-lg font-semibold text-destructive">Failed to load applications</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={fetchApplications}>Retry</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <VendorVerification
        requests={requests}
        currentUserRole={(user?.role as unknown) ?? 'admin'}
        onApprove={handleApprove}
        onReject={handleReject}
        onRequestMoreInfo={handleRequestMoreInfo}
        onViewDocument={handleViewDocument}
      />
    </DashboardLayout>
  );
}

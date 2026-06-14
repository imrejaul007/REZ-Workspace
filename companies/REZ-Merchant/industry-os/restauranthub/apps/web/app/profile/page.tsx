'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import RestaurantProfile from '@/components/profiles/restaurant-profile';
import { useAuth } from '@/lib/auth/auth-provider';
import { UserRole } from '@/types/auth';
import { RezVerifiedBadge } from '@/components/ui/rez-verified-badge';
import { RezConsentModal } from '@/components/profile/rez-consent-modal';
import { useRezProfile } from '@/hooks/use-rez-profile';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { usersApi } from '@/lib/api/users';
import { apiClient } from '@/lib/api/client';

type RestaurantProfileShape = {
  id: string;
  basicInfo: {
    name: string;
    tagline?: string;
    description: string;
    founded: string;
    registrationNumber: string;
    gstNumber: string;
  };
  contact: { email: string; phone: string; whatsapp?: string; website?: string };
  location: {
    address: string; city: string; state: string; zipCode: string;
    country: string; coordinates?: { latitude: number; longitude: number };
  };
  cuisine: { primary: string[]; secondary: string[]; specialty: string };
  capacity: { seatingCapacity: number; staffCount: number; kitchenSize: string; privateRooms?: number };
  operatingHours: Array<{ day: string; isOpen: boolean; openTime: string; closeTime: string }>;
  socialMedia: Array<{ platform: string; url: string; followers: number }>;
  certifications: Array<{ id: string; name: string; issuer: string; issuedDate: string; expiryDate: string; status: 'active' | 'expired' | 'pending'; documentUrl: string }>;
  images: { logo?: string; cover?: string; gallery: string[] };
  verification: {
    isVerified: boolean;
    verifiedDate?: string;
    documents: { businessLicense: boolean; foodSafetyCert: boolean; gstRegistration: boolean; ownershipProof: boolean };
  };
  stats: { rating: number; reviewCount: number; orderCount: number; joinedDate: string };
  settings: { visibility: 'public' | 'private' | 'restricted'; allowReviews: boolean; autoAcceptOrders: boolean; minimumOrderValue: number };
};

function buildProfileFromApiUser(user): RestaurantProfileShape {
  const r = user?.restaurant ?? {};
  const p = user?.profile ?? {};
  return {
    id: user?.id ?? '',
    basicInfo: {
      name: r.businessName ?? (`${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || 'My Restaurant'),
      tagline: r.tagline ?? '',
      description: r.description ?? p.bio ?? '',
      founded: r.founded ?? '',
      registrationNumber: r.registrationNumber ?? '',
      gstNumber: r.gstNumber ?? '',
    },
    contact: {
      email: user?.email ?? '',
      phone: r.businessPhone ?? user?.phone ?? '',
      whatsapp: r.whatsapp ?? user?.phone ?? '',
      website: r.website ?? '',
    },
    location: {
      address: r.businessAddress ?? r.address ?? p.address ?? '',
      city: r.city ?? p.city ?? '',
      state: r.state ?? p.state ?? '',
      zipCode: r.zipCode ?? p.zipCode ?? '',
      country: r.country ?? 'India',
      coordinates: { latitude: r.latitude ?? 0, longitude: r.longitude ?? 0 },
    },
    cuisine: {
      primary: r.cuisineTypes ?? r.cuisine ?? [],
      secondary: r.secondaryCuisine ?? [],
      specialty: r.specialty ?? '',
    },
    capacity: {
      seatingCapacity: r.seatingCapacity ?? 0,
      staffCount: r.staffCount ?? 0,
      kitchenSize: r.kitchenSize ?? '',
      privateRooms: r.privateRooms ?? 0,
    },
    operatingHours: r.operatingHours ?? [
      { day: 'Monday', isOpen: true, openTime: '09:00', closeTime: '22:00' },
      { day: 'Tuesday', isOpen: true, openTime: '09:00', closeTime: '22:00' },
      { day: 'Wednesday', isOpen: true, openTime: '09:00', closeTime: '22:00' },
      { day: 'Thursday', isOpen: true, openTime: '09:00', closeTime: '22:00' },
      { day: 'Friday', isOpen: true, openTime: '09:00', closeTime: '23:00' },
      { day: 'Saturday', isOpen: true, openTime: '09:00', closeTime: '23:00' },
      { day: 'Sunday', isOpen: true, openTime: '10:00', closeTime: '22:00' },
    ],
    socialMedia: r.socialMedia ?? [],
    certifications: r.certifications ?? [],
    images: {
      logo: r.logo ?? r.images?.logo ?? undefined,
      cover: r.coverImage ?? r.images?.cover ?? undefined,
      gallery: r.gallery ?? r.images?.gallery ?? [],
    },
    verification: {
      isVerified: user?.isVerified ?? false,
      verifiedDate: user?.emailVerifiedAt ?? undefined,
      documents: {
        businessLicense: r.verificationDocuments?.businessLicense ?? false,
        foodSafetyCert: r.verificationDocuments?.foodSafetyCert ?? false,
        gstRegistration: r.verificationDocuments?.gstRegistration ?? false,
        ownershipProof: r.verificationDocuments?.ownershipProof ?? false,
      },
    },
    stats: {
      rating: r.averageRating ?? 0,
      reviewCount: r.reviewCount ?? 0,
      orderCount: r.orderCount ?? 0,
      joinedDate: user?.createdAt ?? '',
    },
    settings: {
      visibility: r.visibility ?? 'public',
      allowReviews: r.allowReviews ?? true,
      autoAcceptOrders: r.autoAcceptOrders ?? false,
      minimumOrderValue: r.minimumOrder ?? 0,
    },
  };
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<RestaurantProfileShape | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [consentOpen, setConsentOpen] = useState(false);

  useEffect(() => {
    usersApi.getProfile()
      .then((res) => {
        const apiUser = (res as { data?: unknown })?.data ?? res;
        if (apiUser) {
          setProfile(buildProfileFromApiUser(apiUser));
        }
      })
      .catch((err) => {
        console.error('Failed to load profile:', err);
      })
      .finally(() => setProfileLoading(false));
  }, []);

  const { profile: rezProfile, refetch: refetchRez } = useRezProfile(user?.id ?? '');

  const handleConsentSave = async (tier: 0 | 1 | 2) => {
    await fetch('/api/users/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ consentTier: tier }),
    });
    refetchRez();
  };

  const handleUpdateProfile = async (updatedProfile: RestaurantProfileShape) => {
    setProfile(updatedProfile);
    try {
      const p = updatedProfile.basicInfo;
      await apiClient.patch('/users/profile', {
        firstName: p.name?.split(' ')[0] ?? '',
        lastName: p.name?.split(' ').slice(1).join(' ') ?? '',
        bio: updatedProfile.basicInfo.description,
        address: updatedProfile.location.address,
        city: updatedProfile.location.city,
        state: updatedProfile.location.state,
        country: updatedProfile.location.country,
        pincode: updatedProfile.location.zipCode,
      });
    } catch (err) {
      console.error('Failed to persist profile update:', err);
    }
  };

  const handleUploadImage = async (type: 'logo' | 'cover' | 'gallery', file: File): Promise<string> => {
    const objectUrl = URL.createObjectURL(file);
    try {
      await apiClient.patch('/users/profile', { avatar: objectUrl });
    } catch (err) {
      console.error('Failed to update avatar:', err);
    }
    return objectUrl;
  };

  // Only show restaurant profile for restaurant users
  if (user?.role !== UserRole.RESTAURANT) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Restaurant Profile
          </h2>
          <p className="text-muted-foreground">
            This feature is only available for restaurant accounts.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (profileLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto p-6 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse h-32 bg-muted rounded-lg" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-foreground mb-2">Profile Unavailable</h2>
          <p className="text-muted-foreground">Unable to load your profile. Please try again later.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {rezProfile?.isRezVerified && (
        <div className="flex items-center gap-3 px-6 pt-4 pb-0">
          <RezVerifiedBadge size="md" />
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => setConsentOpen(true)}
          >
            <Settings className="h-3.5 w-3.5" />
            REZ Data Settings
          </Button>
          {rezProfile.consentTier > 0 && (
            <span className="text-xs text-muted-foreground">
              Sharing: Tier {rezProfile.consentTier}
            </span>
          )}
        </div>
      )}

      <RestaurantProfile
        profile={profile}
        isOwner={true}
        onUpdateProfile={handleUpdateProfile}
        onUploadImage={handleUploadImage}
      />

      {rezProfile && (
        <RezConsentModal
          open={consentOpen}
          onOpenChange={setConsentOpen}
          currentTier={rezProfile.consentTier as 0 | 1 | 2}
          onSave={handleConsentSave}
        />
      )}
    </DashboardLayout>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';
import { ClientProfile, ClientUser } from '@/types';
import { Loader2, Building2, Mail, Phone, Globe, MapPin, User, Edit2, Save } from 'lucide-react';
import { getInitials } from '@/lib/utils';

export default function ProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<ClientUser | null>(null);
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<ClientProfile>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!api.isAuthenticated()) {
        router.push('/');
        return;
      }

      const [profileRes] = await Promise.all([api.getProfile()]);

      if (!profileRes.success) {
        router.push('/');
        return;
      }

      setUser((profileRes as any).user);
      setProfile(profileRes.data as ClientProfile);
      setEditedProfile(profileRes.data as ClientProfile);
      setIsLoading(false);
    };

    loadData();
  }, [router]);

  const handleLogout = () => {
    api.logout();
    router.push('/');
  };

  const handleSave = async () => {
    setIsSaving(true);
    const response = await api.updateProfile(editedProfile);

    if (response.success && response.data) {
      setProfile(response.data as ClientProfile);
      setIsEditing(false);
    }

    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Failed to load profile</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar clientName={profile?.companyName} onLogout={handleLogout} />
      <main className="ml-64 p-8">
        <div className="max-w-4xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-heading text-3xl font-bold text-slate-900 mb-2">Company Profile</h1>
              <p className="text-slate-500">
                Manage your company information and team members
              </p>
            </div>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500 text-white hover:bg-primary-600 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setEditedProfile(profile);
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>

          {/* Company Info */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-6">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/20">
                <span className="text-2xl font-bold text-white">
                  {getInitials(profile.companyName)}
                </span>
              </div>
              <div className="flex-1">
                <h2 className="font-heading text-2xl font-bold text-slate-900 mb-2">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedProfile.companyName || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, companyName: e.target.value })}
                      className="w-full px-0 py-0 border-0 border-b-2 border-primary-500 focus:ring-0 bg-transparent text-2xl font-bold"
                    />
                  ) : (
                    profile.companyName
                  )}
                </h2>
                <p className="text-slate-500 mb-4">{profile.industry}</p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Globe className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Website</p>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedProfile.website || ''}
                          onChange={(e) => setEditedProfile({ ...editedProfile, website: e.target.value })}
                          className="text-sm text-slate-700 bg-transparent border-0 border-b border-slate-200 focus:border-primary-500 focus:ring-0"
                        />
                      ) : (
                        <p className="text-sm text-slate-700">{profile.website || 'Not provided'}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Phone className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Phone</p>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedProfile.phone || ''}
                          onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                          className="text-sm text-slate-700 bg-transparent border-0 border-b border-slate-200 focus:border-primary-500 focus:ring-0"
                        />
                      ) : (
                        <p className="text-sm text-slate-700">{profile.phone}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-6">
            <h3 className="font-heading font-semibold text-slate-900 mb-4">Address</h3>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-slate-500" />
              </div>
              <div className="flex-1">
                {profile.address.street && (
                  <p className="text-slate-700">{profile.address.street}</p>
                )}
                <p className="text-slate-600">
                  {[profile.address.city, profile.address.state, profile.address.postalCode]
                    .filter(Boolean)
                    .join(', ')}
                </p>
                {profile.address.country && (
                  <p className="text-slate-500">{profile.address.country}</p>
                )}
              </div>
            </div>
          </div>

          {/* Primary Contact */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-6">
            <h3 className="font-heading font-semibold text-slate-900 mb-4">Primary Contact</h3>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-lg font-semibold">
                {getInitials(profile.primaryContact.name)}
              </div>
              <div>
                <p className="font-medium text-slate-900">{profile.primaryContact.name}</p>
                <p className="text-sm text-slate-500">{profile.primaryContact.designation}</p>
                <div className="flex items-center gap-4 mt-1">
                  <span className="flex items-center gap-1 text-sm text-slate-500">
                    <Mail className="w-3 h-3" />
                    {profile.primaryContact.email}
                  </span>
                  {profile.primaryContact.phone && (
                    <span className="flex items-center gap-1 text-sm text-slate-500">
                      <Phone className="w-3 h-3" />
                      {profile.primaryContact.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Team Members */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8">
            <h3 className="font-heading font-semibold text-slate-900 mb-4">Team Members</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-4 rounded-xl bg-slate-50/50 border border-slate-100"
                >
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-sm font-semibold">
                    {getInitials(member.name)}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{member.name}</p>
                    <p className="text-xs text-slate-500">{member.designation}</p>
                    <p className="text-xs text-slate-400">{member.email}</p>
                  </div>
                  {member.isPrimary && (
                    <span className="ml-auto px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-600">
                      Primary
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

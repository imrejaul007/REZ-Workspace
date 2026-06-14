'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  Star,
  Users,
  Camera,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  Award,
  Shield,
  Calendar,
  DollarSign,
  TrendingUp,
  Check,
  AlertCircle,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn, formatDate } from '@/lib/utils';

interface OperatingHours {
  day: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

interface SocialMedia {
  platform: string;
  url: string;
  followers?: number;
}

interface Certification {
  id: string;
  name: string;
  issuer: string;
  issuedDate: string;
  expiryDate?: string;
  status: 'active' | 'expired' | 'pending';
  documentUrl?: string;
}

interface RestaurantProfile {
  id: string;
  basicInfo: {
    name: string;
    tagline?: string;
    description: string;
    founded: string;
    registrationNumber: string;
    gstNumber: string;
  };
  contact: {
    email: string;
    phone: string;
    whatsapp?: string;
    website?: string;
  };
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  cuisine: {
    primary: string[];
    secondary: string[];
    specialty: string;
  };
  capacity: {
    seatingCapacity: number;
    staffCount: number;
    kitchenSize: string;
    privateRooms?: number;
  };
  operatingHours: OperatingHours[];
  socialMedia: SocialMedia[];
  certifications: Certification[];
  images: {
    logo?: string;
    cover?: string;
    gallery: string[];
  };
  verification: {
    isVerified: boolean;
    verifiedDate?: string;
    documents: {
      businessLicense: boolean;
      foodSafetyCert: boolean;
      gstRegistration: boolean;
      ownershipProof: boolean;
    };
  };
  stats: {
    rating: number;
    reviewCount: number;
    orderCount: number;
    joinedDate: string;
  };
  settings: {
    visibility: 'public' | 'private' | 'restricted';
    allowReviews: boolean;
    autoAcceptOrders: boolean;
    minimumOrderValue: number;
  };
}

interface RestaurantProfileProps {
  profile: RestaurantProfile;
  isOwner: boolean;
  onUpdateProfile: (profile: RestaurantProfile) => void;
  onUploadImage: (type: 'logo' | 'cover' | 'gallery', file: File) => Promise<string>;
}

const defaultOperatingHours: OperatingHours[] = [
  { day: 'Monday', isOpen: true, openTime: '09:00', closeTime: '22:00' },
  { day: 'Tuesday', isOpen: true, openTime: '09:00', closeTime: '22:00' },
  { day: 'Wednesday', isOpen: true, openTime: '09:00', closeTime: '22:00' },
  { day: 'Thursday', isOpen: true, openTime: '09:00', closeTime: '22:00' },
  { day: 'Friday', isOpen: true, openTime: '09:00', closeTime: '23:00' },
  { day: 'Saturday', isOpen: true, openTime: '09:00', closeTime: '23:00' },
  { day: 'Sunday', isOpen: true, openTime: '10:00', closeTime: '22:00' }
];

export default function RestaurantProfile({
  profile,
  isOwner,
  onUpdateProfile,
  onUploadImage
}: RestaurantProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(profile);
  const [activeSection, setActiveSection] = useState('basic');
  const [isUploading, setIsUploading] = useState(false);

  const sections = [
    { id: 'basic', label: 'Basic Information', icon: Building2 },
    { id: 'contact', label: 'Contact Details', icon: Phone },
    { id: 'location', label: 'Location', icon: MapPin },
    { id: 'cuisine', label: 'Cuisine & Specialty', icon: Award },
    { id: 'operations', label: 'Operations', icon: Clock },
    { id: 'media', label: 'Images & Media', icon: Camera },
    { id: 'certifications', label: 'Certifications', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const handleSave = () => {
    onUpdateProfile(editedProfile);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  const handleImageUpload = async (type: 'logo' | 'cover' | 'gallery', file: File) => {
    setIsUploading(true);
    try {
      const imageUrl = await onUploadImage(type, file);
      setEditedProfile(prev => ({
        ...prev,
        images: {
          ...prev.images,
          [type]: type === 'gallery' 
            ? [...prev.images.gallery, imageUrl]
            : imageUrl
        }
      }));
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const updateField = (section: string, field: string, value) => {
    setEditedProfile(prev => {
      const sectionData = prev[section as keyof RestaurantProfile];

      // Ensure we're only spreading objects, not arrays or primitives
      if (typeof sectionData === 'object' && sectionData !== null && !Array.isArray(sectionData)) {
        return {
          ...prev,
          [section]: {
            ...sectionData,
            [field]: value
          }
        };
      }

      // For non-object sections, just set the value directly
      return {
        ...prev,
        [section]: value
      };
    });
  };

  const addSocialMedia = () => {
    setEditedProfile(prev => ({
      ...prev,
      socialMedia: [
        ...prev.socialMedia,
        { platform: 'Instagram', url: '', followers: 0 }
      ]
    }));
  };

  const removeSocialMedia = (index: number) => {
    setEditedProfile(prev => ({
      ...prev,
      socialMedia: prev.socialMedia.filter((_, i) => i !== index)
    }));
  };

  const addCertification = () => {
    const newCert: Certification = {
      id: Date.now().toString(),
      name: '',
      issuer: '',
      issuedDate: new Date().toISOString().split('T')[0],
      status: 'pending'
    };
    
    setEditedProfile(prev => ({
      ...prev,
      certifications: [...prev.certifications, newCert]
    }));
  };

  const removeCertification = (id: string) => {
    setEditedProfile(prev => ({
      ...prev,
      certifications: prev.certifications.filter(cert => cert.id !== id)
    }));
  };

  const renderBasicInfo = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Restaurant Name *</label>
        {isEditing ? (
          <input
            type="text"
            value={editedProfile.basicInfo.name}
            onChange={(e) => setEditedProfile(prev => ({
              ...prev,
              basicInfo: { ...prev.basicInfo, name: e.target.value }
            }))}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        ) : (
          <p className="text-lg font-semibold text-foreground">{profile.basicInfo.name}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Tagline</label>
        {isEditing ? (
          <input
            type="text"
            value={editedProfile.basicInfo.tagline || ''}
            onChange={(e) => setEditedProfile(prev => ({
              ...prev,
              basicInfo: { ...prev.basicInfo, tagline: e.target.value }
            }))}
            placeholder="e.g., Authentic Italian Cuisine"
            className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        ) : (
          <p className="text-muted-foreground">{profile.basicInfo.tagline || 'No tagline set'}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Description</label>
        {isEditing ? (
          <textarea
            value={editedProfile.basicInfo.description}
            onChange={(e) => setEditedProfile(prev => ({
              ...prev,
              basicInfo: { ...prev.basicInfo, description: e.target.value }
            }))}
            rows={4}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        ) : (
          <p className="text-foreground leading-relaxed">{profile.basicInfo.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Founded Year</label>
          {isEditing ? (
            <input
              type="text"
              value={editedProfile.basicInfo.founded}
              onChange={(e) => setEditedProfile(prev => ({
                ...prev,
                basicInfo: { ...prev.basicInfo, founded: e.target.value }
              }))}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          ) : (
            <p className="text-foreground">{profile.basicInfo.founded}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Registration Number</label>
          {isEditing ? (
            <input
              type="text"
              value={editedProfile.basicInfo.registrationNumber}
              onChange={(e) => setEditedProfile(prev => ({
                ...prev,
                basicInfo: { ...prev.basicInfo, registrationNumber: e.target.value }
              }))}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          ) : (
            <p className="font-mono text-foreground">{profile.basicInfo.registrationNumber}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">GST Number</label>
          {isEditing ? (
            <input
              type="text"
              value={editedProfile.basicInfo.gstNumber}
              onChange={(e) => setEditedProfile(prev => ({
                ...prev,
                basicInfo: { ...prev.basicInfo, gstNumber: e.target.value }
              }))}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          ) : (
            <p className="font-mono text-foreground">{profile.basicInfo.gstNumber}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderContactInfo = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Email *</label>
          {isEditing ? (
            <input
              type="email"
              value={editedProfile.contact.email}
              onChange={(e) => setEditedProfile(prev => ({
                ...prev,
                contact: { ...prev.contact, email: e.target.value }
              }))}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          ) : (
            <p className="text-foreground">{profile.contact.email}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Phone *</label>
          {isEditing ? (
            <input
              type="tel"
              value={editedProfile.contact.phone}
              onChange={(e) => setEditedProfile(prev => ({
                ...prev,
                contact: { ...prev.contact, phone: e.target.value }
              }))}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          ) : (
            <p className="text-foreground">{profile.contact.phone}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">WhatsApp</label>
          {isEditing ? (
            <input
              type="tel"
              value={editedProfile.contact.whatsapp || ''}
              onChange={(e) => setEditedProfile(prev => ({
                ...prev,
                contact: { ...prev.contact, whatsapp: e.target.value }
              }))}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          ) : (
            <p className="text-foreground">{profile.contact.whatsapp || 'Not provided'}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Website</label>
          {isEditing ? (
            <input
              type="url"
              value={editedProfile.contact.website || ''}
              onChange={(e) => setEditedProfile(prev => ({
                ...prev,
                contact: { ...prev.contact, website: e.target.value }
              }))}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          ) : (
            <p className="text-foreground">
              {profile.contact.website ? (
                <a href={profile.contact.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {profile.contact.website}
                </a>
              ) : (
                'Not provided'
              )}
            </p>
          )}
        </div>
      </div>

      {/* Social Media */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-foreground">Social Media</h4>
          {isEditing && (
            <Button variant="outline" size="sm" onClick={addSocialMedia}>
              <Plus className="h-4 w-4 mr-2" />
              Add Social Media
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {(isEditing ? editedProfile.socialMedia : profile.socialMedia).map((social, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className="w-20">
                {isEditing ? (
                  <select
                    value={social.platform}
                    onChange={(e) => {
                      const newSocialMedia = [...editedProfile.socialMedia];
                      newSocialMedia[index].platform = e.target.value;
                      setEditedProfile(prev => ({ ...prev, socialMedia: newSocialMedia }));
                    }}
                    className="w-full px-2 py-1 border border-border rounded text-sm bg-background"
                  >
                    <option value="Instagram">Instagram</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Twitter">Twitter</option>
                    <option value="YouTube">YouTube</option>
                    <option value="TikTok">TikTok</option>
                  </select>
                ) : (
                  <span className="text-sm font-medium">{social.platform}</span>
                )}
              </div>
              
              <div className="flex-1">
                {isEditing ? (
                  <input
                    type="url"
                    value={social.url}
                    onChange={(e) => {
                      const newSocialMedia = [...editedProfile.socialMedia];
                      newSocialMedia[index].url = e.target.value;
                      setEditedProfile(prev => ({ ...prev, socialMedia: newSocialMedia }));
                    }}
                    placeholder="https://..."
                    className="w-full px-3 py-1 border border-border rounded text-sm bg-background"
                  />
                ) : (
                  <a href={social.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
                    {social.url}
                  </a>
                )}
              </div>
              
              {social.followers && (
                <div className="text-sm text-muted-foreground">
                  {social.followers.toLocaleString()} followers
                </div>
              )}
              
              {isEditing && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeSocialMedia(index)}
                  className="p-1 h-8 w-8"
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderOperatingHours = () => (
    <div className="space-y-6">
      <div>
        <h4 className="font-medium text-foreground mb-4">Operating Hours</h4>
        <div className="space-y-3">
          {(isEditing ? editedProfile.operatingHours : profile.operatingHours).map((hours, index) => (
            <div key={hours.day} className="flex items-center space-x-4">
              <div className="w-20">
                <span className="text-sm font-medium">{hours.day}</span>
              </div>
              
              {isEditing ? (
                <>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={hours.isOpen}
                      onChange={(e) => {
                        const newHours = [...editedProfile.operatingHours];
                        newHours[index].isOpen = e.target.checked;
                        setEditedProfile(prev => ({ ...prev, operatingHours: newHours }));
                      }}
                      className="rounded border-border"
                    />
                    <span className="text-sm">Open</span>
                  </label>
                  
                  {hours.isOpen && (
                    <>
                      <input
                        type="time"
                        value={hours.openTime}
                        onChange={(e) => {
                          const newHours = [...editedProfile.operatingHours];
                          newHours[index].openTime = e.target.value;
                          setEditedProfile(prev => ({ ...prev, operatingHours: newHours }));
                        }}
                        className="px-2 py-1 border border-border rounded text-sm bg-background"
                      />
                      <span className="text-sm text-muted-foreground">to</span>
                      <input
                        type="time"
                        value={hours.closeTime}
                        onChange={(e) => {
                          const newHours = [...editedProfile.operatingHours];
                          newHours[index].closeTime = e.target.value;
                          setEditedProfile(prev => ({ ...prev, operatingHours: newHours }));
                        }}
                        className="px-2 py-1 border border-border rounded text-sm bg-background"
                      />
                    </>
                  )}
                </>
              ) : (
                <div className="flex items-center space-x-2">
                  {hours.isOpen ? (
                    <>
                      <span className="text-sm text-green-600 font-medium">Open</span>
                      <span className="text-sm text-muted-foreground">
                        {hours.openTime} - {hours.closeTime}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-red-600 font-medium">Closed</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Capacity Information */}
      <div>
        <h4 className="font-medium text-foreground mb-4">Capacity & Staff</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Seating Capacity</label>
            {isEditing ? (
              <input
                type="number"
                value={editedProfile.capacity.seatingCapacity}
                onChange={(e) => setEditedProfile(prev => ({
                  ...prev,
                  capacity: { ...prev.capacity, seatingCapacity: parseInt(e.target.value) }
                }))}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            ) : (
              <p className="text-foreground">{profile.capacity.seatingCapacity} seats</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Staff Count</label>
            {isEditing ? (
              <input
                type="number"
                value={editedProfile.capacity.staffCount}
                onChange={(e) => setEditedProfile(prev => ({
                  ...prev,
                  capacity: { ...prev.capacity, staffCount: parseInt(e.target.value) }
                }))}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            ) : (
              <p className="text-foreground">{profile.capacity.staffCount} employees</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Kitchen Size</label>
            {isEditing ? (
              <input
                type="text"
                value={editedProfile.capacity.kitchenSize}
                onChange={(e) => setEditedProfile(prev => ({
                  ...prev,
                  capacity: { ...prev.capacity, kitchenSize: e.target.value }
                }))}
                placeholder="e.g., 500 sq ft"
                className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            ) : (
              <p className="text-foreground">{profile.capacity.kitchenSize}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Private Rooms</label>
            {isEditing ? (
              <input
                type="number"
                value={editedProfile.capacity.privateRooms || 0}
                onChange={(e) => setEditedProfile(prev => ({
                  ...prev,
                  capacity: { ...prev.capacity, privateRooms: parseInt(e.target.value) }
                }))}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            ) : (
              <p className="text-foreground">{profile.capacity.privateRooms || 0} rooms</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden">
              {profile.images.logo ? (
                <img src={profile.images.logo} alt="Restaurant logo" className="w-full h-full object-cover" />
              ) : (
                <Building2 className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            {isEditing && (
              <button className="absolute -bottom-2 -right-2 p-1 bg-primary text-primary-foreground rounded-full">
                <Camera className="h-3 w-3" />
              </button>
            )}
          </div>
          
          <div>
            <h1 className="text-2xl font-bold text-foreground">{profile.basicInfo.name}</h1>
            {profile.basicInfo.tagline && (
              <p className="text-muted-foreground">{profile.basicInfo.tagline}</p>
            )}
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                <span className="text-sm font-medium">{profile.stats.rating}</span>
                <span className="text-sm text-muted-foreground">({profile.stats.reviewCount} reviews)</span>
              </div>
              {profile.verification.isVerified && (
                <Badge className="bg-green-100 text-green-800">
                  <Shield className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
          </div>
        </div>

        {isOwner && (
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{profile.stats.rating}</p>
            <p className="text-xs text-muted-foreground">Rating</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{profile.stats.reviewCount}</p>
            <p className="text-xs text-muted-foreground">Reviews</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{profile.stats.orderCount}</p>
            <p className="text-xs text-muted-foreground">Orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-foreground">{formatDate(profile.stats.joinedDate)}</p>
            <p className="text-xs text-muted-foreground">Member Since</p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation */}
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center space-x-1 overflow-x-auto scrollbar-thin">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    'flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                    activeSection === section.id
                      ? 'border-primary text-primary bg-primary/5'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{section.label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      <Card>
        <CardContent className="p-6">
          {activeSection === 'basic' && renderBasicInfo()}
          {activeSection === 'contact' && renderContactInfo()}
          {activeSection === 'operations' && renderOperatingHours()}
          {/* Add other sections as needed */}
        </CardContent>
      </Card>
    </div>
  );
}
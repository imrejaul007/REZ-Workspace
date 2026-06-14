'use client';

import React, { useState } from 'react';
import { 
  BuildingStorefrontIcon,
  PhotoIcon,
  DocumentTextIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
  UserIcon,
  CameraIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  XMarkIcon,
  PencilIcon,
  EyeIcon,
  ShieldCheckIcon,
  ClipboardDocumentListIcon,
  UsersIcon
} from '@heroicons/react/24/outline';

interface RestaurantProfile {
  id: string;
  businessName: string;
  category: 'fine_dining' | 'cafe' | 'qsr' | 'cloud_kitchen' | 'casual_dining' | 'bar';
  subcategory: string;
  revenueRange: string;
  description: string;
  location: {
    address: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
    coordinates?: { lat: number; lng: number };
  };
  branches: {
    id: string;
    name: string;
    address: string;
    phone: string;
    isMain: boolean;
  }[];
  contact: {
    phone: string;
    email: string;
    website?: string;
    whatsapp?: string;
  };
  owner: {
    name: string;
    phone: string;
    email: string;
    photo?: string;
    experience: string;
    education: string;
  };
  documents: {
    gst: { uploaded: boolean; verified: boolean; number?: string; file?: string };
    fssai: { uploaded: boolean; verified: boolean; number?: string; file?: string };
    businessLicense: { uploaded: boolean; verified: boolean; number?: string; file?: string };
    panCard: { uploaded: boolean; verified: boolean; number?: string; file?: string };
    bankDetails: { uploaded: boolean; verified: boolean; accountNumber?: string; file?: string };
    insuranceCertificate: { uploaded: boolean; verified: boolean; file?: string };
  };
  media: {
    logo?: string;
    coverPhoto?: string;
    restaurantPhotos: string[];
    dishPhotos: string[];
    interiorPhotos: string[];
  };
  staff: {
    totalEmployees: number;
    openPositions: number;
    departments: { name: string; count: number }[];
  };
  verification: {
    isVerified: boolean;
    verifiedAt?: string;
    verificationLevel: 'basic' | 'standard' | 'premium';
    trustScore: number;
    badges: string[];
  };
  subscription: {
    plan: 'basic' | 'premium' | 'enterprise';
    status: 'active' | 'expired' | 'cancelled';
    expiresAt: string;
  };
}

const RestaurantProfilePage = () => {
  const [activeTab, setActiveTab] = useState<'basic' | 'location' | 'documents' | 'media' | 'staff'>('basic');
  const [isEditing, setIsEditing] = useState(false);
  
  const [profile] = useState<RestaurantProfile>({
    id: '1',
    businessName: 'Spice Garden Restaurant',
    category: 'fine_dining',
    subcategory: 'Indian Multi-Cuisine',
    revenueRange: '₹10L - ₹50L annually',
    description: 'Premium Indian restaurant specializing in authentic North and South Indian cuisines with modern presentation.',
    location: {
      address: '123, MG Road, Brigade Gateway',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560025',
      landmark: 'Near Metro Station',
      coordinates: { lat: 12.9716, lng: 77.5946 }
    },
    branches: [
      { id: '1', name: 'MG Road (Main)', address: '123, MG Road, Bangalore', phone: '+91-9876543210', isMain: true },
      { id: '2', name: 'Whitefield Branch', address: '456, Whitefield, Bangalore', phone: '+91-9876543211', isMain: false }
    ],
    contact: {
      phone: '+91-9876543210',
      email: 'contact@spicegarden.com',
      website: 'https://spicegarden.com',
      whatsapp: '+91-9876543210'
    },
    owner: {
      name: 'Rajesh Kumar',
      phone: '+91-9876543210',
      email: 'rajesh@spicegarden.com',
      photo: '/api/placeholder/100/100',
      experience: '15 years in restaurant industry',
      education: 'Hotel Management Graduate'
    },
    documents: {
      gst: { uploaded: true, verified: true, number: 'GST123456789', file: 'gst-certificate.pdf' },
      fssai: { uploaded: true, verified: true, number: 'FSSAI987654321', file: 'fssai-license.pdf' },
      businessLicense: { uploaded: true, verified: false, number: 'BL456789123', file: 'business-license.pdf' },
      panCard: { uploaded: true, verified: true, number: 'ABCDE1234F', file: 'pan-card.pdf' },
      bankDetails: { uploaded: true, verified: true, accountNumber: '****1234', file: 'bank-details.pdf' },
      insuranceCertificate: { uploaded: false, verified: false, file: undefined }
    },
    media: {
      logo: '/api/placeholder/150/150',
      coverPhoto: '/api/placeholder/800/300',
      restaurantPhotos: ['/api/placeholder/300/200', '/api/placeholder/300/200'],
      dishPhotos: ['/api/placeholder/300/200', '/api/placeholder/300/200', '/api/placeholder/300/200'],
      interiorPhotos: ['/api/placeholder/300/200', '/api/placeholder/300/200']
    },
    staff: {
      totalEmployees: 25,
      openPositions: 3,
      departments: [
        { name: 'Kitchen Staff', count: 12 },
        { name: 'Service Staff', count: 8 },
        { name: 'Management', count: 3 },
        { name: 'Cleaning Staff', count: 2 }
      ]
    },
    verification: {
      isVerified: true,
      verifiedAt: '2024-01-15',
      verificationLevel: 'standard',
      trustScore: 85,
      badges: ['Verified Restaurant', 'Tax Compliant', 'Quality Assured']
    },
    subscription: {
      plan: 'premium',
      status: 'active',
      expiresAt: '2024-12-31'
    }
  });

  const categoryOptions = [
    { value: 'fine_dining', label: 'Fine Dining' },
    { value: 'casual_dining', label: 'Casual Dining' },
    { value: 'cafe', label: 'Café' },
    { value: 'qsr', label: 'Quick Service Restaurant (QSR)' },
    { value: 'cloud_kitchen', label: 'Cloud Kitchen' },
    { value: 'bar', label: 'Bar & Lounge' }
  ];

  const getVerificationIcon = (uploaded: boolean, verified: boolean) => {
    if (!uploaded) return <ExclamationTriangleIcon className="w-5 h-5 text-gray-400" />;
    if (verified) return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
    return <ClockIcon className="w-5 h-5 text-yellow-500" />;
  };

  const getVerificationStatus = (uploaded: boolean, verified: boolean) => {
    if (!uploaded) return { text: 'Not Uploaded', color: 'text-gray-500' };
    if (verified) return { text: 'Verified', color: 'text-green-600' };
    return { text: 'Pending Verification', color: 'text-yellow-600' };
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleFileUpload = (documentType: string) => {
    logger.info('Uploading file for:', documentType);
  };

  const handlePhotoUpload = (photoType: string) => {
    logger.info('Uploading photo for:', photoType);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <img 
              src={profile.media.logo || '/api/placeholder/80/80'} 
              alt="Restaurant Logo"
              className="w-20 h-20 rounded-lg object-cover border border-gray-200"
            />
            {profile.verification.isVerified && (
              <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
                <CheckCircleIcon className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{profile.businessName}</h1>
            <p className="text-gray-600">{profile.subcategory}</p>
            <div className="flex items-center space-x-4 mt-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                profile.verification.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {profile.verification.isVerified ? '✓ Verified' : 'Pending Verification'}
              </span>
              <span className="text-sm text-gray-600">
                Trust Score: <span className={`font-semibold ${getTrustScoreColor(profile.verification.trustScore)}`}>
                  {profile.verification.trustScore}%
                </span>
              </span>
            </div>
          </div>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
              isEditing ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            {isEditing ? <CheckCircleIcon className="w-4 h-4" /> : <PencilIcon className="w-4 h-4" />}
            <span>{isEditing ? 'Save Changes' : 'Edit Profile'}</span>
          </button>
          <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
            <EyeIcon className="w-4 h-4" />
            <span>Preview</span>
          </button>
        </div>
      </div>

      {/* Verification Badges */}
      {profile.verification.badges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {profile.verification.badges.map((badge, index) => (
            <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full flex items-center space-x-1">
              <ShieldCheckIcon className="w-4 h-4" />
              <span>{badge}</span>
            </span>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'basic', label: 'Basic Info', icon: BuildingStorefrontIcon },
            { key: 'location', label: 'Location & Branches', icon: MapPinIcon },
            { key: 'documents', label: 'Documents', icon: DocumentTextIcon },
            { key: 'media', label: 'Photos & Media', icon: PhotoIcon },
            { key: 'staff', label: 'Staff Information', icon: UsersIcon }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {activeTab === 'basic' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                <input
                  type="text"
                  value={profile.businessName}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={profile.category}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                >
                  {categoryOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory</label>
                <input
                  type="text"
                  value={profile.subcategory}
                  disabled={!isEditing}
                  placeholder="e.g., Indian Multi-Cuisine, Italian Fine Dining"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Annual Revenue Range</label>
                <select
                  value={profile.revenueRange}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                >
                  <option value="₹0 - ₹10L annually">₹0 - ₹10L annually</option>
                  <option value="₹10L - ₹50L annually">₹10L - ₹50L annually</option>
                  <option value="₹50L - ₹1Cr annually">₹50L - ₹1Cr annually</option>
                  <option value="₹1Cr - ₹5Cr annually">₹1Cr - ₹5Cr annually</option>
                  <option value="₹5Cr+ annually">₹5Cr+ annually</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={profile.description}
                disabled={!isEditing}
                rows={3}
                placeholder="Describe your restaurant's concept, specialty, and unique features"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
              />
            </div>

            {/* Contact Information */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={profile.contact.phone}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={profile.contact.email}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website (Optional)</label>
                  <input
                    type="url"
                    value={profile.contact.website || ''}
                    disabled={!isEditing}
                    placeholder="https://yourrestaurant.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp (Optional)</label>
                  <input
                    type="tel"
                    value={profile.contact.whatsapp || ''}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>
              </div>
            </div>

            {/* Owner Information */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Owner Information</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Owner Name</label>
                  <input
                    type="text"
                    value={profile.owner.name}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Owner Phone</label>
                  <input
                    type="tel"
                    value={profile.owner.phone}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Owner Email</label>
                  <input
                    type="email"
                    value={profile.owner.email}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Experience</label>
                  <input
                    type="text"
                    value={profile.owner.experience}
                    disabled={!isEditing}
                    placeholder="e.g., 10 years in restaurant industry"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'location' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Main Location</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Address</label>
                  <textarea
                    value={profile.location.address}
                    disabled={!isEditing}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    value={profile.location.city}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  <input
                    type="text"
                    value={profile.location.state}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
                  <input
                    type="text"
                    value={profile.location.pincode}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Landmark (Optional)</label>
                  <input
                    type="text"
                    value={profile.location.landmark || ''}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>
              </div>
            </div>

            {/* Branches */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Branches</h3>
                {isEditing && (
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg flex items-center space-x-1 text-sm">
                    <PlusIcon className="w-4 h-4" />
                    <span>Add Branch</span>
                  </button>
                )}
              </div>
              <div className="space-y-4">
                {profile.branches.map((branch) => (
                  <div key={branch.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900">{branch.name}</h4>
                        {branch.isMain && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Main Branch</span>
                        )}
                      </div>
                      {isEditing && (
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-700 p-1">
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          {!branch.isMain && (
                            <button className="text-red-600 hover:text-red-700 p-1">
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Address</label>
                        <p className="text-sm text-gray-900">{branch.address}</p>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Phone</label>
                        <p className="text-sm text-gray-900">{branch.phone}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Object.entries(profile.documents).map(([key, doc]) => {
                const docNames = {
                  gst: 'GST Certificate',
                  fssai: 'FSSAI License',
                  businessLicense: 'Business License',
                  panCard: 'PAN Card',
                  bankDetails: 'Bank Details',
                  insuranceCertificate: 'Insurance Certificate'
                };
                
                const status = getVerificationStatus(doc.uploaded, doc.verified);
                
                return (
                  <div key={key} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">{docNames[key as keyof typeof docNames]}</h4>
                      <div className="flex items-center space-x-2">
                        {getVerificationIcon(doc.uploaded, doc.verified)}
                        <span className={`text-sm ${status.color}`}>{status.text}</span>
                      </div>
                    </div>
                    
                    {doc.number && (
                      <p className="text-sm text-gray-600 mb-2">Number: {doc.number}</p>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      {doc.uploaded ? (
                        <>
                          <span className="text-sm text-gray-600">✓ Uploaded: {doc.file}</span>
                          {isEditing && (
                            <button className="text-blue-600 hover:text-blue-700 text-sm">
                              Replace
                            </button>
                          )}
                        </>
                      ) : (
                        isEditing && (
                          <button 
                            onClick={() => handleFileUpload(key)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                          >
                            Upload File
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'media' && (
          <div className="space-y-6">
            {/* Logo and Cover Photo */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Restaurant Logo</h4>
                <div className="flex items-center space-x-4">
                  <img 
                    src={profile.media.logo || '/api/placeholder/100/100'} 
                    alt="Restaurant Logo"
                    className="w-20 h-20 rounded-lg object-cover border border-gray-200"
                  />
                  {isEditing && (
                    <button 
                      onClick={() => handlePhotoUpload('logo')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                    >
                      <CameraIcon className="w-4 h-4" />
                      <span>Change Logo</span>
                    </button>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Cover Photo</h4>
                <div>
                  <img 
                    src={profile.media.coverPhoto || '/api/placeholder/300/150'} 
                    alt="Cover Photo"
                    className="w-full h-32 rounded-lg object-cover border border-gray-200 mb-2"
                  />
                  {isEditing && (
                    <button 
                      onClick={() => handlePhotoUpload('cover')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                    >
                      <CameraIcon className="w-4 h-4" />
                      <span>Change Cover</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Photo Galleries */}
            {[
              { key: 'restaurantPhotos', title: 'Restaurant Photos', photos: profile.media.restaurantPhotos },
              { key: 'dishPhotos', title: 'Food & Dish Photos', photos: profile.media.dishPhotos },
              { key: 'interiorPhotos', title: 'Interior Photos', photos: profile.media.interiorPhotos }
            ].map((gallery) => (
              <div key={gallery.key}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{gallery.title}</h4>
                  {isEditing && (
                    <button 
                      onClick={() => handlePhotoUpload(gallery.key)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg flex items-center space-x-1 text-sm"
                    >
                      <PlusIcon className="w-4 h-4" />
                      <span>Add Photos</span>
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {gallery.photos.map((photo, index) => (
                    <div key={index} className="relative">
                      <img 
                        src={photo} 
                        alt={`${gallery.title} ${index + 1}`}
                        className="w-full h-32 rounded-lg object-cover border border-gray-200"
                      />
                      {isEditing && (
                        <button className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1 rounded">
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {gallery.photos.length === 0 && (
                    <div className="col-span-2 md:col-span-4 text-center py-8 text-gray-500">
                      No photos uploaded yet
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'staff' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <UsersIcon className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold text-blue-900">{profile.staff.totalEmployees}</p>
                    <p className="text-sm text-blue-700">Total Employees</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <BriefcaseIcon className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-green-900">{profile.staff.openPositions}</p>
                    <p className="text-sm text-green-700">Open Positions</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <ClipboardDocumentListIcon className="w-8 h-8 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold text-purple-900">{profile.staff.departments.length}</p>
                    <p className="text-sm text-purple-700">Departments</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-4">Department Breakdown</h4>
              <div className="space-y-3">
                {profile.staff.departments.map((dept, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-900">{dept.name}</span>
                    <span className="font-medium text-gray-900">{dept.count} employees</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">Staff Management Actions</h4>
                <div className="flex space-x-2">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
                    Manage Staff
                  </button>
                  <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm">
                    Post New Job
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantProfilePage;
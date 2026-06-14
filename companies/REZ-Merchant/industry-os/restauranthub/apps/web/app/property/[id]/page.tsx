'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  Heart, 
  Share2, 
  Star, 
  MapPin,
  Phone,
  Mail,
  Calendar,
  Clock,
  Users,
  Car,
  Wifi,
  Utensils,
  Shield,
  Camera,
  Video,
  CheckCircle,
  Building2,
  Square,
  DollarSign,
  TrendingUp,
  Zap,
  Coffee,
  AirVent,
  Truck,
  ParkingCircle,
  Eye,
  MessageSquare,
  Download,
  FileText,
  AlertCircle,
  Info
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface PropertyDetails {
  id: string;
  title: string;
  description: string;
  type: 'lease' | 'sale' | 'rent';
  category: 'restaurant' | 'kitchen' | 'warehouse' | 'office';
  price: number;
  priceType: 'monthly' | 'yearly' | 'total';
  area: {
    total: number;
    built: number;
    unit: 'sqft' | 'sqm';
  };
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  images: string[];
  features: {
    bedrooms?: number;
    bathrooms?: number;
    kitchens: number;
    seatingCapacity?: number;
    parkingSpaces?: number;
    floors: number;
    age: number;
    furnished: boolean;
  };
  amenities: string[];
  utilities: {
    electricity: boolean;
    water: boolean;
    gas: boolean;
    internet: boolean;
    ac: boolean;
    heating: boolean;
  };
  licenses: {
    foodLicense: boolean;
    fireSafety: boolean;
    buildingApproval: boolean;
    environmentClearance: boolean;
  };
  nearby: {
    metro: string;
    bus: string;
    market: string;
    hospital: string;
  };
  owner: {
    id: string;
    name: string;
    phone: string;
    email: string;
    verified: boolean;
    responseTime: string;
    totalProperties: number;
    rating: number;
    reviews: number;
  };
  availability: {
    available: boolean;
    availableFrom: string;
    minimumLeasePeriod?: string;
    negotiable: boolean;
  };
  virtualTour?: {
    available: boolean;
    link?: string;
    videoUrl?: string;
  };
  documents: Array<{
    name: string;
    type: string;
    verified: boolean;
  }>;
  investmentHighlights?: {
    roi: string;
    footfall: string;
    businessPotential: string;
    growthProjection: string;
  };
}

export default function PropertyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [tourForm, setTourForm] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    time: '',
    tourType: 'physical',
    message: ''
  });

  // Mock property data - in real app this would come from API
  const property: PropertyDetails = {
    id: params.id as string,
    title: 'Prime Restaurant Space in Commercial Complex',
    description: 'Excellently located restaurant space in the heart of the business district. Perfect for fine dining, casual restaurants, or cloud kitchens. Fully equipped with commercial kitchen, dining area, and all necessary licenses.',
    type: 'lease',
    category: 'restaurant',
    price: 125000,
    priceType: 'monthly',
    area: {
      total: 2500,
      built: 2200,
      unit: 'sqft'
    },
    location: {
      address: '123 Business Complex, MG Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      pincode: '400001',
      coordinates: {
        lat: 19.0760,
        lng: 72.8777
      }
    },
    images: [
      '/api/placeholder/800/600',
      '/api/placeholder/800/600',
      '/api/placeholder/800/600',
      '/api/placeholder/800/600'
    ],
    features: {
      kitchens: 1,
      seatingCapacity: 80,
      parkingSpaces: 15,
      floors: 1,
      age: 3,
      furnished: true
    },
    amenities: [
      'Commercial Kitchen',
      'Dining Area',
      'Bar Counter',
      'Private Parking',
      'Loading Dock',
      'Storage Room',
      'Staff Rest Area',
      'CCTV Surveillance',
      'Fire Safety System',
      '24/7 Security'
    ],
    utilities: {
      electricity: true,
      water: true,
      gas: true,
      internet: true,
      ac: true,
      heating: false
    },
    licenses: {
      foodLicense: true,
      fireSafety: true,
      buildingApproval: true,
      environmentClearance: true
    },
    nearby: {
      metro: '500m - MG Road Metro',
      bus: '100m - MG Road Bus Stop',
      market: '200m - Commercial Market',
      hospital: '1km - City Hospital'
    },
    owner: {
      id: 'owner-1',
      name: 'Amit Patel',
      phone: '+91-9876543210',
      email: 'amit@properties.com',
      verified: true,
      responseTime: 'Within 1 hour',
      totalProperties: 12,
      rating: 4.7,
      reviews: 34
    },
    availability: {
      available: true,
      availableFrom: '2024-02-01',
      minimumLeasePeriod: '3 years',
      negotiable: true
    },
    virtualTour: {
      available: true,
      link: 'https://virtualtour.example.com',
      videoUrl: 'https://youtube.com/watch?v=example'
    },
    documents: [
      { name: 'Property Title Deed', type: 'Legal', verified: true },
      { name: 'Food License', type: 'License', verified: true },
      { name: 'Fire Safety Certificate', type: 'Safety', verified: true },
      { name: 'Building Plan', type: 'Technical', verified: true },
      { name: 'Tax Records', type: 'Financial', verified: true }
    ],
    investmentHighlights: {
      roi: '15-20% annually',
      footfall: '500+ daily',
      businessPotential: 'High demand area',
      growthProjection: '25% in 2 years'
    }
  };

  const handleTourBooking = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle tour booking
    alert(`🎉 Tour Booked Successfully!\n\nYour ${tourForm.tourType} tour has been scheduled for ${tourForm.date} at ${tourForm.time}.\n\nThe property owner will contact you shortly.`);
    setTourForm({
      name: '',
      email: '',
      phone: '',
      date: '',
      time: '',
      tourType: 'physical',
      message: ''
    });
  };

  const handleContactOwner = () => {
    router.push(`/property-owner/${property.owner.id}`);
  };

  const handleVirtualTour = () => {
    window.open(property.virtualTour?.link, '_blank');
  };

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const formatPrice = (price: number, type: string) => {
    return `₹${price.toLocaleString()}${type === 'monthly' ? '/month' : type === 'yearly' ? '/year' : ''}`;
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto p-6">
        {/* Breadcrumb & Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Link href="/marketplace">
              <Button variant="ghost">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Marketplace
              </Button>
            </Link>
            <span className="text-muted-foreground">/ Real Estate / {property.category}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" onClick={() => setIsWishlisted(!isWishlisted)}>
              <Heart className={`h-4 w-4 mr-2 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
              {isWishlisted ? 'Saved' : 'Save'}
            </Button>
            <Button variant="ghost">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="ghost">
              <Download className="h-4 w-4 mr-2" />
              Brochure
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Images */}
            <Card>
              <div className="aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 rounded-t-lg overflow-hidden">
                <div className="w-full h-full flex items-center justify-center">
                  <Building2 className="h-24 w-24 text-muted-foreground" />
                </div>
                
                {/* Image Overlay Controls */}
                <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center space-x-4">
                  <Button variant="secondary" onClick={handleVirtualTour}>
                    <Video className="h-4 w-4 mr-2" />
                    Virtual Tour
                  </Button>
                  <Button variant="secondary">
                    <Camera className="h-4 w-4 mr-2" />
                    View All ({property.images.length})
                  </Button>
                </div>
              </div>
              
              <div className="p-4">
                <div className="flex space-x-2 overflow-x-auto">
                  {property.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-16 rounded-lg bg-muted flex items-center justify-center border-2 ${
                        selectedImageIndex === index ? 'border-primary' : 'border-transparent'
                      }`}
                    >
                      <Building2 className="h-8 w-8 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Property Info */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center space-x-2 mb-3">
                      <Badge className="bg-blue-500 text-white capitalize">
                        For {property.type}
                      </Badge>
                      <Badge variant="secondary" className="capitalize">
                        {property.category}
                      </Badge>
                      {property.availability.negotiable && (
                        <Badge variant="outline" className="text-green-600 border-green-200">
                          Negotiable
                        </Badge>
                      )}
                    </div>
                    
                    <h1 className="text-3xl font-bold mb-3">{property.title}</h1>
                    <div className="flex items-center space-x-4 text-muted-foreground mb-4">
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>{property.location.address}, {property.location.city}</span>
                      </div>
                    </div>
                    
                    <div className="text-4xl font-bold text-primary mb-4">
                      {formatPrice(property.price, property.priceType)}
                      {property.priceType === 'monthly' && (
                        <span className="text-sm font-normal text-muted-foreground">
                          + maintenance
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Key Features */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <Square className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <div className="font-semibold">{property.area.total}</div>
                      <div className="text-sm text-muted-foreground">{property.area.unit}</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <div className="font-semibold">{property.features.seatingCapacity}</div>
                      <div className="text-sm text-muted-foreground">Capacity</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <Utensils className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <div className="font-semibold">{property.features.kitchens}</div>
                      <div className="text-sm text-muted-foreground">Kitchen</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <Car className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <div className="font-semibold">{property.features.parkingSpaces}</div>
                      <div className="text-sm text-muted-foreground">Parking</div>
                    </div>
                  </div>

                  <div>
                    <p className="text-muted-foreground leading-relaxed">
                      {property.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Card>
              <CardHeader>
                <div className="flex space-x-6">
                  {['overview', 'amenities', 'location', 'documents'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`text-sm font-medium capitalize pb-2 border-b-2 transition-colors ${
                        activeTab === tab
                          ? 'border-primary text-primary'
                          : 'border-transparent text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </CardHeader>
              
              <CardContent>
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Property Details */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Property Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
                          <span className="font-medium">Built-up Area</span>
                          <span>{property.area.built} {property.area.unit}</span>
                        </div>
                        <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
                          <span className="font-medium">Property Age</span>
                          <span>{property.features.age} years</span>
                        </div>
                        <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
                          <span className="font-medium">Floors</span>
                          <span>{property.features.floors}</span>
                        </div>
                        <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
                          <span className="font-medium">Furnished</span>
                          <span>{property.features.furnished ? 'Yes' : 'No'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Investment Highlights */}
                    {property.investmentHighlights && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-green-600" />
                          Investment Highlights
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 border border-green-200 rounded-lg bg-green-50/50">
                            <div className="font-semibold text-green-800 mb-1">ROI Potential</div>
                            <div className="text-green-700">{property.investmentHighlights.roi}</div>
                          </div>
                          <div className="p-4 border border-blue-200 rounded-lg bg-blue-50/50">
                            <div className="font-semibold text-blue-800 mb-1">Daily Footfall</div>
                            <div className="text-blue-700">{property.investmentHighlights.footfall}</div>
                          </div>
                          <div className="p-4 border border-purple-200 rounded-lg bg-purple-50/50">
                            <div className="font-semibold text-purple-800 mb-1">Business Potential</div>
                            <div className="text-purple-700">{property.investmentHighlights.businessPotential}</div>
                          </div>
                          <div className="p-4 border border-orange-200 rounded-lg bg-orange-50/50">
                            <div className="font-semibold text-orange-800 mb-1">Growth Projection</div>
                            <div className="text-orange-700">{property.investmentHighlights.growthProjection}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Utilities */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Utilities Available</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {Object.entries(property.utilities).map(([utility, available]) => (
                          <div key={utility} className="flex items-center space-x-2">
                            {available ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className={`capitalize ${available ? '' : 'text-muted-foreground'}`}>
                              {utility}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Licenses */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Licenses & Approvals</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(property.licenses).map(([license, available]) => (
                          <div key={license} className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
                            {available ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className={`capitalize ${available ? '' : 'text-muted-foreground'}`}>
                              {license.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'amenities' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold">Available Amenities</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {property.amenities.map((amenity, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'location' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Address</h3>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="font-medium">{property.location.address}</p>
                        <p className="text-muted-foreground">
                          {property.location.city}, {property.location.state} - {property.location.pincode}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4">Nearby Landmarks</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(property.nearby).map(([type, detail]) => (
                          <div key={type} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                            <MapPin className="h-4 w-4 text-primary" />
                            <div>
                              <div className="font-medium capitalize">{type}</div>
                              <div className="text-sm text-muted-foreground">{detail}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <MapPin className="h-8 w-8 mx-auto mb-2" />
                        <p>Interactive Map View</p>
                        <p className="text-sm">Map will be integrated here</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'documents' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold">Property Documents</h3>
                    <div className="space-y-3">
                      {property.documents.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-5 w-5 text-primary" />
                            <div>
                              <div className="font-medium">{doc.name}</div>
                              <div className="text-sm text-muted-foreground">{doc.type}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {doc.verified && (
                              <Badge className="bg-green-500 text-white">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                            <Button variant="outline">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Owner Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Property Owner
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold">{property.owner.name}</div>
                      <div className="flex items-center space-x-1 text-sm">
                        {renderStarRating(property.owner.rating)}
                        <span>({property.owner.reviews})</span>
                      </div>
                    </div>
                    {property.owner.verified && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div>{property.owner.totalProperties} properties listed</div>
                    <div>Responds {property.owner.responseTime}</div>
                  </div>
                  
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      <Phone className="h-4 w-4 mr-2" />
                      {property.owner.phone}
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Mail className="h-4 w-4 mr-2" />
                      Email Owner
                    </Button>
                    <Button onClick={handleContactOwner} className="w-full">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      View Profile
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Book Tour */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Schedule a Tour
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTourBooking} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Your Name</Label>
                    <Input
                      id="name"
                      value={tourForm.name}
                      onChange={(e) => setTourForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={tourForm.email}
                      onChange={(e) => setTourForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={tourForm.phone}
                      onChange={(e) => setTourForm(prev => ({ ...prev, phone: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={tourForm.date}
                        onChange={(e) => setTourForm(prev => ({ ...prev, date: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="time">Time</Label>
                      <Input
                        id="time"
                        type="time"
                        value={tourForm.time}
                        onChange={(e) => setTourForm(prev => ({ ...prev, time: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="tourType">Tour Type</Label>
                    <select
                      id="tourType"
                      value={tourForm.tourType}
                      onChange={(e) => setTourForm(prev => ({ ...prev, tourType: e.target.value as unknown }))}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background"
                    >
                      <option value="physical">Physical Tour</option>
                      <option value="virtual">Virtual Tour</option>
                      <option value="video">Video Call Tour</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="message">Message (Optional)</Label>
                    <Textarea
                      id="message"
                      value={tourForm.message}
                      onChange={(e) => setTourForm(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Any specific requirements or questions..."
                      rows={3}
                    />
                  </div>
                  
                  <Button type="submit" className="w-full bg-gradient-to-r from-primary to-blue-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    Book Tour
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {property.virtualTour?.available && (
                    <Button onClick={handleVirtualTour} variant="outline" className="w-full">
                      <Video className="h-4 w-4 mr-2" />
                      Virtual Tour
                    </Button>
                  )}
                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Download Brochure
                  </Button>
                  <Button variant="outline" className="w-full">
                    <DollarSign className="h-4 w-4 mr-2" />
                    EMI Calculator
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Availability */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Availability
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge className={property.availability.available ? "bg-green-500" : "bg-red-500"}>
                      {property.availability.available ? 'Available' : 'Not Available'}
                    </Badge>
                  </div>
                  {property.availability.availableFrom && (
                    <div className="flex justify-between">
                      <span>Available From:</span>
                      <span className="font-medium">{property.availability.availableFrom}</span>
                    </div>
                  )}
                  {property.availability.minimumLeasePeriod && (
                    <div className="flex justify-between">
                      <span>Min. Period:</span>
                      <span className="font-medium">{property.availability.minimumLeasePeriod}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
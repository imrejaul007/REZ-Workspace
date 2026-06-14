'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import toast from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Star,
  MapPin,
  Phone,
  Mail,
  MessageSquare,
  Users,
  Award,
  TrendingUp,
  Clock,
  CheckCircle,
  Calendar,
  Package,
  Globe,
  Building2,
  Shield,
  Send,
  Heart,
  Search,
  AlertCircle,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api/client';

// Shape returned by GET /marketplace/suppliers/:id
interface MarketplaceSupplier {
  id: string;
  name: string;
  category: string;
  cities: string[];
  rating?: number;
  verified: boolean;
  rezVerified: boolean;
  productCount: number;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
}

export default function VendorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const vendorId = params.id as string;

  const [vendor, setVendor] = useState<MarketplaceSupplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    orderType: 'bulk',
  });

  useEffect(() => {
    if (!vendorId) return;
    loadVendor();
  }, [vendorId]);

  const loadVendor = async () => {
    try {
      setLoading(true);
      setNotFound(false);
      const res = await apiClient.get<unknown>(`/marketplace/suppliers/${vendorId}`);
      const data = res?.data ?? res;
      if (!data || !data.id) {
        setNotFound(true);
        return;
      }
      setVendor(data as MarketplaceSupplier);
    } catch (error) {
      if (error?.response?.status === 404) {
        setNotFound(true);
      } else {
        console.error('Failed to load vendor:', error);
        setNotFound(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading('Sending message...');
    try {
      await apiClient.post('/marketplace/rfq', {
        supplierId: vendorId,
        category: vendor?.category ?? '',
        quantity: 1,
        city: vendor?.cities?.[0] ?? '',
        notes: `[${contactForm.orderType}] ${contactForm.subject}: ${contactForm.message}`,
      });
      toast.dismiss(loadingToast);
      toast.success('Message sent successfully!', 'The vendor will contact you soon.');
      setContactForm({ name: '', email: '', phone: '', subject: '', message: '', orderType: 'bulk' });
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Failed to send message', 'Please try again later.');
    }
  };

  const renderStarRating = (rating: number) => (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading vendor...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (notFound || !vendor) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto p-6">
          <div className="mb-6">
            <Link href="/marketplace">
              <Button variant="ghost" size="default">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Marketplace
              </Button>
            </Link>
          </div>
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Vendor not found</h2>
            <p className="text-muted-foreground mb-6">
              The vendor you are looking for does not exist or may have been removed.
            </p>
            <Link href="/marketplace">
              <Button>Browse Marketplace</Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Derive display values from the API response
  const displayRating = vendor.rating ?? 0;
  const displayCities = vendor.cities.join(', ');

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto p-6">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/marketplace">
            <Button variant="ghost" size="default">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Marketplace
            </Button>
          </Link>
        </div>

        {/* Vendor Header */}
        <Card className="mb-8">
          <div className="relative h-48 bg-gradient-to-r from-primary/10 via-blue-500/10 to-purple-500/10 rounded-t-lg">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent" />
          </div>

          <CardContent className="relative px-6 pb-6">
            <div className="flex flex-col md:flex-row gap-6 -mt-16">
              <div className="flex-shrink-0">
                <div className="w-32 h-32 bg-white border-4 border-white rounded-full shadow-lg flex items-center justify-center">
                  <Building2 className="h-16 w-16 text-primary" />
                </div>
              </div>

              <div className="flex-1 pt-16 md:pt-4">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h1 className="text-3xl font-bold">{vendor.name}</h1>
                      {(vendor.verified || vendor.rezVerified) && (
                        <Badge className="bg-green-500 text-white">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-lg text-muted-foreground mb-2">{vendor.category}</p>
                    {displayRating > 0 && (
                      <div className="flex items-center space-x-2 mb-4">
                        {renderStarRating(displayRating)}
                        <span className="font-medium">{displayRating.toFixed(1)}</span>
                      </div>
                    )}
                    {displayCities && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{displayCities}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-primary to-blue-600"
                      onClick={() => setActiveTab('contact')}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Contact Now
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold">{vendor.productCount}</div>
                <div className="text-sm text-muted-foreground">Products</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <MapPin className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{vendor.cities.length}</div>
                <div className="text-sm text-muted-foreground">Cities Served</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">
                  {vendor.rezVerified ? 'REZ' : vendor.verified ? 'Yes' : 'No'}
                </div>
                <div className="text-sm text-muted-foreground">Verified Status</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Card>
          <CardHeader>
            <div className="flex space-x-6">
              {['overview', 'products', 'contact'].map((tab) => (
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
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Business Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Category:</span>
                        <span className="font-medium">{vendor.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">REZ Verified:</span>
                        <span className="font-medium">{vendor.rezVerified ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Product Count:</span>
                        <span className="font-medium">{vendor.productCount}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Location & Contact
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {vendor.address && (
                        <div>
                          <span className="text-muted-foreground text-sm">Address:</span>
                          <p className="font-medium">{vendor.address}</p>
                        </div>
                      )}
                      {displayCities && (
                        <div>
                          <span className="text-muted-foreground text-sm">Cities:</span>
                          <p className="font-medium">{displayCities}</p>
                        </div>
                      )}
                      {vendor.contactPhone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{vendor.contactPhone}</span>
                        </div>
                      )}
                      {vendor.contactEmail && (
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{vendor.contactEmail}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Delivery Areas */}
                {vendor.cities.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Delivery Areas
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {vendor.cities.map((city, index) => (
                        <Badge key={index} variant="secondary">
                          {city}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'products' && (
              <div className="space-y-6">
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Package className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No products listed</h3>
                  <p className="text-muted-foreground">
                    This vendor has not listed unknown products yet. Contact them directly for a quote.
                  </p>
                  <Button
                    className="mt-4"
                    variant="outline"
                    onClick={() => setActiveTab('contact')}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Request Quote
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'contact' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Contact / RFQ Form */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Send Message</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleContactSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="name">Name</Label>
                            <Input
                              id="name"
                              value={contactForm.name}
                              onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="email">Email</Label>
                            <Input
                              id="email"
                              type="email"
                              value={contactForm.email}
                              onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                              id="phone"
                              value={contactForm.phone}
                              onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="orderType">Order Type</Label>
                            <select
                              id="orderType"
                              value={contactForm.orderType}
                              onChange={(e) => setContactForm({ ...contactForm, orderType: e.target.value })}
                              className="w-full px-3 py-2 border border-border rounded-md bg-background"
                            >
                              <option value="bulk">Bulk Order</option>
                              <option value="regular">Regular Order</option>
                              <option value="custom">Custom Requirements</option>
                              <option value="partnership">Business Partnership</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="subject">Subject</Label>
                          <Input
                            id="subject"
                            value={contactForm.subject}
                            onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="message">Message</Label>
                          <Textarea
                            id="message"
                            value={contactForm.message}
                            onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                            rows={4}
                            required
                          />
                        </div>

                        <Button type="submit" className="w-full">
                          <Send className="h-4 w-4 mr-2" />
                          Send Message
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  {/* Quick Contact */}
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Quick Contact</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {vendor.contactPhone && (
                          <Button variant="outline" className="w-full justify-start">
                            <Phone className="h-4 w-4 mr-2" />
                            {vendor.contactPhone}
                          </Button>
                        )}
                        {vendor.contactEmail && (
                          <Button variant="outline" className="w-full justify-start">
                            <Mail className="h-4 w-4 mr-2" />
                            {vendor.contactEmail}
                          </Button>
                        )}
                        {!vendor.contactPhone && !vendor.contactEmail && (
                          <p className="text-sm text-muted-foreground">
                            No direct contact details available. Use the form to reach this vendor.
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    {displayCities && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Service Areas</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {vendor.cities.map((city, idx) => (
                              <Badge key={idx} variant="outline">
                                {city}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

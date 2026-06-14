'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Heart,
  Share2,
  ShoppingCart,
  Star,
  MapPin,
  Shield,
  Truck,
  MessageCircle,
  Package,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useRouter, useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

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

export default function ProductPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();

  const [supplier, setSupplier] = useState<MarketplaceSupplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    const supplierId = params.id as string;
    if (!supplierId) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const fetchSupplier = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<MarketplaceSupplier>(
          `/marketplace/suppliers/${encodeURIComponent(supplierId)}`,
        );
        setSupplier(data);
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        if (errMsg.includes('404') || errMsg.includes('not found')) {
          setNotFound(true);
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load supplier');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSupplier();
  }, [params.id]);

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    toast({
      title: isWishlisted ? 'Removed from wishlist' : 'Added to wishlist',
      description: supplier
        ? `${supplier.name} ${isWishlisted ? 'removed from' : 'added to'} your wishlist.`
        : '',
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: supplier?.name ?? 'Supplier',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Link copied!', description: 'Supplier link copied to clipboard.' });
    }
  };

  const handleRequestQuote = () => {
    if (!supplier) return;
    router.push(`/marketplace?supplierId=${encodeURIComponent(supplier.id)}`);
  };

  // Loading state
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // Not found state
  if (notFound) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <Button variant="ghost" onClick={() => router.push('/marketplace')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Marketplace
          </Button>
          <Card className="p-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-muted rounded-full">
                <Package className="h-10 w-10 text-muted-foreground" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2">Supplier not found</h3>
            <p className="text-muted-foreground mb-6">
              The supplier you are looking for does not exist or has been removed.
            </p>
            <Button onClick={() => router.push('/marketplace')}>Back to Marketplace</Button>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error || !supplier) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <Button variant="ghost" onClick={() => router.push('/marketplace')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Marketplace
          </Button>
          <Card className="p-12 text-center">
            <h3 className="text-lg font-semibold text-destructive mb-2">Failed to load supplier</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="text-sm text-muted-foreground">
            <span
              className="cursor-pointer hover:text-foreground"
              onClick={() => router.push('/marketplace')}
            >
              Marketplace
            </span>
            <span className="mx-2">›</span>
            <span
              className="cursor-pointer hover:text-foreground"
              onClick={() => router.push(`/marketplace/categories`)}
            >
              {supplier.category}
            </span>
            <span className="mx-2">›</span>
            <span>{supplier.name}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Supplier Info Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 space-y-6"
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="text-xl font-bold">
                        {supplier.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h1 className="text-2xl font-bold">{supplier.name}</h1>
                        {supplier.verified && (
                          <Shield className="h-5 w-5 text-blue-500" title="Verified supplier" />
                        )}
                        {supplier.rezVerified && (
                          <Badge variant="secondary" className="text-xs">REZ Verified</Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground">{supplier.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" onClick={handleWishlist}>
                      <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                    </Button>
                    <Button variant="ghost" onClick={handleShare}>
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                {supplier.rating != null && (
                  <div className="flex items-center space-x-2 mb-4">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{supplier.rating.toFixed(1)}</span>
                    <span className="text-muted-foreground text-sm">rating</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  {supplier.cities.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{supplier.cities.join(', ')}</span>
                    </div>
                  )}
                  {supplier.address && (
                    <div className="flex items-center space-x-2">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <span>{supplier.address}</span>
                    </div>
                  )}
                  {supplier.productCount > 0 && (
                    <div className="flex items-center space-x-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span>{supplier.productCount} products available</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            {(supplier.contactEmail || supplier.contactPhone) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageCircle className="h-5 w-5" />
                    <span>Contact</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {supplier.contactEmail && (
                    <div className="flex items-center space-x-2">
                      <span className="text-muted-foreground w-16">Email:</span>
                      <a
                        href={`mailto:${supplier.contactEmail}`}
                        className="text-primary hover:underline"
                      >
                        {supplier.contactEmail}
                      </a>
                    </div>
                  )}
                  {supplier.contactPhone && (
                    <div className="flex items-center space-x-2">
                      <span className="text-muted-foreground w-16">Phone:</span>
                      <a
                        href={`tel:${supplier.contactPhone}`}
                        className="text-primary hover:underline"
                      >
                        {supplier.contactPhone}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </motion.div>

          {/* Action Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <Card>
              <CardContent className="p-6 space-y-4">
                <h2 className="text-lg font-semibold">Request a Quote</h2>
                <p className="text-sm text-muted-foreground">
                  Submit an RFQ to get pricing and availability from this supplier.
                </p>
                <Button className="w-full" onClick={handleRequestQuote}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Submit RFQ
                </Button>
                <Button variant="outline" className="w-full" onClick={handleWishlist}>
                  <Heart className={`h-4 w-4 mr-2 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                  {isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                </Button>
              </CardContent>
            </Card>

            {supplier.cities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Service Areas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {supplier.cities.map((city) => (
                      <Badge key={city} variant="outline">
                        {city}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}

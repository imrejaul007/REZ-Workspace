'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Star, Truck, Users, Shield, MapPin, Mail, Phone, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import RfqModal from '../../rfq-modal';

interface MarketplaceSupplier {
  id: string;
  name: string;
  category: string;
  cities: string[];
  rating?: number;
  verified: boolean;
  rezVerified: boolean;
  productCount: number;
  demandSignal?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
}

interface DemandSignal {
  category: string;
  city: string;
  merchantCount: number;
  avgMonthlyQuantity: number;
  avgUnitPrice: number;
  lastUpdated: string;
}

export default function SupplierDetailPage() {
  const { supplierId } = useParams<{ supplierId: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [supplier, setSupplier] = useState<MarketplaceSupplier | null>(null);
  const [demandSignals, setDemandSignals] = useState<DemandSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRfq, setShowRfq] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [supplierRes, signalsRes] = await Promise.all([
        fetch(`/api/marketplace/suppliers/${supplierId}`),
        fetch(`/api/marketplace/demand-signals?city=bangalore`),
      ]);

      if (supplierRes.ok) {
        const data: MarketplaceSupplier = await supplierRes.json();
        setSupplier(data);

        if (signalsRes.ok) {
          const sigs: DemandSignal[] = await signalsRes.json();
          setDemandSignals(sigs.filter((s) => s.category.toLowerCase() === data.category.toLowerCase()));
        }
      } else {
        toast({ title: 'Supplier not found', variant: 'destructive' });
        router.push('/marketplace');
      }
      setLoading(false);
    }
    if (supplierId) load();
  }, [supplierId, router, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-500">Loading supplier...</div>
      </div>
    );
  }

  if (!supplier) return null;

  const topSignal = demandSignals[0];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{supplier.name}</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6 max-w-2xl">
        {/* Profile card */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{supplier.name}</h2>
                <p className="text-gray-500 dark:text-gray-400">{supplier.category}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {supplier.rezVerified && (
                  <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    <Shield className="h-3 w-3 mr-1" /> REZ Verified
                  </Badge>
                )}
                {supplier.verified && (
                  <Badge variant="secondary">Verified</Badge>
                )}
              </div>
            </div>

            {supplier.rating && (
              <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                <span className="font-semibold">{supplier.rating.toFixed(1)}</span>
                <span className="text-gray-400 text-sm">rating</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-sm">
              {supplier.cities.length > 0 && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Truck className="h-4 w-4" />
                  <span>{supplier.cities.join(', ')}</span>
                </div>
              )}
              {supplier.address && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <MapPin className="h-4 w-4" />
                  <span className="truncate">{supplier.address}</span>
                </div>
              )}
              {supplier.contactEmail && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{supplier.contactEmail}</span>
                </div>
              )}
              {supplier.contactPhone && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Phone className="h-4 w-4" />
                  <span>{supplier.contactPhone}</span>
                </div>
              )}
              {supplier.productCount > 0 && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Package className="h-4 w-4" />
                  <span>{supplier.productCount} products</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Social proof demand signal */}
        {topSignal && (
          <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
            <Users className="h-8 w-8 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <div>
              <p className="font-semibold text-emerald-800 dark:text-emerald-300">
                {topSignal.merchantCount}+ restaurants in {topSignal.city} buy from this category monthly
              </p>
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                Avg order: {topSignal.avgMonthlyQuantity} units at ~&#8377;{topSignal.avgUnitPrice.toFixed(2)}/unit
              </p>
            </div>
          </div>
        )}

        {/* CTA */}
        <Button size="lg" className="w-full" onClick={() => setShowRfq(true)}>
          Request Quote from {supplier.name}
        </Button>
      </div>

      {showRfq && (
        <RfqModal supplier={supplier} onClose={() => setShowRfq(false)} />
      )}
    </div>
  );
}

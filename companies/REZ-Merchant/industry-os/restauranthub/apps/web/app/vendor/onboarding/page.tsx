'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, TrendingUp, Building2, CheckCircle, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface DemandSignal {
  category: string;
  city: string;
  merchantCount: number;
  avgMonthlyQuantity: number;
  avgUnitPrice: number;
  lastUpdated: string;
}

interface FormState {
  businessName: string;
  category: string;
  citiesServed: string;
  contactEmail: string;
  contactPhone: string;
  description: string;
}

const CATEGORIES = [
  'Fresh Produce', 'Ingredients', 'Equipment', 'Cleaning',
  'Beverages', 'Frozen Foods', 'Packaging', 'Proteins', 'Cooking Oil',
];

const CITIES = ['Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata'];

export default function VendorOnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [form, setForm] = useState<FormState>({
    businessName: '',
    category: '',
    citiesServed: '',
    contactEmail: '',
    contactPhone: '',
    description: '',
  });

  const [demandSignals, setDemandSignals] = useState<DemandSignal[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (field: keyof FormState) => (val: string) =>
    setForm((prev) => ({ ...prev, [field]: val }));

  // Fetch demand signals when category or city changes
  useEffect(() => {
    if (!form.category) return;
    const city = form.citiesServed.split(',')[0]?.trim();
    const params = new URLSearchParams();
    params.set('category', form.category);
    if (city) params.set('city', city);

    fetch(`/api/marketplace/demand-signals?${params.toString()}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data: DemandSignal[] | null) => { if (data) setDemandSignals(data); })
      .catch(() => {});
  }, [form.category, form.citiesServed]);

  const topSignal = demandSignals[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.businessName || !form.category || !form.contactEmail) {
      toast({ title: 'Please fill all required fields.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/marketplace/vendors/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: form.businessName,
          category: form.category,
          citiesServed: form.citiesServed.split(',').map((c) => c.trim()).filter(Boolean),
          contactEmail: form.contactEmail,
          contactPhone: form.contactPhone || undefined,
          description: form.description || undefined,
        }),
      });

      if (!res.ok) throw new Error('Registration failed');
      setSubmitted(true);
    } catch {
      toast({ title: 'Registration failed. Please try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8 space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Application Submitted!</h2>
            <p className="text-gray-500 dark:text-gray-400">
              Our team will review your application and reach out within 2 business days.
            </p>
            <Button onClick={() => router.push('/marketplace')} className="w-full">
              Browse Marketplace
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Become a Supplier</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-xl space-y-6">
        {/* Pitch banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white space-y-2">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            <h2 className="text-xl font-bold">Sell to Thousands of Restaurants</h2>
          </div>
          <p className="text-blue-100">
            RestoPapa is powered by REZ — India's largest restaurant network.
            List your products and reach verified restaurant buyers instantly.
          </p>
        </div>

        {/* Live demand signal for selected category */}
        {topSignal && (
          <div className="flex items-start gap-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
            <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-800 dark:text-emerald-300">
                Real Demand Signal
              </p>
              <p className="text-sm text-emerald-700 dark:text-emerald-400">
                <strong>{topSignal.merchantCount}+</strong> restaurants in{' '}
                <strong>{topSignal.city}</strong> are actively buying{' '}
                <strong>{topSignal.category}</strong> every month — avg{' '}
                {topSignal.avgMonthlyQuantity} units at &#8377;{topSignal.avgUnitPrice.toFixed(2)}/unit.
              </p>
              <Badge className="mt-1 text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                Live data from REZ purchase orders
              </Badge>
            </div>
          </div>
        )}

        {/* Registration form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Supplier Registration</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label>Business Name *</Label>
                <Input
                  placeholder="Your company name"
                  value={form.businessName}
                  onChange={(e) => set('businessName')(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label>Primary Category *</Label>
                <Select value={form.category} onValueChange={set('category')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Cities You Serve</Label>
                <Input
                  placeholder="e.g. Bangalore, Mumbai (comma separated)"
                  value={form.citiesServed}
                  onChange={(e) => set('citiesServed')(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label>Contact Email *</Label>
                <Input
                  type="email"
                  placeholder="you@company.com"
                  value={form.contactEmail}
                  onChange={(e) => set('contactEmail')(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label>Contact Phone</Label>
                <Input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={form.contactPhone}
                  onChange={(e) => set('contactPhone')(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label>Brief Description</Label>
                <Textarea
                  placeholder="Tell buyers what you offer, minimum order quantities, delivery terms..."
                  value={form.description}
                  onChange={(e) => set('description')(e.target.value)}
                  rows={3}
                />
              </div>

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? 'Submitting...' : (
                  <><Send className="h-4 w-4 mr-2" /> Submit Application</>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

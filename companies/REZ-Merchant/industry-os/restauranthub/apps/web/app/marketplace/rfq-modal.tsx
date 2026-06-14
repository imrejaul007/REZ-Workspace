'use client';

import React, { useState } from 'react';
import { X, Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface Supplier {
  id: string;
  name: string;
  category: string;
}

interface RfqModalProps {
  supplier: Supplier;
  onClose: () => void;
}

interface FormState {
  category: string;
  quantity: string;
  unit: string;
  deliveryFrequency: string;
  city: string;
  notes: string;
}

const FREQUENCIES = ['One-time', 'Weekly', 'Bi-weekly', 'Monthly'];
const UNITS = ['kg', 'litres', 'units', 'boxes', 'cartons', 'tonnes'];

export default function RfqModal({ supplier, onClose }: RfqModalProps) {
  const { toast } = useToast();

  const [form, setForm] = useState<FormState>({
    category: supplier.category,
    quantity: '',
    unit: 'kg',
    deliveryFrequency: 'Monthly',
    city: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (field: keyof FormState) => (val: string) =>
    setForm((prev) => ({ ...prev, [field]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.quantity || !form.city) {
      toast({ title: 'Missing fields', description: 'Please fill in quantity and city.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/marketplace/rfq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: supplier.id,
          category: form.category,
          quantity: parseFloat(form.quantity),
          unit: form.unit,
          deliveryFrequency: form.deliveryFrequency,
          city: form.city,
          notes: form.notes,
        }),
      });

      if (!res.ok) throw new Error('Request failed');
      setSubmitted(true);
    } catch {
      toast({
        title: 'Could not submit RFQ',
        description: 'Please try again in a moment.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Request a Quote</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{supplier.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        {submitted ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <p className="text-xl font-semibold text-gray-900 dark:text-white">Quote Request Sent!</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Supplier will respond within 24 hours.
            </p>
            <Button onClick={onClose} className="mt-4">Close</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>Category</Label>
              <Input value={form.category} onChange={(e) => set('category')(e.target.value)} required />
            </div>

            <div className="flex gap-3">
              <div className="flex-1 space-y-1">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="e.g. 50"
                  value={form.quantity}
                  onChange={(e) => set('quantity')(e.target.value)}
                  required
                />
              </div>
              <div className="w-28 space-y-1">
                <Label>Unit</Label>
                <Select value={form.unit} onValueChange={set('unit')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Delivery Frequency</Label>
              <Select value={form.deliveryFrequency} onValueChange={set('deliveryFrequency')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Your City</Label>
              <Input
                placeholder="e.g. Bangalore"
                value={form.city}
                onChange={(e) => set('city')(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <Label>Additional Notes</Label>
              <Textarea
                placeholder="Specify unknown special requirements, packaging preferences..."
                value={form.notes}
                onChange={(e) => set('notes')(e.target.value)}
                rows={3}
              />
            </div>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? (
                'Sending...'
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" /> Send Quote Request
                </>
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

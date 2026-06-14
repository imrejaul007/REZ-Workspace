'use client';

import { Header } from '@/components/Header';
import { Pipeline } from '@/components/Pipeline';
import { Deal, DealStage } from '@/lib/api';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Mock data for demonstration
const mockDeals: Deal[] = [
  {
    id: '1',
    dealId: 'RE-2024-001',
    property: {
      id: 'p1',
      name: 'Sunrise Villa',
      address: '123 MG Road, Bangalore',
      type: 'Villa',
    },
    customer: {
      id: 'c1',
      name: 'Rajesh Kumar',
      phone: '+91 98765 43210',
      email: 'rajesh@example.com',
    },
    broker: {
      id: 'b1',
      name: 'Priya Sharma',
      phone: '+91 98765 11111',
    },
    stage: 'inquiry',
    value: 25000000,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    activities: [],
    offers: [],
    paymentMilestones: [],
  },
  {
    id: '2',
    dealId: 'RE-2024-002',
    property: {
      id: 'p2',
      name: 'Green Park Apartment',
      address: '456 HB Road, Chennai',
      type: 'Apartment',
    },
    customer: {
      id: 'c2',
      name: 'Anita Desai',
      phone: '+91 98765 43211',
      email: 'anita@example.com',
    },
    broker: {
      id: 'b2',
      name: 'Vikram Singh',
      phone: '+91 98765 22222',
    },
    stage: 'site_visit',
    value: 18000000,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    activities: [],
    offers: [],
    paymentMilestones: [],
  },
  {
    id: '3',
    dealId: 'RE-2024-003',
    property: {
      id: 'p3',
      name: 'Ocean View Penthouse',
      address: '789 Beach Road, Mumbai',
      type: 'Penthouse',
    },
    customer: {
      id: 'c3',
      name: 'Sanjay Mehta',
      phone: '+91 98765 43212',
      email: 'sanjay@example.com',
    },
    broker: {
      id: 'b1',
      name: 'Priya Sharma',
      phone: '+91 98765 11111',
    },
    stage: 'offer',
    value: 45000000,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    activities: [],
    offers: [
      {
        id: 'o1',
        amount: 44000000,
        status: 'pending',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      },
    ],
    paymentMilestones: [],
  },
  {
    id: '4',
    dealId: 'RE-2024-004',
    property: {
      id: 'p4',
      name: 'Mountain View Bungalow',
      address: '321 Hill Road, Dehradun',
      type: 'Bungalow',
    },
    customer: {
      id: 'c4',
      name: 'Meera Patel',
      phone: '+91 98765 43213',
      email: 'meera@example.com',
    },
    broker: {
      id: 'b3',
      name: 'Amit Verma',
      phone: '+91 98765 33333',
    },
    stage: 'negotiation',
    value: 32000000,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    activities: [],
    offers: [
      {
        id: 'o2',
        amount: 30000000,
        status: 'countered',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      },
    ],
    paymentMilestones: [],
  },
  {
    id: '5',
    dealId: 'RE-2024-005',
    property: {
      id: 'p5',
      name: 'City Center Plaza',
      address: '555 Main Street, Delhi',
      type: 'Commercial',
    },
    customer: {
      id: 'c5',
      name: 'Ravi Gupta',
      phone: '+91 98765 43214',
      email: 'ravi@example.com',
    },
    broker: {
      id: 'b2',
      name: 'Vikram Singh',
      phone: '+91 98765 22222',
    },
    stage: 'agreement',
    value: 85000000,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    activities: [],
    offers: [],
    paymentMilestones: [
      {
        id: 'pm1',
        name: 'Booking Amount',
        amount: 8500000,
        paidDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
        status: 'paid',
      },
    ],
  },
  {
    id: '6',
    dealId: 'RE-2024-006',
    property: {
      id: 'p6',
      name: 'Lake Side Residency',
      address: '888 Lake Road, Pune',
      type: 'Apartment',
    },
    customer: {
      id: 'c6',
      name: 'Kavita Nair',
      phone: '+91 98765 43215',
      email: 'kavita@example.com',
    },
    broker: {
      id: 'b1',
      name: 'Priya Sharma',
      phone: '+91 98765 11111',
    },
    stage: 'registry',
    value: 22000000,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    activities: [],
    offers: [],
    paymentMilestones: [],
  },
  {
    id: '7',
    dealId: 'RE-2024-007',
    property: {
      id: 'p7',
      name: 'Garden Grove House',
      address: '222 Garden Lane, Hyderabad',
      type: 'House',
    },
    customer: {
      id: 'c7',
      name: 'Arun Reddy',
      phone: '+91 98765 43216',
      email: 'arun@example.com',
    },
    broker: {
      id: 'b3',
      name: 'Amit Verma',
      phone: '+91 98765 33333',
    },
    stage: 'closed',
    value: 18500000,
    agreedValue: 18000000,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    activities: [],
    offers: [],
    paymentMilestones: [],
    handover: {
      id: 'h1',
      scheduledDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
      status: 'scheduled',
    },
  },
  {
    id: '8',
    dealId: 'RE-2024-008',
    property: {
      id: 'p8',
      name: 'Urban Heights Tower',
      address: '999 High Street, Kolkata',
      type: 'Apartment',
    },
    customer: {
      id: 'c8',
      name: 'Suman Bose',
      phone: '+91 98765 43217',
      email: 'suman@example.com',
    },
    broker: {
      id: 'b2',
      name: 'Vikram Singh',
      phone: '+91 98765 22222',
    },
    stage: 'inquiry',
    value: 15000000,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    activities: [],
    offers: [],
    paymentMilestones: [],
  },
  {
    id: '9',
    dealId: 'RE-2024-009',
    property: {
      id: 'p9',
      name: 'Royal Enclave',
      address: '111 Royal Avenue, Jaipur',
      type: 'Villa',
    },
    customer: {
      id: 'c9',
      name: 'Deepak Sharma',
      phone: '+91 98765 43218',
      email: 'deepak@example.com',
    },
    broker: {
      id: 'b1',
      name: 'Priya Sharma',
      phone: '+91 98765 11111',
    },
    stage: 'site_visit',
    value: 55000000,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    activities: [],
    offers: [],
    paymentMilestones: [],
  },
  {
    id: '10',
    dealId: 'RE-2024-010',
    property: {
      id: 'p10',
      name: 'Skyline Apartments',
      address: '777 Tech Park Road, Gurgaon',
      type: 'Apartment',
    },
    customer: {
      id: 'c10',
      name: 'Neha Gupta',
      phone: '+91 98765 43219',
      email: 'neha@example.com',
    },
    broker: {
      id: 'b3',
      name: 'Amit Verma',
      phone: '+91 98765 33333',
    },
    stage: 'offer',
    value: 28000000,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    activities: [],
    offers: [
      {
        id: 'o3',
        amount: 27000000,
        status: 'accepted',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
      },
    ],
    paymentMilestones: [],
  },
];

export default function PipelinePage() {
  const [deals, setDeals] = useState<Deal[]>(mockDeals);
  const [brokerFilter, setBrokerFilter] = useState<string>('all');

  const handleDealMove = (dealId: string, newStage: DealStage) => {
    setDeals((prev) =>
      prev.map((deal) =>
        deal.id === dealId
          ? { ...deal, stage: newStage, updatedAt: new Date().toISOString() }
          : deal
      )
    );
  };

  const filteredDeals = brokerFilter === 'all'
    ? deals
    : deals.filter((deal) => deal.broker.id === brokerFilter);

  return (
    <div className="min-h-screen bg-background">
      <Header
        title="Pipeline"
        subtitle="Drag and drop deals between stages"
        actions={
          <div className="flex items-center gap-2">
            <Select value={brokerFilter} onValueChange={setBrokerFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by broker" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brokers</SelectItem>
                <SelectItem value="b1">Priya Sharma</SelectItem>
                <SelectItem value="b2">Vikram Singh</SelectItem>
                <SelectItem value="b3">Amit Verma</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Deal
            </Button>
          </div>
        }
      />

      <main className="pl-64 pt-16">
        <div className="p-6">
          <Pipeline deals={filteredDeals} onDealMove={handleDealMove} />
        </div>
      </main>
    </div>
  );
}

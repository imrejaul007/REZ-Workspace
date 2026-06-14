'use client';

import { Header } from '@/components/Header';
import { DealsTable } from '@/components/DealTable';
import { Deal, DealStage } from '@/lib/api';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Download, Filter, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { STAGE_ORDER, getStageConfig, formatCurrency, cn } from '@/lib/utils';
import Link from 'next/link';

interface DealFilters {
  search: string;
  stage: DealStage | 'all';
  broker: string | 'all';
  dateRange: 'all' | '7d' | '30d' | '90d';
  valueRange: 'all' | 'under_1cr' | '1cr_5cr' | '5cr_10cr' | 'above_10cr';
}

// Mock data
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
];

export default function DealsPage() {
  const [filters, setFilters] = useState<DealFilters>({
    search: '',
    stage: 'all',
    broker: 'all',
    dateRange: 'all',
    valueRange: 'all',
  });
  const [sortColumn, setSortColumn] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const hasActiveFilters = Object.entries(filters).some(
    ([key, value]) => value !== 'all' && value !== ''
  );

  const filteredDeals = useMemo(() => {
    let result = [...mockDeals];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (deal) =>
          deal.dealId.toLowerCase().includes(searchLower) ||
          deal.property.name.toLowerCase().includes(searchLower) ||
          deal.customer.name.toLowerCase().includes(searchLower)
      );
    }

    // Stage filter
    if (filters.stage !== 'all') {
      result = result.filter((deal) => deal.stage === filters.stage);
    }

    // Broker filter
    if (filters.broker !== 'all') {
      result = result.filter((deal) => deal.broker.id === filters.broker);
    }

    // Value range filter
    if (filters.valueRange !== 'all') {
      result = result.filter((deal) => {
        switch (filters.valueRange) {
          case 'under_1cr':
            return deal.value < 10000000;
          case '1cr_5cr':
            return deal.value >= 10000000 && deal.value < 50000000;
          case '5cr_10cr':
            return deal.value >= 50000000 && deal.value < 100000000;
          case 'above_10cr':
            return deal.value >= 100000000;
          default:
            return true;
        }
      });
    }

    // Sort
    result.sort((a, b) => {
      let aValue: any = a[sortColumn as keyof Deal];
      let bValue: any = b[sortColumn as keyof Deal];

      if (sortColumn === 'property') {
        aValue = a.property.name;
        bValue = b.property.name;
      } else if (sortColumn === 'customer') {
        aValue = a.customer.name;
        bValue = b.customer.name;
      } else if (sortColumn === 'broker') {
        aValue = a.broker.name;
        bValue = b.broker.name;
      }

      if (typeof aValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return result;
  }, [filters, sortColumn, sortDirection]);

  const totalPages = Math.ceil(filteredDeals.length / itemsPerPage);
  const paginatedDeals = filteredDeals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      stage: 'all',
      broker: 'all',
      dateRange: 'all',
      valueRange: 'all',
    });
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        title="Deals"
        subtitle={`${filteredDeals.length} deals found`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Deal
            </Button>
          </div>
        }
      />

      <main className="pl-64 pt-16">
        <div className="p-6 space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </CardTitle>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetFilters}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by ID or property..."
                    value={filters.search}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, search: e.target.value }))
                    }
                    className="pl-10"
                  />
                </div>

                <Select
                  value={filters.stage}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, stage: value as DealStage | 'all' }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    {STAGE_ORDER.map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        {getStageConfig(stage).label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.broker}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, broker: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Broker" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Brokers</SelectItem>
                    <SelectItem value="b1">Priya Sharma</SelectItem>
                    <SelectItem value="b2">Vikram Singh</SelectItem>
                    <SelectItem value="b3">Amit Verma</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.valueRange}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, valueRange: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Value Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Values</SelectItem>
                    <SelectItem value="under_1cr">Under 1 Cr</SelectItem>
                    <SelectItem value="1cr_5cr">1 Cr - 5 Cr</SelectItem>
                    <SelectItem value="5cr_10cr">5 Cr - 10 Cr</SelectItem>
                    <SelectItem value="above_10cr">Above 10 Cr</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.dateRange}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, dateRange: value as 'all' | '7d' | '30d' | '90d' }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                    <SelectItem value="90d">Last 90 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <DealsTable
                deals={paginatedDeals}
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
            </CardContent>
          </Card>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredDeals.length)} of{' '}
              {filteredDeals.length} results
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="w-10"
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

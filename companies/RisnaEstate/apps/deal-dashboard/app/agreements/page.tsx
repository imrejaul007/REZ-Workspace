'use client';

import { Header } from '@/components/Header';
import { StatusBadge } from '@/components/StatusBadge';
import { Agreement } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, FileText, Eye, Filter } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

// Mock agreements data
const mockAgreements: Agreement[] = [
  {
    id: 'a1',
    dealId: 'RE-2024-001',
    type: 'sale',
    status: 'pending_signatures',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
 },
  {
    id: 'a2',
    dealId: 'RE-2024-002',
    type: 'sale',
    status: 'draft',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: 'a3',
    dealId: 'RE-2024-003',
    type: 'sale',
    status: 'registered',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toISOString(),
    signedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 28).toISOString(),
    registeredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toISOString(),
  },
  {
    id: 'a4',
    dealId: 'RE-2024-004',
    type: 'rent',
    status: 'pending_signatures',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
  },
  {
    id: 'a5',
    dealId: 'RE-2024-005',
    type: 'sale',
    status: 'cancelled',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
  },
  {
    id: 'a6',
    dealId: 'RE-2024-006',
    type: 'sale',
    status: 'draft',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
  },
];

const agreementStats = {
  total: mockAgreements.length,
  draft: mockAgreements.filter((a) => a.status === 'draft').length,
  pendingSignatures: mockAgreements.filter((a) => a.status === 'pending_signatures').length,
  registered: mockAgreements.filter((a) => a.status === 'registered').length,
  cancelled: mockAgreements.filter((a) => a.status === 'cancelled').length,
};

export default function AgreementsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredAgreements = mockAgreements.filter((agreement) => {
    if (statusFilter !== 'all' && agreement.status !== statusFilter) return false;
    if (typeFilter !== 'all' && agreement.type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header
        title="Agreements"
        subtitle={`${filteredAgreements.length} agreements`}
        actions={
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Generate Agreement
          </Button>
        }
      />

      <main className="pl-64 pt-16">
        <div className="p-6 space-y-6">
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Agreements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{agreementStats.total}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Draft
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{agreementStats.draft}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pending Signatures
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{agreementStats.pendingSignatures}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Registered
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{agreementStats.registered}</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <Filter className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Filters</span>
                <div className="flex items-center gap-4 ml-auto">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="pending_signatures">Pending Signatures</SelectItem>
                      <SelectItem value="registered">Registered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="sale">Sale</SelectItem>
                      <SelectItem value="rent">Rent</SelectItem>
                      <SelectItem value="loan">Loan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agreement ID</TableHead>
                    <TableHead>Deal ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Signed</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAgreements.map((agreement) => (
                    <TableRow key={agreement.id}>
                      <TableCell className="font-mono">
                        AG-{agreement.id.toUpperCase()}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/deals/${agreement.dealId}`}
                          className="text-primary hover:underline"
                        >
                          {agreement.dealId}
                        </Link>
                      </TableCell>
                      <TableCell className="capitalize">{agreement.type}</TableCell>
                      <TableCell>
                        <StatusBadge status={agreement.status} />
                      </TableCell>
                      <TableCell>{formatDate(agreement.createdAt)}</TableCell>
                      <TableCell>
                        {agreement.signedAt ? formatDate(agreement.signedAt) : '-'}
                      </TableCell>
                      <TableCell>
                        {agreement.registeredAt ? formatDate(agreement.registeredAt) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

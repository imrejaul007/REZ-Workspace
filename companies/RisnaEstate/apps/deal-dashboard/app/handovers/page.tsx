'use client';

import { Header } from '@/components/Header';
import { StatusBadge } from '@/components/StatusBadge';
import { Handover } from '@/lib/api';
import { formatDate, formatDateTime, formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Calendar,
  CheckCircle2,
  Clock,
  Key,
  Eye,
  Edit,
 ClipboardList,
} from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

// Mock handovers data
const mockHandovers: Handover[] = [
  {
    id: 'h1',
    dealId: 'RE-2024-001',
    scheduledDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
    status: 'scheduled',
    checklist: [
      { id: 'c1', title: 'Property inspection completed', completed: true, completedAt: new Date().toISOString(), completedBy: 'Priya Sharma' },
      { id: 'c2', title: 'Keys handed over', completed: false },
      { id: 'c3', title: 'Documents verified', completed: true, completedAt: new Date().toISOString(), completedBy: 'Priya Sharma' },
      { id: 'c4', title: 'Parking slot assigned', completed: false },
      { id: 'c5', title: 'Society transfer done', completed: false },
      { id: 'c6', title: 'Final walkthrough scheduled', completed: false },
    ],
    notes: 'Customer requested morning handover',
  },
  {
    id: 'h2',
    dealId: 'RE-2024-002',
    scheduledDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(),
    status: 'in_progress',
    checklist: [
      { id: 'c1', title: 'Property inspection completed', completed: true, completedAt: new Date().toISOString(), completedBy: 'Vikram Singh' },
      { id: 'c2', title: 'Keys handed over', completed: true, completedAt: new Date().toISOString(), completedBy: 'Vikram Singh' },
      { id: 'c3', title: 'Documents verified', completed: true, completedAt: new Date().toISOString(), completedBy: 'Vikram Singh' },
      { id: 'c4', title: 'Parking slot assigned', completed: true, completedAt: new Date().toISOString(), completedBy: 'Vikram Singh' },
      { id: 'c5', title: 'Society transfer done', completed: false },
      { id: 'c6', title: 'Final walkthrough scheduled', completed: false },
    ],
 },
  {
    id: 'h3',
    dealId: 'RE-2024-003',
    scheduledDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    completedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    status: 'completed',
    checklist: [
      { id: 'c1', title: 'Property inspection completed', completed: true, completedAt: new Date().toISOString(), completedBy: 'Amit Verma' },
      { id: 'c2', title: 'Keys handed over', completed: true, completedAt: new Date().toISOString(), completedBy: 'Amit Verma' },
      { id: 'c3', title: 'Documents verified', completed: true, completedAt: new Date().toISOString(), completedBy: 'Amit Verma' },
      { id: 'c4', title: 'Parking slot assigned', completed: true, completedAt: new Date().toISOString(), completedBy: 'Amit Verma' },
      { id: 'c5', title: 'Society transfer done', completed: true, completedAt: new Date().toISOString(), completedBy: 'Amit Verma' },
      { id: 'c6', title: 'Final walkthrough scheduled', completed: true, completedAt: new Date().toISOString(), completedBy: 'Amit Verma' },
    ],
  },
  {
    id: 'h4',
    dealId: 'RE-2024-004',
    scheduledDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
    status: 'scheduled',
    checklist: [
      { id: 'c1', title: 'Property inspection completed', completed: false },
      { id: 'c2', title: 'Keys handed over', completed: false },
      { id: 'c3', title: 'Documents verified', completed: false },
      { id: 'c4', title: 'Parking slot assigned', completed: false },
      { id: 'c5', title: 'Society transfer done', completed: false },
      { id: 'c6', title: 'Final walkthrough scheduled', completed: false },
    ],
  },
  {
    id: 'h5',
    dealId: 'RE-2024-005',
    scheduledDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    status: 'cancelled',
    checklist: [
      { id: 'c1', title: 'Property inspection completed', completed: false },
      { id: 'c2', title: 'Keys handed over', completed: false },
      { id: 'c3', title: 'Documents verified', completed: false },
      { id: 'c4', title: 'Parking slot assigned', completed: false },
      { id: 'c5', title: 'Society transfer done', completed: false },
      { id: 'c6', title: 'Final walkthrough scheduled', completed: false },
    ],
    notes: 'Deal fell through - handover cancelled',
  },
];

const handoverStats = {
  total: mockHandovers.length,
  scheduled: mockHandovers.filter((h) => h.status === 'scheduled').length,
  inProgress: mockHandovers.filter((h) => h.status === 'in_progress').length,
  completed: mockHandovers.filter((h) => h.status === 'completed').length,
  cancelled: mockHandovers.filter((h) => h.status === 'cancelled').length,
};

export default function HandoversPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedHandover, setSelectedHandover] = useState<Handover | null>(null);

  const filteredHandovers = mockHandovers.filter((handover) => {
    if (statusFilter !== 'all' && handover.status !== statusFilter) return false;
    return true;
  });

  const getChecklistProgress = (handover: Handover) => {
    const completed = handover.checklist.filter((item) => item.completed).length;
    return (completed / handover.checklist.length) * 100;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        title="Handovers"
        subtitle={`${filteredHandovers.length} handovers`}
        actions={
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Handover
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
                  Total Handovers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{handoverStats.total}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Scheduled
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{handoverStats.scheduled}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  In Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{handoverStats.inProgress}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{handoverStats.completed}</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
          </Card>

          {/* Handovers List */}
          <div className="grid gap-4">
            {filteredHandovers.map((handover) => {
              const progress = getChecklistProgress(handover);
              const completedCount = handover.checklist.filter((item) => item.completed).length;

              return (
                <Card key={handover.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                          handover.status === 'completed' ? 'bg-green-100 text-green-600' :
                          handover.status === 'in_progress' ? 'bg-orange-100 text-orange-600' :
                          handover.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {handover.status === 'completed' ? (
                            <CheckCircle2 className="h-6 w-6" />
                          ) : handover.status === 'in_progress' ? (
                            <ClipboardList className="h-6 w-6" />
                          ) : handover.status === 'cancelled' ? (
                            <Clock className="h-6 w-6" />
                          ) : (
                            <Key className="h-6 w-6" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            Deal {handover.dealId}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <StatusBadge status={handover.status} />
                            <span className="text-sm text-muted-foreground">
                              {formatDate(handover.scheduledDate)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/deals/${handover.dealId}`} className="flex items-center">
                              <Eye className="h-4 w-4 mr-2" />
                              View Deal
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Checklist
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Checklist Progress
                        </span>
                        <span className="text-sm font-medium">
                          {completedCount}/{handover.checklist.length}
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <div className="grid grid-cols-3 gap-4">
                        {handover.checklist.slice(0, 3).map((item) => (
                          <div key={item.id} className="flex items-center gap-2">
                            <Checkbox checked={item.completed} disabled />
                            <span className={`text-sm ${
                              item.completed ? '' : 'text-muted-foreground'
                            }`}>
                              {item.title}
                            </span>
                          </div>
                        ))}
                      </div>
                      {handover.notes && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Note: {handover.notes}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

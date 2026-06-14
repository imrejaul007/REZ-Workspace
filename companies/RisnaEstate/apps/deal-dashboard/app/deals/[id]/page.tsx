'use client';

import { Header } from '@/components/Header';
import { Timeline } from '@/components/Timeline';
import { StageChip } from '@/components/StageChip';
import { StatusBadge } from '@/components/StatusBadge';
import { Deal, DealStage, Activity, Offer, PaymentMilestone } from '@/lib/api';
import { formatCurrency, formatDate, formatDateTime, getNextStage, getStageConfig, STAGE_ORDER } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MapPin,
  User,
  Phone,
  Mail,
  Building2,
  DollarSign,
  Calendar,
  ArrowRight,
  ArrowLeft,
  Plus,
  FileText,
  CheckCircle2,
  Circle,
  Clock,
  Download,
 Edit,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useParams } from 'next/navigation';

// Mock deal data
const mockDeal: Deal = {
  id: '1',
  dealId: 'RE-2024-001',
  property: {
    id: 'p1',
    name: 'Sunrise Villa',
    address: '123 MG Road, Whitefield, Bangalore - 560066',
    type: 'Villa',
  },
  customer: {
    id: 'c1',
    name: 'Rajesh Kumar',
    phone: '+91 98765 43210',
    email: 'rajesh.kumar@example.com',
  },
  broker: {
    id: 'b1',
    name: 'Priya Sharma',
    phone: '+91 98765 11111',
  },
  stage: 'negotiation',
  value: 25000000,
  agreedValue: 24000000,
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toISOString(),
  updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  activities: [
    {
      id: 'a1',
      type: 'stage_change',
      description: 'Deal moved from Offer to Negotiation',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      createdBy: 'Priya Sharma',
    },
    {
      id: 'a2',
      type: 'offer',
      description: 'Counter offer of Rs. 2.4 Cr submitted',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      createdBy: 'System',
    },
    {
      id: 'a3',
      type: 'meeting',
      description: 'Site visit completed with customer',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      createdBy: 'Priya Sharma',
    },
    {
      id: 'a4',
      type: 'call',
      description: 'Follow-up call with customer regarding documents',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
      createdBy: 'Priya Sharma',
    },
    {
      id: 'a5',
      type: 'note',
      description: 'Customer interested in early possession',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
      createdBy: 'Priya Sharma',
    },
  ],
  offers: [
    {
      id: 'o1',
      amount: 25000000,
      status: 'rejected',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
      notes: 'Initial asking price',
    },
    {
      id: 'o2',
      amount: 24500000,
      status: 'rejected',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
      notes: 'After site visit negotiation',
    },
    {
      id: 'o3',
      amount: 24000000,
      status: 'pending',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
      notes: 'Final counter offer',
    },
  ],
  paymentMilestones: [
    {
      id: 'pm1',
      name: 'Booking Amount',
      amount: 2500000,
      paidDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
      status: 'paid',
    },
    {
      id: 'pm2',
      name: 'First Installment',
      amount: 5000000,
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
      status: 'pending',
    },
    {
      id: 'pm3',
      name: 'Registry Amount',
      amount: 16500000,
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45).toISOString(),
      status: 'pending',
    },
  ],
  handover: {
    id: 'h1',
    scheduledDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60).toISOString(),
    status: 'scheduled',
  },
};

const handoverChecklist = [
  { id: 'h1', title: 'Property inspection completed', completed: true, completedAt: new Date().toISOString(), completedBy: 'Priya Sharma' },
  { id: 'h2', title: 'Keys handed over', completed: false },
  { id: 'h3', title: 'Documents verified', completed: true, completedAt: new Date().toISOString(), completedBy: 'Priya Sharma' },
  { id: 'h4', title: 'Parking slot assigned', completed: false },
  { id: 'h5', title: 'Society transfer done', completed: false },
  { id: 'h6', title: 'Final walkthrough scheduled', completed: false },
];

export default function DealDetailPage() {
  const params = useParams();
  const [currentStage, setCurrentStage] = useState<DealStage>(mockDeal.stage);
  const [showStageDialog, setShowStageDialog] = useState(false);
  const [showOfferDialog, setShowOfferDialog] = useState(false);
  const [newOfferAmount, setNewOfferAmount] = useState('');

  const deal = mockDeal;
  const nextStage = getNextStage(currentStage);
  const previousStage = STAGE_ORDER[STAGE_ORDER.indexOf(currentStage) - 1];

  const completedChecklist = handoverChecklist.filter((item) => item.completed).length;
  const checklistProgress = (completedChecklist / handoverChecklist.length) * 100;

  const handleStageChange = (newStage: DealStage) => {
    setCurrentStage(newStage);
    setShowStageDialog(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        title={`Deal ${deal.dealId}`}
        subtitle={deal.property.name}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/deals">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        }
      />

      <main className="pl-64 pt-16">
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          {/* Deal Info Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{deal.property.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <StageChip stage={currentStage} size="lg" />
                    <Badge variant="outline">{deal.property.type}</Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Deal Value</p>
                  <p className="text-3xl font-bold text-primary">
                    {formatCurrency(deal.agreedValue || deal.value)}
                  </p>
                  {deal.agreedValue && (
                    <p className="text-sm text-muted-foreground line-through">
                      {formatCurrency(deal.value)} asking
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                {/* Property */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Property
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <span>{deal.property.address}</span>
                    </div>
                  </div>
                </div>

                {/* Customer */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Customer
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">{deal.customer.name}</p>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{deal.customer.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{deal.customer.email}</span>
                    </div>
                  </div>
                </div>

                {/* Broker */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Broker
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">{deal.broker.name}</p>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{deal.broker.phone}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stage Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Stage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <StageChip stage={currentStage} size="lg" />
                  <span className="text-sm text-muted-foreground">
                    Created {formatDate(deal.createdAt)}
                  </span>
                </div>
                <div className="flex-1" />
                <div className="flex items-center gap-2">
                  {previousStage && (
                    <Button
                      variant="outline"
                      onClick={() => handleStageChange(previousStage)}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Move Back
                    </Button>
                  )}
                  {nextStage && (
                    <Button
                      onClick={() => setShowStageDialog(true)}
                    >
                      Move to {getStageConfig(nextStage).label}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column */}
            <div className="space-y-6 lg:col-span-2">
              {/* Activity Timeline */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Activity Timeline</CardTitle>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Activity
                  </Button>
                </CardHeader>
                <CardContent>
                  <Timeline activities={deal.activities} />
                </CardContent>
              </Card>

              {/* Offers */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Offers</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => setShowOfferDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Offer
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {deal.offers.map((offer) => (
                      <div
                        key={offer.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold">{formatCurrency(offer.amount)}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(offer.createdAt)}
                              {offer.validUntil && (
                                <> • Valid until {formatDate(offer.validUntil)}</>
                              )}
                            </p>
                          </div>
                        </div>
                        <StatusBadge status={offer.status} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Payment Milestones */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Milestones</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {deal.paymentMilestones.map((milestone, index) => (
                      <div key={milestone.id} className="flex items-center gap-4">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          milestone.status === 'paid' ? 'bg-green-100 text-green-600' :
                          milestone.status === 'overdue' ? 'bg-red-100 text-red-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {milestone.status === 'paid' ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : milestone.status === 'overdue' ? (
                            <Clock className="h-5 w-5" />
                          ) : (
                            <Circle className="h-5 w-5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{milestone.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {milestone.status === 'paid' && milestone.paidDate
                              ? `Paid on ${formatDate(milestone.paidDate)}`
                              : milestone.dueDate
                              ? `Due ${formatDate(milestone.dueDate)}`
                              : 'No due date'}
                          </p>
                        </div>
                        <p className="font-semibold">{formatCurrency(milestone.amount)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Handover Checklist */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Handover Checklist</CardTitle>
                  <span className="text-sm text-muted-foreground">
                    {completedChecklist}/{handoverChecklist.length}
                  </span>
                </CardHeader>
                <CardContent>
                  <Progress value={checklistProgress} className="mb-4" />
                  <div className="space-y-3">
                    {handoverChecklist.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <Checkbox checked={item.completed} />
                        <span className={item.completed ? 'line-through text-muted-foreground' : ''}>
                          {item.title}
                        </span>
                      </div>
                    ))}
                  </div>
                  {deal.handover?.scheduledDate && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground">Scheduled Date</p>
                      <p className="font-medium">{formatDate(deal.handover.scheduledDate)}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Agreement
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Site Visit
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Phone className="h-4 w-4 mr-2" />
                    Log Call
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Download Documents
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Stage Change Dialog */}
      <Dialog open={showStageDialog} onOpenChange={setShowStageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Deal to Next Stage</DialogTitle>
            <DialogDescription>
              Select the stage to move this deal to.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select
              value={nextStage || ''}
              onValueChange={(value) => handleStageChange(value as DealStage)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                {STAGE_ORDER.map((stage) => (
                  <SelectItem key={stage} value={stage}>
                    {getStageConfig(stage).label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStageDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => nextStage && handleStageChange(nextStage)}>
              Move Deal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Offer Dialog */}
      <Dialog open={showOfferDialog} onOpenChange={setShowOfferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Offer</DialogTitle>
            <DialogDescription>
              Enter the offer details below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Offer Amount</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={newOfferAmount}
                onChange={(e) => setNewOfferAmount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOfferDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowOfferDialog(false)}>
              Add Offer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

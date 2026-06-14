'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  Phone,
  Mail,
  Plus,
  Edit3,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Download,
  MessageSquare,
  MapPin,
  Bell,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api/client';
import { toast } from 'react-hot-toast';

interface ApiReservation {
  id: string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  reservationTime: string;
  partySize: number;
  status: string;
  notes?: string;
  occasion?: string;
  table?: { id: string; tableNumber: string };
  customer?: { id: string; firstName: string; lastName?: string };
  createdAt: string;
  updatedAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-green-500 text-white',
  pending: 'bg-yellow-500 text-white',
  arrived: 'bg-blue-500 text-white',
  completed: 'bg-gray-500 text-white',
  cancelled: 'bg-red-500 text-white',
  no_show: 'bg-orange-500 text-white',
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'confirmed': return <CheckCircle className="h-4 w-4" />;
    case 'pending': return <Clock className="h-4 w-4" />;
    case 'arrived': return <Users className="h-4 w-4" />;
    case 'completed': return <CheckCircle className="h-4 w-4" />;
    case 'cancelled': return <XCircle className="h-4 w-4" />;
    case 'no_show': return <AlertCircle className="h-4 w-4" />;
    default: return <AlertCircle className="h-4 w-4" />;
  }
};

const formatTime = (isoString: string) => {
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
};

const toDateStr = (date: Date) => date.toISOString().split('T')[0];

const TIME_SLOTS = [
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00', '21:30', '22:00',
];

const OCCASIONS = [
  'Birthday', 'Anniversary', 'Business', 'Date Night',
  'Family Gathering', 'Celebration', 'Other',
];

const emptyForm = {
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  date: '',
  time: '',
  partySize: 2,
  occasion: '',
  notes: '',
  internalNotes: '',
};

export default function ReservationSystem() {
  const [reservations, setReservations] = useState<ApiReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedReservation, setSelectedReservation] = useState<ApiReservation | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [form, setForm] = useState(emptyForm);

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        date: toDateStr(selectedDate),
        page: pagination.page,
        limit: 50,
      };
      if (filterStatus !== 'all') params.status = filterStatus;

      const res = await apiClient.get('/reservations', { params });
      const body = res as unknown;
      setReservations(body.data ?? []);
      if (body.pagination) {
        setPagination({
          page: body.pagination.page,
          total: body.pagination.total,
          pages: body.pagination.pages,
        });
      }
    } catch {
      // apiClient interceptor already shows a toast
    } finally {
      setLoading(false);
    }
  }, [selectedDate, filterStatus, pagination.page]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const filteredReservations = reservations.filter((r) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      r.customerName.toLowerCase().includes(q) ||
      (r.customerEmail ?? '').toLowerCase().includes(q) ||
      r.customerPhone.includes(q)
    );
  });

  const handleCreateReservation = async () => {
    if (!form.customerName || !form.customerPhone || !form.date || !form.time) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post('/reservations', {
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        customerEmail: form.customerEmail || undefined,
        partySize: form.partySize,
        date: form.date,
        time: form.time,
        occasion: form.occasion || undefined,
        notes: form.notes || undefined,
        internalNotes: form.internalNotes || undefined,
      });
      toast.success('Reservation created');
      setForm(emptyForm);
      setIsAddOpen(false);
      fetchReservations();
    } catch {
      // toast already shown by interceptor
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await apiClient.patch(`/reservations/${id}`, { status });
      toast.success(`Status updated to ${status}`);
      fetchReservations();
    } catch {
      // handled by interceptor
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await apiClient.delete(`/reservations/${id}`);
      toast.success('Reservation cancelled');
      fetchReservations();
      if (isDetailsOpen) setIsDetailsOpen(false);
    } catch {
      // handled by interceptor
    }
  };

  const dailyStats = {
    total: reservations.length,
    confirmed: reservations.filter((r) => r.status === 'confirmed').length,
    pending: reservations.filter((r) => r.status === 'pending').length,
    arrived: reservations.filter((r) => r.status === 'arrived').length,
    totalGuests: reservations.reduce((sum, r) => sum + r.partySize, 0),
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reservation System</h1>
            <p className="text-muted-foreground mt-1">
              Manage restaurant reservations and table bookings
            </p>
          </div>
          <div className="flex items-center space-x-2 mt-4 sm:mt-0">
            <Button variant="outline" size="default">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button size="default" variant="default">
                  <Plus className="h-4 w-4 mr-2" />
                  New Reservation
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Reservation</DialogTitle>
                  <DialogDescription>Add a new table reservation for a customer</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customer-name">Customer Name *</Label>
                    <Input
                      id="customer-name"
                      value={form.customerName}
                      onChange={(e) => setForm((p) => ({ ...p, customerName: e.target.value }))}
                      placeholder="John Smith"
                    />
                  </div>
                  <div>
                    <Label htmlFor="party-size">Party Size *</Label>
                    <Select
                      value={form.partySize.toString()}
                      onValueChange={(v) => setForm((p) => ({ ...p, partySize: parseInt(v) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((s) => (
                          <SelectItem key={s} value={s.toString()}>
                            {s} {s === 1 ? 'person' : 'people'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.customerEmail}
                      onChange={(e) => setForm((p) => ({ ...p, customerEmail: e.target.value }))}
                      placeholder="john@email.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      value={form.customerPhone}
                      onChange={(e) => setForm((p) => ({ ...p, customerPhone: e.target.value }))}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div>
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">Time *</Label>
                    <Select
                      value={form.time}
                      onValueChange={(v) => setForm((p) => ({ ...p, time: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_SLOTS.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="occasion">Occasion</Label>
                    <Select
                      value={form.occasion}
                      onValueChange={(v) => setForm((p) => ({ ...p, occasion: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select occasion" />
                      </SelectTrigger>
                      <SelectContent>
                        {OCCASIONS.map((o) => (
                          <SelectItem key={o} value={o}>
                            {o}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="notes">Notes / Special Requests</Label>
                    <Textarea
                      id="notes"
                      value={form.notes}
                      onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                      placeholder="Any special requests or dietary requirements..."
                      rows={2}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="internalNotes">Internal Notes</Label>
                    <Textarea
                      id="internalNotes"
                      value={form.internalNotes}
                      onChange={(e) => setForm((p) => ({ ...p, internalNotes: e.target.value }))}
                      placeholder="Internal notes for staff..."
                      rows={2}
                    />
                  </div>
                  <div className="col-span-2 flex space-x-2">
                    <Button
                      onClick={handleCreateReservation}
                      className="flex-1"
                      size="default"
                      variant="default"
                      disabled={submitting}
                    >
                      {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Create Reservation
                    </Button>
                    <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  Select Date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Daily Stats</CardTitle>
                <CardDescription>{selectedDate.toLocaleDateString()}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="font-semibold">{dailyStats.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Confirmed</span>
                  <span className="font-semibold text-green-600">{dailyStats.confirmed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Pending</span>
                  <span className="font-semibold text-yellow-600">{dailyStats.pending}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Seated</span>
                  <span className="font-semibold text-blue-600">{dailyStats.arrived}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Guests</span>
                  <span className="font-semibold">{dailyStats.totalGuests}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reservations List */}
          <div className="lg:col-span-3">
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="arrived">Arrived</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="no_show">No-Show</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {filteredReservations.map((reservation, index) => (
                    <motion.div
                      key={reservation.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                    >
                      <Card
                        className="hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => {
                          setSelectedReservation(reservation);
                          setIsDetailsOpen(true);
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                <Users className="h-6 w-6 text-primary" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center space-x-2">
                                  <h3 className="text-lg font-semibold truncate">
                                    {reservation.customerName}
                                  </h3>
                                  <Badge
                                    className={cn(
                                      'text-xs',
                                      STATUS_COLORS[reservation.status] ?? 'bg-gray-500 text-white',
                                    )}
                                  >
                                    <div className="flex items-center space-x-1">
                                      {getStatusIcon(reservation.status)}
                                      <span className="capitalize">
                                        {reservation.status.replace('_', ' ')}
                                      </span>
                                    </div>
                                  </Badge>
                                </div>
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                                  <div className="flex items-center space-x-1">
                                    <Clock className="h-4 w-4" />
                                    <span>{formatTime(reservation.reservationTime)}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Users className="h-4 w-4" />
                                    <span>{reservation.partySize} people</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Phone className="h-4 w-4" />
                                    <span>{reservation.customerPhone}</span>
                                  </div>
                                  {reservation.table && (
                                    <div className="flex items-center space-x-1">
                                      <MapPin className="h-4 w-4" />
                                      <span>Table {reservation.table.tableNumber}</span>
                                    </div>
                                  )}
                                </div>
                                {reservation.notes && (
                                  <p className="text-sm text-orange-600 mt-1 truncate">
                                    <MessageSquare className="h-3 w-3 inline mr-1" />
                                    {reservation.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div
                              className="flex flex-col space-y-2 ml-4"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {reservation.status === 'pending' && (
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleUpdateStatus(reservation.id, 'confirmed')}
                                  >
                                    Confirm
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCancel(reservation.id)}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              )}
                              {reservation.status === 'confirmed' && (
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleUpdateStatus(reservation.id, 'arrived')}
                                  >
                                    Seat Party
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUpdateStatus(reservation.id, 'no_show')}
                                  >
                                    No-Show
                                  </Button>
                                </div>
                              )}
                              {reservation.status === 'arrived' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateStatus(reservation.id, 'completed')}
                                >
                                  Complete
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {!loading && filteredReservations.length === 0 && (
                  <Card>
                    <CardContent className="text-center py-12">
                      <CalendarIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Reservations Found</h3>
                      <p className="text-muted-foreground">
                        {searchTerm || filterStatus !== 'all'
                          ? 'Try adjusting your search or filters'
                          : `No reservations scheduled for ${selectedDate.toLocaleDateString()}`}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Reservation Details Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Reservation Details</span>
              </DialogTitle>
              <DialogDescription>Complete reservation information and management</DialogDescription>
            </DialogHeader>
            {selectedReservation && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Customer Name</Label>
                    <p className="font-semibold">{selectedReservation.customerName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <Badge
                      className={cn(
                        'ml-2',
                        STATUS_COLORS[selectedReservation.status] ?? 'bg-gray-500 text-white',
                      )}
                    >
                      {selectedReservation.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Date &amp; Time</Label>
                    <p className="font-semibold">
                      {new Date(selectedReservation.reservationTime).toLocaleDateString()} at{' '}
                      {formatTime(selectedReservation.reservationTime)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Party Size</Label>
                    <p className="font-semibold">{selectedReservation.partySize} people</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                    <p className="font-semibold">{selectedReservation.customerPhone}</p>
                  </div>
                  {selectedReservation.customerEmail && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                      <p className="font-semibold">{selectedReservation.customerEmail}</p>
                    </div>
                  )}
                  {selectedReservation.table && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Table</Label>
                      <p className="font-semibold">Table {selectedReservation.table.tableNumber}</p>
                    </div>
                  )}
                </div>

                {selectedReservation.occasion && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Occasion</Label>
                    <p className="font-semibold">{selectedReservation.occasion}</p>
                  </div>
                )}

                {selectedReservation.notes && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
                    <p className="p-2 bg-muted rounded">{selectedReservation.notes}</p>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button
                    className="flex-1"
                    size="default"
                    variant="destructive"
                    onClick={() => handleCancel(selectedReservation.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Cancel Reservation
                  </Button>
                  <Button variant="outline" size="default">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Contact
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

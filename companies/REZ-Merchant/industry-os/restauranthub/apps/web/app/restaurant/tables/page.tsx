'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  QrCode,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { apiClient } from '@/lib/api/client';
import { toast } from 'react-hot-toast';
import { TableQRDialog } from '@/components/table-qr-dialog';
import { AllTablesQRDialog } from '@/components/all-tables-qr-dialog';

interface ApiTable {
  id: string;
  tableNumber: string;
  capacity: number;
  status: string;
  isActive: boolean;
  restaurantId: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  available: 'bg-green-500',
  occupied: 'bg-red-500',
  reserved: 'bg-yellow-500',
  cleaning: 'bg-gray-500',
  maintenance: 'bg-orange-500',
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'available': return <CheckCircle className="h-4 w-4" />;
    case 'occupied': return <Users className="h-4 w-4" />;
    case 'reserved': return <Clock className="h-4 w-4" />;
    default: return <AlertCircle className="h-4 w-4" />;
  }
};

const SECTIONS = ['Main Dining', 'Patio', 'Bar Area', 'Private Room'];

const emptyAddForm = { number: '', seats: '', section: '' };
const emptyEditForm = { number: '', seats: '', status: '' };

export default function TableManagement() {
  const [tables, setTables] = useState<ApiTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedSection, setSelectedSection] = useState('all');
  const [addForm, setAddForm] = useState(emptyAddForm);
  const [editTarget, setEditTarget] = useState<ApiTable | null>(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const fetchTables = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/reservations/tables');
      const body = res as unknown;
      setTables(body.data ?? []);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const handleAddTable = async () => {
    if (!addForm.number || !addForm.seats) {
      toast.error('Table number and capacity are required');
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post('/reservations/tables', {
        name: addForm.number,
        capacity: parseInt(addForm.seats),
        section: addForm.section || undefined,
      });
      toast.success('Table added');
      setAddForm(emptyAddForm);
      setIsAddOpen(false);
      fetchTables();
    } catch {
      // handled
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (table: ApiTable) => {
    setEditTarget(table);
    setEditForm({ number: table.tableNumber, seats: table.capacity.toString(), status: table.status });
    setIsEditOpen(true);
  };

  const handleEditTable = async () => {
    if (!editTarget) return;
    setSubmitting(true);
    try {
      await apiClient.patch(`/reservations/tables/${editTarget.id}`, {
        name: editForm.number || undefined,
        capacity: editForm.seats ? parseInt(editForm.seats) : undefined,
        status: editForm.status || undefined,
      });
      toast.success('Table updated');
      setIsEditOpen(false);
      fetchTables();
    } catch {
      // handled
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTable = async (id: string) => {
    try {
      await apiClient.delete(`/reservations/tables/${id}`);
      toast.success('Table removed');
      fetchTables();
    } catch {
      // handled
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await apiClient.patch(`/reservations/tables/${id}`, { status });
      fetchTables();
    } catch {
      // handled
    }
  };

  const filteredTables =
    selectedSection === 'all' ? tables : tables.filter((t) => (t as unknown).section === selectedSection);

  const stats = {
    total: tables.length,
    available: tables.filter((t) => t.status === 'available').length,
    occupied: tables.filter((t) => t.status === 'occupied').length,
    reserved: tables.filter((t) => t.status === 'reserved').length,
    totalSeats: tables.reduce((sum, t) => sum + t.capacity, 0),
    occupiedSeats: tables
      .filter((t) => t.status === 'occupied' || t.status === 'reserved')
      .reduce((sum, t) => sum + t.capacity, 0),
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Table Management</h1>
            <p className="text-muted-foreground">Manage restaurant seating and reservations</p>
          </div>
          <div className="flex gap-2">
            {/* QR Codes Button */}
            {tables.length > 0 && (
              <AllTablesQRDialog>
                <Button variant="outline" size="default">
                  <QrCode className="h-4 w-4 mr-2" />
                  Generate All QR Codes
                </Button>
              </AllTablesQRDialog>
            )}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button size="default">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Table
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Table</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="tableNumber">Table Number / Name *</Label>
                  <Input
                    id="tableNumber"
                    value={addForm.number}
                    onChange={(e) => setAddForm((p) => ({ ...p, number: e.target.value }))}
                    placeholder="e.g., 9 or T-09"
                  />
                </div>
                <div>
                  <Label htmlFor="seats">Capacity (seats) *</Label>
                  <Input
                    id="seats"
                    type="number"
                    value={addForm.seats}
                    onChange={(e) => setAddForm((p) => ({ ...p, seats: e.target.value }))}
                    placeholder="4"
                  />
                </div>
                <div>
                  <Label htmlFor="section">Section</Label>
                  <Select
                    value={addForm.section}
                    onValueChange={(v) => setAddForm((p) => ({ ...p, section: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select section (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {SECTIONS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddTable} className="w-full" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Add Table
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Table</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Table Number / Name</Label>
                <Input
                  value={editForm.number}
                  onChange={(e) => setEditForm((p) => ({ ...p, number: e.target.value }))}
                />
              </div>
              <div>
                <Label>Capacity</Label>
                <Input
                  type="number"
                  value={editForm.seats}
                  onChange={(e) => setEditForm((p) => ({ ...p, seats: e.target.value }))}
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(v) => setEditForm((p) => ({ ...p, status: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="reserved">Reserved</SelectItem>
                    <SelectItem value="cleaning">Cleaning</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleEditTable} className="flex-1" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Stats Overview */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[
                { label: 'Total Tables', value: stats.total, color: '' },
                { label: 'Available', value: stats.available, color: 'text-green-600' },
                { label: 'Occupied', value: stats.occupied, color: 'text-red-600' },
                { label: 'Reserved', value: stats.reserved, color: 'text-yellow-600' },
                { label: 'Total Seats', value: stats.totalSeats, color: '' },
                {
                  label: 'Occupancy',
                  value: stats.totalSeats
                    ? `${Math.round((stats.occupiedSeats / stats.totalSeats) * 100)}%`
                    : '0%',
                  color: 'text-blue-600',
                },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                      <div className="text-sm text-gray-600">{s.label}</div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Section Filter */}
            <div className="flex items-center space-x-4">
              <Label>Filter by Section:</Label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {SECTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tables Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredTables.map((table, index) => (
                <motion.div
                  key={table.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {table.tableNumber.slice(0, 2)}
                          </div>
                          <span>Table {table.tableNumber}</span>
                        </CardTitle>
                        <Badge className={STATUS_COLORS[table.status] ?? 'bg-gray-500'}>
                          {getStatusIcon(table.status)}
                          <span className="ml-1 capitalize">{table.status}</span>
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Capacity</span>
                          <span className="font-medium">{table.capacity} seats</span>
                        </div>
                      </div>

                      {/* Quick status actions */}
                      <div className="flex space-x-2 mt-4">
                        {table.status === 'available' && (
                          <>
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => handleStatusChange(table.id, 'occupied')}
                            >
                              Seat Guests
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(table.id, 'reserved')}
                            >
                              Reserve
                            </Button>
                          </>
                        )}
                        {table.status === 'occupied' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => handleStatusChange(table.id, 'cleaning')}
                            >
                              Clear Table
                            </Button>
                          </>
                        )}
                        {table.status === 'reserved' && (
                          <>
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => handleStatusChange(table.id, 'occupied')}
                            >
                              Seat Party
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(table.id, 'available')}
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                        {table.status === 'cleaning' && (
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => handleStatusChange(table.id, 'available')}
                          >
                            Mark Clean
                          </Button>
                        )}
                      </div>

                      {/* Edit / Delete / QR controls */}
                      <div className="flex space-x-2 mt-2">
                        <TableQRDialog
                          tableId={table.id}
                          tableNumber={table.tableNumber}
                          capacity={table.capacity}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(table)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDeleteTable(table.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              {filteredTables.length === 0 && (
                <div className="col-span-4 text-center py-12 text-muted-foreground">
                  No tables found. Add one to get started.
                </div>
              )}
            </div>

            {/* Section Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {SECTIONS.map((section, index) => {
                const sectionTables = tables.filter((t) => (t as unknown).section === section);
                const sStats = {
                  total: sectionTables.length,
                  available: sectionTables.filter((t) => t.status === 'available').length,
                  occupied: sectionTables.filter((t) => t.status === 'occupied').length,
                  reserved: sectionTables.filter((t) => t.status === 'reserved').length,
                };
                return (
                  <motion.div
                    key={section}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <MapPin className="h-5 w-5 mr-2" />
                          {section}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Total Tables</span>
                            <span className="font-medium">{sStats.total}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-green-600">Available</span>
                            <span className="font-medium">{sStats.available}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-red-600">Occupied</span>
                            <span className="font-medium">{sStats.occupied}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-yellow-600">Reserved</span>
                            <span className="font-medium">{sStats.reserved}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

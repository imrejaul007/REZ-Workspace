'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  getLowStockAlerts,
  createPurchaseOrder,
  LowStockAlert,
  PurchaseOrderItem,
} from '@/services/inventoryService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  Package,
  ArrowLeft,
  RefreshCw,
  ShoppingCart,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface CreateOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedAlerts: LowStockAlert[];
  onSuccess: () => void;
}

function CreateOrderDialog({
  open,
  onOpenChange,
  selectedAlerts,
  onSuccess,
}: CreateOrderDialogProps) {
  const router = useRouter();
  const [supplier, setSupplier] = useState('');
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [notes, setNotes] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateOrder = async () => {
    if (!supplier) {
      setError('Supplier is required');
      return;
    }

    if (selectedAlerts.length === 0) {
      setError('Please select at least one item');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const items: Omit<PurchaseOrderItem, 'totalPrice'>[] = selectedAlerts.map((alert) => ({
        itemId: alert.itemId,
        itemName: alert.itemName,
        quantity: alert.shortage + alert.minStockLevel, // Order enough to reach min level + buffer
        unitPrice: 0, // Will be set by supplier
      }));

      await createPurchaseOrder({
        supplier,
        items,
        expectedDelivery: expectedDelivery || undefined,
        notes: notes || undefined,
      });

      onSuccess();
      onOpenChange(false);
      setSupplier('');
      setExpectedDelivery('');
      setNotes('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create purchase order');
    } finally {
      setCreating(false);
    }
  };

  const totalOrderQuantity = selectedAlerts.reduce(
    (sum, alert) => sum + alert.shortage + alert.minStockLevel,
    0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Purchase Order</DialogTitle>
          <DialogDescription>
            Create a purchase order for {selectedAlerts.length} item(s)
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4 py-4">
          {/* Selected Items Preview */}
          <div className="border rounded-lg p-4 space-y-2">
            <h4 className="font-medium">Items to Order</h4>
            {selectedAlerts.map((alert) => (
              <div key={alert.id} className="flex justify-between text-sm">
                <span>{alert.itemName}</span>
                <span className="text-muted-foreground">
                  {alert.shortage + alert.minStockLevel} units
                </span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2 flex justify-between font-medium">
              <span>Total</span>
              <span>{totalOrderQuantity} units</span>
            </div>
          </div>

          {/* Supplier */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Supplier *</label>
            <Input
              placeholder="Enter supplier name"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
            />
          </div>

          {/* Expected Delivery */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Expected Delivery Date</label>
            <Input
              type="date"
              value={expectedDelivery}
              onChange={(e) => setExpectedDelivery(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Notes</label>
            <Input
              placeholder="Additional notes for the order"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateOrder} disabled={creating}>
            {creating ? 'Creating...' : 'Create Order'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AlertsPage() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<LowStockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAlerts, setSelectedAlerts] = useState<Set<string>>(new Set());
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);

  const fetchAlerts = useCallback(async () => {
    if (!user?.merchantId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getLowStockAlerts(user.merchantId);
      setAlerts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  }, [user?.merchantId]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const toggleAlert = (alertId: string) => {
    const newSelected = new Set(selectedAlerts);
    if (newSelected.has(alertId)) {
      newSelected.delete(alertId);
    } else {
      newSelected.add(alertId);
    }
    setSelectedAlerts(newSelected);
  };

  const toggleAll = () => {
    if (selectedAlerts.size === alerts.length) {
      setSelectedAlerts(new Set());
    } else {
      setSelectedAlerts(new Set(alerts.map((a) => a.id)));
    }
  };

  const selectedAlertItems = alerts.filter((a) => selectedAlerts.has(a.id));

  const handleOrderSuccess = () => {
    setSelectedAlerts(new Set());
    fetchAlerts();
  };

  // Group alerts by severity
  const outOfStock = alerts.filter((a) => a.currentQuantity === 0);
  const criticalLow = alerts.filter((a) => a.currentQuantity > 0 && a.shortage >= a.minStockLevel);
  const lowStock = alerts.filter((a) => a.shortage < a.minStockLevel);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/inventory">
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Inventory
            </Button>
          </Link>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
            Low Stock Alerts
          </h1>
          <p className="text-muted-foreground">
            Items that need restocking attention
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchAlerts} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {selectedAlerts.size > 0 && (
            <Button onClick={() => setOrderDialogOpen(true)}>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Create Order ({selectedAlerts.size})
            </Button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700 flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Out of Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{outOfStock.length}</div>
            <p className="text-xs text-red-600">Immediate action required</p>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Critical Low
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">{criticalLow.length}</div>
            <p className="text-xs text-orange-600">Below minimum level</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Low Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">{lowStock.length}</div>
            <p className="text-xs text-yellow-600">Approaching minimum</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <input
                  type="checkbox"
                  checked={selectedAlerts.size === alerts.length && alerts.length > 0}
                  onChange={toggleAll}
                  className="rounded border-gray-300"
                />
              </TableHead>
              <TableHead>Item</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="text-right">Current</TableHead>
              <TableHead className="text-right">Min Level</TableHead>
              <TableHead className="text-right">Shortage</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : alerts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-2" />
                  <p className="text-muted-foreground">All items are well stocked!</p>
                </TableCell>
              </TableRow>
            ) : (
              alerts.map((alert) => (
                <TableRow
                  key={alert.id}
                  className={
                    alert.currentQuantity === 0
                      ? 'bg-red-50'
                      : alert.shortage >= alert.minStockLevel
                      ? 'bg-orange-50'
                      : 'bg-yellow-50'
                  }
                >
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedAlerts.has(alert.id)}
                      onChange={() => toggleAlert(alert.id)}
                      className="rounded border-gray-300"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{alert.itemName}</TableCell>
                  <TableCell className="text-muted-foreground">{alert.sku}</TableCell>
                  <TableCell className="text-right font-bold text-red-600">
                    {alert.currentQuantity}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {alert.minStockLevel}
                  </TableCell>
                  <TableCell className="text-right text-orange-600 font-medium">
                    {alert.shortage}
                  </TableCell>
                  <TableCell>
                    {alert.currentQuantity === 0 ? (
                      <Badge variant="destructive">Out</Badge>
                    ) : alert.shortage >= alert.minStockLevel ? (
                      <Badge variant="warning">Critical</Badge>
                    ) : (
                      <Badge variant="secondary">Low</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(alert.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Quick Order Button */}
      {alerts.length > 0 && selectedAlerts.size === 0 && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Select items above to create a purchase order, or{' '}
            <Button
              variant="link"
              className="p-0 h-auto font-medium"
              onClick={() => {
                setSelectedAlerts(new Set(alerts.map((a) => a.id)));
              }}
            >
              select all
            </Button>
            .
          </AlertDescription>
        </Alert>
      )}

      {/* Create Order Dialog */}
      <CreateOrderDialog
        open={orderDialogOpen}
        onOpenChange={setOrderDialogOpen}
        selectedAlerts={selectedAlertItems}
        onSuccess={handleOrderSuccess}
      />
    </div>
  );
}

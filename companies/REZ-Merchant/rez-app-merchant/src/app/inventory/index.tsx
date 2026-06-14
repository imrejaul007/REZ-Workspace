'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { getInventory, updateStock, InventoryItem } from '@/services/inventoryService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Package,
  AlertTriangle,
  Search,
  RefreshCw,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  Edit3,
} from 'lucide-react';

const ITEMS_PER_PAGE = 10;

export default function InventoryPage() {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Stock update dialog
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [newQuantity, setNewQuantity] = useState('');
  const [updateReason, setUpdateReason] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchInventory = useCallback(async () => {
    if (!user?.merchantId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await getInventory(user.merchantId, {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: searchQuery || undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
      });

      setInventory(response.data);
      setTotalPages(response.totalPages);
      setTotalItems(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  }, [user?.merchantId, currentPage, searchQuery, categoryFilter]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleStockUpdate = async () => {
    if (!selectedItem || !newQuantity) return;

    setUpdating(true);
    try {
      await updateStock(selectedItem.id, {
        quantity: parseInt(newQuantity, 10),
        reason: updateReason || undefined,
      });
      setUpdateDialogOpen(false);
      setSelectedItem(null);
      setNewQuantity('');
      setUpdateReason('');
      fetchInventory();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update stock');
    } finally {
      setUpdating(false);
    }
  };

  const openUpdateDialog = (item: InventoryItem) => {
    setSelectedItem(item);
    setNewQuantity(item.quantity.toString());
    setUpdateReason('');
    setUpdateDialogOpen(true);
  };

  const isLowStock = (item: InventoryItem) => item.quantity <= item.minStockLevel;
  const isOutOfStock = (item: InventoryItem) => item.quantity === 0;

  const categories = Array.from(new Set(inventory.map((item) => item.category).filter(Boolean))) as string[];

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="h-8 w-8" />
            Inventory
          </h1>
          <p className="text-muted-foreground">
            Manage your stock levels and track inventory
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchInventory} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link href="/inventory/alerts">
            <Button variant="outline">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Low Stock Alerts
            </Button>
          </Link>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {inventory.filter((i) => !isLowStock(i)).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Low Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {inventory.filter((i) => isLowStock(i) && !isOutOfStock(i)).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Out of Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {inventory.filter(isOutOfStock).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or SKU..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={(value) => {
          setCategoryFilter(value);
          setCurrentPage(1);
        }}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Inventory Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Min Level</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : inventory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No inventory items found
                </TableCell>
              </TableRow>
            ) : (
              inventory.map((item) => (
                <TableRow key={item.id} className={isOutOfStock(item) ? 'bg-red-50' : isLowStock(item) ? 'bg-yellow-50' : ''}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-muted-foreground">{item.sku}</TableCell>
                  <TableCell>{item.category || '-'}</TableCell>
                  <TableCell className="text-right">
                    <span className={isOutOfStock(item) ? 'text-red-600 font-bold' : isLowStock(item) ? 'text-yellow-600 font-bold' : ''}>
                      {item.quantity} {item.unit}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {item.minStockLevel} {item.unit}
                  </TableCell>
                  <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                  <TableCell>
                    {isOutOfStock(item) ? (
                      <Badge variant="destructive">Out of Stock</Badge>
                    ) : isLowStock(item) ? (
                      <Badge variant="warning">Low Stock</Badge>
                    ) : (
                      <Badge variant="success">In Stock</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => openUpdateDialog(item)}>
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
            {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of {totalItems} items
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="flex items-center px-4">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Update Stock Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Stock - {selectedItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Current Stock:</span>
              <span className="font-medium">
                {selectedItem?.quantity} {selectedItem?.unit}
              </span>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">New Quantity</label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setNewQuantity((prev) => Math.max(0, parseInt(prev || '0', 10) - 1).toString())}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(e.target.value)}
                  className="text-center"
                  min="0"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setNewQuantity((prev) => (parseInt(prev || '0', 10) + 1).toString())}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason (optional)</label>
              <Input
                placeholder="e.g., Restocked, Damaged, Inventory count"
                value={updateReason}
                onChange={(e) => setUpdateReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStockUpdate} disabled={updating || !newQuantity}>
              {updating ? 'Updating...' : 'Update Stock'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

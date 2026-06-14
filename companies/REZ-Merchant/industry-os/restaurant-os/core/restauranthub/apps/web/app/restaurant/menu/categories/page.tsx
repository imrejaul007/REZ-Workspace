'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  FolderOpen,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Save,
  X,
  Check,
  GripVertical,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { menuApi, MenuCategory } from '@/lib/api/menu';

export default function MenuCategoryManagement() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState<string | null>(null); // id being saved
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    isActive: true,
    displayOrder: 0,
  });

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cats = await menuApi.getCategories();
      setCategories(cats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCreateCategory = async () => {
    if (!newCategory.name.trim()) return;
    setCreateError(null);
    setCreating(true);
    try {
      const created = await menuApi.createCategory({
        name: newCategory.name,
        description: newCategory.description || undefined,
        isActive: newCategory.isActive,
        displayOrder: newCategory.displayOrder,
      });
      setCategories(prev => [...prev, created]);
      setNewCategory({ name: '', description: '', isActive: true, displayOrder: 0 });
      setShowCreateDialog(false);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create category');
    } finally {
      setCreating(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingCategory) return;
    setSaving(editingCategory.id);
    try {
      const updated = await menuApi.updateCategory(editingCategory.id, {
        name: editingCategory.name,
        description: editingCategory.description,
      });
      setCategories(prev => prev.map(c => (c.id === updated.id ? updated : c)));
      setEditingCategory(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(null);
    }
  };

  const handleToggleActive = async (cat: MenuCategory) => {
    setSaving(cat.id);
    try {
      const updated = await menuApi.updateCategory(cat.id, { isActive: !cat.isActive });
      setCategories(prev => prev.map(c => (c.id === updated.id ? updated : c)));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category? Items in it will not be deleted.')) return;
    try {
      await menuApi.deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const moveCategory = async (id: string, direction: 'up' | 'down') => {
    const idx = categories.findIndex(c => c.id === id);
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= categories.length) return;

    const reordered = [...categories];
    [reordered[idx], reordered[newIdx]] = [reordered[newIdx], reordered[idx]];

    // Optimistic update
    setCategories(reordered);

    // Persist the new display orders
    try {
      await Promise.all([
        menuApi.updateCategory(reordered[idx].id, { displayOrder: idx }),
        menuApi.updateCategory(reordered[newIdx].id, { displayOrder: newIdx }),
      ]);
    } catch {
      // Revert on failure
      fetchCategories();
    }
  };

  const stats = {
    total: categories.length,
    visible: categories.filter(c => c.isActive).length,
    hidden: categories.filter(c => !c.isActive).length,
    totalItems: categories.reduce((sum, c) => sum + (c._count?.menuItems ?? 0), 0),
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Menu Categories</h1>
            <p className="text-muted-foreground">Organize your menu items into categories</p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Category</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {createError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{createError}</AlertDescription>
                  </Alert>
                )}
                <div>
                  <Label htmlFor="new-name">Category Name *</Label>
                  <Input
                    id="new-name"
                    value={newCategory.name}
                    onChange={e => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Appetizers, Main Courses"
                  />
                </div>
                <div>
                  <Label htmlFor="new-desc">Description</Label>
                  <Textarea
                    id="new-desc"
                    value={newCategory.description}
                    onChange={e => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of this category"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="new-order">Display Order</Label>
                    <Input
                      id="new-order"
                      type="number"
                      min="0"
                      value={newCategory.displayOrder}
                      onChange={e =>
                        setNewCategory(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))
                      }
                    />
                  </div>
                  <div className="flex items-end pb-1">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={newCategory.isActive}
                        onCheckedChange={v => setNewCategory(prev => ({ ...prev, isActive: v }))}
                      />
                      <Label>Active</Label>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateCategory} disabled={!newCategory.name.trim() || creating}>
                    {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Create Category
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}{' '}
              <Button variant="link" className="p-0 h-auto" onClick={fetchCategories}>
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Total Categories', value: stats.total, icon: FolderOpen, color: 'text-blue-500' },
                { label: 'Active', value: stats.visible, icon: Eye, color: 'text-green-500' },
                { label: 'Inactive', value: stats.hidden, icon: EyeOff, color: 'text-gray-500' },
                { label: 'Total Items', value: stats.totalItems, icon: FolderOpen, color: 'text-purple-500' },
              ].map((stat, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                          <h3 className="text-2xl font-bold mt-2">{stat.value}</h3>
                        </div>
                        <stat.icon className={`h-8 w-8 ${stat.color}`} />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card>
                <CardHeader>
                  <CardTitle>Category Management</CardTitle>
                </CardHeader>
                <CardContent>
                  {categories.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
                      <p>No categories yet. Create your first category above.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {categories.map((category, index) => (
                        <motion.div
                          key={category.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`p-4 border rounded-lg transition-all ${
                            editingCategory?.id === category.id
                              ? 'border-blue-300 bg-blue-50'
                              : 'hover:bg-gray-50'
                          }`}
                          draggable
                          onDragStart={() => setDraggedId(category.id)}
                          onDragOver={e => e.preventDefault()}
                          onDrop={() => {
                            if (draggedId && draggedId !== category.id) {
                              const from = categories.findIndex(c => c.id === draggedId);
                              const to = categories.findIndex(c => c.id === category.id);
                              const reordered = [...categories];
                              const [removed] = reordered.splice(from, 1);
                              reordered.splice(to, 0, removed);
                              setCategories(reordered);
                              setDraggedId(null);
                            }
                          }}
                        >
                          <div className="flex items-center space-x-4">
                            <GripVertical className="h-5 w-5 text-gray-400 cursor-grab flex-shrink-0" />

                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <FolderOpen className="h-5 w-5 text-primary" />
                            </div>

                            <div className="flex-1">
                              {editingCategory?.id === category.id ? (
                                <div className="space-y-2">
                                  <Input
                                    value={editingCategory.name}
                                    onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })}
                                    className="font-semibold"
                                  />
                                  <Textarea
                                    value={editingCategory.description ?? ''}
                                    onChange={e =>
                                      setEditingCategory({ ...editingCategory, description: e.target.value })
                                    }
                                    rows={2}
                                  />
                                </div>
                              ) : (
                                <div>
                                  <h3 className="font-semibold text-lg">{category.name}</h3>
                                  <p className="text-gray-600 text-sm">{category.description}</p>
                                  <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                                    <span>Items: {category._count?.menuItems ?? 0}</span>
                                    <span>Order: {category.displayOrder}</span>
                                    <span>Updated: {new Date(category.updatedAt).toLocaleDateString()}</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center space-x-2 flex-shrink-0">
                              <Badge variant={category.isActive ? 'default' : 'secondary'}>
                                {category.isActive ? 'Active' : 'Inactive'}
                              </Badge>

                              {editingCategory?.id === category.id ? (
                                <div className="flex items-center space-x-1">
                                  <Button
                                    size="sm"
                                    onClick={handleSaveEdit}
                                    disabled={saving === category.id}
                                  >
                                    {saving === category.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Check className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => setEditingCategory(null)}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => moveCategory(category.id, 'up')}
                                    disabled={index === 0}
                                  >
                                    <ArrowUp className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => moveCategory(category.id, 'down')}
                                    disabled={index === categories.length - 1}
                                  >
                                    <ArrowDown className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleToggleActive(category)}
                                    disabled={saving === category.id}
                                  >
                                    {saving === category.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : category.isActive ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setEditingCategory({ ...category })}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDelete(category.id)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

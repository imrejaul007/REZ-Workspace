'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Eye,
  EyeOff,
  Star,
  Clock,
  ChefHat,
  Package,
  CheckCircle,
  Utensils,
  Coffee,
  Cake,
  Pizza,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useAuth } from '@/lib/auth/auth-provider';
import { cn } from '@/lib/utils';
import { menuApi, MenuCategory, MenuItem } from '@/lib/api/menu';

export default function MenuManagementPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUnavailable, setShowUnavailable] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cats, items] = await Promise.all([
        menuApi.getCategories(),
        menuApi.getMenuItems(),
      ]);
      setCategories(cats);
      setMenuItems(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load menu data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Delete this menu item?')) return;
    try {
      await menuApi.deleteMenuItem(id);
      setMenuItems(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete item');
    }
  };

  const handleToggleAvailability = async (id: string) => {
    try {
      const updated = await menuApi.toggleAvailability(id);
      setMenuItems(prev =>
        prev.map(i => (i.id === id ? { ...i, isAvailable: updated.isAvailable } : i)),
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to toggle availability');
    }
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description ?? '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || item.categoryId === selectedCategory;
    const matchesAvailability = showUnavailable || item.isAvailable;
    return matchesSearch && matchesCategory && matchesAvailability;
  });

  const MenuItemCard = ({ item }: { item: MenuItem }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn('group hover:shadow-lg transition-all duration-300', !item.isAvailable && 'opacity-60')}>
        <CardContent className="p-4">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
              <ChefHat className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-foreground line-clamp-1">{item.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => (window.location.href = `/restaurant/menu/${item.id}/edit`)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    title={item.isAvailable ? 'Mark unavailable' : 'Mark available'}
                    onClick={() => handleToggleAvailability(item.id)}
                  >
                    {item.isAvailable ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                    onClick={() => handleDeleteItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {item.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {!item.isAvailable && (
                  <Badge variant="destructive" className="text-xs">
                    Unavailable
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-4">
                  {item.preparationTime && (
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>{item.preparationTime}min</span>
                    </div>
                  )}
                  {item.category && (
                    <span className="text-muted-foreground text-xs">{item.category.name}</span>
                  )}
                </div>
                <span className="text-lg font-bold text-foreground">
                  &#8377;{item.basePrice.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const CategoryCard = ({ category }: { category: MenuCategory }) => (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
      <Card
        className={cn(
          'cursor-pointer hover:shadow-lg transition-all duration-300',
          selectedCategory === category.id && 'ring-2 ring-primary ring-offset-2',
          !category.isActive && 'opacity-60',
        )}
        onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
      >
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Utensils className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{category.name}</h3>
              <p className="text-sm text-muted-foreground">
                {category._count?.menuItems ?? 0} items
              </p>
            </div>
            {!category.isActive && (
              <Badge variant="secondary" className="text-xs">
                Inactive
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Menu Management</h1>
            <p className="text-muted-foreground mt-1">Manage your restaurant's menu items and categories</p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <Button variant="outline" onClick={() => (window.location.href = '/restaurant/menu/categories')}>
              <Package className="h-4 w-4 mr-2" />
              Categories
            </Button>
            <Button onClick={() => (window.location.href = '/restaurant/menu/create')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </div>

        {error && (
          <Card className="border-destructive">
            <CardContent className="p-4 flex items-center space-x-3 text-destructive">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p>{error}</p>
              <Button variant="outline" size="sm" onClick={fetchData} className="ml-auto">
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { title: 'Total Items', value: menuItems.length, icon: Utensils, color: 'text-blue-600', bgColor: 'bg-blue-100' },
                { title: 'Available', value: menuItems.filter(i => i.isAvailable).length, icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' },
                { title: 'Categories', value: categories.filter(c => c.isActive).length, icon: Package, color: 'text-purple-600', bgColor: 'bg-purple-100' },
                { title: 'Unavailable', value: menuItems.filter(i => !i.isAvailable).length, icon: EyeOff, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
              ].map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className={cn('p-2 rounded-lg', stat.bgColor)}>
                          <Icon className={cn('h-5 w-5', stat.color)} />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                          <p className="text-sm text-muted-foreground">{stat.title}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Categories</CardTitle>
                    <CardDescription>Filter by category</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div
                      className={cn(
                        'p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent',
                        selectedCategory === null && 'bg-primary/10 text-primary',
                      )}
                      onClick={() => setSelectedCategory(null)}
                    >
                      <div className="flex items-center space-x-2">
                        <Utensils className="h-4 w-4" />
                        <span className="font-medium">All Items</span>
                        <span className="text-sm text-muted-foreground ml-auto">{menuItems.length}</span>
                      </div>
                    </div>
                    {categories.map(cat => (
                      <CategoryCard key={cat.id} category={cat} />
                    ))}
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-3 space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Search menu items..."
                          className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <Button
                        variant={showUnavailable ? 'default' : 'outline'}
                        onClick={() => setShowUnavailable(!showUnavailable)}
                      >
                        <EyeOff className="h-4 w-4 mr-2" />
                        Show Unavailable
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-3">
                  {filteredItems.length === 0 ? (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <ChefHat className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">No menu items found</h3>
                        <p className="text-muted-foreground mb-6">
                          {searchQuery ? 'Try adjusting your search query' : 'Start by adding your first menu item'}
                        </p>
                        <Button onClick={() => (window.location.href = '/restaurant/menu/create')}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add First Item
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    filteredItems.map(item => <MenuItemCard key={item.id} item={item} />)
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

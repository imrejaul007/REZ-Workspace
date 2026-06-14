'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Save,
  AlertTriangle,
  Plus,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { menuApi, MenuCategory, MenuItem } from '@/lib/api/menu';

const ALLERGEN_OPTIONS = [
  'Gluten', 'Dairy', 'Eggs', 'Nuts', 'Peanuts', 'Soy', 'Fish', 'Shellfish', 'Sesame', 'Mustard',
];

const TAG_OPTIONS = [
  'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Low-Carb', 'Keto', 'Halal', 'Kosher',
  'Spicy', 'Popular', 'Chef Special', 'Seasonal',
];

export default function EditMenuItem() {
  const params = useParams();
  const router = useRouter();
  const itemId = params.id as string;

  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [item, setItem] = useState<Partial<MenuItem> & { allergens: string[]; tags: string[] }>({
    name: '',
    description: '',
    basePrice: 0,
    categoryId: '',
    isAvailable: true,
    preparationTime: undefined,
    calories: undefined,
    allergens: [],
    tags: [],
    displayOrder: 0,
  });

  useEffect(() => {
    Promise.all([
      menuApi.getMenuItem(itemId),
      menuApi.getCategories(),
    ])
      .then(([menuItem, cats]) => {
        setItem({
          ...menuItem,
          allergens: menuItem.allergens ?? [],
          tags: menuItem.tags ?? [],
        });
        setCategories(cats);
      })
      .catch(err => setLoadError(err instanceof Error ? err.message : 'Failed to load item'))
      .finally(() => setPageLoading(false));
  }, [itemId]);

  const handleInputChange = (field: string, value) => {
    setItem(prev => ({ ...prev, [field]: value }));
  };

  const toggleAllergen = (allergen: string) => {
    setItem(prev => ({
      ...prev,
      allergens: prev.allergens.includes(allergen)
        ? prev.allergens.filter(a => a !== allergen)
        : [...prev.allergens, allergen],
    }));
  };

  const toggleTag = (tag: string) => {
    setItem(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const handleSave = async () => {
    setSaveError(null);
    setSaving(true);
    try {
      await menuApi.updateMenuItem(itemId, {
        name: item.name,
        description: item.description,
        basePrice: item.basePrice,
        categoryId: item.categoryId,
        isAvailable: item.isAvailable,
        preparationTime: item.preparationTime,
        calories: item.calories,
        allergens: item.allergens,
        tags: item.tags,
        displayOrder: item.displayOrder,
      });
      router.push('/restaurant/menu');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (pageLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (loadError) {
    return (
      <DashboardLayout>
        <Alert variant="destructive" className="max-w-xl mx-auto mt-12">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Menu
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Edit Menu Item</h1>
              <p className="text-muted-foreground">Update item details and settings</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        {saveError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{saveError}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Item Name</Label>
                    <Input
                      id="name"
                      value={item.name ?? ''}
                      onChange={e => handleInputChange('name', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={item.description ?? ''}
                      onChange={e => handleInputChange('description', e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">Price (Rs.)</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.basePrice ?? 0}
                        onChange={e => handleInputChange('basePrice', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={item.categoryId ?? ''}
                        onValueChange={value => handleInputChange('categoryId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="prepTime">Preparation Time (minutes)</Label>
                      <Input
                        id="prepTime"
                        type="number"
                        min="1"
                        value={item.preparationTime ?? ''}
                        onChange={e =>
                          handleInputChange(
                            'preparationTime',
                            e.target.value ? parseInt(e.target.value) : undefined,
                          )
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="calories">Calories</Label>
                      <Input
                        id="calories"
                        type="number"
                        min="0"
                        value={item.calories ?? ''}
                        onChange={e =>
                          handleInputChange(
                            'calories',
                            e.target.value ? parseInt(e.target.value) : undefined,
                          )
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <Card>
                <CardHeader>
                  <CardTitle>Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="available">Available</Label>
                    <Switch
                      id="available"
                      checked={item.isAvailable ?? true}
                      onCheckedChange={checked => handleInputChange('isAvailable', checked)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="displayOrder">Display Order</Label>
                    <Input
                      id="displayOrder"
                      type="number"
                      min="0"
                      value={item.displayOrder ?? 0}
                      onChange={e => handleInputChange('displayOrder', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
                    Allergens
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {ALLERGEN_OPTIONS.map(allergen => (
                      <Badge
                        key={allergen}
                        variant={item.allergens.includes(allergen) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleAllergen(allergen)}
                      >
                        {allergen}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {TAG_OPTIONS.map(tag => (
                      <Badge
                        key={tag}
                        variant={item.tags.includes(tag) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

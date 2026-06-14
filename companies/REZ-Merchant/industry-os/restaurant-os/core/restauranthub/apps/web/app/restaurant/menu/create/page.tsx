'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Upload, Plus, Minus, AlertTriangle, Info, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { menuApi, MenuCategory } from '@/lib/api/menu';

const AVAILABLE_ALLERGENS = [
  'Gluten', 'Dairy', 'Eggs', 'Fish', 'Shellfish', 'Tree Nuts',
  'Peanuts', 'Soy', 'Sesame', 'Mustard',
];

const AVAILABLE_TAGS = [
  'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Keto',
  'Low-Carb', 'High-Protein', 'Organic', 'Local', 'Spicy',
];

export default function CreateMenuItem() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [item, setItem] = useState({
    name: '',
    description: '',
    basePrice: '',
    categoryId: '',
    isAvailable: true,
    preparationTime: '',
    calories: '',
    allergens: [] as string[],
    tags: [] as string[],
    displayOrder: '',
  });

  useEffect(() => {
    menuApi.getCategories()
      .then(cats => setCategories(cats.filter(c => c.isActive)))
      .catch(() => {})
      .finally(() => setCategoriesLoading(false));
  }, []);

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
    setSubmitError(null);
    setLoading(true);
    try {
      await menuApi.createMenuItem({
        name: item.name,
        categoryId: item.categoryId,
        description: item.description || undefined,
        basePrice: parseFloat(item.basePrice),
        isAvailable: item.isAvailable,
        preparationTime: item.preparationTime ? parseInt(item.preparationTime) : undefined,
        calories: item.calories ? parseInt(item.calories) : undefined,
        allergens: item.allergens,
        tags: item.tags,
        displayOrder: item.displayOrder ? parseInt(item.displayOrder) : undefined,
      });
      router.push('/restaurant/menu');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to create menu item');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    item.name.trim() !== '' &&
    item.basePrice !== '' &&
    item.categoryId !== '' &&
    item.preparationTime !== '';

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
              <h1 className="text-2xl font-bold">Create Menu Item</h1>
              <p className="text-muted-foreground">Add a new item to your menu</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={!isFormValid || loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {loading ? 'Creating...' : 'Create Item'}
          </Button>
        </div>

        {submitError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        {!isFormValid && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Please fill in all required fields: Name, Price, Category, and Preparation Time.
            </AlertDescription>
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
                    <Label htmlFor="name">Item Name *</Label>
                    <Input
                      id="name"
                      value={item.name}
                      onChange={e => handleInputChange('name', e.target.value)}
                      placeholder="e.g., Margherita Pizza"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={item.description}
                      onChange={e => handleInputChange('description', e.target.value)}
                      placeholder="Describe your dish..."
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Category *</Label>
                      {categoriesLoading ? (
                        <div className="flex items-center h-10 text-muted-foreground text-sm">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading...
                        </div>
                      ) : (
                        <Select
                          value={item.categoryId}
                          onValueChange={value => handleInputChange('categoryId', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(cat => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="price">Price (Rs.) *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.basePrice}
                        onChange={e => handleInputChange('basePrice', e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="prepTime">Preparation Time (minutes) *</Label>
                      <Input
                        id="prepTime"
                        type="number"
                        min="1"
                        value={item.preparationTime}
                        onChange={e => handleInputChange('preparationTime', e.target.value)}
                        placeholder="15"
                      />
                    </div>
                    <div>
                      <Label htmlFor="calories">Calories</Label>
                      <Input
                        id="calories"
                        type="number"
                        min="0"
                        value={item.calories}
                        onChange={e => handleInputChange('calories', e.target.value)}
                        placeholder="320"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="displayOrder">Display Order</Label>
                      <Input
                        id="displayOrder"
                        type="number"
                        min="0"
                        value={item.displayOrder}
                        onChange={e => handleInputChange('displayOrder', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div className="flex items-end pb-1">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="available"
                          checked={item.isAvailable}
                          onCheckedChange={checked => handleInputChange('isAvailable', !!checked)}
                        />
                        <Label htmlFor="available">Available immediately</Label>
                      </div>
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
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
                    Allergens
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {AVAILABLE_ALLERGENS.map(allergen => (
                      <div key={allergen} className="flex items-center space-x-2">
                        <Checkbox
                          id={`allergen-${allergen}`}
                          checked={item.allergens.includes(allergen)}
                          onCheckedChange={() => toggleAllergen(allergen)}
                        />
                        <Label htmlFor={`allergen-${allergen}`} className="text-sm">
                          {allergen}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {item.allergens.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {item.allergens.map(a => (
                        <Badge key={a} className="bg-red-500 text-xs">
                          {a}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {AVAILABLE_TAGS.map(tag => (
                      <div key={tag} className="flex items-center space-x-2">
                        <Checkbox
                          id={`tag-${tag}`}
                          checked={item.tags.includes(tag)}
                          onCheckedChange={() => toggleTag(tag)}
                        />
                        <Label htmlFor={`tag-${tag}`} className="text-sm">
                          {tag}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {item.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {item.tags.map(t => (
                        <Badge key={t} className="bg-green-500 text-xs">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

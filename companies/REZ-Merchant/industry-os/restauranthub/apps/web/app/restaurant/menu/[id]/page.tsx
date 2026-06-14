'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit, Trash2, Eye, EyeOff, DollarSign, Clock, Users, Star, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function MenuItemDetails() {
  const params = useParams();
  const router = useRouter();
  const itemId = params.id as string;
  
  const [item, setItem] = useState({
    id: itemId,
    name: 'Margherita Pizza',
    description: 'Classic pizza with tomato sauce, mozzarella cheese, and fresh basil',
    price: 18.99,
    category: 'Pizza',
    image: '',
    ingredients: ['Tomato sauce', 'Mozzarella cheese', 'Fresh basil', 'Olive oil'],
    allergens: ['Gluten', 'Dairy'],
    nutritionInfo: {
      calories: 320,
      protein: 14,
      carbs: 35,
      fat: 12
    },
    preparationTime: 15,
    servingSize: '1 pizza (8 slices)',
    available: true,
    popular: true,
    spicyLevel: 0,
    dietaryTags: ['Vegetarian'],
    stats: {
      ordered: 245,
      rating: 4.7,
      reviews: 89,
      revenue: 4375.55
    }
  });

  const handleToggleAvailability = () => {
    setItem(prev => ({ ...prev, available: !prev.available }));
  };

  const handleEdit = () => {
    router.push(`/restaurant/menu/${itemId}/edit`);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this menu item?')) {
      router.push('/restaurant/menu');
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost"  onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Menu
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{item.name}</h1>
              <p className="text-muted-foreground">{item.category}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm">Available</span>
              <Switch
                checked={item.available}
                onCheckedChange={handleToggleAvailability}
              />
            </div>
            <Button variant="outline" onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {!item.available && (
          <Alert>
            <EyeOff className="h-4 w-4" />
            <AlertDescription>
              This item is currently unavailable and hidden from customers.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Item Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Item Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <div className="text-center text-gray-500">
                        <div className="text-4xl mb-2">🍕</div>
                        <p>No image uploaded</p>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-gray-600">{item.description}</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-2" />
                      <div className="font-semibold text-green-700">${item.price}</div>
                      <div className="text-sm text-green-600">Price</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                      <div className="font-semibold text-blue-700">{item.preparationTime}m</div>
                      <div className="text-sm text-blue-600">Prep Time</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <Users className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                      <div className="font-semibold text-purple-700">{item.stats.ordered}</div>
                      <div className="text-sm text-purple-600">Orders</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <Star className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
                      <div className="font-semibold text-yellow-700">{item.stats.rating}</div>
                      <div className="text-sm text-yellow-600">Rating</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Ingredients */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Ingredients</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {item.ingredients.map((ingredient, index) => (
                      <Badge key={index} variant="outline">
                        {ingredient}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Nutrition Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Nutrition Information</CardTitle>
                  <p className="text-sm text-muted-foreground">Per serving: {item.servingSize}</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{item.nutritionInfo.calories}</div>
                      <div className="text-sm text-gray-600">Calories</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{item.nutritionInfo.protein}g</div>
                      <div className="text-sm text-gray-600">Protein</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{item.nutritionInfo.carbs}g</div>
                      <div className="text-sm text-gray-600">Carbs</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{item.nutritionInfo.fat}g</div>
                      <div className="text-sm text-gray-600">Fat</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Available</span>
                    <Badge variant={item.available ? "default" : "secondary"}>
                      {item.available ? (
                        <>
                          <Eye className="h-3 w-3 mr-1" />
                          Visible
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3 mr-1" />
                          Hidden
                        </>
                      )}
                    </Badge>
                  </div>
                  {item.popular && (
                    <div className="flex items-center justify-between">
                      <span>Popular Item</span>
                      <Badge className="bg-purple-500">
                        <Star className="h-3 w-3 mr-1" />
                        Popular
                      </Badge>
                    </div>
                  )}
                  {item.spicyLevel > 0 && (
                    <div className="flex items-center justify-between">
                      <span>Spicy Level</span>
                      <span>{'🌶️'.repeat(item.spicyLevel)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Allergens */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
                    Allergens
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {item.allergens.map((allergen, index) => (
                      <Badge key={index} className="bg-red-500">
                        {allergen}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Dietary Tags */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Dietary Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {item.dietaryTags.map((tag, index) => (
                      <Badge key={index} className="bg-green-500">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Performance */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Revenue</span>
                    <span className="font-semibold">${item.stats.revenue.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Orders</span>
                    <span className="font-semibold">{item.stats.ordered}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Customer Rating</span>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 mr-1" />
                      <span className="font-semibold">{item.stats.rating}</span>
                      <span className="text-sm text-gray-500 ml-1">({item.stats.reviews})</span>
                    </div>
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
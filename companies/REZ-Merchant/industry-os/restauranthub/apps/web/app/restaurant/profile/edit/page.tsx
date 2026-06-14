'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Upload, MapPin, Phone, Mail, Globe, Clock, Image, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function EditRestaurantProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [restaurant, setRestaurant] = useState({
    name: 'Bella Vista Italian',
    description: 'Authentic Italian cuisine in the heart of the city with fresh ingredients and traditional recipes.',
    cuisine: 'italian',
    address: '456 Restaurant Ave',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    phone: '+1 (555) 123-4567',
    email: 'info@bellavista.com',
    website: 'https://bellavista.com',
    priceRange: '$$',
    capacity: 120,
    establishedYear: 2010,
    features: ['outdoor_seating', 'takeout', 'delivery', 'wifi'],
    hours: {
      monday: { open: '11:00', close: '22:00', closed: false },
      tuesday: { open: '11:00', close: '22:00', closed: false },
      wednesday: { open: '11:00', close: '22:00', closed: false },
      thursday: { open: '11:00', close: '22:00', closed: false },
      friday: { open: '11:00', close: '23:00', closed: false },
      saturday: { open: '10:00', close: '23:00', closed: false },
      sunday: { open: '10:00', close: '21:00', closed: false }
    }
  });

  const cuisineTypes = [
    'american', 'italian', 'mexican', 'chinese', 'japanese', 'indian', 'french', 
    'mediterranean', 'thai', 'korean', 'vietnamese', 'greek', 'spanish', 'other'
  ];

  const availableFeatures = [
    { id: 'outdoor_seating', label: 'Outdoor Seating' },
    { id: 'takeout', label: 'Takeout' },
    { id: 'delivery', label: 'Delivery' },
    { id: 'wifi', label: 'Free WiFi' },
    { id: 'parking', label: 'Parking Available' },
    { id: 'wheelchair_accessible', label: 'Wheelchair Accessible' },
    { id: 'live_music', label: 'Live Music' },
    { id: 'private_dining', label: 'Private Dining' },
    { id: 'catering', label: 'Catering' },
    { id: 'bar', label: 'Full Bar' }
  ];

  const handleInputChange = (field: string, value) => {
    setRestaurant(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleHoursChange = (day: string, field: string, value) => {
    setRestaurant(prev => ({
      ...prev,
      hours: {
        ...prev.hours,
        [day]: {
          ...prev.hours[day as keyof typeof prev.hours],
          [field]: value
        }
      }
    }));
  };

  const toggleFeature = (featureId: string) => {
    setRestaurant(prev => ({
      ...prev,
      features: prev.features.includes(featureId)
        ? prev.features.filter(f => f !== featureId)
        : [...prev.features, featureId]
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push('/restaurant/profile');
    } catch (error) {
      console.error('Error saving restaurant profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost"  onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Profile
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Edit Restaurant Profile</h1>
              <p className="text-muted-foreground">Update your restaurant information</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Restaurant Name</Label>
                    <Input
                      id="name"
                      value={restaurant.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={restaurant.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cuisine">Cuisine Type</Label>
                      <Select value={restaurant.cuisine} onValueChange={(value) => handleInputChange('cuisine', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {cuisineTypes.map(cuisine => (
                            <SelectItem key={cuisine} value={cuisine}>
                              {cuisine.charAt(0).toUpperCase() + cuisine.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="priceRange">Price Range</Label>
                      <Select value={restaurant.priceRange} onValueChange={(value) => handleInputChange('priceRange', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="$">$ - Budget</SelectItem>
                          <SelectItem value="$$">$$ - Moderate</SelectItem>
                          <SelectItem value="$$$">$$$ - Expensive</SelectItem>
                          <SelectItem value="$$$$">$$$$ - Very Expensive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="capacity">Seating Capacity</Label>
                      <Input
                        id="capacity"
                        type="number"
                        value={restaurant.capacity}
                        onChange={(e) => handleInputChange('capacity', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="established">Established Year</Label>
                      <Input
                        id="established"
                        type="number"
                        value={restaurant.establishedYear}
                        onChange={(e) => handleInputChange('establishedYear', parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Location & Contact */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Location & Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      value={restaurant.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={restaurant.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={restaurant.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="zipCode">Zip Code</Label>
                      <Input
                        id="zipCode"
                        value={restaurant.zipCode}
                        onChange={(e) => handleInputChange('zipCode', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={restaurant.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={restaurant.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={restaurant.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Operating Hours */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Operating Hours
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(restaurant.hours).map(([day, hours]) => (
                    <div key={day} className="flex items-center space-x-4">
                      <div className="w-24">
                        <span className="font-medium capitalize">{day}</span>
                      </div>
                      <Checkbox
                        id={`${day}-closed`}
                        checked={hours.closed}
                        onChange={(e) => handleHoursChange(day, 'closed', (e.target as HTMLInputElement).checked)}
                      />
                      <Label htmlFor={`${day}-closed`} className="text-sm">Closed</Label>
                      {!hours.closed && (
                        <>
                          <Input
                            type="time"
                            value={hours.open}
                            onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                            className="w-32"
                          />
                          <span>to</span>
                          <Input
                            type="time"
                            value={hours.close}
                            onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                            className="w-32"
                          />
                        </>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Restaurant Photo */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Restaurant Photo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                    <div className="text-center">
                      <Image className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">Upload restaurant photo</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Photo
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Restaurant Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {availableFeatures.map(feature => (
                      <div key={feature.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={feature.id}
                          checked={restaurant.features.includes(feature.id)}
                          onCheckedChange={() => toggleFeature(feature.id)}
                        />
                        <Label htmlFor={feature.id} className="text-sm">
                          {feature.label}
                        </Label>
                      </div>
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
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Camera, 
  Save, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Building,
  Globe
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function EditProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    dateOfBirth: '1990-01-15',
    address: '123 Main Street',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'United States',
    bio: 'Experienced restaurant professional with a passion for great food and customer service.',
    website: 'https://johndoe.com',
    company: 'RestoPapa',
    position: 'Manager'
  });

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Save profile data
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      router.push('/profile');
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Edit Profile</h1>
              <p className="text-muted-foreground">Update your personal information</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Picture */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Camera className="h-5 w-5 mr-2" />
                  Profile Picture
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                    JD
                  </div>
                  <Button
                    
                    className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-center">
                  <Button variant="outline" >
                    Change Photo
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    JPG, PNG or GIF. Max size 5MB
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Profile Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={profileData.firstName}
                      onChange={(e) => e.target.value}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={profileData.lastName}
                      onChange={(e) => e.target.value}
                    />
                  </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email" className="flex items-center">
                      <Mail className="h-4 w-4 mr-1" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => e.target.value}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="flex items-center">
                      <Phone className="h-4 w-4 mr-1" />
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => e.target.value}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="dateOfBirth" className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Date of Birth
                  </Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={profileData.dateOfBirth}
                    onChange={(e) => e.target.value}
                  />
                </div>

                {/* Address */}
                <div className="space-y-4">
                  <Label className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    Address
                  </Label>
                  <Input
                    placeholder="Street Address"
                    value={profileData.address}
                    onChange={(e) => e.target.value}
                  />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Input
                      placeholder="City"
                      value={profileData.city}
                      onChange={(e) => e.target.value}
                    />
                    <Input
                      placeholder="State"
                      value={profileData.state}
                      onChange={(e) => e.target.value}
                    />
                    <Input
                      placeholder="Zip Code"
                      value={profileData.zipCode}
                      onChange={(e) => e.target.value}
                    />
                    <Select value={profileData.country} onValueChange={(value) => handleInputChange('country', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="United States">United States</SelectItem>
                        <SelectItem value="Canada">Canada</SelectItem>
                        <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                        <SelectItem value="Australia">Australia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Professional Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company" className="flex items-center">
                      <Building className="h-4 w-4 mr-1" />
                      Company
                    </Label>
                    <Input
                      id="company"
                      value={profileData.company}
                      onChange={(e) => e.target.value}
                    />
                  </div>
                  <div>
                    <Label htmlFor="position">Position</Label>
                    <Input
                      id="position"
                      value={profileData.position}
                      onChange={(e) => e.target.value}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="website" className="flex items-center">
                    <Globe className="h-4 w-4 mr-1" />
                    Website
                  </Label>
                  <Input
                    id="website"
                    type="url"
                    value={profileData.website}
                    onChange={(e) => e.target.value}
                  />
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    rows={4}
                    placeholder="Tell us about yourself..."
                    value={profileData.bio}
                    onChange={(e) => e.target.value}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
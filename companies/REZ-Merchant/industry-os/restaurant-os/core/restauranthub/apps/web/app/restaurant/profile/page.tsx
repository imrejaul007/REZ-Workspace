'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Upload,
  Save,
  AlertCircle,
  CheckCircle,
  Clock,
  Camera,
  FileText,
  CreditCard,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { toast } from 'react-hot-toast';

const profileSchema = z.object({
  name: z.string().min(2, 'Restaurant name must be at least 2 characters'),
  description: z.string().optional(),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  email: z.string().email('Please enter a valid email'),
  website: z.string().url('Please enter a valid website URL').optional().or(z.literal('')),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  state: z.string().min(2, 'State must be at least 2 characters'),
  pincode: z.string().min(6, 'Pincode must be 6 digits'),
  cuisineTypes: z.array(z.string()).min(1, 'Select at least one cuisine type'),
  serviceHours: z.object({
    open: z.string(),
    close: z.string(),
  }),
  capacity: z.number().min(1, 'Capacity must be at least 1'),
  bankInfo: z.object({
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    ifscCode: z.string().optional(),
    panNumber: z.string().optional(),
    gstNumber: z.string().optional(),
  }).optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

const cuisineOptions = [
  'North Indian', 'South Indian', 'Chinese', 'Continental', 'Italian', 'Mexican',
  'Thai', 'Japanese', 'Lebanese', 'Bengali', 'Punjabi', 'Gujarati', 'Rajasthani',
  'Hyderabadi', 'Mughlai', 'Street Food', 'Fast Food', 'Bakery', 'Desserts'
];

const documents = [
  {
    id: '1',
    name: 'GST Certificate',
    type: 'gst',
    status: 'verified',
    uploadedAt: '2024-01-05T10:30:00Z',
    required: true,
  },
  {
    id: '2',
    name: 'FSSAI License',
    type: 'fssai',
    status: 'pending',
    uploadedAt: '2024-01-08T14:20:00Z',
    required: true,
  },
  {
    id: '3',
    name: 'Trade License',
    type: 'trade',
    status: 'verified',
    uploadedAt: '2024-01-03T09:15:00Z',
    required: true,
  },
  {
    id: '4',
    name: 'Fire Safety Certificate',
    type: 'fire_safety',
    status: 'missing',
    uploadedAt: null,
    required: false,
  },
];

export default function RestaurantProfile() {
  const [activeTab, setActiveTab] = useState('basic');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: 'The Spice Route',
      description: 'Authentic Indian cuisine with a modern twist. Experience the flavors of India in a contemporary setting.',
      phone: '+91 98765 43210',
      email: 'contact@spiceroute.com',
      website: 'https://spiceroute.com',
      address: '123, MG Road, Commercial Street',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
      cuisineTypes: ['North Indian', 'South Indian'],
      serviceHours: {
        open: '11:00',
        close: '23:00',
      },
      capacity: 80,
      bankInfo: {
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        panNumber: '',
        gstNumber: '',
      },
    },
  });

  const onSubmit = async (data: ProfileForm) => {
    setIsLoading(true);
    try {
      // API call would go here
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (documentType: string) => {
    // File upload logic would go here
    toast.success(`${documentType} uploaded successfully!`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-success-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-warning-500" />;
      case 'missing':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200';
      case 'pending':
        return 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-200';
      case 'missing':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const tabs = [
    { id: 'basic', label: 'Basic Information', icon: Building2 },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'banking', label: 'Banking Details', icon: CreditCard },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Restaurant Profile</h1>
            <p className="text-muted-foreground mt-1">
              Manage your restaurant information and verification documents
            </p>
          </div>
          <div className="flex items-center space-x-2 mt-4 sm:mt-0">
            <Button variant="outline" >
              <Shield className="h-4 w-4 mr-2" />
              Verification Status
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 text-left text-sm font-medium rounded-lg transition-colors ${
                          activeTab === tab.id
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>

            {/* Profile Picture Card */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm">Restaurant Logo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <Button variant="outline" >
                    <Camera className="h-4 w-4 mr-2" />
                    Upload Logo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Basic Information Tab */}
              {activeTab === 'basic' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Basic Information</CardTitle>
                      <CardDescription>
                        Update your restaurant's basic details and contact information
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Restaurant Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Restaurant Name *</label>
                          <input
                            type="text"
                            className="form-input"
                            {...register('name')}
                          />
                          {errors.name && (
                            <p className="text-sm text-destructive">{errors.name.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Phone *</label>
                          <input
                            type="tel"
                            className="form-input"
                            {...register('phone')}
                          />
                          {errors.phone && (
                            <p className="text-sm text-destructive">{errors.phone.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Email *</label>
                          <input
                            type="email"
                            className="form-input"
                            {...register('email')}
                          />
                          {errors.email && (
                            <p className="text-sm text-destructive">{errors.email.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Website</label>
                          <input
                            type="url"
                            className="form-input"
                            placeholder="https://your-website.com"
                            {...register('website')}
                          />
                          {errors.website && (
                            <p className="text-sm text-destructive">{errors.website.message}</p>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Description</label>
                        <textarea
                          rows={3}
                          className="form-textarea"
                          placeholder="Tell customers about your restaurant..."
                          {...register('description')}
                        />
                      </div>

                      {/* Address */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Location Details</h3>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Address *</label>
                          <input
                            type="text"
                            className="form-input"
                            {...register('address')}
                          />
                          {errors.address && (
                            <p className="text-sm text-destructive">{errors.address.message}</p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">City *</label>
                            <input
                              type="text"
                              className="form-input"
                              {...register('city')}
                            />
                            {errors.city && (
                              <p className="text-sm text-destructive">{errors.city.message}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">State *</label>
                            <input
                              type="text"
                              className="form-input"
                              {...register('state')}
                            />
                            {errors.state && (
                              <p className="text-sm text-destructive">{errors.state.message}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Pincode *</label>
                            <input
                              type="text"
                              className="form-input"
                              {...register('pincode')}
                            />
                            {errors.pincode && (
                              <p className="text-sm text-destructive">{errors.pincode.message}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Cuisine Types */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Restaurant Details</h3>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Cuisine Types *</label>
                          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                            {cuisineOptions.map((cuisine) => (
                              <label key={cuisine} className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  value={cuisine}
                                  {...register('cuisineTypes')}
                                  className="rounded border-border"
                                />
                                <span className="text-sm">{cuisine}</span>
                              </label>
                            ))}
                          </div>
                          {errors.cuisineTypes && (
                            <p className="text-sm text-destructive">{errors.cuisineTypes.message}</p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Opening Time</label>
                            <input
                              type="time"
                              className="form-input"
                              {...register('serviceHours.open')}
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Closing Time</label>
                            <input
                              type="time"
                              className="form-input"
                              {...register('serviceHours.close')}
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Seating Capacity</label>
                            <input
                              type="number"
                              min="1"
                              className="form-input"
                              {...register('capacity', { valueAsNumber: true })}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Documents Tab */}
              {activeTab === 'documents' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Legal Documents</CardTitle>
                      <CardDescription>
                        Upload and manage your restaurant's legal documents
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-4 border rounded-lg"
                          >
                            <div className="flex items-center space-x-4">
                              {getStatusIcon(doc.status)}
                              <div>
                                <h4 className="font-medium text-sm flex items-center space-x-2">
                                  <span>{doc.name}</span>
                                  {doc.required && (
                                    <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded">
                                      Required
                                    </span>
                                  )}
                                </h4>
                                {doc.uploadedAt && (
                                  <p className="text-xs text-muted-foreground">
                                    Uploaded on {new Date(doc.uploadedAt).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className={`text-xs px-2 py-1 rounded-full ${getStatusColor(doc.status)}`}>
                                {doc.status}
                              </div>
                              <Button
                                variant="outline"
                                
                                onClick={() => handleFileUpload(doc.name)}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                {doc.status === 'missing' ? 'Upload' : 'Replace'}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Banking Tab */}
              {activeTab === 'banking' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Banking Details</CardTitle>
                      <CardDescription>
                        Payment and financial information for your restaurant
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Bank Name</label>
                          <input
                            {...register('bankInfo.bankName')}
                            type="text"
                            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="State Bank of India"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Account Number</label>
                          <input
                            {...register('bankInfo.accountNumber')}
                            type="text"
                            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="1234567890"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">IFSC Code</label>
                          <input
                            {...register('bankInfo.ifscCode')}
                            type="text"
                            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="SBIN0001234"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">PAN Number</label>
                          <input
                            {...register('bankInfo.panNumber')}
                            type="text"
                            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="ABCDE1234F"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">GST Number</label>
                          <input
                            {...register('bankInfo.gstNumber')}
                            type="text"
                            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="27ABCDE1234F1Z5"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Save Button */}
              {activeTab === 'basic' && (
                <div className="flex justify-end mt-6">
                  <Button type="submit" loading={isLoading} disabled={isLoading}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
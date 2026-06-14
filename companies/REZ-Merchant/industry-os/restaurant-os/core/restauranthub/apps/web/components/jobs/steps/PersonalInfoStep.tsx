'use client';

import React from 'react';
import { User, Mail, Phone, MapPin, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  currentLocation: string;
  preferredLocation?: string;
  availability: string;
}

interface PersonalInfoStepProps {
  formData: PersonalInfo;
  updateFormData: (data: Partial<PersonalInfo>) => void;
  errors: Record<string, string>;
}

const PersonalInfoStep = React.memo(({ formData, updateFormData, errors }: PersonalInfoStepProps) => {
  const handleInputChange = (field: keyof PersonalInfo, value: string) => {
    updateFormData({ [field]: value });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder="Enter your full name"
                className={errors.fullName ? 'border-red-500' : ''}
              />
              {errors.fullName && (
                <p className="text-sm text-red-500">{errors.fullName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="your.email@example.com"
                  className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+91 98765 43210"
                  className={`pl-10 ${errors.phone ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentLocation">Current Location *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="currentLocation"
                  value={formData.currentLocation}
                  onChange={(e) => handleInputChange('currentLocation', e.target.value)}
                  placeholder="City, State"
                  className={`pl-10 ${errors.currentLocation ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.currentLocation && (
                <p className="text-sm text-red-500">{errors.currentLocation}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferredLocation">Preferred Work Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="preferredLocation"
                  value={formData.preferredLocation || ''}
                  onChange={(e) => handleInputChange('preferredLocation', e.target.value)}
                  placeholder="City, State (Optional)"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="availability">Availability *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <Select
                  value={formData.availability}
                  onValueChange={(value) => handleInputChange('availability', value)}
                >
                  <SelectTrigger className={`pl-10 ${errors.availability ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Select availability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="1week">Within 1 week</SelectItem>
                    <SelectItem value="2weeks">Within 2 weeks</SelectItem>
                    <SelectItem value="1month">Within 1 month</SelectItem>
                    <SelectItem value="2months">Within 2 months</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {errors.availability && (
                <p className="text-sm text-red-500">{errors.availability}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Personal Information Guidelines</p>
              <ul className="space-y-1 text-blue-700">
                <li>• Ensure all information matches your official documents</li>
                <li>• Use a professional email address for communication</li>
                <li>• Provide a valid phone number where employers can reach you</li>
                <li>• Location information helps with job matching</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

PersonalInfoStep.displayName = 'PersonalInfoStep';

export default PersonalInfoStep;
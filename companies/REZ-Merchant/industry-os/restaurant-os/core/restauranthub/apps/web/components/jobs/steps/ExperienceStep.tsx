'use client';

import React from 'react';
import { Briefcase, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface PreviousRole {
  title: string;
  company: string;
  duration: string;
  description: string;
}

interface Experience {
  totalYears: number;
  currentRole?: string;
  currentCompany?: string;
  relevantExperience: string;
  previousRoles: PreviousRole[];
}

interface ExperienceStepProps {
  formData: Experience;
  updateFormData: (data: Partial<Experience>) => void;
  addArrayItem: (key: string, item: PreviousRole) => void;
  removeArrayItem: (key: string, index: number) => void;
  updateArrayItem: (key: string, index: number, data: Partial<PreviousRole>) => void;
  errors: Record<string, string>;
}

const ExperienceStep = React.memo(({
  formData,
  updateFormData,
  addArrayItem,
  removeArrayItem,
  updateArrayItem,
  errors
}: ExperienceStepProps) => {
  const handleInputChange = (field: keyof Experience, value: string | number) => {
    updateFormData({ [field]: value });
  };

  const handleAddRole = () => {
    addArrayItem('previousRoles', {
      title: '',
      company: '',
      duration: '',
      description: ''
    });
  };

  const handleUpdateRole = (index: number, field: keyof PreviousRole, value: string) => {
    updateArrayItem('previousRoles', index, { [field]: value });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Work Experience
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalYears">Total Years of Experience *</Label>
              <Input
                id="totalYears"
                type="number"
                min="0"
                max="50"
                value={formData.totalYears}
                onChange={(e) => handleInputChange('totalYears', parseInt(e.target.value) || 0)}
                placeholder="0"
                className={errors.totalYears ? 'border-red-500' : ''}
              />
              {errors.totalYears && (
                <p className="text-sm text-red-500">{errors.totalYears}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentRole">Current Role</Label>
              <Input
                id="currentRole"
                value={formData.currentRole || ''}
                onChange={(e) => handleInputChange('currentRole', e.target.value)}
                placeholder="e.g. Server, Chef, Manager"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="currentCompany">Current Company</Label>
              <Input
                id="currentCompany"
                value={formData.currentCompany || ''}
                onChange={(e) => handleInputChange('currentCompany', e.target.value)}
                placeholder="Current employer (if applicable)"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="relevantExperience">Relevant Experience Description *</Label>
              <Textarea
                id="relevantExperience"
                value={formData.relevantExperience}
                onChange={(e) => handleInputChange('relevantExperience', e.target.value)}
                placeholder="Describe your relevant experience in the restaurant industry..."
                className={`min-h-[100px] ${errors.relevantExperience ? 'border-red-500' : ''}`}
              />
              {errors.relevantExperience && (
                <p className="text-sm text-red-500">{errors.relevantExperience}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Previous Roles</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddRole}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Role
          </Button>
        </CardHeader>
        <CardContent>
          {formData.previousRoles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No previous roles added yet</p>
              <p className="text-sm">Click "Add Role" to include your work history</p>
            </div>
          ) : (
            <div className="space-y-4">
              {formData.previousRoles.map((role, index) => (
                <Card key={index} className="relative">
                  <CardContent className="pt-6">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => removeArrayItem('previousRoles', index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-8">
                      <div className="space-y-2">
                        <Label>Job Title *</Label>
                        <Input
                          value={role.title}
                          onChange={(e) => handleUpdateRole(index, 'title', e.target.value)}
                          placeholder="e.g. Waitress, Line Cook"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Company *</Label>
                        <Input
                          value={role.company}
                          onChange={(e) => handleUpdateRole(index, 'company', e.target.value)}
                          placeholder="Restaurant name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Duration *</Label>
                        <Input
                          value={role.duration}
                          onChange={(e) => handleUpdateRole(index, 'duration', e.target.value)}
                          placeholder="e.g. Jan 2020 - Dec 2022"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label>Description</Label>
                        <Textarea
                          value={role.description}
                          onChange={(e) => handleUpdateRole(index, 'description', e.target.value)}
                          placeholder="Brief description of your responsibilities and achievements..."
                          className="min-h-[80px]"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Briefcase className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">Experience Guidelines</p>
              <ul className="space-y-1 text-amber-700">
                <li>• Include all relevant restaurant and hospitality experience</li>
                <li>• Be honest about your experience level</li>
                <li>• Highlight transferable skills from other industries</li>
                <li>• Focus on achievements and responsibilities, not just duties</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

ExperienceStep.displayName = 'ExperienceStep';

export default ExperienceStep;
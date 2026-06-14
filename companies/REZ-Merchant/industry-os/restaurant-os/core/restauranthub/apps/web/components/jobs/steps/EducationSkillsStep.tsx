'use client';

import React from 'react';
import { GraduationCap, Award, Plus, Trash2, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Certification {
  name: string;
  issuer: string;
  year: string;
}

interface Education {
  degree: string;
  institution: string;
  year: string;
  certifications: Certification[];
}

interface Skills {
  technical: string[];
  languages: string[];
  specializations: string[];
}

interface EducationSkillsData {
  education: Education;
  skills: Skills;
}

interface EducationSkillsStepProps {
  formData: EducationSkillsData;
  updateFormData: (section: 'education' | 'skills', data) => void;
  addArrayItem: (section: string, key: string, item) => void;
  removeArrayItem: (section: string, key: string, index: number) => void;
  errors: Record<string, string>;
}

const EducationSkillsStep = React.memo(({
  formData,
  updateFormData,
  addArrayItem,
  removeArrayItem,
  errors
}: EducationSkillsStepProps) => {
  const [newSkill, setNewSkill] = React.useState({ technical: '', languages: '', specializations: '' });

  const handleEducationChange = (field: keyof Education, value: string) => {
    updateFormData('education', { [field]: value });
  };

  const handleAddSkill = (type: keyof Skills) => {
    const skill = newSkill[type].trim();
    if (skill && !formData.skills[type].includes(skill)) {
      updateFormData('skills', {
        ...formData.skills,
        [type]: [...formData.skills[type], skill]
      });
      setNewSkill(prev => ({ ...prev, [type]: '' }));
    }
  };

  const handleRemoveSkill = (type: keyof Skills, index: number) => {
    const newSkills = formData.skills[type].filter((_, i) => i !== index);
    updateFormData('skills', {
      ...formData.skills,
      [type]: newSkills
    });
  };

  const handleAddCertification = () => {
    addArrayItem('education', 'certifications', {
      name: '',
      issuer: '',
      year: ''
    });
  };

  const handleUpdateCertification = (index: number, field: keyof Certification, value: string) => {
    const updatedCertifications = [...formData.education.certifications];
    updatedCertifications[index] = { ...updatedCertifications[index], [field]: value };
    updateFormData('education', { certifications: updatedCertifications });
  };

  const skillSections = [
    { key: 'technical' as keyof Skills, title: 'Technical Skills', placeholder: 'e.g. POS Systems, Food Safety' },
    { key: 'languages' as keyof Skills, title: 'Languages', placeholder: 'e.g. English, Spanish, Hindi' },
    { key: 'specializations' as keyof Skills, title: 'Specializations', placeholder: 'e.g. Italian Cuisine, Bartending' }
  ];

  return (
    <div className="space-y-6">
      {/* Education Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Education
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="degree">Highest Qualification</Label>
              <Input
                id="degree"
                value={formData.education.degree}
                onChange={(e) => handleEducationChange('degree', e.target.value)}
                placeholder="e.g. High School, Bachelor's, Diploma"
                className={errors.degree ? 'border-red-500' : ''}
              />
              {errors.degree && (
                <p className="text-sm text-red-500">{errors.degree}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="institution">Institution</Label>
              <Input
                id="institution"
                value={formData.education.institution}
                onChange={(e) => handleEducationChange('institution', e.target.value)}
                placeholder="School/College/University name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Year of Completion</Label>
              <Input
                id="year"
                value={formData.education.year}
                onChange={(e) => handleEducationChange('year', e.target.value)}
                placeholder="e.g. 2020"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Certifications Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Certifications
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddCertification}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Certification
          </Button>
        </CardHeader>
        <CardContent>
          {formData.education.certifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No certifications added yet</p>
              <p className="text-sm">Add relevant food safety, hospitality, or professional certifications</p>
            </div>
          ) : (
            <div className="space-y-4">
              {formData.education.certifications.map((cert, index) => (
                <Card key={index} className="relative">
                  <CardContent className="pt-6">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => removeArrayItem('education', 'certifications', index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pr-8">
                      <div className="space-y-2">
                        <Label>Certification Name *</Label>
                        <Input
                          value={cert.name}
                          onChange={(e) => handleUpdateCertification(index, 'name', e.target.value)}
                          placeholder="e.g. Food Safety Certificate"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Issuing Authority *</Label>
                        <Input
                          value={cert.issuer}
                          onChange={(e) => handleUpdateCertification(index, 'issuer', e.target.value)}
                          placeholder="e.g. Food Safety Department"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Year Obtained</Label>
                        <Input
                          value={cert.year}
                          onChange={(e) => handleUpdateCertification(index, 'year', e.target.value)}
                          placeholder="e.g. 2023"
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

      {/* Skills Section */}
      <Card>
        <CardHeader>
          <CardTitle>Skills & Abilities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {skillSections.map(({ key, title, placeholder }) => (
            <div key={key} className="space-y-3">
              <Label className="text-base font-medium">{title}</Label>

              {/* Display existing skills */}
              <div className="flex flex-wrap gap-2 min-h-[2.5rem] p-3 border rounded-md bg-muted/20">
                {formData.skills[key].length > 0 ? (
                  formData.skills[key].map((skill, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {skill}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-red-500"
                        onClick={() => handleRemoveSkill(key, index)}
                      />
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground text-sm">No {title.toLowerCase()} added yet</span>
                )}
              </div>

              {/* Add new skill */}
              <div className="flex gap-2">
                <Input
                  value={newSkill[key]}
                  onChange={(e) => setNewSkill(prev => ({ ...prev, [key]: e.target.value }))}
                  placeholder={placeholder}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill(key);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddSkill(key)}
                  disabled={!newSkill[key].trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-emerald-50 border-emerald-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <GraduationCap className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-emerald-800">
              <p className="font-medium mb-1">Education & Skills Guidelines</p>
              <ul className="space-y-1 text-emerald-700">
                <li>• Include all relevant qualifications, even if not directly related to hospitality</li>
                <li>• Add certifications like Food Safety, HACCP, or RBS if you have them</li>
                <li>• List both hard skills (technical) and soft skills (language, customer service)</li>
                <li>• Be honest about your skill level and experience</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

EducationSkillsStep.displayName = 'EducationSkillsStep';

export default EducationSkillsStep;
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  BookOpen, 
  Award, 
  Clock, 
  Users, 
  CheckCircle2, 
  PlayCircle,
  Download,
  Eye,
  Calendar,
  TrendingUp,
  Filter,
  Search,
  Plus,
  FileText,
  Video,
  HelpCircle,
  Star,
  Target,
  BarChart3,
  Zap,
  Settings,
  BookMarked,
  GraduationCap,
  Shield,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TrainingModule {
  id: string;
  title: string;
  description: string;
  category: 'food_safety' | 'customer_service' | 'operations' | 'compliance' | 'leadership' | 'technical';
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in minutes
  type: 'video' | 'document' | 'interactive' | 'assessment';
  requirements: string[];
  objectives: string[];
  content: {
    lessons: number;
    assessments: number;
    resources: number;
  };
  certification: {
    available: boolean;
    validityPeriod?: number; // in months
    renewalRequired: boolean;
  };
  createdBy: string;
  createdAt: string;
  lastUpdated: string;
  isActive: boolean;
  tags: string[];
  difficulty: number; // 1-5
  rating: number;
  enrollmentCount: number;
  completionRate: number;
}

interface EmployeeProgress {
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  avatar?: string;
  moduleProgress: {
    moduleId: string;
    status: 'not_started' | 'in_progress' | 'completed' | 'failed';
    progress: number; // 0-100
    startDate?: string;
    completionDate?: string;
    score?: number;
    attempts: number;
    timeSpent: number; // in minutes
  }[];
  certifications: {
    id: string;
    moduleId: string;
    name: string;
    issuedDate: string;
    expiryDate?: string;
    status: 'active' | 'expired' | 'revoked';
    score: number;
  }[];
  overallProgress: number;
  joinedDate: string;
  lastActivity: string;
}

interface TrainingSystemProps {
  modules: TrainingModule[];
  employeeProgress: EmployeeProgress[];
  userRole: 'admin' | 'restaurant' | 'employee';
  currentUserId?: string;
  onCreateModule?: (module: Omit<TrainingModule, 'id' | 'createdAt' | 'lastUpdated'>) => void;
  onUpdateModule?: (moduleId: string, updates: Partial<TrainingModule>) => void;
  onEnrollEmployee?: (moduleId: string, employeeId: string) => void;
  onStartTraining?: (moduleId: string) => void;
  onCompleteLesson?: (moduleId: string, lessonId: string) => void;
}

export default function TrainingSystem({
  modules,
  employeeProgress,
  userRole,
  currentUserId,
  onCreateModule,
  onUpdateModule,
  onEnrollEmployee,
  onStartTraining,
  onCompleteLesson
}: TrainingSystemProps) {
  const [selectedTab, setSelectedTab] = useState('modules');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeProgress | null>(null);
  const [showCreateModule, setShowCreateModule] = useState(false);

  const categories = [
    { value: 'food_safety', label: 'Food Safety', icon: Shield, color: 'text-red-600' },
    { value: 'customer_service', label: 'Customer Service', icon: Users, color: 'text-blue-600' },
    { value: 'operations', label: 'Operations', icon: Settings, color: 'text-green-600' },
    { value: 'compliance', label: 'Compliance', icon: FileText, color: 'text-purple-600' },
    { value: 'leadership', label: 'Leadership', icon: Target, color: 'text-orange-600' },
    { value: 'technical', label: 'Technical', icon: Zap, color: 'text-indigo-600' }
  ];

  const levels = [
    { value: 'beginner', label: 'Beginner', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
    { value: 'intermediate', label: 'Intermediate', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
    { value: 'advanced', label: 'Advanced', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' }
  ];

  const filteredModules = modules.filter(module => {
    const matchesSearch = module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         module.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         module.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || module.category === categoryFilter;
    const matchesLevel = levelFilter === 'all' || module.level === levelFilter;
    
    return matchesSearch && matchesCategory && matchesLevel;
  });

  const getModuleProgress = (moduleId: string, employeeId?: string) => {
    const targetEmployeeId = employeeId || currentUserId;
    if (!targetEmployeeId) return null;
    
    const employee = employeeProgress.find(emp => emp.employeeId === targetEmployeeId);
    return employee?.moduleProgress.find(progress => progress.moduleId === moduleId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_started': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.icon : BookOpen;
  };

  const getCategoryColor = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.color : 'text-gray-600';
  };

  const renderModuleCard = (module: TrainingModule) => {
    const CategoryIcon = getCategoryIcon(module.category);
    const progress = getModuleProgress(module.id);
    const level = levels.find(l => l.value === module.level);

    return (
      <Card key={module.id} className="group hover:shadow-lg transition-all duration-200 border border-border">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg bg-gray-50 dark:bg-gray-800 ${getCategoryColor(module.category)}`}>
                <CategoryIcon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">{module.title}</CardTitle>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="outline" className={level?.color}>
                    {level?.label}
                  </Badge>
                  <Badge variant="outline">
                    {module.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star 
                    key={i} 
                    className={`h-4 w-4 ${i < module.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                  />
                ))}
                <span className="ml-1 text-sm text-muted-foreground">({module.rating})</span>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground line-clamp-2">{module.description}</p>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{Math.floor(module.duration / 60)}h {module.duration % 60}m</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{module.enrollmentCount} enrolled</span>
            </div>
            <div className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span>{module.content.lessons} lessons</span>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span>{module.completionRate}% completion</span>
            </div>
          </div>

          {progress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Your Progress</span>
                <Badge className={getStatusColor(progress.status)}>
                  {progress.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
              </div>
              <Progress value={progress.progress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{progress.progress}% complete</span>
                {progress.score && <span>Score: {progress.score}%</span>}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="flex space-x-2">
              {module.certification.available && (
                <Badge variant="outline" className="text-yellow-600">
                  <Award className="h-3 w-3 mr-1" />
                  Certification
                </Badge>
              )}
              <Badge variant="outline">
                {module.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="default"
                onClick={() => setSelectedModule(module)}
              >
                <Eye className="h-4 w-4 mr-1" />
                Details
              </Button>
              {userRole === 'employee' && (
                <Button
                  variant="default"
                  size="default"
                  onClick={() => onStartTraining?.(module.id)}
                  disabled={progress?.status === 'completed'}
                >
                  {progress?.status === 'completed' ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Completed
                    </>
                  ) : progress?.status === 'in_progress' ? (
                    <>
                      <PlayCircle className="h-4 w-4 mr-1" />
                      Continue
                    </>
                  ) : (
                    <>
                      <PlayCircle className="h-4 w-4 mr-1" />
                      Start
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderEmployeeProgress = (employee: EmployeeProgress) => {
    const completedModules = employee.moduleProgress.filter(p => p.status === 'completed').length;
    const totalModules = employee.moduleProgress.length;
    const activeCertifications = employee.certifications.filter(c => c.status === 'active').length;

    return (
      <Card key={employee.employeeId} className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4 mb-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={employee.avatar} />
              <AvatarFallback>
                {employee.employeeName.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{employee.employeeName}</h3>
              <p className="text-muted-foreground">{employee.employeeRole}</p>
              <p className="text-sm text-muted-foreground">
                Joined {new Date(employee.joinedDate).toLocaleDateString()}
              </p>
            </div>
            <Button
              variant="outline"
              size="default"
              onClick={() => setSelectedEmployee(employee)}
            >
              View Details
            </Button>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Overall Progress</span>
                <span>{employee.overallProgress}%</span>
              </div>
              <Progress value={employee.overallProgress} />
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-600">{completedModules}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{totalModules - completedModules}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{activeCertifications}</p>
                <p className="text-xs text-muted-foreground">Certified</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center">
            <GraduationCap className="h-8 w-8 mr-3 text-blue-600" />
            Training & Certification System
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive employee training and skill development platform
          </p>
        </div>
        {(userRole === 'admin' || userRole === 'restaurant') && (
          <Button variant="default" size="default" onClick={() => setShowCreateModule(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Module
          </Button>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Modules</p>
                <p className="text-2xl font-bold">{modules.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Active Learners</p>
                <p className="text-2xl font-bold">{employeeProgress.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Award className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Certifications</p>
                <p className="text-2xl font-bold">
                  {employeeProgress.reduce((total, emp) => total + emp.certifications.filter(c => c.status === 'active').length, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Avg. Completion</p>
                <p className="text-2xl font-bold">
                  {Math.round(modules.reduce((sum, m) => sum + m.completionRate, 0) / modules.length || 0)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="modules">Training Modules</TabsTrigger>
          <TabsTrigger value="progress">Employee Progress</TabsTrigger>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search modules..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    {levels.map(level => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Modules Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredModules.map(renderModuleCard)}
          </div>

          {filteredModules.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No modules found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search criteria or create a new module.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {employeeProgress.map(renderEmployeeProgress)}
          </div>
        </TabsContent>

        <TabsContent value="certifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="h-6 w-6 mr-2 text-yellow-600" />
                Active Certifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employeeProgress.flatMap(emp => 
                  emp.certifications
                    .filter(cert => cert.status === 'active')
                    .map(cert => (
                      <div key={cert.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                            <Award className="h-5 w-5 text-yellow-600" />
                          </div>
                          <div>
                            <p className="font-semibold">{cert.name}</p>
                            <p className="text-sm text-muted-foreground">{emp.employeeName}</p>
                            <p className="text-xs text-muted-foreground">
                              Score: {cert.score}% | Expires: {cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString() : 'Never'}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="default">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Training Effectiveness</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categories.map(category => {
                    const categoryModules = modules.filter(m => m.category === category.value);
                    const avgCompletion = categoryModules.length > 0 
                      ? Math.round(categoryModules.reduce((sum, m) => sum + m.completionRate, 0) / categoryModules.length)
                      : 0;

                    return (
                      <div key={category.value}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{category.label}</span>
                          <span>{avgCompletion}%</span>
                        </div>
                        <Progress value={avgCompletion} />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Learning Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">94%</p>
                    <p className="text-sm text-muted-foreground">Employee Satisfaction</p>
                  </div>
                  <Separator />
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600">2.3h</p>
                    <p className="text-sm text-muted-foreground">Avg. Daily Learning</p>
                  </div>
                  <Separator />
                  <div className="text-center">
                    <p className="text-3xl font-bold text-purple-600">87%</p>
                    <p className="text-sm text-muted-foreground">Knowledge Retention</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Module Details Modal */}
      {selectedModule && (
        <Dialog open={!!selectedModule} onOpenChange={() => setSelectedModule(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center text-xl">
                <GraduationCap className="h-6 w-6 mr-2 text-blue-600" />
                {selectedModule.title}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Category</p>
                  <Badge variant="outline">
                    {selectedModule.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Level</p>
                  <Badge className={levels.find(l => l.value === selectedModule.level)?.color}>
                    {levels.find(l => l.value === selectedModule.level)?.label}
                  </Badge>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-muted-foreground">{selectedModule.description}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Learning Objectives</h4>
                <ul className="space-y-1">
                  {selectedModule.objectives.map((objective, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{objective}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {selectedModule.requirements.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Prerequisites</h4>
                  <ul className="space-y-1">
                    {selectedModule.requirements.map((req, index) => (
                      <li key={index} className="flex items-start">
                        <AlertCircle className="h-4 w-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex space-x-4 pt-4">
                {userRole === 'employee' && (
                  <Button
                    onClick={() => {
                      onStartTraining?.(selectedModule.id);
                      setSelectedModule(null);
                    }}
                    className="flex-1"
                    size="default"
                    variant="default"
                  >
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Start Training
                  </Button>
                )}
                <Button variant="outline" size="default" onClick={() => setSelectedModule(null)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Play, CheckCircle, Clock, Award, Star, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress as ProgressBar } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function Training() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const [courses, setCourses] = useState([
    {
      id: 1,
      title: 'Food Safety & Hygiene',
      category: 'Required',
      duration: 45,
      progress: 100,
      status: 'completed',
      description: 'Essential food safety practices and hygiene standards',
      modules: 8,
      completedModules: 8,
      dueDate: '2024-01-15',
      certificate: true,
      rating: 5
    },
    {
      id: 2,
      title: 'Customer Service Excellence',
      category: 'Required',
      duration: 60,
      progress: 75,
      status: 'in_progress',
      description: 'Advanced customer service techniques and conflict resolution',
      modules: 10,
      completedModules: 7,
      dueDate: '2024-01-20',
      certificate: false,
      rating: 0
    },
    {
      id: 3,
      title: 'Wine Service & Pairing',
      category: 'Optional',
      duration: 90,
      progress: 0,
      status: 'not_started',
      description: 'Wine knowledge, service techniques, and food pairing',
      modules: 12,
      completedModules: 0,
      dueDate: null,
      certificate: false,
      rating: 0
    },
    {
      id: 4,
      title: 'POS System Training',
      category: 'Required',
      duration: 30,
      progress: 100,
      status: 'completed',
      description: 'Complete guide to using the restaurant POS system',
      modules: 5,
      completedModules: 5,
      dueDate: '2024-01-10',
      certificate: true,
      rating: 4
    },
    {
      id: 5,
      title: 'Allergy Awareness',
      category: 'Required',
      duration: 25,
      progress: 50,
      status: 'in_progress',
      description: 'Understanding food allergies and cross-contamination',
      modules: 4,
      completedModules: 2,
      dueDate: '2024-01-18',
      certificate: false,
      rating: 0
    },
    {
      id: 6,
      title: 'Mixology Basics',
      category: 'Optional',
      duration: 75,
      progress: 0,
      status: 'not_started',
      description: 'Cocktail preparation and bartending fundamentals',
      modules: 9,
      completedModules: 0,
      dueDate: null,
      certificate: false,
      rating: 0
    }
  ]);

  const categories = ['Required', 'Optional', 'Completed'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'not_started': return 'bg-gray-400';
      case 'overdue': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <Play className="h-4 w-4" />;
      case 'not_started': return <BookOpen className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const startCourse = (courseId: number) => {
    setCourses(prev => prev.map(course => 
      course.id === courseId 
        ? { ...course, status: 'in_progress', progress: 10, completedModules: 1 }
        : course
    ));
  };

  const continueCourse = (courseId: number) => {
    // Navigate to course content
    console.log('Continue course:', courseId);
  };

  const filteredCourses = courses.filter(course => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'Completed') return course.status === 'completed';
    return course.category === selectedCategory;
  });

  const stats = {
    totalCourses: courses.length,
    completedCourses: courses.filter(c => c.status === 'completed').length,
    inProgressCourses: courses.filter(c => c.status === 'in_progress').length,
    certificatesEarned: courses.filter(c => c.certificate).length,
    totalHours: courses.filter(c => c.status === 'completed')
                      .reduce((sum, course) => sum + course.duration, 0)
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Training Center</h1>
            <p className="text-muted-foreground">Complete your training courses and earn certificates</p>
          </div>
          <div className="flex items-center space-x-3">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Certificates
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold">{stats.totalCourses}</div>
                <div className="text-sm text-gray-600">Total Courses</div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.completedCourses}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.inProgressCourses}</div>
                <div className="text-sm text-gray-600">In Progress</div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.certificatesEarned}</div>
                <div className="text-sm text-gray-600">Certificates</div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-orange-600">{Math.round(stats.totalHours / 60)}h</div>
                <div className="text-sm text-gray-600">Hours Trained</div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg leading-tight">{course.title}</CardTitle>
                      <p className="text-sm text-gray-600 mt-2">{course.description}</p>
                    </div>
                    <Badge className={getStatusColor(course.status)}>
                      {getStatusIcon(course.status)}
                      <span className="ml-1 capitalize">{course.status.replace('_', ' ')}</span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <Badge variant="outline">{course.category}</Badge>
                      <div className="flex items-center space-x-1 text-gray-500">
                        <Clock className="h-4 w-4" />
                        <span>{course.duration}min</span>
                      </div>
                    </div>

                    {course.progress > 0 && (
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Progress</span>
                          <span>{course.progress}%</span>
                        </div>
                        <ProgressBar value={course.progress} />
                        <div className="text-xs text-gray-500 mt-1">
                          {course.completedModules} of {course.modules} modules completed
                        </div>
                      </div>
                    )}

                    {course.dueDate && course.status !== 'completed' && (
                      <div className="text-sm text-gray-600">
                        <strong>Due: </strong>
                        {new Date(course.dueDate).toLocaleDateString()}
                      </div>
                    )}

                    {course.certificate && (
                      <div className="flex items-center space-x-2">
                        <Award className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm text-yellow-600">Certificate Available</span>
                      </div>
                    )}

                    {course.rating > 0 && (
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-4 w-4 ${i < course.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                          />
                        ))}
                        <span className="text-sm text-gray-500 ml-2">Your Rating</span>
                      </div>
                    )}

                    <div className="pt-3">
                      {course.status === 'not_started' && (
                        <Button 
                          onClick={() => startCourse(course.id)}
                          className="w-full"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Start Course
                        </Button>
                      )}
                      {course.status === 'in_progress' && (
                        <Button 
                          onClick={() => continueCourse(course.id)}
                          className="w-full"
                        >
                          <BookOpen className="h-4 w-4 mr-2" />
                          Continue
                        </Button>
                      )}
                      {course.status === 'completed' && (
                        <div className="space-y-2">
                          <Button variant="outline" className="w-full">
                            <BookOpen className="h-4 w-4 mr-2" />
                            Review Course
                          </Button>
                          {course.certificate && (
                            <Button variant="outline" className="w-full">
                              <Award className="h-4 w-4 mr-2" />
                              Download Certificate
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Training Progress Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ProgressBar className="h-5 w-5 mr-2" />
                Training Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Required Training</h4>
                  <div className="space-y-3">
                    {courses.filter(c => c.category === 'Required').map(course => (
                      <div key={course.id} className="flex items-center justify-between">
                        <span className="text-sm">{course.title}</span>
                        <div className="flex items-center space-x-2">
                          <ProgressBar value={course.progress} className="w-20 h-2" />
                          <span className="text-xs text-gray-500 w-10">{course.progress}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Recent Achievements</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Completed Food Safety & Hygiene</span>
                      <span className="text-gray-500">2 days ago</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Award className="h-4 w-4 text-yellow-500" />
                      <span>Earned POS System Certificate</span>
                      <span className="text-gray-500">1 week ago</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-blue-500" />
                      <span>Started Customer Service Excellence</span>
                      <span className="text-gray-500">3 days ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
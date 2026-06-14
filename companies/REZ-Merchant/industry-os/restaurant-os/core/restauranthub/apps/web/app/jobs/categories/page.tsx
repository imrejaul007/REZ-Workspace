'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  ChefHat,
  Coffee,
  Users,
  Utensils,
  Truck,
  Calculator,
  Headphones,
  Clipboard,
  Search,
  MapPin,
  Clock,
  DollarSign,
  TrendingUp,
  ArrowRight,
  Building,
  Star
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '/api';

interface JobCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  jobCount: number;
  averageSalary: number;
  growth: number;
  color: string;
  subCategories: string[];
  popularLocations: string[];
  topCompanies: string[];
}

export default function JobCategoriesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/jobs/categories`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setCategories(json.data ?? json ?? []);
      } catch (error) {
        console.error('Failed to fetch job categories:', error);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.subCategories.some(sub => sub.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCategoryClick = (categoryId: string) => {
    router.push(`/jobs?category=${categoryId}`);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  const totalJobs = categories.reduce((sum, cat) => sum + cat.jobCount, 0);
  const averageGrowth = categories.length > 0
    ? categories.reduce((sum, cat) => sum + cat.growth, 0) / categories.length
    : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">Job Categories</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore restaurant and hospitality careers across different specializations. 
            Find opportunities that match your skills and interests.
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{totalJobs.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Jobs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{categories.length}</div>
              <div className="text-sm text-muted-foreground">Categories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">+{averageGrowth.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Avg Growth</div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Empty state when no categories are available at all */}
        {categories.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Utensils className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No categories available</h3>
            <p className="text-muted-foreground">
              Job categories will appear here once they are added.
            </p>
          </div>
        )}

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCategories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card 
                className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer group"
                onClick={() => handleCategoryClick(category.id)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-lg ${category.color}`}>
                      {category.icon}
                    </div>
                    <div className="flex items-center text-green-600 text-sm font-medium">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      +{category.growth}%
                    </div>
                  </div>
                  
                  <CardTitle className="group-hover:text-primary transition-colors">
                    {category.name}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {category.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Job Stats */}
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-xl font-bold text-primary">{category.jobCount.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Open Jobs</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-primary">₹{(category.averageSalary/1000).toFixed(0)}K</div>
                      <div className="text-xs text-muted-foreground">Avg Salary</div>
                    </div>
                  </div>

                  {/* Top Subcategories */}
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">Popular Roles</h4>
                    <div className="flex flex-wrap gap-1">
                      {category.subCategories.slice(0, 3).map((sub) => (
                        <Badge key={sub} variant="secondary" className="text-xs">
                          {sub}
                        </Badge>
                      ))}
                      {category.subCategories.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{category.subCategories.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Top Locations */}
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2 flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      Top Locations
                    </h4>
                    <div className="text-sm text-muted-foreground">
                      {category.popularLocations.slice(0, 3).join(', ')}
                      {category.popularLocations.length > 3 && ', +more'}
                    </div>
                  </div>

                  {/* Top Companies */}
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2 flex items-center">
                      <Building className="h-3 w-3 mr-1" />
                      Top Hiring
                    </h4>
                    <div className="text-sm text-muted-foreground">
                      {category.topCompanies.slice(0, 2).join(', ')}
                      {category.topCompanies.length > 2 && ', +more'}
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button 
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    variant="outline"
                  >
                    Browse Jobs
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* No Results */}
        {filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No categories found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search terms or browse all categories
            </p>
            <Button onClick={() => setSearchQuery('')} variant="outline">
              Clear Search
            </Button>
          </div>
        )}

        {/* Quick Links */}
        <div className="bg-muted/50 rounded-lg p-6 mt-12">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Start Your Career Journey</h2>
            <p className="text-muted-foreground">
              Whether you're just starting out or looking to advance your career, we have opportunities for everyone.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button onClick={() => router.push('/jobs')} className="px-6">
                Browse All Jobs
              </Button>
              <Button onClick={() => router.push('/profile/documents')} variant="outline" className="px-6">
                Upload Resume
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
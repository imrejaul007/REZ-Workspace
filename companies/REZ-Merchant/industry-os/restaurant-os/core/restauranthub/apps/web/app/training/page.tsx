'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { RecommendedCourseCard, RecommendedModule } from '@/components/training/recommended-course-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { useAuth } from '@/lib/auth/auth-provider';
import { Award, BookOpen, Clock, Filter, GraduationCap } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

interface TrainingModule {
  slug: string;
  title: string;
  description: string;
  duration: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  modules: number;
}

interface TrainingFeed {
  recommended: RecommendedModule[];
  allCourses: TrainingModule[];
  completedSlugs: string[];
}

const LEVEL_COLORS: Record<string, string> = {
  beginner: 'bg-green-100 text-green-700',
  intermediate: 'bg-amber-100 text-amber-700',
  advanced: 'bg-red-100 text-red-700',
};

const ALL_TAGS = ['costs', 'menu', 'margins', 'hiring', 'culture', 'retention', 'pricing',
  'revenue', 'operations', 'waste', 'speed', 'marketing', 'loyalty', 'growth',
  'procurement', 'finance', 'compliance'];

export default function TrainingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [feed, setFeed] = useState<TrainingFeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeLevel, setActiveLevel] = useState<string | null>(null);

  useEffect(() => {
    async function loadFeed() {
      setLoading(true);
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        const res = await fetch(`${API_BASE}/training/feed`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setFeed(data);
        } else {
          // Not authenticated — load public catalog
          const pubRes = await fetch(`${API_BASE}/training/courses`);
          if (pubRes.ok) {
            const courses = await pubRes.json();
            setFeed({
              recommended: courses.map((c: TrainingModule) => ({ ...c, isGeneral: true })),
              allCourses: courses,
              completedSlugs: [],
            });
          }
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load training content. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    }
    loadFeed();
  }, []);

  const filteredCourses = (feed?.allCourses ?? []).filter((c) => {
    if (activeTag && !c.tags.includes(activeTag)) return false;
    if (activeLevel && c.level !== activeLevel) return false;
    return true;
  });

  const completedSlugs = new Set(feed?.completedSlugs ?? []);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-10 px-4 py-8">

        {/* Hero */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Your Personalized Academy</h1>
            <p className="mt-1 text-muted-foreground">
              {user
                ? 'Courses recommended based on your restaurant\'s operational data.'
                : 'Browse all courses. Connect your REZ account for personalized recommendations.'}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2 text-sm">
            <GraduationCap className="h-5 w-5 text-primary" />
            <span className="font-medium">{completedSlugs.size} completed</span>
          </div>
        </div>

        {/* Recommended for You */}
        {!loading && feed && feed.recommended.length > 0 && (
          <section>
            <h2 className="mb-4 text-xl font-semibold">
              {feed.recommended.some((r) => !r.isGeneral)
                ? 'Recommended for You'
                : 'Popular Courses'}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {feed.recommended.slice(0, 6).map((module) => (
                <RecommendedCourseCard
                  key={module.slug}
                  module={module}
                  isCompleted={completedSlugs.has(module.slug)}
                  onStart={() => router.push(`/training/${module.slug}`)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-52 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        )}

        {/* All Courses */}
        <section>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold">All Courses</h2>

            {/* Tag filters */}
            <div className="flex flex-wrap gap-2">
              <Filter className="h-4 w-4 mt-1 text-muted-foreground" />
              {['costs', 'marketing', 'operations', 'hiring', 'compliance', 'finance'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    activeTag === tag
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {tag}
                </button>
              ))}
              {['beginner', 'intermediate', 'advanced'].map((level) => (
                <button
                  key={level}
                  onClick={() => setActiveLevel(activeLevel === level ? null : level)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    activeLevel === level
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {!loading && filteredCourses.length === 0 && (
            <p className="text-sm text-muted-foreground">No courses match the selected filters.</p>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => (
              <Card
                key={course.slug}
                className="flex flex-col transition-shadow hover:shadow-md cursor-pointer"
                onClick={() => router.push(`/training/${course.slug}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm leading-tight">{course.title}</h3>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${LEVEL_COLORS[course.level]}`}
                    >
                      {course.level}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{course.description}</p>
                </CardHeader>
                <CardContent className="flex-1 pb-2">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {course.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {course.modules} modules
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 gap-1 flex-wrap">
                  {course.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {completedSlugs.has(course.slug) && (
                    <Badge className="text-xs bg-green-100 text-green-700 border-0">
                      Completed
                    </Badge>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        {/* Certifications strip */}
        {completedSlugs.size > 0 && (
          <section className="rounded-xl border bg-muted/40 px-6 py-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Award className="h-6 w-6 text-amber-500" />
              <div>
                <p className="font-medium">
                  You have {completedSlugs.size} certificate{completedSlugs.size > 1 ? 's' : ''}
                </p>
                <p className="text-sm text-muted-foreground">
                  Visible on your RestoPapa profile
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push('/profile')}>
              View Profile
            </Button>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}

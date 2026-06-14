'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Award, BookOpen, CheckCircle2, ChevronLeft, Clock, PlayCircle } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

interface CourseDetail {
  slug: string;
  title: string;
  description: string;
  duration: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  modules: number;
  lessons?: string[];
}

const LEVEL_COLORS: Record<string, string> = {
  beginner: 'bg-green-100 text-green-700',
  intermediate: 'bg-amber-100 text-amber-700',
  advanced: 'bg-red-100 text-red-700',
};

export default function CourseDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [courseRes, completedRes] = await Promise.all([
          fetch(`${API_BASE}/training/courses/${slug}`),
          fetchCompletedSlugs(),
        ]);

        if (courseRes.ok) {
          const data = await courseRes.json();
          setCourse(data);
        }
        setIsCompleted(completedRes.includes(slug));
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    if (slug) load();
  }, [slug]);

  async function fetchCompletedSlugs(): Promise<string[]> {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return [];
      const res = await fetch(`${API_BASE}/training/certifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      const certs = await res.json();
      return certs.map((c: { courseSlug: string }) => c.courseSlug);
    } catch {
      return [];
    }
  }

  async function handleComplete() {
    const token = localStorage.getItem('accessToken');
    if (!token || !course) return;

    setCompleting(true);
    try {
      const res = await fetch(`${API_BASE}/training/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ courseSlug: course.slug }),
      });
      if (res.ok) {
        setIsCompleted(true);
      }
    } finally {
      setCompleting(false);
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-3xl px-4 py-12 space-y-4">
          <div className="h-8 w-48 rounded-lg bg-muted animate-pulse" />
          <div className="h-48 rounded-xl bg-muted animate-pulse" />
        </div>
      </DashboardLayout>
    );
  }

  if (!course) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-3xl px-4 py-12 text-center">
          <p className="text-muted-foreground">Course not found.</p>
          <Button className="mt-4" variant="outline" onClick={() => router.push('/training')}>
            Back to Academy
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl px-4 py-8 space-y-8">

        {/* Back navigation */}
        <button
          onClick={() => router.push('/training')}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Academy
        </button>

        {/* Course header */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{course.title}</h1>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${LEVEL_COLORS[course.level]}`}
            >
              {course.level}
            </span>
          </div>

          <p className="text-muted-foreground">{course.description}</p>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {course.duration}
            </span>
            <span className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              {course.modules} modules
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {course.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Module list */}
        {course.lessons && course.lessons.length > 0 && (
          <Card>
            <CardContent className="pt-5">
              <h2 className="font-semibold mb-3">What you will learn</h2>
              <ol className="space-y-2">
                {course.lessons.map((lesson, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {idx + 1}
                    </span>
                    <span className="text-sm text-muted-foreground pt-0.5">{lesson}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        )}

        {/* CTA */}
        <div className="rounded-xl border bg-muted/40 px-6 py-5 space-y-4">
          {isCompleted ? (
            <>
              <div className="flex items-center gap-3 text-green-700">
                <CheckCircle2 className="h-6 w-6" />
                <div>
                  <p className="font-semibold">Course Completed</p>
                  <p className="text-sm text-muted-foreground">
                    Your certificate is now visible on your profile.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => router.push('/profile')}
                >
                  <Award className="h-4 w-4" />
                  View Certificate
                </Button>
                <Button variant="ghost" onClick={() => router.push('/training')}>
                  Browse More Courses
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Complete all {course.modules} modules to earn your certificate.
              </p>
              <Button
                size="lg"
                className="gap-2 w-full sm:w-auto"
                onClick={handleComplete}
                disabled={completing}
              >
                <PlayCircle className="h-5 w-5" />
                {completing ? 'Saving...' : 'Mark as Complete & Earn Certificate'}
              </Button>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

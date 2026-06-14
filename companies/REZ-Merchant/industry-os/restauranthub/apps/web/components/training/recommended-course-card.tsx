'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { AlertTriangle, BookOpen, CheckCircle2, Clock } from 'lucide-react';

export interface RecommendedModule {
  slug: string;
  title: string;
  description: string;
  duration: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  modules: number;
  gapContext?: string;
  severity?: 'high' | 'medium' | 'low';
  isGeneral: boolean;
}

interface RecommendedCourseCardProps {
  module: RecommendedModule;
  gapContext?: string;
  isCompleted: boolean;
  onStart: () => void;
}

const levelColors: Record<string, string> = {
  beginner: 'bg-green-100 text-green-700',
  intermediate: 'bg-amber-100 text-amber-700',
  advanced: 'bg-red-100 text-red-700',
};

const severityBorder: Record<string, string> = {
  high: 'border-red-300',
  medium: 'border-amber-300',
  low: 'border-blue-200',
};

export function RecommendedCourseCard({
  module,
  gapContext,
  isCompleted,
  onStart,
}: RecommendedCourseCardProps) {
  const context = gapContext ?? module.gapContext;
  const borderClass = module.severity ? severityBorder[module.severity] : 'border-border';

  return (
    <Card className={`flex flex-col border ${borderClass} transition-shadow hover:shadow-md`}>
      <CardHeader className="pb-2">
        {context && (
          <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800 mb-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{context}</span>
          </div>
        )}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-base leading-tight">{module.title}</h3>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${levelColors[module.level]}`}
          >
            {module.level}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{module.description}</p>
      </CardHeader>

      <CardContent className="flex-1 pb-3">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {module.duration}
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" />
            {module.modules} modules
          </span>
        </div>

        <div className="flex flex-wrap gap-1 mt-3">
          {module.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        {isCompleted ? (
          <div className="flex w-full items-center justify-center gap-2 rounded-md bg-green-50 border border-green-200 py-2 text-sm font-medium text-green-700">
            <CheckCircle2 className="h-4 w-4" />
            Completed
          </div>
        ) : (
          <Button onClick={onStart} className="w-full" size="sm">
            Start Course
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

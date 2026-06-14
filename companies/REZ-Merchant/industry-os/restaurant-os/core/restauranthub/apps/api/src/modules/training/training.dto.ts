export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';
export type CourseTriggerCondition = 'above_peer_avg' | 'below_peer_avg';

export interface TrainingModule {
  slug: string;
  title: string;
  description: string;
  duration: string;
  level: CourseLevel;
  triggerMetric?: string;
  triggerCondition?: CourseTriggerCondition;
  tags: string[];
  modules: number;
  sponsored?: boolean;
  lessons?: string[];
}

export interface OperationalGap {
  metric: string;
  yourValue: number;
  peerAvg: number;
  severity: 'high' | 'medium' | 'low';
  trainingModuleSlug: string;
}

export interface RecommendedModule extends TrainingModule {
  gapContext?: string;
  severity?: 'high' | 'medium' | 'low';
  isGeneral: boolean;
}

export interface TrainingFeed {
  recommended: RecommendedModule[];
  allCourses: TrainingModule[];
  completedSlugs: string[];
}

export interface Certification {
  id: string;
  courseSlug: string;
  courseTitle: string;
  completedAt: Date;
  userId: string;
}

export interface CourseFilters {
  tag?: string;
  level?: CourseLevel;
}

export interface MarkCompleteDto {
  courseSlug: string;
}

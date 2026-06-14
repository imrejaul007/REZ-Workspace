'use client';

import { ClientProject } from '@/types';
import { formatCurrency, formatDate, getStatusColor, getStatusBgColor, cn } from '@/lib/utils';
import { Calendar, Users, FileText, ChevronRight, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface ProjectCardProps {
  project: ClientProject;
}

const statusLabels: Record<string, string> = {
  planning: 'Planning',
  in_progress: 'In Progress',
  review: 'In Review',
  completed: 'Completed',
};

export default function ProjectCard({ project }: ProjectCardProps) {
  const progressColor = getStatusBgColor(project.status);
  const daysUntilEnd = Math.ceil(
    (new Date(project.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-card transition-all duration-300 group">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <span className="text-xs font-medium text-slate-400">{project.projectId}</span>
            <h3 className="font-heading font-semibold text-slate-900 mt-0.5 group-hover:text-primary-600 transition-colors">
              {project.name}
            </h3>
          </div>
          <span className={cn('px-3 py-1 rounded-full text-xs font-medium border', getStatusColor(project.status))}>
            {statusLabels[project.status]}
          </span>
        </div>

        <p className="text-sm text-slate-500 line-clamp-2">{project.description}</p>
      </div>

      {/* Progress */}
      <div className="px-6 pb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-500">Progress</span>
          <span className="text-xs font-semibold text-slate-700">{project.progress}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', progressColor)}
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <div>
              <p className="text-xs text-slate-400">Due Date</p>
              <p className="text-sm font-medium text-slate-700">
                {daysUntilEnd > 0 ? `${daysUntilEnd} days` : 'Overdue'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-slate-400" />
            <div>
              <p className="text-xs text-slate-400">Budget</p>
              <p className="text-sm font-medium text-slate-700">
                {formatCurrency(project.spent, project.currency)} / {formatCurrency(project.budget, project.currency)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Team & Documents Preview */}
      <div className="px-6 py-4 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {project.team.slice(0, 3).map((member) => (
                <div
                  key={member.id}
                  className="w-7 h-7 rounded-full bg-primary-100 border-2 border-white flex items-center justify-center"
                  title={member.name}
                >
                  <span className="text-xs font-medium text-primary-600">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
              ))}
              {project.team.length > 3 && (
                <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center">
                  <span className="text-xs font-medium text-slate-600">+{project.team.length - 3}</span>
                </div>
              )}
            </div>
            <span className="text-xs text-slate-500">{project.team.length} members</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <FileText className="w-4 h-4" />
            <span className="text-xs">{project.documents.length}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Link
        href={`/projects/${project.id}`}
        className="flex items-center justify-between px-6 py-3 bg-slate-50/50 border-t border-slate-100 group-hover:bg-primary-50/50 transition-colors"
      >
        <span className="text-sm font-medium text-slate-600 group-hover:text-primary-600 transition-colors">
          View Details
        </span>
        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
      </Link>
    </div>
  );
}

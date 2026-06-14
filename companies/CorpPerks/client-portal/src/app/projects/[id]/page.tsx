'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';
import { ClientProject, ClientUser } from '@/types';
import {
  Loader2,
  ArrowLeft,
  Calendar,
  Users,
  FileText,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Mail,
  ChevronRight,
} from 'lucide-react';
import { formatCurrency, formatDate, getStatusColor, getStatusBgColor, cn, getInitials } from '@/lib/utils';
import Link from 'next/link';

const statusLabels: Record<string, string> = {
  planning: 'Planning',
  in_progress: 'In Progress',
  review: 'In Review',
  completed: 'Completed',
};

const milestoneStatusConfig = {
  pending: { icon: Clock, color: 'text-slate-400', bg: 'bg-slate-100' },
  in_progress: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-100' },
  completed: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-100' },
  delayed: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-100' },
};

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<ClientUser | null>(null);
  const [project, setProject] = useState<ClientProject | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!api.isAuthenticated()) {
        router.push('/');
        return;
      }

      const [profileRes, projectRes] = await Promise.all([
        api.getProfile(),
        api.getProject(params.id as string),
      ]);

      if (!profileRes.success) {
        router.push('/');
        return;
      }

      setUser(profileRes.data as ClientUser);
      setProject(projectRes.data as ClientProject);
      setIsLoading(false);
    };

    loadData();
  }, [router, params.id]);

  const handleLogout = () => {
    api.logout();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">Project not found</p>
          <Link href="/projects" className="px-4 py-2 bg-primary-600 text-white rounded-lg">
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  const progressColor = getStatusBgColor(project.status);
  const completedMilestones = project.milestones.filter((m) => m.status === 'completed').length;
  const budgetUsed = (project.spent / project.budget) * 100;

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar clientName={user?.companyName} onLogout={handleLogout} />
      <main className="ml-64 p-8">
        {/* Back Button */}
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm text-slate-400">{project.projectId}</span>
                <span className={cn('px-3 py-1 rounded-full text-xs font-medium border', getStatusColor(project.status))}>
                  {statusLabels[project.status]}
                </span>
              </div>
              <h1 className="font-heading text-3xl font-bold text-slate-900 mb-2">{project.name}</h1>
              <p className="text-slate-500 max-w-2xl">{project.description}</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500 text-white hover:bg-primary-600 transition-colors">
              <Mail className="w-4 h-4" />
              Contact Team
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-600">Overall Progress</span>
              <span className="text-sm font-bold text-slate-900">{project.progress}%</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-500', progressColor)}
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Timeline</p>
                <p className="text-sm font-medium text-slate-700">
                  {formatDate(project.startDate)} - {formatDate(project.endDate)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Budget</p>
                <p className="text-sm font-medium text-slate-700">
                  {formatCurrency(project.spent, project.currency)} / {formatCurrency(project.budget, project.currency)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Milestones</p>
                <p className="text-sm font-medium text-slate-700">
                  {completedMilestones} / {project.milestones.length} completed
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Team Size</p>
                <p className="text-sm font-medium text-slate-700">{project.team.length} members</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Milestones */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="font-heading text-xl font-bold text-slate-900 mb-4">Milestones</h2>
              <div className="space-y-4">
                {project.milestones.map((milestone, idx) => {
                  const config = milestoneStatusConfig[milestone.status];
                  const Icon = config.icon;
                  const isLast = idx === project.milestones.length - 1;

                  return (
                    <div key={milestone.id} className="flex gap-4">
                      {/* Timeline */}
                      <div className="flex flex-col items-center">
                        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', config.bg)}>
                          <Icon className={cn('w-5 h-5', config.color)} />
                        </div>
                        {!isLast && (
                          <div className="w-0.5 flex-1 bg-slate-200 my-2" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 pb-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium text-slate-900">{milestone.name}</h3>
                            <p className="text-sm text-slate-500 mt-1">{milestone.description}</p>
                          </div>
                          <span className="text-sm text-slate-500">{formatDate(milestone.dueDate)}</span>
                        </div>
                        {milestone.completionDate && (
                          <p className="text-xs text-green-600 mt-2">
                            Completed on {formatDate(milestone.completionDate)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-xl font-bold text-slate-900">Project Documents</h2>
                <span className="text-sm text-slate-500">{project.documents.length} files</span>
              </div>
              <div className="space-y-3">
                {project.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 border border-slate-100 hover:bg-slate-100/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{doc.name}</p>
                        <p className="text-xs text-slate-500">by {doc.uploadedBy} on {formatDate(doc.uploadedAt)}</p>
                      </div>
                    </div>
                    <button className="p-2 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors">
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Team */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="font-heading text-xl font-bold text-slate-900 mb-4">Team Members</h2>
              <div className="space-y-4">
                {project.team.map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-sm font-semibold">
                      {getInitials(member.name)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{member.name}</p>
                      <p className="text-xs text-slate-500">{member.role}</p>
                    </div>
                    <a
                      href={`mailto:${member.email}`}
                      className="p-2 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Budget Breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="font-heading text-xl font-bold text-slate-900 mb-4">Budget Overview</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600">Budget Used</span>
                    <span className="text-sm font-medium text-slate-900">{budgetUsed.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full', budgetUsed > 90 ? 'bg-red-500' : budgetUsed > 75 ? 'bg-amber-500' : 'bg-green-500')}
                      style={{ width: `${Math.min(budgetUsed, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Total Budget</span>
                    <span className="font-medium text-slate-900">{formatCurrency(project.budget, project.currency)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Amount Spent</span>
                    <span className="font-medium text-slate-900">{formatCurrency(project.spent, project.currency)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Remaining</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(project.budget - project.spent, project.currency)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

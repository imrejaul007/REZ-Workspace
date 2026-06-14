'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import ProjectCard from '@/components/ProjectCard';
import api from '@/lib/api';
import { ClientProject, ClientUser } from '@/types';
import { Loader2, Search, Filter, FolderKanban, Plus } from 'lucide-react';

export default function ProjectsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<ClientUser | null>(null);
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    const loadData = async () => {
      if (!api.isAuthenticated()) {
        router.push('/');
        return;
      }

      const [profileRes, projectsRes] = await Promise.all([
        api.getProfile(),
        api.getProjects(),
      ]);

      if (!profileRes.success) {
        router.push('/');
        return;
      }

      setUser(profileRes.data as ClientUser);
      setProjects((projectsRes.data as ClientProject[]) || []);
      setIsLoading(false);
    };

    loadData();
  }, [router]);

  const handleLogout = () => {
    api.logout();
    router.push('/');
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: projects.length,
    planning: projects.filter((p) => p.status === 'planning').length,
    in_progress: projects.filter((p) => p.status === 'in_progress').length,
    review: projects.filter((p) => p.status === 'review').length,
    completed: projects.filter((p) => p.status === 'completed').length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar clientName={user?.companyName} onLogout={handleLogout} />
      <main className="ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-3xl font-bold text-slate-900 mb-2">Projects</h1>
              <p className="text-slate-500">
                Manage and track all your active projects
              </p>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {Object.entries(statusCounts).map(([status, count]) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`p-4 rounded-xl border transition-all ${
                filterStatus === status
                  ? 'bg-primary-50 border-primary-200 ring-2 ring-primary-500/20'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <p className="text-2xl font-bold text-slate-900">{count}</p>
              <p className="text-sm text-slate-500 capitalize">{status.replace('_', ' ')}</p>
            </button>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors">
            <Filter className="w-5 h-5 text-slate-500" />
            <span className="text-slate-600">Filter</span>
          </button>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <FolderKanban className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="font-heading font-semibold text-slate-900 mb-2">No projects found</h3>
            <p className="text-slate-500">
              {searchTerm
                ? 'Try adjusting your search terms'
                : 'No projects match the selected filter'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

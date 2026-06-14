'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, MoreVertical, Copy, Trash2, ExternalLink,
  Eye, BarChart3, Calendar, CheckCircle, Clock, Globe
} from 'lucide-react';

interface Form {
  id: string;
  title: string;
  description?: string;
  published: boolean;
  submissionCount: number;
  createdAt: string;
  updatedAt: string;
}

interface FormListProps {
  forms: Form[];
  onSelect: (form: Form) => void;
  onDelete: (formId: string) => void;
  onDuplicate: (form: Form) => void;
}

export function FormList({ forms, onSelect, onDelete, onDuplicate }: FormListProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (forms.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No forms yet</h3>
        <p className="text-gray-500 mb-6">Create your first form to start collecting responses</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {forms.map((form, index) => (
        <motion.div
          key={form.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer group"
          onClick={() => onSelect(form)}
        >
          {/* Card Header */}
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate group-hover:text-purple-600 transition-colors">
                  {form.title}
                </h3>
                {form.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {form.description}
                  </p>
                )}
              </div>

              {/* Menu */}
              <div className="relative ml-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenu(openMenu === form.id ? null : form.id);
                  }}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {openMenu === form.id && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenu(null);
                      }}
                    />
                    <div className="absolute right-0 top-8 z-20 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px]">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicate(form);
                          setOpenMenu(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Copy className="w-4 h-4" />
                        Duplicate
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`/f/${form.id}`, '_blank');
                          setOpenMenu(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Open form
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`/api/forms/${form.id}/analytics`, '_blank');
                          setOpenMenu(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <BarChart3 className="w-4 h-4" />
                        Analytics
                      </button>
                      <div className="border-t border-gray-100 my-1" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(form.id);
                          setOpenMenu(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Card Stats */}
          <div className="p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {form.submissionCount} responses
                </span>
              </div>
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                form.published
                  ? 'bg-green-50 text-green-600'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {form.published ? (
                  <>
                    <CheckCircle className="w-3 h-3" />
                    Published
                  </>
                ) : (
                  <>
                    <Clock className="w-3 h-3" />
                    Draft
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Calendar className="w-3.5 h-3.5" />
              Created {formatDate(form.createdAt)}
            </div>
          </div>

          {/* Hover Actions */}
          <div className="absolute inset-0 bg-purple-50 bg-opacity-0 group-hover:bg-opacity-50 rounded-xl transition-all pointer-events-none" />
        </motion.div>
      ))}
    </div>
  );
}
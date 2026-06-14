'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, Download, MoreVertical, Eye,
  Trash2, Mail, ChevronLeft, ChevronRight, CheckCircle,
  Clock, MapPin, Smartphone, Monitor, Tablet
} from 'lucide-react';

interface Submission {
  id: string;
  formId: string;
  userId?: string;
  answers: Answer[];
  submittedAt: string;
  deviceInfo?: {
    browser?: string;
    os?: string;
    device?: 'desktop' | 'mobile' | 'tablet';
  };
  completionTime?: number;
  workflowTriggered: boolean;
}

interface Answer {
  fieldId: string;
  value: any;
  type: string;
}

interface ResponseManagerProps {
  formId: string;
  fields: any[];
}

export function ResponseManager({ formId, fields }: ResponseManagerProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetchSubmissions();
  }, [formId, currentPage]);

  const fetchSubmissions = async () => {
    try {
      const res = await fetch(`/api/submissions/form/${formId}?page=${currentPage}&pageSize=${pageSize}`);
      const data = await res.json();
      setSubmissions(data.submissions || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFieldLabel = (fieldId: string) => {
    const field = fields.find((f: any) => f.id === fieldId);
    return field?.question || fieldId;
  };

  const formatAnswer = (answer: Answer) => {
    if (answer.value === null || answer.value === undefined) return '-';
    if (Array.isArray(answer.value)) return answer.value.join(', ');
    if (typeof answer.value === 'boolean') return answer.value ? 'Yes' : 'No';
    return String(answer.value);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDeviceIcon = (device?: string) => {
    switch (device) {
      case 'mobile': return Smartphone;
      case 'tablet': return Tablet;
      default: return Monitor;
    }
  };

  const filteredSubmissions = submissions.filter(submission => {
    if (!searchQuery) return true;
    return submission.answers.some(answer => {
      const value = String(answer.value || '').toLowerCase();
      return value.includes(searchQuery.toLowerCase());
    });
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Responses</h2>
          <p className="text-sm text-gray-500">{submissions.length} total responses</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search responses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-64 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Export */}
          <button
            onClick={() => window.open(`/api/submissions/form/${formId}/export`, '_blank')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Responses Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Date
                </th>
                {fields.slice(0, 3).map((field: any) => (
                  <th key={field.id} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {field.question.substring(0, 20)}{field.question.length > 20 ? '...' : ''}
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Device
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    No responses yet
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((submission) => {
                  const DeviceIcon = getDeviceIcon(submission.deviceInfo?.device);
                  return (
                    <tr key={submission.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {formatDate(submission.submittedAt)}
                      </td>
                      {fields.slice(0, 3).map((field: any) => {
                        const answer = submission.answers.find((a) => a.fieldId === field.id);
                        return (
                          <td key={field.id} className="px-4 py-3 text-sm text-gray-600 max-w-[150px] truncate">
                            {answer ? formatAnswer(answer) : '-'}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <DeviceIcon className="w-4 h-4" />
                          <span className="text-xs capitalize">{submission.deviceInfo?.device || 'desktop'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {submission.completionTime ? `${Math.round(submission.completionTime / 60)}m` : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedSubmission(submission)}
                          className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedSubmission && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedSubmission(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <div>
                  <h3 className="font-semibold text-gray-900">Response Details</h3>
                  <p className="text-sm text-gray-500">{formatDate(selectedSubmission.submittedAt)}</p>
                </div>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              <div className="p-5 overflow-y-auto max-h-[60vh]">
                <div className="space-y-4">
                  {fields.map((field: any) => {
                    const answer = selectedSubmission.answers.find((a) => a.fieldId === field.id);
                    return (
                      <div key={field.id} className="border-b border-gray-50 pb-4 last:border-0">
                        <label className="text-sm font-medium text-gray-500">{field.question}</label>
                        <p className="text-gray-900 mt-1">
                          {answer ? formatAnswer(answer) : <span className="text-gray-400 italic">No response</span>}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Meta Info */}
                <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500">Device</label>
                    <p className="text-sm text-gray-900 capitalize mt-1">
                      {selectedSubmission.deviceInfo?.device || 'Desktop'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Completion Time</label>
                    <p className="text-sm text-gray-900 mt-1">
                      {selectedSubmission.completionTime ? `${Math.round(selectedSubmission.completionTime / 60)} minutes` : '-'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Workflows Triggered</label>
                    <p className="text-sm text-gray-900 mt-1">
                      {selectedSubmission.workflowTriggered ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          Yes
                        </span>
                      ) : (
                        'No'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from '@/lib/toast';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  Users,
  Briefcase,
  CheckCircle,
  Building2,
  Phone,
  Mail,
  Star
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '/api';

interface JobDetail {
  id: string;
  title: string;
  company: string;
  companyEmail?: string;
  companyPhone?: string;
  location: string;
  type: string;
  salary: string;
  experience: string;
  postedDate: string;
  deadline: string;
  description: string;
  requirements: string[];
  benefits: string[];
  rating: number;
  applicants: number;
  status: 'Open' | 'Closed' | 'Draft';
}

function normalizeJobDetail(raw): JobDetail {
  const salaryParts: string[] = [];
  if (raw.salaryMin) salaryParts.push(`₹${raw.salaryMin.toLocaleString()}`);
  if (raw.salaryMax) salaryParts.push(`₹${raw.salaryMax.toLocaleString()}`);
  const salary = salaryParts.length > 0 ? salaryParts.join(' - ') + '/month' : 'Not specified';

  return {
    id: raw.id,
    title: raw.title,
    company: raw.restaurant?.name ?? 'Unknown',
    companyEmail: raw.restaurant?.email,
    companyPhone: raw.restaurant?.phone,
    location: raw.location ?? '',
    type: (raw.jobType ?? raw.employmentType ?? 'FULL_TIME')
      .replace('_', '-')
      .toLowerCase()
      .replace(/\b\w/g, (c: string) => c.toUpperCase()),
    salary,
    experience: raw.experience ?? '',
    postedDate: raw.createdAt ?? '',
    deadline: raw.validTill ?? raw.applicationDeadline ?? '',
    description: raw.description ?? '',
    requirements: raw.requirements ?? [],
    benefits: raw.benefits ?? [],
    rating: raw.restaurant?.rating ?? 0,
    applicants: raw.applicationCount ?? 0,
    status: raw.status === 'OPEN' ? 'Open' : raw.status === 'FILLED' ? 'Closed' : 'Closed',
  };
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [applicationData, setApplicationData] = useState({
    fullName: '',
    email: '',
    phone: '',
    experience: '',
    coverLetter: '',
    availableStartDate: ''
  });

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await fetch(`${API_BASE}/jobs/${params.id as string}`, {
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const raw = await res.json();
        setJob(normalizeJobDetail(raw));
      } catch {
        toast.error('Error loading job', 'Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Job not found or has been removed.</p>
          <button onClick={() => router.back()} className="text-blue-600 hover:underline">Go Back</button>
        </div>
      </div>
    );
  }

  const handleApplicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading('Submitting application...');

    try {
      const formData = new FormData();
      formData.append('coverLetter', applicationData.coverLetter);

      const res = await fetch(`${API_BASE}/jobs/${job.id}/apply`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message ?? `HTTP ${res.status}`);
      }

      toast.dismiss(loadingToast);
      toast.success('Application submitted successfully!', 'The employer will review your application and contact you soon.');
      setShowApplicationForm(false);
      setApplicationData({ fullName: '', email: '', phone: '', experience: '', coverLetter: '', availableStartDate: '' });
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Failed to submit application', error?.message ?? 'Please try again later.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Jobs
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              {/* Job Header */}
              <div className="border-b border-gray-200 pb-6 mb-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
                    <div className="flex items-center text-gray-600 mb-2">
                      <Building2 className="h-5 w-5 mr-2" />
                      <span className="text-lg">{job.company}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-5 w-5 mr-2" />
                      <span>{job.location}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center mb-2">
                      <Star className="h-5 w-5 text-yellow-400 mr-1" />
                      <span className="font-semibold">{job.rating}</span>
                    </div>
                    <div className="text-sm text-gray-500">{job.applicants} applicants</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center">
                    <Briefcase className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <div className="text-sm text-gray-500">Type</div>
                      <div className="font-semibold">{job.type}</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-green-600 mr-2" />
                    <div>
                      <div className="text-sm text-gray-500">Salary</div>
                      <div className="font-semibold">{job.salary}</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-purple-600 mr-2" />
                    <div>
                      <div className="text-sm text-gray-500">Experience</div>
                      <div className="font-semibold">{job.experience}</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-orange-600 mr-2" />
                    <div>
                      <div className="text-sm text-gray-500">Deadline</div>
                      <div className="font-semibold">{new Date(job.deadline).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Job Description */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Job Description</h2>
                <p className="text-gray-700 leading-relaxed">{job.description}</p>
              </div>

              {/* Requirements */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Requirements</h2>
                <ul className="space-y-2">
                  {job.requirements.map((requirement, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{requirement}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Benefits */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Benefits</h2>
                <ul className="space-y-2">
                  {job.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-xl p-6 sticky top-8"
            >
              {/* Apply Button */}
              <button
                onClick={() => setShowApplicationForm(true)}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 mb-6"
              >
                Apply Now
              </button>

              {/* Contact Information */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-3">
                  {job.companyEmail && (
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 text-blue-600 mr-3" />
                      <a href={`mailto:${job.companyEmail}`} className="text-gray-700 hover:text-blue-600 transition-colors">
                        {job.companyEmail}
                      </a>
                    </div>
                  )}
                  {job.companyPhone && (
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 text-green-600 mr-3" />
                      <a href={`tel:${job.companyPhone}`} className="text-gray-700 hover:text-green-600 transition-colors">
                        {job.companyPhone}
                      </a>
                    </div>
                  )}
                  {!job.companyEmail && !job.companyPhone && (
                    <p className="text-gray-500 text-sm">Contact information not available.</p>
                  )}
                </div>
              </div>

              {/* Job Stats */}
              <div className="border-t border-gray-200 pt-6 mt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Job Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Posted Date</span>
                    <span className="font-semibold">{new Date(job.postedDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status</span>
                    <span className={`font-semibold ${job.status === 'Open' ? 'text-green-600' : 'text-red-600'}`}>
                      {job.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Applicants</span>
                    <span className="font-semibold">{job.applicants}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Application Form Modal */}
      {showApplicationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Apply for {job.title}</h2>
                <button
                  onClick={() => setShowApplicationForm(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleApplicationSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      required
                      value={applicationData.fullName}
                      onChange={(e) => setApplicationData({...applicationData, fullName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      required
                      value={applicationData.email}
                      onChange={(e) => setApplicationData({...applicationData, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      required
                      value={applicationData.phone}
                      onChange={(e) => setApplicationData({...applicationData, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Available Start Date</label>
                    <input
                      type="date"
                      required
                      value={applicationData.availableStartDate}
                      onChange={(e) => setApplicationData({...applicationData, availableStartDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                  <input
                    type="text"
                    required
                    value={applicationData.experience}
                    onChange={(e) => setApplicationData({...applicationData, experience: e.target.value})}
                    placeholder="e.g., 3 years"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cover Letter</label>
                  <textarea
                    required
                    value={applicationData.coverLetter}
                    onChange={(e) => setApplicationData({...applicationData, coverLetter: e.target.value})}
                    rows={4}
                    placeholder="Tell us why you're interested in this position..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowApplicationForm(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
                  >
                    Submit Application
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
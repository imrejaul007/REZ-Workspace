'use client';

import { useState } from 'react';

interface Job {
  id: string;
  title: string;
  restaurantName: string;
  restaurantLogo?: string;
  location: string;
  employmentType: 'full_time' | 'part_time' | 'contract' | 'internship';
  experience: string;
  salary: {
    min: number;
    max: number;
    currency: string;
    period: 'month' | 'hour' | 'year';
  };
  description: string;
  requirements: string[];
  benefits: string[];
  skills: string[];
  postedDate: string;
  deadline: string;
  applicationStatus?: 'not_applied' | 'applied' | 'shortlisted' | 'interview' | 'rejected' | 'hired';
  isBookmarked: boolean;
  matchScore: number;
  urgentHiring: boolean;
}

export default function JobSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedExperience, setSelectedExperience] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [bookmarkedJobs, setBookmarkedJobs] = useState<Set<string>>(new Set());

  const jobs: Job[] = [
    {
      id: 'job_001',
      title: 'Head Chef',
      restaurantName: 'Spice Garden Delhi',
      restaurantLogo: '🍽️',
      location: 'Delhi',
      employmentType: 'full_time',
      experience: '5-8 years',
      salary: { min: 45000, max: 65000, currency: 'INR', period: 'month' },
      description: 'We are looking for an experienced Head Chef to join our award-winning team. You will be responsible for menu planning, kitchen operations, and leading a team of 15+ kitchen staff.',
      requirements: [
        'Minimum 5 years of experience in Indian cuisine',
        'Proven leadership and team management skills',
        'Knowledge of food safety and hygiene standards',
        'Ability to work in high-pressure environment',
        'Creativity in menu development'
      ],
      benefits: [
        'Competitive salary package',
        'Health insurance',
        'Performance bonuses',
        'Professional development opportunities',
        'Free meals during shifts'
      ],
      skills: ['Indian Cuisine', 'Menu Planning', 'Team Leadership', 'Food Safety', 'Cost Control'],
      postedDate: '2025-01-15',
      deadline: '2025-01-30',
      applicationStatus: 'not_applied',
      isBookmarked: false,
      matchScore: 95,
      urgentHiring: true
    },
    {
      id: 'job_002',
      title: 'Sous Chef',
      restaurantName: 'Ocean Grill Mumbai',
      restaurantLogo: '🦐',
      location: 'Mumbai',
      employmentType: 'full_time',
      experience: '3-5 years',
      salary: { min: 35000, max: 45000, currency: 'INR', period: 'month' },
      description: 'Join our dynamic kitchen team as Sous Chef. Support the Head Chef in daily operations, food preparation, and maintaining quality standards.',
      requirements: [
        '3+ years experience in professional kitchen',
        'Strong knowledge of seafood preparation',
        'Good communication skills',
        'Flexibility with working hours',
        'Culinary degree preferred'
      ],
      benefits: [
        'Competitive salary',
        'Tips sharing',
        'Career advancement opportunities',
        'Staff training programs',
        'Transportation allowance'
      ],
      skills: ['Seafood Cooking', 'Kitchen Operations', 'Quality Control', 'Food Presentation'],
      postedDate: '2025-01-14',
      deadline: '2025-01-28',
      applicationStatus: 'applied',
      isBookmarked: true,
      matchScore: 88,
      urgentHiring: false
    },
    {
      id: 'job_003',
      title: 'Restaurant Manager',
      restaurantName: 'Café Paradise Bangalore',
      restaurantLogo: '☕',
      location: 'Bangalore',
      employmentType: 'full_time',
      experience: '4-6 years',
      salary: { min: 40000, max: 55000, currency: 'INR', period: 'month' },
      description: 'Seeking an experienced Restaurant Manager to oversee daily operations, manage staff, and ensure excellent customer service.',
      requirements: [
        'Minimum 4 years in restaurant management',
        'Strong leadership and communication skills',
        'Knowledge of POS systems and inventory management',
        'Customer service excellence',
        'Bachelor\'s degree in hospitality preferred'
      ],
      benefits: [
        'Attractive salary package',
        'Performance incentives',
        'Health and life insurance',
        'Paid time off',
        'Employee discounts'
      ],
      skills: ['Restaurant Management', 'Staff Management', 'Customer Service', 'POS Systems', 'Inventory Management'],
      postedDate: '2025-01-13',
      deadline: '2025-01-27',
      applicationStatus: 'interview',
      isBookmarked: true,
      matchScore: 82,
      urgentHiring: false
    },
    {
      id: 'job_004',
      title: 'Waiter/Waitress',
      restaurantName: 'Downtown Bistro Delhi',
      restaurantLogo: '🍷',
      location: 'Delhi',
      employmentType: 'part_time',
      experience: '1-2 years',
      salary: { min: 18000, max: 25000, currency: 'INR', period: 'month' },
      description: 'Looking for energetic and customer-focused waiters/waitresses for our busy bistro. Great opportunity for students and part-time workers.',
      requirements: [
        'Previous experience in food service preferred',
        'Excellent communication skills',
        'Friendly and professional demeanor',
        'Ability to work in fast-paced environment',
        'Basic English proficiency'
      ],
      benefits: [
        'Flexible working hours',
        'Tips included',
        'Staff meals',
        'Training provided',
        'Friendly work environment'
      ],
      skills: ['Customer Service', 'Communication', 'Multitasking', 'Point of Sale'],
      postedDate: '2025-01-12',
      deadline: '2025-01-25',
      applicationStatus: 'shortlisted',
      isBookmarked: false,
      matchScore: 75,
      urgentHiring: true
    },
    {
      id: 'job_005',
      title: 'Bartender',
      restaurantName: 'Rooftop Lounge Mumbai',
      restaurantLogo: '🍸',
      location: 'Mumbai',
      employmentType: 'full_time',
      experience: '2-4 years',
      salary: { min: 28000, max: 38000, currency: 'INR', period: 'month' },
      description: 'Join our upscale rooftop lounge as a skilled bartender. Create exceptional cocktails and provide top-notch service to our discerning clientele.',
      requirements: [
        '2+ years bartending experience',
        'Knowledge of classic and modern cocktails',
        'Flair bartending skills preferred',
        'Strong personality and communication skills',
        'Ability to work late hours'
      ],
      benefits: [
        'Competitive salary + tips',
        'Creative freedom with cocktail menu',
        'Premium work environment',
        'Staff training and certification',
        'Night shift allowance'
      ],
      skills: ['Bartending', 'Cocktail Making', 'Customer Interaction', 'Inventory Management'],
      postedDate: '2025-01-11',
      deadline: '2025-01-26',
      applicationStatus: 'rejected',
      isBookmarked: false,
      matchScore: 68,
      urgentHiring: false
    },
    {
      id: 'job_006',
      title: 'Kitchen Assistant',
      restaurantName: 'Quick Bites Chennai',
      restaurantLogo: '🍟',
      location: 'Chennai',
      employmentType: 'full_time',
      experience: '0-1 years',
      salary: { min: 15000, max: 22000, currency: 'INR', period: 'month' },
      description: 'Entry-level position for someone looking to start their career in the food industry. Learn from experienced chefs and grow with us.',
      requirements: [
        'No prior experience required',
        'Willingness to learn',
        'Physical stamina for standing long hours',
        'Basic hygiene knowledge',
        'Team player attitude'
      ],
      benefits: [
        'Training provided',
        'Career growth opportunities',
        'Free meals',
        'Flexible schedules',
        'Supportive work environment'
      ],
      skills: ['Food Preparation', 'Kitchen Hygiene', 'Teamwork', 'Time Management'],
      postedDate: '2025-01-10',
      deadline: '2025-01-24',
      applicationStatus: 'not_applied',
      isBookmarked: true,
      matchScore: 60,
      urgentHiring: false
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_applied': return 'bg-gray-100 text-gray-800';
      case 'applied': return 'bg-blue-100 text-blue-800';
      case 'shortlisted': return 'bg-yellow-100 text-yellow-800';
      case 'interview': return 'bg-purple-100 text-purple-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'hired': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEmploymentTypeColor = (type: string) => {
    switch (type) {
      case 'full_time': return 'bg-green-100 text-green-800';
      case 'part_time': return 'bg-blue-100 text-blue-800';
      case 'contract': return 'bg-orange-100 text-orange-800';
      case 'internship': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatSalary = (salary: Job['salary']) => {
    const formatter = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: salary.currency,
      maximumFractionDigits: 0
    });
    
    if (salary.min === salary.max) {
      return `${formatter.format(salary.min)}/${salary.period}`;
    }
    return `${formatter.format(salary.min)} - ${formatter.format(salary.max)}/${salary.period}`;
  };

  const toggleBookmark = (jobId: string) => {
    const newBookmarks = new Set(bookmarkedJobs);
    if (newBookmarks.has(jobId)) {
      newBookmarks.delete(jobId);
    } else {
      newBookmarks.add(jobId);
    }
    setBookmarkedJobs(newBookmarks);
  };

  const applyForJob = (jobId: string) => {
    // In a real app, this would make an API call
    logger.info(`Applying for job: ${jobId}`);
    alert('Application submitted successfully!');
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = searchTerm === '' ||
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.restaurantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesLocation = selectedLocation === 'all' || job.location === selectedLocation;
    const matchesType = selectedType === 'all' || job.employmentType === selectedType;
    const matchesExperience = selectedExperience === 'all' || job.experience.includes(selectedExperience);
    
    return matchesSearch && matchesLocation && matchesType && matchesExperience;
  });

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
      case 'salary':
        return b.salary.max - a.salary.max;
      case 'match':
        return b.matchScore - a.matchScore;
      default: // relevance
        return b.matchScore - a.matchScore;
    }
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Job Search</h1>
          <p className="mt-2 text-gray-600">Discover exciting opportunities in the restaurant industry</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-blue-600 text-xl">💼</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                <p className="text-lg font-semibold text-gray-900">{jobs.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-green-600 text-xl">📋</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Applied</p>
                <p className="text-lg font-semibold text-gray-900">
                  {jobs.filter(j => j.applicationStatus !== 'not_applied').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <span className="text-yellow-600 text-xl">⭐</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Bookmarked</p>
                <p className="text-lg font-semibold text-gray-900">{bookmarkedJobs.size}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-purple-600 text-xl">🎯</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Interviews</p>
                <p className="text-lg font-semibold text-gray-900">
                  {jobs.filter(j => j.applicationStatus === 'interview').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2">
            <input
              type="text"
              placeholder="Search jobs, companies, skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <select 
            value={selectedLocation} 
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Locations</option>
            <option value="Mumbai">Mumbai</option>
            <option value="Delhi">Delhi</option>
            <option value="Bangalore">Bangalore</option>
            <option value="Chennai">Chennai</option>
          </select>
          
          <select 
            value={selectedType} 
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Types</option>
            <option value="full_time">Full Time</option>
            <option value="part_time">Part Time</option>
            <option value="contract">Contract</option>
            <option value="internship">Internship</option>
          </select>
          
          <select 
            value={selectedExperience} 
            onChange={(e) => setSelectedExperience(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Experience</option>
            <option value="0">Entry Level</option>
            <option value="1">1-2 years</option>
            <option value="3">3-5 years</option>
            <option value="5">5+ years</option>
          </select>
          
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="relevance">Most Relevant</option>
            <option value="date">Newest First</option>
            <option value="salary">Highest Salary</option>
            <option value="match">Best Match</option>
          </select>
        </div>

        <div className="space-y-6">
          {sortedJobs.map((job) => (
            <div key={job.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                      {job.restaurantLogo}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                        {job.urgentHiring && (
                          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                            Urgent Hiring
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 font-medium">{job.restaurantName}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        <span>📍 {job.location}</span>
                        <span>💰 {formatSalary(job.salary)}</span>
                        <span>📅 {job.experience}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="text-center">
                      <div className="text-sm font-medium text-green-600">{job.matchScore}%</div>
                      <div className="text-xs text-gray-500">Match</div>
                    </div>
                    <button
                      onClick={() => toggleBookmark(job.id)}
                      className={`p-2 rounded-full hover:bg-gray-100 ${
                        bookmarkedJobs.has(job.id) ? 'text-yellow-500' : 'text-gray-400'
                      }`}
                    >
                      ⭐
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEmploymentTypeColor(job.employmentType)}`}>
                    {job.employmentType.replace('_', ' ')}
                  </span>
                  {job.applicationStatus !== 'not_applied' && (
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(job.applicationStatus)}`}>
                      {job.applicationStatus?.replace('_', ' ')}
                    </span>
                  )}
                  {job.skills.slice(0, 3).map((skill) => (
                    <span key={skill} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                      {skill}
                    </span>
                  ))}
                  {job.skills.length > 3 && (
                    <span className="text-xs text-gray-500">+{job.skills.length - 3} more</span>
                  )}
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{job.description}</p>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    Posted on {new Date(job.postedDate).toLocaleDateString('en-IN')} • 
                    Apply by {new Date(job.deadline).toLocaleDateString('en-IN')}
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedJob(job)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      View Details
                    </button>
                    {job.applicationStatus === 'not_applied' && (
                      <button
                        onClick={() => applyForJob(job.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Apply Now
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {sortedJobs.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl text-gray-300 mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-500">Try adjusting your search criteria</p>
          </div>
        )}

        {selectedJob && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-3xl">
                    {selectedJob.restaurantLogo}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{selectedJob.title}</h3>
                    <p className="text-lg text-gray-600">{selectedJob.restaurantName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="px-6 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Job Description</h4>
                      <p className="text-gray-700 leading-relaxed">{selectedJob.description}</p>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Requirements</h4>
                      <ul className="space-y-2">
                        {selectedJob.requirements.map((req, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-blue-500 mr-2 mt-1">•</span>
                            <span className="text-gray-700">{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Benefits</h4>
                      <ul className="space-y-2">
                        {selectedJob.benefits.map((benefit, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-green-500 mr-2 mt-1">✓</span>
                            <span className="text-gray-700">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Required Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedJob.skills.map((skill) => (
                          <span key={skill} className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h5 className="font-semibold text-gray-900 mb-3">Job Details</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Location:</span>
                          <span className="text-gray-900">{selectedJob.location}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Type:</span>
                          <span className="text-gray-900">{selectedJob.employmentType.replace('_', ' ')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Experience:</span>
                          <span className="text-gray-900">{selectedJob.experience}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Salary:</span>
                          <span className="text-gray-900 font-semibold">{formatSalary(selectedJob.salary)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Posted:</span>
                          <span className="text-gray-900">
                            {new Date(selectedJob.postedDate).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Deadline:</span>
                          <span className="text-gray-900">
                            {new Date(selectedJob.deadline).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg">
                      <h5 className="font-semibold text-green-800 mb-2">Match Score</h5>
                      <div className="text-3xl font-bold text-green-600">{selectedJob.matchScore}%</div>
                      <p className="text-sm text-green-700 mt-1">Great match for your profile!</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
                <div className="flex space-x-2">
                  <button
                    onClick={() => toggleBookmark(selectedJob.id)}
                    className={`px-4 py-2 border rounded-lg ${
                      bookmarkedJobs.has(selectedJob.id) 
                        ? 'border-yellow-300 text-yellow-600 bg-yellow-50' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {bookmarkedJobs.has(selectedJob.id) ? '⭐ Bookmarked' : '⭐ Bookmark'}
                  </button>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedJob(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Close
                  </button>
                  {selectedJob.applicationStatus === 'not_applied' && (
                    <button
                      onClick={() => {
                        applyForJob(selectedJob.id);
                        setSelectedJob(null);
                      }}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Apply for this Job
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
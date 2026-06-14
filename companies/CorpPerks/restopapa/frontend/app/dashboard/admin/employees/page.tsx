'use client';

import React, { useState } from 'react';
import { 
  UserIcon,
  ShieldCheckIcon,
  BriefcaseIcon,
  StarIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  IdentificationIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  EyeIcon,
  PencilIcon,
  MagnifyingGlassIcon,
  FlagIcon,
  ClockIcon,
  BanknotesIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  aadharNumber: string;
  address: string;
  profilePhoto: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  verificationStatus: 'verified' | 'pending' | 'rejected';
  experience: number;
  skills: string[];
  certifications: string[];
  rating: number;
  totalReviews: number;
  totalJobs: number;
  completedJobs: number;
  currentEmployer: string | null;
  expectedSalary: number;
  preferredLocation: string[];
  joinedDate: string;
  lastActive: string;
  flaggedIncidents: {
    type: 'theft' | 'behavior' | 'fraud' | 'attendance';
    description: string;
    date: string;
    reportedBy: string;
    status: 'investigating' | 'resolved' | 'dismissed';
  }[];
  workHistory: {
    restaurant: string;
    position: string;
    duration: string;
    rating: number;
    endReason: string;
  }[];
  documents: {
    aadhar: boolean;
    pan: boolean;
    bankDetails: boolean;
    policeClearance: boolean;
    medicalCertificate: boolean;
  };
}

const EmployeesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterVerification, setFilterVerification] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const [employees] = useState<Employee[]>([
    {
      id: '1',
      name: 'Rahul Kumar',
      email: 'rahul.kumar@email.com',
      phone: '+91-9876543210',
      aadharNumber: 'XXXX-XXXX-1234',
      address: 'JP Nagar, Bangalore, Karnataka',
      profilePhoto: '/api/placeholder/100/100',
      status: 'active',
      verificationStatus: 'verified',
      experience: 5,
      skills: ['South Indian Cooking', 'Kitchen Management', 'Food Safety'],
      certifications: ['Food Safety Certification', 'Hotel Management Diploma'],
      rating: 4.7,
      totalReviews: 45,
      totalJobs: 12,
      completedJobs: 11,
      currentEmployer: 'Spice Garden Restaurant',
      expectedSalary: 25000,
      preferredLocation: ['Bangalore', 'Chennai'],
      joinedDate: '2024-01-10',
      lastActive: '2 hours ago',
      flaggedIncidents: [],
      workHistory: [
        {
          restaurant: 'Taste of India',
          position: 'Sous Chef',
          duration: '2 years',
          rating: 4.5,
          endReason: 'Career growth'
        }
      ],
      documents: {
        aadhar: true,
        pan: true,
        bankDetails: true,
        policeClearance: true,
        medicalCertificate: true
      }
    },
    {
      id: '2',
      name: 'Priya Sharma',
      email: 'priya.sharma@email.com',
      phone: '+91-9876543211',
      aadharNumber: 'XXXX-XXXX-5678',
      address: 'Whitefield, Bangalore, Karnataka',
      profilePhoto: '/api/placeholder/100/100',
      status: 'active',
      verificationStatus: 'verified',
      experience: 3,
      skills: ['Customer Service', 'Order Management', 'POS Systems'],
      certifications: ['Customer Service Excellence'],
      rating: 4.4,
      totalReviews: 28,
      totalJobs: 8,
      completedJobs: 7,
      currentEmployer: null,
      expectedSalary: 18000,
      preferredLocation: ['Bangalore'],
      joinedDate: '2024-02-15',
      lastActive: '1 day ago',
      flaggedIncidents: [],
      workHistory: [
        {
          restaurant: 'Green Leaf Cafe',
          position: 'Server',
          duration: '1 year',
          rating: 4.2,
          endReason: 'Completed contract'
        }
      ],
      documents: {
        aadhar: true,
        pan: false,
        bankDetails: true,
        policeClearance: true,
        medicalCertificate: true
      }
    },
    {
      id: '3',
      name: 'Ahmed Ali',
      email: 'ahmed.ali@email.com',
      phone: '+91-9876543212',
      aadharNumber: 'XXXX-XXXX-9012',
      address: 'HSR Layout, Bangalore, Karnataka',
      profilePhoto: '/api/placeholder/100/100',
      status: 'suspended',
      verificationStatus: 'verified',
      experience: 7,
      skills: ['Biryani Making', 'Meat Preparation', 'Spice Blending'],
      certifications: ['Advanced Culinary Arts', 'Halal Certification'],
      rating: 4.1,
      totalReviews: 62,
      totalJobs: 15,
      completedJobs: 13,
      currentEmployer: null,
      expectedSalary: 35000,
      preferredLocation: ['Bangalore', 'Hyderabad'],
      joinedDate: '2023-11-20',
      lastActive: '1 week ago',
      flaggedIncidents: [
        {
          type: 'behavior',
          description: 'Reported for inappropriate behavior with kitchen staff',
          date: '2024-03-05',
          reportedBy: 'Biryani Palace Management',
          status: 'investigating'
        }
      ],
      workHistory: [
        {
          restaurant: 'Royal Biryani House',
          position: 'Head Chef',
          duration: '3 years',
          rating: 4.6,
          endReason: 'Career change'
        }
      ],
      documents: {
        aadhar: true,
        pan: true,
        bankDetails: true,
        policeClearance: false,
        medicalCertificate: true
      }
    },
    {
      id: '4',
      name: 'Maria D\'Souza',
      email: 'maria.dsouza@email.com',
      phone: '+91-9876543213',
      aadharNumber: 'XXXX-XXXX-3456',
      address: 'Indiranagar, Bangalore, Karnataka',
      profilePhoto: '/api/placeholder/100/100',
      status: 'pending',
      verificationStatus: 'pending',
      experience: 1,
      skills: ['Housekeeping', 'Table Service', 'Basic Cooking'],
      certifications: [],
      rating: 0,
      totalReviews: 0,
      totalJobs: 0,
      completedJobs: 0,
      currentEmployer: null,
      expectedSalary: 15000,
      preferredLocation: ['Bangalore'],
      joinedDate: '2024-03-12',
      lastActive: '3 hours ago',
      flaggedIncidents: [],
      workHistory: [],
      documents: {
        aadhar: true,
        pan: false,
        bankDetails: false,
        policeClearance: false,
        medicalCertificate: false
      }
    }
  ]);

  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      suspended: 'bg-red-100 text-red-800'
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  const getVerificationBadge = (status: string) => {
    const badges = {
      verified: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  const handleViewDetails = (employee: Employee) => {
    setSelectedEmployee(employee);
  };

  const handleApprove = (id: string) => {
    logger.info('Approving employee:', id);
  };

  const handleSuspend = (id: string) => {
    logger.info('Suspending employee:', id);
  };

  const handleFlag = (id: string) => {
    logger.info('Flagging employee:', id);
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.aadharNumber.includes(searchTerm) ||
                         employee.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || employee.status === filterStatus;
    const matchesVerification = filterVerification === 'all' || employee.verificationStatus === filterVerification;
    
    return matchesSearch && matchesStatus && matchesVerification;
  });

  if (selectedEmployee) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setSelectedEmployee(null)}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{selectedEmployee.name}</h1>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(selectedEmployee.status)}`}>
            {selectedEmployee.status}
          </span>
          {selectedEmployee.flaggedIncidents.length > 0 && (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
              {selectedEmployee.flaggedIncidents.length} Incident(s)
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-900">{selectedEmployee.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <PhoneIcon className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-900">{selectedEmployee.phone}</span>
              </div>
              <div className="flex items-center space-x-2">
                <IdentificationIcon className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Aadhar:</span>
                <span className="text-sm text-gray-900">{selectedEmployee.aadharNumber}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPinIcon className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-900">{selectedEmployee.address}</span>
              </div>
              <div className="flex items-center space-x-2">
                <BanknotesIcon className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Expected:</span>
                <span className="text-sm text-gray-900">₹{selectedEmployee.expectedSalary.toLocaleString()}/month</span>
              </div>
            </div>
          </div>

          {/* Professional Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Professional Profile</h3>
            <div className="space-y-4">
              <div>
                <span className="text-sm text-gray-600">Experience:</span>
                <span className="text-sm text-gray-900 ml-2">{selectedEmployee.experience} years</span>
              </div>
              
              <div>
                <span className="text-sm text-gray-600 block mb-2">Skills:</span>
                <div className="flex flex-wrap gap-1">
                  {selectedEmployee.skills.map((skill, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {selectedEmployee.certifications.length > 0 && (
                <div>
                  <span className="text-sm text-gray-600 block mb-2">Certifications:</span>
                  <div className="space-y-1">
                    {selectedEmployee.certifications.map((cert, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircleIcon className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-900">{cert}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedEmployee.currentEmployer && (
                <div>
                  <span className="text-sm text-gray-600">Current Employer:</span>
                  <span className="text-sm text-gray-900 ml-2">{selectedEmployee.currentEmployer}</span>
                </div>
              )}
            </div>
          </div>

          {/* Performance Stats */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Performance</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <StarIcon className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-lg font-semibold">{selectedEmployee.rating}</span>
                  <span className="text-sm text-gray-600">({selectedEmployee.totalReviews} reviews)</span>
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-600">Total Jobs</div>
                <div className="text-xl font-semibold text-gray-900">{selectedEmployee.totalJobs}</div>
              </div>
              
              <div>
                <div className="text-sm text-gray-600">Completed Jobs</div>
                <div className="text-xl font-semibold text-green-600">{selectedEmployee.completedJobs}</div>
              </div>

              {selectedEmployee.totalJobs > 0 && (
                <div>
                  <div className="text-sm text-gray-600 mb-1">Completion Rate</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${(selectedEmployee.completedJobs / selectedEmployee.totalJobs) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-sm text-gray-900 mt-1">
                    {Math.round((selectedEmployee.completedJobs / selectedEmployee.totalJobs) * 100)}%
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Documents & Verification */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Documents & Verification</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Aadhar Card</span>
                {selectedEmployee.documents.aadhar ? (
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                ) : (
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">PAN Card</span>
                {selectedEmployee.documents.pan ? (
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                ) : (
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Bank Details</span>
                {selectedEmployee.documents.bankDetails ? (
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                ) : (
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Police Clearance</span>
                {selectedEmployee.documents.policeClearance ? (
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                ) : (
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Medical Certificate</span>
                {selectedEmployee.documents.medicalCertificate ? (
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                ) : (
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Actions & Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Verification Status</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getVerificationBadge(selectedEmployee.verificationStatus)}`}>
                  {selectedEmployee.verificationStatus}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Account Status</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(selectedEmployee.status)}`}>
                  {selectedEmployee.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Joined</span>
                <span className="text-sm text-gray-900">{new Date(selectedEmployee.joinedDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last Active</span>
                <span className="text-sm text-gray-900">{selectedEmployee.lastActive}</span>
              </div>
            </div>
            
            <div className="mt-6 space-y-2">
              {selectedEmployee.status === 'pending' && (
                <button 
                  onClick={() => handleApprove(selectedEmployee.id)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                >
                  Approve Employee
                </button>
              )}
              {selectedEmployee.status === 'active' && (
                <button 
                  onClick={() => handleSuspend(selectedEmployee.id)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                >
                  Suspend Employee
                </button>
              )}
              <button 
                onClick={() => handleFlag(selectedEmployee.id)}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg"
              >
                Flag for Review
              </button>
            </div>
          </div>
        </div>

        {/* Flagged Incidents */}
        {selectedEmployee.flaggedIncidents.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FlagIcon className="w-5 h-5 text-red-500 mr-2" />
              Flagged Incidents
            </h3>
            <div className="space-y-4">
              {selectedEmployee.flaggedIncidents.map((incident, index) => (
                <div key={index} className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-red-900 capitalize">{incident.type}</span>
                    <span className="text-sm text-red-600">{new Date(incident.date).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-red-800 mb-2">{incident.description}</p>
                  <div className="flex items-center justify-between text-xs text-red-600">
                    <span>Reported by: {incident.reportedBy}</span>
                    <span className="capitalize">{incident.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Work History */}
        {selectedEmployee.workHistory.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Work History</h3>
            <div className="space-y-4">
              {selectedEmployee.workHistory.map((work, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">{work.position}</h4>
                      <p className="text-sm text-gray-600">{work.restaurant}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-1">
                        <StarIcon className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm text-gray-900">{work.rating}</span>
                      </div>
                      <p className="text-sm text-gray-600">{work.duration}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">Left: {work.endReason}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage employee profiles, verifications, and performance tracking
          </p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
            <UserIcon className="w-4 h-4" />
            <span>Add Employee</span>
          </button>
          <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
            <ChartBarIcon className="w-4 h-4" />
            <span>Analytics</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">{employees.filter(e => e.status === 'active').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{employees.filter(e => e.status === 'pending').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <FlagIcon className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Flagged</p>
              <p className="text-2xl font-bold text-gray-900">{employees.filter(e => e.flaggedIncidents.length > 0).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex space-x-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, Aadhar, or skills..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="suspended">Suspended</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={filterVerification}
          onChange={(e) => setFilterVerification(e.target.value)}
        >
          <option value="all">All Verification</option>
          <option value="verified">Verified</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Experience
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Job
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div>
                        <div className="text-sm font-medium text-gray-900 flex items-center space-x-2">
                          <span>{employee.name}</span>
                          {employee.flaggedIncidents.length > 0 && (
                            <FlagIcon className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{employee.aadharNumber}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900">{employee.email}</div>
                      <div className="text-sm text-gray-500">{employee.phone}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(employee.status)}`}>
                        {employee.status}
                      </span>
                      <br />
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getVerificationBadge(employee.verificationStatus)}`}>
                        {employee.verificationStatus}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.experience} years
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <StarIcon className="w-4 h-4 text-yellow-500 fill-current mr-1" />
                      <span className="text-sm text-gray-900">{employee.rating}</span>
                      <span className="text-sm text-gray-500 ml-1">({employee.totalReviews})</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.currentEmployer || 'Not employed'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button 
                      onClick={() => handleViewDetails(employee)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>
                    <button className="text-gray-600 hover:text-gray-900">
                      <PencilIcon className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmployeesPage;
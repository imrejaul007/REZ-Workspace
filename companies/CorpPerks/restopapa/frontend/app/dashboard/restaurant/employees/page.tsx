'use client';

import React, { useState } from 'react';
import { 
  UserPlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  StarIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CalendarIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  ShieldCheckIcon,
  FlagIcon,
  CurrencyDollarIcon,
  ClockIcon,
  DocumentTextIcon,
  IdentificationIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

interface Employee {
  id: string;
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    aadharNumber: string;
    address: {
      street: string;
      city: string;
      state: string;
      pincode: string;
    };
    dateOfBirth: string;
    maritalStatus: 'single' | 'married' | 'divorced' | 'widowed';
    emergencyContact: {
      name: string;
      relation: string;
      phone: string;
    };
    profilePhoto?: string;
  };
  professionalInfo: {
    position: string;
    department: string;
    employeeId: string;
    joiningDate: string;
    employmentType: 'full-time' | 'part-time' | 'contract' | 'intern';
    salary: number;
    experience: number;
    skills: string[];
    certifications: {
      name: string;
      issuer: string;
      issueDate: string;
      expiryDate?: string;
      verified: boolean;
    }[];
    previousExperience: {
      company: string;
      position: string;
      duration: string;
      reason: string;
    }[];
  };
  verification: {
    aadharVerified: boolean;
    backgroundCheck: boolean;
    referenceCheck: boolean;
    medicalClearance: boolean;
    policeClearance: boolean;
    verificationDate?: string;
    verifiedBy?: string;
  };
  performance: {
    rating: number;
    reviewCount: number;
    punctuality: number;
    workQuality: number;
    teamwork: number;
    lastReviewDate?: string;
  };
  workHistory: {
    totalDaysWorked: number;
    absentDays: number;
    lateDays: number;
    overtimeHours: number;
  };
  status: 'active' | 'inactive' | 'terminated' | 'suspended';
  tags: string[];
  flags: {
    type: 'positive' | 'negative' | 'neutral';
    reason: string;
    date: string;
    reportedBy: string;
  }[];
  documents: {
    aadharCard: { uploaded: boolean; verified: boolean };
    panCard: { uploaded: boolean; verified: boolean };
    bankPassbook: { uploaded: boolean; verified: boolean };
    educationCertificates: { uploaded: boolean; verified: boolean };
    experienceLetters: { uploaded: boolean; verified: boolean };
    medicalCertificate: { uploaded: boolean; verified: boolean };
    policeClearance: { uploaded: boolean; verified: boolean };
  };
}

const RestaurantEmployeesPage = () => {
  const [activeTab, setActiveTab] = useState<'current' | 'history' | 'applications'>('current');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const [employees] = useState<Employee[]>([
    {
      id: '1',
      personalInfo: {
        name: 'Rahul Kumar',
        email: 'rahul.kumar@email.com',
        phone: '+91-9876543210',
        aadharNumber: 'XXXX-XXXX-1234',
        address: {
          street: '123, MG Road',
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560001'
        },
        dateOfBirth: '1995-06-15',
        maritalStatus: 'married',
        emergencyContact: {
          name: 'Priya Kumar',
          relation: 'Wife',
          phone: '+91-9876543211'
        },
        profilePhoto: '/api/placeholder/100/100'
      },
      professionalInfo: {
        position: 'Head Chef',
        department: 'Kitchen',
        employeeId: 'EMP001',
        joiningDate: '2024-01-15',
        employmentType: 'full-time',
        salary: 35000,
        experience: 5,
        skills: ['South Indian Cooking', 'Menu Planning', 'Kitchen Management', 'Food Safety'],
        certifications: [
          {
            name: 'Food Safety Certification',
            issuer: 'FSSAI',
            issueDate: '2023-05-01',
            expiryDate: '2025-05-01',
            verified: true
          },
          {
            name: 'Hotel Management Diploma',
            issuer: 'IHM Bangalore',
            issueDate: '2020-06-01',
            verified: true
          }
        ],
        previousExperience: [
          {
            company: 'Spice Route Restaurant',
            position: 'Sous Chef',
            duration: '2 years',
            reason: 'Career growth'
          }
        ]
      },
      verification: {
        aadharVerified: true,
        backgroundCheck: true,
        referenceCheck: true,
        medicalClearance: true,
        policeClearance: true,
        verificationDate: '2024-01-10',
        verifiedBy: 'HR Team'
      },
      performance: {
        rating: 4.7,
        reviewCount: 12,
        punctuality: 95,
        workQuality: 92,
        teamwork: 88,
        lastReviewDate: '2024-02-15'
      },
      workHistory: {
        totalDaysWorked: 58,
        absentDays: 2,
        lateDays: 1,
        overtimeHours: 24
      },
      status: 'active',
      tags: ['experienced', 'skilled', 'reliable'],
      flags: [],
      documents: {
        aadharCard: { uploaded: true, verified: true },
        panCard: { uploaded: true, verified: true },
        bankPassbook: { uploaded: true, verified: true },
        educationCertificates: { uploaded: true, verified: true },
        experienceLetters: { uploaded: true, verified: true },
        medicalCertificate: { uploaded: true, verified: true },
        policeClearance: { uploaded: true, verified: true }
      }
    },
    {
      id: '2',
      personalInfo: {
        name: 'Priya Sharma',
        email: 'priya.sharma@email.com',
        phone: '+91-9876543212',
        aadharNumber: 'XXXX-XXXX-5678',
        address: {
          street: '456, Brigade Road',
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560025'
        },
        dateOfBirth: '1998-03-22',
        maritalStatus: 'single',
        emergencyContact: {
          name: 'Rajesh Sharma',
          relation: 'Father',
          phone: '+91-9876543213'
        },
        profilePhoto: '/api/placeholder/100/100'
      },
      professionalInfo: {
        position: 'Server',
        department: 'Service',
        employeeId: 'EMP002',
        joiningDate: '2024-02-01',
        employmentType: 'full-time',
        salary: 18000,
        experience: 2,
        skills: ['Customer Service', 'POS Systems', 'Order Management', 'Communication'],
        certifications: [
          {
            name: 'Customer Service Excellence',
            issuer: 'Hospitality Institute',
            issueDate: '2023-08-15',
            verified: true
          }
        ],
        previousExperience: [
          {
            company: 'Cafe Coffee Day',
            position: 'Barista',
            duration: '1.5 years',
            reason: 'Better opportunity'
          }
        ]
      },
      verification: {
        aadharVerified: true,
        backgroundCheck: true,
        referenceCheck: true,
        medicalClearance: true,
        policeClearance: false,
        verificationDate: '2024-01-28',
        verifiedBy: 'HR Team'
      },
      performance: {
        rating: 4.4,
        reviewCount: 8,
        punctuality: 98,
        workQuality: 85,
        teamwork: 95,
        lastReviewDate: '2024-03-01'
      },
      workHistory: {
        totalDaysWorked: 42,
        absentDays: 1,
        lateDays: 0,
        overtimeHours: 8
      },
      status: 'active',
      tags: ['punctual', 'friendly', 'hardworking'],
      flags: [],
      documents: {
        aadharCard: { uploaded: true, verified: true },
        panCard: { uploaded: false, verified: false },
        bankPassbook: { uploaded: true, verified: true },
        educationCertificates: { uploaded: true, verified: true },
        experienceLetters: { uploaded: true, verified: true },
        medicalCertificate: { uploaded: true, verified: true },
        policeClearance: { uploaded: false, verified: false }
      }
    },
    {
      id: '3',
      personalInfo: {
        name: 'Ahmed Hassan',
        email: 'ahmed.hassan@email.com',
        phone: '+91-9876543214',
        aadharNumber: 'XXXX-XXXX-9012',
        address: {
          street: '789, Commercial Street',
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560001'
        },
        dateOfBirth: '1992-11-08',
        maritalStatus: 'married',
        emergencyContact: {
          name: 'Fatima Hassan',
          relation: 'Wife',
          phone: '+91-9876543215'
        }
      },
      professionalInfo: {
        position: 'Kitchen Assistant',
        department: 'Kitchen',
        employeeId: 'EMP003',
        joiningDate: '2023-10-15',
        employmentType: 'full-time',
        salary: 15000,
        experience: 3,
        skills: ['Food Preparation', 'Inventory Management', 'Cleaning'],
        certifications: [],
        previousExperience: [
          {
            company: 'Paradise Biryani',
            position: 'Cook Assistant',
            duration: '2 years',
            reason: 'Layoffs'
          }
        ]
      },
      verification: {
        aadharVerified: true,
        backgroundCheck: true,
        referenceCheck: true,
        medicalClearance: true,
        policeClearance: true,
        verificationDate: '2023-10-10',
        verifiedBy: 'HR Team'
      },
      performance: {
        rating: 3.8,
        reviewCount: 15,
        punctuality: 78,
        workQuality: 82,
        teamwork: 85,
        lastReviewDate: '2024-02-01'
      },
      workHistory: {
        totalDaysWorked: 147,
        absentDays: 12,
        lateDays: 8,
        overtimeHours: 45
      },
      status: 'active',
      tags: ['needs improvement', 'experienced'],
      flags: [
        {
          type: 'negative',
          reason: 'Frequent tardiness in January',
          date: '2024-01-25',
          reportedBy: 'Kitchen Manager'
        }
      ],
      documents: {
        aadharCard: { uploaded: true, verified: true },
        panCard: { uploaded: true, verified: true },
        bankPassbook: { uploaded: true, verified: true },
        educationCertificates: { uploaded: false, verified: false },
        experienceLetters: { uploaded: true, verified: true },
        medicalCertificate: { uploaded: true, verified: true },
        policeClearance: { uploaded: true, verified: true }
      }
    }
  ]);

  const departments = ['Kitchen', 'Service', 'Management', 'Cleaning', 'Delivery'];

  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      terminated: 'bg-red-100 text-red-800',
      suspended: 'bg-yellow-100 text-yellow-800'
    };
    return badges[status as keyof typeof badges] || badges.active;
  };

  const getTagColor = (tag: string) => {
    const colors = {
      experienced: 'bg-blue-100 text-blue-800',
      skilled: 'bg-purple-100 text-purple-800',
      reliable: 'bg-green-100 text-green-800',
      punctual: 'bg-blue-100 text-blue-800',
      friendly: 'bg-pink-100 text-pink-800',
      hardworking: 'bg-indigo-100 text-indigo-800',
      'needs improvement': 'bg-yellow-100 text-yellow-800'
    };
    return colors[tag as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getFlagColor = (type: string) => {
    const colors = {
      positive: 'text-green-600',
      negative: 'text-red-600',
      neutral: 'text-yellow-600'
    };
    return colors[type as keyof typeof colors] || 'text-gray-600';
  };

  const getVerificationIcon = (uploaded: boolean, verified: boolean) => {
    if (!uploaded) return <ExclamationTriangleIcon className="w-4 h-4 text-gray-400" />;
    if (verified) return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
    return <ClockIcon className="w-4 h-4 text-yellow-500" />;
  };

  const handleViewEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
  };

  const handleEditEmployee = (id: string) => {
    logger.info('Editing employee:', id);
  };

  const handleTerminateEmployee = (id: string) => {
    logger.info('Terminating employee:', id);
  };

  const handleRateEmployee = (id: string) => {
    logger.info('Rating employee:', id);
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.personalInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.personalInfo.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.professionalInfo.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.professionalInfo.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || employee.status === filterStatus;
    const matchesDepartment = filterDepartment === 'all' || employee.professionalInfo.department === filterDepartment;
    
    return matchesSearch && matchesStatus && matchesDepartment;
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
          <div className="flex items-center space-x-4">
            <img 
              src={selectedEmployee.personalInfo.profilePhoto || '/api/placeholder/60/60'} 
              alt={selectedEmployee.personalInfo.name}
              className="w-15 h-15 rounded-full object-cover border border-gray-200"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{selectedEmployee.personalInfo.name}</h1>
              <p className="text-gray-600">{selectedEmployee.professionalInfo.position} • {selectedEmployee.professionalInfo.department}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(selectedEmployee.status)}`}>
                  {selectedEmployee.status}
                </span>
                <span className="text-sm text-gray-600">ID: {selectedEmployee.professionalInfo.employeeId}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <StarSolidIcon className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{selectedEmployee.performance.rating}</p>
                <p className="text-sm text-gray-600">Overall Rating</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <ClockIcon className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{selectedEmployee.performance.punctuality}%</p>
                <p className="text-sm text-gray-600">Punctuality</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <CheckCircleIcon className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{selectedEmployee.workHistory.totalDaysWorked}</p>
                <p className="text-sm text-gray-600">Days Worked</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <CurrencyDollarIcon className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">₹{selectedEmployee.professionalInfo.salary.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Monthly Salary</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Email</label>
                  <p className="font-medium text-gray-900">{selectedEmployee.personalInfo.email}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Phone</label>
                  <p className="font-medium text-gray-900">{selectedEmployee.personalInfo.phone}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Aadhar Number</label>
                  <p className="font-medium text-gray-900">{selectedEmployee.personalInfo.aadharNumber}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Date of Birth</label>
                  <p className="font-medium text-gray-900">{new Date(selectedEmployee.personalInfo.dateOfBirth).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Address</label>
                <p className="font-medium text-gray-900">
                  {selectedEmployee.personalInfo.address.street}, {selectedEmployee.personalInfo.address.city}, 
                  {selectedEmployee.personalInfo.address.state} - {selectedEmployee.personalInfo.address.pincode}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Marital Status</label>
                  <p className="font-medium text-gray-900 capitalize">{selectedEmployee.personalInfo.maritalStatus}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Emergency Contact</label>
                  <p className="font-medium text-gray-900">
                    {selectedEmployee.personalInfo.emergencyContact.name} ({selectedEmployee.personalInfo.emergencyContact.relation})
                  </p>
                  <p className="text-sm text-gray-600">{selectedEmployee.personalInfo.emergencyContact.phone}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Professional Information</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Position</label>
                  <p className="font-medium text-gray-900">{selectedEmployee.professionalInfo.position}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Department</label>
                  <p className="font-medium text-gray-900">{selectedEmployee.professionalInfo.department}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Joining Date</label>
                  <p className="font-medium text-gray-900">{new Date(selectedEmployee.professionalInfo.joiningDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Employment Type</label>
                  <p className="font-medium text-gray-900 capitalize">{selectedEmployee.professionalInfo.employmentType.replace('-', ' ')}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Experience</label>
                  <p className="font-medium text-gray-900">{selectedEmployee.professionalInfo.experience} years</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Salary</label>
                  <p className="font-medium text-gray-900">₹{selectedEmployee.professionalInfo.salary.toLocaleString()}/month</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Skills</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedEmployee.professionalInfo.skills.map((skill, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Work Quality</span>
                <span className="text-gray-900">{selectedEmployee.performance.workQuality}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${selectedEmployee.performance.workQuality}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Teamwork</span>
                <span className="text-gray-900">{selectedEmployee.performance.teamwork}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${selectedEmployee.performance.teamwork}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Punctuality</span>
                <span className="text-gray-900">{selectedEmployee.performance.punctuality}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full" 
                  style={{ width: `${selectedEmployee.performance.punctuality}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total Reviews:</span>
              <span className="ml-2 font-medium">{selectedEmployee.performance.reviewCount}</span>
            </div>
            <div>
              <span className="text-gray-600">Absent Days:</span>
              <span className="ml-2 font-medium">{selectedEmployee.workHistory.absentDays}</span>
            </div>
            <div>
              <span className="text-gray-600">Late Days:</span>
              <span className="ml-2 font-medium">{selectedEmployee.workHistory.lateDays}</span>
            </div>
            <div>
              <span className="text-gray-600">Overtime Hours:</span>
              <span className="ml-2 font-medium">{selectedEmployee.workHistory.overtimeHours}</span>
            </div>
          </div>
        </div>

        {/* Verification Status */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Verification & Documents</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Verification Status</h4>
              <div className="space-y-2">
                {Object.entries({
                  'Aadhar Verified': selectedEmployee.verification.aadharVerified,
                  'Background Check': selectedEmployee.verification.backgroundCheck,
                  'Reference Check': selectedEmployee.verification.referenceCheck,
                  'Medical Clearance': selectedEmployee.verification.medicalClearance,
                  'Police Clearance': selectedEmployee.verification.policeClearance
                }).map(([label, status]) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{label}</span>
                    <span className={`text-sm font-medium ${status ? 'text-green-600' : 'text-red-600'}`}>
                      {status ? '✓ Completed' : '✗ Pending'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Document Status</h4>
              <div className="space-y-2">
                {Object.entries({
                  'Aadhar Card': selectedEmployee.documents.aadharCard,
                  'PAN Card': selectedEmployee.documents.panCard,
                  'Bank Passbook': selectedEmployee.documents.bankPassbook,
                  'Education Certificates': selectedEmployee.documents.educationCertificates,
                  'Experience Letters': selectedEmployee.documents.experienceLetters,
                  'Medical Certificate': selectedEmployee.documents.medicalCertificate,
                  'Police Clearance': selectedEmployee.documents.policeClearance
                }).map(([label, doc]) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{label}</span>
                    <div className="flex items-center space-x-1">
                      {getVerificationIcon(doc.uploaded, doc.verified)}
                      <span className="text-xs text-gray-500">
                        {!doc.uploaded ? 'Not Uploaded' : doc.verified ? 'Verified' : 'Pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tags and Flags */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Tags</h3>
            <div className="flex flex-wrap gap-2">
              {selectedEmployee.tags.map((tag, index) => (
                <span key={index} className={`px-3 py-1 text-sm font-medium rounded-full ${getTagColor(tag)}`}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
          
          {selectedEmployee.flags.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Flags & Incidents</h3>
              <div className="space-y-3">
                {selectedEmployee.flags.map((flag, index) => (
                  <div key={index} className="border-l-4 border-gray-200 pl-4">
                    <div className="flex items-center space-x-2">
                      <FlagIcon className={`w-4 h-4 ${getFlagColor(flag.type)}`} />
                      <span className={`text-sm font-medium ${getFlagColor(flag.type)}`}>
                        {flag.type.charAt(0).toUpperCase() + flag.type.slice(1)}
                      </span>
                      <span className="text-sm text-gray-500">{new Date(flag.date).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{flag.reason}</p>
                    <p className="text-xs text-gray-500">Reported by: {flag.reportedBy}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex space-x-4">
          <button 
            onClick={() => handleEditEmployee(selectedEmployee.id)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            Edit Employee
          </button>
          <button 
            onClick={() => handleRateEmployee(selectedEmployee.id)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            Rate & Review
          </button>
          <button 
            onClick={() => handleTerminateEmployee(selectedEmployee.id)}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            Terminate
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your restaurant staff with verification and performance tracking
          </p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
            <UserPlusIcon className="w-4 h-4" />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
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
            <div className="p-2 bg-purple-100 rounded-lg">
              <ShieldCheckIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Fully Verified</p>
              <p className="text-2xl font-bold text-gray-900">
                {employees.filter(e => e.verification.aadharVerified && e.verification.backgroundCheck).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <StarIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Rating</p>
              <p className="text-2xl font-bold text-gray-900">
                {(employees.reduce((sum, e) => sum + e.performance.rating, 0) / employees.length).toFixed(1)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'current', label: 'Current Staff', count: employees.filter(e => e.status === 'active').length },
            { key: 'history', label: 'Employment History', count: employees.filter(e => e.status !== 'active').length },
            { key: 'applications', label: 'Job Applications', count: 8 }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'current' && (
        <>
          {/* Search and Filters */}
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees..."
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
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Employees Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEmployees.map((employee) => (
              <div key={employee.id} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start space-x-4">
                  <img 
                    src={employee.personalInfo.profilePhoto || '/api/placeholder/60/60'} 
                    alt={employee.personalInfo.name}
                    className="w-15 h-15 rounded-full object-cover border border-gray-200"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">{employee.personalInfo.name}</h3>
                      {employee.verification.aadharVerified && employee.verification.backgroundCheck && (
                        <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{employee.professionalInfo.position}</p>
                    <p className="text-sm text-gray-500">{employee.professionalInfo.department}</p>
                    
                    <div className="flex items-center space-x-2 mt-2">
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <StarSolidIcon 
                            key={i}
                            className={`w-3 h-3 ${i < Math.floor(employee.performance.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                          />
                        ))}
                        <span className="text-xs text-gray-600">({employee.performance.reviewCount})</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mt-2">
                      {employee.tags.slice(0, 2).map((tag, index) => (
                        <span key={index} className={`px-2 py-1 text-xs font-medium rounded-full ${getTagColor(tag)}`}>
                          {tag}
                        </span>
                      ))}
                      {employee.flags.length > 0 && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                          {employee.flags.length} flag(s)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Salary:</span>
                    <span className="ml-1 font-medium text-gray-900">₹{employee.professionalInfo.salary.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Experience:</span>
                    <span className="ml-1 font-medium text-gray-900">{employee.professionalInfo.experience} years</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Joining:</span>
                    <span className="ml-1 font-medium text-gray-900">{new Date(employee.professionalInfo.joiningDate).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className={`ml-1 px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(employee.status)}`}>
                      {employee.status}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex space-x-2">
                  <button 
                    onClick={() => handleViewEmployee(employee)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium"
                  >
                    View Details
                  </button>
                  <button 
                    onClick={() => handleEditEmployee(employee.id)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleRateEmployee(employee.id)}
                    className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 p-2 rounded"
                  >
                    <StarIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Employment History</h3>
          <div className="text-center py-8 text-gray-500">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2">Past employees and employment history will be displayed here</p>
          </div>
        </div>
      )}

      {activeTab === 'applications' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Job Applications</h3>
          <div className="text-center py-8 text-gray-500">
            <BriefcaseIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2">Job applications from potential employees will be displayed here</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantEmployeesPage;
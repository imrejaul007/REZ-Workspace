'use client'

import React, { useState } from 'react'
import { 
  Users, 
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  UserPlus,
  UserMinus,
  Phone,
  Mail,
  MapPin,
  Star,
  AlertCircle,
  Activity,
  DollarSign,
  Download,
  Upload
} from 'lucide-react'

interface StaffMember {
  id: string
  name: string
  email: string
  phone: string
  role: 'chef' | 'waiter' | 'manager' | 'cashier' | 'cleaner'
  department: string
  salary: number
  joinDate: string
  status: 'active' | 'inactive' | 'on_leave'
  avatar: string
  address: string
  emergencyContact: string
  rating: number
  completedShifts: number
  totalShifts: number
  lastActive: string
  skills: string[]
  certifications: string[]
}

const RestaurantStaff = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'chef' | 'waiter' | 'manager' | 'cashier' | 'cleaner'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'on_leave'>('all')
  const [showAddModal, setShowAddModal] = useState(false)

  // Mock staff data
  const mockStaff: StaffMember[] = [
    {
      id: 'staff-1',
      name: 'Rajesh Kumar',
      email: 'rajesh.chef@spicegarden.com',
      phone: '+91-9876543210',
      role: 'chef',
      department: 'Kitchen',
      salary: 35000,
      joinDate: '2023-01-15',
      status: 'active',
      avatar: '/api/placeholder/60/60',
      address: 'Andheri West, Mumbai',
      emergencyContact: '+91-9876543211',
      rating: 4.8,
      completedShifts: 245,
      totalShifts: 250,
      lastActive: '2 hours ago',
      skills: ['North Indian Cuisine', 'South Indian Cuisine', 'Chinese'],
      certifications: ['Food Safety Certificate', 'Advanced Cooking']
    },
    {
      id: 'staff-2',
      name: 'Priya Sharma',
      email: 'priya.waiter@spicegarden.com',
      phone: '+91-9876543212',
      role: 'waiter',
      department: 'Service',
      salary: 20000,
      joinDate: '2023-03-20',
      status: 'active',
      avatar: '/api/placeholder/60/60',
      address: 'Bandra East, Mumbai',
      emergencyContact: '+91-9876543213',
      rating: 4.5,
      completedShifts: 180,
      totalShifts: 185,
      lastActive: '30 mins ago',
      skills: ['Customer Service', 'Order Taking', 'Table Service'],
      certifications: ['Customer Service Excellence']
    },
    {
      id: 'staff-3',
      name: 'Amit Patel',
      email: 'amit.manager@spicegarden.com',
      phone: '+91-9876543214',
      role: 'manager',
      department: 'Management',
      salary: 50000,
      joinDate: '2022-09-10',
      status: 'active',
      avatar: '/api/placeholder/60/60',
      address: 'Powai, Mumbai',
      emergencyContact: '+91-9876543215',
      rating: 4.9,
      completedShifts: 365,
      totalShifts: 370,
      lastActive: '1 hour ago',
      skills: ['Team Management', 'Operations', 'Customer Relations'],
      certifications: ['Restaurant Management', 'Leadership']
    },
    {
      id: 'staff-4',
      name: 'Sneha Reddy',
      email: 'sneha.cashier@spicegarden.com',
      phone: '+91-9876543216',
      role: 'cashier',
      department: 'Billing',
      salary: 22000,
      joinDate: '2023-06-01',
      status: 'on_leave',
      avatar: '/api/placeholder/60/60',
      address: 'Malad West, Mumbai',
      emergencyContact: '+91-9876543217',
      rating: 4.3,
      completedShifts: 120,
      totalShifts: 130,
      lastActive: '3 days ago',
      skills: ['POS Systems', 'Cash Handling', 'Customer Billing'],
      certifications: ['Accounting Basics']
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-red-100 text-red-800'
      case 'on_leave': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'chef': return 'bg-purple-100 text-purple-800'
      case 'waiter': return 'bg-blue-100 text-blue-800'
      case 'manager': return 'bg-indigo-100 text-indigo-800'
      case 'cashier': return 'bg-green-100 text-green-800'
      case 'cleaner': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredStaff = mockStaff.filter(staff => {
    const matchesSearch = staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         staff.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || staff.role === roleFilter
    const matchesStatus = statusFilter === 'all' || staff.status === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  })

  const handleStaffAction = (action: string, staffId: string) => {
    logger.info(`${action} staff:`, staffId)
  }

  const staffStats = {
    total: mockStaff.length,
    active: mockStaff.filter(s => s.status === 'active').length,
    onLeave: mockStaff.filter(s => s.status === 'on_leave').length,
    avgRating: mockStaff.reduce((sum, s) => sum + s.rating, 0) / mockStaff.length,
    totalSalary: mockStaff.reduce((sum, s) => sum + s.salary, 0)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Staff Management</h1>
              <p className="text-gray-600">Manage your restaurant team and employee information</p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center">
                <Download className="h-4 w-4 mr-2" />
                Export Staff
              </button>
              <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Staff
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Staff</p>
                <p className="text-2xl font-bold text-gray-900">{staffStats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">{staffStats.active}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">On Leave</p>
                <p className="text-2xl font-bold text-gray-900">{staffStats.onLeave}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Star className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold text-gray-900">{staffStats.avgRating.toFixed(1)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Salary</p>
                <p className="text-2xl font-bold text-gray-900">₹{staffStats.totalSalary.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search staff..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex space-x-3">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Roles</option>
                <option value="chef">Chef</option>
                <option value="waiter">Waiter</option>
                <option value="manager">Manager</option>
                <option value="cashier">Cashier</option>
                <option value="cleaner">Cleaner</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on_leave">On Leave</option>
              </select>
            </div>
          </div>
        </div>

        {/* Staff Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStaff.map((staff) => (
            <div key={staff.id} className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start space-x-4">
                  <img
                    src={staff.avatar}
                    alt={staff.name}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">{staff.name}</h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(staff.status)}`}>
                        {staff.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(staff.role)}`}>
                        {staff.role}
                      </span>
                      <span className="text-sm text-gray-500">{staff.department}</span>
                    </div>
                    <div className="flex items-center mb-2">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600 ml-1">{staff.rating}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        {staff.completedShifts}/{staff.totalShifts} shifts
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    {staff.email}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    {staff.phone}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <DollarSign className="h-4 w-4 mr-2" />
                    ₹{staff.salary.toLocaleString()}/month
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Activity className="h-4 w-4 mr-2" />
                    Last active: {staff.lastActive}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-sm text-gray-600 mb-2">Skills:</div>
                  <div className="flex flex-wrap gap-1">
                    {staff.skills.slice(0, 3).map((skill, index) => (
                      <span key={index} className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                        {skill}
                      </span>
                    ))}
                    {staff.skills.length > 3 && (
                      <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                        +{staff.skills.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex items-center space-x-2">
                  <button
                    onClick={() => handleStaffAction('view', staff.id)}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center justify-center"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </button>
                  <button
                    onClick={() => handleStaffAction('edit', staff.id)}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    title="Edit Staff"
                  >
                    <Edit className="h-4 w-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleStaffAction('schedule', staff.id)}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    title="Schedule"
                  >
                    <Calendar className="h-4 w-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleStaffAction('delete', staff.id)}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    title="Delete Staff"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <UserPlus className="h-6 w-6 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Bulk Import</span>
            </button>
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Calendar className="h-6 w-6 text-green-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Schedule Shifts</span>
            </button>
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <DollarSign className="h-6 w-6 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Payroll</span>
            </button>
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Star className="h-6 w-6 text-orange-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Performance</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RestaurantStaff
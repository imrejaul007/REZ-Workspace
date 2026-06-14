'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit, Trash2, Phone, Mail, Calendar, MapPin, Clock, UserCheck, UserX, AlertTriangle, Shield, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function EmployeeDetails() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params.id as string;
  
  const [employee, setEmployee] = useState({
    id: employeeId,
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@bellavista.com',
    phone: '+1 (555) 987-6543',
    avatar: '',
    role: 'Server',
    department: 'Front of House',
    status: 'active',
    hireDate: '2023-06-15',
    address: '123 Main St, New York, NY 10001',
    emergencyContact: {
      name: 'John Johnson',
      relationship: 'Spouse',
      phone: '+1 (555) 123-4567'
    },
    schedule: {
      monday: { start: '10:00', end: '18:00', off: false },
      tuesday: { start: '10:00', end: '18:00', off: false },
      wednesday: { start: '10:00', end: '18:00', off: false },
      thursday: { start: '10:00', end: '18:00', off: false },
      friday: { start: '09:00', end: '17:00', off: false },
      saturday: { start: '09:00', end: '17:00', off: false },
      sunday: { start: '', end: '', off: true }
    },
    permissions: ['orders', 'menu', 'customers'],
    performance: {
      rating: 4.6,
      ordersServed: 1247,
      customerRating: 4.8,
      punctuality: 96,
      salesTotal: 18750.50
    },
    documents: [
      { name: 'Employment Contract', type: 'contract', date: '2023-06-15' },
      { name: 'Food Safety Certificate', type: 'certificate', date: '2023-07-01' },
      { name: 'Emergency Contact Form', type: 'form', date: '2023-06-15' }
    ],
    notes: 'Excellent server with great customer service skills. Always punctual and willing to help colleagues.'
  });

  const handleStatusChange = (newStatus: 'active' | 'inactive' | 'suspended') => {
    setEmployee(prev => ({ ...prev, status: newStatus }));
  };

  const handleEdit = () => {
    router.push(`/restaurant/employees/${employeeId}/edit`);
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to remove ${employee.firstName} ${employee.lastName} from your team?`)) {
      router.push('/restaurant/employees');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-500';
      case 'suspended': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'manager': return 'bg-purple-500';
      case 'server': return 'bg-blue-500';
      case 'chef': return 'bg-orange-500';
      case 'host': return 'bg-green-500';
      case 'cashier': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost"  onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Team
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{employee.firstName} {employee.lastName}</h1>
              <p className="text-muted-foreground">{employee.role} • {employee.department}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Remove
            </Button>
          </div>
        </div>

        {employee.status !== 'active' && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This employee is currently {employee.status}. They {employee.status === 'suspended' ? 'cannot access the system' : 'are not scheduled for shifts'}.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Employee Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Employee Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4 mb-6">
                    <Avatar className="w-16 h-16 bg-blue-500 flex items-center justify-center text-white text-xl">
                      {employee.firstName[0]}{employee.lastName[0]}
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{employee.firstName} {employee.lastName}</h3>
                      <div className="flex items-center space-x-3 mt-1">
                        <Badge className={getRoleColor(employee.role)}>
                          {employee.role}
                        </Badge>
                        <Badge className={getStatusColor(employee.status)}>
                          {employee.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{employee.email}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{employee.phone}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">Hired {new Date(employee.hireDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{employee.address}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Shield className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">Department: {employee.department}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Performance Metrics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-700">{employee.performance.rating}</div>
                      <div className="text-sm text-blue-600">Overall Rating</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-700">{employee.performance.ordersServed}</div>
                      <div className="text-sm text-green-600">Orders Served</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-700">{employee.performance.customerRating}</div>
                      <div className="text-sm text-yellow-600">Customer Rating</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-700">{employee.performance.punctuality}%</div>
                      <div className="text-sm text-purple-600">Punctuality</div>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Sales Generated</span>
                      <span className="font-semibold text-lg">${employee.performance.salesTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Work Schedule */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Work Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(employee.schedule).map(([day, hours]) => (
                      <div key={day} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                        <span className="font-medium capitalize w-24">{day}</span>
                        {hours.off ? (
                          <Badge variant="secondary">Off</Badge>
                        ) : (
                          <span className="text-sm text-gray-600">
                            {hours.start} - {hours.end}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Emergency Contact */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Emergency Contact</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Name:</span>
                      <span className="font-medium">{employee.emergencyContact.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Relationship:</span>
                      <span className="font-medium">{employee.emergencyContact.relationship}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Phone:</span>
                      <span className="font-medium">{employee.emergencyContact.phone}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {employee.status === 'active' ? (
                    <>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => handleStatusChange('inactive')}
                      >
                        <UserX className="h-4 w-4 mr-2" />
                        Mark Inactive
                      </Button>
                      <Button 
                        variant="destructive" 
                        
                        className="w-full"
                        onClick={() => handleStatusChange('suspended')}
                      >
                        Suspend Employee
                      </Button>
                    </>
                  ) : (
                    <Button 
                      className="w-full"
                      onClick={() => handleStatusChange('active')}
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      Activate Employee
                    </Button>
                  )}
                  <Button variant="outline" className="w-full" onClick={() => router.push(`/restaurant/employees/${employeeId}/schedule`)}>
                    <Clock className="h-4 w-4 mr-2" />
                    Manage Schedule
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Permissions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>System Permissions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {employee.permissions.map(permission => (
                      <Badge key={permission} variant="outline" className="mr-1 mb-1">
                        {permission}
                      </Badge>
                    ))}
                  </div>
                  <Button variant="outline"  className="w-full mt-3">
                    Manage Permissions
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Documents */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {employee.documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div>
                          <div className="font-medium">{doc.name}</div>
                          <div className="text-gray-500">{new Date(doc.date).toLocaleDateString()}</div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {doc.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline"  className="w-full mt-3">
                    Add Document
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Notes */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">{employee.notes}</p>
                  <Button variant="outline"  className="w-full">
                    Edit Notes
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
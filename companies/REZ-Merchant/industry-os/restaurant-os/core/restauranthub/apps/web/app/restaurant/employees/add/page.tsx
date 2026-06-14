'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { apiClient } from '@/lib/api/client';
import { toast } from 'react-hot-toast';

const STATIC_ROLES = [
  'Manager', 'Assistant Manager', 'Server', 'Chef', 'Sous Chef',
  'Cook', 'Prep Cook', 'Host', 'Cashier', 'Bartender', 'Busser', 'Dishwasher',
];

const DEPARTMENTS = [
  'Management', 'Front of House', 'Kitchen', 'Bar', 'Cleaning',
];

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  salary: string;
  startDate: string;
}

const emptyForm: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  role: '',
  department: '',
  salary: '',
  startDate: '',
};

export default function AddEmployee() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [serverRoles, setServerRoles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = useCallback(async () => {
    try {
      const res = await apiClient.get<{ data: string[] }>('/staff/roles');
      setServerRoles(res.data.data ?? []);
    } catch {
      // non-fatal — fallback to static list
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const allRoles = Array.from(new Set([...STATIC_ROLES, ...serverRoles])).sort();

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const isFormValid =
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.phone.trim() &&
    form.role;

  const handleSave = async () => {
    if (!isFormValid) {
      setError('Please fill in all required fields: First Name, Last Name, Phone, and Role.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await apiClient.post('/staff/employees', {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim(),
        role: form.role,
        department: form.department || undefined,
        salary: form.salary ? Number(form.salary) : undefined,
        startDate: form.startDate || undefined,
      });
      toast.success('Employee added successfully');
      router.push('/restaurant/employees');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string | string[] } } };
      const msg = axiosErr?.response?.data?.message ?? 'Failed to add employee';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Add New Employee</h1>
              <p className="text-muted-foreground">Create a new team member profile</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={!isFormValid || loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Adding...' : 'Add Employee'}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <User className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Personal Information */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <User className="h-5 w-5 mr-2" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={form.firstName}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                      placeholder="John"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={form.lastName}
                      onChange={(e) => handleChange('lastName', e.target.value)}
                      placeholder="Smith"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        className="pl-9"
                        placeholder="john@restaurant.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        value={form.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        className="pl-9"
                        placeholder="+91 9876543210"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Employment Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <Shield className="h-5 w-5 mr-2" />
                  Employment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="role">Role *</Label>
                    <Select value={form.role} onValueChange={(value) => handleChange('role', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {allRoles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="department">Department</Label>
                    <Select
                      value={form.department}
                      onValueChange={(value) => handleChange('department', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEPARTMENTS.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="startDate">Start Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="startDate"
                        type="date"
                        value={form.startDate}
                        onChange={(e) => handleChange('startDate', e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="salary">Monthly Salary (₹)</Label>
                    <Input
                      id="salary"
                      type="number"
                      min={0}
                      value={form.salary}
                      onChange={(e) => handleChange('salary', e.target.value)}
                      placeholder="e.g. 35000"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pb-6">
            <Button variant="outline" onClick={() => router.back()} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!isFormValid || loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Adding...' : 'Add Employee'}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Checkbox } from '../../../../components/ui/checkbox';
import {
  ArrowDownTrayIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  TableCellsIcon,
  ChartBarIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface ExportJob {
  id: string;
  type: string;
  format: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  fileSize?: string;
  downloadUrl?: string;
  parameters: Record<string, unknown>;
}

export default function ExportDataPage() {
  const [exportType, setExportType] = useState('');
  const [format, setFormat] = useState('csv');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [emailOnComplete, setEmailOnComplete] = useState(true);
  const [jobs, setJobs] = useState<ExportJob[]>([
    {
      id: 'EXP-001',
      type: 'Restaurant Data',
      format: 'CSV',
      status: 'completed',
      createdAt: '2024-01-20T10:30:00Z',
      completedAt: '2024-01-20T10:32:15Z',
      fileSize: '2.3 MB',
      downloadUrl: '/exports/restaurants-2024-01-20.csv',
      parameters: { dateRange: '2024-01-01 to 2024-01-20', fields: ['name', 'owner', 'revenue'] }
    },
    {
      id: 'EXP-002', 
      type: 'Order Analytics',
      format: 'Excel',
      status: 'processing',
      createdAt: '2024-01-20T14:15:00Z',
      parameters: { dateRange: '2024-01-01 to 2024-01-20', includeCharts: true }
    }
  ]);

  const exportTypes = [
    { value: 'restaurants', label: 'Restaurant Data', fields: ['name', 'owner', 'email', 'phone', 'address', 'status', 'revenue', 'orders'] },
    { value: 'orders', label: 'Order Analytics', fields: ['orderId', 'restaurant', 'customer', 'amount', 'status', 'date', 'items'] },
    { value: 'users', label: 'User Data', fields: ['name', 'email', 'phone', 'role', 'joinDate', 'lastActive'] },
    { value: 'revenue', label: 'Revenue Reports', fields: ['date', 'restaurant', 'grossRevenue', 'netRevenue', 'commission', 'taxes'] },
    { value: 'performance', label: 'Performance Metrics', fields: ['restaurant', 'rating', 'orders', 'revenue', 'growth', 'retention'] }
  ];

  const handleExport = async () => {
    if (!exportType) {
      toast.error('Please select an export type');
      return;
    }

    if (selectedFields.length === 0) {
      toast.error('Please select at least one field to export');
      return;
    }

    const newJob: ExportJob = {
      id: `EXP-${String(jobs.length + 1).padStart(3, '0')}`,
      type: exportTypes.find(t => t.value === exportType)?.label || '',
      format: format.toUpperCase(),
      status: 'pending',
      createdAt: new Date().toISOString(),
      parameters: {
        dateRange: `${dateRange.from} to ${dateRange.to}`,
        fields: selectedFields,
        format,
        emailOnComplete
      }
    };

    setJobs([newJob, ...jobs]);
    toast.success('Export job started successfully');

    // Simulate processing
    setTimeout(() => {
      setJobs(prev => prev.map(job => 
        job.id === newJob.id 
          ? { ...job, status: 'processing' }
          : job
      ));
    }, 1000);

    setTimeout(() => {
      setJobs(prev => prev.map(job => 
        job.id === newJob.id 
          ? { 
              ...job, 
              status: 'completed',
              completedAt: new Date().toISOString(),
              fileSize: '1.8 MB',
              downloadUrl: `/exports/${exportType}-${new Date().toISOString().split('T')[0]}.${format}`
            }
          : job
      ));
      
      if (emailOnComplete) {
        toast.success('Export completed! Download link sent to your email.');
      } else {
        toast.success('Export completed! Ready for download.');
      }
    }, 5000);

    // Reset form
    setExportType('');
    setSelectedFields([]);
    setDateRange({ from: '', to: '' });
  };

  const handleFieldToggle = (field: string, checked: boolean) => {
    setSelectedFields(prev =>
      checked
        ? [...prev, field]
        : prev.filter(f => f !== field)
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'processing':
        return <ClockIcon className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'failed':
        return <div className="w-5 h-5 bg-red-500 rounded-full" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed': return 'green';
      case 'processing': return 'blue';
      case 'failed': return 'red';
      default: return 'gray';
    }
  };

  const currentFields = exportTypes.find(t => t.value === exportType)?.fields || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Export Data</h1>
        <p className="text-gray-600 mt-1">Export platform data in various formats for analysis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Configuration */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
            Create New Export
          </h3>

          <div className="space-y-4">
            {/* Export Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Export Type</label>
              <Select
                value={exportType}
                onValueChange={(value) => {
                  setExportType(value);
                  setSelectedFields([]);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select export type..." />
                </SelectTrigger>
                <SelectContent>
                  {exportTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="pdf">PDF Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                <Input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                <Input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                />
              </div>
            </div>

            {/* Fields Selection */}
            {currentFields.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Fields to Export
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {currentFields.map(field => (
                    <div key={field} className="flex items-center">
                      <Checkbox
                        id={field}
                        checked={selectedFields.includes(field)}
                        onChange={(e) => handleFieldToggle(field, (e.target as HTMLInputElement).checked)}
                      />
                      <label htmlFor={field} className="ml-2 text-sm text-gray-700 capitalize">
                        {field.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                    </div>
                  ))}
                </div>
                
                <div className="flex space-x-2 mt-2">
                  <Button
                    variant="outline"
                    size="default"
                    onClick={() => setSelectedFields(currentFields)}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="default"
                    onClick={() => setSelectedFields([])}
                  >
                    Clear All
                  </Button>
                </div>
              </div>
            )}

            {/* Options */}
            <div className="flex items-center">
              <Checkbox
                id="emailOnComplete"
                checked={emailOnComplete}
                onChange={(e) => setEmailOnComplete((e.target as HTMLInputElement).checked)}
              />
              <label htmlFor="emailOnComplete" className="ml-2 text-sm text-gray-700">
                Email me when export is complete
              </label>
            </div>

            <Button
              onClick={handleExport}
              disabled={!exportType || selectedFields.length === 0}
              className="w-full"
              size="default"
              variant="default"
            >
              <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
              Start Export
            </Button>
          </div>
        </Card>

        {/* Export History */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ClockIcon className="w-5 h-5 mr-2" />
            Export History
          </h3>

          <div className="space-y-4">
            {jobs.map(job => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(job.status)}
                    <span className="font-medium text-gray-900">{job.type}</span>
                    <span className="text-sm text-gray-500">({job.format})</span>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    job.status === 'completed' ? 'bg-green-100 text-green-800' :
                    job.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                    job.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {job.status}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Job ID: {job.id}</div>
                  <div>Created: {new Date(job.createdAt).toLocaleString()}</div>
                  {job.completedAt && (
                    <div>Completed: {new Date(job.completedAt).toLocaleString()}</div>
                  )}
                  {job.fileSize && (
                    <div>File Size: {job.fileSize}</div>
                  )}
                </div>

                {job.status === 'completed' && job.downloadUrl && (
                  <div className="flex space-x-2 mt-3">
                    <Button variant="outline" size="default">
                      <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                    <Button variant="outline" size="default">
                      <EnvelopeIcon className="w-4 h-4 mr-1" />
                      Resend Email
                    </Button>
                  </div>
                )}

                {job.status === 'processing' && (
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '45%' }}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Processing...</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Export Options */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Export Templates</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 cursor-pointer">
            <div className="flex items-center space-x-3 mb-2">
              <TableCellsIcon className="w-6 h-6 text-primary-600" />
              <span className="font-medium">Monthly Report</span>
            </div>
            <p className="text-sm text-gray-600">Complete restaurant performance data for the current month</p>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 cursor-pointer">
            <div className="flex items-center space-x-3 mb-2">
              <ChartBarIcon className="w-6 h-6 text-green-600" />
              <span className="font-medium">Revenue Summary</span>
            </div>
            <p className="text-sm text-gray-600">Revenue breakdown by restaurant and region</p>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 cursor-pointer">
            <div className="flex items-center space-x-3 mb-2">
              <DocumentTextIcon className="w-6 h-6 text-blue-600" />
              <span className="font-medium">Compliance Report</span>
            </div>
            <p className="text-sm text-gray-600">Document verification and compliance status</p>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 cursor-pointer">
            <div className="flex items-center space-x-3 mb-2">
              <CalendarIcon className="w-6 h-6 text-orange-600" />
              <span className="font-medium">Daily Operations</span>
            </div>
            <p className="text-sm text-gray-600">Daily orders, revenue, and operational metrics</p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
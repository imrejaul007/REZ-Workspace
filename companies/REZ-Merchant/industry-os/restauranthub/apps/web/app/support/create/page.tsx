'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  HelpCircle, 
  Bug, 
  CreditCard, 
  Settings, 
  Users, 
  Truck,
  Upload,
  X,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

const ticketCategories = [
  { id: 'general', name: 'General Inquiry', icon: HelpCircle, color: 'bg-blue-500' },
  { id: 'bug', name: 'Bug Report', icon: Bug, color: 'bg-red-500' },
  { id: 'billing', name: 'Billing & Payments', icon: CreditCard, color: 'bg-green-500' },
  { id: 'account', name: 'Account Issues', icon: Settings, color: 'bg-purple-500' },
  { id: 'users', name: 'User Management', icon: Users, color: 'bg-orange-500' },
  { id: 'orders', name: 'Order Issues', icon: Truck, color: 'bg-indigo-500' }
];

const priorityLevels = [
  { id: 'low', name: 'Low', color: 'bg-gray-500', description: 'General questions or minor issues' },
  { id: 'medium', name: 'Medium', color: 'bg-yellow-500', description: 'Non-critical issues affecting functionality' },
  { id: 'high', name: 'High', color: 'bg-orange-500', description: 'Critical issues affecting business operations' },
  { id: 'urgent', name: 'Urgent', color: 'bg-red-500', description: 'System down or data loss' }
];

export default function CreateSupportTicket() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  
  const [ticketData, setTicketData] = useState({
    category: '',
    priority: '',
    subject: '',
    description: '',
    affectedFeature: '',
    stepsToReproduce: '',
    expectedBehavior: '',
    actualBehavior: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setTicketData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files).filter(file => 
        file.size <= 10 * 1024 * 1024 // 10MB limit
      );
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Redirect to ticket view or success page
      router.push('/support/tickets');
    } catch (error) {
      console.error('Error creating ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = ticketData.category && ticketData.priority && 
                     ticketData.subject && ticketData.description;

  const selectedCategory = ticketCategories.find(cat => cat.id === ticketData.category);
  const selectedPriority = priorityLevels.find(level => level.id === ticketData.priority);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Support
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Create Support Ticket</h1>
            <p className="text-muted-foreground">
              Get help from our support team by creating a detailed ticket
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Issue Category</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Select the category that best describes your issue
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ticketCategories.map((category) => {
                    const Icon = category.icon;
                    const isSelected = ticketData.category === category.id;
                    return (
                      <div
                        key={category.id}
                        onClick={() => handleInputChange('category', category.id)}
                        className={`
                          p-4 rounded-lg border-2 cursor-pointer transition-all
                          ${isSelected 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                          }
                        `}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${category.color} text-white`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{category.name}</h3>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Priority Level */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Priority Level</CardTitle>
                <p className="text-sm text-muted-foreground">
                  How urgent is this issue?
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {priorityLevels.map((level) => {
                    const isSelected = ticketData.priority === level.id;
                    return (
                      <div
                        key={level.id}
                        onClick={() => handleInputChange('priority', level.id)}
                        className={`
                          p-4 rounded-lg border-2 cursor-pointer transition-all
                          ${isSelected 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                          }
                        `}
                      >
                        <div className="flex items-start space-x-3">
                          <Badge className={level.color}>
                            {level.name}
                          </Badge>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              {level.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Ticket Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Ticket Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    value={ticketData.subject}
                    onChange={(e) => e.target.value}
                    placeholder="Brief description of the issue"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={ticketData.description}
                    onChange={(e) => e.target.value}
                    placeholder="Detailed description of the issue you're experiencing"
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="affectedFeature">Affected Feature</Label>
                  <Input
                    id="affectedFeature"
                    value={ticketData.affectedFeature}
                    onChange={(e) => e.target.value}
                    placeholder="Which part of the system is affected?"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Bug Report Details */}
          {ticketData.category === 'bug' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bug className="h-5 w-5 mr-2 text-red-500" />
                    Bug Report Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="stepsToReproduce">Steps to Reproduce</Label>
                    <Textarea
                      id="stepsToReproduce"
                      value={ticketData.stepsToReproduce}
                      onChange={(e) => e.target.value}
                      placeholder="1. Go to... 2. Click on... 3. Enter..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expectedBehavior">Expected Behavior</Label>
                      <Textarea
                        id="expectedBehavior"
                        value={ticketData.expectedBehavior}
                        onChange={(e) => e.target.value}
                        placeholder="What should happen?"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="actualBehavior">Actual Behavior</Label>
                      <Textarea
                        id="actualBehavior"
                        value={ticketData.actualBehavior}
                        onChange={(e) => e.target.value}
                        placeholder="What actually happens?"
                        rows={3}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Attachments */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Attachments</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Upload screenshots or files that might help us understand the issue
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="fileUpload" className="cursor-pointer">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                      <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">
                        Click to upload files or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Maximum file size: 10MB
                      </p>
                    </div>
                  </Label>
                  <input
                    id="fileUpload"
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                {attachments.length > 0 && (
                  <div className="space-y-2">
                    <Label>Uploaded Files</Label>
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          
                          onClick={() => removeAttachment(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Submit */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <AlertCircle className="h-4 w-4" />
              <span>We typically respond within 24 hours</span>
            </div>
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isFormValid || loading}
              >
                {loading ? 'Creating Ticket...' : 'Create Ticket'}
              </Button>
            </div>
          </motion.div>
        </form>
      </div>
    </DashboardLayout>
  );
}
'use client';

import React, { useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  AlertTriangle,
  Ban,
  Clock,
  Shield,
  FileText,
  Calendar,
  CheckCircle,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function BanUserPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = params.id as string;
  const action = searchParams.get('action') || 'suspend';
  
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState('');
  const [sendNotification, setSendNotification] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const reasons = [
    'Violation of Terms of Service',
    'Inappropriate Content',
    'Spam or Harassment',
    'Fraudulent Activity',
    'Multiple Policy Violations',
    'Security Concerns',
    'Other (specify in notes)'
  ];

  const durations = [
    { value: '1', label: '1 Day' },
    { value: '3', label: '3 Days' },
    { value: '7', label: '1 Week' },
    { value: '14', label: '2 Weeks' },
    { value: '30', label: '1 Month' },
    { value: '90', label: '3 Months' },
    { value: 'permanent', label: 'Permanent' }
  ];

  const handleSubmit = async () => {
    if (!reason) {
      toast.error('Please select a reason');
      return;
    }

    if (action === 'suspend' && !duration) {
      toast.error('Please select a duration');
      return;
    }

    setIsLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(`User ${action === 'ban' ? 'banned' : 'suspended'} successfully`);
      router.push(`/admin/users/${userId}`);
    } catch (error) {
      toast.error('Failed to process action');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <Button 
            onClick={() => router.back()}
            variant="outline"
            
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold capitalize">{action} User Account</h1>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className={cn(
                'p-3 rounded-full',
                action === 'ban' ? 'bg-red-100 dark:bg-red-900/20' : 'bg-yellow-100 dark:bg-yellow-900/20'
              )}>
                {action === 'ban' ? (
                  <Ban className="h-6 w-6 text-red-600" />
                ) : (
                  <Clock className="h-6 w-6 text-yellow-600" />
                )}
              </div>
              <div>
                <CardTitle className="text-xl">
                  {action === 'ban' ? 'Ban User Account' : 'Suspend User Account'}
                </CardTitle>
                <p className="text-muted-foreground text-sm mt-1">
                  User ID: {userId}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Warning Alert */}
            <Alert className={cn(
              'border-2',
              action === 'ban' 
                ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10'
                : 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/10'
            )}>
              <AlertTriangle className={cn(
                'h-4 w-4',
                action === 'ban' ? 'text-red-600' : 'text-yellow-600'
              )} />
              <AlertDescription className={cn(
                action === 'ban' ? 'text-red-800 dark:text-red-200' : 'text-yellow-800 dark:text-yellow-200'
              )}>
                <strong>Warning:</strong> This action will {action === 'ban' ? 'permanently ban' : 'temporarily suspend'} the user's account.
                {action === 'ban' && ' This action cannot be undone without admin intervention.'}
              </AlertDescription>
            </Alert>

            {/* Reason Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Reason for {action}</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {reasons.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Duration Selection (for suspend only) */}
            {action === 'suspend' && (
              <div className="space-y-3">
                <Label className="text-base font-medium">Suspension Duration</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {durations.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Additional Notes */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Additional Notes (Optional)</Label>
              <Textarea
                placeholder="Provide additional context or details about this action..."
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Options */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="notification"
                  checked={sendNotification}
                  onChange={(e) => setSendNotification((e.target as HTMLInputElement).checked)}
                />
                <Label htmlFor="notification" className="text-sm">
                  Send notification email to user
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox id="log" defaultChecked disabled />
                <Label htmlFor="log" className="text-sm text-muted-foreground">
                  Log this action in admin audit trail (required)
                </Label>
              </div>
            </div>

            {/* Effects Summary */}
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-3 flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Effects of this action:</span>
              </h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• User will be unable to log in to their account</li>
                <li>• All active sessions will be terminated</li>
                <li>• API access will be revoked</li>
                {action === 'suspend' ? (
                  <>
                    <li>• Account will be automatically reactivated after the specified duration</li>
                    <li>• User data and content will be preserved</li>
                  </>
                ) : (
                  <>
                    <li>• Account status will be permanently changed to "banned"</li>
                    <li>• Manual admin intervention required to reactivate</li>
                  </>
                )}
                <li>• User will receive an email notification (if enabled)</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button
                onClick={handleSubmit}
                disabled={isLoading || !reason || (action === 'suspend' && !duration)}
                className={cn(
                  'flex-1',
                  action === 'ban' 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                )}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    {action === 'ban' ? (
                      <Ban className="h-4 w-4" />
                    ) : (
                      <Clock className="h-4 w-4" />
                    )}
                    <span>Confirm {action === 'ban' ? 'Ban' : 'Suspension'}</span>
                  </div>
                )}
              </Button>
              
              <Button
                onClick={() => router.back()}
                variant="outline"
                disabled={isLoading}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Security & Compliance</p>
              <p>
                This action will be logged in the admin audit trail with your user ID and timestamp. 
                Ensure you have proper authorization before proceeding.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
'use client';

import React from 'react';
import { Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VerificationStepProps {
  verificationStatus;
  isLoadingVerification: boolean;
}

const VerificationStep = React.memo(({ verificationStatus, isLoadingVerification }: VerificationStepProps) => {
  if (isLoadingVerification) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-2 bg-muted rounded w-full"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!verificationStatus) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="h-6 w-6 text-red-600" />
            <div>
              <h4 className="font-semibold text-red-800">Verification Status Unavailable</h4>
              <p className="text-sm text-red-600">
                Unable to load your verification status. Please try again later.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className={cn(
        'border-2',
        verificationStatus.canApplyForJobs
          ? 'bg-green-50 border-green-200'
          : 'bg-orange-50 border-orange-200'
      )}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-4">
            {verificationStatus.canApplyForJobs ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <AlertCircle className="h-6 w-6 text-orange-600" />
            )}
            <div>
              <h4 className={cn(
                'font-semibold',
                verificationStatus.canApplyForJobs ? 'text-green-800' : 'text-orange-800'
              )}>
                {verificationStatus.canApplyForJobs
                  ? 'Profile Verified - Ready to Apply'
                  : 'Verification Required'
                }
              </h4>
              <p className={cn(
                'text-sm',
                verificationStatus.canApplyForJobs ? 'text-green-600' : 'text-orange-600'
              )}>
                {verificationStatus.canApplyForJobs
                  ? 'Your profile is fully verified. You can proceed with your job application.'
                  : 'Please complete your profile verification before applying for jobs.'
                }
              </p>
            </div>
          </div>

          {/* Verification Score */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium">Verification Score</span>
              <span className="font-bold">{verificationStatus.verificationScore}%</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all duration-300',
                  verificationStatus.verificationScore >= 80 ? 'bg-green-500' :
                  verificationStatus.verificationScore >= 60 ? 'bg-yellow-500' :
                  verificationStatus.verificationScore >= 40 ? 'bg-orange-500' : 'bg-red-500'
                )}
                style={{ width: `${Math.min(verificationStatus.verificationScore, 100)}%` }}
              />
            </div>
          </div>

          {/* Missing Requirements */}
          {verificationStatus.missingRequirements?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-orange-800 mb-2">
                Complete these requirements to unlock job applications:
              </p>
              <ul className="space-y-1">
                {verificationStatus.missingRequirements.map((requirement: string, index: number) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-orange-700">
                    <div className="h-1.5 w-1.5 bg-orange-500 rounded-full"></div>
                    {requirement}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {!verificationStatus.canApplyForJobs && (
        <Card>
          <CardContent className="pt-6">
            <h4 className="font-medium mb-3">Complete Your Verification</h4>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  window.open('/employee/profile', '_blank');
                }}
              >
                <Shield className="h-4 w-4 mr-2" />
                Go to Profile Verification
              </Button>
              <p className="text-xs text-muted-foreground">
                Complete your Aadhaar verification and upload required documents to proceed.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Job Requirements Notice */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Why Verification is Required</p>
              <p>
                We require profile verification to ensure the safety and authenticity of all
                job applications. This helps restaurants trust that applicants are genuine
                and qualified professionals.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

VerificationStep.displayName = 'VerificationStep';

export default VerificationStep;
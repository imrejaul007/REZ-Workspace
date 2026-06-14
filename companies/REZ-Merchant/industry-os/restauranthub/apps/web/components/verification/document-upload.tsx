'use client';

import React, { useState, useCallback } from 'react';
import { Upload, FileText, X, Check, AlertCircle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VerificationBadge } from './verification-badge';
import { cn } from '@/lib/utils';

interface Document {
  id: string;
  type: string;
  name: string;
  url: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  verifiedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

interface DocumentUploadProps {
  documents: Document[];
  requiredDocumentTypes: Array<{
    type: string;
    label: string;
    description: string;
    required: boolean;
  }>;
  onUpload: (file: File, documentType: string) => Promise<void>;
  onDelete?: (documentId: string) => Promise<void>;
  isUploading?: boolean;
  className?: string;
}

const defaultRequiredDocuments = [
  {
    type: 'aadhar',
    label: 'Aadhaar Card',
    description: 'Government issued Aadhaar card (front and back)',
    required: true
  },
  {
    type: 'pan',
    label: 'PAN Card',
    description: 'Permanent Account Number card',
    required: true
  },
  {
    type: 'photo',
    label: 'Passport Photo',
    description: 'Recent passport size photograph',
    required: true
  },
  {
    type: 'address_proof',
    label: 'Address Proof',
    description: 'Utility bill, bank statement, or rent agreement',
    required: false
  },
  {
    type: 'experience_certificate',
    label: 'Experience Certificate',
    description: 'Previous employment certificates',
    required: false
  }
];

export function DocumentUpload({
  documents = [],
  requiredDocumentTypes = defaultRequiredDocuments,
  onUpload,
  onDelete,
  isUploading = false,
  className
}: DocumentUploadProps) {
  const [draggedOver, setDraggedOver] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({});

  const handleDragOver = useCallback((e: React.DragEvent, documentType: string) => {
    e.preventDefault();
    setDraggedOver(documentType);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDraggedOver(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, documentType: string) => {
    e.preventDefault();
    setDraggedOver(null);

    const files = Array.from(e.dataTransfer.files);
    const file = files[0];

    if (file && isValidFile(file)) {
      setSelectedFiles(prev => ({ ...prev, [documentType]: file }));
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>, documentType: string) => {
    const file = e.target.files?.[0];
    if (file && isValidFile(file)) {
      setSelectedFiles(prev => ({ ...prev, [documentType]: file }));
    }
  }, []);

  const handleUpload = async (documentType: string) => {
    const file = selectedFiles[documentType];
    if (!file) return;

    try {
      await onUpload(file, documentType);
      setSelectedFiles(prev => {
        const updated = { ...prev };
        delete updated[documentType];
        return updated;
      });
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const isValidFile = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    return validTypes.includes(file.type) && file.size <= maxSize;
  };

  const getDocumentForType = (type: string) => {
    return documents.find(doc => doc.type === type);
  };

  const getUploadStatus = (documentType: string) => {
    const document = getDocumentForType(documentType);
    const selectedFile = selectedFiles[documentType];

    if (document) {
      return document.verificationStatus;
    }
    if (selectedFile) {
      return 'READY_TO_UPLOAD';
    }
    return 'NOT_UPLOADED';
  };

  const renderDocumentCard = (docType) => {
    const document = getDocumentForType(docType.type);
    const selectedFile = selectedFiles[docType.type];
    const isDragged = draggedOver === docType.type;
    const status = getUploadStatus(docType.type);

    return (
      <Card key={docType.type} className={cn('relative', className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">{docType.label}</CardTitle>
            {docType.required && (
              <Badge variant="secondary" className="text-xs">Required</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{docType.description}</p>
        </CardHeader>

        <CardContent className="pt-0">
          {document ? (
            // Document already uploaded
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium truncate">{document.name}</span>
                </div>
                <VerificationBadge status={document.verificationStatus} size="sm" />
              </div>

              {document.verificationStatus === 'REJECTED' && document.rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-red-800">Rejected</p>
                      <p className="text-xs text-red-600">{document.rejectionReason}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(document.url, '_blank')}
                  className="flex-1"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
                {onDelete && document.verificationStatus !== 'VERIFIED' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(document.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          ) : selectedFile ? (
            // File selected, ready to upload
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium truncate">{selectedFile.name}</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleUpload(docType.type)}
                  disabled={isUploading}
                  size="sm"
                  className="flex-1"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin h-3 w-3 border border-white border-t-transparent rounded-full mr-1" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-3 w-3 mr-1" />
                      Upload
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedFiles(prev => {
                    const updated = { ...prev };
                    delete updated[docType.type];
                    return updated;
                  })}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ) : (
            // Upload area
            <div
              className={cn(
                'border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors',
                isDragged ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
                docType.required && !document ? 'border-orange-300 bg-orange-50/50' : ''
              )}
              onDragOver={(e) => handleDragOver(e, docType.type)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, docType.type)}
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*,application/pdf';
                input.onchange = (e) => handleFileSelect(e as unknown, docType.type);
                input.click();
              }}
            >
              <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-1">
                Drop file here or click to upload
              </p>
              <p className="text-xs text-muted-foreground">
                JPG, PNG, PDF up to 5MB
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const completionStats = {
    total: requiredDocumentTypes.length,
    completed: requiredDocumentTypes.filter(type => {
      const doc = getDocumentForType(type.type);
      return doc && doc.verificationStatus === 'VERIFIED';
    }).length,
    pending: requiredDocumentTypes.filter(type => {
      const doc = getDocumentForType(type.type);
      return doc && doc.verificationStatus === 'PENDING';
    }).length,
    required: requiredDocumentTypes.filter(type => type.required).length,
    requiredCompleted: requiredDocumentTypes.filter(type => {
      if (!type.required) return false;
      const doc = getDocumentForType(type.type);
      return doc && doc.verificationStatus === 'VERIFIED';
    }).length
  };

  return (
    <div className="space-y-6">
      {/* Completion Overview */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Document Verification</h3>
            <Badge
              variant={completionStats.requiredCompleted === completionStats.required ? 'default' : 'secondary'}
            >
              {completionStats.completed}/{completionStats.total} Verified
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                {Math.round((completionStats.completed / completionStats.total) * 100)}%
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{
                  width: `${(completionStats.completed / completionStats.total) * 100}%`
                }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Required: {completionStats.requiredCompleted}/{completionStats.required}</span>
              <span>Pending: {completionStats.pending}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Upload Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {requiredDocumentTypes.map(renderDocumentCard)}
      </div>
    </div>
  );
}
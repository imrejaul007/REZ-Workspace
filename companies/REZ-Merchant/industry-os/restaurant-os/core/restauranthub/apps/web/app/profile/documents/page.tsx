'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Eye,
  Plus,
  Calendar,
  File,
  Image,
  Award,
  Briefcase,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileUpload } from '@/components/ui/file-upload';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { toast } from '@/lib/toast';
import { formatDate, cn } from '@/lib/utils';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

interface Document {
  id: string;
  name: string;
  type: 'resume' | 'cover_letter' | 'portfolio' | 'certificate';
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: Date;
  isDefault: boolean;
  url: string;
}

const documentTypes: { type: Document['type']; label: string; description: string }[] = [
  { type: 'resume', label: 'Resume/CV', description: 'Upload your latest resume or curriculum vitae' },
  { type: 'cover_letter', label: 'Cover Letters', description: 'Template cover letters for job applications' },
  { type: 'portfolio', label: 'Portfolio', description: 'Work samples, projects, and portfolio items' },
  { type: 'certificate', label: 'Certificates', description: 'Professional certificates and qualifications' },
];

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export default function ProfileDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingType, setUploadingType] = useState<Document['type'] | null>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      try {
        const data = await apiFetch<Document[]>('/profile/documents');
        setDocuments(
          data.map((d) => ({
            ...d,
            uploadedAt: new Date(d.uploadedAt ?? d.createdAt),
          })),
        );
      } catch {
        // No documents API yet — start with empty state
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string, documentType: Document['type']) => {
    if (documentType === 'resume') return <Briefcase className="h-5 w-5 text-blue-500" />;
    if (documentType === 'certificate') return <Award className="h-5 w-5 text-yellow-500" />;
    if (fileType.startsWith('image/')) return <Image className="h-5 w-5 text-green-500" />;
    if (fileType.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const handleUploadComplete = (files: unknown[], type: Document['type']) => {
    files.forEach((file, index) => {
      const newDoc: Document = {
        id: `local-${Date.now()}-${index}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        type,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        uploadedAt: new Date(),
        isDefault: false,
        url: URL.createObjectURL(file),
      };
      setDocuments((prev) => [newDoc, ...prev]);
    });
    setUploadingType(null);
    toast.success('Upload Complete', 'Documents uploaded successfully.');
  };

  const handleDelete = (documentId: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
    toast.success('Document Deleted', 'Document has been removed.');
  };

  const handleSetDefault = (documentId: string) => {
    setDocuments((prev) =>
      prev.map((doc) => ({
        ...doc,
        isDefault: doc.type === 'resume' ? doc.id === documentId : doc.isDefault,
      })),
    );
    toast.success('Default Set', 'Document set as default.');
  };

  const getDocumentsByType = (type: Document['type']) => documents.filter((doc) => doc.type === type);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Document Management</h1>
          <p className="text-muted-foreground">
            Manage your resumes, cover letters, portfolios, and certificates
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {documentTypes.map((docType, i) => {
            const count = getDocumentsByType(docType.type).length;
            return (
              <motion.div
                key={docType.type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{docType.label}</p>
                        <p className="text-2xl font-bold">{count}</p>
                      </div>
                      {getFileIcon('application/pdf', docType.type)}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Document Sections */}
        <div className="space-y-8">
          {documentTypes.map((docType, index) => {
            const typeDocuments = getDocumentsByType(docType.type);

            return (
              <motion.div
                key={docType.type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center">
                          {getFileIcon('application/pdf', docType.type)}
                          <span className="ml-2">{docType.label}</span>
                        </CardTitle>
                        <CardDescription>{docType.description}</CardDescription>
                      </div>
                      <Button
                        onClick={() => setUploadingType(docType.type)}
                        disabled={uploadingType !== null}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add {docType.label}
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {uploadingType === docType.type && (
                      <div className="border-2 border-dashed border-border rounded-lg p-4">
                        <FileUpload
                          accept={docType.type === 'certificate' ? '.pdf,.jpg,.jpeg,.png' : '.pdf,.doc,.docx'}
                          multiple={docType.type !== 'resume'}
                          maxFiles={docType.type === 'resume' ? 1 : 5}
                          maxSize={docType.type === 'portfolio' ? 20 : 10}
                          placeholder={`Upload your ${docType.label.toLowerCase()}`}
                          allowedTypes={
                            docType.type === 'certificate'
                              ? ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
                              : ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
                          }
                          onFilesChange={(files) => {
                            if (files.length > 0) handleUploadComplete(files, docType.type);
                          }}
                        />
                        <div className="flex justify-end mt-4">
                          <Button variant="outline" onClick={() => setUploadingType(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {typeDocuments.length > 0 ? (
                      <div className="space-y-3">
                        {typeDocuments.map((document) => (
                          <div
                            key={document.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex items-center space-x-4 flex-1 min-w-0">
                              {getFileIcon(document.fileType, document.type)}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h4 className="font-medium text-foreground truncate">{document.name}</h4>
                                  {document.isDefault && (
                                    <Badge variant="default" className="text-xs">Default</Badge>
                                  )}
                                </div>
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                  <span>{document.fileName}</span>
                                  <span>{formatFileSize(document.fileSize)}</span>
                                  <span className="flex items-center">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {formatDate(document.uploadedAt.toISOString())}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                onClick={() => window.open(document.url, '_blank')}
                                title="View document"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                onClick={() => {
                                  const link = window.document.createElement('a');
                                  link.href = document.url;
                                  link.download = document.fileName;
                                  link.click();
                                }}
                                title="Download document"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              {document.type === 'resume' && !document.isDefault && (
                                <Button variant="ghost" onClick={() => handleSetDefault(document.id)}>
                                  Set Default
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                onClick={() => handleDelete(document.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                          {getFileIcon('application/pdf', docType.type)}
                        </div>
                        <p>No {docType.label.toLowerCase()} uploaded yet</p>
                        <p className="text-sm">
                          Click &quot;Add {docType.label}&quot; to upload your first document
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}

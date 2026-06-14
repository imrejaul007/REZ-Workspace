'use client';

import React, { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  File,
  FileText,
  Image,
  X,
  Download,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in MB
  maxFiles?: number;
  onFilesChange?: (files: File[]) => void;
  onUploadComplete?: (uploadedFiles: UploadedFile[]) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  showPreview?: boolean;
  allowedTypes?: string[];
  value?: File[];
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: Date;
}

interface FileItem {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  uploadedFile?: UploadedFile;
}

export function FileUpload({
  accept = '.pdf,.doc,.docx,.txt',
  multiple = false,
  maxSize = 5, // 5MB
  maxFiles = 1,
  onFilesChange,
  onUploadComplete,
  disabled = false,
  className,
  placeholder,
  showPreview = true,
  allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
  value = []
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`;
    }
    
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return `File type not allowed. Accepted types: ${allowedTypes.map(type => type.split('/')[1]).join(', ')}`;
    }
    
    return null;
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    } else if (fileType.includes('pdf')) {
      return <FileText className="h-4 w-4 text-red-500" />;
    } else if (fileType.includes('word') || fileType.includes('document')) {
      return <FileText className="h-4 w-4 text-blue-500" />;
    }
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const uploadFileToServer = async (fileItem: FileItem): Promise<UploadedFile> => {
    const formData = new FormData();
    formData.append('file', fileItem.file);
    formData.append('fileId', fileItem.id);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setFiles((prevFiles) =>
            prevFiles.map((f) =>
              f.id === fileItem.id ? { ...f, progress } : f
            )
          );
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const json = JSON.parse(xhr.responseText);
            resolve({
              id: fileItem.id,
              name: fileItem.file.name,
              size: fileItem.file.size,
              type: fileItem.file.type,
              url: json.url || json.fileUrl || '',
              uploadedAt: new Date(),
            });
          } catch {
            reject(new Error('Invalid response from server'));
          }
        } else {
          try {
            const json = JSON.parse(xhr.responseText);
            reject(new Error(json?.error || `Upload failed (${xhr.status})`));
          } catch {
            reject(new Error(`Upload failed (${xhr.status})`));
          }
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
      xhr.addEventListener('abort', () => reject(new Error('Upload was cancelled')));

      xhr.open('POST', '/api/proxy/uploads/file');
      xhr.withCredentials = true;
      xhr.send(formData);
    });
  };

  const uploadFile = async (fileItem: FileItem) => {
    setFiles(prevFiles =>
      prevFiles.map(f =>
        f.id === fileItem.id ? { ...f, status: 'uploading', progress: 0 } : f
      )
    );

    try {
      const uploadedFile = await uploadFileToServer(fileItem);
      
      setFiles(prevFiles =>
        prevFiles.map(f =>
          f.id === fileItem.id 
            ? { ...f, status: 'success', progress: 100, uploadedFile }
            : f
        )
      );
      
      // Notify parent component
      const currentSuccessfulUploads = files
        .filter(f => f.status === 'success' && f.uploadedFile)
        .map(f => f.uploadedFile!);
      
      onUploadComplete?.([...currentSuccessfulUploads, uploadedFile]);
    } catch (error) {
      setFiles(prevFiles =>
        prevFiles.map(f =>
          f.id === fileItem.id 
            ? { ...f, status: 'error', error: error instanceof Error ? error.message : 'Upload failed' }
            : f
        )
      );
    }
  };

  const handleFileSelect = useCallback((selectedFiles: File[]) => {
    if (disabled) return;

    const newFiles: FileItem[] = [];
    const currentFileCount = files.length;
    
    for (let i = 0; i < selectedFiles.length && (currentFileCount + newFiles.length) < maxFiles; i++) {
      const file = selectedFiles[i];
      const error = validateFile(file);
      
      const fileItem: FileItem = {
        file,
        id: `${Date.now()}-${i}`,
        status: error ? 'error' : 'pending',
        progress: 0,
        error
      };
      
      newFiles.push(fileItem);
    }

    setFiles(prevFiles => [...prevFiles, ...newFiles]);
    
    // Start upload for valid files
    newFiles.forEach(fileItem => {
      if (fileItem.status === 'pending') {
        uploadFile(fileItem);
      }
    });

    // Notify parent component of file changes
    const allFiles = [...files.map(f => f.file), ...newFiles.map(f => f.file)];
    onFilesChange?.(allFiles);
  }, [files, disabled, maxFiles, onFilesChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFileSelect(droppedFiles);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    handleFileSelect(selectedFiles);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (fileId: string) => {
    setFiles(prevFiles => {
      const newFiles = prevFiles.filter(f => f.id !== fileId);
      onFilesChange?.(newFiles.map(f => f.file));
      return newFiles;
    });
  };

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const canAddMoreFiles = files.length < maxFiles;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <Card 
        className={cn(
          "relative transition-all duration-200 cursor-pointer",
          dragOver && "border-primary bg-primary/5",
          disabled && "opacity-50 cursor-not-allowed",
          !canAddMoreFiles && "opacity-60"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={canAddMoreFiles ? openFileDialog : undefined}
      >
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors",
            dragOver ? "bg-primary text-primary-foreground" : "bg-muted"
          )}>
            <Upload className="h-8 w-8" />
          </div>
          
          <h3 className="font-semibold text-lg mb-2">
            {dragOver ? 'Drop files here' : 'Upload files'}
          </h3>
          
          <p className="text-muted-foreground mb-4">
            {placeholder || `Drag and drop files here or click to browse (max ${maxSize}MB each)`}
          </p>
          
          {canAddMoreFiles ? (
            <div className="space-y-2">
              <Button type="button" variant="outline" onClick={openFileDialog}>
                Choose Files
              </Button>
              <p className="text-xs text-muted-foreground">
                {multiple ? `Up to ${maxFiles} files allowed` : 'Single file only'} • {accept}
              </p>
            </div>
          ) : (
            <Badge variant="secondary">
              Maximum files reached ({maxFiles})
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* File List */}
      {files.length > 0 && showPreview && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Uploaded Files</h4>
          <AnimatePresence>
            {files.map((fileItem) => (
              <motion.div
                key={fileItem.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        {getFileIcon(fileItem.file.type)}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {fileItem.file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(fileItem.file.size)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {fileItem.status === 'pending' && (
                          <Badge variant="secondary">
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Preparing
                          </Badge>
                        )}
                        {fileItem.status === 'uploading' && (
                          <Badge variant="secondary">
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Uploading
                          </Badge>
                        )}
                        {fileItem.status === 'success' && (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Complete
                          </Badge>
                        )}
                        {fileItem.status === 'error' && (
                          <Badge variant="destructive">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Error
                          </Badge>
                        )}
                        
                        <Button
                          variant="ghost"
                          
                          onClick={() => removeFile(fileItem.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    {fileItem.status === 'uploading' && (
                      <div className="mt-3">
                        <Progress value={fileItem.progress} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          {Math.round(fileItem.progress)}% complete
                        </p>
                      </div>
                    )}
                    
                    {/* Error Message */}
                    {fileItem.status === 'error' && fileItem.error && (
                      <div className="mt-3 p-2 bg-destructive/10 rounded text-xs text-destructive">
                        {fileItem.error}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
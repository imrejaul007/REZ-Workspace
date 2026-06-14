import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

const uploadDir = process.env.UPLOAD_DIR || './uploads';

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: multer.DestinationCallback) => {
    cb(null, uploadDir);
  },
  filename: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

// File filter
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${allowedMimes.join(', ')}`));
  }
};

// Create multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
    files: 5 // Maximum 5 files at once
  }
});

// Error handler middleware
export const handleUploadError = (
  err: Error,
  _req: Request,
  res: { status: (code: number) => { json: (data: unknown) => void } },
  next: (err?: Error) => void
) => {
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        res.status(400).json({
          error: 'File too large',
          message: `Maximum file size is ${Math.round((parseInt(process.env.MAX_FILE_SIZE || '10485760')) / 1024 / 1024)}MB`
        });
        break;
      case 'LIMIT_FILE_COUNT':
        res.status(400).json({
          error: 'Too many files',
          message: 'Maximum 5 files allowed per upload'
        });
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        res.status(400).json({
          error: 'Unexpected field',
          message: 'Unexpected file field'
        });
        break;
      default:
        res.status(400).json({
          error: 'Upload error',
          message: err.message
        });
    }
    return;
  }

  if (err) {
    res.status(400).json({
      error: 'Upload failed',
      message: err.message
    });
    return;
  }

  next();
};

// Delete file helper
export const deleteUploadedFile = async (filename: string): Promise<boolean> => {
  try {
    const filePath = path.join(uploadDir, filename);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

// Clean up old uploads (utility function)
export const cleanupOldUploads = async (maxAgeHours: number = 24): Promise<number> => {
  try {
    const files = await fs.promises.readdir(uploadDir);
    const now = Date.now();
    const maxAge = maxAgeHours * 60 * 60 * 1000;
    let deletedCount = 0;

    for (const file of files) {
      const filePath = path.join(uploadDir, file);
      const stats = await fs.promises.stat(filePath);

      if (now - stats.mtimeMs > maxAge) {
        await fs.promises.unlink(filePath);
        deletedCount++;
      }
    }

    return deletedCount;
  } catch {
    return 0;
  }
};

export default upload;

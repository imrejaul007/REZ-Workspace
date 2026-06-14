// Express type augmentation
import { Request } from 'express';
import { Multer } from 'multer';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      requestId?: string;
      file?: Multer.File;
      files?: Multer.File[];
    }
  }
}

export {};

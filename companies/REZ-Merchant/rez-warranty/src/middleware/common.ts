import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` } });
};

import express from'express';import logger from'./utils/logger';import capp.use((req: Request, res: Response, next: NextFunction) => {
  (req as any).requestId = (req.headers['x-request-id'] as string) || uuidv4();
  res.setHeader('X-Request-ID', (req as any).requestId);
  next();
});

  acheRoutes from'./routes/cache';const app=express();const PORT=4319;app.use(express.json());app.get('/health',(_,res)=>res.json({service:'REZ Cache Service',status:'healthy'}));app.use('/api/cache',cacheRoutes);
// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error(JSON.stringify({ type: 'error', error: err.message, requestId: (req as any).requestId }));
  res.status(500).json({ success: false, error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message, timestamp: new Date().toISOString() });
});

app.listen(PORT,()=>logger.info(`REZ Cache Service running on ${PORT}`));export{app};

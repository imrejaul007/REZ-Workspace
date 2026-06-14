// rez-stayown-service - Express server stub
import express from 'express';
const app = express();
const PORT = process.env.PORT || 4000;
app.get('/health', (_, res) => res.json({ status: 'ok' }));
app.listen(PORT, () => logger.info(`rez-stayown-service on ${PORT}`));
export default app;

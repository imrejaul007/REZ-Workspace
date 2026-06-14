/**
 * REZ Nearby - Location-based discovery service
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

import { placesRouter } from './routes/places.js';
import { searchRouter } from './routes/search.js';
import { categoriesRouter } from './routes/categories.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3015', 10);

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

// Health
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'rez-nearby', version: '1.0.0' });
});

// Routes
app.use('/api/places', placesRouter);
app.use('/api/search', searchRouter);
app.use('/api/categories', categoriesRouter);

app.listen(PORT, () => {
  console.log(`REZ Nearby started on port ${PORT}`);
});

export default app;

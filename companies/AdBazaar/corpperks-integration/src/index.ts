/**
 * CorpPerks Integration - Main Entry Point
 *
 * B2B employee targeting for AdBazaar.
 *
 * Port: 4555
 */

import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import { CorpPerksService } from './services/corpperksService';

const app = express();
const PORT = parseInt(process.env.PORT || '4555', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/corpperks-integration';

app.use(helmet());
app.use(cors());
app.use(express.json());

const service = new CorpPerksService();

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'corpperks-integration', version: '1.0.0' });
});

app.get('/api/company/:id', async (req: Request, res: Response) => {
  try {
    const company = await service.getCompany(req.params.id);
    if (!company) {
      res.status(404).json({ success: false, error: 'COMPANY_NOT_FOUND' });
      return;
    }
    res.json({ success: true, data: company });
  } catch (error) {
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

app.get('/api/employees', async (req: Request, res: Response) => {
  try {
    const { companyId, city, industry } = req.query;
    let employees;
    if (companyId) {
      employees = await service.getEmployeesByCompany(companyId as string);
    } else if (city) {
      employees = await service.getEmployeesByCity(city as string);
    } else if (industry) {
      employees = await service.getEmployeesByIndustry(industry as string);
    } else {
      res.status(400).json({ success: false, error: 'FILTER_REQUIRED' });
      return;
    }
    res.json({
      success: true,
      data: { count: employees.length, employees },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

app.get('/api/audience/segment', async (req: Request, res: Response) => {
  try {
    const { cities, levels, industries } = req.query;
    const segment = await service.getEmployeeSegment({
      cities: cities ? (cities as string).split(',') : undefined,
      levels: levels ? (levels as string).split(',') : undefined,
      industries: industries ? (industries as string).split(',') : undefined,
    });
    res.json({ success: true, data: segment });
  } catch (error) {
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

app.get('/api/audience/premium', async (req: Request, res: Response) => {
  try {
    const { cities, minSpend } = req.query;
    const employees = await service.getHighValueEmployees({
      cities: cities ? (cities as string).split(',') : undefined,
      minSpend: minSpend ? parseInt(minSpend as string) : undefined,
    });
    res.json({
      success: true,
      data: { count: employees.length, employees },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

app.get('/api/insights', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.query;
    const insights = await service.getCorporateInsights(companyId as string);
    res.json({ success: true, data: insights });
  } catch (error) {
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

async function start(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('[CorpPerks Integration] Connected to MongoDB');
    app.listen(PORT, () => {
      logger.info(`[CorpPerks Integration] Running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('[CorpPerks Integration] Failed to start:', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
}

start();

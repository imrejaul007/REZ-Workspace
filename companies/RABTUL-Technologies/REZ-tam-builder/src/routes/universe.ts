/**
 * REZ TAM Builder - Universe Routes
 *
 * API endpoints for account universe building and management
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { AccountUniverseModel, IAccountUniverse, ICompany } from '../models/AccountUniverse.js';
import { ICPModel } from '../models/ICP.js';
import { companyDatabase } from '../integrations/companyDB.js';
import logger from '../utils/logger.js';

const router = Router();

// ============================================================================
// Validation Schemas
// ============================================================================

const BuildUniverseSchema = z.object({
  icpId: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  maxAccounts: z.number().min(100).max(50000).default(5000),
  minScore: z.number().min(0).max(100).default(30),
});

// ============================================================================
// Services
// ============================================================================

/**
 * Score a company against ICP
 */
function scoreCompany(company: ICompany, icp: any): { score: number; breakdown: ICompany['fitBreakdown'] } {
  let industryScore = 0;
  let sizeScore = 0;
  let locationScore = 0;
  let technologyScore = 0;
  let behaviorScore = 0;

  // Industry match
  if (icp.firmographics.industries.includes(company.industry)) {
    industryScore = 100;
  }

  // Size match
  if (icp.firmographics.companySizes.includes(company.size)) {
    sizeScore = 100;
  }

  // Location match
  if (company.country && icp.firmographics.locations.countries.includes(company.country)) {
    locationScore = 100;
  }

  // Technology match
  if (icp.technographics?.technologies && company.technologies) {
    const matchingTech = company.technologies.filter(t =>
      icp.technographics.technologies.includes(t)
    );
    technologyScore = (matchingTech.length / Math.max(icp.technographics.technologies.length, 1)) * 100;
  }

  // Calculate total
  const totalScore = Math.round(
    (industryScore * 0.25) +
    (sizeScore * 0.20) +
    (locationScore * 0.15) +
    (technologyScore * 0.20) +
    (behaviorScore * 0.20)
  );

  return {
    score: totalScore,
    breakdown: {
      industry: industryScore,
      size: sizeScore,
      location: locationScore,
      technology: technologyScore,
      behavior: behaviorScore,
    },
  };
}

// ============================================================================
// Routes
// ============================================================================

/**
 * POST /api/v1/universe
 * Build account universe from ICP
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Missing tenant ID' });
      return;
    }

    const validated = BuildUniverseSchema.parse(req.body);

    // Get ICP
    const icp = await ICPModel.findOne({ _id: validated.icpId, tenantId });
    if (!icp) {
      res.status(404).json({ success: false, error: 'ICP not found' });
      return;
    }

    // Create universe record
    const universe = await AccountUniverseModel.create({
      tenantId,
      icpId: icp._id,
      name: validated.name || `Universe for ${icp.name}`,
      description: validated.description,
      status: 'building',
      buildProgress: 0,
      source: 'icp',
    });

    // Build universe asynchronously
    buildUniverse(universe._id.toString(), icp, validated.maxAccounts, validated.minScore)
      .catch(err => logger.error('Universe build failed', { universeId: universe._id, error: err.message }));

    logger.info('Universe build started', { universeId: universe._id, icpId: validated.icpId });

    res.status(201).json({
      success: true,
      data: {
        universeId: universe._id,
        status: 'building',
        message: 'Universe build started',
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
      return;
    }
    logger.error('Failed to start universe build', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to start universe build' });
  }
});

/**
 * GET /api/v1/universe/:id
 * Get universe status/details
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { id } = req.params;

    const universe = await AccountUniverseModel.findOne({ _id: id, tenantId });

    if (!universe) {
      res.status(404).json({ success: false, error: 'Universe not found' });
      return;
    }

    res.json({
      success: true,
      data: { universe },
    });
  } catch (error) {
    logger.error('Failed to get universe', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to get universe' });
  }
});

/**
 * GET /api/v1/universe/:id/accounts
 * Get accounts in universe
 */
router.get('/:id/accounts', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { id } = req.params;
    const { minScore = '0', maxScore = '100', sort = 'score', page = '1', limit = '50' } = req.query;

    const universe = await AccountUniverseModel.findOne({ _id: id, tenantId });

    if (!universe) {
      res.status(404).json({ success: false, error: 'Universe not found' });
      return;
    }

    // Filter companies
    let companies = universe.companies.filter(c =>
      c.score >= parseInt(minScore as string) &&
      c.score <= parseInt(maxScore as string)
    );

    // Sort
    if (sort === 'score') {
      companies.sort((a, b) => b.score - a.score);
    } else if (sort === 'name') {
      companies.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Paginate
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const start = (pageNum - 1) * limitNum;
    const paginated = companies.slice(start, start + limitNum);

    res.json({
      success: true,
      data: {
        companies: paginated,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: companies.length,
          pages: Math.ceil(companies.length / limitNum),
        },
        stats: {
          total: universe.totalCompanies,
          enriched: universe.enrichedCompanies,
          highFit: universe.highFitCompanies,
          mediumFit: universe.mediumFitCompanies,
          lowFit: universe.lowFitCompanies,
        },
      },
    });
  } catch (error) {
    logger.error('Failed to get accounts', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to get accounts' });
  }
});

/**
 * POST /api/v1/universe/:id/refresh
 * Refresh universe with new data
 */
router.post('/:id/refresh', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { id } = req.params;

    const universe = await AccountUniverseModel.findOne({ _id: id, tenantId });
    if (!universe) {
      res.status(404).json({ success: false, error: 'Universe not found' });
      return;
    }

    const icp = await ICPModel.findById(universe.icpId);
    if (!icp) {
      res.status(404).json({ success: false, error: 'ICP not found' });
      return;
    }

    universe.status = 'refreshing';
    universe.buildProgress = 0;
    await universe.save();

    buildUniverse(id, icp, 5000, 30)
      .catch(err => logger.error('Universe refresh failed', { universeId: id, error: err.message }));

    res.json({
      success: true,
      data: { status: 'refreshing', message: 'Universe refresh started' },
    });
  } catch (error) {
    logger.error('Failed to refresh universe', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to refresh universe' });
  }
});

// ============================================================================
// Async Universe Builder
// ============================================================================

async function buildUniverse(
  universeId: string,
  icp: any,
  maxAccounts: number,
  minScore: number
): Promise<void> {
  try {
    const universe = await AccountUniverseModel.findById(universeId);
    if (!universe) return;

    // Get companies from database
    const companies = await companyDatabase.findCompanies({
      industries: icp.firmographics.industries,
      sizes: icp.firmographics.companySizes,
      countries: icp.firmographics.locations.countries,
      limit: maxAccounts * 2, // Get more to filter
    });

    // Score and filter
    const scoredCompanies: ICompany[] = [];
    let highFit = 0, mediumFit = 0, lowFit = 0;
    const byIndustry: Record<string, number> = {};
    const bySize: Record<string, number> = {};
    const byLocation: Record<string, number> = {};

    for (const company of companies) {
      const { score, breakdown } = scoreCompany(company, icp);

      if (score < minScore) continue;

      const scored: ICompany = {
        ...company,
        id: company.id || `company_${scoredCompanies.length}`,
        score,
        fitBreakdown: breakdown,
        enrichmentStatus: 'pending',
      };

      scoredCompanies.push(scored);

      // Update stats
      if (score >= 80) highFit++;
      else if (score >= 50) mediumFit++;
      else lowFit++;

      byIndustry[company.industry] = (byIndustry[company.industry] || 0) + 1;
      bySize[company.size] = (bySize[company.size] || 0) + 1;
      if (company.country) byLocation[company.country] = (byLocation[company.country] || 0) + 1;

      // Progress update
      if (scoredCompanies.length % 100 === 0) {
        await AccountUniverseModel.findByIdAndUpdate(universeId, {
          buildProgress: Math.min(95, (scoredCompanies.length / maxAccounts) * 100),
        });
      }

      // Stop if reached max
      if (scoredCompanies.length >= maxAccounts) break;
    }

    // Save universe
    await AccountUniverseModel.findByIdAndUpdate(universeId, {
      companies: scoredCompanies,
      totalCompanies: scoredCompanies.length,
      highFitCompanies: highFit,
      mediumFitCompanies: mediumFit,
      lowFitCompanies: lowFit,
      byIndustry,
      bySize,
      byLocation,
      status: 'built',
      buildProgress: 100,
      builtAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    // Update ICP stats
    await ICPModel.findByIdAndUpdate(icp._id, {
      accountCount: scoredCompanies.length,
      lastBuiltAt: new Date(),
    });

    logger.info('Universe built', {
      universeId,
      totalCompanies: scoredCompanies.length,
      highFit,
      mediumFit,
      lowFit,
    });
  } catch (error) {
    logger.error('Universe build failed', {
      universeId,
      error: (error as Error).message,
    });

    await AccountUniverseModel.findByIdAndUpdate(universeId, {
      status: 'failed',
      errorMessage: (error as Error).message,
    });
  }
}

export default router;

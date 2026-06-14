import { Router, Request, Response } from 'express';
import { templates, getTemplatesByCategory, getTemplateById, searchTemplates } from '../data/templates';
import { WorkflowTemplate } from '../models/template';
import logger from '../utils/logger';

interface TemplateWithFeatured extends WorkflowTemplate {
  isFeatured?: boolean;
}

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const { category, industry, search, featured, limit } = req.query;
    let result: WorkflowTemplate[] = templates;

    if (category && typeof category === 'string') {
      result = result.filter(t => t.category === category);
    }
    if (industry && typeof industry === 'string') {
      result = result.filter(t => t.industry === industry);
    }
    if (featured === 'true') {
      result = result.filter((t: TemplateWithFeatured) => t.isFeatured);
    }
    if (search && typeof search === 'string') {
      const s = search.toLowerCase();
      result = result.filter(t =>
        t.name.toLowerCase().includes(s) ||
        t.description.toLowerCase().includes(s) ||
        t.tags.some(tag => tag.toLowerCase().includes(s))
      );
    }
    if (limit && typeof limit === 'string') {
      const l = parseInt(limit, 10);
      if (!isNaN(l) && l > 0) result = result.slice(0, l);
    }

    res.json({ success: true, data: result, count: result.length });
  } catch (error) {
    logger.error('Error fetching templates:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/categories', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      { id: 'commerce', name: 'Commerce', count: getTemplatesByCategory('commerce').length },
      { id: 'operations', name: 'Operations', count: getTemplatesByCategory('operations').length },
      { id: 'finance', name: 'Finance', count: getTemplatesByCategory('finance').length },
      { id: 'hr', name: 'HR', count: getTemplatesByCategory('hr').length },
      { id: 'marketing', name: 'Marketing', count: getTemplatesByCategory('marketing').length },
    ],
  });
});

router.get('/industries', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      { id: 'restaurant', name: 'Restaurant & Food Service' },
      { id: 'healthcare', name: 'Healthcare & Medical' },
      { id: 'finance', name: 'Finance & Banking' },
      { id: 'retail', name: 'Retail & E-commerce' },
      { id: 'hr', name: 'Human Resources' },
    ],
  });
});

router.get('/featured', (_req: Request, res: Response) => {
  const featured = templates.filter((t: TemplateWithFeatured) => t.isFeatured);
  res.json({ success: true, data: featured });
});

router.get('/search', (req: Request, res: Response) => {
  const { q, category, industry, complexity } = req.query;
  if (!q || typeof q !== 'string') {
    res.status(400).json({ success: false, error: 'Search query is required' });
    return;
  }
  const results = searchTemplates(q, {
    category: category as string,
    industry: industry as string,
    complexity: complexity as string,
  });
  res.json({ success: true, data: results, count: results.length });
});

router.get('/:id', (req: Request, res: Response) => {
  const template = getTemplateById(req.params.id);
  if (!template) {
    res.status(404).json({ success: false, error: 'Template not found' });
    return;
  }
  res.json({ success: true, data: template });
});

router.post('/:id/instantiate', (req: Request, res: Response) => {
  const template = getTemplateById(req.params.id);
  if (!template) {
    res.status(404).json({ success: false, error: 'Template not found' });
    return;
  }
  const { name, description, config } = req.body;
  const instance = {
    id: `wf_${Date.now()}`,
    name: name || `${template.name} Instance`,
    description: description || template.description,
    templateId: template.id,
    nodes: JSON.parse(JSON.stringify(template.nodes)),
    edges: JSON.parse(JSON.stringify(template.edges)),
    config: config || {},
    status: 'draft',
    createdAt: new Date().toISOString(),
    metrics: { totalRuns: 0, successfulRuns: 0, failedRuns: 0, averageExecutionTime: 0 },
  };
  logger.info(`Workflow instantiated: ${instance.id}`);
  res.status(201).json({ success: true, data: instance, message: 'Workflow created from template' });
});

export default router;

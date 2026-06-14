import { Router, Request, Response } from 'express';
import { quoteService } from '../services/quoteService';
import { pdfGenerator } from '../services/pdfGenerator';
import { validateCreateQuote, validateUpdateQuote } from '../middleware/validation';

const router = Router();

// GET /api/quotes - List all quotes
router.get('/', async (_req: Request, res: Response) => {
  try {
    const quotes = await quoteService.getAllQuotes();
    res.json({ success: true, data: quotes, count: quotes.length });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// GET /api/quotes/:id - Get quote by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const quote = await quoteService.getQuoteById(req.params.id);
    if (!quote) {
      return res.status(404).json({ success: false, error: 'Quote not found' });
    }
    res.json({ success: true, data: quote });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// POST /api/quotes - Create new quote
router.post('/', validateCreateQuote, async (req: Request, res: Response) => {
  try {
    const quote = await quoteService.createQuote(req.body);
    res.status(201).json({ success: true, data: quote });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

// PUT /api/quotes/:id - Update quote
router.put('/:id', validateUpdateQuote, async (req: Request, res: Response) => {
  try {
    const quote = await quoteService.updateQuote(req.params.id, req.body);
    if (!quote) {
      return res.status(404).json({ success: false, error: 'Quote not found' });
    }
    res.json({ success: true, data: quote });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

// POST /api/quotes/:id/accept - Accept quote
router.post('/:id/accept', async (req: Request, res: Response) => {
  try {
    const quote = await quoteService.acceptQuote(req.params.id, req.body);
    if (!quote) {
      return res.status(404).json({ success: false, error: 'Quote not found' });
    }
    res.json({ success: true, data: quote, message: 'Quote accepted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

// POST /api/quotes/:id/reject - Reject quote
router.post('/:id/reject', async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    const quote = await quoteService.rejectQuote(req.params.id, reason);
    if (!quote) {
      return res.status(404).json({ success: false, error: 'Quote not found' });
    }
    res.json({ success: true, data: quote, message: 'Quote rejected' });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

// GET /api/quotes/:id/pdf - Generate PDF
router.get('/:id/pdf', async (req: Request, res: Response) => {
  try {
    const quote = await quoteService.getQuoteById(req.params.id);
    if (!quote) {
      return res.status(404).json({ success: false, error: 'Quote not found' });
    }

    const pdfBuffer = await pdfGenerator.generateQuotePDF(quote);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=quote-${quote.quoteNumber}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;

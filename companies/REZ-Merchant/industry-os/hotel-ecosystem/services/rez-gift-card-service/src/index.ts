import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { GiftCardService } from './services/gift-card.service.js';

const app = express();
const PORT = 4047;

app.use(cors());
app.use(express.json());

const giftCardService = new GiftCardService();

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'rez-gift-card-service',
    timestamp: new Date().toISOString(),
  });
});

// Create a new gift card
app.post('/api/cards', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { hotelId, type, value, validFrom, validUntil } = req.body;
    const card = await giftCardService.createCard(hotelId, type, value, validFrom ? new Date(validFrom) : undefined, validUntil ? new Date(validUntil) : undefined);
    res.status(201).json({ success: true, card });
  } catch (error) {
    next(error);
  }
});

// Get card by ID or number
app.get('/api/cards/:identifier', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { identifier } = req.params;
    const pin = req.query.pin as string | undefined;
    const card = await giftCardService.getCard(identifier, pin);
    if (!card) {
      res.status(404).json({ error: 'Card not found' });
      return;
    }
    res.json({ success: true, card });
  } catch (error) {
    next(error);
  }
});

// Load value onto card
app.post('/api/cards/:cardId/load', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cardId } = req.params;
    const { amount, processedBy } = req.body;
    const card = await giftCardService.loadCard(cardId, amount, processedBy);
    res.json({ success: true, card });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Redeem from card
app.post('/api/cards/:cardId/redeem', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cardId } = req.params;
    const { amount, referenceType, referenceId, processedBy } = req.body;
    const result = await giftCardService.redeemCard(cardId, amount, referenceType, referenceId, processedBy);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Sell a card
app.post('/api/cards/sell', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { hotelId, amount, type, senderName, senderEmail, paymentMethod, recipientName, recipientEmail, message } = req.body;
    const result = await giftCardService.sellCard(hotelId, amount, type, senderName, senderEmail, paymentMethod, recipientName, recipientEmail, message);
    res.status(201).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

// Validate card
app.post('/api/cards/validate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cardNumber, pin } = req.body;
    const result = await giftCardService.validateCard(cardNumber, pin);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get card balance
app.get('/api/cards/:cardNumber/balance', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cardNumber } = req.params;
    const pin = req.query.pin as string;
    if (!pin) {
      res.status(400).json({ error: 'PIN required' });
      return;
    }
    const balance = await giftCardService.getCardBalance(cardNumber, pin);
    res.json({ success: true, balance });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Cancel card
app.post('/api/cards/:cardId/cancel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cardId } = req.params;
    const card = await giftCardService.cancelCard(cardId);
    res.json({ success: true, card });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get hotel cards
app.get('/api/hotels/:hotelId/cards', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { hotelId } = req.params;
    const status = req.query.status as GiftCardService extends { getHotelCards(id: string, s?: infer S): Promise<any> } ? S : never;
    const cards = await giftCardService.getHotelCards(hotelId, status);
    res.json({ success: true, cards, count: cards.length });
  } catch (error) {
    next(error);
  }
});

// Get sales report
app.get('/api/hotels/:hotelId/reports/sales', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { hotelId } = req.params;
    const { startDate, endDate } = req.query;
    const report = await giftCardService.getSalesReport(
      hotelId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );
    res.json({ success: true, report });
  } catch (error) {
    next(error);
  }
});

// Error handling
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`ReZ Gift Card Service running on port ${PORT}`);
});

export default app;

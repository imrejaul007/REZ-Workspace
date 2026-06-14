import { Router, Request, Response } from 'express';
import { BookingBot, Booking, Service, Stylist } from '../services/BookingBot';
import { WhatsAppService } from '../services/WhatsAppService';

export function createBotRouter(
  whatsAppService: WhatsAppService,
  bookingBot: BookingBot
): Router {
  const router = Router();

  router.get('/bot/status', async (req: Request, res: Response) => {
    const status = whatsAppService.getConnectionStatus();
    res.json({
      whatsapp: {
        connected: status.isConnected,
        qrAvailable: !!status.qrCode
      },
      bot: {
        active: true,
        state: 'running'
      },
      timestamp: new Date().toISOString()
    });
  });

  router.post('/bot/send', async (req: Request, res: Response) => {
    try {
      const { to, message, type } = req.body;

      if (!to || !message) {
        res.status(400).json({ error: 'Missing required fields: to, message' });
        return;
      }

      await whatsAppService.sendTextMessage(to, message);

      res.json({ success: true, to, message });
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  router.get('/bot/services', async (req: Request, res: Response) => {
    try {
      const services = (bookingBot as unknown).SERVICES_CATALOG as Service[];
      res.json({ services });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch services' });
    }
  });

  router.get('/bot/stylists', async (req: Request, res: Response) => {
    try {
      const stylists = (bookingBot as unknown).STYLISTS as Stylist[];
      const { serviceId } = req.query;

      let filteredStylists = stylists;

      if (serviceId) {
        const service = (bookingBot as unknown).SERVICES_CATALOG.find((s: Service) => s.id === serviceId);
        if (service) {
          filteredStylists = stylists.filter(s => service.availableStylists.includes(s.id));
        }
      }

      res.json({ stylists: filteredStylists });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch stylists' });
    }
  });

  router.get('/bot/availability', async (req: Request, res: Response) => {
    try {
      const { serviceId, stylistId, date } = req.query;

      if (!date) {
        res.status(400).json({ error: 'Date is required' });
        return;
      }

      const slots = (bookingBot as unknown).getAvailableSlots(date as string, stylistId as string);

      res.json({
        date,
        stylistId,
        serviceId,
        slots
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch availability' });
    }
  });

  router.get('/bot/bookings/:phoneNumber', async (req: Request, res: Response) => {
    try {
      const { phoneNumber } = req.params;
      const { type } = req.query;

      const bookings = type === 'active'
        ? await (bookingBot as unknown).getActiveBookings(phoneNumber)
        : await (bookingBot as unknown).getPastBookings(phoneNumber);

      res.json({ bookings });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch bookings' });
    }
  });

  router.post('/bot/bookings', async (req: Request, res: Response) => {
    try {
      const { phoneNumber, serviceId, stylistId, date, time, notes } = req.body;

      if (!phoneNumber || !serviceId || !stylistId || !date || !time) {
        res.status(400).json({
          error: 'Missing required fields: phoneNumber, serviceId, stylistId, date, time'
        });
        return;
      }

      const booking = await (bookingBot as unknown).createBooking({
        serviceId,
        stylistId,
        preferredDate: date,
        preferredTime: time,
        notes
      }, phoneNumber);

      res.json({ booking });
    } catch (error) {
      console.error('Create booking error:', error);
      res.status(500).json({ error: 'Failed to create booking' });
    }
  });

  router.delete('/bot/bookings/:bookingId', async (req: Request, res: Response) => {
    try {
      const { bookingId } = req.params;

      await (bookingBot as unknown).cancelBooking(bookingId);

      res.json({ success: true, bookingId });
    } catch (error) {
      res.status(500).json({ error: 'Failed to cancel booking' });
    }
  });

  router.post('/bot/bookings/:bookingId/reminder', async (req: Request, res: Response) => {
    try {
      const { bookingId } = req.params;
      const { reminderDate, phoneNumber } = req.body;

      if (!reminderDate || !phoneNumber) {
        res.status(400).json({ error: 'Missing required fields: reminderDate, phoneNumber' });
        return;
      }

      await (bookingBot as unknown).scheduleReminder(bookingId, reminderDate, phoneNumber);

      res.json({ success: true, bookingId, reminderDate });
    } catch (error) {
      res.status(500).json({ error: 'Failed to schedule reminder' });
    }
  });

  router.post('/bot/bookings/:bookingId/payment-link', async (req: Request, res: Response) => {
    try {
      const { bookingId } = req.params;

      const paymentLink = await (bookingBot as unknown).generatePaymentLink(bookingId);

      res.json({ paymentLink, bookingId });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate payment link' });
    }
  });

  return router;
}

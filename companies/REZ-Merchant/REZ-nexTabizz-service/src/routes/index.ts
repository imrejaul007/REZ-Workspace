import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { NexTabizzBusiness, NexTabizzBooking, NexTabizzCustomer } from '../models/NexTabizz';
import { logger } from '../config/logger';

const router = Router();

// ==================== BUSINESS ROUTES ====================

router.get('/businesses', async (req: Request, res: Response) => {
  try {
    const { category, city, status } = req.query;
    const query: Record<string, any> = { status: status || 'active' };
    if (category) query.category = category;
    if (city) query['address.city'] = city;

    const businesses = await NexTabizzBusiness.find(query).sort({ rating: -1 });
    res.json({ success: true, data: businesses, count: businesses.length });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch businesses' } });
  }
});

router.get('/businesses/:id', async (req: Request, res: Response) => {
  try {
    const business = await NexTabizzBusiness.findById(req.params.id);
    if (!business) return res.status(404).json({ success: false, error: { message: 'Business not found' } });
    res.json({ success: true, data: business });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch business' } });
  }
});

router.post('/businesses', async (req: Request, res: Response) => {
  try {
    const business = await NexTabizzBusiness.create(req.body);
    res.status(201).json({ success: true, data: business });
  } catch (error) {
    res.status(400).json({ success: false, error: { message: (error as Error).message } });
  }
});

router.put('/businesses/:id', async (req: Request, res: Response) => {
  try {
    const business = await NexTabizzBusiness.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!business) return res.status(404).json({ success: false, error: { message: 'Business not found' } });
    res.json({ success: true, data: business });
  } catch (error) {
    res.status(400).json({ success: false, error: { message: (error as Error).message } });
  }
});

// ==================== SERVICE ROUTES ====================

router.get('/businesses/:id/services', async (req: Request, res: Response) => {
  try {
    const business = await NexTabizzBusiness.findById(req.params.id);
    if (!business) return res.status(404).json({ success: false, error: { message: 'Business not found' } });
    res.json({ success: true, data: business.services.filter(s => s.available) });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch services' } });
  }
});

router.post('/businesses/:id/services', async (req: Request, res: Response) => {
  try {
    const business = await NexTabizzBusiness.findByIdAndUpdate(
      req.params.id,
      { $push: { services: req.body } },
      { new: true }
    );
    if (!business) return res.status(404).json({ success: false, error: { message: 'Business not found' } });
    res.status(201).json({ success: true, data: business.services });
  } catch (error) {
    res.status(400).json({ success: false, error: { message: (error as Error).message } });
  }
});

// ==================== BOOKING ROUTES ====================

router.post('/bookings', async (req: Request, res: Response) => {
  try {
    const { businessId, customerPhone, serviceId, date, time } = req.body;

    const business = await NexTabizzBusiness.findById(businessId);
    if (!business) return res.status(404).json({ success: false, error: { message: 'Business not found' } });

    const service = business.services.find(s => s.name === serviceId);
    if (!service) return res.status(404).json({ success: false, error: { message: 'Service not found' } });

    let customer = await NexTabizzCustomer.findOne({ phone: customerPhone });
    if (!customer) {
      customer = await NexTabizzCustomer.create({ phone: customerPhone, name: 'Customer' });
    }

    const booking = await NexTabizzBooking.create({
      businessId,
      customerId: customer._id,
      serviceId,
      date: new Date(date),
      time,
      duration: service.duration,
      amount: service.price,
    });

    await NexTabizzBusiness.updateOne({ _id: businessId }, { $inc: { totalBookings: 1 } });

    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    res.status(400).json({ success: false, error: { message: (error as Error).message } });
  }
});

router.get('/bookings/:id', async (req: Request, res: Response) => {
  try {
    const booking = await NexTabizzBooking.findById(req.params.id)
      .populate('businessId', 'name address phone')
      .populate('customerId', 'name phone');
    if (!booking) return res.status(404).json({ success: false, error: { message: 'Booking not found' } });
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch booking' } });
  }
});

router.get('/businesses/:id/bookings', async (req: Request, res: Response) => {
  try {
    const { date, status } = req.query;
    const query: Record<string, any> = { businessId: req.params.id };
    if (date) query.date = new Date(date as string);
    if (status) query.status = status;

    const bookings = await NexTabizzBooking.find(query)
      .populate('customerId', 'name phone')
      .sort({ date: 1, time: 1 });
    res.json({ success: true, data: bookings, count: bookings.length });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch bookings' } });
  }
});

router.patch('/bookings/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const booking = await NexTabizzBooking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!booking) return res.status(404).json({ success: false, error: { message: 'Booking not found' } });

    if (status === 'completed') {
      await NexTabizzCustomer.updateOne(
        { _id: booking.customerId },
        {
          $inc: { visitCount: 1, totalSpent: booking.amount },
          $set: { lastVisit: new Date() }
        }
      );
      await NexTabizzBusiness.updateOne(
        { _id: booking.businessId },
        { $inc: { totalRevenue: booking.amount } }
      );
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(400).json({ success: false, error: { message: (error as Error).message } });
  }
});

// ==================== CUSTOMER ROUTES ====================

router.get('/customers/:phone', async (req: Request, res: Response) => {
  try {
    const customer = await NexTabizzCustomer.findOne({ phone: req.params.phone })
      .populate({
        path: 'bookings',
        populate: { path: 'businessId', select: 'name' }
      });
    if (!customer) return res.status(404).json({ success: false, error: { message: 'Customer not found' } });
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch customer' } });
  }
});

// ==================== STATISTICS ====================

router.get('/businesses/:id/stats', async (req: Request, res: Response) => {
  try {
    const business = await NexTabizzBusiness.findById(req.params.id);
    if (!business) return res.status(404).json({ success: false, error: { message: 'Business not found' } });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayBookings = await NexTabizzBooking.countDocuments({
      businessId: req.params.id,
      date: today,
      status: { $ne: 'cancelled' }
    });

    res.json({
      success: true,
      data: {
        totalBookings: business.totalBookings,
        totalRevenue: business.totalRevenue,
        todayBookings,
        rating: business.rating,
        servicesCount: business.services.length,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch stats' } });
  }
});

export default router;

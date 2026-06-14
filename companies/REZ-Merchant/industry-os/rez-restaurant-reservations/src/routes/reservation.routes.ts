/**
 * Reservation Routes
 */

import { Router, Request, Response } from 'express';
import { Reservation, Table } from '../models';
import { requireRoles } from '../middleware/auth';
import crypto from 'crypto';

const router = Router();

// Create reservation
router.post('/', async (req: Request, res: Response) => {
  try {
    const reservationId = `RES${Date.now()}${crypto.randomUUID().split('-')[0]}`;
    const reservation = new Reservation({
      reservationId,
      ...req.body,
      status: 'pending',
    });
    await reservation.save();
    res.status(201).json({ success: true, data: reservation });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create reservation' });
  }
});

// Get reservations by date
router.get('/', async (req: Request, res: Response) => {
  try {
    const { restaurantId, date, status } = req.query;
    const query: unknown = {};

    if (restaurantId) query.restaurantId = restaurantId;
    if (status) query.status = status;
    if (date) {
      const startOfDay = new Date(date as string);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date as string);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    const reservations = await Reservation.find(query).sort({ date: 1, time: 1 });
    res.json({ success: true, data: reservations });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch reservations' });
  }
});

// Get reservation by ID
router.get('/:reservationId', async (req: Request, res: Response) => {
  try {
    const reservation = await Reservation.findOne({ reservationId: req.params.reservationId });
    if (!reservation) {
      res.status(404).json({ success: false, error: 'Reservation not found' });
      return;
    }
    res.json({ success: true, data: reservation });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch reservation' });
  }
});

// Update reservation
router.put('/:reservationId', requireRoles('admin', 'manager', 'employee'), async (req: Request, res: Response) => {
  try {
    const reservation = await Reservation.findOneAndUpdate(
      { reservationId: req.params.reservationId },
      req.body,
      { new: true }
    );
    if (!reservation) {
      res.status(404).json({ success: false, error: 'Reservation not found' });
      return;
    }
    res.json({ success: true, data: reservation });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update reservation' });
  }
});

// Confirm reservation
router.post('/:reservationId/confirm', requireRoles('admin', 'manager', 'employee'), async (req: Request, res: Response) => {
  try {
    const reservation = await Reservation.findOneAndUpdate(
      { reservationId: req.params.reservationId },
      { status: 'confirmed' },
      { new: true }
    );
    if (!reservation) {
      res.status(404).json({ success: false, error: 'Reservation not found' });
      return;
    }
    res.json({ success: true, data: reservation });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to confirm reservation' });
  }
});

// Seat reservation (assign table)
router.post('/:reservationId/seat', requireRoles('admin', 'manager', 'employee'), async (req: Request, res: Response) => {
  try {
    const { tableId } = req.body;
    const reservation = await Reservation.findOneAndUpdate(
      { reservationId: req.params.reservationId },
      { status: 'seated', tableId },
      { new: true }
    );

    if (!reservation) {
      res.status(404).json({ success: false, error: 'Reservation not found' });
      return;
    }

    // Update table status
    if (tableId) {
      await Table.findOneAndUpdate({ tableId }, { status: 'occupied' });
    }

    res.json({ success: true, data: reservation });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to seat reservation' });
  }
});

// Cancel reservation
router.post('/:reservationId/cancel', async (req: Request, res: Response) => {
  try {
    const { reason, cancelledBy } = req.body;
    const reservation = await Reservation.findOneAndUpdate(
      { reservationId: req.params.reservationId },
      { status: 'cancelled', cancellationReason: reason, cancelledBy },
      { new: true }
    );
    if (!reservation) {
      res.status(404).json({ success: false, error: 'Reservation not found' });
      return;
    }
    res.json({ success: true, data: reservation });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to cancel reservation' });
  }
});

// Mark as no-show
router.post('/:reservationId/no-show', requireRoles('admin', 'manager'), async (req: Request, res: Response) => {
  try {
    const reservation = await Reservation.findOneAndUpdate(
      { reservationId: req.params.reservationId },
      { status: 'no_show' },
      { new: true }
    );
    if (!reservation) {
      res.status(404).json({ success: false, error: 'Reservation not found' });
      return;
    }
    res.json({ success: true, data: reservation });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to mark as no-show' });
  }
});

// Get availability for date
router.get('/availability/:date', async (req: Request, res: Response) => {
  try {
    const { restaurantId, time, partySize } = req.query;
    const date = new Date(req.params.date);

    // Get all reservations for that date/time
    const existingReservations = await Reservation.find({
      restaurantId,
      date: { $gte: new Date(date.setHours(0, 0, 0, 0)), $lte: new Date(date.setHours(23, 59, 59, 999)) },
      status: { $in: ['pending', 'confirmed', 'seated'] },
    });

    // Get all tables
    const tables = await Table.find({
      restaurantId,
      status: { $ne: 'blocked' },
      'capacity.min': { $lte: Number(partySize) },
      'capacity.max': { $gte: Number(partySize) },
    });

    // Filter available tables
    const availableTables = tables.filter(table => {
      return !existingReservations.some(r => r.tableId === table.tableId);
    });

    res.json({
      success: true,
      data: {
        partySize,
        time,
        availableSlots: availableTables.length,
        tables: availableTables,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to check availability' });
  }
});

export { router as reservationRoutes };

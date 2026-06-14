
/**
 * REZ Now Services Catalog routes - Manage services and appointments for REZ Now pages.
 *
 * This module provides a dedicated API for service catalog management,
 * separate from the existing services.ts which uses the Product model.
 *
 * Services Endpoints:
 * GET    /rez-now-services/:storeId              - List all services for a store
 * POST   /rez-now-services/:storeId             - Create a new service
 * GET    /rez-now-services/:storeId/:serviceId   - Get a specific service
 * PUT    /rez-now-services/:storeId/:serviceId   - Update a service
 * DELETE /rez-now-services/:storeId/:serviceId  - Delete a service
 *
 * Appointments Endpoints:
 * GET    /rez-now-services/appointments/:storeId    - List appointments
 * POST   /rez-now-services/appointments             - Create an appointment
 * GET    /rez-now-services/appointments/:id        - Get appointment details
 * PATCH  /rez-now-services/appointments/:id        - Update appointment status
 * DELETE /rez-now-services/appointments/:id        - Cancel an appointment
 */
import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Store } from '../models/Store';
import { Service, Appointment } from '../models/Service';
import { MerchantUser } from '../models/MerchantUser';
import { merchantAuth } from '../middleware/auth';

const router = Router();
router.use(merchantAuth);

/**
 * Verify merchant owns the store.
 */
async function verifyStoreOwnership(storeId: string, merchantId: string): Promise<boolean> {
  if (!mongoose.Types.ObjectId.isValid(storeId)) return false;
  const store = await Store.findOne({
    _id: new mongoose.Types.ObjectId(storeId),
    $or: [{ merchantId: new mongoose.Types.ObjectId(merchantId) }, { merchant: new mongoose.Types.ObjectId(merchantId) }],
  });
  return !!store;
}

// ============== SERVICES ==============

/**
 * GET /rez-now-services/:storeId
 * List all services for a store.
 */
router.get('/:storeId', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const { category, active } = req.query;

    if (!await verifyStoreOwnership(storeId, req.merchantId!)) {
      res.status(404).json({ success: false, message: 'Store not found or access denied' });
      return;
    }

    const filter: unknown = { storeId: new mongoose.Types.ObjectId(storeId) };
    if (category) filter.category = category;
    if (active !== undefined) filter.isActive = active === 'true';

    const services = await Service.find(filter).sort({ sortOrder: 1, createdAt: -1 }).lean();

    // Get staff names for each service
    const staffMembers = await MerchantUser.find({ _id: { $in: services.flatMap((s) => s.staff) } })
      .select('_id name')
      .lean();

    const staffMap = new Map(staffMembers.map((s) => [s._id.toString(), { id: s._id, name: s.name }]));

    const servicesWithStaff = services.map((s) => ({
      ...s,
      staff: (s.staff as mongoose.Types.ObjectId[]).map((id) => staffMap.get(id.toString()) || { id, name: 'Unknown' }),
    }));

    res.json({ success: true, data: servicesWithStaff });
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * POST /rez-now-services/:storeId
 * Create a new service.
 */
router.post('/:storeId', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const { name, description, price, duration, category, staff, images, beforeAfter, isActive, sortOrder } = req.body;

    if (!await verifyStoreOwnership(storeId, req.merchantId!)) {
      res.status(404).json({ success: false, message: 'Store not found or access denied' });
      return;
    }

    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ success: false, message: 'name is required' });
      return;
    }

    if (typeof price !== 'number' || price < 0) {
      res.status(400).json({ success: false, message: 'price must be a non-negative number' });
      return;
    }

    if (!duration || typeof duration !== 'number' || duration < 1) {
      res.status(400).json({ success: false, message: 'duration must be a positive number (minutes)' });
      return;
    }

    if (!category || typeof category !== 'string' || !category.trim()) {
      res.status(400).json({ success: false, message: 'category is required' });
      return;
    }

    // Validate staff IDs if provided
    if (staff && Array.isArray(staff)) {
      for (const staffId of staff) {
        if (!mongoose.Types.ObjectId.isValid(staffId)) {
          res.status(400).json({ success: false, message: `Invalid staff ID: ${staffId}` });
          return;
        }
      }
    }

    const service = await Service.create({
      storeId: new mongoose.Types.ObjectId(storeId),
      name: name.trim(),
      description: description?.trim(),
      price,
      duration,
      category: category.trim(),
      staff: staff?.map((id: string) => new mongoose.Types.ObjectId(id)) || [],
      images: images || [],
      beforeAfter: beforeAfter || [],
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
    });

    res.status(201).json({ success: true, data: service });
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(400).json({ success: false, message: msg });
  }
});

/**
 * GET /rez-now-services/:storeId/:serviceId
 * Get a specific service.
 */
router.get('/:storeId/:serviceId', async (req: Request, res: Response) => {
  try {
    const { storeId, serviceId } = req.params;

    if (!await verifyStoreOwnership(storeId, req.merchantId!)) {
      res.status(404).json({ success: false, message: 'Store not found or access denied' });
      return;
    }

    const service = await Service.findOne({
      _id: new mongoose.Types.ObjectId(serviceId),
      storeId: new mongoose.Types.ObjectId(storeId),
    }).lean();

    if (!service) {
      res.status(404).json({ success: false, message: 'Service not found' });
      return;
    }

    res.json({ success: true, data: service });
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * PUT /rez-now-services/:storeId/:serviceId
 * Update a service.
 */
router.put('/:storeId/:serviceId', async (req: Request, res: Response) => {
  try {
    const { storeId, serviceId } = req.params;
    const updates = req.body;

    if (!await verifyStoreOwnership(storeId, req.merchantId!)) {
      res.status(404).json({ success: false, message: 'Store not found or access denied' });
      return;
    }

    // Build allowed updates
    const allowedUpdates: unknown = {};
    if (updates.name !== undefined) allowedUpdates.name = updates.name.trim();
    if (updates.description !== undefined) allowedUpdates.description = updates.description?.trim() || '';
    if (updates.price !== undefined) {
      if (typeof updates.price !== 'number' || updates.price < 0) {
        res.status(400).json({ success: false, message: 'price must be a non-negative number' });
        return;
      }
      allowedUpdates.price = updates.price;
    }
    if (updates.duration !== undefined) {
      if (typeof updates.duration !== 'number' || updates.duration < 1) {
        res.status(400).json({ success: false, message: 'duration must be a positive number' });
        return;
      }
      allowedUpdates.duration = updates.duration;
    }
    if (updates.category !== undefined) allowedUpdates.category = updates.category.trim();
    if (updates.images !== undefined) allowedUpdates.images = updates.images;
    if (updates.beforeAfter !== undefined) allowedUpdates.beforeAfter = updates.beforeAfter;
    if (updates.isActive !== undefined) allowedUpdates.isActive = Boolean(updates.isActive);
    if (typeof updates.sortOrder === 'number') allowedUpdates.sortOrder = updates.sortOrder;
    if (updates.staff !== undefined) {
      if (!Array.isArray(updates.staff)) {
        res.status(400).json({ success: false, message: 'staff must be an array' });
        return;
      }
      allowedUpdates.staff = updates.staff.map((id: string) => new mongoose.Types.ObjectId(id));
    }

    const service = await Service.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(serviceId), storeId: new mongoose.Types.ObjectId(storeId) },
      { $set: allowedUpdates },
      { new: true },
    );

    if (!service) {
      res.status(404).json({ success: false, message: 'Service not found' });
      return;
    }

    res.json({ success: true, data: service });
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(400).json({ success: false, message: msg });
  }
});

/**
 * DELETE /rez-now-services/:storeId/:serviceId
 * Delete a service (soft delete by setting isActive = false).
 */
router.delete('/:storeId/:serviceId', async (req: Request, res: Response) => {
  try {
    const { storeId, serviceId } = req.params;

    if (!await verifyStoreOwnership(storeId, req.merchantId!)) {
      res.status(404).json({ success: false, message: 'Store not found or access denied' });
      return;
    }

    const service = await Service.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(serviceId), storeId: new mongoose.Types.ObjectId(storeId) },
      { $set: { isActive: false } },
      { new: true },
    );

    if (!service) {
      res.status(404).json({ success: false, message: 'Service not found' });
      return;
    }

    res.json({ success: true, message: 'Service deleted' });
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// ============== APPOINTMENTS ==============

/**
 * GET /rez-now-services/appointments/:storeId
 * List appointments for a store.
 */
router.get('/appointments/:storeId', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const { status, staffId, startDate, endDate, limit = 50, skip = 0 } = req.query;

    if (!await verifyStoreOwnership(storeId, req.merchantId!)) {
      res.status(404).json({ success: false, message: 'Store not found or access denied' });
      return;
    }

    const filter: unknown = { storeId: new mongoose.Types.ObjectId(storeId) };
    if (status) filter.status = status;
    if (staffId && mongoose.Types.ObjectId.isValid(staffId as string)) {
      filter.staffId = new mongoose.Types.ObjectId(staffId as string);
    }
    if (startDate || endDate) {
      filter.dateTime = {};
      if (startDate) filter.dateTime.$gte = new Date(startDate as string);
      if (endDate) filter.dateTime.$lte = new Date(endDate as string);
    }

    const appointments = await Appointment.find(filter)
      .sort({ dateTime: 1 })
      .skip(parseInt(skip as string) || 0)
      .limit(Math.min(parseInt(limit as string) || 50, 100))
      .populate('serviceId', 'name price duration')
      .populate('staffId', 'name')
      .populate('customerId', 'name phone email')
      .lean();

    res.json({ success: true, data: appointments });
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * POST /rez-now-services/appointments
 * Create an appointment.
 */
router.post('/appointments', async (req: Request, res: Response) => {
  try {
    const { serviceId, storeId, staffId, customerId, dateTime, notes, customerName, customerPhone } = req.body;

    if (!serviceId || !storeId || !staffId || !customerId || !dateTime) {
      res.status(400).json({ success: false, message: 'serviceId, storeId, staffId, customerId, and dateTime are required' });
      return;
    }

    if (!await verifyStoreOwnership(storeId, req.merchantId!)) {
      res.status(404).json({ success: false, message: 'Store not found or access denied' });
      return;
    }

    // Validate service exists
    const service = await Service.findOne({
      _id: new mongoose.Types.ObjectId(serviceId),
      storeId: new mongoose.Types.ObjectId(storeId),
      isActive: true,
    });
    if (!service) {
      res.status(404).json({ success: false, message: 'Service not found or inactive' });
      return;
    }

    // Calculate end time
    const startDateTime = new Date(dateTime);
    const endDateTime = new Date(startDateTime.getTime() + service.duration * 60000);

    // Check for conflicts
    const conflict = await Appointment.findOne({
      staffId: new mongoose.Types.ObjectId(staffId),
      status: { $in: ['pending', 'confirmed'] },
      $or: [
        { dateTime: { $lt: endDateTime }, endTime: { $gt: startDateTime } },
      ],
    });
    if (conflict) {
      res.status(409).json({ success: false, message: 'Time slot conflicts with an existing appointment' });
      return;
    }

    const appointment = await Appointment.create({
      serviceId: new mongoose.Types.ObjectId(serviceId),
      storeId: new mongoose.Types.ObjectId(storeId),
      staffId: new mongoose.Types.ObjectId(staffId),
      customerId: new mongoose.Types.ObjectId(customerId),
      dateTime: startDateTime,
      endTime: endDateTime,
      status: 'pending',
      notes,
      customerName,
      customerPhone,
    });

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('serviceId', 'name price duration')
      .populate('staffId', 'name')
      .lean();

    res.status(201).json({ success: true, data: populatedAppointment });
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(400).json({ success: false, message: msg });
  }
});

/**
 * GET /rez-now-services/appointments/:appointmentId
 * Get appointment details.
 */
router.get('/appointments/:appointmentId', async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findById(appointmentId)
      .populate('serviceId', 'name price duration category')
      .populate('staffId', 'name phone')
      .populate('customerId', 'name phone email')
      .lean();

    if (!appointment) {
      res.status(404).json({ success: false, message: 'Appointment not found' });
      return;
    }

    if (!await verifyStoreOwnership(appointment.storeId.toString(), req.merchantId!)) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    res.json({ success: true, data: appointment });
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * PATCH /rez-now-services/appointments/:appointmentId
 * Update appointment status.
 */
router.patch('/appointments/:appointmentId', async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;
    const { status, dateTime, notes } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      res.status(404).json({ success: false, message: 'Appointment not found' });
      return;
    }

    if (!await verifyStoreOwnership(appointment.storeId.toString(), req.merchantId!)) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    if (status) {
      if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
        res.status(400).json({ success: false, message: 'Invalid status' });
        return;
      }
      appointment.status = status;
    }

    if (dateTime) {
      const service = await Service.findById(appointment.serviceId);
      if (service) {
        appointment.dateTime = new Date(dateTime);
        appointment.endTime = new Date(appointment.dateTime.getTime() + service.duration * 60000);
      }
    }

    if (notes !== undefined) appointment.notes = notes;

    await appointment.save();

    const updated = await Appointment.findById(appointment._id)
      .populate('serviceId', 'name price duration')
      .populate('staffId', 'name')
      .populate('customerId', 'name phone')
      .lean();

    res.json({ success: true, data: updated });
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * DELETE /rez-now-services/appointments/:appointmentId
 * Cancel an appointment.
 */
router.delete('/appointments/:appointmentId', async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      res.status(404).json({ success: false, message: 'Appointment not found' });
      return;
    }

    if (!await verifyStoreOwnership(appointment.storeId.toString(), req.merchantId!)) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    appointment.status = 'cancelled';
    await appointment.save();

    res.json({ success: true, message: 'Appointment cancelled' });
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

export default router;

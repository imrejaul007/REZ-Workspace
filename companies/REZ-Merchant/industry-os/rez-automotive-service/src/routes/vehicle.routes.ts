import { Router, Request, Response } from 'express';
import { VehicleModel } from '../models/Vehicle';
import { CreateVehicleSchema, UpdateVehicleSchema } from '../types';
import { ZodError } from 'zod';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const customerId = req.query.customerId as string;
    const make = req.query.make as string;
    const type = req.query.type as string;
    const status = req.query.status as string;

    const query: Record<string, unknown> = {};
    if (customerId) query.customerId = customerId;
    if (make) query.make = make;
    if (type) query.type = type;
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const [vehicles, total] = await Promise.all([
      VehicleModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      VehicleModel.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: vehicles,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

router.get('/customer/:customerId', async (req: Request, res: Response) => {
  try {
    const vehicles = await VehicleModel.findByCustomer(req.params.customerId);
    res.json({ success: true, data: vehicles });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

router.get('/expiring-insurance', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const vehicles = await VehicleModel.findExpiringInsurance(days);
    res.json({ success: true, data: vehicles });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const vehicle = await VehicleModel.findById(req.params.id);
    if (!vehicle) {
      res.status(404).json({ success: false, error: 'Vehicle not found' });
      return;
    }
    res.json({ success: true, data: vehicle });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const data = await CreateVehicleSchema.parseAsync(req.body);
    if (data.insuranceExpiry) data.insuranceExpiry = new Date(data.insuranceExpiry).toISOString();
    if (data.pollutionCertExpiry) data.pollutionCertExpiry = new Date(data.pollutionCertExpiry).toISOString();
    const vehicle = new VehicleModel(data);
    await vehicle.save();
    res.status(201).json({
      success: true,
      data: vehicle,
      message: 'Vehicle registered successfully'
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ success: false, error: 'Validation failed', details: error.errors });
      return;
    }
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const vehicle = await VehicleModel.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!vehicle) {
      res.status(404).json({ success: false, error: 'Vehicle not found' });
      return;
    }
    res.json({ success: true, data: vehicle, message: 'Vehicle updated' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const vehicle = await VehicleModel.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'inactive' } },
      { new: true }
    );
    if (!vehicle) {
      res.status(404).json({ success: false, error: 'Vehicle not found' });
      return;
    }
    res.json({ success: true, message: 'Vehicle deactivated' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

export default router;

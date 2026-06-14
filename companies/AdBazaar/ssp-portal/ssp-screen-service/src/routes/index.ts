import { Router, Request, Response, NextFunction } from 'express';
import { Screen, CreateScreenSchema, UpdateScreenSchema, UpdateStatusSchema, AvailabilityQuerySchema, isTimeSlotAvailable } from '../models';
import { ZodError } from 'zod';

const router = Router();

// Validation error handler
const validateRequest = (schema: typeof CreateScreenSchema | typeof UpdateScreenSchema | typeof UpdateStatusSchema | typeof AvailabilityQuerySchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const data = req.method === 'POST' || req.method === 'PUT'
        ? schema.parse(req.body)
        : req.method === 'GET' && req.path.includes('availability')
          ? AvailabilityQuerySchema.parse(req.query)
          : req.method === 'PATCH' && req.path.endsWith('status')
            ? schema.parse(req.body)
            : schema.parse(req.query);

      if (req.method === 'POST' || req.method === 'PUT') {
        req.body = data;
      } else if (req.method === 'PATCH' && req.path.endsWith('status')) {
        req.body = data;
      } else if (req.method === 'GET' && req.path.includes('availability')) {
        (req as Request & { validatedQuery: unknown }).validatedQuery = data;
      } else {
        req.query = data as Record<string, string>;
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
};

// Error handler wrapper
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// POST / - Create a new screen
router.post(
  '/',
  validateRequest(CreateScreenSchema) as unknown as (req: Request, res: Response, next: NextFunction) => void,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const screenData = req.body;

    // Check if screenId already exists
    const existingScreen = await Screen.findOne({ screenId: screenData.screenId });
    if (existingScreen) {
      res.status(409).json({
        success: false,
        error: 'Screen with this ID already exists',
        screenId: screenData.screenId,
      });
      return;
    }

    const screen = new Screen(screenData);
    await screen.save();

    res.status(201).json({
      success: true,
      message: 'Screen created successfully',
      data: screen,
    });
  })
);

// GET / - List all screens with optional filters
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { page = '1', limit = '50', status, screenType, minRate, maxRate, city } = req.query;

    const query: Record<string, unknown> = {};

    if (status) {
      query.status = status;
    }
    if (screenType) {
      query.screenType = screenType;
    }
    if (minRate || maxRate) {
      query.hourlyRate = {};
      if (minRate) (query.hourlyRate as Record<string, number>).$gte = Number(minRate);
      if (maxRate) (query.hourlyRate as Record<string, number>).$lte = Number(maxRate);
    }
    if (city) {
      query['address.city'] = city;
    }

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [screens, total] = await Promise.all([
      Screen.find(query).skip(skip).limit(limitNum).sort({ createdAt: -1 }),
      Screen.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        screens,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  })
);

// GET /:id - Get screen by ID
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const screen = await Screen.findOne({ screenId: id });
    if (!screen) {
      res.status(404).json({
        success: false,
        error: 'Screen not found',
        screenId: id,
      });
      return;
    }

    res.json({
      success: true,
      data: screen,
    });
  })
);

// GET /location/:locationId - Get screens by location
router.get(
  '/location/:locationId',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { locationId } = req.params;

    const screens = await Screen.find({ locationId }).sort({ screenId: 1 });

    res.json({
      success: true,
      data: {
        locationId,
        count: screens.length,
        screens,
      },
    });
  })
);

// GET /type/:type - Get screens by type
router.get(
  '/type/:type',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { type } = req.params;
    const validTypes = ['led', 'lcd', 'projection', 'digital_billboard'];

    if (!validTypes.includes(type)) {
      res.status(400).json({
        success: false,
        error: 'Invalid screen type',
        validTypes,
      });
      return;
    }

    const screens = await Screen.find({ screenType: type }).sort({ hourlyRate: 1 });

    res.json({
      success: true,
      data: {
        screenType: type,
        count: screens.length,
        screens,
      },
    });
  })
);

// PATCH /:id - Update screen
router.patch(
  '/:id',
  validateRequest(UpdateScreenSchema) as unknown as (req: Request, res: Response, next: NextFunction) => void,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const updateData = req.body;

    const screen = await Screen.findOneAndUpdate(
      { screenId: id },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!screen) {
      res.status(404).json({
        success: false,
        error: 'Screen not found',
        screenId: id,
      });
      return;
    }

    res.json({
      success: true,
      message: 'Screen updated successfully',
      data: screen,
    });
  })
);

// PATCH /:id/status - Update screen status
router.patch(
  '/:id/status',
  validateRequest(UpdateStatusSchema) as unknown as (req: Request, res: Response, next: NextFunction) => void,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status } = req.body;

    const screen = await Screen.findOneAndUpdate(
      { screenId: id },
      { $set: { status } },
      { new: true, runValidators: true }
    );

    if (!screen) {
      res.status(404).json({
        success: false,
        error: 'Screen not found',
        screenId: id,
      });
      return;
    }

    res.json({
      success: true,
      message: 'Screen status updated successfully',
      data: {
        screenId: screen.screenId,
        status: screen.status,
      },
    });
  })
);

// DELETE /:id - Delete screen
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const result = await Screen.deleteOne({ screenId: id });

    if (result.deletedCount === 0) {
      res.status(404).json({
        success: false,
        error: 'Screen not found',
        screenId: id,
      });
      return;
    }

    res.json({
      success: true,
      message: 'Screen deleted successfully',
      screenId: id,
    });
  })
);

// GET /:id/availability - Check availability for time slot
router.get(
  '/:id/availability',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const validatedQuery = (req as Request & { validatedQuery?: unknown }).validatedQuery as AvailabilityQuery | undefined;
    const { date, startTime, endTime } = validatedQuery || {
      date: req.query.date as string,
      startTime: req.query.startTime as string,
      endTime: req.query.endTime as string,
    };

    if (!date || !startTime || !endTime) {
      res.status(400).json({
        success: false,
        error: 'Missing required query parameters',
        required: ['date', 'startTime', 'endTime'],
      });
      return;
    }

    const screen = await Screen.findOne({ screenId: id });
    if (!screen) {
      res.status(404).json({
        success: false,
        error: 'Screen not found',
        screenId: id,
      });
      return;
    }

    // Parse the date and get day of week
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      res.status(400).json({
        success: false,
        error: 'Invalid date format',
        format: 'YYYY-MM-DD',
      });
      return;
    }

    const dayOfWeek = dateObj.getDay();
    const available = isTimeSlotAvailable(
      screen.availableHours as Record<string, { start: string; end: string }>,
      dayOfWeek,
      startTime,
      endTime
    );

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];
    const daySchedule = screen.availableHours?.[dayName];

    res.json({
      success: true,
      data: {
        screenId: screen.screenId,
        requestedDate: date,
        dayOfWeek: dayName,
        requestedSlot: { startTime, endTime },
        isAvailable: available && screen.status === 'active',
        status: screen.status,
        schedule: daySchedule || null,
        hourlyRate: screen.hourlyRate,
      },
    });
  })
);

export default router;
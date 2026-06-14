/**
 * Attendance Routes - Fitness OS
 * Handles member check-in/check-out and attendance tracking
 * Route: /api/v1/merchant/attendance
 */

import { Router, Request, Response } from 'express';
import { merchantAuth } from '../middleware/auth';
import { AttendanceService } from '../services/attendanceService';
import { errorResponse, successResponse, errors } from '../utils/response';

const router = Router();
const attendanceService = new AttendanceService();

// POST /checkin - Check in a member
router.post('/checkin', merchantAuth, async (req: Request, res: Response) => {
  try {
    const { memberId, storeId, source } = req.body;

    if (!memberId || !storeId) {
      return errorResponse(res, errors.validationError({ message: 'memberId and storeId are required' }));
    }

    const attendance = await attendanceService.checkIn(memberId, storeId, source);
    return successResponse(res, attendance, 'Member checked in successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check in member';
    return errorResponse(res, errors.badRequest({ message }));
  }
});

// POST /checkout - Check out a member
router.post('/checkout', merchantAuth, async (req: Request, res: Response) => {
  try {
    const { memberId, storeId } = req.body;

    if (!memberId || !storeId) {
      return errorResponse(res, errors.validationError({ message: 'memberId and storeId are required' }));
    }

    await attendanceService.checkOut(memberId, storeId);
    return successResponse(res, null, 'Member checked out successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check out member';
    return errorResponse(res, errors.badRequest({ message }));
  }
});

// GET / - Get attendance for a store on a specific date
router.get('/', merchantAuth, async (req: Request, res: Response) => {
  try {
    const { storeId, date } = req.query;

    if (!storeId) {
      return errorResponse(res, errors.validationError({ message: 'storeId is required' }));
    }

    const targetDate = date ? new Date(date as string) : new Date();
    const attendance = await attendanceService.getAttendance(storeId as string, targetDate);

    return successResponse(res, attendance);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get attendance';
    return errorResponse(res, errors.internalError({ message }));
  }
});

// GET /member/:memberId - Get attendance history for a member
router.get('/member/:memberId', merchantAuth, async (req: Request, res: Response) => {
  try {
    const { memberId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return errorResponse(res, errors.validationError({ message: 'startDate and endDate are required' }));
    }

    const attendance = await attendanceService.getMemberAttendance(
      memberId,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    return successResponse(res, attendance);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get member attendance';
    return errorResponse(res, errors.internalError({ message }));
  }
});

// GET /class/:classId - Get attendance for a specific class
router.get('/class/:classId', merchantAuth, async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const { date } = req.query;

    const targetDate = date ? new Date(date as string) : new Date();
    const attendance = await attendanceService.getClassAttendance(classId, targetDate);

    return successResponse(res, attendance);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get class attendance';
    return errorResponse(res, errors.internalError({ message }));
  }
});

// GET /stats - Get attendance statistics
router.get('/stats', merchantAuth, async (req: Request, res: Response) => {
  try {
    const { storeId, month, year } = req.query;

    if (!storeId) {
      return errorResponse(res, errors.validationError({ message: 'storeId is required' }));
    }

    const now = new Date();
    const targetMonth = month ? parseInt(month as string, 10) : now.getMonth() + 1;
    const targetYear = year ? parseInt(year as string, 10) : now.getFullYear();

    const stats = await attendanceService.getAttendanceStats(
      storeId as string,
      targetMonth,
      targetYear
    );

    return successResponse(res, stats);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get attendance stats';
    return errorResponse(res, errors.internalError({ message }));
  }
});

// POST /no-show/:attendanceId - Mark as no-show
router.post('/no-show/:attendanceId', merchantAuth, async (req: Request, res: Response) => {
  try {
    const { attendanceId } = req.params;

    await attendanceService.markNoShow(attendanceId);
    return successResponse(res, null, 'Marked as no-show');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to mark as no-show';
    return errorResponse(res, errors.badRequest({ message }));
  }
});

export default router;

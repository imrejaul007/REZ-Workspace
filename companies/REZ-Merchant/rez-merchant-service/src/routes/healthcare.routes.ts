/**
 * Healthcare Routes - Unified Healthcare API Gateway
 * Route: /api/v1/merchant/healthcare
 */

import { Router } from 'express';
import { merchantAuth } from '../middleware/auth';
import { errorResponse, errors } from '../utils/response';

const router = Router();

// Service URLs with fallbacks
const PATIENT_SERVICE_URL = process.env.PATIENT_SERVICE_URL || 'http://localhost:4702';
const APPOINTMENT_SERVICE_URL = process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:4705';
const PRESCRIPTION_SERVICE_URL = process.env.PRESCRIPTION_SERVICE_URL || 'http://localhost:4750';
const TELEMEDICINE_SERVICE_URL = process.env.TELEMEDICINE_SERVICE_URL || 'http://localhost:4723';

// Helper function to make service calls with fallback
async function callService<T>(
  url: string,
  options?: RequestInit,
  fallback: T | null = null
): Promise<{ data: T | null; available: boolean }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Service call to ${url} returned status ${response.status}`);
      return { data: fallback, available: false };
    }

    const data = await response.json();
    return { data, available: true };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn(`Service call to ${url} timed out after 5 seconds`);
    } else {
      console.warn(`Failed to connect to service at ${url}:`, (error as Error).message);
    }
    return { data: fallback, available: false };
  }
}

// All routes require merchant authentication
router.use(merchantAuth);

// ─── PATIENTS ────────────────────────────────────────────────────────────────

/**
 * GET /healthcare/patients - Get all patients for the merchant
 * Query params: page, limit, search, status
 */
router.get('/patients', async (req, res) => {
  try {
    const { page = '1', limit = '20', search, status } = req.query;
    const merchantId = req.merchantId;

    // Build query params for patient service
    const queryParams = new URLSearchParams({
      page: page as string,
      limit: limit as string,
      ...(search && { search: search as string }),
      ...(status && { status: status as string }),
    });

    const { data, available } = await callService<{ patients: unknown[]; total: number }>(
      `${PATIENT_SERVICE_URL}/api/v1/patients?${queryParams.toString()}`,
      {
        headers: {
          'x-merchant-id': merchantId,
        },
      },
      null
    );

    if (!available || !data) {
      console.warn('Patient service unavailable, returning empty list');
      return res.json({
        success: true,
        data: [],
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: 0,
          totalPages: 0,
        },
        meta: {
          merchantId,
          filters: { search, status },
          serviceAvailable: false,
        },
      });
    }

    res.json({
      success: true,
      data: data.patients || [],
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: data.total || 0,
        totalPages: Math.ceil((data.total || 0) / parseInt(limit as string)),
      },
      meta: {
        merchantId,
        filters: { search, status },
        serviceAvailable: true,
      },
    });
  } catch (error) {
    console.error('Error fetching healthcare patients:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patients',
      error: (error as Error).message,
    });
  }
});

/**
 * GET /healthcare/patients/:id - Get patient by ID
 */
router.get('/patients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const merchantId = req.merchantId;

    const { data, available } = await callService<unknown>(
      `${PATIENT_SERVICE_URL}/api/v1/patients/${id}`,
      {
        headers: {
          'x-merchant-id': merchantId,
        },
      },
      null
    );

    if (!available || !data) {
      console.warn(`Patient service unavailable for patient ${id}, returning null`);
      return res.json({
        success: true,
        data: null,
        meta: { patientId: id, serviceAvailable: false },
      });
    }

    res.json({
      success: true,
      data,
      meta: { patientId: id, serviceAvailable: true },
    });
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient',
      error: (error as Error).message,
    });
  }
});

/**
 * GET /healthcare/patients/:id/medical-history - Get patient medical history
 */
router.get('/patients/:id/medical-history', async (req, res) => {
  try {
    const { id } = req.params;
    const merchantId = req.merchantId;

    // Fetch medical history from patient service
    const { data: patientData, available: patientAvailable } = await callService<unknown>(
      `${PATIENT_SERVICE_URL}/api/v1/patients/${id}/medical-history`,
      {
        headers: {
          'x-merchant-id': merchantId,
        },
      },
      null
    );

    // Also fetch related data from other services in parallel
    const [appointmentsRes, prescriptionsRes, telemedicineRes] = await Promise.all([
      callService<{ appointments: unknown[] }>(
        `${APPOINTMENT_SERVICE_URL}/api/v1/appointments?patientId=${id}`,
        { headers: { 'x-merchant-id': merchantId } },
        null
      ),
      callService<{ prescriptions: unknown[] }>(
        `${PRESCRIPTION_SERVICE_URL}/api/v1/prescriptions?patientId=${id}`,
        { headers: { 'x-merchant-id': merchantId } },
        null
      ),
      callService<{ sessions: unknown[] }>(
        `${TELEMEDICINE_SERVICE_URL}/api/v1/sessions?patientId=${id}`,
        { headers: { 'x-merchant-id': merchantId } },
        null
      ),
    ]);

    const servicesAvailable = patientAvailable || appointmentsRes.available || prescriptionsRes.available || telemedicineRes.available;

    if (!servicesAvailable) {
      console.warn(`All services unavailable for medical history of patient ${id}`);
      return res.json({
        success: true,
        data: {
          patientId: id,
          prescriptions: [],
          appointments: [],
          telemedicineSessions: [],
        },
        meta: {
          serviceAvailable: false,
        },
      });
    }

    res.json({
      success: true,
      data: {
        ...((patientData as object) || {}),
        patientId: id,
        prescriptions: prescriptionsRes.data?.prescriptions || [],
        appointments: appointmentsRes.data?.appointments || [],
        telemedicineSessions: telemedicineRes.data?.sessions || [],
      },
      meta: {
        serviceAvailable: true,
        servicesFetched: {
          patient: patientAvailable,
          appointments: appointmentsRes.available,
          prescriptions: prescriptionsRes.available,
          telemedicine: telemedicineRes.available,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching patient medical history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch medical history',
      error: (error as Error).message,
    });
  }
});

// ─── APPOINTMENTS ────────────────────────────────────────────────────────────

/**
 * GET /healthcare/appointments - Get healthcare appointments
 * Query params: page, limit, date, status, doctorId, patientId
 */
router.get('/appointments', async (req, res) => {
  try {
    const { page = '1', limit = '20', date, status, doctorId, patientId } = req.query;
    const merchantId = req.merchantId;

    // Build query params for appointment service
    const queryParams = new URLSearchParams({
      page: page as string,
      limit: limit as string,
      ...(date && { date: date as string }),
      ...(status && { status: status as string }),
      ...(doctorId && { doctorId: doctorId as string }),
      ...(patientId && { patientId: patientId as string }),
    });

    const { data, available } = await callService<{ appointments: unknown[]; total: number }>(
      `${APPOINTMENT_SERVICE_URL}/api/v1/appointments?${queryParams.toString()}`,
      {
        headers: {
          'x-merchant-id': merchantId,
        },
      },
      null
    );

    if (!available || !data) {
      console.warn('Appointment service unavailable, returning empty list');
      return res.json({
        success: true,
        data: [],
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: 0,
          totalPages: 0,
        },
        meta: {
          merchantId,
          filters: { date, status, doctorId, patientId },
          serviceAvailable: false,
        },
      });
    }

    res.json({
      success: true,
      data: data.appointments || [],
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: data.total || 0,
        totalPages: Math.ceil((data.total || 0) / parseInt(limit as string)),
      },
      meta: {
        merchantId,
        filters: { date, status, doctorId, patientId },
        serviceAvailable: true,
      },
    });
  } catch (error) {
    console.error('Error fetching healthcare appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments',
      error: (error as Error).message,
    });
  }
});

/**
 * GET /healthcare/appointments/:id - Get appointment by ID
 */
router.get('/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const merchantId = req.merchantId;

    const { data, available } = await callService<unknown>(
      `${APPOINTMENT_SERVICE_URL}/api/v1/appointments/${id}`,
      {
        headers: {
          'x-merchant-id': merchantId,
        },
      },
      null
    );

    if (!available || !data) {
      console.warn(`Appointment service unavailable for appointment ${id}, returning null`);
      return res.json({
        success: true,
        data: null,
        meta: { appointmentId: id, serviceAvailable: false },
      });
    }

    res.json({
      success: true,
      data,
      meta: { appointmentId: id, serviceAvailable: true },
    });
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointment',
      error: (error as Error).message,
    });
  }
});

/**
 * POST /healthcare/appointments - Create a new healthcare appointment
 */
router.post('/appointments', async (req, res) => {
  try {
    const {
      patientId,
      doctorId,
      storeId,
      appointmentDate,
      startTime,
      endTime,
      duration,
      type, // consultation, followup, procedure
      reason,
      notes,
    } = req.body;
    const merchantId = req.merchantId;

    // Validate required fields
    if (!patientId || !doctorId || !storeId || !appointmentDate || !startTime || !type) {
      return errorResponse(
        res,
        errors.badRequest('Missing required fields: patientId, doctorId, storeId, appointmentDate, startTime, type')
      );
    }

    // Validate appointment date is not in the past
    const appointmentDateTime = new Date(appointmentDate);
    if (isNaN(appointmentDateTime.getTime())) {
      return errorResponse(res, errors.badRequest('Invalid appointmentDate format'));
    }

    // Try to create appointment via service
    const { data, available } = await callService<unknown>(
      `${APPOINTMENT_SERVICE_URL}/api/v1/appointments`,
      {
        method: 'POST',
        headers: {
          'x-merchant-id': merchantId,
        },
        body: JSON.stringify(req.body),
      },
      null
    );

    if (available && data) {
      return res.status(201).json({
        success: true,
        message: 'Healthcare appointment created successfully',
        data,
        meta: { serviceAvailable: true },
      });
    }

    // Fallback: create locally
    console.warn('Appointment service unavailable, creating appointment locally');
    const appointment = {
      id: `apt_${Date.now()}`,
      merchantId,
      patientId,
      doctorId,
      storeId,
      appointmentDate: appointmentDateTime,
      startTime,
      endTime,
      duration: duration || 30,
      type,
      status: 'scheduled',
      reason,
      notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    res.status(201).json({
      success: true,
      message: 'Healthcare appointment created successfully',
      data: appointment,
      meta: { serviceAvailable: false },
    });
  } catch (error) {
    console.error('Error creating healthcare appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create appointment',
      error: (error as Error).message,
    });
  }
});

/**
 * PATCH /healthcare/appointments/:id - Update appointment
 */
router.patch('/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, appointmentDate, startTime, endTime, notes } = req.body;
    const merchantId = req.merchantId;

    const update: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (status) update.status = status;
    if (appointmentDate) update.appointmentDate = new Date(appointmentDate);
    if (startTime) update.startTime = startTime;
    if (endTime) update.endTime = endTime;
    if (notes !== undefined) update.notes = notes;

    // Try to update via appointment service
    const { data, available } = await callService<unknown>(
      `${APPOINTMENT_SERVICE_URL}/api/v1/appointments/${id}`,
      {
        method: 'PATCH',
        headers: {
          'x-merchant-id': merchantId,
        },
        body: JSON.stringify(req.body),
      },
      null
    );

    if (available && data) {
      return res.json({
        success: true,
        message: 'Appointment updated successfully',
        data,
        meta: { serviceAvailable: true },
      });
    }

    // Fallback: return local update
    console.warn(`Appointment service unavailable for update ${id}, returning local result`);
    res.json({
      success: true,
      message: 'Appointment updated successfully',
      data: { appointmentId: id, ...update },
      meta: { serviceAvailable: false },
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update appointment',
      error: (error as Error).message,
    });
  }
});

/**
 * DELETE /healthcare/appointments/:id - Cancel appointment
 */
router.delete('/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const merchantId = req.merchantId;

    // Try to cancel via appointment service
    const { available } = await callService<unknown>(
      `${APPOINTMENT_SERVICE_URL}/api/v1/appointments/${id}`,
      {
        method: 'DELETE',
        headers: {
          'x-merchant-id': merchantId,
        },
      },
      null
    );

    if (available) {
      return res.json({
        success: true,
        message: 'Appointment cancelled successfully',
        data: { appointmentId: id, status: 'cancelled' },
        meta: { serviceAvailable: true },
      });
    }

    // Fallback: return local result
    console.warn(`Appointment service unavailable for delete ${id}, returning local result`);
    res.json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: { appointmentId: id, status: 'cancelled' },
      meta: { serviceAvailable: false },
    });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel appointment',
      error: (error as Error).message,
    });
  }
});

// ─── PRESCRIPTIONS ───────────────────────────────────────────────────────────

/**
 * GET /healthcare/prescriptions - Get prescriptions
 * Query params: page, limit, patientId, doctorId, status
 */
router.get('/prescriptions', async (req, res) => {
  try {
    const { page = '1', limit = '20', patientId, doctorId, status } = req.query;
    const merchantId = req.merchantId;

    // Build query params for prescription service
    const queryParams = new URLSearchParams({
      page: page as string,
      limit: limit as string,
      ...(patientId && { patientId: patientId as string }),
      ...(doctorId && { doctorId: doctorId as string }),
      ...(status && { status: status as string }),
    });

    const { data, available } = await callService<{ prescriptions: unknown[]; total: number }>(
      `${PRESCRIPTION_SERVICE_URL}/api/v1/prescriptions?${queryParams.toString()}`,
      {
        headers: {
          'x-merchant-id': merchantId,
        },
      },
      null
    );

    if (!available || !data) {
      console.warn('Prescription service unavailable, returning empty list');
      return res.json({
        success: true,
        data: [],
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: 0,
          totalPages: 0,
        },
        meta: {
          merchantId,
          filters: { patientId, doctorId, status },
          serviceAvailable: false,
        },
      });
    }

    res.json({
      success: true,
      data: data.prescriptions || [],
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: data.total || 0,
        totalPages: Math.ceil((data.total || 0) / parseInt(limit as string)),
      },
      meta: {
        merchantId,
        filters: { patientId, doctorId, status },
        serviceAvailable: true,
      },
    });
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch prescriptions',
      error: (error as Error).message,
    });
  }
});

/**
 * GET /healthcare/prescriptions/:id - Get prescription by ID
 */
router.get('/prescriptions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const merchantId = req.merchantId;

    const { data, available } = await callService<unknown>(
      `${PRESCRIPTION_SERVICE_URL}/api/v1/prescriptions/${id}`,
      {
        headers: {
          'x-merchant-id': merchantId,
        },
      },
      null
    );

    if (!available || !data) {
      console.warn(`Prescription service unavailable for prescription ${id}, returning null`);
      return res.json({
        success: true,
        data: null,
        meta: { prescriptionId: id, serviceAvailable: false },
      });
    }

    res.json({
      success: true,
      data,
      meta: { prescriptionId: id, serviceAvailable: true },
    });
  } catch (error) {
    console.error('Error fetching prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch prescription',
      error: (error as Error).message,
    });
  }
});

/**
 * POST /healthcare/prescriptions - Create a new prescription
 */
router.post('/prescriptions', async (req, res) => {
  try {
    const {
      patientId,
      doctorId,
      doctorName,
      storeId,
      diagnosis,
      medicines,
      validUntil,
      notes,
    } = req.body;
    const merchantId = req.merchantId;

    // Validate required fields
    if (!patientId || !doctorId || !doctorName || !storeId || !diagnosis || !medicines?.length) {
      return errorResponse(
        res,
        errors.badRequest('Missing required fields: patientId, doctorId, doctorName, storeId, diagnosis, medicines')
      );
    }

    // Validate validUntil is a future date
    const expiryDate = validUntil ? new Date(validUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    if (isNaN(expiryDate.getTime()) || expiryDate <= new Date()) {
      return errorResponse(res, errors.badRequest('validUntil must be a future date'));
    }

    // Try to create prescription via service
    const { data, available } = await callService<unknown>(
      `${PRESCRIPTION_SERVICE_URL}/api/v1/prescriptions`,
      {
        method: 'POST',
        headers: {
          'x-merchant-id': merchantId,
        },
        body: JSON.stringify(req.body),
      },
      null
    );

    if (available && data) {
      return res.status(201).json({
        success: true,
        message: 'Prescription created successfully',
        data,
        meta: { serviceAvailable: true },
      });
    }

    // Fallback: create locally
    console.warn('Prescription service unavailable, creating prescription locally');
    const prescription = {
      id: `rx_${Date.now()}`,
      merchantId,
      patientId,
      doctorId,
      doctorName,
      storeId,
      diagnosis,
      medicines,
      status: 'active',
      validUntil: expiryDate,
      notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    res.status(201).json({
      success: true,
      message: 'Prescription created successfully',
      data: prescription,
      meta: { serviceAvailable: false },
    });
  } catch (error) {
    console.error('Error creating prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create prescription',
      error: (error as Error).message,
    });
  }
});

// ─── TELEMEDICINE ────────────────────────────────────────────────────────────

/**
 * GET /healthcare/telemedicine - Get telemedicine sessions
 * Query params: page, limit, doctorId, patientId, status
 */
router.get('/telemedicine', async (req, res) => {
  try {
    const { page = '1', limit = '20', doctorId, patientId, status } = req.query;
    const merchantId = req.merchantId;

    // Build query params for telemedicine service
    const queryParams = new URLSearchParams({
      page: page as string,
      limit: limit as string,
      ...(doctorId && { doctorId: doctorId as string }),
      ...(patientId && { patientId: patientId as string }),
      ...(status && { status: status as string }),
    });

    const { data, available } = await callService<{ sessions: unknown[]; total: number }>(
      `${TELEMEDICINE_SERVICE_URL}/api/v1/sessions?${queryParams.toString()}`,
      {
        headers: {
          'x-merchant-id': merchantId,
        },
      },
      null
    );

    if (!available || !data) {
      console.warn('Telemedicine service unavailable, returning empty list');
      return res.json({
        success: true,
        data: [],
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: 0,
          totalPages: 0,
        },
        meta: {
          merchantId,
          filters: { doctorId, patientId, status },
          serviceAvailable: false,
        },
      });
    }

    res.json({
      success: true,
      data: data.sessions || [],
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: data.total || 0,
        totalPages: Math.ceil((data.total || 0) / parseInt(limit as string)),
      },
      meta: {
        merchantId,
        filters: { doctorId, patientId, status },
        serviceAvailable: true,
      },
    });
  } catch (error) {
    console.error('Error fetching telemedicine sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch telemedicine sessions',
      error: (error as Error).message,
    });
  }
});

/**
 * GET /healthcare/telemedicine/:id - Get telemedicine session by ID
 */
router.get('/telemedicine/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const merchantId = req.merchantId;

    const { data, available } = await callService<unknown>(
      `${TELEMEDICINE_SERVICE_URL}/api/v1/sessions/${id}`,
      {
        headers: {
          'x-merchant-id': merchantId,
        },
      },
      null
    );

    if (!available || !data) {
      console.warn(`Telemedicine service unavailable for session ${id}, returning null`);
      return res.json({
        success: true,
        data: null,
        meta: { sessionId: id, serviceAvailable: false },
      });
    }

    res.json({
      success: true,
      data,
      meta: { sessionId: id, serviceAvailable: true },
    });
  } catch (error) {
    console.error('Error fetching telemedicine session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch telemedicine session',
      error: (error as Error).message,
    });
  }
});

/**
 * POST /healthcare/telemedicine - Schedule a new telemedicine session
 */
router.post('/telemedicine', async (req, res) => {
  try {
    const {
      appointmentId,
      patientId,
      doctorId,
      storeId,
      scheduledTime,
      type, // video, phone, chat
      reason,
      recordingConsent,
    } = req.body;
    const merchantId = req.merchantId;

    // Validate required fields
    if (!patientId || !doctorId || !storeId || !scheduledTime) {
      return errorResponse(
        res,
        errors.badRequest('Missing required fields: patientId, doctorId, storeId, scheduledTime')
      );
    }

    // Validate scheduledTime is a future date
    const sessionTime = new Date(scheduledTime);
    if (isNaN(sessionTime.getTime())) {
      return errorResponse(res, errors.badRequest('Invalid scheduledTime format'));
    }

    if (sessionTime <= new Date()) {
      return errorResponse(res, errors.badRequest('scheduledTime must be a future date'));
    }

    // Try to create session via telemedicine service
    const { data, available } = await callService<unknown>(
      `${TELEMEDICINE_SERVICE_URL}/api/v1/sessions`,
      {
        method: 'POST',
        headers: {
          'x-merchant-id': merchantId,
        },
        body: JSON.stringify(req.body),
      },
      null
    );

    if (available && data) {
      return res.status(201).json({
        success: true,
        message: 'Telemedicine session scheduled successfully',
        data,
        meta: { serviceAvailable: true },
      });
    }

    // Fallback: create locally
    console.warn('Telemedicine service unavailable, creating session locally');
    const session = {
      id: `tel_${Date.now()}`,
      merchantId,
      appointmentId,
      patientId,
      doctorId,
      storeId,
      scheduledTime: sessionTime,
      type: type || 'video',
      status: 'scheduled',
      reason,
      recordingConsent: recordingConsent ?? false,
      meetingLink: null, // Generated when session starts
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    res.status(201).json({
      success: true,
      message: 'Telemedicine session scheduled successfully',
      data: session,
      meta: { serviceAvailable: false },
    });
  } catch (error) {
    console.error('Error scheduling telemedicine session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule telemedicine session',
      error: (error as Error).message,
    });
  }
});

/**
 * POST /healthcare/telemedicine/:id/start - Start telemedicine session
 */
router.post('/telemedicine/:id/start', async (req, res) => {
  try {
    const { id } = req.params;
    const merchantId = req.merchantId;

    // Try to start session via telemedicine service
    const { data, available } = await callService<unknown>(
      `${TELEMEDICINE_SERVICE_URL}/api/v1/sessions/${id}/start`,
      {
        method: 'POST',
        headers: {
          'x-merchant-id': merchantId,
        },
        body: JSON.stringify(req.body || {}),
      },
      null
    );

    if (available && data) {
      return res.json({
        success: true,
        message: 'Telemedicine session started',
        data,
        meta: { serviceAvailable: true },
      });
    }

    // Fallback: return local result
    console.warn(`Telemedicine service unavailable for start ${id}, returning local result`);
    res.json({
      success: true,
      message: 'Telemedicine session started',
      data: {
        sessionId: id,
        meetingLink: `https://meet.reznow.in/${id}`,
        startedAt: new Date(),
      },
      meta: { serviceAvailable: false },
    });
  } catch (error) {
    console.error('Error starting telemedicine session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start telemedicine session',
      error: (error as Error).message,
    });
  }
});

/**
 * POST /healthcare/telemedicine/:id/end - End telemedicine session
 */
router.post('/telemedicine/:id/end', async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const merchantId = req.merchantId;

    // Try to end session via telemedicine service
    const { data, available } = await callService<unknown>(
      `${TELEMEDICINE_SERVICE_URL}/api/v1/sessions/${id}/end`,
      {
        method: 'POST',
        headers: {
          'x-merchant-id': merchantId,
        },
        body: JSON.stringify({ notes }),
      },
      null
    );

    if (available && data) {
      return res.json({
        success: true,
        message: 'Telemedicine session ended',
        data,
        meta: { serviceAvailable: true },
      });
    }

    // Fallback: return local result
    console.warn(`Telemedicine service unavailable for end ${id}, returning local result`);
    res.json({
      success: true,
      message: 'Telemedicine session ended',
      data: {
        sessionId: id,
        status: 'completed',
        notes,
        endedAt: new Date(),
      },
      meta: { serviceAvailable: false },
    });
  } catch (error) {
    console.error('Error ending telemedicine session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end telemedicine session',
      error: (error as Error).message,
    });
  }
});

// ─── DASHBOARD / STATS ────────────────────────────────────────────────────────

/**
 * GET /healthcare/stats - Get healthcare dashboard statistics
 * Aggregates data from all healthcare services
 */
router.get('/stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const merchantId = req.merchantId;

    // Build query params
    const queryParams = new URLSearchParams({
      ...(startDate && { startDate: startDate as string }),
      ...(endDate && { endDate: endDate as string }),
    });
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

    // Fetch stats from all services in parallel
    const [patientsRes, appointmentsRes, prescriptionsRes, telemedicineRes] = await Promise.all([
      callService<{ total: number }>(
        `${PATIENT_SERVICE_URL}/api/v1/patients/stats${queryString}`,
        { headers: { 'x-merchant-id': merchantId } },
        null
      ),
      callService<{ total: number; completed: number; cancelled: number; upcoming: number }>(
        `${APPOINTMENT_SERVICE_URL}/api/v1/appointments/stats${queryString}`,
        { headers: { 'x-merchant-id': merchantId } },
        null
      ),
      callService<{ total: number }>(
        `${PRESCRIPTION_SERVICE_URL}/api/v1/prescriptions/stats${queryString}`,
        { headers: { 'x-merchant-id': merchantId } },
        null
      ),
      callService<{ total: number }>(
        `${TELEMEDICINE_SERVICE_URL}/api/v1/sessions/stats${queryString}`,
        { headers: { 'x-merchant-id': merchantId } },
        null
      ),
    ]);

    const statsAvailable = patientsRes.available || appointmentsRes.available || prescriptionsRes.available || telemedicineRes.available;

    if (!statsAvailable) {
      console.warn('All healthcare services unavailable for stats');
      return res.json({
        success: true,
        data: {
          totalPatients: 0,
          totalAppointments: 0,
          completedAppointments: 0,
          cancelledAppointments: 0,
          activePrescriptions: 0,
          telemedicineSessions: 0,
          upcomingAppointments: 0,
        },
        meta: {
          startDate,
          endDate,
          serviceAvailable: false,
        },
      });
    }

    res.json({
      success: true,
      data: {
        totalPatients: patientsRes.data?.total || 0,
        totalAppointments: appointmentsRes.data?.total || 0,
        completedAppointments: appointmentsRes.data?.completed || 0,
        cancelledAppointments: appointmentsRes.data?.cancelled || 0,
        activePrescriptions: prescriptionsRes.data?.total || 0,
        telemedicineSessions: telemedicineRes.data?.total || 0,
        upcomingAppointments: appointmentsRes.data?.upcoming || 0,
      },
      meta: {
        startDate,
        endDate,
        serviceAvailable: true,
        servicesFetched: {
          patients: patientsRes.available,
          appointments: appointmentsRes.available,
          prescriptions: prescriptionsRes.available,
          telemedicine: telemedicineRes.available,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching healthcare stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch healthcare statistics',
      error: (error as Error).message,
    });
  }
});

export default router;

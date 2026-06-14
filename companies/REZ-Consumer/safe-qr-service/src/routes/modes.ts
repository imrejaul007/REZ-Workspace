import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { SafeQR } from '../shared/models';
import { generateShortcodeSuffix, generateQRId } from '../shared/services/qrParser';
import { SafeQRMode } from '../shared/schemas/safeQR';

// Mode-specific services
import * as petService from '../modes/pet/petService';
import * as personalService from '../modes/personal/personalService';
import * as deviceService from '../modes/device/deviceService';
import * as medicalService from '../modes/medical/medicalService';
import * as helmetService from '../modes/helmet/helmetService';
import * as childService from '../modes/child/childService';
import * as vehicleService from '../modes/vehicle/vehicleService';
import * as bicycleService from '../modes/bicycle/bicycleService';
import * as keyService from '../modes/key/keyService';
import * as luggageService from '../modes/luggage/luggageService';
import * as homeService from '../modes/home/homeService';
import * as officeService from '../modes/office/officeService';
import * as eventService from '../modes/event/eventService';
import * as studentService from '../modes/student/studentService';
import * as packageService from '../modes/package/packageService';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * Mode-specific create handlers
 */
const createHandlers: Record<string, unknown> = {
 pet: petService.createPetQR,
 personal: personalService.createPersonalQR,
 device: deviceService.createDeviceQR,
 medical: medicalService.createMedicalQR,
 helmet: helmetService.createHelmetQR,
 child: childService.createChildQR,
 vehicle: vehicleService.createVehicleQR,
 bicycle: bicycleService.createBicycleQR,
 key: keyService.createKeyQR,
 luggage: luggageService.createLuggageQR,
 home: homeService.createHomeQR,
 office: officeService.createOfficeQR,
 event: eventService.createEventQR,
 student: studentService.createStudentQR,
 package: packageService.createPackageQR,
};

/**
 * GET /api/modes/:shortcode/public
 * Get public profile for unknown mode
 */
router.get(
 '/:shortcode/public',
 asyncHandler(async (req: Request, res: Response) => {
   const { shortcode } = req.params;
   const normalizedShortcode = shortcode.toUpperCase();

   const qr = await SafeQR.findByShortcode(normalizedShortcode);
   if (!qr) {
     throw createError('QR not found', 404, 'NOT_FOUND');
   }

   let profile: unknown = null;

   switch (qr.mode) {
     case 'pet':
       profile = await petService.getPublicPetProfile(normalizedShortcode);
       break;
     case 'personal':
       profile = await personalService.getPublicPersonalProfile(normalizedShortcode);
       break;
     case 'device':
       profile = await deviceService.getPublicDeviceProfile(normalizedShortcode);
       break;
     case 'medical':
       profile = await medicalService.getPublicMedicalInfo(normalizedShortcode);
       break;
     case 'helmet':
       profile = await helmetService.getPublicHelmetInfo(normalizedShortcode);
       break;
     case 'child':
       profile = await childService.getPublicChildInfo(normalizedShortcode);
       break;
     case 'vehicle':
       profile = await vehicleService.getPublicVehicleInfo(normalizedShortcode);
       break;
     case 'bicycle':
       profile = await bicycleService.getPublicBicycleProfile(normalizedShortcode);
       break;
     case 'key':
       profile = await keyService.getPublicKeyProfile(normalizedShortcode);
       break;
     case 'luggage':
       profile = await luggageService.getPublicLuggageProfile(normalizedShortcode);
       break;
     case 'home':
       profile = await homeService.getPublicHomeProfile(normalizedShortcode);
       break;
     case 'office':
       profile = await officeService.getPublicOfficeProfile(normalizedShortcode);
       break;
     case 'event':
       profile = await eventService.getPublicEventProfile(normalizedShortcode);
       break;
     case 'student':
       profile = await studentService.getPublicStudentProfile(normalizedShortcode);
       break;
     case 'package':
       profile = await packageService.getPublicPackageProfile(normalizedShortcode);
       break;
     default:
       profile = null;
   }

   res.json({
     success: true,
     data: profile,
   });
 })
);

/**
 * GET /api/modes/:shortcode/full
 * Get full profile for unknown mode (owner only)
 */
router.get(
 '/:shortcode/full',
 asyncHandler(async (req: Request, res: Response) => {
   const { shortcode } = req.params;
   const normalizedShortcode = shortcode.toUpperCase();

   const qr = await SafeQR.findByShortcode(normalizedShortcode);
   if (!qr) {
     throw createError('QR not found', 404, 'NOT_FOUND');
   }

   if (qr.ownerId !== req.userId) {
     throw createError('Access denied', 403, 'FORBIDDEN');
   }

   let profile: unknown = null;

   switch (qr.mode) {
     case 'pet':
       profile = await petService.getFullPetProfile(normalizedShortcode, req.userId!);
       break;
     case 'personal':
       profile = await personalService.getFullPersonalProfile(normalizedShortcode, req.userId!);
       break;
     case 'device':
       profile = await deviceService.getFullDeviceProfile(normalizedShortcode, req.userId!);
       break;
     case 'medical':
       profile = await medicalService.getFullMedicalProfile(normalizedShortcode, req.userId!);
       break;
     case 'helmet':
       profile = await helmetService.getFullHelmetProfile(normalizedShortcode, req.userId!);
       break;
     case 'child':
       profile = await childService.getFullChildProfile(normalizedShortcode, req.userId!);
       break;
     case 'vehicle':
       profile = await vehicleService.getFullVehicleProfile(normalizedShortcode, req.userId!);
       break;
     case 'bicycle':
       profile = await bicycleService.getFullBicycleProfile(normalizedShortcode, req.userId!);
       break;
     case 'key':
       profile = await keyService.getFullKeyProfile(normalizedShortcode, req.userId!);
       break;
     case 'luggage':
       profile = await luggageService.getFullLuggageProfile(normalizedShortcode, req.userId!);
       break;
     case 'home':
       profile = await homeService.getFullHomeProfile(normalizedShortcode, req.userId!);
       break;
     case 'office':
       profile = await officeService.getFullOfficeProfile(normalizedShortcode, req.userId!);
       break;
     case 'event':
       profile = await eventService.getFullEventProfile(normalizedShortcode, req.userId!);
       break;
     case 'student':
       profile = await studentService.getFullStudentProfile(normalizedShortcode, req.userId!);
       break;
     case 'package':
       profile = await packageService.getFullPackageProfile(normalizedShortcode, req.userId!);
       break;
     default:
       profile = null;
   }

   res.json({
     success: true,
     data: profile,
   });
 })
);

/**
 * PUT /api/modes/:shortcode/profile
 * Update profile for unknown mode
 */
router.put(
 '/:shortcode/profile',
 asyncHandler(async (req: Request, res: Response) => {
   const { shortcode } = req.params;
   const { profile } = req.body;
   const normalizedShortcode = shortcode.toUpperCase();

   const qr = await SafeQR.findByShortcode(normalizedShortcode);
   if (!qr) {
     throw createError('QR not found', 404, 'NOT_FOUND');
   }

   if (qr.ownerId !== req.userId) {
     throw createError('Access denied', 403, 'FORBIDDEN');
   }

   let updated: unknown = null;

   switch (qr.mode) {
     case 'pet':
       updated = await petService.updatePetProfile(normalizedShortcode, req.userId!, profile);
       break;
     case 'personal':
       updated = await personalService.updatePersonalProfile(normalizedShortcode, req.userId!, profile);
       break;
     case 'device':
       updated = await deviceService.updateDeviceProfile(normalizedShortcode, req.userId!, profile);
       break;
     case 'medical':
       updated = await medicalService.updateMedicalProfile(normalizedShortcode, req.userId!, profile);
       break;
     case 'helmet':
       updated = await helmetService.updateHelmetProfile(normalizedShortcode, req.userId!, profile);
       break;
     case 'child':
       updated = await childService.updateChildProfile(normalizedShortcode, req.userId!, profile);
       break;
     case 'vehicle':
       updated = await vehicleService.updateVehicleProfile(normalizedShortcode, req.userId!, profile);
       break;
     case 'bicycle':
       updated = await bicycleService.updateBicycleProfile(normalizedShortcode, req.userId!, profile);
       break;
     case 'key':
       updated = await keyService.updateKeyProfile(normalizedShortcode, req.userId!, profile);
       break;
     case 'luggage':
       updated = await luggageService.updateLuggageProfile(normalizedShortcode, req.userId!, profile);
       break;
     case 'home':
       updated = await homeService.updateHomeProfile(normalizedShortcode, req.userId!, profile);
       break;
     case 'office':
       updated = await officeService.updateOfficeProfile(normalizedShortcode, req.userId!, profile);
       break;
     case 'event':
       updated = await eventService.updateEventProfile(normalizedShortcode, req.userId!, profile);
       break;
     case 'student':
       updated = await studentService.updateStudentProfile(normalizedShortcode, req.userId!, profile);
       break;
     case 'package':
       updated = await packageService.updatePackageProfile(normalizedShortcode, req.userId!, profile);
       break;
   }

   if (!updated) {
     throw createError('Update failed', 500, 'UPDATE_FAILED');
   }

   res.json({
     success: true,
     data: { shortcode: qr.shortcode, updated: true },
   });
 })
);

/**
 * GET /api/modes/modes
 * Get all available modes
 */
router.get(
 '/modes',
 asyncHandler(async (req: Request, res: Response) => {
   const modes = [
     { mode: 'pet', name: 'Pet Safe QR', description: 'Lost pet recovery', icon: '' },
     { mode: 'personal', name: 'Personal Safe QR', description: 'Contact sharing', icon: '' },
     { mode: 'device', name: 'Device Safe QR', description: 'Device recovery', icon: '' },
     { mode: 'medical', name: 'Medical Safe QR', description: 'Emergency medical info', icon: '' },
     { mode: 'helmet', name: 'Helmet Safe QR', description: 'Rider safety', icon: '' },
     { mode: 'child', name: 'Child Safe QR', description: 'Child safety', icon: '' },
     { mode: 'vehicle', name: 'Vehicle Safe QR', description: 'Vehicle alerts', icon: '' },
     { mode: 'bicycle', name: 'Bicycle Safe QR', description: 'Bicycle recovery', icon: '' },
     { mode: 'key', name: 'Key Safe QR', description: 'Key recovery', icon: '' },
     { mode: 'luggage', name: 'Luggage Safe QR', description: 'Travel recovery', icon: '' },
     { mode: 'home', name: 'Home Safe QR', description: 'Home access', icon: '' },
     { mode: 'office', name: 'Office Safe QR', description: 'Office access', icon: '' },
     { mode: 'event', name: 'Event Safe QR', description: 'Event coordination', icon: '' },
     { mode: 'student', name: 'Student Safe QR', description: 'School safety', icon: '' },
     { mode: 'package', name: 'Package Safe QR', description: 'Package tracking', icon: '' },
   ];

   res.json({
     success: true,
     data: modes,
   });
 })
);

export default router;

/**
 * Digital Twins Routes - Healthcare Twins
 */

import { Router } from 'express';

export const digitalTwinsRoutes = Router();

digitalTwinsRoutes.get('/', (req, res) => {
  res.json({
    twins: [
      { id: 'health-patient-twin', name: 'Patient Twin', type: 'patient', status: 'active', health: 98 },
      { id: 'health-appointment-twin', name: 'Appointment Twin', type: 'appointment', status: 'active', health: 99 },
      { id: 'health-doctor-twin', name: 'Doctor Twin', type: 'doctor', status: 'active', health: 100 },
      { id: 'health-inventory-twin', name: 'Medical Inventory Twin', type: 'inventory', status: 'active', health: 95 },
      { id: 'health-billing-twin', name: 'Billing Twin', type: 'billing', status: 'active', health: 97 },
      { id: 'health-bed-twin', name: 'Bed Management Twin', type: 'bed', status: 'active', health: 96 },
      { id: 'health-insurance-twin', name: 'Insurance Twin', type: 'insurance', status: 'active', health: 94 }
    ],
    total: 7
  });
});

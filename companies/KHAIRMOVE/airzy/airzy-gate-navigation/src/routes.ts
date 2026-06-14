/**
 * Gate Navigation Routes
 * API endpoints for airport navigation
 */

import { Router, Request, Response } from 'express';
import { generateRoute, getNearestFacilities, navigateToNearestFacility } from './navigationService';
import { searchGatesByFlight, getAirport, getGate, AIRPORTS } from './airportData';
import { GateStatus } from './types';

const router = Router();

/**
 * Health check
 */
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'airzy-gate-navigation',
    timestamp: new Date().toISOString()
  });
});

/**
 * Get supported airports
 */
router.get('/airports', (_req: Request, res: Response) => {
  const airports = Object.values(AIRPORTS).map(a => ({
    code: a.code,
    name: a.name,
    city: a.city,
    gates: a.gates.length,
    terminals: a.terminals.length,
  }));
  res.json({ airports });
});

/**
 * Get airport details
 */
router.get('/airports/:code', (req: Request, res: Response) => {
  const { code } = req.params;
  const airport = getAirport(code.toUpperCase());

  if (!airport) {
    return res.status(404).json({ error: 'Airport not found' });
  }

  res.json({ airport });
});

/**
 * Get gates for an airport
 */
router.get('/airports/:code/gates', (req: Request, res: Response) => {
  const { code } = req.params;
  const airport = getAirport(code.toUpperCase());

  if (!airport) {
    return res.status(404).json({ error: 'Airport not found' });
  }

  res.json({ gates: airport.gates });
});

/**
 * Get specific gate details
 */
router.get('/airports/:code/gates/:gateId', (req: Request, res: Response) => {
  const { code, gateId } = req.params;
  const airport = getAirport(code.toUpperCase());

  if (!airport) {
    return res.status(404).json({ error: 'Airport not found' });
  }

  const fullGateId = `${code.toUpperCase()}-${gateId.toUpperCase()}`;
  const gate = airport.gates.find(g => g.id === fullGateId);

  if (!gate) {
    return res.status(404).json({ error: 'Gate not found' });
  }

  // Get gate status (mock)
  const gateStatus: GateStatus = {
    gateId: gate.id,
    status: 'on-time',
    currentTime: new Date().toISOString(),
  };

  // Get nearest facilities
  const nearestFacilities = getNearestFacilities(code.toUpperCase(), gateId.toUpperCase());

  res.json({
    gate,
    status: gateStatus,
    nearestFacilities,
  });
});

/**
 * Navigate from one gate to another
 */
router.post('/navigate', (req: Request, res: Response) => {
  const { airportCode, fromGate, toGate } = req.body;

  if (!airportCode || !fromGate || !toGate) {
    return res.status(400).json({ error: 'Missing required fields: airportCode, fromGate, toGate' });
  }

  try {
    const route = generateRoute(
      airportCode.toUpperCase(),
      fromGate.toUpperCase(),
      toGate.toUpperCase()
    );

    res.json({ route });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

/**
 * Navigate to nearest facility type
 */
router.get('/navigate/:airportCode/:gateId/:facilityType', (req: Request, res: Response) => {
  const { airportCode, gateId, facilityType } = req.params;

  const result = navigateToNearestFacility(
    airportCode.toUpperCase(),
    gateId.toUpperCase(),
    facilityType as any
  );

  if (!result) {
    return res.status(404).json({ error: `No ${facilityType} found near gate ${gateId}` });
  }

  res.json({
    facility: result.facility,
    route: result.route,
  });
});

/**
 * Get nearest facilities for a gate
 */
router.get('/nearest/:airportCode/:gateId', (req: Request, res: Response) => {
  const { airportCode, gateId } = req.params;

  const airport = getAirport(airportCode.toUpperCase());
  if (!airport) {
    return res.status(404).json({ error: 'Airport not found' });
  }

  const nearestFacilities = getNearestFacilities(airportCode.toUpperCase(), gateId.toUpperCase());

  res.json({ nearestFacilities });
});

/**
 * Search gate by flight number
 */
router.get('/search/flight/:flightNumber', (req: Request, res: Response) => {
  const { flightNumber } = req.params;

  const result = searchGatesByFlight(flightNumber);

  if (!result) {
    return res.status(404).json({ error: 'Flight not found' });
  }

  res.json({ result });
});

/**
 * Get walking time estimate between gates
 */
router.get('/walking-time/:airportCode/:fromGate/:toGate', (req: Request, res: Response) => {
  const { airportCode, fromGate, toGate } = req.params;

  try {
    const route = generateRoute(
      airportCode.toUpperCase(),
      fromGate.toUpperCase(),
      toGate.toUpperCase()
    );

    res.json({
      fromGate,
      toGate,
      walkingTimeMinutes: route.estimatedTime,
      distanceMeters: route.distance,
    });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

export default router;
